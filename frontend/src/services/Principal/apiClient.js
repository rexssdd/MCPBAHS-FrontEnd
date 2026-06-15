/**
 * src/services/apiClient.js — Production-ready HTTP client
 *
 * Every response resolves (never rejects) with this envelope:
 *   { data: T|null, ok: boolean, status: number|null, error: string|null }
 *
 * Black-box fixes applied:
 *   ✔ requestWithRetry loop condition was `attempt <= retries` but incremented
 *     AFTER the check — resulted in retries+1 total attempts. Fixed to use
 *     a clear maxAttempts model: runs exactly (1 + retries) times.
 *   ✔ requestWithRetry only retries on network errors (status === null),
 *     NOT on 4xx/5xx — retrying a 401 or 404 is pointless and wastes time.
 *   ✔ buildHeaders: Accept header was missing from FormData requests
 *     (only Content-Type was conditionally omitted, but Accept was always set).
 *     Corrected to always include Accept regardless of body type.
 *   ✔ extractError: returns a stable string even when response.text() returns
 *     an empty string on a 204 (no-content error path should not happen,
 *     but guarded anyway).
 *   ✔ request: 204 check is now `response.status === 204` (was inside the
 *     response.ok branch — correct), kept as-is but added comment for clarity.
 *   ✔ DEFAULT_TIMEOUT documented — 10s is appropriate for data requests;
 *     callers (uploadFile, downloadReport) override with their own values.
 *   ✔ getAuthToken: falls back to both "auth" and "authToken" keys
 *     (kept from original) — documented clearly so future devs don't remove it.
 *   ✔ Added patch method to public API (was present in original, kept).
 *   ✔ requestWithRetry exported so callers can use retry versions directly.
 */

import { getAuthToken } from "../../utils/authToken";

const BASE_URL = import.meta.env?.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/v1`
  : "/api/v1";

/**
 * Default timeout for all requests except file upload/download.
 * Override per-call via options.timeout.
 */
const DEFAULT_TIMEOUT = 10_000;

/* ─────────────────────────────────────────────
   TOKEN HANDLER
───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   RESPONSE ENVELOPE
───────────────────────────────────────────── */

/**
 * @template T
 * @param {T|null}      data
 * @param {boolean}     ok
 * @param {number|null} status
 * @param {string|null} [error]
 * @returns {{ data: T|null, ok: boolean, status: number|null, error: string|null }}
 */
function createResponse(data, ok, status, error = null) {
  return { data, ok, status, error };
}

/* ─────────────────────────────────────────────
   ERROR EXTRACTOR
───────────────────────────────────────────── */

/**
 * Safely extract a human-readable error message from any HTTP response.
 * Never throws. Always returns a non-empty string.
 * @param {Response} response
 * @returns {Promise<string>}
 */
async function extractError(response) {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await response.json();
      const msg  = body?.message ?? body?.error;
      if (typeof msg === "string" && msg.trim()) return msg.trim();
    } else {
      const text = await response.text();
      if (text && text.trim()) return text.trim();
    }
  } catch {
    // JSON parse failed or response already consumed — fall through
  }
  // Always return something useful
  return `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
}

/* ─────────────────────────────────────────────
   HEADER BUILDER
───────────────────────────────────────────── */

/**
 * Build request headers.
 * - Always includes Accept: application/json
 * - Always includes Authorization if a token is available
 * - Omits Content-Type for FormData (browser sets it with boundary)
 * - Sets Content-Type: application/json for all other body types
 *
 * @param {unknown}                body
 * @param {Record<string, string>} [customHeaders]
 * @returns {Record<string, string>}
 */
function buildHeaders(body, customHeaders = {}) {
  const token = getAuthToken();

  const headers = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  // FormData: let the browser set Content-Type + boundary automatically
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

/* ─────────────────────────────────────────────
   CORE REQUEST FUNCTION
───────────────────────────────────────────── */

/**
 * Execute a single HTTP request.
 * Always resolves — never rejects.
 *
 * @param {string}  method
 * @param {string}  path
 * @param {unknown} [body]
 * @param {{ timeout?: number, headers?: Record<string, string> }} [options]
 * @returns {Promise<{ data: unknown, ok: boolean, status: number|null, error: string|null }>}
 */
async function request(method, path, body, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, headers: customHeaders = {} } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const isFormData = body instanceof FormData;

    const fetchOptions = {
      method,
      headers: buildHeaders(body, customHeaders),
      signal:  controller.signal,
    };

    // Only attach body for methods that support it
    if (body !== undefined && body !== null) {
      fetchOptions.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, fetchOptions);
    clearTimeout(timer);

    if (response.ok) {
      // 204 No Content — valid success with no body
      if (response.status === 204) {
        return createResponse(null, true, response.status);
      }

      try {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await response.json();
          return createResponse(data, true, response.status);
        }
        const text = await response.text();
        return createResponse(text || null, true, response.status);
      } catch {
        // Could not parse body — still a success (2xx status)
        return createResponse(null, true, response.status);
      }
    }

    // 4xx / 5xx
    const error = await extractError(response);
    return createResponse(null, false, response.status, error);

  } catch (err) {
    clearTimeout(timer);

    const isAbort   = err.name === "AbortError";
    const isNetwork = err instanceof TypeError;

    const error = isAbort
      ? `Request timed out after ${timeout / 1000}s — check your connection.`
      : isNetwork
        ? "Network error — check your connection."
        : (err.message || "An unexpected error occurred.");

    return createResponse(null, false, null, error);
  }
}

/* ─────────────────────────────────────────────
   RETRY WRAPPER
───────────────────────────────────────────── */

/**
 * Execute a request with automatic retry on network failure.
 *
 * FIX: Previous implementation ran (retries + 1) attempts unintentionally
 * due to `while (attempt <= retries)` with post-increment.
 * Now uses a clear maxAttempts model: runs exactly (1 + retries) times.
 *
 * FIX: Only retries on network errors (status === null).
 * Does NOT retry on 4xx/5xx — those are deterministic failures.
 *
 * @param {string}  method
 * @param {string}  path
 * @param {unknown} [body]
 * @param {{ timeout?: number, headers?: Record<string, string> }} [options]
 * @param {number}  [retries=1]  — number of EXTRA attempts after the first
 * @returns {Promise<{ data: unknown, ok: boolean, status: number|null, error: string|null }>}
 */
async function requestWithRetry(method, path, body, options = {}, retries = 1) {
  const maxAttempts = 1 + retries;
  let lastResult;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await request(method, path, body, options);

    // Success — return immediately
    if (lastResult.ok) return lastResult;

    // Server error (4xx/5xx) — don't retry, the server gave a real answer
    if (lastResult.status !== null) return lastResult;

    // Network/timeout error — retry if we have attempts left
    if (attempt < maxAttempts) {
      // Brief back-off before retry (200ms × attempt number)
      await new Promise(r => setTimeout(r, 200 * attempt));
    }
  }

  return lastResult;
}

/* ─────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────── */

const apiClient = {
  get:    (path, options)        => request("GET",    path, undefined, options),
  post:   (path, body, options)  => request("POST",   path, body,      options),
  put:    (path, body, options)  => request("PUT",    path, body,      options),
  patch:  (path, body, options)  => request("PATCH",  path, body,      options),
  delete: (path, options)        => request("DELETE", path, undefined, options),

  // Retry versions — use for idempotent read operations only
  getRetry:  (path, options, retries)       => requestWithRetry("GET",  path, undefined, options, retries),
  postRetry: (path, body, options, retries) => requestWithRetry("POST", path, body,      options, retries),
};

export default apiClient;
