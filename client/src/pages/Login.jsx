import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [mode, setMode] = useState("login"),
    [f, setF] = useState({ name: "", email: "", password: "" }),
    [err, setErr] = useState("");
  const { login } = useAuth(),
    nav = useNavigate(),
    loc = useLocation();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      login(await api(`/auth/${mode}`, { method: "POST", body: f }));
      nav(loc.state?.from || "/", { replace: true });
    } catch (x) {
      setErr(x.message);
    }
  };
  return (
    <form className="card auth" onSubmit={submit}>
      <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
      <p className="muted">
        {mode === "login"
          ? "Log in to book your slot."
          : "Sign up and start booking in seconds."}
      </p>
      {mode === "register" && (
        <input
          placeholder="Full name"
          required
          value={f.name}
          onChange={set("name")}
        />
      )}
      <input
        type="email"
        placeholder="Email"
        required
        value={f.email}
        onChange={set("email")}
      />
      <input
        type="password"
        placeholder="Password (6+ characters)"
        required
        value={f.password}
        onChange={set("password")}
      />
      {err && <p className="error">{err}</p>}
      <button className="btn">{mode === "login" ? "Log in" : "Sign up"}</button>
      <button
        type="button"
        className="btn ghost"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login"
          ? "New here? Create an account"
          : "Have an account? Log in"}
      </button>
    </form>
  );
}
