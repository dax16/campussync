import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import './RoomDetail.css';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [slots, setSlots] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [booking, setBooking] = useState({ purpose: '', attendees: 1, notes: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadSlots = useCallback(async () => {
    const [slotsRes, aiRes] = await Promise.allSettled([
      axios.get(`/api/rooms/${id}/availability?date=${date}`),
      axios.get(`/api/bookings/suggest?roomId=${id}&date=${date}`)
    ]);
    if (slotsRes.status === 'fulfilled') setSlots(slotsRes.value.data);
    if (aiRes.status === 'fulfilled') setSuggestions(aiRes.value.data.suggestions || []);
  }, [id, date]);

  useEffect(() => {
    axios.get(`/api/rooms/${id}`).then(res => setRoom(res.data)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit('watchDate', { roomId: id, date });
    socket.on('slotUpdated', (data) => {
      if (data.roomId === id && data.date === date) {
        setSlots(prev => prev.map(s => s.start === data.startTime ? { ...s, available: data.available } : s));
        toast(data.available ? '✅ A slot just opened up!' : '⚠️ A slot was just booked', { duration: 3000 });
      }
    });
    return () => socket.disconnect();
  }, [id, date]);

  const handleBook = async () => {
    if (!selectedSlot) return toast.error('Please select a time slot');
    if (!booking.purpose) return toast.error('Please enter a purpose');
    setSubmitting(true);
    try {
      await axios.post('/api/bookings', {
        roomId: id, date,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        ...booking
      });
      toast.success('Room booked successfully! 🎉');
      setSelectedSlot(null);
      loadSlots();
      navigate('/my-bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!room) return <div className="card">Room not found</div>;

  const demandMap = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-success' };

  return (
    <div className="fade-up room-detail">
      <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm" style={{ marginBottom: 20 }}>← Back</button>

      <div className="room-detail-header card">
        <div>
          <h1>{room.name}</h1>
          <p className="room-location">{room.building} · Floor {room.floor} · Capacity: {room.capacity}</p>
          <div className="amenities-row">
            {room.amenities?.map(a => <span key={a} className="amenity-tag">{a}</span>)}
          </div>
        </div>
        <div className="room-type-badge">
          <span>{room.type?.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-header">
              <h3>Select Date & Time</h3>
              <input type="date" value={date} min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)} style={{ width: 'auto' }} />
            </div>

            {suggestions.length > 0 && (
              <div className="ai-suggestions">
                <p className="ai-label">🤖 AI Recommended Slots</p>
                <div className="suggestion-chips">
                  {suggestions.map((s, i) => (
                    <button key={i} className={`suggestion-chip ${demandMap[s.demand_level]}`}
                      onClick={() => setSelectedSlot(slots.find(sl => sl.start === s.start) || { start: s.start, end: s.end })}>
                      {s.start} <span className="chip-demand">{s.demand_level} demand</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="time-grid">
              {slots.map(slot => (
                <button key={slot.start}
                  className={`slot-btn ${!slot.available ? 'slot-booked' : selectedSlot?.start === slot.start ? 'slot-selected' : 'slot-free'}`}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot)}>
                  {slot.start}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card booking-form">
          <h3>Booking Details</h3>
          {selectedSlot ? (
            <div className="selected-slot-info">
              <span>⏰ {selectedSlot.start} – {selectedSlot.end}</span>
              <span>{new Date(date).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Select a time slot to continue</p>
          )}

          <div className="form-group">
            <label>Purpose *</label>
            <input placeholder="e.g. Group project meeting" value={booking.purpose}
              onChange={e => setBooking({...booking, purpose: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Number of Attendees</label>
            <input type="number" min={1} max={room.capacity} value={booking.attendees}
              onChange={e => setBooking({...booking, attendees: parseInt(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea rows={3} placeholder="Any special requirements..." value={booking.notes}
              onChange={e => setBooking({...booking, notes: e.target.value})} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleBook} disabled={!selectedSlot || submitting}>
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
          <p className="realtime-note">⚡ Live availability — updates in real-time</p>
        </div>
      </div>
    </div>
  );
}
