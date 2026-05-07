import express, { Request, Response } from 'express';
import supertest from 'supertest';
import mongoose from 'mongoose';

// Mock the Room model to avoid a real DB connection in this unit test.
jest.mock('../../../models/Room', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

import Room from '../../../models/Room';
import { bookingCreationValidator } from '../../../middleware/validators/bookingValidators';
import validate from '../../../middleware/validators/validate';

const app = express();
app.use(express.json());
app.post('/test', bookingCreationValidator, validate, (_req: Request, res: Response) =>
  res.status(200).json({ ok: true }),
);
const request = supertest(app);

const VALID_ROOM_ID = new mongoose.Types.ObjectId().toHexString();

const validPayload = {
  roomId: VALID_ROOM_ID,
  date: '2030-12-01',
  startTime: '10:00',
  endTime: '11:30',
  purpose: 'Team meeting',
};

describe('bookingCreationValidator', () => {
  const mockSelectFn = jest.fn();

  beforeEach(() => {
    // Booking validator calls Room.findOne(...).select('capacity') — chain the mock.
    (Room.findOne as jest.Mock).mockReturnValue({ select: mockSelectFn });
    mockSelectFn.mockResolvedValue({ _id: VALID_ROOM_ID, capacity: 10 });
  });

  afterEach(() => jest.clearAllMocks());

  it('accepts a valid booking payload', async () => {
    const res = await request.post('/test').send(validPayload);
    expect(res.status).toBe(200);
  });

  it('rejects when roomId is missing', async () => {
    const res = await request.post('/test').send({ ...validPayload, roomId: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('roomId');
  });

  it('rejects an invalid MongoDB ObjectId', async () => {
    const res = await request.post('/test').send({ ...validPayload, roomId: 'bad-id' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('roomId');
  });

  it('returns 400 when room is not found', async () => {
    mockSelectFn.mockResolvedValue(null);
    const res = await request.post('/test').send(validPayload);
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch(/room not found/i);
  });

  it('rejects a past date', async () => {
    const res = await request.post('/test').send({ ...validPayload, date: '2000-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('date');
  });

  it('rejects an invalid date format', async () => {
    const res = await request.post('/test').send({ ...validPayload, date: '01-12-2030' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('date');
  });

  it('rejects a startTime before 08:00', async () => {
    const res = await request
      .post('/test')
      .send({ ...validPayload, startTime: '07:00', endTime: '08:30' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('startTime');
  });

  it('rejects when endTime is not after startTime', async () => {
    const res = await request
      .post('/test')
      .send({ ...validPayload, startTime: '11:00', endTime: '10:00' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('endTime');
  });

  it('rejects a duration shorter than 30 minutes', async () => {
    const res = await request
      .post('/test')
      .send({ ...validPayload, startTime: '10:00', endTime: '10:20' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('endTime');
  });

  it('rejects attendees exceeding room capacity', async () => {
    const res = await request.post('/test').send({ ...validPayload, attendees: 99 });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('attendees');
  });

  it('rejects notes longer than 500 characters', async () => {
    const res = await request
      .post('/test')
      .send({ ...validPayload, notes: 'x'.repeat(501) });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('notes');
  });

  it('accepts optional attendees and notes when omitted', async () => {
    const res = await request.post('/test').send(validPayload);
    expect(res.status).toBe(200);
  });
});
