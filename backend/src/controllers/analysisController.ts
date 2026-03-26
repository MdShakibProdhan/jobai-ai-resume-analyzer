import { Request, Response } from 'express';
import {
  analyzeResumeAgainstJob,
  generateImprovedCV as aiGenerateCV,
} from '../services/aiService';
import { jobStore, resumeStore, analysisStore, saveData } from '../store';
import { generateATSReportDocx } from '../reportService';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { resumeId, jobId } = req.body;

    const resume = resumeStore[resumeId];
    const job = jobStore[jobId];

    if (!resume) return res.status(404).json({ message: 'Resume not found. Please re-upload your resume.' });
    if (!job) return res.status(404).json({ message: 'Job not found. Please re-add your job post.' });

    // Return cached analysis if same resume+job pair was already analyzed
    const existing = Object.values(analysisStore).find(
      (a: any) => a.resumeId === resumeId && a.jobId === jobId
    );
    if (existing) return res.status(200).json(existing);

const result = await analyzeResumeAgainstJob(
  resume.text,
  job.description,
  job.skills || []
);
console.log('AI RESULT:', JSON.stringify(result, null, 2));

    const analysis = {
      id: crypto.randomUUID(),
      userId: (req as any).user?.id,
      resumeId,
      jobId,
      fitScore: result.fitScore || 0,
      atsScore: result.atsScore || 0,
      categoryScores: result.categoryScores || {},
      skillMatch: result.skillMatch || { matched: [], missing: [] },
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      criticalGaps: result.criticalGaps || [],
      suggestions: result.suggestions || [],
      atsFormattingPositives: result.atsFormattingPositives || [],
      atsFormattingProblems: result.atsFormattingProblems || [],
      stepByStepGuide: result.stepByStepGuide || [],
      projectedScores: result.projectedScores || null,
      coverLetter: result.coverLetter || '',
      submissionChecklist: result.submissionChecklist || [],
      overallSummary: result.overallSummary || '',
      createdAt: new Date().toISOString(),
    };

    analysisStore[analysis.id] = analysis;
    saveData();

    res.status(201).json(analysis);
  } catch (err: any) {
    console.error('analyzeResume error:', err);
    res.status(500).json({ message: 'Analysis failed: ' + err.message });
  }
};

export const getAnalysis = async (req: Request, res: Response) => {
  try {
    const analysis = analysisStore[req.params.id];
    if (!analysis) return res.status(404).json({ message: 'Analysis not found' });
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to get analysis', error: err.message });
  }
};

export const generateImprovedCV = async (req: Request, res: Response) => {
  try {
    const analysis = analysisStore[req.params.id];
    if (!analysis) return res.status(404).json({ message: 'Analysis not found' });

    const resume = resumeStore[analysis.resumeId];
    const job = jobStore[analysis.jobId];

    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const improvedText = await aiGenerateCV(
      resume.text,
      job.description,
      analysis.skillMatch?.missing || [],
      {
        criticalGaps: analysis.criticalGaps || [],
        formattingProblems: analysis.atsFormattingProblems || [],
        strengths: analysis.strengths || [],
        stepByStepGuide: (analysis.stepByStepGuide || []).map((s: any) => ({
          title: s.title,
          items: s.items || [],
        })),
      }
    );

    res.json({ improvedCV: improvedText });
  } catch (err: any) {
    console.error('generateImprovedCV error:', err);
    res.status(500).json({ message: 'CV generation failed: ' + err.message });
  }
};

export const downloadReport = async (req: Request, res: Response) => {
  try {
    const analysis = analysisStore[req.params.id];
    if (!analysis) return res.status(404).json({ message: 'Analysis not found' });

    const resume = resumeStore[analysis.resumeId];
    const job = jobStore[analysis.jobId];

    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const candidateName = resume.filename?.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ') || 'Candidate';

    const buffer = await generateATSReportDocx(
      analysis,
      candidateName,
      job.title || 'Position',
      job.company || 'Company'
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="ATS_Report_${req.params.id}.docx"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('downloadReport error:', err);
    res.status(500).json({ message: 'Report generation failed: ' + err.message });
  }
};