/**
 * src/Components/Announcement/announcementModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Props:
 *   mode       — "create" | "edit"
 *   initial    — null (create) | announcement object (edit)
 *   isOpen     — boolean
 *   onClose()  — close the modal
 *   onSave(form) — called after form validates + user confirms preview
 *   isSaving   — passed down to form to disable buttons during API call
 * ─────────────────────────────────────────────────────────────────────────────
 */

import AnnouncementForm from "./announcementForm";
import { Modal, ModalHeader, ModalBody } from "../../Components/ui";

// ─── Icon ─────────────────────────────────────────────────────────────────────

const MegaphoneIcon = () => (
  <>
    <path d="M4 10.5C4 7.46 6.46 5 9.5 5h4.75a1.75 1.75 0 0 1 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 19H9.5C6.46 19 4 16.54 4 13.5v-3z" />
    <path d="M15 8l4-2v10l-4-2" />
  </>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnnouncementModal({
  mode,
  initial,
  isOpen,
  onClose,
  onSave,
  isSaving,
}) {
  if (!isOpen) return null;

  // Prevent editing posted/sent announcements
  const isLocked =
    mode === "edit" &&
    initial &&
    !["draft", "scheduled", "pending"].includes(
      String(initial.status).toLowerCase()
    );

  if (isLocked) {
    return (
      <Modal size="sm" onClose={onClose}>
        <ModalBody>
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <h3 style={{ margin: 0, color: "#991b1b" }}>
              Unable to Edit
            </h3>

            <p style={{ margin: 0, color: "#6b7280" }}>
              Posted or sent announcements can no longer be edited.
            </p>

            <button
              className="rpt-btn rpt-btn--primary"
              onClick={onClose}
            >
              OK
            </button>
          </div>
        </ModalBody>
      </Modal>
    );
  }

  const title =
    mode === "edit"
      ? "Edit Announcement"
      : "Add Announcement";

  const subtitle =
    mode === "edit"
      ? "Update the announcement before sending."
      : "Create a new announcement for teachers, students, or parents.";

  return (
    <Modal
      size="lg"
      className="announcement-modal-card"
      onClose={onClose}
    >
      <ModalHeader
        icon={<MegaphoneIcon />}
        iconBg="#d1fae5"
        iconColor="#166534"
      >
        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span>{title}</span>

            <small
              style={{
                color: "#166534",
                fontSize: 13,
              }}
            >
              {subtitle}
            </small>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="announcement-modal-body">
          <AnnouncementForm
            initial={mode === "edit" ? initial : null}
            mode={mode}
            onSave={async (form) => {
              await onSave(form);
              onClose();
            }}
            onCancel={onClose}
            isSaving={isSaving}
          />
        </div>
      </ModalBody>
    </Modal>
  );
}