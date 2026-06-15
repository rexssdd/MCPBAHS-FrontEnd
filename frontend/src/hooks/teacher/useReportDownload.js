// src/hooks/useReportDownload.js
// ─────────────────────────────────────────────────────────────────────────────
// Wraps the download service call, surfaces loading and error state.
// Falls back to a toast message (no actual file) when the API is unreachable.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { downloadReport }        from "../../services/teacher/reportService";

/**
 * @typedef {Object} UseReportDownloadReturn
 * @property {boolean}     downloading
 * @property {string|null} downloadError
 * @property {Function}    handleDownload  – async (report) => void
 * @property {Function}    clearError
 */

/**
 * @returns {UseReportDownloadReturn}
 */
export function useReportDownload() {
  const [downloading,   setDownloading]   = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const clearError = useCallback(() => setDownloadError(null), []);

  /**
   * @param {{ id: string|number, fileName: string }} report
   * @param {Function} [onSuccess]  – called with `fileName` when download starts
   * @param {Function} [onFallback] – called with `fileName` when API unavailable
   */
  const handleDownload = useCallback(
    async (report, onSuccess, onFallback) => {
      setDownloading(true);
      setDownloadError(null);

      try {
        // RDCS-FE-03 fix: the second argument to downloadReport() is timeoutMs
        // (a number), NOT a filename. Passing report.fileName set a string timeout
        // which coerced to NaN → 0 ms, aborting every download instantly.
        // Use the report UUID so the URL matches the backend route constraint.
        const blob = await downloadReport(report.uuid ?? report.id);

        // Trigger browser save dialog with the original server filename.
        const filename = report.original_filename ?? report.fileName ?? "report";
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);

        onSuccess?.(filename);
      } catch (err) {
        console.warn("[useReportDownload] API unavailable:", err.message);

        // Graceful fallback: notify via callback (caller shows a toast)
        onFallback?.(report.original_filename ?? report.fileName ?? "report");
      } finally {
        setDownloading(false);
      }
    },
    [],
  );

  return { downloading, downloadError, handleDownload, clearError };
}