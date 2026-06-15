// src/utils/archive.js
// Helper utilities to consistently detect "archived" status across the app.
export function isArchived(status) {
  if (status === null || typeof status === "undefined") return false;
  const s = String(status).trim().toLowerCase();
  return s === "archived" || s === "inactive" || s === "archived".toLowerCase();
}

export function normalizeStatus(status) {
  if (status === null || typeof status === "undefined") return "";
  const s = String(status).trim().toLowerCase();
  if (s === "inactive") return "Archived";
  return status;
}
