import supertest from 'supertest';
import { getTestApp } from '../helpers/app.helper';
import { createTestUser, generateToken, authHeader } from '../helpers/auth.helper';
import { createRoom, createBooking, futureDate } from '../helpers/factories';
import { mockIo } from '../helpers/app.helper';
import { BookingStatus } from '../../types';

const request = supertest(getTestApp());

let token: string;
let userId: string;

beforeEach(async () => {
  jest.clearAllMocks();
  const user = await createTestUser({ studentId: 's40001' });
  userId = String(user._id);
  token = generateToken(userId);
});

describe('POST /api/bookings', () => {
  it('201 — creates a booking and emits socket events', async () => {
    const room = await createRoom({ capacity: 10 });
    const date = futureDate(10);

    const res = await request
      .post('/api/bookings')
      .set(authHeader(token))
      .send({
        roomId: String(room._id),
        date,
        startTime: '09:00',
        endTime: '10:00',
        purpose: 'Study group',
        attendees: 3,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(BookingStatus.CONFIRMED);
    expect(res.body.purpose).toBe('Study group');
    expect(mockIo.emit).toHaveBeenCalledWith(
      'bookingCreated',
      expect.objectContaining({ startTime: '09:00' }),
    );
  });

  it('400 — returns 400 on a conflicting time slot', async () => {
    const room = await createRoom();
    const date = futureDate(10);

    // Create an existing confirmed booking
    const user2 = await createTestUser({ studentId: 's40002' });
    await createBooking({
      userId: user2._id,
      roomId: room._id,
      date,
      startTime: '10:00',
      endTime: '11:00',
      status: BookingStatus.CONFIRMED,
    });

    const res = await request
      .post('/api/bookings')
      .set(authHeader(token))
      .send({
        roomId: String(room._id),
        date,
        startTime: '10:00',
        endTime: '11:00',
        purpose: 'Overlap test',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already booked/i);
  });

  it('400 — returns validation error for missing purpose', async () => {
    const room = await createRoom();

    const res = await request
      .post('/api/bookings')
      .set(authHeader(token))
      .send({
        roomId: String(room._id),
        date: futureDate(10),
        startTime: '09:00',
        endTime: '10:00',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('401 — returns 401 without a token', async () => {
    const res = await request.post('/api/bookings').send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /api/bookings/my', () => {
  it('200 — returns only the current user\'s bookings', async () => {
    const room = await createRoom();
    const other = await createTestUser({ studentId: 's40003' });

    await createBooking({ userId, roomId: room._id, date: futureDate(5) });
    await createBooking({ userId: other._id, roomId: room._id, date: futureDate(6) });

    const res = await request.get('/api/bookings/my').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(String(res.body[0].user)).toBe(userId);
  });

  it('200 — returns an empty array when user has no bookings', async () => {
    const res = await request.get('/api/bookings/my').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('401 — returns 401 without a token', async () => {
    const res = await request.get('/api/bookings/my');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/bookings/suggest', () => {
  it('200 — returns AI fallback suggestions when AI service is unavailable', async () => {
    const res = await request
      .get('/api/bookings/suggest')
      .query({ roomId: 'someId', date: futureDate() })
      .set(authHeader(token));

    // AI service is not running in tests → fallback should kick in
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('suggestions');
    expect(Array.isArray(res.body.suggestions)).toBe(true);
  });

  it('401 — returns 401 without a token', async () => {
    const res = await request.get('/api/bookings/suggest');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/bookings/:id/cancel', () => {
  it('200 — cancels the booking and emits socket event', async () => {
    const room = await createRoom();
    const booking = await createBooking({
      userId,
      roomId: room._id,
      date: futureDate(10),
      status: BookingStatus.CONFIRMED,
    });

    const res = await request
      .patch(`/api/bookings/${String(booking._id)}/cancel`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(BookingStatus.CANCELLED);
    expect(mockIo.emit).toHaveBeenCalledWith('bookingCancelled', expect.any(Object));
  });

  it('404 — returns 404 for a booking that belongs to another user', async () => {
    const room = await createRoom();
    const otherUser = await createTestUser({ studentId: 's40004' });
    const booking = await createBooking({
      userId: otherUser._id,
      roomId: room._id,
      date: futureDate(10),
    });

    const res = await request
      .patch(`/api/bookings/${String(booking._id)}/cancel`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Booking not found');
  });

  it('401 — returns 401 without a token', async () => {
    const { Types } = await import('mongoose');
    const fakeId = new Types.ObjectId().toHexString();
    const res = await request.patch(`/api/bookings/${fakeId}/cancel`);
    expect(res.status).toBe(401);
  });
});
