import { useState } from "react";
import Sidebar from "../../../Components/Sidebar";
import { Toast, ConfirmModal, Modal, ModalHeader, ModalBody, ModalFooter,
         Breadcrumb, Pagination, SearchInput, DataTable, FormInput, FormSelect,
         InfoCard, InfoField, Badge, SearchableSelect, CountryField } from "../../../Components/ui";
import { getEnrolleeName, getEnrolleeGrade } from "../../../utils/enrollmentValidation";
import {
  hasUnsafeText,
  isValidDate,
  trimText,
  validateEmailField,
  validateNameField,
  validatePhoneField,
  validateTextField,
} from "../../../utils/inputValidation";
import { isArchived } from "../../../utils/archive";
import { ALL_CITIES } from "../../../utils/philippineLocations";
import {
  GRADE_LEVELS, SCHOOL_TYPES, PALETTE, PAGE_SIZE, getInitials, getAvatarBg,
  EMPTY_FORM,
} from "./adminEnrollmentConstants.js";

export function ApiStatusBanner({ status, onRetry }) {
  const CONFIG = {
    loading:  { dot: "loading",  text: "Fetching enrollees from the server…" },
    success:  { dot: "success",  text: "Live data — connected to API successfully." },
    error:    { dot: "error",    text: "API unreachable — showing local default data." },
    fallback: { dot: "fallback", text: "Using default seed data (API not configured)." },
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
   SKELETON ROWS (for table loading state)
   ══════════════════════════════════════════════════════════════ */
export function SkeletonRows({ count = PAGE_SIZE }) {
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
   SKELETON VIEW (for detail page loading)
   ══════════════════════════════════════════════════════════════ */
export function SkeletonView() {
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
   VIEW
   ══════════════════════════════════════════════════════════════ */
export function EnrolleeView({ enrollee, onBack, onEdit }) {
  if (!enrollee) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#C62828" }}>
        <p>Error: Enrollee data is invalid or missing.</p>
        <button className="btn btn-outline" onClick={onBack}>Back to List</button>
      </div>
    );
  }

  const fullName = getEnrolleeName(enrollee, "Unknown Student");
  const gradeLevel = getEnrolleeGrade(enrollee, "N/A");
  
  return (
    <>
      <Breadcrumb parts={[{label:"Enrollment",onClick:onBack},{label:enrollee.learnerId || "Unknown"}]}/>
      <div className="info-card" style={{marginBottom:16,display:"flex",alignItems:"center",gap:20}}>
        <div style={{
          width:72,height:72,borderRadius:"50%",background:getAvatarBg(enrollee.firstName || "?"),
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:22,fontWeight:800,color:"#fff",flexShrink:0
        }}>
          {getInitials(`${enrollee.firstName || ""} ${enrollee.lastName || ""}`)}
        </div>
        <div>
          <h2 style={{fontSize:20,fontWeight:800,color:"var(--green-800)",margin:"0 0 4px"}}>{fullName}</h2>
          <p style={{fontSize:13,color:"var(--gray-500)",margin:"0 0 2px"}}>{gradeLevel} pupil</p>
          <p style={{fontSize:13,color:"var(--gray-400)",margin:0}}>{enrollee.city || "—"}</p>
        </div>
        <button className="btn btn-primary" style={{marginLeft:"auto"}} onClick={()=>onEdit(enrollee)}>Edit</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <InfoCard title="Personal Information">
          <div className="form-grid-3" style={{marginBottom:16}}>
            <InfoField label="First Name"  value={enrollee.firstName || "—"}/>
            <InfoField label="Middle Name" value={enrollee.middleName || "—"}/>
            <InfoField label="Last Name"   value={enrollee.lastName || "—"}/>
          </div>
          <div className="form-grid-3">
            <InfoField label="Email"       value={enrollee.email || "—"}/>
            <InfoField label="Phone"       value={enrollee.phone || "—"}/>
            <InfoField label="Date of Birth" value={enrollee.dob || "—"}/>
          </div>
        </InfoCard>
        <InfoCard title="Address">
          <div className="form-grid-3">
            <InfoField label="Country"     value={enrollee.country || "—"}/>
            <InfoField label="City"        value={enrollee.city || "—"}/>
            <InfoField label="Postal Code" value={enrollee.postalCode || "—"}/>
          </div>
        </InfoCard>
        <InfoCard title="Old School Information">
          <div className="form-grid-3" style={{marginBottom:16}}>
            <InfoField label="School Name" value={enrollee.oldSchoolName || "—"}/>
            <InfoField label="School Type" value={enrollee.oldSchoolType || "—"}/>
            <InfoField label="School ID"   value={enrollee.oldSchoolId || "—"}/>
          </div>
          <InfoField label="School Address" value={enrollee.oldSchoolAddress || "—"}/>
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
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM
   ══════════════════════════════════════════════════════════════ */
export function EnrolleeForm({ initial, mode, onSave, onCancel, isSaving }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(initial ? {
    firstName:initial.firstName, middleName:initial.middleName, lastName:initial.lastName,
    email:initial.email, phone:initial.phone, dob:initial.dob,
    country:"Philippines", city:initial.city, postalCode:initial.postalCode,
    oldSchoolName:initial.oldSchoolName, oldSchoolType:initial.oldSchoolType,
    oldSchoolId:initial.oldSchoolId, oldSchoolAddress:initial.oldSchoolAddress,
  } : {...EMPTY_FORM});
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const set = k => e => {
    setForm(f=>({...f,[k]:e.target.value}));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const requiredFields = {
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      phone: "Phone number",
      dob: "Date of birth",
      country: "Country",
      city: "City",
      postalCode: "Postal code",
      oldSchoolName: "School name",
      oldSchoolType: "School type",
      oldSchoolId: "School ID",
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!trimText(form[field])) nextErrors[field] = `${label} is required.`;
    });

    const firstNameError = trimText(form.firstName) ? validateNameField(form.firstName, "First name") : "";
    const middleNameError = trimText(form.middleName) ? validateNameField(form.middleName, "Middle name") : "";
    const lastNameError = trimText(form.lastName) ? validateNameField(form.lastName, "Last name") : "";
    const emailError = trimText(form.email) ? validateEmailField(form.email) : "";
    const phoneError = trimText(form.phone) ? validatePhoneField(form.phone, "Phone number") : "";

    if (firstNameError) nextErrors.firstName = firstNameError;
    if (middleNameError) nextErrors.middleName = middleNameError;
    if (lastNameError) nextErrors.lastName = lastNameError;
    if (emailError) nextErrors.email = emailError;
    if (phoneError) nextErrors.phone = phoneError;

    if (trimText(form.dob)) {
      const birthDate = new Date(`${form.dob}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!isValidDate(form.dob)) nextErrors.dob = "Enter a valid date of birth.";
      else if (birthDate >= today) nextErrors.dob = "Date of birth must be in the past.";
    }

    if (trimText(form.postalCode) && !/^\d{4}$/.test(trimText(form.postalCode))) {
      nextErrors.postalCode = "Postal code must be exactly 4 digits.";
    }

    if (trimText(form.country) && trimText(form.country) !== "Philippines") {
      nextErrors.country = "Select a valid country from the list.";
    }

    const schoolIdError = validateTextField(form.oldSchoolId, "School ID", { min: 3, max: 40 });
    if (trimText(form.oldSchoolId) && schoolIdError) nextErrors.oldSchoolId = schoolIdError;

    Object.entries(form).forEach(([field, value]) => {
      if (typeof value === "string" && hasUnsafeText(value)) {
        nextErrors[field] = "This field cannot contain angle brackets.";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openPreview = () => {
    if (validateForm()) setPreview(true);
  };

  const breadParts = isEdit
    ? [{label:"Enrollment",onClick:onCancel},{label:initial.learnerId},{label:"Edit"}]
    : [{label:"Enrollment",onClick:onCancel},{label:"Add"}];

  return (
    <>
      <Breadcrumb parts={breadParts}/>
      <div className="form-card">
        <div>
          <h2 className="form-section-title">{isEdit ? "Edit Enrollee" : "Add Enrollee"}</h2>
          <div className="form-divider"/>
        </div>
        <div>
          <h3 className="form-section-title" style={{fontSize:13}}>Personal Information</h3>
          <div className="form-grid-3" style={{marginBottom:16}}>
            <FormInput label="First Name"   value={form.firstName}  onChange={set("firstName")}  placeholder="Juan" error={errors.firstName} required maxLength={80} autoComplete="given-name"/>
            <FormInput label="Middle Name"  value={form.middleName} onChange={set("middleName")} placeholder="Reyes" error={errors.middleName} maxLength={80} autoComplete="additional-name"/>
            <FormInput label="Last Name"    value={form.lastName}   onChange={set("lastName")}   placeholder="Dela Cruz" error={errors.lastName} required maxLength={80} autoComplete="family-name"/>
          </div>
          <div className="form-grid-3">
            <FormInput label="Email"         value={form.email} onChange={set("email")} placeholder="student@deped.gov.ph" error={errors.email} type="email" required maxLength={120} autoComplete="email"/>
            <FormInput label="Phone number"  value={form.phone} onChange={set("phone")} placeholder="09XXXXXXXXX" error={errors.phone} type="tel" required maxLength={13} inputMode="tel" autoComplete="tel"/>
            <FormInput label="Date of Birth" value={form.dob}   onChange={set("dob")} error={errors.dob} type="date" required/>
          </div>
        </div>
        <div className="form-divider"/>
        <div>
          <h3 className="form-section-title" style={{fontSize:13}}>Address</h3>
          <div className="form-grid-3">
            <CountryField value={form.country || "Philippines"} required />
            <SearchableSelect label="City" value={form.city} onChange={(value) => { setForm(f => ({ ...f, city: value })); setErrors(prev => ({ ...prev, city: undefined })); }} options={ALL_CITIES} placeholder="Search city or municipality" error={errors.city} required name="enrollee-city"/>
            <FormInput label="Postal Code" value={form.postalCode} onChange={set("postalCode")} placeholder="9200" error={errors.postalCode} required maxLength={4} inputMode="numeric"/>
          </div>
        </div>
        <div className="form-divider"/>
        <div>
          <h3 className="form-section-title" style={{fontSize:13}}>Old School Information</h3>
          <div className="form-grid-3">
            <FormInput  label="School Name" value={form.oldSchoolName} onChange={set("oldSchoolName")} placeholder="Maria Cristina National High School" error={errors.oldSchoolName} required maxLength={120}/>
            <FormSelect label="School Type" value={form.oldSchoolType} onChange={set("oldSchoolType")} options={SCHOOL_TYPES} placeholder="Select school type" error={errors.oldSchoolType} required/>
            <FormInput  label="School ID"   value={form.oldSchoolId}   onChange={set("oldSchoolId")}   placeholder="DepEd school ID" error={errors.oldSchoolId} required maxLength={40}/>
          </div>
        </div>
        <div className="form-divider"/>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button className="btn btn-outline" onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button className="btn btn-primary" onClick={openPreview} disabled={isSaving}>
            {isEdit ? "Save Changes" : "Add Enrollee"}
          </button>
        </div>
      </div>

      {preview && (
        <Modal size="lg" onClose={()=>setPreview(false)}>
          <ModalHeader icon={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}>
            Preview
          </ModalHeader>
          <ModalBody>
            <p style={{fontWeight:600,marginBottom:12,fontSize:13,color:"var(--gray-700)"}}>Personal Information</p>
            <div className="form-grid-3" style={{marginBottom:16}}>
              {[["First Name",form.firstName],["Middle Name",form.middleName],["Last Name",form.lastName],["Date of Birth",form.dob],["Email",form.email],["Phone",form.phone]]
                .map(([l,v])=>(
                  <div key={l}>
                    <p className="info-field-label">{l}</p>
                    <div className="form-input" style={{cursor:"default"}}>{v||"—"}</div>
                  </div>
                ))}
            </div>
            <p style={{fontWeight:600,marginBottom:12,fontSize:13,color:"var(--gray-700)"}}>Address</p>
            <div className="form-grid-3" style={{marginBottom:16}}>
              {[["Country",form.country],["City",form.city],["Postal Code",form.postalCode]]
                .map(([l,v])=>(
                  <div key={l}>
                    <p className="info-field-label">{l}</p>
                    <div className="form-input" style={{cursor:"default"}}>{v||"—"}</div>
                  </div>
                ))}
            </div>
            <p style={{fontWeight:600,marginBottom:12,fontSize:13,color:"var(--gray-700)"}}>Old School Information</p>
            <div className="form-grid-3">
              {[["School Name",form.oldSchoolName],["School Type",form.oldSchoolType],["School ID",form.oldSchoolId]]
                .map(([l,v])=>(
                  <div key={l}>
                    <p className="info-field-label">{l}</p>
                    <div className="form-input" style={{cursor:"default"}}>{v||"—"}</div>
                  </div>
                ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <button className="btn btn-outline" onClick={()=>setPreview(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={()=>{ if (validateForm()) { setPreview(false); onSave(form); } }}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Confirm"}
            </button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   LIST
   ══════════════════════════════════════════════════════════════ */
export function EnrolleeList({ enrollees, isLoading, apiStatus, onRetry, onView, onEdit, onArchive, onAdd }) {
  const [search,        setSearch]        = useState("");
  const [page,          setPage]          = useState(1);
  const [selected,      setSelected]      = useState([]);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("enrolled")

  const active    = enrollees.filter(e => !isArchived(e.status));
  const archived  = enrollees.filter(e => isArchived(e.status));
  const displayed = activeTab === "enrolled" ? active : archived;
  const filtered  = displayed.filter(e =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    e.learnerId.includes(search)
  );
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const columns = [
    { key:"learnerId", label:"Learner ID",   bold:true, link:true },
    { key:"_name",     label:"Learner Name", bold:true, render:r=>`${r.firstName} ${r.lastName}` },
    { key:"gradeLevel",label:"Grade Level",  muted:true },
    { key:"status",    label:"Status",       render:r=><Badge status={r.status}/> },
  ];
  
  const tabs = [
    { id: "enrolled", label: "Enrolled" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <>
      {/* temporary hard coded style. still needs improvement and a generic component just for the tab */}
      <style>
        {`
          .db-tabs {
            display: flex;
            gap: 0;
            background: var(--white);
            border: 1px solid var(--border-card);
            border-radius: var(--r-lg);
            padding: 4px;
            margin-bottom: var(--sp-lg);
            width: fit-content;
            box-shadow: var(--shadow-xs);
          }

          .db-tab {
            padding: 8px 20px;
            border-radius: var(--r-md);
            border: none;
            background: transparent;
            color: var(--n-500);
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            font-family: var(--font-body);
            transition: all var(--t-fast);
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
          }

          .db-tab:hover:not(.active) {
            background: var(--surface-hover);
            color: var(--n-800);
          }

          .db-tab.active {
            background: var(--brand-primary);
            color: var(--white);
          }  
        `}
      </style>
      <div style={{marginBottom:24}}>
        <h1 className="page-title">Enrollment</h1>
        <p className="page-subtitle">Manage enrollee records.</p>
      </div>
      
      <div className="db-tabs">
        {
          tabs.map(tab => (
            <button
              key={tab.id}
              className={`db-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))
        }
      </div>
      
      {activeTab === "enrolled" && <>
        {/* ── API Status Banner ── */}
        <ApiStatusBanner status={apiStatus} onRetry={onRetry}/>

        <div className="toolbar">
          <SearchInput value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}/>
          <button className="btn btn-outline">Filters</button>
          <div className="toolbar-spacer"/>
          <button
            className="btn btn-danger"
            style={{opacity:selected.length>0?1:0.5}}
            onClick={()=>selected.length>0&&setArchiveTarget("bulk")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="21 8 21 21 3 21 3 8"/>
              <rect x="1" y="3" width="22" height="5"/>
              <line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
            Archive
          </button>
          <button className="btn btn-primary" onClick={onAdd}>+ Add Enrollee</button>
        </div>

        {/* Skeleton or real table */}
        {isLoading ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{width:36}}/>
                  <th>Learner ID</th>
                  <th>Learner Name</th>
                  <th>Grade Level</th>
                  <th>Status</th>
                  <th/>
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
            renderActions={row=>(
              <div className="action-btn-group">
                <button
                  className="action-btn action-btn--danger"
                  onClick={e=>{ e.stopPropagation(); setArchiveTarget(row.id); }}
                  title="Archive"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="21 8 21 21 3 21 3 8"/>
                    <rect x="1" y="3" width="22" height="5"/>
                    <line x1="10" y1="12" x2="14" y2="12"/>
                  </svg>
                  <span>Archive</span>
                </button>
                <button
                  className="action-btn action-btn--edit"
                  onClick={e=>{ e.stopPropagation(); onEdit(row); }}
                  title="Edit"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Edit</span>
                </button>
              </div>
            )}
          />
        )}

        <Pagination page={page} total={filtered.length} perPage={PAGE_SIZE} onChange={setPage}/>

        {archiveTarget && (
          <ConfirmModal
            title="Are you sure?" danger
            body="Archiving this will hide it from the main list, but you can access it later in your archive."
            confirmLabel="Yes, Archive" cancelLabel="No, Cancel"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            }
            onCancel={()=>setArchiveTarget(null)}
            onConfirm={()=>{
              onArchive(archiveTarget==="bulk" ? selected : [archiveTarget]);
              setSelected([]);
              setArchiveTarget(null);
            }}
          />
        )}
      </>}
      
      {activeTab === "archived" && <>
        {/* ARCHIVED TABLE */}
        {/* Toolbar reused from enrolled tab */}
        <div className="toolbar">
          <SearchInput value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
          <button className="btn btn-outline">Filters</button>
          <div className="toolbar-spacer"/>
        </div>

        {isLoading ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{width:36}}/>
                  <th>Learner ID</th>
                  <th>Learner Name</th>
                  <th>Grade Level</th>
                  <th>Status</th>
                  <th/>
                </tr>
              </thead>
              <tbody><SkeletonRows/></tbody>
            </table>
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
            emptyText="No archived enrollees found."
          />
        )}

        <Pagination page={page} total={filtered.length} perPage={PAGE_SIZE} onChange={setPage}/>
      </>}

    </>
  );
}


