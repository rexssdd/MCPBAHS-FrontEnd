/**
 * teacherProfileService.js
 * Teacher profile domain service — built on top of the project's apiClient.
 *
 * API routes hit:
 *   GET    /teacher/profile                — fetch current teacher's profile
 *   PUT    /teacher/profile                — update editable fields
 *   POST   /teacher/profile/change-password — change password
 *
 * apiClient always resolves (never throws). Every response follows:
 *   { data: T | null, ok: boolean, status: number | null, error: string | null }
 *
 * This service unwraps the envelope: returns `data` on success, throws
 * an Error on failure — call-sites stay clean with try/catch.
 *
 * Teacher profile shape (full):
 * {
 *   firstName:          string
 *   lastName:           string
 *   email:              string
 *   role:               string        // always "Teacher"
 *   employeeId:         string
 *   school:             string
 *   department:         string
 *   contactNumber:      string
 *   subjects:           string        // e.g. "Mathematics, Science"
 *   gradeLevel:         string        // e.g. "Grade 10"
 *   isAdviser:          boolean
 *   advisorySection:    string | null // e.g. "10 - Rizal" or null
 *   lastPasswordChange: string | null // ISO 8601 or null
 * }
 */

import apiClient from "../Admin/apiClient";

/* ─────────────────────────────────────────────────────────────────
   INTERNAL HELPERS
───────────────────────────────────────────────────────────────── */

/**
 * Unwrap an apiClient envelope.
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
 * Fetch the current teacher's profile.
 *
 * @returns {Promise<TeacherProfile>}
 */
async function getProfile() {
  return unwrap(await apiClient.get("/teacher/profile"));
}

/**
 * Update editable teacher profile fields.
 * Only personal contact fields are editable by the teacher;
 * school-assigned fields (subjects, gradeLevel, etc.) are read-only.
 *
 * @param {{
 *   firstName?:     string,
 *   lastName?:      string,
 *   email?:         string,
 *   contactNumber?: string,
 * }} payload
 * @returns {Promise<TeacherProfile>}
 */
async function updateProfile(payload) {
  return unwrap(await apiClient.put("/teacher/profile", payload));
}

/* ─────────────────────────────────────────────────────────────────
   SECURITY / PASSWORD
───────────────────────────────────────────────────────────────── */

/**
 * Change the current teacher's password.
 *
 * @param {{ currentPassword: string, newPassword: string }} payload
 * @returns {Promise<{ message?: string }>}
 */
async function changePassword(payload) {
  return unwrap(await apiClient.post("/teacher/profile/change-password", payload));
}

/* ─────────────────────────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────────────────────────── */

const teacherProfileService = {
  getProfile,
  updateProfile,
  changePassword,
};

export default teacherProfileService;