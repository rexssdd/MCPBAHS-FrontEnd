/* ─────────────────────────────────────────────────────────────────────────────
   AdminNotificationSections.jsx
   Shared UI pieces for the Admin Notification page.

   Handles two notification types:
     "report"       — report evaluated by the principal (Approved / Disapproved)
     "announcement" — school-wide announcement
─────────────────────────────────────────────────────────────────────────────── */

import {
  BellIcon,
  MegaphoneIcon,
  EyeIcon,
  CheckIcon,
  TrashIcon,
  ArrowIcon,
  AlertIcon,
  CloseIcon,
  RefreshIcon,
  XCircleIcon,
} from "./AdminNotificationIcons.jsx";

// ── ErrorBanner ───────────────────────────────────────────────────────────────

export function ErrorBanner({ message, onRetry, onDismiss }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <div className="error-banner-left">
        <AlertIcon />
        <span>{message}</span>
      </div>
      <div className="error-banner-actions">
        {onRetry && (
          <button className="ntn-btn ntn-btn--outline error-retry-btn" onClick={onRetry}>
            <RefreshIcon /> Retry
          </button>
        )}
        <button className="error-dismiss-btn" onClick={onDismiss} aria-label="Dismiss error">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

// ── Type badge shown inside the modal header ───────────────────────────────────

function TypeTag({ type }) {
  const isReport = type === "report";
  return (
    <span
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          "4px",
        fontSize:     "11px",
        fontWeight:   600,
        padding:      "2px 8px",
        borderRadius: "99px",
        background:   isReport ? "var(--notif-primary-light, #e8f5e8)" : "var(--notif-warning-light, #fffbeb)",
        color:        isReport ? "var(--notif-primary, #1a5c1a)"      : "var(--notif-warning, #b45309)",
        border:       `1px solid ${isReport ? "var(--notif-primary-mid, #246824)" : "var(--notif-warning, #f59e0b)"}`,
      }}
    >
      {isReport ? <BellIcon /> : <MegaphoneIcon />}
      {isReport ? "Report" : "Announcement"}
    </span>
  );
}

// ── Status chip (Approved / Disapproved / Pending) ────────────────────────────

function StatusChip({ status }) {
  const s = (status ?? "").toLowerCase();
  const isApproved    = s === "approved";
  const isDisapproved = s === "disapproved";

  const color = isApproved
    ? { bg: "var(--notif-success-light, #f0fdf4)",   border: "#86efac", text: "#166534" }
    : isDisapproved
    ? { bg: "var(--notif-danger-light, #fef2f2)",    border: "#fca5a5", text: "#991b1b" }
    : { bg: "var(--notif-warning-light, #fffbeb)",   border: "#fcd34d", text: "#92400e" };

  return (
    <div
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          "6px",
        padding:      "5px 12px",
        borderRadius: "99px",
        background:   color.bg,
        border:       `1px solid ${color.border}`,
        color:        color.text,
        fontWeight:   600,
        fontSize:     "13px",
      }}
    >
      {isApproved ? <CheckIcon /> : isDisapproved ? <XCircleIcon /> : <AlertIcon />}
      {status}
    </div>
  );
}

// ── Status → color mapping (shared by modal icon + status chip) ───────────────

function statusColors(status) {
  const s = (status ?? "").toLowerCase();
  if (s === "approved") {
    return { bg: "var(--notif-success-light, #f0fdf4)", border: "#86efac", text: "#166534" };
  }
  if (s === "disapproved") {
    return { bg: "var(--notif-danger-light, #fef2f2)", border: "#fca5a5", text: "#991b1b" };
  }
  return { bg: "var(--notif-warning-light, #fffbeb)", border: "#fcd34d", text: "#92400e" };
}

// ── DetailModal ────────────────────────────────────────────────────────────────

export function DetailModal({ notif, onClose, onGoTo }) {
  if (!notif) return null;
  const d          = notif.detail ?? {};
  const isReport   = notif.type === "report";
  const subLabel   = isReport ? "Review the principal's evaluation below." : "Announcement details below.";

  // The header icon reflects the actual outcome of this notification
  // (approved = green, disapproved = red, pending/announcement = amber)
  // instead of always rendering as a hard-coded "danger" red icon.
  const iconColor = statusColors(d.status);

  return (
    <div
      className="notif-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="notif-modal-box" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="notif-modal-header">
          <div className="notif-modal-header-left">
            <div
              className="notif-modal-icon"
              style={{ background: iconColor.bg, borderColor: iconColor.border, color: iconColor.text }}
            >
              {isReport ? <BellIcon /> : <MegaphoneIcon />}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                <h2 id="detail-modal-title" className="notif-modal-title" style={{ margin: 0 }}>
                  {d.title ?? (isReport ? "Report Evaluation" : "Announcement")}
                </h2>
                <TypeTag type={notif.type} />
              </div>
              <p className="notif-modal-sub">{subLabel}</p>
            </div>
          </div>
          <button className="notif-modal-close" onClick={onClose} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <div className="notif-modal-divider" />

        {/* Body — report */}
        {isReport && (
          <div className="notif-modal-body">
            <p className="notif-modal-section-label">Report Details</p>
            <div className="notif-modal-grid">
              {[
                ["File Name",     d.fileName    ?? "—"],
                ["Submitted By",  d.submittedBy ?? "—"],
                ["Submitted On",  d.submittedOn ?? "—"],
                ["Evaluated On",  d.evaluatedOn ?? "—"],
                ["Grade Level",   d.gradeLevel  ?? "—"],
                ["Section",       d.section     ?? "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="notif-field-label">{label}</p>
                  <div className="notif-field-value">{value}</div>
                </div>
              ))}
            </div>

            <div className="notif-modal-sep" />

            <p className="notif-modal-section-label" style={{ marginBottom: "10px" }}>
              Principal's Evaluation
            </p>

            <div style={{ marginBottom: "12px" }}>
              <p className="notif-field-label">Status</p>
              <StatusChip status={d.status} />
            </div>

            <div>
              <p className="notif-field-label">Comments / Remarks from Principal</p>
              <div className="notif-comments-value">
                {d.comments && d.comments !== "No comments provided."
                  ? d.comments
                  : <em style={{ color: "var(--notif-text-muted, #7a9280)" }}>No comments provided.</em>
                }
              </div>
            </div>
          </div>
        )}

        {/* Body — announcement */}
        {!isReport && (
          <div className="notif-modal-body">
            <p className="notif-modal-section-label">Announcement Details</p>
            <div className="notif-modal-grid">
              {[
                ["Scheduled On", d.scheduledOn ?? "—"],
                ["Last Updated", d.updatedOn   ?? "—"],
                ["Audience",     d.audience    ?? "All"],
                ["Priority",     d.urgency     ?? "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="notif-field-label">{label}</p>
                  <div className="notif-field-value">{value}</div>
                </div>
              ))}
            </div>

            <div className="notif-modal-sep" />

            <p className="notif-modal-section-label" style={{ marginBottom: "10px" }}>Status</p>
            <div style={{ marginBottom: "12px" }}>
              <StatusChip status={d.status ?? "Pending"} />
            </div>

            <div>
              <p className="notif-field-label">Message</p>
              <div className="notif-comments-value">{d.comments ?? "—"}</div>
            </div>
          </div>
        )}

        <div className="notif-modal-divider" />

        <div className="notif-modal-footer">
          <button className="ntn-btn ntn-btn--outline" onClick={onClose}>Close</button>
          <button className="ntn-btn ntn-btn--primary" onClick={onGoTo}>
            {isReport ? "Go to Reports" : "Go to Announcements"} <ArrowIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NotifItem (list row) ───────────────────────────────────────────────────────

export function NotifItem({ notif, onView, onMarkRead, onDelete, variant = "full" }) {
  const isReport = notif.type === "report";
  const TypeIcon = isReport ? BellIcon : MegaphoneIcon;

  if (variant === "simple") {
    const status = notif.detail?.status;
    const accent = isReport ? statusColors(status) : { bg: "var(--notif-warning-light, #fffbeb)", border: "#fcd34d", text: "var(--notif-warning, #b45309)" };

    return (
      <article
        className={`notif-item notif-item--simple${notif.read ? "" : " notif-item--unread"}`}
        onClick={() => onView(notif)}
        tabIndex={0}
        role="button"
        aria-label={`Open notification: ${notif.message}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView(notif); }
        }}
      >
        {/* Type icon */}
        <div
          className="notif-icon-wrap notif-icon-wrap--simple"
          style={{ background: accent.bg, color: accent.text, borderColor: accent.border }}
        >
          <TypeIcon />
        </div>

        <div className="notif-content notif-content--simple">
          <div className="notif-row-top">
            <span className="notif-type-label">{isReport ? "Report" : "Announcement"}</span>
            {!notif.read && <span className="notif-new-pill">New</span>}
          </div>
          <p className={`notif-message${notif.read ? "" : " notif-message--unread"}`}>
            {notif.message}
          </p>
          <p className="notif-time">{notif.time}</p>
        </div>

        <ArrowIcon className="notif-chevron" />

        <button
          className="notif-dismiss-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
          aria-label={`Dismiss: ${notif.message}`}
        >
          <CloseIcon />
        </button>
      </article>
    );
  }

  // Full variant (used when variant !== "simple")
  return (
    <div className={`notif-item${notif.read ? "" : " notif-item--unread"}`}>
      <span className={`notif-dot ${notif.read ? "notif-dot--read" : "notif-dot--unread"}`} />
      <div className={`notif-icon-wrap ${notif.read ? "notif-icon-wrap--read" : "notif-icon-wrap--unread"}`}>
        <TypeIcon />
      </div>
      <div className="notif-content">
        <p className={`notif-message ${notif.read ? "notif-message--read" : "notif-message--unread"}`}>
          {notif.message}
        </p>
        <p className="notif-time">{notif.time}</p>
      </div>
      <div className="notif-actions">
        {!notif.read && (
          <button className="ntn-btn ntn-btn--outline" onClick={() => onMarkRead?.(notif.id)}>
            <CheckIcon /> Mark as Read
          </button>
        )}
        <button className="ntn-btn ntn-btn--outline" onClick={() => onView(notif)}>
          <EyeIcon /> View Details
        </button>
        <button className="ntn-btn ntn-btn--danger-outline" onClick={() => onDelete(notif.id)}>
          <TrashIcon /> Delete
        </button>
      </div>
    </div>
  );
}