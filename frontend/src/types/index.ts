export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location?: string;
  url?: string;
  skills: string[];
  requirements: string[];
  seniority?: string;
  createdAt: string;
}

export interface Resume {
  id: string;
  filename: string;
  mimetype: string;
  wordCount: number;
  uploadedAt: string;
  previewText?: string;
}

export interface SkillMatch {
  matched: string[];
  missing: string[];
}

export interface CategoryDetail {
  score: number;
  matched: number;
  total: number;
  matchedItems: string[];
  missingItems: string[];
  tip: string;
}

export interface CategoryScores {
  technicalSkills: CategoryDetail;
  keywordOptimization: CategoryDetail;
  atsFormatting: CategoryDetail;
  experienceRelevance: CategoryDetail;
  languageRequirements: CategoryDetail;
}

export interface StepGuide {
  step: number;
  title: string;
  description: string;
  items: string[];
}

export interface ProjectedScores {
  atsScore: number;
  fitScore: number;
  note: string;
}

export interface Analysis {
  id: string;
  resumeId: string;
  jobId: string;
  fitScore: number;
  atsScore: number;
  categoryScores: CategoryScores;
  skillMatch: SkillMatch;
  strengths: string[];
  criticalGaps: string[];
  atsFormattingPositives: string[];
  atsFormattingProblems: string[];
  stepByStepGuide: StepGuide[];
  projectedScores: ProjectedScores;
  coverLetter: string;
  submissionChecklist: string[];
  overallSummary: string;
  createdAt: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'behavioural' | 'technical' | 'situational';
  hint?: string;
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface AnswerRecord {
  questionId: string;
  question: string;
  answer: string;
  evaluation: AnswerEvaluation;
  answeredAt: string;
}

export interface InterviewSession {
  id: string;
  jobTitle: string;
  company: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  currentQuestion: InterviewQuestion | null;
  answeredCount: number;
  status: 'active' | 'completed';
  finalScore: number | null;
  answers: AnswerRecord[];
}
