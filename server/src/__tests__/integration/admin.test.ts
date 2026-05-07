import supertest from 'supertest';
import { getTestApp } from '../helpers/app.helper';
import {
  createTestUser,
  createAdminUser,
  generateToken,
  authHeader,
} from '../helpers/auth.helper';
import { createRoom, createBooking, futureDate } from '../helpers/factories';
import { RoomType } from '../../types';

const request = supertest(getTestApp());

let studentToken: string;
let adminToken: string;

beforeEach(async () => {
  const student = await createTestUser({ studentId: 's50001' });
  const admin = await createAdminUser();
  studentToken = generateToken(String(student._id));
  adminToken = generateToken(String(admin._id));
});

describe('GET /api/admin/stats', () => {
  it('200 — returns stats for an admin user', async () => {
    const room = await createRoom();
    const user = await createTestUser({ studentId: 's50002' });
    await createBooking({ userId: user._id, roomId: room._id, date: futureDate(1) });

    const res = await request.get('/api/admin/stats').set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalBookings');
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalRooms');
    expect(res.body).toHaveProperty('popularRooms');
    expect(res.body).toHaveProperty('hourlyData');
    expect(typeof res.body.totalBookings).toBe('number');
  });

  it('403 — returns 403 for a student user', async () => {
    const res = await request.get('/api/admin/stats').set(authHeader(studentToken));
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Admin access required');
  });

  it('401 — returns 401 without a token', async () => {
    const res = await request.get('/api/admin/stats');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/admin/rooms', () => {
  const validRoom = {
    name: 'Admin Test Room',
    building: 'NX',
    floor: 3,
    capacity: 15,
    type: RoomType.LAB,
    amenities: ['Projector'],
  };

  it('201 — creates a new room as admin', async () => {
    const res = await request
      .post('/api/admin/rooms')
      .set(authHeader(adminToken))
      .send(validRoom);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Admin Test Room');
    expect(res.body.capacity).toBe(15);
  });

  it('400 — rejects invalid room data (missing name)', async () => {
    const res = await request
      .post('/api/admin/rooms')
      .set(authHeader(adminToken))
      .send({ ...validRoom, name: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('403 — returns 403 for a student user', async () => {
    const res = await request
      .post('/api/admin/rooms')
      .set(authHeader(studentToken))
      .send(validRoom);

    expect(res.status).toBe(403);
  });

  it('401 — returns 401 without a token', async () => {
    const res = await request.post('/api/admin/rooms').send(validRoom);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/bookings', () => {
  it('200 — returns up to 50 recent bookings for admin', async () => {
    const room = await createRoom();
    const user = await createTestUser({ studentId: 's50003' });
    await createBooking({ userId: user._id, roomId: room._id, date: futureDate(2) });

    const res = await request.get('/api/admin/bookings').set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('user');
    expect(res.body[0]).toHaveProperty('room');
  });

  it('403 — returns 403 for a student user', async () => {
    const res = await request.get('/api/admin/bookings').set(authHeader(studentToken));
    expect(res.status).toBe(403);
  });

  it('401 — returns 401 without a token', async () => {
    const res = await request.get('/api/admin/bookings');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/admin/seed', () => {
  it('200 — seeds default rooms and returns count', async () => {
    const res = await request.post('/api/admin/seed').set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Rooms seeded');
    expect(typeof res.body.count).toBe('number');
    expect(res.body.count).toBeGreaterThanOrEqual(6);
  });

  it('200 — is idempotent (seeding twice does not duplicate rooms)', async () => {
    await request.post('/api/admin/seed').set(authHeader(adminToken));
    const res = await request.post('/api/admin/seed').set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(6);
  });

  it('403 — returns 403 for a student user', async () => {
    const res = await request.post('/api/admin/seed').set(authHeader(studentToken));
    expect(res.status).toBe(403);
  });

  it('401 — returns 401 without a token', async () => {
    const res = await request.post('/api/admin/seed');
    expect(res.status).toBe(401);
  });
});
