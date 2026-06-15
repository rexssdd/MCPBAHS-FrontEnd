/**
 * useAuth.js
 * src/context/useAuth.js
 * ─────────────────────────────────────────────────────────────────
 * useAuth hook — reads login/logout and session state from AuthContext.
 * ─────────────────────────────────────────────────────────────────
 */

import { useContext } from "react";
import { AuthContext } from "./authContextCore";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    if (import.meta.env.DEV) {
      console.warn("[useAuth] AuthProvider is not mounted.");
    }
    return {
      auth: null,
      setAuth: () => {},
      login: () => {},
      logout: () => {},
    };
  }

  return context;
}