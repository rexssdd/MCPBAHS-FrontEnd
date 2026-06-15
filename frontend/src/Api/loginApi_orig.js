/**
 * ─────────────────────────────────────────────────────────────────
 * All network calls for the Login page.
 *
 *   1. School dashboard data  → fetchSchoolData()
 *   2. Authentication         → authenticate()
 *   3. Audit logging          → logSession()
 *   4. Fallback auth          → authenticateFallback(), getFallbackUsers()
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Constants ──────────────────────────────────────────────────

// ✅ ADDED — all calls go to your backend, never directly to Anthropic
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL ?? import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1\/?$/, "") ?? "http://localhost:8000";
const AUDIT_LOG_KEY = "auditLog";
const PORTAL_NAME   = "M.C.P.B.A.H.S School Management Portal";

const GENERIC_ERROR = "A network error occurred. Please try again.";

const DEFAULT_SCHOOL_DATA = {
  stats:         { students: "4,386", teachers: "24", sections: "48" },
  announcements: { count: 3, latest: "3 new today" },
  enrollment:    { isOpen: true,  label: "Open now" },
  schedule:      { label: "Updated weekly" },
  reports:       { label: "Q3 submitted" },
};

// ─── Types (JSDoc) — unchanged ───────────────────────────────────

/**
 * @typedef {Object} SchoolStats
 * @property {string} students
 * @property {string} teachers
 * @property {string} sections
 *
 * @typedef {Object} SchoolData
 * @property {SchoolStats}                       stats
 * @property {{ count: number; latest: string }} announcements
 * @property {{ isOpen: boolean; label: string }} enrollment
 * @property {{ label: string }}                 schedule
 * @property {{ label: string }}                 reports
 *
 * @typedef {{ success: true;  role: string; token?: string|null; user?: object|null }} AuthSuccess
 * @typedef {{ success: false; reason: string }} AuthFailure
 * @typedef {AuthSuccess | AuthFailure}          AuthResult
 */

// ─── Shared helper ───────────────────────────────────────────────

/**
 * Thin fetch wrapper. Returns parsed JSON or throws with a clean message.
 * Never leaks raw fetch errors to callers — they all get a string.
 *
 * @param {string} path     — relative path, e.g. "/api/school/dashboard"
 * @param {RequestInit} [options]
 * @returns {Promise<unknown>}
 */
async function apiFetch(path, options = {}) {
  let res;

  try {
    res = await fetch(`${BACKEND_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      ...options,
    });
  } catch (networkError) {
    throw new Error("Unable to reach the backend API. Please check your connection or run the server.");
  }

  if (!res.ok) {
    let message = GENERIC_ERROR;
    try {
      const body = await res.json();
      message = body?.message ?? body?.error ?? GENERIC_ERROR;
    } catch { /* non-JSON error body — use generic */ }
    throw new Error(message);
  }

  // Tolerate 204 No Content
  return res.status === 204 ? {} : res.json();
}

// ─── Mock helpers (dev only) ─────────────────────────────────────

// ✅ ADDED — mirrors the mock pattern from enrollmentApi.js
const IS_MOCK = !BACKEND_BASE;

function warnMock(fn) {
  if (import.meta.env.DEV) {
    console.info(
      `[loginApi] VITE_BACKEND_URL not set — ${fn}() using mock data.\n` +
      "Add it to .env: VITE_BACKEND_URL=http://localhost:8000"
    );
  }
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── 1. School dashboard data ────────────────────────────────────

export async function fetchSchoolData() {
  if (IS_MOCK) {
    warnMock("fetchSchoolData");
    await delay(700);
    return {
      stats:         { students: "4,386", teachers: "24", sections: "48" },
      announcements: { count: 3, latest: "3 new today" },
      enrollment:    { isOpen: true,  label: "Open now" },
      schedule:      { label: "Updated weekly" },
      reports:       { label: "Q3 submitted" },
    };
  }

  // Real path: GET /api/school/dashboard
  // Backend reads from DB and returns the SchoolData shape.
  try {
    return await apiFetch("/api/school/dashboard");
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[loginApi] fetchSchoolData failed; using default dashboard data.", error);
    }
    return DEFAULT_SCHOOL_DATA;
  }
}

// ─── 2. Authentication ───────────────────────────────────────────

export async function authenticate(username, password) {
  if (IS_MOCK) {
    warnMock("authenticate");
    await delay(600);
    // In mock mode, fall through to the local fallback table
    return authenticateFallback(username, password);
  }

  const data = await apiFetch("/login", {
    method: "POST",
    body: JSON.stringify({
      username: String(username ?? "").trim(),
      password: String(password ?? "").trim(),
    }),
  });

  const payload = data?.data ?? data;
  const user = payload?.user ?? payload?.account ?? data?.user ?? null;
  const role = normalizeAuthRole(
    payload?.role ?? user?.role ?? data?.role,
  );
  const token =
    payload?.token ??
    payload?.accessToken ??
    payload?.jwt ??
    payload?.sessionToken ??
    data?.token ??
    null;

  // Normalise common backend response shapes:
  // { success, role, token }, { data: { user, token } }, or { user, token }.
  if (payload?.success !== false && role) {
    return { success: true, role, token, user };
  }

  return {
    success: false,
    reason: payload?.reason ?? payload?.message ?? "Invalid credentials",
  };
}

// ─── 3. Audit logging (fire-and-forget) ─────────────────────────

export function logSession({ username, role, success, reason, ip = "client-side", source = "api" }) {
  const entry = {
    timestamp: new Date().toISOString(),
    event:     success ? "LOGIN_SUCCESS" : "LOGIN_FAILURE",
    username,
    role:      role ?? null,
    ip,
    reason:    reason ?? null,
    portal:    PORTAL_NAME,
    source,
  };

  // ── Attempt server-side log (best effort) ──────────────────────
  // NOTE: backend audit logging endpoint is not implemented in this Laravel app,
  // so the audit trail is kept in localStorage only.

  // ── Always write locally as a fallback ────────────────────────
  // ADDED — synchronous localStorage write happens regardless of
  //            network success, so audit trail is never lost client-side.
  try {
    const existing = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) ?? "[]");
    existing.push(entry);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(existing));
  } catch { /* storage unavailable — give up silently */ }
}

// ─── 4. Local fallback authentication — unchanged ────────────────

/**
 * Used when the backend is unreachable (offline / CORS / dev mode).
 * Remove hardcoded passwords before production — replace with a
 * proper credential store or disable fallback entirely.
 *
 * @type {Record<string, { password: string; role: string }>}
 */
const FALLBACK_USERS = {
  admin:     { password: "1234", role: "admin" },
  principal: { password: "1234", role: "principal" },
  registrar: { password: "1234", role: "registrar" },
  teacher:   { password: "1234", role: "teacher" },
};

const ALLOWED_ROLES = new Set(["admin", "principal", "registrar", "teacher"]);

/** @param {unknown} value @returns {string|null} */
export function normalizeAuthRole(value) {
  if (value == null) return null;
  const role = String(value).trim().toLowerCase();
  return ALLOWED_ROLES.has(role) ? role : null;
}

/** @param {string} username @param {string} password @returns {AuthResult} */
export function authenticateFallback(username, password) {
  const key = String(username ?? "").trim().toLowerCase();
  const user = FALLBACK_USERS[key];
  const normalizedPassword = String(password ?? "").trim();

  if (user && user.password === normalizedPassword) {
    return {
      success: true,
      role: user.role,
    };
  }

  return {
    success: false,
    reason: "Invalid credentials",
  };
}

/** @returns {Array<{ username: string; password: string; role: string }>} */
export function getFallbackUsers() {
  return Object.entries(FALLBACK_USERS).map(([username, { password, role }]) => ({
    username, password, role,
  }));
}
