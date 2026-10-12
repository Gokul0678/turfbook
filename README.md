# TurfBook – Realtime Turf Booking (React, Node.js, PostgreSQL, Socket.IO)

Players browse turfs, see live slot availability and book hourly slots. When someone books or cancels, every other user viewing that turf and date sees the slot update instantly, without refreshing.

**Live demo:** _add your Vercel link_ | **API:** _add your Render link_

## Features

- **Realtime availability** with Socket.IO rooms per turf + date (slots change live; a selected slot that gets taken is deselected with a notification)
- **No double booking, guaranteed by the database:** a partial UNIQUE index on `(turf_id, booking_date, start_hour) WHERE status = 'confirmed'`. Multi-slot bookings are one atomic INSERT (all or nothing), and a cancelled slot can be booked again
- Slot grid per day: available / selected / your booking / booked / unavailable (past slots blocked using the venue timezone)
- Book up to 4 hours at a time, up to 30 days ahead; pay-at-venue flow
- My Bookings (upcoming, past, cancelled) with cancellation rules
- Role-based access: **player** and **admin** (add turfs, view and cancel bookings by date)
- JWT authentication, bcrypt password hashing, responsive UI with toasts
- Integration tests, including a concurrent-request race test and a WebSocket test

## Tech Stack

React (Vite, React Router), Node.js, Express.js, PostgreSQL (node-postgres), Socket.IO, JWT, bcryptjs

## Architecture

`routes -> controllers -> services -> PostgreSQL`, plus `middleware/` (auth, role guard, error handler that maps PostgreSQL errors to HTTP statuses) and `socket.js` (realtime rooms). Controllers emit socket events after a successful booking or cancellation.

## API

| Method | Endpoint                                 | Access         |
| ------ | ---------------------------------------- | -------------- |
| POST   | /api/auth/register, /api/auth/login      | Public         |
| GET    | /api/turfs, /api/turfs/:id               | Public         |
| GET    | /api/turfs/:id/slots?date=YYYY-MM-DD     | Logged in      |
| POST   | /api/bookings `{turfId, date, hours:[]}` | Logged in      |
| GET    | /api/bookings/mine                       | Logged in      |
| DELETE | /api/bookings/:id                        | Owner or admin |
| POST   | /api/turfs                               | Admin          |
| GET    | /api/bookings?date=                      | Admin          |

Socket events: client emits `join` / `leave` `{turfId, date}`; server emits `slot:update` `{turfId, date, hours, status}`.

## Run locally

1. Install Node.js 20+ and PostgreSQL. Create databases `turfbook` and `turfbook_test`.
2. Backend:

```bash
cd server
cp .env.example .env       # fill DATABASE_URL, TEST_DATABASE_URL, JWT_SECRET
npm install
npm run migrate            # create tables
npm run seed               # demo admin + 3 turfs (admin@turfbook.com / admin123)
npm test                   # optional
npm run dev                # http://localhost:5000
```

3. Frontend (new terminal): `cd client && npm install && npm run dev` -> http://localhost:5173

To see realtime in action, log in as two different users in two browser windows (one normal, one incognito), open the same turf and date, and book a slot in one window.

## Deploy (free)

Neon or Supabase (PostgreSQL; set `DB_SSL=true`, run `npm run migrate` and `npm run seed`) -> Render (root `server`, start `npm start`; Render supports WebSockets) -> Vercel (root `client`, `VITE_API_URL` = Render URL; `vercel.json` handles routing). Change the seeded admin password before going live.
