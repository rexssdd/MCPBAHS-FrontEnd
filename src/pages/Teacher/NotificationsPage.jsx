// src/pages/Teacher/NotificationsPage.jsx
// Fetches BOTH:
//   1) Announcements (target_audience = "All" | "Faculty" | "Internal" — excludes "Parents")
//   2) Report notifications (only Approved / Disapproved statuses)
// Merges and groups into Today / Yesterday / Earlier buckets.

import { useState, useCallback, useEffect, useRef, useMemo, memo } from "react";
import Sidebar from "../../Components/Sidebar";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../Components/ui";
import notificationService from "../../services/teacher/notificationService";
import "../../Css/Teacher/Notification.css";

// ─── Constants ─────────────────────────────────────────────────────────────────
const GROUP_ORDER = ["Today", "Yesterday", "Earlier"];

// Announcement audiences that teachers/faculty should see (excludes Parents)
const FACULTY_AUDIENCES = new Set(["All", "Faculty", "Internal", "Teachers", "Staff"]);

const STATUS_CLASS = {
  Disapproved: "notif-modal__status--disapproved",
  Approved:    "notif-modal__status--approved",
};

// ─── Date helpers ──────────────────────────────────────────────────────────────
function getGroup(dateStr) {
  if (!dateStr) return "Earlier";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Earlier";
  const now          = new Date();
  const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yestStart    = new Date(todayStart); yestStart.setDate(yestStart.getDate() - 1);
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
  if (d >= todayStart) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase();
  }
  return d.toLocaleDateString();
}

// ─── Converters ────────────────────────────────────────────────────────────────
function announcementToNotif(a) {
  const audience = a.target_audience ?? a.audience ?? "";
  // Skip if audience is Parents-only
  if (audience && !FACULTY_AUDIENCES.has(audience)) return null;

  const dateStr = a.scheduled_at ?? a.created_at ?? a.updated_at ?? null;
  return {
    id:        `ann-${a.uuid ?? a.id}`,
    type:      "announcement",
    read:      false,
    message:   a.message ?? a.title ?? "New announcement",
    time:      formatTime(dateStr),
    group:     getGroup(dateStr),
    _sortDate: dateStr,
    detail: {
      type:        "announcement",
      title:       a.title ?? "Announcement",
      urgency:     a.urgency ?? "—",
      audience:    audience || "All",
      scheduledOn: dateStr ? new Date(dateStr).toLocaleDateString() : "—",
      updatedOn:   a.updated_at ? new Date(a.updated_at).toLocaleDateString() : "—",
      status:      a.status ?? "—",
      comments:    a.message ?? "—",
    },
  };
}

function reportToNotif(r) {
  const status = r.status ?? r.status_label ?? "";
  if (!status || status === "Pending") return null;

  const isApproved = status === "Approved";
  const dateStr    = r.evaluatedOn ?? r.updated_at ?? r.dateSubmitted ?? null;
  const fileName   = r.fileName ?? r.original_filename ?? `SF${r.sfNumber ?? "?"}.pdf`;
  const docId      = r.docId ?? r.uuid ?? fileName;

  return {
    id:        `rpt-${r.uuid ?? r.id}`,
    type:      "report",
    read:      false,
    message:   isApproved
      ? `Your report ${docId} has been approved by the principal`
      : `Your report ${docId} has been disapproved by the principal`,
    time:      formatTime(dateStr),
    group:     getGroup(dateStr),
    _sortDate: dateStr,
    detail: {
      type:        "report",
      title:       isApproved ? "Report Approved" : "Report Disapproved",
      fileName,
      submittedOn: r.submittedOn ?? r.dateSubmitted ?? "—",
      evaluatedOn: dateStr ? new Date(dateStr).toLocaleDateString() : "—",
      status,
      comments:    r.comment ?? r.remarks ?? "No comments provided.",
    },
  };
}

function mergeSort(annNotifs, rptNotifs) {
  const all = [...annNotifs, ...rptNotifs];
  all.sort((a, b) => {
    const tA = a._sortDate ? new Date(a._sortDate).getTime() : 0;
    const tB = b._sortDate ? new Date(b._sortDate).getTime() : 0;
    if (tB !== tA) return tB - tA;
    return a.type === "report" ? -1 : 1;
  });
  return all;
}

// ─── Fallback mock data (shown when API is unreachable) ───────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: "mock-1", type: "report", read: false,
    message: "Your report SF1-2025-001 has been approved by the principal",
    time: "10:30 am", group: "Today", _sortDate: null,
    detail: { type: "report", title: "Report Approved", fileName: "SF1.pdf",
      submittedOn: "12/05/25", evaluatedOn: "12/06/25", status: "Approved",
      comments: "Report is complete and accurate. Good job!" },
  },
  {
    id: "mock-2", type: "report", read: false,
    message: "Your report SF2-2025-002 has been disapproved by the principal",
    time: "09:15 am", group: "Today", _sortDate: null,
    detail: { type: "report", title: "Report Disapproved", fileName: "SF2.pdf",
      submittedOn: "12/04/25", evaluatedOn: "12/06/25", status: "Disapproved",
      comments: "Missing entries in rows 14–18. Please correct and resubmit." },
  },
  {
    id: "mock-3", type: "announcement", read: true,
    message: "Faculty meeting this Friday at 3:00 PM. Attendance is required.",
    time: "08:00 am", group: "Today", _sortDate: null,
    detail: { type: "announcement", title: "Faculty Meeting", urgency: "High",
      audience: "Faculty", scheduledOn: "12/06/25", updatedOn: "12/06/25",
      status: "Active", comments: "Faculty meeting this Friday at 3:00 PM. Attendance is required." },
  },
];

// ─── Icons ─────────────────────────────────────────────────────────────────────
const BellIcon  = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
));
const EyeIcon   = memo(() => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
));
const CheckIcon = memo(() => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
));
const TrashIcon = memo(() => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
));
const FileIcon  = memo(() => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
));
const ArrowIcon = memo(() => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
));
const MegaphoneIcon = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11l19-9-9 19-2-8-8-2z"/>
  </svg>
));

// ─── DetailModal ───────────────────────────────────────────────────────────────
const DetailModal = memo(function DetailModal({ notif, onClose }) {
  const d = notif.detail ?? {};
  const isReport = notif.type === "report";
  const statusClass = STATUS_CLASS[d.status] ?? "notif-modal__status--default";

  return (
    <Modal size="md" onClose={onClose}>
      <ModalHeader icon={
        <>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </>
      }>
        {d.title ?? (isReport ? "Report Update" : "Announcement")}
      </ModalHeader>

      <ModalBody>
        {isReport ? (
          <>
            <p className="form-section-title" style={{ marginBottom: "12px" }}>Submission Details</p>
            <div className="form-grid-3" style={{ marginBottom: "20px" }}>
              {[["File Name", d.fileName], ["Submitted On", d.submittedOn], ["Evaluated On", d.evaluatedOn]].map(([label, value]) => (
                <div key={label}>
                  <p className="info-field-label">{label}</p>
                  <div className="form-input" style={{ cursor: "default" }}>{value ?? "—"}</div>
                </div>
              ))}
            </div>
            <div className="notif-modal__divider"/>
            <p className="form-section-title" style={{ marginBottom: "12px" }}>Principal's Feedback</p>
            <div style={{ marginBottom: "12px" }}>
              <p className="info-field-label">Status</p>
              <div className={`form-input ${statusClass}`}>{d.status ?? "—"}</div>
            </div>
            <div>
              <p className="info-field-label">Comments / Remarks</p>
              <div className="form-input notif-modal__comments">{d.comments ?? "No comments provided."}</div>
            </div>
          </>
        ) : (
          <>
            <p className="form-section-title" style={{ marginBottom: "12px" }}>Announcement Details</p>
            <div className="form-grid-3" style={{ marginBottom: "20px" }}>
              {[["Urgency", d.urgency], ["Audience", d.audience], ["Scheduled", d.scheduledOn]].map(([label, value]) => (
                <div key={label}>
                  <p className="info-field-label">{label}</p>
                  <div className="form-input" style={{ cursor: "default" }}>{value ?? "—"}</div>
                </div>
              ))}
            </div>
            <div className="notif-modal__divider"/>
            <p className="form-section-title" style={{ marginBottom: "12px" }}>Message</p>
            <div>
              <div className="form-input notif-modal__comments" style={{ minHeight: 60, lineHeight: 1.6 }}>
                {d.comments ?? "—"}
              </div>
            </div>
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <button className="btn btn-primary" onClick={onClose}>
          {isReport ? <><FileIcon/> Go To Reports <ArrowIcon/></> : <><MegaphoneIcon/> Close <ArrowIcon/></>}
        </button>
      </ModalFooter>
    </Modal>
  );
});

// ─── NotifItem ─────────────────────────────────────────────────────────────────
const NotifItem = memo(function NotifItem({ notif, onView, onMarkRead, onDelete, disabled }) {
  const handleView      = useCallback(() => onView(notif),        [notif, onView]);
  const handleMarkRead  = useCallback(() => onMarkRead(notif.id), [notif.id, onMarkRead]);
  const handleDelete    = useCallback(() => onDelete(notif.id),   [notif.id, onDelete]);

  const rowClass = `notif-item ${notif.read ? "notif-item--read" : "notif-item--unread"}`;
  const dotClass = `notif-item__dot ${notif.read ? "notif-item__dot--read" : "notif-item__dot--unread"}`;
  const msgClass = `notif-item__message ${notif.read ? "notif-item__message--read" : "notif-item__message--unread"}`;

  return (
    <div role="listitem" className={rowClass}>
      <div className={dotClass} aria-hidden="true"/>
      <div className="notif-item__avatar" aria-hidden="true">
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
            onClick={handleMarkRead} disabled={disabled}
            aria-label={`Mark as read`}>
            <CheckIcon/> Mark as Read
          </button>
        ) : (
          <span className="notif-item__action-spacer" aria-hidden="true"/>
        )}
        <button type="button"
          className="btn btn-outline btn-sm notif-item__action-btn notif-item__action-btn--view"
          onClick={handleView} disabled={disabled}
          aria-label="View details">
          <EyeIcon/> View Details
        </button>
        <button type="button"
          className="btn btn-outline btn-sm notif-item__action-btn notif-item__action-btn--delete"
          onClick={handleDelete} disabled={disabled}
          aria-label="Delete notification">
          <TrashIcon/> Delete
        </button>
      </div>
    </div>
  );
});

// ─── NotifGroup ────────────────────────────────────────────────────────────────
const NotifGroup = memo(function NotifGroup({ label, items, onView, onMarkRead, onDelete, disabled }) {
  if (!items?.length) return null;
  return (
    <div role="group" aria-label={label}>
      <p className="notif-group__label">{label}</p>
      {items.map(notif => (
        <NotifItem key={notif.id} notif={notif} onView={onView}
          onMarkRead={onMarkRead} onDelete={onDelete} disabled={disabled}/>
      ))}
    </div>
  );
});

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function NotifSkeleton() {
  return (
    <div className="notif-skeleton" aria-busy="true" aria-label="Loading notifications">
      {[1,2,3,4].map(i => (
        <div key={i} className="notif-skeleton__row">
          <div className="notif-skeleton__dot"/>
          <div className="notif-skeleton__avatar"/>
          <div className="notif-skeleton__body">
            <div className="skeleton notif-skeleton__line notif-skeleton__line--message"/>
            <div className="skeleton notif-skeleton__line notif-skeleton__line--time"/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Timeout helper ────────────────────────────────────────────────────────────
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms)),
  ]);
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [mutating,      setMutating]      = useState(false);
  const [errors,        setErrors]        = useState([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [deletedIds,    setDeletedIds]    = useState(new Set());
  const [readIds,       setReadIds]       = useState(new Set());
  const [activeNotif,   setActiveNotif]   = useState(null);
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  // ── Fetch — single source ─────────────────────────────────────────────────
  // /teacher/notifications returns announcements + report verdicts pre-shaped.
  // Uses notificationService.getAll (which retries once on network failure)
  // for consistency with mutation helpers that also go through the service.
  const loadNotifications = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setErrors([]);

    let done = false;
    try {
      const result = await withTimeout(
        notificationService.getAll(),
        8000
      );

      const ok  = result?.ok === true;
      const raw = result?.data;
      const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);

      if (ok) {
        const items = arr.map(n => ({
          id:        n.id,
          type:      n.type      ?? "announcement",
          read:      n.read      ?? false,
          message:   n.message   ?? "Notification",
          time:      n.time      ?? new Date().toISOString(),
          group:     n.group     ?? "Earlier",
          _sortDate: n._sortDate ?? n.time ?? null,
          detail:    n.detail    ?? {},
        }));
        setNotifications(items);
        setUsingFallback(false);
        setErrors([]);
      } else {
        setNotifications(MOCK_NOTIFICATIONS);
        setUsingFallback(true);
        setErrors(["Could not load notifications: " + (result?.error ?? "server error")]);
      }
      done = true;
    } catch (err) {
      setNotifications(MOCK_NOTIFICATIONS);
      setUsingFallback(true);
      setErrors(["Could not load notifications: " + (err?.message ?? "network error")]);
      done = true;
    } finally {
      // always clear spinner — `done` flag is a safety net
      if (done || isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(true); }, [loadNotifications]);

  // ── Visible list (hide deleted, apply read overlay) ─────────────────────────
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
    if (!usingFallback) notificationService.markAsRead(id);
  }, [usingFallback]);

  const markAllRead = useCallback(() => {
    setMutating(true);
    const ids = visibleNotifications.filter(n => !n.read).map(n => n.id);
    setReadIds(prev => new Set([...prev, ...ids]));
    if (!usingFallback) notificationService.markAllAsRead().finally(() => setMutating(false));
    else setMutating(false);
  }, [visibleNotifications, usingFallback]);

  const handleView = useCallback((notif) => {
    if (!notif) return;
    setActiveNotif({ ...notif, read: true });
    if (!notif.read) markRead(notif.id);
  }, [markRead]);

  const handleDelete = useCallback((id) => {
    if (!id) return;
    setDeletedIds(prev => new Set(prev).add(id));
    setActiveNotif(cur => cur?.id === id ? null : cur);
    if (!usingFallback) notificationService.deleteOne(id);
  }, [usingFallback]);

  const handleClearAll = useCallback(() => {
    setMutating(true);
    const ids = visibleNotifications.map(n => n.id);
    setDeletedIds(prev => new Set([...prev, ...ids]));
    setActiveNotif(null);
    if (!usingFallback) notificationService.deleteAll().finally(() => setMutating(false));
    else setMutating(false);
  }, [visibleNotifications, usingFallback]);

  const hasNotifications = visibleNotifications.length > 0;
  const hasUnread        = unreadCount > 0;

  return (
    <div className="page-layout">
      <Sidebar role="teacher"/>

      <main id="main-content" className="page-main">
        <div className="page-body">

          {/* ── Header ── */}
          <div className="notif-page__header">
            <div>
              <div className="notif-page__title-row">
                <h1 className="page-title">Notifications</h1>
                {hasUnread && (
                  <span className="notif-page__badge" aria-live="polite"
                    aria-label={`${unreadCount} unread notifications`}>
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="page-subtitle">
                Announcements for faculty, and updates on your submitted reports.
              </p>
            </div>

            <div className="notif-page__header-actions">
              {hasUnread && !usingFallback && (
                <button type="button" className="btn btn-outline"
                  onClick={markAllRead} disabled={mutating}
                  aria-label="Mark all as read">
                  <CheckIcon/> Mark All as Read
                </button>
              )}
              {hasNotifications && !usingFallback && (
                <button type="button" className="btn btn-outline"
                  onClick={handleClearAll} disabled={mutating}
                  aria-label="Clear all notifications">
                  <TrashIcon/> Clear All
                </button>
              )}
              <button type="button" className="btn btn-outline"
                onClick={() => loadNotifications(true)} disabled={loading}
                title="Refresh notifications">
                ↻
              </button>
            </div>
          </div>

          {/* ── Fallback/Offline banner ── */}
          {usingFallback && (
            <div className="notif-page__fallback-banner" role="status">
              <div className="notif-page__fallback-banner-text">
                <span aria-hidden="true">⚠️</span>
                <span>Couldn't reach the server — showing sample data. Actions won't sync until reconnected.</span>
              </div>
              <button type="button" className="btn btn-outline btn-sm notif-page__fallback-retry"
                onClick={() => loadNotifications(true)}>
                Retry
              </button>
            </div>
          )}

          {/* ── Partial error banner ── */}
          {!usingFallback && errors.length > 0 && (
            <div style={{ padding: "10px 16px", borderRadius: 8, background: "#fefce8", border: "1px solid #fde68a", color: "#92400e", fontSize: 13, marginBottom: 16 }}>
              ⚠️ Some notifications may be missing: {errors.join(" · ")}
            </div>
          )}

          {/* ── Body ── */}
          {loading ? (
            <div className="form-card"><NotifSkeleton/></div>
          ) : (
            <div className="form-card notif-page__list-card" role="list" aria-label="Notifications">
              {!hasNotifications ? (
                <div className="notif-page__empty">
                  <div className="notif-page__empty-icon" aria-hidden="true">🔔</div>
                  <div className="notif-page__empty-title">All caught up!</div>
                  <div className="notif-page__empty-sub">
                    No notifications yet. You'll be notified about announcements and when the principal reviews your reports.
                  </div>
                </div>
              ) : (
                GROUP_ORDER.map(group => (
                  <NotifGroup
                    key={group} label={group} items={groups[group]}
                    onView={handleView} onMarkRead={markRead}
                    onDelete={handleDelete} disabled={mutating}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Detail modal ── */}
      {activeNotif != null && (
        <DetailModal notif={activeNotif} onClose={() => setActiveNotif(null)}/>
      )}
    </div>
  );
}