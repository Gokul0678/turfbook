const PG = {
  23505: [409, "Already exists"],
  23503: [409, "Referenced by other records"],
  23514: [400, "A value failed validation"],
  "22P02": [400, "Invalid value"],
};
module.exports = (err, req, res, next) => {
  const [pgStatus, pgMsg] = PG[err.code] || [];
  const status = err.status || pgStatus || 500;
  if (status === 500) console.error(err);
  res
    .status(status)
    .json({ message: err.status ? err.message : pgMsg || "Server error" });
};
