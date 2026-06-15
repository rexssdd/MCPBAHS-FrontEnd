/**
 * src/services/Admin/Reports/reportService.js
 *
 * Reports domain service — Principal edition.
 *
 * Trimmed to the four methods actually called by PrincipalReports.jsx:
 *   • healthCheck    — API status bar
 *   • getReports     — table data (search / filter / page)
 *   • evaluateReport — approve or disapprove a report
 *   • downloadReport — download a report file as a Blob
 *
 * Admin-only methods removed (not called by any Principal view):
 *   createReport, updateReport, deleteReport, archiveReport,
 *   bulkDelete, uploadFile, getReport
 *
 * All bug-fixes from the original service are preserved as-is.
 */

import apiClient from "./apiClient";
import { getAuthToken } from "../../utils/authToken";

// FIX: normalize so raw fetch() calls hit the same /api/v1 path that apiClient uses.
const BASE_URL = (() => {
  const base = import.meta.env?.VITE_API_BASE_URL ?? "/api/v1";
  if (base.endsWith("/v1") || base.endsWith("/v1/")) return base.replace(/\/$/, "");
  return `${base}/v1`;
})();

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

/**
 * Read the Bearer token the same way apiClient does.
 * @returns {string|null}
 */
function getToken() {
  return getAuthToken();
}

/**
 * Build auth headers for raw fetch calls that bypass apiClient.
 * Content-Type is intentionally omitted for FormData.
 * @returns {Record<string, string>}
 */
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ─────────────────────────────────────────────────────────────────
   HEALTH CHECK
   Used by: ApiStatusBar → fetchReports → reportsService.healthCheck()
───────────────────────────────────────────────────────────────── */

/**
 * Ping the API. Throws if unreachable.
 * Uses a short timeout so the status bar updates quickly.
 *
 * FIX: timeout reduced to 4 s (was implicit DEFAULT_TIMEOUT) so slow
 * APIs don't hold up the status bar.
 *
 * @param {number} [timeoutMs=4000]
 * @returns {Promise<unknown>}
 */
async function healthCheck(timeoutMs = 4_000) {
  return unwrap(await apiClient.get("/health", { timeout: timeoutMs }));
}

/* ─────────────────────────────────────────────────────────────────
   GET REPORTS
   Used by: fetchReports() inside PrincipalReports
───────────────────────────────────────────────────────────────── */

/**
 * Fetch a paginated, filtered list of reports.
 *
 * FIX: URLSearchParams filter removes undefined, null, AND empty-string
 * values so stale filter state doesn't pollute the query string.
 *
 * @param {{
 *   search?: string,
 *   status?: string,
 *   sf?:     string,
 *   page?:   number,
 *   limit?:  number
 * }} [params={}]
 * @returns {Promise<{ data: Report[], total: number, page: number, totalPages: number }>}
 */
async function getReports(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== ""
      )
    )
  ).toString();

  const path = `/reports${qs ? `?${qs}` : ""}`;
  return unwrap(await apiClient.get(path));
}

/* ─────────────────────────────────────────────────────────────────
   EVALUATE REPORT
   Used by: EvaluatePage → confirmAction() → reportsService.evaluateReport()
───────────────────────────────────────────────────────────────── */
async function evaluateReport(uuid, { action, comment }) {
  const endpoint =
    action === "approve"
      ? `/reports/${uuid}/approve`
      : `/reports/${uuid}/reject`;

  return unwrap(
    await apiClient.patch(endpoint, {
      remarks: comment?.trim() || "No remarks provided",
    })
  );
}
/* ─────────────────────────────────────────────────────────────────
   DOWNLOAD REPORT
   Used by: handleDownload() → reportsService.downloadReport()
───────────────────────────────────────────────────────────────── */

/**
 * Download a report file as a Blob.
 *
 * FIX: AbortSignal.timeout() is not available in all browser/Node versions.
 * Replaced with a manual AbortController + setTimeout pattern.
 *
 * @param {string} id
 * @param {number} [timeoutMs=30000]
 * @returns {Promise<Blob>}
 */
async function downloadReport(id, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}/reports/${id}/download`, {
      headers: authHeaders(),
      signal:  controller.signal,
    });
    if (!res.ok) throw new Error(`Download failed [${res.status}]`);
    return await res.blob();
  } catch (err) {
    if (err.name === "AbortError")
      throw new Error(`Download timed out after ${timeoutMs / 1000}s`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* ─────────────────────────────────────────────────────────────────
   EXPORT  — only methods used by PrincipalReports.jsx
───────────────────────────────────────────────────────────────── */

const reportsService = {
  healthCheck,
  getReports,
  evaluateReport,
  downloadReport,
};

export default reportsService;