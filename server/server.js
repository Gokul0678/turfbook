const http = require("http");
const app = require("./src/app");
const pool = require("./src/config/db");
const socket = require("./src/socket");
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
socket.init(server);

pool
  .query("SELECT 1")
  .then(() =>
    server.listen(PORT, () =>
      console.log(`API + realtime running on port ${PORT}`),
    ),
  )
  .catch((e) => {
    console.error("PostgreSQL connection failed:", e.message);
    process.exit(1);
  });
