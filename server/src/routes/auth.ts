import crypto from 'crypto';
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { auth } from '../middleware/auth';
import { validate, registerValidator, loginValidator } from '../middleware/validators';
import { sendPasswordResetEmail } from '../config/email';
import { authRateLimiter } from '../config/security';
import env from '../config/env';
import { AuthResponse } from '../types';

const router = express.Router();

router.post('/register', registerValidator, validate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password, program, semester } = req.body as {
      name: string;
      password: string;
      program?: string;
      semester?: number;
    };
    const email = String(req.body.email ?? '').trim().toLowerCase();
    const studentId = String(req.body.studentId ?? '').trim().toLowerCase();

    const exists = await User.findOne({ $or: [{ email }, { studentId }] });
    if (exists) {
      res.status(400).json({ message: 'Email or Student ID already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: hashedPassword, studentId, program, semester });
    await user.save();

    const token = jwt.sign({ userId: user._id }, env.jwtSecret, { expiresIn: '7d' });
    const response: AuthResponse = {
      token,
      user: { _id: user._id, name, email, role: user.role, studentId },
    };
    res.status(201).json(response);
  } catch (err) {
    console.error('POST /auth/register:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', loginValidator, validate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user._id }, env.jwtSecret, { expiresIn: '7d' });
    const response: AuthResponse = {
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId },
    };
    res.json(response);
  } catch (err) {
    console.error('POST /auth/login:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/me', auth, (req: Request, res: Response): void => {
  res.json(req.user);
});

router.post('/forgot-password', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email ?? '').trim().toLowerCase();
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email });
    // Always respond the same way to prevent user enumeration
    const safeResponse = { message: 'If that email exists, a reset link has been sent' };

    if (!user) {
      res.json(safeResponse);
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = hashedToken;
    user.resetTokenExpiry = expiry;
    await user.save();

    const clientUrl = env.clientUrl;
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(email, resetUrl);

    res.json(safeResponse);
  } catch (err) {
    console.error('POST /auth/forgot-password:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token || !password) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ message: 'Password must be between 8 and 128 characters' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('POST /auth/reset-password:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
