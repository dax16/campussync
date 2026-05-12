import React, { useState, useEffect, useCallback } from 'react';
import { bookingsApi, getApiError } from '../api';
import LoadingScreen from '../components/LoadingScreen';
import toast from 'react-hot-toast';
import type { Booking, BookingFilter } from '../types';
import './MyBookings.css';

const FILTERS: BookingFilter[] = ['all', 'upcoming', 'past'];

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const res = await bookingsApi.my();
    setBookings(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cancel = async (id: string): Promise<void> => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancellingId(id);
    try {
      await bookingsApi.cancel(id);
      toast.success('Booking cancelled');
      load();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to cancel'));
    } finally {
      setCancellingId(null);
    }
  };

  // Computed fresh each render so it stays accurate past midnight
  const today = new Date().toISOString().split('T')[0] as string;

  const filtered = bookings.filter((b) => {
    if (filter === 'upcoming') return b.date >= today && b.status === 'confirmed';
    if (filter === 'past') return b.date < today || b.status !== 'confirmed';
    return true;
  });

  if (loading) return <LoadingScreen />;

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Manage your room reservations</p>
      </div>

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
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
          {filtered.map((b) => (
            <div key={b._id} className="booking-card card">
              <div className="booking-card-left">
                <div className="booking-date-block">
                  <span className="booking-month">
                    {new Date(b.date).toLocaleDateString('en-CA', { month: 'short' })}
                  </span>
                  <span className="booking-day">{new Date(b.date).getDate()}</span>
                  <span className="booking-dow">
                    {new Date(b.date).toLocaleDateString('en-CA', { weekday: 'short' })}
                  </span>
                </div>
              </div>
              <div className="booking-card-main">
                <div className="booking-card-header">
                  <div>
                    <h3>{b.room?.name}</h3>
                    <p className="booking-meta">{b.room?.building} · Floor {b.room?.floor}</p>
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
                <div className="booking-details">
                  <span>⏰ {b.startTime} – {b.endTime}</span>
                  <span>👥 {b.attendees} attendees</span>
                  <span>📝 {b.purpose}</span>
                </div>
              </div>
              {b.status === 'confirmed' && b.date >= today && (
                <button
                  onClick={() => cancel(b._id)}
                  className="btn btn-danger btn-sm"
                  disabled={cancellingId === b._id}
                >
                  {cancellingId === b._id ? 'Cancelling...' : 'Cancel'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
