import supertest from 'supertest';
import crypto from 'crypto';
import { getTestApp } from '../helpers/app.helper';
import { createTestUser, generateToken, authHeader } from '../helpers/auth.helper';
import User from '../../models/User';

const request = supertest(getTestApp());

const validPayload = {
  name: 'Jane Student',
  studentId: 's20001',
  email: 's20001@campus.ca',
  password: 'Password123!',
  program: 'CS',
  semester: 2,
};

describe('POST /api/auth/register', () => {
  it('201 — registers a new user and returns a token', async () => {
    const res = await request.post('/api/auth/register').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('s20001@campus.ca');
    expect(res.body.user.role).toBe('student');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('400 — rejects missing required fields', async () => {
    const res = await request
      .post('/api/auth/register')
      .send({ name: 'No ID', email: 'x@campus.ca', password: 'Pass1234' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 — rejects email that does not match studentId', async () => {
    const res = await request.post('/api/auth/register').send({
      ...validPayload,
      email: 'other@campus.ca',
    });

    expect(res.status).toBe(400);
  });

  it('400 — rejects duplicate studentId or email', async () => {
    await request.post('/api/auth/register').send(validPayload);

    const res = await request.post('/api/auth/register').send(validPayload);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('400 — rejects a password shorter than 8 characters', async () => {
    const res = await request
      .post('/api/auth/register')
      .send({ ...validPayload, studentId: 's20002', email: 's20002@campus.ca', password: 'short' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await createTestUser({ studentId: 's20010', email: 's20010@campus.ca' });
  });

  it('200 — returns token with correct credentials', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 's20010@campus.ca',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('s20010@campus.ca');
  });

  it('400 — rejects wrong password', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 's20010@campus.ca',
      password: 'WrongPassword',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('400 — rejects non-existent email', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'nobody@campus.ca',
      password: 'Password123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('400 — rejects missing password', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: 's20010@campus.ca' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

describe('GET /api/auth/me', () => {
  it('200 — returns current user when authenticated', async () => {
    const user = await createTestUser({ studentId: 's20020' });
    const token = generateToken(String(user._id));

    const res = await request.get('/api/auth/me').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.studentId).toBe('s20020');
    expect(res.body).not.toHaveProperty('password');
  });

  it('401 — returns 401 when no token is provided', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('401 — returns 401 for an invalid token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set({ Authorization: 'Bearer invalid.jwt.token' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  it('200 — does not expose resetToken or resetTokenExpiry', async () => {
    const user = await createTestUser({ studentId: 's20030' });
    const token = generateToken(String(user._id));

    const res = await request.get('/api/auth/me').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('resetToken');
    expect(res.body).not.toHaveProperty('resetTokenExpiry');
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('200 — returns safe message for an existing email', async () => {
    await createTestUser({ studentId: 's20040' });

    const res = await request
      .post('/api/auth/forgot-password')
      .send({ email: 's20040@campus.ca' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link/i);
  });

  it('200 — returns same message for a nonexistent email (prevents enumeration)', async () => {
    const res = await request
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@campus.ca' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link/i);
  });

  it('400 — returns 400 when email is missing', async () => {
    const res = await request.post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('200 — resets the password with a valid token', async () => {
    const user = await createTestUser({ studentId: 's20050' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const res = await request
      .post('/api/auth/reset-password')
      .send({ token: rawToken, password: 'NewPassword123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset successful/i);

    const updated = await User.findById(user._id);
    expect(updated?.resetToken).toBeNull();
  });

  it('400 — returns 400 for an expired token', async () => {
    const user = await createTestUser({ studentId: 's20051' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() - 1000);
    await user.save();

    const res = await request
      .post('/api/auth/reset-password')
      .send({ token: rawToken, password: 'NewPassword123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it('400 — returns 400 for an invalid token', async () => {
    const res = await request
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', password: 'NewPassword123' });

    expect(res.status).toBe(400);
  });

  it('400 — returns 400 when password is too short (< 8)', async () => {
    const res = await request
      .post('/api/auth/reset-password')
      .send({ token: 'any', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/between 8 and 128/i);
  });

  it('400 — returns 400 when password exceeds 128 characters', async () => {
    const res = await request
      .post('/api/auth/reset-password')
      .send({ token: 'any', password: 'a'.repeat(129) });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/between 8 and 128/i);
  });

  it('400 — returns 400 when token or password is missing', async () => {
    const res = await request
      .post('/api/auth/reset-password')
      .send({ password: 'NewPassword123' });

    expect(res.status).toBe(400);
  });
});
