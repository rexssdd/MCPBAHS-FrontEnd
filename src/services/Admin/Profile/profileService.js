/**
 * profileService.js
 * Profile domain service — built on top of the project's apiClient.
 *
 * apiClient always resolves (never throws). Every response follows:
 *   { data: T | null, ok: boolean, status: number | null, error: string | null }
 *
 * This service unwraps the envelope: it returns `data` on success and
 * throws an Error (with the server's error message) on failure, so
 * call-sites can keep a simple try/catch pattern and remain unchanged.
 */

import apiClient from "../apiClient";

/* ─────────────────────────────────────────────────────────────────
   INTERNAL HELPERS
───────────────────────────────────────────────────────────────── */

/**
 * Unwrap an apiClient envelope.
 * Returns `data` when ok, throws with the error message otherwise.
 * @template T
 * @param {{ data: T|null, ok: boolean, status: number|null, error: string|null }} envelope
 * @returns {T}
 */
function unwrap(envelope) {
  if (envelope.ok) return envelope.data;
  throw new Error(envelope.error ?? `HTTP ${envelope.status}`);
}

/* ─────────────────────────────────────────────────────────────────
   PROFILE
───────────────────────────────────────────────────────────────── */

/**
 * Fetch the current user's profile.
 *
 * Expected response shape:
 *   { firstName, lastName, email, role, employeeId,
 *     school, department, contactNumber, lastPasswordChange? }
 *
 * @returns {Promise<Profile>}
 */
async function getProfile() {
  return unwrap(await apiClient.get("/profile"));
}

/**
 * Update editable profile fields.
 *
 * @param {{ firstName?: string, lastName?: string, email?: string,
 *           contactNumber?: string, department?: string }} payload
 * @returns {Promise<Profile>}
 */
async function updateProfile(payload) {
  return unwrap(await apiClient.put("/profile", payload));
}

/* ─────────────────────────────────────────────────────────────────
   SECURITY / PASSWORD
───────────────────────────────────────────────────────────────── */

/**
 * Change the current user's password.
 *
 * The server is expected to return a 200 with a JSON body on success,
 * or a non-2xx status with an optional { message } body on failure.
 * apiClient surfaces the latter as an Error whose message matches what
 * the original inline fetch code forwarded to the UI.
 *
 * @param {{ currentPassword: string, newPassword: string }} payload
 * @returns {Promise<{ message?: string }>}
 */
async function changePassword(payload) {
  return unwrap(await apiClient.post("/profile/change-password", payload));
}

/* ─────────────────────────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────────────────────────── */

const profileService = {
  getProfile,
  updateProfile,
  changePassword,
};

export default profileService;