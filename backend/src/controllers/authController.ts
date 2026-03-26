import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { userStore, saveData } from '../store';

const getSecret = () => process.env.JWT_SECRET || 'dev-secret';
const signToken = (userId: string) =>
  jwt.sign({ userId }, getSecret(), { expiresIn: '7d' });

// Google OAuth client — reads GOOGLE_CLIENT_ID at call time so env vars work
const getGoogleClient = () =>
  new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Register (email + password) ──────────────────────────
export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    // Check duplicate
    const existing = Object.values(userStore).find(
      (u: any) => u.email === email
    );
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      password: hashedPassword,
      provider: 'local',
      createdAt: new Date().toISOString(),
    };

    userStore[user.id] = user;
    saveData();

    const token = signToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email, name } });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err });
  }
};

// ── Login (email + password) ─────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = Object.values(userStore).find(
      (u: any) => u.email === email && u.provider === 'local'
    ) as any;

    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
};

// ── Google OAuth ─────────────────────────────────────────
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential required' });

    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const { email, name, sub: googleId } = payload;

    // Find existing user by email or Google ID
    let user = Object.values(userStore).find(
      (u: any) => u.email === email
    ) as any;

    if (!user) {
      // Create new user
      user = {
        id: crypto.randomUUID(),
        email,
        name: name || email.split('@')[0],
        password: null,
        provider: 'google',
        googleId,
        createdAt: new Date().toISOString(),
      };
      userStore[user.id] = user;
      saveData();
    }

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error('Google auth error:', err);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

// ── Get current user ─────────────────────────────────────
export const getMe = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const user = userStore[userId];
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
};

// ── Logout ───────────────────────────────────────────────
export const logout = async (_req: Request, res: Response) => {
  res.json({ message: 'Logged out' });
};
