/**
 * src/pages/Enrollment/EnrollmentPage.jsx
 *
 * ONE reusable Enrollment page component shared by all roles.
 * Role-based behavior is driven entirely by the `role` prop, resolved
 * through the central ROLE_PERMISSIONS config.
 *
 * Usage:
 *   <EnrollmentPage role="admin" />
 *   <EnrollmentPage role="principal" />
 *   <EnrollmentPage role="registrar" />
 *
 * RBAC enforcement happens at two levels:
 *   1. CSS: role modifier class on the root (.role-principal, etc.)
 *      → hides destructive UI via EnrollmentPage.css
 *   2. JS:  permission checks guard handler calls and form field state
 *      → prevents accidental action even if CSS is overridden
 */

import { useState } from "react";
import Sidebar from "../../Components/Sidebar";
import { isArchived } from "../../utils/archive";
import {
  Toast, ConfirmModal, Modal, ModalHeader, ModalBody, ModalFooter,
  Breadcrumb, Pagination, SearchInput, DataTable, FormInput, FormSelect, CountryField,
  InfoCard, InfoField, Badge,
} from "../../Components/ui";

import { getPermissions } from "../../Config/rolePermissions";
import "../../Css/EnrollmentPage.css";

/* ─────────────────────────── Constants ──────────────────────────────────── */

const GRADE_LEVELS  = ["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const SCHOOL_TYPES  = ["Public","Private","Special Science School","Integrated School"];
const PALETTE       = ["#1a5c1a","#2a7a2a","#c4920a","#1d4ed8","#7c3aed","#dc2626","#0891b2","#db2777"];
const PAGE_SIZE     = 8;

const EMPTY_FORM = {
  firstName:"", middleName:"", lastName:"",
  email:"", phone:"", dob:"",
  country:"Philippines", city:"", postalCode:"",
  oldSchoolName:"", oldSchoolType:"", oldSchoolId:"", oldSchoolAddress:"",
};

/* ─────────────────────────── Helpers ────────────────────────────────────── */

const getInitials = name =>
  name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

const getAvatarBg = name =>
  PALETTE[name.charCodeAt(0) % PALETTE.length];

const generateEnrollees = () => {
  const fn = ["John Jay","Maria","Jose","Ana","Pedro","Rosa","Carlo","Liza","Marco","Jenny","Renz","Carla","Alvin","Bea","Dan"];
  const ln = ["Doe","Santos","Bautista","Cruz","Garcia","Villanueva","Reyes","Tan","Lim","Torres","Rivera","Mendoza","Flores","Ramos","Aquino"];
  return Array.from({ length: 40 }, (_, i) => ({
    id:           String(100000 + i + 1),
    learnerId:    String(200000 + i + 1),
    firstName:    fn[i % fn.length],
    middleName:   "Simon",
    lastName:     ln[i % ln.length],
    gradeLevel:   GRADE_LEVELS[i % GRADE_LEVELS.length],
    email:        `${fn[i % fn.length].toLowerCase().replace(" ", ".")}@example.com`,
    phone:        `091${String(20000000 + i).slice(0, 8)}`,
    dob:          "12-01-2008",
    country:      "Philippines",
    city:         "Matina, Davao City",
    postalCode:   "8000",
    oldSchoolName:    "Talomo National High School",
    oldSchoolType:    "Public",
    oldSchoolId:      "612345",
    oldSchoolAddress: "Brgy. Talomo Proper, Talomo, Davao City",
    status: i % 7 === 2 ? "Archived" : "Active",
  }));
};

/* ─────────────────────────── Sub-components ─────────────────────────────── */

/**
 * EnrolleeView
 * Fully read-only profile card — accessible to all roles.
 * The Edit button is only rendered when `permissions.canEdit` is true.
 */
function EnrolleeView({ enrollee, onBack, onEdit, permissions }) {
  const middleInitial = enrollee.middleName ? enrollee.middleName[0] : "";
  const fullName = `${enrollee.firstName} ${middleInitial ? `${middleInitial}. ` : ""}${enrollee.lastName}`;

  return (
    <>
      <Breadcrumb
        parts={[
          { label: "Enrollment", onClick: onBack },
          { label: enrollee.learnerId },
        ]}
      />

      {/* Header card */}
      <div className="info-card enrollee-view-header">
        <div
          className="enrollee-avatar"
          style={{ background: getAvatarBg(enrollee.firstName) }}
        >
          {getInitials(`${enrollee.firstName} ${enrollee.lastName}`)}
        </div>

        <div className="enrollee-view-header__meta">
          <h2 className="enrollee-view-header__name">{fullName}</h2>
          <p className="enrollee-view-header__grade">{enrollee.gradeLevel} pupil</p>
          <p className="enrollee-view-header__city">{enrollee.city}</p>
        </div>

        {/* Only shown when role has edit permission */}
        {permissions.canEdit && (
          <div className="enrollee-view-header__action">
            <button className="btn btn-primary" onClick={() => onEdit(enrollee)}>
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Info cards grid */}
      <div className="enrollee-info-grid">
        <InfoCard title="Personal Information">
          <div className="form-grid-3" style={{ marginBottom: "16px" }}>
            <InfoField label="First Name"   value={enrollee.firstName} />
            <InfoField label="Middle Name"  value={enrollee.middleName} />
            <InfoField label="Last Name"    value={enrollee.lastName} />
          </div>
          <div className="form-grid-3">
            <InfoField label="Email"         value={enrollee.email} />
            <InfoField label="Phone Number"  value={enrollee.phone} />
            <InfoField label="Date of Birth" value={enrollee.dob} />
          </div>
        </InfoCard>

        <InfoCard title="Address">
          <div className="form-grid-3">
            <InfoField label="Country"     value={enrollee.country} />
            <InfoField label="City"        value={enrollee.city} />
            <InfoField label="Postal Code" value={enrollee.postalCode} />
          </div>
        </InfoCard>

        <InfoCard title="Old School Information">
          <div className="form-grid-3" style={{ marginBottom: "16px" }}>
            <InfoField label="School Name" value={enrollee.oldSchoolName} />
            <InfoField label="School Type" value={enrollee.oldSchoolType} />
            <InfoField label="School ID"   value={enrollee.oldSchoolId} />
          </div>
          <InfoField label="School Address" value={enrollee.oldSchoolAddress} />
        </InfoCard>

        <InfoCard title="Attachments">
          <div className="attachment-row">
            <div>
              <p className="attachment-row__name">Birth Cert.pdf</p>
              <p className="attachment-row__size">8.77 MB</p>
            </div>
            <div className="attachment-row__check">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </InfoCard>
      </div>
    </>
  );
}

/**
 * EnrolleeForm
 * Handles both create and edit modes.
 * When `permissions.editableFields` is an array (not "all"), fields not in
 * that array are rendered as read-only inputs.
 */
function EnrolleeForm({ initial, mode, onSave, onCancel, permissions }) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(
    initial
      ? {
          firstName:        initial.firstName,
          middleName:       initial.middleName,
          lastName:         initial.lastName,
          email:            initial.email,
          phone:            initial.phone,
          dob:              initial.dob,
          country:          "Philippines",
          city:             initial.city,
          postalCode:       initial.postalCode,
          oldSchoolName:    initial.oldSchoolName,
          oldSchoolType:    initial.oldSchoolType,
          oldSchoolId:      initial.oldSchoolId,
          oldSchoolAddress: initial.oldSchoolAddress,
        }
      : { ...EMPTY_FORM }
  );

  const [preview, setPreview] = useState(false);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  /**
   * Determine if a specific field is editable for this role.
   * "all" means every field is editable (admin).
   * An array means only those keys are editable.
   */
  const isEditable = key =>
    permissions.editableFields === "all" ||
    permissions.editableFields.includes(key);

  const renderRoleInput = (fieldKey, label, placeholder, type) =>
    isEditable(fieldKey) ? (
      <FormInput
        label={label}
        value={form[fieldKey]}
        onChange={set(fieldKey)}
        placeholder={placeholder}
        type={type}
      />
    ) : (
      <div>
        <p className="info-field-label">{label}</p>
        <div className="form-input form-field-readonly">
          {form[fieldKey] || "—"}
        </div>
      </div>
    );

  const renderRoleSelect = (fieldKey, label, options) =>
    isEditable(fieldKey) ? (
      <FormSelect
        label={label}
        value={form[fieldKey]}
        onChange={set(fieldKey)}
        options={options}
      />
    ) : (
      <div>
        <p className="info-field-label">{label}</p>
        <div className="form-input form-field-readonly">
          {form[fieldKey] || "—"}
        </div>
      </div>
    );

  return (
    <>
      <Breadcrumb
        parts={
          isEdit
            ? [
                { label: "Enrollment", onClick: onCancel },
                { label: initial.learnerId },
                { label: "Edit" },
              ]
            : [
                { label: "Enrollment", onClick: onCancel },
                { label: "Add" },
              ]
        }
      />

      <div className="form-card">
        {/* Card header */}
        <div>
          <h2 className="form-section-title">
            {isEdit ? "Edit Enrollee" : "Add Enrollee"}
          </h2>
          <div className="form-divider" />
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="form-section-title form-section-label">
            Personal Information
          </h3>
          <div className="form-grid-3" style={{ marginBottom: "16px" }}>
            {renderRoleInput("firstName", "First Name", "First Name")}
            {renderRoleInput("middleName", "Middle Name", "Middle Name")}
            {renderRoleInput("lastName", "Last Name", "Last Name")}
          </div>
          <div className="form-grid-3">
            {renderRoleInput("email", "Email", "Email")}
            {renderRoleInput("phone", "Phone number", "09XX XXX XXXX")}
            {renderRoleInput("dob", "Date of Birth", "mm/dd/yy")}
          </div>
        </div>

        <div className="form-divider" />

        {/* Address */}
        <div>
          <h3 className="form-section-title form-section-label">Address</h3>
          <div className="form-grid-3">
            <CountryField value={form.country || "Philippines"} />
            {renderRoleInput("city", "City", "City")}
            {renderRoleInput("postalCode", "Postal Code", "0000")}
          </div>
        </div>

        <div className="form-divider" />

        {/* Old School Information */}
        <div>
          <h3 className="form-section-title form-section-label">
            Old School Information
          </h3>
          <div className="form-grid-3">
            {renderRoleInput("oldSchoolName", "School Name", "School Name")}
            {renderRoleSelect("oldSchoolType", "School Type", SCHOOL_TYPES)}
            {renderRoleInput("oldSchoolId", "School ID", "School ID")}
          </div>
        </div>

        <div className="form-divider" />

        {/* Footer actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => setPreview(true)}>
            {isEdit ? "Save Changes" : "Add Enrollee"}
          </button>
        </div>
      </div>

      {/* Preview / Confirm modal */}
      {preview && (
        <Modal size="lg" onClose={() => setPreview(false)}>
          <ModalHeader
            icon={
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8"  x2="12"   y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            }
          >
            Preview
          </ModalHeader>

          <ModalBody>
            <p style={{ fontWeight: 600, marginBottom: "12px", fontSize: "13px", color: "var(--gray-700)" }}>
              Personal Information
            </p>
            <div className="form-grid-3" style={{ marginBottom: "16px" }}>
              {[
                ["First Name", form.firstName],
                ["Last Name",  form.lastName],
                ["Date of Birth", form.dob],
                ["Email", form.email],
                ["Phone", form.phone],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="info-field-label">{label}</p>
                  <div className="form-input form-field-readonly">{value || "—"}</div>
                </div>
              ))}
            </div>

            <p style={{ fontWeight: 600, marginBottom: "12px", fontSize: "13px", color: "var(--gray-700)" }}>
              Address
            </p>
            <div className="form-grid-3">
              {[
                ["Country",     form.country],
                ["City",        form.city],
                ["Postal Code", form.postalCode],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="info-field-label">{label}</p>
                  <div className="form-input form-field-readonly">{value || "—"}</div>
                </div>
              ))}
            </div>
          </ModalBody>

          <ModalFooter>
            <button className="btn btn-outline" onClick={() => setPreview(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => { setPreview(false); onSave(form); }}
            >
              Confirm
            </button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}

/**
 * EnrolleeList
 * Table view with search, pagination, and per-row actions.
 * Write actions are hidden via CSS role modifier classes —
 * JS permission checks add a second layer of safety.
 */
function EnrolleeList({ enrollees, onView, onEdit, onArchive, onAdd, permissions }) {
  const [search,        setSearch]        = useState("");
  const [page,          setPage]          = useState(1);
  const [selected,      setSelected]      = useState([]);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const filtered = enrollees.filter(
    e =>
      !isArchived(e.status) &&
      (
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        e.learnerId.includes(search)
      )
  );

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    { key: "learnerId", label: "Learner ID", bold: true, link: true },
    { key: "_name",     label: "Learner Name", bold: true, render: r => `${r.firstName} ${r.lastName}` },
    { key: "gradeLevel", label: "Grade Level", muted: true },
    { key: "status",    label: "Status", render: r => <Badge status={r.status} /> },
  ];

  return (
    <>
      <div className="enrollment-page-header">
        <h1 className="page-title">Enrollment</h1>
        <p className="page-subtitle">Manage enrollee record.</p>
      </div>

      <div className="enrollment-toolbar">
        <SearchInput
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <button className="btn btn-outline">Filters</button>

        <div className="enrollment-toolbar__spacer" />

        {/*
          Bulk actions — hidden for principal via:
            CSS: .role-principal .bulk-actions { display: none }
            JS:  permissions.canBulkArchive guard on click
        */}
        <div className="bulk-actions">
          <button
            className={`btn btn-danger${!permissions.canBulkArchive ? " btn-disabled" : ""}`}
            onClick={() => permissions.canBulkArchive && selected.length > 0 && setArchiveTarget("bulk")}
            aria-hidden={!permissions.canBulkArchive}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            {" "}Archive
          </button>
        </div>

        {/*
          Add button — hidden for principal via:
            CSS: .role-principal .btn-add-enrollee { display: none }
            JS:  permissions.canAdd guard on click
        */}
        <button
          className="btn btn-primary btn-add-enrollee"
          onClick={() => permissions.canAdd && onAdd()}
          aria-hidden={!permissions.canAdd}
        >
          + Add Enrollee
        </button>
      </div>

      <div className="enrollment-table-window">
        <div className="window-header">
          <div className="window-dots">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="window-title">Enrollee Registry</p>
            <p className="window-subtitle">Showing {filtered.length} active enrollee{filtered.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={paginated}
          selected={selected}
          /*
            Bulk selection callbacks are no-ops when canBulkArchive is false.
            The checkbox column still renders (layout preserved),
            but selecting rows has no visible effect — the archive button is hidden.
          */
          onToggleAll={() => {
            if (!permissions.canBulkArchive) return;
            setSelected(
              paginated.every(r => selected.includes(r.id))
                ? []
                : paginated.map(r => r.id)
            );
          }}
          onToggleOne={id => {
            if (!permissions.canBulkArchive) return;
            setSelected(s =>
              s.includes(id) ? s.filter(x => x !== id) : [...s, id]
            );
          }}
          onRowClick={onView}
          renderActions={row => (
            <>
              {/*
                Archive row action — hidden via CSS .role-principal .btn-archive-row
                JS guard prevents action even if CSS overridden
              */}
              <button
                type="button"
                className="btn btn-danger btn-sm btn-archive-row"
                onClick={() => permissions.canArchive && setArchiveTarget(row.id)}
                aria-hidden={!permissions.canArchive}
                aria-label="Archive enrollee"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                Archive
              </button>

              {/*
                Edit row action — hidden via CSS .role-principal .btn-edit-row
                JS guard prevents action even if CSS overridden
              */}
              <button
                type="button"
                className="btn btn-outline btn-sm btn-edit-row"
                onClick={() => permissions.canEdit && onEdit(row)}
                aria-hidden={!permissions.canEdit}
                aria-label="Edit enrollee"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            </>
          )}
        />
      </div>

      <Pagination
        page={page}
        total={filtered.length}
        perPage={PAGE_SIZE}
        onChange={setPage}
      />

      {archiveTarget && (
        <ConfirmModal
          title="Are you sure?"
          danger
          body="Archiving this will hide it from the main list."
          confirmLabel="Yes, Archive"
          cancelLabel="No, Cancel"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="var(--red-600)" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8"  x2="12"   y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          onCancel={() => setArchiveTarget(null)}
          onConfirm={() => {
            onArchive(archiveTarget === "bulk" ? selected : [archiveTarget]);
            setSelected([]);
            setArchiveTarget(null);
          }}
        />
      )}
    </>
  );
}

/* ─────────────────────────── Page Root ──────────────────────────────────── */

/**
 * EnrollmentPage — role-aware page root.
 *
 * @param {string} role  - "admin" | "principal" | "registrar" (default: "admin")
 *
 * The `role` prop is the single source of truth for all RBAC decisions
 * inside this page. No other files need to change when adding a new role —
 * just add the role entry in rolePermissions.js.
 */
export default function EnrollmentPage({ role = "admin" }) {
  const permissions = getPermissions(role);

  const [enrollees, setEnrollees] = useState(generateEnrollees);
  const [view,      setView]      = useState("list");
  const [target,    setTarget]    = useState(null);
  const [toast,     setToast]     = useState(null);

  const goList = () => { setView("list"); setTarget(null); };

  const handleSave = form => {
    if (view === "create") {
      setEnrollees(e => [
        {
          ...form,
          id:           Date.now().toString(),
          learnerId:    `LRN${enrollees.length + 1}`,
          status:       "Active",
          oldSchoolType:    form.oldSchoolType || "Public",
          oldSchoolAddress: "",
        },
        ...e,
      ]);
      setToast("Enrollee successfully added");
    } else {
      setEnrollees(e => e.map(x => x.id === target.id ? { ...x, ...form } : x));
      setToast("Enrollee successfully updated");
    }
    goList();
  };

  const handleArchive = ids => {
    if (!permissions.canArchive && !permissions.canBulkArchive) return; // JS safety guard
    const arr = Array.isArray(ids) ? ids : [ids];
    setEnrollees(e => e.map(x => arr.includes(x.id) ? { ...x, status: "Archived" } : x));
    setToast("Enrollee successfully archived");
  };

  return (
    /*
      The role modifier class (e.g. "role-principal") is applied here.
      EnrollmentPage.css uses this to hide write-action elements via CSS,
      keeping the DOM intact for layout stability.
    */
    <div className={`page-layout enrollment-page role-${role}`}>
      {/* Sidebar is untouched — role prop is passed through as-is */}
      <Sidebar role={role} />

      <main id="main-content" className="page-main">
        <div className="page-body">
          {view === "list" && (
            <EnrolleeList
              enrollees={enrollees}
              permissions={permissions}
              onView={e  => { setTarget(e); setView("view"); }}
              onEdit={e  => { if (permissions.canEdit) { setTarget(e); setView("edit"); } }}
              onArchive={handleArchive}
              onAdd={() => { if (permissions.canAdd) setView("create"); }}
            />
          )}

          {view === "view" && (
            <EnrolleeView
              enrollee={target}
              permissions={permissions}
              onBack={goList}
              onEdit={e => { if (permissions.canEdit) { setTarget(e); setView("edit"); } }}
            />
          )}

          {view === "edit" && permissions.canEdit && (
            <EnrolleeForm
              initial={target}
              mode="edit"
              permissions={permissions}
              onSave={handleSave}
              onCancel={goList}
            />
          )}

          {view === "create" && permissions.canAdd && (
            <EnrolleeForm
              initial={null}
              mode="create"
              permissions={permissions}
              onSave={handleSave}
              onCancel={goList}
            />
          )}
        </div>
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

