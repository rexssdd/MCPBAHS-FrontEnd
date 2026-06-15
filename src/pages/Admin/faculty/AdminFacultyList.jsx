import { useMemo, useState } from "react";

import {
  ConfirmModal,
  Pagination,
  SearchInput,
  DataTable,
  Badge,
} from "../../../Components/ui";

import { DEPARTMENTS } from "./adminFacultyConstants.js";
import { TableSkeleton } from "./AdminFacultySharedUi.jsx";

import {
  IconTrash,
  IconEdit,
} from "./adminFacultyIcons.jsx";

import "./adminFacultyListTabs.css";

export function FacultyList({
  faculty,
  loading,
  meta,

  search,
  dept,

  activeTab,
  onTabChange,

  onSearch,
  onDeptChange,
  onPageChange,

  onView,
  onEdit,
  onDelete,
  onRestore,
  onAdd,
}) {
  const [selected, setSelected] = useState([]);
  const [delTarget, setDelTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null); // ✅ FIX ADDED
  const [showDeptFilter, setShowDeptFilter] = useState(false);

  // =========================
  // NORMALIZATION (UNCHANGED)
  // =========================
  const normalizedFaculty = useMemo(() => {
    if (!Array.isArray(faculty)) return [];

    return faculty.map((f) => ({
      ...f,
      id: f.uuid,
      full_name:
        f.full_name ||
        [f.first_name, f.middle_name, f.last_name]
          .filter(Boolean)
          .join(" "),
      department: f.department || "—",
      position: f.position || "—",
    }));
  }, [faculty]);

  const hasRows = normalizedFaculty.length > 0;

  const columns = [
    {
      key: "personnel_id_number",
      label: "Staff ID",
      bold: true,
      link: true,
      render: (r) => r?.personnel_id_number || "—",
    },
    {
      key: "full_name",
      label: "Name",
      bold: true,
      render: (r) => r?.full_name || "—",
    },
    {
      key: "position",
      label: "Position",
      muted: true,
      render: (r) => r?.position || "—",
    },
    {
      key: "department",
      label: "Department",
      muted: true,
      render: (r) => r?.department || "—",
    },
    {
      key: "employment_status",
      label: "Status",
      render: (r) => (
        <Badge status={r?.employment_status || "inactive"} />
      ),
    },
  ];

  const tabs = [
    { id: "active", label: "Active" },
    { id: "archived", label: "Archived" },
  ];

  // =========================
  // TOGGLE ONE
  // =========================
  const handleToggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  // =========================
  // TOGGLE ALL (WORKING)
  // =========================
  const handleToggleAll = (_, rows) => {
    const pageIds = rows.map((r) => r.id);

    setSelected((prev) => {
      const allSelected = pageIds.every((id) => prev.includes(id));

      if (allSelected) {
        return prev.filter((id) => !pageIds.includes(id));
      }

      return Array.from(new Set([...prev, ...pageIds]));
    });
  };

  return (
    <>
      {/* HEADER */}
      <div style={{ marginBottom: "24px" }}>
        <h1 className="page-title">Faculty and Staff</h1>
        <p className="page-subtitle">
          Manage teaching and non-teaching personnel.
        </p>
      </div>

      {/* TABS */}
      <div className="faculty-list-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`faculty-list-tab${
              activeTab === tab.id ? " active" : ""
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />

        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowDeptFilter((v) => !v)}
          >
            Filters {dept ? `(${dept})` : ""}
          </button>

          {showDeptFilter && (
            <div
              className="card"
              style={{ position: "absolute", top: "100%", zIndex: 10 }}
            >
              <select
                className="form-input"
                value={dept}
                onChange={(e) => onDeptChange(e.target.value)}
              >
                <option value="">All departments</option>

                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="toolbar-spacer" />

        {activeTab !== "archived" && (
          <button className="btn btn-primary" onClick={onAdd}>
            + Add Faculty
          </button>
        )}
      </div>

      {/* TABLE */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : hasRows ? (
        <DataTable
          columns={columns}
          rows={normalizedFaculty}
          selected={selected}
          getRowKey={(r) => r.id}
          onRowClick={onView}
          onToggleOne={handleToggleOne}
          onToggleAll={handleToggleAll}
          renderActions={(row) => {
            const isArchived = activeTab === "archived";

            return (
              <div className="action-btn-group">

                {!isArchived && (
                  <>
                    <button
                      className="action-btn"
                      onClick={() => onEdit(row)}
                    >
                      <IconEdit />
                      Edit
                    </button>

                    <button
                      className="action-btn action-btn--danger"
                      onClick={() => setDelTarget(row.id)}
                    >
                      <IconTrash />
                      Delete
                    </button>
                  </>
                )}

                {isArchived && (
                  <button
                    className="action-btn"
                    onClick={() => setRestoreTarget(row.id)}   // ✅ FIX
                  >
                    Restore
                  </button>
                )}

              </div>
            );
          }}
        />
      ) : (
        <div style={{ padding: 20 }}>
          No records found.
        </div>
      )}

      {/* PAGINATION */}
      <Pagination
        page={meta?.current_page || 1}
        total={meta?.total || 0}
        perPage={meta?.per_page || 10}
        onChange={onPageChange}
      />

      {/* DELETE MODAL */}
      {delTarget && (
        <ConfirmModal
          title="Delete record?"
          danger
          body="This will permanently remove the faculty record."
          confirmLabel="Yes, Delete"
          cancelLabel="Cancel"
          onCancel={() => setDelTarget(null)}
          onConfirm={() => {
            onDelete(delTarget);
            setDelTarget(null);
          }}
        />
      )}

      {/* RESTORE MODAL ✅ ADDED */}
      {restoreTarget && (
        <ConfirmModal
          title="Restore record?"
          body="This will restore the faculty record."
          confirmLabel="Yes, Restore"
          cancelLabel="Cancel"
          onCancel={() => setRestoreTarget(null)}
          onConfirm={() => {
            onRestore(restoreTarget);
            setRestoreTarget(null);
          }}
        />
      )}
    </>
  );
}