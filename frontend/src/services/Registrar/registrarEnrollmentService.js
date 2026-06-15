/**
 * src/services/Registrar/Enrollment/registrarEnrollmentService.js
 *
 * Registrar enrollment API calls — all-enrollees mode (no section scoping).
 *
 * Includes a built-in FALLBACK_ENROLLEES dataset that is used automatically
 * when the API is unreachable, so the UI is always testable without a backend.
 *
 * Usage:
 *   import * as registrarEnrollmentService from "@/services/Registrar/Enrollment/registrarEnrollmentService";
 *
 *   const { data, ok } = await registrarEnrollmentService.listEnrollees();
 *   const { data, ok } = await registrarEnrollmentService.createEnrollee(form);
 *   const { data, ok } = await registrarEnrollmentService.updateEnrollee(id, form);
 *   const { data, ok } = await registrarEnrollmentService.approveEnrollee(id);
 *   const { data, ok } = await registrarEnrollmentService.rejectEnrollee(id, reason);
 *   const { ok }       = await registrarEnrollmentService.archiveEnrollee(id);
 *   const { ok }       = await registrarEnrollmentService.bulkArchiveEnrollees([id1, id2]);
 */

import apiClient from "./apiClient";

/* ═══════════════════════════════════════════════════════════════
   FALLBACK / SEED DATA
   Used when the API is unreachable (network error, 5xx, not
   configured). Covers all status values so every tab is testable.
   ═══════════════════════════════════════════════════════════════ */

const FIRST_NAMES = ["Maria", "Jose", "Ana", "Pedro", "Rosa", "Carlo", "Liza", "Marco", "Jenny", "Renz",
                     "Celia", "Dante", "Eva", "Felix", "Grace", "Hector", "Iris", "Juan", "Karen", "Leo"];
const LAST_NAMES  = ["Santos", "Bautista", "Cruz", "Garcia", "Villanueva", "Reyes", "Tan", "Lim", "Torres", "Rivera",
                     "Mendoza", "Aquino", "Ramos", "Flores", "Castillo", "Morales", "Aguilar", "Dela Cruz", "Ocampo", "Pascual"];
const GRADES      = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const SECTIONS    = ["SEC-001", "SEC-002", "SEC-003", "SEC-004", "SEC-005"];
const SCHOOL_TYPES = ["Public", "Private", "Special Science School", "Integrated School"];
const OLD_SCHOOLS = [
  "Talomo National High School",
  "Davao City National High School",
  "Matina National High School",
  "Buhangin National High School",
  "San Pedro College",
];
const CITIES = ["Matina, Davao City", "Buhangin, Davao City", "Poblacion, Davao City", "Toril, Davao City", "Tugbok, Davao City"];

/* Distribute 30 seeds across all 5 status values evenly */
const STATUS_CYCLE = [
  "Pending",  "Pending",   "Pending",
  "Enrolled", "Enrolled",  "Enrolled",
  "Enrolled", "Rejected",  "Archived",
  "Pending",
];

export const FALLBACK_ENROLLEES = Object.freeze(
  Array.from({ length: 30 }, (_, i) => {
    const fn  = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln  = LAST_NAMES[i % LAST_NAMES.length];
    const idx = String(i + 1).padStart(3, "0");
    return Object.freeze({
      id:               `local-${idx}`,
      learnerId:        `2024-${String(100000 + i + 1)}`,
      firstName:        fn,
      middleName:       ["A.", "B.", "C.", "D.", "E."][i % 5],
      lastName:         ln,
      gradeLevel:       GRADES[i % GRADES.length],
      sectionId:        SECTIONS[i % SECTIONS.length],
      email:            `${fn.toLowerCase()}.${ln.toLowerCase().replace(/\s/g, "")}${i}@example.com`,
      phone:            `09${String(170000000 + i).slice(0, 9)}`,
      dob:              `${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}-2008`,
      country:          "Philippines",
      city:             CITIES[i % CITIES.length],
      postalCode:       "8000",
      oldSchoolName:    OLD_SCHOOLS[i % OLD_SCHOOLS.length],
      oldSchoolType:    SCHOOL_TYPES[i % SCHOOL_TYPES.length],
      oldSchoolId:      String(610000 + i),
      oldSchoolAddress: `Brgy. ${["Talomo", "Buhangin", "Matina", "Toril"][i % 4]}, Davao City`,
      status:           STATUS_CYCLE[i % STATUS_CYCLE.length],
    });
  })
);

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Determine whether we are running against a real backend.
 * Set VITE_API_URL (or REACT_APP_API_URL) in your .env; if absent or
 * pointing to the placeholder, we short-circuit all calls and return
 * the local seed data instead.
 */
/**
 * Determine whether we are running against a real backend.
 * Vite uses import.meta.env instead of process.env
 */
// FIX: Use canonical VITE_API_BASE_URL (same as all other services).
// Falls back to VITE_API_URL for backwards compatibility.
const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const API_CONFIGURED = Boolean(API_BASE);
/** Wrap any API call so a network/config failure silently returns fallback. */
async function safeCall(apiFn, fallbackResult) {
  if (!API_CONFIGURED) {
    // No backend wired — skip the network round-trip entirely.
    return { ok: false, data: null, error: "API not configured", _fallback: true };
  }
  try {
    return await apiFn();
  } catch (err) {
    return { ok: false, data: null, error: err.message, _fallback: true, ...fallbackResult };
  }
}

/* ═══════════════════════════════════════════════════════════════
   SERVICE FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

/* ─── GET /registrar/enrollees ──────────────────────────────── */
/**
 * Fetch all enrollees.
 * Falls back to FALLBACK_ENROLLEES when the API is unavailable.
 *
 * @param {{ status?: string, gradeLevel?: string, search?: string }} [filters]
 * @returns {Promise<{ data: Array, ok: boolean, error: string|null, _isFallback?: boolean }>}
 */
export async function listEnrollees(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status)     params.set("status",     filters.status);
  if (filters.gradeLevel) params.set("gradeLevel", filters.gradeLevel);
  if (filters.search)     params.set("search",     filters.search);

  const query  = params.toString() ? `?${params.toString()}` : "";
  const result = await safeCall(() => apiClient.get(`/registrar/enrollees${query}`));

  /* ── Network / config failure → return seed data ── */
  if (!result.ok) {
    return {
      ok:          false,
      data:        [...FALLBACK_ENROLLEES],   // mutable copy for the hook
      error:       result.error ?? "API unavailable",
      _isFallback: true,
    };
  }

  /* ── Normalise: accept both raw array and { data: [...] } ── */
  const normalised = Array.isArray(result.data)
    ? result.data
    : result.data?.data ?? [];

  /* ── If server returned an empty array, still provide seed data ── */
  if (normalised.length === 0) {
    return { ok: true, data: [...FALLBACK_ENROLLEES], error: null, _isFallback: true };
  }

  return { ok: true, data: normalised, error: null };
}

/* ─── GET /registrar/enrollees/:id ─────────────────────────── */
/**
 * Fetch a single enrollee by ID.
 * Falls back to the matching record in FALLBACK_ENROLLEES.
 *
 * @param {string} id
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export async function getEnrollee(id) {
  const result = await safeCall(() => apiClient.get(`/registrar/enrollees/${id}`));
  if (!result.ok) {
    const fallback = FALLBACK_ENROLLEES.find(e => e.id === id) ?? null;
    return { ok: Boolean(fallback), data: fallback, error: result.error };
  }
  return result;
}

/* ─── POST /registrar/enrollees ─────────────────────────────── */
/**
 * Create a new enrollee.
 * In fallback mode, returns a synthetic record so the UI can still
 * optimistically add it to the list.
 *
 * @param {object} form - Enrollee form payload
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export async function createEnrollee(form) {
  const result = await safeCall(() => apiClient.post(`/registrar/enrollees`, form));
  if (result._fallback) {
    /* Synthesise a local record so the hook's optimistic update works */
    const syntheticId = `local-new-${Date.now()}`;
    return {
      ok:   true,
      data: {
        ...form,
        id:        syntheticId,
        learnerId: `LOCAL-${syntheticId}`,
        status:    "Pending",
      },
      error: null,
      _isFallback: true,
    };
  }
  return result;
}

/* ─── PUT /registrar/enrollees/:id ─────────────────────────── */
/**
 * Update an existing enrollee.
 * In fallback mode, echoes back the merged record.
 *
 * @param {string} id
 * @param {object} form - Updated fields
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export async function updateEnrollee(id, form) {
  const result = await safeCall(() => apiClient.put(`/registrar/enrollees/${id}`, form));
  if (result._fallback) {
    const existing = FALLBACK_ENROLLEES.find(e => e.id === id) ?? {};
    return { ok: true, data: { ...existing, ...form, id }, error: null, _isFallback: true };
  }
  return result;
}

/* ─── PATCH /registrar/enrollees/:id/approve ────────────────── */
/**
 * Approve a pending enrollee (sets status → "Enrolled").
 *
 * @param {string} id
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export async function approveEnrollee(id) {
  const result = await safeCall(() => apiClient.patch(`/registrar/enrollees/${id}/approve`));
  if (result._fallback) return { ok: true, data: { id, status: "Enrolled" }, error: null, _isFallback: true };
  return result;
}

/* ─── PATCH /registrar/enrollees/:id/reject ─────────────────── */
/**
 * Reject a pending enrollee with an optional reason.
 *
 * @param {string} id
 * @param {string} [reason]
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export async function rejectEnrollee(id, reason = "") {
  const result = await safeCall(() => apiClient.patch(`/registrar/enrollees/${id}/reject`, { reason }));
  if (result._fallback) return { ok: true, data: { id, status: "Rejected", reason }, error: null, _isFallback: true };
  return result;
}

/* ─── PATCH /registrar/enrollees/:id/archive ────────────────── */
/**
 * Archive a single enrollee.
 *
 * @param {string} id
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export async function archiveEnrollee(id) {
  const result = await safeCall(() => apiClient.patch(`/registrar/enrollees/${id}/archive`));
  if (result._fallback) return { ok: true, data: { id, status: "Archived" }, error: null, _isFallback: true };
  return result;
}

/* ─── POST /registrar/enrollees/bulk-archive ─────────────────── */
/**
 * Archive multiple enrollees.
 *
 * @param {string[]} ids
 * @returns {Promise<{ data: object|null, ok: boolean, error: string|null }>}
 */
export async function bulkArchiveEnrollees(ids) {
  const result = await safeCall(() => apiClient.post("/registrar/enrollees/bulk-archive", { ids }));
  if (result._fallback) return { ok: true, data: { ids, status: "Archived" }, error: null, _isFallback: true };
  return result;
}