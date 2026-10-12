const h = require("../utils/asyncHandler"),
  svc = require("../services/booking.service"),
  { emitSlots } = require("../socket");

exports.create = h(async (req, res) => {
  const { turfId, date, hours } = req.body;
  const result = await svc.create(req.user.id, req.body);
  emitSlots(turfId, date, hours, "booked"); // realtime: other viewers see the slots turn "booked"
  res.status(201).json(result);
});
exports.mine = h(async (req, res) => res.json(await svc.mine(req.user.id)));
exports.all = h(async (req, res) => res.json(await svc.all(req.query.date)));
exports.cancel = h(async (req, res) => {
  const b = await svc.cancel(req.user, req.params.id);
  emitSlots(b.turf_id, b.date, [b.hour], "available"); // realtime: slot becomes bookable again
  res.json({ cancelled: true });
});
