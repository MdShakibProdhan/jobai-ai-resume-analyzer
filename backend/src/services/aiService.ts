import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Fallback model order: try primary, then fallbacks
const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

const getModel = (modelName: string, temp = 0.1) => genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    temperature: temp,
    topP: 0.8,
    topK: 10,
  } as any,
});

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Retry with exponential backoff + model fallback
const callWithRetry = async (prompt: string, temp: number, maxRetries = 3): Promise<string> => {
  for (const modelName of MODELS) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const model = getModel(modelName, temp);
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err: any) {
        const status = err?.status || err?.response?.status || 0;
        const msg = err?.message || '';
        const isRetryable = status === 503 || status === 429 || msg.includes('503') || msg.includes('429') || msg.includes('high demand') || msg.includes('overloaded');

        if (isRetryable && attempt < maxRetries - 1) {
          console.warn(`Gemini ${modelName} attempt ${attempt + 1} failed (${status}), retrying in ${(attempt + 1) * 2}s...`);
          await sleep((attempt + 1) * 2000);
          continue;
        }
        if (isRetryable) {
          console.warn(`Gemini ${modelName} exhausted retries, trying next model...`);
          break; // try next model
        }
        throw err; // non-retryable error
      }
    }
  }
  throw new Error('All Gemini models are currently unavailable. Please try again in a few minutes.');
};

export const askGemini = async (prompt: string, temp = 0.1): Promise<any> => {
  const text = await callWithRetry(prompt, temp);
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return cleaned;
  }
};

const askGeminiText = async (prompt: string): Promise<string> => {
  return callWithRetry(prompt, 0.2);
};

export interface ExtractedJobData {
  skills: string[];
  requirements: string[];
  seniority: string;
  jobType: string;
  keyResponsibilities: string[];
}

export interface CategoryDetail {
  score: number;
  matched: number;
  total: number;
  matchedItems: string[];
  missingItems: string[];
  tip: string;
}

export interface AnalysisResult {
  fitScore: number;
  atsScore: number;
  categoryScores: {
    technicalSkills: CategoryDetail;
    keywordOptimization: CategoryDetail;
    atsFormatting: CategoryDetail;
    experienceRelevance: CategoryDetail;
    languageRequirements: CategoryDetail;
  };
  skillMatch: { matched: string[]; missing: string[] };
  strengths: string[];
  weaknesses: string[];
  criticalGaps: string[];
  suggestions: string[];
  atsFormattingPositives: string[];
  atsFormattingProblems: string[];
  stepByStepGuide: { step: number; title: string; description: string; items: string[] }[];
  projectedScores: { atsScore: number; fitScore: number; note: string } | null;
  coverLetter: string;
  submissionChecklist: string[];
  overallSummary: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'behavioural' | 'technical' | 'situational';
  hint?: string;
}

export interface AnswerEvaluation {
  score: number; // 0–10
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export const extractJobDataFromText = async (text: string): Promise<ExtractedJobData> => {
  const prompt = `You are a job analysis expert. Extract structured data from this job description.
Return ONLY valid JSON, no markdown, no explanation.

Format:
{
  "skills": ["array of required technical and soft skills"],
  "requirements": ["array of must-have requirements"],
  "seniority": "junior or mid or senior or lead or executive",
  "jobType": "full-time or part-time or contract or freelance",
  "keyResponsibilities": ["top 5 responsibilities"]
}

Job description:
${text.slice(0, 4000)}`;

  return await askGemini(prompt) as ExtractedJobData;
};

export const analyzeResumeAgainstJob = async (
  resumeText: string,
  jobDescription: string,
  jobSkills: string[]
): Promise<AnalysisResult> => {
const prompt = `You are a professional ATS (Applicant Tracking System) analyst. Your job is to produce accurate, reproducible scores by following the rubric below exactly.

━━━ SCORING METHODOLOGY ━━━

Work through each category step-by-step BEFORE assigning a score. Count explicit evidence only — never assume or infer skills that are not written in the resume.

■ TECHNICAL SKILLS MATCH (weight 30%)
  1. List every required skill from the job post.
  2. For each, check if the resume explicitly mentions it (exact term or a widely-accepted synonym).
  3. Score = (matched / total required) × 100. If partial (mentioned but not demonstrated), count as 0.5.

■ KEYWORD OPTIMIZATION (weight 25%)
  1. Extract the top 20 important keywords/phrases from the job post (tools, methodologies, certifications, domain terms).
  2. Count how many appear verbatim (or as a direct synonym) in the resume.
  3. Score = (found / 20) × 100.

■ ATS FORMATTING (weight 15%)
  Check for these items (each worth equal points):
  - Standard section headers (Education, Experience, Skills, etc.)
  - No tables, columns, images, or graphics
  - Consistent date format
  - No headers/footers with critical info
  - Bullet points (not paragraphs) for experience
  - Standard fonts implied (no special characters except bullets)
  - Contact info at the top
  - File appears to be parsed cleanly (text is readable, not garbled)
  Score = (items passing / 8) × 100.

■ EXPERIENCE RELEVANCE (weight 20%)
  1. Identify the required years/level of experience from the job post.
  2. Check if candidate's roles, industries, and responsibilities align.
  3. 90-100: direct match in role + industry + seniority
     70-89: same role different industry OR same industry different role
     45-69: transferable experience, partial overlap
     20-44: minimal relevance
     0-19: no relevant experience

■ LANGUAGE REQUIREMENTS (weight 10%)
  1. Check if the job requires specific language proficiency.
  2. Check if the resume states matching language skills.
  3. If job has no language requirement, default to 80.
  Score: 100 if fully met, 60 if partially met, 20 if not met, 80 if not required.

■ FINAL SCORES
  atsScore = weighted average of all 5 categories (round to nearest integer).
  fitScore = how well the candidate's overall profile (experience + skills + career trajectory) fits this specific role. Use the same evidence-based approach: count alignment points and convert to 0-100.

━━━ RULES ━━━
- Only credit skills/experience explicitly stated in the resume. Never infer or assume.
- Be strict: a 72% should mean genuinely good but with clear gaps. Do NOT inflate scores.
- If the resume is short or vague, that should lower scores — lack of evidence = low score.
- Reference specific skills, job titles, company names, and requirements from the actual inputs in your explanations.
- Do not invent experience or skills the candidate does not have.

━━━ OUTPUT ━━━
Return ONLY valid JSON, no markdown, no explanation outside the JSON.

{
  "fitScore": <number 0-100>,
  "atsScore": <number 0-100>,
  "categoryScores": {
    "technicalSkills": {
      "score": <number 0-100>,
      "matched": <number of skills found in resume>,
      "total": <total required skills from JD>,
      "matchedItems": ["Python", "React", "...each skill found in resume"],
      "missingItems": ["Kubernetes", "...each required skill NOT in resume"],
      "tip": "One specific, actionable sentence to improve this category"
    },
    "keywordOptimization": {
      "score": <number 0-100>,
      "matched": <keywords found>,
      "total": 20,
      "matchedItems": ["keyword found in resume — JD mentions Nx"],
      "missingItems": ["keyword missing — JD mentions Nx"],
      "tip": "One specific actionable tip"
    },
    "atsFormatting": {
      "score": <number 0-100>,
      "matched": <checks passed>,
      "total": 8,
      "matchedItems": ["Standard section headers", "...each check that passed"],
      "missingItems": ["Consistent date format — mixed MM/YYYY and Month YYYY", "...each check that failed with detail"],
      "tip": "One specific actionable tip"
    },
    "experienceRelevance": {
      "score": <number 0-100>,
      "matched": <number of relevant roles/experiences>,
      "total": <total roles/experiences in resume>,
      "matchedItems": ["Role at Company — directly relevant because..."],
      "missingItems": ["JD requires 5+ years, resume shows ~3 years", "...specific experience gaps"],
      "tip": "One specific actionable tip"
    },
    "languageRequirements": {
      "score": <number 0-100>,
      "matched": <languages matched>,
      "total": <languages required, or 1 if none required>,
      "matchedItems": ["English — proficient"],
      "missingItems": ["German — required but not listed"],
      "tip": "One specific actionable tip"
    }
  },
  "skillMatch": {
    "matched": ["skill — brief reason it matches"],
    "missing": ["skill — why it matters for this role"]
  },
  "strengths": ["strength with specific evidence from resume (minimum 5)"],
  "criticalGaps": ["gap with specific explanation referencing job requirements (minimum 5)"],
  "atsFormattingPositives": ["what the resume does well for ATS parsing"],
  "atsFormattingProblems": ["specific ATS formatting issues found"],
  "stepByStepGuide": [
    { "step": 1, "title": "Title", "description": "Actionable advice referencing specific gaps", "items": ["concrete action 1", "concrete action 2", "concrete action 3"] },
    { "step": 2, "title": "Title", "description": "Actionable advice", "items": ["action 1", "action 2"] },
    { "step": 3, "title": "Title", "description": "Actionable advice", "items": ["action 1", "action 2"] },
    { "step": 4, "title": "Title", "description": "Actionable advice", "items": ["action 1", "action 2"] },
    { "step": 5, "title": "Title", "description": "Actionable advice", "items": ["action 1", "action 2"] }
  ],
  "projectedScores": {
    "atsScore": <realistic projected ATS score if all steps followed, 0-100>,
    "fitScore": <realistic projected fit score if all steps followed, 0-100>,
    "note": "What the remaining gap represents"
  },
  "coverLetter": "Full personalized cover letter (3-4 paragraphs) tailored to this specific role and candidate background. Professional tone, reference specific achievements from resume and requirements from job post.",
  "submissionChecklist": ["actionable checklist item 1", "item 2", "item 3", "item 4", "item 5", "item 6"],
  "overallSummary": "2-3 sentence honest summary of fit, mentioning the strongest match point and the biggest gap"
}

━━━ INPUTS ━━━

RESUME:
${resumeText.slice(0, 6000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 4000)}

REQUIRED SKILLS FROM JOB: ${jobSkills.join(', ')}`;

  return await askGemini(prompt, 0) as AnalysisResult;
};

export interface ImprovedCV {
  name: string;
  title: string;
  contact: string;
  links: string;
  summary: string;
  skills: { category: string; items: string }[];
  experience: {
    role: string;
    company: string;
    location: string;
    dates: string;
    bullets: string[];
  }[];
  projects: {
    name: string;
    subtitle: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    location: string;
    dates: string;
    bullets: string[];
  }[];
  additional: { label: string; text: string }[];
}

export const generateImprovedCV = async (
  resumeText: string,
  jobDescription: string,
  missingSkills: string[],
  atsFeedback?: {
    criticalGaps?: string[];
    formattingProblems?: string[];
    strengths?: string[];
    stepByStepGuide?: { title: string; items: string[] }[];
  }
): Promise<ImprovedCV> => {
  const feedbackBlock = atsFeedback ? `
━━━ ATS ANALYSIS FEEDBACK TO APPLY ━━━
You MUST apply the following ATS analysis findings when rewriting the CV:

CRITICAL GAPS TO ADDRESS (weave these into existing bullet points where the candidate has relevant experience):
${(atsFeedback.criticalGaps || []).map(g => `- ${g}`).join('\n')}

FORMATTING PROBLEMS TO FIX:
${(atsFeedback.formattingProblems || []).map(p => `- ${p}`).join('\n')}

STRENGTHS TO KEEP AND EMPHASIZE:
${(atsFeedback.strengths || []).map(s => `- ${s}`).join('\n')}

STEP-BY-STEP IMPROVEMENTS TO APPLY:
${(atsFeedback.stepByStepGuide || []).map(s => `${s.title}:\n${s.items.map(i => `  - ${i}`).join('\n')}`).join('\n')}
` : '';

  const prompt = `You are an expert CV writer. Rewrite this resume to be ATS-optimized and tailored to the job.

RULES:
- Keep ALL facts accurate — do NOT invent experience, companies, dates, or skills the candidate does not have.
- Improve wording: use strong action verbs, add metrics/numbers where the original implies them.
- Weave in relevant keywords from the job description naturally into existing bullet points.
- Use clear ATS-friendly section headers.
- Keep the same structure and sections as the original resume.
- Apply ALL the ATS feedback below — fix every formatting problem, address every critical gap where the candidate has relevant experience, and emphasize existing strengths.
- The output must be structured JSON matching the exact format below.
${feedbackBlock}
Return ONLY valid JSON, no markdown, no explanation.

{
  "name": "Full Name from resume",
  "title": "Professional title tailored to the target job",
  "contact": "email | phone | city, country",
  "links": "linkedin.com/in/... | github.com/...",
  "summary": "3-4 sentence professional summary tailored to the target job. Use keywords from the job description naturally.",
  "skills": [
    { "category": "Frontend", "items": "React, JavaScript (ES6+), TypeScript, ..." },
    { "category": "Backend", "items": "Node.js, Express.js, ..." },
    { "category": "Category Name", "items": "comma separated skills" }
  ],
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "dates": "Mon YYYY - Mon YYYY",
      "bullets": ["Impact-focused bullet with metrics", "Another achievement"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "subtitle": "Brief description or tech stack",
      "bullets": ["What you built/achieved", "Another point"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "location": "City, Country",
      "dates": "Mon YYYY - Mon YYYY or Present",
      "bullets": ["Relevant coursework or achievements"]
    }
  ],
  "additional": [
    { "label": "Languages", "text": "English (Professional), Bengali (Native)" },
    { "label": "Interests", "text": "relevant interests" }
  ]
}

ORIGINAL RESUME:
${resumeText.slice(0, 6000)}

TARGET JOB:
${jobDescription.slice(0, 4000)}

SKILLS TO WEAVE IN (only if candidate has relevant experience): ${missingSkills.join(', ')}`;

  return await askGemini(prompt, 0.1) as ImprovedCV;
};

export const generateInterviewQuestions = async (
  jobDescription: string,
  resumeText: string,
  count: number = 7
): Promise<InterviewQuestion[]> => {
  const prompt = `You are an expert interviewer. Generate ${count} interview questions tailored to this role and candidate.
Return ONLY valid JSON, no markdown, no explanation.

Format:
{
  "questions": [
    {
      "id": "q1",
      "question": "the interview question",
      "type": "behavioural or technical or situational",
      "hint": "what a strong answer should cover"
    }
  ]
}

Mix: ~3 behavioural, ~3 technical, ~1 situational. Make them specific to the role.

JOB: ${jobDescription.slice(0, 1500)}
CANDIDATE: ${resumeText.slice(0, 1500)}`;

  const result = await askGemini(prompt);
  return result.questions || result || [];
};

export const evaluateAnswer = async (
  question: string,
  answer: string,
  jobContext: string
): Promise<AnswerEvaluation> => {
  const prompt = `You are an expert interviewer evaluating a candidate's answer. Be honest but constructive.
Return ONLY valid JSON, no markdown, no explanation.

Format:
{
  "score": <number 0-10>,
  "feedback": "2-3 sentence overall feedback",
  "strengths": ["what was good"],
  "improvements": ["what could be better"]
}

QUESTION: ${question}
ANSWER: ${answer}
JOB CONTEXT: ${jobContext.slice(0, 500)}`;

  return await askGemini(prompt) as AnswerEvaluation;
};
