import { useState } from "react";
import {
  ConfirmModal,
  Pagination,
  SearchInput,
  DataTable,
  Badge,
} from "../../../Components/ui";
import { getFacultyFullName, getFacultyRole } from "../../../utils/facultyValidation";
import { isArchived } from "../../../utils/archive";
import { DEPARTMENTS } from "./adminFacultyConstants.js";
import { ApiStatusBanner, TableSkeleton } from "./AdminFacultySharedUi.jsx";
import { IconTrash, IconEdit, IconArchiveSmall } from "./adminFacultyIcons.jsx";
import "./adminFacultyListTabs.css";

export function FacultyList({ faculty, loading, apiState, apiError, onRetry, onView, onEdit, onDelete, onArchive, onAdd }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [delTarget, setDelTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [deptFilter, setDeptFilter] = useState("");
  const [showDeptFilter, setShowDeptFilter] = useState(false);

  const safeFaculty = Array.isArray(faculty) ? faculty : [];
  const activeFaculty = safeFaculty.filter((f) => (f?.status || "Active") !== "Inactive");
  const archivedFaculty = safeFaculty.filter((f) => isArchived(f?.status));
  const displayedFaculty = activeTab === "archived" ? archivedFaculty : activeFaculty;

  const searchTerm = (search || "").trim().toLowerCase();
  const filtered = displayedFaculty.filter((f) => {
    const name = getFacultyFullName(f, "").toLowerCase();
    const id = typeof f?.id === "string" ? f.id : "";
    const matchesSearch = name.includes(searchTerm) || id.includes(search.trim());
    const d = (f?.department || "").trim();
    const matchesDept = !deptFilter || d === deptFilter;
    return matchesSearch && matchesDept;
  });

  const paginated = filtered.slice((page - 1) * 10, page * 10);
  const hasRows = paginated.length > 0;

  const columns = [
    { key: "id", label: "Staff ID", bold: true, link: true, render: (r) => r?.personnel_id_number},
    { key: "_name", label: "Name", bold: true, render: (r) => r?.full_name || "—" },
    { key: "role", label: "Position", muted: true, render: (r) => r?.position || "—" },
    { key: "dept", label: "Department", muted: true, render: (r) => r?.department || "—" },
    { key: "status", label: "Status", render: (r) => <Badge status={r?.employment_status || "Inactive"} /> },
  ];

  const tabs = [
    { id: "active", label: "Active" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <>
      <div style={{ marginBottom: "24px" }}>
        <h1 className="page-title">Faculty and Staff</h1>
        <p className="page-subtitle">Manage teaching and non-teaching personnel.</p>
      </div>

      <div className="faculty-list-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`faculty-list-tab${activeTab === tab.id ? " active" : ""}`}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ApiStatusBanner status={loading ? "fetching" : apiState} error={apiError} onRetry={onRetry} />

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowDeptFilter((v) => !v)}
            aria-expanded={showDeptFilter}
          >
            Filters{deptFilter ? ` (${deptFilter})` : ""}
          </button>
          {showDeptFilter && (
            <div
              className="card"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 6,
                zIndex: 20,
                minWidth: 220,
                padding: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            >
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "var(--gray-700)" }}>Department</p>
              <select
                className="form-input"
                style={{ width: "100%", fontSize: 13 }}
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {deptFilter && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ marginTop: 10, width: "100%", fontSize: 12 }}
                  onClick={() => {
                    setDeptFilter("");
                    setShowDeptFilter(false);
                    setPage(1);
                  }}
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>
        <div className="toolbar-spacer" />
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          + Add Faculty
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : hasRows ? (
        <DataTable
          columns={columns}
          rows={paginated}
          selected={selected}
          onToggleAll={() =>
            setSelected(paginated.every((r) => selected.includes(r.id)) ? [] : paginated.map((r) => r.id))
          }
          onToggleOne={(id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
          onRowClick={onView}
          renderActions={(row) => (
            <div className="action-btn-group">
              {activeTab !== "archived" && (
                <button
                  type="button"
                  className="action-btn action-btn--edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(row.id);
                  }}
                  title="Archive"
                  style={{ color: "var(--gray-600)", borderColor: "var(--gray-200)", background: "var(--gray-50)" }}
                >
                  <IconArchiveSmall />
                  <span>Archive</span>
                </button>
              )}

              <button
                type="button"
                className="action-btn action-btn--danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setDelTarget(row.id);
                }}
                title="Delete"
              >
                <IconTrash />
                <span>Delete</span>
              </button>

              <button
                type="button"
                className="action-btn action-btn--edit"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row);
                }}
                title="Edit"
              >
                <IconEdit />
                <span>Edit</span>
              </button>
            </div>
          )}
        />
      ) : (
        <div
          style={{
            padding: "28px 20px",
            background: "var(--white)",
            borderRadius: "16px",
            border: "1px solid var(--border-card)",
            color: "var(--gray-600)",
          }}
        >
          {searchTerm
            ? "No matching faculty records found."
            : deptFilter
              ? "No personnel in this department."
              : activeTab === "archived"
                ? "No archived faculty records available yet."
                : "No active faculty records available yet."}
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={10} onChange={setPage} />

      {delTarget && (
        <ConfirmModal
          title="Delete record?"
          danger
          body="This will permanently remove the faculty record from the database."
          confirmLabel="Yes, Delete"
          cancelLabel="Cancel"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          onCancel={() => setDelTarget(null)}
          onConfirm={() => {
            onDelete(delTarget);
            setDelTarget(null);
          }}
        />
      )}
    </>
  );
}
