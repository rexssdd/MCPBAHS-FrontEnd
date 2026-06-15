/**
 * transfereeEnrollmentApi.js
 * ─────────────────────────────────────────────────────────────────
 * Handles ALL network communication for the transferee enrollment form.
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
const ENDPOINT = "/enrollment/transferee";

const GENERIC_NETWORK_ERROR =
  "A network error occurred. Please check your connection and try again.";

// ─── Types (JSDoc) ──────────────────────────────────────────────

/**
 * @typedef {Object} TransfereeEnrollmentFormData
 * @property {string}       lrn
 * @property {string}       lastName
 * @property {string}       firstName
 * @property {string}       middleName
 * @property {string}       nameExt
 * @property {string}       birthDate
 * @property {string}       sex
 * @property {string}       age
 * @property {string}       motherTongue
 * @property {string}       religion
 * @property {string}       placeOfBirth
 * @property {"Yes"|"No"}   isIP
 * @property {string}       ipSpecify
 * @property {"Yes"|"No"}   is4Ps
 * @property {string}       householdId
 * @property {"Yes"|"No"}   isPWD
 * @property {string}       houseNo
 * @property {string}       barangay
 * @property {string}       streetName
 * @property {string}       municipality
 * @property {string}       province
 * @property {string}       country
 * @property {string}       zipCode
 * @property {string}       contactNumber
 * @property {string}       fatherLast
 * @property {string}       fatherFirst
 * @property {string}       fatherMiddle
 * @property {string}       fatherExt
 * @property {string}       motherLast
 * @property {string}       motherFirst
 * @property {string}       motherMiddle
 * @property {string}       motherExt
 * @property {string}       previousSchool
 * @property {string}       previousSchoolAddress
 * @property {string}       previousSchoolId
 * @property {string}       lastGradeCompleted
 * @property {string}       lastSyAttended
 * @property {string}       gradeToEnroll
 * @property {string}       reasonForTransfer
 * @property {string}       otherReason
 * @property {"Yes"|"No"}   hasGoodMoral
 * @property {"Yes"|"No"}   hasForm137
 * @property {boolean}      consentImages
 * @property {boolean}      consentData
 */

/**
 * @typedef {Object} TransfereeEnrollmentFiles
 * @property {File|null} idPic
 * @property {File|null} signature
 * @property {File|null} birthCert
 * @property {File|null} form137
 * @property {File|null} goodMoral
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
 * @param {TransfereeEnrollmentFormData} formData
 * @param {TransfereeEnrollmentFiles}    files
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
      "[transfereeEnrollmentApi] VITE_API_BASE_URL is not set — using mock submission.\n" +
      "Add it to your .env file to hit the real API:\n" +
      "  VITE_API_BASE_URL=http://localhost:8000/api/v1"
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 900));
  return { ok: true, data: { mock: true } };
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Submits the transferee enrollment form to the backend.
 *
 * Returns a discriminated union so callers never need to try/catch:
 *
 *   const result = await submitTransfereeEnrollment(formData, files);
 *   if (result.ok) {
 *     // result.data — server response body (object)
 *   } else {
 *     // result.error — user-facing error string
 *   }
 *
 * @param {TransfereeEnrollmentFormData} formData
 * @param {TransfereeEnrollmentFiles}    files
 * @returns {Promise<ApiResult>}
 */
export async function submitTransfereeEnrollment(formData, files) {
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
const delay = ms => new Promise(r => setTimeout(r, ms));

// ─── GET ─────────────────────────────────────────────────────────

/**
 * Fetches a prior transferee application by LRN.
 *
 * Transferees may have a partial record if they started and saved a
 * draft previously, or were pre-registered by their previous school.
 * A 404 means no prior record — the student fills in everything fresh.
 *
 * @param {string} lrn
 * @returns {Promise<ApiResult>}
 */
export async function fetchTransfereeEnrollment(lrn) {
  if (!API_BASE) {
    if (import.meta.env.DEV)
      console.info("[transfereeEnrollmentApi] fetchTransfereeEnrollment() using mock.");
    await delay(500);
    return {
      ok: true,
      data: {
        lrn,
        firstName:      "Juan",
        lastName:       "Dela Cruz",
        previousSchool: "Iligan City National High School",
      },
    };
  }

  try {
    const res = await fetch(`${API_BASE}${ENDPOINT}/${encodeURIComponent(lrn)}`);

    if (!res.ok) {
      if (res.status === 404) return { ok: true, data: null }; // no prior record
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
 * Saves a transferee draft mid-wizard.
 * Called silently on each "Next →" click; errors are non-blocking.
 *
 * Uses LRN as the record key because transferees may not yet have a
 * school-assigned Student ID.  If LRN is blank the call is skipped.
 *
 * @param {string}                       lrn
 * @param {TransfereeEnrollmentFormData} formData
 * @param {TransfereeEnrollmentFiles}    files
 * @returns {Promise<ApiResult>}
 */
export async function updateTransfereeEnrollment(lrn, formData, files) {
  if (!API_BASE) {
    if (import.meta.env.DEV)
      console.info("[transfereeEnrollmentApi] updateTransfereeEnrollment() using mock.");
    await delay(300);
    return { ok: true, data: { mock: true, updated: true } };
  }

  try {
    const body = buildPayload(formData, files); // reuses existing builder
    // ⚠ No Content-Type — browser sets multipart boundary
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
 * Withdraws / cancels a transferee enrollment application.
 * Not called from TransfereeForm.jsx directly —
 * exposed for registrar / admin views.
 *
 * @param {string} lrn
 * @returns {Promise<ApiResult>}
 */
export async function deleteTransfereeEnrollment(lrn) {
  if (!API_BASE) {
    if (import.meta.env.DEV)
      console.info("[transfereeEnrollmentApi] deleteTransfereeEnrollment() using mock.");
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
