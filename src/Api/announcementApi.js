/**
 * src/api/announcementApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All network calls for the Announcements feature.
 *
 * Every function returns { ok: boolean, data?, error? }.
 *
 * When the API is unreachable the functions fall back gracefully so
 * useAnnouncements can apply optimistic / default data instead of crashing.
 *
 * ── Default data ─────────────────────────────────────────────────────────────
 * DEFAULT_ANNOUNCEMENTS is exported so pages can show placeholder cards while
 * the real fetch is in-flight (opt-in — the hook itself no longer pre-seeds
 * the list, avoiding uuid-mismatch duplicates on re-fetch).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// FIX: normalize to always include /v1 (VITE_API_BASE_URL ends in /api, not /api/v1).
const BASE_URL = (() => {
  const base = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
  if (base.endsWith("/v1") || base.endsWith("/v1/")) return base.replace(/\/$/, "");
  return `${base}/v1`;
})();

// ── Default / seed data ───────────────────────────────────────────────────────
// Shown immediately on mount; replaced by real API data once it loads.

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "default-1",
    uuid: "default-1",
    message: "Reminder: Parent-teacher conferences are scheduled for next week. Please submit final grades by Friday so families receive timely updates.",
    urgency: "High",
    dissemination_modes: ["Post"],
    target_audience: "All",
    scheduled_at: new Date().toISOString().slice(0, 10) + "T10:00:00",
    status: "Pending",
    created_at: null,
    updated_at: null,
    isDefault: true,
  },
  {
    id: "default-2",
    uuid: "default-2",
    message: "School will be closed on Monday due to the national holiday. Classes resume Tuesday. Please inform parents accordingly.",
    urgency: "Medium",
    dissemination_modes: ["SMS"],
    target_audience: "All",
    scheduled_at: new Date().toISOString().slice(0, 10) + "T09:00:00",
    status: "Pending",
    created_at: null,
    updated_at: null,
    isDefault: true,
  },
  {
    id: "default-3",
    uuid: "default-3",
    message: "Grade 6 recognition ceremony is this month. All teachers are required to attend. Proper attire is mandatory.",
    urgency: "Low",
    dissemination_modes: ["Email"],
    target_audience: "Teachers",
    scheduled_at: new Date().toISOString().slice(0, 10) + "T14:00:00",
    status: "Pending",
    created_at: null,
    updated_at: null,
    isDefault: true,
  },
];

// ── Payload builder (shared with hook for optimistic updates) ─────────────────

/**
 * Converts a raw form object into the shape expected by the API.
 * Also used by the hook to construct optimistic local records.
 */
export function buildPayload(form) {
  // FIX FE-CNS-01: field names now match StoreAnnouncementRequest expectations.
  // Old → New:  text → message, mode → dissemination_modes (array),
  //             audience → target_audience, date+time → scheduled_at,
  //             publish_mode added to drive schedule vs. immediate logic.
  // FIX: title is required by StoreAnnouncementRequest — was missing entirely,
  // causing every POST to fail 422 validation before even reaching the service.
  const payload = {
    title:               form.title?.trim() ?? form.message?.trim()?.slice(0, 100) ?? "",
    message:             form.message?.trim() ?? form.text?.trim() ?? "",
    urgency:             form.urgency        ?? "High",
    dissemination_modes: Array.isArray(form.dissemination_modes)
                           ? form.dissemination_modes
                           : form.mode
                             ? [form.mode]
                             : [],
    target_audience:     form.target_audience ?? form.audience ?? "All",
    publish_mode:        form.publish_mode    ?? "now",
    status:              form.status          ?? "Pending",
  };

  // Only include scheduled_at when scheduling; combine date+time if provided separately.
  if (form.scheduled_at) {
    payload.scheduled_at = form.scheduled_at;
  } else if (form.date) {
    payload.scheduled_at = form.time
      ? `${form.date}T${form.time}:00`
      : `${form.date}T00:00:00`;
  }

  return payload;
}

// Safely pull a display string out of a value that may be a plain string
// OR a relation object the backend sometimes sends instead (e.g.
// target_audience scoped to a specific section/grade comes back as
// { uuid, name } rather than a plain enum string). Rendering that object
// directly crashes React with "Objects are not valid as a React child"
// (minified error #31).
function readLabel(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.name ?? value.label ?? fallback;
  return fallback;
}

/**
 * Normalizes a single raw announcement record so every field that gets
 * rendered as plain text is guaranteed to be a string, even if the
 * backend sends a relation object for fields like target_audience or
 * the items inside dissemination_modes.
 */
function normalizeAnnouncementRecord(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    title:           readLabel(raw.title, raw.title ?? ""),
    target_audience: readLabel(raw.target_audience, raw.target_audience ?? "all"),
    urgency:         readLabel(raw.urgency, raw.urgency ?? "normal"),
    status:          readLabel(raw.status, raw.status ?? "Pending"),
    dissemination_modes: Array.isArray(raw.dissemination_modes)
      ? raw.dissemination_modes.map((m) => readLabel(m, m))
      : raw.dissemination_modes,
  };
}

// ── Internal helper ───────────────────────────────────────────────────────────

/**
 * @param {string}  method
 * @param {string}  path
 * @param {unknown} [body]
 * @param {AbortSignal} [signal]  — optional external cancellation signal
 */
async function request(method, path, body, signal) {
  try {
    // WARN-02 / NEW-01 FIX: inject Authorization header so auth:sanctum-protected routes
    // don't return 401. Uses the same multi-key lookup as authToken.js:
    //   1. localStorage "auth" object (primary — set by loginApi)
    //   2. localStorage "authToken" or "token" (legacy / fallback keys)
    const token = (() => {
      try {
        // Primary: "auth" key holds a JSON object { token, accessToken, … }
        const raw = localStorage.getItem("auth");
        if (raw) {
          if (!raw.trim().startsWith("{")) return raw; // stored as bare string
          try {
            const obj = JSON.parse(raw);
            const t = obj?.token ?? obj?.accessToken ?? obj?.jwt ?? obj?.sessionToken;
            if (t) return t;
          } catch { /* ignore malformed JSON */ }
        }
        // Fallback: individual keys
        return (
          localStorage.getItem("authToken") ??
          localStorage.getItem("token") ??
          null
        );
      } catch {
        return null;
      }
    })();
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeader },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      // FIX: pass the AbortSignal so callers (withTimeout, component unmount)
      // can cancel the underlying TCP connection rather than just racing a
      // rejection. Without this the browser keeps the socket open for up to
      // ~3 minutes even after withTimeout rejects, preventing retry loops from
      // ever getting a fresh connection.
      ...(signal ? { signal } : {}),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text}` };
    }

    // 204 No Content — DELETE typically returns this
    if (res.status === 204) return { ok: true, data: null };

    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err?.message ?? "Network error" };
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

/**
 * GET /announcements
 * Returns { ok, data: Announcement[] } on success.
 */
/**
 * GET /announcements
 *
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<{ ok: boolean, data?: Announcement[], error?: string }>}
 */
export async function fetchAnnouncements({ signal } = {}) {
  const result = await request("GET", "/announcements", undefined, signal);
  if (!result.ok) return result;
  // FIX BUG-4 (Principal path): AnnouncementResource::collection() returns Laravel's
  // paginated envelope { data: [...], links: {...}, meta: {...} }.
  // request() stores the raw JSON body in result.data, so result.data IS the envelope —
  // not the array. useAnnouncements.fetchAll() calls setAnnouncements(result.data) which
  // would set an object instead of an array, causing .map()/.filter() to crash and the
  // Principal announcement list to always render empty when the API is live.
  // Unwrap here — same pattern homeApi.js already uses correctly.
  const arr = Array.isArray(result.data?.data)
    ? result.data.data
    : Array.isArray(result.data)
      ? result.data
      : [];
  return { ok: true, data: arr.map(normalizeAnnouncementRecord) };
}

/**
 * POST /announcements
 * Returns { ok, data: Announcement } on success.
 */
export async function createAnnouncement(form) {
  const result = await request("POST", "/announcements", buildPayload(form));
  return result.ok ? { ...result, data: normalizeAnnouncementRecord(result.data) } : result;
}

/**
 * PUT /announcements/:id
 * Returns { ok, data: Announcement } on success.
 */
export async function updateAnnouncement(id, form) {
  const result = await request("PUT", `/announcements/${id}`, buildPayload(form));
  return result.ok ? { ...result, data: normalizeAnnouncementRecord(result.data) } : result;
}

/**
 * DELETE /announcements/:id
 * Returns { ok, data: null } on success.
 */
export async function deleteAnnouncement(id) {
  return request("DELETE", `/announcements/${id}`);
}

/**
 * DELETE /announcements/bulk
 * Sends { ids: string[] } in the body.
 * Returns { ok, data: null } on success.
 *
 * Falls back to sequential single-deletes if the server returns 404/405
 * (i.e. the bulk endpoint is not implemented yet).
 */
export async function bulkDeleteAnnouncements(ids) {
  const result = await request("DELETE", "/announcements/bulk", { ids });

  // If bulk endpoint is unavailable, fan out to individual deletes
  if (!result.ok) {
    const results = await Promise.all(ids.map(id => deleteAnnouncement(id)));
    const failed  = results.filter(r => !r.ok);
    return failed.length === 0
      ? { ok: true, data: null }
      : { ok: false, error: `${failed.length} deletion(s) failed` };
  }

  return result;
}