/**
 * registrarService.js
 * ─────────────────────────────────────────────────────────────────
 * Centralized API service for the Registrar Dashboard.
 * All network calls are isolated here — easy to mock in tests.
 *
 * Endpoints follow the pattern: /api/registrar/<resource>
 * ─────────────────────────────────────────────────────────────────
 */

// @ts-nocheck

import { authHeaders } from "../../utils/authToken";

export const BASE_URL =
  (typeof window !== "undefined" && import.meta?.env?.VITE_API_BASE_URL) ||
  "http://localhost:8000/api/v1";

// ─── Auth helpers ─────────────────────────────────────────────────

export const getAuthHeaders = () => authHeaders({ "Content-Type": "application/json" });

export const handleResponse = async (response) => {
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// ─── Service ──────────────────────────────────────────────────────

export const registrarService = {
  /** Server health check */
  async healthCheck() {
    const res = await fetch(`${BASE_URL}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error("Server not OK");
    return res.json();
  },

  // ── Dashboard summary ──────────────────────────────────────────

  /**
   * Fetch top KPI summary stats.
   * @returns {Promise<{ enrolledToday, totalEnrolled, totalCapacity, pendingReview, missingDocs, transferees }>}
   */
  async getDashboardStats() {
    const res = await fetch(`${BASE_URL}/registrar/dashboard/stats`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  // ── Enrollment ─────────────────────────────────────────────────

  /**
   * Enrollment counts grouped by grade level.
   * @returns {Promise<Array<{ grade, enrolled, capacity, male, female, new, returning }>>}
   */
  async getEnrollmentByGrade() {
    const res = await fetch(`${BASE_URL}/registrar/enrollment/by-grade`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  /**
   * Enrollment application status totals.
   * @returns {Promise<{ total, approved, pending, incomplete }>}
   */
  async getApplicationStats() {
    const res = await fetch(`${BASE_URL}/registrar/enrollment/application-stats`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  /**
   * List of pending applications (paginated).
   * @param {{ page?, limit?, priority? }} params
   * @returns {Promise<{ data: Array, total: number }>}
   */
  async getPendingApplications({ page = 1, limit = 10, priority = "" } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(priority && { priority }),
    });
    const res = await fetch(`${BASE_URL}/registrar/enrollment/pending?${params}`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  /**
   * List of recently processed applications.
   * @param {{ limit? }} params
   * @returns {Promise<Array>}
   */
  async getRecentlyProcessed({ limit = 6 } = {}) {
    const params = new URLSearchParams({ limit: String(limit) });
    const res = await fetch(`${BASE_URL}/registrar/enrollment/recently-processed?${params}`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  /**
   * Enroll / approve a specific application.
   * @param {string} appId
   * @param {{ action: "Enrolled"|"Disapproved"|"On Hold" }} payload
   */
  async processApplication(appId, { action }) {
    if (!appId) throw new Error("Application ID required");
    if (!action) throw new Error("Action required");
    const res = await fetch(`${BASE_URL}/registrar/enrollment/${appId}/process`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action }),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  // ── Documents ──────────────────────────────────────────────────

  /**
   * Document submission tracker per required document type.
   * @returns {Promise<Array<{ name, submitted, pending }>>}
   */
  async getDocumentTracker() {
    const res = await fetch(`${BASE_URL}/registrar/documents/tracker`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  /**
   * Students with missing documents.
   * @returns {Promise<Array<{ name, grade, missing: string[] }>>}
   */
  async getMissingDocuments() {
    const res = await fetch(`${BASE_URL}/registrar/documents/missing`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  /**
   * Overall document completion statistics.
   * @returns {Promise<{ completionRate, fullyComplete, withMissing, notSubmitted }>}
   */
  async getDocumentStats() {
    const res = await fetch(`${BASE_URL}/registrar/documents/stats`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  /**
   * Send reminder notifications to students with missing documents.
   * @returns {Promise<{ sent: number }>}
   */
  async sendDocumentReminders() {
    const res = await fetch(`${BASE_URL}/registrar/documents/send-reminders`, {
      method: "POST",
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(10000),
    });
    return handleResponse(res);
  },

  // ── Records ────────────────────────────────────────────────────

  /**
   * Section capacity data.
   * @returns {Promise<Array<{ section, enrolled, cap, adviser }>>}
   */
  async getSectionCapacity() {
    const res = await fetch(`${BASE_URL}/registrar/records/section-capacity`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  /**
   * Enrollment type breakdown (new / returning / transferee / re-enrollee).
   * @returns {Promise<{ new, returning, transferees, reEnrollees, male, female }>}
   */
  async getEnrollmentBreakdown() {
    const res = await fetch(`${BASE_URL}/registrar/records/enrollment-breakdown`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  /**
   * Transferee application list.
   * @returns {Promise<Array<{ name, from, grade, status }>>}
   */
  async getTransferees() {
    const res = await fetch(`${BASE_URL}/registrar/records/transferees`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  // ── Schedule ───────────────────────────────────────────────────

  /**
   * Upcoming calendar events and deadlines.
   * @returns {Promise<Array<{ date, label, type }>>}
   */
  async getCalendarEvents() {
    const res = await fetch(`${BASE_URL}/registrar/schedule/events`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  /**
   * DepEd compliance checklist.
   * @returns {Promise<Array<{ label, done, note }>>}
   */
  async getComplianceChecklist() {
    const res = await fetch(`${BASE_URL}/registrar/schedule/compliance`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },

  // ── Notifications ──────────────────────────────────────────────

  /**
   * System notifications / alerts.
   * @returns {Promise<Array<{ msg, type, time }>>}
   */
  async getNotifications() {
    const res = await fetch(`${BASE_URL}/registrar/notifications`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    return handleResponse(res);
  },
};

export default registrarService;
