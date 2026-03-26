import { Router } from 'express';
import { register, login, googleAuth, getMe, logout } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validateBody';
import { z } from 'zod';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/register', validateBody(registerSchema), register);
authRouter.post('/login', validateBody(loginSchema), login);
authRouter.post('/google', googleAuth);
authRouter.get('/me', authenticate, getMe);
authRouter.post('/logout', authenticate, logout);
