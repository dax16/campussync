import express, { Application, Request, Response, NextFunction } from 'express';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import bookingRoutes from './routes/bookings';
import adminRoutes from './routes/admin';
import {
  applySecurityMiddleware,
  applyRequestSanitizers,
  authRateLimiter,
} from './config/security';
import { AppConfig } from './types';
import { AppServer } from './socket/socketHandler';

const createApp = (env: AppConfig, io: AppServer): Application => {
  const app = express();

  applySecurityMiddleware(app, env);

  app.use(express.json({ limit: '10kb' }));
  applyRequestSanitizers(app);

  app.use((req: Request, _res: Response, next: NextFunction): void => {
    req.io = io;
    next();
  });

  app.use('/api/auth', authRateLimiter, authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (_req: Request, res: Response): void => {
    res.json({ status: 'CampusSync API running' });
  });

  return app;
};

export default createApp;
