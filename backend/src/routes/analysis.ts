import { Router } from 'express';
import {
  analyzeResume,
  getAnalysis,
  generateImprovedCV,
  downloadReport,
} from '../controllers/analysisController';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validateBody';
import { z } from 'zod';

export const analysisRouter = Router();

analysisRouter.use(authenticate);

const analyzeSchema = z.object({
  resumeId: z.string().uuid(),
  jobId: z.string().uuid(),
});

analysisRouter.post('/analyze', validateBody(analyzeSchema), analyzeResume);
analysisRouter.get('/:id', getAnalysis);
analysisRouter.post('/:id/improve-cv', generateImprovedCV);
analysisRouter.get('/:id/download-report', downloadReport);
