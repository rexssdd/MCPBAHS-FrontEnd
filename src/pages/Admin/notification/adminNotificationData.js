/* ─────────────────────────────────────────────────────────────────────────────
   adminNotificationData.js
   Shared constants, normalizers, and converters for the Admin Notification page.

   Notification types:
     "announcement" — sourced from GET /announcements
     "report"       — sourced from GET /reports  (Approved / Disapproved items)
─────────────────────────────────────────────────────────────────────────────── */

// ── Fallback mock data (shown when both APIs are unreachable) ─────────────────

export const MOCK_NOTIFICATIONS = [
  {
    id: "mock-r1",
    type: "report",
    read: false,
    message: "Your submitted report SF1b.pdf has been disapproved",
    time: "11:01 am",
    group: "Today",
    detail: {
      type:        "report",
      title:       "Report Disapproved",
      fileName:    "SF1b.pdf",
      submittedBy: "John Jay Doe",
      submittedOn: "12/05/25",
      evaluatedOn: "12/06/25",
      gradeLevel:  "Grade 7",
      section:     "Gemini",
      status:      "Disapproved",
      comments:    "The report contains missing data. Please resubmit with complete records.",
    },
  },
  {
    id: "mock-r2",
    type: "report",
    read: false,
    message: "Your submitted report SF2.pdf has been approved",
    time: "10:30 am",
    group: "Today",
    detail: {
      type:        "report",
      title:       "Report Approved",
      fileName:    "SF2.pdf",
      submittedBy: "Maria Santos",
      submittedOn: "12/05/25",
      evaluatedOn: "12/06/25",
      gradeLevel:  "Grade 8",
      section:     "Orion",
      status:      "Approved",
      comments:    "Report is complete and accurate. Good job!",
    },
  },
  {
    id: "mock-a1",
    type: "announcement",
    read: true,
    message: "Reminder: Parent-teacher conferences are scheduled for next week.",
    time: "09:00 am",
    group: "Today",
    detail: {
      type:        "announcement",
      title:       "Parent-Teacher Conference Reminder",
      urgency:     "High",
      audience:    "All",
      scheduledOn: "12/06/25",
      updatedOn:   "12/06/25",
      status:      "Pending",
      comments:    "Reminder: Parent-teacher conferences are scheduled for next week. Please submit final grades by Friday so families receive timely updates.",
    },
  },
];

export const GROUP_ORDER = ["Today", "Yesterday", "Earlier"];

// ── Safe value coercion ────────────────────────────────────────────────────────
// Some API fields (audience, section, gradeLevel, submittedBy, etc.) can come
// back as objects like { uuid, name } instead of plain strings. Rendering an
// object directly as a React child throws "Minified React error #31". This
// helper unwraps the common shapes down to a displayable string so every
// notification field is guaranteed to be primitive before it reaches JSX.
export function toDisplayValue(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.length ? value.map(v => toDisplayValue(v, "")).filter(Boolean).join(", ") : fallback;
  }
  if (typeof value === "object") {
    return (
      value.name ?? value.title ?? value.label ?? value.fullName ?? value.full_name ??
      value.section_name ?? value.sectionName ?? value.grade_level ?? value.gradeLevel ??
      value.value ?? value.uuid ?? value.id ?? fallback
    );
  }
  return String(value);
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function getGroupFromDate(dateStr) {
  if (!dateStr) return "Earlier";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Earlier";

  const now           = new Date();
  const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (d >= todayStart)     return "Today";
  if (d >= yesterdayStart) return "Yesterday";
  return "Earlier";
}

export function formatTime(dateStr) {
  if (!dateStr) return "Unknown time";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (d >= todayStart) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function toDateMs(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

// ── Generic normalizer (used for raw /notifications shape if ever needed) ──────

export const DEFAULT_DETAIL = {
  type:        "report",
  title:       "Notification",
  fileName:    "—",
  submittedOn: "—",
  evaluatedOn: "—",
  status:      "—",
  comments:    "—",
};

export function normalizeNotification(raw) {
  if (!raw || typeof raw !== "object") raw = {};
  return {
    id:    raw.id ?? raw.notificationId ?? raw.key ?? `${Date.now()}-${Math.random()}`,
    type:  raw.type ?? "report",
    read:  raw.read === true,
    message: typeof raw.message === "string"
      ? raw.message
      : String(raw.message ?? raw.title ?? "No notification message"),
    time:  typeof raw.time === "string" ? raw.time : String(raw.time ?? raw.createdAt ?? "Unknown time"),
    group: GROUP_ORDER.includes(raw.group) ? raw.group : "Earlier",
    detail: { ...DEFAULT_DETAIL, ...(raw.detail && typeof raw.detail === "object" ? raw.detail : {}) },
  };
}

export function normalizeNotifications(data) {
  if (!Array.isArray(data)) return [];
  return data.map(normalizeNotification);
}

// ── Announcement → Notification ───────────────────────────────────────────────

export function announcementToNotification(announcement) {
  if (!announcement || typeof announcement !== "object") return null;

  const id        = announcement.uuid ?? announcement.id ?? `ann-${Date.now()}-${Math.random()}`;
  const dateStr   = announcement.scheduled_at ?? announcement.created_at ?? null;
  const group     = getGroupFromDate(dateStr);
  const timeLabel = formatTime(dateStr);

  const title    = toDisplayValue(announcement.title ?? announcement.message?.slice(0, 80), "Announcement");
  const message  = typeof announcement.message === "string"
    ? announcement.message
    : toDisplayValue(announcement.message ?? announcement.title, "No message");
  const urgency  = toDisplayValue(announcement.urgency, "—");
  const status   = toDisplayValue(announcement.status, "—");
  const audience = toDisplayValue(announcement.target_audience, "All");

  return {
    id,
    type:    "announcement",
    read:    false,
    message: message.length > 120 ? message.slice(0, 117) + "…" : message,
    time:    timeLabel,
    group,
    _sortDate: dateStr,
    detail: {
      type:        "announcement",
      title,
      urgency,
      audience,
      scheduledOn: dateStr ? new Date(dateStr).toLocaleDateString() : "—",
      updatedOn:   announcement.updated_at
        ? new Date(announcement.updated_at).toLocaleDateString()
        : "—",
      status,
      comments:    message,
    },
  };
}

export function announcementsToNotifications(announcements) {
  if (!Array.isArray(announcements)) return [];
  return announcements.map(announcementToNotification).filter(Boolean);
}

// ── Report → Notification ─────────────────────────────────────────────────────
// Only Approved / Disapproved reports become notifications (they have a verdict
// + the principal's comment). Pending reports are silently skipped.

export function reportToNotification(report) {
  if (!report || typeof report !== "object") return null;

  const statusRaw = report.status ?? "";
  const status    = toDisplayValue(statusRaw, "");
  if (!status || status === "Pending") return null; // skip unreviewed

  const isApproved = status === "Approved";
  const id         = report.uuid ?? report.id ?? `rpt-${Date.now()}-${Math.random()}`;

  // ReportResource (backend) sends: original_filename, file.original_filename,
  // and form_type ("sf1".."sf10") — NOT fileName/file_name/sfNumber. Reading
  // the wrong field names here is what produced the literal "SF?.pdf"
  // placeholder text.
  const sfNumber = report.sfNumber ?? (
    report.form_type ? String(report.form_type).replace(/^sf/i, "") : null
  );
  const fileName = toDisplayValue(
    report.fileName ?? report.file_name ?? report.original_filename ?? report.file?.original_filename,
    `SF${toDisplayValue(sfNumber, "?")}.pdf`
  );
  const docId      = toDisplayValue(report.docId ?? report.doc_id, fileName);

  // Use evaluatedOn / updated_at / dateSubmitted for grouping
  const dateStr    = report.evaluatedOn
    ?? report.updated_at
    ?? report.dateSubmitted
    ?? report.submitted_at
    ?? null;
  const group     = getGroupFromDate(dateStr);
  const timeLabel = formatTime(dateStr);

  const message = isApproved
    ? `Report ${docId} has been approved by the principal`
    : `Report ${docId} has been disapproved by the principal`;

  const comment = toDisplayValue(report.comment ?? report.remarks ?? report.comments, "No comments provided.");

  return {
    id,
    type:    "report",
    read:    false,
    message,
    time:    timeLabel,
    group,
    _sortDate: dateStr,
    detail: {
      type:        "report",
      title:       isApproved ? "Report Approved" : "Report Disapproved",
      fileName,
      submittedBy: toDisplayValue(report.submittedBy ?? report.submitted_by, "—"),
      submittedOn: (() => {
        const d = report.submittedOn ?? report.submitted_at ?? report.dateSubmitted;
        if (!d) return "—";
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? String(d) : parsed.toLocaleDateString();
      })(),
      evaluatedOn: dateStr
        ? new Date(dateStr).toLocaleDateString()
        : "—",
      gradeLevel:  toDisplayValue(report.gradeLevel ?? report.grade_level, "—"),
      section:     toDisplayValue(report.section, "—"),
      status,
      comments:    comment,
    },
  };
}

export function reportsToNotifications(reports) {
  if (!Array.isArray(reports)) return [];
  return reports.map(reportToNotification).filter(Boolean);
}

// ── Merge + sort helper ───────────────────────────────────────────────────────
// Merges announcement-notifications and report-notifications into one list,
// newest first within each group, with a stable type-based tiebreak.

export function mergeAndSort(announcementNotifs, reportNotifs) {
  const all = [...announcementNotifs, ...reportNotifs];
  all.sort((a, b) => {
    const tA = toDateMs(a._sortDate);
    const tB = toDateMs(b._sortDate);
    if (tB !== tA) return tB - tA;          // newer first
    if (a.type !== b.type) return a.type === "report" ? -1 : 1; // reports first on tie
    return 0;
  });
  return all;
}