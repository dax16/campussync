import dotenv from 'dotenv';
import { AppConfig } from '../types';

dotenv.config();

const DEFAULT_CLIENT_URL = 'http://localhost:3000';
const DEFAULT_PORT = 5000;
const DEFAULT_MONGO_URI = 'mongodb://localhost:27017/campussync';
const DEFAULT_AI_SERVICE_URL = 'http://localhost:8000';
const DEFAULT_JWT_SECRET = 'your_super_secret_jwt_key_change_this';

const parseCorsOrigins = (value: string | undefined): string[] =>
  String(value || DEFAULT_CLIENT_URL)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const getEnv = (): AppConfig => {
  const nodeEnv = process.env['NODE_ENV'] ?? 'development';
  const jwtSecret = process.env['JWT_SECRET'];

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required');
  }

  if (nodeEnv === 'production' && jwtSecret === DEFAULT_JWT_SECRET) {
    throw new Error('JWT_SECRET must be changed before running in production');
  }

  return {
    nodeEnv,
    port: Number(process.env['PORT']) || DEFAULT_PORT,
    mongoUri: process.env['MONGO_URI'] ?? DEFAULT_MONGO_URI,
    jwtSecret,
    aiServiceUrl: process.env['AI_SERVICE_URL'] ?? DEFAULT_AI_SERVICE_URL,
    clientUrl: process.env['CLIENT_URL'] ?? DEFAULT_CLIENT_URL,
    corsOrigins: parseCorsOrigins(process.env['CORS_ORIGINS'] ?? process.env['CLIENT_URL']),
  };
};

export default getEnv();
