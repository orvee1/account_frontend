"use client";

import { logout as requestLogout } from "@/services/auth";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export function AuthProvider({
  children,
  initialUser = null,
  initialLoading = true,
  skipFetch = false,
}) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (skipFetch) return;

    const fetchUser = async () => {
      try {
        const response = await fetch("/api/backend/user", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user ?? null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [skipFetch]);

  const login = async () => {};

  const logout = async () => {
    try {
      setLoading(true);
      await requestLogout();
      setUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
