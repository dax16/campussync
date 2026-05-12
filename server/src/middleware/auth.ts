import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import env from '../config/env';
import { AppJwtPayload } from '../types';

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, env.jwtSecret) as AppJwtPayload;
    const user = await User.findById(decoded.userId).select('-password -resetToken -resetTokenExpiry');
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const adminAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let authPassed = false;
  await auth(req, res, () => { authPassed = true; });
  if (!authPassed) return;

  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};
