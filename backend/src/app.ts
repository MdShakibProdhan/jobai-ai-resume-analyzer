import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { jobRouter } from './routes/jobs';
import { resumeRouter } from './routes/resume';
import { analysisRouter } from './routes/analysis';
import { interviewRouter } from './routes/interview';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app = express();

// Security
app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  // Netlify deploy previews & production
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Netlify functions)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o!))) return callback(null, true);
    // Allow any netlify.app subdomain
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    callback(null, true); // permissive for now
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Logging & parsing
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiKeyLoaded: !!process.env.GEMINI_API_KEY,
  });
});
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/interview', interviewRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
