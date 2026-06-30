// src/pages/Teacher/NotificationsPage.jsx

import { useState, useCallback, memo } from "react";
import Sidebar from "../../Components/Sidebar";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../Components/ui";
import { useNotifications } from "../../hooks/Registrar/useNotification";
import "../../Css/Registrar/Notification.css";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Canonical display order for the three time buckets.
 * The hook normalises every notification into one of these before the page
 * ever sees it, so this is the complete, exhaustive set.
 */
const GROUP_ORDER = /** @type {const} */ (["Today", "Yesterday", "Earlier"]);

/** Maps API status values → CSS modifier class on the status field. */
const STATUS_CLASS = {
    Disapproved: "notif-modal__status--disapproved",
    Approved: "notif-modal__status--approved",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const BellIcon = memo(() => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
));

const EyeIcon = memo(() => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
));

const CheckIcon = memo(() => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
    </svg>
));

const TrashIcon = memo(() => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
));

const FileIcon = memo(() => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
));

const MegaphoneIcon = memo(() => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11l18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
));

const ArrowIcon = memo(() => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
));

// ─── DetailModal ──────────────────────────────────────────────────────────────

/**
 * @param {{ notif: import("../../types").Notification, onClose: () => void }} props
 */
const DetailModal = memo(function DetailModal({ notif, onClose }) {
    const d = notif.detail ?? {};
    const isReport = notif.type === "report";

    const statusClass = STATUS_CLASS[d.status] ?? "notif-modal__status--default";

    return (
        <Modal size="md" onClose={onClose}>
            <ModalHeader
                icon={
                    isReport ? (
                        <>
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </>
                    ) : (
                        <>
                            <path d="M3 11l18-5v12L3 14v-3z" />
                            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                        </>
                    )
                }
            >
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

                        <div className="notif-modal__divider" />

                        <p className="form-section-title" style={{ marginBottom: "12px" }}>Feedback</p>

                        <div style={{ marginBottom: "12px" }}>
                            <p className="info-field-label">Status</p>
                            <div className={`form-input ${statusClass}`}>{d.status ?? "—"}</div>
                        </div>

                        <div>
                            <p className="info-field-label">Comments / Suggestions</p>
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

                        <div className="notif-modal__divider" />

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
                    {isReport ? <><FileIcon /> Go To Submit <ArrowIcon /></> : <><MegaphoneIcon /> Close <ArrowIcon /></>}
                </button>
            </ModalFooter>
        </Modal>
    );
});

// ─── NotifItem ────────────────────────────────────────────────────────────────

/**
 * Single notification row with labeled action buttons.
 *
 * @param {{
 *   notif:      import("../../types").Notification,
 *   onView:     (notif: import("../../types").Notification) => void,
 *   onMarkRead: (id: number|string) => void,
 *   onDelete:   (id: number|string) => void,
 *   disabled:   boolean,
 * }} props
 */
const NotifItem = memo(function NotifItem({ notif, onView, onMarkRead, onDelete, disabled }) {
    const handleView = useCallback(() => onView(notif), [notif, onView]);
    const handleMarkRead = useCallback(() => onMarkRead(notif.id), [notif.id, onMarkRead]);
    const handleDelete = useCallback(() => onDelete(notif.id), [notif.id, onDelete]);

    const rowClass = `notif-item ${notif.read ? "notif-item--read" : "notif-item--unread"}`;
    const dotClass = `notif-item__dot ${notif.read ? "notif-item__dot--read" : "notif-item__dot--unread"}`;
    const msgClass = `notif-item__message ${notif.read ? "notif-item__message--read" : "notif-item__message--unread"}`;

    return (
        <div role="listitem" className={rowClass}>

            {/* Unread indicator dot */}
            <div className={dotClass} aria-hidden="true" />

            {/* Bell avatar */}
            <div className="notif-item__avatar" aria-hidden="true">
                <BellIcon />
            </div>

            {/* Message + timestamp */}
            <div className="notif-item__body">
                <p className={msgClass} title={notif.message}>{notif.message}</p>
                <p className="notif-item__time">
                    <time>{notif.time}</time>
                </p>
            </div>

            {/* Labeled action buttons */}
            <div className="notif-item__actions">

                {/* Mark as Read — only shown while notification is unread */}
                {!notif.read ? (
                    <button
                        type="button"
                        className="btn btn-outline btn-sm notif-item__action-btn notif-item__action-btn--read"
                        onClick={handleMarkRead}
                        disabled={disabled}
                        aria-label={`Mark "${notif.message}" as read`}
                    >
                        <CheckIcon />
                        Mark as Read
                    </button>
                ) : (
                    <span className="notif-item__action-spacer" aria-hidden="true" />
                )}

                {/* View Details */}
                <button
                    type="button"
                    className="btn btn-outline btn-sm notif-item__action-btn notif-item__action-btn--view"
                    onClick={handleView}
                    disabled={disabled}
                    aria-label={`View details for "${notif.message}"`}
                >
                    <EyeIcon />
                    View
                </button>

                {/* Delete */}
                <button
                    type="button"
                    className="btn btn-outline btn-sm notif-item__action-btn notif-item__action-btn--delete"
                    onClick={handleDelete}
                    disabled={disabled}
                    aria-label={`Delete notification: "${notif.message}"`}
                >
                    <TrashIcon />
                    Delete
                </button>

            </div>
        </div>
    );
});

// ─── NotifGroup ───────────────────────────────────────────────────────────────

/**
 * @param {{
 *   label:      string,
 *   items:      import("../../types").Notification[],
 *   onView:     (notif: import("../../types").Notification) => void,
 *   onMarkRead: (id: number|string) => void,
 *   onDelete:   (id: number|string) => void,
 *   disabled:   boolean,
 * }} props
 */
const NotifGroup = memo(function NotifGroup({ label, items, onView, onMarkRead, onDelete, disabled }) {
    if (!items?.length) return null;

    return (
        <div role="group" aria-label={label}>
            <p className="notif-group__label">{label}</p>
            {items.map(notif => (
                <NotifItem
                    key={notif.id}
                    notif={notif}
                    onView={onView}
                    onMarkRead={onMarkRead}
                    onDelete={onDelete}
                    disabled={disabled}
                />
            ))}
        </div>
    );
});

// ─── NotifSkeleton ────────────────────────────────────────────────────────────

const SKELETON_ROWS = [1, 2, 3, 4];

function NotifSkeleton() {
    return (
        <div className="notif-skeleton" aria-busy="true" aria-label="Loading notifications">
            {SKELETON_ROWS.map(i => (
                <div key={i} className="notif-skeleton__row">
                    <div className="notif-skeleton__dot" />
                    <div className="notif-skeleton__avatar" />
                    <div className="notif-skeleton__body">
                        <div className="skeleton notif-skeleton__line notif-skeleton__line--message" />
                        <div className="skeleton notif-skeleton__line notif-skeleton__line--time" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── NotificationsPage ────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const {
        notifications,
        loading,
        mutating,
        error,
        usingFallback,
        refetch,
        markRead,
        markAllRead,
        deleteOne,
        deleteAll,
    } = useNotifications();

    const [activeNotif, setActiveNotif] = useState(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // ── Group notifications into the three canonical buckets ──
    // The hook guarantees every notification.group is one of the three canonical
    // values, but we also bucket any unexpected stragglers under "Earlier" as a
    // final safety net so nothing is ever silently dropped from the UI.
    const groups = notifications.reduce((acc, n) => {
        const bucket = GROUP_ORDER.includes(n.group) ? n.group : "Earlier";
        if (!acc[bucket]) acc[bucket] = [];
        acc[bucket].push(n);
        return acc;
    }, /** @type {Record<string, import("../../types").Notification[]>} */({}));

    // Marks as read optimistically, then opens the modal.
    const handleView = useCallback((notif) => {
        if (!notif.read) markRead(notif.id);
        setActiveNotif(notif);
    }, [markRead]);

    const handleCloseModal = useCallback(() => setActiveNotif(null), []);

    const hasNotifications = notifications.length > 0;
    const hasUnread = unreadCount > 0;

    // Action buttons inside rows are disabled during any in-flight mutation so
    // double-clicks or rapid actions don't race against each other.
    const actionsDisabled = mutating;

    return (
        <div className="page-layout">
           <Sidebar role="registrar" />

            <main id="main-content" className="page-main">
                <div className="page-body">

                    {/* ── Page header ── */}
                    <div className="notif-page__header">
                        <div>
                            <div className="notif-page__title-row">
                                <h1 className="page-title">Notifications</h1>
                                {hasUnread && (
                                    <span
                                        className="notif-page__badge"
                                        aria-live="polite"
                                        aria-label={`${unreadCount} unread notifications`}
                                    >
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>
                            <p className="page-subtitle">Stay updated with the latest activity.</p>
                        </div>

                        <div className="notif-page__header-actions">
                            {hasUnread && !usingFallback && (
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={markAllRead}
                                    disabled={actionsDisabled}
                                    aria-label="Mark all notifications as read"
                                >
                                    <CheckIcon /> Mark all read
                                </button>
                            )}
                            {hasNotifications && !usingFallback && (
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={deleteAll}
                                    disabled={actionsDisabled}
                                    aria-label="Clear all notifications"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Offline / fallback banner ── */}
                    {usingFallback && (
                        <div className="notif-page__fallback-banner" role="status">
                            <div className="notif-page__fallback-banner-text">
                                <span aria-hidden="true">⚠️</span>
                                <span>
                                    Couldn't reach the server — showing your last known notifications.
                                    Some actions won't sync until connection is restored.
                                </span>
                            </div>
                            <button
                                type="button"
                                className="btn btn-outline btn-sm notif-page__fallback-retry"
                                onClick={refetch}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* ── Body: loading → list (or empty) ── */}
                    {loading ? (
                        <div className="form-card">
                            <NotifSkeleton />
                        </div>
                    ) : (
                        <div
                            className="form-card notif-page__list-card"
                            role="list"
                            aria-label="Notifications"
                        >
                            {!hasNotifications ? (
                                <div className="notif-page__empty">
                                    <div className="notif-page__empty-icon" aria-hidden="true">🔔</div>
                                    <div className="notif-page__empty-title">All caught up!</div>
                                    <div className="notif-page__empty-sub">No notifications to show.</div>
                                </div>
                            ) : (
                                GROUP_ORDER.map(group => (
                                    <NotifGroup
                                        key={group}
                                        label={group}
                                        items={groups[group]}
                                        onView={handleView}
                                        onMarkRead={markRead}
                                        onDelete={deleteOne}
                                        disabled={actionsDisabled}
                                    />
                                ))
                            )}
                        </div>
                    )}

                </div>
            </main>

            {/* ── Detail modal ── */}
            {activeNotif != null && (
                <DetailModal notif={activeNotif} onClose={handleCloseModal} />
            )}
        </div>
    );
}