import { useEffect, useState, useCallback } from "react";
import { api, isoDate, fmtHour, money } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const blank = {
  name: "",
  sport: "Football",
  location: "",
  pricePerHour: "",
  openHour: 6,
  closeHour: 22,
};

export default function Admin() {
  const { token } = useAuth(),
    toast = useToast();
  const [f, setF] = useState(blank),
    [date, setDate] = useState(isoDate()),
    [rows, setRows] = useState([]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const load = useCallback(
    () =>
      api(`/bookings?date=${date}`, { token })
        .then(setRows)
        .catch((e) => toast(e.message, "error")),
    [date, token, toast],
  );
  useEffect(() => {
    load();
  }, [load]);

  const addTurf = async (e) => {
    e.preventDefault();
    try {
      await api("/turfs", { method: "POST", token, body: f });
      toast("Turf added", "success");
      setF(blank);
    } catch (x) {
      toast(x.message, "error");
    }
  };
  const cancel = async (b) => {
    if (!confirm(`Cancel ${b.player}'s booking?`)) return;
    try {
      await api(`/bookings/${b.id}`, { method: "DELETE", token });
      load();
    } catch (x) {
      toast(x.message, "error");
    }
  };
  const active = rows.filter((r) => r.status === "confirmed");
  return (
    <>
      <h2>Admin</h2>
      <form className="card grid" onSubmit={addTurf}>
        <h3 className="wide">Add a turf</h3>
        <input
          placeholder="Turf name"
          required
          value={f.name}
          onChange={set("name")}
        />
        <input
          placeholder="Sport (e.g. Football)"
          required
          value={f.sport}
          onChange={set("sport")}
        />
        <input
          placeholder="Location"
          required
          value={f.location}
          onChange={set("location")}
        />
        <input
          type="number"
          min="1"
          placeholder="Price per hour (₹)"
          required
          value={f.pricePerHour}
          onChange={set("pricePerHour")}
        />
        <label>
          Opens at
          <input
            type="number"
            min="0"
            max="23"
            value={f.openHour}
            onChange={set("openHour")}
          />
        </label>
        <label>
          Closes at
          <input
            type="number"
            min="1"
            max="24"
            value={f.closeHour}
            onChange={set("closeHour")}
          />
        </label>
        <button className="btn wide">Add turf</button>
      </form>
      <div className="row">
        <h3>
          Bookings · {active.length} confirmed ·{" "}
          {money(active.reduce((s, r) => s + r.price, 0))}
        </h3>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          style={{ width: "auto" }}
        />
      </div>
      {rows.length === 0 && <p className="muted">No bookings on this date.</p>}
      {rows.map((b) => (
        <div className="card booking" key={b.id}>
          <div>
            <b>{b.turf}</b> · {fmtHour(b.hour)}
            <p className="muted">
              {b.player} · {b.email}
            </p>
          </div>
          <div className="right">
            {b.status === "cancelled" ? (
              <span className="tag red">Cancelled</span>
            ) : (
              <button className="btn ghost danger" onClick={() => cancel(b)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
