export const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw Object.assign(new Error(data.message || "Request failed"), {
      status: res.status,
    });
  return data;
}
export const fmtHour = (h) =>
  `${h % 12 || 12}:00 ${h % 24 >= 12 ? "PM" : "AM"}`;
const h12 = (h) => h % 12 || 12,
  mer = (h) => (h % 24 >= 12 ? "PM" : "AM");
// A slot is named by its start hour but lasts one hour, so show the full range, e.g. "8 - 9 AM" or "11 AM - 12 PM"
export const fmtSlot = (h) =>
  mer(h) === mer(h + 1)
    ? `${h12(h)} – ${h12(h + 1)} ${mer(h + 1)}`
    : `${h12(h)} ${mer(h)} – ${h12(h + 1)} ${mer(h + 1)}`;
// Merges consecutive hours into ranges, e.g. [8, 9] -> "8:00 AM – 10:00 AM"
export const fmtRanges = (hours) => {
  const out = [];
  [...hours]
    .sort((x, y) => x - y)
    .forEach((h) => {
      const last = out[out.length - 1];
      if (last && last.end === h) last.end = h + 1;
      else out.push({ start: h, end: h + 1 });
    });
  return out.map((r) => `${fmtHour(r.start)} – ${fmtHour(r.end)}`).join(", ");
};
export const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
export const sportIcon = (s = "") =>
  ({
    football: "⚽",
    cricket: "🏏",
    badminton: "🏸",
    tennis: "🎾",
    basketball: "🏀",
  })[s.toLowerCase()] || "🏟️";
export const isoDate = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
export const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
};
