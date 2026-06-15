/**
 * enrollmentService.js — Principal: Enrollment-specific API calls
 *
 * Extends the admin service with approve/reject endpoints while keeping
 * archive and list. Add/Edit/Delete are intentionally excluded — principals
 * are not permitted to mutate enrollment records directly.
 *
 * Usage:
 *   import * as enrollmentService from "@/services/Principal/Enrollment/enrollmentService";
 *
 *   const { data, ok } = await enrollmentService.listEnrollees();
 *   const { ok }       = await enrollmentService.approveEnrollee(id);
 *   const { ok }       = await enrollmentService.rejectEnrollee(id);
 *   const { ok }       = await enrollmentService.bulkApproveEnrollees([id1, id2]);
 *   const { ok }       = await enrollmentService.bulkRejectEnrollees([id1, id2]);
 *   const { ok }       = await enrollmentService.archiveEnrollee(id);
 *   const { ok }       = await enrollmentService.bulkArchiveEnrollees([id1, id2]);
 */

import apiClient from "./apiClient";

/* ─── GET /enrollees ───────────────────────────────────────── */
/**
 * Fetch all enrollees visible to the principal.
 * Normalises the response — backend may return a raw array or { data: [] }.
 * @returns {Promise<{ data: Array, ok: boolean, error: string|null }>}
 */
export async function listEnrollees() {
  const result = await apiClient.get("/enrollees");
  if (!result.ok) return result;

  const normalised = Array.isArray(result.data)
    ? result.data
    : result.data?.data ?? [];

  return { ...result, data: normalised };
}

/* ─── PATCH /enrollees/:id/approve ────────────────────────── */
/**
 * Approve a single enrollment application.
 * Sets the enrollee status to Active.
 * @param {string} id
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export function approveEnrollee(id) {
  return apiClient.patch(`/enrollees/${id}/approve`);
}

/* ─── PATCH /enrollees/:id/reject ─────────────────────────── */
/**
 * Reject a single enrollment application.
 * @param {string} id
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export function rejectEnrollee(id) {
  return apiClient.patch(`/enrollees/${id}/reject`);
}

/* ─── POST /enrollees/bulk-approve ────────────────────────── */
/**
 * Approve multiple enrollment applications in one request.
 * @param {string[]} ids
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export function bulkApproveEnrollees(ids) {
  return apiClient.post("/enrollees/bulk-approve", { ids });
}

/* ─── POST /enrollees/bulk-reject ─────────────────────────── */
/**
 * Reject multiple enrollment applications in one request.
 * @param {string[]} ids
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export function bulkRejectEnrollees(ids) {
  return apiClient.post("/enrollees/bulk-reject", { ids });
}

/* ─── PATCH /enrollees/:id/archive ────────────────────────── */
/**
 * Archive a single enrollee.
 * @param {string} id
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