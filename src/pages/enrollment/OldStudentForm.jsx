/**
 * OldStudentForm.jsx
 * ─────────────────────────────────────────────────────────────────
 * Multi-step re-enrollment form for returning students.
 *
 * Responsibilities (this file only):
 *   • Render the 4-step wizard UI
 *   • Manage local form field + file state
 *   • Delegate all API / async concerns to useRecurringEnrollmentSubmit
 *
 * API logic  → ./recurringEnrollmentApi.js
 * Async state → ./useRecurringEnrollmentSubmit.js
 * ─────────────────────────────────────────────────────────────────
 */

import "../../Css/EnrollmentForm/G7Form.css";
import { useState, useCallback } from "react";

import PublicNavbar from "../../Components/PublicNavbar";
import PublicFooter from "../../Components/PublicFooter";
import EnrollmentFormErrorBoundary from "../../Components/EnrollmentFormErrorBoundary";
import { SearchableSelect } from "../../Components/ui";
import logo         from "../../assets/school-logo.png";

import { useFormSubmit } from "../../hooks/useFormSubmit";
// 🔁 MODIFIED — added fetch and update alongside existing import
import {
  submitRecurringEnrollment,
  fetchRecurringEnrollment,   
  updateRecurringEnrollment, 
} from "../../Api/recurringEnrollmentApi";
import {
  hasValidationErrors,
  normalizeEnrollmentField,
  validateOldStudentStep,
} from "../../utils/enrollmentFormValidation";
import { ALL_PROVINCES, getCityOptions } from "../../utils/philippineLocations";
// ─── Tiny primitives ────────────────────────────────────────────

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

function FormInput({ type = "text", value, onChange, placeholder = "Enter value" }) {
  return (
    <input
      type={type}
      className="form-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={type === "text" ? 120 : undefined}
      autoComplete="off"
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

const STEPS = ["Student Info", "Address", "School Info", "Attachments"];

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
  studentId: "", lrn: "",
  lastName: "", firstName: "",
  contactNumber: "",
  houseNo: "", barangay: "", municipality: "", province: "", zipCode: "",
  lastGradeLevel: "", section: "", schoolYearLastAttended: "",
  is4Ps: "No", isPWD: "No",
  consentImages: false, consentData: false,
};

const EMPTY_FILES = { idPic: null, reportCard: null };

// ─── Main component ─────────────────────────────────────────────

function OldStudentFormComponent() {
  const [step,  setStep]  = useState(0);
  const [f,     setF]     = useState(EMPTY_FORM);
  const [files, setFiles] = useState(EMPTY_FILES);
  const [validationErrors, setValidationErrors] = useState({});

  const { submit, submitting, error, succeeded, reset } = useFormSubmit(submitRecurringEnrollment);

  // ── Field helpers ──────────────────────────────────────────────

  const upd = useCallback(
    key => e => {
      const rawValue = e?.target ? e.target.value : e;
      const value = normalizeEnrollmentField(key, rawValue);
      setF(prev => ({ ...prev, [key]: value }));
      setValidationErrors(prev => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const toggle = useCallback(
    key => () => {
      setF(prev => ({ ...prev, [key]: !prev[key] }));
      setValidationErrors(prev => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const setFile = useCallback(
    key => value => {
      setFiles(prev => ({ ...prev, [key]: value }));
      setValidationErrors(prev => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  // ✅ ADDED — insert everything below here ──────────────────────

  const [fetching,   setFetching]   = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const handleStudentLookup = useCallback(async (studentId) => {
    if (!studentId?.trim()) return;
    setFetching(true);
    setFetchError(null);

    const result = await fetchRecurringEnrollment(studentId.trim());

    setFetching(false);
    if (!result.ok) {
      setFetchError(result.error);
      return;
    }
    if (!result.data) return; // 404 → first-time record, nothing to prefill

    setF(prev => {
      const next = { ...prev };
      Object.entries(result.data).forEach(([k, v]) => {
        if (k in next && !next[k]) next[k] = v;
      });
      return next;
    });
  }, []);

  const saveDraft = useCallback(async () => {
    if (!f.studentId?.trim()) return;
    const result = await updateRecurringEnrollment(f.studentId.trim(), f, files);
    if (!result.ok) setFetchError(result.error);
  }, [f, files]);

  // ─────────────────────────────────────────────────────────────

  // ── Submission guard ───────────────────────────────────────────

  const validateCurrentStep = useCallback(() => {
    const errors = validateOldStudentStep(step, f, files);
    setValidationErrors(errors);
    return !hasValidationErrors(errors);
  }, [f, files, step]);

  const handleNext = useCallback(async () => {
    if (!validateCurrentStep()) return;
    await saveDraft();
    setStep(s => s + 1);
  }, [saveDraft, validateCurrentStep]);

  const handleSubmit = useCallback(() => {
    if (!validateCurrentStep()) return;
    submit(f, files);
  }, [f, files, submit, validateCurrentStep]);

  // ── Full reset ─────────────────────────────────────────────────

 // 🔁 MODIFIED
  const handleReset = useCallback(() => {
    reset();
    setStep(0);
    setF(EMPTY_FORM);
    setFiles(EMPTY_FILES);
    setValidationErrors({});
    setFetchError(null); // ✅ ADDED
  }, [reset]);

  // ─── Step renderers ────────────────────────────────────────────

  const renderPersonal = () => (
    <div>
      <SectionHeading>Student Identification</SectionHeading>
      <div className="form-grid">
        <FormField label="Student ID">
          {/* 🔁 MODIFIED — raw <input> to add onBlur; className unchanged */}
          <input
            type="text"
            className="form-input"
            value={f.studentId}
            onChange={upd("studentId")}
            placeholder="e.g. 2024-00123"
            onBlur={() => handleStudentLookup(f.studentId)}
          />
          {/* ✅ ADDED — inline hint, no new CSS class */}
          {fetching && (
            <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "4px", display: "block" }}>
              Looking up student record…
            </span>
          )}
        </FormField>
        <FormField label="LRN">
          <FormInput value={f.lrn} onChange={upd("lrn")} placeholder="12-digit LRN" />
        </FormField>
        <FormField label="Last Name">
          <FormInput value={f.lastName} onChange={upd("lastName")} />
        </FormField>
        <FormField label="First Name">
          <FormInput value={f.firstName} onChange={upd("firstName")} />
        </FormField>
      </div>

      <div className="gap-md" />
      <SectionHeading>Student Status</SectionHeading>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[
          { q: "Is the student a 4Ps beneficiary?",             key: "is4Ps" },
          { q: "Is the student a Person with Disability (PWD)?", key: "isPWD" },
        ].map(({ q, key }) => (
          <div key={key} className="condition-row">
            <span className="condition-label">{q}</span>
            <div className="condition-input-wrap">
              <YesNo value={f[key]} onChange={upd(key)} />
            </div>
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
        <FormField label="Barangay">
          <FormInput value={f.barangay} onChange={upd("barangay")} />
        </FormField>
        <FormField label="Municipality / City">
          <SearchableSelect value={f.municipality} onChange={(value) => setF(s => ({ ...s, municipality: value }))} options={getCityOptions(f.province)} placeholder="Search city or municipality" name="old-city" allowCustom={false} />
        </FormField>
        <FormField label="Province">
          <SearchableSelect value={f.province} onChange={(value) => setF(s => ({ ...s, province: value, municipality: "" }))} options={ALL_PROVINCES} placeholder="Search province" name="old-province" allowCustom={false} />
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

  const renderSchool = () => (
    <div>
      <SectionHeading>Previous School Information</SectionHeading>
      <div className="form-grid">
        <FormField label="Last Grade Level Attended">
          <FormSelect value={f.lastGradeLevel} onChange={upd("lastGradeLevel")} options={[
            { value: "",   label: "Select…"  },
            { value: "7",  label: "Grade 7"  },
            { value: "8",  label: "Grade 8"  },
            { value: "9",  label: "Grade 9"  },
            { value: "10", label: "Grade 10" },
          ]} />
        </FormField>
        <FormField label="Last Section">
          <FormInput value={f.section} onChange={upd("section")} placeholder="e.g. Sampaguita" />
        </FormField>
        <FormField label="Last School Year Attended">
          <FormInput
            value={f.schoolYearLastAttended}
            onChange={upd("schoolYearLastAttended")}
            placeholder="e.g. 2024–2025"
          />
        </FormField>
      </div>
    </div>
  );

  const renderAttachments = () => (
    <div>
      <SectionHeading>Required Documents</SectionHeading>
      <div className="upload-grid">
        <UploadBox label="Updated ID Picture"   file={files.idPic}      onFile={setFile("idPic")} />
        <UploadBox label="Report Card (Latest)" file={files.reportCard} onFile={setFile("reportCard")} />
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
          and I allow the Department of Education to use my child's details for the re-enrollment data
          collection. The information herein shall be treated as confidential in compliance with the
          Data Privacy Act of 2012.
        </ConsentBox>
      </div>
    </div>
  );

  const stepRenderers = [renderPersonal, renderAddress, renderSchool, renderAttachments];

  // ─── Success screen ────────────────────────────────────────────

  if (succeeded) return (
    <div className="page-wrapper">
      <PublicNavbar showLinks />
      <div className="success-wrap">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2 className="success-title">Form Submitted!</h2>
          <p className="success-body">
            Thank you for submitting your re-enrollment form for{" "}
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
                  Re-Enrollment Form · School Year 2025–2026
                </div>
              </div>
            </div>
            <StepBar current={step} />
          </div>

          {/* Body */}
          <div className="form-body" key={step}>
            {stepRenderers[step]()}
            {hasValidationErrors(validationErrors) && (
              <div className="validation-summary" role="alert">
                <strong>Please fix these fields before continuing.</strong>
                <ul>
                  {Object.values(validationErrors).map(message => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
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
              <Btn onClick={handleNext}>Next →</Btn>
            ) : (
              <Btn onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Form"}
              </Btn>
            )}
          </div>

          {/* Error banner */}
          {/* 🔁 MODIFIED — surfaces both submission and fetch/draft errors */}
          {(error || fetchError) && (
            <div className="submit-error-banner" role="alert">
              Warning: {error || fetchError}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function OldStudentForm() {
  return (
    <EnrollmentFormErrorBoundary>
      <OldStudentFormComponent />
    </EnrollmentFormErrorBoundary>
  );
}


