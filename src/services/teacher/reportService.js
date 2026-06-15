/**
 * src/services/Teacher/Reports/reportService.js
 *
 * Reports domain service — Teacher edition.
 *
 * Trimmed to the five methods actually called by TeacherReports.jsx:
 *   • healthCheck    — API status bar
 *   • getMyReports   — table data (teacher sees only their own submissions)
 *   • submitReport   — submit a new SF report (with file upload)
 *   • updateReport   — edit or resubmit a Pending / Disapproved report
 *   • downloadReport — download a submitted report file as a Blob
 *
 * Principal-only methods omitted (not callable by a teacher):
 *   evaluateReport (approve / disapprove)
 *
 * Admin-only methods omitted:
 *   deleteReport, archiveReport, bulkDelete
 *
 * All bug-fixes from the original principal service are preserved.
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
 * Content-Type is intentionally omitted when sending FormData so the
 * browser can set the correct multipart boundary automatically.
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
   GET MY REPORTS
   Used by: fetchReports() inside TeacherReports list page.
   Teachers are scoped server-side to their own submissions — the
   endpoint returns only records owned by the authenticated user.
───────────────────────────────────────────────────────────────── */

/**
 * Fetch a paginated, filtered list of the current teacher's reports.
 *
 * FIX: URLSearchParams filter removes undefined, null, AND empty-string
 * values so stale filter state doesn't pollute the query string.
 *
 * @param {{
 *   search?: string,
 *   status?: string,          // "Pending" | "Approved" | "Disapproved" | ""
 *   sf?:     string|number,   // SF form number, e.g. "2" or 2
 *   page?:   number,
 *   limit?:  number
 * }} [params={}]
 * @returns {Promise<{
 *   data:       Report[],
 *   total:      number,
 *   page:       number,
 *   totalPages: number
 * }>}
 */
async function getMyReports(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== ""
      )
    )
  ).toString();

  // /reports/mine keeps the teacher scoped to their own records.
  const path = `/reports/mine${qs ? `?${qs}` : ""}`;
  return unwrap(await apiClient.get(path));
}

/* ─────────────────────────────────────────────────────────────────
   SUBMIT REPORT  (new submission)
   Used by: SubmitReportPage → handleSubmit() when isEdit === false
   Sends multipart/form-data so files are included in the same request.
───────────────────────────────────────────────────────────────── */

/**
 * Submit a new SF report with metadata and one or more uploaded files.
 *
 * @param {{
 *   sfNumber:   number|string,
 *   gradeLevel: string,
 *   section:    string,
 *   month?:     string,        // required only for SF2
 *   schoolYear: string,
 *   notes?:     string,
 *   files:      File[]         // raw File objects from the file input / drop zone
 * }} payload
 * @returns {Promise<Report>}   — the newly created report record
 */
async function submitReport({ sfNumber, gradeLevel, section, month, schoolYear, notes, files }) {
  const body = new FormData();
  // FIX BUG-3: Backend StoreReportRequest validates snake_case keys:
  //   form_type   (not sfNumber)
  //   grade_level (not gradeLevel)
  //   section     ✓ unchanged
  //   school_year (not schoolYear)
  //   month       ✓ unchanged (optional)
  //   notes       ✓ unchanged (optional)
  //   file        — single File, not an array called "files"
  // FIX Bug-A: backend ReportType enum expects "sf1"..."sf10", not "1"..."10".
  // String(sfNumber) produced "1" which fails StoreReportRequest 422 validation.
  body.append("form_type",   `sf${sfNumber}`);
  body.append("grade_level", gradeLevel);
  body.append("section",     section);
  body.append("school_year", schoolYear);
  if (month)  body.append("month",  month);
  if (notes)  body.append("notes",  notes);

  // Backend uses $request->file('file') — single key, first file wins.
  // Attach each file under "file" (last one written wins on the server, but
  // the UI already restricts to a meaningful number of files).
  const rawFiles = (files ?? []).filter(f => f instanceof File);
  if (rawFiles.length > 0) {
    body.append("file", rawFiles[0]);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000); // generous for large files

  try {
    const res = await fetch(`${BASE_URL}/reports`, {
      method:  "POST",
      headers: authHeaders(), // NO Content-Type — let browser set multipart boundary
      body,
      signal:  controller.signal,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message ?? `Submit failed [${res.status}]`);
    }

    return await res.json();
  } catch (err) {
    if (err.name === "AbortError")
      throw new Error("Report submission timed out. Please try again.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* ─────────────────────────────────────────────────────────────────
   UPDATE REPORT  (edit or resubmit)
   Used by: SubmitReportPage → handleSubmit() when isEdit === true.
   Works for both:
     • Editing a Pending report  (status stays "Pending")
     • Resubmitting a Disapproved report  (status resets to "Pending")
   Sends multipart/form-data so replacement files can be included.
───────────────────────────────────────────────────────────────── */

/**
 * Update / resubmit an existing SF report.
 * Resets the status to "Pending" on the server side for both edits and
 * resubmissions — the principal then re-evaluates.
 *
 * @param {string} id   — the report's ID (report.id from state)
 * @param {{
 *   sfNumber?:   number|string,
 *   gradeLevel?: string,
 *   section?:    string,
 *   month?:      string,
 *   schoolYear?: string,
 *   notes?:      string,
 *   files?:      File[]   // only include if the teacher replaced the files
 * }} payload
 * @returns {Promise<Report>}   — the updated report record
 */
async function updateReport(id, { sfNumber, gradeLevel, section, month, schoolYear, notes, files } = {}) {
  const body = new FormData();
  // FIX BUG-3: same snake_case mapping as submitReport — backend validates the same fields.
  // FIX Bug-A: same "sf" prefix as submitReport — backend enum requires it.
  if (sfNumber   != null) body.append("form_type",   `sf${sfNumber}`);
  if (gradeLevel != null) body.append("grade_level", gradeLevel);
  if (section    != null) body.append("section",     section);
  if (schoolYear != null) body.append("school_year", schoolYear);
  if (month      != null) body.append("month",       month);
  if (notes      != null) body.append("notes",       notes);

  // Single "file" key — backend uses $request->file('file').
  const rawFiles = (files ?? []).filter(f => f instanceof File);
  if (rawFiles.length > 0) {
    body.append("file", rawFiles[0]);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(`${BASE_URL}/reports/${id}`, {
      method:  "PATCH",
      headers: authHeaders(),
      body,
      signal:  controller.signal,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message ?? `Update failed [${res.status}]`);
    }

    return await res.json();
  } catch (err) {
    if (err.name === "AbortError")
      throw new Error("Report update timed out. Please try again.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* ─────────────────────────────────────────────────────────────────
   DOWNLOAD REPORT
   Used by: handleDownload() → reportsService.downloadReport()
───────────────────────────────────────────────────────────────── */

/**
 * Download one of the teacher's own submitted report files as a Blob.
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
   EXPORT — only methods used by TeacherReports.jsx
───────────────────────────────────────────────────────────────── */

const reportsService = {
  healthCheck,
  getMyReports,
  submitReport,
  updateReport,
  downloadReport,
};

export default reportsService;  