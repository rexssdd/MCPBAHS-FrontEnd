// src/pages/Principal/NotificationsPage.jsx
// Fetches BOTH:
//   1) Announcements (target_audience = "All" | "Faculty" | "Internal" — excludes "Parents")
//   2) Report notifications (only Approved / Disapproved statuses)
// Same dual-fetch pattern as Admin; merges and groups into Today / Yesterday / Earlier.

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Sidebar from "../../Components/Sidebar";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../Components/ui";
import { fetchAnnouncements } from "../../Api/announcementApi";
import reportsService from "../../services/Principal/reportService";
import { toText } from "../../utils/safeRender.js";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../../services/Principal/notificationService";
import "../../Css/Teacher/Notification.css"; // reuse teacher notification styles

// ─── Constants ─────────────────────────────────────────────────────────────────
const GROUP_ORDER    = ["Today", "Yesterday", "Earlier"];
const FACULTY_AUDIENCES = new Set(["All", "Faculty", "Internal", "Teachers", "Staff"]);
const CACHE_KEY      = "principal_notif_v2";
const CACHE_TTL      = 2 * 60 * 1000;

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts > CACHE_TTL ? null : data;
  } catch { return null; }
}
function writeCache(data) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* quota */ }
}

// withTimeout races promise p against a ms-millisecond deadline.
// Uses its own internal timer that is always cleared when the race settles.
// Does NOT take a shared controller — each parallel call manages its own
// timeout independently so one slow request cannot abort a sibling that
// already succeeded.
function withTimeout(p, ms) {
  let timer;
  const timeout = new Promise((_, rej) => {
    timer = setTimeout(() => rej(new Error("Timeout")), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

// ─── Date helpers ───────────────────────────────────────────────────────────────
function getGroup(dateStr) {
  if (!dateStr) return "Earlier";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Earlier";
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yestStart  = new Date(todayStart); yestStart.setDate(yestStart.getDate() - 1);
  if (d >= todayStart) return "Today";
  if (d >= yestStart)  return "Yesterday";
  return "Earlier";
}
function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d >= todayStart) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase();
  return d.toLocaleDateString();
}

// ─── Converters ─────────────────────────────────────────────────────────────────
function announcementToNotif(a) {
  const audience = a.target_audience ?? a.audience ?? "";
  if (audience && !FACULTY_AUDIENCES.has(audience)) return null; // skip parents-only
  const dateStr = a.scheduled_at ?? a.created_at ?? a.updated_at ?? null;
  return {
    id: `ann-${a.uuid ?? a.id}`,
    type: "announcement", read: false,
    message: a.message ?? a.title ?? "New announcement",
    time: formatTime(dateStr), group: getGroup(dateStr), _sortDate: dateStr,
    detail: {
      type: "announcement", title: a.title ?? "Announcement",
      urgency: a.urgency ?? "—", audience: audience || "All",
      scheduledOn: dateStr ? new Date(dateStr).toLocaleDateString() : "—",
      updatedOn: a.updated_at ? new Date(a.updated_at).toLocaleDateString() : "—",
      status: a.status ?? "—", comments: a.message ?? "—",
    },
  };
}

function reportToNotif(r) {
  const status = r.status ?? r.status_label ?? "";
  if (!status || status === "Pending") return null;
  const isApproved = status === "Approved";
  const dateStr  = r.evaluatedOn ?? r.updated_at ?? r.dateSubmitted ?? null;

  // GET /reports (ReportResource) returns original_filename / file.original_filename
  // and form_type ("sf1".."sf10") — not fileName/sfNumber.
  const sfNumber = r.sfNumber ?? (r.form_type ? String(r.form_type).replace(/^sf/i, "") : null);
  const fileName = r.fileName ?? r.original_filename ?? r.file?.original_filename ?? `SF${sfNumber ?? "?"}.pdf`;
  const docId    = r.docId ?? r.uuid ?? fileName;

  // submitted_by comes back as a relation object { uuid, name }, not a plain
  // string — toText() pulls the readable name out instead of passing the
  // raw object through (which crashed the detail modal with React error #31).
  const submittedByName = toText(r.submittedBy ?? r.submitted_by, "a teacher");

  return {
    id: `rpt-${r.uuid ?? r.id}`,
    type: "report", read: false,
    message: isApproved
      ? `Report ${docId} submitted by ${submittedByName} has been approved`
      : `Report ${docId} submitted by ${submittedByName} has been disapproved`,
    time: formatTime(dateStr), group: getGroup(dateStr), _sortDate: dateStr,
    detail: {
      type: "report",
      title: isApproved ? "Report Approved" : "Report Disapproved",
      fileName,
      submittedBy: submittedByName,
      submittedOn: r.submittedOn ?? r.dateSubmitted ?? "—",
      evaluatedOn: dateStr ? new Date(dateStr).toLocaleDateString() : "—",
      gradeLevel:  r.gradeLevel ?? "—",
      section:     r.section ?? "—",
      status,
      comments: r.comment ?? r.remarks ?? "No comments provided.",
    },
  };
}

function extractReports(val) {
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.data)) return val.data;
  return [];
}

function mergeSort(a, b) {
  const all = [...a, ...b];
  all.sort((x, y) => {
    const tX = x._sortDate ? new Date(x._sortDate).getTime() : 0;
    const tY = y._sortDate ? new Date(y._sortDate).getTime() : 0;
    if (tY !== tX) return tY - tX;
    return x.type === "report" ? -1 : 1;
  });
  return all;
}

// ─── Mock fallback ──────────────────────────────────────────────────────────────
const MOCK_NOTIFS = [
  {
    id: "mock-r1", type: "report", read: false,
    message: "Report SF1-2025-001 submitted by Maria Santos has been approved",
    time: "10:30 am", group: "Today", _sortDate: null,
    detail: { type: "report", title: "Report Approved", fileName: "SF1.pdf",
      submittedBy: "Maria Santos", submittedOn: "12/05/25", evaluatedOn: "12/06/25",
      gradeLevel: "Grade 8", section: "Orion", status: "Approved",
      comments: "Report is complete and accurate." },
  },
  {
    id: "mock-r2", type: "report", read: false,
    message: "Report SF2-2025-002 submitted by John Doe has been disapproved",
    time: "09:00 am", group: "Today", _sortDate: null,
    detail: { type: "report", title: "Report Disapproved", fileName: "SF2.pdf",
      submittedBy: "John Doe", submittedOn: "12/04/25", evaluatedOn: "12/06/25",
      gradeLevel: "Grade 7", section: "Gemini", status: "Disapproved",
      comments: "Missing entries in rows 14–18. Please correct and resubmit." },
  },
  {
    id: "mock-a1", type: "announcement", read: true,
    message: "Faculty meeting this Friday at 3:00 PM. Attendance is required.",
    time: "08:00 am", group: "Today", _sortDate: null,
    detail: { type: "announcement", title: "Faculty Meeting", urgency: "High",
      audience: "Faculty", scheduledOn: "12/06/25", updatedOn: "12/06/25",
      status: "Active", comments: "Faculty meeting this Friday at 3:00 PM. Attendance is required." },
  },
];

// ─── Icons ──────────────────────────────────────────────────────────────────────
const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const MegaphoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l19-9-9 19-2-8-8-2z"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const SpinnerIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ animation: "spin 0.8s linear infinite" }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

// ─── DetailModal ────────────────────────────────────────────────────────────────
function DetailModal({ notif, onClose }) {
  const d = notif.detail ?? {};
  const isReport = notif.type === "report";
  return (
    <Modal size="md" onClose={onClose}>
      <ModalHeader icon={
        <><circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/></>
      }>
        {toText(d.title, isReport ? "Report Update" : "Announcement")}
      </ModalHeader>

      <ModalBody>
        {isReport ? (
          <>
            <p className="form-section-title" style={{ marginBottom: "12px" }}>Report Details</p>
            <div className="form-grid-3" style={{ marginBottom: "20px" }}>
              {[["File Name", d.fileName], ["Submitted By", d.submittedBy], ["Submitted On", d.submittedOn],
                ["Evaluated On", d.evaluatedOn], ["Grade Level", d.gradeLevel], ["Section", d.section]
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="info-field-label">{label}</p>
                  <div className="form-input" style={{ cursor: "default" }}>{toText(value)}</div>
                </div>
              ))}
            </div>
            <div style={{ height: "1px", background: "var(--gray-100)", marginBottom: "16px" }}/>
            <p className="form-section-title" style={{ marginBottom: "12px" }}>Decision</p>
            <div style={{ marginBottom: "12px" }}>
              <p className="info-field-label">Status</p>
              <div className="form-input" style={{
                cursor: "default",
                color: d.status === "Disapproved" ? "var(--red-700)" : "#15803d",
                fontWeight: 600,
              }}>{toText(d.status)}</div>
            </div>
            <div>
              <p className="info-field-label">Comments / Remarks</p>
              <div className="form-input" style={{ cursor: "default", minHeight: "60px", lineHeight: 1.6 }}>
                {toText(d.comments, "No comments provided.")}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="form-section-title" style={{ marginBottom: "12px" }}>Announcement Details</p>
            <div className="form-grid-3" style={{ marginBottom: "20px" }}>
              {[["Urgency", d.urgency], ["Audience", d.audience], ["Scheduled", d.scheduledOn]].map(([label, value]) => (
                <div key={label}>
                  <p className="info-field-label">{label}</p>
                  <div className="form-input" style={{ cursor: "default" }}>{toText(value)}</div>
                </div>
              ))}
            </div>
            <div style={{ height: "1px", background: "var(--gray-100)", marginBottom: "16px" }}/>
            <p className="form-section-title" style={{ marginBottom: "12px" }}>Message</p>
            <div>
              <div className="form-input" style={{ cursor: "default", minHeight: 60, lineHeight: 1.6 }}>
                {toText(d.comments)}
              </div>
            </div>
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <button className="btn btn-primary" onClick={onClose}>
          {isReport ? <><EyeIcon/> Go To Reports <ArrowIcon/></> : <><MegaphoneIcon/> Close <ArrowIcon/></>}
        </button>
      </ModalFooter>
    </Modal>
  );
}

// ─── NotifItem ──────────────────────────────────────────────────────────────────
function NotifItem({ notif, onView, onMarkRead, onDelete }) {
  const rowClass    = `notif-item ${notif.read ? "notif-item--read" : "notif-item--unread"}`;
  const dotClass    = `notif-item__dot ${notif.read ? "notif-item__dot--read" : "notif-item__dot--unread"}`;
  const msgClass    = `notif-item__message ${notif.read ? "notif-item__message--read" : "notif-item__message--unread"}`;
  const avatarStyle = notif.type === "announcement"
    ? { background: "#fffbeb", color: "#92400e" }
    : { background: "var(--green-50)", color: "var(--green-800)" };

  return (
    <div role="listitem" className={rowClass} data-testid={`notif-item-${notif.id}`}>
      <div className={dotClass} data-testid={notif.read ? "dot-read" : "dot-unread"} aria-hidden="true"/>

      <div className="notif-item__avatar" style={avatarStyle} aria-hidden="true">
        {notif.type === "announcement" ? <MegaphoneIcon/> : <BellIcon/>}
      </div>

      <div className="notif-item__body">
        <p className={msgClass} title={notif.message}>{notif.message}</p>
        <p className="notif-item__time">
          <time>{notif.time}</time>
          {notif.type === "announcement" && (
            <span style={{ marginLeft: 8, fontSize: 10, color: "var(--green-700)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Announcement
            </span>
          )}
        </p>
      </div>

      <div className="notif-item__actions">
        {!notif.read ? (
          <button type="button"
            className="btn btn-outline btn-sm notif-item__action-btn notif-item__action-btn--read"
            data-testid="btn-mark-read" aria-label="Mark as read"
            onClick={() => onMarkRead(notif.id)}>
            <CheckIcon/> Mark as Read
          </button>
        ) : (
          <span className="notif-item__action-spacer" aria-hidden="true"/>
        )}
        <button type="button"
          className="btn btn-outline btn-sm notif-item__action-btn notif-item__action-btn--view"
          data-testid="btn-view" aria-label="View details"
          onClick={() => onView(notif)}>
          <EyeIcon/> View Details
        </button>
        <button type="button"
          className="btn btn-outline btn-sm notif-item__action-btn notif-item__action-btn--delete"
          data-testid="btn-delete" aria-label="Delete notification"
          onClick={() => onDelete(notif.id)}>
          <TrashIcon/> Delete
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div data-testid="loading-state" style={{ padding: "60px", textAlign: "center", color: "var(--gray-400)" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", color: "var(--green-800)" }}>
        <SpinnerIcon/>
      </div>
      <div style={{ fontWeight: 600, marginBottom: "4px" }}>Loading notifications…</div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const cached = readCache();
  const [notifications, setNotifications] = useState(cached ?? []);
  const [loading,        setLoading]       = useState(!cached);
  const [errors,         setErrors]        = useState([]);
  const [actionInFlight, setActionInFlight] = useState(false);
  const [deletedIds,     setDeletedIds]    = useState(new Set());
  const [readIds,        setReadIds]       = useState(new Set());
  const [activeNotif,    setActiveNotif]   = useState(null);
  const [usingFallback,  setUsingFallback] = useState(false);
  const isMounted = useRef(true);
  useEffect(() => () => {
    isMounted.current = false;
    // Cancel any in-flight fetch on unmount so setState is never called on
    // a dead component and the TCP connection is released immediately.
    abortRef.current?.abort();
  }, []);

  // ── Fetch both sources ──────────────────────────────────────────────────────
  //
  // FIX – AbortController wired to all three fetch calls:
  //   • The previous code created no AbortController so fetch sockets stayed
  //     open for up to ~3 min after withTimeout rejected.
  //   • We now create one controller per invocation, cancel any previous call
  //     on re-entry (rapid user retries), and cancel on component unmount.
  //
  // FIX – loading=true stuck-spinner:
  //   • setLoading(false) is now in a finally block so it always runs, even
  //     when an exception or abort escapes the try block.
  const abortRef = useRef(null);

  const loadNotifications = useCallback(async (showSpinner = false) => {
    // Cancel any previous in-flight fetch
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current  = controller;
    const { signal } = controller;

    if (showSpinner) setLoading(true);
    setErrors([]);
    const newErrors = [];

    try {
      // The backend's GET /notifications now returns the full {id, type, read,
      // message, time, group, detail} shape (announcements + report verdicts).
      // We still fetch /announcements and /reports separately for richness, but
      // /notifications acts as a reliable fallback for report verdicts.
      const [annResult, rptResult, notifResult] = await Promise.allSettled([
        withTimeout(fetchAnnouncements({ signal }), 6000),
        withTimeout(reportsService.getReports({ limit: 100 }), 6000),
        withTimeout(fetchNotifications(), 6000),
      ]);

      // Guard: bail only if unmounted or a newer loadNotifications call has taken over.
      // Do NOT gate on signal.aborted — the signal is shared across the three parallel
      // withTimeout calls; if one times out it aborts the signal and this guard would
      // discard all successfully-fetched data from the other two calls.
      if (!isMounted.current || abortRef.current !== controller) return;

      // Announcements — filter faculty-visible
      let annNotifs = [];
      if (annResult.status === "fulfilled" && annResult.value?.ok !== false) {
        const raw = annResult.value?.data ?? annResult.value ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        annNotifs = list.map(announcementToNotif).filter(Boolean);
      } else {
        newErrors.push("Announcements: " + (annResult.reason?.message ?? "Failed"));
      }

      // Report evaluations (Approved/Disapproved only).
      // Primary: dedicated reports endpoint.
      // Fallback: /notifications endpoint (now returns full shape from AppCompatController).
      let rptNotifs = [];
      if (rptResult.status === "fulfilled") {
        const evaluated = extractReports(rptResult.value).filter(r =>
          r.status === "Approved" || r.status === "Disapproved" ||
          r.status_label === "Approved" || r.status_label === "Disapproved"
        );
        rptNotifs = evaluated.map(reportToNotif).filter(Boolean);
      } else {
        // /reports failed — try the notifications endpoint which now returns the
        // correct full shape (id, type, read, message, detail) rather than the
        // old {msg, type, time} stub from PrincipalDashboardController.
        if (notifResult.status === "fulfilled") {
          const notifData = notifResult.value?.data ?? notifResult.value ?? [];
          const notifArr  = Array.isArray(notifData) ? notifData : (notifData?.data ?? []);
          rptNotifs = notifArr
            .filter(n => n.type === "report" && n.message)
            .map(n => ({
              id:        n.id,
              type:      "report",
              read:      n.read ?? false,
              message:   n.message,
              time:      n.time ?? "",
              group:     n.group ?? "Earlier",
              _sortDate: n._sortDate ?? null,
              detail:    n.detail ?? {},
            }));
        } else {
          newErrors.push("Reports: " + (rptResult.reason?.message ?? "Failed"));
        }
      }

      const merged = mergeSort(annNotifs, rptNotifs);

      if (merged.length === 0 && newErrors.length >= 2) {
        setNotifications(MOCK_NOTIFS);
        setUsingFallback(true);
      } else {
        setNotifications(merged);
        setUsingFallback(false);
        writeCache(merged);
      }

      setErrors(newErrors.length < 2 ? [] : newErrors);
    } finally {
      // Always clear the spinner — even if an exception or abort escapes above.
      if (isMounted.current && abortRef.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications(!cached);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Visible list ─────────────────────────────────────────────────────────────
  const visibleNotifications = useMemo(() =>
    notifications
      .filter(n => !deletedIds.has(n.id))
      .map(n    => readIds.has(n.id) ? { ...n, read: true } : n),
    [notifications, deletedIds, readIds]
  );

  const groups = useMemo(() =>
    visibleNotifications.reduce((acc, n) => {
      const g = GROUP_ORDER.includes(n.group) ? n.group : "Earlier";
      (acc[g] ??= []).push(n);
      return acc;
    }, {}),
    [visibleNotifications]
  );

  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  // ── Actions ──────────────────────────────────────────────────────────────────
  const markRead = useCallback((id) => {
    if (!id) return;
    setReadIds(prev => new Set(prev).add(id));
    setActiveNotif(cur => cur?.id === id ? { ...cur, read: true } : cur);
    if (!usingFallback) markNotificationRead(id);
  }, [usingFallback]);

  const handleView = useCallback((notif) => {
    if (!notif) return;
    setActiveNotif({ ...notif, read: true });
    if (!notif.read) markRead(notif.id);
  }, [markRead]);

  const handleDelete = useCallback((id) => {
    if (!id) return;
    setDeletedIds(prev => new Set(prev).add(id));
    setActiveNotif(cur => cur?.id === id ? null : cur);
    if (!usingFallback) deleteNotification(id);
  }, [usingFallback]);

  const handleMarkAllRead = useCallback(() => {
    if (actionInFlight) return;
    setActionInFlight(true);
    const ids = visibleNotifications.filter(n => !n.read).map(n => n.id);
    setReadIds(prev => new Set([...prev, ...ids]));
    if (!usingFallback) markAllNotificationsRead().finally(() => setActionInFlight(false));
    else setActionInFlight(false);
  }, [visibleNotifications, usingFallback, actionInFlight]);

  const handleClearAll = useCallback(() => {
    if (actionInFlight) return;
    setActionInFlight(true);
    const ids = visibleNotifications.map(n => n.id);
    setDeletedIds(prev => new Set([...prev, ...ids]));
    setActiveNotif(null);
    if (!usingFallback) deleteAllNotifications().finally(() => setActionInFlight(false));
    else setActionInFlight(false);
  }, [visibleNotifications, usingFallback, actionInFlight]);

  return (
    <div className="page-layout">
      <Sidebar role="principal"/>

      <main id="main-content" className="page-main">
        <div className="page-body">

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <h1 className="page-title">Notifications</h1>
                {unreadCount > 0 && (
                  <span data-testid="unread-badge" style={{
                    background: "var(--green-800)", color: "#fff",
                    fontSize: "11px", fontWeight: 700,
                    padding: "2px 10px", borderRadius: "99px",
                  }}>
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="page-subtitle">
                Faculty announcements and report evaluation updates.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-outline" title="Refresh"
                onClick={() => loadNotifications(true)} disabled={loading}>
                ↻
              </button>
              {unreadCount > 0 && (
                <button className="btn btn-outline" data-testid="btn-mark-all-read"
                  onClick={handleMarkAllRead} disabled={loading || actionInFlight}>
                  <CheckIcon/> Mark all read
                </button>
              )}
              <button className="btn btn-outline" data-testid="btn-clear-all"
                onClick={handleClearAll} disabled={loading || actionInFlight || visibleNotifications.length === 0}>
                Clear All
              </button>
            </div>
          </div>

          {/* ── Fallback banner ── */}
          {usingFallback && (
            <div style={{ padding: "10px 16px", borderRadius: 8, background: "#fefce8", border: "1px solid #fde68a", color: "#92400e", fontSize: 13, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>⚠️ Couldn't reach the server — showing sample data.</span>
              <button className="btn btn-outline btn-sm" onClick={() => loadNotifications(true)}>Retry</button>
            </div>
          )}

          {/* ── Partial error ── */}
          {!usingFallback && errors.length > 0 && (
            <div style={{ padding: "10px 16px", borderRadius: 8, background: "#fefce8", border: "1px solid #fde68a", color: "#92400e", fontSize: 13, marginBottom: 16 }}>
              ⚠️ Some notifications may be missing: {errors.join(" · ")}
            </div>
          )}

          {/* ── Body ── */}
          <div className="form-card notif-page__list-card" role="list" aria-label="Notifications">
            {loading ? (
              <LoadingSkeleton/>
            ) : visibleNotifications.length === 0 ? (
              <div data-testid="empty-state" style={{ padding: "60px", textAlign: "center", color: "var(--gray-400)" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔔</div>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>All caught up!</div>
                <div style={{ fontSize: "13px" }}>No notifications to show.</div>
              </div>
            ) : (
              GROUP_ORDER.map(group => {
                const items = groups[group];
                if (!items?.length) return null;
                return (
                  <div key={group} role="group" aria-label={group} data-testid={`group-${group.toLowerCase()}`}>
                    <p className="notif-group__label">{group}</p>
                    {items.map(notif => (
                      <NotifItem key={notif.id} notif={notif}
                        onView={handleView} onMarkRead={markRead} onDelete={handleDelete}/>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* ── Detail modal ── */}
      {activeNotif && (
        <DetailModal notif={activeNotif} onClose={() => setActiveNotif(null)}/>
      )}
    </div>
  );
}