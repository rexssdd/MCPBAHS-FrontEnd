// src/__mocks__/reportsMock.js
// ─────────────────────────────────────────────────────────────────────────────
// Default/fallback data used by hooks when the API is unreachable.
// Kept here so it's easy to update in one place.
// ─────────────────────────────────────────────────────────────────────────────

/** @type {import('../services/reportsService').Report[]} */
export const MOCK_REPORTS = Array.from({ length: 12 }, (_, i) => ({
  id:          i + 1,
  docId:       `SF-2025-${String(i + 1).padStart(4, "0")}`,
  fileName:    i % 3 === 0 ? "SF10.pdf" : i % 3 === 1 ? "SF2.pdf" : "SF4.docx",
  submittedOn: "Dec 03, 2025 · 10:30 AM",
  evaluatedOn: i < 7 ? "Dec 06, 2025 · 02:15 PM" : "—",
  status:      i < 3 ? "Approved" : i < 5 ? "Disapproved" : "Pending",
  comments:
    i < 3
      ? ""
      : i < 5
      ? "The report contains missing data. Please resubmit with complete records."
      : "",
}));

/** @type {import('../services/reportsService').ReportStats} */
export const MOCK_STATS = {
  total:       MOCK_REPORTS.length,
  approved:    MOCK_REPORTS.filter((r) => r.status === "Approved").length,
  disapproved: MOCK_REPORTS.filter((r) => r.status === "Disapproved").length,
  pending:     MOCK_REPORTS.filter((r) => r.status === "Pending").length,
};