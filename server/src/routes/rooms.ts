import express, { Request, Response } from 'express';
import Room from '../models/Room';
import Booking from '../models/Booking';
import { auth } from '../middleware/auth';
import { toBookingDate } from '../config/constants';
import { BookingStatus, TimeSlot } from '../types';

const router = express.Router();

router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, capacity, date } = req.query as {
      type?: string;
      capacity?: string;
      date?: string;
    };

    const filter: Record<string, unknown> = { isActive: true };
    if (type) filter['type'] = type;
    if (capacity) filter['capacity'] = { $gte: parseInt(capacity, 10) };

    const rooms = await Room.find(filter).sort({ building: 1, floor: 1, name: 1 });

    if (date) {
      const bookingDate = toBookingDate(date);
      const roomIds = rooms.map((r) => r._id);
      const allBookings = await Booking.find({
        room: { $in: roomIds },
        date: bookingDate,
        status: BookingStatus.CONFIRMED,
      });

      const bookingsByRoom = new Map<string, typeof allBookings>();
      for (const booking of allBookings) {
        const key = booking.room.toString();
        if (!bookingsByRoom.has(key)) bookingsByRoom.set(key, []);
        bookingsByRoom.get(key)!.push(booking);
      }

      const roomsWithAvailability = rooms.map((room) => ({
        ...room.toObject(),
        bookings: bookingsByRoom.get(room._id.toString()) ?? [],
      }));

      res.json(roomsWithAvailability);
      return;
    }

    res.json(rooms);
  } catch (err) {
    console.error('GET /rooms:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await Room.findById(req.params['id']);
    if (!room) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }
    res.json(room);
  } catch (err) {
    console.error('GET /rooms/:id:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/availability', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.query as { date?: string };
    if (!date) {
      res.status(400).json({ message: 'Date required' });
      return;
    }

    const bookings = await Booking.find({
      room: req.params['id'],
      date: toBookingDate(date),
      status: BookingStatus.CONFIRMED,
    }).populate('user', 'name studentId');

    const timeSlots: TimeSlot[] = [];
    for (let hour = 8; hour < 22; hour++) {
      const start = `${hour.toString().padStart(2, '0')}:00`;
      const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const booking = bookings.find((b) => b.startTime === start);
      timeSlots.push({ start, end, available: !booking, booking: booking ?? null });
    }

    res.json(timeSlots);
  } catch (err) {
    console.error('GET /rooms/:id/availability:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
