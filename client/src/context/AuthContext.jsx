import { createContext, useContext, useState, useCallback } from "react";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() =>
    JSON.parse(localStorage.getItem("turfbook") || "null"),
  );
  const login = useCallback((s) => {
    localStorage.setItem("turfbook", JSON.stringify(s));
    setSession(s);
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem("turfbook");
    setSession(null);
  }, []);
  return (
    <Ctx.Provider
      value={{ user: session?.user, token: session?.token, login, logout }}
    >
      {children}
    </Ctx.Provider>
  );
}
