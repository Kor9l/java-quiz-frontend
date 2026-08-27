import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    api.get("/api/auth/me")
      .then(setUser)
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    async login(email, password) {
      const data = await api.post("/api/auth/login", { email, password });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    async loginWithToken(token) {
      setToken(token);
      try {
        const me = await api.get("/api/auth/me");
        setUser(me);
        return me;
      } catch (err) {
        setToken(null);
        setUser(null);
        throw err;
      }
    },
    async register(email, password, displayName) {
      const data = await api.post("/api/auth/register", { email, password, displayName });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    logout() {
      setToken(null);
      setUser(null);
    },
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
