CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS turfs (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  sport          TEXT NOT NULL,
  location       TEXT NOT NULL,
  price_per_hour NUMERIC(10,2) NOT NULL CHECK (price_per_hour > 0),
  open_hour      SMALLINT NOT NULL CHECK (open_hour BETWEEN 0 AND 23),
  close_hour     SMALLINT NOT NULL CHECK (close_hour BETWEEN 1 AND 24),
  active         BOOLEAN NOT NULL DEFAULT true,
  CHECK (close_hour > open_hour)
);
CREATE TABLE IF NOT EXISTS bookings (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  turf_id      INT NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_hour   SMALLINT NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  price        NUMERIC(10,2) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- The database itself guarantees no double booking, even under concurrent requests.
-- Cancelled rows are excluded so a cancelled slot can be booked again.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_slot ON bookings (turf_id, booking_date, start_hour) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings (user_id, booking_date DESC);
