import { Router } from 'express';
import {
  startSession,
  getSession,
  submitAnswer,
  endSession,
} from '../controllers/interviewController';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validateBody';
import { z } from 'zod';

export const interviewRouter = Router();

interviewRouter.use(authenticate);

const startSchema = z.object({
  analysisId: z.string().uuid(),
  questionCount: z.number().int().min(3).max(15).default(7),
});

const answerSchema = z.object({
  answer: z.string().min(1),
});

interviewRouter.post('/start', validateBody(startSchema), startSession);
interviewRouter.get('/:id', getSession);
interviewRouter.post('/:id/answer', validateBody(answerSchema), submitAnswer);
interviewRouter.post('/:id/end', endSession);
