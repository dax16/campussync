import supertest from 'supertest';
import { getTestApp } from '../helpers/app.helper';
import { createTestUser, generateToken, authHeader } from '../helpers/auth.helper';

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
});
