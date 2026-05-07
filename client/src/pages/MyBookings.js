import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './MyBookings.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const res = await axios.get('/api/bookings/my');
    setBookings(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await axios.patch(`/api/bookings/${id}/cancel`);
      toast.success('Booking cancelled');
      load();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = bookings.filter(b => {
    if (filter === 'upcoming') return b.date >= today && b.status === 'confirmed';
    if (filter === 'past') return b.date < today || b.status !== 'confirmed';
    return true;
  });

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Manage your room reservations</p>
      </div>

      <div className="filter-tabs">
        {['all', 'upcoming', 'past'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📅</p>
          <p style={{ color: 'var(--text-secondary)' }}>No bookings found</p>
        </div>
      ) : (
        <div className="bookings-list">
          {filtered.map(b => (
            <div key={b._id} className="booking-card card">
              <div className="booking-card-left">
                <div className="booking-date-block">
                  <span className="booking-month">{new Date(b.date).toLocaleDateString('en-CA', { month: 'short' })}</span>
                  <span className="booking-day">{new Date(b.date).getDate()}</span>
                  <span className="booking-dow">{new Date(b.date).toLocaleDateString('en-CA', { weekday: 'short' })}</span>
                </div>
              </div>
              <div className="booking-card-main">
                <div className="booking-card-header">
                  <div>
                    <h3>{b.room?.name}</h3>
                    <p className="booking-meta">{b.room?.building} · Floor {b.room?.floor}</p>
                  </div>
                  <span className={`badge badge-${b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'danger' : 'neutral'}`}>
                    {b.status}
                  </span>
                </div>
                <div className="booking-details">
                  <span>⏰ {b.startTime} – {b.endTime}</span>
                  <span>👥 {b.attendees} attendees</span>
                  <span>📝 {b.purpose}</span>
                </div>
              </div>
              {b.status === 'confirmed' && b.date >= today && (
                <button onClick={() => cancel(b._id)} className="btn btn-danger btn-sm">Cancel</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
