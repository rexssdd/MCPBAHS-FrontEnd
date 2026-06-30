/**
 * src/Components/Announcement/announcementForm.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Used for both Create and Edit.
 *
 * Props:
 *   initial      — null (create) | announcement object (edit)
 *   mode         — "create" | "edit"
 *   onSave(form) — called with validated form state after user confirms preview
 *   onCancel()   — go back to list
 *   isSaving     — disables buttons while parent's API call is in-flight
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { isPastDate, validateTextField } from "../../utils/inputValidation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function normaliseDate(d) {
  if (!d) return todayISO();
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const parsed = new Date(d);
  return isNaN(parsed) ? todayISO() : parsed.toISOString().slice(0, 10);
}

function normaliseTime(t) {
  if (!t) return nowTime();
  if (/^\d{2}:\d{2}$/.test(t)) return t;
  const m = t.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i);
  if (!m) return nowTime();
  let h = parseInt(m[1], 10);
  const min = m[2];
  if (m[3]) {
    if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  }
  return `${String(h).padStart(2, "0")}:${min}`;
}

function fmtDateLong(iso, time) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  const ds = isNaN(d)
    ? iso
    : d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
  if (!time) return ds;
  const t = new Date(`1970-01-01T${time}:00`);
  const ts = isNaN(t)
    ? time
    : t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " PST";
  return `${ds} ${ts}`;
}

// BUG-01 / BUG-04 FIX: field names now match StoreAnnouncementRequest.
// "title" added (required by backend), "message" replaces "text",
// "dissemination_modes" (array) replaces "mode" (string),
// "target_audience" replaces "audience".
// Dissemination values match DisseminationMode enum: "in-app" | "sms" | "email".
// Urgency values match AnnouncementUrgency enum: "low" | "normal" | "high".
const EMPTY_FORM = {
  title:               "",
  message:             "",
  urgency:             "high",
  dissemination_modes: ["in-app"],
  target_audience:     "all",
  publish_mode:        "now",
  date:                "",
  time:                "",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a5c1a" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function UrgencyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function ModeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function AudienceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ form, mode, onConfirm, onCancel }) {
  const preview = (form.message ?? "").length > 220
    ? (form.message ?? "").slice(0, 220) + "…"
    : (form.message ?? "");

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalStyle = {
    background: "#fff",
    borderRadius: 16,
    width: "min(580px, 94vw)",
    padding: 28,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  };

  const metaRowStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 10,
  };

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <EyeIcon />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
            Announcement Preview
          </span>
        </div>

        {/* Body: two-column */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}>
          {/* Left — text preview */}
          <div style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 12,
            color: "#374151",
            lineHeight: 1.7,
          }}>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
              {mode === "edit" ? "Edited:" : "New:"}
            </div>
            {form.title && (
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                {form.title}
              </div>
            )}
            {preview}
            {(form.message ?? "").length > 220 && (
              <span style={{ color: "#1a5c1a", fontWeight: 600, marginLeft: 4, cursor: "pointer" }}>
                See more
              </span>
            )}
          </div>

          {/* Right — meta */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={metaRowStyle}>
              <UrgencyIcon />
              <span>Urgency: <strong style={{ color: "#111827" }}>{form.urgency}</strong></span>
            </div>
            <div style={metaRowStyle}>
              <ModeIcon />
              <span>Mode of dissemination: <strong style={{ color: "#111827" }}>{Array.isArray(form.dissemination_modes) ? form.dissemination_modes.join(", ") : form.dissemination_modes}</strong></span>
            </div>
            <div style={metaRowStyle}>
              <AudienceIcon />
              <span>Target audience: <strong style={{ color: "#111827" }}>{form.target_audience}</strong></span>
            </div>
            <div style={metaRowStyle}>
              <CalendarIcon />
              <span>Date to be disseminated: <strong style={{ color: "#111827" }}>{fmtDateLong(form.date, form.time)}</strong></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px", border: "1.5px solid #e5e7eb",
              borderRadius: 8, background: "#fff", color: "#374151",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <XIcon /> Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px", border: "none",
              borderRadius: 8, background: "#1a5c1a",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <CheckIcon /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AnnouncementForm({ initial, mode, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(() => {
    const base = {
      ...EMPTY_FORM,
      date: todayISO(),
      time: nowTime(),
    };
    if (!initial) return base;
    // Map API / normalised fields back to form keys.
    // scheduled_at → date + time for the date/time pickers.
    const scheduledDate = initial.scheduled_at
      ? initial.scheduled_at.slice(0, 10)
      : normaliseDate(initial.date ?? initial.publishDate);
    const scheduledTime = initial.scheduled_at
      ? initial.scheduled_at.slice(11, 16)
      : normaliseTime(initial.time ?? initial.publishTime);
    return {
      ...base,
      // Identity / meta
      title:               initial.title               ?? base.title,
      message:             initial.message ?? initial.content ?? initial.text ?? base.message,
      urgency:             (initial.urgency             ?? base.urgency).toLowerCase(),
      dissemination_modes: Array.isArray(initial.dissemination_modes)
                             ? initial.dissemination_modes
                             : Array.isArray(initial.channels)
                               ? initial.channels
                               : base.dissemination_modes,
      target_audience:     (initial.target_audience ?? initial.targetAudience ?? initial.audience ?? base.target_audience).toLowerCase(),
      publish_mode:        initial.publish_mode ?? base.publish_mode,
      status:              initial.status ?? undefined,
      date:                scheduledDate,
      time:                scheduledTime,
    };
  });

  const [errors,      setErrors]      = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = () => {
    const errs = {};
    if (!form.title?.trim()) errs.title = "Title is required.";
    const textError = validateTextField(form.message, "Announcement", { min: 10, max: 1000 });
    if (textError) errs.message = textError;
    // FIX BUG-5: only require/validate date+time when the user chose "schedule"
    if (form.publish_mode === "schedule") {
      if (!form.date) errs.date = "Date of dissemination is required.";
      else if (isPastDate(form.date)) errs.date = "Date of dissemination cannot be in the past.";
      if (!form.time) errs.time = "Time of dissemination is required.";
    }
    return errs;
  };

  // Clicking Save → validate → open preview
  const handleSaveClick = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setPreviewOpen(true);
  };

  // User confirmed in preview → actually save
  const handleConfirm = async () => {
    setPreviewOpen(false);
    await onSave(form);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────

  const selectStyle = {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 14,
    color: "#111827",
    background: "#fff",
    outline: "none",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 36,
  };

  const inputStyle = {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 14,
    color: "#111827",
    background: "#fff",
    outline: "none",
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 5,
    display: "block",
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: 28,
      }}>
        {/* Section title */}
        <div style={{
          fontSize: 16, fontWeight: 700, color: "#1a5c1a",
          marginBottom: 16, borderBottom: "1px solid #e5e7eb", paddingBottom: 12,
        }}>
          Announcement Details
        </div>

        {/* BUG-04 FIX: title field added — required by StoreAnnouncementRequest */}
        <label style={labelStyle}>Title</label>
        <input
          type="text"
          placeholder="Announcement title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          style={{
            ...inputStyle,
            width: "100%",
            marginBottom: errors.title ? 4 : 16,
            boxSizing: "border-box",
            borderColor: errors.title ? "#dc2626" : "#d1d5db",
          }}
        />
        {errors.title && (
          <p style={{ color: "#dc2626", fontSize: 12, marginTop: 0, marginBottom: 12 }}>{errors.title}</p>
        )}

        {/* Announcement text */}
        <label style={labelStyle}>Announcement</label>
        <textarea
          placeholder="Compose your message here."
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          style={{
            width: "100%", minHeight: 140,
            border: `1px solid ${errors.message ? "#dc2626" : "#d1d5db"}`,
            borderRadius: 8, padding: "10px 12px",
            fontSize: 14, color: "#111827",
            resize: "vertical", outline: "none",
            boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6,
          }}
        />
        {errors.message && (
          <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{errors.message}</p>
        )}

        {/* Urgency / Mode / Audience */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16, marginTop: 18, marginBottom: 20,
        }}>
          <div>
            <label style={labelStyle}>Urgency</label>
            <select style={selectStyle} value={form.urgency}
                    onChange={(e) => set("urgency", e.target.value)}>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Mode of Dissemination</label>
            {/* BUG-01 FIX: store as array using DisseminationMode enum values:
                "in-app" | "sms" | "email" — matching the backend. */}
            <select style={selectStyle}
                    value={Array.isArray(form.dissemination_modes) ? form.dissemination_modes[0] : form.dissemination_modes}
                    onChange={(e) => set("dissemination_modes", [e.target.value])}>
              <option value="in-app">In-App</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Target Audience</label>
            {/* BUG-01 FIX: renamed to target_audience; values match TargetAudience enum. */}
            <select style={selectStyle} value={form.target_audience}
                    onChange={(e) => set("target_audience", e.target.value)}>
              <option value="all">All</option>
              <option value="teachers">Teachers</option>
              <option value="students">Students</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>

        {/* Date + Time + Publish Mode */}
        {/* FIX BUG-5: publish_mode was always "now" — no UI existed to set "schedule".
            A user filling in a future date expected scheduling but got immediate publish.
            Now we show a toggle: "Publish Now" sets publish_mode:"now" and hides date/time;
            "Schedule" sets publish_mode:"schedule" and shows the date/time pickers. */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Publish Mode</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {[
              { value: "now",      label: "Publish Now" },
              { value: "schedule", label: "Schedule" },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("publish_mode", opt.value)}
                style={{
                  padding: "8px 18px",
                  border: `1.5px solid ${form.publish_mode === opt.value ? "#1a5c1a" : "#d1d5db"}`,
                  borderRadius: 8,
                  background: form.publish_mode === opt.value ? "#1a5c1a" : "#fff",
                  color: form.publish_mode === opt.value ? "#fff" : "#374151",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {form.publish_mode === "schedule" && (
            <>
              <label style={labelStyle}>Date of Dissemination:</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 4 }}>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.date ? "#dc2626" : "#d1d5db",
                    minWidth: 160,
                  }}
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.time ? "#dc2626" : "#d1d5db", minWidth: 130 }}
                />
              </div>
              {(errors.date || errors.time) && (
                <p style={{ color: "#dc2626", fontSize: 12, marginTop: 0, marginBottom: 8 }}>
                  {errors.date || errors.time}
                </p>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 10,
          marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 18,
        }}>
          <button
            onClick={onCancel}
            disabled={isSaving}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px", border: "1.5px solid #e5e7eb",
              borderRadius: 8, background: "#fff", color: "#374151",
              fontSize: 13, fontWeight: 600, cursor: isSaving ? "default" : "pointer",
            }}
          >
            <XIcon /> Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isSaving || !form.message?.trim() || !form.title?.trim()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px", border: "none",
              borderRadius: 8,
              // CNS-FE-04 fix: button was only disabled when message was empty.
              // Backend also requires title (non-nullable). Disabling on empty title
              // prevents a 422 response that the user would get after the preview modal.
              background: (isSaving || !form.message?.trim() || !form.title?.trim()) ? "#9ca3af" : "#1a5c1a",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: (isSaving || !form.message?.trim() || !form.title?.trim()) ? "default" : "pointer",
            }}
          >
            <SaveIcon />
            {isSaving ? "Saving…" : mode === "create" ? "Publish Announcement" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Preview / Confirm modal ── */}
      {previewOpen && (
        <PreviewModal
          form={form}
          mode={mode}
          onConfirm={handleConfirm}
          onCancel={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}