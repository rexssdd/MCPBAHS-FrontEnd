import { useState, useCallback } from "react";
import Sidebar from "../../Components/Sidebar";
import AvatarUpload from "../../Components/AvatarUpload";
import { useProfile } from "../../hooks/useProfile";
import profileService from "../../services/Admin/Profile/profileService";
import ProfileErrorBoundary from "../../Components/ProfileErrorBoundary";
import "../../Css/Registrar/ProfilePage.css";

// ═══════════════════════════════════════════════════════════════
//  HELPERS  (pure, no side-effects)
// ═══════════════════════════════════════════════════════════════
function formatPasswordDate(iso) {
  if (!iso) return "Never";
  try {
    return new Intl.DateTimeFormat("en-PH", {
      year:  "numeric",
      month: "long",
      day:   "numeric",
    }).format(new Date(iso));
  } catch {
    return "Never";
  }
}

function getInitials(first, last) {
  return `${(first?.[0] ?? "?").toUpperCase()}${(last?.[0] ?? "?").toUpperCase()}`;
}

// ═══════════════════════════════════════════════════════════════
//  SUB-COMPONENTS  (UI only — zero data-fetching logic)
// ═══════════════════════════════════════════════════════════════

// ── Toast ──────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  return (
    <div className={`toast toast--${type}`}>
      <span className="toast-icon">
        {type === "success" ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </span>
      <span className="toast-msg">{message}</span>
      <button onClick={onClose} className="toast-close">×</button>
    </div>
  );
}

// ── Field Row ──────────────────────────────────────────────────
function FieldRow({ label, value, editing, onChange, type = "text", readOnly = false }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {editing && !readOnly ? (
        <input
          type={type}
          className="field-input"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className={`field-display${readOnly ? " field-display--readonly" : ""}`}>
          {value || <span className="field-empty">—</span>}
        </div>
      )}
    </div>
  );
}

// ── Password Field ─────────────────────────────────────────────
function PasswordField({ label, value, onChange, error }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="pw-wrap">
        <input
          type={show ? "text" : "password"}
          className={`field-input pw-input${error ? " field-input--error" : ""}`}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
        />
        <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} tabIndex={-1}>
          {show ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// ── Strength Bar ───────────────────────────────────────────────
const PW_LEVELS = [
  { label: "Weak",   color: "#ef4444" },
  { label: "Fair",   color: "#f97316" },
  { label: "Good",   color: "#eab308" },
  { label: "Strong", color: "#22c55e" },
];

function getScore(pw) {
  return [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length;
}

// ── Change Password Modal ──────────────────────────────────────
function ChangePasswordModal({ onClose, onSuccess }) {
  const [form,    setForm]    = useState({ current: "", newPw: "", confirm: "" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [apiErr,  setApiErr]  = useState("");

  const set = useCallback((k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setApiErr("");
  }, []);

  const validate = () => {
    const e = {};
    if (!form.current.trim())             e.current = "Current password is required.";
    if (!form.newPw.trim())               e.newPw   = "New password is required.";
    else if (form.newPw.length < 6)       e.newPw   = "Minimum 6 characters.";
    if (!form.confirm.trim())             e.confirm = "Please confirm your new password.";
    else if (form.newPw !== form.confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await profileService.changePassword({
        currentPassword: form.current,
        newPassword:     form.newPw,
      });
      onSuccess();
    } catch (err) {
      // Surface the real server error — no silent fake success
      setApiErr(err.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const score = getScore(form.newPw);
  const level = PW_LEVELS[Math.max(0, score - 1)];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a5c1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2 className="modal-title">Change Password</h2>
              <p className="modal-sub">Update your account password securely.</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-divider" />

        <div className="modal-body">
          {apiErr && (
            <div className="api-notice">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {apiErr}
            </div>
          )}

          <PasswordField label="Current Password"     value={form.current} onChange={(v) => set("current", v)} error={errors.current} />

          <div className="modal-row">
            <PasswordField label="New Password"         value={form.newPw}   onChange={(v) => set("newPw", v)}   error={errors.newPw} />
            <PasswordField label="Confirm New Password" value={form.confirm} onChange={(v) => set("confirm", v)} error={errors.confirm} />
          </div>

          {form.newPw && (
            <div className="pw-strength">
              <div className="pw-strength-bars">
                {PW_LEVELS.map((l, i) => (
                  <div
                    key={l.label}
                    className="pw-strength-bar"
                    style={{ background: i < score ? level.color : undefined }}
                  />
                ))}
              </div>
              <span className="pw-strength-label" style={{ color: level.color }}>{level.label}</span>
            </div>
          )}

          <div className="pw-requirements">
            {[
              ["At least 6 characters",      form.newPw.length >= 6],
              ["One uppercase letter (A–Z)", /[A-Z]/.test(form.newPw)],
              ["One number (0–9)",           /[0-9]/.test(form.newPw)],
              ["One special character",      /[^A-Za-z0-9]/.test(form.newPw)],
            ].map(([text, met]) => (
              <div key={text} className={`pw-req${met ? " pw-req--met" : ""}`}>
                <span className="pw-req-dot" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-divider" />

        <div className="modal-footer">
          <button className="btn btn--cancel" onClick={onClose}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            Cancel
          </button>
          <button className={`btn btn--save${loading ? " btn--loading" : ""}`} onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><span className="spinner" /> Updating…</>
              : <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Update Password
                </>
            }
          </button>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════
function ProfilePageComponent() {
  // ── All data/mutation logic lives in the hook ─────────────
  const {
    form,
    draft,
    editing,
    loading,
    saving,
    apiSource,
    avatarUploading,
    setDraftField,
    handleEdit,
    handleCancel,
    handleSave,
    handleAvatarUpload,
    handlePasswordChanged,
  } = useProfile();

  // ── Local UI-only state (toast, modal) ────────────────────
  const [showPwModal, setShowPwModal] = useState(false);
  const [toast,       setToast]       = useState(null); // { message, type }

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, []);

  // ── Save handler — bridges hook result to toast ───────────
  const onSave = useCallback(async () => {
    const result = await handleSave();
    if (result.success) {
      showToast("Profile successfully updated.");
    } else {
      showToast(result.error ?? "Failed to update profile.", "error");
    }
  }, [handleSave, showToast]);

  // ── Avatar upload handler — bridges hook result to toast ──
  const onAvatarUpload = useCallback(async (file, clientError) => {
    if (clientError) {
      showToast(clientError, "error");
      return;
    }
    const result = await handleAvatarUpload(file);
    if (result.success) {
      showToast("Profile picture updated.");
    } else {
      showToast(result.error ?? "Failed to upload profile picture.", "error");
    }
  }, [handleAvatarUpload, showToast]);

  const initials = getInitials(form.firstName, form.lastName);

  // ── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div className="profile-root">
        <Sidebar />
        <main className="profile-main">
          <div className="profile-header">
            <div>
              <h1 className="profile-title">Profile</h1>
              <p className="profile-sub">View and manage your account information.</p>
            </div>
          </div>
          <div className="profile-card">
            <div className="profile-banner" />
            <div className="profile-loading">
              <div className="loading-ring" />
              <p>Loading profile…</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Full page ─────────────────────────────────────────────
  return (
    <div className="profile-root">
      <Sidebar />

      <main className="profile-main">

        {/* ── Page Header ── */}
        <div className="profile-header">
          <div>
            <h1 className="profile-title">Profile</h1>
            <p className="profile-sub">View and manage your account information.</p>
          </div>
          <div className="status-badge">
            <span className="status-dot" />
            {apiSource === "api" ? "Live data" : "Default data"}
          </div>
        </div>

        {/* ── Profile Card ── */}
        <div className="profile-card">

          {/* Banner */}
          <div className="profile-banner" />

          {/* Identity */}
          <div className="profile-identity">
            <AvatarUpload
              imageUrl={form.profileImage}
              initials={initials}
              uploading={avatarUploading}
              onUpload={onAvatarUpload}
              name={`${form.firstName} ${form.lastName}`}
            />

            <div className="profile-name-row">
              <div>
                <h2 className="profile-name">{form.firstName} {form.lastName}</h2>
                <div className="profile-meta">
                  <span className="role-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    {form.role}
                  </span>
                  <span className="emp-id">{form.employeeId}</span>
                </div>
              </div>

              <div className="profile-actions">
                {!editing ? (
                  <button className="btn btn--edit" onClick={handleEdit}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="btn btn--cancel" onClick={handleCancel} disabled={saving}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      Cancel
                    </button>
                    <button className={`btn btn--save${saving ? " btn--loading" : ""}`} onClick={onSave} disabled={saving}>
                      {saving
                        ? <><span className="spinner" /> Saving…</>
                        : <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                              <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                            </svg>
                            Save Changes
                          </>
                      }
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="profile-divider" />

          {/* ── Form ── */}
          <div className="profile-form">

            {/* Personal Information */}
            <section className="form-section">
              <h3 className="section-title">Personal Information</h3>
              <div className="section-divider" />
              <div className="form-grid">
                <FieldRow
                  label="First Name"
                  value={editing ? draft.firstName     : form.firstName}
                  editing={editing}
                  onChange={(v) => setDraftField("firstName", v)}
                />
                <FieldRow
                  label="Last Name"
                  value={editing ? draft.lastName      : form.lastName}
                  editing={editing}
                  onChange={(v) => setDraftField("lastName", v)}
                />
                <FieldRow
                  label="Email Address"
                  value={editing ? draft.email         : form.email}
                  editing={editing}
                  onChange={(v) => setDraftField("email", v)}
                  type="email"
                />
                <FieldRow
                  label="Contact Number"
                  value={editing ? draft.contactNumber : form.contactNumber}
                  editing={editing}
                  onChange={(v) => setDraftField("contactNumber", v)}
                />
              </div>
            </section>

            {/* School Information */}
            <section className="form-section">
              <h3 className="section-title">School Information</h3>
              <div className="section-divider" />
              <div className="form-grid">
                <FieldRow label="Role"        value={form.role}       editing={editing} onChange={() => {}} readOnly />
                <FieldRow label="Employee ID" value={form.employeeId} editing={editing} onChange={() => {}} readOnly />
                <FieldRow label="School"      value={form.school}     editing={editing} onChange={() => {}} readOnly />
                <FieldRow
                  label="Department"
                  value={editing ? draft.department : form.department}
                  editing={editing}
                  onChange={(v) => setDraftField("department", v)}
                />
              </div>
            </section>

            {/* Security */}
            <section className="form-section">
              <h3 className="section-title">Security</h3>
              <div className="section-divider" />
              <div className="pw-trigger-row">
                <div className="pw-trigger-info">
                  <p className="pw-trigger-label">Password</p>
                  <p className="pw-trigger-sub">
                    Last changed: {formatPasswordDate(form.lastPasswordChange)}
                  </p>
                </div>
                <button className="btn btn--change-pw" onClick={() => setShowPwModal(true)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Change Password
                </button>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Change Password Modal */}
      {showPwModal && (
        <ChangePasswordModal
          onClose={() => setShowPwModal(false)}
          onSuccess={() => {
            setShowPwModal(false);
            handlePasswordChanged();            // optimistic timestamp update
            showToast("Password changed successfully.");
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT (wrapped with error boundary)
// ═══════════════════════════════════════════════════════════════
export default function ProfilePage() {
  return (
    <ProfileErrorBoundary>
      <ProfilePageComponent />
    </ProfileErrorBoundary>
  );
}