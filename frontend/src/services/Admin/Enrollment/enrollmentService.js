/**
 * enrollmentService.js — Enrollment-specific API calls
 *
 * Mirrors the inline `api` object that was in Enrollment.jsx, but
 * built on top of apiClient so auth headers and timeouts are handled
 * automatically — consistent with dashboardService.
 *
 * Usage:
 *   import * as enrollmentService from "@/services/enrollmentService";
 *
 *   const { data, ok } = await enrollmentService.listEnrollees();
 *   const { data, ok } = await enrollmentService.createEnrollee(form);
 *   const { data, ok } = await enrollmentService.updateEnrollee(id, form);
 *   const { ok }       = await enrollmentService.archiveEnrollee(id);
 *   const { ok }       = await enrollmentService.bulkArchiveEnrollees([id1, id2]);
 *   const { ok }       = await enrollmentService.deleteEnrollee(id);
 */

import apiClient from "../apiClient";

/* ─── GET /enrollees ───────────────────────────────────────── */
/**
 * Fetch all enrollees.
 * Normalises the response — backend may return a raw array or { data: [] }.
 * @returns {Promise<{ data: Array, ok: boolean, error: string|null }>}
 */

function normaliseEnrollee(row) {
  if (!row) return row;

  return {
    ...row,

    id: row.id,

    learnerId: row.learnerId || row.learner_id || "",

    firstName: row.firstName || row.first_name || "",
    middleName: row.middleName || row.middle_name || "",
    lastName: row.lastName || row.last_name || "",

    birthDate: row.birthDate || row.birth_date || "",

    gradeLevel:
      row.gradeLevel ||
      row.grade_level ||
      row.grade_to_enroll ||
      "",

    contactNumber:
      row.contactNumber ||
      row.contact_number ||
      "",

    enrollmentStatus:
      row.enrollmentStatus ||
      row.enrollment_status ||
      "pending",
  };
}
export async function listEnrollees() {
  const result = await apiClient.get("/enrollees");

  if (import.meta.env.DEV) console.log("RAW ENROLLEES API:", result);

  if (!result.ok) return result;

  const rows =
    Array.isArray(result.data)
      ? result.data
      : Array.isArray(result.data?.data)
        ? result.data.data
        : [];

  return {
    ...result,
    data: rows.map(normaliseEnrollee),
  };
}

/* ─── POST /enrollees ──────────────────────────────────────── */
/**
 * Create a new enrollee.
 * @param {object} form - Enrollee form payload
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export async function createEnrollee(form) {
  const payload = {
    first_name: form.first_name || form.firstName || "Pending",
    last_name: form.last_name || form.lastName || "Learner",
    birth_date: form.birth_date || form.birthDate || "2010-01-01",
    sex: (form.sex || "male").toLowerCase(),
    ...form,
  };

const result = await apiClient.post("/enrollees", payload);

if (!result.ok) return result;

const row = result.data?.data || result.data;

return {
  ...result,
  data: normaliseEnrollee(row),
};
}
/* ─── PUT /enrollees/:uuid ───────────────────────────────────── */
/**
 * Update an existing enrollee.
 * @param {string} uuid
 * @param {object} form - Updated fields
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export function updateEnrollee(uuid, form) {
 return apiClient.put(
  `/enrollees/${uuid}`,
  form
).then(result => {
  if (!result.ok) return result;

  const row = result.data?.data || result.data;

  return {
    ...result,
    data: normaliseEnrollee(row),
  };
});
}

/* ─── PATCH /enrollees/:id/archive ────────────────────────── */
/**
 * Archive a single enrollee.
 * @param {string} uuid
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export function archiveEnrollee(id) {
  return apiClient.patch(`/enrollees/${id}/archive`);
}

/* ─── POST /enrollees/bulk-archive ────────────────────────── */
/**
 * Archive multiple enrollees.
 * @param {string[]} ids
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export function bulkArchiveEnrollees(ids) {
  return apiClient.post("/enrollees/bulk-archive", { ids });
}

/* ─── DELETE /enrollees/:id ────────────────────────────────── */
/**
 * Permanently delete an enrollee.
 * @param {string} id
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export function deleteEnrollee(id) {
  return apiClient.delete(`/enrollees/${id}`);
}