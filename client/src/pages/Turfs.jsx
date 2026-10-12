import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fmtHour, money, sportIcon } from "../api.js";

export default function Turfs() {
  const [turfs, setTurfs] = useState(null),
    [err, setErr] = useState("");
  useEffect(() => {
    api("/turfs")
      .then(setTurfs)
      .catch((e) => setErr(e.message));
  }, []);
  return (
    <>
      <div className="hero">
        <h1>Book your turf, play your game.</h1>
        <p>
          Pick a turf, see live availability and reserve your hour in seconds.
        </p>
      </div>
      {err && <p className="error">{err}</p>}
      {!turfs && !err && <p className="muted">Loading turfs…</p>}
      <div className="turfGrid">
        {turfs?.map((t) => (
          <Link to={`/turf/${t.id}`} className="card turf" key={t.id}>
            <div className="turfIcon">{sportIcon(t.sport)}</div>
            <span className="tag">{t.sport}</span>
            <h3>{t.name}</h3>
            <p className="muted">📍 {t.location}</p>
            <p className="muted">
              🕒 {fmtHour(t.open_hour)} – {fmtHour(t.close_hour)}
            </p>
            <div className="price">
              {money(t.price_per_hour)}
              <small> / hour</small>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
