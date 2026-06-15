/**
 * dashboardService.js — Role-aware Dashboard API calls
 *
 * Key changes from previous version:
 *   ✔ fetchDashboardByRole() — single entry point that accepts a role string
 *     and passes it as a query param (?role=admin) to every endpoint.
 *   ✔ Every fetch helper forwards an AbortSignal so the caller can cancel
 *     in-flight requests on role switch or component unmount.
 *   ✔ fetchWithFallback never throws; always resolves { data, fromApi }.
 *   ✔ fetchAllDashboardData kept for backwards-compat (wraps fetchDashboardByRole).
 */

import apiClient from "../apiClient";

/* ─── Role-aware fetch helper ──────────────────────────────── */
/**
 * GET a path with an optional role query param and abort signal.
 *
 * @template T
 * @param {string}      path     - e.g. "/dashboard/stats"
 * @param {T}           fallback - returned when the API fails
 * @param {string}      [role]   - appended as ?role=<role> when provided
 * @param {AbortSignal} [signal] - cancels the request when aborted
 * @returns {Promise<{ data: T, fromApi: boolean }>}
 */
async function fetchWithFallback(path, fallback, role, signal) {
  const url = role ? `${path}?role=${encodeURIComponent(role)}` : path;

  try {
    const { data, ok } = await apiClient.get(url, { signal });
    return ok && data !== null
      ? { data, fromApi: true }
      : { data: fallback, fromApi: false };
  } catch (err) {
    // Re-throw AbortError so the caller can distinguish cancellation
    if (err.name === "AbortError") throw err;

    return { data: fallback, fromApi: false };
  }
}

/* ─── Role-scoped endpoint helpers ────────────────────────── */
// Each helper is a thin wrapper so individual endpoints can be
// called independently (e.g. for partial refreshes in the future).

export const fetchStats            = (fallback, role, signal) => fetchWithFallback("/dashboard/stats",            fallback, role, signal);
export const fetchGradeData        = (fallback, role, signal) => fetchWithFallback("/dashboard/grade-data",       fallback, role, signal);
export const fetchEnrollmentTable  = (fallback, role, signal) => fetchWithFallback("/dashboard/enrollment-table", fallback, role, signal);
export const fetchApplicationStatus= (fallback, role, signal) => fetchWithFallback("/dashboard/application-status", fallback, role, signal);
export const fetchAttendanceData   = (fallback, role, signal) => fetchWithFallback("/dashboard/attendance",       fallback, role, signal);
export const fetchAtRiskStudents   = (fallback, role, signal) => fetchWithFallback("/dashboard/at-risk",          fallback, role, signal);
export const fetchStrands          = (fallback, role, signal) => fetchWithFallback("/dashboard/strands",          fallback, role, signal);
export const fetchTransferees      = (fallback, role, signal) => fetchWithFallback("/dashboard/transferees",      fallback, role, signal);
export const fetchTeacherData      = (fallback, role, signal) => fetchWithFallback("/teachers",                   fallback, role, signal);
export const fetchFeeData          = (fallback, role, signal) => fetchWithFallback("/finance/fee-collection",     fallback, role, signal);
export const fetchCalendarEvents   = (fallback, role, signal) => fetchWithFallback("/events",                     fallback, role, signal);
export const fetchNotifications    = (fallback, role, signal) => fetchWithFallback("/notifications",              fallback, role, signal);
export const fetchRecentActivity   = (fallback, role, signal) => fetchWithFallback("/enrollment/recent-activity", fallback, role, signal);
export const fetchDepEdReports     = (fallback, role, signal) => fetchWithFallback("/reports/deped-forms",        fallback, role, signal);

/* ─── Role-based batch helper ──────────────────────────────── */
/**
 * Fetches all dashboard data in parallel for a given role.
 *
 * @param {string}      role     - "admin" | "registrar" | "teacher"
 * @param {object}      defaults - DEFAULT data object from Dashboard.jsx
 * @param {AbortSignal} [signal] - passed to every fetch; aborts all on cancel
 * @returns {Promise<{ results: object, anyLive: boolean }>}
 */
export async function fetchDashboardByRole(role, defaults, signal) {
  const apiRole = role.toLowerCase(); // "Admin" → "admin" etc.

  const [
    statsRes,
    gradeRes,
    enrollRes,
    appRes,
    attRes,
    riskRes,
    teachRes,
    feeRes,
    calRes,
    notifRes,
    strandRes,
    actRes,
    xferRes,
    rptRes,
  ] = await Promise.all([
    fetchStats            (defaults.stats,             apiRole, signal),
    fetchGradeData        (defaults.gradeData,         apiRole, signal),
    fetchEnrollmentTable  (defaults.enrollmentTable,   apiRole, signal),
    fetchApplicationStatus(defaults.applicationStatus, apiRole, signal),
    fetchAttendanceData   (defaults.attendanceData,    apiRole, signal),
    fetchAtRiskStudents   (defaults.atRiskStudents,    apiRole, signal),
    fetchTeacherData      (defaults.teacherData,       apiRole, signal),
    fetchFeeData          (defaults.feeData,           apiRole, signal),
    fetchCalendarEvents   (defaults.calendarEvents,    apiRole, signal),
    fetchNotifications    (defaults.notifications,     apiRole, signal),
    fetchStrands          (defaults.strands,           apiRole, signal),
    fetchRecentActivity   (defaults.recentActivity,    apiRole, signal),
    fetchTransferees      (defaults.transferees,       apiRole, signal),
    fetchDepEdReports     (defaults.reports,           apiRole, signal),
  ]);

  const anyLive = [
    statsRes, gradeRes, enrollRes, appRes, attRes, riskRes,
    teachRes, feeRes, calRes, notifRes, strandRes, actRes, xferRes, rptRes,
  ].some(r => r.fromApi);

  return {
    anyLive,
    results: {
      stats:             statsRes.data,
      gradeData:         gradeRes.data,
      enrollmentTable:   enrollRes.data,
      applicationStatus: appRes.data,
      attendanceData:    attRes.data,
      atRiskStudents:    riskRes.data,
      teacherData:       teachRes.data,
      feeData:           feeRes.data,
      calendarEvents:    calRes.data,
      notifications:     notifRes.data,
      strands:           strandRes.data,
      recentActivity:    actRes.data,
      transferees:       xferRes.data,
      reports:           rptRes.data,
    },
  };
}

/**
 * @deprecated Use fetchDashboardByRole instead.
 * Kept for backwards compatibility with any code that still calls
 * fetchAllDashboardData(defaults) without a role.
 */
export async function fetchAllDashboardData(defaults, signal) {
  return fetchDashboardByRole("admin", defaults, signal);
}