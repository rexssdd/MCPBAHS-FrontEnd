/**
 * src/services/authService.js
 *
 * Thin wrapper around the auth API used by AuthContext and LoginPage.
 * Centralises login, logout, and token-refresh logic so callers don't
 * need to know the raw API URL or response shape.
 *
 * The actual network calls delegate to loginApi.js which already handles
 * fallback, rate-limit responses, and role validation — this file re-exports
 * that surface with a stable, service-layer name.
 */

export { authenticate, authenticateFallback, getFallbackUsers, logSession } from "../Api/loginApi";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * Call the backend logout endpoint to revoke the current Sanctum token.
 * Always resolves (never throws) so the caller can clean up local state
 * regardless of network status.
 *
 * @param {string|null} token  – Bearer token to revoke
 * @returns {Promise<void>}
 */
export async function logout(token) {
  if (!token) return;
  try {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      credentials: "include",
    });
  } catch {
    // Ignore network errors — the local session is cleared by the caller.
  }
}

/**
 * Validate a stored token by hitting /api/user.
 * Returns the user object on success, null if the token is invalid/expired.
 *
 * @param {string} token
 * @returns {Promise<object|null>}
 */
export async function validateToken(token) {
  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}