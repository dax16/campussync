import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { Application } from 'express';
import { AppConfig } from '../types';

const createCorsOptions = (env: AppConfig): CorsOptions => ({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 204,
});

export const createSocketCorsOptions = (env: AppConfig) => ({
  origin: env.corsOrigins,
  methods: ['GET', 'POST'],
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Too many authentication attempts, please try again later' },
});

export const applySecurityMiddleware = (app: Application, env: AppConfig): void => {
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors(createCorsOptions(env)));
  app.use(generalRateLimiter);
};

export const applyRequestSanitizers = (app: Application): void => {
  app.use(mongoSanitize({ replaceWith: '_' }));
  app.use(xss());
};
