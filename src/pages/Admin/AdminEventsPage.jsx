import { useEffect, useState } from "react";

import Sidebar from "../../Components/Sidebar";
import {
  Breadcrumb,
  Toast,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmModal,
  FormInput,
  FormSelect,
  Checkbox,
} from "../../Components/ui";

import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../../Api/calendarEventApi";

const CATEGORY_OPTIONS = [
  { label: "Enrollment", value: "enrollment" },
  { label: "Academic", value: "academic" },
  { label: "Community", value: "community" },
  { label: "Holiday", value: "holiday" },
  { label: "Advisory", value: "advisory" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  event_date: "",
  category: "advisory",
  is_published: true,
};

/**
 * Shared events calendar manager used by both admin (/admin/events) and
 * principal (/principal/events) — both roles are allowed to create and
 * edit public homepage calendar events per routes/api.php's
 * 'role:admin|principal' middleware on /v1/calendar-events.
 */
export default function AdminEventsPage({ role = "admin" }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [toast, setToast] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    setApiError("");
    try {
      const res = await listCalendarEvents();
      const rows = Array.isArray(res) ? res : res?.data ?? [];
      setEvents(rows);
    } catch (err) {
      setApiError(err?.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingUuid(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (event) => {
    setEditingUuid(event.uuid);
    setForm({
      title: event.title ?? "",
      description: event.description ?? "",
      event_date: event.event_date ?? "",
      category: event.category ?? "advisory",
      is_published: Boolean(event.is_published),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.event_date) {
      setToast("Title and date are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingUuid) {
        await updateCalendarEvent(editingUuid, form);
        setToast("Event updated.");
      } else {
        await createCalendarEvent(form);
        setToast("Event created.");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setToast(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteCalendarEvent(confirmDelete.uuid);
      setToast("Event deleted.");
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setToast(err?.message || "Delete failed.");
    }
  };

  return (
    <div className="page-layout">
      <Sidebar role={role} />

      <main id="main-content" className="page-main">
        <div className="page-body">
          <Breadcrumb parts={[{ label: "Events" }]} />

          {apiError && <div className="alert alert-error">{apiError}</div>}

          <div className="form-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 className="form-section-title" style={{ marginBottom: 4 }}>School Events Calendar</h2>
                <p style={{ fontSize: 13, color: "#7a8a7c", margin: 0 }}>
                  Events created here, plus your posted announcements, appear on the public homepage calendar.
                </p>
              </div>
              <button className="btn btn-primary" onClick={openCreate}>+ Add Event</button>
            </div>

            {loading && <p>Loading…</p>}

            {!loading && events.length === 0 && (
              <p style={{ color: "#7a8a7c" }}>No events yet. Click "Add Event" to create one.</p>
            )}

            {!loading && events.length > 0 && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Title</th><th>Category</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((row) => (
                    <tr key={row.uuid}>
                      <td>{row.event_date}</td>
                      <td>{row.title}</td>
                      <td>{row.category}</td>
                      <td>{row.is_published ? "Published" : "Draft"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-outline" onClick={() => openEdit(row)}>Edit</button>
                          <button className="btn btn-outline" style={{ color: "#c0392b" }} onClick={() => setConfirmDelete(row)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {modalOpen && (
        <Modal size="md" onClose={() => setModalOpen(false)}>
          <ModalHeader>{editingUuid ? "Edit Event" : "Add Event"}</ModalHeader>
          <ModalBody>
            <FormInput label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required maxLength={255} />

            <div style={{ marginTop: 12 }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="form-grid-3" style={{ marginTop: 12 }}>
              <FormInput label="Date" type="date" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} required />
              <FormSelect label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} options={CATEGORY_OPTIONS} required />
            </div>

            <div style={{ marginTop: 12 }}>
              <Checkbox
                checked={form.is_published}
                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                label="Published (visible on public homepage)"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
              {saving ? "Saving…" : "Save"}
            </button>
          </ModalFooter>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Event"
          body={`Are you sure you want to delete "${confirmDelete.title}"?`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
