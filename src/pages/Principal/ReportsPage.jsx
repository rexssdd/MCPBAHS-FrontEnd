/**
 * src/pages/Principal/Reports.jsx
 *
 * Principal view of the Reports and DepEd Compliance page.
 *
 * Differences from Admin view:
 *  — No "Submit a Report" button  (principals don't submit)
 *  — No bulk-delete toolbar action (destructive, admin-only)
 *  — No Archive button per row     (admin-only)
 *  — No Delete option in modals    (admin-only)
 *  — Evaluate confirm says "Final Approval / Final Disapproval"
 *    instead of "Forward to Principal" (principal IS the final approver)
 *  — Page title and description reflect the principal's role
 *  — Selection checkboxes retained for reference; bulk actions removed
 *
 * All bug-fixes from the Admin version are preserved as-is.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../../Components/Sidebar";
import "../../Css/Admin/Reports.css";
import reportsService from "../../services/Principal/reportService";

//SF Form Metadata

const SF_INFO = {
  1: { name: "SF1", title: "School Register", desc: "Masterlist of all enrolled learners per section per school year." },
  2: { name: "SF2", title: "Daily Attendance Report", desc: "Daily attendance record of learners for a given month." },
  3: { name: "SF3", title: "Books Issued and Returned", desc: "Record of textbooks issued and returned by learners." },
  4: { name: "SF4", title: "Progress Report Card", desc: "Quarterly assessment and academic progress of each learner." },
  5: { name: "SF5", title: "Report on Promotion & Level of Proficiency", desc: "End-of-year promotion status and subject proficiency levels." },
  6: { name: "SF6", title: "Summarized Report on Promotion", desc: "Section-level summary of promotion results per grade/section." },
  7: { name: "SF7", title: "Home Address & Health Card", desc: "Learner home address, parent info, and basic health profile." },
  8: { name: "SF8", title: "Learner's Nutrition Report", desc: "Nutritional status assessment of learners per quarter." },
  9: { name: "SF9", title: "Parent-Teacher Conference", desc: "Record of parent-teacher conferences and outcomes." },
  10: { name: "SF10", title: "Permanent Record / Cumulative Record", desc: "Comprehensive permanent academic record of each learner." },
};

//MOCK / DEFAULT DATA

const LEARNERS = [
  "Aguilar, Mark Casuela", "Benedecto, Albert Juan", "Garcia, Paul Sola",
  "Gunio, Berty Patas", "Neri, Denise Rios", "Reyes, Carlo Bautista",
  "Santos, Maria Cruz", "Tan, Liza Garcia", "Torres, Jenny Rivera",
  "Lim, Marco Mendoza", "Ramos, Alvin Flores", "Aquino, Bea Torres",
  "Cruz, Ana Dela", "Villanueva, Rosa Mendoza", "Bautista, Jose Reyes",
];

const generateMockReports = () => {
  const submitters = ["John Jay Doe", "Maria Santos", "Jose Bautista", "Ana Cruz", "Pedro Garcia", "Rosa Villanueva", "Carlo Reyes", "Liza Tan"];
  return Array.from({ length: 40 }, (_, i) => {
    const sfNum = (i % 10) + 1;
    return {
      id: String(100000 + i + 1),
      sfNumber: sfNum,
      docId: `SF${sfNum}-2025-${String(i + 1).padStart(3, "0")}`,
      submittedBy: submitters[i % submitters.length],
      dateSubmitted: `12/${String((i % 28) + 1).padStart(2, "0")}/25`,
      fileName: `SF${sfNum}.pdf`,
      fileType: i % 3 === 0 ? "DOCX" : "PDF",
      fileSize: "8.77 MB",
      status: i % 5 === 0 ? "Approved" : i % 5 === 1 ? "Disapproved" : "Pending",
      submittedOn: "12/05/25",
      evaluatedOn: "12/06/25",
      gradeLevel: `Grade ${7 + (i % 6)}`,
      section: ["Gemini", "Orion", "Lyra", "Vega", "Aquila"][i % 5],
      month: ["January", "February", "March", "April", "May", "June"][i % 6],
      schoolYear: "2024-2025",
      comment: i % 5 === 1 ? "The report contains missing data. Please resubmit with complete records." : "",
      files: [{ name: `SF${sfNum}.pdf`, status: "complete" }, { name: "supporting.docx", status: "complete" }],
    };
  });
};

const MOCK_REPORTS = generateMockReports();
const PAGE_SIZE = 10;

//ICONS

const ISearch = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b0bcb0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IFilter = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>;
const ISort = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
const IChevL = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
const IChevR = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>;
const IBChev = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aaa9a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>;
const ICancel = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
const IInfo = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a5e4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
const IClose = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IDisapprove = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z" /></svg>;
const IApprove = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" /></svg>;
const IEvaluate = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
const IDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const IRefresh = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>;
const IBadge = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#1a5c1a" /><polyline points="9 12 11 14 15 10" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const IEye = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const IX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IWifi = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>;
const IWifiOff = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a11 11 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.56 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>;
const IDatabase = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>;
const IStamp = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><polyline points="9 12 11 14 15 10" /></svg>;

//API STATUS BAR

const ApiStatusBar = ({ status, message, onRetry }) => {
  const configs = {
    loading: { cls: "rpt-api-status-bar--loading", dotCls: "rpt-api-status-dot--loading", icon: null, label: "Connecting to API…" },
    connected: { cls: "rpt-api-status-bar--connected", dotCls: "rpt-api-status-dot--connected", icon: <IWifi />, label: "Live data from API" },
    error: { cls: "rpt-api-status-bar--error", dotCls: "rpt-api-status-dot--error", icon: <IWifiOff />, label: "API unreachable" },
    fallback: { cls: "rpt-api-status-bar--fallback", dotCls: "rpt-api-status-dot--fallback", icon: <IDatabase />, label: "Showing default data" },
  };
  const cfg = configs[status] || configs.fallback;
  return (
    <div className={`rpt-api-status-bar ${cfg.cls}`}>
      <span className={`rpt-api-status-dot ${cfg.dotCls}`} />
      {cfg.icon && <span style={{ display: "flex", alignItems: "center" }}>{cfg.icon}</span>}
      <span className="rpt-api-status-label">
        <strong>{cfg.label}</strong>
        {message && <span style={{ fontWeight: 400, marginLeft: 6 }}>— {message}</span>}
      </span>
      {(status === "error" || status === "fallback") && (
        <button className="rpt-api-status-action" onClick={onRetry}><IRefresh /> Retry</button>
      )}
    </div>
  );
};

//SKELETON LOADERS

const SkeletonRow = () => (
  <tr className="rpt-skeleton-row">
    <td className="rpt-td rpt-td--check"><div className="rpt-skeleton rpt-skeleton-checkbox" /></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-text-lg" style={{ width: "70%" }} /><div className="rpt-skeleton rpt-skeleton-text-sm" style={{ width: "45%", marginTop: 5 }} /></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-pill" /><div className="rpt-skeleton rpt-skeleton-text-sm" style={{ width: "80%", marginTop: 5 }} /></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-text-lg" style={{ width: "65%" }} /></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-text-lg" style={{ width: "55%" }} /></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-badge" style={{ width: 80 }} /></td>
    {/* Principal has fewer action buttons — 3 instead of 4 */}
    <td className="rpt-td"><div style={{ display: "flex", gap: 6 }}><div className="rpt-skeleton rpt-skeleton-btn" style={{ width: 86 }} /><div className="rpt-skeleton rpt-skeleton-btn" style={{ width: 70 }} /><div className="rpt-skeleton rpt-skeleton-btn" style={{ width: 86 }} /></div></td>
  </tr>
);
const SkeletonTable = ({ rows = 8 }) => (
  <tbody>{Array.from({ length: rows }, (_, i) => <SkeletonRow key={i} />)}</tbody>
);
const SkeletonPreviewPanel = () => (
  <div className="rpt-preview-panel">
    <div className="rpt-preview-panel-header">
      <div style={{ flex: 1 }}>
        <div className="rpt-skeleton" style={{ height: 14, width: "55%", borderRadius: 5, marginBottom: 8 }} />
        <div className="rpt-skeleton" style={{ height: 10, width: "80%", borderRadius: 4 }} />
      </div>
    </div>
    <div className="rpt-preview-sf-wrap"><div className="rpt-skeleton rpt-skeleton-preview-img" style={{ width: "100%", height: "100%", borderRadius: 0 }} /></div>
    <div className="rpt-preview-meta">{Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="rpt-preview-meta-row"><div className="rpt-skeleton rpt-skeleton-meta-label" /><div className="rpt-skeleton rpt-skeleton-meta-value" style={{ width: "50%" }} /></div>
    ))}</div>
    <div className="rpt-preview-actions">
      <div className="rpt-skeleton" style={{ flex: 1, height: 36, borderRadius: 10 }} />
      <div className="rpt-skeleton" style={{ flex: 1, height: 36, borderRadius: 10 }} />
    </div>
  </div>
);

//UI PRIMITIVES

const Checkbox = ({ checked, onChange, indeterminate = false }) => (
  <div className="rpt-checkbox" onClick={onChange}
    style={{ background: checked || indeterminate ? "#1a5c1a" : "#fff", border: checked || indeterminate ? "none" : "1.5px solid #d1d5db" }}>
    {indeterminate && !checked
      ? <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>−</span>
      : checked ? <span style={{ color: "#fff", fontSize: 11 }}>✓</span> : null}
  </div>
);

const Toast = ({ message, type = "success" }) => {
  if (!message) return null;
  const bg = type === "error" ? "#dc2626" : "#1a5c1a";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, background: bg, color: "#fff",
      padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 9999,
      boxShadow: `0 8px 24px ${bg}55`, fontFamily: "'DM Sans',sans-serif",
      display: "flex", alignItems: "center", gap: 8, animation: "fadeInDown 0.2s ease",
    }}>
      {type === "error" ? "✕" : "✓"} {message}
    </div>
  );
};

const STATUS_MAP = {
  Approved:               { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", border: "#bbf7d0" },
  Disapproved:            { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444", border: "#fecaca" },
  Pending:                { bg: "#fefce8", color: "#a16207", dot: "#eab308", border: "#fde68a" },
  // FIX: new distinct labels from updated ReportStatus::label()
  "For Admin Approval":     { bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6", border: "#bfdbfe" },
  "For Principal Approval": { bg: "#f5f3ff", color: "#7c3aed", dot: "#8b5cf6", border: "#ddd6fe" },
};
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.Pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};

const Breadcrumb = ({ crumbs }) => (
  <div className="rpt-breadcrumb">
    {crumbs.map((c, i) => (
      <span key={i} className="rpt-bc-item">
        {i > 0 && <IBChev />}
        {c.onClick
          ? <button className="rpt-breadcrumb-back" onClick={c.onClick}>{c.label}</button>
          : <span className={`rpt-bc-text${c.green ? " rpt-bc-green" : ""}`}>{c.label}</span>}
      </span>
    ))}
  </div>
);

//SF DOCUMENT RENDERERS  (SF1–SF10, unchanged)

const DocHeader = ({ sfNum, title, subtitle }) => (
  <div className="sf-doc-header">
    <div className="sf-header-left">
      <span className="sf-badge">SF{sfNum}</span>
      <div><div className="sf-doc-title">{title}</div>{subtitle && <div className="sf-doc-subtitle">{subtitle}</div>}</div>
    </div>
    <div className="sf-deped">Dep<span style={{ color: "#dc2626" }}>ED</span></div>
  </div>
);
const MetaRow = ({ items }) => (
  <div className="sf-meta-row">
    {items.map(([label, value]) => (
      <div key={label} className="sf-meta-item">
        <span className="sf-meta-label">{label}</span>
        <span className="sf-meta-value">{value}</span>
      </div>
    ))}
  </div>
);
const SUBJECTS = ["Filipino", "English", "Mathematics", "Science", "AP", "ESP", "MAPEH", "TLE"];
const SF1View = ({ report }) => (
  <div className="sf-doc">
    <DocHeader sfNum={1} title="School Register" subtitle="This replaces Form 1 and BPS Form 1" />
    <MetaRow items={[["School ID", "303203"], ["Grade Level", report.gradeLevel], ["Section", report.section], ["School Year", report.schoolYear]]} />
    <MetaRow items={[["School Name", "Paknaan National High School"], ["District", "Davao City"], ["Division", "Davao City"]]} />
    <div className="sf-table-wrap">
      <table className="sf-table">
        <thead>
          <tr>
            <th className="sf-th" rowSpan={2} style={{ width: 28 }}>No.</th>
            <th className="sf-th" rowSpan={2} style={{ minWidth: 180 }}>LEARNER'S NAME</th>
            <th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" rowSpan={2}>Sex</th>
            <th className="sf-th" rowSpan={2}>Date of Birth</th><th className="sf-th" rowSpan={2}>Age</th>
            <th className="sf-th" colSpan={3}>Mother Tongue</th>
            <th className="sf-th" rowSpan={2}>Religion</th>
            <th className="sf-th" colSpan={2}>IP</th><th className="sf-th" rowSpan={2}>4Ps</th>
          </tr>
          <tr><th className="sf-th">Primary</th><th className="sf-th">Secondary</th><th className="sf-th">Other</th><th className="sf-th">Yes</th><th className="sf-th">No</th></tr>
        </thead>
        <tbody>
          {LEARNERS.slice(0, 10).map((name, i) => (
            <tr key={i} className="sf-tr">
              <td className="sf-td sf-center">{i + 1}</td><td className="sf-td">{name}</td>
              <td className="sf-td sf-center">20{200 + i}</td><td className="sf-td sf-center">{i % 2 === 0 ? "M" : "F"}</td>
              <td className="sf-td sf-center">0{i + 1}/15/2009</td><td className="sf-td sf-center">15</td>
              <td className="sf-td sf-center">Cebuano</td><td className="sf-td" /><td className="sf-td" />
              <td className="sf-td sf-center">Catholic</td><td className="sf-td sf-center">✓</td>
              <td className="sf-td" /><td className="sf-td sf-center">{i % 3 === 0 ? "✓" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
const SF2View = ({ report }) => { const days = Array.from({ length: 31 }, (_, i) => i + 1); return (<div className="sf-doc"><DocHeader sfNum={2} title="Daily Attendance Report of Learners" subtitle="This replaced Form 1, Form 2 & STD Form 4" /><MetaRow items={[["School ID", "303203"], ["School Year", report.schoolYear], ["Month", report.month]]} /><MetaRow items={[["School Name", "Paknaan National High School"], ["Grade Level", report.gradeLevel], ["Section", report.section]]} /><div className="sf-table-wrap"><table className="sf-table sf-table--compact"><thead><tr><th className="sf-th" style={{ minWidth: 160 }}>LEARNER'S NAME</th>{days.map(d => <th key={d} className="sf-th sf-day-th">{d}</th>)}<th className="sf-th">Total Absent</th><th className="sf-th">Remarks</th></tr></thead><tbody>{LEARNERS.slice(0, 8).map((name, i) => (<tr key={i} className="sf-tr"><td className="sf-td" style={{ fontSize: 9 }}>{name}</td>{days.map(d => <td key={d} className="sf-td sf-day-td">{(i + d) % 11 === 0 ? "A" : ""}</td>)}<td className="sf-td sf-center">{i}</td><td className="sf-td" /></tr>))}</tbody></table></div></div>); };
const SF3View = ({ report }) => (<div className="sf-doc"><DocHeader sfNum={3} title="Books Issued and Returned" subtitle="Record of Textbooks and Instructional Materials" /><MetaRow items={[["School ID", "303203"], ["Grade Level", report.gradeLevel], ["Section", report.section], ["School Year", report.schoolYear]]} /><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th" rowSpan={2}>No.</th><th className="sf-th" rowSpan={2}>LEARNER'S NAME</th><th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" colSpan={3}>ISSUED</th><th className="sf-th" colSpan={3}>RETURNED</th><th className="sf-th" rowSpan={2}>Condition</th></tr><tr><th className="sf-th">Book Title</th><th className="sf-th">Date</th><th className="sf-th">Condition</th><th className="sf-th">Book Title</th><th className="sf-th">Date</th><th className="sf-th">Condition</th></tr></thead><tbody>{LEARNERS.slice(0, 10).map((name, i) => (<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i + 1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200 + i}</td><td className="sf-td">Science 9 – LM</td><td className="sf-td sf-center">06/01/25</td><td className="sf-td sf-center">Good</td><td className="sf-td">{i % 3 === 0 ? "Science 9 – LM" : ""}</td><td className="sf-td sf-center">{i % 3 === 0 ? "10/15/25" : ""}</td><td className="sf-td sf-center">{i % 3 === 0 ? "Good" : ""}</td><td className="sf-td sf-center">Good</td></tr>))}</tbody></table></div></div>);
const SF4View = ({ report }) => (<div className="sf-doc"><DocHeader sfNum={4} title="Progress Report Card (Learner)" subtitle="School Report Card" /><MetaRow items={[["School Year", report.schoolYear], ["Grade Level", report.gradeLevel], ["Section", report.section]]} /><div className="sf-info-grid">{[["Learner's Name", "Aguilar, Mark Casuela"], ["LRN", "202001"], ["Date of Birth", "01/15/2009"], ["Sex", "Male"], ["General Average", "88.5"], ["Remarks", "Promoted"]].map(([l, v]) => (<div key={l} className="sf-info-cell"><span className="sf-info-label">{l}</span><span className="sf-info-val">{v}</span></div>))}</div><div className="sf-table-wrap" style={{ marginTop: 12 }}><table className="sf-table"><thead><tr><th className="sf-th">Learning Area</th><th className="sf-th">Q1</th><th className="sf-th">Q2</th><th className="sf-th">Q3</th><th className="sf-th">Q4</th><th className="sf-th">Final Grade</th><th className="sf-th">Remarks</th></tr></thead><tbody>{SUBJECTS.map((s, i) => { const grades = [85 + i % 5, 87 + i % 4, 86 + i % 6, 88 + i % 3]; const avg = Math.round(grades.reduce((a, b) => a + b, 0) / 4); return (<tr key={s} className="sf-tr"><td className="sf-td">{s}</td>{grades.map((g, j) => <td key={j} className="sf-td sf-center">{g}</td>)}<td className="sf-td sf-center sf-grade-final">{avg}</td><td className="sf-td sf-center" style={{ color: "#15803d", fontWeight: 700 }}>Passed</td></tr>); })}<tr className="sf-tr sf-tr--total"><td className="sf-td" style={{ fontWeight: 700 }}>General Average</td><td className="sf-td sf-center" colSpan={4} /><td className="sf-td sf-center sf-grade-final">88</td><td className="sf-td sf-center" style={{ color: "#15803d", fontWeight: 700 }}>Promoted</td></tr></tbody></table></div></div>);
const SF5View = ({ report }) => (<div className="sf-doc"><DocHeader sfNum={5} title="Report on Promotion & Level of Proficiency" subtitle="End-of-Year Report" /><MetaRow items={[["School Year", report.schoolYear], ["Grade Level", report.gradeLevel], ["Section", report.section], ["School ID", "303203"]]} /><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th" rowSpan={2}>No.</th><th className="sf-th" rowSpan={2}>LEARNER'S NAME</th><th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" colSpan={4}>QUARTERLY GRADES</th><th className="sf-th" rowSpan={2}>Gen. Avg.</th><th className="sf-th" rowSpan={2}>Remarks</th></tr><tr><th className="sf-th">Q1</th><th className="sf-th">Q2</th><th className="sf-th">Q3</th><th className="sf-th">Q4</th></tr></thead><tbody>{LEARNERS.slice(0, 10).map((name, i) => { const avg = 82 + i % 10; return (<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i + 1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200 + i}</td>{[80 + i % 8, 83 + i % 6, 85 + i % 5, 81 + i % 7].map((g, j) => <td key={j} className="sf-td sf-center">{g}</td>)}<td className="sf-td sf-center sf-grade-final">{avg}</td><td className="sf-td sf-center" style={{ color: avg >= 75 ? "#15803d" : "#dc2626", fontWeight: 700 }}>{avg >= 75 ? "Promoted" : "Retained"}</td></tr>); })}</tbody></table></div></div>);
const SF6View = ({ report }) => (<div className="sf-doc"><DocHeader sfNum={6} title="Summarized Report on Promotion" subtitle="Summary per Grade Level" /><MetaRow items={[["School Year", report.schoolYear], ["School Name", "Paknaan National High School"], ["School ID", "303203"]]} /><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">Grade Level</th><th className="sf-th">Section</th><th className="sf-th">Total Enrolled</th><th className="sf-th">Male</th><th className="sf-th">Female</th><th className="sf-th">Promoted</th><th className="sf-th">Retained</th><th className="sf-th">Dropped</th><th className="sf-th">% Promoted</th></tr></thead><tbody>{[7, 8, 9, 10, 11, 12].map((g, i) => { const total = 30 + i * 2, promoted = 28 + i, retained = 1, dropped = total - promoted - retained; return (<tr key={g} className="sf-tr"><td className="sf-td">Grade {g}</td><td className="sf-td">Gemini</td><td className="sf-td sf-center">{total}</td><td className="sf-td sf-center">{Math.floor(total / 2)}</td><td className="sf-td sf-center">{Math.ceil(total / 2)}</td><td className="sf-td sf-center" style={{ color: "#15803d", fontWeight: 700 }}>{promoted}</td><td className="sf-td sf-center" style={{ color: "#dc2626" }}>{retained}</td><td className="sf-td sf-center" style={{ color: "#a16207" }}>{dropped}</td><td className="sf-td sf-center">{((promoted / total) * 100).toFixed(1)}%</td></tr>); })}</tbody></table></div></div>);
const SF7View = ({ report }) => (<div className="sf-doc"><DocHeader sfNum={7} title="Home Address & Health Card" subtitle="Learner Information Sheet" /><MetaRow items={[["Grade Level", report.gradeLevel], ["Section", report.section], ["School Year", report.schoolYear]]} /><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">No.</th><th className="sf-th" style={{ minWidth: 160 }}>LEARNER'S NAME</th><th className="sf-th">LRN</th><th className="sf-th">Home Address</th><th className="sf-th">Parent/Guardian</th><th className="sf-th">Contact No.</th><th className="sf-th">Height (cm)</th><th className="sf-th">Weight (kg)</th><th className="sf-th">Blood Type</th><th className="sf-th">Medical Condition</th></tr></thead><tbody>{LEARNERS.slice(0, 10).map((name, i) => (<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i + 1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200 + i}</td><td className="sf-td" style={{ fontSize: 9 }}>Brgy. {["Talomo", "Matina", "Buhangin"][i % 3]}, Davao City</td><td className="sf-td" style={{ fontSize: 9 }}>{name.split(",")[0]} Sr.</td><td className="sf-td sf-center" style={{ fontSize: 9 }}>091{20000 + i}</td><td className="sf-td sf-center">{150 + i}</td><td className="sf-td sf-center">{45 + i}</td><td className="sf-td sf-center">{["O+", "A+", "B+", "AB+"][i % 4]}</td><td className="sf-td sf-center">{i % 5 === 0 ? "Asthma" : "None"}</td></tr>))}</tbody></table></div></div>);
const SF8View = ({ report }) => (<div className="sf-doc"><DocHeader sfNum={8} title="Learner's Nutrition Report" subtitle="Nutritional Status of Learners" /><MetaRow items={[["School Year", report.schoolYear], ["Grade Level", report.gradeLevel], ["Section", report.section], ["Quarter", "Q1"]]} /><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th" rowSpan={2}>No.</th><th className="sf-th" rowSpan={2}>LEARNER'S NAME</th><th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" rowSpan={2}>Sex</th><th className="sf-th" rowSpan={2}>Age</th><th className="sf-th" colSpan={2}>BEG OF YEAR</th><th className="sf-th" colSpan={2}>END OF YEAR</th><th className="sf-th" rowSpan={2}>Nutritional Status</th></tr><tr><th className="sf-th">Ht(cm)</th><th className="sf-th">Wt(kg)</th><th className="sf-th">Ht(cm)</th><th className="sf-th">Wt(kg)</th></tr></thead><tbody>{LEARNERS.slice(0, 10).map((name, i) => { const statuses = ["Normal", "Stunted", "Underweight", "Normal", "Obese"]; const status = statuses[i % 5]; const colors = { "Normal": "#15803d", "Stunted": "#a16207", "Underweight": "#dc2626", "Obese": "#7c3aed" }; return (<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i + 1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200 + i}</td><td className="sf-td sf-center">{i % 2 === 0 ? "M" : "F"}</td><td className="sf-td sf-center">15</td><td className="sf-td sf-center">{148 + i}</td><td className="sf-td sf-center">{43 + i}</td><td className="sf-td sf-center">{150 + i}</td><td className="sf-td sf-center">{45 + i}</td><td className="sf-td sf-center" style={{ color: colors[status] || "#111", fontWeight: 700 }}>{status}</td></tr>); })}</tbody></table></div><div className="sf-legend"><span>Legend:</span>{[["Normal", "#15803d"], ["Stunted", "#a16207"], ["Underweight", "#dc2626"], ["Obese", "#7c3aed"]].map(([l, c]) => (<span key={l} style={{ color: c, fontWeight: 700, fontSize: 10 }}>● {l}</span>))}</div></div>);
const SF9View = ({ report }) => (<div className="sf-doc"><DocHeader sfNum={9} title="Parent-Teacher Conference Record" subtitle="Record of Meetings and Outcomes" /><MetaRow items={[["School Year", report.schoolYear], ["Grade Level", report.gradeLevel], ["Section", report.section]]} /><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">No.</th><th className="sf-th">LEARNER'S NAME</th><th className="sf-th">LRN</th><th className="sf-th">Date of Conference</th><th className="sf-th">Parent/Guardian Present</th><th className="sf-th">Concerns Raised</th><th className="sf-th">Actions Taken</th><th className="sf-th">Follow-up Date</th><th className="sf-th">Teacher Signature</th></tr></thead><tbody>{LEARNERS.slice(0, 8).map((name, i) => (<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i + 1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200 + i}</td><td className="sf-td sf-center">11/{String(i + 1).padStart(2, "0")}/25</td><td className="sf-td">{name.split(",")[0]} Sr.</td><td className="sf-td" style={{ fontSize: 9 }}>{["Academic performance", "Attendance", "Behavior", "Grade concerns"][i % 4]}</td><td className="sf-td" style={{ fontSize: 9 }}>{["Advisory given", "Referred to guidance", "Monitored", "Home visit"][i % 4]}</td><td className="sf-td sf-center">12/{String(i + 5).padStart(2, "0")}/25</td><td className="sf-td" /></tr>))}</tbody></table></div></div>);
const SF10View = ({ report }) => (<div className="sf-doc"><DocHeader sfNum={10} title="Permanent Record / Cumulative Record" subtitle="Comprehensive Learner Achievement Record" /><div className="sf-info-grid sf-info-grid--wide">{[["Learner's Name", "Aguilar, Mark Casuela"], ["LRN", "202001"], ["Date of Birth", "01/15/2009"], ["Sex", "Male"], ["Place of Birth", "Davao City"], ["Nationality", "Filipino"], ["Mother Tongue", "Cebuano"], ["Religion", "Catholic"], ["Home Address", "Brgy. Talomo, Davao City"], ["Parent/Guardian", "Aguilar, Mark Sr."], ["Contact No.", "09123456789"], ["Email", "aguilar@example.com"]].map(([l, v]) => (<div key={l} className="sf-info-cell"><span className="sf-info-label">{l}</span><span className="sf-info-val">{v}</span></div>))}</div><div className="sf-section-sep">Academic Records</div><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">Grade Level</th><th className="sf-th">School Year</th>{SUBJECTS.map(s => <th key={s} className="sf-th" style={{ fontSize: 8, padding: "4px 3px" }}>{s}</th>)}<th className="sf-th">Gen. Avg.</th><th className="sf-th">Remarks</th></tr></thead><tbody>{[7, 8, 9, 10].map((g, i) => { const grades = SUBJECTS.map((_, j) => 80 + j % 8 + i); const avg = Math.round(grades.reduce((a, b) => a + b, 0) / grades.length); return (<tr key={g} className="sf-tr"><td className="sf-td">Grade {g}</td><td className="sf-td sf-center">{2020 + i}-{2021 + i}</td>{grades.map((gr, j) => <td key={j} className="sf-td sf-center">{gr}</td>)}<td className="sf-td sf-center sf-grade-final">{avg}</td><td className="sf-td sf-center" style={{ color: "#15803d", fontWeight: 700 }}>Promoted</td></tr>); })}</tbody></table></div></div>);

const SFDocument = ({ report }) => {
  const views = { 1: SF1View, 2: SF2View, 3: SF3View, 4: SF4View, 5: SF5View, 6: SF6View, 7: SF7View, 8: SF8View, 9: SF9View, 10: SF10View };
  const View = views[report.sfNumber] || SF1View;
  return <View report={report} />;
};

//RIGHT PREVIEW PANEL
//   Principal: "Evaluate" CTA kept; no archive/delete actions

const PreviewPanel = ({ report, loading, onClose, onView, onEvaluate }) => {
  if (loading) return <SkeletonPreviewPanel />;
  if (!report) return null;
  const sfInfo = SF_INFO[report.sfNumber] || SF_INFO[1];
  return (
    <div className="rpt-preview-panel">
      <div className="rpt-preview-panel-header">
        <div>
          <div className="rpt-preview-panel-title">{sfInfo.name} Preview</div>
          <div className="rpt-preview-panel-sub">{sfInfo.title}</div>
        </div>
        <button className="rpt-preview-close" onClick={onClose}><IX /></button>
      </div>
      <div className="rpt-preview-sf-wrap">
        <div className="rpt-preview-sf-scale"><SFDocument report={report} /></div>
      </div>
      <div className="rpt-preview-meta">
        {[["Document ID", report.docId], ["Submitted By", report.submittedBy], ["Date Submitted", report.dateSubmitted], ["File", report.fileName], ["Grade Level", report.gradeLevel], ["Section", report.section]].map(([label, value]) => (
          <div key={label} className="rpt-preview-meta-row">
            <span className="rpt-preview-meta-label">{label}</span>
            <span className="rpt-preview-meta-value">{value}</span>
          </div>
        ))}
        <div className="rpt-preview-meta-row">
          <span className="rpt-preview-meta-label">Status</span>
          <StatusBadge status={report.status} />
        </div>
      </div>
      {report.comment && (
        <div className="rpt-preview-comment">
          <div className="rpt-preview-comment-label">Comment</div>
          <div className="rpt-preview-comment-body">{report.comment}</div>
        </div>
      )}
      <div className="rpt-preview-actions">
        <button className="rpt-btn rpt-btn--outline-cancel" style={{ flex: 1 }} onClick={onView}><IEye /> Full View</button>
        {!["Approved","Disapproved"].includes(report.status) && (
          <button className="rpt-btn rpt-btn--primary" style={{ flex: 1 }} onClick={onEvaluate}><IEvaluate /> Evaluate</button>
        )}
      </div>
    </div>
  );
};

//VIEW FULL REPORT PAGE  (read-only for principal)

const ViewReportPage = ({ report, onBack, onEvaluate }) => {
  const sfInfo = SF_INFO[report.sfNumber] || SF_INFO[1];
  return (
    <div className="rpt-root">
      {/* ── role="principal" so Sidebar renders the principal nav ── */}
      <Sidebar role="principal" active="Reports and DepEd" />
      <main className="rpt-main">
        <Breadcrumb crumbs={[
          { label: "Reports and DepEd Compliance", onClick: onBack },
          { label: report.docId, onClick: onBack },
          { label: "Full View", green: true },
        ]} />
        <div className="rpt-section-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 13, borderBottom: "1px solid #e8ede8" }}>
            <div>
              <h3 className="rpt-section-card-title" style={{ marginBottom: 2 }}>{sfInfo.name} – {sfInfo.title}</h3>
              <div style={{ fontSize: 12, color: "#9aaa9a" }}>{sfInfo.desc}</div>
            </div>
            <StatusBadge status={report.status} />
          </div>
          <div className="rpt-doc-scroll"><SFDocument report={report} /></div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button className="rpt-btn rpt-btn--outline-cancel" onClick={onBack}><ICancel /> Close</button>
            {!["Approved","Disapproved"].includes(report.status) && (
              <button className="rpt-btn rpt-btn--primary" onClick={onEvaluate}><IEvaluate /> Evaluate Report</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

//EVALUATE PAGE  — PRINCIPAL VERSION

const EvaluatePage = ({ report, onBack, onDone }) => {
  const [comment,   setComment]   = useState(report.comment || "");
  const [modal,     setModal]     = useState(null);
  const [submitting,setSubmitting]= useState(false);
  const [evalError, setEvalError] = useState(null); // inline error shown inside modal

  const isFinal = ["approved", "disapproved", "rejected"].includes(
    (report.status || "").toLowerCase()
  );

  // Parse a human-readable message from the API error.
  const parseError = (err) => {
    const msg = err?.message ?? String(err);
    if (/already (approved|finalized|rejected)/i.test(msg))
      return "This report has already been finalized and cannot be changed.";
    if (/422|validation/i.test(msg))
      return "The server rejected the request. Please check the report status and try again.";
    if (/401|unauthorized/i.test(msg))
      return "Your session may have expired. Please refresh the page and log in again.";
    if (/403|forbidden/i.test(msg))
      return "You do not have permission to perform this action.";
    if (/network|fetch|timeout|abort/i.test(msg))
      return "Network error — please check your connection and try again.";
    return msg || "An unexpected error occurred. Please try again.";
  };

  const confirmAction = async () => {
    const status = modal === "approve" ? "Approved" : "Disapproved";
    setSubmitting(true);
    setEvalError(null);
    try {
      const updated = normalizeReport(
        await reportsService.evaluateReport(report.uuid, { action: modal, comment })
      );
      onDone(updated, false);
    } catch (err) {
      // Stay on the modal — show the specific error inline so the user
      // knows exactly what went wrong and can retry or cancel.
      setEvalError(parseError(err));
      setSubmitting(false);
      return;
    } finally {
      setSubmitting(false);
    }
    setModal(null);
  };

  return (
    <div className="rpt-root">
      {/* ── role="principal" so Sidebar renders the principal nav ── */}
      <Sidebar role="principal" active="Reports and DepEd" />
      <main className="rpt-main">
        <Breadcrumb crumbs={[
          { label: "Reports and DepEd Compliance", onClick: onBack },
          { label: report.docId, onClick: onBack },
          { label: "Evaluate", green: true },
        ]} />
        <div className="rpt-section-card" style={{ maxWidth: 780 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h3 className="rpt-section-card-title" style={{ margin: 0 }}>Evaluate Report</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#1a5c1a", borderRadius: 99, padding: "2px 10px", letterSpacing: "0.04em" }}>
              Principal's Review
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#9aaa9a", marginBottom: 20 }}>
            Your decision is final. Approved reports are recorded; disapproved reports are returned to the teacher.
          </p>

          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a5c1a", margin: "20px 0 14px" }}>Submitted Files</div>
          {(report.files || []).map(f => (
            <div key={f.name} className="rpt-file-row">
              <div className="rpt-file-left">
                <span className="rpt-file-name">{f.name}</span>
                <span className="rpt-file-meta" style={{ color: "#1a5c1a", fontWeight: 600 }}>Upload complete</span>
              </div>
              <IBadge />
            </div>
          ))}
          <hr style={{ border: "none", borderTop: "1px solid #f0f4f0", margin: "20px 0" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a5c1a", marginBottom: 14 }}>Principal's Decision</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5e4a" }}>Comments / Remarks</label>
            <textarea className="rpt-textarea"
              placeholder="Enter your evaluation remarks here…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
            />
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #f0f4f0", margin: "20px 0" }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button className="rpt-btn rpt-btn--outline-cancel" onClick={onBack}><ICancel /> Cancel</button>
            
        {report.status !== "Disapproved" && (
          <button
            className="rpt-btn rpt-btn--danger-ghost"
            disabled={isFinal}
            onClick={() => setModal("disapprove")}
          >
            <IDisapprove /> Disapprove
          </button>
        )}

        {report.status !== "Approved" && (
          <button
            className="rpt-btn rpt-btn--primary"
            disabled={isFinal}
            onClick={() => setModal("approve")}
          >
            <IApprove /> Approve
          </button>
        )}
          </div>
        </div>

        {modal && (
          <div className="rpt-modal-overlay">
            <div className="rpt-modal-box">
              <div className="rpt-modal-title">
                <IInfo />
                {modal === "approve" ? "Final Approval" : "Final Disapproval"}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9aaa9a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f0f4f0" }}>Report Details</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 16px" }}>
                  {[["File Name", report.fileName], ["Submitted On", report.submittedOn], ["Reviewed On", report.evaluatedOn]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: 10.5, color: "#9aaa9a", fontWeight: 500 }}>{l}</span>
                      <span style={{ fontSize: 13, background: "#f4f6f4", borderRadius: 6, padding: "7px 10px", color: "#111f11", fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9aaa9a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f0f4f0" }}>
                  Principal's Decision
                </div>
                <div style={{ marginBottom: 10 }}><StatusBadge status={modal === "approve" ? "Approved" : "Disapproved"} /></div>
                <label style={{ fontSize: 10.5, color: "#9aaa9a", fontWeight: 500, display: "block", marginBottom: 6 }}>Remarks</label>
                <div style={{ fontSize: 13, background: "#f4f6f4", borderRadius: 6, padding: "10px 12px", color: "#111f11", fontWeight: 500, lineHeight: 1.5 }}>
                  {comment || "No remarks provided."}
                </div>
              </div>
              {evalError && (
                <div style={{
                  background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,
                  padding:"10px 14px",marginBottom:14,
                  display:"flex",alignItems:"flex-start",gap:8,
                }}>
                  <span style={{color:"#dc2626",fontSize:16,lineHeight:1,flexShrink:0}}>⚠</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#dc2626",marginBottom:2}}>Action Failed</div>
                    <div style={{fontSize:12,color:"#7f1d1d",lineHeight:1.5}}>{evalError}</div>
                  </div>
                  <button
                    onClick={() => setEvalError(null)}
                    style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",
                      color:"#dc2626",fontSize:16,lineHeight:1,padding:0,flexShrink:0}}
                    aria-label="Dismiss error">
                    ×
                  </button>
                </div>
              )}
              <div className="rpt-modal-actions">
                <button className="rpt-btn rpt-btn--outline-cancel" onClick={() => { setModal(null); setEvalError(null); }} disabled={submitting}>
                  <ICancel /> Cancel
                </button>
                {modal === "approve"
                  ? <button className="rpt-btn rpt-btn--primary" onClick={confirmAction} disabled={submitting}>
                    {submitting ? <span className="rpt-spinner" style={{ width: 14, height: 14, borderTopColor: "#fff" }} /> : <IStamp />}
                    {submitting ? "Processing…" : "Confirm Final Approval"}
                  </button>
                  : <button className="rpt-btn rpt-btn--danger-ghost"
                    style={{ background: "#dc2626", color: "#fff", borderColor: "#dc2626" }}
                    onClick={confirmAction} disabled={submitting}>
                    {submitting ? <span className="rpt-spinner" style={{ width: 14, height: 14, borderTopColor: "#fff" }} /> : <IDisapprove />}
                    {submitting ? "Processing…" : "Confirm Disapproval"}
                  </button>
                }
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/**
 * Normalize a raw API report record to the shape the frontend expects.
 */
function normalizeReport(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    id:           raw.uuid  ?? raw.id,
    uuid:         raw.uuid  ?? raw.id,
    sfNumber:     raw.sfNumber != null
                    ? parseInt(raw.sfNumber)
                    : raw.form_type
                      ? parseInt(String(raw.form_type).replace("sf", ""))
                      : raw.sfNumber,
    status:       raw.status_label ?? raw.status,
    submittedBy:  raw.submittedBy
                    ?? raw.submitted_by?.name
                    ?? raw.submitted_by
                    ?? "—",
    fileName:     raw.fileName
                    ?? raw.original_filename
                    ?? raw.file?.original_filename,
    original_filename: raw.original_filename ?? raw.file?.original_filename,
    submittedOn:  raw.submittedOn  ?? raw.created_at,
    evaluatedOn:  raw.evaluatedOn  ?? raw.reviewed_at ?? "—",
    dateSubmitted: raw.dateSubmitted ?? raw.created_at,
    comment:      raw.comment  ?? raw.remarks,
    schoolYear:   raw.schoolYear  ?? raw.school_year,
    gradeLevel:   raw.gradeLevel  ?? raw.grade_level,
    section:      raw.section,
    month:        raw.month,
    docId:        raw.docId ?? raw.uuid,
    files:        raw.files ?? [],
  };
}

//MAIN LIST PAGE  — PRINCIPAL VERSION

export default function PrincipalReports() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sfFilter, setSfFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // FIX BUG-6: track server-supplied totalPages so pagination is accurate
  const [totalPagesFromServer, setTotalPagesFromServer] = useState(1);
  const [view, setView] = useState("list");
  const [activeReport, setActiveReport] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [apiStatus, setApiStatus] = useState("loading");
  const [apiMsg, setApiMsg] = useState("");
  const [tableLoading, setTableLoading] = useState(true);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3500);
  }, []);

  const fetchReports = useCallback(async () => {
    setTableLoading(true);
    setApiStatus("loading");
    setApiMsg("");
    try {
      await reportsService.healthCheck();
      const result = await reportsService.getReports({
        search,
        status: statusFilter !== "All" ? statusFilter : "",
        sf: sfFilter !== "All" ? sfFilter : "",
        page: currentPage,
        limit: PAGE_SIZE,
      });
      const raw = Array.isArray(result) ? result : (result.data || []);
      const data = raw.map(normalizeReport);
      const serverTotalPages = result.totalPages ?? result.last_page ?? Math.max(1, Math.ceil((result.total ?? data.length) / PAGE_SIZE));
      setReports(data);
      setTotalPagesFromServer(serverTotalPages);
      setApiStatus(data.length ? "connected" : "fallback");
      setApiMsg(data.length ? `${data.length} records loaded` : "No records found on server");
    } catch (err) {
      setApiStatus("error");
      setApiMsg("Unable to load reports — " + (err.message || "API not reachable"));
      setReports([]);
      setTotalPagesFromServer(1);
    } finally {
      setTableLoading(false);
    }
  }, [search, statusFilter, sfFilter, currentPage]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleSearchChange = (val) => { setSearch(val); setCurrentPage(1); };
  const handleStatusFilter = (val) => { setStatusFilter(val); setCurrentPage(1); };
  const handleSfFilter = (val) => { setSfFilter(val); setCurrentPage(1); };

  // FIX BUG-6: The server already applies search/status/sf filters and returns one
  // page of results. A second client-side .filter() on that subset would miss records
  // on other pages, causing "no results" when records exist on page 2+.
  // We use the API result directly; pagination is server-driven.
  const filtered = reports; // server-filtered; no client re-filter
  const totalPages = totalPagesFromServer;
  const safePage = Math.min(currentPage, totalPages);
  const paged = reports; // already one page from the server
  const allChecked = paged.length > 0 && paged.every(r => selected.includes(r.id));
  const someChecked = selected.length > 0 && !allChecked;
  const toggleAll = () => setSelected(allChecked ? [] : paged.map(r => r.id));
  const toggleOne = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  useEffect(() => {
    const validIds = new Set(reports.map(r => r.id));
    setSelected(prev => prev.filter(id => validIds.has(id)));
  }, [reports]);

  const handleDownload = async (report) => {
    try {
      // Route uses whereUuid — pass UUID. normalizeReport sets id = uuid.
      const blob = await reportsService.downloadReport(report.uuid ?? report.id);
      const url = URL.createObjectURL(blob);
      const filename = report.original_filename ?? report.fileName ?? "report";
      const a = document.createElement("a"); a.href = url; a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // FIX: defer revoke so the browser has time to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 150);
      showToast(`Downloaded ${filename}`);
    } catch {
      showToast(`Download failed — ${report.original_filename ?? report.fileName} not available from server`, "error");
    }
  };

  const pageNums = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pageNums.push(i); }
  else {
    pageNums.push(1);
    if (safePage > 3) pageNums.push("…");
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pageNums.push(i);
    if (safePage < totalPages - 2) pageNums.push("…");
    pageNums.push(totalPages);
  }

  if (view === "viewfull" && activeReport) return (
    <ViewReportPage
      report={activeReport}
      onBack={() => { setView("list"); setActiveReport(null); }}
      onEvaluate={() => setView("evaluate")}
    />
  );

  if (view === "evaluate" && activeReport) return (
    <EvaluatePage
      report={activeReport}
      onBack={() => { setView("list"); setActiveReport(null); }}
      onDone={(updated, isOffline) => {
        setReports(p => p.map(r => r.id === updated.id ? updated : r));
        if (previewReport?.id === updated.id) setPreviewReport(updated);
        setView("list");
        setActiveReport(null);
        showToast(
          isOffline
            ? `Report ${updated.status.toLowerCase()} locally (offline — will sync on refresh)`
            : `Report ${updated.status.toLowerCase()} successfully.`,
          isOffline ? "error" : "success"
        );
      }}
    />
  );

  const hasPreview = !!previewReport;

  return (
    <div className="rpt-root">
      {/* ── role="principal" so Sidebar renders the principal nav ── */}
      <Sidebar role="principal" active="Reports and DepEd" />
      <main className="rpt-main">

        <div className="rpt-page-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 className="rpt-page-title">Reports and DepEd Compliance</h1>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#1a5c1a", borderRadius: 99, padding: "3px 12px", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
              Principal
            </span>
          </div>
          <p className="rpt-page-sub">
            Review and evaluate SF reports submitted by teachers. Approve or disapprove reports as the final authority.
          </p>
        </div>

        <div className="rpt-toolbar">
          <div className="rpt-search-box">
            <ISearch />
            <input className="rpt-search-input" placeholder="Search by doc ID or teacher name…"
              value={search} onChange={e => handleSearchChange(e.target.value)} />
          </div>

          <div style={{ position: "relative" }}>
            <button className="rpt-btn rpt-btn--filter" onClick={() => setShowFilter(v => !v)}>
              <IFilter /> Filters
              {(statusFilter !== "All" || sfFilter !== "All") && (
                <span className="rpt-filter-badge">{(statusFilter !== "All" ? 1 : 0) + (sfFilter !== "All" ? 1 : 0)}</span>
              )}
            </button>
            {showFilter && (
              <div className="rpt-filter-dropdown">
                <div className="rpt-filter-group-label">Status</div>
                {["All", "For Admin Approval", "For Principal Approval", "Approved", "Disapproved"].map(s => (
                  <div key={s} className="rpt-filter-option" onClick={() => handleStatusFilter(s)}>
                    <div className="rpt-filter-check"
                      style={{ background: statusFilter === s ? "#1a5c1a" : "#fff", border: statusFilter === s ? "none" : "1.5px solid #d0d8d0" }}>
                      {statusFilter === s && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                    </div>
                    {s === "All" ? "All Statuses" : s}
                  </div>
                ))}
                <div className="rpt-filter-group-label" style={{ marginTop: 10 }}>SF Form</div>
                {["All", ...Array.from({ length: 10 }, (_, i) => String(i + 1))].map(s => (
                  <div key={s} className="rpt-filter-option" onClick={() => handleSfFilter(s)}>
                    <div className="rpt-filter-check"
                      style={{ background: sfFilter === s ? "#1a5c1a" : "#fff", border: sfFilter === s ? "none" : "1.5px solid #d0d8d0" }}>
                      {sfFilter === s && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                    </div>
                    {s === "All" ? "All Forms" : `SF${s}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="rpt-btn rpt-btn--filter" onClick={fetchReports} title="Refresh data from API">
            <IRefresh /> Refresh
          </button>

          {/* ── NO Submit button (admin-only) ── */}
          {/* ── NO bulk-delete button (admin-only) ── */}
        </div>

        <div className={`rpt-content-wrap${hasPreview ? " rpt-content-wrap--split" : ""}`}>
          <div className="rpt-table-card">
            <table className="rpt-table-full">
              <thead>
                <tr className="rpt-table-head-row">
                  <th className="rpt-th rpt-th--check">
                    <Checkbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll} />
                  </th>
                  {[["Doc ID", true], ["SF Form", false], ["Submitted By", true], ["Date Submitted", true], ["Status", false], ["Actions", false]].map(([lbl, sort]) => (
                    <th key={lbl} className="rpt-th">
                      {sort ? <span className="rpt-th-sort">{lbl} <ISort /></span> : lbl}
                    </th>
                  ))}
                </tr>
              </thead>

              {tableLoading ? (
                <SkeletonTable rows={PAGE_SIZE} />
              ) : (
                <tbody>
                  {paged.map(r => {
                    const sfInfo = SF_INFO[r.sfNumber] || SF_INFO[1];
                    const isPreviewActive = previewReport?.id === r.id;
                    return (
                      <tr key={r.id}
                        className={`rpt-table-row${isPreviewActive ? " rpt-table-row--active" : ""}`}
                        onClick={() => setPreviewReport(isPreviewActive ? null : r)}
                        style={{ cursor: "pointer" }}>

                        <td className="rpt-td rpt-td--check" onClick={e => e.stopPropagation()}>
                          <Checkbox checked={selected.includes(r.id)} onChange={() => toggleOne(r.id)} />
                        </td>
                        <td className="rpt-td">
                          <div style={{ fontWeight: 700, color: "#111f11", fontSize: 13 }}>{r.docId}</div>
                          <div style={{ fontSize: 11, color: "#9aaa9a", marginTop: 1 }}>{r.fileName}</div>
                        </td>
                        <td className="rpt-td">
                          <span className="rpt-sf-pill">{sfInfo.name}</span>
                          <div style={{ fontSize: 10, color: "#9aaa9a", marginTop: 3, maxWidth: 140, lineHeight: 1.3 }}>{sfInfo.title}</div>
                        </td>
                        <td className="rpt-td rpt-td--muted">{r.submittedBy}</td>
                        <td className="rpt-td rpt-td--muted">{r.dateSubmitted}</td>
                        <td className="rpt-td"><StatusBadge status={r.status} /></td>

                        <td className="rpt-td" onClick={e => e.stopPropagation()}>
                          <div className="rpt-actions">
                          {!["Approved","Disapproved"].includes(r.status) && (
                            <button className="rpt-action-btn rpt-action-btn--warn" title="Evaluate Report"
                              onClick={() => { setActiveReport(r); setView("evaluate"); }}>
                              <IEvaluate /> Evaluate
                            </button>
                          )}
                            <button className="rpt-action-btn rpt-action-btn--green" title="View Full Report"
                              onClick={() => { setActiveReport(r); setView("viewfull"); }}>
                              <IEye /> View
                            </button>
                            <button className="rpt-action-btn rpt-action-btn--primary" title="Download Report"
                              onClick={() => handleDownload(r)}>
                              <IDownload /> Download
                            </button>
                            {/* NO Archive button — admin-only */}
                            {/* NO Delete button  — admin-only */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paged.length === 0 && (
                    <tr><td colSpan={7} className="rpt-empty-row">No reports found.</td></tr>
                  )}
                </tbody>
              )}
            </table>

            <div className="rpt-pagination">
              <button className="rpt-page-btn rpt-page-btn--nav" disabled={safePage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><IChevL /> Previous</button>
              {pageNums.map((p, i) =>
                p === "…"
                  ? <span key={"e" + i} className="rpt-page-ellipsis">…</span>
                  : <button key={p} onClick={() => setCurrentPage(p)}
                    className={`rpt-page-btn${safePage === p ? " rpt-page-btn--active" : ""}`}>{p}</button>
              )}
              <button className="rpt-page-btn rpt-page-btn--nav" disabled={safePage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next <IChevR /></button>
            </div>
          </div>

          {hasPreview && (
            <PreviewPanel
              report={previewReport}
              loading={false}
              onClose={() => setPreviewReport(null)}
              onView={() => { setActiveReport(previewReport); setView("viewfull"); }}
              onEvaluate={() => { setActiveReport(previewReport); setView("evaluate"); }}
            />
          )}
        </div>
      </main>

      {/* ── No delete/archive confirm modals — principal cannot delete or archive ── */}

      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}