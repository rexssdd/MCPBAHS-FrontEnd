import { useState, useRef } from "react";
import { isPastDate, validateFileList, validateTextField } from "../../../utils/inputValidation";
import {
  PRIORITY_OPTIONS,
  AUDIENCE_OPTIONS,
  CHANNEL_OPTIONS,
  EMPTY_ANNOUNCEMENT_FORM,
} from "./adminAnnouncementData.js";
import {
  AlertIcon,
  CloseIcon,
  MegaphoneIcon,
  SendIcon,
  PaperclipIcon,
  RefreshIcon,
  TrashIcon,
  EyeIcon,
} from "../notification/AdminNotificationIcons.jsx";

export function ErrorBanner({ message, onRetry, onDismiss }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <div className="error-banner-left">
        <AlertIcon />
        <span>{message}</span>
      </div>
      <div className="error-banner-actions">
        {onRetry && (
          <button className="ntn-btn ntn-btn--outline error-retry-btn" onClick={onRetry}>
            <RefreshIcon /> Retry
          </button>
        )}
        <button className="error-dismiss-btn" onClick={onDismiss} aria-label="Dismiss error">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

export function AnnouncementFormPage({ announcement, onCancel, onSave, isSaving }) {
  const isEdit = Boolean(announcement?.id);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          title: announcement.title,
          content: announcement.content,
          targetAudience: announcement.targetAudience,
          priority: announcement.priority,
          publishDate: announcement.publishDate,
          publishTime: announcement.publishTime ?? "",
          publishMode: announcement.status === "Scheduled" ? "schedule" : "publish",
          channels: announcement.channels ?? ["inApp", "email"],
          attachments: announcement.attachments ?? [],
        }
      : { ...EMPTY_ANNOUNCEMENT_FORM }
  );
  const [formError, setFormError] = useState(null);
  const fileInputRef = useRef(null);
  const hasDraftContent = form.title.trim().length > 0 || form.content.trim().length > 0;

  function handleChange(field, value) {
    const safeValue = typeof value === "string" ? value.replace(/[<>]/g, "") : value;
    setForm((prev) => ({ ...prev, [field]: safeValue }));
    if (formError) setFormError(null);
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    const fileError = validateFileList(files, {
      required: false,
      maxSizeMb: 10,
      allowedExtensions: ["pdf", "docx", "txt", "png", "jpg", "jpeg"],
      label: "Attachment",
    });
    if (fileError) {
      setFormError(fileError);
      e.target.value = "";
      return;
    }
    const names = files.map((file) => file.name);
    setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...names] }));
  }

  function removeAttachment(idx) {
    setForm((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }));
  }

  function toggleChannel(value) {
    setForm((prev) => {
      const hasValue = prev.channels.includes(value);
      const channels = hasValue
        ? prev.channels.filter((channel) => channel !== value)
        : [...prev.channels, value];
      return { ...prev, channels };
    });
    if (formError) setFormError(null);
  }

  function validate(nextStatus) {
    if (nextStatus === "Draft") {
      if (!hasDraftContent) return "Add a title or body before saving as draft.";
      return null;
    }
    const titleError = validateTextField(form.title, "Title", { min: 4, max: 120 });
    if (titleError) return titleError;
    const contentError = validateTextField(form.content, "Content / body", { min: 10, max: 1500 });
    if (contentError) return contentError;
    if (form.publishMode === "schedule") {
      if (!form.publishDate) return "Schedule date is required.";
      if (isPastDate(form.publishDate)) return "Schedule date cannot be in the past.";
      if (!form.publishTime) return "Schedule time is required.";
    }
    if (form.channels.length === 0) return "Select at least one dissemination mode.";
    return null;
  }

  function handleSubmit(e, nextStatus = form.publishMode === "schedule" ? "Scheduled" : "Published") {
    e.preventDefault();
    const err = validate(nextStatus);
    if (err) {
      setFormError(err);
      return;
    }
    // NEW-03 FIX: map admin form fields to backend StoreAnnouncementRequest field names.
    // Admin form uses:  content, channels, targetAudience, priority, publishMode, publishDate, publishTime
    // Backend expects:  message, dissemination_modes (array), target_audience, urgency, publish_mode, scheduled_at
    // Channel values also need mapping: "inApp" → "in-app" (DisseminationMode enum).
    const channelMap = { "inApp": "in-app", "in-app": "in-app", "sms": "sms", "email": "email" };
    const resolvedDate = nextStatus === "Published"
      ? form.publishDate || new Date().toISOString().split("T")[0]
      : form.publishDate;
    const resolvedTime = nextStatus === "Published"
      ? form.publishTime || new Date().toTimeString().slice(0, 5)
      : form.publishTime;
    const scheduledAt = resolvedDate
      ? `${resolvedDate}T${resolvedTime || "00:00"}:00`
      : null;

    onSave({
      // API-expected field names
      title:               form.title,
      message:             form.content,
      urgency:             (form.priority ?? "medium").toLowerCase(),
      dissemination_modes: (form.channels ?? []).map(ch => channelMap[ch] ?? ch),
      target_audience:     (form.targetAudience ?? "all").toLowerCase().replace(/\s+/g, "_"),
      publish_mode:        form.publishMode === "schedule" ? "schedule" : "now",
      scheduled_at:        scheduledAt,
      status:              nextStatus,
      // Keep originals for optimistic local state (normalizeAnnouncement maps these back)
      content:             form.content,
      channels:            form.channels,
      targetAudience:      form.targetAudience,
      priority:            form.priority,
      publishDate:         resolvedDate,
      publishTime:         resolvedTime,
    });
  }

  return (
    <section className="ann-form-page" aria-labelledby="ann-form-title">
        <div className="ann-form-page-header">
          <div className="notif-modal-header-left">
            <div className="notif-modal-icon"><MegaphoneIcon /></div>
            <div>
              <h2 id="ann-form-title" className="notif-modal-title">
                {isEdit ? "Edit Announcement" : "Create Announcement"}
              </h2>
              <p className="notif-modal-sub">Fill in the details below to {isEdit ? "update" : "create"} an announcement.</p>
            </div>
          </div>
          <button className="notif-modal-close" onClick={onCancel} aria-label="Back to announcements" disabled={isSaving}><CloseIcon /></button>
        </div>

        <div className="notif-modal-divider" />

        <form className="ann-form" onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="ann-form-error" role="alert">
              <AlertIcon /> {formError}
            </div>
          )}

          <div className="ann-form-field">
            <label className="ann-form-label" htmlFor="ann-title">Title <span aria-hidden="true">*</span></label>
            <input
              id="ann-title"
              className="ann-form-input"
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. Grade 10 parent orientation on Friday"
              maxLength={120}
              required
              aria-invalid={Boolean(formError)}
              disabled={isSaving}
            />
          </div>

          <div className="ann-form-field">
            <label className="ann-form-label" htmlFor="ann-content">Content / Body <span aria-hidden="true">*</span></label>
            <textarea
              id="ann-content"
              className="ann-form-textarea"
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Write the complete announcement details, including dates, location, audience, and next steps."
              rows={5}
              maxLength={1500}
              required
              aria-invalid={Boolean(formError)}
              disabled={isSaving}
            />
          </div>

          <div className="ann-status-section">
            <p className="ann-section-title">Announcement Status</p>
            <p className="ann-section-subtitle">Choose how you want to publish this announcement.</p>
            <div className="ann-status-grid">
              {[
                ["publish", "Publish", "Publish immediately"],
                ["schedule", "Schedule", "Set a future date and time"],
              ].map(([value, title, description]) => (
                <label key={value} className={`ann-choice-card${form.publishMode === value ? " ann-choice-card--active" : ""}`}>
                  <input
                    type="radio"
                    name="publishMode"
                    value={value}
                    checked={form.publishMode === value}
                    onChange={() => handleChange("publishMode", value)}
                    disabled={isSaving}
                  />
                  <span className="ann-choice-dot" />
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {form.publishMode === "schedule" && (
            <div className="ann-schedule-panel">
              <p className="ann-section-title">Schedule Date & Time</p>
              <div className="ann-form-row ann-form-row--two">
                <div className="ann-form-field">
                  <label className="ann-form-label" htmlFor="ann-date">Publish Date <span aria-hidden="true">*</span></label>
                  <input
                    id="ann-date"
                    className="ann-form-input"
                    type="date"
                    value={form.publishDate}
                    onChange={(e) => handleChange("publishDate", e.target.value)}
                    required
                    aria-label="Publish date"
                    disabled={isSaving}
                  />
                </div>
                <div className="ann-form-field">
                  <label className="ann-form-label" htmlFor="ann-time">Publish Time <span aria-hidden="true">*</span></label>
                  <input
                    id="ann-time"
                    className="ann-form-input"
                    type="time"
                    value={form.publishTime}
                    onChange={(e) => handleChange("publishTime", e.target.value)}
                    required
                    aria-label="Publish time"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="ann-form-row ann-form-row--two">
            <div className="ann-form-field">
              <label className="ann-form-label" htmlFor="ann-audience">Target Audience</label>
              <select
                id="ann-audience"
                className="ann-form-select"
                value={form.targetAudience}
                onChange={(e) => handleChange("targetAudience", e.target.value)}
                aria-label="Target audience"
                disabled={isSaving}
              >
                {AUDIENCE_OPTIONS.map((audience) => <option key={audience} value={audience}>{audience}</option>)}
              </select>
            </div>

            <div className="ann-form-field">
              <label className="ann-form-label" htmlFor="ann-priority">Priority</label>
              <select
                id="ann-priority"
                className="ann-form-select"
                value={form.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                aria-label="Announcement priority"
                disabled={isSaving}
              >
                {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </div>

          </div>

          <div className="ann-form-field">
            <p className="ann-section-title">Dissemination Mode</p>
            <p className="ann-section-subtitle">Choose the channels where this announcement will be sent.</p>
            <div className="ann-channel-row">
              {CHANNEL_OPTIONS.map((channel) => (
                <label key={channel.value} className="ann-check">
                  <input
                    type="checkbox"
                    checked={form.channels.includes(channel.value)}
                    onChange={() => toggleChannel(channel.value)}
                    disabled={isSaving}
                  />
                  <span>{channel.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="ann-form-field">
            <label className="ann-form-label">Attachments <span className="ann-muted">(Optional)</span></label>
            <div className="ann-attach-area">
              <button
                type="button"
                className="ntn-btn ntn-btn--outline ann-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
              >
                <PaperclipIcon /> Attach File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFileChange}
                aria-label="Attach files"
              />
              {form.attachments.length > 0 && (
                <div className="ann-attach-list">
                  {form.attachments.map((name, idx) => (
                    <span key={idx} className="ann-attach-chip">
                      <PaperclipIcon /> {name}
                      <button
                        type="button"
                        className="ann-attach-remove"
                        onClick={() => removeAttachment(idx)}
                        aria-label={`Remove ${name}`}
                        disabled={isSaving}
                      >
                        <CloseIcon />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="notif-modal-divider" />

          <div className="ann-modal-footer">
            <button
              type="button"
              className="ntn-btn ntn-btn--outline"
              onClick={hasDraftContent ? (e) => handleSubmit(e, "Draft") : onCancel}
              disabled={isSaving}
            >
              {hasDraftContent ? "Save as Draft" : "Cancel"}
            </button>
            <button type="submit" className="ntn-btn ntn-btn--primary" disabled={isSaving}>
              {isSaving ? (
                <><span className="btn-spinner" /> Saving...</>
              ) : form.publishMode === "schedule" ? (
                <><SendIcon /> Schedule Announcement</>
              ) : (
                <><SendIcon /> {isEdit ? "Update Announcement" : "Publish Announcement"}</>
              )}
            </button>
          </div>
        </form>
    </section>
  );
}

export function DeleteConfirmModal({ announcement, onClose, onConfirm, isDeleting }) {
  if (!announcement) return null;
  return (
    <div className="notif-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
      <div className="notif-modal-box delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notif-modal-header">
          <div className="notif-modal-header-left">
            <div className="notif-modal-icon notif-modal-icon--danger"><TrashIcon /></div>
            <div>
              <h2 id="delete-confirm-title" className="notif-modal-title">Delete Announcement</h2>
              <p className="notif-modal-sub">This action cannot be undone.</p>
            </div>
          </div>
          <button className="notif-modal-close" onClick={onClose} aria-label="Close" disabled={isDeleting}><CloseIcon /></button>
        </div>

        <div className="notif-modal-divider" />

        <div className="notif-modal-body">
          <p className="delete-confirm-text">
            Are you sure you want to delete <strong>"{announcement.title}"</strong>? This announcement will be permanently removed.
          </p>
        </div>

        <div className="notif-modal-divider" />

        <div className="ann-modal-footer">
          <button className="ntn-btn ntn-btn--outline" onClick={onClose} disabled={isDeleting}>Cancel</button>
          <button className="ntn-btn ntn-btn--danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <><span className="btn-spinner" /> Deleting...</> : <><TrashIcon /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PublishModal({ announcement, onClose, onConfirm, isPublishing }) {
  if (!announcement) return null;
  return (
    <div className="notif-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="publish-modal-title">
      <div className="notif-modal-box delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notif-modal-header">
          <div className="notif-modal-header-left">
            <div className="notif-modal-icon notif-modal-icon--publish"><SendIcon /></div>
            <div>
              <h2 id="publish-modal-title" className="notif-modal-title">Publish Announcement</h2>
              <p className="notif-modal-sub">Disseminate to the selected audience.</p>
            </div>
          </div>
          <button className="notif-modal-close" onClick={onClose} aria-label="Close" disabled={isPublishing}><CloseIcon /></button>
        </div>

        <div className="notif-modal-divider" />

        <div className="notif-modal-body">
          <p className="delete-confirm-text">
            You are about to publish <strong>"{announcement.title}"</strong> to <strong>{announcement.targetAudience}</strong>.
            Once published, it will be sent out immediately.
          </p>
          <div className="publish-meta">
            <span className={`ann-priority-badge ann-priority-badge--${announcement.priority.toLowerCase()}`}>{announcement.priority}</span>
            <span className="ann-date-text">Publish Date: {announcement.publishDate || "Today"}</span>
          </div>
        </div>

        <div className="notif-modal-divider" />

        <div className="ann-modal-footer">
          <button className="ntn-btn ntn-btn--outline" onClick={onClose} disabled={isPublishing}>Cancel</button>
          <button className="ntn-btn ntn-btn--primary" onClick={onConfirm} disabled={isPublishing}>
            {isPublishing ? <><span className="btn-spinner" /> Publishing...</> : <><SendIcon /> Publish Now</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AnnouncementViewModal({ announcement, onClose, onEdit }) {
  if (!announcement) return null;
  const channels = Array.isArray(announcement.channels) ? announcement.channels : [];
  const isPublished = announcement.status === "Published";
  return (
    <div className="notif-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="ann-view-title">
      <div className="notif-modal-box ann-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notif-modal-header">
          <div className="notif-modal-header-left">
            <div className="notif-modal-icon"><MegaphoneIcon /></div>
            <div>
              <h2 id="ann-view-title" className="notif-modal-title">{announcement.title}</h2>
              <p className="notif-modal-sub">Announcement details and delivery settings.</p>
            </div>
          </div>
          <button className="notif-modal-close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>

        <div className="notif-modal-divider" />

        <div className="notif-modal-body ann-view-body">
          <div className="ann-view-meta">
            <span className={`ann-status-badge ann-status-badge--${announcement.status.toLowerCase()}`}>{announcement.status}</span>
            <span className={`ann-priority-badge ann-priority-badge--${announcement.priority.toLowerCase()}`}>{announcement.priority}</span>
            <span>{announcement.targetAudience}</span>
          </div>

          <div>
            <p className="notif-field-label">Content / Body</p>
            <div className="ann-view-content">{announcement.content}</div>
          </div>

          <div className="ann-view-grid">
            <div>
              <p className="notif-field-label">Publish Date</p>
              <div className="notif-field-value">{announcement.publishDate || "Not set"}</div>
            </div>
            <div>
              <p className="notif-field-label">Publish Time</p>
              <div className="notif-field-value">{announcement.publishTime || "Not set"}</div>
            </div>
            <div>
              <p className="notif-field-label">Dissemination</p>
              <div className="notif-field-value">{channels.length ? channels.join(", ") : "None"}</div>
            </div>
          </div>

          {announcement.attachments?.length > 0 && (
            <div>
              <p className="notif-field-label">Attachments</p>
              <div className="ann-attach-list">
                {announcement.attachments.map((name, idx) => (
                  <span key={idx} className="ann-attach-chip"><PaperclipIcon /> {name}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="notif-modal-divider" />

        <div className="ann-modal-footer">
          <button className="ntn-btn ntn-btn--outline" onClick={onClose}>Close</button>
          {!isPublished && (
            <button className="ntn-btn ntn-btn--primary" onClick={() => onEdit(announcement)}>
              Edit Announcement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AnnouncementCard({ ann, onView, onEdit, onDelete, onPublish }) {
  const isPublished = ann.status === "Published";
  return (
    <article
      className={`ann-card ${isPublished ? "ann-card--published" : "ann-card--draft"}`}
      onClick={() => onView(ann)}
      tabIndex={0}
      role="button"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(ann);
        }
      }}
    >
      <div className="ann-card-top">
        <div className="ann-card-meta">
          <span className={`ann-priority-badge ann-priority-badge--${ann.priority.toLowerCase()}`}>{ann.priority}</span>
          <span className={`ann-status-badge ${isPublished ? "ann-status-badge--published" : "ann-status-badge--draft"}`}>
            {ann.status}
          </span>
        </div>
        <div className="ann-card-actions">
          {!isPublished && (
            <button className="ntn-btn ntn-btn--outline ann-card-btn" onClick={(event) => { event.stopPropagation(); onPublish(ann); }}>
              <SendIcon /> Publish
            </button>
          )}
          <button className="ntn-btn ntn-btn--outline ann-card-btn" onClick={(event) => { event.stopPropagation(); onView(ann); }}>
            <EyeIcon /> View
          </button>
          {!isPublished && (
            <button className="ntn-btn ntn-btn--outline ann-card-btn" onClick={(event) => { event.stopPropagation(); onEdit(ann); }}>
              Edit
            </button>
          )}
          <button className="ntn-btn ntn-btn--danger-outline ann-card-btn" onClick={(event) => { event.stopPropagation(); onDelete(ann); }}>
            <TrashIcon /> Delete
          </button>
        </div>
      </div>

      <h3 className="ann-card-title">{ann.title}</h3>
      <p className="ann-card-content">{ann.content}</p>

      <div className="ann-card-footer">
        <span className="ann-card-audience">Audience: {ann.targetAudience}</span>
        {ann.publishDate && <span className="ann-card-date">Publish date: {ann.publishDate}</span>}
        {ann.attachments?.length > 0 && (
          <span className="ann-card-attach"><PaperclipIcon /> {ann.attachments.length} file{ann.attachments.length > 1 ? "s" : ""}</span>
        )}
      </div>
    </article>
  );
}