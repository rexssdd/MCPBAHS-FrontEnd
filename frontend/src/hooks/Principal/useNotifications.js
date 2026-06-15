// src/hooks/Principal/useNotifications.js
//
// Fetching pattern now matches Teacher useNotification.js exactly:
//   - Single endpoint: GET /notifications via apiClient
//   - apiClient returns { ok, data, error } envelope — never throws
//   - withTimeout wrapper (8 s, same as Teacher)
//   - loading = true on mount; spinner shown until first fetch completes
//   - Falls back to MOCK_NOTIFICATIONS only on hard error

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchNotifications as fetchRawNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../../services/Principal/notificationService";

// ── Fallback mock data ─────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: "mock-rp1",
    type: "report",
    read: false,
    message: "Report SF1b.pdf has been approved",
    time: new Date().toISOString(),
    group: "Today",
    detail: {
      type: "report",
      title: "Report Approved",
      fileName: "SF1b.pdf",
      submittedBy: "Jane Doe",
      submittedOn: "05/25/26",
      evaluatedOn: "05/29/26",
      gradeLevel: "Grade 7",
      section: "Gemini",
      status: "Approved",
      comments: "Report is complete and accurate. Well done!",
    },
  },
  {
    id: "mock-rp2",
    type: "report",
    read: false,
    message: "Report SF4.pdf has been disapproved",
    time: new Date().toISOString(),
    group: "Today",
    detail: {
      type: "report",
      title: "Report Disapproved",
      fileName: "SF4.pdf",
      submittedBy: "John Smith",
      submittedOn: "05/24/26",
      evaluatedOn: "05/29/26",
      gradeLevel: "Grade 8",
      section: "Orion",
      status: "Disapproved",
      comments: "Missing data on pages 3–5. Please resubmit.",
    },
  },
  {
    id: "mock-ann1",
    type: "announcement",
    read: true,
    message: "Reminder: Parent-teacher conferences are scheduled for next week.",
    time: new Date().toISOString(),
    group: "Today",
    detail: {
      type: "announcement",
      title: "Parent-Teacher Conference",
      urgency: "High",
      audience: "All",
      scheduledOn: "05/29/26",
      updatedOn: "05/29/26",
      status: "Pending",
      comments: "Reminder: Parent-teacher conferences are scheduled for next week.",
    },
  },
];

// ── Timeout helper (matches Teacher hook) ──────────────────────────────────────
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);
}

// ── Normalize a raw backend item into the UI shape ────────────────────────────
function normalizeItem(n) {
  if (!n || typeof n !== "object") return null;
  return {
    id:        n.id ?? `notif-${Math.random()}`,
    type:      n.type      ?? "announcement",
    read:      n.is_read === true || n.read === true,
    message:   n.message   ?? "Notification",
    time:      n.time      ?? n.created_at ?? new Date().toISOString(),
    group:     n.group     ?? "Earlier",
    _sortDate: n._sortDate ?? n.time ?? n.created_at ?? null,
    detail: {
      type:        n.detail?.type ?? n.type ?? "announcement",
      title:       n.detail?.title ?? "Notification",
      fileName:    n.detail?.fileName ?? "—",
      submittedBy: n.detail?.submittedBy ?? "—",
      submittedOn: n.detail?.submittedOn ?? "—",
      evaluatedOn: n.detail?.evaluatedOn ?? "—",
      gradeLevel:  n.detail?.gradeLevel ?? "—",
      section:     n.detail?.section ?? "—",
      status:      n.detail?.status ?? "—",
      urgency:     n.detail?.urgency ?? "Normal",
      audience:    n.detail?.audience ?? "All",
      scheduledOn: n.detail?.scheduledOn ?? "—",
      updatedOn:   n.detail?.updatedOn ?? "—",
      comments:    n.detail?.comments ?? "No additional information provided.",
    },
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);   // true on mount — matches Teacher
  const [mutating,      setMutating]      = useState(false);
  const [error,         setError]         = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // fetchRawNotifications() now uses apiClient → resolves with { ok, data, error }
      const result = await withTimeout(fetchRawNotifications(), 8000);

      if (!mountedRef.current) return;

      if (!result.ok) {
        setNotifications(MOCK_NOTIFICATIONS);
        setUsingFallback(true);
        setError(result.error ?? "Failed to load notifications");
        return;
      }

      const raw = result.data;
      const arr = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.notifications)
        ? raw.notifications
        : [];

      setNotifications(arr.map(normalizeItem).filter(Boolean));
      setUsingFallback(false);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setNotifications(MOCK_NOTIFICATIONS);
      setUsingFallback(true);
      setError(err?.message ?? "Failed to load notifications");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Optimistic mutation helper ─────────────────────────────────────────────
  const withMutation = useCallback(
    async (applyOptimistic, serverCall) => {
      setMutating(true);
      const snapshot = notifications;
      setNotifications(applyOptimistic(snapshot));

      if (!usingFallback) {
        try {
          const result = await serverCall();
          // result.ok is now always present (apiClient envelope)
          if (!result?.ok) setNotifications(snapshot);
        } catch {
          setNotifications(snapshot);
        }
      }

      setMutating(false);
    },
    [notifications, usingFallback]
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const handleMarkRead = useCallback(
    (id) => withMutation(
      (prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n),
      () => markNotificationRead(id)
    ),
    [withMutation]
  );

  const handleMarkAllRead = useCallback(
    () => withMutation(
      (prev) => prev.map((n) => ({ ...n, read: true })),
      () => markAllNotificationsRead()
    ),
    [withMutation]
  );

  const handleDelete = useCallback(
    (id) => withMutation(
      (prev) => prev.filter((n) => n.id !== id),
      () => deleteNotification(id)
    ),
    [withMutation]
  );

  const handleClearAll = useCallback(
    () => withMutation(
      () => [],
      () => deleteAllNotifications()
    ),
    [withMutation]
  );

  const handleView = useCallback(
    (notif) => { if (!notif?.read) handleMarkRead(notif.id); },
    [handleMarkRead]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    loading,
    mutating,
    error,
    usingFallback,
    unreadCount,
    handleView,
    handleMarkRead,
    handleMarkAllRead,
    handleDelete,
    handleClearAll,
    refetch: fetchNotifications,  // matches Teacher hook's export name
  };
}