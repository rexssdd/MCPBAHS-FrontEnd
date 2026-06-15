// src/pages/ProfilePage.jsx  (shared by all roles — receives `role` prop from route)
// Replaces both src/pages/ProfilePage.jsx AND src/pages/Admin/ProfilePage.jsx
import { useState } from "react";
import Sidebar from "../Components/Sidebar";
import { Toast, Modal, ModalHeader, ModalBody, ModalFooter } from "../Components/ui";
import { validatePasswordStrength } from "../utils/inputValidation";

/* ── Password strength helper ─────────────────────────────── */
const LEVELS = [
  { label:"Weak",   color:"#ef4444" },
  { label:"Fair",   color:"#f97316" },
  { label:"Good",   color:"#eab308" },
  { label:"Strong", color:"#22c55e" },
];
const pwScore = p => [p.length>=8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;

/* ── Reusable field ───────────────────────────────────────── */
function FieldRow({ label, value, editing, onChange, type="text", readOnly=false }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {editing && !readOnly
        ? <input type={type} className="form-input" value={value} onChange={e=>onChange(e.target.value)} placeholder={type === "email" ? "name@deped.gov.ph" : `Enter ${label.toLowerCase()}`} maxLength={type === "email" ? 120 : 80} autoComplete={type === "email" ? "email" : "off"}/>
        : <div className="form-input" style={{cursor:"default",background:"var(--gray-50)",color:readOnly?"var(--gray-400)":"var(--gray-900)"}}>{value||<span style={{color:"var(--gray-300)"}}>—</span>}</div>
      }
    </div>
  );
}

/* ── Password field with show/hide ──────────────────────────  */
function PasswordField({ label, value, onChange, error }) {
  const [show, setShow] = useState(false);
  const isCurrentPassword = label.toLowerCase().includes("current");
  return (
    <div>
      <label className="form-label">{label}</label>
      <div style={{position:"relative"}}>
        <input type={show?"text":"password"} className="form-input" placeholder={label.toLowerCase().includes("confirm") ? "Re-enter password" : "Enter password"} value={value} onChange={e=>onChange(e.target.value)}
          style={{paddingRight:"40px",borderColor:error?"var(--red-600)":undefined}}
          autoComplete={isCurrentPassword ? "current-password" : "new-password"}
          maxLength={128}
          required
          aria-invalid={Boolean(error)}/>
        <button type="button" onClick={()=>setShow(v=>!v)}
          style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--gray-400)",padding:0}}>
          {show
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      </div>
      {error && <span style={{fontSize:"11px",color:"var(--red-600)",marginTop:"3px",display:"block"}}>{error}</span>}
    </div>
  );
}

/* ── Change Password Modal ─────────────────────────────────── */
function ChangePasswordModal({ onClose, onSuccess }) {
  const [pw,  setPw]  = useState({ current:"", newPw:"", confirm:"" });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const set = k => v => setPw(f=>({...f,[k]:v}));

  const validate = () => {
    const e = {};
    if (!pw.current.trim())             e.current = "Current password is required.";
    e.newPw = validatePasswordStrength(pw.newPw, "New password");
    if (!e.newPw) delete e.newPw;
    if (!pw.confirm.trim())             e.confirm = "Please confirm your new password.";
    else if (pw.newPw !== pw.confirm)   e.confirm = "Passwords do not match.";
    setErr(e); return !Object.keys(e).length;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(); }, 800);
  };

  const score = pwScore(pw.newPw);
  const level = LEVELS[Math.max(0, score - 1)];

  return (
    <Modal size="md" onClose={onClose}>
      <ModalHeader icon={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} iconBg="#f0fdf4" iconColor="#1a5c1a">
        Change Password
      </ModalHeader>
      <ModalBody>
        <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
          <PasswordField label="Current Password"      value={pw.current} onChange={set("current")} error={err.current}/>
          <div className="form-grid-2">
            <PasswordField label="New Password"         value={pw.newPw}  onChange={set("newPw")}  error={err.newPw}/>
            <PasswordField label="Confirm New Password" value={pw.confirm} onChange={set("confirm")} error={err.confirm}/>
          </div>
          {pw.newPw && (
            <div>
              <div style={{display:"flex",gap:"6px",marginBottom:"6px"}}>
                {LEVELS.map((l,i)=>(<div key={l.label} style={{flex:1,height:"6px",borderRadius:"99px",background:i<score?level.color:"var(--gray-200)"}}/>))}
              </div>
              <span style={{fontSize:"11px",fontWeight:600,color:level.color}}>{level.label}</span>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {[["At least 6 characters",pw.newPw.length>=6],["One uppercase letter",/[A-Z]/.test(pw.newPw)],["One number",/[0-9]/.test(pw.newPw)],["One special character",/[^A-Za-z0-9]/.test(pw.newPw)]].map(([text,met])=>(
              <div key={text} style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"12px",color:met?"#15803d":"var(--gray-400)"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:met?"#15803d":"var(--gray-300)",flexShrink:0}}/>
                {text}
              </div>
            ))}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading?<><span style={{width:12,height:12,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/> Updating…</>:"Update Password"}
        </button>
      </ModalFooter>
    </Modal>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function ProfilePage({ role = "admin" }) {
  const [editing,     setEditing]     = useState(false);
  const [toast,       setToast]       = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);

  const INITIAL = { firstName:"Jane", lastName:"Doe", email:"janedoe@deped.gov.ph", role: role === "admin" ? "Admin" : role === "principal" ? "Principal" : "Registrar", employeeId:"EMP-2024-0042", school:"M.C.P.B.A.H.S", department:"School Administration", contactNumber:"+63 912 345 6789" };
  const [form,  setForm]  = useState(INITIAL);
  const [draft, setDraft] = useState(INITIAL);
  const set = (k,v) => setDraft(f=>({...f,[k]:v}));

  const handleSave = () => { setForm(draft); setEditing(false); setToast("Profile successfully updated"); };
  const initials   = `${form.firstName[0]}${form.lastName[0]}`.toUpperCase();

  return (
    <div className="page-layout">
      <Sidebar role={role}/>
      <main id="main-content" className="page-main">
        <div className="page-body">
          <div style={{marginBottom:"28px"}}>
            <h1 className="page-title">Profile</h1>
            <p className="page-subtitle">View and manage your account information.</p>
          </div>

          <div className="form-card" style={{padding:0,overflow:"hidden"}}>
            {/* Banner */}
            <div style={{height:"80px",background:"linear-gradient(135deg,#1a5c1a 0%,#27ae60 100%)"}}/>

            {/* Avatar + name */}
            <div style={{padding:"0 32px 24px",position:"relative"}}>
              <div style={{width:"80px",height:"80px",borderRadius:"50%",background:"var(--green-800)",border:"4px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",marginTop:"-40px",marginBottom:"12px",boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
                <span style={{fontSize:"26px",fontWeight:700,color:"#fff",letterSpacing:"1px"}}>{initials}</span>
              </div>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                <div>
                  <h2 style={{fontSize:"18px",fontWeight:700,color:"var(--gray-900)",margin:"0 0 4px"}}>{form.firstName} {form.lastName}</h2>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:"5px",fontSize:"12px",fontWeight:600,color:"var(--green-800)",background:"var(--green-50)",border:"1px solid var(--green-200)",borderRadius:"20px",padding:"3px 10px"}}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {form.role}
                    </span>
                    <span style={{fontSize:"12px",color:"var(--gray-400)"}}>{form.employeeId}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:"8px"}}>
                  {!editing
                    ? <button className="btn btn-outline" onClick={()=>{setDraft(form);setEditing(true);}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit Profile
                      </button>
                    : <>
                        <button className="btn btn-outline" onClick={()=>{setDraft(form);setEditing(false);}}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                          Save Changes
                        </button>
                      </>
                  }
                </div>
              </div>
            </div>

            <div className="form-divider" style={{margin:"0 32px"}}/>

            <div style={{padding:"28px 32px 32px",display:"flex",flexDirection:"column",gap:"28px"}}>
              {/* Personal Info */}
              <div>
                <h3 className="form-section-title">Personal Information</h3>
                <div className="form-divider"/>
                <div className="form-grid-2" style={{marginTop:"16px"}}>
                  <FieldRow label="First Name"     value={editing?draft.firstName:form.firstName}         editing={editing} onChange={v=>set("firstName",v)}/>
                  <FieldRow label="Last Name"      value={editing?draft.lastName:form.lastName}           editing={editing} onChange={v=>set("lastName",v)}/>
                  <FieldRow label="Email Address"  value={editing?draft.email:form.email}                 editing={editing} onChange={v=>set("email",v)} type="email"/>
                  <FieldRow label="Contact Number" value={editing?draft.contactNumber:form.contactNumber} editing={editing} onChange={v=>set("contactNumber",v)}/>
                </div>
              </div>

              {/* School Info */}
              <div>
                <h3 className="form-section-title">School Information</h3>
                <div className="form-divider"/>
                <div className="form-grid-2" style={{marginTop:"16px"}}>
                  <FieldRow label="Role"        value={form.role}       editing={editing} onChange={()=>{}} readOnly/>
                  <FieldRow label="Employee ID" value={form.employeeId} editing={editing} onChange={()=>{}} readOnly/>
                  <FieldRow label="School"      value={form.school}     editing={editing} onChange={()=>{}} readOnly/>
                  <FieldRow label="Department"  value={editing?draft.department:form.department} editing={editing} onChange={v=>set("department",v)}/>
                </div>
              </div>

              {/* Change Password */}
              <div>
                <h3 className="form-section-title">Change Password</h3>
                <div className="form-divider"/>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0"}}>
                  <div>
                    <p style={{fontSize:"13px",fontWeight:600,color:"var(--gray-700)",margin:"0 0 2px"}}>Password</p>
                    <p style={{fontSize:"12px",color:"var(--gray-400)",margin:0}}>Last changed: never</p>
                  </div>
                  <button className="btn btn-outline" onClick={()=>setShowPwModal(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {toast && <Toast message={toast} onClose={()=>setToast(null)}/>}
      {showPwModal && <ChangePasswordModal onClose={()=>setShowPwModal(false)} onSuccess={()=>{setShowPwModal(false);setToast("Password changed successfully.");}}/>}
    </div>
  );
}


