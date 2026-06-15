import { useState } from "react";
import { Modal, Pagination } from "./RegistrarDashboardPrimitives.jsx";
import { usePagination } from "./useRegistrarPagination.js";
import {
  statusColor,
  getStatus,
  docsColor,
  priorityColor,
  MOCK_REQUIRED_DOCS_LIST,
} from "./registrarDashboardTokens.js";

export function EnrollmentGradeModal({ open, onClose, data }) {
  const [search, setSearch] = useState("");
  const filtered = data.filter(
    (r) => String(r.grade).includes(search) || String(r.enrolled).includes(search),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enrollment by Grade Level"
      subtitle={`All ${data.length} grade levels · School Year 2024–2025`}
      size="md"
      footer={<button className="btn btn--secondary" onClick={onClose}>Close</button>}
    >
      <div className="modal-search-bar">
        <input
          className="modal-search-input"
          placeholder="Search grade…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <table className="modal-table">
        <thead>
          <tr>
            <th>Grade</th>
            <th>Enrolled</th>
            <th>Capacity</th>
            <th>Rate</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => {
            const pct = Math.round((row.enrolled / row.capacity) * 100);
            const status = getStatus(row.enrolled, row.capacity);
            const sc = statusColor[status];
            return (
              <tr key={row.grade}>
                <td style={{ fontWeight: 700 }}>Grade {row.grade}</td>
                <td style={{ fontWeight: 700, color: "#111f11" }}>{row.enrolled}</td>
                <td style={{ color: "#9aaa9a" }}>{row.capacity}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="progress-track" style={{ width: 80 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 100 ? "#ef4444" : pct >= 85 ? "#eab308" : "#1a5c1a",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#111f11" }}>{pct}%</span>
                  </div>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">No results</div>
        </div>
      )}
    </Modal>
  );
}

export function AllApplicationsModal({ open, onClose, data, onProcess }) {
  const [search, setSearch] = useState("");
  const [gradeF, setGradeF] = useState("");
  const [priorityF, setPriorityF] = useState("");
  const [docsF, setDocsF] = useState("");

  const filtered = data.filter((app) => {
    const matchSearch =
      !search || app.name.toLowerCase().includes(search.toLowerCase()) || app.id.includes(search);
    const matchGrade = !gradeF || String(app.grade) === gradeF;
    const matchPriority = !priorityF || app.priority === priorityF;
    const matchDocs = !docsF || app.docs === docsF;
    return matchSearch && matchGrade && matchPriority && matchDocs;
  });

  const { page, setPage, totalPages, paginated, reset } = usePagination(filtered, 8);

  const handleFilter = (setter) => (e) => {
    setter(e.target.value);
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="All Pending Applications"
      subtitle={`${filtered.length} of ${data.length} applications`}
      size="lg"
      footer={<button className="btn btn--secondary" onClick={onClose}>Close</button>}
    >
      <div className="modal-search-bar">
        <input
          className="modal-search-input"
          placeholder="Search name or ID…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reset();
          }}
        />
        <select className="modal-select" value={gradeF} onChange={handleFilter(setGradeF)}>
          <option value="">All Grades</option>
          {[...new Set(data.map((a) => a.grade))]
            .sort()
            .map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
        </select>
        <select className="modal-select" value={priorityF} onChange={handleFilter(setPriorityF)}>
          <option value="">All Priority</option>
          <option value="high">Urgent</option>
          <option value="med">Medium</option>
          <option value="normal">Normal</option>
        </select>
        <select className="modal-select" value={docsF} onChange={handleFilter(setDocsF)}>
          <option value="">All Docs</option>
          <option value="Complete">Complete</option>
          <option value="Incomplete">Incomplete</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {paginated.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No applications found</div>
          <div className="empty-state-sub">Try adjusting your filters</div>
        </div>
      ) : (
        <table className="modal-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>ID</th>
              <th>Grade</th>
              <th>Type</th>
              <th>Documents</th>
              <th>Submitted</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((app) => {
              const dc = docsColor[app.docs] || docsColor.Pending;
              const pc = priorityColor[app.priority] || priorityColor.normal;
              return (
                <tr key={app.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700 }}>{app.name}</span>
                      {app.priority === "high" && (
                        <span className="badge" style={{ color: pc.color, background: pc.bg, fontSize: 9 }}>
                          URGENT
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: "#9aaa9a", fontSize: 11 }}>{app.id}</td>
                  <td>Grade {app.grade}</td>
                  <td>{app.type}</td>
                  <td>
                    <span className="badge" style={{ color: dc.color, background: dc.bg }}>
                      {app.docs}
                    </span>
                  </td>
                  <td style={{ color: "#9aaa9a", fontSize: 11 }}>{app.submitted}</td>
                  <td>
                    <button
                      className="btn btn--outline-green"
                      style={{ fontSize: 11, padding: "5px 12px" }}
                      onClick={() => onProcess(app)}
                    >
                      Process
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </Modal>
  );
}

export function ProcessApplicationModal({ open, onClose, application, onConfirm, loading }) {
  const [note, setNote] = useState("");

  if (!application) return null;

  const dc = docsColor[application.docs] || docsColor.Pending;

  const handleAction = (action) => {
    onConfirm(application.id, action, note);
  };

  const docStatuses = MOCK_REQUIRED_DOCS_LIST.map((doc, idx) => ({
    name: doc,
    submitted:
      application.docs === "Complete" ||
      (String(application.id ?? "").charCodeAt(0) + doc.length + idx) % 3 !== 0,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Process Application"
      subtitle={`Reviewing application for ${application.name}`}
      size="md"
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </>
      }
    >
      <div className="process-panel">
        <div className="process-info-grid">
          <div className="process-info-item">
            <div className="process-info-label">Full Name</div>
            <div className="process-info-value">{application.name}</div>
          </div>
          <div className="process-info-item">
            <div className="process-info-label">Application ID</div>
            <div className="process-info-value" style={{ color: "#9aaa9a", fontSize: 12 }}>
              {application.id}
            </div>
          </div>
          <div className="process-info-item">
            <div className="process-info-label">Grade Level</div>
            <div className="process-info-value">Grade {application.grade}</div>
          </div>
          <div className="process-info-item">
            <div className="process-info-label">Type</div>
            <div className="process-info-value">{application.type}</div>
          </div>
          <div className="process-info-item">
            <div className="process-info-label">Date Submitted</div>
            <div className="process-info-value">{application.submitted}</div>
          </div>
          <div className="process-info-item">
            <div className="process-info-label">Document Status</div>
            <div style={{ marginTop: 4 }}>
              <span className="badge" style={{ color: dc.color, background: dc.bg }}>
                {application.docs}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111f11", marginBottom: 10 }}>
            Document Checklist
          </div>
          <div className="process-docs-list">
            {docStatuses.map((doc) => (
              <div
                key={doc.name}
                className="process-doc-item"
                style={{
                  background: doc.submitted ? "#f9fbf9" : "#fef2f2",
                  borderColor: doc.submitted ? "#e8ede8" : "#fecaca",
                }}
              >
                <div
                  className="process-doc-check"
                  style={{
                    background: doc.submitted ? "#1a5c1a" : "#fef2f2",
                    color: doc.submitted ? "#fff" : "#b91c1c",
                  }}
                >
                  {doc.submitted ? "✓" : "✕"}
                </div>
                <span
                  style={{
                    fontSize: 12.5,
                    color: doc.submitted ? "#111f11" : "#b91c1c",
                    flex: 1,
                  }}
                >
                  {doc.name}
                </span>
                {!doc.submitted && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#b91c1c" }}>Missing</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111f11", marginBottom: 6 }}>
            Remarks / Notes <span style={{ fontWeight: 400, color: "#9aaa9a" }}>(optional)</span>
          </div>
          <textarea
            className="modal-textarea"
            placeholder="Add a note for the applicant or for internal records…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111f11", marginBottom: 10 }}>
            Select Action
          </div>
          <div className="process-action-btns">
            <button
              className="process-action-btn process-action-btn--enroll"
              onClick={() => handleAction("Enrolled")}
              disabled={loading}
            >
              ✓ Enroll Student
            </button>
            <button
              className="process-action-btn process-action-btn--hold"
              onClick={() => handleAction("On Hold")}
              disabled={loading}
            >
              ⏸ Put On Hold
            </button>
            <button
              className="process-action-btn process-action-btn--disapprove"
              onClick={() => handleAction("Disapproved")}
              disabled={loading}
            >
              ✕ Disapprove
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function AllTransfereesModal({ open, onClose, data }) {
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const filtered = data.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.from.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusF || t.status === statusF;
    return matchSearch && matchStatus;
  });
  const { page, setPage, totalPages, paginated, reset } = usePagination(filtered, 8);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transferee Applications"
      subtitle={`${filtered.length} transferees this school year`}
      size="lg"
      footer={<button className="btn btn--secondary" onClick={onClose}>Close</button>}
    >
      <div className="modal-search-bar">
        <input
          className="modal-search-input"
          placeholder="Search name or school…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reset();
          }}
        />
        <select
          className="modal-select"
          value={statusF}
          onChange={(e) => {
            setStatusF(e.target.value);
            reset();
          }}
        >
          <option value="">All Status</option>
          <option value="Approved">Approved</option>
          <option value="Pending Docs">Pending Docs</option>
          <option value="For Interview">For Interview</option>
        </select>
      </div>
      {paginated.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-text">No transferees found</div>
        </div>
      ) : (
        <table className="modal-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Previous School</th>
              <th>Grade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((t, i) => {
              const sColor =
                t.status === "Approved"
                  ? { bg: "#f0fdf4", color: "#15803d" }
                  : t.status === "For Interview"
                    ? { bg: "#eff6ff", color: "#1d4ed8" }
                    : { bg: "#fefce8", color: "#a16207" };
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>{t.name}</td>
                  <td>{t.from}</td>
                  <td>Grade {t.grade}</td>
                  <td>
                    <span className="badge" style={{ color: sColor.color, background: sColor.bg }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </Modal>
  );
}

export function SendRemindersModal({ open, onClose, data, onSend }) {
  const [selected, setSelected] = useState(() => new Set(data.map((_, i) => i)));
  const [sending, setSending] = useState(false);
  const toggle = (i) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const toggleAll = () => {
    setSelected(selected.size === data.length ? new Set() : new Set(data.map((_, i) => i)));
  };

  const handleSend = async () => {
    setSending(true);
    await onSend();
    setSending(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send Document Reminders"
      subtitle={`${selected.size} of ${data.length} students selected`}
      size="md"
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
          >
            {sending ? "Sending…" : `Send to ${selected.size} Students`}
          </button>
        </>
      }
    >
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="checkbox"
          checked={selected.size === data.length}
          onChange={toggleAll}
          style={{ width: 15, height: 15, cursor: "pointer" }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#4a5e4a" }}>Select All</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map((s, i) => (
          <div
            key={i}
            onClick={() => toggle(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              border: `1.5px solid ${selected.has(i) ? "#bbf7d0" : "#e8ede8"}`,
              background: selected.has(i) ? "#f0fdf4" : "#fff",
              borderRadius: 10,
              cursor: "pointer",
              transition: "all 0.13s",
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(i)}
              onChange={() => toggle(i)}
              onClick={(e) => e.stopPropagation()}
              style={{ width: 15, height: 15, cursor: "pointer" }}
            />
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#f0fdf4",
                border: "1.5px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 800,
                color: "#1a5c1a",
              }}
            >
              {s.name.split(",")[0][0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111f11" }}>{s.name}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {s.missing.map((doc) => (
                  <span
                    key={doc}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#b91c1c",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      padding: "1px 7px",
                      borderRadius: 20,
                    }}
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>
            <span style={{ fontSize: 11, color: "#9aaa9a", flexShrink: 0 }}>G{s.grade}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
