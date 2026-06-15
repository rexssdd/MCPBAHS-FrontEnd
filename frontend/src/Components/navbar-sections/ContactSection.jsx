// src/components/sections/ContactSection.jsx
import { useState } from "react";
import useInView from "../../hooks/useInView";
import "../../Css/HomePage/ContactSection.css";
import {
  validateEmailField,
  validateNameField,
  validateTextField,
} from "../../utils/inputValidation";

const CONTACT_INFO = [
  { icon: "📍", label: "Address",         value: "Brgy. Tawantawan, Baguio District, Davao City, Philippines" },
  { icon: "📞", label: "Phone",           value: "0967 887 9112" },
  { icon: "✉️", label: "Email",           value: "mcbelcaragri.hs@deped.gov.ph" },
  { icon: "🕐", label: "Office Hours",    value: "Monday – Friday, 8:00 AM – 5:00 PM" },
  { icon: "🏫", label: "DepEd School ID", value: "12" },
  { icon: "🗂️", label: "Division",        value: "Schools Division of Davao City" },
];

const FORM_FIELDS = [
  { id: "ct-name",  label: "Full Name",     type: "text",  placeholder: "Juan dela Cruz" },
  { id: "ct-email", label: "Email Address", type: "email", placeholder: "juan@email.com" },
];

export default function ContactSection() {
  const [ref, inView] = useInView();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {
      name: validateNameField(form.name, "Full name"),
      email: validateEmailField(form.email, "Email address"),
      message: validateTextField(form.message, "Message", { min: 10, max: 1000 }),
    };
    Object.keys(nextErrors).forEach(key => {
      if (!nextErrors[key]) delete nextErrors[key];
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setSent(true);
  };

  return (
    <section id="contact" className="ct-section">
      <div ref={ref} className="ct-inner">

        {/* ── Header ── */}
        <header className={`ct-header ct-fade ${inView ? "visible" : ""}`}>
          <span className="ct-eyebrow">
            <span className="ct-eyebrow__line" />
            Contact Us
          </span>
          <h2 className="ct-title">Get in <em>Touch</em></h2>
          <p className="ct-subtitle">
            We're here to help. Reach out to us through any of the channels below
            and we'll get back to you as soon as possible.
          </p>
        </header>

        {/* ── Two-column layout ── */}
        <div className="ct-grid">

          {/* ── Left: info + map ── */}
          <div
            className={`ct-info-col ct-fade ${inView ? "visible" : ""}`}
            style={{ transitionDelay: "0.1s" }}
          >
            <ul className="ct-info-list">
              {CONTACT_INFO.map((item) => (
                <li key={item.label} className="ct-info-item">
                  <span className="ct-info-icon" aria-hidden="true">{item.icon}</span>
                  <div className="ct-info-body">
                    <span className="ct-info-label">{item.label}</span>
                    <span className="ct-info-value">{item.value}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Map — swap the placeholder div for a real <iframe> when ready */}
           <div className="ct-map">
            <iframe
              src="https://www.google.com/maps?q=7.1698132,125.3729349&z=17&output=embed"
              title="Ma. Cristina P. Belcar Agricultural High School Location"
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
            />
          </div>
          </div>

          {/* ── Right: form ── */}
          <div
            className={`ct-form-col ct-fade ${inView ? "visible" : ""}`}
            style={{ transitionDelay: "0.2s" }}
          >
            {sent ? (
              /* Success state */
              <div className="ct-success" role="status" aria-live="polite">
                <div className="ct-success__icon" aria-hidden="true">✅</div>
                <h3 className="ct-success__title">Message Sent!</h3>
                <p className="ct-success__body">
                  Thank you for reaching out. We'll get back to you within 1–2 business days.
                </p>
              </div>
            ) : (
              /* Contact form */
              <form
                className="ct-form-card"
                onSubmit={handleSubmit}
                noValidate
                aria-label="Send a message to the school"
              >
                <h3 className="ct-form-title">Send a Message</h3>

                {FORM_FIELDS.map((fi) => (
                  <div key={fi.id} className="ct-form-row">
                    <label htmlFor={fi.id} className="ct-form-label">
                      {fi.label}
                    </label>
                    <input
                      id={fi.id}
                      type={fi.type}
                      placeholder={fi.placeholder}
                      className={`ct-form-input${errors[fi.id === "ct-name" ? "name" : "email"] ? " ct-form-input--error" : ""}`}
                      value={fi.id === "ct-name" ? form.name : form.email}
                      onChange={(e) => setField(fi.id === "ct-name" ? "name" : "email", e.target.value)}
                      aria-invalid={errors[fi.id === "ct-name" ? "name" : "email"] ? "true" : undefined}
                      required
                      autoComplete={fi.type === "email" ? "email" : "name"}
                    />
                    {errors[fi.id === "ct-name" ? "name" : "email"] && (
                      <span className="ct-form-error">{errors[fi.id === "ct-name" ? "name" : "email"]}</span>
                    )}
                  </div>
                ))}

                <div className="ct-form-row">
                  <label htmlFor="ct-message" className="ct-form-label">
                    Message
                  </label>
                  <textarea
                    id="ct-message"
                    rows={5}
                    placeholder="How can we help you?"
                    className={`ct-form-textarea${errors.message ? " ct-form-input--error" : ""}`}
                    value={form.message}
                    onChange={(e) => setField("message", e.target.value)}
                    aria-invalid={errors.message ? "true" : undefined}
                    required
                  />
                  {errors.message && <span className="ct-form-error">{errors.message}</span>}
                </div>

                <button type="submit" className="ct-form-submit">
                  Send Message
                  <span className="ct-form-submit__arrow" aria-hidden="true">→</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
