/**
 * principalDashboardService.js — Principal Dashboard API calls
 *
 * Covers two groups of endpoints:
 *
 *  Group A — Shared school-wide endpoints (same paths as Admin but
 *            scoped with ?role=principal so the backend can enforce
 *            access control and return principal-appropriate payloads).
 *
 *  Group B — Principal-exclusive executive endpoints that do not exist
 *            in the Admin service (e.g. /dashboard/executive-summary,
 *            /dashboard/school-health, /dashboard/quarterly-report).
 *
 * Usage:
 *   import { fetchPrincipalDashboard } from
 *     "../../services/Principal/principalDashboardService";
 *
 *   const { results, anyLive } = await fetchPrincipalDashboard(EMPTY, signal);
 */

import apiClient from "./apiClient";

/* ══════════════════════════════════════════════════════════════
   HELPERS — defensive shape normalisation for live API data
   (mirrors src/services/Admin/Dashboard/dashboardService.js)
══════════════════════════════════════════════════════════════ */

function readLabel(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value || fallback;
  if (typeof value === "object") return value.name ?? value.label ?? fallback;
  return fallback;
}

/**
 * Normalises a raw teacher/faculty record into the flat shape the
 * dashboard's Teacher card expects: { name, subject, load, status }.
 * Prevents "Minified React error #31" when a relation field (e.g.
 * department) comes back as { uuid, name } instead of a string.
 */
function normaliseTeacherRecord(t) {
  if (!t || typeof t !== "object") return null;

  const name =
    readLabel(t.name) ||
    t.full_name ||
    [t.first_name, t.middle_name, t.last_name].filter(Boolean).join(" ") ||
    "Unnamed";

  const subject =
    readLabel(t.subject) ||
    readLabel(t.department) ||
    readLabel(t.position) ||
    (Array.isArray(t.subjects) ? t.subjects.map((s) => readLabel(s)).filter(Boolean).join(", ") : "") ||
    "—";

  const sectionList = Array.isArray(t.sections)
    ? t.sections
    : Array.isArray(t.assigned_sections)
      ? t.assigned_sections
      : null;
  const load =
    typeof t.load === "number"
      ? t.load
      : typeof t.section_count === "number"
        ? t.section_count
        : sectionList
          ? sectionList.length
          : 0;

  const status = readLabel(t.status) || readLabel(t.employment_status) || "Active";

  return { name, subject, load, status: /active/i.test(status) ? "Active" : status };
}

function normaliseTeacherRoster(list) {
  if (!Array.isArray(list)) return list;
  return list.map(normaliseTeacherRecord).filter(Boolean);
}

/* ══════════════════════════════════════════════════════════════
   CORE FETCH HELPER
   Never throws (except AbortError). Always resolves with
   { data, fromApi } so Promise.all never short-circuits.
══════════════════════════════════════════════════════════════ */

/**
 * @template T
 * @param {string}       path     - API path, e.g. "/dashboard/stats"
 * @param {T}            fallback - returned when the API fails / is unreachable
 * @param {string}       role     - appended as ?role=<role>
 * @param {AbortSignal}  [signal] - cancels the request when aborted
 * @returns {Promise<{ data: T, fromApi: boolean }>}
 */
async function fetchWithFallback(path, fallback, role, signal) {
  const url = `${path}?role=${encodeURIComponent(role)}`;

  try {
    const { data, ok } = await apiClient.get(url, { signal });
    return ok && data !== null
      ? { data, fromApi: true }
      : { data: fallback, fromApi: false };
  } catch (err) {
    if (err.name === "AbortError") throw err; // let caller handle cancellation
    return { data: fallback, fromApi: false };
  }
}

/* ══════════════════════════════════════════════════════════════
   GROUP A — SHARED SCHOOL-WIDE ENDPOINTS
   These mirror the admin service but always pass role=principal.
══════════════════════════════════════════════════════════════ */

/** Overall enrollment / at-risk / GPA / pass-rate stats */
export const fetchPrincipalStats = (fallback, signal) =>
  fetchWithFallback("/dashboard/stats", fallback, "principal", signal);

/** Male/female learner counts per grade level */
export const fetchPrincipalGradeData = (fallback, signal) =>
  fetchWithFallback("/dashboard/grade-data", fallback, "principal", signal);

/** Per-grade enrollment vs capacity */
export const fetchPrincipalEnrollmentTable = (fallback, signal) =>
  fetchWithFallback("/dashboard/enrollment-table", fallback, "principal", signal);

/** Enrolled / Pending / Cancelled application totals */
export const fetchPrincipalApplicationStatus = (fallback, signal) =>
  fetchWithFallback("/dashboard/application-status", fallback, "principal", signal);

/** Per-grade attendance rates */
export const fetchPrincipalAttendanceData = (fallback, signal) =>
  fetchWithFallback("/dashboard/attendance", fallback, "principal", signal);

/** Students flagged as at-risk */
export const fetchPrincipalAtRiskStudents = (fallback, signal) =>
  fetchWithFallback("/dashboard/at-risk", fallback, "principal", signal);

/** SHS strand enrollment breakdown */
export const fetchPrincipalStrands = (fallback, signal) =>
  fetchWithFallback("/dashboard/strands", fallback, "principal", signal);

/** Incoming / outgoing / returnee transferee data */
export const fetchPrincipalTransferees = (fallback, signal) =>
  fetchWithFallback("/dashboard/transferees", fallback, "principal", signal);

/** Teacher roster with subject load and status */
export const fetchPrincipalTeacherData = (fallback, signal) =>
  fetchWithFallback("/teachers", fallback, "principal", signal);

/** Per-grade fee collected vs total billed */
export const fetchPrincipalFeeData = (fallback, signal) =>
  fetchWithFallback("/finance/fee-collection", fallback, "principal", signal);

/** Upcoming school events and DepEd deadlines */
export const fetchPrincipalCalendarEvents = (fallback, signal) =>
  fetchWithFallback("/events", fallback, "principal", signal);

/** System / admin alerts and notifications */
export const fetchPrincipalNotifications = (fallback, signal) =>
  fetchWithFallback("/notifications", fallback, "principal", signal);

/** Recent enrollment activity feed */
export const fetchPrincipalRecentActivity = (fallback, signal) =>
  fetchWithFallback("/enrollment/recent-activity", fallback, "principal", signal);

/** DepEd SF forms and export report statuses */
export const fetchPrincipalDepEdReports = (fallback, signal) =>
  fetchWithFallback("/reports/deped-forms", fallback, "principal", signal);

/* ══════════════════════════════════════════════════════════════
   GROUP B — PRINCIPAL-EXCLUSIVE EXECUTIVE ENDPOINTS
   These do not exist in the Admin service. The backend should
   gate them so only the principal role can access them.
══════════════════════════════════════════════════════════════ */

/**
 * High-level KPI snapshot used in the Executive tab.
 * Expected response shape:
 * {
 *   completionRate: number,   // overall enrollment completion %
 *   avgGpa:         number,   // school-wide average GPA
 *   passRate:       number,   // % of students passing all subjects
 *   avgAttendance:  number,   // school-wide average attendance %
 *   collectionRate: number,   // fee collection %
 *   atRiskCount:    number,   // total at-risk students
 * }
 */
export const fetchExecutiveSummary = (fallback, signal) =>
  fetchWithFallback("/dashboard/executive-summary", fallback, "principal", signal);

/**
 * Aggregated school health indicators (0–100 scores) per domain.
 * Expected response shape:
 * {
 *   academic:    number,   // composite academic performance score
 *   attendance:  number,   // school-wide attendance score
 *   enrollment:  number,   // enrollment rate score
 *   collection:  number,   // fee collection rate score
 * }
 */
export const fetchSchoolHealth = (fallback, signal) =>
  fetchWithFallback("/dashboard/school-health", fallback, "principal", signal);

/**
 * Quarterly performance report summary for the current SY/quarter.
 * Expected response shape:
 * {
 *   quarter:          string,   // e.g. "Q3"
 *   schoolYear:       string,   // e.g. "2024–2025"
 *   totalStudents:    number,
 *   promoted:         number,
 *   retained:         number,
 *   dropped:          number,
 *   honorRoll:        number,
 *   perfectAttendance:number,
 *   generatedAt:      string,   // ISO date string
 * }
 */
export const fetchQuarterlyReport = (fallback, signal) =>
  fetchWithFallback("/reports/quarterly-summary", fallback, "principal", signal);

/**
 * Staff performance summary — teaching effectivness indicators.
 * Expected response shape:
 * {
 *   totalTeachers:   number,
 *   rated:           number,   // teachers with completed IPCRF
 *   outstanding:     number,
 *   verySatisfactory:number,
 *   satisfactory:    number,
 *   unsatisfactory:  number,
 *   needsImprovement:number,
 *   avgRating:       number,   // numeric average IPCRF score
 * }
 */
export const fetchStaffPerformance = (fallback, signal) =>
  fetchWithFallback("/reports/staff-performance", fallback, "principal", signal);

/**
 * School improvement plan (SIP) progress tracker.
 * Expected response shape — array of SIP objectives:
 * [
 *   {
 *     objective:  string,   // e.g. "Improve reading proficiency"
 *     target:     number,   // target % or count
 *     current:    number,   // current achieved value
 *     status:     "On Track" | "At Risk" | "Completed" | "Not Started",
 *   },
 *   ...
 * ]
 */
export const fetchSIPProgress = (fallback, signal) =>
  fetchWithFallback("/dashboard/sip-progress", fallback, "principal", signal);

/* ══════════════════════════════════════════════════════════════
   BATCH FETCHER — single entry point for PrincipalDashboard.jsx
══════════════════════════════════════════════════════════════ */

/**
 * Fetches ALL principal dashboard data in parallel.
 *
 * @param {object}      defaults - EMPTY object from PrincipalDashboard.jsx
 * @param {AbortSignal} [signal] - AbortController signal; cancels all fetches
 * @returns {Promise<{ results: object, anyLive: boolean }>}
 */
export async function fetchPrincipalDashboard(defaults, signal) {
  const [
    // Group A — shared
    statsRes,
    gradeRes,
    enrollRes,
    appRes,
    attRes,
    riskRes,
    strandRes,
    xferRes,
    teachRes,
    feeRes,
    calRes,
    notifRes,
    actRes,
    rptRes,
    // Group B — principal-exclusive
    execRes,
    healthRes,
    quarterlyRes,
    staffPerfRes,
    sipRes,
  ] = await Promise.all([
    // ── Group A ──────────────────────────────────────────────
    fetchPrincipalStats           (defaults.stats,              signal),
    fetchPrincipalGradeData       (defaults.gradeData,          signal),
    fetchPrincipalEnrollmentTable (defaults.enrollmentTable,    signal),
    fetchPrincipalApplicationStatus(defaults.applicationStatus, signal),
    fetchPrincipalAttendanceData  (defaults.attendanceData,     signal),
    fetchPrincipalAtRiskStudents  (defaults.atRiskStudents,     signal),
    fetchPrincipalStrands         (defaults.strands,            signal),
    fetchPrincipalTransferees     (defaults.transferees,        signal),
    fetchPrincipalTeacherData     (defaults.teacherData,        signal).then((r) =>
      r.fromApi ? { ...r, data: normaliseTeacherRoster(r.data) } : r
    ),
    fetchPrincipalFeeData         (defaults.feeData,            signal),
    fetchPrincipalCalendarEvents  (defaults.calendarEvents,     signal),
    fetchPrincipalNotifications   (defaults.notifications,      signal),
    fetchPrincipalRecentActivity  (defaults.recentActivity,     signal),
    fetchPrincipalDepEdReports    (defaults.reports,            signal),
    // ── Group B ──────────────────────────────────────────────
    fetchExecutiveSummary (defaults.executiveSummary  ?? null, signal),
    fetchSchoolHealth     (defaults.schoolHealth      ?? null, signal),
    fetchQuarterlyReport  (defaults.quarterlyReport   ?? null, signal),
    fetchStaffPerformance (defaults.staffPerformance  ?? null, signal),
    fetchSIPProgress      (defaults.sipProgress       ?? [],   signal),
  ]);

  const anyLive = [
    statsRes, gradeRes, enrollRes, appRes, attRes, riskRes,
    strandRes, xferRes, teachRes, feeRes, calRes, notifRes,
    actRes, rptRes, execRes, healthRes, quarterlyRes, staffPerfRes, sipRes,
  ].some(r => r.fromApi);

  return {
    anyLive,
    results: {
      // Group A
      stats:             statsRes.data,
      gradeData:         gradeRes.data,
      enrollmentTable:   enrollRes.data,
      applicationStatus: appRes.data,
      attendanceData:    attRes.data,
      atRiskStudents:    riskRes.data,
      strands:           strandRes.data,
      transferees:       xferRes.data,
      teacherData:       teachRes.data,
      feeData:           feeRes.data,
      calendarEvents:    calRes.data,
      notifications:     notifRes.data,
      recentActivity:    actRes.data,
      reports:           rptRes.data,
      // Group B
      executiveSummary:  execRes.data,
      schoolHealth:      healthRes.data,
      quarterlyReport:   quarterlyRes.data,
      staffPerformance:  staffPerfRes.data,
      sipProgress:       sipRes.data,
    },
  };
}