import { Schema, model, Document } from 'mongoose';
import { IBooking, BookingStatus } from '../types';

export interface IBookingDocument extends IBooking, Document {}

const bookingSchema = new Schema<IBookingDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    purpose: { type: String, required: true },
    attendees: { type: Number, default: 1 },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.CONFIRMED,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

bookingSchema.index({ room: 1, date: 1 });
// Prevents duplicate confirmed bookings for the same slot (race-condition guard)
bookingSchema.index(
  { room: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } },
);

export default model<IBookingDocument>('Booking', bookingSchema);
