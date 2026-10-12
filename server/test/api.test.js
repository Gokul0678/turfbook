// Integration tests use a SEPARATE database (TEST_DATABASE_URL) because tables are truncated
if (!process.env.TEST_DATABASE_URL)
  throw new Error("Set TEST_DATABASE_URL in .env before running tests");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const test = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("fs"),
  path = require("path"),
  http = require("http");
const { io: connect } = require("socket.io-client");
const bcrypt = require("bcryptjs");
const app = require("../src/app"),
  pool = require("../src/config/db"),
  socket = require("../src/socket");
const { now, addDays } = require("../src/utils/time");

let server, base, tokenA, tokenB, admin, turfId;
const date = addDays(now().date, 1);
const call = async (p, { method = "GET", body, token } = {}) => {
  const r = await fetch(base + p, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  return { status: r.status, data: await r.json() };
};
const book = (token, hours, d = date) =>
  call("/bookings", {
    method: "POST",
    token,
    body: { turfId, date: d, hours },
  });

test.before(async () => {
  await pool.query(
    fs.readFileSync(path.join(__dirname, "../db/schema.sql"), "utf8"),
  );
  await pool.query("TRUNCATE users, turfs RESTART IDENTITY CASCADE");
  await pool.query(
    `INSERT INTO users (name,email,password_hash,role) VALUES ('Admin','admin@t.com',$1,'admin')`,
    [await bcrypt.hash("admin123", 4)],
  );
  server = http.createServer(app);
  socket.init(server);
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}/api`;
});
test.after(async () => {
  server.close();
  await pool.end();
});

test("auth and roles", async () => {
  tokenA = (
    await call("/auth/register", {
      method: "POST",
      body: { name: "A", email: "a@t.com", password: "secret1" },
    })
  ).data.token;
  tokenB = (
    await call("/auth/register", {
      method: "POST",
      body: { name: "B", email: "b@t.com", password: "secret1" },
    })
  ).data.token;
  assert.equal(
    (
      await call("/auth/register", {
        method: "POST",
        body: { name: "A", email: "A@t.com", password: "secret1" },
      })
    ).status,
    409,
  );
  admin = (
    await call("/auth/login", {
      method: "POST",
      body: { email: "admin@t.com", password: "admin123" },
    })
  ).data.token;
  const t = {
    name: "Green Arena",
    sport: "Football",
    location: "Tiruppur",
    pricePerHour: 1000,
    openHour: 6,
    closeHour: 22,
  };
  assert.equal(
    (await call("/turfs", { method: "POST", token: tokenA, body: t })).status,
    403,
  );
  const created = await call("/turfs", {
    method: "POST",
    token: admin,
    body: t,
  });
  assert.equal(created.status, 201);
  turfId = created.data.id;
  assert.equal(
    (
      await call("/turfs", {
        method: "POST",
        token: admin,
        body: { ...t, closeHour: 3 },
      })
    ).status,
    400,
  );
  assert.equal((await call(`/turfs/${turfId}/slots?date=${date}`)).status, 401);
});
test("slot grid, booking, validation", async () => {
  const grid = (
    await call(`/turfs/${turfId}/slots?date=${date}`, { token: tokenA })
  ).data;
  assert.equal(grid.slots.length, 16);
  assert.ok(grid.slots.every((s) => s.status === "available"));
  const ok = await book(tokenA, [18, 19]);
  assert.equal(ok.status, 201);
  assert.equal(ok.data.total, 2000);
  assert.equal((await book(tokenB, [19, 20])).status, 409); // 19 is taken
  assert.equal(
    (
      await call(`/turfs/${turfId}/slots?date=${date}`, { token: tokenB })
    ).data.slots.find((s) => s.hour === 20).status,
    "available",
  ); // all-or-nothing
  assert.equal((await book(tokenA, [3])).status, 400); // outside opening hours
  assert.equal((await book(tokenA, [10], addDays(now().date, -1))).status, 400); // past date
  assert.equal((await book(tokenA, [10, 11, 12, 13, 14])).status, 400); // over the limit
  const seenByB = (
    await call(`/turfs/${turfId}/slots?date=${date}`, { token: tokenB })
  ).data.slots;
  assert.equal(seenByB.find((s) => s.hour === 18).status, "booked");
  assert.equal(
    (
      await call(`/turfs/${turfId}/slots?date=${date}`, { token: tokenA })
    ).data.slots.find((s) => s.hour === 18).status,
    "mine",
  );
});
test("concurrent requests cannot double-book a slot", async () => {
  const results = await Promise.all(
    [tokenA, tokenB, tokenA, tokenB].map((t) => book(t, [15])),
  );
  const codes = results.map((r) => r.status).sort();
  assert.deepEqual(codes, [201, 409, 409, 409]);
});
test("realtime updates on booking and cancellation", async () => {
  const client = connect(base.replace("/api", ""), {
    transports: ["websocket"],
  });
  await new Promise((r) => client.on("connect", r));
  client.emit("join", { turfId, date });
  await new Promise((r) => setTimeout(r, 100));
  const next = () => new Promise((r) => client.once("slot:update", r));
  let evt = next();
  await book(tokenB, [8]);
  assert.deepEqual(await evt, { turfId, date, hours: [8], status: "booked" });
  const mine = (await call("/bookings/mine", { token: tokenB })).data;
  evt = next();
  assert.equal(
    (await call(`/bookings/${mine[0].id}`, { method: "DELETE", token: tokenB }))
      .status,
    200,
  );
  assert.deepEqual(await evt, {
    turfId,
    date,
    hours: [8],
    status: "available",
  });
  assert.equal((await book(tokenA, [8])).status, 201); // cancelled slot can be rebooked
  client.close();
});
test("my bookings, cancel rules, admin view", async () => {
  const mine = (await call("/bookings/mine", { token: tokenA })).data;
  assert.ok(mine.length >= 3);
  assert.equal(
    (await call(`/bookings/${mine[0].id}`, { method: "DELETE", token: tokenB }))
      .status,
    404,
  ); // not yours
  assert.equal(
    (await call(`/bookings/${mine[0].id}`, { method: "DELETE", token: tokenA }))
      .status,
    200,
  );
  assert.equal(
    (await call(`/bookings/${mine[0].id}`, { method: "DELETE", token: tokenA }))
      .status,
    400,
  ); // already cancelled
  assert.equal((await call("/bookings", { token: tokenA })).status, 403);
  const all = (await call(`/bookings?date=${date}`, { token: admin })).data;
  assert.ok(all.length >= 3 && all[0].player);
});
