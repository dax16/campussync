// ─── Primitives ──────────────────────────────────────────────────────────────

export type RoomType = 'study_room' | 'lab' | 'meeting_room' | 'computer_lab';
export type BookingStatus = 'confirmed' | 'cancelled';
export type UserRole = 'student' | 'admin';
export type DemandLevel = 'high' | 'medium' | 'low';
export type BookingFilter = 'all' | 'upcoming' | 'past';

// ─── Domain Models ────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  role: UserRole;
  semester: number;
  program: string;
}

export interface Room {
  _id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  amenities: string[];
  imageUrl?: string;
  isActive?: boolean;
  bookings?: Booking[];
}

export interface Booking {
  _id: string;
  room?: Room;
  user?: Pick<User, '_id' | 'name' | 'studentId'>;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  purpose: string;
  attendees: number;
  notes?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface AISuggestion {
  start: string;
  end: string;
  demand_level: DemandLevel;
  availability_score: number;
  predicted_demand: number;
  recommendation: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface PopularRoom {
  _id: string;
  name: string;
  building: string;
  count: number;
}

export interface HourlyDataPoint {
  _id: string;
  count: number;
}

export interface AdminStats {
  totalBookings: number;
  todayBookings: number;
  totalRooms: number;
  totalUsers: number;
  hourlyData: HourlyDataPoint[];
  popularRooms: PopularRoom[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  studentId: string;
  program: string;
  semester: number;
}

// ─── API Inputs ───────────────────────────────────────────────────────────────

export interface RoomFilters {
  type?: RoomType | '';
  capacity?: string;
  date?: string;
}

export interface CreateBookingData {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: number;
  notes?: string;
}

export interface CreateRoomData {
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  amenities: string[];
  imageUrl?: string;
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export interface SlotUpdatedEvent {
  roomId: string;
  date: string;
  startTime: string;
  available: boolean;
}
