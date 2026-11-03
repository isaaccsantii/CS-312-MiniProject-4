import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

// Shares the signed-in user and one-time "flash" messages with every component,
// replacing res.locals.currentUser and req.session.flash from the EJS version.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true); // true until we know if a session exists
  const [flash, setFlash] = useState(null);

  // On first load, ask the backend whether this browser already has a session.
  useEffect(() => {
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  // Hide a flash message automatically after a few seconds.
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  const showFlash = useCallback((message, type = "success") => setFlash({ message, type, id: Date.now() }), []);

  const signOut = useCallback(async () => {
    try {
      await api.signout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, checking, flash, showFlash, clearFlash: () => setFlash(null), signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
