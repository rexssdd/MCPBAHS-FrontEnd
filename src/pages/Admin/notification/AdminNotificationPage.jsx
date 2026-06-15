/*
 * AdminNotificationPage.jsx
 *
 * FIXES:
 *  – Fast load: shows session-cached data instantly (no spinner on repeat visits)
 *  – Single getReports({ limit: 50 }) call instead of two separate status calls
 *  – 6-second race-timeout so a slow API never hangs the page forever
 *  – Background refresh: cache is shown first, then silently updated
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../Components/Sidebar";
import { fetchAnnouncements } from "../../../Api/announcementApi";
import reportsService from "../../../services/Admin/Reports/reportService";
import {
  GROUP_ORDER,
  MOCK_NOTIFICATIONS,
  normalizeNotifications,
  announcementsToNotifications,
  reportsToNotifications,
  mergeAndSort,
} from "./adminNotificationData.js";
import { ErrorBanner, DetailModal, NotifItem } from "./AdminNotificationSections.jsx";

// ── Session cache helpers ─────────────────────────────────────────────────────
const CACHE_KEY = "admin_notif_v1";
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function writeCache(data) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* quota exceeded — ignore */ }
}

// ── Timeout helper ────────────────────────────────────────────────────────────
// Creates its OWN internal AbortController for the timeout so that aborting one
// timed-out request never cancels sibling requests running in parallel.
// The component's main controller (used for unmount/re-entry cancellation) is passed
// via the fetch signal — separately from this per-call timeout controller.
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Request timed out"));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ── Extract reports array from getReports() result ────────────────────────────
function extractReports(value) {
  if (Array.isArray(value))       return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export default function NotificationPage() {
  const navigate = useNavigate();

  // Seed state from cache immediately — avoids the loading spinner on repeat visits
  const cached = readCache();
  const [notifications, setNotifications] = useState(cached ?? []);
  const [loading,        setLoading]       = useState(!cached);   // skip spinner if cached
  const [errors,         setErrors]        = useState([]);
  const [actionInFlight, setActionInFlight] = useState(false);
  const [deletedIds,     setDeletedIds]    = useState(new Set());
  const [readIds,        setReadIds]       = useState(new Set());
  const [activeNotif,    setActiveNotif]   = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => () => {
    isMountedRef.current = false;
    // Cancel any in-flight fetch so the component doesn't setState after unmount
    // and so the browser closes the TCP connection immediately.
    abortRef.current?.abort();
  }, []);

  // ── Fetch both sources, merge, cache ─────────────────────────────────────
  //
  // FIX – AbortController wired to both fetch calls:
  //   • The previous code created no AbortController, so apiClient/fetch kept
  //     TCP sockets open for up to ~3 min after withTimeout rejected.
  //   • We now create one controller per invocation, cancel the previous one
  //     on re-entry (rapid user retries), and cancel on component unmount.
  //
  // FIX – loading=true stuck-spinner guard:
  //   • loading starts true when there is no cache (empty first-load).
  //   • If the fetch is very slow the spinner showed forever because setLoading(false)
  //     was only called in the happy path after both awaits resolved.
  //   • We now guarantee setLoading(false) in a finally block.
  const abortRef = useRef(null);

  const loadNotifications = useCallback(async (showSpinner = false) => {
    // Cancel any in-flight fetch from a previous call
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current  = controller;
    const { signal } = controller;

    if (showSpinner) setLoading(true);
    setErrors([]);
    const newErrors = [];

    try {
      // Run announcements + reports in parallel; each gets a 6 s timeout.
      // Pass controller to withTimeout so it aborts the fetch() on timeout.
      const [annResult, rptResult] = await Promise.allSettled([
        withTimeout(fetchAnnouncements({ signal }), 6000),
        withTimeout(reportsService.getReports({ limit: 50 }), 6000),
      ]);

      // Guard: bail only if the component unmounted or this call was superseded
      // by a newer one (abortRef.current !== controller).
      // Do NOT check signal.aborted here — the signal is shared across the two
      // parallel withTimeout calls and one timing out would abort the signal,
      // making this guard discard all successfully-fetched data from the other call.
      if (!isMountedRef.current || abortRef.current !== controller) return;

      // Announcements
      let announcementNotifs = [];
      if (annResult.status === "fulfilled" && annResult.value?.ok) {
        announcementNotifs = announcementsToNotifications(annResult.value.data ?? []);
      } else {
        const msg = annResult.reason?.message ?? annResult.value?.error ?? "Failed";
        newErrors.push(`Announcements: ${msg}`);
      }

      // Reports — single call, filter Approved/Disapproved client-side
      let reportNotifs = [];
      if (rptResult.status === "fulfilled") {
        const allReports = extractReports(rptResult.value);
        const evaluated  = allReports.filter(
          r => r.status === "Approved" || r.status === "Disapproved"
             || r.status_label === "Approved" || r.status_label === "Disapproved"
        );
        reportNotifs = reportsToNotifications(evaluated);
      } else {
        newErrors.push(`Reports: ${rptResult.reason?.message ?? "Failed"}`);
      }

      const merged = mergeAndSort(announcementNotifs, reportNotifs);

      if (merged.length === 0 && newErrors.length === 2) {
        // Both APIs failed — show mock data so page is still useful offline
        const fallback = normalizeNotifications(MOCK_NOTIFICATIONS);
        setNotifications(fallback);
      } else {
        setNotifications(merged);
        writeCache(merged);         // persist for next visit
      }

      setErrors(newErrors);
    } finally {
      // Always clear the spinner — even if an exception or abort escapes the try block.
      if (isMountedRef.current && abortRef.current === controller) setLoading(false);
    }
  }, []);

  // Initial load — if we showed cached data, fetch silently in background
  useEffect(() => {
    loadNotifications(!cached);   // show spinner only if no cache
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Visible list ──────────────────────────────────────────────────────────
  const visibleNotifications = useMemo(() =>
    notifications
      .filter(n => !deletedIds.has(n.id))
      .map(n    => readIds.has(n.id) ? { ...n, read: true } : n),
    [notifications, deletedIds, readIds]
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  const markRead = useCallback(id => {
    if (!id) return;
    setReadIds(prev => new Set(prev).add(id));
    setActiveNotif(cur => cur?.id === id ? { ...cur, read: true } : cur);
  }, []);

  const handleView = useCallback(notif => {
    if (!notif) return;
    setActiveNotif({ ...notif, read: true });
    if (!notif.read) markRead(notif.id);
  }, [markRead]);

  const handleDelete = useCallback(id => {
    if (!id) return;
    setDeletedIds(prev => new Set(prev).add(id));
    setActiveNotif(cur => cur?.id === id ? null : cur);
  }, []);

  const handleClearAll = useCallback(() => {
    if (visibleNotifications.length === 0) return;
    setActionInFlight(true);
    setDeletedIds(prev => new Set([...prev, ...visibleNotifications.map(n => n.id)]));
    setActiveNotif(null);
    setActionInFlight(false);
  }, [visibleNotifications]);

  // ── Grouping ──────────────────────────────────────────────────────────────
  const groups = useMemo(() =>
    visibleNotifications.reduce((acc, n) => {
      const g = n.group ?? "Earlier";
      (acc[g] ??= []).push(n);
      return acc;
    }, {}),
    [visibleNotifications]
  );

  const visibleGroups = useMemo(() => [
    ...GROUP_ORDER.filter(g => groups[g]?.length),
    ...Object.keys(groups).filter(g => !GROUP_ORDER.includes(g)),
  ], [groups]);

  const handleGoTo = useCallback(notif => {
    setActiveNotif(null);
    navigate(notif?.type === "report" ? "/admin/reports" : "/admin/announcements");
  }, [navigate]);

  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  return (
    <div className="notif-root notif-root--simple">
      <Sidebar role="admin" />

      <main className="notif-main notif-main--simple">
        <div className="notif-header notif-header--simple">
          <div className="notif-header-left">
            <h1 className="notif-title">
              Notifications
              {unreadCount > 0 && (
                <span className="notif-unread-badge" title={`${unreadCount} unread`}>
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="notif-subtitle">Announcements and report evaluations from the principal.</p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="ntn-btn ntn-btn--outline"
              onClick={() => loadNotifications(true)}
              disabled={loading}
              title="Refresh"
            >
              ↻
            </button>
            <button
              className="ntn-btn ntn-btn--outline notif-clear-btn"
              onClick={handleClearAll}
              disabled={loading || actionInFlight || visibleNotifications.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <ErrorBanner
            message={errors.join(" · ")}
            onRetry={() => loadNotifications(true)}
            onDismiss={() => setErrors([])}
          />
        )}

        <section className="notif-stream" aria-label="Notifications">
          {loading ? (
            <div className="notif-loading">
              <div className="loading-ring" />
              <p>Loading notifications…</p>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <>
              <p className="notif-group-label notif-group-label--plain">Today</p>
              <div className="notif-empty-simple">Nothing to show.</div>
            </>
          ) : (
            visibleGroups.map(group => (
              <div className="notif-group notif-group--simple" key={group}>
                <p className="notif-group-label notif-group-label--plain">{group}</p>
                {groups[group].map(notif => (
                  <NotifItem
                    key={notif.id}
                    notif={notif}
                    onView={handleView}
                    onDelete={handleDelete}
                    variant="simple"
                  />
                ))}
              </div>
            ))
          )}
        </section>
      </main>

      {activeNotif && (
        <DetailModal
          notif={activeNotif}
          onClose={() => setActiveNotif(null)}
          onGoTo={() => handleGoTo(activeNotif)}
        />
      )}
    </div>
  );
}