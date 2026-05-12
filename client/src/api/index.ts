import axios, { AxiosError } from 'axios';
import type {
  User,
  Room,
  Booking,
  TimeSlot,
  AISuggestion,
  AdminStats,
  AuthResponse,
  RegisterData,
  RoomFilters,
  CreateBookingData,
  CreateRoomData,
} from '../types';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

export { api };

export const setAuthToken = (token: string | null): void => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

type ApiErrorBody = { message?: string; errors?: Array<{ msg: string }> };

export const getApiError = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiErrorBody>;
    const data = axiosErr.response?.data;
    if (data?.message) return data.message;
    if (data?.errors?.length) return data.errors[0]!.msg;
  }
  return fallback;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  me: () => api.get<User>('/api/auth/me'),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { email, password }),
  register: (data: RegisterData) =>
    api.post<AuthResponse>('/api/auth/register', data),
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/api/auth/reset-password', { token, password }),
};

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const roomsApi = {
  list: (filters?: RoomFilters) => api.get<Room[]>('/api/rooms', { params: filters }),
  get: (id: string) => api.get<Room>(`/api/rooms/${id}`),
  availability: (id: string, date: string) =>
    api.get<TimeSlot[]>(`/api/rooms/${id}/availability`, { params: { date } }),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookingsApi = {
  my: () => api.get<Booking[]>('/api/bookings/my'),
  create: (data: CreateBookingData) => api.post<Booking>('/api/bookings', data),
  cancel: (id: string) => api.patch(`/api/bookings/${id}/cancel`),
  suggest: (roomId: string, date: string) =>
    api.get<{ suggestions: AISuggestion[] }>('/api/bookings/suggest', {
      params: { roomId, date },
    }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  stats: () => api.get<AdminStats>('/api/admin/stats'),
  bookings: (page = 1, limit = 50) =>
    api.get<{ bookings: Booking[]; total: number; page: number; pages: number }>(
      '/api/admin/bookings',
      { params: { page, limit } },
    ),
  rooms: () => api.get<Room[]>('/api/admin/rooms'),
  seed: () => api.post('/api/admin/seed'),
  addRoom: (data: CreateRoomData) => api.post<Room>('/api/admin/rooms', data),
  toggleRoom: (id: string) =>
    api.patch<{ _id: string; isActive: boolean }>(`/api/admin/rooms/${id}/toggle-active`),
};
