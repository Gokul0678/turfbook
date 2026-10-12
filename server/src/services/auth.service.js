const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const { sign } = require("../utils/token");

const result = (u) => ({
  token: sign(u),
  user: { id: u.id, name: u.name, email: u.email, role: u.role },
});

exports.register = async ({ name, email, password }) => {
  if (!name || !email || !password || password.length < 6)
    throw new ApiError(
      400,
      "Name, email and a password of 6+ characters are required",
    );
  const {
    rows: [u],
  } = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, lower($2), $3) RETURNING id, name, email, role",
    [name.trim(), email, await bcrypt.hash(password, 10)],
  );
  return result(u);
};
exports.login = async ({ email = "", password = "" }) => {
  const {
    rows: [u],
  } = await pool.query("SELECT * FROM users WHERE email = lower($1)", [email]);
  if (!u || !(await bcrypt.compare(password, u.password_hash)))
    throw new ApiError(401, "Invalid email or password");
  return result(u);
};
