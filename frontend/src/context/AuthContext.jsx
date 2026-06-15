// src/context/AuthContext.jsx

import { useState, useEffect, useRef } from "react";
import { AuthContext } from "./authContextCore";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function readStoredAuth() {
  try {
    const stored = localStorage.getItem("auth");
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem("auth");
    return null;
  }
}

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);
  const validated = useRef(false);

  // ─────────────────────────────────────────────
  // Validate token on app load
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (validated.current) return;
    validated.current = true;

    const storedAuth = readStoredAuth();
    if (!storedAuth?.token) return;

    fetch(`${API_BASE}/user`, {
      headers: {
        Authorization: `Bearer ${storedAuth.token}`,
        Accept: "application/json",
      },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("auth");
          setAuth(null);
          window.location.href = "/login";
        }
      })
      .catch(() => {
        // ignore offline/network errors
      });
  }, []);

  // ─────────────────────────────────────────────
  // Sync between tabs
  // ─────────────────────────────────────────────
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "auth") {
        setAuth(readStoredAuth());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  const login = (data) => {
    const normalizedAuth = {
      token: data.token || null,
      role: data.role || null,
      user: data.user || null,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem("auth", JSON.stringify(normalizedAuth));
    setAuth(normalizedAuth);
  };

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("auth");
    setAuth(null);
  };

  // ─────────────────────────────────────────────
  // BACKWARD COMPATIBILITY WRAPPER
  // (IMPORTANT: fixes Sidebar expecting "token")
  // ─────────────────────────────────────────────
  const value = {
    auth,
    setAuth,
    login,
    logout,

    // 👇 ADD THIS so old code won't break
    token: auth?.token || null,
    role: auth?.role || null,
    user: auth?.user || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
