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
