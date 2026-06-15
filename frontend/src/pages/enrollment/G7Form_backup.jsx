/**
 * G7Form.jsx
 * ─────────────────────────────────────────────────────────────────
 * Multi-step enrollment form for Grade 7.
 *
 * Responsibilities (this file only):
 *   • Render the 4-step wizard UI
 *   • Manage local form field state
 *   • Delegate all API/async concerns to useEnrollmentSubmit
 *
 * API logic lives in:  ./enrollmentApi.js
 * Async state lives in: ./useEnrollmentSubmit.js
 * ─────────────────────────────────────────────────────────────────
 */

import "../../Css/EnrollmentForm/G7Form.css";
import { useState, useCallback } from "react";

import PublicNavbar from "../../Components/PublicNavbar";
import PublicFooter from "../../Components/PublicFooter";
import logo         from "../../assets/school-logo.png";

import { useFormSubmit } from "../../hooks/useFormSubmit";
// 🔁 MODIFIED — added fetch and update alongside existing import
import {
  submitEnrollment,
  fetchEnrollment,    // ✅ ADDED
  updateEnrollment,   // ✅ ADDED
} from "../../Api/EnrollmentApi";
import EnrollmentFormErrorBoundary from "../../Components/EnrollmentFormErrorBoundary";

function SectionHeading({ children }) {
  return <div className="section-heading">{children}</div>;
}

function FormField({ label, children, full = false }) {
  return (
    <div className={`form-field${full ? " form-grid-full" : ""}`}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function FormInput({ type = "text", value, onChange, placeholder = "", ...props }) {
  return (
    <input
      type={type}
      className="form-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  );
}

function FormSelect({ value, onChange, options }) {
  return (
    <select className="form-select" value={value} onChange={onChange}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
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

function UploadBox({ label, file, onFile }) {
  return (
    <div className={`upload-box${file ? " has-file" : ""}`}>
      <input type="file" onChange={e => onFile(e.target.files[0] || null)} />
      <span className="upload-icon">{file ? "📄" : "📎"}</span>
      <span className="upload-label">{label}</span>
      {file
        ? <span className="upload-filename">{file.name}</span>
        : <span className="upload-hint">Click to upload</span>}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled = false }) {
  return (
    <button
      type="button"
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
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

// ─── Step bar ───────────────────────────────────────────────────

const STEPS = ["Personal Info", "Address", "Parents", "Attachments"];

function StepBar({ current }) {
  const pct = (current / (STEPS.length - 1)) * 100;
  return (
    <div className="step-bar">
      <div className="step-bar-track">
        <div className="step-bar-progress" style={{ width: `${pct}%` }} />
      </div>
      {STEPS.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "";
        return (
          <div key={label} className="step-item">
            <div className={`step-dot${state ? ` ${state}` : ""}`}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`step-label${state ? ` ${state}` : ""}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Form default state ─────────────────────────────────────────

const EMPTY_FORM = {
  withLRN: "Yes", lrn: "",
  lastName: "", firstName: "", middleName: "", nameExt: "",
  birthDate: "", sex: "", age: "", motherTongue: "", religion: "", placeOfBirth: "",
  isIP: "No", ipSpecify: "", is4Ps: "No", householdId: "", isPWD: "No",
  houseNo: "", barangay: "", streetName: "", municipality: "",
  province: "", country: "Philippines", zipCode: "", contactNumber: "",
  fatherLast: "", fatherFirst: "", fatherMiddle: "", fatherExt: "",
  motherLast: "", motherFirst: "", motherMiddle: "", motherExt: "",
  consentImages: false, consentData: false,
};

const EMPTY_FILES = { idPic: null, signature: null, birthCert: null, reportCard: null };

// ─── Main component ─────────────────────────────────────────────

function G7FormComponent() {
  const [step, setStep]   = useState(0);
  const [f,    setF]      = useState(EMPTY_FORM);
  const [files, setFiles] = useState(EMPTY_FILES);

  // All async/API state is owned by the hook.
  const { submit, submitting, error, succeeded, reset } = useFormSubmit(submitEnrollment);
  // ── Field helpers ──────────────────────────────────────────────

  // Generic updater for string/select/YesNo fields.
  const upd = useCallback(
    key => e => setF(prev => ({ ...prev, [key]: e?.target ? e.target.value : e })),
    []
  );

  // Toggler for boolean consent checkboxes.
  const toggle = useCallback(
    key => () => setF(prev => ({ ...prev, [key]: !prev[key] })),
    []
  );

  // File slot updater.
  const setFile = useCallback(
    key => value => setFiles(prev => ({ ...prev, [key]: value })),
    []
  );

  // ✅ ADDED — insert everything below here ──────────────────────

  const [fetching,   setFetching]   = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const handleLrnLookup = useCallback(async (lrn) => {
    if (!lrn || lrn.length < 12) return;
    setFetching(true);
    setFetchError(null);

    const result = await fetchEnrollment(lrn);

    setFetching(false);
    if (!result.ok) {
      setFetchError(result.error);
      return;
    }
    if (!result.data) return; // 404 → first-time enrollee, nothing to prefill

    setF(prev => {
      const next = { ...prev };
      Object.entries(result.data).forEach(([k, v]) => {
        if (k in next && !next[k]) next[k] = v;
      });
      return next;
    });
  }, []);

  const saveDraft = useCallback(async () => {
    if (!f.lrn) return;
    const result = await updateEnrollment(f.lrn, f, files);
    if (!result.ok) setFetchError(result.error);
  }, [f, files]);

  // ─────────────────────────────────────────────────────────────

  // ── Submission guard ───────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    if (!f.consentImages || !f.consentData) {
      alert("Please check both consent boxes before submitting.");
      return;
    }
    submit(f, files);
  }, [f, files, submit]);

  // ── Full reset ─────────────────────────────────────────────────

// 🔁 MODIFIED
  const handleReset = useCallback(() => {
    reset();
    setStep(0);
    setF(EMPTY_FORM);
    setFiles(EMPTY_FILES);
    setFetchError(null); // ✅ ADDED
  }, [reset]);

  // ─── Step renderers ────────────────────────────────────────────

  const renderPersonal = () => (
    <div>
      <SectionHeading>Learner Information</SectionHeading>

      <div className="form-grid" style={{ marginBottom: "1rem" }}>
        <FormField label="With LRN?">
          <YesNo value={f.withLRN} onChange={upd("withLRN")} />
        </FormField>
       {f.withLRN === "Yes" && (
          <FormField label="Learner Reference No. (LRN)">
            {/* 🔁 MODIFIED — raw <input> to add onBlur; className unchanged */}
            <input
              type="text"
              className="form-input"
              value={f.lrn}
              onChange={upd("lrn")}
              placeholder="12-digit LRN"
              onBlur={() => handleLrnLookup(f.lrn)}
            />
            {/* ✅ ADDED — inline hint, no new CSS class */}
            {fetching && (
              <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "4px", display: "block" }}>
                Looking up LRN…
              </span>
            )}
          </FormField>
        )}
      </div>

      <div className="form-grid">
        <FormField label="Last Name">
          <FormInput value={f.lastName} onChange={upd("lastName")} />
        </FormField>
        <FormField label="First Name">
          <FormInput value={f.firstName} onChange={upd("firstName")} />
        </FormField>
        <FormField label="Middle Name">
          <FormInput value={f.middleName} onChange={upd("middleName")} />
        </FormField>
        <FormField label="Name Extension">
          <FormInput value={f.nameExt} onChange={upd("nameExt")} placeholder="Jr., Sr., III" />
        </FormField>
        <FormField label="Birth Date">
          <FormInput type="date" value={f.birthDate} onChange={upd("birthDate")} />
        </FormField>
        <FormField label="Sex">
          <FormSelect value={f.sex} onChange={upd("sex")} options={[
            { value: "", label: "Select…" },
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
          ]} />
        </FormField>
        <FormField label="Age">
          <FormInput type="number" value={f.age} onChange={upd("age")} placeholder="e.g. 12" />
        </FormField>
        <FormField label="Mother Tongue">
          <FormInput value={f.motherTongue} onChange={upd("motherTongue")} placeholder="e.g. Filipino" />
        </FormField>
        <FormField label="Religion">
          <FormInput value={f.religion} onChange={upd("religion")} placeholder="e.g. Roman Catholic" />
        </FormField>
        <FormField label="Place of Birth">
          <FormInput value={f.placeOfBirth} onChange={upd("placeOfBirth")} placeholder="City / Municipality" />
        </FormField>
      </div>

      <div className="gap-md" />
      <SectionHeading>Learner Background</SectionHeading>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[
          { q: "Is the learner part of an Indigenous People (IP) / Indigenous Cultural Community?", key: "isIP",  specKey: "ipSpecify",  specLabel: "Please specify community" },
          { q: "Is the family a beneficiary of the 4Ps program?",                                  key: "is4Ps", specKey: "householdId", specLabel: "4Ps Household ID Number" },
          { q: "Is the learner a Person with Disability (PWD)?",                                   key: "isPWD" },
        ].map(({ q, key, specKey, specLabel }) => (
          <div key={key} className="condition-row">
            <span className="condition-label">{q}</span>
            <div className="condition-input-wrap">
              <YesNo value={f[key]} onChange={upd(key)} />
            </div>
            {specKey && f[key] === "Yes" && (
              <div className="condition-extra">
                <FormInput value={f[specKey]} onChange={upd(specKey)} placeholder={specLabel} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAddress = () => (
    <div>
      <SectionHeading>Current Address</SectionHeading>
      <div className="form-grid">
        <FormField label="House No.">
          <FormInput value={f.houseNo} onChange={upd("houseNo")} placeholder="e.g. 123" />
        </FormField>
        <FormField label="Street Name">
          <FormInput value={f.streetName} onChange={upd("streetName")} />
        </FormField>
        <FormField label="Barangay">
          <FormInput value={f.barangay} onChange={upd("barangay")} />
        </FormField>
        <FormField label="Municipality / City">
          <FormInput value={f.municipality} onChange={upd("municipality")} />
        </FormField>
        <FormField label="Province">
          <FormInput value={f.province} onChange={upd("province")} />
        </FormField>
        <FormField label="Country">
          <FormInput value="Philippines" readOnly />
        </FormField>
        <FormField label="Zip Code">
          <FormInput value={f.zipCode} onChange={upd("zipCode")} placeholder="e.g. 1000" />
        </FormField>
      </div>

      <div className="gap-md" />
      <SectionHeading>Contact Information</SectionHeading>
      <div className="form-grid">
        <FormField label="Contact Number">
          <FormInput value={f.contactNumber} onChange={upd("contactNumber")} placeholder="09XX XXX XXXX" />
        </FormField>
      </div>
    </div>
  );

  const renderParents = () => (
    <div>
      {[
        { title: "Father's Name",          keys: ["fatherLast", "fatherFirst", "fatherMiddle", "fatherExt"] },
        { title: "Mother's Maiden Name",   keys: ["motherLast", "motherFirst", "motherMiddle", "motherExt"] },
      ].map(({ title, keys }, gi) => (
        <div key={title}>
          {gi > 0 && <div className="gap-md" />}
          <SectionHeading>{title}</SectionHeading>
          <div className="form-grid">
            {["Last Name", "First Name", "Middle Name", "Name Extension"].map((lbl, i) => (
              <FormField key={lbl} label={lbl}>
                <FormInput
                  value={f[keys[i]]}
                  onChange={upd(keys[i])}
                  placeholder={lbl === "Name Extension" ? "Jr., Sr." : ""}
                />
              </FormField>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAttachments = () => (
    <div>
      <SectionHeading>Required Documents</SectionHeading>
      <div className="upload-grid">
        <UploadBox label="(2×2) ID Picture"           file={files.idPic}      onFile={setFile("idPic")} />
        <UploadBox label="E-Signature"                 file={files.signature}  onFile={setFile("signature")} />
        <UploadBox label="Birth Certificate (PSA/NSO)" file={files.birthCert}  onFile={setFile("birthCert")} />
        <UploadBox label="Form 137 or Report Card"     file={files.reportCard} onFile={setFile("reportCard")} />
      </div>

      <div className="gap-md" />
      <SectionHeading>Consent &amp; Certification</SectionHeading>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <ConsentBox checked={f.consentImages} onToggle={toggle("consentImages")}>
          I hereby allow the use of my images and signature for educational purposes only. I understand
          that these materials will be used solely for academic documentation, presentations, or reports,
          and will not be distributed, sold, or used for any commercial or unauthorized purposes.
        </ConsentBox>
        <ConsentBox checked={f.consentData} onToggle={toggle("consentData")}>
          I hereby certify that the above information given are true and correct to the best of my knowledge
          and I allow the Department of Education to use my child's details for the early registration data
          collection. The information herein shall be treated as confidential in compliance with the Data
          Privacy Act of 2012.
        </ConsentBox>
      </div>
    </div>
  );

  const stepRenderers = [renderPersonal, renderAddress, renderParents, renderAttachments];

  // ─── Success screen ────────────────────────────────────────────

  if (succeeded) return (
    <div className="page-wrapper">
      <PublicNavbar showLinks />
      <div className="success-wrap">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2 className="success-title">Form Submitted!</h2>
          <p className="success-body">
            Thank you for submitting your enrollment form for{" "}
            <strong>Maria Cristina P. Belcar Agricultural High School</strong>.
            We will review your application and contact you shortly.
          </p>
          <Btn onClick={handleReset}>Submit Another</Btn>
        </div>
      </div>
      <PublicFooter />
    </div>
  );

  // ─── Main form ─────────────────────────────────────────────────

  return (
    <div className="page-wrapper">
      <PublicNavbar showLinks />

      <main className="form-main">
        <a href="/" className="form-back-link">← Back</a>

        <div className="form-card">
          {/* Green header */}
          <div className="form-header">
            <div className="form-header-top">
              <div className="logo-ring">
                <img src={logo} alt="School logo" />
              </div>
              <div>
                <div className="form-school-name">
                  Maria Cristina P. Belcar Agricultural High School
                </div>
                <div className="form-subtitle">
                  Enrollment Form · School Year 2025–2026 · Grade 7
                </div>
              </div>
            </div>
            <StepBar current={step} />
          </div>

          {/* Body — key forces re-animation on step change */}
          <div className="form-body" key={step}>
            {stepRenderers[step]()}
          </div>

          {/* Footer nav */}
          <div className="form-footer">
            <Btn
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0 || submitting}
            >
              ← Back
            </Btn>

            <span className="form-step-counter">Step {step + 1} / {STEPS.length}</span>

              {step < STEPS.length - 1 ? (
              // 🔁 MODIFIED — saves draft before advancing
              <Btn onClick={async () => { await saveDraft(); setStep(s => s + 1); }}>Next →</Btn>
            ) : (
              <Btn onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Form"}
              </Btn>
            )}
          </div>

          {/* Error banner — only shown when the API call fails */}
          {/* 🔁 MODIFIED — surfaces both submission and fetch/draft errors */}
          {(error || fetchError) && (
            <div className="submit-error-banner" role="alert">
              ⚠ {error || fetchError}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT (wrapped with error boundary)
// ═══════════════════════════════════════════════════════════════
function G7FormComponent() {
  const [step, setStep]   = useState(0);
  const [f,    setF]      = useState(EMPTY_FORM);
  const [files, setFiles] = useState(EMPTY_FILES);

  // All async/API state is owned by the hook.
  const { submit, submitting, error, succeeded, reset } = useFormSubmit(submitEnrollment);
  // ── Field helpers ──────────────────────────────────────────────

  // Generic updater for string/select/YesNo fields.
  const upd = useCallback(
    key => e => setF(prev => ({ ...prev, [key]: e?.target ? e.target.value : e })),
    []
  );

  // Toggler for boolean consent checkboxes.
  const toggle = useCallback(
    key => () => setF(prev => ({ ...prev, [key]: !prev[key] })),
    []
  );

  // File slot updater.
  const setFile = useCallback(
    key => value => setFiles(prev => ({ ...prev, [key]: value })),
    []
  );

  // ✅ ADDED — insert everything below here ──────────────────────

  const [fetching,   setFetching]   = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const handleLrnLookup = useCallback(async (lrn) => {
    if (!lrn || lrn.length < 12) return;
    setFetching(true);
    setFetchError(null);

    const result = await fetchEnrollment(lrn);

    setFetching(false);
    if (!result.ok) {
      setFetchError(result.error);
      return;
    }
    if (!result.data) return; // 404 → first-time enrollee, nothing to prefill

    setF(prev => {
      const next = { ...prev };
      Object.entries(result.data).forEach(([k, v]) => {
        if (k in next && !next[k]) next[k] = v;
      });
      return next;
    });
  }, []);

  const saveDraft = useCallback(async () => {
    if (!f.lrn) return;
    const result = await updateEnrollment(f.lrn, f, files);
    if (!result.ok) setFetchError(result.error);
  }, [f, files]);

  // ─────────────────────────────────────────────────────────────

  // ── Submission guard ───────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    if (!f.consentImages || !f.consentData) {
      alert("Please check both consent boxes before submitting.");
      return;
    }
    submit(f, files);
  }, [f, files, submit]);

  // ── Full reset ─────────────────────────────────────────────────

// 🔁 MODIFIED
  const handleReset = useCallback(() => {
    reset();
    setStep(0);
    setF(EMPTY_FORM);
    setFiles(EMPTY_FILES);
    setFetchError(null); // ✅ ADDED
  }, [reset]);

  // ─── Step renderers ────────────────────────────────────────────

  const renderPersonal = () => (
    <div>
      <SectionHeading>Learner Information</SectionHeading>

      <div className="form-grid" style={{ marginBottom: "1rem" }}>
        <FormField label="With LRN?">
          <YesNo value={f.withLRN} onChange={upd("withLRN")} />
        </FormField>
       {f.withLRN === "Yes" && (
          <FormField label="Learner Reference No. (LRN)">
            {/* 🔁 MODIFIED — raw <input> to add onBlur; className unchanged */}
            <input
              type="text"
              className="form-input"
              value={f.lrn}
              onChange={upd("lrn")}
              placeholder="12-digit LRN"
              onBlur={() => handleLrnLookup(f.lrn)}
            />
            {/* ✅ ADDED — inline hint, no new CSS class */}
            {fetching && (
              <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "4px", display: "block" }}>
                Looking up LRN…
              </span>
            )}
          </FormField>
        )}
      </div>

      <div className="form-grid">
        <FormField label="Last Name">
          <FormInput value={f.lastName} onChange={upd("lastName")} />
        </FormField>
        <FormField label="First Name">
          <FormInput value={f.firstName} onChange={upd("firstName")} />
        </FormField>
        <FormField label="Middle Name">
          <FormInput value={f.middleName} onChange={upd("middleName")} />
        </FormField>
        <FormField label="Name Extension">
          <FormInput value={f.nameExt} onChange={upd("nameExt")} placeholder="Jr., Sr., III" />
        </FormField>
        <FormField label="Birth Date">
          <FormInput type="date" value={f.birthDate} onChange={upd("birthDate")} />
        </FormField>
        <FormField label="Sex">
          <FormSelect value={f.sex} onChange={upd("sex")} options={[
            { value: "", label: "Select…" },
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
          ]} />
        </FormField>
        <FormField label="Age">
          <FormInput type="number" value={f.age} onChange={upd("age")} placeholder="e.g. 12" />
        </FormField>
        <FormField label="Mother Tongue">
          <FormInput value={f.motherTongue} onChange={upd("motherTongue")} placeholder="e.g. Filipino" />
        </FormField>
        <FormField label="Religion">
          <FormInput value={f.religion} onChange={upd("religion")} placeholder="e.g. Roman Catholic" />
        </FormField>
        <FormField label="Place of Birth">
          <FormInput value={f.placeOfBirth} onChange={upd("placeOfBirth")} placeholder="City / Municipality" />
        </FormField>
      </div>

      <div className="gap-md" />
      <SectionHeading>Learner Background</SectionHeading>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[
          { q: "Is the learner part of an Indigenous People (IP) / Indigenous Cultural Community?", key: "isIP",  specKey: "ipSpecify",  specLabel: "Please specify community" },
          { q: "Is the family a beneficiary of the 4Ps program?",                                  key: "is4Ps", specKey: "householdId", specLabel: "4Ps Household ID Number" },
          { q: "Is the learner a Person with Disability (PWD)?",                                   key: "isPWD" },
        ].map(({ q, key, specKey, specLabel }) => (
          <div key={key} className="condition-row">
            <span className="condition-label">{q}</span>
            <div className="condition-input-wrap">
              <YesNo value={f[key]} onChange={upd(key)} />
            </div>
            {specKey && f[key] === "Yes" && (
              <div className="condition-extra">
                <FormInput value={f[specKey]} onChange={upd(specKey)} placeholder={specLabel} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAddress = () => (
    <div>
      <SectionHeading>Current Address</SectionHeading>
      <div className="form-grid">
        <FormField label="House No.">
          <FormInput value={f.houseNo} onChange={upd("houseNo")} placeholder="e.g. 123" />
        </FormField>
        <FormField label="Street Name">
          <FormInput value={f.streetName} onChange={upd("streetName")} />
        </FormField>
        <FormField label="Barangay">
          <FormInput value={f.barangay} onChange={upd("barangay")} />
        </FormField>
        <FormField label="Municipality / City">
          <FormInput value={f.municipality} onChange={upd("municipality")} />
        </FormField>
        <FormField label="Province">
          <FormInput value={f.province} onChange={upd("province")} />
        </FormField>
        <FormField label="Country">
          <FormInput value="Philippines" readOnly />
        </FormField>
        <FormField label="Zip Code">
          <FormInput value={f.zipCode} onChange={upd("zipCode")} placeholder="e.g. 1000" />
        </FormField>
      </div>

      <div className="gap-md" />
      <SectionHeading>Contact Information</SectionHeading>
      <div className="form-grid">
        <FormField label="Contact Number">
          <FormInput value={f.contactNumber} onChange={upd("contactNumber")} placeholder="09XX XXX XXXX" />
        </FormField>
      </div>
    </div>
  );

  const renderParents = () => (
    <div>
      {[
        { title: "Father's Name",          keys: ["fatherLast", "fatherFirst", "fatherMiddle", "fatherExt"] },
        { title: "Mother's Maiden Name",   keys: ["motherLast", "motherFirst", "motherMiddle", "motherExt"] },
      ].map(({ title, keys }, gi) => (
        <div key={title}>
          {gi > 0 && <div className="gap-md" />}
          <SectionHeading>{title}</SectionHeading>
          <div className="form-grid">
            {["Last Name", "First Name", "Middle Name", "Name Extension"].map((lbl, i) => (
              <FormField key={lbl} label={lbl}>
                <FormInput
                  value={f[keys[i]]}
                  onChange={upd(keys[i])}
                  placeholder={lbl === "Name Extension" ? "Jr., Sr." : ""}
                />
              </FormField>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAttachments = () => (
    <div>
      <SectionHeading>Required Documents</SectionHeading>
      <div className="upload-grid">
        <UploadBox label="(2×2) ID Picture"           file={files.idPic}      onFile={setFile("idPic")} />
        <UploadBox label="E-Signature"                 file={files.signature}  onFile={setFile("signature")} />
        <UploadBox label="Birth Certificate (PSA/NSO)" file={files.birthCert}  onFile={setFile("birthCert")} />
        <UploadBox label="Form 137 or Report Card"     file={files.reportCard} onFile={setFile("reportCard")} />
      </div>

      <div className="gap-md" />
      <SectionHeading>Consent &amp; Certification</SectionHeading>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <ConsentBox checked={f.consentImages} onToggle={toggle("consentImages")}>
          I hereby allow the use of my images and signature for educational purposes only. I understand
          that these materials will be used solely for academic documentation, presentations, or reports,
          and will not be distributed, sold, or used for any commercial or unauthorized purposes.
        </ConsentBox>
        <ConsentBox checked={f.consentData} onToggle={toggle("consentData")}>
          I hereby certify that the above information given are true and correct to the best of my knowledge
          and I allow the Department of Education to use my child's details for the early registration data
          collection. The information herein shall be treated as confidential in compliance with the Data
          Privacy Act of 2012.
        </ConsentBox>
      </div>
    </div>
  );

  const stepRenderers = [renderPersonal, renderAddress, renderParents, renderAttachments];

  // ─── Success screen ────────────────────────────────────────────

  if (succeeded) return (
    <div className="page-wrapper">
      <PublicNavbar showLinks />
      <div className="success-wrap">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2 className="success-title">Form Submitted!</h2>
          <p className="success-body">
            Thank you for submitting your enrollment form for{" "}
            <strong>Maria Cristina P. Belcar Agricultural High School</strong>.
            We will review your application and contact you shortly.
          </p>
          <Btn onClick={handleReset}>Submit Another</Btn>
        </div>
      </div>
      <PublicFooter />
    </div>
  );

  // ─── Main form ─────────────────────────────────────────────────

  return (
    <div className="page-wrapper">
      <PublicNavbar showLinks />

      <main className="form-main">
        <a href="/" className="form-back-link">← Back</a>

        <div className="form-card">
          {/* Green header */}
          <div className="form-header">
            <div className="form-header-top">
              <div className="logo-ring">
                <img src={logo} alt="School logo" />
              </div>
              <div>
                <div className="form-school-name">
                  Maria Cristina P. Belcar Agricultural High School
                </div>
                <div className="form-subtitle">
                  Enrollment Form · School Year 2025–2026 · Grade 7
                </div>
              </div>
            </div>
            <StepBar current={step} />
          </div>

          {/* Body — key forces re-animation on step change */}
          <div className="form-body" key={step}>
            {stepRenderers[step]()}
          </div>

          {/* Footer nav */}
          <div className="form-footer">
            <Btn
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0 || submitting}
            >
              ← Back
            </Btn>

            <span className="form-step-counter">Step {step + 1} / {STEPS.length}</span>

              {step < STEPS.length - 1 ? (
              // 🔁 MODIFIED — saves draft before advancing
              <Btn onClick={async () => { await saveDraft(); setStep(s => s + 1); }}>Next →</Btn>
            ) : (
              <Btn onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Form"}
              </Btn>
            )}
          </div>

          {/* Error banner — only shown when the API call fails */}
          {/* 🔁 MODIFIED — surfaces both submission and fetch/draft errors */}
          {(error || fetchError) && (
            <div className="submit-error-banner" role="alert">
              ⚠ {error || fetchError}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function G7Form() {
  return (
    <EnrollmentFormErrorBoundary>
      <G7FormComponent />
    </EnrollmentFormErrorBoundary>
  );
}


