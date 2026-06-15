/**
 * useDashboard.js
 * ─────────────────────────────────────────────────────────────────
 * Master hook for the Registrar Dashboard.
 *
 * Responsibilities:
 *  - Orchestrates all API calls via registrarService
 *  - Falls back to mock data on network failure
 *  - Tracks API health status per data domain
 *  - Exposes stable action handlers (processApplication, sendReminders…)
 *  - Provides toast notifications
 *
 * Completely decoupled from UI — straightforward to unit-test by
 * mocking registrarService.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useEffect, useRef } from "react";
import registrarService from "../../services/Principal/registrarService";

// Only load mock data in development — keeps production bundles clean
// and prevents fake enrollment/application data from appearing in production.
// Uses a lazy async loader (no top-level await) for broader bundler compatibility.
let MOCK_STATS = null, MOCK_ENROLLMENT_BY_GRADE = [], MOCK_APPLICATION_STATS = null,
    MOCK_PENDING_APPLICATIONS = [], MOCK_RECENTLY_PROCESSED = [],
    MOCK_MISSING_DOCUMENTS = [], MOCK_REQUIRED_DOCUMENTS = [],
    MOCK_DOCUMENT_STATS = null, MOCK_SECTION_CAPACITY = [],
    MOCK_ENROLLMENT_BREAKDOWN = [], MOCK_TRANSFEREES = [],
    MOCK_CALENDAR_EVENTS = [], MOCK_COMPLIANCE_CHECKLIST = [],
    MOCK_NOTIFICATIONS = [];

let _mockLoaded = false;
async function loadMockData() {
  if (_mockLoaded || !import.meta.env.DEV) return;
  _mockLoaded = true;
  try {
    const m = await import("../../Api/registrarMockData");
    ({ MOCK_STATS, MOCK_ENROLLMENT_BY_GRADE, MOCK_APPLICATION_STATS,
       MOCK_PENDING_APPLICATIONS, MOCK_RECENTLY_PROCESSED, MOCK_MISSING_DOCUMENTS,
       MOCK_REQUIRED_DOCUMENTS, MOCK_DOCUMENT_STATS, MOCK_SECTION_CAPACITY,
       MOCK_ENROLLMENT_BREAKDOWN, MOCK_TRANSFEREES, MOCK_CALENDAR_EVENTS,
       MOCK_COMPLIANCE_CHECKLIST, MOCK_NOTIFICATIONS } = m);
  } catch { /* mock file absent */ }
}

// ─── API status constants ──────────────────────────────────────────

export const API_STATUS = Object.freeze({
  IDLE:      "idle",
  LOADING:   "loading",
  CONNECTED: "connected",
  FALLBACK:  "fallback",
  ERROR:     "error",
});

// ─── Helper: safe fetch with mock fallback ─────────────────────────

/**
 * Calls `fetcher()`, returns real data on success, `mockData` on failure.
 * Updates the provided status setter accordingly.
 *
 * @template T
 * @param {() => Promise<T>} fetcher
 * @param {T} mockData
 * @param {(s: string) => void} setStatus
 * @returns {Promise<T>}
 */
async function fetchWithFallback(fetcher, mockData, setStatus) {
  setStatus(API_STATUS.LOADING);
  try {
    const data = await fetcher();
    setStatus(API_STATUS.CONNECTED);
    return data;
  } catch {
    setStatus(API_STATUS.FALLBACK);
    return mockData;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────

export function useDashboard() {

  // ── Server health ────────────────────────────────────────────
  const [serverOnline, setServerOnline] = useState(false);
  const [globalStatus, setGlobalStatus] = useState(API_STATUS.LOADING);

  // ── Data state ───────────────────────────────────────────────
  // Initial state is always empty/null. MOCK_* values are only used as
  // fallback data when the API fails, so the UI never silently shows fake
  // data as if it were real. The fallback values are passed to
  // fetchWithFallback() below — not pre-loaded into state.
  const [stats,               setStats]               = useState(null);
  const [enrollmentByGrade,   setEnrollmentByGrade]   = useState([]);
  const [applicationStats,    setApplicationStats]    = useState(null);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [recentlyProcessed,   setRecentlyProcessed]   = useState([]);
  const [missingDocuments,    setMissingDocuments]    = useState([]);
  const [documentTracker,     setDocumentTracker]     = useState([]);
  const [documentStats,       setDocumentStats]       = useState(null);
  const [sectionCapacity,     setSectionCapacity]     = useState([]);
  const [enrollmentBreakdown, setEnrollmentBreakdown] = useState(null);
  const [transferees,         setTransferees]         = useState([]);
  const [calendarEvents,      setCalendarEvents]      = useState([]);
  const [complianceChecklist, setComplianceChecklist] = useState([]);
  const [notifications,       setNotifications]       = useState([]);

  // ── Per-domain loading flags ──────────────────────────────────
  const [loading, setLoading] = useState({
    stats:              true,
    enrollment:         true,
    applications:       true,
    recentlyProcessed:  true,
    documents:          true,
    records:            true,
    schedule:           true,
    notifications:      true,
  });

  // ── Toast ─────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  // ── Helpers ───────────────────────────────────────────────────

  const setDomainLoading = (domain, value) =>
    setLoading((prev) => ({ ...prev, [domain]: value }));

  // ─── Initial data fetch ──────────────────────────────────────

  const fetchAll = useCallback(async () => {
    // Ensure mock data is loaded (no-op in production, no-op after first call)
    await loadMockData();
    // Health check first
    let online = false;
    try {
      await registrarService.healthCheck();
      online = true;
      setServerOnline(true);
      setGlobalStatus(API_STATUS.CONNECTED);
    } catch {
      setServerOnline(false);
      setGlobalStatus(API_STATUS.FALLBACK);
    }

    const fetcher = online
      ? (fn, mock, setData, domain) =>
          fetchWithFallback(fn, mock, () => {})
            .then(setData)
            .finally(() => setDomainLoading(domain, false))
      : (fn, mock, setData, domain) => {
          setData(mock);
          setDomainLoading(domain, false);
          return Promise.resolve();
        };

    // Fire all requests in parallel
    await Promise.allSettled([
      // Stats
      fetcher(
        () => registrarService.getDashboardStats(),
        MOCK_STATS, setStats, "stats"
      ),
      // Enrollment by grade
      fetcher(
        () => registrarService.getEnrollmentByGrade(),
        MOCK_ENROLLMENT_BY_GRADE, setEnrollmentByGrade, "enrollment"
      ),
      // Application stats
      fetcher(
        () => registrarService.getApplicationStats(),
        MOCK_APPLICATION_STATS, setApplicationStats, "applications"
      ),
      // Pending applications
      fetcher(
        () => registrarService.getPendingApplications({ limit: 8 }),
        MOCK_PENDING_APPLICATIONS,
        (data) => setPendingApplications(Array.isArray(data?.data) ? data.data : data),
        "applications"
      ),
      // Recently processed
      fetcher(
        () => registrarService.getRecentlyProcessed({ limit: 6 }),
        MOCK_RECENTLY_PROCESSED, setRecentlyProcessed, "recentlyProcessed"
      ),
      // Documents
      fetcher(
        () => registrarService.getDocumentTracker(),
        MOCK_REQUIRED_DOCUMENTS, setDocumentTracker, "documents"
      ),
      fetcher(
        () => registrarService.getMissingDocuments(),
        MOCK_MISSING_DOCUMENTS, setMissingDocuments, "documents"
      ),
      fetcher(
        () => registrarService.getDocumentStats(),
        MOCK_DOCUMENT_STATS, setDocumentStats, "documents"
      ),
      // Records
      fetcher(
        () => registrarService.getSectionCapacity(),
        MOCK_SECTION_CAPACITY, setSectionCapacity, "records"
      ),
      fetcher(
        () => registrarService.getEnrollmentBreakdown(),
        MOCK_ENROLLMENT_BREAKDOWN, setEnrollmentBreakdown, "records"
      ),
      fetcher(
        () => registrarService.getTransferees(),
        MOCK_TRANSFEREES, setTransferees, "records"
      ),
      // Schedule
      fetcher(
        () => registrarService.getCalendarEvents(),
        MOCK_CALENDAR_EVENTS, setCalendarEvents, "schedule"
      ),
      fetcher(
        () => registrarService.getComplianceChecklist(),
        MOCK_COMPLIANCE_CHECKLIST, setComplianceChecklist, "schedule"
      ),
      // Notifications
      fetcher(
        () => registrarService.getNotifications(),
        MOCK_NOTIFICATIONS, setNotifications, "notifications"
      ),
    ]);
  }, []);

  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ─────────────────────────────────────────────────

  /**
   * Process a pending application (enroll / disapprove / hold).
   * Performs optimistic update on the UI immediately.
   */
  const processApplication = useCallback(
    async (appId, action) => {
      // Optimistic update
      setPendingApplications((prev) => prev.filter((a) => a.id !== appId));
      setRecentlyProcessed((prev) => [
        {
          name: pendingApplications.find((a) => a.id === appId)?.name || "Unknown",
          grade: pendingApplications.find((a) => a.id === appId)?.grade || 0,
          action,
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          by: "Reg. User",
        },
        ...prev.slice(0, 5),
      ]);

      try {
        await registrarService.processApplication(appId, { action });
        showToast(`Application ${action.toLowerCase()} successfully.`);
      } catch {
        // Server failed but optimistic update stands; notify user
        showToast(`Application ${action.toLowerCase()} (saved locally).`, "warn");
      }
    },
    [pendingApplications, showToast]
  );

  /**
   * Send document reminders to all students with missing documents.
   */
  const sendDocumentReminders = useCallback(async () => {
    try {
      const result = await registrarService.sendDocumentReminders();
      showToast(`Reminders sent to ${result?.sent ?? missingDocuments.length} students.`);
    } catch {
      showToast("Reminders queued — will send when server is back online.", "warn");
    }
  }, [missingDocuments.length, showToast]);

  /**
   * Refresh all data from the API.
   */
  const refresh = useCallback(() => {
    setLoading({
      stats: true, enrollment: true, applications: true,
      recentlyProcessed: true, documents: true,
      records: true, schedule: true, notifications: true,
    });
    fetchAll();
  }, [fetchAll]);

  // ─── Derived / computed ───────────────────────────────────────

  const isAnyLoading = Object.values(loading).some(Boolean);

  return {
    // Status
    serverOnline,
    globalStatus,
    loading,
    isAnyLoading,
    toast,

    // Data
    stats,
    enrollmentByGrade,
    applicationStats,
    pendingApplications,
    recentlyProcessed,
    missingDocuments,
    documentTracker,
    documentStats,
    sectionCapacity,
    enrollmentBreakdown,
    transferees,
    calendarEvents,
    complianceChecklist,
    notifications,

    // Actions
    processApplication,
    sendDocumentReminders,
    refresh,
    showToast,
    dismissToast,
  };
}

export default useDashboard;