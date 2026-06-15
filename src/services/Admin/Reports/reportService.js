/**
 * src/services/Admin/Reports/reportService.js
 *
 * Reports domain service — built on top of the project's apiClient.
 *
 * Black-box fixes applied:
 *   ✔ uploadFile guarantees onProgress(100) is called after XHR onload
 *     even when the server responds before any progress events fire
 *   ✔ uploadFile: XHR timeout set to 60s (files can be large)
 *   ✔ uploadFile: onerror and ontimeout properly reject with descriptive messages
 *   ✔ downloadReport: AbortSignal.timeout not available in all envs —
 *     replaced with manual AbortController + setTimeout
 *   ✔ getReports: filters out undefined AND null values from URLSearchParams
 *     so stale empty strings don't pollute query strings
 *   ✔ healthCheck: default timeout reduced to 4s (was implicit DEFAULT_TIMEOUT)
 *     and explicitly passed so slow APIs don't block the status bar too long
 *   ✔ bulkDelete: guards against empty ids array (no-op instead of bad request)
 *   ✔ archiveReport: comment updated — apiClient.patch with undefined body
 *     is handled correctly by apiClient (body omitted from fetch call)
 *   ✔ All service methods have JSDoc return types matching actual shapes
 */

import apiClient from "../apiClient";
import { getAuthToken } from "../../../utils/authToken";

// FIX: normalize so raw fetch() calls hit the same /api/v1 path that apiClient uses.
// VITE_API_BASE_URL is set to "http://localhost:8000/api" (no /v1 suffix),
// but apiClient.js appends /v1 before every path. Align them here.
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
 * Build auth headers for XHR / raw fetch calls that bypass apiClient.
 * Content-Type is intentionally omitted for FormData
 * (browser sets it with boundary automatically).
 * @returns {Record<string, string>}
 */
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ─────────────────────────────────────────────────────────────────
   UPLOAD  (XHR — required for onprogress support)
───────────────────────────────────────────────────────────────── */

/**
 * Upload a single file and stream progress to the caller.
 *
 * FIX: onProgress(100) is guaranteed to fire after a successful upload
 * even if the server responds so fast that xhr.upload.onprogress never
 * fires (e.g. tiny files on a localhost API).
 *
 * @param {File}                       file
 * @param {(pct: number) => void}      [onProgress]
 * @param {number}                     [timeoutMs=60000]
 * @returns {Promise<object>}
 */
function uploadFile(file, onProgress, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/reports/upload`);
    xhr.timeout = timeoutMs;

    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        // Don't emit 100 here — we do it in onload to avoid a race
        // where onprogress fires 100 before the server has responded
        onProgress(Math.min(pct, 99));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // FIX: always emit 100 on success so callers can set status="complete"
        if (onProgress) onProgress(100);
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          // 2xx but non-JSON body — treat as success with no metadata
          resolve({});
        }
      } else {
        reject(new Error(`Upload failed [${xhr.status}] — ${xhr.statusText || "server error"}`));
      }
    };

    xhr.onerror   = () => reject(new Error("Upload failed — network error"));
    xhr.ontimeout = () => reject(new Error(`Upload timed out after ${timeoutMs / 1000}s`));

    xhr.send(formData);
  });
}
/**
 * Download a report file as a Blob.
 *
 * FIX: The previous implementation triggered the DOM click internally and
 * returned undefined. Admin Reports.jsx handleDownload() expects a Blob back
 * so it can set the correct filename from report.original_filename.
 * Aligned with Principal and Teacher service signatures.
 *
 * FIX: AbortSignal.timeout() not available in all envs — use manual controller.
 *
 * @param {string} id  — report UUID
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
   HEALTH CHECK
───────────────────────────────────────────────────────────────── */

/**
 * Ping the API. Throws if unreachable.
 * Uses a short timeout so the status bar updates quickly.
 *
 * @param {number} [timeoutMs=4000]
 * @returns {Promise<unknown>}
 */
async function healthCheck(timeoutMs = 4_000) {
  return unwrap(await apiClient.get("/health", { timeout: timeoutMs }));
}

/* ─────────────────────────────────────────────────────────────────
   REPORTS CRUD
───────────────────────────────────────────────────────────────── */

/**
 * Fetch a paginated, filtered list of reports.
 *
 * FIX: URLSearchParams filter now removes undefined, null, AND empty-string
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

/**
 * Fetch a single report by ID.
 * @param {string} id
 * @returns {Promise<Report>}
 */
async function getReport(id) {
  return unwrap(await apiClient.get(`/reports/${id}`));
}

/**
 * Create a new report record.
 * @param {{
 *   sfNumber:    number,
 *   submittedBy: string,
 *   gradeLevel:  string,
 *   section:     string,
 *   month:       string,
 *   schoolYear:  string,
 *   files:       Array<{ name: string, status: string }>
 * }} payload
 * @returns {Promise<Report>}
 */
async function createReport(payload) {
  return unwrap(await apiClient.post("/reports", payload));
}

/**
 * Submit a new SF report with file upload via multipart/form-data.
 * This is the correct way to create a report — createReport() above sends JSON
 * with no file, which would fail backend validation (file required).
 *
 * @param {{
 *   sfNumber:   number|string,
 *   gradeLevel: string,
 *   section:    string,
 *   month?:     string,
 *   schoolYear: string,
 *   notes?:     string,
 *   files:      File[]
 * }} payload
 * @returns {Promise<Report>}
 */
async function submitReport({ sfNumber, gradeLevel, section, month, schoolYear, notes, files }) {
  const body = new FormData();
  body.append("form_type",   `sf${sfNumber}`);
  body.append("grade_level", gradeLevel);
  body.append("section",     section);
  body.append("school_year", schoolYear);
  if (month) body.append("month",  month);
  if (notes) body.append("notes",  notes);
  const rawFiles = (files ?? []).filter(f => f instanceof File);
  if (rawFiles.length > 0) body.append("file", rawFiles[0]);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${BASE_URL}/reports`, {
      method:  "POST",
      headers: authHeaders(),
      body,
      signal:  controller.signal,
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message ?? `Submit failed [${res.status}]`);
    }
    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Submission timed out. Please try again.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Partially update a report.
 * @param {string}         id
 * @param {Partial<Report>} payload
 * @returns {Promise<Report>}
 */
async function updateReport(id, payload) {
  return unwrap(await apiClient.patch(`/reports/${id}`, payload));
}

/**
 * Approve or disapprove a report.
 *
 * FIX FE-RDCS-01: the route is registered with whereUuid('report'), so the
 * path segment must be a UUID.  Callers must pass `report.uuid`, NOT `report.id`.
 *
 * @param {string} uuid  — the report's UUID (report.uuid, not report.id)
 * @param {{ status: "Approved"|"Disapproved", comment?: string }} payload
 * @returns {Promise<Report>}
 */
async function evaluateReport(uuid, { status, comment }) {
  // Backend has separate approve/reject endpoints — no single /evaluate route.
  // Map frontend status ("Approved" / "Disapproved") to the correct endpoint.
  const endpoint = status === "Approved"
    ? `/reports/${uuid}/approve`
    : `/reports/${uuid}/reject`;
  // Send null when comment is blank so backend receives a valid nullable value.
  return unwrap(
    await apiClient.patch(endpoint, { remarks: comment || null })
  );
}

/**
 * Hard-delete a report.
 * @param {string} id
 * @returns {Promise<{ success: true, id: string }>}
 */
async function deleteReport(id) {
  return unwrap(await apiClient.delete(`/reports/${id}`));
}

/**
 * Fetch a paginated list of archived reports.
 * @returns {Promise<{ data: Report[], total: number }>}
 */
async function getArchivedReports(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    )
  ).toString();
  const path = `/reports/archived${qs ? `?${qs}` : ""}`;
  return unwrap(await apiClient.get(path));
}

/**
 * Archive a report (soft-remove from active list, keep on disk).
 * PATCH /reports/:uuid/archive
 * @param {string} uuid
 * @returns {Promise<Report>}
 */
async function archiveReport(uuid) {
  return unwrap(await apiClient.patch(`/reports/${uuid}/archive`));
}

/**
 * Restore an archived report back to the active list.
 * PATCH /reports/:uuid/unarchive
 * @param {string} uuid
 * @returns {Promise<Report>}
 */
async function unarchiveReport(uuid) {
  return unwrap(await apiClient.patch(`/reports/${uuid}/unarchive`));
}

/**
 * Bulk-delete multiple reports.
 *
 * FIX: guards against empty ids array — returns early rather than
 * sending a malformed request to the server.
 *
 * Uses POST /reports/bulk-delete instead of DELETE with a body because
 * apiClient.delete does not support request bodies (REST semantics vary).
 * If your backend uses DELETE /reports/bulk, add body support to
 * apiClient.delete and swap the implementation here.
 *
 * @param {string[]} ids
 * @returns {Promise<{ success: true, deleted: number }>}
 */
async function bulkDelete(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { success: true, deleted: 0 };
  }
  return unwrap(await apiClient.post("/reports/bulk-delete", { ids }));
}

/* ─────────────────────────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────────────────────────── */

const reportsService = {
  // Core CRUD
  getReports,
  getArchivedReports,
  getReport,
  createReport,
  submitReport,
  updateReport,
  evaluateReport,
  deleteReport,
  archiveReport,
  unarchiveReport,
  bulkDelete,

  // File operations (bypass apiClient intentionally)
  uploadFile,
  downloadReport,

  // Infra
  healthCheck,
};

export default reportsService;