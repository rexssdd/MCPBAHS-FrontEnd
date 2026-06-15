// src/hooks/teacher/useReportDetail.js
// ─────────────────────────────────────────────────────────────────────────────
// Fetches a single report by ID. Falls back to the mock list when the API
// is unreachable so the detail / feedback views always work in testing.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { fetchReportById }                   from "../../services/teacher/reportService";

// FIX: Only load mock data in development.
let MOCK_REPORTS = [];
if (import.meta.env.DEV) {
  try {
    const m = await import("../../mock/reportMock");
    MOCK_REPORTS = m.MOCK_REPORTS ?? [];
  } catch { /* mock file absent */ }
}

/**
 * @typedef {Object} UseReportDetailReturn
 * @property {import('../../services/teacher/reportService').Report|null} report
 * @property {boolean}    loading
 * @property {string|null} error
 * @property {Function}   refetch
 */

/**
 * @param {string|number|null} id – pass null to skip fetching
 * @returns {UseReportDetailReturn}
 */
export function useReportDetail(id) {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (id == null) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchReportById(id);
      setReport(data);
    } catch (err) {
      console.warn("[useReportDetail] API unavailable, falling back to mock:", err.message);

      // Try to find the report in mock data
      const mock = MOCK_REPORTS.find(
        (r) => String(r.id) === String(id) || r.docId === String(id),
      );

      if (mock) {
        setReport(mock);
        setError(null);
      } else {
        setError("Report not found.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { report, loading, error, refetch: load };
}