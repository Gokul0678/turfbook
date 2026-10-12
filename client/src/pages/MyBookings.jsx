import { useEffect, useState, useCallback } from "react";
import { api, fmtHour, money, sportIcon } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function MyBookings() {
  const { token, logout } = useAuth(),
    toast = useToast();
  const [list, setList] = useState(null),
    [tab, setTab] = useState("upcoming");
  const load = useCallback(
    () =>
      api("/bookings/mine", { token })
        .then(setList)
        .catch((e) =>
          e.status === 401 ? logout() : toast(e.message, "error"),
        ),
    [token, logout, toast],
  );
  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (b) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      await api(`/bookings/${b.id}`, { method: "DELETE", token });
      toast("Booking cancelled", "success");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };
  if (!list) return <p className="muted">Loading…</p>;
  const start = (b) =>
    new Date(`${b.date}T${String(b.hour).padStart(2, "0")}:00:00`);
  const upcoming = list
    .filter((b) => b.status === "confirmed" && start(b) > new Date())
    .sort((a, b) => start(a) - start(b));
  const past = list.filter((b) => !upcoming.includes(b));
  const shown = tab === "upcoming" ? upcoming : past;
  return (
    <>
      <h2>My bookings</h2>
      <div className="tabs">
        {[
          ["upcoming", `Upcoming (${upcoming.length})`],
          ["past", `Past & cancelled (${past.length})`],
        ].map(([k, l]) => (
          <button
            key={k}
            className={tab === k ? "active" : ""}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="muted">Nothing here yet.</p>}
      {shown.map((b) => (
        <div className="card booking" key={b.id}>
          <div>
            <b>
              {sportIcon(b.sport)} {b.turf}
            </b>
            <p className="muted">
              {new Date(b.date + "T00:00:00").toDateString()} ·{" "}
              {fmtHour(b.hour)} – {fmtHour(b.hour + 1)}
            </p>
          </div>
          <div className="right">
            <b>{money(b.price)}</b>
            {b.status === "cancelled" ? (
              <span className="tag red">Cancelled</span>
            ) : tab === "upcoming" ? (
              <button className="btn ghost danger" onClick={() => cancel(b)}>
                Cancel
              </button>
            ) : (
              <span className="tag">Completed</span>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
