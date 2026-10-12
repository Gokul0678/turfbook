const router = require("express").Router();
const { auth, adminOnly } = require("../middleware/auth");
const authC = require("../controllers/auth.controller"),
  turfC = require("../controllers/turf.controller"),
  bookC = require("../controllers/booking.controller");

router.post("/auth/register", authC.register);
router.post("/auth/login", authC.login);

router.get("/turfs", turfC.list);
router.get("/turfs/:id", turfC.get);
router.get("/turfs/:id/slots", auth, turfC.slots);
router.post("/turfs", auth, adminOnly, turfC.create);

router.post("/bookings", auth, bookC.create);
router.get("/bookings/mine", auth, bookC.mine);
router.get("/bookings", auth, adminOnly, bookC.all);
router.delete("/bookings/:id", auth, bookC.cancel);

module.exports = router;
