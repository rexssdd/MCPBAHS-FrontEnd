/**
 * src/pages/Teacher/Reports.jsx
 *
 * Teacher view of the Reports and DepEd Compliance page.
 *
 * Teacher capabilities:
 *  — Submit a new SF report (form with file upload)
 *  — Edit/resubmit a Disapproved or Pending report
 *  — Preview panel (read-only document view + metadata)
 *  — Download own submitted reports
 *  — NO evaluate / approve / disapprove (principal-only)
 *  — NO archive / delete (admin-only)
 *  — NO bulk-delete toolbar
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../../Components/Sidebar";
import "../../Css/Teacher/Report.css";
import reportsService from "../../services/teacher/reportService";
import { validateFileList, validateSchoolYearField, validateTextField } from "../../utils/inputValidation";

/* ══════════════════════════════════════════════════════════
   SF Form Metadata
══════════════════════════════════════════════════════════ */
const SF_INFO = {
  1:  { name:"SF1",  title:"School Register",                            desc:"Masterlist of all enrolled learners per section per school year." },
  2:  { name:"SF2",  title:"Daily Attendance Report",                    desc:"Daily attendance record of learners for a given month." },
  3:  { name:"SF3",  title:"Books Issued and Returned",                  desc:"Record of textbooks issued and returned by learners." },
  4:  { name:"SF4",  title:"Progress Report Card",                       desc:"Quarterly assessment and academic progress of each learner." },
  5:  { name:"SF5",  title:"Report on Promotion & Level of Proficiency", desc:"End-of-year promotion status and subject proficiency levels." },
  6:  { name:"SF6",  title:"Summarized Report on Promotion",             desc:"Section-level summary of promotion results per grade/section." },
  7:  { name:"SF7",  title:"Home Address & Health Card",                 desc:"Learner home address, parent info, and basic health profile." },
  8:  { name:"SF8",  title:"Learner's Nutrition Report",                 desc:"Nutritional status assessment of learners per quarter." },
  9:  { name:"SF9",  title:"Parent-Teacher Conference",                  desc:"Record of parent-teacher conferences and outcomes." },
  10: { name:"SF10", title:"Permanent Record / Cumulative Record",       desc:"Comprehensive permanent academic record of each learner." },
};

/* ══════════════════════════════════════════════════════════
   FALLBACK MOCK DATA  (used when API is unreachable)
══════════════════════════════════════════════════════════ */
const LEARNERS = [
  "Aguilar, Mark Casuela","Benedecto, Albert Juan","Garcia, Paul Sola",
  "Gunio, Berty Patas","Neri, Denise Rios","Reyes, Carlo Bautista",
  "Santos, Maria Cruz","Tan, Liza Garcia","Torres, Jenny Rivera",
  "Lim, Marco Mendoza","Ramos, Alvin Flores","Aquino, Bea Torres",
  "Cruz, Ana Dela","Villanueva, Rosa Mendoza","Bautista, Jose Reyes",
];

const MOCK_MY_REPORTS = Array.from({ length: 18 }, (_, i) => {
  const sfNum = (i % 10) + 1;
  const statuses = ["Pending","Approved","Disapproved","Pending","Approved"];
  const status = statuses[i % statuses.length];
  return {
    id:            String(200000 + i + 1),
    sfNumber:      sfNum,
    docId:         `SF${sfNum}-2025-${String(i + 1).padStart(3,"0")}`,
    submittedBy:   "John Jay Doe",
    dateSubmitted: `12/${String((i % 28) + 1).padStart(2,"0")}/25`,
    fileName:      `SF${sfNum}_submitted.pdf`,
    fileType:      i % 3 === 0 ? "xlsx" : "PDF",
    fileSize:      "8.77 MB",
    status,
    submittedOn:   "12/05/25",
    evaluatedOn:   status !== "Pending" ? "12/08/25" : "—",
    gradeLevel:    `Grade ${7 + (i % 6)}`,
    section:       ["Gemini","Orion","Lyra","Vega","Aquila"][i % 5],
    month:         ["January","February","March","April","May","June"][i % 6],
    schoolYear:    "2024-2025",
    comment:       status === "Disapproved"
      ? "The report contains missing data. Please resubmit with complete records."
      : "",
    files: [{ name:`SF${sfNum}_submitted.pdf`, status:"complete" }],
  };
});

const PAGE_SIZE = 10;

/* ══════════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════════ */
const ISearch   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b0bcb0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IFilter   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>;
const ISort     = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IChevL    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IChevR    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IBChev    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aaa9a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const ICancel   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const IInfo     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a5e4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const IClose    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IRefresh  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IPlus     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IEdit     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IEye      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IX        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IUpload   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
const ISend     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IFile     = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a5c1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IWifi     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
const IDatabase = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
const IWifiOff  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a11 11 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
const IAlert    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const ICheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

/* ══════════════════════════════════════════════════════════
   UI PRIMITIVES
══════════════════════════════════════════════════════════ */
const STATUS_MAP = {
  Approved:            { bg:"#f0fdf4", color:"#15803d", dot:"#22c55e", border:"#bbf7d0" },
  Disapproved:         { bg:"#fef2f2", color:"#dc2626", dot:"#ef4444", border:"#fecaca" },
  Pending:             { bg:"#fefce8", color:"#a16207", dot:"#eab308", border:"#fde68a" },
  "For Admin Approval":{ bg:"#eff6ff", color:"#1d4ed8", dot:"#3b82f6", border:"#bfdbfe" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.Pending;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,
      padding:"3px 10px",borderRadius:99,background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>
      {status}
    </span>
  );
};

const Toast = ({ message, type = "success" }) => {
  if (!message) return null;
  const bg = type === "error" ? "#dc2626" : "#1a5c1a";
  return (
    <div style={{
      position:"fixed",bottom:24,right:24,background:bg,color:"#fff",
      padding:"12px 20px",borderRadius:12,fontSize:14,fontWeight:600,zIndex:9999,
      boxShadow:`0 8px 24px ${bg}55`,fontFamily:"'DM Sans',sans-serif",
      display:"flex",alignItems:"center",gap:8,animation:"fadeInDown 0.2s ease",
    }}>
      {type === "error" ? "✕" : "✓"} {message}
    </div>
  );
};

const Breadcrumb = ({ crumbs }) => (
  <div className="rpt-breadcrumb">
    {crumbs.map((c, i) => (
      <span key={i} className="rpt-bc-item">
        {i > 0 && <IBChev />}
        {c.onClick
          ? <button className="rpt-breadcrumb-back" onClick={c.onClick}>{c.label}</button>
          : <span className={`rpt-bc-text${c.green?" rpt-bc-green":""}`}>{c.label}</span>}
      </span>
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════════
   API STATUS BAR
══════════════════════════════════════════════════════════ */
const ApiStatusBar = ({ status, message, onRetry }) => {
  const configs = {
    loading:   { cls:"rpt-api-status-bar--loading",   dotCls:"rpt-api-status-dot--loading",   icon:null,         label:"Connecting to API…" },
    connected: { cls:"rpt-api-status-bar--connected", dotCls:"rpt-api-status-dot--connected", icon:<IWifi/>,     label:"Live data from API" },
    error:     { cls:"rpt-api-status-bar--error",     dotCls:"rpt-api-status-dot--error",     icon:<IWifiOff/>,  label:"API unreachable" },
    fallback:  { cls:"rpt-api-status-bar--fallback",  dotCls:"rpt-api-status-dot--fallback",  icon:<IDatabase/>, label:"Showing default data" },
  };
  const cfg = configs[status] || configs.fallback;
  return (
    <div className={`rpt-api-status-bar ${cfg.cls}`}>
      <span className={`rpt-api-status-dot ${cfg.dotCls}`}/>
      {cfg.icon && <span style={{display:"flex",alignItems:"center"}}>{cfg.icon}</span>}
      <span className="rpt-api-status-label">
        <strong>{cfg.label}</strong>
        {message && <span style={{fontWeight:400,marginLeft:6}}>— {message}</span>}
      </span>
      {(status === "error" || status === "fallback") && (
        <button className="rpt-api-status-action" onClick={onRetry}><IRefresh /> Retry</button>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   SKELETON LOADERS
══════════════════════════════════════════════════════════ */
const SkeletonRow = () => (
  <tr className="rpt-skeleton-row">
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-text-lg" style={{width:"70%"}}/><div className="rpt-skeleton rpt-skeleton-text-sm" style={{width:"45%",marginTop:5}}/></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-pill"/><div className="rpt-skeleton rpt-skeleton-text-sm" style={{width:"80%",marginTop:5}}/></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-text-lg" style={{width:"65%"}}/></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-text-lg" style={{width:"55%"}}/></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-badge" style={{width:80}}/></td>
    <td className="rpt-td"><div style={{display:"flex",gap:6}}><div className="rpt-skeleton rpt-skeleton-btn" style={{width:60}}/><div className="rpt-skeleton rpt-skeleton-btn" style={{width:70}}/><div className="rpt-skeleton rpt-skeleton-btn" style={{width:86}}/></div></td>
  </tr>
);
const SkeletonTable = ({ rows = 8 }) => (
  <tbody>{Array.from({length:rows},(_,i)=><SkeletonRow key={i}/>)}</tbody>
);

/* ══════════════════════════════════════════════════════════
   SF DOCUMENT RENDERERS
══════════════════════════════════════════════════════════ */
const DocHeader = ({ sfNum, title, subtitle }) => (
  <div className="sf-doc-header">
    <div className="sf-header-left">
      <span className="sf-badge">SF{sfNum}</span>
      <div><div className="sf-doc-title">{title}</div>{subtitle&&<div className="sf-doc-subtitle">{subtitle}</div>}</div>
    </div>
    <div className="sf-deped">Dep<span style={{color:"#dc2626"}}>ED</span></div>
  </div>
);
const MetaRow = ({ items }) => (
  <div className="sf-meta-row">
    {items.map(([label,value])=>(
      <div key={label} className="sf-meta-item">
        <span className="sf-meta-label">{label}</span>
        <span className="sf-meta-value">{value}</span>
      </div>
    ))}
  </div>
);
const SUBJECTS = ["Filipino","English","Mathematics","Science","AP","ESP","MAPEH","TLE"];

const SF1View=({report})=>(<div className="sf-doc"><DocHeader sfNum={1} title="School Register" subtitle="This replaces Form 1 and BPS Form 1"/><MetaRow items={[["School ID","303203"],["Grade Level",report.gradeLevel],["Section",report.section],["School Year",report.schoolYear]]}/><MetaRow items={[["School Name","Paknaan National High School"],["District","Davao City"],["Division","Davao City"]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th" rowSpan={2} style={{width:28}}>No.</th><th className="sf-th" rowSpan={2} style={{minWidth:180}}>LEARNER'S NAME</th><th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" rowSpan={2}>Sex</th><th className="sf-th" rowSpan={2}>Date of Birth</th><th className="sf-th" rowSpan={2}>Age</th><th className="sf-th" colSpan={3}>Mother Tongue</th><th className="sf-th" rowSpan={2}>Religion</th><th className="sf-th" colSpan={2}>IP</th><th className="sf-th" rowSpan={2}>4Ps</th></tr><tr><th className="sf-th">Primary</th><th className="sf-th">Secondary</th><th className="sf-th">Other</th><th className="sf-th">Yes</th><th className="sf-th">No</th></tr></thead><tbody>{LEARNERS.slice(0,10).map((name,i)=>(<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200+i}</td><td className="sf-td sf-center">{i%2===0?"M":"F"}</td><td className="sf-td sf-center">0{i+1}/15/2009</td><td className="sf-td sf-center">15</td><td className="sf-td sf-center">Cebuano</td><td className="sf-td"/><td className="sf-td"/><td className="sf-td sf-center">Catholic</td><td className="sf-td sf-center">✓</td><td className="sf-td"/><td className="sf-td sf-center">{i%3===0?"✓":""}</td></tr>))}</tbody></table></div></div>);
const SF2View=({report})=>{const days=Array.from({length:31},(_,i)=>i+1);return(<div className="sf-doc"><DocHeader sfNum={2} title="Daily Attendance Report of Learners" subtitle="This replaced Form 1, Form 2 & STD Form 4"/><MetaRow items={[["School ID","303203"],["School Year",report.schoolYear],["Month",report.month]]}/><MetaRow items={[["School Name","Paknaan National High School"],["Grade Level",report.gradeLevel],["Section",report.section]]}/><div className="sf-table-wrap"><table className="sf-table sf-table--compact"><thead><tr><th className="sf-th" style={{minWidth:160}}>LEARNER'S NAME</th>{days.map(d=><th key={d} className="sf-th sf-day-th">{d}</th>)}<th className="sf-th">Total Absent</th><th className="sf-th">Remarks</th></tr></thead><tbody>{LEARNERS.slice(0,8).map((name,i)=>(<tr key={i} className="sf-tr"><td className="sf-td" style={{fontSize:9}}>{name}</td>{days.map(d=><td key={d} className="sf-td sf-day-td">{(i+d)%11===0?"A":""}</td>)}<td className="sf-td sf-center">{i}</td><td className="sf-td"/></tr>))}</tbody></table></div></div>);};
const SF3View=({report})=>(<div className="sf-doc"><DocHeader sfNum={3} title="Books Issued and Returned" subtitle="Record of Textbooks and Instructional Materials"/><MetaRow items={[["School ID","303203"],["Grade Level",report.gradeLevel],["Section",report.section],["School Year",report.schoolYear]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th" rowSpan={2}>No.</th><th className="sf-th" rowSpan={2}>LEARNER'S NAME</th><th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" colSpan={3}>ISSUED</th><th className="sf-th" colSpan={3}>RETURNED</th><th className="sf-th" rowSpan={2}>Condition</th></tr><tr><th className="sf-th">Book Title</th><th className="sf-th">Date</th><th className="sf-th">Condition</th><th className="sf-th">Book Title</th><th className="sf-th">Date</th><th className="sf-th">Condition</th></tr></thead><tbody>{LEARNERS.slice(0,10).map((name,i)=>(<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200+i}</td><td className="sf-td">Science 9 – LM</td><td className="sf-td sf-center">06/01/25</td><td className="sf-td sf-center">Good</td><td className="sf-td">{i%3===0?"Science 9 – LM":""}</td><td className="sf-td sf-center">{i%3===0?"10/15/25":""}</td><td className="sf-td sf-center">{i%3===0?"Good":""}</td><td className="sf-td sf-center">Good</td></tr>))}</tbody></table></div></div>);
const SF4View=({report})=>(<div className="sf-doc"><DocHeader sfNum={4} title="Progress Report Card (Learner)" subtitle="School Report Card"/><MetaRow items={[["School Year",report.schoolYear],["Grade Level",report.gradeLevel],["Section",report.section]]}/><div className="sf-info-grid">{[["Learner's Name","Aguilar, Mark Casuela"],["LRN","202001"],["Date of Birth","01/15/2009"],["Sex","Male"],["General Average","88.5"],["Remarks","Promoted"]].map(([l,v])=>(<div key={l} className="sf-info-cell"><span className="sf-info-label">{l}</span><span className="sf-info-val">{v}</span></div>))}</div><div className="sf-table-wrap" style={{marginTop:12}}><table className="sf-table"><thead><tr><th className="sf-th">Learning Area</th><th className="sf-th">Q1</th><th className="sf-th">Q2</th><th className="sf-th">Q3</th><th className="sf-th">Q4</th><th className="sf-th">Final Grade</th><th className="sf-th">Remarks</th></tr></thead><tbody>{SUBJECTS.map((s,i)=>{const grades=[85+i%5,87+i%4,86+i%6,88+i%3];const avg=Math.round(grades.reduce((a,b)=>a+b,0)/4);return(<tr key={s} className="sf-tr"><td className="sf-td">{s}</td>{grades.map((g,j)=><td key={j} className="sf-td sf-center">{g}</td>)}<td className="sf-td sf-center sf-grade-final">{avg}</td><td className="sf-td sf-center" style={{color:"#15803d",fontWeight:700}}>Passed</td></tr>);})}<tr className="sf-tr sf-tr--total"><td className="sf-td" style={{fontWeight:700}}>General Average</td><td className="sf-td sf-center" colSpan={4}/><td className="sf-td sf-center sf-grade-final">88</td><td className="sf-td sf-center" style={{color:"#15803d",fontWeight:700}}>Promoted</td></tr></tbody></table></div></div>);
const SF5View=({report})=>(<div className="sf-doc"><DocHeader sfNum={5} title="Report on Promotion & Level of Proficiency" subtitle="End-of-Year Report"/><MetaRow items={[["School Year",report.schoolYear],["Grade Level",report.gradeLevel],["Section",report.section],["School ID","303203"]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th" rowSpan={2}>No.</th><th className="sf-th" rowSpan={2}>LEARNER'S NAME</th><th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" colSpan={4}>QUARTERLY GRADES</th><th className="sf-th" rowSpan={2}>Gen. Avg.</th><th className="sf-th" rowSpan={2}>Remarks</th></tr><tr><th className="sf-th">Q1</th><th className="sf-th">Q2</th><th className="sf-th">Q3</th><th className="sf-th">Q4</th></tr></thead><tbody>{LEARNERS.slice(0,10).map((name,i)=>{const avg=82+i%10;return(<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200+i}</td>{[80+i%8,83+i%6,85+i%5,81+i%7].map((g,j)=><td key={j} className="sf-td sf-center">{g}</td>)}<td className="sf-td sf-center sf-grade-final">{avg}</td><td className="sf-td sf-center" style={{color:avg>=75?"#15803d":"#dc2626",fontWeight:700}}>{avg>=75?"Promoted":"Retained"}</td></tr>);})}</tbody></table></div></div>);
const SF6View=({report})=>(<div className="sf-doc"><DocHeader sfNum={6} title="Summarized Report on Promotion" subtitle="Summary per Grade Level"/><MetaRow items={[["School Year",report.schoolYear],["School Name","Paknaan National High School"],["School ID","303203"]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">Grade Level</th><th className="sf-th">Section</th><th className="sf-th">Total Enrolled</th><th className="sf-th">Male</th><th className="sf-th">Female</th><th className="sf-th">Promoted</th><th className="sf-th">Retained</th><th className="sf-th">Dropped</th><th className="sf-th">% Promoted</th></tr></thead><tbody>{[7,8,9,10,11,12].map((g,i)=>{const total=30+i*2,promoted=28+i,retained=1,dropped=total-promoted-retained;return(<tr key={g} className="sf-tr"><td className="sf-td">Grade {g}</td><td className="sf-td">Gemini</td><td className="sf-td sf-center">{total}</td><td className="sf-td sf-center">{Math.floor(total/2)}</td><td className="sf-td sf-center">{Math.ceil(total/2)}</td><td className="sf-td sf-center" style={{color:"#15803d",fontWeight:700}}>{promoted}</td><td className="sf-td sf-center" style={{color:"#dc2626"}}>{retained}</td><td className="sf-td sf-center" style={{color:"#a16207"}}>{dropped}</td><td className="sf-td sf-center">{((promoted/total)*100).toFixed(1)}%</td></tr>);})}</tbody></table></div></div>);
const SF7View=({report})=>(<div className="sf-doc"><DocHeader sfNum={7} title="Home Address & Health Card" subtitle="Learner Information Sheet"/><MetaRow items={[["Grade Level",report.gradeLevel],["Section",report.section],["School Year",report.schoolYear]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">No.</th><th className="sf-th" style={{minWidth:160}}>LEARNER'S NAME</th><th className="sf-th">LRN</th><th className="sf-th">Home Address</th><th className="sf-th">Parent/Guardian</th><th className="sf-th">Contact No.</th><th className="sf-th">Height (cm)</th><th className="sf-th">Weight (kg)</th><th className="sf-th">Blood Type</th><th className="sf-th">Medical Condition</th></tr></thead><tbody>{LEARNERS.slice(0,10).map((name,i)=>(<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200+i}</td><td className="sf-td" style={{fontSize:9}}>Brgy. {["Talomo","Matina","Buhangin"][i%3]}, Davao City</td><td className="sf-td" style={{fontSize:9}}>{name.split(",")[0]} Sr.</td><td className="sf-td sf-center" style={{fontSize:9}}>091{20000+i}</td><td className="sf-td sf-center">{150+i}</td><td className="sf-td sf-center">{45+i}</td><td className="sf-td sf-center">{["O+","A+","B+","AB+"][i%4]}</td><td className="sf-td sf-center">{i%5===0?"Asthma":"None"}</td></tr>))}</tbody></table></div></div>);
const SF8View=({report})=>(<div className="sf-doc"><DocHeader sfNum={8} title="Learner's Nutrition Report" subtitle="Nutritional Status of Learners"/><MetaRow items={[["School Year",report.schoolYear],["Grade Level",report.gradeLevel],["Section",report.section],["Quarter","Q1"]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th" rowSpan={2}>No.</th><th className="sf-th" rowSpan={2}>LEARNER'S NAME</th><th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" rowSpan={2}>Sex</th><th className="sf-th" rowSpan={2}>Age</th><th className="sf-th" colSpan={2}>BEG OF YEAR</th><th className="sf-th" colSpan={2}>END OF YEAR</th><th className="sf-th" rowSpan={2}>Nutritional Status</th></tr><tr><th className="sf-th">Ht(cm)</th><th className="sf-th">Wt(kg)</th><th className="sf-th">Ht(cm)</th><th className="sf-th">Wt(kg)</th></tr></thead><tbody>{LEARNERS.slice(0,10).map((name,i)=>{const statuses=["Normal","Stunted","Underweight","Normal","Obese"];const status=statuses[i%5];const colors={"Normal":"#15803d","Stunted":"#a16207","Underweight":"#dc2626","Obese":"#7c3aed"};return(<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200+i}</td><td className="sf-td sf-center">{i%2===0?"M":"F"}</td><td className="sf-td sf-center">15</td><td className="sf-td sf-center">{148+i}</td><td className="sf-td sf-center">{43+i}</td><td className="sf-td sf-center">{150+i}</td><td className="sf-td sf-center">{45+i}</td><td className="sf-td sf-center" style={{color:colors[status]||"#111",fontWeight:700}}>{status}</td></tr>);})}</tbody></table></div></div>);
const SF9View=({report})=>(<div className="sf-doc"><DocHeader sfNum={9} title="Parent-Teacher Conference Record" subtitle="Record of Meetings and Outcomes"/><MetaRow items={[["School Year",report.schoolYear],["Grade Level",report.gradeLevel],["Section",report.section]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">No.</th><th className="sf-th">LEARNER'S NAME</th><th className="sf-th">LRN</th><th className="sf-th">Date of Conference</th><th className="sf-th">Parent/Guardian Present</th><th className="sf-th">Concerns Raised</th><th className="sf-th">Actions Taken</th><th className="sf-th">Follow-up Date</th><th className="sf-th">Teacher Signature</th></tr></thead><tbody>{LEARNERS.slice(0,8).map((name,i)=>(<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200+i}</td><td className="sf-td sf-center">11/{String(i+1).padStart(2,"0")}/25</td><td className="sf-td">{name.split(",")[0]} Sr.</td><td className="sf-td" style={{fontSize:9}}>{["Academic performance","Attendance","Behavior","Grade concerns"][i%4]}</td><td className="sf-td" style={{fontSize:9}}>{["Advisory given","Referred to guidance","Monitored","Home visit"][i%4]}</td><td className="sf-td sf-center">12/{String(i+5).padStart(2,"0")}/25</td><td className="sf-td"/></tr>))}</tbody></table></div></div>);
const SF10View=({report})=>(<div className="sf-doc"><DocHeader sfNum={10} title="Permanent Record / Cumulative Record" subtitle="Comprehensive Learner Achievement Record"/><div className="sf-info-grid sf-info-grid--wide">{[["Learner's Name","Aguilar, Mark Casuela"],["LRN","202001"],["Date of Birth","01/15/2009"],["Sex","Male"],["Place of Birth","Davao City"],["Nationality","Filipino"],["Mother Tongue","Cebuano"],["Religion","Catholic"],["Home Address","Brgy. Talomo, Davao City"],["Parent/Guardian","Aguilar, Mark Sr."],["Contact No.","09123456789"],["Email","aguilar@example.com"]].map(([l,v])=>(<div key={l} className="sf-info-cell"><span className="sf-info-label">{l}</span><span className="sf-info-val">{v}</span></div>))}</div><div className="sf-section-sep">Academic Records</div><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">Grade Level</th><th className="sf-th">School Year</th>{SUBJECTS.map(s=><th key={s} className="sf-th" style={{fontSize:8,padding:"4px 3px"}}>{s}</th>)}<th className="sf-th">Gen. Avg.</th><th className="sf-th">Remarks</th></tr></thead><tbody>{[7,8,9,10].map((g,i)=>{const grades=SUBJECTS.map((_,j)=>80+j%8+i);const avg=Math.round(grades.reduce((a,b)=>a+b,0)/grades.length);return(<tr key={g} className="sf-tr"><td className="sf-td">Grade {g}</td><td className="sf-td sf-center">{2020+i}-{2021+i}</td>{grades.map((gr,j)=><td key={j} className="sf-td sf-center">{gr}</td>)}<td className="sf-td sf-center sf-grade-final">{avg}</td><td className="sf-td sf-center" style={{color:"#15803d",fontWeight:700}}>Promoted</td></tr>);})}</tbody></table></div></div>);

const SFDocument = ({ report }) => {
  const views = {1:SF1View,2:SF2View,3:SF3View,4:SF4View,5:SF5View,6:SF6View,7:SF7View,8:SF8View,9:SF9View,10:SF10View};
  const View = views[report.sfNumber] || SF1View;
  return <View report={report}/>;
};

/* ══════════════════════════════════════════════════════════
   SKELETON PREVIEW
══════════════════════════════════════════════════════════ */
const SkeletonPreviewPanel = () => (
  <div className="rpt-preview-panel">
    <div className="rpt-preview-panel-header">
      <div style={{flex:1}}>
        <div className="rpt-skeleton" style={{height:14,width:"55%",borderRadius:5,marginBottom:8}}/>
        <div className="rpt-skeleton" style={{height:10,width:"80%",borderRadius:4}}/>
      </div>
    </div>
    <div className="rpt-preview-sf-wrap"><div className="rpt-skeleton rpt-skeleton-preview-img" style={{width:"100%",height:"100%",borderRadius:0}}/></div>
    <div className="rpt-preview-meta">{Array.from({length:6},(_,i)=>(
      <div key={i} className="rpt-preview-meta-row"><div className="rpt-skeleton rpt-skeleton-meta-label"/><div className="rpt-skeleton rpt-skeleton-meta-value" style={{width:"50%"}}/></div>
    ))}</div>
    <div className="rpt-preview-actions">
      <div className="rpt-skeleton" style={{flex:1,height:36,borderRadius:10}}/>
      <div className="rpt-skeleton" style={{flex:1,height:36,borderRadius:10}}/>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════
   RIGHT PREVIEW PANEL  — Teacher version
══════════════════════════════════════════════════════════ */
const PreviewPanel = ({ report, loading, onClose, onView, onEdit }) => {
  if (loading) return <SkeletonPreviewPanel/>;
  if (!report) return null;
  const sfInfo = SF_INFO[report.sfNumber] || SF_INFO[1];
  const canEdit = report.status === "Pending" || report.status === "Disapproved" || report.status === "For Admin Approval";
  return (
    <div className="rpt-preview-panel">
      <div className="rpt-preview-panel-header">
        <div>
          <div className="rpt-preview-panel-title">{sfInfo.name} Preview</div>
          <div className="rpt-preview-panel-sub">{sfInfo.title}</div>
        </div>
        <button className="rpt-preview-close" onClick={onClose}><IX/></button>
      </div>

      {report.status === "Disapproved" && (
        <div style={{
          display:"flex",gap:8,alignItems:"flex-start",
          background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,
          padding:"10px 12px",margin:"0 0 2px 0",fontSize:12,color:"#dc2626",
        }}>
          <IAlert/>
          <div>
            <div style={{fontWeight:700,marginBottom:2}}>Disapproved — Action Required</div>
            <div style={{color:"#7f1d1d",lineHeight:1.5}}>{report.comment || "Please review and resubmit."}</div>
          </div>
        </div>
      )}

      <div className="rpt-preview-sf-wrap">
        <div className="rpt-preview-sf-scale"><SFDocument report={report}/></div>
      </div>

      <div className="rpt-preview-meta">
        {[
          ["Document ID", report.docId],
          ["Date Submitted", report.dateSubmitted],
          ["File", report.fileName],
          ["Grade Level", report.gradeLevel],
          ["Section", report.section],
          ["School Year", report.schoolYear],
        ].map(([label,value])=>(
          <div key={label} className="rpt-preview-meta-row">
            <span className="rpt-preview-meta-label">{label}</span>
            <span className="rpt-preview-meta-value">{value}</span>
          </div>
        ))}
        <div className="rpt-preview-meta-row">
          <span className="rpt-preview-meta-label">Status</span>
          <StatusBadge status={report.status}/>
        </div>
        {report.evaluatedOn !== "—" && (
          <div className="rpt-preview-meta-row">
            <span className="rpt-preview-meta-label">Evaluated On</span>
            <span className="rpt-preview-meta-value">{report.evaluatedOn}</span>
          </div>
        )}
      </div>

      <div className="rpt-preview-actions">
        <button className="rpt-btn rpt-btn--outline-cancel" style={{flex:1}} onClick={onView}>
          <IEye/> Full View
        </button>
        {canEdit && (
          <button className="rpt-btn rpt-btn--primary" style={{flex:1}} onClick={onEdit}>
            <IEdit/> {report.status === "Disapproved" ? "Resubmit" : "Edit"}
          </button>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   VIEW FULL REPORT PAGE  — read-only for teacher
══════════════════════════════════════════════════════════ */
const ViewReportPage = ({ report, onBack, onEdit }) => {
  const sfInfo = SF_INFO[report.sfNumber] || SF_INFO[1];
  const canEdit = report.status === "Pending" || report.status === "Disapproved" || report.status === "For Admin Approval";
  return (
    <div className="rpt-root">
      <Sidebar role="teacher" active="Reports and DepEd"/>
      <main className="rpt-main">
        <Breadcrumb crumbs={[
          {label:"My Submitted Reports", onClick:onBack},
          {label:report.docId, onClick:onBack},
          {label:"Full View", green:true},
        ]}/>
        <div className="rpt-section-card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,paddingBottom:13,borderBottom:"1px solid #e8ede8"}}>
            <div>
              <h3 className="rpt-section-card-title" style={{marginBottom:2}}>{sfInfo.name} – {sfInfo.title}</h3>
              <div style={{fontSize:12,color:"#9aaa9a"}}>{sfInfo.desc}</div>
            </div>
            <StatusBadge status={report.status}/>
          </div>

          {report.status === "Disapproved" && report.comment && (
            <div style={{
              display:"flex",gap:8,alignItems:"flex-start",
              background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,
              padding:"12px 14px",marginBottom:16,fontSize:12,color:"#dc2626",
            }}>
              <IAlert/>
              <div>
                <div style={{fontWeight:700,marginBottom:3}}>Principal's Remarks — Disapproved</div>
                <div style={{color:"#7f1d1d",lineHeight:1.5}}>{report.comment}</div>
              </div>
            </div>
          )}

          <div className="rpt-doc-scroll"><SFDocument report={report}/></div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}>
            <button className="rpt-btn rpt-btn--outline-cancel" onClick={onBack}><ICancel/> Close</button>
            {canEdit && (
              <button className="rpt-btn rpt-btn--primary" onClick={onEdit}>
                <IEdit/> {report.status === "Disapproved" ? "Resubmit Report" : "Edit Report"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   SUBMIT / EDIT REPORT PAGE  — Teacher only
   Used for both new submissions and edits/resubmissions
══════════════════════════════════════════════════════════ */
const SubmitReportPage = ({ report, onBack, onDone, showToast }) => {
  const isEdit     = !!report;
  const isResubmit = isEdit && report.status === "Disapproved";

  const [form, setForm] = useState({
    sfNumber:   isEdit ? String(report.sfNumber) : "1",
    gradeLevel: isEdit ? report.gradeLevel : "Grade 7",
    section:    isEdit ? report.section : "Gemini",
    month:      isEdit ? report.month : "January",
    schoolYear: isEdit ? report.schoolYear : "2024-2025",
    notes:      isEdit ? (report.notes || "") : "",
  });
  const [files,       setFiles]       = useState(isEdit ? report.files : []);
  const [dragOver,    setDragOver]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors,      setErrors]      = useState({});
  const fileInputRef = useRef();

  const set = (key, val) => {
    setForm(f => ({...f, [key]:val}));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleFiles = (fileList) => {
    const fileError = validateFileList(fileList, {
      maxSizeMb: 20,
      allowedExtensions: [ "xls", "xlsx", "csv"],
      label: "Report file",
    });
    if (fileError) {
      setErrors(prev => ({ ...prev, files: fileError }));
      return;
    }
    const newFiles = Array.from(fileList).map(f => ({
      name:  f.name,
      status:"complete",
      size:  (f.size / 1024 / 1024).toFixed(2) + " MB",
      _file: f,          // keep the raw File for the service call
    }));
    setErrors(prev => ({ ...prev, files: undefined }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (idx) => setFiles(f => f.filter((_,i) => i !== idx));

  /* ── REAL API CALL ── */
  const handleSubmit = async () => {
    setSubmitting(true);

    // Extract raw File objects for multipart upload.
    // Files that came from an existing report (no ._file) are skipped —
    // the server already has them and only new uploads are re-sent.
    const rawFiles = files.map(f => f._file).filter(Boolean);

    try {
      let savedReport;

      if (isEdit) {
        // Edit OR Resubmit — PATCH /reports/:id
        savedReport = await reportsService.updateReport(report.id, {
          sfNumber:   parseInt(form.sfNumber),
          gradeLevel: form.gradeLevel,
          section:    form.section,
          month:      form.month,
          schoolYear: form.schoolYear,
          notes:      form.notes,
          files:      rawFiles,
        });
      } else {
        // New submission — POST /reports
        savedReport = await reportsService.submitReport({
          sfNumber:   parseInt(form.sfNumber),
          gradeLevel: form.gradeLevel,
          section:    form.section,
          month:      form.month,
          schoolYear: form.schoolYear,
          notes:      form.notes,
          files:      rawFiles,
        });
      }

      setSubmitting(false);
      setConfirmOpen(false);
      onDone(normalizeReport(savedReport), isEdit);

    } catch (err) {
      setSubmitting(false);
      setConfirmOpen(false);
      showToast(err.message || "Something went wrong. Please try again.", "error");
    }
  };

  const sfInfo = SF_INFO[parseInt(form.sfNumber)] || SF_INFO[1];

  const validateReport = () => {
    const nextErrors = {};
    const yearError = validateSchoolYearField(form.schoolYear);
    const sectionError = validateTextField(form.section, "Section", { min: 2, max: 40 });
    const notesError = validateTextField(form.notes, "Notes", { required: false, max: 500 });
    if (yearError) nextErrors.schoolYear = yearError;
    if (sectionError) nextErrors.section = sectionError;
    if (notesError) nextErrors.notes = notesError;
    if (files.length === 0) nextErrors.files = "At least one report file is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <div className="rpt-root">
      <Sidebar role="teacher" active="Reports and DepEd"/>
      <main className="rpt-main">
        <Breadcrumb crumbs={[
          {label:"My Submitted Reports", onClick:onBack},
          {label: isEdit ? report.docId : "New Report", onClick: isEdit ? onBack : undefined},
          {label: isResubmit ? "Resubmit" : isEdit ? "Edit" : "Submit", green:true},
        ]}/>

        <div className="rpt-section-card" style={{maxWidth:820}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <h3 className="rpt-section-card-title" style={{margin:0}}>
              {isResubmit ? "Resubmit Report" : isEdit ? "Edit Report" : "Submit a Report"}
            </h3>
            <span style={{fontSize:11,fontWeight:700,color:"#fff",background:"#1a5c1a",borderRadius:99,padding:"2px 10px",letterSpacing:"0.04em"}}>
              Teacher
            </span>
          </div>
          <p style={{fontSize:12,color:"#9aaa9a",marginBottom:20}}>
            {isResubmit
              ? "This report was disapproved. Please address the remarks below, update the necessary fields, and resubmit."
              : isEdit
              ? "Update the details below and re-upload files if needed."
              : "Fill out the form and upload the required SF document files to submit to the principal for review."}
          </p>

          {isResubmit && report.comment && (
            <div style={{
              display:"flex",gap:8,alignItems:"flex-start",
              background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,
              padding:"12px 14px",marginBottom:20,fontSize:12,color:"#dc2626",
            }}>
              <IAlert/>
              <div>
                <div style={{fontWeight:700,marginBottom:3}}>Principal's Remarks</div>
                <div style={{color:"#7f1d1d",lineHeight:1.5}}>{report.comment}</div>
              </div>
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px 20px",marginBottom:20}}>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <label style={{fontSize:12,fontWeight:700,color:"#4a5e4a"}}>SF Form <span style={{color:"#dc2626"}}>*</span></label>
              <select className="rpt-textarea" style={{padding:"10px 12px",height:"auto",fontFamily:"inherit",fontSize:13}}
                value={form.sfNumber} onChange={e=>set("sfNumber",e.target.value)}>
                {Object.entries(SF_INFO).map(([num,info])=>(
                  <option key={num} value={num}>{info.name} — {info.title}</option>
                ))}
              </select>
              <span style={{fontSize:11,color:"#9aaa9a"}}>{sfInfo.desc}</span>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <label style={{fontSize:12,fontWeight:700,color:"#4a5e4a"}}>School Year <span style={{color:"#dc2626"}}>*</span></label>
              <select className="rpt-textarea" style={{padding:"10px 12px",height:"auto",fontFamily:"inherit",fontSize:13}}
                value={form.schoolYear} onChange={e=>set("schoolYear",e.target.value)}>
                {["2022-2023","2023-2024","2024-2025","2025-2026"].map(y=>(
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {errors.schoolYear && <span style={{fontSize:11.5,color:"#dc2626",fontWeight:600}}>{errors.schoolYear}</span>}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <label style={{fontSize:12,fontWeight:700,color:"#4a5e4a"}}>Grade Level <span style={{color:"#dc2626"}}>*</span></label>
              <select className="rpt-textarea" style={{padding:"10px 12px",height:"auto",fontFamily:"inherit",fontSize:13}}
                value={form.gradeLevel} onChange={e=>set("gradeLevel",e.target.value)}>
                {[7,8,9,10,11,12].map(g=>(
                  <option key={g} value={`Grade ${g}`}>Grade {g}</option>
                ))}
              </select>
              {errors.section && <span style={{fontSize:11.5,color:"#dc2626",fontWeight:600}}>{errors.section}</span>}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <label style={{fontSize:12,fontWeight:700,color:"#4a5e4a"}}>Section <span style={{color:"#dc2626"}}>*</span></label>
              <select className="rpt-textarea" style={{padding:"10px 12px",height:"auto",fontFamily:"inherit",fontSize:13}}
                value={form.section} onChange={e=>set("section",e.target.value)}>
                {["Gemini","Orion","Lyra","Vega","Aquila"].map(s=>(
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {form.sfNumber === "2" && (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:12,fontWeight:700,color:"#4a5e4a"}}>Month <span style={{color:"#dc2626"}}>*</span></label>
                <select className="rpt-textarea" style={{padding:"10px 12px",height:"auto",fontFamily:"inherit",fontSize:13}}
                  value={form.month} onChange={e=>set("month",e.target.value)}>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m=>(
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:700,color:"#4a5e4a"}}>Notes / Remarks (optional)</label>
            <textarea className="rpt-textarea"
              placeholder="Any additional notes for the principal…"
              value={form.notes}
              onChange={e=>set("notes",e.target.value)}
              rows={3}
            />
            {errors.notes && <span style={{fontSize:11.5,color:"#dc2626",fontWeight:600}}>{errors.notes}</span>}
          </div>

          <div style={{fontSize:13,fontWeight:700,color:"#1a5c1a",marginBottom:10}}>
            Upload Files <span style={{fontWeight:400,fontSize:11,color:"#9aaa9a"}}>(Excel only is accepted)</span>
          </div>

          <div
            className={`rpt-dropzone${dragOver?" rpt-dropzone--active":""}`}
            style={{
              border:`2px dashed ${dragOver?"#1a5c1a":"#c8d8c8"}`,
              borderRadius:14,padding:"28px 20px",textAlign:"center",
              background:dragOver?"#f0fdf4":"#f8fbf8",
              cursor:"pointer",transition:"all 0.15s ease",marginBottom:14,
            }}
            onClick={()=>fileInputRef.current?.click()}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFiles(e.dataTransfer.files);}}
          >
            <IUpload/>
            <div style={{marginTop:8,fontSize:13,fontWeight:600,color:"#4a5e4a"}}>
              {dragOver ? "Release to upload" : "Drag & drop files here"}
            </div>
            <div style={{fontSize:11,color:"#9aaa9a",marginTop:4}}>or click to browse — Excel only, up to 20 MB</div>
            <input ref={fileInputRef} type="file" multiple accept=".xlsx,.xls,.csv,.pdf,.docx"
              style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
          </div>
          {errors.files && <p style={{fontSize:12,color:"#dc2626",fontWeight:600,marginTop:-6,marginBottom:12}}>{errors.files}</p>}

          {files.length > 0 && (
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
              {files.map((f,i)=>(
                <div key={i} className="rpt-file-row" style={{justifyContent:"space-between"}}>
                  <div className="rpt-file-left" style={{gap:10}}>
                    <IFile/>
                    <div>
                      <div className="rpt-file-name">{f.name}</div>
                      {f.size && <div className="rpt-file-meta">{f.size}</div>}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:11,color:"#15803d",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                      <ICheck/> Ready
                    </span>
                    <button onClick={()=>removeFile(i)}
                      style={{background:"none",border:"none",cursor:"pointer",color:"#9aaa9a",display:"flex",alignItems:"center",padding:4}}>
                      <IX/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <hr style={{border:"none",borderTop:"1px solid #f0f4f0",margin:"6px 0 20px"}}/>

          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <button className="rpt-btn rpt-btn--outline-cancel" onClick={onBack}><ICancel/> Cancel</button>
            <button className="rpt-btn rpt-btn--primary" onClick={() => {
              if (validateReport()) setConfirmOpen(true);
            }}
              disabled={files.length === 0}>
              <ISend/> {isResubmit ? "Resubmit Report" : isEdit ? "Save Changes" : "Submit Report"}
            </button>
          </div>
        </div>

        {confirmOpen && (
          <div className="rpt-modal-overlay">
            <div className="rpt-modal-box">
              <div className="rpt-modal-title">
                <IInfo/>
                {isResubmit ? "Confirm Resubmission" : isEdit ? "Confirm Changes" : "Confirm Submission"}
              </div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"#9aaa9a",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10,paddingBottom:8,borderBottom:"1px solid #f0f4f0"}}>
                  Submission Details
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 16px"}}>
                  {[
                    ["SF Form",    sfInfo.name],
                    ["Grade Level",form.gradeLevel],
                    ["Section",    form.section],
                    ["School Year",form.schoolYear],
                    ["Files",      `${files.length} file(s)`],
                    ["Submitted By","John Jay Doe"],
                  ].map(([l,v])=>(
                    <div key={l} style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:10.5,color:"#9aaa9a",fontWeight:500}}>{l}</span>
                      <span style={{fontSize:13,background:"#f4f6f4",borderRadius:6,padding:"7px 10px",color:"#111f11",fontWeight:500}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{fontSize:12,color:"#9aaa9a",marginBottom:16}}>
                Once submitted, this report will be sent to the principal for review.
                {isResubmit && " Your previous submission will be replaced."}
              </p>
              <div className="rpt-modal-actions">
                <button className="rpt-btn rpt-btn--outline-cancel" onClick={()=>setConfirmOpen(false)} disabled={submitting}>
                  <ICancel/> Cancel
                </button>
                <button className="rpt-btn rpt-btn--primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting
                    ? <><span className="rpt-spinner" style={{width:14,height:14,borderTopColor:"#fff"}}/> Submitting…</>
                    : <><ISend/> {isResubmit ? "Confirm Resubmission" : isEdit ? "Confirm Changes" : "Confirm Submission"}</>
                  }
                </button>
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
    status:       raw.status_label != null
                    ? raw.status_label
                    : raw.status === "for_admin_approval"
                      ? "For Admin Approval"
                      : raw.status,
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

/* ══════════════════════════════════════════════════════════
   MAIN LIST PAGE  — TEACHER VERSION
══════════════════════════════════════════════════════════ */
export default function TeacherReports() {
  const [reports,       setReports]       = useState([]);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("All");
  const [sfFilter,      setSfFilter]      = useState("All");
  const [showFilter,    setShowFilter]    = useState(false);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [view,          setView]          = useState("list"); // "list" | "viewfull" | "submit" | "edit"
  const [activeReport,  setActiveReport]  = useState(null);
  const [previewReport, setPreviewReport] = useState(null);
  const [toast,         setToast]         = useState({ message:"", type:"success" });
  const [apiStatus,     setApiStatus]     = useState("loading");
  const [apiMsg,        setApiMsg]        = useState("");
  const [tableLoading,  setTableLoading]  = useState(true);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message:"", type:"success" }), 3500);
  }, []);

  /* ── FETCH REPORTS from API ── */
  const fetchReports = useCallback(async () => {
    setTableLoading(true);
    setApiStatus("loading");

    try {
      // 1. Health check — sets the status bar
      await reportsService.healthCheck();
      setApiStatus("connected");
      setApiMsg("Showing your submitted reports");
    } catch {
      setApiStatus("error");
      setApiMsg("Could not reach the server");
      // Fall back to mock data so the UI stays usable
      setReports(MOCK_MY_REPORTS);
      setTotalPages(Math.ceil(MOCK_MY_REPORTS.length / PAGE_SIZE));
      setTableLoading(false);
      return;
    }

    try {
      // 2. Load the teacher's own reports with current filters
      const result = await reportsService.getMyReports({
        search:  search  || undefined,
        status:  statusFilter !== "All" ? statusFilter : undefined,
        sf:      sfFilter     !== "All" ? sfFilter     : undefined,
        page:    currentPage,
        limit:   PAGE_SIZE,
      });

      setReports((result.data ?? []).map(normalizeReport));
      setTotalPages(result.totalPages ?? 1);
    } catch (err) {
      // API reachable but request failed — fall back to mock
      setApiStatus("fallback");
      setApiMsg(err.message || "Using default data");
      setReports(MOCK_MY_REPORTS);
      setTotalPages(Math.ceil(MOCK_MY_REPORTS.length / PAGE_SIZE));
    } finally {
      setTableLoading(false);
    }
  }, [search, statusFilter, sfFilter, currentPage]);

  // Re-fetch whenever filters or page change
  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleSearchChange = (val) => { setSearch(val);       setCurrentPage(1); };
  const handleStatusFilter = (val) => { setStatusFilter(val); setCurrentPage(1); };
  const handleSfFilter     = (val) => { setSfFilter(val);     setCurrentPage(1); };

  // Client-side slice only used when the API fell back to mock data
  // (when live, the server returns the correct page already)
  const safePage = Math.min(currentPage, totalPages);
  const paged    = apiStatus === "fallback" || apiStatus === "error"
    ? reports
        .filter(r => {
          const q = search.toLowerCase();
          return (r.docId?.toLowerCase().includes(q) || r.gradeLevel?.toLowerCase().includes(q) || r.section?.toLowerCase().includes(q))
            && (statusFilter === "All" || r.status === statusFilter)
            && (sfFilter === "All" || r.sfNumber === parseInt(sfFilter));
        })
        .slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    : reports; // server already paginated

  /* ── DOWNLOAD ── */
  const handleDownload = async (report) => {
    showToast(`Downloading ${report.fileName}…`);
    try {
      const blob = await reportsService.downloadReport(report.id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = report.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // FIX: defer revoke so the browser has time to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 150);
      showToast(`Downloaded ${report.fileName}`);
    } catch (err) {
      showToast(err.message || `Failed to download ${report.fileName}`, "error");
    }
  };

  // Pagination buttons
  const pageNums = [];
  if (totalPages <= 7) { for(let i=1;i<=totalPages;i++) pageNums.push(i); }
  else {
    pageNums.push(1);
    if (safePage > 3) pageNums.push("…");
    for(let i=Math.max(2,safePage-1); i<=Math.min(totalPages-1,safePage+1); i++) pageNums.push(i);
    if (safePage < totalPages-2) pageNums.push("…");
    pageNums.push(totalPages);
  }

  // Summary counts — computed from whatever is currently loaded
  const counts = { Pending:0, Approved:0, Disapproved:0 };
  reports.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  /* ── VIEW ROUTING ── */
  if (view === "submit") return (
    <SubmitReportPage
      report={null}
      showToast={showToast}
      onBack={() => setView("list")}
      onDone={(newReport) => {
        setReports(p => [newReport, ...p]);
        setView("list");
        showToast("Report submitted successfully! Awaiting principal review.");
      }}
    />
  );

  if (view === "edit" && activeReport) return (
    <SubmitReportPage
      report={activeReport}
      showToast={showToast}
      onBack={() => { setView("list"); setActiveReport(null); }}
      onDone={(updated) => {
        setReports(p => p.map(r => r.id === updated.id ? updated : r));
        if (previewReport?.id === updated.id) setPreviewReport(updated);
        setView("list");
        setActiveReport(null);
        showToast(
          activeReport.status === "Disapproved"
            ? "Report resubmitted! Awaiting principal review."
            : "Report updated successfully."
        );
      }}
    />
  );

  if (view === "viewfull" && activeReport) return (
    <ViewReportPage
      report={activeReport}
      onBack={() => { setView("list"); setActiveReport(null); }}
      onEdit={() => setView("edit")}
    />
  );

  const hasPreview = !!previewReport;

  return (
    <div className="rpt-root">
      <Sidebar role="teacher" active="Reports and DepEd"/>
      <main className="rpt-main">

        <div className="rpt-page-header">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <h1 className="rpt-page-title">My Submitted Reports</h1>
            <span style={{fontSize:11,fontWeight:700,color:"#fff",background:"#1a5c1a",borderRadius:99,padding:"3px 12px",letterSpacing:"0.04em",whiteSpace:"nowrap"}}>
              Teacher
            </span>
          </div>
          <p className="rpt-page-sub">
            Submit and manage your SF reports for principal review. Edit or resubmit disapproved reports.
          </p>
        </div>

        {/* Summary cards */}
        <div style={{display:"flex",gap:12,marginBottom:18}}>
          {[
            {label:"Total Submitted", value:reports.length, color:"#1a5c1a", bg:"#f0fdf4", border:"#bbf7d0"},
            {label:"Pending Review",  value:counts.Pending,     color:"#a16207", bg:"#fefce8", border:"#fde68a"},
            {label:"Approved",        value:counts.Approved,    color:"#15803d", bg:"#f0fdf4", border:"#bbf7d0"},
            {label:"Needs Resubmit",  value:counts.Disapproved, color:"#dc2626", bg:"#fef2f2", border:"#fecaca"},
          ].map(card=>(
            <div key={card.label} style={{
              flex:1,background:card.bg,border:`1px solid ${card.border}`,
              borderRadius:14,padding:"14px 18px",minWidth:0,
            }}>
              <div style={{fontSize:22,fontWeight:800,color:card.color,lineHeight:1}}>{card.value}</div>
              <div style={{fontSize:11,color:"#6b7a6b",fontWeight:600,marginTop:4}}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* API status bar — retry calls fetchReports */}
   
        <div className="rpt-toolbar">
          <div className="rpt-search-box">
            <ISearch/>
            <input className="rpt-search-input" placeholder="Search by doc ID, grade level, or section…"
              value={search} onChange={e=>handleSearchChange(e.target.value)}/>
          </div>

          <div style={{position:"relative"}}>
            <button className="rpt-btn rpt-btn--filter" onClick={()=>setShowFilter(v=>!v)}>
              <IFilter/> Filters
              {(statusFilter!=="All"||sfFilter!=="All") && (
                <span className="rpt-filter-badge">{(statusFilter!=="All"?1:0)+(sfFilter!=="All"?1:0)}</span>
              )}
            </button>
            {showFilter && (
              <div className="rpt-filter-dropdown">
                <div className="rpt-filter-group-label">Status</div>
                {["All","Pending","Approved","Disapproved","For Admin Approval"].map(s=>(
                  <div key={s} className="rpt-filter-option" onClick={()=>handleStatusFilter(s)}>
                    <div className="rpt-filter-check"
                      style={{background:statusFilter===s?"#1a5c1a":"#fff",border:statusFilter===s?"none":"1.5px solid #d0d8d0"}}>
                      {statusFilter===s&&<span style={{color:"#fff",fontSize:10}}>✓</span>}
                    </div>
                    {s==="All"?"All Statuses":s}
                  </div>
                ))}
                <div className="rpt-filter-group-label" style={{marginTop:10}}>SF Form</div>
                {["All",...Array.from({length:10},(_,i)=>String(i+1))].map(s=>(
                  <div key={s} className="rpt-filter-option" onClick={()=>handleSfFilter(s)}>
                    <div className="rpt-filter-check"
                      style={{background:sfFilter===s?"#1a5c1a":"#fff",border:sfFilter===s?"none":"1.5px solid #d0d8d0"}}>
                      {sfFilter===s&&<span style={{color:"#fff",fontSize:10}}>✓</span>}
                    </div>
                    {s==="All"?"All Forms":`SF${s}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="rpt-btn rpt-btn--primary" onClick={() => setView("submit")}>
            <IPlus/> Submit Report
          </button>
        </div>

        <div className={`rpt-content-wrap${hasPreview?" rpt-content-wrap--split":""}`}>
          <div className="rpt-table-card">
            <table className="rpt-table-full">
              <thead>
                <tr className="rpt-table-head-row">
                  {[["Doc ID",true],["SF Form",false],["Grade & Section",true],["Date Submitted",true],["Status",false],["Actions",false]].map(([lbl,sort])=>(
                    <th key={lbl} className="rpt-th">
                      {sort ? <span className="rpt-th-sort">{lbl} <ISort/></span> : lbl}
                    </th>
                  ))}
                </tr>
              </thead>

              {tableLoading ? (
                <SkeletonTable rows={PAGE_SIZE}/>
              ) : (
                <tbody>
                  {paged.map(r => {
                    const sfInfo = SF_INFO[r.sfNumber] || SF_INFO[1];
                    const isPreviewActive = previewReport?.id === r.id;
                    const canEdit = r.status === "Pending" || r.status === "Disapproved" || r.status === "For Admin Approval";
                    return (
                      <tr key={r.id}
                        className={`rpt-table-row${isPreviewActive?" rpt-table-row--active":""}`}
                        onClick={() => setPreviewReport(isPreviewActive ? null : r)}
                        style={{cursor:"pointer"}}>

                        <td className="rpt-td">
                          <div style={{fontWeight:700,color:"#111f11",fontSize:13,display:"flex",alignItems:"center",gap:6}}>
                            {r.docId}
                            {r.status === "Disapproved" && (
                              <span title="Action required" style={{color:"#dc2626",display:"flex"}}><IAlert/></span>
                            )}
                          </div>
                          <div style={{fontSize:11,color:"#9aaa9a",marginTop:1}}>{r.fileName}</div>
                        </td>
                        <td className="rpt-td">
                          <span className="rpt-sf-pill">{sfInfo.name}</span>
                          <div style={{fontSize:10,color:"#9aaa9a",marginTop:3,maxWidth:140,lineHeight:1.3}}>{sfInfo.title}</div>
                        </td>
                        <td className="rpt-td rpt-td--muted">
                          <div>{r.gradeLevel}</div>
                          <div style={{fontSize:11,color:"#b0bcb0"}}>{r.section}</div>
                        </td>
                        <td className="rpt-td rpt-td--muted">{r.dateSubmitted}</td>
                        <td className="rpt-td"><StatusBadge status={r.status}/></td>

                        <td className="rpt-td" onClick={e=>e.stopPropagation()}>
                          <div className="rpt-actions">
                            {canEdit && (
                              <button className="rpt-action-btn rpt-action-btn--warn"
                                title={r.status==="Disapproved"?"Resubmit Report":"Edit Report"}
                                onClick={()=>{ setActiveReport(r); setView("edit"); }}>
                                <IEdit/> {r.status === "Disapproved" ? "Resubmit" : "Edit"}
                              </button>
                            )}
                            <button className="rpt-action-btn rpt-action-btn--green" title="View Full Report"
                              onClick={()=>{ setActiveReport(r); setView("viewfull"); }}>
                              <IEye/> View
                            </button>
                            <button className="rpt-action-btn rpt-action-btn--primary" title="Download Report"
                              onClick={()=>handleDownload(r)}>
                              <IDownload/> Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paged.length === 0 && (
                    <tr><td colSpan={6} className="rpt-empty-row">No reports found. Submit your first report!</td></tr>
                  )}
                </tbody>
              )}
            </table>

            <div className="rpt-pagination">
              <button className="rpt-page-btn rpt-page-btn--nav" disabled={safePage===1}
                onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}><IChevL/> Previous</button>
              {pageNums.map((p,i)=>
                p==="…"
                  ? <span key={"e"+i} className="rpt-page-ellipsis">…</span>
                  : <button key={p} onClick={()=>setCurrentPage(p)}
                      className={`rpt-page-btn${safePage===p?" rpt-page-btn--active":""}`}>{p}</button>
              )}
              <button className="rpt-page-btn rpt-page-btn--nav" disabled={safePage===totalPages}
                onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}>Next <IChevR/></button>
            </div>
          </div>

          {hasPreview && (
            <PreviewPanel
              report={previewReport}
              loading={false}
              onClose={() => setPreviewReport(null)}
              onView={() => { setActiveReport(previewReport); setView("viewfull"); }}
              onEdit={() => { setActiveReport(previewReport); setView("edit"); }}
            />
          )}
        </div>
      </main>

      <Toast message={toast.message} type={toast.type}/>
    </div>
  );
}