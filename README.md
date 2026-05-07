# CampusSync 🏫

> Smart Study Room & Resource Booking System for Humber Polytechnic

CampusSync solves a real campus problem — finding and booking study rooms, labs, and meeting spaces in real-time. Built as a full-stack research project showcasing modern web development practices.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔐 JWT Auth | Secure student login & registration |
| 🏢 Room Browser | Filter by type, capacity, and date |
| ⚡ Real-Time | Live availability updates via Socket.io |
| 🤖 AI Suggestions | Python ML microservice predicts best booking times |
| 📊 Admin Dashboard | Usage analytics with charts (Recharts) |
| 📅 Booking Management | Create, view, cancel bookings |

---

## 🛠️ Tech Stack

**Frontend:** React 18, React Router v6, Recharts, Socket.io Client, Axios, React Hot Toast

**Backend:** Node.js, Express.js, MongoDB + Mongoose, Socket.io, JWT + bcrypt

**AI Microservice:** Python 3, Flask, Flask-CORS

**Deployment:** Vercel (frontend) · Render (backend) · Railway (MongoDB)

---

## 📁 Project Structure

```
campussync/
├── client/                   # React frontend
│   └── src/
│       ├── components/       # Layout, shared components
│       ├── context/          # Auth context
│       └── pages/            # Dashboard, Rooms, Bookings, Admin
├── server/                   # Node.js + Express API
│   ├── models/               # Mongoose schemas
│   ├── routes/               # REST API endpoints
│   ├── middleware/           # JWT auth middleware
│   └── socket/               # Socket.io handlers
├── ai-service/               # Python Flask microservice
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Python 3.8+

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/campussync.git
cd campussync
```

### 2. Backend setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### 3. Frontend setup
```bash
cd client
npm install
npm start
```

### 4. AI service setup
```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

### 5. Seed rooms (Admin only)
After registering, manually set your user role to `admin` in MongoDB, then call:
```
POST /api/admin/seed
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register student |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rooms` | List rooms (with filters) |
| GET | `/api/rooms/:id` | Room details |
| GET | `/api/rooms/:id/availability?date=` | Time slot availability |

### Bookings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/my` | My bookings |
| GET | `/api/bookings/suggest?roomId=&date=` | AI slot suggestions |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Campus usage analytics |
| GET | `/api/admin/bookings` | All bookings |
| POST | `/api/admin/rooms` | Add room |
| POST | `/api/admin/seed` | Seed test rooms |

---

## 🤖 AI Service

The Python microservice at `localhost:8000` provides:
- **Demand prediction** — estimates how busy a time slot will be
- **Smart suggestions** — recommends top 3 optimal booking times
- **Day-of-week analysis** — adjusts predictions for weekends/weekdays
- **Insight generation** — plain-English explanations for each suggestion

```
GET /suggest?room_id=<id>&date=<YYYY-MM-DD>
GET /analytics
```

---

## 📦 Deployment

### Frontend (Vercel)
```bash
cd client && npm run build
# Deploy /build folder to Vercel
```

### Backend (Render)
- Connect GitHub repo
- Set root directory: `server`
- Add environment variables from `.env.example`

### AI Service (Render)
- Python environment
- Start command: `python app.py`

---

## 👨‍💻 Author

**Daksh Parekh**
- GitHub: [@parekhd566](https://github.com/parekhd566)
- Email: parekhd566@gmail.com
- Program: ITS — Humber Polytechnic (Winter 2026)

---

## 📄 License

MIT License — free to use for educational purposes
