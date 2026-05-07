import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { auth } from '../middleware/auth';
import { validate, registerValidator, loginValidator } from '../middleware/validators';
import env from '../config/env';
import { AuthResponse } from '../types';

const router = express.Router();
const STUDENT_EMAIL_DOMAIN = 'campus.ca';

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

    if (!/^s[0-9]+$/.test(studentId)) {
      res.status(400).json({ message: 'Student ID must start with s and contain only numbers after it' });
      return;
    }

    const expectedEmail = `${studentId}@${STUDENT_EMAIL_DOMAIN}`;
    if (email !== expectedEmail) {
      res.status(400).json({ message: `Email must match your Student ID: ${expectedEmail}` });
      return;
    }

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
      user: { id: user._id, name, email, role: user.role, studentId },
    };
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
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
      user: { id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId },
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

router.get('/me', auth, (req: Request, res: Response): void => {
  res.json(req.user);
});

export default router;
