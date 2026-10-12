const jwt = require("jsonwebtoken");
exports.sign = (u) =>
  jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
exports.verify = (t) => jwt.verify(t, process.env.JWT_SECRET);
