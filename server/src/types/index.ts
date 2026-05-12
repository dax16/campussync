import { Types } from 'mongoose';

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

export enum RoomType {
  STUDY_ROOM = 'study_room',
  LAB = 'lab',
  MEETING_ROOM = 'meeting_room',
  COMPUTER_LAB = 'computer_lab',
}

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

// ─── Domain interfaces ───────────────────────────────────────────────────────

export interface IUser {
  name: string;
  email: string;
  password: string;
  studentId: string;
  program: string;
  semester: number;
  role: UserRole;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoom {
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  amenities: string[];
  imageUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking {
  user: Types.ObjectId;
  room: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: number;
  status: BookingStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export interface AppJwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface AppConfig {
  nodeEnv: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  aiServiceUrl: string;
  clientUrl: string;
  corsOrigins: string[];
}

// ─── API response shapes ─────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: UserRole;
    studentId: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  message: string;
  errors: ValidationError[];
}

export interface AdminStats {
  totalBookings: number;
  totalUsers: number;
  totalRooms: number;
  todayBookings: number;
  popularRooms: PopularRoom[];
  hourlyData: HourlyData[];
}

export interface PopularRoom {
  _id: Types.ObjectId;
  name: string;
  building: string;
  count: number;
}

export interface HourlyData {
  _id: string;
  count: number;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  booking: unknown | null;
}

export interface SlotUpdatedPayload {
  roomId: Types.ObjectId | string;
  date: string;
  startTime: string;
  available: boolean;
}
