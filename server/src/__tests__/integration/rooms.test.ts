import supertest from 'supertest';
import { getTestApp } from '../helpers/app.helper';
import { createTestUser, generateToken, authHeader } from '../helpers/auth.helper';
import { createRoom, createBooking, futureDate } from '../helpers/factories';
import { RoomType } from '../../types';

const request = supertest(getTestApp());

let token: string;

beforeEach(async () => {
  const user = await createTestUser({ studentId: 's30001' });
  token = generateToken(String(user._id));
});

describe('GET /api/rooms', () => {
  it('200 — returns all active rooms', async () => {
    await createRoom({ name: 'Room A' });
    await createRoom({ name: 'Room B' });

    const res = await request.get('/api/rooms').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('200 — filters by room type', async () => {
    await createRoom({ type: RoomType.STUDY_ROOM });
    await createRoom({ type: RoomType.COMPUTER_LAB });

    const res = await request
      .get('/api/rooms')
      .query({ type: 'computer_lab' })
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].type).toBe('computer_lab');
  });

  it('200 — filters by minimum capacity', async () => {
    await createRoom({ capacity: 4 });
    await createRoom({ capacity: 20 });

    const res = await request
      .get('/api/rooms')
      .query({ capacity: 10 })
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].capacity).toBeGreaterThanOrEqual(10);
  });

  it('200 — includes bookings when date is provided', async () => {
    const room = await createRoom();
    const user = await createTestUser({ studentId: 's30002' });
    await createBooking({
      userId: user._id,
      roomId: room._id,
      date: futureDate(),
    });

    const res = await request
      .get('/api/rooms')
      .query({ date: futureDate() })
      .set(authHeader(token));

    expect(res.status).toBe(200);
    const found = res.body.find((r: { _id: string }) => String(r._id) === String(room._id));
    expect(found).toBeDefined();
    expect(found.bookings).toHaveLength(1);
  });

  it('401 — returns 401 without a token', async () => {
    const res = await request.get('/api/rooms');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/rooms/:id', () => {
  it('200 — returns a single room by id', async () => {
    const room = await createRoom({ name: 'Specific Room' });

    const res = await request
      .get(`/api/rooms/${String(room._id)}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Specific Room');
  });

  it('404 — returns 404 for a non-existent id', async () => {
    const { Types } = await import('mongoose');
    const fakeId = new Types.ObjectId().toHexString();

    const res = await request
      .get(`/api/rooms/${fakeId}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Room not found');
  });

  it('401 — returns 401 without a token', async () => {
    const room = await createRoom();
    const res = await request.get(`/api/rooms/${String(room._id)}`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/rooms/:id/availability', () => {
  it('200 — returns 14 hourly time slots for a valid date', async () => {
    const room = await createRoom();

    const res = await request
      .get(`/api/rooms/${String(room._id)}/availability`)
      .query({ date: futureDate() })
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(14); // 08:00 – 21:00 = 14 slots
    expect(res.body[0].start).toBe('08:00');
    expect(res.body[0].end).toBe('09:00');
  });

  it('200 — marks booked slots as unavailable', async () => {
    const room = await createRoom();
    const user = await createTestUser({ studentId: 's30003' });
    await createBooking({
      userId: user._id,
      roomId: room._id,
      date: futureDate(),
      startTime: '10:00',
      endTime: '11:00',
    });

    const res = await request
      .get(`/api/rooms/${String(room._id)}/availability`)
      .query({ date: futureDate() })
      .set(authHeader(token));

    expect(res.status).toBe(200);
    const booked = res.body.find((s: { start: string }) => s.start === '10:00');
    expect(booked.available).toBe(false);
  });

  it('400 — returns 400 when date query param is missing', async () => {
    const room = await createRoom();

    const res = await request
      .get(`/api/rooms/${String(room._id)}/availability`)
      .set(authHeader(token));

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Date required');
  });

  it('401 — returns 401 without a token', async () => {
    const room = await createRoom();
    const res = await request.get(`/api/rooms/${String(room._id)}/availability`);
    expect(res.status).toBe(401);
  });
});
