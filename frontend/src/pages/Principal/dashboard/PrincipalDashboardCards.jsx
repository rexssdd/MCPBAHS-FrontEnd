/** Section cards and charts for the Principal dashboard. */
import {
  STATUS_COLOR,
  SEVERITY_COLOR,
  NOTIF_STYLE,
  EVENT_DOT,
  STRAND_COLORS,
  SIP_STATUS_COLOR,
  IPCRF_COLORS,
  BAR_MAX,
  fmt,
  fmtNum,
  fmtPct,
  pctColor,
  attColor,
} from "./principalDashboardTokens.js";
import { Card, STitle, Skel, StatCard, ProgressRow } from "./PrincipalDashboardPrimitives.jsx";

/* ══════════════════════════════════════════════════════════════
   GROUP A — SHARED SECTION COMPONENTS
   (identical visuals to Admin but skeleton-aware and null-safe)
══════════════════════════════════════════════════════════════ */

export const BarChart = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="📊">Learners by Grade Level</STitle>
    <div className="legend">
      {[["var(--brand-primary)", "Male"], ["var(--accent-gold)", "Female"]].map(([c, l]) => (
        <div key={l} className="legend-item">
          <span className="legend-dot" style={{ background: c }} />{l}
        </div>
      ))}
    </div>
    <div className="bar-chart-wrap mt-sm">
      <div className="bar-chart-axis">
        {["7k", "6k", "5k", "4k", "3k", "2k", "1k"].map(l => <span key={l}>{l}</span>)}
      </div>
      <div className="bar-chart-bars">
        {data.length === 0
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bar-chart-group">
                <div className="bar-chart-group__bars">
                  <div className="skeleton" style={{ width: 10, height: 60 + i * 10, borderRadius: "3px 3px 0 0" }} />
                  <div className="skeleton" style={{ width: 10, height: 50 + i * 8,  borderRadius: "3px 3px 0 0" }} />
                </div>
                <span className="bar-chart-group__label">G{7 + i}</span>
              </div>
            ))
          : data.map(({ grade, male, female }) => (
              <div key={grade} className="bar-chart-group">
                <div className="bar-chart-group__bars">
                  <div
                    className="bar-chart-group__bar"
                    style={{ height: (male / BAR_MAX) * 140, background: "var(--brand-primary)" }}
                    title={`Male: ${male.toLocaleString()}`}
                  />
                  <div
                    className="bar-chart-group__bar"
                    style={{ height: (female / BAR_MAX) * 140, background: "var(--accent-gold)" }}
                    title={`Female: ${female.toLocaleString()}`}
                  />
                </div>
                <span className="bar-chart-group__label">G{grade}</span>
              </div>
            ))
        }
      </div>
    </div>
  </Card>
);

export const NotificationsCard = ({ data }) => (
  <Card style={{ flex: 1, minWidth: 260 }}>
    <STitle icon="🔔">Alerts & Notifications</STitle>
    {data.length === 0
      ? Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="notif-item" style={{ background: "var(--n-100)", borderColor: "var(--n-200)" }}>
            <div className="skeleton" style={{ width: 12, height: 12, borderRadius: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 12, borderRadius: 4, marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 10, width: 60, borderRadius: 4 }} />
            </div>
          </div>
        ))
      : data.map((n, i) => {
          const s = NOTIF_STYLE[n.type] ?? NOTIF_STYLE.info;
          return (
            <div key={i} className="notif-item" style={{ background: s.bg, borderColor: s.border }}>
              <span className="notif-item__icon" style={{ color: s.color }}>{s.icon}</span>
              <div>
                <div className="notif-item__msg">{n.msg}</div>
                <div className="notif-item__time">{n.time}</div>
              </div>
            </div>
          );
        })
    }
  </Card>
);

export const EnrollmentTable = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="📋">Enrollment Status Overview</STitle>
    <table className="data-table">
      <thead>
        <tr>
          {["Grade", "Enrolled", "Capacity", "Fill Rate", "Status"].map(h => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0
          ? Array.from({ length: 6 }, (_, i) => (
              <tr key={i}>
                {Array.from({ length: 5 }, (__, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                ))}
              </tr>
            ))
          : data.map(row => {
              const pct      = Math.round((row.enrolled / row.capacity) * 100);
              const sc       = STATUS_COLOR[row.status] ?? STATUS_COLOR.Available;
              const barColor = pct >= 95 ? "#E53935" : pct >= 80 ? "#FFA726" : "#66BB6A";
              return (
                <tr key={row.grade}>
                  <td style={{ fontWeight: 700, color: "var(--n-900)" }}>Grade {row.grade}</td>
                  <td className="font-mono">{row.enrolled.toLocaleString()}</td>
                  <td className="font-mono" style={{ color: "var(--n-500)" }}>{row.capacity}</td>
                  <td style={{ width: 100 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div className="progress-track" style={{ flex: 1 }}>
                        <div
                          className="progress-fill progress-track--thin"
                          style={{ width: `${pct}%`, background: barColor, height: "100%" }}
                        />
                      </div>
                      <span
                        className="font-mono"
                        style={{ fontSize: 10.5, color: barColor, fontWeight: 700, width: 30 }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge--dot ${sc.badge}`}>{row.status}</span>
                  </td>
                </tr>
              );
            })
        }
      </tbody>
    </table>
  </Card>
);

export const AppStatusCard = ({ data }) => {
  const { total, enrolled, pending, cancelled } = data;
  const hasData = total > 0;
  return (
    <Card style={{ width: 280, flexShrink: 0 }}>
      <STitle icon="📌">Application Status</STitle>
      {!hasData
        ? Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton" style={{ height: i === 0 ? 10 : 36, borderRadius: 4, marginBottom: 8 }} />
          ))
        : (
            <>
              <div style={{ display: "flex", height: 10, borderRadius: "var(--r-sm)", overflow: "hidden", marginBottom: 6 }}>
                {[[enrolled, "var(--brand-primary)"], [pending, "var(--accent-gold)"], [cancelled, "var(--semantic-red)"]].map(([v, c], i) => (
                  <div key={i} style={{ width: `${(v / total) * 100}%`, background: c }} />
                ))}
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: "var(--n-400)", marginBottom: 16, fontFamily: "var(--font-mono)" }}>
                {total.toLocaleString()} total
              </div>
              {[["Enrolled", enrolled, "var(--brand-primary)"], ["Pending", pending, "var(--accent-gold)"], ["Cancelled", cancelled, "var(--semantic-red)"]].map(([l, v, c]) => (
                <div key={l} className="list-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="legend-dot" style={{ background: c }} />
                    <span className="list-row__name" style={{ fontWeight: 500 }}>{l}</span>
                  </div>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: 13 }}>{v.toLocaleString()}</span>
                </div>
              ))}
            </>
          )
      }
    </Card>
  );
};

export const CalendarCard = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="📅">Upcoming Events & Deadlines</STitle>
    {data.length === 0
      ? Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="cal-row">
            <div className="skeleton" style={{ width: 46, height: 52, borderRadius: 6 }} />
            <div className="skeleton" style={{ flex: 1, height: 14, borderRadius: 4 }} />
          </div>
        ))
      : data.map((ev, i) => {
          const [mon, day] = ev.date.split(" ");
          return (
            <div key={i} className="cal-row">
              <div className="cal-date">
                <div className="cal-date__month">{mon.toUpperCase()}</div>
                <div className="cal-date__day">{day}</div>
              </div>
              <div className="cal-row__label">{ev.label}</div>
              <span
                className="legend-dot"
                style={{ background: EVENT_DOT[ev.type] ?? "#999", width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }}
              />
            </div>
          );
        })
    }
    <div className="legend mt-sm">
      {[["#E53935", "Deadline"], ["#2E7D32", "Event"], ["#E65100", "Exam"]].map(([c, l]) => (
        <div key={l} className="legend-item">
          <span className="legend-dot" style={{ background: c }} />{l}
        </div>
      ))}
    </div>
  </Card>
);

export const RecentActivity = ({ data }) => (
  <Card style={{ width: 300, flexShrink: 0 }}>
    <STitle icon="🕐">Recent Enrollment Activity</STitle>
    {data.length === 0
      ? Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="list-row">
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 13, width: "70%", borderRadius: 4, marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 10, width: "45%", borderRadius: 4 }} />
            </div>
            <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 99 }} />
          </div>
        ))
      : data.map((r, i) => (
          <div key={i} className="list-row">
            <div>
              <div className="list-row__name">{r.name}</div>
              <div className="list-row__meta">Grade {r.grade} · {r.time}</div>
            </div>
            <span className={`badge ${r.action === "Enrolled" ? "badge--green" : "badge--amber"}`}>
              {r.action}
            </span>
          </div>
        ))
    }
  </Card>
);

export const AttendanceCard = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="✅">Attendance Rate by Grade</STitle>
    {data.length === 0
      ? Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div className="skeleton" style={{ width: 56, height: 12, borderRadius: 4, flexShrink: 0 }} />
            <div className="skeleton" style={{ flex: 1, height: 8, borderRadius: 99 }} />
            <div className="skeleton" style={{ width: 38, height: 12, borderRadius: 4 }} />
          </div>
        ))
      : data.map(({ grade, rate }) => (
          <ProgressRow key={grade} label={`Grade ${grade}`} pct={rate} color={attColor(rate)} right={`${rate}%`} />
        ))
    }
    <div className="legend mt-md">
      {[["#2E7D32", "≥93% Good"], ["#E65100", "88–92% Fair"], ["#C62828", "<88% At Risk"]].map(([c, l]) => (
        <div key={l} className="legend-item">
          <span className="legend-dot" style={{ background: c }} />{l}
        </div>
      ))}
    </div>
  </Card>
);

export const AtRiskCard = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="⚑">At-Risk Students</STitle>
    {data.length === 0
      ? Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="list-row">
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 13, width: "65%", borderRadius: 4, marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 10, width: "50%", borderRadius: 4 }} />
            </div>
            <div className="skeleton" style={{ height: 20, width: 40, borderRadius: 99 }} />
          </div>
        ))
      : data.map((s, i) => (
          <div key={i} className="list-row">
            <div>
              <div className="list-row__name">{s.name}</div>
              <div className="list-row__meta">Grade {s.grade} · {s.reason}</div>
            </div>
            <span className={`badge ${SEVERITY_COLOR[s.severity] ?? "badge--blue"}`}>{s.severity}</span>
          </div>
        ))
    }
    <button className="btn btn--outline btn--full mt-md">View All Interventions →</button>
  </Card>
);

export const StrandCard = ({ data }) => {
  const total = data.reduce((a, s) => a + s.count, 0);
  return (
    <Card style={{ flex: 1 }}>
      <STitle icon="🎓">SHS Strand Enrollment</STitle>
      {data.length === 0
        ? (
            <>
              <div className="skeleton" style={{ height: 14, borderRadius: 6, marginBottom: 14 }} />
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="list-row" style={{ padding: "8px 0" }}>
                  <div className="skeleton" style={{ height: 13, width: "50%", borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 13, width: 50, borderRadius: 4 }} />
                </div>
              ))}
            </>
          )
        : (
            <>
              <div className="strand-bar">
                {data.map((s, i) => (
                  <div
                    key={s.name}
                    className="strand-bar__seg"
                    style={{ width: `${(s.count / total) * 100}%`, background: STRAND_COLORS[i % STRAND_COLORS.length] }}
                    title={`${s.name}: ${s.count}`}
                  />
                ))}
              </div>
              {data.map((s, i) => (
                <div key={s.name} className="list-row" style={{ padding: "8px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="legend-square" style={{ background: STRAND_COLORS[i % STRAND_COLORS.length] }} />
                    <span className="list-row__name" style={{ fontWeight: 500 }}>{s.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="font-mono" style={{ fontWeight: 700, fontSize: 12.5 }}>{s.count.toLocaleString()}</span>
                    <span style={{ fontSize: 10, color: "var(--n-400)" }}>{Math.round((s.count / total) * 100)}%</span>
                  </div>
                </div>
              ))}
            </>
          )
      }
    </Card>
  );
};

export const TeacherCard = ({ data, stats }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="👩‍🏫">Teachers & Staff</STitle>
    <div className="mini-stats mb-md">
      {[[stats.teachingStaff, "Total"], [stats.teachingActive, "Active"], [stats.teachingLeave, "On Leave"]].map(([v, l]) => (
        <div key={l} className="mini-stat">
          <div className="mini-stat__value">{v == null ? <Skel w={32} /> : v}</div>
          <div className="mini-stat__label">{l}</div>
        </div>
      ))}
    </div>
    {data.length === 0
      ? Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="list-row">
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 13, width: "60%", borderRadius: 4, marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 10, width: "45%", borderRadius: 4 }} />
            </div>
            <div className="skeleton" style={{ height: 20, width: 50, borderRadius: 99 }} />
          </div>
        ))
      : data.map((t, i) => (
          <div key={i} className="list-row">
            <div>
              <div className="list-row__name">{t.name}</div>
              <div className="list-row__meta">{t.subject} · {t.load} sections</div>
            </div>
            <span className={`badge ${t.status === "Active" ? "badge--green" : "badge--amber"}`}>{t.status}</span>
          </div>
        ))
    }
  </Card>
);

export const TransfereeCard = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="🔄">Transferees & Returnees</STitle>
    <div className="mini-stats mb-md">
      {[
        [data.incoming,  "Incoming",  "var(--brand-primary)"],
        [data.outgoing,  "Outgoing",  "var(--semantic-red)"],
        [data.returnees, "Returnees", "var(--accent-gold)"],
      ].map(([v, l, c]) => (
        <div key={l} className="mini-stat" style={{ textAlign: "center" }}>
          <div className="mini-stat__value" style={{ color: c }}>
            {v == null ? <Skel w={28} /> : v}
          </div>
          <div className="mini-stat__label">{l}</div>
        </div>
      ))}
    </div>
    <STitle>Demographics</STitle>
    {data.demographics.length === 0
      ? Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="list-row" style={{ padding: "8px 0" }}>
            <div className="skeleton" style={{ height: 13, width: "55%", borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 13, width: 40, borderRadius: 4 }} />
          </div>
        ))
      : data.demographics.map(({ label, pct }) => (
          <div key={label} className="list-row" style={{ padding: "8px 0" }}>
            <span className="list-row__name" style={{ fontWeight: 500 }}>{label}</span>
            <span style={{ fontWeight: 700, color: "var(--brand-primary)", fontSize: 12.5 }}>{pct}</span>
          </div>
        ))
    }
  </Card>
);

export const FeeCard = ({ data }) => {
  const tc  = data.reduce((a, r) => a + r.collected, 0);
  const tb  = data.reduce((a, r) => a + r.total, 0);
  const pct = tb > 0 ? Math.round((tc / tb) * 100) : 0;
  return (
    <Card style={{ flex: 1 }}>
      <STitle icon="💰">Fees & Payment Collection</STitle>
      {data.length === 0
        ? (
            <>
              <div className="skeleton" style={{ height: 28, width: 140, borderRadius: 4, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 12, borderRadius: 99, marginBottom: 16 }} />
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div className="skeleton" style={{ width: 56, height: 12, borderRadius: 4, flexShrink: 0 }} />
                  <div className="skeleton" style={{ flex: 1, height: 8, borderRadius: 99 }} />
                  <div className="skeleton" style={{ width: 38, height: 12, borderRadius: 4 }} />
                </div>
              ))}
            </>
          )
        : (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "var(--n-900)", lineHeight: 1 }}>{fmt(tc)}</span>
                <span style={{ fontSize: 12, color: "var(--n-400)", marginBottom: 3 }}>of {fmt(tb)}</span>
              </div>
              <div className="progress-track progress-track--thick" style={{ marginBottom: 16 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: "var(--brand-primary)", height: "100%" }} />
              </div>
              {data.map(({ grade, collected, total }) => {
                const p = Math.round((collected / total) * 100);
                return <ProgressRow key={grade} label={`Grade ${grade}`} pct={p} color={pctColor(p)} right={`${p}%`} />;
              })}
            </>
          )
      }
    </Card>
  );
};

export const ReportsCard = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="📄">DepEd Reports & Exports</STitle>
    {data.length === 0
      ? Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="report-row">
            <div className="skeleton" style={{ height: 14, width: "60%", borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 24, width: 70, borderRadius: 99 }} />
          </div>
        ))
      : data.map(({ label, status }) => {
          const color = status === "Pending" ? "var(--semantic-amber)" : "var(--brand-primary)";
          return (
            <div key={label} className="report-row">
              <span className="report-row__name">{label}</span>
              <button className="report-btn" style={{ color }}>{status}</button>
            </div>
          );
        })
    }
  </Card>
);

/* ══════════════════════════════════════════════════════════════
   GROUP B — PRINCIPAL-EXCLUSIVE EXECUTIVE COMPONENTS
   Each component documents which endpoint feeds it.
══════════════════════════════════════════════════════════════ */

/**
 * ExecutiveSummaryCard
 * Primary:  d.executiveSummary  → GET /dashboard/executive-summary?role=principal
 * Fallback: derives values from Group A stats/feeData/attendanceData when the
 *           dedicated endpoint hasn't responded yet (partial-data resilience).
 */
export const ExecutiveSummaryCard = ({ executiveSummary, stats, feeData, attendanceData }) => {
  const ex = executiveSummary ?? {};

  const collectionRate = ex.collectionRate
    ?? (feeData.length > 0
      ? Math.round(
          (feeData.reduce((a, r) => a + r.collected, 0) /
           feeData.reduce((a, r) => a + r.total, 0)) * 100,
        )
      : null);

  const avgAttendance = ex.avgAttendance
    ?? (attendanceData.length > 0
      ? Math.round(attendanceData.reduce((a, r) => a + r.rate, 0) / attendanceData.length)
      : null);

  const completion = ex.completionRate ?? stats.completionRate;
  const gpa        = ex.avgGpa         ?? stats.avgGpa;
  const passRate   = ex.passRate       ?? stats.passRate;
  const atRisk     = ex.atRiskCount    ?? stats.atRiskCount;

  const indicators = [
    {
      label: "Enrollment Completion",
      value: fmtPct(completion),
      color: pctColor(completion),
      icon: "🏫",
    },
    {
      label: "Average GPA",
      value: gpa ?? "—",
      color: gpa == null ? "var(--n-400)" : gpa >= 85 ? "#2E7D32" : gpa >= 75 ? "#E65100" : "#C62828",
      icon: "📈",
    },
    {
      label: "Pass Rate",
      value: fmtPct(passRate),
      color: pctColor(passRate),
      icon: "✅",
    },
    {
      label: "Avg. Attendance",
      value: fmtPct(avgAttendance),
      color: attColor(avgAttendance),
      icon: "📅",
    },
    {
      label: "Fee Collection Rate",
      value: fmtPct(collectionRate),
      color: pctColor(collectionRate),
      icon: "💰",
    },
    {
      label: "At-Risk Students",
      value: fmtNum(atRisk),
      color: atRisk == null ? "var(--n-400)" : atRisk === 0 ? "#2E7D32" : atRisk <= 10 ? "#E65100" : "#C62828",
      icon: "⚑",
    },
  ];

  return (
    <Card style={{ width: "100%" }}>
      <STitle icon="🏛">Executive Summary — School Performance Indicators</STitle>
      <div className="exec-grid">
        {indicators.map(({ label, value, color, icon }) => (
          <div key={label} className="exec-kpi">
            <div className="exec-kpi__icon">{icon}</div>
            <div className="exec-kpi__value" style={{ color }}>
              {value === "—" ? <Skel w={48} /> : value}
            </div>
            <div className="exec-kpi__label">{label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/**
 * SchoolHealthCard
 * Primary:  d.schoolHealth  → GET /dashboard/school-health?role=principal
 *           Returns composite 0–100 scores per domain.
 * Fallback: derives from Group A when endpoint hasn't responded.
 */
export const SchoolHealthCard = ({ schoolHealth, stats, attendanceData, feeData }) => {
  const sh = schoolHealth ?? {};

  const avgAtt = attendanceData.length > 0
    ? attendanceData.reduce((a, r) => a + r.rate, 0) / attendanceData.length
    : 0;
  const collRate = feeData.length > 0
    ? (feeData.reduce((a, r) => a + r.collected, 0) /
       feeData.reduce((a, r) => a + r.total, 0)) * 100
    : 0;

  const metrics = [
    { label: "Academic Performance", pct: sh.academic   ?? stats.passRate     ?? 0, color: pctColor(sh.academic   ?? stats.passRate) },
    { label: "Attendance",           pct: sh.attendance ?? avgAtt,                   color: attColor(Math.round(sh.attendance ?? avgAtt)) },
    { label: "Enrollment Rate",      pct: sh.enrollment ?? stats.completionRate ?? 0, color: pctColor(sh.enrollment ?? stats.completionRate) },
    { label: "Fee Collection",       pct: sh.collection ?? collRate,                 color: pctColor(Math.round(sh.collection ?? collRate)) },
  ];

  return (
    <Card style={{ flex: 1 }}>
      <STitle icon="🩺">School Health Overview</STitle>
      {metrics.map(({ label, pct, color }) => (
        <div key={label} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "var(--n-700)", fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>
              {pct > 0 ? `${Math.round(pct)}%` : <Skel w={36} />}
            </span>
          </div>
          <div className="progress-track progress-track--thick">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(pct, 100)}%`, background: color, height: "100%" }}
            />
          </div>
        </div>
      ))}
    </Card>
  );
};

/**
 * QuarterlyReportCard
 * Data source: d.quarterlyReport → GET /reports/quarterly-summary?role=principal
 */
export const QuarterlyReportCard = ({ data }) => {
  const isLoading = data == null;
  const qr = data ?? {};

  const rows = [
    ["Total Students",      qr.totalStudents],
    ["Promoted",            qr.promoted],
    ["Retained",            qr.retained],
    ["Dropped",             qr.dropped],
    ["Honor Roll",          qr.honorRoll],
    ["Perfect Attendance",  qr.perfectAttendance],
  ];

  return (
    <Card style={{ flex: 1 }}>
      <STitle icon="📊">Quarterly Report Summary</STitle>

      <div style={{ fontSize: 11, color: "var(--n-500)", marginBottom: 12, fontFamily: "var(--font-mono)" }}>
        {isLoading
          ? <Skel w={160} />
          : qr.quarter
            ? (
                <>
                  {qr.quarter} · SY {qr.schoolYear}
                  {qr.generatedAt && (
                    <span style={{ marginLeft: 8, color: "var(--n-400)" }}>
                      Generated {new Date(qr.generatedAt).toLocaleDateString("en-PH")}
                    </span>
                  )}
                </>
              )
            : "Awaiting data…"
        }
      </div>

      {rows.map(([label, value]) => (
        <div key={label} className="list-row">
          <span className="list-row__name" style={{ fontWeight: 500 }}>{label}</span>
          <span className="font-mono" style={{ fontWeight: 700, fontSize: 13, color: "var(--n-900)" }}>
            {isLoading || value == null ? <Skel w={48} /> : value.toLocaleString()}
          </span>
        </div>
      ))}
    </Card>
  );
};

/**
 * StaffPerformanceCard
 * Data source: d.staffPerformance → GET /reports/staff-performance?role=principal
 * Renders IPCRF rating breakdown with stacked bar + per-rating list.
 */
export const StaffPerformanceCard = ({ data }) => {
  const isLoading = data == null;
  const sp = data ?? {};

  const ratings = [
    ["Outstanding",        sp.outstanding,      IPCRF_COLORS.outstanding],
    ["Very Satisfactory",  sp.verySatisfactory, IPCRF_COLORS.verySatisfactory],
    ["Satisfactory",       sp.satisfactory,     IPCRF_COLORS.satisfactory],
    ["Unsatisfactory",     sp.unsatisfactory,   IPCRF_COLORS.unsatisfactory],
    ["Needs Improvement",  sp.needsImprovement, IPCRF_COLORS.needsImprovement],
  ];

  const total = ratings.reduce((a, [, v]) => a + (v ?? 0), 0) || 1;

  return (
    <Card style={{ flex: 1 }}>
      <STitle icon="📋">Staff Performance (IPCRF)</STitle>

      {/* Summary mini-stats */}
      <div className="mini-stats mb-md">
        {[
          [sp.totalTeachers, "Total"],
          [sp.rated,         "Rated"],
          [sp.avgRating,     "Avg Score"],
        ].map(([v, l]) => (
          <div key={l} className="mini-stat">
            <div className="mini-stat__value">
              {isLoading || v == null
                ? <Skel w={32} />
                : typeof v === "number" && !Number.isInteger(v) ? v.toFixed(2) : v
              }
            </div>
            <div className="mini-stat__label">{l}</div>
          </div>
        ))}
      </div>

      {/* Stacked proportion bar */}
      <div className="strand-bar" style={{ marginBottom: 14 }}>
        {ratings.map(([label, value, color]) => (
          <div
            key={label}
            className="strand-bar__seg"
            style={{ width: `${((value ?? 0) / total) * 100}%`, background: color }}
            title={`${label}: ${value ?? 0}`}
          />
        ))}
      </div>

      {/* Rating breakdown rows */}
      {ratings.map(([label, value, color]) => (
        <div key={label} className="list-row" style={{ padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="legend-square" style={{ background: color }} />
            <span className="list-row__name" style={{ fontWeight: 500 }}>{label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="font-mono" style={{ fontWeight: 700, fontSize: 12.5 }}>
              {isLoading || value == null ? <Skel w={24} /> : value}
            </span>
            {!isLoading && value != null && (
              <span style={{ fontSize: 10, color: "var(--n-400)" }}>
                {Math.round((value / total) * 100)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
};

/**
 * SIPProgressCard
 * Data source: d.sipProgress → GET /dashboard/sip-progress?role=principal
 * School Improvement Plan objective tracker with per-objective progress bars.
 */
export const SIPProgressCard = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="🎯">School Improvement Plan Progress</STitle>
    {data.length === 0
      ? Array.from({ length: 4 }, (_, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div className="skeleton" style={{ height: 13, width: "60%", borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 20, width: 72, borderRadius: 99 }} />
            </div>
            <div className="skeleton" style={{ height: 8, borderRadius: 99 }} />
          </div>
        ))
      : data.map((item, i) => {
          const pct = item.target > 0
            ? Math.min(Math.round((item.current / item.target) * 100), 100)
            : 0;
          const barColor =
            item.status === "Completed"   ? "#1B5E20"
            : item.status === "On Track"  ? "#43A047"
            : item.status === "At Risk"   ? "#E53935"
            : "var(--n-300)";

          return (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
                <span style={{ fontSize: 12.5, color: "var(--n-800)", fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
                  {item.objective}
                </span>
                <span className={`badge ${SIP_STATUS_COLOR[item.status] ?? "badge--gray"}`} style={{ flexShrink: 0 }}>
                  {item.status}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="progress-track" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: barColor, height: "100%" }} />
                </div>
                <span
                  className="font-mono"
                  style={{ fontSize: 11, fontWeight: 700, color: barColor, width: 48, textAlign: "right" }}
                >
                  {item.current}/{item.target}
                </span>
              </div>
            </div>
          );
        })
    }
  </Card>
);