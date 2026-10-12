const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const { now, isDate } = require("../utils/time");

const COLS =
  "id, name, sport, location, price_per_hour::float8 AS price_per_hour, open_hour, close_hour";

exports.list = async () =>
  (await pool.query(`SELECT ${COLS} FROM turfs WHERE active ORDER BY id`)).rows;

exports.get = async (id) => {
  const {
    rows: [t],
  } = await pool.query(`SELECT ${COLS} FROM turfs WHERE id = $1 AND active`, [
    id,
  ]);
  if (!t) throw new ApiError(404, "Turf not found");
  return t;
};

exports.create = async (b) => {
  const price = Number(b.pricePerHour),
    open = Number(b.openHour),
    close = Number(b.closeHour);
  if (!b.name?.trim() || !b.sport?.trim() || !b.location?.trim())
    throw new ApiError(400, "name, sport and location are required");
  if (!(price > 0))
    throw new ApiError(400, "pricePerHour must be greater than 0");
  if (
    !Number.isInteger(open) ||
    !Number.isInteger(close) ||
    open < 0 ||
    close > 24 ||
    close <= open
  )
    throw new ApiError(400, "Invalid opening hours");
  return (
    await pool.query(
      `INSERT INTO turfs (name, sport, location, price_per_hour, open_hour, close_hour) VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${COLS}`,
      [b.name.trim(), b.sport.trim(), b.location.trim(), price, open, close],
    )
  ).rows[0];
};

// Hourly slots for one day: available | booked (someone else) | mine | past
exports.slots = async (userId, turfId, date) => {
  if (!isDate(date)) throw new ApiError(400, "date must be YYYY-MM-DD");
  const turf = await exports.get(turfId);
  const { rows } = await pool.query(
    `SELECT start_hour, user_id FROM bookings WHERE turf_id = $1 AND booking_date = $2 AND status = 'confirmed'`,
    [turfId, date],
  );
  const taken = new Map(rows.map((r) => [r.start_hour, r.user_id]));
  const cur = now();
  const slots = [];
  for (let hour = turf.open_hour; hour < turf.close_hour; hour++) {
    const past = date < cur.date || (date === cur.date && hour <= cur.hour);
    const status = past
      ? "past"
      : taken.has(hour)
        ? taken.get(hour) === userId
          ? "mine"
          : "booked"
        : "available";
    slots.push({ hour, status });
  }
  return { turf, date, slots };
};
