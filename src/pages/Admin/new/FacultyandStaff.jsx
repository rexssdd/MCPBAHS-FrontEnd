// src/pages/Admin/FacultyandStaff.jsx
// ── RPMS CHANGES (search "RPMS CHANGE" to find every addition) ──────────────
//  1. import RpmsModal
//  2. rpmsTarget state in FacultyandStaffPage
//  3. onRpms prop on FacultyList → renders RPMS action button per row
//  4. onRpms prop on FacultyView → renders RPMS button in profile header
//  5. <RpmsModal> rendered at bottom of page-layout
// ────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../Components/Sidebar";
import FacultyErrorBoundary from "../../Components/FacultyErrorBoundary";
import { Toast, ConfirmModal, Modal, ModalHeader, ModalBody, ModalFooter,
         Breadcrumb, Pagination, SearchInput, DataTable, FormInput, FormSelect, CountryField,
         InfoCard, InfoField, Badge } from "../../Components/ui";
import * as facultyService from "../../services/Admin/FacultyAndStaff/facultyAndStaffService";
import { validateFacultyList, validateFaculty, sanitizeFaculty,
         getFacultyFullName, getFacultyRole, getFacultyCity } from "../../utils/facultyValidation";
// RPMS CHANGE 1 ─────────────────────────────────────────────────────────────
import RpmsModal from "../../Components/RPMS/RpmsModal";
// ────────────────────────────────────────────────────────────────────────────
import "../../Css/Admin/FacultyAndStaff.css";

const USE_API = true;
const PALETTE    = ["#1a5c1a","#2a7a2a","#c4920a","#1d4ed8","#7c3aed","#dc2626","#0891b2","#db2777"];
const STATUSES   = ["Active","On Leave","Inactive"];
const ROLES_LIST = ["Teacher","Non-Teaching"];
const getAvatarBg = name => PALETTE[name.charCodeAt(0) % PALETTE.length];
const getInitials = name => name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();

const MOCK_FACULTY = [
  { id:"123456", firstName:"John Jay", middleName:"Simon",   lastName:"Doe",        role:"Teacher",      city:"Matina, Davao City",   postalCode:"8000", country:"Philippines", contact:"09123456789", email:"johnjaydoe@example.com",       dob:"12-01-1999", status:"Active",   teachingLoad:[{subject:"Science",  section:"Grade 9 - Gumamela",    timeslot:"Mon-Wed 10-11am"}], advisory:{section:"Grade 9 - Gumamela",    students:30} },
  { id:"234567", firstName:"Maria",    middleName:"Cruz",    lastName:"Santos",     role:"Teacher",      city:"Buhangin, Davao City", postalCode:"8000", country:"Philippines", contact:"09198765432", email:"maria.santos@deped.gov.ph",    dob:"03-15-1985", status:"Active",   teachingLoad:[{subject:"Math",     section:"Grade 8 - Sampaguita",  timeslot:"Tue-Thu 8-9am"}],   advisory:{section:"Grade 8 - Sampaguita",  students:35} },
  { id:"345678", firstName:"Jose",     middleName:"Reyes",   lastName:"Bautista",   role:"Non-Teaching", city:"Toril, Davao City",    postalCode:"8000", country:"Philippines", contact:"09171234567", email:"jose.bautista@deped.gov.ph",   dob:"07-22-1978", status:"On Leave", teachingLoad:[], advisory:null },
  { id:"456789", firstName:"Ana",      middleName:"Dela",    lastName:"Cruz",       role:"Teacher",      city:"Calinan, Davao City",  postalCode:"8000", country:"Philippines", contact:"09209876543", email:"ana.delacruz@deped.gov.ph",    dob:"11-05-1990", status:"Active",   teachingLoad:[{subject:"English",  section:"Grade 10 - Rosal",      timeslot:"Mon-Fri 1-2pm"}],   advisory:{section:"Grade 10 - Rosal",      students:38} },
  { id:"567890", firstName:"Pedro",    middleName:"Lim",     lastName:"Garcia",     role:"Teacher",      city:"Mintal, Davao City",   postalCode:"8000", country:"Philippines", contact:"09151234321", email:"pedro.garcia@deped.gov.ph",    dob:"05-18-1982", status:"Active",   teachingLoad:[{subject:"Filipino", section:"Grade 7 - Ilang-Ilang", timeslot:"Wed-Fri 9-10am"}],  advisory:{section:"Grade 7 - Ilang-Ilang", students:32} },
  { id:"678901", firstName:"Rosa",     middleName:"Mendoza", lastName:"Villanueva", role:"Non-Teaching", city:"Talomo, Davao City",   postalCode:"8000", country:"Philippines", contact:"09186543210", email:"rosa.villanueva@deped.gov.ph", dob:"09-30-1975", status:"Active",   teachingLoad:[], advisory:null },
];

const EMPTY_FORM = { firstName:"", middleName:"", lastName:"", role:"Teacher", city:"", postalCode:"", country:"Philippines", contact:"", email:"", dob:"", status:"Active" };

const validateFacultyForm = (form) => {
  const required = ["firstName","middleName","lastName","email","contact","dob","country","city","postalCode","role","status"];
  if (!form || typeof form !== "object") return false;
  return required.every(k => typeof form[k] === "string" && form[k].trim().length > 0)
    && ["Teacher","Non-Teaching"].includes(form.role)
    && ["Active","On Leave","Inactive"].includes(form.status);
};

function TableSkeleton({ rows=6 }) {
  return (
    <div style={{background:"#fff",borderRadius:"12px",border:"1px solid var(--gray-200,#e5e7eb)",overflow:"hidden"}}>
      <div className="skeleton-row" style={{borderBottom:"2px solid var(--gray-100,#f3f4f6)",paddingTop:"16px",paddingBottom:"16px"}}>
        <div className="skeleton skeleton-checkbox"/>
        {["80px","140px","100px","70px","80px"].map((w,i)=><div key={i} className="skeleton skeleton-cell" style={{width:w}}/>)}
      </div>
      {Array.from({length:rows}).map((_,i)=>(
        <div className="skeleton-row" key={i}>
          <div className="skeleton skeleton-checkbox"/><div className="skeleton skeleton-avatar"/>
          <div className="skeleton skeleton-cell skeleton-cell--id"/><div className="skeleton skeleton-cell skeleton-cell--name"/>
          <div className="skeleton skeleton-cell skeleton-cell--role"/><div className="skeleton skeleton-cell skeleton-cell--badge"/>
          <div className="skeleton skeleton-cell skeleton-cell--btn"/>
        </div>
      ))}
    </div>
  );
}

function ViewSkeleton() {
  const FieldRow = ({count=3}) => (
    <div className="skeleton-field-grid" style={{marginBottom:"16px"}}>
      {Array.from({length:count}).map((_,i)=>(
        <div key={i}><div className="skeleton skeleton-field-label"/><div className="skeleton skeleton-field-value"/></div>
      ))}
    </div>
  );
  return (
    <div>
      <div className="skeleton-card" style={{display:"flex",alignItems:"center",gap:"20px"}}>
        <div className="skeleton skeleton-avatar" style={{width:72,height:72,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div className="skeleton skeleton-cell" style={{width:"180px",height:"20px",marginBottom:"8px"}}/>
          <div className="skeleton skeleton-cell" style={{width:"100px",height:"14px",marginBottom:"6px"}}/>
          <div className="skeleton skeleton-cell" style={{width:"140px",height:"12px"}}/>
        </div>
        <div className="skeleton skeleton-cell skeleton-cell--btn" style={{marginLeft:"auto"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
        {[3,3,3,3].map((c,i)=>(
          <div className="skeleton-card" key={i}>
            <div className="skeleton skeleton-card-title" style={{marginBottom:"16px"}}/>
            <FieldRow count={c}/>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiStatusBanner({status,error,onRetry}) {
  if (!status) return null;
  const map = {
    fetching:{cls:"fetching",text:"Fetching data from API..."},
    success: {cls:"success", text:"Loaded from API successfully."},
    error:   {cls:"error",   text:`API unavailable - showing mock data. ${error??""}`},
  };
  const {cls,text} = map[status]??{};
  return (
    <div className={`api-status-banner ${cls}`}>
      <span className="api-status-dot"/>
      <span>{text}</span>
      {status==="error" && <button className="retry-btn" onClick={onRetry}>Retry</button>}
    </div>
  );
}

const IconTrash = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>);
const IconEdit  = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
// RPMS CHANGE: bar-chart icon
const IconChart = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);

// RPMS CHANGE 3 - FacultyView accepts onRpms prop
function FacultyView({facultyId,facultyLocal,onBack,onEdit,onRpms}) {
  const [faculty,setFaculty]   = useState(facultyLocal??null);
  const [loading,setLoading]   = useState(false);
  const [apiState,setApiState] = useState(null);
  const [error,setError]       = useState(null);
  const isMountedRef           = useRef(true);
  useEffect(()=>{return ()=>{isMountedRef.current=false;};},[]);
  useEffect(()=>{
    if(!USE_API) return;
    (async()=>{
      try {
        setLoading(true);setApiState("fetching");setError(null);
        const {data,ok} = await facultyService.getFaculty(facultyId);
        if(!isMountedRef.current) return;
        if(ok&&data&&validateFaculty(data)){setFaculty(data);setApiState("success");}
        else throw new Error("Invalid faculty data from API");
      } catch(err) {
        if(!isMountedRef.current) return;
        setError(err.message||"Failed to load");setFaculty(facultyLocal);setApiState("error");
      } finally {
        if(isMountedRef.current) setLoading(false);
      }
    })();
  },[facultyId]);

  if(loading) return (<><Breadcrumb parts={[{label:"Faculty and Staff",onClick:onBack},{label:"..."}]}/><ApiStatusBanner status="fetching"/><ViewSkeleton/></>);
  if(!faculty) return (<><Breadcrumb parts={[{label:"Faculty and Staff",onClick:onBack}]}/><div style={{padding:"20px",textAlign:"center",color:"#C62828"}}><p>Faculty data invalid or missing.</p><button className="btn btn-outline" onClick={onBack}>Back</button></div></>);

  const fullName = getFacultyFullName(faculty,"Unknown Faculty");
  return (
    <>
      <Breadcrumb parts={[{label:"Faculty and Staff",onClick:onBack},{label:faculty.id||"Unknown"}]}/>
      {error&&<ApiStatusBanner status="error" error={error}/>}
      <ApiStatusBanner status={apiState}/>
      <div className="info-card" style={{marginBottom:"16px",display:"flex",alignItems:"center",gap:"20px"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:getAvatarBg(fullName),display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",fontWeight:800,color:"#fff",flexShrink:0}}>
          {getInitials(fullName)}
        </div>
        <div>
          <h2 style={{fontSize:"20px",fontWeight:800,color:"var(--green-800)",margin:"0 0 4px"}}>{fullName}</h2>
          <p style={{fontSize:"13px",color:"var(--gray-500)",margin:"0 0 2px"}}>{getFacultyRole(faculty)}</p>
          <p style={{fontSize:"13px",color:"var(--gray-400)",margin:0}}>{getFacultyCity(faculty)}</p>
        </div>
        {/* RPMS CHANGE 4: RPMS button in profile header */}
        <div style={{marginLeft:"auto",display:"flex",gap:"10px"}}>
          <button className="btn btn-outline" onClick={()=>onRpms(faculty)}>
            <IconChart/> RPMS Report
          </button>
          <button className="btn btn-primary" onClick={()=>onEdit(faculty)}>Edit</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
        <InfoCard title="Personal Information">
          <div className="form-grid-3" style={{marginBottom:"16px"}}>
            <InfoField label="First Name"  value={faculty.firstName ||"--"}/>
            <InfoField label="Middle Name" value={faculty.middleName||"--"}/>
            <InfoField label="Last Name"   value={faculty.lastName  ||"--"}/>
          </div>
          <div className="form-grid-3">
            <InfoField label="Email"         value={faculty.email  ||"--"}/>
            <InfoField label="Phone Number"  value={faculty.contact||"--"}/>
            <InfoField label="Date of Birth" value={faculty.dob    ||"--"}/>
          </div>
        </InfoCard>
        <InfoCard title="Address">
          <div className="form-grid-3">
            <InfoField label="Country"     value={faculty.country   ||"--"}/>
            <InfoField label="City"        value={faculty.city      ||"--"}/>
            <InfoField label="Postal Code" value={faculty.postalCode||"--"}/>
          </div>
        </InfoCard>
        <InfoCard title="Teaching Load">
          {!faculty.teachingLoad||faculty.teachingLoad.length===0
            ?<p style={{color:"var(--gray-400)",fontSize:"13px"}}>No teaching load assigned.</p>
            :faculty.teachingLoad.map((t,i)=>(
              <div key={i} style={{marginBottom:"12px",padding:"12px",background:"var(--gray-50)",borderRadius:"8px",border:"1px solid var(--gray-200)"}}>
                <p style={{fontWeight:700,color:"var(--gray-900)",margin:"0 0 4px",fontSize:"13px"}}>{t.subject||"--"}</p>
                <p style={{fontSize:"12px",color:"var(--gray-500)",margin:"0 0 2px"}}>{t.section||"--"}</p>
                <p style={{fontSize:"12px",color:"var(--gray-400)",margin:0}}>{t.timeslot||"--"}</p>
              </div>
            ))
          }
        </InfoCard>
        <InfoCard title="Advisory Class">
          {faculty.advisory
            ?<div style={{padding:"16px",background:"var(--green-50)",borderRadius:"8px",border:"1px solid var(--green-200)"}}>
               <InfoField label="Section"         value={faculty.advisory.section||"--"}/>
               <InfoField label="No. of Students" value={String(faculty.advisory.students??"--")}/>
             </div>
            :<p style={{color:"var(--gray-400)",fontSize:"13px"}}>No advisory class assigned.</p>
          }
        </InfoCard>
      </div>
    </>
  );
}

function FacultyForm({initial,mode,onSave,onCancel}) {
  const [form,setForm]         = useState(initial?{firstName:initial.firstName,middleName:initial.middleName,lastName:initial.lastName,role:initial.role,city:initial.city,postalCode:initial.postalCode,country:"Philippines",contact:initial.contact,email:initial.email,dob:initial.dob,status:initial.status}:{...EMPTY_FORM});
  const [preview,setPreview]   = useState(false);
  const [saving,setSaving]     = useState(false);
  const [saveError,setSaveError]=useState(null);
  const [apiError,setApiError] = useState(null);
  const isMountedRef           = useRef(true);
  useEffect(()=>{return ()=>{isMountedRef.current=false;};},[]);
  const set = k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const isEdit = mode==="edit";
  const breadParts = isEdit
    ?[{label:"Faculty and Staff",onClick:onCancel},{label:initial.id},{label:"Edit"}]
    :[{label:"Faculty and Staff",onClick:onCancel},{label:"Add"}];
  const handleConfirm = async()=>{
    setSaveError(null);setApiError(null);
    if(!validateFacultyForm(form)){setSaveError("Please complete all required fields.");return;}
    const payload = sanitizeFaculty({...form,id:initial?.id});
    if(!USE_API){onSave(payload,null);setPreview(false);return;}
    setSaving(true);
    try {
      const response = isEdit?await facultyService.updateFaculty(initial.id,payload):await facultyService.createFaculty(payload);
      if(!isMountedRef.current) return;
      if(response.ok&&response.data){onSave(payload,response.data);setPreview(false);}
      else throw new Error(response.error||"Failed to save faculty record.");
    } catch(err) {
      if(!isMountedRef.current) return;
      setApiError(err.message||"Failed to save.");setSaveError(err.message||"Failed to save.");
    } finally {if(isMountedRef.current) setSaving(false);}
  };
  return (
    <>
      <Breadcrumb parts={breadParts}/>
      {(saveError||apiError)&&<div className="api-status-banner error" style={{marginBottom:"16px"}}><span className="api-status-dot"/><span>{saveError||apiError}</span></div>}
      <div className="form-card">
        <div><h2 className="form-section-title">{isEdit?"Edit Faculty":"Add Faculty"}</h2><div className="form-divider"/></div>
        <div>
          <h3 className="form-section-title" style={{fontSize:"13px"}}>Personal Information</h3>
          <div className="form-grid-3" style={{marginBottom:"16px"}}>
            <FormInput label="First Name"  value={form.firstName}  onChange={set("firstName")}  placeholder="First Name"/>
            <FormInput label="Middle Name" value={form.middleName} onChange={set("middleName")} placeholder="Middle Name"/>
            <FormInput label="Last Name"   value={form.lastName}   onChange={set("lastName")}   placeholder="Last Name"/>
          </div>
          <div className="form-grid-3">
            <FormInput label="Email"         value={form.email}   onChange={set("email")}   placeholder="email@example.com"/>
            <FormInput label="Phone Number"  value={form.contact} onChange={set("contact")} placeholder="09XX XXX XXXX"/>
            <FormInput label="Date of Birth" value={form.dob}     onChange={set("dob")}     placeholder="MM-DD-YYYY"/>
          </div>
        </div>
        <div className="form-divider"/>
        <div>
          <h3 className="form-section-title" style={{fontSize:"13px"}}>Address</h3>
          <div className="form-grid-3">
            <CountryField value={form.country || "Philippines"} />
            <FormInput label="City"        value={form.city}       onChange={set("city")}       placeholder="City"/>
            <FormInput label="Postal Code" value={form.postalCode} onChange={set("postalCode")} placeholder="0000"/>
          </div>
        </div>
        <div className="form-divider"/>
        <div>
          <h3 className="form-section-title" style={{fontSize:"13px"}}>Role & Status</h3>
          <div className="form-grid-3">
            <FormSelect label="Role"   value={form.role}   onChange={set("role")}   options={ROLES_LIST}/>
            <FormSelect label="Status" value={form.status} onChange={set("status")} options={STATUSES}/>
          </div>
        </div>
        <div className="form-divider"/>
        <div style={{display:"flex",justifyContent:"flex-end",gap:"10px"}}>
          <button className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>setPreview(true)} disabled={saving}>{saving?"Saving...":isEdit?"Save Changes":"Add Faculty"}</button>
        </div>
      </div>
      {preview&&(
        <Modal size="lg" onClose={()=>setPreview(false)}>
          <ModalHeader icon={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}>Preview</ModalHeader>
          <ModalBody>
            <p style={{fontWeight:600,color:"var(--gray-700)",marginBottom:"12px",fontSize:"13px"}}>Personal Information</p>
            <div className="form-grid-3" style={{marginBottom:"16px"}}>
              {[["First Name",form.firstName],["Last Name",form.lastName],["Date of Birth",form.dob],["Email",form.email],["Phone",form.contact],["Role",form.role]].map(([l,v])=>(
                <div key={l}><p className="info-field-label">{l}</p><div className="form-input" style={{cursor:"default"}}>{v||"--"}</div></div>
              ))}
            </div>
            <p style={{fontWeight:600,color:"var(--gray-700)",marginBottom:"12px",fontSize:"13px"}}>Address</p>
            <div className="form-grid-3">
              {[["Country",form.country],["City",form.city],["Postal Code",form.postalCode]].map(([l,v])=>(
                <div key={l}><p className="info-field-label">{l}</p><div className="form-input" style={{cursor:"default"}}>{v||"--"}</div></div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <button className="btn btn-outline" onClick={()=>setPreview(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={saving}>{saving?"Saving...":"Confirm"}</button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}

// RPMS CHANGE 3: FacultyList receives and threads onRpms
function FacultyList({faculty,loading,apiState,apiError,onRetry,onView,onEdit,onDelete,onArchive,onAdd,onRpms}) {
  const [search,setSearch]     = useState("");
  const [page,setPage]         = useState(1);
  const [selected,setSelected] = useState([]);
  const [delTarget,setDelTarget]=useState(null);
  const [activeTab,setActiveTab]=useState("active");
  const safeFaculty     = Array.isArray(faculty)?faculty:[];
  const activeFaculty   = safeFaculty.filter(f=>(f?.status||"Active")!=="Inactive");
  const archivedFaculty = safeFaculty.filter(f=>f?.status==="Inactive");
  const displayed       = activeTab==="archived"?archivedFaculty:activeFaculty;
  const searchTerm      = (search||"").trim().toLowerCase();
  const filtered        = displayed.filter(f=>{
    const name=getFacultyFullName(f,"").toLowerCase();
    const id=typeof f?.id==="string"?f.id:"";
    return name.includes(searchTerm)||id.includes(search.trim());
  });
  const paginated = filtered.slice((page-1)*10,page*10);
  const columns = [
    {key:"id",    label:"Staff ID",bold:true,link:true,render:r=>r?.id||"--"},
    {key:"_name", label:"Name",    bold:true,          render:r=>getFacultyFullName(r)},
    {key:"role",  label:"Role",    muted:true,         render:r=>getFacultyRole(r)},
    {key:"status",label:"Status",                      render:r=><Badge status={r?.status||"Inactive"}/>},
  ];
  return (
    <>
      <style>{`.db-tabs{display:flex;gap:0;background:var(--white);border:1px solid var(--border-card);border-radius:var(--r-lg);padding:4px;margin-bottom:var(--sp-lg);width:fit-content;box-shadow:var(--shadow-xs)}.db-tab{padding:8px 20px;border-radius:var(--r-md);border:none;background:transparent;color:var(--n-500);font-size:12.5px;font-weight:600;cursor:pointer;font-family:var(--font-body);transition:all var(--t-fast);display:flex;align-items:center;gap:6px;white-space:nowrap}.db-tab:hover:not(.active){background:var(--surface-hover);color:var(--n-800)}.db-tab.active{background:var(--brand-primary);color:var(--white)}`}</style>
      <div style={{marginBottom:"24px"}}><h1 className="page-title">Faculty and Staff</h1><p className="page-subtitle">Manage teaching and non-teaching personnel.</p></div>
      <div className="db-tabs">
        {["active","archived"].map(tab=>(
          <button key={tab} className={`db-tab${activeTab===tab?" active":""}`} onClick={()=>{setActiveTab(tab);setPage(1);}}>
            {tab.charAt(0).toUpperCase()+tab.slice(1)}
          </button>
        ))}
      </div>
      <ApiStatusBanner status={loading?"fetching":apiState} error={apiError} onRetry={onRetry}/>
      <div className="toolbar">
        <SearchInput value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        <button className="btn btn-outline">Filters</button>
        <div className="toolbar-spacer"/>
        <button className="btn btn-primary" onClick={onAdd}>+ Add Faculty</button>
      </div>
      {loading?<TableSkeleton rows={6}/>:paginated.length>0?(
        <DataTable
          columns={columns} rows={paginated} selected={selected}
          onToggleAll={()=>setSelected(paginated.every(r=>selected.includes(r.id))?[]:paginated.map(r=>r.id))}
          onToggleOne={id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])}
          onRowClick={onView}
          renderActions={row=>(
            <div className="action-btn-group">
              {/* RPMS CHANGE: RPMS action button per row */}
              <button className="action-btn action-btn--edit" onClick={e=>{e.stopPropagation();onRpms(row);}} title="RPMS Report">
                <IconChart/><span>RPMS</span>
              </button>
              {activeTab!=="archived"&&(
                <button className="action-btn action-btn--edit" onClick={e=>{e.stopPropagation();onArchive(row.id);}} title="Archive" style={{color:"var(--gray-600)",borderColor:"var(--gray-200)",background:"var(--gray-50)"}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  <span>Archive</span>
                </button>
              )}
              <button className="action-btn action-btn--danger" onClick={e=>{e.stopPropagation();setDelTarget(row.id);}} title="Delete"><IconTrash/><span>Delete</span></button>
              <button className="action-btn action-btn--edit"   onClick={e=>{e.stopPropagation();onEdit(row);}}         title="Edit"><IconEdit/><span>Edit</span></button>
            </div>
          )}
        />
      ):(
        <div style={{padding:"28px 20px",background:"var(--white)",borderRadius:"16px",border:"1px solid var(--border-card)",color:"var(--gray-600)"}}>
          {searchTerm?"No matching faculty records found.":activeTab==="archived"?"No archived faculty records available yet.":"No active faculty records available yet."}
        </div>
      )}
      <Pagination page={page} total={filtered.length} perPage={10} onChange={setPage}/>
      {delTarget&&(
        <ConfirmModal title="Delete record?" danger body="This will permanently remove the faculty record." confirmLabel="Yes, Delete" cancelLabel="Cancel"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          onCancel={()=>setDelTarget(null)} onConfirm={()=>{onDelete(delTarget);setDelTarget(null);}}
        />
      )}
    </>
  );
}

function FacultyandStaffPage() {
  const [faculty,setFaculty]   = useState(MOCK_FACULTY);
  const [view,setView]         = useState("list");
  const [target,setTarget]     = useState(null);
  const [toast,setToast]       = useState(null);
  const [loading,setLoading]   = useState(false);
  const [apiState,setApiState] = useState(null);
  const [apiError,setApiError] = useState(null);
  // RPMS CHANGE 2: state for RPMS modal
  const [rpmsTarget,setRpmsTarget] = useState(null);
  const isMountedRef = useRef(true);
  useEffect(()=>{return ()=>{isMountedRef.current=false;};},[]);

  const fetchFaculty = useCallback(async()=>{
    if(!USE_API){setApiState("success");return;}
    setLoading(true);setApiState("fetching");setApiError(null);
    try {
      const {data,ok,error} = await facultyService.listFaculty();
      if(!isMountedRef.current) return;
      if(ok&&Array.isArray(data)){setFaculty(validateFacultyList(data,MOCK_FACULTY));setApiState("success");}
      else throw new Error(error||"Unable to fetch faculty list.");
    } catch(err) {
      if(!isMountedRef.current) return;
      setApiState("error");setApiError(err.message||"Unknown error");
    } finally {if(isMountedRef.current) setLoading(false);}
  },[]);
  useEffect(()=>{fetchFaculty();},[fetchFaculty]);

  const goList = ()=>{setView("list");setTarget(null);};
  const handleSave=(form,apiResult)=>{
    const sanitized=sanitizeFaculty(form);
    if(view==="create"){
      setFaculty(f=>[{...sanitized,id:apiResult?.id??sanitized.id??Date.now().toString(),teachingLoad:apiResult?.teachingLoad??[],advisory:apiResult?.advisory??null},...f]);
      setToast(apiResult?"Faculty record added (API)":"Faculty record added locally");
    } else {
      setFaculty(f=>f.map(x=>x.id===target?.id?{...x,...(apiResult??sanitized)}:x));
      setToast(apiResult?"Faculty record updated (API)":"Faculty record updated locally");
    }
    goList();
  };
  const handleDelete=async(id)=>{
    const prev=faculty;setFaculty(f=>f.filter(x=>x.id!==id));setToast("Record deleted");
    if(!USE_API) return;
    try {const {ok,error}=await facultyService.deleteFaculty(id);if(!isMountedRef.current) return;if(!ok){setFaculty(prev);setToast(`Delete failed: ${error||"API error"}`);}} catch {if(!isMountedRef.current) return;setFaculty(prev);setToast("Delete failed.");}
  };
  const handleArchive=async(id)=>{
    const prev=faculty;setFaculty(f=>f.map(x=>x.id===id?{...x,status:"Inactive"}:x));setToast("Record archived");
    if(!USE_API) return;
    try {const {ok,error}=await facultyService.archiveFaculty(id);if(!isMountedRef.current) return;if(!ok){setFaculty(prev);setToast(`Archive failed: ${error||"API error"}`);}} catch {if(!isMountedRef.current) return;setFaculty(prev);setToast("Archive failed.");}
  };

  return (
    <div className="page-layout">
      <Sidebar role="admin"/>
      <main id="main-content" className="page-main">
        <div className="page-body">
          {view==="list"&&(
            <FacultyList faculty={faculty} loading={loading} apiState={apiState} apiError={apiError}
              onRetry={fetchFaculty}
              onView={f=>{setTarget(f);setView("view");}}
              onEdit={f=>{setTarget(f);setView("edit");}}
              onDelete={handleDelete} onArchive={handleArchive} onAdd={()=>setView("create")}
              onRpms={f=>setRpmsTarget(f)}  // RPMS CHANGE 3
            />
          )}
          {view==="view"&&target&&(
            <FacultyView facultyId={target.id} facultyLocal={target} onBack={goList}
              onEdit={f=>{setTarget(f);setView("edit");}}
              onRpms={f=>setRpmsTarget(f)}  // RPMS CHANGE 4
            />
          )}
          {view==="edit"  &&target&&<FacultyForm initial={target} mode="edit"   onSave={handleSave} onCancel={goList}/>}
          {view==="create"&&        <FacultyForm initial={null}   mode="create" onSave={handleSave} onCancel={goList}/>}
        </div>
      </main>

      {/* RPMS CHANGE 5: mount modal when rpmsTarget is set */}
      {rpmsTarget&&<RpmsModal faculty={rpmsTarget} onClose={()=>setRpmsTarget(null)}/>}

      {toast&&<Toast message={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}

export default function FacultyandStaff() {
  return <FacultyErrorBoundary><FacultyandStaffPage/></FacultyErrorBoundary>;
}


