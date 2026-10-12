import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, addDays, isoDate, fmtHour, money, sportIcon } from "../api.js";
import { socket } from "../socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const MAX = 4;
const LEGEND = [
  ["available", "Available"],
  ["selected", "Selected"],
  ["mine", "Your booking"],
  ["booked", "Booked"],
  ["past", "Unavailable"],
];

export default function Booking() {
  const { id } = useParams(),
    { token, logout } = useAuth(),
    toast = useToast(),
    nav = useNavigate();
  const [date, setDate] = useState(isoDate()),
    [data, setData] = useState(null),
    [sel, setSel] = useState([]);
  const [live, setLive] = useState(socket.connected),
    [busy, setBusy] = useState(false);
  const pending = useRef([]); // hours this user is booking right now, so our own broadcast is not treated as someone else's

  const load = useCallback(async () => {
    try {
      setData(await api(`/turfs/${id}/slots?date=${date}`, { token }));
    } catch (e) {
      e.status === 401
        ? logout()
        : e.status === 404
          ? nav("/")
          : toast(e.message, "error");
    }
  }, [id, date, token, logout, nav, toast]);
  useEffect(() => {
    setSel([]);
    load();
  }, [load]);

  // Realtime: join the room for this turf + date and apply slot changes made by other users
  useEffect(() => {
    const join = () => {
      setLive(true);
      socket.emit("join", { turfId: Number(id), date });
    };
    const onUpdate = (u) => {
      if (u.turfId !== Number(id) || u.date !== date) return;
      setData(
        (d) =>
          d && {
            ...d,
            slots: d.slots.map((s) =>
              u.hours.includes(s.hour) &&
              s.status !== "past" &&
              s.status !== "mine"
                ? { ...s, status: u.status }
                : s,
            ),
          },
      );
      if (u.status === "booked")
        setSel((cur) => {
          const lost = cur.filter(
            (h) => u.hours.includes(h) && !pending.current.includes(h),
          );
          if (lost.length)
            toast(
              `${lost.map(fmtHour).join(", ")} was just booked by someone else`,
              "error",
            );
          return cur.filter((h) => !lost.includes(h));
        });
    };
    socket.on("connect", join);
    socket.on("disconnect", () => setLive(false));
    socket.on("slot:update", onUpdate);
    socket.connect();
    if (socket.connected) join();
    return () => {
      socket.emit("leave", { turfId: Number(id), date });
      socket.off("connect", join);
      socket.off("slot:update", onUpdate);
      socket.off("disconnect");
    };
  }, [id, date, toast]);
  useEffect(
    () => () => {
      socket.disconnect();
    },
    [],
  );

  const toggle = (s) => {
    if (s.status !== "available") return;
    setSel((cur) =>
      cur.includes(s.hour)
        ? cur.filter((h) => h !== s.hour)
        : cur.length >= MAX
          ? (toast(`You can book up to ${MAX} hours at a time`), cur)
          : [...cur, s.hour].sort((a, b) => a - b),
    );
  };
  const confirm = async () => {
    setBusy(true);
    pending.current = sel;
    try {
      const r = await api("/bookings", {
        method: "POST",
        token,
        body: { turfId: Number(id), date, hours: sel },
      });
      toast(`Booked! ${money(r.total)} · pay at the venue`, "success");
      setSel([]);
    } catch (e) {
      toast(e.message, "error");
    }
    pending.current = [];
    setBusy(false);
    load();
  };

  if (!data) return <p className="muted">Loading slots…</p>;
  const { turf, slots } = data,
    days = Array.from({ length: 7 }, (_, i) => addDays(i));
  const cls = (s) => (sel.includes(s.hour) ? "selected" : s.status);
  return (
    <>
      <div className="row">
        <div>
          <h2>
            {sportIcon(turf.sport)} {turf.name}
          </h2>
          <p className="muted">
            📍 {turf.location} · {money(turf.price_per_hour)} / hour
          </p>
        </div>
        <span className={`live ${live ? "on" : ""}`}>
          {live ? "● Live" : "○ Reconnecting…"}
        </span>
      </div>
      <div className="dates">
        {days.map((d) => {
          const dt = new Date(d + "T00:00:00");
          return (
            <button
              key={d}
              className={`chip ${d === date ? "active" : ""}`}
              onClick={() => setDate(d)}
            >
              <small>
                {dt.toLocaleDateString("en-IN", { weekday: "short" })}
              </small>
              <b>{dt.getDate()}</b>
              <small>
                {dt.toLocaleDateString("en-IN", { month: "short" })}
              </small>
            </button>
          );
        })}
        <input
          type="date"
          min={isoDate()}
          max={addDays(30)}
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
        />
      </div>
      <div className="legend">
        {LEGEND.map(([k, l]) => (
          <span key={k}>
            <i className={`dot ${k}`} />
            {l}
          </span>
        ))}
      </div>
      <div className="slots">
        {slots.map((s) => (
          <button
            key={s.hour}
            className={`slot ${cls(s)}`}
            disabled={s.status !== "available"}
            onClick={() => toggle(s)}
          >
            {fmtHour(s.hour)}
          </button>
        ))}
      </div>
      <div className={`summary ${sel.length ? "show" : ""}`}>
        <div>
          <b>
            {sel.length} hour{sel.length > 1 ? "s" : ""}
          </b>{" "}
          · {sel.map(fmtHour).join(", ")}
          <br />
          <span className="total">
            {money(sel.length * turf.price_per_hour)}
          </span>
        </div>
        <button className="btn" disabled={busy} onClick={confirm}>
          {busy ? "Booking…" : "Confirm booking"}
        </button>
      </div>
    </>
  );
}
