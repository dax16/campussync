import { Schema, model, Document } from 'mongoose';
import { IUser, UserRole } from '../types';

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    program: { type: String, default: 'ITS' },
    semester: { type: Number, default: 1 },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.STUDENT },
    avatar: { type: String, default: '' },
  },
  { timestamps: true },
);

export default model<IUserDocument>('User', userSchema);
