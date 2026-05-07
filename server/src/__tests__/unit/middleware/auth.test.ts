import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock env before any module that imports it is loaded
jest.mock('../../../config/env', () => ({
  __esModule: true,
  default: {
    nodeEnv: 'test',
    port: 5001,
    mongoUri: 'mongodb://localhost/test',
    jwtSecret: 'test-super-secret-jwt-key-for-testing-only',
    aiServiceUrl: 'http://localhost:8000',
    clientUrl: 'http://localhost:3000',
    corsOrigins: ['http://localhost:3000'],
  },
}));

// Explicit factory so findById is a controllable jest.fn() (auto-mock doesn't
// work reliably with Mongoose model prototypal inheritance).
jest.mock('../../../models/User', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

import User from '../../../models/User';
import { auth, adminAuth } from '../../../middleware/auth';

const mockUser = {
  _id: 'user123',
  name: 'Test User',
  email: 's99001@campus.ca',
  role: 'student',
};

const mockAdminUser = { ...mockUser, role: 'admin' };

const makeReq = (token?: string): Partial<Request> => ({
  header: jest.fn().mockReturnValue(token ? `Bearer ${token}` : undefined),
});

const makeRes = (): { res: Partial<Response>; statusMock: jest.Mock; jsonMock: jest.Mock } => {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
  const res: Partial<Response> = { status: statusMock, json: jsonMock };
  return { res, statusMock, jsonMock };
};

const SECRET = 'test-super-secret-jwt-key-for-testing-only';
const validToken = jwt.sign({ userId: 'user123' }, SECRET, { expiresIn: '7d' });

describe('auth middleware', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls next() and sets req.user when token is valid', async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const req = makeReq(validToken) as Request;
    const { res } = makeRes();
    const next: NextFunction = jest.fn();

    await auth(req, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBe(mockUser);
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = makeReq() as Request;
    const { res, statusMock, jsonMock } = makeRes();
    const next: NextFunction = jest.fn();

    await auth(req, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'No token provided' });
  });

  it('returns 401 for a malformed token', async () => {
    const req = makeReq('not.a.valid.jwt') as Request;
    const { res, statusMock } = makeRes();
    const next: NextFunction = jest.fn();

    await auth(req, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it('returns 401 when user is not found in DB', async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = makeReq(validToken) as Request;
    const { res, statusMock, jsonMock } = makeRes();
    const next: NextFunction = jest.fn();

    await auth(req, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'User not found' });
  });
});

describe('adminAuth middleware', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls next() for a valid admin user', async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockAdminUser),
    });

    const req = makeReq(validToken) as Request;
    const { res } = makeRes();
    const next: NextFunction = jest.fn();

    await adminAuth(req, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 403 for a non-admin user', async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const req = makeReq(validToken) as Request;
    const { res, statusMock, jsonMock } = makeRes();
    const next: NextFunction = jest.fn();

    await adminAuth(req, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Admin access required' });
  });
});
