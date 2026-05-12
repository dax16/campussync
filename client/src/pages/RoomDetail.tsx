import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { roomsApi, bookingsApi, getApiError } from '../api';
import LoadingScreen from '../components/LoadingScreen';
import type { Room, TimeSlot, AISuggestion, DemandLevel, SlotUpdatedEvent } from '../types';
import './RoomDetail.css';

const SOCKET_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

const DEMAND_BADGE: Record<DemandLevel, string> = {
  high: 'badge-danger',
  medium: 'badge-warning',
  low: 'badge-success',
};

interface BookingForm {
  purpose: string;
  attendees: number;
  notes: string;
}

const RoomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    purpose: '',
    attendees: 1,
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const loadSlots = useCallback(async (): Promise<void> => {
    if (!id) return;
    const [slotsRes, aiRes] = await Promise.allSettled([
      roomsApi.availability(id, date),
      bookingsApi.suggest(id, date),
    ]);
    if (slotsRes.status === 'fulfilled') setSlots(slotsRes.value.data);
    if (aiRes.status === 'fulfilled') setSuggestions(aiRes.value.data.suggestions ?? []);
  }, [id, date]);

  useEffect(() => {
    if (!id) return;
    roomsApi
      .get(id)
      .then((res) => setRoom(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  // Create socket once on mount; disconnect on unmount
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    return () => { socketRef.current?.disconnect(); };
  }, []);

  // Subscribe to the current room+date; leave the channel when either changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !id) return;

    socket.emit('watchDate', { roomId: id, date });

    const handler = (data: SlotUpdatedEvent) => {
      if (data.roomId !== id || data.date !== date) return;
      setSlots((prev) =>
        prev.map((s) =>
          s.start === data.startTime ? { ...s, available: data.available } : s
        )
      );
      toast(data.available ? '✅ A slot just opened up!' : '⚠️ A slot was just booked', {
        duration: 3000,
      });
    };

    socket.on('slotUpdated', handler);
    return () => {
      socket.emit('leaveDate', { roomId: id, date });
      socket.off('slotUpdated', handler);
    };
  }, [id, date]);

  const handleBook = async (): Promise<void> => {
    if (!selectedSlot) { toast.error('Please select a time slot'); return; }
    if (!bookingForm.purpose) { toast.error('Please enter a purpose'); return; }
    if (!id) return;

    setSubmitting(true);
    try {
      await bookingsApi.create({
        roomId: id,
        date,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        ...bookingForm,
      });
      toast.success('Room booked successfully! 🎉');
      setSelectedSlot(null);
      loadSlots();
      navigate('/my-bookings');
    } catch (err) {
      toast.error(getApiError(err, 'Booking failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!room) return <div className="card">Room not found</div>;

  return (
    <div className="fade-up room-detail">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline btn-sm"
        style={{ marginBottom: 20 }}
      >
        ← Back
      </button>

      <div className="room-detail-header card">
        <div>
          <h1>{room.name}</h1>
          <p className="room-location">
            {room.building} · Floor {room.floor} · Capacity: {room.capacity}
          </p>
          <div className="amenities-row">
            {room.amenities.map((a) => (
              <span key={a} className="amenity-tag">{a}</span>
            ))}
          </div>
        </div>
        <div className="room-type-badge">
          <span>{room.type.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-header">
              <h3>Select Date &amp; Time</h3>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: 'auto' }}
              />
            </div>

            {suggestions.length > 0 && (
              <div className="ai-suggestions">
                <p className="ai-label">🤖 AI Recommended Slots</p>
                <div className="suggestion-chips">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className={`suggestion-chip ${DEMAND_BADGE[s.demand_level]}`}
                      onClick={() =>
                        setSelectedSlot(
                          slots.find((sl) => sl.start === s.start) ?? {
                            start: s.start,
                            end: s.end,
                            available: true,
                          }
                        )
                      }
                    >
                      {s.start}
                      <span className="chip-demand">{s.demand_level} demand</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="time-grid">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  className={`slot-btn ${
                    !slot.available
                      ? 'slot-booked'
                      : selectedSlot?.start === slot.start
                      ? 'slot-selected'
                      : 'slot-free'
                  }`}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot)}
                >
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
              <span>
                {new Date(date).toLocaleDateString('en-CA', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              Select a time slot to continue
            </p>
          )}

          <div className="form-group">
            <label>Purpose *</label>
            <input
              placeholder="e.g. Group project meeting"
              value={bookingForm.purpose}
              onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Number of Attendees</label>
            <input
              type="number"
              min={1}
              max={room.capacity}
              value={bookingForm.attendees}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, attendees: parseInt(e.target.value, 10) })
              }
            />
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              rows={3}
              placeholder="Any special requirements..."
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleBook}
            disabled={!selectedSlot || submitting}
          >
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
          <p className="realtime-note">⚡ Live availability — updates in real-time</p>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
