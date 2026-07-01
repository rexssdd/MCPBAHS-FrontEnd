// src/pages/Registrar/Enrollment.jsx
import { useState, useRef, useEffect } from "react";
import Sidebar from "../../Components/Sidebar";
import EnrollmentErrorBoundary from "../../Components/EnrollmentErrorBoundary";
import {
  Toast, ConfirmModal, Modal, ModalHeader, ModalBody, ModalFooter,
  Breadcrumb, Pagination, SearchInput, DataTable, FormInput, FormSelect,
  InfoCard, InfoField, Badge, CountryField, SearchableSelect,
} from "../../Components/ui";
import { ALL_CITIES, ALL_PROVINCES, getCityOptions } from "../../utils/philippineLocations";
import { useRegistrarEnrollment } from "../../hooks/Registrar/useRegistrarEnrollment";
import { isArchived } from "../../utils/archive";
import { getEnrolleeName, getEnrolleeGrade } from "../../utils/enrollmentValidation";
import "../../Css/Registrar/EnrollmentPage.css";
import "../../Css/EnrollmentForm/G7Form.css";

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════ */
const SCHOOL_TYPES  = ["Public", "Private", "Special Science School", "Integrated School"];
const GRADE_LEVELS  = ["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const PAGE_SIZE     = 8;
const PALETTE       = ["#1a5c1a","#2a7a2a","#c4920a","#1d4ed8","#7c3aed","#dc2626","#0891b2","#db2777"];

const TODAY        = new Date();
const DATE_PRESETS = [
  { label: "Today",        days: 0  },
  { label: "Last 7 days",  days: 7  },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function subtractDays(d) {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() - d);
  return dt;
}

function inDateRange(isoStr, preset) {
  if (!preset || preset === "all") return true;
  if (!isoStr) return false;
  const dt = new Date(isoStr);
  if (preset === 0) return dt.toDateString() === TODAY.toDateString();
  return dt >= subtractDays(preset) && dt <= TODAY;
}

const getInitials = name =>
  name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

const getAvatarBg = name => PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];

/* ── Form data model — mirrors the public Grade 7 Enrollment Form ── */
const EMPTY_FORM = {
  // Learner Information
  lrn:"", firstName:"", middleName:"", lastName:"", nameExt:"",
  dob:"", sex:"", age:"", motherTongue:"", religion:"", placeOfBirth:"",
  // Learner Background
  isIP:"No", ipSpecify:"", is4Ps:"No", householdId:"", isPWD:"No",
  // Address
  houseNo:"", streetName:"", barangay:"", city:"", province:"",
  country:"Philippines", postalCode:"",
  // Contact
  email:"", phone:"",
  // Parents
  fatherLast:"", fatherFirst:"", fatherMiddle:"", fatherExt:"",
  motherLast:"", motherFirst:"", motherMiddle:"", motherExt:"",
  // Enrollment
  gradeLevel:"",
  // Attachments
  idPic:null, idPicName:"",
  signature:null, signatureName:"",
  birthCert:null, birthCertName:"",
  reportCard:null, reportCardName:"",
  consentImages:false, consentData:false,
};

const EMPTY_FILTERS = {
  gradeLevel:   "all",
  schoolType:   "all",
  city:         "all",
  enrolledDate: "all",
};

/* ── Status Pill ── */
function StatusPill({ status }) {
  const key = (status || "archived").toLowerCase();
  return (
    <span className={`status-pill status-pill--${key}`}>
      <span className="status-pill__dot"/>
      {status}
    </span>
  );
}

/* ── API Status Banner ── */
function ApiStatusBanner({ status, onRetry }) {
  const CONFIG = {
    loading:  { dot:"loading",  text:"Fetching enrollees from the server…" },
    success:  { dot:"success",  text:"Live data — connected to API successfully." },
    error:    { dot:"error",    text:"API unreachable — showing offline seed data. Changes will not be persisted." },
    fallback: { dot:"fallback", text:"API not configured — displaying built-in sample data for UI testing." },
  };
  const c = CONFIG[status] ?? CONFIG.fallback;
  return (
    <div className={`api-status-banner api-status-banner--${status}`}>
      <span className={`api-status-dot api-status-dot--${c.dot}`}/>
      <span style={{ flex:1 }}>{c.text}</span>
      {(status === "error" || status === "fallback") && onRetry && (
        <button className="btn-retry" onClick={onRetry} title="Retry API connection">
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

/* ── Skeleton Rows ── */
function SkeletonRows({ count = PAGE_SIZE }) {
  return Array.from({ length:count }, (_, i) => (
    <tr key={i} className="skeleton-row">
      <td><span className="skeleton skeleton-cell" style={{ width:16, height:16, display:"block" }}/></td>
      <td><span className="skeleton skeleton-cell" style={{ width:"70%", display:"block" }}/></td>
      <td><span className="skeleton skeleton-cell" style={{ width:"80%", display:"block" }}/></td>
      <td><span className="skeleton skeleton-cell" style={{ width:"55%", display:"block" }}/></td>
      <td><span className="skeleton skeleton-cell" style={{ width:60, borderRadius:999, display:"block" }}/></td>
      <td><span className="skeleton skeleton-cell" style={{ width:120, display:"block", marginLeft:"auto" }}/></td>
    </tr>
  ));
}

/* ── Filter Panel ── */
function FilterPanel({ filters, onChange, onReset, enrollees }) {
  const availableGrades = [...new Set(enrollees.map(e => e.gradeLevel).filter(Boolean))].sort();
  const availableCities = [...new Set(enrollees.map(e => e.city).filter(Boolean))].sort();
  const activeCount = Object.values(filters).filter(v => v !== "all").length;
  return (
    <div className="filter-panel">
      <div className="filter-panel__header">
        <span className="filter-panel__title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight:6 }}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filters
          {activeCount > 0 && <span className="filter-active-count">{activeCount}</span>}
        </span>
        {activeCount > 0 && <button className="filter-reset-btn" onClick={onReset}>Reset all</button>}
      </div>
      <div className="filter-panel__grid">
        <div className="filter-group">
          <label className="filter-label">Grade Level</label>
          <div className="filter-chips">
            <button className={`filter-chip${filters.gradeLevel==="all"?" filter-chip--active":""}`} onClick={()=>onChange("gradeLevel","all")}>All</button>
            {availableGrades.map(g=>(
              <button key={g} className={`filter-chip${filters.gradeLevel===g?" filter-chip--active":""}`} onClick={()=>onChange("gradeLevel",g)}>{g}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">School Type</label>
          <div className="filter-chips">
            <button className={`filter-chip${filters.schoolType==="all"?" filter-chip--active":""}`} onClick={()=>onChange("schoolType","all")}>All</button>
            {SCHOOL_TYPES.map(t=>(
              <button key={t} className={`filter-chip${filters.schoolType===t?" filter-chip--active":""}`} onClick={()=>onChange("schoolType",t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">City</label>
          <div className="filter-chips">
            <button className={`filter-chip${filters.city==="all"?" filter-chip--active":""}`} onClick={()=>onChange("city","all")}>All</button>
            {availableCities.map(c=>(
              <button key={c} className={`filter-chip${filters.city===c?" filter-chip--active":""}`} onClick={()=>onChange("city",c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">Enrolled Date</label>
          <div className="filter-chips">
            <button className={`filter-chip${filters.enrolledDate==="all"?" filter-chip--active":""}`} onClick={()=>onChange("enrolledDate","all")}>All time</button>
            {DATE_PRESETS.map(p=>(
              <button key={p.label} className={`filter-chip${filters.enrolledDate===p.days?" filter-chip--active":""}`} onClick={()=>onChange("enrolledDate",p.days)}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>
      {activeCount > 0 && (
        <div className="filter-tags">
          {filters.gradeLevel!=="all"&&<span className="filter-tag">{filters.gradeLevel}<button onClick={()=>onChange("gradeLevel","all")}>×</button></span>}
          {filters.schoolType!=="all"&&<span className="filter-tag">{filters.schoolType}<button onClick={()=>onChange("schoolType","all")}>×</button></span>}
          {filters.city!=="all"&&<span className="filter-tag">{filters.city}<button onClick={()=>onChange("city","all")}>×</button></span>}
          {filters.enrolledDate!=="all"&&<span className="filter-tag">{DATE_PRESETS.find(p=>p.days===filters.enrolledDate)?.label??"Custom date"}<button onClick={()=>onChange("enrolledDate","all")}>×</button></span>}
        </div>
      )}
    </div>
  );
}

/* ── Reject Modal ── */
function RejectModal({ enrollee, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  const name = getEnrolleeName(enrollee, "this enrollee");
  return (
    <Modal size="sm" onClose={onCancel}>
      <ModalHeader icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      }>Reject Enrollment</ModalHeader>
      <ModalBody>
        <p style={{ fontSize:13, color:"var(--gray-600)", marginBottom:14 }}>
          You are about to reject <strong>{name}</strong>'s enrollment application.
          Provide a reason (optional) — it may be shown to the applicant.
        </p>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for rejection…" rows={3} className="reject-reason-textarea"/>
      </ModalBody>
      <ModalFooter>
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={()=>onConfirm(reason)}>Reject</button>
      </ModalFooter>
    </Modal>
  );
}

/* ── shared bits for the G7-style layout ── */
function SectionHeading({ children }) {
  return <div className="section-heading">{children}</div>;
}

function YesNoStatic({ value }) {
  return (
    <div className="yesno-pill">
      {["Yes","No"].map(opt=>(
        <span key={opt} className={`yesno-pill-option${value===opt?" active":""}`}>{opt}</span>
      ))}
    </div>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div className="yesno-pill">
      {["Yes", "No"].map(opt => (
        <button
          key={opt}
          type="button"
          className={`yesno-pill-option${value === opt ? " active" : ""}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function UploadBox({ label, file, fileName, onFile }) {
  const displayName = file?.name || fileName || "";
  return (
    <div className={`upload-box${displayName ? " has-file" : ""}`}>
      <input type="file" onChange={e => onFile(e.target.files?.[0] || null)} />
      <span className="upload-icon">{displayName ? "📄" : "📎"}</span>
      <span className="upload-label">{label}</span>
      {displayName
        ? <span className="upload-filename">{displayName}</span>
        : <span className="upload-hint">Click to upload</span>}
    </div>
  );
}

function ConsentBox({ checked, onToggle, children }) {
  return (
    <div className={`consent-box${checked ? " checked" : ""}`} onClick={onToggle}>
      <div className={`consent-checkbox${checked ? " checked" : ""}`}>
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="consent-text">{children}</span>
    </div>
  );
}

const parentName = (last, first, middle, ext) =>
  [first, middle, last, ext].filter(Boolean).join(" ") || "—";

/* ══════════════════════════════════════════════════════════════
   ENROLLEE VIEW
   Section order mirrors the public Grade 7 enrollment form exactly:
   Learner Info → Learner Background → Address → Contact →
   Parents → Attachments
   ══════════════════════════════════════════════════════════════ */
function EnrolleeView({ enrollee, onBack, onEdit, onApprove, onReject }) {
  const [showReject, setShowReject] = useState(false);

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
  const initials   = getInitials(`${enrollee.firstName||""} ${enrollee.lastName||""}`);

  return (
    <>
      <Breadcrumb parts={[
        { label:"Enrollment", onClick:onBack },
        { label: enrollee.learnerId || "Unknown" },
      ]}/>

      <div className="info-card" style={{ marginBottom:16, display:"flex", alignItems:"center", gap:20 }}>
        <div style={{
          width:72, height:72, borderRadius:"50%",
          background:getAvatarBg(enrollee.firstName||"?"),
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, fontWeight:800, color:"#fff", flexShrink:0,
        }}>
          {initials}
        </div>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:"var(--green-800)", margin:"0 0 4px" }}>{fullName}</h2>
          <p style={{ fontSize:13, color:"var(--gray-500)", margin:"0 0 4px" }}>
            {gradeLevel} · {enrollee.sectionId || "—"}
          </p>
          <StatusPill status={enrollee.status}/>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button className="btn btn-outline" onClick={()=>onEdit(enrollee)}>Edit</button>
          {isPending && (
            <>
              <button className="btn btn-danger"  onClick={()=>setShowReject(true)}>Reject</button>
              <button className="btn btn-primary" onClick={()=>onApprove(enrollee.id)}>Approve</button>
            </>
          )}
        </div>
      </div>

      {/* 1. Learner Information */}
      <InfoCard title="Learner Information">
        <div className="form-grid-3" style={{ marginBottom:16 }}>
          <InfoField label="LRN"          value={enrollee.lrn        || "—"}/>
          <InfoField label="First Name"   value={enrollee.firstName  || "—"}/>
          <InfoField label="Middle Name"  value={enrollee.middleName || "—"}/>
        </div>
        <div className="form-grid-3" style={{ marginBottom:16 }}>
          <InfoField label="Last Name"        value={enrollee.lastName || "—"}/>
          <InfoField label="Name Extension"   value={enrollee.nameExt  || "—"}/>
          <InfoField label="Sex"              value={enrollee.sex      || "—"}/>
        </div>
        <div className="form-grid-3" style={{ marginBottom:16 }}>
          <InfoField label="Date of Birth"  value={enrollee.dob   || "—"}/>
          <InfoField label="Age"            value={enrollee.age   || "—"}/>
          <InfoField label="Mother Tongue"  value={enrollee.motherTongue || "—"}/>
        </div>
        <div className="form-grid-3">
          <InfoField label="Religion"       value={enrollee.religion     || "—"}/>
          <InfoField label="Place of Birth" value={enrollee.placeOfBirth || "—"}/>
          <InfoField label="Grade Level"    value={gradeLevel}/>
        </div>
      </InfoCard>

      {/* 2. Learner Background */}
      <InfoCard title="Learner Background" style={{ marginTop:16 }}>
        <div className="form-grid-3">
          <div>
            <p className="info-field-label">Indigenous People (IP)</p>
            <YesNoStatic value={enrollee.isIP || "No"}/>
            {enrollee.isIP === "Yes" && <InfoField label="Community" value={enrollee.ipSpecify || "—"}/>}
          </div>
          <div>
            <p className="info-field-label">4Ps Beneficiary</p>
            <YesNoStatic value={enrollee.is4Ps || "No"}/>
            {enrollee.is4Ps === "Yes" && <InfoField label="Household ID" value={enrollee.householdId || "—"}/>}
          </div>
          <div>
            <p className="info-field-label">Person with Disability (PWD)</p>
            <YesNoStatic value={enrollee.isPWD || "No"}/>
          </div>
        </div>
      </InfoCard>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:16 }}>

        {/* 3. Address */}
        <InfoCard title="Address">
          <div className="form-grid-3" style={{ marginBottom:16 }}>
            <InfoField label="House No."  value={enrollee.houseNo    || "—"}/>
            <InfoField label="Street"     value={enrollee.streetName || "—"}/>
            <InfoField label="Barangay"   value={enrollee.barangay   || "—"}/>
          </div>
          <div className="form-grid-3">
            <InfoField label="City / Municipality" value={enrollee.city    || "—"}/>
            <InfoField label="Province"            value={enrollee.province|| "—"}/>
            <InfoField label="Country"             value={enrollee.country || "—"}/>
          </div>
        </InfoCard>

        {/* 4. Contact */}
        <InfoCard title="Contact Information">
          <div className="form-grid-3">
            <InfoField label="Email"       value={enrollee.email      || "—"}/>
            <InfoField label="Phone"       value={enrollee.phone      || "—"}/>
            <InfoField label="Postal Code" value={enrollee.postalCode || "—"}/>
          </div>
        </InfoCard>

        {/* 5. Parents */}
        <InfoCard title="Parents">
          <p className="info-field-label" style={{ marginBottom:6 }}>Father's Name</p>
          <InfoField label="" value={parentName(enrollee.fatherLast, enrollee.fatherFirst, enrollee.fatherMiddle, enrollee.fatherExt)}/>
          <p className="info-field-label" style={{ margin:"12px 0 6px" }}>Mother's Maiden Name</p>
          <InfoField label="" value={parentName(enrollee.motherLast, enrollee.motherFirst, enrollee.motherMiddle, enrollee.motherExt)}/>
        </InfoCard>

        {/* 6. Attachments */}
        <InfoCard title="Attachments">
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              ["2×2 ID Picture",     enrollee.idPicName],
              ["E-Signature",        enrollee.signatureName],
              ["Birth Certificate",  enrollee.birthCertName],
              ["Report Card / F138", enrollee.reportCardName],
            ].map(([label, name]) => (
              <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:"var(--gray-700)" }}>{label}</span>
                {name ? (
                  <span style={{ fontSize:12, fontWeight:700, color:"var(--green-800)" }}>{name}</span>
                ) : (
                  <span style={{ fontSize:12, color:"var(--gray-400)" }}>Not attached</span>
                )}
              </div>
            ))}
          </div>
        </InfoCard>
      </div>

      {showReject && (
        <RejectModal
          enrollee={enrollee}
          onCancel={()=>setShowReject(false)}
          onConfirm={reason=>{ setShowReject(false); onReject(enrollee.id, reason); }}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   ENROLLEE FORM  (Add / Edit)
   Section order + fields mirror the public Grade 7 enrollment form
   exactly: Learner Info → Learner Background → Address → Contact →
   Parents → Attachments. Preview mirrors the same order.
   ══════════════════════════════════════════════════════════════ */
function EnrolleeForm({ initial, mode, onSave, onCancel, isSaving }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(initial ? { ...EMPTY_FORM, ...initial, idPic:null, signature:null, birthCert:null, reportCard:null } : { ...EMPTY_FORM });
  const [preview, setPreview] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = k => () => setForm(f => ({ ...f, [k]: !f[k] }));
  const setFile = (fileKey, nameKey) => file =>
    setForm(f => ({ ...f, [fileKey]: file, [nameKey]: file ? file.name : "" }));

  const breadParts = isEdit
    ? [{ label:"Enrollment", onClick:onCancel }, { label: initial?.learnerId ?? "" }, { label:"Edit" }]
    : [{ label:"Enrollment", onClick:onCancel }, { label:"Add" }];

  return (
    <>
      <Breadcrumb parts={breadParts}/>
      <div className="form-card">

        <div>
          <h2 className="form-section-title">{isEdit ? "Edit Enrollee" : "Add Enrollee"}</h2>
          <div className="form-divider"/>
        </div>

        {/* 1. Learner Information */}
        <div>
          <SectionHeading>Learner Information</SectionHeading>
          <div className="form-grid" style={{ marginBottom:16 }}>
            <div className="form-field">
              <label className="form-label">LRN</label>
              <input className="form-input" value={form.lrn} onChange={set("lrn")} placeholder="12-digit LRN (if available)"/>
            </div>
            <div className="form-field">
              <label className="form-label">Grade Level to Enroll</label>
              <FormSelect value={form.gradeLevel} onChange={set("gradeLevel")} options={GRADE_LEVELS}/>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Last Name</label>
              <input className="form-input" value={form.lastName} onChange={set("lastName")}/></div>
            <div className="form-field"><label className="form-label">First Name</label>
              <input className="form-input" value={form.firstName} onChange={set("firstName")}/></div>
            <div className="form-field"><label className="form-label">Middle Name</label>
              <input className="form-input" value={form.middleName} onChange={set("middleName")}/></div>
            <div className="form-field"><label className="form-label">Name Extension</label>
              <input className="form-input" value={form.nameExt} onChange={set("nameExt")} placeholder="Jr., Sr., III"/></div>
            <div className="form-field"><label className="form-label">Birth Date</label>
              <input type="date" className="form-input" value={form.dob} onChange={set("dob")}/></div>
            <div className="form-field"><label className="form-label">Sex</label>
              <FormSelect value={form.sex} onChange={set("sex")} options={["Male","Female"]}/></div>
            <div className="form-field"><label className="form-label">Age</label>
              <input type="number" className="form-input" value={form.age} onChange={set("age")} placeholder="e.g. 12"/></div>
            <div className="form-field"><label className="form-label">Mother Tongue</label>
              <input className="form-input" value={form.motherTongue} onChange={set("motherTongue")} placeholder="e.g. Filipino"/></div>
            <div className="form-field"><label className="form-label">Religion</label>
              <input className="form-input" value={form.religion} onChange={set("religion")} placeholder="e.g. Roman Catholic"/></div>
            <SearchableSelect
              label="Place of Birth"
              value={form.placeOfBirth}
              onChange={value => setForm(f => ({ ...f, placeOfBirth: value }))}
              options={ALL_CITIES}
              placeholder="Search city or municipality"
              name="registrar-birthplace"
            />
          </div>
        </div>

        <div className="form-divider"/>

        {/* 2. Learner Background */}
        <div>
          <SectionHeading>Learner Background</SectionHeading>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { q:"Is the learner part of an Indigenous People (IP) / Indigenous Cultural Community?", key:"isIP",  specKey:"ipSpecify",  specLabel:"Please specify community" },
              { q:"Is the family a beneficiary of the 4Ps program?",                                   key:"is4Ps", specKey:"householdId", specLabel:"4Ps Household ID Number" },
              { q:"Is the learner a Person with Disability (PWD)?",                                    key:"isPWD" },
            ].map(({ q, key, specKey, specLabel }) => (
              <div key={key} className="condition-row">
                <span className="condition-label">{q}</span>
                <div className="condition-input-wrap">
                  <YesNo value={form[key]} onChange={set(key)}/>
                </div>
                {specKey && form[key] === "Yes" && (
                  <div className="condition-extra">
                    <input className="form-input" value={form[specKey]} onChange={set(specKey)} placeholder={specLabel}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-divider"/>

        {/* 3. Address */}
        <div>
          <SectionHeading>Address</SectionHeading>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">House No.</label>
              <input className="form-input" value={form.houseNo} onChange={set("houseNo")} placeholder="e.g. 123"/></div>
            <div className="form-field"><label className="form-label">Street Name</label>
              <input className="form-input" value={form.streetName} onChange={set("streetName")}/></div>
            <div className="form-field"><label className="form-label">Barangay</label>
              <input className="form-input" value={form.barangay} onChange={set("barangay")}/></div>
            <SearchableSelect
              label="Province"
              value={form.province}
              onChange={value => setForm(f => ({ ...f, province: value, city: "" }))}
              options={ALL_PROVINCES}
              placeholder="Search province"
              name="registrar-province"
            />
            <SearchableSelect
              label="City / Municipality"
              value={form.city}
              onChange={value => setForm(f => ({ ...f, city: value }))}
              options={getCityOptions(form.province) ?? ALL_CITIES}
              placeholder="Search city or municipality"
              name="registrar-city"
            />
            <CountryField value={form.country || "Philippines"} required/>
            <div className="form-field"><label className="form-label">Postal Code</label>
              <input className="form-input" value={form.postalCode} onChange={set("postalCode")} placeholder="0000" maxLength={4} inputMode="numeric"/></div>
          </div>
        </div>

        <div className="form-divider"/>

        {/* 4. Contact */}
        <div>
          <SectionHeading>Contact Information</SectionHeading>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={form.email} onChange={set("email")} placeholder="Email Address"/></div>
            <div className="form-field"><label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" value={form.phone} onChange={set("phone")} placeholder="09XX XXX XXXX"/></div>
          </div>
        </div>

        <div className="form-divider"/>

        {/* 5. Parents */}
        <div>
          {[
            { title:"Father's Name",         keys:["fatherLast","fatherFirst","fatherMiddle","fatherExt"] },
            { title:"Mother's Maiden Name",  keys:["motherLast","motherFirst","motherMiddle","motherExt"] },
          ].map(({ title, keys }, gi) => (
            <div key={title}>
              {gi > 0 && <div className="gap-md"/>}
              <SectionHeading>{title}</SectionHeading>
              <div className="form-grid">
                {["Last Name","First Name","Middle Name","Name Extension"].map((lbl, i) => (
                  <div className="form-field" key={lbl}>
                    <label className="form-label">{lbl}</label>
                    <input
                      className="form-input"
                      value={form[keys[i]]}
                      onChange={set(keys[i])}
                      placeholder={lbl === "Name Extension" ? "Jr., Sr." : ""}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="form-divider"/>

        {/* 6. Attachments */}
        <div>
          <SectionHeading>Required Documents</SectionHeading>
          <div className="upload-grid">
            <UploadBox label="(2×2) ID Picture"           file={form.idPic}      fileName={form.idPicName}      onFile={setFile("idPic","idPicName")}/>
            <UploadBox label="E-Signature"                 file={form.signature}  fileName={form.signatureName}  onFile={setFile("signature","signatureName")}/>
            <UploadBox label="Birth Certificate (PSA/NSO)" file={form.birthCert}  fileName={form.birthCertName}  onFile={setFile("birthCert","birthCertName")}/>
            <UploadBox label="Form 137 or Report Card"     file={form.reportCard} fileName={form.reportCardName} onFile={setFile("reportCard","reportCardName")}/>
          </div>

          <div className="gap-md"/>
          <SectionHeading>Consent &amp; Certification</SectionHeading>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <ConsentBox checked={form.consentImages} onToggle={toggle("consentImages")}>
              I hereby allow the use of my images and signature for educational purposes only.
              These materials will be used solely for academic documentation, presentations, or
              reports, and will not be distributed, sold, or used for any commercial or
              unauthorized purposes.
            </ConsentBox>
            <ConsentBox checked={form.consentData} onToggle={toggle("consentData")}>
              I hereby certify that the above information given are true and correct to the best
              of my knowledge and I allow the Department of Education to use these details for
              enrollment data collection, treated as confidential per the Data Privacy Act of 2012.
            </ConsentBox>
          </div>
        </div>

        <div className="form-divider"/>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button className="btn btn-outline" onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>setPreview(true)} disabled={isSaving}>
            {isEdit ? "Save Changes" : "Add Enrollee"}
          </button>
        </div>
      </div>

      {/* Preview modal — same section order as form and view */}
      {preview && (
        <Modal size="lg" onClose={()=>setPreview(false)}>
          <ModalHeader>Preview</ModalHeader>
          <ModalBody>

            <p style={{ fontWeight:600, marginBottom:12, fontSize:13, color:"var(--gray-700)" }}>Learner Information</p>
            <div className="form-grid-3" style={{ marginBottom:16 }}>
              {[
                ["LRN",            form.lrn],
                ["Last Name",      form.lastName],
                ["First Name",     form.firstName],
                ["Middle Name",    form.middleName],
                ["Name Extension", form.nameExt],
                ["Sex",            form.sex],
                ["Date of Birth",  form.dob],
                ["Age",            form.age],
                ["Mother Tongue",  form.motherTongue],
                ["Religion",       form.religion],
                ["Place of Birth", form.placeOfBirth],
                ["Grade Level",    form.gradeLevel],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="info-field-label">{l}</p>
                  <div className="form-input" style={{ cursor:"default" }}>{v || "—"}</div>
                </div>
              ))}
            </div>

            <p style={{ fontWeight:600, marginBottom:12, fontSize:13, color:"var(--gray-700)" }}>Learner Background</p>
            <div className="form-grid-3" style={{ marginBottom:16 }}>
              <div><p className="info-field-label">Indigenous People</p><YesNoStatic value={form.isIP}/></div>
              <div><p className="info-field-label">4Ps Beneficiary</p><YesNoStatic value={form.is4Ps}/></div>
              <div><p className="info-field-label">Person with Disability</p><YesNoStatic value={form.isPWD}/></div>
            </div>

            <p style={{ fontWeight:600, marginBottom:12, fontSize:13, color:"var(--gray-700)" }}>Address</p>
            <div className="form-grid-3" style={{ marginBottom:16 }}>
              {[
                ["House No.",  form.houseNo],
                ["Street",     form.streetName],
                ["Barangay",   form.barangay],
                ["City / Municipality", form.city],
                ["Province",   form.province],
                ["Country",    form.country],
                ["Postal Code", form.postalCode],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="info-field-label">{l}</p>
                  <div className="form-input" style={{ cursor:"default" }}>{v || "—"}</div>
                </div>
              ))}
            </div>

            <p style={{ fontWeight:600, marginBottom:12, fontSize:13, color:"var(--gray-700)" }}>Contact Information</p>
            <div className="form-grid-3" style={{ marginBottom:16 }}>
              {[
                ["Email", form.email],
                ["Phone", form.phone],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="info-field-label">{l}</p>
                  <div className="form-input" style={{ cursor:"default" }}>{v || "—"}</div>
                </div>
              ))}
            </div>

            <p style={{ fontWeight:600, marginBottom:12, fontSize:13, color:"var(--gray-700)" }}>Parents</p>
            <div className="form-grid-3" style={{ marginBottom:16 }}>
              <div><p className="info-field-label">Father's Name</p>
                <div className="form-input" style={{ cursor:"default" }}>{parentName(form.fatherLast, form.fatherFirst, form.fatherMiddle, form.fatherExt)}</div></div>
              <div><p className="info-field-label">Mother's Maiden Name</p>
                <div className="form-input" style={{ cursor:"default" }}>{parentName(form.motherLast, form.motherFirst, form.motherMiddle, form.motherExt)}</div></div>
            </div>

            <p style={{ fontWeight:600, marginBottom:12, fontSize:13, color:"var(--gray-700)" }}>Attachments</p>
            <div className="form-grid-3">
              {[
                ["2×2 ID Picture", form.idPicName],
                ["E-Signature", form.signatureName],
                ["Birth Certificate", form.birthCertName],
                ["Report Card / Form 137", form.reportCardName],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="info-field-label">{l}</p>
                  <div className="form-input" style={{ cursor:"default", color: v ? "var(--gray-900)" : "var(--gray-400)" }}>{v || "No file attached"}</div>
                </div>
              ))}
            </div>

          </ModalBody>
          <ModalFooter>
            <button className="btn btn-outline" onClick={()=>setPreview(false)}>Back</button>
            <button
              className="btn btn-primary"
              onClick={()=>{ setPreview(false); onSave(form); }}
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
   ENROLLEE LIST
   ══════════════════════════════════════════════════════════════ */
const TABS = [
  { id:"all",      label:"All"      },
  { id:"pending",  label:"Pending"  },
  { id:"enrolled", label:"Enrolled" },
  { id:"rejected", label:"Rejected" },
  { id:"archived", label:"Archived" },
];

function EnrolleeList({
  enrollees, isLoading, apiStatus,
  onRetry, onView, onEdit, onArchive, onApprove, onReject, onAdd,
}) {
  const [search,        setSearch]        = useState("");
  const [page,          setPage]          = useState(1);
  const [selected,      setSelected]      = useState([]);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [activeTab,     setActiveTab]     = useState("all");
  const [showFilters,   setShowFilters]   = useState(false);
  const [filters,       setFilters]       = useState(EMPTY_FILTERS);
  const filterRef                         = useRef(null);

  useEffect(() => {
    if (!showFilters) return;
    function handleOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilters(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showFilters]);

  const activeFilterCount = Object.values(filters).filter(v => v !== "all").length;

  const handleFilterChange = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };
  const handleFilterReset  = ()             => { setFilters(EMPTY_FILTERS); setPage(1); };

  const byTab = activeTab === "all"
    ? enrollees
    : activeTab === "archived"
      ? enrollees.filter(e => isArchived(e.status))
      : enrollees.filter(e => !isArchived(e.status) && e.status?.toLowerCase() === activeTab);

  const filtered = byTab.filter(e => {
    const q = search.toLowerCase();
    const matchSearch =
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
      (e.learnerId || "").includes(q) ||
      (e.email     || "").toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filters.gradeLevel !== "all" && e.gradeLevel    !== filters.gradeLevel) return false;
    if (filters.schoolType !== "all" && e.oldSchoolType !== filters.schoolType) return false;
    if (filters.city       !== "all" && e.city          !== filters.city)       return false;
    if (!inDateRange(e.enrolledAt, filters.enrolledDate))                        return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = TABS.reduce((acc, tab) => {
    acc[tab.id] = tab.id === "all"
      ? enrollees.length
      : tab.id === "archived"
        ? enrollees.filter(e => isArchived(e.status)).length
        : enrollees.filter(e => !isArchived(e.status) && e.status?.toLowerCase() === tab.id).length;
    return acc;
  }, {});

  const columns = [
    { key:"learnerId",  label:"Learner ID",   bold:true, link:true },
    { key:"_name",      label:"Learner Name", bold:true, render: r => `${r.firstName} ${r.lastName}` },
    { key:"gradeLevel", label:"Grade Level",  muted:true },
    { key:"status",     label:"Status",       render: r => <StatusPill status={r.status}/> },
  ];

  return (
    <>
      <div style={{ marginBottom:24 }}>
        <h1 className="page-title">Enrollment</h1>
        <p className="page-subtitle">Manage all enrollee records.</p>
      </div>

      <div className="reg-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`reg-tab reg-tab--${tab.id}${activeTab===tab.id?" reg-tab--active":""}`}
            onClick={()=>{ setActiveTab(tab.id); setPage(1); }}
          >
            {tab.label}
            {counts[tab.id] > 0 && <span className="reg-tab__count">{counts[tab.id]}</span>}
          </button>
        ))}
      </div>

      <ApiStatusBanner status={apiStatus} onRetry={onRetry}/>

      <div className="toolbar" style={{ position:"relative" }} ref={filterRef}>
        <SearchInput value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}/>

        <button
          className={`btn btn-outline filter-toggle-btn${showFilters?" filter-toggle-btn--open":""}`}
          onClick={()=>setShowFilters(v=>!v)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filters
          {activeFilterCount > 0 && <span className="filter-toggle-count">{activeFilterCount}</span>}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform:showFilters?"rotate(180deg)":"none", transition:"transform .2s" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div className="toolbar-spacer"/>

        <button className="btn btn-danger" style={{ opacity:selected.length>0?1:0.5 }}
          onClick={()=>selected.length>0&&setArchiveTarget("bulk")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8"/>
            <rect x="1" y="3" width="22" height="5"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          Archive
        </button>
        <button className="btn btn-primary" onClick={onAdd}>+ Add Enrollee</button>

        {showFilters && (
          <FilterPanel filters={filters} onChange={handleFilterChange} onReset={handleFilterReset} enrollees={enrollees}/>
        )}
      </div>

      {(activeFilterCount > 0 || search) && !isLoading && (
        <div className="filter-results-bar">
          <span>Showing <strong>{filtered.length}</strong> of <strong>{byTab.length}</strong> enrollees</span>
          <button className="filter-clear-link" onClick={()=>{ handleFilterReset(); setSearch(""); }}>Clear all filters</button>
        </div>
      )}

      {isLoading ? (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width:36 }}/><th>Learner ID</th><th>Learner Name</th>
                <th>Grade Level</th><th>Status</th><th/>
              </tr>
            </thead>
            <tbody><SkeletonRows/></tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p className="empty-state__title">No enrollees found</p>
          <p className="empty-state__subtitle">
            {activeFilterCount>0||search ? "Try adjusting your search or filters." : "No enrollees have been added yet."}
          </p>
          {(activeFilterCount>0||search) && (
            <button className="btn btn-outline" style={{ marginTop:12 }}
              onClick={()=>{ handleFilterReset(); setSearch(""); }}>Clear filters</button>
          )}
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
              {row.status==="Pending"&&(
                <>
                  <button className="action-btn action-btn--approve" onClick={e=>{e.stopPropagation();onApprove(row.id);}} title="Approve">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Approve</span>
                  </button>
                  <button className="action-btn action-btn--danger" onClick={e=>{e.stopPropagation();onReject(row);}} title="Reject">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span>Reject</span>
                  </button>
                </>
              )}
              <button className="action-btn action-btn--edit" onClick={e=>{e.stopPropagation();onEdit(row);}} title="Edit">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span>Edit</span>
              </button>
              {!isArchived(row.status)&&(
                <button className="action-btn action-btn--danger" onClick={e=>{e.stopPropagation();setArchiveTarget(row.id);}} title="Archive">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                  </svg>
                  <span>Archive</span>
                </button>
              )}
            </div>
          )}
        />
      )}

      <Pagination page={page} total={filtered.length} perPage={PAGE_SIZE} onChange={setPage}/>

      {archiveTarget&&(
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
            onArchive(archiveTarget==="bulk"?selected:[archiveTarget]);
            setSelected([]);
            setArchiveTarget(null);
          }}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════════════ */
function EnrollmentRegistrarContent() {
  const {
    enrollees, view, target, toast, isSaving,
    apiStatus, error, mutationError, isLoading,
    fetchEnrollees, goList, goView, goEdit, goCreate,
    handleSave, handleApprove, handleReject, handleArchive,
    dismissMutationError, dismissToast,
  } = useRegistrarEnrollment();

  const [rejectTarget, setRejectTarget] = useState(null);
  const handleRejectClick   = enrollee => setRejectTarget(enrollee);
  const handleRejectConfirm = reason   => { handleReject(rejectTarget.id, reason); setRejectTarget(null); };

  return (
    <div className="page-layout">
      <Sidebar role="registrar"/>
      <main id="main-content" className="page-main">
        <div className="page-body">

          {error && !isLoading && apiStatus==="error" && (
            <div style={{ padding:"16px", background:"#FFEBEE", borderRadius:"8px", marginBottom:"20px", border:"1px solid #EF9A9A" }}>
              <p style={{ color:"#C62828", fontWeight:600, margin:"0 0 10px 0" }}>⚠️ Error: {error}</p>
              <button className="btn btn-outline" onClick={fetchEnrollees} style={{ fontSize:"13px" }}>⟳ Retry Loading Enrollees</button>
            </div>
          )}

          {mutationError && (
            <div style={{ padding:"16px", background:"#FFEBEE", borderRadius:"8px", marginBottom:"20px", border:"1px solid #EF9A9A" }}>
              <p style={{ color:"#C62828", fontWeight:600, margin:"0 0 10px 0" }}>⚠️ {mutationError}</p>
              <button className="btn btn-outline" onClick={dismissMutationError} style={{ fontSize:"13px" }}>Dismiss</button>
            </div>
          )}

          {view==="list"   && <EnrolleeList enrollees={enrollees} isLoading={isLoading} apiStatus={apiStatus} onRetry={fetchEnrollees} onView={goView} onEdit={goEdit} onArchive={handleArchive} onApprove={handleApprove} onReject={handleRejectClick} onAdd={goCreate}/>}
          {view==="view"   && <EnrolleeView enrollee={target} onBack={goList} onEdit={goEdit} onApprove={handleApprove} onReject={handleRejectClick}/>}
          {view==="edit"   && <EnrolleeForm initial={target} mode="edit"   onSave={handleSave} onCancel={goList} isSaving={isSaving}/>}
          {view==="create" && <EnrolleeForm initial={null}   mode="create" onSave={handleSave} onCancel={goList} isSaving={isSaving}/>}

          {rejectTarget && (
            <RejectModal enrollee={rejectTarget} onCancel={()=>setRejectTarget(null)} onConfirm={handleRejectConfirm}/>
          )}
        </div>
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast}/>}
    </div>
  );
}

export default function EnrollmentRegistrar() {
  return (
    <EnrollmentErrorBoundary>
      <EnrollmentRegistrarContent/>
    </EnrollmentErrorBoundary>
  );
}