// src/pages/Principal/Enrollment.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../Components/Sidebar";
import EnrollmentErrorBoundary from "../../Components/EnrollmentErrorBoundary";
import { Toast, ConfirmModal, Modal, ModalHeader, ModalBody, ModalFooter,
         Breadcrumb, SearchInput, DataTable, FormInput, FormSelect,
         InfoCard, InfoField, Badge } from "../../Components/ui";
import * as enrollmentService from "../../services/Principal/enrollmentService";
import { validateEnrollees, validateEnrollee, getEnrolleeName, getEnrolleeGrade, getEnrolleeStatus } from "../../utils/enrollmentValidation";
import { isArchived } from "../../utils/archive";
import "../../Css/Admin/Enrollment.css";

/* ══════════════════════════════════════════════════════════════
   DEFAULT / SEED DATA
   ══════════════════════════════════════════════════════════════ */
const GRADE_LEVELS = ["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const PALETTE      = ["#1a5c1a","#2a7a2a","#c4920a","#1d4ed8","#7c3aed","#dc2626","#0891b2","#db2777"];
const PAGE_SIZE    = 8;
const getInitials  = name => name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
const getAvatarBg  = name => PALETTE[name.charCodeAt(0)%PALETTE.length];

const generateDefaultEnrollees = () => {
  const fn=["John Jay","Maria","Jose","Ana","Pedro","Rosa","Carlo","Liza","Marco","Jenny","Renz","Carla","Alvin","Bea","Dan"];
  const ln=["Doe","Santos","Bautista","Cruz","Garcia","Villanueva","Reyes","Tan","Lim","Torres","Rivera","Mendoza","Flores","Ramos","Aquino"];
  return Array.from({length:40},(_,i)=>({
    id:String(100000+i+1), learnerId:String(200000+i+1),
    firstName:fn[i%fn.length], middleName:"Simon", lastName:ln[i%ln.length],
    gradeLevel:GRADE_LEVELS[i%GRADE_LEVELS.length],
    email:`${fn[i%fn.length].toLowerCase().replace(" ",".")}@example.com`,
    phone:`091${String(20000000+i).slice(0,8)}`, dob:"12-01-2008",
    country:"Philippines", city:"Matina, Davao City", postalCode:"8000",
    oldSchoolName:"Talomo National High School", oldSchoolType:"Public",
    oldSchoolId:"612345", oldSchoolAddress:"Brgy. Talomo Proper, Talomo, Davao City",
    status: i%7===2?"Archived": i%5===0?"Pending":"Active",
  }));
};

/* ══════════════════════════════════════════════════════════════
   API STATUS BANNER
   ══════════════════════════════════════════════════════════════ */
function ApiStatusBanner({ status, onRetry }) {
  const CONFIG = {
    loading:  { dot:"loading",  text:"Fetching enrollees from the server…" },
    success:  { dot:"success",  text:"Live data — connected to API successfully." },
    error:    { dot:"error",    text:"API unreachable — showing local default data." },
    fallback: { dot:"fallback", text:"Using default seed data (API not configured)." },
  };
  const c = CONFIG[status] || CONFIG.fallback;
  return (
    <div className={`api-status-banner api-status-banner--${status}`}>
      <span className={`api-status-dot api-status-dot--${c.dot}`}/>
      <span style={{flex:1}}>{c.text}</span>
      {status === "error" && (
        <button className="btn-retry" onClick={onRetry}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Retry
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SKELETON ROWS
   ══════════════════════════════════════════════════════════════ */
function SkeletonRows({ count = PAGE_SIZE }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i} className="skeleton-row">
      <td><span className="skeleton skeleton-cell" style={{width:16,height:16,display:"block"}}/></td>
      <td><span className="skeleton skeleton-cell" style={{width:"70%",display:"block"}}/></td>
      <td><span className="skeleton skeleton-cell" style={{width:"80%",display:"block"}}/></td>
      <td><span className="skeleton skeleton-cell" style={{width:"55%",display:"block"}}/></td>
      <td><span className="skeleton skeleton-cell" style={{width:60,borderRadius:999,display:"block"}}/></td>
      <td><span className="skeleton skeleton-cell" style={{width:100,display:"block",marginLeft:"auto"}}/></td>
    </tr>
  ));
}

/* ══════════════════════════════════════════════════════════════
   SKELETON VIEW
   ══════════════════════════════════════════════════════════════ */
function SkeletonView() {
  return (
    <>
      <div className="info-card" style={{marginBottom:16,display:"flex",alignItems:"center",gap:20}}>
        <span className="skeleton skeleton-avatar"/>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
          <span className="skeleton skeleton-text-lg" style={{width:"45%",display:"block"}}/>
          <span className="skeleton skeleton-text-sm" style={{width:"25%",display:"block"}}/>
          <span className="skeleton skeleton-text-sm" style={{width:"30%",display:"block"}}/>
        </div>
        <span className="skeleton" style={{width:80,height:34,borderRadius:6,display:"block"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {[1,2,3,4].map(n=>(
          <div key={n} className="info-card">
            <span className="skeleton skeleton-text-sm" style={{width:"40%",display:"block",marginBottom:14}}/>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[1,2,3].map(x=>(
                <span key={x} className="skeleton skeleton-cell" style={{width:`${60+x*10}%`,display:"block"}}/>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   VIEW  (read-only — no Edit button for principal)
   ══════════════════════════════════════════════════════════════ */
function EnrolleeView({ enrollee, onBack, onApprove, onReject, onArchive }) {
  const [confirmAction, setConfirmAction] = useState(null);

  if (!enrollee) {
    return (
      <div style={{ padding:"20px", textAlign:"center", color:"#C62828" }}>
        <p>Error: Enrollee data is invalid or missing.</p>
        <button className="btn btn-outline" onClick={onBack}>Back to List</button>
      </div>
    );
  }

  const fullName   = getEnrolleeName(enrollee, "Unknown Student");
  const gradeLevel = getEnrolleeGrade(enrollee, "N/A");
  const isPending  = enrollee.status === "Pending";
  const isActive   = enrollee.status === "Active";

  const CONFIRM_CONFIG = {
    approve: {
      title:"Approve Enrollment?",
      body:"This will mark the enrollee as Active and notify them of their acceptance.",
      confirmLabel:"Yes, Approve", danger:false,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green-700)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
      handler:()=>onApprove([enrollee.id]),
    },
    reject: {
      title:"Reject Enrollment?",
      body:"This will reject the enrollment application. The enrollee will be notified.",
      confirmLabel:"Yes, Reject", danger:true,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
      handler:()=>onReject([enrollee.id]),
    },
    archive: {
      title:"Are you sure?",
      body:"Archiving this will hide it from the main list, but you can access it later in your archive.",
      confirmLabel:"Yes, Archive", danger:true,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
      handler:()=>onArchive([enrollee.id]),
    },
  };

  return (
    <>
      <Breadcrumb parts={[{label:"Enrollment",onClick:onBack},{label:enrollee.learnerId||"Unknown"}]}/>
      <div className="info-card" style={{marginBottom:16,display:"flex",alignItems:"center",gap:20}}>
        <div style={{
          width:72,height:72,borderRadius:"50%",background:getAvatarBg(enrollee.firstName||"?"),
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:22,fontWeight:800,color:"#fff",flexShrink:0,
        }}>
          {getInitials(`${enrollee.firstName||""} ${enrollee.lastName||""}`)}
        </div>
        <div>
          <h2 style={{fontSize:20,fontWeight:800,color:"var(--green-800)",margin:"0 0 4px"}}>{fullName}</h2>
          <p style={{fontSize:13,color:"var(--gray-500)",margin:"0 0 2px"}}>{gradeLevel} pupil</p>
          <p style={{fontSize:13,color:"var(--gray-400)",margin:0}}>{enrollee.city||"—"}</p>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          {(isPending||isActive) && (
            <button className="btn btn-danger" onClick={()=>setConfirmAction("archive")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
              Archive
            </button>
          )}
          {isPending && (
            <>
              <button
                className="btn btn-outline"
                style={{borderColor:"var(--red-500)",color:"var(--red-600)"}}
                onClick={()=>setConfirmAction("reject")}
              >
                Reject
              </button>
              <button className="btn btn-primary" onClick={()=>setConfirmAction("approve")}>
                Approve
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <InfoCard title="Personal Information">
          <div className="form-grid-3" style={{marginBottom:16}}>
            <InfoField label="First Name"  value={enrollee.firstName||"—"}/>
            <InfoField label="Middle Name" value={enrollee.middleName||"—"}/>
            <InfoField label="Last Name"   value={enrollee.lastName||"—"}/>
          </div>
          <div className="form-grid-3">
            <InfoField label="Email"         value={enrollee.email||"—"}/>
            <InfoField label="Phone"         value={enrollee.phone||"—"}/>
            <InfoField label="Date of Birth" value={enrollee.dob||"—"}/>
          </div>
        </InfoCard>
        <InfoCard title="Address">
          <div className="form-grid-3">
            <InfoField label="Country"     value={enrollee.country||"—"}/>
            <InfoField label="City"        value={enrollee.city||"—"}/>
            <InfoField label="Postal Code" value={enrollee.postalCode||"—"}/>
          </div>
        </InfoCard>
        <InfoCard title="Old School Information">
          <div className="form-grid-3" style={{marginBottom:16}}>
            <InfoField label="School Name" value={enrollee.oldSchoolName||"—"}/>
            <InfoField label="School Type" value={enrollee.oldSchoolType||"—"}/>
            <InfoField label="School ID"   value={enrollee.oldSchoolId||"—"}/>
          </div>
          <InfoField label="School Address" value={enrollee.oldSchoolAddress||"—"}/>
        </InfoCard>
        <InfoCard title="Attachments">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <p style={{fontSize:13,fontWeight:700,color:"var(--gray-900)",margin:"0 0 2px"}}>Birth Cert.pdf</p>
              <p style={{fontSize:12,color:"var(--green-800)",margin:0}}>8.77 MB</p>
            </div>
            <div style={{width:28,height:28,borderRadius:"50%",background:"var(--green-800)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
        </InfoCard>
      </div>

      {confirmAction && (() => {
        const cfg = CONFIRM_CONFIG[confirmAction];
        return (
          <ConfirmModal
            title={cfg.title} danger={cfg.danger}
            body={cfg.body} confirmLabel={cfg.confirmLabel} cancelLabel="No, Cancel"
            icon={cfg.icon}
            onCancel={()=>setConfirmAction(null)}
            onConfirm={()=>{ setConfirmAction(null); cfg.handler(); onBack(); }}
          />
        );
      })()}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   LIST
   ══════════════════════════════════════════════════════════════ */
function EnrolleeList({ enrollees, isLoading, apiStatus, onRetry, onView, onApprove, onReject, onArchive }) {
  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState([]);
  const [bulkAction, setBulkAction] = useState(null);
  const [rowAction,  setRowAction]  = useState(null);
  const [activeTab,  setActiveTab]  = useState("enrolled");

  const active   = enrollees.filter(e => !isArchived(e.status));
  const archived = enrollees.filter(e => isArchived(e.status));

  const currentPool = activeTab === "enrolled" ? active : archived;
  const filtered = currentPool.filter(e =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    e.learnerId.includes(search)
  );
  const paginated = filtered;

  const selectedHasPending = selected.some(id => {
    const e = enrollees.find(x => x.id === id);
    return e?.status === "Pending";
  });

  const columns = [
    { key:"learnerId", label:"Learner ID",   bold:true, link:true },
    { key:"_name",     label:"Learner Name", bold:true, render:r=>`${r.firstName} ${r.lastName}` },
    { key:"gradeLevel",label:"Grade Level",  muted:true },
    { key:"status",    label:"Status",       render:r=><Badge status={r.status}/> },
  ];

  const BULK_CONFIRM_CONFIG = {
    approve: {
      title:"Approve Selected?",
      body:`This will approve ${selected.length} enrollment(s) and mark them as Active.`,
      confirmLabel:"Yes, Approve All", danger:false,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green-700)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
    },
    reject: {
      title:"Reject Selected?",
      body:`This will reject ${selected.length} enrollment application(s).`,
      confirmLabel:"Yes, Reject All", danger:true,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    },
    archive: {
      title:"Are you sure?",
      body:"Archiving these will hide them from the main list, but you can access them later in your archive.",
      confirmLabel:"Yes, Archive", danger:true,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    },
  };

  const ROW_CONFIRM_CONFIG = {
    approve: {
      title:"Approve Enrollment?",
      body:"This will mark the enrollee as Active and notify them of their acceptance.",
      confirmLabel:"Yes, Approve", danger:false,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green-700)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
    },
    reject: {
      title:"Reject Enrollment?",
      body:"This will reject the enrollment application. The enrollee will be notified.",
      confirmLabel:"Yes, Reject", danger:true,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    },
    archive: {
      title:"Are you sure?",
      body:"Archiving this will hide it from the main list, but you can access it later in your archive.",
      confirmLabel:"Yes, Archive", danger:true,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    },
  };

  return (
    <>
      <div style={{marginBottom:24}}>
        <h1 className="page-title">Enrollment</h1>
        <p className="page-subtitle">Review and manage enrollment applications.</p>
      </div>

      {/* ── Tabs — uses CSS classes from Enrollment.css, no inline <style> ── */}
      <div className="db-tabs">
        {[
          { id:"enrolled", label:"Enrolled" },
          { id:"archived", label:"Archived" },
        ].map(tab => (
          <button
            key={tab.id}
            className={`db-tab${activeTab === tab.id ? " active" : ""}`}
            onClick={()=>{ setActiveTab(tab.id); setSearch(""); setSelected([]); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ApiStatusBanner status={apiStatus} onRetry={onRetry}/>

      {/* ══ ENROLLED TAB ══ */}
      {activeTab === "enrolled" && <>
        <div className="toolbar">
          <SearchInput value={search} onChange={e=>setSearch(e.target.value)}/>
          <button className="btn btn-outline">Filters</button>
          <div className="toolbar-spacer"/>
          {selected.length > 0 && (
            <>
              {selectedHasPending && (
                <>
                  <button
                    className="btn btn-outline"
                    style={{borderColor:"var(--red-500)",color:"var(--red-600)"}}
                    onClick={()=>setBulkAction("reject")}
                  >
                    Reject ({selected.length})
                  </button>
                  <button className="btn btn-primary" onClick={()=>setBulkAction("approve")}>
                    Approve ({selected.length})
                  </button>
                </>
              )}
              <button className="btn btn-danger" onClick={()=>setBulkAction("archive")}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
                Archive ({selected.length})
              </button>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{width:36}}/><th>Learner ID</th><th>Learner Name</th>
                  <th>Grade Level</th><th>Status</th><th/>
                </tr>
              </thead>
              <tbody><SkeletonRows/></tbody>
            </table>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={paginated}
            selected={selected}
            onToggleAll={()=>setSelected(paginated.every(r=>selected.includes(r.id))?[]:paginated.map(r=>r.id))}
            onToggleOne={id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])}
            onRowClick={onView}
            renderActions={row => {
              const isPending = row.status === "Pending";
              return (
                <div className="action-btn-group">
                  <button
                    className="action-btn action-btn--danger"
                    onClick={e=>{ e.stopPropagation(); setRowAction({type:"archive",id:row.id}); }}
                    title="Archive"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                    </svg>
                    <span>Archive</span>
                  </button>
                  {isPending && (
                    <>
                      <button
                        className="action-btn"
                        style={{color:"var(--red-600)",borderColor:"#fca5a5",background:"var(--red-50)"}}
                        onClick={e=>{ e.stopPropagation(); setRowAction({type:"reject",id:row.id}); }}
                        title="Reject"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        <span>Reject</span>
                      </button>
                      <button
                        className="action-btn action-btn--edit"
                        style={{color:"var(--green-800)",borderColor:"#86efac",background:"var(--green-50)"}}
                        onClick={e=>{ e.stopPropagation(); setRowAction({type:"approve",id:row.id}); }}
                        title="Approve"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>Approve</span>
                      </button>
                    </>
                  )}
                </div>
              );
            }}
          />
        )}
      </>}

      {/* ══ ARCHIVED TAB ══ */}
      {activeTab === "archived" && <>
        <div className="toolbar">
          <SearchInput value={search} onChange={e=>setSearch(e.target.value)}/>
          <button className="btn btn-outline">Filters</button>
          <div className="toolbar-spacer"/>
        </div>

        {isLoading ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{width:36}}/><th>Learner ID</th><th>Learner Name</th>
                  <th>Grade Level</th><th>Status</th><th/>
                </tr>
              </thead>
              <tbody><SkeletonRows/></tbody>
            </table>
          </div>
        ) : paginated.length === 0 ? (
          <div style={{textAlign:"center",padding:"48px 0",color:"var(--gray-400)",fontSize:13}}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginBottom:10,opacity:0.4}}>
              <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
            <p style={{margin:0}}>No archived records found.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={paginated}
            selected={[]}
            onToggleAll={()=>{}}
            onToggleOne={()=>{}}
            onRowClick={onView}
            renderActions={()=>null}
          />
        )}
      </>}

      {/* ── Row confirm ── */}
      {rowAction && (() => {
        const cfg = ROW_CONFIRM_CONFIG[rowAction.type];
        return (
          <ConfirmModal
            title={cfg.title} danger={cfg.danger}
            body={cfg.body} confirmLabel={cfg.confirmLabel} cancelLabel="No, Cancel"
            icon={cfg.icon}
            onCancel={()=>setRowAction(null)}
            onConfirm={()=>{
              if (rowAction.type==="approve") onApprove([rowAction.id]);
              else if (rowAction.type==="reject") onReject([rowAction.id]);
              else onArchive([rowAction.id]);
              setSelected([]);
              setRowAction(null);
            }}
          />
        );
      })()}

      {/* ── Bulk confirm ── */}
      {bulkAction && (() => {
        const cfg = BULK_CONFIRM_CONFIG[bulkAction];
        return (
          <ConfirmModal
            title={cfg.title} danger={cfg.danger}
            body={cfg.body} confirmLabel={cfg.confirmLabel} cancelLabel="No, Cancel"
            icon={cfg.icon}
            onCancel={()=>setBulkAction(null)}
            onConfirm={()=>{
              if (bulkAction==="approve") onApprove(selected);
              else if (bulkAction==="reject") onReject(selected);
              else onArchive(selected);
              setSelected([]);
              setBulkAction(null);
            }}
          />
        );
      })()}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════════════ */
function EnrollmentPrincipalContent() {
  const [enrollees,     setEnrollees]     = useState(generateDefaultEnrollees);
  const [view,          setView]          = useState("list");
  const [target,        setTarget]        = useState(null);
  const [toast,         setToast]         = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [apiStatus,     setApiStatus]     = useState("loading");
  const isMountedRef = useRef(true);

  useEffect(()=>()=>{ isMountedRef.current=false; },[]);

  const fetchEnrollees = useCallback(async () => {
    try {
      setApiStatus("loading");
      const { data, ok } = await enrollmentService.listEnrollees();
      if (!isMountedRef.current) return;
      if (ok && data) {
        const validatedData = validateEnrollees(data, []);
        setEnrollees(validatedData);
        setApiStatus("success");
      } else { throw new Error("API returned invalid response"); }
    } catch (err) {
      if (!isMountedRef.current) return;
      setEnrollees(generateDefaultEnrollees());
      setApiStatus("error");
    }
  }, []);

  useEffect(()=>{ fetchEnrollees(); },[]);

  const goList    = () => { setView("list"); setTarget(null); setMutationError(null); };
  const showToast = msg => setToast(msg);

  const handleApprove = async (ids) => {
    try {
      const arr = Array.isArray(ids) ? ids : [ids];
      setEnrollees(e=>e.map(x=>arr.includes(x.id)?{...x,status:"Active"}:x));
      const { ok } = arr.length===1
        ? await enrollmentService.approveEnrollee(arr[0])
        : await enrollmentService.bulkApproveEnrollees(arr);
      if (!isMountedRef.current) return;
      if (ok) showToast(arr.length>1?`${arr.length} enrollees approved`:"Enrollee successfully approved");
      else throw new Error("Failed to approve");
    } catch (err) {
      if (!isMountedRef.current) return;
      setMutationError(err.message||"Failed to approve enrollees");
      showToast(err.message||"Failed to approve enrollees");
      fetchEnrollees();
    }
  };

  const handleReject = async (ids) => {
    try {
      const arr = Array.isArray(ids) ? ids : [ids];
      setEnrollees(e=>e.map(x=>arr.includes(x.id)?{...x,status:"Rejected"}:x));
      const { ok } = arr.length===1
        ? await enrollmentService.rejectEnrollee(arr[0])
        : await enrollmentService.bulkRejectEnrollees(arr);
      if (!isMountedRef.current) return;
      if (ok) showToast(arr.length>1?`${arr.length} enrollees rejected`:"Enrollee successfully rejected");
      else throw new Error("Failed to reject");
    } catch (err) {
      if (!isMountedRef.current) return;
      setMutationError(err.message||"Failed to reject enrollees");
      showToast(err.message||"Failed to reject enrollees");
      fetchEnrollees();
    }
  };

  const handleArchive = async (ids) => {
    try {
      const arr = Array.isArray(ids) ? ids : [ids];
      setEnrollees(e=>e.map(x=>arr.includes(x.id)?{...x,status:"Archived"}:x));
      const { ok } = arr.length===1
        ? await enrollmentService.archiveEnrollee(arr[0])
        : await enrollmentService.bulkArchiveEnrollees(arr);
      if (!isMountedRef.current) return;
      if (ok) showToast(arr.length>1?`${arr.length} enrollees archived`:"Enrollee successfully archived");
      else throw new Error("Failed to archive");
    } catch (err) {
      if (!isMountedRef.current) return;
      setMutationError(err.message||"Failed to archive enrollees");
      showToast(err.message||"Failed to archive enrollees");
      fetchEnrollees();
    }
  };

  const isLoading = apiStatus === "loading";

  return (
    <div className="page-layout">
      <Sidebar role="principal"/>
      <main id="main-content" className="page-main">
        <div className="page-body">

          {/* Mutation error — inline dismissable, no duplicate fetch-error banner */}
          {mutationError && (
            <div style={{padding:"12px 16px",background:"#FFEBEE",borderRadius:"8px",marginBottom:"16px",border:"1px solid #EF9A9A",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <p style={{color:"#C62828",fontWeight:600,margin:0,fontSize:13}}>⚠️ {mutationError}</p>
              <button className="btn btn-outline" onClick={()=>setMutationError(null)} style={{fontSize:12,padding:"4px 10px"}}>
                Dismiss
              </button>
            </div>
          )}

          {view === "list" && (
            <EnrolleeList
              enrollees={enrollees}
              isLoading={isLoading}
              apiStatus={apiStatus}
              onRetry={fetchEnrollees}
              onView={e=>{ setTarget(e); setView("view"); }}
              onApprove={handleApprove}
              onReject={handleReject}
              onArchive={handleArchive}
            />
          )}

          {view === "view" && (
            isLoading
              ? <SkeletonView/>
              : <EnrolleeView
                  enrollee={target}
                  onBack={goList}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onArchive={handleArchive}
                />
          )}

        </div>
      </main>
      {toast && <Toast message={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}

export default function EnrollmentPrincipal() {
  return (
    <EnrollmentErrorBoundary>
      <EnrollmentPrincipalContent/>
    </EnrollmentErrorBoundary>
  );
}