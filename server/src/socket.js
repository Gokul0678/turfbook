const { Server } = require("socket.io");
let io = null;
const room = (turfId, date) => `turf:${turfId}:${date}`;

// Clients join the room of the turf + date they are viewing and receive live slot changes
exports.init = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "*" },
  });
  io.on("connection", (s) => {
    s.on("join", ({ turfId, date } = {}) => {
      if (turfId && typeof date === "string") s.join(room(turfId, date));
    });
    s.on("leave", ({ turfId, date } = {}) => {
      if (turfId && typeof date === "string") s.leave(room(turfId, date));
    });
  });
  return io;
};
// Only public data is broadcast (no user details)
exports.emitSlots = (turfId, date, hours, status) =>
  io &&
  io
    .to(room(turfId, date))
    .emit("slot:update", { turfId: Number(turfId), date, hours, status });
