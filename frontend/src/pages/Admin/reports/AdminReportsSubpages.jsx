import { useState, useRef } from "react";
import Sidebar from "../../../Components/Sidebar";
import reportsService from "../../../services/Admin/Reports/reportService";
import { validateFileList, validateSchoolYearField, validateTextField } from "../../../utils/inputValidation";
import { SF_INFO, MOCK_REPORTS, PAGE_SIZE } from "./adminReportsConstants.js";
import {
  ISearch, IFilter, ISort, IChevL, IChevR, IBChev, ICancel, ICheck, IInfo, IClose, IDisapprove, IApprove, ISubmitDoc, IEvaluate, IDownload, IDelete, IArchive, IRefresh, IUploadDoc, IBadge, IForward, IEye, IX, IWifi, IWifiOff, IDatabase,
} from "./AdminReportsIcons.jsx";
import {
  ApiStatusBar, SkeletonRow, SkeletonTable, SkeletonPreviewPanel, Checkbox, Toast, STATUS_MAP, StatusBadge, Breadcrumb, DocHeader, MetaRow,
  SF1View, SF2View, SF3View, SF4View, SF5View, SF6View, SF7View, SF8View, SF9View, SF10View, SFDocument,
} from "./AdminReportsDocumentKit.jsx";

export const PreviewPanel = ({ report, loading, onClose, onView, onEvaluate }) => {
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
        {[["Document ID",report.docId],["Submitted By",report.submittedBy],["Date Submitted",report.dateSubmitted],["File",report.fileName],["Grade Level",report.gradeLevel],["Section",report.section]].map(([label,value])=>(
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
        <button className="rpt-btn rpt-btn--outline-cancel" style={{flex:1}} onClick={onView}><IEye /> Full View</button>
          {!["For Principal Approval","Approved","Disapproved"].includes(report.status) && (
            <button className="rpt-btn rpt-btn--primary" style={{flex:1}} onClick={onEvaluate}><IEvaluate /> Evaluate</button>
          )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   DELETE / ARCHIVE CONFIRM MODAL
══════════════════════════════════════════════════════════ */
export const ConfirmModal = ({ type, report, onCancel, onConfirm, loading }) => {
  if (!report) return null;
  const isDelete = type === "delete";
  return (
    <div className="rpt-modal-overlay">
      <div className="rpt-modal-box">
        <div className="rpt-modal-title">
          {isDelete ? <IDelete /> : <IArchive />}
          {isDelete ? "Delete Report" : "Archive Report"}
        </div>
        <div className="rpt-modal-body">
          {isDelete
            ? <>Are you sure you want to <strong>permanently delete</strong> <em>{report.docId}</em>? This action cannot be undone.</>
            : <>This will archive <em>{report.docId}</em> and remove it from the active list. You can restore it later.</>
          }
        </div>
        <div className="rpt-modal-actions">
          <button className="rpt-btn rpt-btn--outline-cancel" onClick={onCancel} disabled={loading}><ICancel /> Cancel</button>
          <button
            className={`rpt-btn ${isDelete?"rpt-btn--danger-ghost":"rpt-btn--filter"}`}
            style={isDelete ? {background:"#dc2626",color:"#fff",borderColor:"#dc2626"} : {}}
            onClick={onConfirm} disabled={loading}>
            {loading ? <span className="rpt-spinner" style={{width:14,height:14}} /> : isDelete ? <IDelete /> : <IArchive />}
            {loading ? "Processing…" : isDelete ? "Delete Permanently" : "Archive Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   SUBMIT / UPLOAD PAGE
   FIX BUG 10: collect sfNumber, gradeLevel, section, month from user
   FIX BUG 11: disable Submit until all files are "complete"
   FIX BUG 2:  this component owns the API call — parent just receives result
══════════════════════════════════════════════════════════ */
export const SubmitReport = ({ onBack, onSubmitted }) => {
  const [files,      setFiles]      = useState([]);
  const [preview,    setPreview]    = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // FIX BUG 10: form fields collected from user
  const [sfNumber,    setSfNumber]    = useState("1");
  const [gradeLevel,  setGradeLevel]  = useState("Grade 7");
  const [section,     setSection]     = useState("");
  const [month,       setMonth]       = useState("January");
  const [schoolYear,  setSchoolYear]  = useState("2024-2025");
  const [errors,      setErrors]      = useState({});

  const fileRef = useRef();

  const handleFilePick = e => {
    const f = e.target.files[0];
    if (!f) return;
    const fileError = validateFileList([f], {
      maxSizeMb: 10,
      allowedExtensions: ["pdf", "docx", "doc", "txt", "xlsx", "xls", "csv"],
      label: "Report file",
    });
    if (fileError) {
      setErrors(prev => ({ ...prev, files: fileError }));
      e.target.value = "";
      return;
    }
    setErrors(prev => ({ ...prev, files: undefined }));
    setPreview({ name:f.name, type:f.name.split(".").pop().toUpperCase(), size:`${Math.max(1,Math.round(f.size/1024/1024))} MB`, raw:f });
    e.target.value = "";
  };

  const confirmUpload = () => {
    const f = preview;
    setPreview(null);
    // Store raw File so handleSubmit can send it as multipart.
    // File already passed validation in handleFilePick \u2014 mark complete immediately.
    const entry = { name: f.name, progress: 100, status: "complete", size: f.size, _file: f.raw };
    setFiles(prev => [...prev, entry]);
  };

  // FIX BUG 11: only complete files included; submit disabled if any uploading
  const allComplete   = files.length > 0 && files.every(f => f.status === "complete");
  const anyUploading  = files.some(f => f.status === "uploading");

  const handleSubmit = async () => {
    if (!allComplete) return;
    const nextErrors = {};
    const yearError = validateSchoolYearField(schoolYear);
    const sectionError = validateTextField(section, "Section", { min: 2, max: 40 });
    if (yearError) nextErrors.schoolYear = yearError;
    if (sectionError) nextErrors.section = sectionError;
    if (files.length === 0) nextErrors.files = "At least one report file is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);

    // Collect raw File objects stored by confirmUpload
    const rawFiles = files.map(f => f._file).filter(Boolean);

    try {
      // POST multipart/form-data to the real /reports endpoint
      const created = await reportsService.submitReport({
        sfNumber:   parseInt(sfNumber, 10),
        gradeLevel,
        section:    section.trim() || '—',
        month,
        schoolYear,
        files:      rawFiles,
      });
      onSubmitted(created);
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.message || 'Submission failed. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { fontSize:13, border:"1px solid #d1d5db", borderRadius:8, padding:"8px 10px", outline:"none", background:"#fff", color:"#111f11", width:"100%" };
  const labelStyle = { fontSize:12, fontWeight:700, color:"#4a5e4a", marginBottom:4, display:"block" };

  return (
    <div className="rpt-root">
      <Sidebar active="Reports and DepEd" />
      <main className="rpt-main">
        <Breadcrumb crumbs={[{label:"Reports and DepEd Compliance",onClick:onBack},{label:"Submit Report",green:true}]} />
        <div className="rpt-section-card" style={{maxWidth:780}}>
          <h3 className="rpt-section-card-title">Submit a Report</h3>

          {/* ── Report metadata fields ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,margin:"16px 0"}}>
            <div>
              <label style={labelStyle}>SF Form *</label>
              <select style={inputStyle} value={sfNumber} onChange={e=>setSfNumber(e.target.value)} required aria-label="Select SF form">
                {Array.from({length:10},(_,i)=><option key={i+1} value={String(i+1)}>SF{i+1} — {SF_INFO[i+1].title}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>School Year *</label>
              <input style={{...inputStyle,borderColor:errors.schoolYear?"#dc2626":"#d1d5db"}} value={schoolYear} onChange={e=>{setSchoolYear(e.target.value);setErrors(prev=>({...prev,schoolYear:undefined}));}} placeholder="e.g. 2024-2025" maxLength={9} required aria-invalid={Boolean(errors.schoolYear)} />
              {errors.schoolYear && <span style={{fontSize:11.5,color:"#dc2626",fontWeight:600}}>{errors.schoolYear}</span>}
            </div>
            <div>
              <label style={labelStyle}>Grade Level *</label>
              <select style={inputStyle} value={gradeLevel} onChange={e=>setGradeLevel(e.target.value)} required aria-label="Select grade level">
                {[7,8,9,10,11,12].map(g=><option key={g} value={`Grade ${g}`}>Grade {g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Section *</label>
              <input style={{...inputStyle,borderColor:errors.section?"#dc2626":"#d1d5db"}} value={section} onChange={e=>{setSection(e.target.value);setErrors(prev=>({...prev,section:undefined}));}} placeholder="e.g. Gemini" maxLength={40} required aria-invalid={Boolean(errors.section)} />
              {errors.section && <span style={{fontSize:11.5,color:"#dc2626",fontWeight:600}}>{errors.section}</span>}
            </div>
            <div>
              <label style={labelStyle}>Month</label>
              <select style={inputStyle} value={month} onChange={e=>setMonth(e.target.value)} required aria-label="Select report month">
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={{fontSize:13,fontWeight:700,color:"#1a5c1a",marginBottom:14}}>Upload Files</div>
          <div className="rpt-dropzone" onClick={()=>fileRef.current.click()}>
            <IUploadDoc />
            <span className="rpt-dropzone-text">Click to upload a file</span>
            <span className="rpt-dropzone-hint">PDF · DOCX · DOC · TXT · XLSX · XLS · CSV · Max 10 MB</span>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.csv" style={{display:"none"}} onChange={handleFilePick}/>
          </div>
          {errors.files && <p style={{fontSize:12,color:"#dc2626",fontWeight:600,marginTop:8}}>{errors.files}</p>}
          {errors.submit && <p style={{fontSize:12,color:"#dc2626",fontWeight:600,marginTop:8,background:"#fef2f2",padding:"8px 12px",borderRadius:8,border:"1px solid #fecaca"}}>{errors.submit}</p>}

          {files.map(f=>(
            <div key={f.name} className="rpt-file-row">
              <div className="rpt-file-left">
                <span className="rpt-file-name">{f.name}</span>
                <span className="rpt-file-meta">
                  <span style={{color:"#1a5c1a",fontWeight:700}}>{f.progress}%</span>
                  {" · "}<span style={{color:f.status==="complete"?"#1a5c1a":"#9aaa9a"}}>{f.status==="complete"?"Complete":"Uploading"}</span>
                  {" · "}{f.size}
                </span>
                {f.status==="uploading"&&<div className="rpt-progress-track"><div className="rpt-progress-bar" style={{width:`${f.progress}%`}}/></div>}
              </div>
              <div className="rpt-file-right">
                {f.status==="complete" ? <IBadge /> : (
                  <button className="rpt-file-x" onClick={()=>setFiles(p=>p.filter(x=>x.name!==f.name))}><IClose/></button>
                )}
              </div>
            </div>
          ))}

          {anyUploading && (
            <p style={{fontSize:12,color:"#a16207",marginTop:8}}>
              ⏳ Please wait for all files to finish uploading before submitting.
            </p>
          )}

          <hr style={{border:"none",borderTop:"1px solid #f0f4f0",margin:"20px 0"}}/>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <button className="rpt-btn rpt-btn--outline-cancel" onClick={onBack}><ICancel /> Cancel</button>
            {/* FIX BUG 11: disabled until all files complete */}
            <button className="rpt-btn rpt-btn--primary" onClick={handleSubmit}
              disabled={!allComplete || submitting}
              title={!allComplete ? "Wait for all files to finish uploading" : undefined}>
              {submitting ? <span className="rpt-spinner" style={{width:14,height:14,borderTopColor:"#fff"}} /> : <ISubmitDoc />}
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </div>
        </div>

        {/* File Preview Modal */}
        {preview && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:"#fff",borderRadius:16,padding:32,maxWidth:500,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,0.15)",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{fontSize:17,fontWeight:800,color:"#111f11",marginBottom:20,display:"flex",alignItems:"center",gap:8}}><IInfo/> File Preview</div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:"#4a5e4a",marginBottom:12,paddingBottom:8,borderBottom:"1px solid #f0f4f0"}}>File Details</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px 16px"}}>
                  {[["Title",preview.name.replace(/\.[^/.]+$/,"")],["File Type",preview.type],["File Size",preview.size]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:10.5,color:"#9aaa9a",fontWeight:500}}>{l}</span>
                      <span style={{fontSize:13,background:"#f4f6f4",borderRadius:6,padding:"7px 10px",color:"#111f11",fontWeight:500}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
                <button className="rpt-btn rpt-btn--outline-cancel" onClick={()=>setPreview(null)}><ICancel/> Cancel</button>
                <button className="rpt-btn rpt-btn--primary" onClick={confirmUpload}><ICheck/> Confirm Upload</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   VIEW FULL REPORT PAGE
══════════════════════════════════════════════════════════ */
export const ViewReportPage = ({ report, onBack, onEvaluate }) => {
  const sfInfo = SF_INFO[report.sfNumber] || SF_INFO[1];
  return (
    <div className="rpt-root">
      <Sidebar active="Reports and DepEd" />
      <main className="rpt-main">
        <Breadcrumb crumbs={[
          {label:"Reports and DepEd Compliance",onClick:onBack},
          {label:report.docId,onClick:onBack},
          {label:"Full View",green:true},
        ]}/>
        <div className="rpt-section-card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,paddingBottom:13,borderBottom:"1px solid #e8ede8"}}>
            <div>
              <h3 className="rpt-section-card-title" style={{marginBottom:2}}>{sfInfo.name} – {sfInfo.title}</h3>
              <div style={{fontSize:12,color:"#9aaa9a"}}>{sfInfo.desc}</div>
            </div>
            <StatusBadge status={report.status} />
          </div>
          <div className="rpt-doc-scroll"><SFDocument report={report} /></div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}>
            <button className="rpt-btn rpt-btn--outline-cancel" onClick={onBack}><ICancel /> Close</button>
           {!["For Principal Approval","Approved","Disapproved"].includes(report.status) && (
              <button className="rpt-btn rpt-btn--primary" onClick={onEvaluate}><IEvaluate /> Evaluate Report</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   FILE TYPE BADGE — shown in evaluate page
══════════════════════════════════════════════════════════ */
const FILE_TYPE_COLORS = {
  pdf:  { bg: "#fef2f2", color: "#dc2626", label: "PDF" },
  docx: { bg: "#eff6ff", color: "#2563eb", label: "DOCX" },
  doc:  { bg: "#eff6ff", color: "#2563eb", label: "DOC" },
  txt:  { bg: "#f9fafb", color: "#6b7280", label: "TXT" },
  xlsx: { bg: "#f0fdf4", color: "#16a34a", label: "XLSX" },
  xls:  { bg: "#f0fdf4", color: "#16a34a", label: "XLS" },
  csv:  { bg: "#fefce8", color: "#ca8a04", label: "CSV" },
};

const FileTypeBadge = ({ fileName }) => {
  const ext = (fileName || "").split(".").pop().toLowerCase();
  const cfg = FILE_TYPE_COLORS[ext] || { bg: "#f4f6f4", color: "#4a5e4a", label: ext.toUpperCase() };
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
      background: cfg.bg, color: cfg.color, letterSpacing: "0.05em",
    }}>{cfg.label}</span>
  );
};

/* ══════════════════════════════════════════════════════════
   EVALUATE PAGE
   FIX BUG 9: toast shown when evaluate API fails
══════════════════════════════════════════════════════════ */
export const EvaluatePage = ({ report, onBack, onDone }) => {
  const [comment,    setComment]    = useState(report.comment || "");
  const [modal,      setModal]      = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [evalError,  setEvalError]  = useState(null); // inline error shown inside modal

  // Parse a human-readable message from the API error.
  // Handles: already-approved (409/422), network failure, validation errors.
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
      const updated = await reportsService.evaluateReport(report.uuid, { status, comment });
      onDone(updated, false);
    } catch (err) {
      // Stay on the modal — show the specific error inline so the user
      // knows exactly what went wrong and can retry or cancel.
      setEvalError(parseError(err));
      setSubmitting(false);
      // Do NOT call setModal(null) — keep the confirmation dialog open
      // so the user sees the error in context and can act on it.
      return;
    } finally {
      setSubmitting(false);
    }
    setModal(null);
  };

  return (
    <div className="rpt-root">
      <Sidebar active="Reports and DepEd" />
      <main className="rpt-main">
        <Breadcrumb crumbs={[
          {label:"Reports and DepEd Compliance",onClick:onBack},
          {label:report.docId,onClick:onBack},
          {label:"Evaluate",green:true},
        ]}/>
        <div className="rpt-section-card" style={{maxWidth:780}}>
          <h3 className="rpt-section-card-title">Evaluate Report</h3>
          <div style={{fontSize:13,fontWeight:700,color:"#1a5c1a",margin:"20px 0 14px"}}>Submitted File</div>
          {(report.files||[report]).filter(f=>f.name||f.fileName).map(f=>{
            const name = f.name || f.fileName || "report";
            const ext  = name.split(".").pop().toLowerCase();
            const size = f.size ? (f.size > 1024*1024 ? `${(f.size/1024/1024).toFixed(1)} MB` : `${Math.round(f.size/1024)} KB`) : null;
            return (
              <div key={name} className="rpt-file-row" style={{alignItems:"flex-start",gap:14}}>
                <div className="rpt-file-left" style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <FileTypeBadge fileName={name}/>
                    <span className="rpt-file-name">{name}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,auto)",gap:"4px 20px",marginTop:6}}>
                    {[["Type", ext.toUpperCase()], size && ["Size", size], ["Status","Uploaded"]].filter(Boolean).map(([l,v])=>(
                      <div key={l} style={{display:"flex",flexDirection:"column",gap:2}}>
                        <span style={{fontSize:10,color:"#9aaa9a",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{l}</span>
                        <span style={{fontSize:12,color:"#1a5c1a",fontWeight:700}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <IBadge />
              </div>
            );
          })}
          <hr style={{border:"none",borderTop:"1px solid #f0f4f0",margin:"20px 0"}}/>
          <div style={{fontSize:13,fontWeight:700,color:"#1a5c1a",marginBottom:14}}>Evaluation</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:12,fontWeight:700,color:"#4a5e4a"}}>Comments / Suggestions</label>
            <textarea className="rpt-textarea" placeholder="Compose your evaluation here..." value={comment} onChange={e=>setComment(e.target.value)} rows={4} maxLength={500}/>
          </div>
          <hr style={{border:"none",borderTop:"1px solid #f0f4f0",margin:"20px 0"}}/>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <button className="rpt-btn rpt-btn--outline-cancel" onClick={onBack}><ICancel /> Cancel</button>
           <button className="rpt-btn rpt-btn--danger-ghost" onClick={()=>setModal("disapprove")}><IDisapprove /> Disapprove Report</button>
            {report.status !== "For Principal Approval" && (
              <button className="rpt-btn rpt-btn--primary" onClick={()=>setModal("approve")}><IApprove /> Approve Report</button>
            )}
          </div>
        </div>

        {modal && (
          <div className="rpt-modal-overlay">
            <div className="rpt-modal-box">
              <div className="rpt-modal-title"><IInfo/> Confirm {modal==="approve"?"Approval":"Disapproval"}</div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"#9aaa9a",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10,paddingBottom:8,borderBottom:"1px solid #f0f4f0"}}>Report Details</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px 16px"}}>
                  {[["File Name",report.fileName],["Submitted On",report.submittedOn],["Evaluated On",report.evaluatedOn]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:10.5,color:"#9aaa9a",fontWeight:500}}>{l}</span>
                      <span style={{fontSize:13,background:"#f4f6f4",borderRadius:6,padding:"7px 10px",color:"#111f11",fontWeight:500}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,color:"#9aaa9a",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10,paddingBottom:8,borderBottom:"1px solid #f0f4f0"}}>Feedback</div>
                <div style={{marginBottom:10}}><StatusBadge status={modal==="approve"?"Approved":"Disapproved"}/></div>
                <label style={{fontSize:10.5,color:"#9aaa9a",fontWeight:500,display:"block",marginBottom:6}}>Comments/Suggestions</label>
                <div style={{fontSize:13,background:"#f4f6f4",borderRadius:6,padding:"10px 12px",color:"#111f11",fontWeight:500,lineHeight:1.5}}>{comment||"No comment provided."}</div>
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
                    onClick={()=>setEvalError(null)}
                    style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",
                      color:"#dc2626",fontSize:16,lineHeight:1,padding:0,flexShrink:0}}
                    aria-label="Dismiss error">
                    ×
                  </button>
                </div>
              )}
              <div className="rpt-modal-actions">
                <button className="rpt-btn rpt-btn--outline-cancel" onClick={()=>{ setModal(null); setEvalError(null); }} disabled={submitting}><ICancel /> Cancel</button>
                {modal==="approve"
                  ? <button className="rpt-btn rpt-btn--primary" onClick={confirmAction} disabled={submitting}>
                      {submitting?<span className="rpt-spinner" style={{width:14,height:14,borderTopColor:"#fff"}}/>:<IForward/>}
                      {submitting?"Processing…":"Forward to Principal"}
                    </button>
                  : <button className="rpt-btn rpt-btn--danger-ghost" style={{background:"#dc2626",color:"#fff",borderColor:"#dc2626"}} onClick={confirmAction} disabled={submitting}>
                      {submitting?<span className="rpt-spinner" style={{width:14,height:14,borderTopColor:"#fff"}}/>:<IDisapprove/>}
                      {submitting?"Processing…":"Confirm Disapprove"}
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