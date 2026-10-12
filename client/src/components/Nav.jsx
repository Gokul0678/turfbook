import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Nav() {
  const { user, logout } = useAuth();
  return (
    <nav className="nav">
      <Link to="/" className="logo">
        🏟️ TurfBook
      </Link>
      <div className="navLinks">
        <NavLink to="/" end>
          Turfs
        </NavLink>
        {user && <NavLink to="/bookings">My bookings</NavLink>}
        {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
      </div>
      <div className="navUser">
        {user ? (
          <>
            <span className="muted">Hi, {user.name.split(" ")[0]}</span>
            <button className="btn ghost" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" className="btn">
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
