import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import Turfs from "./pages/Turfs.jsx";
import Login from "./pages/Login.jsx";
import Booking from "./pages/Booking.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Admin from "./pages/Admin.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function Guard({ children, admin }) {
  const { user } = useAuth(),
    loc = useLocation();
  if (!user)
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Turfs />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/turf/:id"
            element={
              <Guard>
                <Booking />
              </Guard>
            }
          />
          <Route
            path="/bookings"
            element={
              <Guard>
                <MyBookings />
              </Guard>
            }
          />
          <Route
            path="/admin"
            element={
              <Guard admin>
                <Admin />
              </Guard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
