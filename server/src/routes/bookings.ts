import express, { Request, Response } from 'express';
import axios from 'axios';
import Booking from '../models/Booking';
import { auth } from '../middleware/auth';
import { validate, bookingCreationValidator } from '../middleware/validators';
import { bookingRateLimiter } from '../config/security';
import { toBookingDate } from '../config/constants';
import env from '../config/env';
import { BookingStatus } from '../types';

const router = express.Router();

router.post('/', auth, bookingRateLimiter, bookingCreationValidator, validate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, date, startTime, endTime, purpose, attendees, notes } = req.body as {
      roomId: string;
      date: string;
      startTime: string;
      endTime: string;
      purpose: string;
      attendees?: number;
      notes?: string;
    };

    const bookingDate = toBookingDate(date);

    const conflict = await Booking.findOne({
      room: roomId,
      date: bookingDate,
      status: BookingStatus.CONFIRMED,
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });
    if (conflict) {
      res.status(400).json({ message: 'Room already booked for this time slot' });
      return;
    }

    const booking = new Booking({
      user: req.user?._id,
      room: roomId,
      date: bookingDate,
      startTime,
      endTime,
      purpose,
      attendees,
      notes,
    });
    await booking.save();

    const populated = await booking.populate(['user', 'room']);

    req.io?.bookingCreated?.(booking);

    res.status(201).json(populated);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      res.status(400).json({ message: 'Room already booked for this time slot' });
      return;
    }
    console.error('POST /bookings:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/my', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find({ user: req.user?._id })
      .populate('room', 'name building floor type')
      .sort({ date: -1, startTime: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('GET /bookings/my:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/suggest', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, date } = req.query as { roomId?: string; date?: string };
    try {
      const aiRes = await axios.get(`${env.aiServiceUrl}/suggest`, {
        params: { room_id: roomId, date },
        timeout: 5000,
      });
      res.json(aiRes.data);
      return;
    } catch (aiErr) {
      console.warn('AI service unavailable, using fallback:', (aiErr as Error).message);
      const slots: Array<{ start: string; score: number }> = [];
      for (let h = 9; h <= 17; h++) {
        slots.push({ start: `${h.toString().padStart(2, '0')}:00`, score: Math.random() });
      }
      res.json({ suggestions: slots.sort((a, b) => b.score - a.score).slice(0, 3) });
      return;
    }
  } catch (err) {
    console.error('GET /bookings/suggest:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id/cancel', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findOne({ _id: req.params['id'], user: req.user?._id });
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }
    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    req.io?.bookingCancelled?.(booking);

    res.json(booking);
  } catch (err) {
    console.error('PATCH /bookings/:id/cancel:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
