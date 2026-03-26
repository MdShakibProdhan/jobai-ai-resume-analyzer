import { Router } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  deleteJob,
  scrapeJobUrl,
} from '../controllers/jobController';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validateBody';
import { z } from 'zod';

export const jobRouter = Router();

jobRouter.use(authenticate);

const createJobSchema = z.object({
  title: z.string().min(2),
  company: z.string().min(1),
  description: z.string().min(50),
  location: z.string().optional(),
  url: z.string().url().optional(),
});

const scrapeSchema = z.object({
  url: z.string().url(),
});

jobRouter.get('/', getJobs);
jobRouter.get('/:id', getJobById);
jobRouter.post('/', validateBody(createJobSchema), createJob);
jobRouter.delete('/:id', deleteJob);
jobRouter.post('/scrape', validateBody(scrapeSchema), scrapeJobUrl);
