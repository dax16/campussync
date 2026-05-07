import express, { Request, Response } from 'express';
import supertest from 'supertest';
import { roomCreationValidator } from '../../../middleware/validators/roomValidators';
import validate from '../../../middleware/validators/validate';

const app = express();
app.use(express.json());
app.post('/test', roomCreationValidator, validate, (_req: Request, res: Response) =>
  res.status(200).json({ ok: true }),
);
const request = supertest(app);

const validRoom = {
  name: 'Study Room A',
  building: 'LRC',
  floor: 2,
  capacity: 10,
  type: 'study_room',
  amenities: ['Whiteboard'],
};

describe('roomCreationValidator', () => {
  it('accepts a fully valid room payload', async () => {
    const res = await request.post('/test').send(validRoom);
    expect(res.status).toBe(200);
  });

  it('rejects when name is missing', async () => {
    const res = await request.post('/test').send({ ...validRoom, name: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('name');
  });

  it('rejects when building is missing', async () => {
    const res = await request.post('/test').send({ ...validRoom, building: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('building');
  });

  it('rejects a negative floor number', async () => {
    const res = await request.post('/test').send({ ...validRoom, floor: -1 });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('floor');
  });

  it('rejects capacity of 0', async () => {
    const res = await request.post('/test').send({ ...validRoom, capacity: 0 });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('capacity');
  });

  it('rejects an invalid room type', async () => {
    const res = await request.post('/test').send({ ...validRoom, type: 'warehouse' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('type');
  });

  it('rejects amenities that are not an array', async () => {
    const res = await request.post('/test').send({ ...validRoom, amenities: 'Whiteboard' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('amenities');
  });

  it('rejects an invalid imageUrl', async () => {
    const res = await request.post('/test').send({ ...validRoom, imageUrl: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('imageUrl');
  });

  it('accepts a valid imageUrl', async () => {
    const res = await request
      .post('/test')
      .send({ ...validRoom, imageUrl: 'https://example.com/img.jpg' });
    expect(res.status).toBe(200);
  });

  it('accepts optional type and amenities being absent', async () => {
    const { type: _t, amenities: _a, ...payload } = validRoom;
    const res = await request.post('/test').send(payload);
    expect(res.status).toBe(200);
  });
});
