import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({
    name: '',
    building: '',
    floor: 1,
    capacity: 4,
    type: 'study_room',
    amenities: '',
    imageUrl: ''
  });

  const loadDashboard = async () => {
    const [s, b, r] = await Promise.all([
      axios.get('/api/admin/stats'),
      axios.get('/api/admin/bookings'),
      axios.get('/api/rooms')
    ]);
    setStats(s.data);
    setBookings(b.data);
    setRooms(r.data);
  };

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false));
  }, []);

  const seedRooms = async () => {
    try {
      await axios.post('/api/admin/seed');
      await loadDashboard();
      toast.success('Rooms seeded successfully!');
    } catch { toast.error('Seed failed'); }
  };

  const updateRoomForm = (field, value) => {
    setRoomForm(current => ({ ...current, [field]: value }));
  };

  const addRoom = async (e) => {
    e.preventDefault();
    setSavingRoom(true);

    const payload = {
      ...roomForm,
      floor: Number(roomForm.floor),
      capacity: Number(roomForm.capacity),
      amenities: roomForm.amenities
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    };

    try {
      await axios.post('/api/admin/rooms', payload);
      setRoomForm({
        name: '',
        building: '',
        floor: 1,
        capacity: 4,
        type: 'study_room',
        amenities: '',
        imageUrl: ''
      });
      await loadDashboard();
      toast.success('Room added successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Room add failed');
    } finally {
      setSavingRoom(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const hourlyFormatted = stats?.hourlyData?.map(h => ({ hour: h._id, bookings: h.count })) || [];

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Campus resource overview and analytics</p>
        </div>
        <button onClick={seedRooms} className="btn btn-outline btn-sm">Seed Rooms</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Bookings', value: stats?.totalBookings || 0, color: 'var(--accent)' },
          { label: "Today's Bookings", value: stats?.todayBookings || 0, color: 'var(--accent-green)' },
          { label: 'Active Rooms', value: stats?.totalRooms || 0, color: 'var(--warning)' },
          { label: 'Registered Students', value: stats?.totalUsers || 0, color: 'var(--accent-warm)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ background: 'white', border: '1px solid var(--border)', borderTop: `3px solid ${s.color}`, borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700 }}>{s.value}</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

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
              onChange={e => updateRoomForm('name', e.target.value)}
              placeholder="Study Room C"
              required
            />
          </div>

          <div className="form-field">
            <label>Building</label>
            <input
              type="text"
              value={roomForm.building}
              onChange={e => updateRoomForm('building', e.target.value)}
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
              onChange={e => updateRoomForm('floor', e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Capacity</label>
            <input
              type="number"
              min="1"
              value={roomForm.capacity}
              onChange={e => updateRoomForm('capacity', e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Type</label>
            <select value={roomForm.type} onChange={e => updateRoomForm('type', e.target.value)}>
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
              onChange={e => updateRoomForm('amenities', e.target.value)}
              placeholder="Whiteboard, TV Screen, Power Outlets"
            />
          </div>

          <div className="form-field form-field-wide">
            <label>Image URL</label>
            <input
              type="url"
              value={roomForm.imageUrl}
              onChange={e => updateRoomForm('imageUrl', e.target.value)}
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
              <Bar dataKey="bookings" fill="var(--primary)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Most Popular Rooms</h3>
          {stats?.popularRooms?.length > 0 ? (
            <div className="popular-rooms">
              {stats.popularRooms.map((r, i) => (
                <div key={r._id} className="popular-room-item">
                  <span className="rank">#{i + 1}</span>
                  <div className="popular-room-info">
                    <p className="popular-room-name">{r.name}</p>
                    <p className="popular-room-building">{r.building}</p>
                  </div>
                  <div className="popular-room-bar-wrap">
                    <div className="popular-room-bar" style={{ width: `${(r.count / (stats.popularRooms[0].count || 1)) * 100}%` }} />
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
          <span className="badge badge-neutral">{rooms.length} active</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Building</th>
                <th>Floor</th>
                <th>Capacity</th>
                <th>Type</th>
                <th>Amenities</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room._id}>
                  <td style={{ fontWeight: 600 }}>{room.name}</td>
                  <td>{room.building}</td>
                  <td>{room.floor}</td>
                  <td>{room.capacity}</td>
                  <td>{room.type?.replace('_', ' ')}</td>
                  <td>{room.amenities?.length ? room.amenities.join(', ') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rooms.length === 0 && (
          <div className="empty-state">
            <p>No rooms added yet</p>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Recent Bookings</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Room</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 10).map(b => (
                <tr key={b._id}>
                  <td>
                    <p style={{ fontWeight: 500, fontSize: 14 }}>{b.user?.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.user?.studentId}</p>
                  </td>
                  <td>{b.room?.name} · {b.room?.building}</td>
                  <td>{b.date}</td>
                  <td>{b.startTime} – {b.endTime}</td>
                  <td><span className={`badge badge-${b.status === 'confirmed' ? 'success' : 'danger'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
