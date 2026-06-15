/**
 * userManagementService.js
 * User Management domain service — built on top of the project's apiClient.
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

function unwrap(envelope) {
  if (envelope.ok) return envelope.data;
  throw new Error(envelope.error ?? `HTTP ${envelope.status}`);
}

/* ─────────────────────────────────────────────────────────────────
   USERS CRUD
───────────────────────────────────────────────────────────────── */

async function getUsers(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== "")
    )
  ).toString();

  const path = `/users${qs ? `?${qs}` : ""}`;
  const raw  = unwrap(await apiClient.get(path));
  return Array.isArray(raw) ? raw : raw?.data ?? raw?.users ?? [];
}

async function getUser(id) {
  return unwrap(await apiClient.get(`/users/${id}`));
}

async function createUser(payload) {
  return unwrap(await apiClient.post("/users", payload));
}

async function updateUser(id, payload) {
  return unwrap(await apiClient.put(`/users/${id}`, payload));
}

async function patchUser(id, payload) {
  return unwrap(await apiClient.patch(`/users/${id}`, payload));
}

async function deleteUser(id) {
  return unwrap(await apiClient.delete(`/users/${id}`));
}

async function bulkDelete(ids) {
  return unwrap(await apiClient.post("/users/bulk-delete", { ids }));
}

async function archiveUser(id) {
  return unwrap(await apiClient.patch(`/users/${id}/archive`, {}));
}

async function resetPassword(id, payload) {
  return unwrap(await apiClient.post(`/users/${id}/reset-password`, payload));
}

/* ─────────────────────────────────────────────────────────────────
   ACTIVITY LOGS  (UMSS_004)
───────────────────────────────────────────────────────────────── */

/**
 * Fetch paginated activity logs for a specific user.
 * GET /api/users/:id/activity-logs
 *
 * Query params:
 *   page      {number}  1-based page
 *   limit     {number}  records per page (default 15)
 *   action    {string}  filter by action type
 *   dateFrom  {string}  ISO date — inclusive lower bound
 *   dateTo    {string}  ISO date — inclusive upper bound
 *   search    {string}  free-text across description / ip / device
 *
 * Response always normalised to:
 *   { logs: ActivityLog[], total: number, page: number, totalPages: number }
 *
 * @param {string} userId
 * @param {{ page?:number, limit?:number, action?:string,
 *           dateFrom?:string, dateTo?:string, search?:string }} [params]
 */
async function getActivityLogs(userId, params = {}) {
  if (!userId) throw new Error("userId is required for getActivityLogs");

  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== "")
    )
  ).toString();

  const path = `/users/${userId}/activity-logs${qs ? `?${qs}` : ""}`;
  const raw  = unwrap(await apiClient.get(path));

  // Normalise varied server response shapes
  if (Array.isArray(raw)) {
    return { logs: raw, total: raw.length, page: 1, totalPages: 1 };
  }

  return {
    logs:       Array.isArray(raw?.logs) ? raw.logs : (Array.isArray(raw?.data) ? raw.data : []),
    total:      raw?.total      ?? raw?.count  ?? 0,
    page:       raw?.page       ?? 1,
    totalPages: raw?.totalPages ?? raw?.pages  ?? 1,
  };
}

/* ─────────────────────────────────────────────────────────────────
   AUDIT LOGGING  (non-critical)
───────────────────────────────────────────────────────────────── */

async function logActivity(entry) {
  try {
    return unwrap(await apiClient.post("/activity-logs", entry));
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────────────────────────── */

const userManagementService = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
  bulkDelete,
  archiveUser,
  resetPassword,
  getActivityLogs,
  logActivity,
};

export default userManagementService;