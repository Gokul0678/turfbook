const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const { now, isDate, addDays } = require("../utils/time");
const turfs = require("./turf.service");

const MAX_HOURS = 4,
  MAX_DAYS_AHEAD = 30;
const COLS = `b.id, b.turf_id, t.name AS turf, t.sport, to_char(b.booking_date,'YYYY-MM-DD') AS date, b.start_hour AS hour,
              b.price::float8 AS price, b.status`;

exports.create = async (userId, { turfId, date, hours }) => {
  if (!isDate(date)) throw new ApiError(400, "date must be YYYY-MM-DD");
  if (
    !Array.isArray(hours) ||
    !hours.length ||
    hours.length > MAX_HOURS ||
    !hours.every(Number.isInteger) ||
    new Set(hours).size !== hours.length
  )
    throw new ApiError(400, `Select 1 to ${MAX_HOURS} different hours`);
  const cur = now();
  if (date < cur.date || date > addDays(cur.date, MAX_DAYS_AHEAD))
    throw new ApiError(
      400,
      `Bookings are open for the next ${MAX_DAYS_AHEAD} days`,
    );
  const turf = await turfs.get(turfId);
  if (hours.some((h) => h < turf.open_hour || h >= turf.close_hour))
    throw new ApiError(400, "Selected hour is outside opening hours");
  if (date === cur.date && hours.some((h) => h <= cur.hour))
    throw new ApiError(400, "You cannot book a slot that has already started");
  try {
    // One atomic INSERT: either every selected slot is booked or none is
    const { rows } = await pool.query(
      `INSERT INTO bookings (user_id, turf_id, booking_date, start_hour, price)
       SELECT $1, $2, $3, h, $5 FROM unnest($4::int[]) AS h RETURNING id, start_hour AS hour`,
      [userId, turfId, date, hours, turf.price_per_hour],
    );
    return { bookings: rows, total: turf.price_per_hour * hours.length };
  } catch (e) {
    if (e.code === "23505")
      throw new ApiError(
        409,
        "One or more slots were just booked by someone else",
      );
    throw e;
  }
};

exports.mine = async (userId) =>
  (
    await pool.query(
      `SELECT ${COLS} FROM bookings b JOIN turfs t ON t.id = b.turf_id WHERE b.user_id = $1
                     ORDER BY b.booking_date DESC, b.start_hour DESC`,
      [userId],
    )
  ).rows;

exports.all = async (date) => {
  if (date && !isDate(date)) throw new ApiError(400, "date must be YYYY-MM-DD");
  return (
    await pool.query(
      `SELECT ${COLS}, u.name AS player, u.email FROM bookings b JOIN turfs t ON t.id = b.turf_id JOIN users u ON u.id = b.user_id
      WHERE ($1::date IS NULL OR b.booking_date = $1::date) ORDER BY b.booking_date DESC, b.start_hour`,
      [date || null],
    )
  ).rows;
};

exports.cancel = async (user, id) => {
  const {
    rows: [b],
  } = await pool.query(
    `SELECT id, turf_id, to_char(booking_date,'YYYY-MM-DD') AS date, start_hour AS hour, status, user_id FROM bookings WHERE id = $1`,
    [id],
  );
  if (!b || (b.user_id !== user.id && user.role !== "admin"))
    throw new ApiError(404, "Booking not found");
  if (b.status === "cancelled")
    throw new ApiError(400, "Booking is already cancelled");
  const cur = now();
  if (
    user.role !== "admin" &&
    (b.date < cur.date || (b.date === cur.date && b.hour <= cur.hour))
  )
    throw new ApiError(400, "Past or ongoing bookings cannot be cancelled");
  await pool.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [
    id,
  ]);
  return b;
};
