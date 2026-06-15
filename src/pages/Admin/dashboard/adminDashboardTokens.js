/** Role config, fallback dashboard payload, and presentational helpers for the Admin multi-role dashboard. */

export const ROLE_CONFIG = {
  Admin: {
    apiRole: "admin",
    tabs: ["overview", "academic", "people", "operations"],
    visibleStats: [
      "enrolledToday",
      "totalEnrolled",
      "pendingApps",
      "completionRate",
      "atRiskCount",
      "avgGpa",
      "passRate",
      "lowAttendanceSections",
      "totalSections",
      "totalStudents",
      "teachingStaff",
      "teachingActive",
      "teachingLeave",
      "nonTeaching",
      "parentContacts",
      "totalCollected",
      "totalBilled",
      "unpaidBalances",
      "unpaidCount",
      "waiverCount",
      "overdueReports",
    ],
  },
  Registrar: {
    apiRole: "registrar",
    tabs: ["overview", "people", "operations"],
    visibleStats: [
      "enrolledToday",
      "totalEnrolled",
      "pendingApps",
      "completionRate",
      "atRiskCount",
      "totalStudents",
      "parentContacts",
      "totalCollected",
      "totalBilled",
      "unpaidBalances",
      "unpaidCount",
      "waiverCount",
    ],
  },
  Teacher: {
    apiRole: "teacher",
    tabs: ["academic", "people"],
    visibleStats: ["avgGpa", "passRate", "lowAttendanceSections", "totalSections", "atRiskCount", "totalStudents"],
  },
};

export const DEFAULT = {
  stats: {
    enrolledToday: 42,
    totalEnrolled: 4386,
    pendingApps: 128,
    completionRate: 91,
    atRiskCount: 23,
    avgGpa: 85.4,
    passRate: 94,
    lowAttendanceSections: 6,
    totalSections: 48,
    totalStudents: 4386,
    teachingStaff: 24,
    teachingActive: 21,
    teachingLeave: 3,
    nonTeaching: 18,
    parentContacts: 3210,
    totalCollected: 1745000,
    totalBilled: 2039000,
    unpaidBalances: 290000,
    unpaidCount: 126,
    waiverCount: 38,
    overdueReports: 2,
  },
  gradeData: [
    { grade: 7, male: 3200, female: 6800 },
    { grade: 8, male: 2800, female: 5400 },
    { grade: 9, male: 4100, female: 3900 },
    { grade: 10, male: 3600, female: 6200 },
    { grade: 11, male: 2500, female: 5800 },
    { grade: 12, male: 3000, female: 4500 },
  ],
  enrollmentTable: [
    { grade: 7, enrolled: 378, capacity: 400, status: "Full" },
    { grade: 8, enrolled: 361, capacity: 400, status: "Near" },
    { grade: 9, enrolled: 290, capacity: 400, status: "Available" },
    { grade: 10, enrolled: 398, capacity: 400, status: "Full" },
    { grade: 11, enrolled: 342, capacity: 400, status: "Near" },
    { grade: 12, enrolled: 270, capacity: 400, status: "Available" },
  ],
  applicationStatus: { total: 4386, enrolled: 2654, pending: 1654, cancelled: 78 },
  attendanceData: [
    { grade: 7, rate: 94 },
    { grade: 8, rate: 91 },
    { grade: 9, rate: 88 },
    { grade: 10, rate: 96 },
    { grade: 11, rate: 85 },
    { grade: 12, rate: 90 },
  ],
  atRiskStudents: [
    { name: "Marco Villanueva", grade: 11, reason: "Chronic Absences", severity: "high" },
    { name: "Jenny Cruz", grade: 9, reason: "Failing 3 subjects", severity: "high" },
    { name: "Renz Bautista", grade: 8, reason: "5 absences this month", severity: "med" },
    { name: "Carla Delos Reyes", grade: 12, reason: "Missing requirements", severity: "med" },
    { name: "Alvin Tan", grade: 7, reason: "Irregular attendance", severity: "low" },
  ],
  teacherData: [
    { name: "Ms. Reyes", subject: "Math", load: 6, status: "Active" },
    { name: "Mr. Santos", subject: "Science", load: 5, status: "Active" },
    { name: "Ms. Garcia", subject: "English", load: 4, status: "On Leave" },
    { name: "Mr. Dela Cruz", subject: "Filipino", load: 5, status: "Active" },
    { name: "Ms. Lim", subject: "MAPEH", load: 3, status: "Active" },
  ],
  feeData: [
    { grade: 7, collected: 340000, total: 378000 },
    { grade: 8, collected: 310000, total: 361000 },
    { grade: 9, collected: 205000, total: 290000 },
    { grade: 10, collected: 380000, total: 398000 },
    { grade: 11, collected: 290000, total: 342000 },
    { grade: 12, collected: 220000, total: 270000 },
  ],
  calendarEvents: [
    { date: "Mar 25", label: "Enrollment deadline – Grade 7", type: "deadline" },
    { date: "Mar 28", label: "Parent-Teacher Conference", type: "event" },
    { date: "Apr 2", label: "DepEd Report Submission", type: "deadline" },
    { date: "Apr 5", label: "Foundation Week", type: "event" },
    { date: "Apr 10", label: "Quarterly Exam – All Grades", type: "exam" },
  ],
  notifications: [
    { msg: "Grade 7 section A is at full capacity", type: "warn", time: "2m ago" },
    { msg: "12 pending applications need review", type: "info", time: "15m ago" },
    { msg: "DepEd report due in 9 days", type: "alert", time: "1h ago" },
  ],
  strands: [
    { name: "STEM", count: 820 },
    { name: "ABM", count: 540 },
    { name: "HUMSS", count: 610 },
    { name: "GAS", count: 480 },
    { name: "TVL", count: 320 },
  ],
  recentActivity: [
    { name: "John Jay Doe", time: "10:32 am", grade: 10, action: "Enrolled" },
    { name: "Maria Santos", time: "10:28 am", grade: 7, action: "Enrolled" },
    { name: "Jose Reyes", time: "10:21 am", grade: 11, action: "Pending" },
    { name: "Ana Dela Cruz", time: "10:15 am", grade: 8, action: "Enrolled" },
    { name: "Pedro Lim", time: "10:09 am", grade: 9, action: "Enrolled" },
    { name: "Rosa Mendoza", time: "10:03 am", grade: 12, action: "Pending" },
    { name: "Carlo Bautista", time: "09:57 am", grade: 7, action: "Enrolled" },
    { name: "Liza Garcia", time: "09:51 am", grade: 10, action: "Enrolled" },
  ],
  transferees: {
    incoming: 34,
    outgoing: 12,
    returnees: 8,
    demographics: [
      { label: "Davao City", pct: "42%" },
      { label: "Outside Davao", pct: "35%" },
      { label: "Probinsya", pct: "23%" },
    ],
  },
  reports: [
    { label: "SF1 – School Register", status: "Ready" },
    { label: "SF2 – Daily Attendance", status: "Ready" },
    { label: "SF4 – Progress Report", status: "Pending" },
    { label: "SF9 – Report Card", status: "Pending" },
    { label: "Enrollment Summary CSV", status: "Export" },
  ],
};

export const STATUS_COLOR = {
  Full: { badge: "badge--red", dot: "#EF5350" },
  Near: { badge: "badge--amber", dot: "#FFA726" },
  Available: { badge: "badge--green", dot: "#66BB6A" },
};

export const SEVERITY_COLOR = {
  high: "badge--red",
  med: "badge--amber",
  low: "badge--blue",
};

export const NOTIF_STYLE = {
  warn: { bg: "#FFFDE7", border: "#FDD835", icon: "⚠", color: "#F9A825" },
  info: { bg: "#E3F2FD", border: "#90CAF9", icon: "ℹ", color: "#1565C0" },
  alert: { bg: "#FFEBEE", border: "#EF9A9A", icon: "!", color: "#C62828" },
};

export const EVENT_DOT = { deadline: "#E53935", event: "#2E7D32", exam: "#E65100" };

export const STRAND_COLORS = ["#1B5E20", "#F9A825", "#1565C0", "#6A1B9A", "#BF360C"];

export const BAR_MAX = 7000;

export const fmt = (n) =>
  n >= 1_000_000 ? `₱${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `₱${(n / 1000).toFixed(0)}K` : `₱${n}`;

export const pctColor = (p) => (p >= 90 ? "#2E7D32" : p >= 70 ? "#E65100" : "#C62828");

export const attColor = (r) => (r >= 93 ? "#2E7D32" : r >= 88 ? "#E65100" : "#C62828");

export const ALL_TABS = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "academic", label: "Academic", icon: "📚" },
  { id: "people", label: "People & HR", icon: "👥" },
  { id: "operations", label: "Operations", icon: "⚙️" },
];

export const ROLES = ["Admin", "Registrar", "Teacher"];
