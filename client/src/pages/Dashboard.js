import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const StatCard = ({ label, value, sub, color }) => (
  <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <p className="stat-value">{value}</p>
    <p className="stat-label">{label}</p>
    {sub && <p className="stat-sub">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [recentBookings, setRecentBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      axios.get('/api/bookings/my'),
      axios.get(`/api/rooms?date=${today}`)
    ]).then(([b, r]) => {
      setRecentBookings(b.data.slice(0, 3));
      setRooms(r.data.slice(0, 6));
    }).finally(() => setLoading(false));
  }, [today]);

  const upcoming = recentBookings.filter(b => b.date >= today && b.status === 'confirmed').length;
  const totalBooked = recentBookings.length;
  const availableNow = rooms.filter(r => !r.bookings?.some(b => {
    const now = new Date().getHours();
    return parseInt(b.startTime) <= now && parseInt(b.endTime) > now;
  })).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="fade-up">
      <div className="dashboard-hero">
        <div>
          <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's what's happening on campus today</p>
        </div>
        <Link to="/rooms" className="btn btn-primary">
          + Book a Room
        </Link>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard label="Upcoming Bookings" value={upcoming} color="var(--accent)" />
        <StatCard label="Total Bookings" value={totalBooked} color="var(--accent-green)" />
        <StatCard label="Available Now" value={availableNow} sub="rooms open" color="var(--warning)" />
        <StatCard label="Semester" value={user?.semester || '-'} sub={user?.program} color="var(--accent-warm)" />
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
              <Link to="/rooms" className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>Browse rooms</Link>
            </div>
          ) : (
            <div className="booking-list">
              {recentBookings.map(b => (
                <div key={b._id} className="booking-item">
                  <div className="booking-room">
                    <p className="room-name">{b.room?.name}</p>
                    <p className="room-building">{b.room?.building} · {b.room?.type?.replace('_', ' ')}</p>
                  </div>
                  <div className="booking-time">
                    <p>{new Date(b.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</p>
                    <p className="time-slot">{b.startTime} – {b.endTime}</p>
                  </div>
                  <span className={`badge badge-${b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'danger' : 'neutral'}`}>
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
            {rooms.map(room => (
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
}
