// src/hooks/useReportSubmit.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles the submission flow: calls the service, surfaces loading/error state,
// and returns the newly-created report on success.
// Falls back to a local mock when the API is unreachable.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import reportsService from "../../services/teacher/reportService";

/**
 * @typedef {Object} UseReportSubmitReturn
 * @property {boolean}      submitting
 * @property {string|null}  submitError
 * @property {Function}     handleSubmit   – async (payload) => Report | null
 * @property {Function}     clearError
 */

/**
 * @returns {UseReportSubmitReturn}
 */
export function useReportSubmit() {
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState(null);

  const clearError = useCallback(() => setSubmitError(null), []);

  /**
   * Submit a report.
   * @param {{ sfType: string, quarter: string, files: File[], notes: string }} payload
   * @returns {Promise<import('../services/reportsService').Report|null>}
   */
  const handleSubmit = useCallback(async (payload) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const report = await reportsService.submitReport(payload);
      return report;
    } catch (err) {
      // ── Graceful fallback: create a mock report locally ──────────────
      if (err.name === "AbortError" || err.message?.includes("fetch")) {
        console.warn("[useReportSubmit] API unavailable, creating mock report locally.");
        const mockReport = {
          id:          Date.now(),
          docId:       `SF-2025-MOCK-${Date.now()}`,
          fileName:    payload.files[0]?.name ?? "report.pdf",
          submittedOn: new Date().toLocaleString("en-PH", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
          evaluatedOn: "—",
          status:      "Pending",
          comments:    payload.notes ?? "",
        };
        return mockReport;
      }

      // Real server error — surface it
      const message =
        err.body?.message ??
        err.message ??
        "Submission failed. Please try again.";
      setSubmitError(message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submitting, submitError, handleSubmit, clearError };
}