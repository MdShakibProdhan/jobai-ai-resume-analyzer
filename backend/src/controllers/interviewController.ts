import { Request, Response } from 'express';
import {
  generateInterviewQuestions,
  evaluateAnswer,
  InterviewQuestion,
  AnswerEvaluation,
} from '../services/aiService';
import { sessionStore, analysisStore, resumeStore, jobStore, saveData } from '../store';

interface AnswerRecord {
  questionId: string;
  question: string;
  answer: string;
  evaluation: AnswerEvaluation;
  answeredAt: string;
}

export const startSession = async (req: Request, res: Response) => {
  try {
    const { analysisId, questionCount } = req.body;

    const analysis = analysisStore[analysisId];
    if (!analysis) return res.status(404).json({ message: 'Analysis not found' });

    const job = jobStore[analysis.jobId];
    const resume = resumeStore[analysis.resumeId];

    const questions = await generateInterviewQuestions(
      job.description,
      resume.text,
      questionCount
    );

    const session = {
      id: crypto.randomUUID(),
      userId: (req as any).user?.id,
      analysisId,
      jobTitle: job.title,
      company: job.company,
      questions,
      answers: [] as AnswerRecord[],
      currentQuestionIndex: 0,
      status: 'active' as 'active' | 'completed',
      startedAt: new Date().toISOString(),
      endedAt: null as string | null,
      finalScore: null as number | null,
    };

    sessionStore[session.id] = session;
    saveData();
    res.status(201).json({
      id: session.id,
      jobTitle: session.jobTitle,
      company: session.company,
      totalQuestions: questions.length,
      currentQuestion: questions[0],
      status: session.status,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start session', error: err });
  }
};

export const getSession = async (req: Request, res: Response) => {
  const session = sessionStore[req.params.id];
  if (!session) return res.status(404).json({ message: 'Session not found' });

  const { questions, answers, currentQuestionIndex, status } = session;
  const currentQuestion = status === 'active' ? questions[currentQuestionIndex] : null;

  res.json({
    id: session.id,
    jobTitle: session.jobTitle,
    company: session.company,
    totalQuestions: questions.length,
    currentQuestionIndex,
    currentQuestion,
    answeredCount: answers.length,
    status,
    finalScore: session.finalScore,
    answers: status === 'completed' ? answers : [],
  });
};

export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const session = sessionStore[req.params.id];
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status !== 'active') return res.status(400).json({ message: 'Session already ended' });

    const { answer } = req.body;
    const job = jobStore[analysisStore[session.analysisId]?.jobId];
    const currentQ: InterviewQuestion = session.questions[session.currentQuestionIndex];

    const evaluation = await evaluateAnswer(
      currentQ.question,
      answer,
      job?.description || ''
    );

    session.answers.push({
      questionId: currentQ.id,
      question: currentQ.question,
      answer,
      evaluation,
      answeredAt: new Date().toISOString(),
    });

    session.currentQuestionIndex += 1;
    saveData();
    const isLastQuestion = session.currentQuestionIndex >= session.questions.length;

    const response: any = {
      evaluation,
      isLastQuestion,
    };

    if (!isLastQuestion) {
      response.nextQuestion = session.questions[session.currentQuestionIndex];
      response.progress = {
        answered: session.answers.length,
        total: session.questions.length,
      };
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit answer', error: err });
  }
};

export const endSession = async (req: Request, res: Response) => {
  const session = sessionStore[req.params.id];
  if (!session) return res.status(404).json({ message: 'Session not found' });

  session.status = 'completed';
  session.endedAt = new Date().toISOString();

  // Calculate final score as average of all answer scores
  const scores = session.answers.map((a: AnswerRecord) => a.evaluation.score);
  session.finalScore = scores.length
    ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length * 10)
    : 0;

  saveData();
  res.json({
    id: session.id,
    finalScore: session.finalScore,
    totalQuestions: session.questions.length,
    answeredCount: session.answers.length,
    answers: session.answers,
    duration: session.endedAt
      ? Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
      : 0,
  });
};
