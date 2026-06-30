/**
 * facultyService.js — Faculty & Staff API calls
 *
 * Replaces the inline `api` object + `apiFetch` helper in FacultyandStaff.jsx.
 * Built on apiClient so auth headers, timeout, and 204 handling are automatic.
 *
 * All functions return the standard apiClient shape:
 *   { data: T|null, ok: boolean, status: number|null, error: string|null }
 *
 * Usage:
 *   import * as facultyService from "@/services/facultyService";
 *
 *   const { data, ok } = await facultyService.listFaculty();
 *   const { data, ok } = await facultyService.getFaculty(id);
 *   const { data, ok } = await facultyService.createFaculty(form);
 *   const { data, ok } = await facultyService.updateFaculty(id, form);
 *   const { ok }       = await facultyService.archiveFaculty(id);
 *   const { ok }       = await facultyService.deleteFaculty(id);
 */

import apiClient from "../apiClient";

/* ─── Response normalisers ─────────────────────────────────── */

/**
 * Unwrap a list response — accepts raw array or { data: [] }.
 */
function normaliseList(result) {
  if (!result.ok || result.data === null) return result;
  const raw = result.data;
  const rows = Array.isArray(raw) ? raw : raw?.data ?? [];
  return { ...result, data: rows };
}

/**
 * Unwrap a single-item response — accepts raw object or { data: {} }.
 */
function normaliseOne(result) {
  if (!result.ok || result.data === null) return result;
  const raw = result.data;
  return { ...result, data: raw?.data ?? raw };
}

/* ══════════════════════════════════════════════════════════════
   FACULTY ENDPOINTS
══════════════════════════════════════════════════════════════ */

/**
 * GET /faculty
 * Fetch all faculty and staff records.
 * @returns {Promise<{ data: Faculty[]|null, ok: boolean, ... }>}
 */
export async function listFaculty() {
  const result = await apiClient.get("/faculty");
  return normaliseList(result);
}

/**
 * GET /faculty/:id
 * Fetch a single faculty record by ID.
 * @param {string} id
 * @returns {Promise<{ data: Faculty|null, ok: boolean, ... }>}
 */
export async function getFaculty(id) {
  const result = await apiClient.get(`/faculty/${id}`);
  return normaliseOne(result);
}

/**
 * POST /faculty
 * Create a new faculty record.
 * @param {object} form
 * @returns {Promise<{ data: Faculty|null, ok: boolean, ... }>}
 */
export async function createFaculty(form) {
  const result = await apiClient.post("/faculty", form);
  return normaliseOne(result);
}

/**
 * PUT /faculty/:id
 * Update an existing faculty record.
 * @param {string} id
 * @param {object} form
 * @returns {Promise<{ data: Faculty|null, ok: boolean, ... }>}
 */
export async function updateFaculty(id, form) {
  const result = await apiClient.put(`/faculty/${id}`, form);
  return normaliseOne(result);
}

/**
 * PATCH /faculty/:id/archive
 * Soft-archive a faculty record (sets status: "Inactive" on the backend).
 * @param {string} id
 * @returns {Promise<{ data: null, ok: boolean, ... }>}
 */
export function archiveFaculty(id) {
  return apiClient.patch(`/faculty/${id}/archive`);
}

/**
 * POST /faculty/:id/photo
 * Upload (or replace) a faculty member's profile photo. The photo is then
 * shown both in the admin Faculty and Staff list/view and on the public
 * homepage Faculty section (via Personnel::photo_url).
 * @param {string} id
 * @param {File} file
 * @returns {Promise<{ data: Faculty|null, ok: boolean, ... }>}
 */
export async function uploadFacultyPhoto(id, file) {
  const formData = new FormData();
  formData.append("photo", file);
  const result = await apiClient.post(`/faculty/${id}/photo`, formData);
  return normaliseOne(result);
}