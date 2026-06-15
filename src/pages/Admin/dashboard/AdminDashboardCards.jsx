import {
  STATUS_COLOR,
  NOTIF_STYLE,
  EVENT_DOT,
  STRAND_COLORS,
  BAR_MAX,
  fmt,
  pctColor,
  attColor,
  SEVERITY_COLOR,
} from "./adminDashboardTokens.js";
import { Card, STitle, ProgressRow } from "./AdminDashboardPrimitives.jsx";

export const BarChart = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="📊">Learners by Grade Level</STitle>
    <div className="legend">
      {[
        ["var(--brand-primary)", "Male"],
        ["var(--accent-gold)", "Female"],
      ].map(([c, l]) => (
        <div key={l} className="legend-item">
          <span className="legend-dot" style={{ background: c }} />
          {l}
        </div>
      ))}
    </div>
    <div className="bar-chart-wrap mt-sm">
      <div className="bar-chart-axis">
        {["7k", "6k", "5k", "4k", "3k", "2k", "1k"].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <div className="bar-chart-bars">
        {data.map(({ grade, male, female }) => {
          const mH = (male / BAR_MAX) * 140;
          const fH = (female / BAR_MAX) * 140;
          return (
            <div key={grade} className="bar-chart-group">
              <div className="bar-chart-group__bars">
                <div
                  className="bar-chart-group__bar"
                  style={{ height: mH, background: "var(--brand-primary)" }}
                  title={`Male: ${male.toLocaleString()}`}
                />
                <div
                  className="bar-chart-group__bar"
                  style={{ height: fH, background: "var(--accent-gold)" }}
                  title={`Female: ${female.toLocaleString()}`}
                />
              </div>
              <span className="bar-chart-group__label">G{grade}</span>
            </div>
          );
        })}
      </div>
    </div>
  </Card>
);

export const NotificationsCard = ({ data }) => (
  <Card style={{ flex: 1, minWidth: 260 }}>
    <STitle icon="🔔">Alerts & Notifications</STitle>
    {data.map((n, i) => {
      const s = NOTIF_STYLE[n.type] ?? NOTIF_STYLE.info;
      return (
        <div key={i} className="notif-item" style={{ background: s.bg, borderColor: s.border }}>
          <span className="notif-item__icon" style={{ color: s.color }}>
            {s.icon}
          </span>
          <div>
            <div className="notif-item__msg">{n.msg}</div>
            <div className="notif-item__time">{n.time}</div>
          </div>
        </div>
      );
    })}
  </Card>
);

export const EnrollmentTable = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="📋">Enrollment Status Overview</STitle>
    <table className="data-table">
      <thead>
        <tr>
          {["Grade", "Enrolled", "Capacity", "Fill Rate", "Status"].map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => {
          const pct = Math.round((row.enrolled / row.capacity) * 100);
          const sc = STATUS_COLOR[row.status] ?? STATUS_COLOR.Available;
          const barColor = pct >= 95 ? "#E53935" : pct >= 80 ? "#FFA726" : "#66BB6A";
          return (
            <tr key={row.grade}>
              <td style={{ fontWeight: 700, color: "var(--n-900)" }}>Grade {row.grade}</td>
              <td className="font-mono">{row.enrolled.toLocaleString()}</td>
              <td className="font-mono" style={{ color: "var(--n-500)" }}>
                {row.capacity}
              </td>
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
        })}
      </tbody>
    </table>
  </Card>
);

export const AppStatusCard = ({ data }) => {
  const { total, enrolled, pending, cancelled } = data;
  return (
    <Card style={{ width: 280, flexShrink: 0 }}>
      <STitle icon="📌">Application Status</STitle>
      <div
        style={{
          display: "flex",
          height: 10,
          borderRadius: "var(--r-sm)",
          overflow: "hidden",
          marginBottom: 6,
        }}
      >
        {[
          [enrolled, "var(--brand-primary)"],
          [pending, "var(--accent-gold)"],
          [cancelled, "var(--semantic-red)"],
        ].map(([v, c], i) => (
          <div key={i} style={{ width: `${(v / total) * 100}%`, background: c }} />
        ))}
      </div>
      <div
        style={{
          textAlign: "right",
          fontSize: 11,
          color: "var(--n-400)",
          marginBottom: 16,
          fontFamily: "var(--font-mono)",
        }}
      >
        {total.toLocaleString()} total
      </div>
      {[
        ["Enrolled", enrolled, "var(--brand-primary)"],
        ["Pending", pending, "var(--accent-gold)"],
        ["Cancelled", cancelled, "var(--semantic-red)"],
      ].map(([l, v, c]) => (
        <div key={l} className="list-row">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="legend-dot" style={{ background: c }} />
            <span className="list-row__name" style={{ fontWeight: 500 }}>
              {l}
            </span>
          </div>
          <span className="font-mono" style={{ fontWeight: 700, fontSize: 13 }}>
            {v.toLocaleString()}
          </span>
        </div>
      ))}
    </Card>
  );
};

export const CalendarCard = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="📅">Upcoming Events & Deadlines</STitle>
    {data.map((ev, i) => {
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
            style={{
              background: EVENT_DOT[ev.type] ?? "#999",
              width: 8,
              height: 8,
              borderRadius: "50%",
              flexShrink: 0,
            }}
          />
        </div>
      );
    })}
    <div className="legend mt-sm">
      {[
        ["#E53935", "Deadline"],
        ["#2E7D32", "Event"],
        ["#E65100", "Exam"],
      ].map(([c, l]) => (
        <div key={l} className="legend-item">
          <span className="legend-dot" style={{ background: c }} />
          {l}
        </div>
      ))}
    </div>
  </Card>
);

export const RecentActivity = ({ data }) => (
  <Card style={{ width: 300, flexShrink: 0 }}>
    <STitle icon="🕐">Recent Enrollment Activity</STitle>
    {data.map((r, i) => (
      <div key={i} className="list-row">
        <div>
          <div className="list-row__name">{r.name}</div>
          <div className="list-row__meta">
            Grade {r.grade} · {r.time}
          </div>
        </div>
        <span className={`badge ${r.action === "Enrolled" ? "badge--green" : "badge--amber"}`}>
          {r.action}
        </span>
      </div>
    ))}
  </Card>
);

export const AttendanceCard = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="✅">Attendance Rate by Grade</STitle>
    {data.map(({ grade, rate }) => {
      const c = attColor(rate);
      return <ProgressRow key={grade} label={`Grade ${grade}`} pct={rate} color={c} right={`${rate}%`} />;
    })}
    <div className="legend mt-md">
      {[
        ["#2E7D32", "≥93% Good"],
        ["#E65100", "88–92% Fair"],
        ["#C62828", "<88% At Risk"],
      ].map(([c, l]) => (
        <div key={l} className="legend-item">
          <span className="legend-dot" style={{ background: c }} />
          {l}
        </div>
      ))}
    </div>
  </Card>
);

export const AtRiskCard = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="⚑">At-Risk Students</STitle>
    {data.map((s, i) => (
      <div key={i} className="list-row">
        <div>
          <div className="list-row__name">{s.name}</div>
          <div className="list-row__meta">
            Grade {s.grade} · {s.reason}
          </div>
        </div>
        <span className={`badge ${SEVERITY_COLOR[s.severity] ?? "badge--blue"}`}>{s.severity}</span>
      </div>
    ))}
    <button className="btn btn--outline btn--full mt-md">View All Interventions →</button>
  </Card>
);

export const StrandCard = ({ data }) => {
  const total = data.reduce((a, s) => a + s.count, 0);
  return (
    <Card style={{ flex: 1 }}>
      <STitle icon="🎓">SHS Strand Enrollment</STitle>
      <div className="strand-bar">
        {data.map((s, i) => (
          <div
            key={s.name}
            className="strand-bar__seg"
            style={{
              width: `${(s.count / total) * 100}%`,
              background: STRAND_COLORS[i % STRAND_COLORS.length],
            }}
            title={`${s.name}: ${s.count}`}
          />
        ))}
      </div>
      {data.map((s, i) => (
        <div key={s.name} className="list-row" style={{ padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="legend-square" style={{ background: STRAND_COLORS[i % STRAND_COLORS.length] }} />
            <span className="list-row__name" style={{ fontWeight: 500 }}>
              {s.name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="font-mono" style={{ fontWeight: 700, fontSize: 12.5 }}>
              {s.count.toLocaleString()}
            </span>
            <span style={{ fontSize: 10, color: "var(--n-400)" }}>{Math.round((s.count / total) * 100)}%</span>
          </div>
        </div>
      ))}
    </Card>
  );
};

export const TeacherCard = ({ data, stats }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="👩‍🏫">Teachers & Staff</STitle>
    <div className="mini-stats mb-md">
      {[
        [stats.teachingStaff ?? 24, "Total"],
        [stats.teachingActive ?? 21, "Active"],
        [stats.teachingLeave ?? 3, "On Leave"],
      ].map(([v, l]) => (
        <div key={l} className="mini-stat">
          <div className="mini-stat__value">{v}</div>
          <div className="mini-stat__label">{l}</div>
        </div>
      ))}
    </div>
    {data.map((t, i) => (
      <div key={i} className="list-row">
        <div>
          <div className="list-row__name">{t.name}</div>
          <div className="list-row__meta">
            {t.subject} · {t.load} sections
          </div>
        </div>
        <span className={`badge ${t.status === "Active" ? "badge--green" : "badge--amber"}`}>{t.status}</span>
      </div>
    ))}
  </Card>
);

/** Aggregated personnel view for RPMS-style reporting (FSIS test matrix). */
export const RpmsPersonnelReportCard = ({ teacherData = [], stats = {} }) => {
  const rows = Array.isArray(teacherData) ? teacherData.slice(0, 14) : [];
  const teaching = stats.teachingStaff ?? rows.length;
  return (
    <Card style={{ flex: 1, minWidth: 260 }}>
      <STitle icon="📑">RPMS — Personnel summary</STitle>
      <p style={{ fontSize: 12, color: "var(--n-500)", margin: "0 0 12px", lineHeight: 1.45 }}>
        Aggregated teaching personnel for RPMS reporting (preview). Data matches the administrator dashboard roster.
      </p>
      <div className="mini-stats mb-md">
        {[
          [teaching, "Teaching staff"],
          [stats.nonTeaching ?? "—", "Non-teaching"],
          [stats.teachingActive ?? "—", "Active teachers"],
        ].map(([v, l]) => (
          <div key={l} className="mini-stat" style={{ textAlign: "center" }}>
            <div className="mini-stat__value">{v}</div>
            <div className="mini-stat__label">{l}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--n-800)", margin: "12px 0 6px" }}>Roster detail</p>
      <table className="data-table" style={{ marginTop: 8 }}>
        <thead>
          <tr>
            {["Name", "Specialization", "Sections", "Status"].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ color: "var(--n-500)", fontSize: 13 }}>
                No teacher rows in dashboard data.
              </td>
            </tr>
          ) : (
            rows.map((t, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{t.name}</td>
                <td>{t.subject}</td>
                <td className="font-mono">{t.load}</td>
                <td>
                  <span className={`badge ${t.status === "Active" ? "badge--green" : "badge--amber"}`}>{t.status}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
};

export const TransfereeCard = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="🔄">Transferees & Returnees</STitle>
    <div className="mini-stats mb-md">
      {[
        [data.incoming, "Incoming", "var(--brand-primary)"],
        [data.outgoing, "Outgoing", "var(--semantic-red)"],
        [data.returnees, "Returnees", "var(--accent-gold)"],
      ].map(([v, l, c]) => (
        <div key={l} className="mini-stat" style={{ textAlign: "center" }}>
          <div className="mini-stat__value" style={{ color: c }}>
            {v}
          </div>
          <div className="mini-stat__label">{l}</div>
        </div>
      ))}
    </div>
    <STitle>Demographics</STitle>
    {data.demographics.map(({ label, pct }) => (
      <div key={label} className="list-row" style={{ padding: "8px 0" }}>
        <span className="list-row__name" style={{ fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ fontWeight: 700, color: "var(--brand-primary)", fontSize: 12.5 }}>{pct}</span>
      </div>
    ))}
  </Card>
);

export const FeeCard = ({ data }) => {
  const tc = data.reduce((a, r) => a + r.collected, 0);
  const tb = data.reduce((a, r) => a + r.total, 0);
  const pct = Math.round((tc / tb) * 100);
  return (
    <Card style={{ flex: 1 }}>
      <STitle icon="💰">Fees & Payment Collection</STitle>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: "var(--n-900)", lineHeight: 1 }}>{fmt(tc)}</span>
        <span style={{ fontSize: 12, color: "var(--n-400)", marginBottom: 3 }}>of {fmt(tb)}</span>
      </div>
      <div className="progress-track progress-track--thick" style={{ marginBottom: 16 }}>
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: "var(--brand-primary)", height: "100%" }}
        />
      </div>
      {data.map(({ grade, collected, total }) => {
        const p = Math.round((collected / total) * 100);
        const c = pctColor(p);
        return <ProgressRow key={grade} label={`Grade ${grade}`} pct={p} color={c} right={`${p}%`} />;
      })}
    </Card>
  );
};

export const ReportsCard = ({ data }) => (
  <Card style={{ flex: 1 }}>
    <STitle icon="📄">DepEd Reports & Exports</STitle>
    {data.map(({ label, status }) => {
      const isPending = status === "Pending";
      const color = isPending ? "var(--semantic-amber)" : "var(--brand-primary)";
      return (
        <div key={label} className="report-row">
          <span className="report-row__name">{label}</span>
          <button type="button" className="report-btn" style={{ color }}>
            {status}
          </button>
        </div>
      );
    })}
  </Card>
);
