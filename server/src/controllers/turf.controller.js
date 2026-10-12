const h = require("../utils/asyncHandler"),
  svc = require("../services/turf.service");
exports.list = h(async (req, res) => res.json(await svc.list()));
exports.get = h(async (req, res) => res.json(await svc.get(req.params.id)));
exports.create = h(async (req, res) =>
  res.status(201).json(await svc.create(req.body)),
);
exports.slots = h(async (req, res) =>
  res.json(await svc.slots(req.user.id, req.params.id, req.query.date)),
);
