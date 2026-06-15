// src/hooks/Registrar/useNotification.js
// Fetches notifications from two sources in parallel:
//   1. GET /announcements  — school-wide announcements (posted/active)
//   2. GET /registrar/notifications → backend returns approved/rejected report verdicts
//
// Falls back to DEFAULT_NOTIFICATIONS if both sources fail.
// usingFallback flag is exposed so UI can show an offline banner.

import { useState, useEffect, useCallback, useRef } from "react";
import {
  announcementsToNotifications,
  mergeAndSort,
  getGroupFromDate,
} from "../../pages/Admin/notification/adminNotificationData.js";
import apiClient from "../../services/Registrar/apiClient";

// ── Base URL for raw fetch calls (announcement API) ────────────────────────────
const BASE_URL = (() => {
  const base = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
  if (base.endsWith("/v1") || base.endsWith("/v1/")) return base.replace(/\/$/, "");
  return `${base}/v1`;
})();

function getAuthHeaders() {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const token = typeof parsed === "string" ? parsed : (parsed?.token ?? parsed?.access_token ?? null);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function apiFetch(path) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      credentials: "include",
    });
    if (!res.ok) return { ok: false, data: null, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, data, error: null };
  } catch (err) {
    return { ok: false, data: null, error: err?.message ?? "Network error" };
  }
}

// ── Timeout helper ─────────────────────────────────────────────────────────────
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);
}

function extractData(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

// ── Fallback data ──────────────────────────────────────────────────────────────
const DEFAULT_NOTIFICATIONS = [
  {
    id: "default-1", type: "report", read: false,
    message: "Report SF1b.pdf has been disapproved",
    time: new Date().toISOString(), group: "Today",
    detail: {
      type: "report", title: "Report Disapproved", fileName: "SF1b.pdf",
      submittedBy: "John Jay Doe", submittedOn: "12/05/25", evaluatedOn: "12/06/25",
      gradeLevel: "Grade 7", section: "Gemini", status: "Disapproved",
      comments: "The report contains missing data. Please resubmit with complete records.",
    },
  },
  {
    id: "default-2", type: "report", read: false,
    message: "Report SF2.pdf has been approved",
    time: new Date().toISOString(), group: "Today",
    detail: {
      type: "report", title: "Report Approved", fileName: "SF2.pdf",
      submittedBy: "Maria Santos", submittedOn: "12/05/25", evaluatedOn: "12/06/25",
      gradeLevel: "Grade 8", section: "Orion", status: "Approved",
      comments: "Report is complete and accurate. Good job!",
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

// ── Normalise a backend notification item ──────────────────────────────────────
function normaliseBackendNotif(n) {
  return {
    id:        n.id,
    type:      n.type ?? "report",
    read:      n.read ?? false,
    message:   n.message ?? "Notification",
    time:      n.time ?? n._sortDate ?? new Date().toISOString(),
    group:     n.group ?? getGroupFromDate(n.time ?? n._sortDate),
    _sortDate: n._sortDate ?? n.time ?? null,
    detail: {
      type:        n.detail?.type        ?? n.type ?? "report",
      title:       n.detail?.title       ?? "Notification",
      fileName:    n.detail?.fileName    ?? "—",
      submittedBy: n.detail?.submittedBy ?? "—",
      submittedOn: n.detail?.submittedOn ?? "—",
      evaluatedOn: n.detail?.evaluatedOn ?? "—",
      gradeLevel:  n.detail?.gradeLevel  ?? "—",
      section:     n.detail?.section     ?? "—",
      status:      n.detail?.status      ?? "—",
      comments:    n.detail?.comments    ?? "No comments provided.",
      // announcement extras
      urgency:     n.detail?.urgency     ?? "—",
      audience:    n.detail?.audience    ?? "All",
      scheduledOn: n.detail?.scheduledOn ?? "—",
      updatedOn:   n.detail?.updatedOn   ?? "—",
    },
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [mutating, setMutating]           = useState(false);
  const [error, setError]                 = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const abortRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setUsingFallback(false);

    // Fetch announcements + registrar notifications (report verdicts) in parallel
    const [annResult, notifResult] = await Promise.allSettled([
      withTimeout(apiFetch("/announcements"), 6000),
      withTimeout(apiClient.get("/registrar/notifications", { signal: abortRef.current.signal }), 6000),
    ]);

    if (abortRef.current.signal.aborted) return;

    const newErrors = [];

    // Announcements
    let announcementNotifs = [];
    if (annResult.status === "fulfilled" && annResult.value?.ok) {
      const raw = extractData(annResult.value.data);
      announcementNotifs = announcementsToNotifications(raw);
    } else {
      newErrors.push("Announcements: " + (annResult.reason?.message ?? "failed"));
    }

    // Notifications (report verdicts from backend)
    let reportNotifs = [];
    if (notifResult.status === "fulfilled") {
      const envelope = notifResult.value;
      const ok = envelope?.ok ?? true;
      const raw = extractData(ok ? (envelope?.data ?? envelope) : []);
      // Backend returns all types; keep reports + map announcements only if ann fetch failed
      const filtered = raw.filter(n =>
        n.type === "report" || (announcementNotifs.length === 0 && n.type === "announcement")
      );
      reportNotifs = filtered.map(normaliseBackendNotif);
    } else {
      newErrors.push("Notifications: " + (notifResult.reason?.message ?? "failed"));
    }

    const merged = mergeAndSort(announcementNotifs, reportNotifs);

    if (merged.length === 0 && newErrors.length >= 2) {
      setNotifications(DEFAULT_NOTIFICATIONS);
      setUsingFallback(true);
      setError(newErrors.join(" · "));
    } else {
      setNotifications(merged);
      if (newErrors.length > 0) setError(newErrors.join(" · "));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
    return () => abortRef.current?.abort();
  }, [fetchNotifications]);

  // ── Optimistic mutation helper ──────────────────────────────────────────────

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
      () => apiClient.patch(`/notifications/${id}/read`, {}),
    );
  }, [withMutation]);

  const markAllRead = useCallback(() => {
    withMutation(
      prev => prev.map(n => ({ ...n, read: true })),
      () => apiClient.post("/notifications/mark-all-read", {}),
    );
  }, [withMutation]);

  const deleteOne = useCallback((id) => {
    withMutation(
      prev => prev.filter(n => n.id !== id),
      () => apiClient.delete(`/notifications/${id}`),
    );
  }, [withMutation]);

  const deleteAll = useCallback(() => {
    withMutation(
      () => [],
      () => apiClient.delete("/notifications"),
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
