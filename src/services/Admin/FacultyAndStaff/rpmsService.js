/**
 * rpmsService.js
 * API service layer for the RPMS (Results-Based Performance Management System) feature.
 *
 * Endpoints expected from backend:
 *   GET  /faculty/:id/rpms?schoolYear=2024-2025&quarter=Q3
 *   POST /faculty/:id/rpms/generate   body: { schoolYear, quarter }
 *
 * Both functions return the standard apiClient envelope:
 *   { data: T|null, ok: boolean, status: number|null, error: string|null }
 *
 * WHERE TO ADD:
 *   Import this service inside useFacultyRpms.js (hook) and RpmsModal.jsx (component).
 *   The backend team must implement the two endpoints above.
 */

import apiClient from "../apiClient";

/** Normalise a single-record response */
function normaliseOne(result) {
  if (!result.ok || result.data === null) return result;
  const raw = result.data;
  return { ...result, data: raw?.data ?? raw };
}

/**
 * Fetch an existing RPMS report for a faculty member.
 * GET /faculty/:facultyId/rpms?schoolYear=...&quarter=...
 *
 * @param {string} facultyId
 * @param {{ schoolYear?: string, quarter?: string }} params
 * @returns {Promise<{ data: RpmsReport|null, ok, status, error }>}
 */
export async function getRpmsReport(facultyId, params = {}) {
  if (!facultyId) return { data: null, ok: false, status: null, error: "facultyId is required" };

  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))
  ).toString();

  const path = `/faculty/${facultyId}/rpms${qs ? `?${qs}` : ""}`;
  return normaliseOne(await apiClient.get(path));
}

/**
 * Trigger server-side RPMS data aggregation and return the generated report.
 * POST /faculty/:facultyId/rpms/generate
 *
 * @param {string} facultyId
 * @param {{ schoolYear: string, quarter: string }} payload
 * @returns {Promise<{ data: RpmsReport|null, ok, status, error }>}
 */
export async function generateRpmsReport(facultyId, payload) {
  if (!facultyId) return { data: null, ok: false, status: null, error: "facultyId is required" };
  return normaliseOne(await apiClient.post(`/faculty/${facultyId}/rpms/generate`, payload));
}

/**
 * @typedef {Object} RpmsReport
 * @property {string}    facultyId
 * @property {string}    name
 * @property {string}    schoolYear      e.g. "2024-2025"
 * @property {string}    quarter         "Q1" | "Q2" | "Q3" | "Q4" | "Annual"
 * @property {Rating[]}  ratings
 * @property {number}    finalRating     e.g. 4.39
 * @property {string}    adjectivalRating e.g. "Very Satisfactory"
 * @property {string}    [remarks]
 * @property {string}    generatedAt     ISO date string
 *
 * @typedef {Object} Rating
 * @property {string} indicator
 * @property {number} score       1.0 – 5.0
 */
