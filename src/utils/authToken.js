/**
 * Centralized auth storage (SINGLE SOURCE OF TRUTH)
 * Uses only: localStorage["auth"]
 */

const AUTH_KEY = "auth";

/* ─────────────────────────────
   GET AUTH OBJECT
───────────────────────────── */
export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

/* ─────────────────────────────
   GET TOKEN
───────────────────────────── */
export function getAuthToken() {
  return getAuth()?.token || null;
}

/* ─────────────────────────────
   AUTH HEADERS
───────────────────────────── */
export function authHeaders(extraHeaders = {}, isJson = true) {
  const token = getAuthToken();

  return {
    Accept: "application/json",
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}
/* ─────────────────────────────
   SET AUTH (LOGIN)
───────────────────────────── */
export function setAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

/* ─────────────────────────────
   REMOVE AUTH (LOGOUT)
───────────────────────────── */
export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

/* ─────────────────────────────
   CHECK AUTH STATUS
───────────────────────────── */
export function isAuthenticated() {
  return !!getAuthToken();
}