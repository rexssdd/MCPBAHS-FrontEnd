// src/components/EnrollmentTypeModal.jsx
import { useEffect, useRef } from "react";
import "../Css/Modals.css";
import logo from "../assets/school-logo.png"; // ← example logo import, replace with actual path


const TYPES = [
  { label: "Grade 7",           href: "/g7-form" },
  { label: "Recurring Learner", href: "/old-student-form" },
  { label: "Transferee",        href: "/transferee-form" },
];

export default function EnrollmentTypeModal({ onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    panelRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="etm-title"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="modal-panel etm-panel"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header band ── */}
        <div className="etm-header">
          <button
            type="button"
            className="etm-header__back modal-close-btn"
            onClick={onClose}
            aria-label="Close enrollment modal"
          >
            ‹
          </button>
          <img src={logo} alt="School Logo" className="pf-brand__logo" />
          <div className="etm-header__eyebrow" aria-hidden="true">
            ✦ Enrollment Portal
          </div>
          <h2 id="etm-title" className="etm-header__title">
            M.C.P.B.A.H.S
          </h2>
          <p className="etm-header__sub">Select your enrollment type to continue</p>
        </div>

        {/* ── Enrollment type buttons ── */}
        <div className="etm-body">
          {TYPES.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="etm-type-btn"
            >
              <span>{label}</span>
              <span className="etm-type-btn__arrow" aria-hidden="true">›</span>
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}