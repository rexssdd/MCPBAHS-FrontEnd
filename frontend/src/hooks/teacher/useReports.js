// src/hooks/useReports.js
// ─────────────────────────────────────────────────────────────────────────────
// Fetches the paginated report list + stats.
// Falls back to MOCK_REPORTS when the API is unreachable so the UI is always
// testable (black-box / UI testing without a running backend).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import reportsService from "../../services/teacher/reportService";

// Adapter: derive report stats from a paginated list response since the
// teacher reportService does not expose a dedicated fetchReportStats endpoint.
function deriveStats(data = []) {
  return {
    total:       data.length,
    pending:     data.filter((r) => r.status === "for_admin_approval" || r.status === "for_principal_approval").length,
    approved:    data.filter((r) => r.status === "approved").length,
    disapproved: data.filter((r) => r.status === "rejected").length,
  };
}

// FIX: Only load mock data in development — keeps production bundles clean.
let MOCK_REPORTS = [], MOCK_STATS = null;
if (import.meta.env.DEV) {
  try {
    const m = await import("../../mock/reportMock");
    ({ MOCK_REPORTS, MOCK_STATS } = m);
  } catch { /* mock file absent */ }
}

const ITEMS_PER_PAGE = 10;

/**
 * @typedef {Object} UseReportsReturn
 * @property {import('../services/reportsService').Report[]} reports   – current page
 * @property {import('../services/reportsService').Report[]} allReports – full list (mock mode)
 * @property {import('../services/reportsService').ReportStats}   stats
 * @property {boolean}  loading
 * @property {string|null} error
 * @property {number}   page
 * @property {number}   totalPages
 * @property {string}   search
 * @property {boolean}  usingMockData  – true when API was unreachable
 * @property {Function} setPage
 * @property {Function} setSearch
 * @property {Function} refetch
 * @property {Function} prependReport  – optimistically add a new report to the top
 */

/**
 * @returns {UseReportsReturn}
 */
export function useReports() {
  const [reports,       setReports]       = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [search,        setSearch]        = useState("");
  const [usingMockData, setUsingMockData] = useState(false);

  // Keep a mutable ref for total so we can derive pages without extra state
  const totalRef = useRef(0);

  const load = useCallback(async (currentPage, currentSearch) => {
    setLoading(true);
    setError(null);

    try {
      const listRes = await reportsService.getMyReports({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: currentSearch,
      });

      // getMyReports returns { data, total, page, totalPages } from the backend
      // pagination envelope. Derive stats locally from the full result set.
      const rows = Array.isArray(listRes?.data) ? listRes.data : (Array.isArray(listRes) ? listRes : []);
      const total = listRes?.total ?? rows.length;

      setReports(rows);
      setStats(deriveStats(rows));
      totalRef.current = total;
      setTotalPages(Math.max(1, listRes?.totalPages ?? Math.ceil(total / ITEMS_PER_PAGE)));
      setUsingMockData(false);
    } catch (err) {
      // ── Graceful fallback: use mock data so the UI remains testable ──
      console.warn("[useReports] API unavailable, using mock data:", err.message);

      const lower     = currentSearch.toLowerCase();
      const filtered  = MOCK_REPORTS.filter(
        (r) =>
          r.docId.toLowerCase().includes(lower) ||
          r.fileName.toLowerCase().includes(lower),
      );
      const start     = (currentPage - 1) * ITEMS_PER_PAGE;
      const pageSlice = filtered.slice(start, start + ITEMS_PER_PAGE);

      setReports(pageSlice);
      setStats(MOCK_STATS);
      totalRef.current = filtered.length;
      setTotalPages(Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)));
      setUsingMockData(true);
      setError("API unavailable — showing sample data. Connect to the backend to see real reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, search);
  }, [load, page, search]);

  const refetch = useCallback(() => {
    load(page, search);
  }, [load, page, search]);

  /** Optimistically prepend a newly-submitted report without re-fetching */
  const prependReport = useCallback((newReport) => {
    setReports((prev) => [newReport, ...prev].slice(0, ITEMS_PER_PAGE));
    setStats((prev) => ({
      ...prev,
      total:   prev.total   + 1,
      pending: prev.pending + 1,
    }));
  }, []);

  const handleSetSearch = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  return {
    reports,
    allReports: MOCK_REPORTS, // kept for convenience (e.g., stats when API is down)
    stats,
    loading,
    error,
    page,
    totalPages,
    search,
    usingMockData,
    setPage,
    setSearch: handleSetSearch,
    refetch,
    prependReport,
  };
}