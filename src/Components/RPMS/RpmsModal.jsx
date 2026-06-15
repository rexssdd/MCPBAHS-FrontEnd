/**
 * RpmsModal.jsx
 * Full-screen modal for RPMS (Results-Based Performance Management System) data.
 *
 * WHERE TO ADD THIS FILE:
 *   src/Components/RPMS/RpmsModal.jsx
 *
 * HOW TO WIRE INTO FacultyandStaff.jsx:
 *   1. Import at the top:
 *        import RpmsModal from "../../Components/RPMS/RpmsModal";
 *
 *   2. Add state in FacultyandStaffPage():
 *        const [rpmsTarget, setRpmsTarget] = useState(null);
 *
 *   3. Render at the bottom of the return (inside page-layout div, after Toast):
 *        {rpmsTarget && (
 *          <RpmsModal
 *            faculty={rpmsTarget}
 *            onClose={() => setRpmsTarget(null)}
 *          />
 *        )}
 *
 *   4. In FacultyView, add the RPMS button and pass the handler down:
 *        // In FacultyandStaffPage render:
 *        <FacultyView
 *          ...
 *          onRpms={(f) => setRpmsTarget(f)}
 *        />
 *
 *        // In FacultyView component signature:
 *        function FacultyView({ facultyId, facultyLocal, onBack, onEdit, onRpms })
 *
 *        // In FacultyView profile header (next to the Edit button):
 *        <button className="btn btn-outline" onClick={() => onRpms(faculty)}>
 *          📊 RPMS Report
 *        </button>
 *
 *   5. In FacultyList's action buttons (renderActions), add a RPMS shortcut:
 *        <button
 *          className="action-btn action-btn--edit"
 *          onClick={e => { e.stopPropagation(); onRpms(row); }}
 *          title="RPMS Report"
 *        >
 *          <IconChart />
 *          <span>RPMS</span>
 *        </button>
 *        // Pass onRpms={f => setRpmsTarget(f)} from FacultyandStaffPage to FacultyList
 */

import { useEffect } from "react";
import { useFacultyRpms } from "../../hooks/useFacultyRpms";
import "../../Css/Admin/Rpms.css";

/* ── tiny SVG icons (self-contained, no icon-lib dependency) ── */
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconFile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IconInfo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const IconGenerate = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

/* ── helpers ──────────────────────────────────────────────── */
function getFacultyFullName(faculty) {
  if (!faculty) return "—";
  return [faculty.firstName, faculty.middleName, faculty.lastName]
    .filter(Boolean).join(" ") || faculty.name || "—";
}

function ScoreBar({ score }) {
  const pct = Math.min(100, Math.max(0, ((score ?? 0) / 5) * 100));
  const color =
    score >= 4.5 ? "#15803d" :
    score >= 3.5 ? "#16a34a" :
    score >= 2.5 ? "#ca8a04" :
    "#dc2626";
  return (
    <div className="rpms-bar-track">
      <div className="rpms-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function AdjectivalChip({ label }) {
  const cls =
    label === "Outstanding"      ? "rpms-chip rpms-chip--outstanding" :
    label === "Very Satisfactory"? "rpms-chip rpms-chip--vs" :
    label === "Satisfactory"     ? "rpms-chip rpms-chip--sat" :
    label === "Unsatisfactory"   ? "rpms-chip rpms-chip--unsat" :
                                   "rpms-chip rpms-chip--poor";
  return <span className={cls}>{label}</span>;
}

/* ── Spinner ──────────────────────────────────────────────── */
function Spinner({ label }) {
  return (
    <div className="rpms-spinner-wrap">
      <div className="rpms-spinner" />
      <p className="rpms-spinner-label">{label}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RPMS MODAL
   ══════════════════════════════════════════════════════════ */
export default function RpmsModal({ faculty, onClose }) {
  const fullName = getFacultyFullName(faculty);

  const {
    rpms, status, apiWarning,
    schoolYear, quarter,
    setSchoolYear, setQuarter,
    SCHOOL_YEARS, QUARTERS,
    fetchReport, generateReport,
  } = useFacultyRpms(faculty?.id, fullName);

  /* auto-fetch on mount */
  useEffect(() => {
    fetchReport();
  }, []);

  /* close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isLoading = status === "loading" || status === "generating";

  /* formatted date */
  const generatedAt = rpms?.generatedAt
    ? new Date(rpms.generatedAt).toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="rpms-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="rpms-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="rpms-modal-header">
          <div className="rpms-header-icon">
            <IconFile />
          </div>
          <div className="rpms-header-text">
            <h2 className="rpms-modal-title">RPMS Report</h2>
            <p className="rpms-modal-sub">{fullName} · Results-Based Performance Management System</p>
          </div>
          <button className="rpms-close-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        {/* ── Controls ───────────────────────────────────────── */}
        <div className="rpms-controls">
          <div className="rpms-control-group">
            <label className="rpms-control-label">School Year</label>
            <select
              className="rpms-select"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              disabled={isLoading}
            >
              {SCHOOL_YEARS.map((sy) => (
                <option key={sy} value={sy}>{sy}</option>
              ))}
            </select>
          </div>

          <div className="rpms-control-group">
            <label className="rpms-control-label">Quarter</label>
            <select
              className="rpms-select"
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              disabled={isLoading}
            >
              {QUARTERS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          <div className="rpms-control-actions">
            <button
              className="btn btn-outline rpms-btn-sm"
              onClick={() => fetchReport()}
              disabled={isLoading}
            >
              <IconRefresh />
              View Report
            </button>
            <button
              className="btn btn-primary rpms-btn-sm"
              onClick={generateReport}
              disabled={isLoading}
            >
              <IconGenerate />
              {status === "generating" ? "Generating…" : "Generate RPMS"}
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="rpms-modal-body">

          {/* Demo / API warning banner */}
          {apiWarning && !isLoading && (
            <div className="rpms-warning-banner">
              <IconInfo />
              <span>{apiWarning}</span>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <Spinner label={
              status === "generating"
                ? "Aggregating RPMS data from all subsystems…"
                : "Loading RPMS report…"
            } />
          )}

          {/* Empty / idle state */}
          {!isLoading && !rpms && (
            <div className="rpms-empty">
              <div className="rpms-empty-icon">
                <IconFile />
              </div>
              <p className="rpms-empty-title">No report loaded</p>
              <p className="rpms-empty-sub">
                Select a school year and quarter, then click{" "}
                <strong>View Report</strong> to load an existing report, or{" "}
                <strong>Generate RPMS</strong> to create one.
              </p>
            </div>
          )}

          {/* Report data */}
          {!isLoading && rpms && (
            <>
              {/* ── Summary cards ────────────────────────────── */}
              <div className="rpms-summary-grid">
                <div className="rpms-summary-card rpms-summary-card--highlight">
                  <p className="rpms-summary-label">Final Rating</p>
                  <p className="rpms-summary-value">{rpms.finalRating?.toFixed(2) ?? "—"}</p>
                  <AdjectivalChip label={rpms.adjectivalRating ?? "—"} />
                </div>

                <div className="rpms-summary-card">
                  <p className="rpms-summary-label">School Year</p>
                  <p className="rpms-summary-value rpms-summary-value--md">{rpms.schoolYear}</p>
                  <p className="rpms-summary-meta">Quarter: {rpms.quarter}</p>
                </div>

                <div className="rpms-summary-card">
                  <p className="rpms-summary-label">Indicators Rated</p>
                  <p className="rpms-summary-value rpms-summary-value--md">{rpms.ratings?.length ?? 0}</p>
                  <p className="rpms-summary-meta">Performance indicators evaluated</p>
                </div>

                <div className="rpms-summary-card">
                  <p className="rpms-summary-label">Generated</p>
                  <p className="rpms-summary-value rpms-summary-value--sm">
                    {generatedAt ?? "—"}
                  </p>
                  {rpms.isDemo && (
                    <p className="rpms-summary-meta rpms-demo-tag">Demo data</p>
                  )}
                </div>
              </div>

              {/* ── Ratings table ─────────────────────────────── */}
              <div className="rpms-section">
                <h3 className="rpms-section-title">Performance Indicator Ratings</h3>
                <div className="rpms-table-card">
                  <table className="rpms-table">
                    <thead>
                      <tr>
                        <th className="rpms-th rpms-th--indicator">Performance Indicator</th>
                        <th className="rpms-th rpms-th--score">Score</th>
                        <th className="rpms-th rpms-th--bar">Progress (out of 5.0)</th>
                        <th className="rpms-th rpms-th--rating">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(rpms.ratings ?? []).map((r, i) => (
                        <tr key={i} className={i % 2 === 1 ? "rpms-tr--alt" : ""}>
                          <td className="rpms-td rpms-td--indicator">{r.indicator}</td>
                          <td className="rpms-td rpms-td--score">
                            {r.score?.toFixed(1) ?? "—"}
                          </td>
                          <td className="rpms-td rpms-td--bar">
                            <ScoreBar score={r.score} />
                          </td>
                          <td className="rpms-td">
                            <AdjectivalChip label={
                              r.score >= 4.5 ? "Outstanding" :
                              r.score >= 3.5 ? "Very Satisfactory" :
                              r.score >= 2.5 ? "Satisfactory" :
                              r.score >= 1.5 ? "Unsatisfactory" : "Poor"
                            } />
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Table footer — average row */}
                    <tfoot>
                      <tr className="rpms-tfoot-row">
                        <td className="rpms-td rpms-tfoot-label">Final Rating (Average)</td>
                        <td className="rpms-td rpms-td--score rpms-tfoot-score">
                          {rpms.finalRating?.toFixed(2) ?? "—"}
                        </td>
                        <td className="rpms-td rpms-td--bar">
                          <ScoreBar score={rpms.finalRating} />
                        </td>
                        <td className="rpms-td">
                          <AdjectivalChip label={rpms.adjectivalRating ?? "—"} />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ── Evaluator remarks ─────────────────────────── */}
              {rpms.remarks && (
                <div className="rpms-section">
                  <h3 className="rpms-section-title">Evaluator Remarks</h3>
                  <div className="rpms-remarks-box">
                    <p className="rpms-remarks-text">{rpms.remarks}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="rpms-modal-footer">
          {rpms && !isLoading && (
            <p className="rpms-footer-meta">
              {rpms.isDemo
                ? "⚠ Showing demo data. Connect the backend to view real RPMS data."
                : `Report generated on ${generatedAt}.`
              }
            </p>
          )}
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
}
