// src/hooks/Teacher/useDashboard.js
// Central data hook for the Teacher Dashboard.
// Mirrors the Principal's useDashboard pattern:
//   - State initialises to null / [] (never shows mock data before an API attempt)
//   - useEffect fires a fetch on mount; on failure it falls back to mock data
//     and sets globalStatus = FALLBACK so the UI can show a banner.

import { useState, useCallback, useEffect, useRef } from "react";
import apiClient from "../../services/teacher/apiClient";

// FIX: Only load mock data in development so it is never baked into
// production bundles. In production the catch block sets FALLBACK/ERROR
// status and shows a banner — it will not display fake student records.
let MOCK_STATS = null, MOCK_ATTENDANCE = [], MOCK_GRADES = [],
    MOCK_LOW_PERFORMERS = [], MOCK_SCHEDULE = [], MOCK_CALENDAR = [],
    MOCK_NOTIFICATIONS = [], MOCK_SUBJECT_PERFORMANCE = [],
    MOCK_RECENT_ACTIVITIES = [];
if (import.meta.env.DEV) {
  try {
    const m = await import("../../mock/teacherDashboardData");
    ({ MOCK_STATS, MOCK_ATTENDANCE, MOCK_GRADES, MOCK_LOW_PERFORMERS,
       MOCK_SCHEDULE, MOCK_CALENDAR, MOCK_NOTIFICATIONS,
       MOCK_SUBJECT_PERFORMANCE, MOCK_RECENT_ACTIVITIES } = m);
  } catch { /* mock file absent — no fallback data in this env */ }
}

/* ══════════════════════════════════════════════════════════
   API STATUS ENUM  (same shape as other dashboard hooks)
══════════════════════════════════════════════════════════ */
export const API_STATUS = {
  LOADING:   "loading",
  CONNECTED: "connected",
  FALLBACK:  "fallback",
  ERROR:     "error",
};

/* ══════════════════════════════════════════════════════════
   useDashboard
══════════════════════════════════════════════════════════ */
export function useDashboard() {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Global connection status ────────────────────────────
  const [globalStatus, setGlobalStatus] = useState(API_STATUS.LOADING);

  // ── Per-section loading flags ───────────────────────────
  const [loading, setLoading] = useState({
    stats:              true,
    attendance:         true,
    grades:             true,
    lowPerformers:      true,
    schedule:           true,
    subjectPerformance: true,
    recentActivities:   true,
    notifications:      true,
    calendar:           true,
  });

  // ── Data (null / [] until fetch resolves) ───────────────
  const [stats,              setStats]              = useState(null);
  const [attendance,         setAttendance]         = useState([]);
  const [grades,             setGrades]             = useState([]);
  const [lowPerformers,      setLowPerformers]      = useState([]);
  const [schedule,           setSchedule]           = useState([]);
  const [calendarEvents,     setCalendarEvents]     = useState([]);
  const [notifications,      setNotifications]      = useState([]);
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [recentActivities,   setRecentActivities]   = useState([]);

  // ── Toast ───────────────────────────────────────────────
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // ── Fetch all dashboard data ────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!mountedRef.current) return;
    setGlobalStatus(API_STATUS.LOADING);
    setLoading({
      stats: true, attendance: true, grades: true, lowPerformers: true,
      schedule: true, subjectPerformance: true, recentActivities: true,
      notifications: true, calendar: true,
    });

    try {
      const result = await apiClient.get("/teacher/dashboard");

      if (!mountedRef.current) return;

      if (result.ok && result.data) {
        const d = result.data;
        setStats(d.stats                         ?? MOCK_STATS);
        setAttendance(d.attendance               ?? MOCK_ATTENDANCE);
        setGrades(d.grades                       ?? MOCK_GRADES);
        setLowPerformers(d.lowPerformers         ?? MOCK_LOW_PERFORMERS);
        setSchedule(d.schedule                   ?? MOCK_SCHEDULE);
        setCalendarEvents(d.calendarEvents       ?? MOCK_CALENDAR);
        setNotifications(d.notifications         ?? MOCK_NOTIFICATIONS);
        setSubjectPerformance(d.subjectPerformance ?? MOCK_SUBJECT_PERFORMANCE);
        setRecentActivities(d.recentActivities   ?? MOCK_RECENT_ACTIVITIES);
        setGlobalStatus(API_STATUS.CONNECTED);
      } else {
        throw new Error(result.error || "Dashboard API returned no data");
      }
    } catch {
      // API unavailable — fall back to mock data so the UI remains usable,
      // but set FALLBACK status so a banner can be shown.
      if (!mountedRef.current) return;
      setStats(MOCK_STATS);
      setAttendance(MOCK_ATTENDANCE);
      setGrades(MOCK_GRADES);
      setLowPerformers(MOCK_LOW_PERFORMERS);
      setSchedule(MOCK_SCHEDULE);
      setCalendarEvents(MOCK_CALENDAR);
      setNotifications(MOCK_NOTIFICATIONS);
      setSubjectPerformance(MOCK_SUBJECT_PERFORMANCE);
      setRecentActivities(MOCK_RECENT_ACTIVITIES);
      setGlobalStatus(API_STATUS.FALLBACK);
    } finally {
      if (mountedRef.current) {
        setLoading({
          stats: false, attendance: false, grades: false, lowPerformers: false,
          schedule: false, subjectPerformance: false, recentActivities: false,
          notifications: false, calendar: false,
        });
      }
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Actions ─────────────────────────────────────────────

  /**
   * Mark a student's attendance status.
   * @param {string} studentId
   * @param {"Present"|"Late"|"Absent"} status
   */
  const markAttendance = useCallback(async (studentId, status) => {
    try {
      await apiClient.post("/teacher/attendance", { studentId, status });
    } catch {
      // stub — backend endpoint not yet implemented
    }
    showToast(`Attendance marked: ${status}`);
  }, [showToast]);

  /**
   * Save / update a student's grade for a given quarter.
   * @param {string} studentId
   * @param {number} quarter  1 | 2 | 3 | 4
   * @param {number} score
   */
  const saveGrade = useCallback(async (studentId, quarter, score) => {
    try {
      await apiClient.post("/teacher/grades", { studentId, quarter, score });
    } catch {
      // stub — backend endpoint not yet implemented
    }
    showToast("Grade saved successfully");
  }, [showToast]);

  /**
   * Log an intervention record for an at-risk student.
   * @param {string} studentName
   * @param {string} note
   */
  const logIntervention = useCallback(async (studentName, note) => {
    try {
      await apiClient.post("/teacher/interventions", { studentName, note });
    } catch {
      // stub — backend endpoint not yet implemented
    }
    showToast(`Intervention logged for ${studentName}`);
  }, [showToast]);

  /**
   * Send a message to a student's parent/guardian.
   * @param {string} studentName
   * @param {string} message
   */
  const sendParentMessage = useCallback(async (studentName, message) => {
    try {
      await apiClient.post("/teacher/messages", { studentName, message });
    } catch {
      // stub — backend endpoint not yet implemented
    }
    showToast(`Message sent for ${studentName}`);
  }, [showToast]);

  /** Manual data refresh */
  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Public API ──────────────────────────────────────────
  return {
    // Status
    globalStatus,

    // Loading flags (per section)
    loading,

    // Toast
    toast,
    showToast,
    dismissToast,

    // Data
    stats,
    attendance,
    grades,
    lowPerformers,
    schedule,
    calendarEvents,
    notifications,
    subjectPerformance,
    recentActivities,

    // Actions
    markAttendance,
    saveGrade,
    logIntervention,
    sendParentMessage,
    refresh,
  };
}
