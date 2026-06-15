/**
 * enrollmentApi.js
 * ─────────────────────────────────────────────────────────────────
 * Handles ALL network communication for the Grade 7 enrollment form.
 *
 * Responsibilities:
 *   • Build the multipart payload
 *   • Execute the HTTP request
 *   • Normalise success / error shapes into a single Result<T, E> type
 *   • Provide a mock fallback for dev environments without a backend
 *
 * Nothing in this file touches React state, the DOM, or UI concerns.
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Constants ──────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const ENDPOINT = "/v1/enrollment/grade7";

// Network / server errors we expose verbatim vs. a generic fallback.
const GENERIC_NETWORK_ERROR =
  "A network error occurred. Please check your connection and try again.";

// ─── Types (JSDoc) ──────────────────────────────────────────────

/**
 * @typedef {Object} EnrollmentFormData
 * All scalar fields collected by the multi-step form.
 * (Mirrors the `EMPTY` default state in G7Form.jsx.)
 */

/**
 * @typedef {Object} EnrollmentFiles
 * @property {File|null} idPic
 * @property {File|null} signature
 * @property {File|null} birthCert
 * @property {File|null} reportCard
 */

/**
 * @typedef {{ ok: true;  data: unknown }}         SuccessResult
 * @typedef {{ ok: false; error: string }}          ErrorResult
 * @typedef {SuccessResult | ErrorResult}           ApiResult
 */

// ─── Payload builder ────────────────────────────────────────────

/**
 * Assembles a multipart/form-data body.
 *
 * All scalar fields travel as a single JSON blob keyed `"data"` so
 * the backend can deserialise them in one step.  Files are appended
 * individually only when the user has actually selected them.
 *
 * @param {EnrollmentFormData} formData
 * @param {EnrollmentFiles}    files
 * @returns {FormData}
 */
function buildPayload(formData, files) {
  const body = new FormData();

  // Scalar fields → one JSON string.
  body.append("data", JSON.stringify(formData));

  // Files → append only when present so the backend doesn't receive
  // empty "blob" parts for optional documents.
  Object.entries(files).forEach(([key, file]) => {
    if (file instanceof File) {
      body.append(key, file, file.name);
    }
  });

  return body;
}

// ─── Response parser ────────────────────────────────────────────

/**
 * Extracts a human-readable error message from a non-2xx Response.
 *
 * Priority:
 *   1. JSON body → `message` or `error` field
 *   2. Raw response text
 *   3. HTTP status line (e.g. "HTTP 422 Unprocessable Entity")
 *
 * @param {Response} res
 * @returns {Promise<string>}
 */
async function parseErrorResponse(res) {
  try {
    const json = await res.json();
    if (json?.message) return json.message;
    if (json?.error)   return json.error;
    return JSON.stringify(json);
  } catch {
    const text = await res.text().catch(() => "");
    return text || `HTTP ${res.status} ${res.statusText}`;
  }
}

// ─── Mock ───────────────────────────────────────────────────────

/**
 * Simulates a successful POST with realistic latency.
 * Active only when VITE_API_BASE_URL is not set.
 *
 * @returns {Promise<ApiResult>}
 */
async function mockSubmit() {
  if (import.meta.env.DEV) {
    console.info(
      "[enrollmentApi] VITE_API_BASE_URL is not set — using mock submission.\n" +
      "Add it to your .env file to hit the real API:\n" +
      "  VITE_API_BASE_URL=http://localhost:8000/api/v1"
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 900));
  return { ok: true, data: { mock: true } };
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Submits the Grade 7 enrollment form to the backend.
 *
 * Returns a discriminated union so callers never need to try/catch:
 *
 *   const result = await submitEnrollment(formData, files);
 *   if (result.ok) {
 *     // result.data — server response body (object)
 *   } else {
 *     // result.error — user-facing error string
 *   }
 *
 * @param {EnrollmentFormData} formData
 * @param {EnrollmentFiles}    files
 * @returns {Promise<ApiResult>}
 */
export async function submitEnrollment(formData, files) {
  // Use mock when running without a configured backend.
  if (!API_BASE) return mockSubmit();

  try {
    const body = buildPayload(formData, files);

    // ⚠ Do NOT set Content-Type manually — the browser must add it
    //   so the multipart boundary is included correctly.
    const res = await fetch(`${API_BASE}${ENDPOINT}`, {
      method: "POST",
      body,
    });

    if (!res.ok) {
      const error = await parseErrorResponse(res);
      return { ok: false, error };
    }

    // Tolerate a 204 No Content or an empty body gracefully.
    const data = await res.json().catch(() => ({}));
    return { ok: true, data };

  } catch (err) {
    // Covers: DNS failure, CORS rejection, user offline, fetch abort, etc.
    const error = err instanceof Error ? err.message : GENERIC_NETWORK_ERROR;
    return { ok: false, error };
  }
}

// ✅ ADDED ─────────────────────────────────────────────────────────
// Shared mock delay — mirrors the pattern used in mockSubmit()
const delay = ms => new Promise(r => setTimeout(r, ms));

// ─── GET ─────────────────────────────────────────────────────────

/**
 * Fetches an existing enrollment record by LRN.
 * Used to prefill the form when the student has a prior application.
 *
 * @param {string} lrn  12-digit Learner Reference Number
 * @returns {Promise<ApiResult>}
 */
export async function fetchEnrollment(lrn) {
  if (!API_BASE) {
    if (import.meta.env.DEV) console.info("[enrollmentApi] fetchEnrollment() using mock.");
    await delay(500);
    // Return a partial prefill so the LRN lookup visibly works in dev.
    return { ok: true, data: { lrn, firstName: "Maria", lastName: "Santos" } };
  }

  try {
    const res = await fetch(`${API_BASE}${ENDPOINT}/${encodeURIComponent(lrn)}`);
    if (!res.ok) {
      // 404 is expected for first-time enrollees — treat as empty, not error.
      if (res.status === 404) return { ok: true, data: null };
      const error = await parseErrorResponse(res);
      return { ok: false, error };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, data };
  } catch (err) {
    const error = err instanceof Error ? err.message : GENERIC_NETWORK_ERROR;
    return { ok: false, error };
  }
}

// ─── PUT ─────────────────────────────────────────────────────────

/**
 * Saves a draft enrollment record mid-wizard.
 * Called silently on each "Next →" click; errors are non-blocking.
 *
 * Reuses buildPayload() so file attachments are included if already chosen.
 *
 * @param {string}             lrn
 * @param {EnrollmentFormData} formData
 * @param {EnrollmentFiles}    files
 * @returns {Promise<ApiResult>}
 */
export async function updateEnrollment(lrn, formData, files) {
  if (!API_BASE) {
    if (import.meta.env.DEV) console.info("[enrollmentApi] updateEnrollment() using mock.");
    await delay(300);
    return { ok: true, data: { mock: true, updated: true } };
  }

  try {
    const body = buildPayload(formData, files);
    // ⚠ No Content-Type header — browser sets multipart boundary
    const res = await fetch(`${API_BASE}${ENDPOINT}/${encodeURIComponent(lrn)}`, {
      method: "PUT",
      body,
    });
    if (!res.ok) {
      const error = await parseErrorResponse(res);
      return { ok: false, error };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, data };
  } catch (err) {
    const error = err instanceof Error ? err.message : GENERIC_NETWORK_ERROR;
    return { ok: false, error };
  }
}

// ─── DELETE ──────────────────────────────────────────────────────

/**
 * Withdraws / cancels a Grade 7 enrollment application.
 * Not called from G7Form.jsx directly — exposed for admin/registrar views.
 *
 * @param {string} lrn
 * @returns {Promise<ApiResult>}
 */
export async function deleteEnrollment(lrn) {
  if (!API_BASE) {
    if (import.meta.env.DEV) console.info("[enrollmentApi] deleteEnrollment() using mock.");
    await delay(400);
    return { ok: true, data: { mock: true, deleted: true } };
  }

  try {
    const res = await fetch(`${API_BASE}${ENDPOINT}/${encodeURIComponent(lrn)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const error = await parseErrorResponse(res);
      return { ok: false, error };
    }
    return { ok: true, data: {} };
  } catch (err) {
    const error = err instanceof Error ? err.message : GENERIC_NETWORK_ERROR;
    return { ok: false, error };
  }
}
