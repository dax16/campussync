import Room, { IRoomDocument } from '../../models/Room';
import Booking, { IBookingDocument } from '../../models/Booking';
import { RoomType, BookingStatus } from '../../types';
import { toBookingDate } from '../../config/constants';
import { Types } from 'mongoose';

export interface RoomOptions {
  name?: string;
  building?: string;
  floor?: number;
  capacity?: number;
  type?: RoomType;
  amenities?: string[];
  isActive?: boolean;
}

export const createRoom = async (opts: RoomOptions = {}): Promise<IRoomDocument> => {
  const room = new Room({
    name: opts.name ?? 'Test Study Room',
    building: opts.building ?? 'LRC',
    floor: opts.floor ?? 2,
    capacity: opts.capacity ?? 6,
    type: opts.type ?? RoomType.STUDY_ROOM,
    amenities: opts.amenities ?? ['Whiteboard'],
    isActive: opts.isActive ?? true,
  });
  return room.save();
};

export interface BookingOptions {
  userId: Types.ObjectId | string;
  roomId: Types.ObjectId | string;
  date?: string;
  startTime?: string;
  endTime?: string;
  purpose?: string;
  attendees?: number;
  status?: BookingStatus;
}

export const createBooking = async (opts: BookingOptions): Promise<IBookingDocument> => {
  const booking = new Booking({
    user: opts.userId,
    room: opts.roomId,
    date: toBookingDate(opts.date ?? '2030-06-15'),
    startTime: opts.startTime ?? '10:00',
    endTime: opts.endTime ?? '11:00',
    purpose: opts.purpose ?? 'Study session',
    attendees: opts.attendees ?? 2,
    status: opts.status ?? BookingStatus.CONFIRMED,
  });
  return booking.save();
};

// Returns a future date string in YYYY-MM-DD format.
export const futureDate = (daysAhead = 7): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10) as string;
};
