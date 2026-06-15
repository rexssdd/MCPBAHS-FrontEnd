/**
 * recurringEnrollmentApi.js
 * ─────────────────────────────────────────────────────────────────
 * Handles ALL network communication for the re-enrollment form
 * (returning / "old" students).
 *
 * Responsibilities:
 *   • Build the multipart payload
 *   • Execute the HTTP request
 *   • Normalise success / error shapes into a Result<T, E> union
 *   • Provide a mock fallback for dev environments without a backend
 *
 * Nothing in this file touches React state, the DOM, or UI concerns.
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Constants ──────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const ENDPOINT = "/enrollment/recurring";

const GENERIC_NETWORK_ERROR =
  "A network error occurred. Please check your connection and try again.";

// ─── Types (JSDoc) ──────────────────────────────────────────────

/**
 * @typedef {Object} RecurringEnrollmentFormData
 * All scalar fields collected by OldStudentForm.
 *
 * @property {string}  studentId
 * @property {string}  lrn
 * @property {string}  lastName
 * @property {string}  firstName
 * @property {string}  contactNumber
 * @property {string}  houseNo
 * @property {string}  barangay
 * @property {string}  municipality
 * @property {string}  province
 * @property {string}  zipCode
 * @property {string}  lastGradeLevel
 * @property {string}  section
 * @property {string}  schoolYearLastAttended
 * @property {"Yes"|"No"} is4Ps
 * @property {"Yes"|"No"} isPWD
 * @property {boolean} consentImages
 * @property {boolean} consentData
 */

/**
 * @typedef {Object} RecurringEnrollmentFiles
 * @property {File|null} idPic
 * @property {File|null} reportCard
 */

/**
 * @typedef {{ ok: true;  data: unknown }} SuccessResult
 * @typedef {{ ok: false; error: string }} ErrorResult
 * @typedef {SuccessResult | ErrorResult}  ApiResult
 */

// ─── Payload builder ────────────────────────────────────────────

/**
 * Assembles a multipart/form-data body.
 *
 * All scalar fields travel as a single JSON blob keyed `"data"`.
 * Files are appended individually only when the user selected them.
 *
 * @param {RecurringEnrollmentFormData} formData
 * @param {RecurringEnrollmentFiles}    files
 * @returns {FormData}
 */
function buildPayload(formData, files) {
  const body = new FormData();
  body.append("data", JSON.stringify(formData));

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
 *   3. HTTP status line
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
      "[recurringEnrollmentApi] VITE_API_BASE_URL is not set — using mock submission.\n" +
      "Add it to your .env file to hit the real API:\n" +
      "  VITE_API_BASE_URL=http://localhost:8000/api/v1"
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 900));
  return { ok: true, data: { mock: true } };
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Submits the re-enrollment form to the backend.
 *
 * Returns a discriminated union so callers never need to try/catch:
 *
 *   const result = await submitRecurringEnrollment(formData, files);
 *   if (result.ok) {
 *     // result.data — server response body (object)
 *   } else {
 *     // result.error — user-facing error string
 *   }
 *
 * @param {RecurringEnrollmentFormData} formData
 * @param {RecurringEnrollmentFiles}    files
 * @returns {Promise<ApiResult>}
 */
export async function submitRecurringEnrollment(formData, files) {
  if (!API_BASE) return mockSubmit();

  try {
    const body = buildPayload(formData, files);

    // ⚠ Do NOT set Content-Type — the browser must add the multipart boundary.
    const res = await fetch(`${API_BASE}${ENDPOINT}`, {
      method: "POST",
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

// ✅ ADDED ─────────────────────────────────────────────────────────
// Shared mock delay — mirrors the pattern in mockSubmit()
const delay = ms => new Promise(r => setTimeout(r, ms));

// ─── GET ─────────────────────────────────────────────────────────

/**
 * Fetches an existing re-enrollment record by Student ID or LRN.
 * Used to prefill the form for a returning student.
 *
 * A 404 is treated as "no prior record" (not an error) — the student
 * simply fills in everything from scratch.
 *
 * @param {string} studentId
 * @returns {Promise<ApiResult>}
 */
export async function fetchRecurringEnrollment(studentId) {
  if (!API_BASE) {
    if (import.meta.env.DEV)
      console.info("[recurringEnrollmentApi] fetchRecurringEnrollment() using mock.");
    await delay(500);
    return {
      ok: true,
      data: { studentId, firstName: "Jose", lastName: "Rizal", lrn: "123456789012" },
    };
  }

  try {
    const res = await fetch(`${API_BASE}${ENDPOINT}/${encodeURIComponent(studentId)}`);

    if (!res.ok) {
      if (res.status === 404) return { ok: true, data: null }; // first time → no prefill
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
 * Saves a draft re-enrollment record mid-wizard.
 * Called silently on each "Next →" click; errors are non-blocking.
 *
 * @param {string}                      studentId
 * @param {RecurringEnrollmentFormData} formData
 * @param {RecurringEnrollmentFiles}    files
 * @returns {Promise<ApiResult>}
 */
export async function updateRecurringEnrollment(studentId, formData, files) {
  if (!API_BASE) {
    if (import.meta.env.DEV)
      console.info("[recurringEnrollmentApi] updateRecurringEnrollment() using mock.");
    await delay(300);
    return { ok: true, data: { mock: true, updated: true } };
  }

  try {
    const body = buildPayload(formData, files); // reuses existing builder
    // ⚠ No Content-Type — browser sets multipart boundary
    const res = await fetch(`${API_BASE}${ENDPOINT}/${encodeURIComponent(studentId)}`, {
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
 * Withdraws / cancels a re-enrollment application.
 * Not called from OldStudentForm.jsx directly —
 * exposed for registrar/admin views.
 *
 * @param {string} studentId
 * @returns {Promise<ApiResult>}
 */
export async function deleteRecurringEnrollment(studentId) {
  if (!API_BASE) {
    if (import.meta.env.DEV)
      console.info("[recurringEnrollmentApi] deleteRecurringEnrollment() using mock.");
    await delay(400);
    return { ok: true, data: { mock: true, deleted: true } };
  }

  try {
    const res = await fetch(`${API_BASE}${ENDPOINT}/${encodeURIComponent(studentId)}`, {
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
