import mongoose from 'mongoose';
import { body, ValidationChain } from 'express-validator';
import Room from '../../models/Room';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MIN_BOOKING_TIME = '08:00';
const MAX_BOOKING_TIME = '22:00';

const normalizeString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours as number) * 60 + (minutes as number);
};

const isValidBookingDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const getLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const bookingCreationValidator: ValidationChain[] = [
  body('roomId')
    .notEmpty()
    .withMessage('Room is required')
    .bail()
    .isMongoId()
    .withMessage('Room is invalid')
    .bail()
    .custom(async (roomId: string) => {
      const room = await Room.findOne({ _id: roomId, isActive: true }).select('capacity');
      if (!room) throw new Error('Room not found');
      return true;
    }),

  body('date')
    .notEmpty()
    .withMessage('Booking date is required')
    .bail()
    .custom((value: string) => {
      if (!isValidBookingDate(value)) {
        throw new Error('Booking date must use YYYY-MM-DD format');
      }
      if (value < getLocalDateString()) {
        throw new Error('Booking date cannot be in the past');
      }
      return true;
    }),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .bail()
    .matches(TIME_PATTERN)
    .withMessage('Start time must use HH:mm format')
    .bail()
    .custom((startTime: string) => {
      if (startTime < MIN_BOOKING_TIME || startTime >= MAX_BOOKING_TIME) {
        throw new Error('Start time must be between 08:00 and 22:00');
      }
      return true;
    }),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .bail()
    .matches(TIME_PATTERN)
    .withMessage('End time must use HH:mm format')
    .bail()
    .custom((endTime: string, { req }) => {
      const { startTime } = req.body as { startTime?: string };
      if (!TIME_PATTERN.test(startTime ?? '')) return true;

      if (endTime <= (startTime ?? '')) throw new Error('End time must be after start time');
      if (endTime > MAX_BOOKING_TIME) throw new Error('End time must be no later than 22:00');

      const durationMinutes = toMinutes(endTime) - toMinutes(startTime ?? '00:00');
      if (durationMinutes < 30) throw new Error('Booking must be at least 30 minutes long');

      return true;
    }),

  body('purpose')
    .customSanitizer(normalizeString)
    .notEmpty()
    .withMessage('Purpose is required')
    .isLength({ max: 200 })
    .withMessage('Purpose cannot exceed 200 characters'),

  body('attendees')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Attendees must be at least 1')
    .bail()
    .toInt()
    .custom(async (attendees: number, { req }) => {
      const body = req.body as { roomId?: string };
      if (!mongoose.isValidObjectId(body.roomId)) return true;

      const room = await Room.findOne({ _id: body.roomId, isActive: true }).select('capacity');
      if (room && attendees > room.capacity) {
        throw new Error(`Attendees cannot exceed room capacity of ${room.capacity}`);
      }
      return true;
    }),

  body('notes')
    .optional({ checkFalsy: true })
    .customSanitizer(normalizeString)
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];
