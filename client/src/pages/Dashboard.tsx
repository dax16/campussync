import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roomsApi, bookingsApi, getApiError } from '../api';
import StatCard from '../components/StatCard';
import LoadingScreen from '../components/LoadingScreen';
import type { Room, Booking } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Computed fresh so it stays accurate if the component is mounted past midnight
    const today = new Date().toISOString().split('T')[0] as string;
    Promise.all([
      bookingsApi.my(),
      roomsApi.list({ date: today }),
    ])
      .then(([b, r]) => {
        setRecentBookings(b.data.slice(0, 3));
        setRooms(r.data.slice(0, 6));
      })
      .catch((err) => setError(getApiError(err, 'Failed to load dashboard')))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0] as string;

  const upcoming = recentBookings.filter(
    (b) => b.date >= today && b.status === 'confirmed'
  ).length;

  const availableNow = rooms.filter((r) => {
    const now = new Date().getHours();
    return !r.bookings?.some(
      (b) => parseInt(b.startTime) <= now && parseInt(b.endTime) > now
    );
  }).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] ?? '';

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</p>
        <button className="btn btn-outline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="dashboard-hero">
        <div>
          <h1>{greeting}, {firstName} 👋</h1>
          <p>Here&apos;s what&apos;s happening on campus today</p>
        </div>
        <Link to="/rooms" className="btn btn-primary">+ Book a Room</Link>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard label="Upcoming Bookings" value={upcoming} color="var(--accent)" />
        <StatCard label="Total Bookings" value={recentBookings.length} color="var(--accent-green)" />
        <StatCard label="Available Now" value={availableNow} sub="rooms open" color="var(--warning)" />
        <StatCard
          label="Semester"
          value={user?.semester ?? '-'}
          sub={user?.program}
          color="var(--accent-warm)"
        />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recent Bookings</h3>
            <Link to="/my-bookings" className="view-all">View all →</Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="empty-state">
              <p>No bookings yet</p>
              <Link to="/rooms" className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
                Browse rooms
              </Link>
            </div>
          ) : (
            <div className="booking-list">
              {recentBookings.map((b) => (
                <div key={b._id} className="booking-item">
                  <div className="booking-room">
                    <p className="room-name">{b.room?.name}</p>
                    <p className="room-building">
                      {b.room?.building} · {b.room?.type?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="booking-time">
                    <p>
                      {new Date(b.date).toLocaleDateString('en-CA', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="time-slot">{b.startTime} – {b.endTime}</p>
                  </div>
                  <span
                    className={`badge badge-${
                      b.status === 'confirmed'
                        ? 'success'
                        : b.status === 'cancelled'
                        ? 'danger'
                        : 'neutral'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Available Today</h3>
            <Link to="/rooms" className="view-all">Find more →</Link>
          </div>
          <div className="rooms-quick">
            {rooms.map((room) => (
              <Link to={`/rooms/${room._id}`} key={room._id} className="room-quick-card">
                <div className="room-quick-info">
                  <p className="room-name">{room.name}</p>
                  <p className="room-building">{room.building} · Capacity: {room.capacity}</p>
                </div>
                <span className={`badge ${room.bookings?.length ? 'badge-warning' : 'badge-success'}`}>
                  {room.bookings?.length ? 'Busy' : 'Free'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
