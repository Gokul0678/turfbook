// Creates a demo admin and sample turfs (safe to run more than once)
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");
(async () => {
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@turfbook.com', $1, 'admin') ON CONFLICT (email) DO NOTHING`,
    [await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10)],
  );
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM turfs");
  if (!rows[0].n) {
    await pool.query(`INSERT INTO turfs (name, sport, location, price_per_hour, open_hour, close_hour) VALUES
      ('Green Arena', 'Football', 'Tiruppur', 1200, 6, 23),
      ('Strike Zone', 'Cricket', 'Avinashi Road, Tiruppur', 1500, 6, 22),
      ('Smash Court', 'Badminton', 'Kangeyam Road, Tiruppur', 500, 7, 22)`);
  }
  console.log(
    "Seeded. Admin login: admin@turfbook.com / admin123 (change it before deploying)",
  );
})()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
