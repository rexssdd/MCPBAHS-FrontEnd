/* ══════════════════════════════════════════════════════════════
   EMPTY / SKELETON SHAPE
   Null values → skeleton shimmer while real API responds.
   Principal view is production-only — no demo numbers ever
   shown to end users.
══════════════════════════════════════════════════════════════ */
export const EMPTY = {
  // ── Group A: shared school-wide ──────────────────────────
  stats: {
    enrolledToday:         null,
    totalEnrolled:         null,
    pendingApps:           null,
    completionRate:        null,
    atRiskCount:           null,
    avgGpa:                null,
    passRate:              null,
    lowAttendanceSections: null,
    totalSections:         null,
    totalStudents:         null,
    teachingStaff:         null,
    teachingActive:        null,
    teachingLeave:         null,
    nonTeaching:           null,
    parentContacts:        null,
    totalCollected:        null,
    totalBilled:           null,
    unpaidBalances:        null,
    unpaidCount:           null,
    waiverCount:           null,
    overdueReports:        null,
  },
  gradeData:         [],
  enrollmentTable:   [],
  applicationStatus: { total: 0, enrolled: 0, pending: 0, cancelled: 0 },
  attendanceData:    [],
  atRiskStudents:    [],
  teacherData:       [],
  feeData:           [],
  calendarEvents:    [],
  notifications:     [],
  strands:           [],
  recentActivity:    [],
  transferees:       { incoming: null, outgoing: null, returnees: null, demographics: [] },
  reports:           [],
  // ── Group B: principal-exclusive ─────────────────────────
  executiveSummary: null,
  // ^ { completionRate, avgGpa, passRate, avgAttendance, collectionRate, atRiskCount }
  schoolHealth: null,
  // ^ { academic, attendance, enrollment, collection }  (0-100 composite scores)
  quarterlyReport: null,
  // ^ { quarter, schoolYear, totalStudents, promoted, retained, dropped, honorRoll, perfectAttendance, generatedAt }
  staffPerformance: null,
  // ^ { totalTeachers, rated, outstanding, verySatisfactory, satisfactory, unsatisfactory, needsImprovement, avgRating }
  sipProgress: [],
  // ^ [{ objective, target, current, status }]
};

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS / HELPERS
══════════════════════════════════════════════════════════════ */
export const STATUS_COLOR = {
  Full:      { badge: "badge--red",   dot: "#EF5350" },
  Near:      { badge: "badge--amber", dot: "#FFA726" },
  Available: { badge: "badge--green", dot: "#66BB6A" },
};
export const SEVERITY_COLOR = { high: "badge--red", med: "badge--amber", low: "badge--blue" };
export const NOTIF_STYLE = {
  warn:  { bg: "#FFFDE7", border: "#FDD835", icon: "⚠", color: "#F9A825" },
  info:  { bg: "#E3F2FD", border: "#90CAF9", icon: "ℹ", color: "#1565C0" },
  alert: { bg: "#FFEBEE", border: "#EF9A9A", icon: "!", color: "#C62828" },
};
export const EVENT_DOT     = { deadline: "#E53935", event: "#2E7D32", exam: "#E65100" };
export const STRAND_COLORS = ["#1B5E20", "#F9A825", "#1565C0", "#6A1B9A", "#BF360C"];
export const SIP_STATUS_COLOR = {
  "On Track":    "badge--green",
  "Completed":   "badge--blue",
  "At Risk":     "badge--red",
  "Not Started": "badge--gray",
};
export const IPCRF_COLORS = {
  outstanding:       "#1B5E20",
  verySatisfactory:  "#2E7D32",
  satisfactory:      "#F9A825",
  unsatisfactory:    "#E65100",
  needsImprovement:  "#C62828",
};
export const BAR_MAX = 7000;

export const fmt = n =>
  n == null       ? "—"
  : n >= 1_000_000 ? `₱${(n / 1_000_000).toFixed(2)}M`
  : n >= 1000      ? `₱${(n / 1000).toFixed(0)}K`
  : `₱${n}`;

export const fmtNum  = n => (n == null ? "—" : n.toLocaleString());
export const fmtPct  = n => (n == null ? "—" : `${n}%`);
export const pctColor = p => p == null ? "var(--n-400)" : p >= 90 ? "#2E7D32" : p >= 70 ? "#E65100" : "#C62828";
export const attColor = r => r == null ? "var(--n-400)" : r >= 93 ? "#2E7D32" : r >= 88 ? "#E65100" : "#C62828";

export const ALL_TABS = [
  { id: "overview",   label: "Overview",    icon: "🏠" },
  { id: "academic",   label: "Academic",    icon: "📚" },
  { id: "people",     label: "People & HR", icon: "👥" },
  { id: "operations", label: "Operations",  icon: "⚙️" },
  { id: "executive",  label: "Executive",   icon: "🏛" },
];