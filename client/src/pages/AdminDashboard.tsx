import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { adminApi, getApiError } from '../api';
import StatCard from '../components/StatCard';
import LoadingScreen from '../components/LoadingScreen';
import type { AdminStats, Booking, Room, RoomType, CreateRoomData } from '../types';
import './AdminDashboard.css';

interface RoomFormState {
  name: string;
  building: string;
  floor: string;
  capacity: string;
  type: RoomType;
  amenities: string;
  imageUrl: string;
}

const DEFAULT_FORM: RoomFormState = {
  name: '',
  building: '',
  floor: '1',
  capacity: '4',
  type: 'study_room',
  amenities: '',
  imageUrl: '',
};

const STAT_CONFIG = (stats: AdminStats) => [
  { label: 'Total Bookings', value: stats.totalBookings, color: 'var(--accent)' },
  { label: "Today's Bookings", value: stats.todayBookings, color: 'var(--accent-green)' },
  { label: 'Active Rooms', value: stats.totalRooms, color: 'var(--warning)' },
  { label: 'Registered Students', value: stats.totalUsers, color: 'var(--accent-warm)' },
];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingRoom, setSavingRoom] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState<RoomFormState>(DEFAULT_FORM);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoadError(null);
    const [s, b, r] = await Promise.all([
      adminApi.stats(),
      adminApi.bookings(),
      adminApi.rooms(),
    ]);
    setStats(s.data);
    setBookings(b.data.bookings);
    setRooms(r.data);
  }, []);

  useEffect(() => {
    loadDashboard()
      .catch((err) => setLoadError(getApiError(err, 'Failed to load dashboard')))
      .finally(() => setLoading(false));
  }, [loadDashboard]);

  const toggleRoom = async (id: string): Promise<void> => {
    setTogglingId(id);
    try {
      await adminApi.toggleRoom(id);
      await loadDashboard();
    } catch {
      toast.error('Failed to update room status');
    } finally {
      setTogglingId(null);
    }
  };

  const seedRooms = async (): Promise<void> => {
    try {
      await adminApi.seed();
      await loadDashboard();
      toast.success('Rooms seeded successfully!');
    } catch {
      toast.error('Seed failed');
    }
  };

  const addRoom = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSavingRoom(true);

    const payload: CreateRoomData = {
      name: roomForm.name,
      building: roomForm.building,
      floor: Number(roomForm.floor),
      capacity: Number(roomForm.capacity),
      type: roomForm.type,
      amenities: roomForm.amenities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrl: roomForm.imageUrl || undefined,
    };

    try {
      await adminApi.addRoom(payload);
      setRoomForm(DEFAULT_FORM);
      await loadDashboard();
      toast.success('Room added successfully!');
    } catch (err) {
      toast.error(getApiError(err, 'Room add failed'));
    } finally {
      setSavingRoom(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (loadError) {
    return (
      <div className="fade-up">
        <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{loadError}</p>
        <button className="btn btn-outline" onClick={() => { setLoading(true); loadDashboard().catch((err) => setLoadError(getApiError(err, 'Failed to load dashboard'))).finally(() => setLoading(false)); }}>
          Retry
        </button>
      </div>
    );
  }

  const hourlyFormatted = stats?.hourlyData.map((h) => ({ hour: h._id, bookings: h.count })) ?? [];

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Campus resource overview and analytics</p>
        </div>
        <button onClick={seedRooms} className="btn btn-outline btn-sm">Seed Rooms</button>
      </div>

      {stats && (
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {STAT_CONFIG(stats).map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />
          ))}
        </div>
      )}

      <div className="card add-room-card">
        <div className="section-title-row">
          <div>
            <h3>Add Room</h3>
            <p>Create a new active room for students to book</p>
          </div>
        </div>
        <form className="add-room-form" onSubmit={addRoom}>
          <div className="form-field">
            <label>Room Name</label>
            <input
              type="text"
              value={roomForm.name}
              onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
              placeholder="Study Room C"
              required
            />
          </div>
          <div className="form-field">
            <label>Building</label>
            <input
              type="text"
              value={roomForm.building}
              onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
              placeholder="LRC"
              required
            />
          </div>
          <div className="form-field">
            <label>Floor</label>
            <input
              type="number"
              min="0"
              value={roomForm.floor}
              onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label>Capacity</label>
            <input
              type="number"
              min="1"
              value={roomForm.capacity}
              onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label>Type</label>
            <select
              value={roomForm.type}
              onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value as RoomType })}
            >
              <option value="study_room">Study Room</option>
              <option value="meeting_room">Meeting Room</option>
              <option value="computer_lab">Computer Lab</option>
              <option value="lab">Lab</option>
            </select>
          </div>
          <div className="form-field form-field-wide">
            <label>Amenities</label>
            <input
              type="text"
              value={roomForm.amenities}
              onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
              placeholder="Whiteboard, TV Screen, Power Outlets"
            />
          </div>
          <div className="form-field form-field-wide">
            <label>Image URL</label>
            <input
              type="url"
              value={roomForm.imageUrl}
              onChange={(e) => setRoomForm({ ...roomForm, imageUrl: e.target.value })}
              placeholder="https://example.com/room.jpg"
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={savingRoom}>
              {savingRoom ? 'Adding...' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-charts">
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Bookings by Hour</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyFormatted}>
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="bookings" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Most Popular Rooms</h3>
          {stats && stats.popularRooms.length > 0 ? (
            <div className="popular-rooms">
              {stats.popularRooms.map((r, i) => (
                <div key={r._id} className="popular-room-item">
                  <span className="rank">#{i + 1}</span>
                  <div className="popular-room-info">
                    <p className="popular-room-name">{r.name}</p>
                    <p className="popular-room-building">{r.building}</p>
                  </div>
                  <div className="popular-room-bar-wrap">
                    <div
                      className="popular-room-bar"
                      style={{
                        width: `${(r.count / (stats.popularRooms[0].count || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="popular-room-count">{r.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No data yet</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3>Room Inventory</h3>
          <span className="badge badge-neutral">{rooms.length} total</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Room</th><th>Building</th><th>Floor</th>
                <th>Capacity</th><th>Type</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room._id}>
                  <td style={{ fontWeight: 600 }}>{room.name}</td>
                  <td>{room.building}</td>
                  <td>{room.floor}</td>
                  <td>{room.capacity}</td>
                  <td>{room.type.replace('_', ' ')}</td>
                  <td>
                    <span className={`badge badge-${room.isActive !== false ? 'success' : 'danger'}`}>
                      {room.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${room.isActive !== false ? 'btn-outline' : 'btn-primary'}`}
                      disabled={togglingId === room._id}
                      onClick={() => toggleRoom(room._id)}
                    >
                      {togglingId === room._id
                        ? '...'
                        : room.isActive !== false
                        ? 'Deactivate'
                        : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rooms.length === 0 && (
          <div className="empty-state"><p>No rooms added yet</p></div>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Recent Bookings</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th><th>Room</th><th>Date</th><th>Time</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 10).map((b) => (
                <tr key={b._id}>
                  <td>
                    <p style={{ fontWeight: 500, fontSize: 14 }}>{b.user?.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.user?.studentId}</p>
                  </td>
                  <td>{b.room?.name} · {b.room?.building}</td>
                  <td>{b.date.slice(0, 10)}</td>
                  <td>{b.startTime} – {b.endTime}</td>
                  <td>
                    <span className={`badge badge-${b.status === 'confirmed' ? 'success' : 'danger'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
