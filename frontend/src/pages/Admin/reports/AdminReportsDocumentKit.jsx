/* eslint-disable react-refresh/only-export-components -- SF kit exports primitives + document views together */
import { LEARNERS, SUBJECTS } from "./adminReportsConstants.js";
import { IWifi, IWifiOff, IDatabase, IRefresh, IBChev } from "./AdminReportsIcons.jsx";
export const ApiStatusBar = ({ status, message, onRetry }) => {
  const configs = {
    loading:   { cls:"rpt-api-status-bar--loading",   dotCls:"rpt-api-status-dot--loading",   icon:null,        label:"Connecting to API…" },
    connected: { cls:"rpt-api-status-bar--connected", dotCls:"rpt-api-status-dot--connected", icon:<IWifi/>,    label:"Live data from API" },
    error:     { cls:"rpt-api-status-bar--error",     dotCls:"rpt-api-status-dot--error",     icon:<IWifiOff/>, label:"API unreachable" },
    fallback:  { cls:"rpt-api-status-bar--fallback",  dotCls:"rpt-api-status-dot--fallback",  icon:<IDatabase/>,label:"Showing default data" },
  };
  const cfg = configs[status] || configs.fallback;
  return (
    <div className={`rpt-api-status-bar ${cfg.cls}`}>
      <span className={`rpt-api-status-dot ${cfg.dotCls}`} />
      {cfg.icon && <span style={{ display:"flex", alignItems:"center" }}>{cfg.icon}</span>}
      <span className="rpt-api-status-label">
        <strong>{cfg.label}</strong>
        {message && <span style={{ fontWeight:400, marginLeft:6 }}>— {message}</span>}
      </span>
      {(status === "error" || status === "fallback") && (
        <button className="rpt-api-status-action" onClick={onRetry}><IRefresh /> Retry</button>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   SKELETON LOADERS (unchanged)
══════════════════════════════════════════════════════════ */
export const SkeletonRow = () => (
  <tr className="rpt-skeleton-row">
    <td className="rpt-td rpt-td--check"><div className="rpt-skeleton rpt-skeleton-checkbox" /></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-text-lg" style={{width:"70%"}} /><div className="rpt-skeleton rpt-skeleton-text-sm" style={{width:"45%",marginTop:5}} /></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-pill" /><div className="rpt-skeleton rpt-skeleton-text-sm" style={{width:"80%",marginTop:5}} /></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-text-lg" style={{width:"65%"}} /></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-text-lg" style={{width:"55%"}} /></td>
    <td className="rpt-td"><div className="rpt-skeleton rpt-skeleton-badge" style={{width:80}} /></td>
    <td className="rpt-td"><div style={{display:"flex",gap:6}}><div className="rpt-skeleton rpt-skeleton-btn" style={{width:86}} /><div className="rpt-skeleton rpt-skeleton-btn" style={{width:70}} /><div className="rpt-skeleton rpt-skeleton-btn" style={{width:86}} /></div></td>
  </tr>
);
export const SkeletonTable = ({ rows = 8 }) => (
  <tbody>{Array.from({ length: rows }, (_, i) => <SkeletonRow key={i} />)}</tbody>
);
export const SkeletonPreviewPanel = () => (
  <div className="rpt-preview-panel">
    <div className="rpt-preview-panel-header">
      <div style={{flex:1}}>
        <div className="rpt-skeleton" style={{height:14,width:"55%",borderRadius:5,marginBottom:8}} />
        <div className="rpt-skeleton" style={{height:10,width:"80%",borderRadius:4}} />
      </div>
    </div>
    <div className="rpt-preview-sf-wrap"><div className="rpt-skeleton rpt-skeleton-preview-img" style={{width:"100%",height:"100%",borderRadius:0}} /></div>
    <div className="rpt-preview-meta">{Array.from({length:6},(_,i)=>(
      <div key={i} className="rpt-preview-meta-row"><div className="rpt-skeleton rpt-skeleton-meta-label" /><div className="rpt-skeleton rpt-skeleton-meta-value" style={{width:"50%"}} /></div>
    ))}</div>
    <div className="rpt-preview-actions">
      <div className="rpt-skeleton" style={{flex:1,height:36,borderRadius:10}} />
      <div className="rpt-skeleton" style={{flex:1,height:36,borderRadius:10}} />
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════
   UI PRIMITIVES
══════════════════════════════════════════════════════════ */
export const Checkbox = ({ checked, onChange, indeterminate = false }) => (
  <div className="rpt-checkbox" onClick={onChange}
    style={{ background: checked||indeterminate ? "#1a5c1a" : "#fff", border: checked||indeterminate ? "none" : "1.5px solid #d1d5db" }}>
    {indeterminate && !checked
      ? <span style={{color:"#fff",fontSize:13,fontWeight:900}}>−</span>
      : checked ? <span style={{color:"#fff",fontSize:11}}>✓</span> : null}
  </div>
);

export const Toast = ({ message, type = "success" }) => {
  if (!message) return null;
  const bg = type === "error" ? "#dc2626" : "#1a5c1a";
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, background:bg, color:"#fff",
      padding:"12px 20px", borderRadius:12, fontSize:14, fontWeight:600, zIndex:9999,
      boxShadow:`0 8px 24px ${bg}55`, fontFamily:"'DM Sans',sans-serif",
      display:"flex", alignItems:"center", gap:8, animation:"fadeInDown 0.2s ease",
    }}>
      {type === "error" ? "✕" : "✓"} {message}
    </div>
  );
};

export const STATUS_MAP = {
  Approved:               { bg:"#f0fdf4", color:"#15803d", dot:"#22c55e", border:"#bbf7d0" },
  Disapproved:            { bg:"#fef2f2", color:"#dc2626", dot:"#ef4444", border:"#fecaca" },
  Pending:                { bg:"#fefce8", color:"#a16207", dot:"#eab308", border:"#fde68a" },
  // FIX: new labels from updated ReportStatus::label() — both stages now have distinct display values
  "For Admin Approval":      { bg:"#eff6ff", color:"#2563eb", dot:"#3b82f6", border:"#bfdbfe" },
  "For Principal Approval":  { bg:"#f5f3ff", color:"#7c3aed", dot:"#8b5cf6", border:"#ddd6fe" },
};
export const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.Pending;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,
      padding:"3px 10px",borderRadius:99,background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}} />
      {status}
    </span>
  );
};

export const Breadcrumb = ({ crumbs }) => (
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

/* ══════════════════════════════════════════════════════════
   SF DOCUMENT RENDERERS (unchanged — SF1–SF10)
══════════════════════════════════════════════════════════ */
export const DocHeader = ({ sfNum, title, subtitle }) => (
  <div className="sf-doc-header">
    <div className="sf-header-left">
      <span className="sf-badge">SF{sfNum}</span>
      <div><div className="sf-doc-title">{title}</div>{subtitle && <div className="sf-doc-subtitle">{subtitle}</div>}</div>
    </div>
    <div className="sf-deped">Dep<span style={{color:"#dc2626"}}>ED</span></div>
  </div>
);
export const MetaRow = ({ items }) => (
  <div className="sf-meta-row">
    {items.map(([label, value]) => (
      <div key={label} className="sf-meta-item">
        <span className="sf-meta-label">{label}</span>
        <span className="sf-meta-value">{value}</span>
      </div>
    ))}
  </div>
);

export const SF1View = ({ report }) => (
  <div className="sf-doc">
    <DocHeader sfNum={1} title="School Register" subtitle="This replaces Form 1 and BPS Form 1" />
    <MetaRow items={[["School ID","303203"],["Grade Level",report.gradeLevel],["Section",report.section],["School Year",report.schoolYear]]} />
    <MetaRow items={[["School Name","Paknaan National High School"],["District","Davao City"],["Division","Davao City"]]} />
    <div className="sf-table-wrap">
      <table className="sf-table">
        <thead>
          <tr>
            <th className="sf-th" rowSpan={2} style={{width:28}}>No.</th>
            <th className="sf-th" rowSpan={2} style={{minWidth:180}}>LEARNER'S NAME</th>
            <th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" rowSpan={2}>Sex</th>
            <th className="sf-th" rowSpan={2}>Date of Birth</th><th className="sf-th" rowSpan={2}>Age</th>
            <th className="sf-th" colSpan={3}>Mother Tongue</th>
            <th className="sf-th" rowSpan={2}>Religion</th>
            <th className="sf-th" colSpan={2}>IP</th><th className="sf-th" rowSpan={2}>4Ps</th>
          </tr>
          <tr><th className="sf-th">Primary</th><th className="sf-th">Secondary</th><th className="sf-th">Other</th><th className="sf-th">Yes</th><th className="sf-th">No</th></tr>
        </thead>
        <tbody>
          {LEARNERS.slice(0,10).map((name,i)=>(
            <tr key={i} className="sf-tr">
              <td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td>
              <td className="sf-td sf-center">20{200+i}</td><td className="sf-td sf-center">{i%2===0?"M":"F"}</td>
              <td className="sf-td sf-center">0{i+1}/15/2009</td><td className="sf-td sf-center">15</td>
              <td className="sf-td sf-center">Cebuano</td><td className="sf-td"/><td className="sf-td"/>
              <td className="sf-td sf-center">Catholic</td><td className="sf-td sf-center">✓</td>
              <td className="sf-td"/><td className="sf-td sf-center">{i%3===0?"✓":""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
export const SF2View=({report})=>{const days=Array.from({length:31},(_,i)=>i+1);return(<div className="sf-doc"><DocHeader sfNum={2} title="Daily Attendance Report of Learners" subtitle="This replaced Form 1, Form 2 & STD Form 4"/><MetaRow items={[["School ID","303203"],["School Year",report.schoolYear],["Month",report.month]]}/><MetaRow items={[["School Name","Paknaan National High School"],["Grade Level",report.gradeLevel],["Section",report.section]]}/><div className="sf-table-wrap"><table className="sf-table sf-table--compact"><thead><tr><th className="sf-th" style={{minWidth:160}}>LEARNER'S NAME</th>{days.map(d=><th key={d} className="sf-th sf-day-th">{d}</th>)}<th className="sf-th">Total Absent</th><th className="sf-th">Remarks</th></tr></thead><tbody>{LEARNERS.slice(0,8).map((name,i)=>(<tr key={i} className="sf-tr"><td className="sf-td" style={{fontSize:9}}>{name}</td>{days.map(d=><td key={d} className="sf-td sf-day-td">{(i+d)%11===0?"A":""}</td>)}<td className="sf-td sf-center">{i}</td><td className="sf-td"/></tr>))}</tbody></table></div></div>);};
export const SF3View=({report})=>(<div className="sf-doc"><DocHeader sfNum={3} title="Books Issued and Returned" subtitle="Record of Textbooks and Instructional Materials"/><MetaRow items={[["School ID","303203"],["Grade Level",report.gradeLevel],["Section",report.section],["School Year",report.schoolYear]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th" rowSpan={2}>No.</th><th className="sf-th" rowSpan={2}>LEARNER'S NAME</th><th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" colSpan={3}>ISSUED</th><th className="sf-th" colSpan={3}>RETURNED</th><th className="sf-th" rowSpan={2}>Condition</th></tr><tr><th className="sf-th">Book Title</th><th className="sf-th">Date</th><th className="sf-th">Condition</th><th className="sf-th">Book Title</th><th className="sf-th">Date</th><th className="sf-th">Condition</th></tr></thead><tbody>{LEARNERS.slice(0,10).map((name,i)=>(<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200+i}</td><td className="sf-td">Science 9 – LM</td><td className="sf-td sf-center">06/01/25</td><td className="sf-td sf-center">Good</td><td className="sf-td">{i%3===0?"Science 9 – LM":""}</td><td className="sf-td sf-center">{i%3===0?"10/15/25":""}</td><td className="sf-td sf-center">{i%3===0?"Good":""}</td><td className="sf-td sf-center">Good</td></tr>))}</tbody></table></div></div>);
export const SF4View=({report})=>(<div className="sf-doc"><DocHeader sfNum={4} title="Progress Report Card (Learner)" subtitle="School Report Card"/><MetaRow items={[["School Year",report.schoolYear],["Grade Level",report.gradeLevel],["Section",report.section]]}/><div className="sf-info-grid">{[["Learner's Name","Aguilar, Mark Casuela"],["LRN","202001"],["Date of Birth","01/15/2009"],["Sex","Male"],["General Average","88.5"],["Remarks","Promoted"]].map(([l,v])=>(<div key={l} className="sf-info-cell"><span className="sf-info-label">{l}</span><span className="sf-info-val">{v}</span></div>))}</div><div className="sf-table-wrap" style={{marginTop:12}}><table className="sf-table"><thead><tr><th className="sf-th">Learning Area</th><th className="sf-th">Q1</th><th className="sf-th">Q2</th><th className="sf-th">Q3</th><th className="sf-th">Q4</th><th className="sf-th">Final Grade</th><th className="sf-th">Remarks</th></tr></thead><tbody>{SUBJECTS.map((s,i)=>{const grades=[85+i%5,87+i%4,86+i%6,88+i%3];const avg=Math.round(grades.reduce((a,b)=>a+b,0)/4);return(<tr key={s} className="sf-tr"><td className="sf-td">{s}</td>{grades.map((g,j)=><td key={j} className="sf-td sf-center">{g}</td>)}<td className="sf-td sf-center sf-grade-final">{avg}</td><td className="sf-td sf-center" style={{color:"#15803d",fontWeight:700}}>Passed</td></tr>);})}<tr className="sf-tr sf-tr--total"><td className="sf-td" style={{fontWeight:700}}>General Average</td><td className="sf-td sf-center" colSpan={4}/><td className="sf-td sf-center sf-grade-final">88</td><td className="sf-td sf-center" style={{color:"#15803d",fontWeight:700}}>Promoted</td></tr></tbody></table></div></div>);
export const SF5View=({report})=>(<div className="sf-doc"><DocHeader sfNum={5} title="Report on Promotion & Level of Proficiency" subtitle="End-of-Year Report"/><MetaRow items={[["School Year",report.schoolYear],["Grade Level",report.gradeLevel],["Section",report.section],["School ID","303203"]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th" rowSpan={2}>No.</th><th className="sf-th" rowSpan={2}>LEARNER'S NAME</th><th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" colSpan={4}>QUARTERLY GRADES</th><th className="sf-th" rowSpan={2}>Gen. Avg.</th><th className="sf-th" rowSpan={2}>Remarks</th></tr><tr><th className="sf-th">Q1</th><th className="sf-th">Q2</th><th className="sf-th">Q3</th><th className="sf-th">Q4</th></tr></thead><tbody>{LEARNERS.slice(0,10).map((name,i)=>{const avg=82+i%10;return(<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200+i}</td>{[80+i%8,83+i%6,85+i%5,81+i%7].map((g,j)=><td key={j} className="sf-td sf-center">{g}</td>)}<td className="sf-td sf-center sf-grade-final">{avg}</td><td className="sf-td sf-center" style={{color:avg>=75?"#15803d":"#dc2626",fontWeight:700}}>{avg>=75?"Promoted":"Retained"}</td></tr>);})}</tbody></table></div></div>);
export const SF6View=({report})=>(<div className="sf-doc"><DocHeader sfNum={6} title="Summarized Report on Promotion" subtitle="Summary per Grade Level"/><MetaRow items={[["School Year",report.schoolYear],["School Name","Paknaan National High School"],["School ID","303203"]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">Grade Level</th><th className="sf-th">Section</th><th className="sf-th">Total Enrolled</th><th className="sf-th">Male</th><th className="sf-th">Female</th><th className="sf-th">Promoted</th><th className="sf-th">Retained</th><th className="sf-th">Dropped</th><th className="sf-th">% Promoted</th></tr></thead><tbody>{[7,8,9,10,11,12].map((g,i)=>{const total=30+i*2,promoted=28+i,retained=1,dropped=total-promoted-retained;return(<tr key={g} className="sf-tr"><td className="sf-td">Grade {g}</td><td className="sf-td">Gemini</td><td className="sf-td sf-center">{total}</td><td className="sf-td sf-center">{Math.floor(total/2)}</td><td className="sf-td sf-center">{Math.ceil(total/2)}</td><td className="sf-td sf-center" style={{color:"#15803d",fontWeight:700}}>{promoted}</td><td className="sf-td sf-center" style={{color:"#dc2626"}}>{retained}</td><td className="sf-td sf-center" style={{color:"#a16207"}}>{dropped}</td><td className="sf-td sf-center">{((promoted/total)*100).toFixed(1)}%</td></tr>);})}</tbody></table></div></div>);
export const SF7View=({report})=>(<div className="sf-doc"><DocHeader sfNum={7} title="Home Address & Health Card" subtitle="Learner Information Sheet"/><MetaRow items={[["Grade Level",report.gradeLevel],["Section",report.section],["School Year",report.schoolYear]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">No.</th><th className="sf-th" style={{minWidth:160}}>LEARNER'S NAME</th><th className="sf-th">LRN</th><th className="sf-th">Home Address</th><th className="sf-th">Parent/Guardian</th><th className="sf-th">Contact No.</th><th className="sf-th">Height (cm)</th><th className="sf-th">Weight (kg)</th><th className="sf-th">Blood Type</th><th className="sf-th">Medical Condition</th></tr></thead><tbody>{LEARNERS.slice(0,10).map((name,i)=>(<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200+i}</td><td className="sf-td" style={{fontSize:9}}>Brgy. {["Talomo","Matina","Buhangin"][i%3]}, Davao City</td><td className="sf-td" style={{fontSize:9}}>{name.split(",")[0]} Sr.</td><td className="sf-td sf-center" style={{fontSize:9}}>091{20000+i}</td><td className="sf-td sf-center">{150+i}</td><td className="sf-td sf-center">{45+i}</td><td className="sf-td sf-center">{["O+","A+","B+","AB+"][i%4]}</td><td className="sf-td sf-center">{i%5===0?"Asthma":"None"}</td></tr>))}</tbody></table></div></div>);
export const SF8View=({report})=>(<div className="sf-doc"><DocHeader sfNum={8} title="Learner's Nutrition Report" subtitle="Nutritional Status of Learners"/><MetaRow items={[["School Year",report.schoolYear],["Grade Level",report.gradeLevel],["Section",report.section],["Quarter","Q1"]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th" rowSpan={2}>No.</th><th className="sf-th" rowSpan={2}>LEARNER'S NAME</th><th className="sf-th" rowSpan={2}>LRN</th><th className="sf-th" rowSpan={2}>Sex</th><th className="sf-th" rowSpan={2}>Age</th><th className="sf-th" colSpan={2}>BEG OF YEAR</th><th className="sf-th" colSpan={2}>END OF YEAR</th><th className="sf-th" rowSpan={2}>Nutritional Status</th></tr><tr><th className="sf-th">Ht(cm)</th><th className="sf-th">Wt(kg)</th><th className="sf-th">Ht(cm)</th><th className="sf-th">Wt(kg)</th></tr></thead><tbody>{LEARNERS.slice(0,10).map((name,i)=>{const statuses=["Normal","Stunted","Underweight","Normal","Obese"];const status=statuses[i%5];const colors={"Normal":"#15803d","Stunted":"#a16207","Underweight":"#dc2626","Obese":"#7c3aed"};return(<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200+i}</td><td className="sf-td sf-center">{i%2===0?"M":"F"}</td><td className="sf-td sf-center">15</td><td className="sf-td sf-center">{148+i}</td><td className="sf-td sf-center">{43+i}</td><td className="sf-td sf-center">{150+i}</td><td className="sf-td sf-center">{45+i}</td><td className="sf-td sf-center" style={{color:colors[status]||"#111",fontWeight:700}}>{status}</td></tr>);})}</tbody></table></div><div className="sf-legend"><span>Legend:</span>{[["Normal","#15803d"],["Stunted","#a16207"],["Underweight","#dc2626"],["Obese","#7c3aed"]].map(([l,c])=>(<span key={l} style={{color:c,fontWeight:700,fontSize:10}}>● {l}</span>))}</div></div>);
export const SF9View=({report})=>(<div className="sf-doc"><DocHeader sfNum={9} title="Parent-Teacher Conference Record" subtitle="Record of Meetings and Outcomes"/><MetaRow items={[["School Year",report.schoolYear],["Grade Level",report.gradeLevel],["Section",report.section]]}/><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">No.</th><th className="sf-th">LEARNER'S NAME</th><th className="sf-th">LRN</th><th className="sf-th">Date of Conference</th><th className="sf-th">Parent/Guardian Present</th><th className="sf-th">Concerns Raised</th><th className="sf-th">Actions Taken</th><th className="sf-th">Follow-up Date</th><th className="sf-th">Teacher Signature</th></tr></thead><tbody>{LEARNERS.slice(0,8).map((name,i)=>(<tr key={i} className="sf-tr"><td className="sf-td sf-center">{i+1}</td><td className="sf-td">{name}</td><td className="sf-td sf-center">20{200+i}</td><td className="sf-td sf-center">11/{String(i+1).padStart(2,"0")}/25</td><td className="sf-td">{name.split(",")[0]} Sr.</td><td className="sf-td" style={{fontSize:9}}>{["Academic performance","Attendance","Behavior","Grade concerns"][i%4]}</td><td className="sf-td" style={{fontSize:9}}>{["Advisory given","Referred to guidance","Monitored","Home visit"][i%4]}</td><td className="sf-td sf-center">12/{String(i+5).padStart(2,"0")}/25</td><td className="sf-td"/></tr>))}</tbody></table></div></div>);
export const SF10View=()=>(<div className="sf-doc"><DocHeader sfNum={10} title="Permanent Record / Cumulative Record" subtitle="Comprehensive Learner Achievement Record"/><div className="sf-info-grid sf-info-grid--wide">{[["Learner's Name","Aguilar, Mark Casuela"],["LRN","202001"],["Date of Birth","01/15/2009"],["Sex","Male"],["Place of Birth","Davao City"],["Nationality","Filipino"],["Mother Tongue","Cebuano"],["Religion","Catholic"],["Home Address","Brgy. Talomo, Davao City"],["Parent/Guardian","Aguilar, Mark Sr."],["Contact No.","09123456789"],["Email","aguilar@example.com"]].map(([l,v])=>(<div key={l} className="sf-info-cell"><span className="sf-info-label">{l}</span><span className="sf-info-val">{v}</span></div>))}</div><div className="sf-section-sep">Academic Records</div><div className="sf-table-wrap"><table className="sf-table"><thead><tr><th className="sf-th">Grade Level</th><th className="sf-th">School Year</th>{SUBJECTS.map(s=><th key={s} className="sf-th" style={{fontSize:8,padding:"4px 3px"}}>{s}</th>)}<th className="sf-th">Gen. Avg.</th><th className="sf-th">Remarks</th></tr></thead><tbody>{[7,8,9,10].map((g,i)=>{const grades=SUBJECTS.map((_,j)=>80+j%8+i);const avg=Math.round(grades.reduce((a,b)=>a+b,0)/grades.length);return(<tr key={g} className="sf-tr"><td className="sf-td">Grade {g}</td><td className="sf-td sf-center">{2020+i}-{2021+i}</td>{grades.map((gr,j)=><td key={j} className="sf-td sf-center">{gr}</td>)}<td className="sf-td sf-center sf-grade-final">{avg}</td><td className="sf-td sf-center" style={{color:"#15803d",fontWeight:700}}>Promoted</td></tr>);})}</tbody></table></div></div>);

export const SFDocument = ({ report }) => {
  const views = { 1:SF1View,2:SF2View,3:SF3View,4:SF4View,5:SF5View,6:SF6View,7:SF7View,8:SF8View,9:SF9View,10:SF10View };
  const View = views[report.sfNumber] || SF1View;
  return <View report={report} />;
};