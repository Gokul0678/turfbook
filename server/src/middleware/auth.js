const ApiError = require("../utils/ApiError");
const { verify } = require("../utils/token");

exports.auth = (req, res, next) => {
  try {
    const p = verify((req.headers.authorization || "").replace("Bearer ", ""));
    req.user = { id: p.id, role: p.role };
    next();
  } catch {
    next(new ApiError(401, "Unauthorized"));
  }
};
exports.adminOnly = (req, res, next) =>
  req.user.role === "admin" ? next() : next(new ApiError(403, "Admins only"));
