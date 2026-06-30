import {
  attendanceColor,
  remarksColor,
  notifColor,
  eventColor,
} from "./teacherDashboardTokens.js";
import {
  Card,
  SectionTitle,
  Divider,
  Skel,
  StatCard,
} from "./TeacherDashboardPrimitives.jsx";
import { toText } from "../../../utils/safeRender.js";

/* ══════════════════════════════════════════════════════════
   ATTENDANCE CARD
══════════════════════════════════════════════════════════ */
export const AttendanceCard = ({ data, onViewAll, loading }) => {
  const present = data.filter(s => s.status==="Present").length;
  const late    = data.filter(s => s.status==="Late").length;
  const absent  = data.filter(s => s.status==="Absent").length;
  const total   = data.length;

  return (
    <Card style={{ flex:1 }} testId="attendance-card">
      <SectionTitle action="View All" onAction={onViewAll}>Today's Attendance</SectionTitle>
      {loading
        ? Array.from({ length:5 }).map((_,i) => <Skel key={i} h={44} mb={8} r={8}/>)
        : <>
            <div style={{ display:"flex", gap:10, marginBottom:16 }}>
              {[
                ["Present", present, "#15803d","#f0fdf4","#bbf7d0"],
                ["Late",    late,    "#a16207","#fefce8","#fde68a"],
                ["Absent",  absent,  "#b91c1c","#fef2f2","#fecaca"],
                ["Total",   total,   "#111f11","#f4f6f4","#e8ede8"],
              ].map(([l,v,c,bg,bdr]) => (
                <div key={l} style={{ flex:1, background:bg, border:`1.5px solid ${bdr}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:24, fontWeight:800, color:c, lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:10, color:c, fontWeight:600, marginTop:2, opacity:0.8 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {data.slice(0,6).map((s,i) => {
                const ac = attendanceColor[s.status];
                return (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0",
                    borderBottom:i<5?"1px solid #f4f6f4":"none" }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:"#f0fdf4", border:"1.5px solid #bbf7d0",
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:10, fontWeight:800, color:"#1a5c1a" }}>
                      {toText(s.name).charAt(0)}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12.5, fontWeight:700, color:"#111f11" }}>{toText(s.name)}</div>
                      <div style={{ fontSize:10, color:"#9aaa9a" }}>{s.id}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2, flexShrink:0 }}>
                      <span className="badge" style={{ color:ac.color, background:ac.bg, border:`1px solid ${ac.border}` }}>{toText(s.status)}</span>
                      <span style={{ fontSize:10, color:"#9aaa9a" }}>{s.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={onViewAll} style={{ marginTop:12, width:"100%", padding:"9px",
              border:"1.5px solid #1a5c1a", borderRadius:8, background:"transparent",
              color:"#1a5c1a", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              View Full Attendance →
            </button>
          </>
      }
    </Card>
  );
};

/* ══════════════════════════════════════════════════════════
   GRADEBOOK CARD
══════════════════════════════════════════════════════════ */
export const GradeBookCard = ({ data, onViewAll, loading }) => {
  const avg     = (data.reduce((a,s) => a+s.avg, 0) / data.length).toFixed(1);
  const passing = data.filter(s => s.avg >= 75).length;

  return (
    <Card style={{ flex:1 }} testId="gradebook-card">
      <SectionTitle action="View All" onAction={onViewAll}>Grade Book — Q3</SectionTitle>
      {loading
        ? Array.from({ length:5 }).map((_,i) => <Skel key={i} h={36} mb={8}/>)
        : <>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16, padding:"12px 14px",
              background:"#f9fbf9", borderRadius:10, border:"1px solid #e8ede8" }}>
              <div>
                <div style={{ fontSize:28, fontWeight:800, color:"#1a5c1a", lineHeight:1 }}>{avg}</div>
                <div style={{ fontSize:11, color:"#6b7c6b", marginTop:2 }}>Class average</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", height:8, borderRadius:6, overflow:"hidden", gap:2 }}>
                  <div style={{ width:`${(passing/data.length)*100}%`, background:"#1a5c1a", borderRadius:3 }}/>
                  <div style={{ flex:1, background:"#ef4444", borderRadius:3 }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:"#15803d" }}>{passing} passing</span>
                  <span style={{ fontSize:10, fontWeight:700, color:"#b91c1c" }}>{data.length-passing} failing</span>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {data.slice(0,6).map((s,i) => {
                const rc  = remarksColor[s.remarks] || remarksColor.Passed;
                const pct = Math.min(100, s.avg);
                return (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0",
                    borderBottom:i<5?"1px solid #f4f6f4":"none" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontSize:12.5, fontWeight:700, color:"#111f11" }}>{toText(s.name)}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:s.avg<75?"#b91c1c":s.avg>=90?"#15803d":"#111f11" }}>
                          {s.avg.toFixed(1)}
                        </span>
                      </div>
                      <div className="progress-track" style={{ height:5 }}>
                        <div className="progress-fill" style={{ width:`${pct}%`, background:s.avg<75?"#ef4444":s.avg>=90?"#1a5c1a":"#eab308" }}/>
                      </div>
                    </div>
                    <span className="badge" style={{ color:rc.color, background:rc.bg, marginLeft:4 }}>{s.remarks}</span>
                  </div>
                );
              })}
            </div>
          </>
      }
    </Card>
  );
};

/* ══════════════════════════════════════════════════════════
   LOW PERFORMERS CARD
══════════════════════════════════════════════════════════ */
export const LowPerformersCard = ({ data, onViewAll, loading }) => (
  <Card style={{ flex:1 }} testId="low-performers-card">
    <SectionTitle action="View All" onAction={onViewAll}>Students Needing Attention</SectionTitle>
    {loading
      ? Array.from({ length:3 }).map((_,i) => <Skel key={i} h={64} mb={8} r={10}/>)
      : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {data.map((s,i) => (
            <div key={i} style={{ padding:"12px 14px", background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:12 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontWeight:700, fontSize:12.5, color:"#111f11" }}>{toText(s.name)}</span>
                <span style={{ fontWeight:800, fontSize:16, color:s.avg<60?"#b91c1c":"#a16207" }}>{s.avg.toFixed(1)}</span>
              </div>
              <div style={{ fontSize:10, color:"#9aaa9a", marginBottom:5 }}>{s.absences} absences · Grade {s.grade}</div>
              <div style={{ fontSize:10, fontWeight:600, color:"#b91c1c" }}>{s.concern}</div>
            </div>
          ))}
          <button onClick={onViewAll} style={{ width:"100%", padding:"8px", border:"1.5px solid #b91c1c",
            borderRadius:8, background:"transparent", color:"#b91c1c", fontSize:12,
            fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            View All & Log Intervention →
          </button>
        </div>
    }
  </Card>
);

/* ══════════════════════════════════════════════════════════
   CLASS SUMMARY CARD
══════════════════════════════════════════════════════════ */
export const ClassSummaryCard = ({ stats, grades, loading }) => {
  const passing = grades.filter(s => s.avg >= 75).length;
  const honors  = grades.filter(s => s.avg >= 90).length;
  const atRisk  = grades.filter(s => s.avg <  75).length;

  return (
    <Card style={{ width:260, flexShrink:0 }} testId="class-summary-card">
      <SectionTitle>Class Summary</SectionTitle>
      {loading ? <Skel h={200} r={10}/> : (
        <>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:32, fontWeight:800, color:"#111f11", lineHeight:1 }}>{stats.totalStudents}</div>
            <div style={{ fontSize:11, color:"#6b7c6b", marginTop:2 }}>Total students enrolled</div>
            <div style={{ display:"flex", height:8, borderRadius:6, overflow:"hidden", marginTop:10, gap:2 }}>
              <div style={{ width:`${(passing/stats.totalStudents)*100}%`, background:"#1a5c1a", borderRadius:3 }}/>
              <div style={{ flex:1, background:"#ef4444", borderRadius:3 }}/>
            </div>
          </div>
          <Divider />
          {[
            ["Present Today",   stats.presentToday,   "#15803d"],
            ["Class Average",   stats.classAverage,   "#1a5c1a"],
            ["With Honors",     honors,               "#1d4ed8"],
            ["Passed Q3",       passing,              "#15803d"],
            ["At Risk",         atRisk,               "#b91c1c"],
          ].map(([l,v,c]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"8px 0", borderBottom:"1px solid #f4f6f4" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:c, flexShrink:0 }}/>
                <span style={{ fontSize:12.5, color:"#1a3a1a" }}>{l}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:"#111f11" }}>{v}</span>
            </div>
          ))}
        </>
      )}
    </Card>
  );
};

/* ══════════════════════════════════════════════════════════
   SCHEDULE CARD
══════════════════════════════════════════════════════════ */
export const ScheduleCard = ({ data, loading }) => (
  <Card style={{ flex:1 }} testId="schedule-card">
    <SectionTitle>Today's Class Schedule</SectionTitle>
    {loading
      ? Array.from({ length:5 }).map((_,i) => <Skel key={i} h={44} mb={8} r={8}/>)
      : <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {data.map((p,i) => {
            const isBreak = p.subject === "—";
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0",
                borderBottom:i<data.length-1?"1px solid #f4f6f4":"none", opacity:isBreak?0.5:1 }}>
                <div style={{ width:80, flexShrink:0 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"#9aaa9a", textTransform:"uppercase" }}>{p.period}</div>
                  <div style={{ fontSize:10, fontWeight:600, color:"#4a5e4a" }}>{p.time}</div>
                </div>
                {!isBreak
                  ? <>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12.5, fontWeight:700, color:"#111f11" }}>{toText(p.subject)}</div>
                        <div style={{ fontSize:10, color:"#9aaa9a" }}>{p.section} · {p.room}</div>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, color:"#1a5c1a", background:"#f0fdf4",
                        padding:"3px 8px", borderRadius:20, border:"1px solid #bbf7d0" }}>{p.room}</span>
                    </>
                  : <div style={{ flex:1, fontSize:11, color:"#9aaa9a", fontStyle:"italic" }}>Break</div>
                }
              </div>
            );
          })}
        </div>
    }
  </Card>
);

/* ══════════════════════════════════════════════════════════
   SUBJECT PERFORMANCE CARD
══════════════════════════════════════════════════════════ */
export const SubjectPerformanceCard = ({ data, loading }) => (
  <Card style={{ flex:1 }} testId="subject-performance-card">
    <SectionTitle>Topic Performance</SectionTitle>
    {loading
      ? Array.from({ length:5 }).map((_,i) => <Skel key={i} h={40} mb={10}/>)
      : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {data.map(({ subject, avgScore, passRate }) => {
            const color = avgScore>=85?"#15803d":avgScore>=75?"#d97706":"#dc2626";
            return (
              <div key={subject}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:"#1a3a1a", fontWeight:500 }}>{subject}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, color }}>{avgScore}% avg</span>
                    <span style={{ fontSize:10, color:"#9aaa9a" }}>{passRate}% pass</span>
                  </div>
                </div>
                <div className="progress-track" style={{ height:7 }}>
                  <div className="progress-fill" style={{ width:`${avgScore}%`, background:color }}/>
                </div>
              </div>
            );
          })}
        </div>
    }
  </Card>
);

/* ══════════════════════════════════════════════════════════
   RECENT ACTIVITY CARD
══════════════════════════════════════════════════════════ */
export const RecentActivityCard = ({ data, loading }) => {
  const actionColors = {
    "Grade Updated": { bg:"#f0fdf4", color:"#15803d" },
    "Absent Marked": { bg:"#fef2f2", color:"#b91c1c" },
    "Late":          { bg:"#fefce8", color:"#a16207" },
    "Intervention":  { bg:"#eff6ff", color:"#1d4ed8" },
  };
  return (
    <Card style={{ width:290, flexShrink:0 }} testId="recent-activity-card">
      <SectionTitle>Recent Activity</SectionTitle>
      {loading
        ? Array.from({ length:5 }).map((_,i) => <Skel key={i} h={44} mb={6} r={8}/>)
        : <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {data.map((r,i) => {
              const ac = actionColors[r.action] || { bg:"#f4f6f4", color:"#6b7c6b" };
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0",
                  borderBottom:i<data.length-1?"1px solid #f4f6f4":"none" }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:"#f0fdf4", border:"1.5px solid #bbf7d0",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:10, fontWeight:800, color:"#1a5c1a" }}>
                    {toText(r.name).charAt(0)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#111f11", whiteSpace:"nowrap",
                      overflow:"hidden", textOverflow:"ellipsis" }}>{toText(r.name)}</div>
                    <div style={{ fontSize:10, color:"#9aaa9a" }}>{r.detail} · {r.time}</div>
                  </div>
                  <span className="badge" style={{ color:ac.color, background:ac.bg }}>{r.action}</span>
                </div>
              );
            })}
          </div>
      }
    </Card>
  );
};

/* ══════════════════════════════════════════════════════════
   CALENDAR CARD
══════════════════════════════════════════════════════════ */
export const CalendarCard = ({ data, loading }) => (
  <Card style={{ flex:1 }} testId="calendar-card">
    <SectionTitle>Upcoming Deadlines & Events</SectionTitle>
    {loading
      ? Array.from({ length:5 }).map((_,i) => <Skel key={i} h={50} mb={8} r={8}/>)
      : <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {data.map((ev,i) => {
            const [mon, day] = ev.date.split(" ");
            const color = eventColor[ev.type] || "#6b7c6b";
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0",
                borderBottom:i<data.length-1?"1px solid #f4f6f4":"none" }}>
                <div style={{ width:44, textAlign:"center", background:"#f4f6f4", borderRadius:8,
                  padding:"6px 4px", flexShrink:0, borderLeft:`3px solid ${color}` }}>
                  <div style={{ fontSize:9, color:"#6b7c6b", fontWeight:700, textTransform:"uppercase" }}>{mon}</div>
                  <div style={{ fontSize:17, fontWeight:800, color:"#111f11", lineHeight:1 }}>{day}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12.5, color:"#1a3a1a", fontWeight:500, lineHeight:1.3 }}>{toText(ev.label)}</div>
                  <div style={{ fontSize:10, color, fontWeight:700, marginTop:2, textTransform:"uppercase" }}>{toText(ev.type)}</div>
                </div>
              </div>
            );
          })}
        </div>
    }
  </Card>
);

/* ══════════════════════════════════════════════════════════
   NOTIFICATIONS CARD
══════════════════════════════════════════════════════════ */
export const NotificationsCard = ({ data, loading }) => (
  <Card style={{ width:290, flexShrink:0 }} testId="notifications-card">
    <SectionTitle>Alerts</SectionTitle>
    {loading
      ? Array.from({ length:4 }).map((_,i) => <Skel key={i} h={60} mb={8} r={10}/>)
      : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {data.map((n,i) => {
            const nc = notifColor[n.type] || notifColor.info;
            return (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, background:nc.bg,
                border:`1px solid ${nc.border}`, borderRadius:10, padding:"10px 12px" }}>
                <span style={{ fontSize:12, color:nc.color, flexShrink:0, fontWeight:800, width:18, textAlign:"center" }}>
                  {nc.icon}
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:"#1a3a1a", lineHeight:1.4 }}>{toText(n.msg)}</div>
                  <div style={{ fontSize:10, color:"#9aaa9a", marginTop:2 }}>{n.time}</div>
                </div>
              </div>
            );
          })}
        </div>
    }
  </Card>
);

/* ══════════════════════════════════════════════════════════
   QUICK ACTIONS CARD
══════════════════════════════════════════════════════════ */
export const QuickActionsCard = ({ onViewGrades, onViewAttendance, onViewLowPerformers }) => (
  <Card style={{ flex:1 }} testId="quick-actions-card">
    <SectionTitle>Quick Actions</SectionTitle>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
      {[
        ["📝","Enter Grades",       "#1a5c1a","#f0fdf4","#bbf7d0", onViewGrades],
        ["📋","Take Attendance",    "#1d4ed8","#eff6ff","#93c5fd", onViewAttendance],
        ["📤","Print Report Card",  "#7c3aed","#f5f3ff","#c4b5fd", null],
        ["🔍","Student Record",     "#0891b2","#f0f9ff","#7dd3fc", null],
        ["🚨","Flag At-Risk",       "#d97706","#fefce8","#fde68a", onViewLowPerformers],
        ["📬","Message Parent",     "#15803d","#f0fdf4","#86efac", null],
      ].map(([icon,label,color,bg,border,handler]) => (
        <button
          key={label}
          onClick={handler}
          className="quick-action-btn"
          style={{ background:bg, border:`1.5px solid ${border}` }}
        >
          <span className="quick-action-icon">{icon}</span>
          <span className="quick-action-label" style={{ color }}>{label}</span>
        </button>
      ))}
    </div>
  </Card>
);
