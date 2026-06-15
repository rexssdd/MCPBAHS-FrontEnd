// src/hooks/teacher/useNotification.js
// Single-source fetch: GET /teacher/notifications
// The backend already merges announcements + report verdicts into one pre-shaped array.
// No dual-fetch, no /announcements 403.

import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../../services/teacher/apiClient";

// ── Fallback shown when API is completely unreachable ─────────────────────────
const DEFAULT_NOTIFICATIONS = [
  {
    id: "default-1", type: "report", read: false,
    message: "The registrar disapproved your submitted SF1b report",
    time: new Date().toISOString(), group: "Today",
    detail: {
      type: "report", title: "SF1b Report Disapproved",
      fileName: "SF1b.pdf", submittedOn: "12/05/25", evaluatedOn: "12/06/25",
      status: "Disapproved",
      comments: "The report contains missing learner data on page 3. Please complete all entries and resubmit.",
    },
  },
  {
    id: "default-2", type: "report", read: false,
    message: "The registrar approved your submitted SF5 report",
    time: new Date().toISOString(), group: "Today",
    detail: {
      type: "report", title: "SF5 Report Approved",
      fileName: "SF5.pdf", submittedOn: "12/04/25", evaluatedOn: "12/06/25",
      status: "Approved",
      comments: "Report has been reviewed and accepted. No further action required.",
    },
  },
  {
    id: "default-ann1", type: "announcement", read: true,
    message: "Reminder: Parent-teacher conferences are scheduled for next week.",
    time: new Date().toISOString(), group: "Today",
    detail: {
      type: "announcement", title: "Parent-Teacher Conference Reminder",
      urgency: "High", audience: "All",
      scheduledOn: "12/06/25", updatedOn: "12/06/25", status: "Pending",
      comments: "Reminder: Parent-teacher conferences are scheduled for next week.",
    },
  },
];

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);
}

function normaliseItem(n) {
  return {
    id:        n.id,
    type:      n.type      ?? "announcement",
    read:      n.read      ?? false,
    message:   n.message   ?? "Notification",
    time:      n.time      ?? new Date().toISOString(),
    group:     n.group     ?? "Earlier",
    _sortDate: n._sortDate ?? n.time ?? null,
    detail:    n.detail    ?? {},
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [mutating,      setMutating]      = useState(false);
  const [error,         setError]         = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await withTimeout(
        apiClient.get("/teacher/notifications"),
        8000
      );

      if (!mountedRef.current) return;

      if (!result.ok) {
        setNotifications(DEFAULT_NOTIFICATIONS);
        setUsingFallback(true);
        setError(result.error ?? "Failed to load notifications");
        return;
      }

      const raw = result.data;
      const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);

      setNotifications(arr.map(normaliseItem));
      setUsingFallback(false);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setNotifications(DEFAULT_NOTIFICATIONS);
      setUsingFallback(true);
      setError(err?.message ?? "Failed to load notifications");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const withMutation = useCallback(async (applyOptimistic, serverCall) => {
    setMutating(true);
    const snapshot = notifications;
    setNotifications(applyOptimistic(snapshot));

    if (!usingFallback) {
      const result = await serverCall();
      const ok = result?.ok ?? true;
      if (!ok) setNotifications(snapshot);
    }

    setMutating(false);
  }, [notifications, usingFallback]);

  const markRead = useCallback((id) => {
    withMutation(
      prev => prev.map(n => n.id === id ? { ...n, read: true } : n),
      () => apiClient.patch(`/teacher/notifications/${id}/read`, {}),
    );
  }, [withMutation]);

  const markAllRead = useCallback(() => {
    withMutation(
      prev => prev.map(n => ({ ...n, read: true })),
      () => apiClient.post("/teacher/notifications/mark-all-read", {}),
    );
  }, [withMutation]);

  const deleteOne = useCallback((id) => {
    withMutation(
      prev => prev.filter(n => n.id !== id),
      () => apiClient.delete(`/teacher/notifications/${id}`),
    );
  }, [withMutation]);

  const deleteAll = useCallback(() => {
    withMutation(
      () => [],
      () => apiClient.delete("/teacher/notifications"),
    );
  }, [withMutation]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    mutating,
    error,
    usingFallback,
    unreadCount,
    refetch: fetchNotifications,
    markRead,
    markAllRead,
    deleteOne,
    deleteAll,
  };
}