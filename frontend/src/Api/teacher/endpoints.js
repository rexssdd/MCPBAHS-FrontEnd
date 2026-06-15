// src/api/endpoints.js
// ─────────────────────────────────────────────────────────────────────────────
// All API endpoint paths in one place — easy to update when backend changes.
// ─────────────────────────────────────────────────────────────────────────────

export const ENDPOINTS = {
  reports: {
    /** GET  /reports?page=&limit=&search= */
    list:       "/reports",
    /** GET  /reports/mine  (teacher-scoped) */
    mine:       "/reports/mine",
    /** GET  /reports/:id */
    detail:     (id)      => `/reports/${id}`,
    /** POST /reports  (multipart) */
    submit:     "/reports",
    /** GET  /reports/:id/download  → binary file response */
    download:   (id)      => `/reports/${id}/download`,
    // NOTE: /reports/stats does not exist in the backend routes.
    // Stats are derived client-side from the paginated list response.
    // See deriveStats() in hooks/teacher/useReports.js.
  },
};