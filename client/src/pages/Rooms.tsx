import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roomsApi, getApiError } from '../api';
import LoadingScreen from '../components/LoadingScreen';
import type { Room, RoomType, RoomFilters } from '../types';
import './Rooms.css';

const TYPE_LABELS: Record<RoomType, string> = {
  study_room: 'Study Room',
  lab: 'Lab',
  meeting_room: 'Meeting Room',
  computer_lab: 'Computer Lab',
};

const TYPE_ICONS: Record<RoomType, string> = {
  study_room: '📚',
  lab: '🔬',
  meeting_room: '🤝',
  computer_lab: '💻',
};

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RoomFilters>({
    type: '',
    capacity: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    roomsApi
      .list(filters)
      .then((res) => setRooms(res.data))
      .catch((err) => setError(getApiError(err, 'Failed to load rooms')))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Find a Room</h1>
        <p>Browse and book available campus spaces</p>
      </div>

      <div className="filters card" style={{ marginBottom: 24 }}>
        <div className="filters-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input
              type="date"
              value={filters.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Room Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as RoomType | '' })}
            >
              <option value="">All Types</option>
              {(Object.entries(TYPE_LABELS) as [RoomType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Min Capacity</label>
            <select
              value={filters.capacity}
              onChange={(e) => setFilters({ ...filters, capacity: e.target.value })}
            >
              <option value="">Any</option>
              <option value="2">2+</option>
              <option value="5">5+</option>
              <option value="10">10+</option>
              <option value="20">20+</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ textAlign: 'center', padding: '32px', marginBottom: 16 }}>
          <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={() => setFilters({ ...filters })}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <LoadingScreen height={200} />
      ) : (
        <div className="grid-3">
          {rooms.map((room) => (
            <Link to={`/rooms/${room._id}`} key={room._id} className="room-card">
              <div className="room-card-header">
                <span className="room-type-icon">{TYPE_ICONS[room.type] ?? '🏢'}</span>
                <span className={`badge ${room.bookings?.length ? 'badge-warning' : 'badge-success'}`}>
                  {room.bookings?.length ? `${room.bookings.length} booked` : 'Available'}
                </span>
              </div>
              <h3 className="room-card-name">{room.name}</h3>
              <p className="room-card-meta">{room.building} · Floor {room.floor}</p>
              <div className="room-card-details">
                <span>👥 {room.capacity} people</span>
                <span>{TYPE_LABELS[room.type]}</span>
              </div>
              <div className="room-amenities">
                {room.amenities.slice(0, 3).map((a) => (
                  <span key={a} className="amenity-tag">{a}</span>
                ))}
              </div>
              <div className="room-card-footer">
                <span className="book-link">View &amp; Book →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && rooms.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🏫</p>
          <p style={{ color: 'var(--text-secondary)' }}>No rooms match your filters</p>
        </div>
      )}
    </div>
  );
};

export default Rooms;
