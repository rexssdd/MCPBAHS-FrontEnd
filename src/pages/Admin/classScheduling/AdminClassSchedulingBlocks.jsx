import { useState } from "react";
import { schedulesConflict, isDuplicateSection } from "../../../utils/schedulingValidation";
import {
  DEFAULT_SECTIONS, DEFAULT_SCHEDULES, STUDENT_ROSTER, TEACHERS, SUBJECTS, GRADE_LEVELS, SECTION_NAMES, TIMESLOTS, PAGE_SIZE,
} from "./adminClassSchedulingConstants.js";
import {
  SUB_COLORS, getC, DAYS, HOURS, fmtH, parseSlot,
} from "./adminClassSchedulingTimetable.js";
import {
  ApiStatusBanner, SkeletonRow, SkeletonTable, Ico, Checkbox, TabBar, CardTitle, Field, Err, SelectF, Pager, Overlay, DeleteDlg, PreviewDlg, Breadcrumb,
} from "./AdminClassSchedulingUIKit.jsx";

export const SectionList = ({ sections, loading, onAdd, onEdit, onView, onDelete, onArchive }) => {
  const [sel,setSel]=useState([]);
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(1);
  const [gradeF,setGradeF]=useState("");
  const [showF,setShowF]=useState(false);
  const [bulkDel,setBulkDel]=useState(false);

  const filtered = sections.filter(s=>{
    const q=search.toLowerCase();
    return (s.sectionName.toLowerCase().includes(q)||s.adviser.toLowerCase().includes(q)||String(s.gradeLevel).includes(q)) && (!gradeF||s.gradeLevel===gradeF);
  });
  const paged = filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const allCk = paged.length>0&&paged.every(s=>sel.includes(s.id));
  const someCk = sel.length>0&&!allCk;
  const togAll = ()=>setSel(allCk?sel.filter(id=>!paged.find(s=>s.id===id)):[...new Set([...sel,...paged.map(s=>s.id)])]);
  const togOne = id=>setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);

  return (<>
    <div className="toolbar">
      <div className="search-bar">
        <Ico.Search/>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
          placeholder="Search sections…" className="search-bar__input"/>
      </div>
      <div className="filter-dropdown">
        <button onClick={()=>setShowF(v=>!v)} className="btn btn-outline" style={{gap:7}}>
          Filters <Ico.Filter/>
          {gradeF && <span className="filter-badge">1</span>}
        </button>
        {showF && (
          <div className="filter-dropdown__menu">
            <div className="filter-dropdown__section-label">Grade Level</div>
            {["",...GRADE_LEVELS].map(g=>(
              <div key={g||"all"} onClick={()=>{setGradeF(g);setShowF(false);setPage(1);}} className="filter-dropdown__item">
                <div className={`filter-dropdown__box ${gradeF===g?"filter-dropdown__box--active":"filter-dropdown__box--inactive"}`}>
                  {gradeF===g && <span className="filter-dropdown__checkmark">✓</span>}
                </div>
                {g?`Grade ${g}`:"All Grades"}
              </div>
            ))}
            {gradeF && <button onClick={()=>{setGradeF("");setShowF(false);}} className="filter-dropdown__clear">Clear</button>}
          </div>
        )}
      </div>
      <div className="toolbar__spacer"/>
      {sel.length>0 && (
        <button onClick={()=>setBulkDel(true)} className="btn btn-r-ghost"><Ico.Trash/> Delete {sel.length} selected</button>
      )}
      <button onClick={onAdd} className="btn btn-primary"><Ico.Plus/> Add Section</button>
    </div>

    {loading ? <SkeletonTable rows={6} cols={4}/> : (
      <div className="card">
        <table className="table">
          <thead>
            <tr className="table__head-row">
              <th className="table__th table__th--check"><Checkbox checked={allCk} indeterminate={someCk} onChange={togAll}/></th>
              {["Grade Level","Section Name","Adviser","Students","Actions"].map(lbl=>(
                <th key={lbl} className="table__th">
                  {lbl!=="Actions"?<span className="table__th-inner">{lbl}<Ico.Sort/></span>:lbl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length===0 && <tr><td colSpan={6} className="table__empty">No sections found.</td></tr>}
            {paged.map(s=>(
              <tr key={s.id} className="table__row">
                <td className="table__td table__td--check"><Checkbox checked={sel.includes(s.id)} onChange={()=>togOne(s.id)}/></td>
                <td className="table__td table__td--strong">Grade {s.gradeLevel}</td>
                <td className="table__td">{s.sectionName}</td>
                <td className="table__td">{s.adviser}</td>
                <td className="table__td">{s.students}</td>
                <td className="table__td">
                  <div className="table__actions">
                    <button onClick={()=>onEdit(s)} className="btn btn-a-ghost"><Ico.Edit/> Edit</button>
                    <button onClick={()=>onView(s)} className="btn btn-g-ghost"><Ico.Eye/> View</button>
                    <button onClick={()=>onArchive(s)} className="btn btn-outline" title="Archive"><Ico.Archive/></button>
                    <button onClick={()=>onDelete(s)} className="btn btn-r-ghost"><Ico.Trash/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager total={filtered.length} page={page} onChange={setPage}/>
      </div>
    )}

    {bulkDel && (
      <DeleteDlg name={`${sel.length} sections`}
        onCancel={()=>setBulkDel(false)}
        onConfirm={()=>{sel.forEach(id=>{const s=sections.find(x=>x.id===id);if(s)onDelete(s,true);});setSel([]);setBulkDel(false);}}/>
    )}
  </>);
};

/* ════════════════════════════════════════════════════════════
   SECTION VIEW
   ════════════════════════════════════════════════════════════ */
export const SectionView = ({ section, onBack, onEdit }) => {
  const [tab,setTab]=useState("Sections");
  const students = STUDENT_ROSTER[section.sectionName] || [];
  return (
    <div className="content-area">
      <Breadcrumb items={[{label:"Section",onClick:onBack},{label:section.sectionName}]}/>
      <TabBar tabs={["Sections","Schedule"]} active={tab} onChange={setTab}/>
      {tab==="Sections" && (
        <div className="card card--padded" style={{marginTop:20}}>
          <CardTitle action={<button onClick={()=>onEdit(section)} className="btn btn-a-ghost"><Ico.Edit/> Edit</button>}>Section Details</CardTitle>
          <div className="section-detail-grid">
            <Field label="Section Name" value={section.sectionName}/>
            <Field label="Grade Level" value={`Grade ${section.gradeLevel}`}/>
            <Field label="Number of Students" value={section.students}/>
            <Field label="Adviser" value={section.adviser}/>
          </div>
          <CardTitle>Student List</CardTitle>
          <table className="student-table">
            <thead><tr>{["Last Name","First Name"].map(h=><th key={h} className="student-table__th">{h}</th>)}</tr></thead>
            <tbody>
              {students.length ? students.map((s,i)=>(
                <tr key={i}>
                  <td className="student-table__td student-table__td--last">{s.last}</td>
                  <td className="student-table__td student-table__td--first">{s.first}</td>
                </tr>
              )) : <tr><td colSpan={2} style={{padding:"20px 0",color:"#9aaa9a",fontSize:13}}>No students enrolled in this section yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {tab==="Schedule" && (
        <div className="card card--padded" style={{marginTop:20}}>
          <CardTitle>Schedule</CardTitle>
          <p style={{fontSize:13,color:"#9aaa9a"}}>No schedule assigned to this section yet.</p>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   SECTION FORM
   ════════════════════════════════════════════════════════════ */
export const SectionForm = ({ initial, isAdd, sections, onBack, onSave }) => {
  const [form,setForm]=useState({sectionName:initial?.sectionName||"",gradeLevel:initial?.gradeLevel||"",adviser:initial?.adviser||""});
  const [errs,setErrs]=useState({});
  const [preview,setPv]=useState(false);
  const [saving,setSaving]=useState(false);
  const set = k=>v=>setForm(f=>({...f,[k]:v}));
  const validate = ()=>{
    const e={};
    if(!form.sectionName.trim())e.sectionName="Required";
    if(!form.gradeLevel)e.gradeLevel="Required";
    if(!form.adviser)e.adviser="Required";
    if (
      isDuplicateSection(sections, {
        sectionName: form.sectionName,
        gradeLevel: form.gradeLevel,
        excludeId: isAdd ? undefined : initial?.id,
      })
    ) {
      e.sectionName = "A section with this name already exists for this grade level.";
    }
    setErrs(e);return!Object.keys(e).length;
  };
  return (<>
    <div className="content-area">
      <Breadcrumb items={[{label:"Section",onClick:onBack},{label:isAdd?"Add":initial?.sectionName}]}/>
      <TabBar tabs={["Sections","Schedule"]} active="Sections" onChange={()=>{}}/>
      <div className="card card--padded" style={{marginTop:20}}>
        <CardTitle>Section Details</CardTitle>
        <div className="form-grid-2">
          <div><SelectF label="Section Name" value={form.sectionName} onChange={set("sectionName")} options={SECTION_NAMES} placeholder="Select name" required/><Err msg={errs.sectionName}/></div>
          <div><SelectF label="Grade Level" value={form.gradeLevel} onChange={set("gradeLevel")} options={GRADE_LEVELS} placeholder="Select grade" required/><Err msg={errs.gradeLevel}/></div>
        </div>
        <div className="form-grid-half">
          <SelectF label="Adviser" value={form.adviser} onChange={set("adviser")} options={TEACHERS} placeholder="Select adviser" required/>
          <Err msg={errs.adviser}/>
        </div>
        <div className="form-footer">
          <button onClick={onBack} className="btn btn-outline"><Ico.X/> Cancel</button>
          <button onClick={()=>{if(validate())setPv(true);}} className="btn btn-primary"><Ico.Save/> {isAdd?"Add Section":"Save Changes"}</button>
        </div>
      </div>
    </div>
    {preview && (
      <PreviewDlg title="Section Details" data={form} loading={saving}
        fields={[{label:"Section Name",key:"sectionName"},{label:"Grade Level",key:"gradeLevel"},{label:"Adviser",key:"adviser"}]}
        onCancel={()=>setPv(false)}
        onConfirm={async()=>{setSaving(true);await onSave(form);setSaving(false);setPv(false);}}/>
    )}
  </>);
};

/* ════════════════════════════════════════════════════════════
   SCHEDULE LIST
   ════════════════════════════════════════════════════════════ */
export const ScheduleList = ({ schedules, loading, onAdd, onEdit, onView, onDelete, onArchive, onTimetable }) => {
  const [sel,setSel]=useState([]);
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(1);
  const [fSub,setFSub]=useState("");
  const [fGrade,setFGrade]=useState("");
  const [showF,setShowF]=useState(false);
  const [bulkDel,setBulkDel]=useState(false);

  const filtered = schedules.filter(s=>{
    const q=search.toLowerCase();
    return (s.subject.toLowerCase().includes(q)||s.adviser.toLowerCase().includes(q)||s.section.toLowerCase().includes(q))&&(!fSub||s.subject===fSub)&&(!fGrade||s.gradeLevel===fGrade);
  });
  const paged = filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const allCk=paged.length>0&&paged.every(s=>sel.includes(s.id));const someCk=sel.length>0&&!allCk;
  const actF=(fSub?1:0)+(fGrade?1:0);
  const togAll=()=>setSel(allCk?sel.filter(id=>!paged.find(s=>s.id===id)):[...new Set([...sel,...paged.map(s=>s.id)])]);
  const togOne=id=>setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);

  return (<>
    <div className="toolbar">
      <div className="search-bar">
        <Ico.Search/>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search schedules…" className="search-bar__input"/>
      </div>
      <div className="filter-dropdown">
        <button onClick={()=>setShowF(v=>!v)} className="btn btn-outline" style={{gap:7}}>
          Filters <Ico.Filter/>
          {actF>0 && <span className="filter-badge">{actF}</span>}
        </button>
        {showF && (
          <div className="filter-dropdown__menu">
            <div className="filter-dropdown__section-label">Subject</div>
            {["",...SUBJECTS].map(s=>(
              <div key={s||"all"} onClick={()=>{setFSub(s);setPage(1);}} className="filter-dropdown__item">
                <div className={`filter-dropdown__box ${fSub===s?"filter-dropdown__box--active":"filter-dropdown__box--inactive"}`}>
                  {fSub===s&&<span className="filter-dropdown__checkmark">✓</span>}
                </div>
                {s||"All Subjects"}
              </div>
            ))}
            <div className="filter-dropdown__section-label" style={{marginTop:12}}>Grade Level</div>
            {["",...GRADE_LEVELS].map(g=>(
              <div key={g||"all"} onClick={()=>{setFGrade(g);setPage(1);}} className="filter-dropdown__item">
                <div className={`filter-dropdown__box ${fGrade===g?"filter-dropdown__box--active":"filter-dropdown__box--inactive"}`}>
                  {fGrade===g&&<span className="filter-dropdown__checkmark">✓</span>}
                </div>
                {g?`Grade ${g}`:"All Grades"}
              </div>
            ))}
            {actF>0 && <button onClick={()=>{setFSub("");setFGrade("");setShowF(false);}} className="filter-dropdown__clear">Clear all</button>}
          </div>
        )}
      </div>
      <div className="toolbar__spacer"/>
      {sel.length>0 && <button onClick={()=>setBulkDel(true)} className="btn btn-r-ghost"><Ico.Trash/> Delete {sel.length}</button>}
      <button onClick={onTimetable} className="btn btn-outline"><Ico.Grid/> View Master Timetable</button>
      <button onClick={onAdd} className="btn btn-primary"><Ico.Plus/> Add Class Schedule</button>
    </div>

    {loading ? <SkeletonTable rows={6} cols={5}/> : (
      <div className="card">
        <table className="table">
          <thead>
            <tr className="table__head-row">
              <th className="table__th table__th--check"><Checkbox checked={allCk} indeterminate={someCk} onChange={togAll}/></th>
              {["Subject","Grade","Section","Teacher","Time Slot","Actions"].map(lbl=>(
                <th key={lbl} className="table__th">
                  {lbl!=="Actions"?<span className="table__th-inner">{lbl}<Ico.Sort/></span>:lbl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length===0 && <tr><td colSpan={7} className="table__empty">No schedules found.</td></tr>}
            {paged.map(s=>(
              <tr key={s.id} className="table__row">
                <td className="table__td table__td--check"><Checkbox checked={sel.includes(s.id)} onChange={()=>togOne(s.id)}/></td>
                <td className="table__td table__td--strong">{s.subject}</td>
                <td className="table__td"><span className="grade-badge"><span className="grade-badge__dot"/>Grade {s.gradeLevel}</span></td>
                <td className="table__td">{s.section}</td>
                <td className="table__td">{s.adviser}</td>
                <td className="table__td" style={{fontSize:13}}>{s.timeslot}</td>
                <td className="table__td">
                  <div className="table__actions">
                    <button onClick={()=>onEdit(s)} className="btn btn-a-ghost"><Ico.Edit/> Edit</button>
                    <button onClick={()=>onView(s)} className="btn btn-g-ghost"><Ico.Eye/> View</button>
                    <button onClick={()=>onArchive(s)} className="btn btn-outline" title="Archive"><Ico.Archive/></button>
                    <button onClick={()=>onDelete(s)} className="btn btn-r-ghost"><Ico.Trash/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager total={filtered.length} page={page} onChange={setPage}/>
      </div>
    )}

    {bulkDel && (
      <DeleteDlg name={`${sel.length} schedules`}
        onCancel={()=>setBulkDel(false)}
        onConfirm={()=>{sel.forEach(id=>{const s=schedules.find(x=>x.id===id);if(s)onDelete(s,true);});setSel([]);setBulkDel(false);}}/>
    )}
  </>);
};

/* ════════════════════════════════════════════════════════════
   SCHEDULE VIEW
   ════════════════════════════════════════════════════════════ */
export const ScheduleView = ({ schedule, onBack, onEdit }) => (
  <div className="content-area">
    <Breadcrumb items={[{label:"Schedule",onClick:onBack},{label:schedule.id}]}/>
    <TabBar tabs={["Sections","Schedule"]} active="Schedule" onChange={()=>{}}/>
    <div className="card card--padded" style={{marginTop:20}}>
      <CardTitle action={<button onClick={()=>onEdit(schedule)} className="btn btn-a-ghost"><Ico.Edit/> Edit</button>}>Schedule Details</CardTitle>
      <div className="schedule-detail-grid">
        <Field label="Subject Name" value={schedule.subject}/>
        <Field label="Grade Level" value={`Grade ${schedule.gradeLevel}`}/>
        <Field label="Section Name" value={schedule.section}/>
        <Field label="Adviser" value={schedule.adviser}/>
        <Field label="Time Slot" value={schedule.timeslot}/>
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   SCHEDULE FORM
   ════════════════════════════════════════════════════════════ */
export const ScheduleForm = ({ initial, isAdd, sections, schedules = [], onBack, onSave }) => {
  const [form,setForm]=useState({subject:initial?.subject||"",gradeLevel:initial?.gradeLevel||"",section:initial?.section||"",adviser:initial?.adviser||"",timeslot:initial?.timeslot||""});
  const [errs,setErrs]=useState({});
  const [preview,setPv]=useState(false);
  const [saving,setSaving]=useState(false);
  const set = k=>v=>{
    setForm(f=>{
      const next={...f,[k]:v};
      if(k==="section"){const sec=sections.find(s=>s.sectionName===v);if(sec){next.gradeLevel=sec.gradeLevel;next.adviser=sec.adviser;}}
      return next;
    });
  };
  const validate = ()=>{
    const e={};
    if(!form.subject)e.subject="Required";if(!form.gradeLevel)e.gradeLevel="Required";
    if(!form.section)e.section="Required";if(!form.adviser)e.adviser="Required";if(!form.timeslot)e.timeslot="Required";
    const candidate = { ...form, id: initial?.id };
    if (Object.keys(e).length === 0 && schedulesConflict(schedules, candidate, { excludeId: isAdd ? undefined : initial?.id })) {
      e.timeslot = "Conflict detected; schedule is not saved.";
    }
    setErrs(e);return!Object.keys(e).length;
  };
  const sOpts = sections.map(s=>s.sectionName);
  return (<>
    <div className="content-area">
      <Breadcrumb items={[{label:"Schedule",onClick:onBack},...(!isAdd?[{label:initial?.id,onClick:onBack}]:[]),(isAdd?{label:"Add"}:{label:"Edit"})].flat()}/>
      <TabBar tabs={["Sections","Schedule"]} active="Schedule" onChange={()=>{}}/>
      <div className="card card--padded" style={{marginTop:20}}>
        <CardTitle>Schedule Details</CardTitle>
        <div className="form-grid-3">
          <div><SelectF label="Subject Name" value={form.subject} onChange={set("subject")} options={SUBJECTS} placeholder="Select subject" required/><Err msg={errs.subject}/></div>
          <div><SelectF label="Grade Level" value={form.gradeLevel} onChange={set("gradeLevel")} options={GRADE_LEVELS} placeholder="Select grade" required/><Err msg={errs.gradeLevel}/></div>
          <div><SelectF label="Section" value={form.section} onChange={set("section")} options={sOpts} placeholder="Select section" required/><Err msg={errs.section}/></div>
        </div>
        <div className="form-grid-2">
          <div><SelectF label="Adviser" value={form.adviser} onChange={set("adviser")} options={TEACHERS} placeholder="Select adviser" required/><Err msg={errs.adviser}/></div>
          <div><SelectF label="Timeslot" value={form.timeslot} onChange={set("timeslot")} options={TIMESLOTS} placeholder="Select timeslot" required/><Err msg={errs.timeslot}/></div>
        </div>
        <div className="form-footer">
          <button onClick={onBack} className="btn btn-outline"><Ico.X/> Cancel</button>
          <button onClick={()=>{if(validate())setPv(true);}} className="btn btn-primary"><Ico.Save/> {isAdd?"Add Class Schedule":"Save Changes"}</button>
        </div>
      </div>
    </div>
    {preview && (
      <PreviewDlg title="Schedule Details" data={form} loading={saving}
        fields={[{label:"Subject Name",key:"subject"},{label:"Grade Level",key:"gradeLevel"},{label:"Section",key:"section"},{label:"Adviser",key:"adviser"},{label:"Timeslot",key:"timeslot"}]}
        onCancel={()=>setPv(false)}
        onConfirm={async()=>{setSaving(true);await onSave(form);setSaving(false);setPv(false);}}/>
    )}
  </>);
};

export const MasterTimetable = ({ schedules, onBack }) => {
  const [mode,setMode]=useState("Week");
  const events=schedules.map(s=>{const p=parseSlot(s.timeslot);return p?{...s,...p}:null;}).filter(Boolean);
  const evAt=(di,h)=>events.filter(e=>e.days.includes(di)&&e.start<=h&&e.end>h);
  return (
    <div className="content-area">
      <div className="timetable-toolbar">
        <div style={{display:"flex",gap:6}}>{["Today","Back","Next"].map(l=><button key={l} className="btn btn-outline">{l}</button>)}</div>
        <div className="timetable-toolbar__date">10 December 2025 – 16 December 2025</div>
        <button onClick={onBack} className="btn btn-outline"><Ico.Grid/> View Class Schedule List</button>
        <div className="view-mode-toggle">
          {["Month","Week","Day"].map((v,i)=>(
            <button key={v} onClick={()=>setMode(v)}
              className={`view-mode-toggle__btn ${mode===v?"view-mode-toggle__btn--active":"view-mode-toggle__btn--inactive"}`}
              style={{borderRight:i<2?"1px solid #e5e7eb":"none"}}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="legend">
        {Object.entries(SUB_COLORS).map(([sub,c])=>(
          <span key={sub} className="legend__chip" style={{background:c.bg,border:`1px solid ${c.bd}`,color:c.tx}}>{sub}</span>
        ))}
      </div>
      <div className="card" style={{overflow:"auto"}}>
        <div className="timetable-grid">
          <div className={`timetable-header-cell timetable-header-cell--time`}><span style={{fontSize:11,color:"#9aaa9a",fontWeight:600}}>Time</span></div>
          {DAYS.map((d,i)=>(
            <div key={d} className={`timetable-header-cell ${d==="Wed"?"timetable-header-cell--today":""}`}
              style={{borderRight:i<4?"1px solid #f0f4f0":"none"}}>
              <div className={`timetable-day-label ${d==="Wed"?"timetable-day-label--today":""}`}>{d}</div>
            </div>
          ))}
          {HOURS.map(h=>(
            <div key={h} style={{display:"contents"}}>
              <div className="timetable-time-cell">{fmtH(h)}</div>
              {DAYS.map((d,di)=>{
                const evs=evAt(di,h);
                return (
                  <div key={d} className={`timetable-slot ${d==="Wed"?"timetable-slot--today":""}`}
                    style={{borderRight:di<4?"1px solid #f0f4f0":"none"}}>
                    {evs.map((ev,ei)=>{const c=getC(ev.subject);return(
                      <div key={ei} className="timetable-event"
                        title={`${ev.subject} — ${ev.section} (${ev.adviser})`}
                        style={{background:c.bg,borderColor:c.bd,color:c.tx}}>
                        {ev.subject}
                      </div>
                    );})}
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
