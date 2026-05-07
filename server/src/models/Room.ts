import { Schema, model, Document } from 'mongoose';
import { IRoom, RoomType } from '../types';

export interface IRoomDocument extends IRoom, Document {}

const roomSchema = new Schema<IRoomDocument>(
  {
    name: { type: String, required: true },
    building: { type: String, required: true },
    floor: { type: Number, required: true },
    capacity: { type: Number, required: true },
    type: { type: String, enum: Object.values(RoomType), default: RoomType.STUDY_ROOM },
    amenities: [{ type: String }],
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    currentOccupancy: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default model<IRoomDocument>('Room', roomSchema);
