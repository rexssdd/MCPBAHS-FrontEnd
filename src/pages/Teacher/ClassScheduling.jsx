/**
 * TeacherClassScheduling.jsx
 * src/pages/Teacher/ClassScheduling.jsx
 * ─────────────────────────────────────────────────────────────────
 * Teacher Dashboard — My Classes & Schedule
 *
 * Responsibilities (this file only):
 *   • Render the scheduling UI for a teacher
 *   • Delegate all data fetching + filtering to useTeacherScheduling
 *   • Present ZERO admin controls (no add/edit/delete/archive/bulk)
 *
 * Hook  → src/hooks/useTeacherScheduling.js
 * Service → src/services/Teacher/ClassScheduling/schedulingService.js
 *
 * ✅ Black-box testable via:
 *   Inputs:  currentTeacher string, mocked service responses
 *   Outputs: rendered UI, filtered table rows
 * ─────────────────────────────────────────────────────────────────
 */

import { useMemo, useState } from "react";
import Sidebar from "../../Components/Sidebar";
import { Toast } from "../../Components/ui";
import ClassSchedulingErrorBoundary from "../../Components/ClassSchedulingErrorBoundary";
import { useTeacherScheduling } from "../../hooks/teacher/useTeacherClassScheduling";
import { useAuth } from "../../context/useAuth";
import "../../Css/Teacher/ClassScheduling.css";

// ─── Teacher identity ────────────────────────────────────────────

const DEMO_TEACHER_PROFILE = {
  username: "teacher",
  name: "Mr. John Jay Doe",
};

function deriveTeacherProfile(auth) {
  const user = auth?.user ?? {};
  const username = user.username ?? auth?.username ?? "";
  const isFallbackTeacher = auth?.authSource === "fallback" && username === "teacher";

  return {
    id: user.id ?? user._id ?? user.teacherId ?? user.facultyId ?? auth?.teacherId ?? auth?.id ?? "",
    email: user.email ?? auth?.email ?? "",
    username,
    name:
      user.fullName ??
      user.name ??
      user.displayName ??
      auth?.fullName ??
      auth?.name ??
      (isFallbackTeacher ? DEMO_TEACHER_PROFILE.name : ""),
    user,
  };
}

// ─── Static lookup data ──────────────────────────────────────────
const STUDENT_ROSTER = {
  "Gumamela":    [
    { last:"Cooper",  first:"Kristin" }, { last:"Miles",   first:"Esther"  },
    { last:"Nguyen",  first:"Shane"   }, { last:"Black",   first:"Marvin"  },
    { last:"Henry",   first:"Arthur"  }, { last:"Flores",  first:"Juanita" },
    { last:"Torres",  first:"Leo"     }, { last:"Rivera",  first:"Camille" },
  ],
  "Sampaguita":  [{ last:"Reyes", first:"Ana" }, { last:"Santos", first:"Mark" }, { last:"Cruz", first:"Lily" }, { last:"Bautista", first:"Jose" }],
  "Rosal":       [{ last:"Garcia", first:"Pedro" }, { last:"Tan", first:"Liza" }, { last:"Mendoza", first:"Carla" }],
  "Ilang-Ilang": [{ last:"Villanueva", first:"Mark" }, { last:"Reyes", first:"Joy" }, { last:"Santos", first:"Leo" }],
};

const GRADE_LEVELS = ["7","8","9","10","11","12"];
const PAGE_SIZE    = 8;

// ─── Subject colour palette ──────────────────────────────────────
const SUB_COLORS = {
  "Science":            { bg:"#fef2f2", bd:"#fca5a5", tx:"#991b1b" },
  "Mathematics":        { bg:"#eff6ff", bd:"#93c5fd", tx:"#1e40af" },
  "English":            { bg:"#f0fdf4", bd:"#86efac", tx:"#15803d" },
  "Filipino":           { bg:"#fefce8", bd:"#fde047", tx:"#854d0e" },
  "MAPEH":              { bg:"#fdf4ff", bd:"#e879f9", tx:"#7e22ce" },
  "TLE":                { bg:"#fff7ed", bd:"#fb923c", tx:"#9a3412" },
  "Araling Panlipunan": { bg:"#f0f9ff", bd:"#67e8f9", tx:"#0e7490" },
  "ESP":                { bg:"#f5f3ff", bd:"#a78bfa", tx:"#6d28d9" },
  "Computer Science":   { bg:"#fef3c7", bd:"#fbbf24", tx:"#92400e" },
  "Values Education":   { bg:"#fff1f2", bd:"#fda4af", tx:"#9f1239" },
};
const getSubColor = s => SUB_COLORS[s] || { bg:"#f4f6f4", bd:"#9aaa9a", tx:"#374151" };

// ─── Timetable parsing helpers ───────────────────────────────────
const DAYS  = ["Mon","Tue","Wed","Thu","Fri"];
const HOURS = [7,8,9,10,11,12,13,14,15,16,17];
const fmtH  = h => `${h>12?h-12:h===0?12:h}:00 ${h>=12?"pm":"am"}`;

function parseSlot(ts) {
  try {
    const dayMap = { Mon:0, Tue:1, Wed:2, Thu:3, Fri:4 };
    const [dPart, tPart] = ts.split(" at ");
    const [s, e] = tPart.split(" - ");
    const parseH = t => {
      const [hm, p] = t.trim().split(" ");
      let [h] = hm.split(":").map(Number);
      if (p === "pm" && h !== 12) h += 12;
      if (p === "am" && h === 12) h = 0;
      return h;
    };
    const dp = dPart.split("-").map(d => dayMap[d.trim()]).filter(d => d !== undefined);
    const days = [];
    if (dp.length === 2) { for (let d = dp[0]; d <= dp[1]; d++) days.push(d); }
    else days.push(...dp);
    return { days, start: parseH(s), end: parseH(e) };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
//  ICONS
// ═══════════════════════════════════════════════════════════════
const Ico = {
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
  Sort:   () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>,
  Eye:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Grid:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  ChevL:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>,
  Request:() => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><line x1="18" y1="2" x2="22" y2="6"/><path d="M7.5 18.5L22 4"/></svg>,
};

// ═══════════════════════════════════════════════════════════════
//  ATOMS
// ═══════════════════════════════════════════════════════════════
const TabBar = ({ tabs, active, onChange }) => (
  <div className="tab-bar">
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)}
        className={`tab-bar__item ${active === t ? "tab-bar__item--active" : ""}`}>
        {t}
      </button>
    ))}
  </div>
);

const CardTitle = ({ children, action }) => (
  <div className="card-title">
    <span className="card-title__label">{children}</span>
    {action}
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <div className="field__label">{label}</div>
    <div className="field__value">{value || "—"}</div>
  </div>
);

const Breadcrumb = ({ items }) => (
  <div className="breadcrumb">
    {items.map((item, i) => (
      <span key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
        {i > 0 && <span className="breadcrumb__sep">›</span>}
        {item.onClick
          ? <button onClick={item.onClick} className="breadcrumb__link">{item.label}</button>
          : <span className="breadcrumb__current">{item.label}</span>}
      </span>
    ))}
  </div>
);

const Pager = ({ total, page, onChange }) => {
  const tp = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (tp <= 1) return null;
  const pages = [];
  if (tp <= 7) { for (let i = 1; i <= tp; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page-1); i <= Math.min(tp-1, page+1); i++) pages.push(i);
    if (page < tp-2) pages.push("…");
    pages.push(tp);
  }
  return (
    <div className="pager">
      <button disabled={page===1} onClick={() => onChange(page-1)} className="pager__btn pager__btn--inactive pager__nav">
        <Ico.ChevL/> Previous
      </button>
      {pages.map((p, i) => p === "…"
        ? <span key={"e"+i} className="pager__ellipsis">…</span>
        : <button key={p} onClick={() => onChange(p)} className={`pager__btn ${page===p ? "pager__btn--active" : "pager__btn--inactive"}`}>{p}</button>
      )}
      <button disabled={page===tp} onClick={() => onChange(page+1)} className="pager__btn pager__btn--inactive pager__nav">
        Next <Ico.ChevR/>
      </button>
    </div>
  );
};

// ─── Skeleton loaders ────────────────────────────────────────────
const SkeletonRow = ({ cols = 4 }) => (
  <div className="skeleton-row">
    {Array.from({ length: cols }).map((_, i) => (
      <div key={i} className={`skeleton skeleton-cell ${i === 0 ? "skeleton-cell--sm" : i === cols-1 ? "skeleton-cell--md" : "skeleton-cell--lg"}`}/>
    ))}
    <div className="skeleton skeleton-cell--btn"/>
  </div>
);

const SkeletonTable = ({ rows = 6, cols = 4 }) => (
  <div style={{ background:"#fff", border:"1.5px solid #e8ede8", borderRadius:14, overflow:"hidden" }}>
    <div style={{ background:"#fafbfa", padding:"12px 18px", borderBottom:"1.5px solid #e8ede8", display:"flex", gap:14, alignItems:"center" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className={`skeleton skeleton-cell ${i===0?"skeleton-cell--sm":"skeleton-cell--md"}`} style={{ height:12 }}/>
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols}/>)}
  </div>
);

// ─── API status banner ───────────────────────────────────────────
const ApiStatusBanner = ({ status, errorMsg, onRetry }) => {
  if (!status) return null;
  const config = {
    fetching: { label: "Loading your schedule…",                          cls: "api-status-banner--fetching", dot: "api-status-dot--fetching" },
    success:  { label: "Schedule loaded.",                                cls: "api-status-banner--success",  dot: "api-status-dot--success"  },
    error:    { label: `Could not load data: ${errorMsg || "API error"}.  Showing cached data.`, cls: "api-status-banner--error",   dot: "api-status-dot--error"   },
    fallback: { label: "No connection. Showing fallback data.",           cls: "api-status-banner--fallback", dot: "api-status-dot--fallback" },
  }[status];
  if (!config) return null;
  return (
    <div className={`api-status-banner ${config.cls}`}>
      <div className={`api-status-dot ${config.dot}`}/>
      {status === "fetching" && <div className="spinner"/>}
      <span style={{ flex:1 }}>{config.label}</span>
      {(status === "error" || status === "fallback") && onRetry && (
        <button onClick={onRetry} style={{ fontSize:12, fontWeight:700, cursor:"pointer", background:"none", border:"1.5px solid currentColor", borderRadius:6, padding:"3px 10px", color:"inherit", fontFamily:"inherit" }}>
          Retry
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  TODAY'S CLASSES WIDGET
// ═══════════════════════════════════════════════════════════════
const TodayWidget = ({ schedules }) => {
  const TODAY_DAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
  const todays = schedules.filter(s => {
    const p = parseSlot(s.timeslot);
    if (!p) return false;
    const di = DAYS.indexOf(TODAY_DAY);
    return di !== -1 && p.days.includes(di);
  });

  return (
    <div className="card card--padded" style={{ marginBottom:16 }}>
      <CardTitle>Today's Classes — {TODAY_DAY}</CardTitle>
      {todays.length === 0
        ? <p style={{ fontSize:13, color:"#9aaa9a", marginTop:8 }}>No classes scheduled for today.</p>
        : (
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:10 }}>
            {todays.map(s => {
              const c = getSubColor(s.subject);
              return (
                <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 12px", background:c.bg, border:`1.5px solid ${c.bd}`, borderRadius:8 }}>
                  <span style={{ fontWeight:600, color:c.tx, fontSize:13, minWidth:140 }}>{s.subject}</span>
                  <span style={{ color:"#6b7280", fontSize:13 }}>Grade {s.gradeLevel} – {s.section}</span>
                  <span style={{ marginLeft:"auto", color:"#6b7280", fontSize:12 }}>{s.timeslot.split(" at ")[1]}</span>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  SECTION LIST  (view-only — no add / edit / delete / archive)
// ═══════════════════════════════════════════════════════════════
const SectionList = ({ sections, loading, onView }) => {
  const [search,  setSearch]  = useState("");
  const [gradeF,  setGradeF]  = useState("");
  const [showF,   setShowF]   = useState(false);
  const [page,    setPage]    = useState(1);

  const filtered = sections.filter(s => {
    const q = search.toLowerCase();
    return (
      s.sectionName.toLowerCase().includes(q) ||
      String(s.gradeLevel).includes(q)
    ) && (!gradeF || s.gradeLevel === gradeF);
  });
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (<>
    {/* ── Toolbar: search + filter only, no action buttons ── */}
    <div className="toolbar">
      <div className="search-bar">
        <Ico.Search/>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search sections…"
          className="search-bar__input"
          data-testid="section-search"
        />
      </div>
      <div className="filter-dropdown">
        <button onClick={() => setShowF(v => !v)} className="btn btn-outline" style={{ gap:7 }}>
          Filters <Ico.Filter/>
          {gradeF && <span className="filter-badge">1</span>}
        </button>
        {showF && (
          <div className="filter-dropdown__menu">
            <div className="filter-dropdown__section-label">Grade Level</div>
            {["",...GRADE_LEVELS].map(g => (
              <div key={g||"all"} onClick={() => { setGradeF(g); setShowF(false); setPage(1); }} className="filter-dropdown__item">
                <div className={`filter-dropdown__box ${gradeF===g?"filter-dropdown__box--active":"filter-dropdown__box--inactive"}`}>
                  {gradeF===g && <span className="filter-dropdown__checkmark">✓</span>}
                </div>
                {g ? `Grade ${g}` : "All Grades"}
              </div>
            ))}
            {gradeF && (
              <button onClick={() => { setGradeF(""); setShowF(false); }} className="filter-dropdown__clear">
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {loading ? <SkeletonTable rows={6} cols={4}/> : (
      <div className="card">
        <table className="table" data-testid="section-table">
          <thead>
            <tr className="table__head-row">
              {["Grade Level","Section Name","Students","Actions"].map(lbl => (
                <th key={lbl} className="table__th">
                  {lbl !== "Actions"
                    ? <span className="table__th-inner">{lbl}<Ico.Sort/></span>
                    : lbl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={4} className="table__empty" data-testid="section-empty">No sections found.</td></tr>
            )}
            {paged.map(s => (
              <tr key={s.id} className="table__row" data-testid="section-row">
                <td className="table__td table__td--strong">Grade {s.gradeLevel}</td>
                <td className="table__td">{s.sectionName}</td>
                <td className="table__td">{s.students}</td>
                <td className="table__td">
                  {/* VIEW ONLY — no Edit / Delete / Archive */}
                  <div className="table__actions">
                    <button onClick={() => onView(s)} className="btn btn-g-ghost" data-testid="section-view-btn">
                      <Ico.Eye/> View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager total={filtered.length} page={page} onChange={setPage}/>
      </div>
    )}
  </>);
};

// ═══════════════════════════════════════════════════════════════
//  SECTION VIEW  (no Edit button)
// ═══════════════════════════════════════════════════════════════
const SectionView = ({ section, schedules, onBack }) => {
  const [tab, setTab] = useState("Sections");
  const students = STUDENT_ROSTER[section.sectionName] || [];
  const sectionSchedules = schedules.filter(schedule =>
    schedule.section === section.sectionName &&
    String(schedule.gradeLevel) === String(section.gradeLevel)
  );

  return (
    <div className="content-area">
      <Breadcrumb items={[{ label:"My Sections", onClick:onBack }, { label:section.sectionName }]}/>
      <TabBar tabs={["Sections","Schedule"]} active={tab} onChange={setTab}/>

      {tab === "Sections" && (
        <div className="card card--padded" style={{ marginTop:20 }}>
          {/* Read-only — no Edit action */}
          <CardTitle>Section Details</CardTitle>
          <div className="section-detail-grid">
            <Field label="Section Name"       value={section.sectionName}/>
            <Field label="Grade Level"        value={`Grade ${section.gradeLevel}`}/>
            <Field label="Number of Students" value={section.students}/>
            <Field label="Adviser"            value={section.adviser}/>
          </div>

          <CardTitle>Student List</CardTitle>
          <table className="student-table" data-testid="student-roster">
            <thead>
              <tr>{["Last Name","First Name"].map(h => <th key={h} className="student-table__th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {students.length
                ? students.map((s, i) => (
                  <tr key={i}>
                    <td className="student-table__td student-table__td--last">{s.last}</td>
                    <td className="student-table__td student-table__td--first">{s.first}</td>
                  </tr>
                ))
                : <tr><td colSpan={2} style={{ padding:"20px 0", color:"#9aaa9a", fontSize:13 }}>No students enrolled yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      )}

      {tab === "Schedule" && (
        <div className="card card--padded" style={{ marginTop:20 }}>
          <CardTitle>Schedule</CardTitle>
          {sectionSchedules.length === 0 ? (
            <p style={{ fontSize:13, color:"#9aaa9a" }}>No schedule assigned to this section yet.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {sectionSchedules.map(schedule => {
                const color = getSubColor(schedule.subject);
                return (
                  <div
                    key={schedule.id}
                    style={{
                      display:"grid",
                      gridTemplateColumns:"minmax(160px, 1fr) minmax(180px, 1.4fr)",
                      gap:12,
                      alignItems:"center",
                      padding:"12px 14px",
                      background:color.bg,
                      border:`1.5px solid ${color.bd}`,
                      borderRadius:10,
                    }}
                  >
                    <span style={{ color:color.tx, fontWeight:700, fontSize:13 }}>{schedule.subject}</span>
                    <span style={{ color:"#4b5563", fontSize:13 }}>{schedule.timeslot}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  SCHEDULE LIST  (view-only — no add / delete / archive / bulk)
// ═══════════════════════════════════════════════════════════════
const ScheduleList = ({ schedules, loading, onView, onTimetable }) => {
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  const filtered = schedules.filter(s => {
    const q = search.toLowerCase();
    return (
      s.subject.toLowerCase().includes(q) ||
      s.section.toLowerCase().includes(q)  ||
      String(s.gradeLevel).includes(q)
    );
  });
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (<>
    {/* ── Toolbar: search + timetable link only ── */}
    <div className="toolbar">
      <div className="search-bar">
        <Ico.Search/>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search schedules…"
          className="search-bar__input"
          data-testid="schedule-search"
        />
      </div>
      <div className="toolbar__spacer"/>
      {/* "View Master Timetable" → "My Timetable" */}
      <button onClick={onTimetable} className="btn btn-outline" data-testid="my-timetable-btn">
        <Ico.Grid/> My Timetable
      </button>
      {/* ❌ No "Add Class Schedule" button */}
    </div>

    {loading ? <SkeletonTable rows={6} cols={5}/> : (
      <div className="card">
        <table className="table" data-testid="schedule-table">
          <thead>
            <tr className="table__head-row">
              {["Subject","Grade","Section","Time Slot","Actions"].map(lbl => (
                <th key={lbl} className="table__th">
                  {lbl !== "Actions"
                    ? <span className="table__th-inner">{lbl}<Ico.Sort/></span>
                    : lbl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={5} className="table__empty" data-testid="schedule-empty">No schedules found.</td></tr>
            )}
            {paged.map(s => {
              const c = getSubColor(s.subject);
              return (
                <tr key={s.id} className="table__row" data-testid="schedule-row">
                  <td className="table__td table__td--strong">
                    <span style={{ padding:"2px 8px", borderRadius:6, background:c.bg, color:c.tx, border:`1px solid ${c.bd}`, fontSize:12, fontWeight:600 }}>
                      {s.subject}
                    </span>
                  </td>
                  <td className="table__td">
                    <span className="grade-badge"><span className="grade-badge__dot"/>Grade {s.gradeLevel}</span>
                  </td>
                  <td className="table__td">{s.section}</td>
                  <td className="table__td" style={{ fontSize:13 }}>{s.timeslot}</td>
                  <td className="table__td">
                    <div className="table__actions">
                      {/* VIEW ONLY — no Edit / Delete / Archive */}
                      <button onClick={() => onView(s)} className="btn btn-g-ghost" data-testid="schedule-view-btn">
                        <Ico.Eye/> View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pager total={filtered.length} page={page} onChange={setPage}/>
      </div>
    )}
  </>);
};

// ═══════════════════════════════════════════════════════════════
//  SCHEDULE VIEW  (optional "Request Change" — UI only)
// ═══════════════════════════════════════════════════════════════
const ScheduleView = ({ schedule, onBack, onRequestChange }) => (
  <div className="content-area">
    <Breadcrumb items={[{ label:"My Schedule", onClick:onBack }, { label:schedule.subject }]}/>
    <TabBar tabs={["Sections","Schedule"]} active="Schedule" onChange={() => {}}/>
    <div className="card card--padded" style={{ marginTop:20 }}>
      {/* Read-only — no Edit action.
          Optional: "Request Change" is UI-only (no data mutation). */}
      <CardTitle action={
        <button
          onClick={() => onRequestChange(schedule)}
          className="btn btn-outline"
          title="Request a schedule change"
          data-testid="request-change-btn"
        >
          <Ico.Request/> Request Change
        </button>
      }>
        Schedule Details
      </CardTitle>
      <div className="schedule-detail-grid">
        <Field label="Subject Name" value={schedule.subject}/>
        <Field label="Grade Level"  value={`Grade ${schedule.gradeLevel}`}/>
        <Field label="Section Name" value={schedule.section}/>
        <Field label="Adviser"      value={schedule.adviser}/>
        <Field label="Time Slot"    value={schedule.timeslot}/>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
//  MY TIMETABLE  (filtered to currentTeacher, renamed)
// ═══════════════════════════════════════════════════════════════
const MyTimetable = ({ schedules, onBack }) => {
  const [mode, setMode] = useState("Week");

  // Map schedules to timetable events — already filtered by hook.
  const events = schedules
    .map(s => { const p = parseSlot(s.timeslot); return p ? { ...s, ...p } : null; })
    .filter(Boolean);

  const evAt = (di, h) => events.filter(e => e.days.includes(di) && e.start <= h && e.end > h);

  return (
    <div className="content-area">
      <div className="timetable-toolbar">
        <div style={{ display:"flex", gap:6 }}>
          {["Today","Back","Next"].map(l => <button key={l} className="btn btn-outline">{l}</button>)}
        </div>
        <div className="timetable-toolbar__date">10 December 2025 – 16 December 2025</div>
        <button onClick={onBack} className="btn btn-outline" data-testid="timetable-back-btn">
          <Ico.Grid/> View My Schedule List
        </button>
        <div className="view-mode-toggle">
          {["Month","Week","Day"].map((v, i) => (
            <button key={v} onClick={() => setMode(v)}
              className={`view-mode-toggle__btn ${mode===v?"view-mode-toggle__btn--active":"view-mode-toggle__btn--inactive"}`}
              style={{ borderRight: i < 2 ? "1px solid #e5e7eb" : "none" }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Colour legend */}
      <div className="legend">
        {Object.entries(SUB_COLORS).map(([sub, c]) => (
          <span key={sub} className="legend__chip" style={{ background:c.bg, border:`1px solid ${c.bd}`, color:c.tx }}>{sub}</span>
        ))}
      </div>

      {/* Grid */}
      <div className="card" style={{ overflow:"auto" }}>
        <div className="timetable-grid" data-testid="timetable-grid">
          <div className="timetable-header-cell timetable-header-cell--time">
            <span style={{ fontSize:11, color:"#9aaa9a", fontWeight:600 }}>Time</span>
          </div>
          {DAYS.map((d, i) => (
            <div key={d}
              className={`timetable-header-cell ${d==="Wed"?"timetable-header-cell--today":""}`}
              style={{ borderRight: i < 4 ? "1px solid #f0f4f0" : "none" }}>
              <div className={`timetable-day-label ${d==="Wed"?"timetable-day-label--today":""}`}>{d}</div>
            </div>
          ))}

          {HOURS.map(h => (
            <div key={h} style={{ display:"contents" }}>
              <div className="timetable-time-cell">{fmtH(h)}</div>
              {DAYS.map((d, di) => {
                const evs = evAt(di, h);
                return (
                  <div key={d}
                    className={`timetable-slot ${d==="Wed"?"timetable-slot--today":""}`}
                    style={{ borderRight: di < 4 ? "1px solid #f0f4f0" : "none" }}>
                    {evs.map((ev, ei) => {
                      const c = getSubColor(ev.subject);
                      return (
                        <div key={ei} className="timetable-event"
                          title={`${ev.subject} — ${ev.section}`}
                          style={{ background:c.bg, borderColor:c.bd, color:c.tx }}
                          data-testid="timetable-event">
                          {ev.subject}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  ROOT PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
function TeacherClassSchedulingPage() {
  // ── Auth ──────────────────────────────────────────────────────
  const { auth } = useAuth();
  const currentTeacher = useMemo(() => deriveTeacherProfile(auth), [auth]);
  const teacherName = currentTeacher.name || currentTeacher.username || "your account";

  // ── Data (hook owns all fetch + filter logic) ─────────────────
  const { sections, schedules, loading, error, apiStatus, retry } =
    useTeacherScheduling(currentTeacher);

  // ── UI state ──────────────────────────────────────────────────
  const [mainTab,        setMainTab]        = useState("Sections");
  const [view,           setView]           = useState("list");
  const [activeSection,  setActiveSection]  = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [toast,          setToast]          = useState(null);

  const goList = () => { setView("list"); setActiveSection(null); setActiveSchedule(null); };

  // "Request Change" — UI-only, fires a toast. Wire to API later.
  const handleRequestChange = (schedule) => {
    setToast(`Change request submitted for ${schedule.subject} (${schedule.section}).`);
  };

  // ── Render ────────────────────────────────────────────────────
  const renderContent = () => {
    if (view === "viewSection") return (
      <SectionView section={activeSection} schedules={schedules} onBack={goList}/>
    );
    if (view === "viewSchedule") return (
      <ScheduleView schedule={activeSchedule} onBack={goList} onRequestChange={handleRequestChange}/>
    );
    if (view === "timetable") return (
      <MyTimetable schedules={schedules} onBack={goList}/>
    );

    // ── Main list view ────────────────────────────────────────
    return (
      <div className="content-area">
        {/* Page heading — teacher-specific copy */}
        <div className="page-heading">
          <h1 className="page-heading__title">My Classes &amp; Schedule</h1>
          <p className="page-heading__sub">Showing sections and schedules assigned to {teacherName}.</p>
        </div>

        {/* Today's classes widget */}
        {!loading && schedules.length > 0 && (
          <TodayWidget schedules={schedules}/>
        )}

        <TabBar tabs={["Sections","Schedule"]} active={mainTab} onChange={setMainTab}/>

        <div style={{ marginTop:20 }}>
          <ApiStatusBanner status={apiStatus} errorMsg={error} onRetry={retry}/>

          {mainTab === "Sections" ? (
            <SectionList
              sections={sections}
              loading={loading}
              onView={s => { setActiveSection(s); setView("viewSection"); }}
            />
          ) : (
            <ScheduleList
              schedules={schedules}
              loading={loading}
              onView={s => { setActiveSchedule(s); setView("viewSchedule"); }}
              onTimetable={() => setView("timetable")}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-layout">
      {/* Role is "teacher" — sidebar renders teacher-specific nav */}
      <Sidebar role="teacher"/>
      <main id="main-content" className="page-main" style={{ display:"flex" }}>
        {renderContent()}
      </main>
      {toast && <Toast message={toast} onClose={() => setToast(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT (wrapped with error boundary)
// ═══════════════════════════════════════════════════════════════
export default function TeacherClassScheduling() {
  return (
    <ClassSchedulingErrorBoundary>
      <TeacherClassSchedulingPage/>
    </ClassSchedulingErrorBoundary>
  );
}
