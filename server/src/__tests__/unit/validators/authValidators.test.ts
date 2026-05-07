import express from 'express';
import supertest from 'supertest';
import { ValidationChain } from 'express-validator';
import { registerValidator, loginValidator } from '../../../middleware/validators/authValidators';
import validate from '../../../middleware/validators/validate';

const buildApp = (validators: ValidationChain[]) => {
  const app = express();
  app.use(express.json());
  app.post('/test', validators, validate, (_req, res) => res.status(200).json({ ok: true }));
  return supertest(app);
};

const registerRequest = buildApp(registerValidator);
const loginRequest = buildApp(loginValidator);

const validRegisterPayload = {
  name: 'Alice Smith',
  studentId: 's10001',
  email: 's10001@campus.ca',
  password: 'SecurePass1',
  program: 'CS',
  semester: 2,
};

describe('registerValidator', () => {
  it('accepts a fully valid payload', async () => {
    const res = await registerRequest.post('/test').send(validRegisterPayload);
    expect(res.status).toBe(200);
  });

  it('rejects when name is missing', async () => {
    const res = await registerRequest
      .post('/test')
      .send({ ...validRegisterPayload, name: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('name');
  });

  it('rejects a studentId that does not start with s', async () => {
    const res = await registerRequest
      .post('/test')
      .send({ ...validRegisterPayload, studentId: '10001', email: '10001@campus.ca' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('studentId');
  });

  it('rejects when email does not match studentId pattern', async () => {
    const res = await registerRequest
      .post('/test')
      .send({ ...validRegisterPayload, email: 'other@campus.ca' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('email');
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await registerRequest
      .post('/test')
      .send({ ...validRegisterPayload, password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('password');
  });

  it('rejects a semester outside 1–8', async () => {
    const res = await registerRequest
      .post('/test')
      .send({ ...validRegisterPayload, semester: 9 });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('semester');
  });

  it('accepts registration without optional fields (program, semester)', async () => {
    const { program: _p, semester: _s, ...payload } = validRegisterPayload;
    const res = await registerRequest.post('/test').send(payload);
    expect(res.status).toBe(200);
  });
});

describe('loginValidator', () => {
  it('accepts valid login credentials', async () => {
    const res = await loginRequest
      .post('/test')
      .send({ email: 's10001@campus.ca', password: 'anything' });
    expect(res.status).toBe(200);
  });

  it('rejects when email is missing', async () => {
    const res = await loginRequest.post('/test').send({ password: 'pass' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('email');
  });

  it('rejects a non-email string', async () => {
    const res = await loginRequest
      .post('/test')
      .send({ email: 'not-an-email', password: 'pass' });
    expect(res.status).toBe(400);
  });

  it('rejects when password is missing', async () => {
    const res = await loginRequest
      .post('/test')
      .send({ email: 's10001@campus.ca' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('password');
  });
});
