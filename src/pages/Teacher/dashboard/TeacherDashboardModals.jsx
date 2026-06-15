import { useState } from "react";
import { Modal, Pagination } from "./TeacherDashboardPrimitives.jsx";
import { usePagination } from "./useTeacherDashboardPagination.js";
import { attendanceColor, remarksColor } from "./teacherDashboardTokens.js";

/* ══════════════════════════════════════════════════════════
   FULL ATTENDANCE MODAL
══════════════════════════════════════════════════════════ */
export const AllAttendanceModal = ({ open, onClose, data }) => {
  const [search,  setSearch]  = useState("");
  const [statusF, setStatusF] = useState("");

  const filtered = data.filter(s => {
    const ms = !search  || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search);
    const mf = !statusF || s.status === statusF;
    return ms && mf;
  });
  const { page, setPage, totalPages, paginated, reset } = usePagination(filtered, 10);

  return (
    <Modal
      open={open} onClose={onClose}
      title="Today's Attendance"
      subtitle={`${filtered.length} of ${data.length} students`}
      size="md"
      footer={<button className="btn btn--secondary" onClick={onClose}>Close</button>}
    >
      <div className="modal-search-bar">
        <input className="modal-search-input" placeholder="Search name or ID…" value={search}
          onChange={e => { setSearch(e.target.value); reset(); }} />
        <select className="modal-select" value={statusF} onChange={e => { setStatusF(e.target.value); reset(); }}>
          <option value="">All Status</option>
          <option>Present</option>
          <option>Late</option>
          <option>Absent</option>
        </select>
      </div>
      {paginated.length === 0
        ? <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No results</div></div>
        : <table className="modal-table">
            <thead><tr><th>Student</th><th>ID</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {paginated.map(s => {
                const ac = attendanceColor[s.status];
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight:700 }}>{s.name}</td>
                    <td style={{ color:"#9aaa9a", fontSize:11 }}>{s.id}</td>
                    <td>
                      <span className="badge" style={{ color:ac.color, background:ac.bg, border:`1px solid ${ac.border}` }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ color:"#9aaa9a", fontSize:11 }}>{s.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      }
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════
   GRADES MODAL
══════════════════════════════════════════════════════════ */
export const AllGradesModal = ({ open, onClose, data }) => {
  const [search, setSearch] = useState("");
  const filtered = data.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const { page, setPage, totalPages, paginated, reset } = usePagination(filtered, 10);

  return (
    <Modal
      open={open} onClose={onClose}
      title="Grade Book — Q3"
      subtitle="Mathematics 8 · Section 8-Mabini"
      size="lg"
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose}>Close</button>
          <button className="btn btn--primary">Export Grades</button>
        </>
      }
    >
      <div className="modal-search-bar">
        <input className="modal-search-input" placeholder="Search student…" value={search}
          onChange={e => { setSearch(e.target.value); reset(); }} />
      </div>
      <table className="modal-table">
        <thead><tr><th>Student</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Average</th><th>Remarks</th></tr></thead>
        <tbody>
          {paginated.map(s => {
            const rc = remarksColor[s.remarks] || remarksColor.Passed;
            return (
              <tr key={s.id}>
                <td style={{ fontWeight:700 }}>{s.name}</td>
                <td>{s.q1}</td>
                <td>{s.q2}</td>
                <td>{s.q3}</td>
                <td style={{ color:"#9aaa9a" }}>—</td>
                <td style={{ fontWeight:800, color:s.avg<75?"#b91c1c":s.avg>=90?"#15803d":"#111f11" }}>
                  {s.avg.toFixed(1)}
                </td>
                <td>
                  <span className="badge" style={{ color:rc.color, background:rc.bg }}>{s.remarks}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════
   LOW PERFORMERS MODAL
══════════════════════════════════════════════════════════ */
export const LowPerformersModal = ({ open, onClose, data, onLogIntervention }) => {
  const [note, setNote]         = useState("");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving]     = useState(false);

  const handleLog = async () => {
    if (!selected) return;
    setSaving(true);
    await onLogIntervention(selected.name, note);
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title="Students Needing Attention"
      subtitle={`${data.length} students flagged for intervention`}
      size="md"
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose} disabled={saving}>Close</button>
          <button className="btn btn--primary" onClick={handleLog} disabled={!selected || saving}>
            {saving ? "Saving…" : "Log Intervention"}
          </button>
        </>
      }
    >
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
        {data.map((s, i) => (
          <div
            key={i}
            onClick={() => setSelected(s)}
            style={{
              padding:"12px 14px",
              background: selected?.name===s.name ? "#fff7f7" : "#fef2f2",
              border:`1.5px solid ${selected?.name===s.name ? "#b91c1c" : "#fecaca"}`,
              borderRadius:12, cursor:"pointer", transition:"all 0.13s",
            }}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontWeight:700, fontSize:12.5, color:"#111f11" }}>{s.name}</span>
              <span style={{ fontWeight:800, fontSize:16, color:s.avg<60?"#b91c1c":"#a16207" }}>{s.avg.toFixed(1)}</span>
            </div>
            <div style={{ fontSize:10, color:"#9aaa9a", marginBottom:5 }}>{s.absences} absences · Grade {s.grade}</div>
            <div style={{ fontSize:10, fontWeight:600, color:"#b91c1c" }}>{s.concern}</div>
          </div>
        ))}
      </div>
      {selected && (
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#111f11", marginBottom:6 }}>
            Intervention Note for {selected.name}
          </div>
          <textarea
            className="modal-textarea"
            placeholder="Describe the intervention taken or planned…"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
      )}
    </Modal>
  );
};
