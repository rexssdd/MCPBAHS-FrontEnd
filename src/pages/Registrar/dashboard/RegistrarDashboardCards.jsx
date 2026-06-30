import { Card, SectionTitle, Divider, Skel } from "./RegistrarDashboardPrimitives.jsx";
import { toText } from "../../../utils/safeRender.js";
import {
  statusColor,
  getStatus,
  docsColor,
  priorityColor,
  actionColor,
  notifColor,
  eventColor,
} from "./registrarDashboardTokens.js";

export function EnrollmentGradeCard({ data, loading, onViewAll }) {
  const total = data.reduce((a, r) => a + r.enrolled, 0);
  const totalCap = data.reduce((a, r) => a + r.capacity, 0);
  return (
    <Card style={{ flex: 1 }} testId="enrollment-grade-card">
      <SectionTitle action="View All" onAction={onViewAll}>
        Enrollment by Grade Level
      </SectionTitle>
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={36} mb={10} />)
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 16,
              padding: "12px 14px",
              background: "#f9fbf9",
              borderRadius: 10,
              border: "1px solid #e8ede8",
            }}
          >
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#111f11", lineHeight: 1 }}>
                {total.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "#6b7c6b", marginTop: 2 }}>
                of {totalCap.toLocaleString()} capacity
              </div>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${(total / totalCap) * 100}%`, background: "#1a5c1a" }}
              />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1a5c1a" }}>
              {Math.round((total / totalCap) * 100)}%
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {data.map((row, i) => {
              const pct = Math.round((row.enrolled / row.capacity) * 100);
              const status = getStatus(row.enrolled, row.capacity);
              const sc = statusColor[status];
              return (
                <div
                  key={row.grade}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < data.length - 1 ? "1px solid #f4f6f4" : "none",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#4a5e4a", width: 54, flexShrink: 0 }}>
                    Grade {row.grade}
                  </span>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? "#ef4444" : pct >= 85 ? "#eab308" : "#1a5c1a",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#111f11", width: 32, textAlign: "right" }}>
                    {row.enrolled}
                  </span>
                  <span style={{ fontSize: 10, color: "#9aaa9a", width: 32 }}>/{row.capacity}</span>
                  <span
                    className="badge"
                    style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}
                  >
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

export function PendingApplicationsCard({ data, loading, onProcess, onViewAll }) {
  return (
    <Card style={{ flex: 1 }} testId="pending-applications-card">
      <SectionTitle action="View All" onAction={onViewAll}>
        Pending Applications
      </SectionTitle>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => <Skel key={i} h={52} mb={8} r={8} />)
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {data.slice(0, 6).map((app, i) => {
              const dc = docsColor[app.docs] || docsColor.Pending;
              const pc = priorityColor[app.priority] || priorityColor.normal;
              return (
                <div
                  key={app.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: i < 5 ? "1px solid #f4f6f4" : "none",
                  }}
                  data-testid={`pending-app-${app.id}`}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111f11" }}>{toText(app.name)}</span>
                      {app.priority === "high" && (
                        <span className="badge" style={{ color: pc.color, background: pc.bg, fontSize: 9 }}>
                          URGENT
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#9aaa9a" }}>{app.id}</span>
                      <span style={{ fontSize: 10, color: "#9aaa9a" }}>·</span>
                      <span style={{ fontSize: 11, color: "#4a5e4a" }}>Grade {app.grade}</span>
                      <span style={{ fontSize: 10, color: "#9aaa9a" }}>·</span>
                      <span style={{ fontSize: 11, color: "#4a5e4a" }}>{toText(app.type)}</span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <span className="badge" style={{ color: dc.color, background: dc.bg }}>
                      {app.docs}
                    </span>
                    <button
                      className="btn btn--outline-green"
                      style={{ fontSize: 10, padding: "4px 10px" }}
                      onClick={() => onProcess(app)}
                    >
                      Process
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            data-testid="process-applications-btn"
            onClick={onViewAll}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "9px",
              border: "1.5px solid #1a5c1a",
              borderRadius: 8,
              background: "transparent",
              color: "#1a5c1a",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            View All Applications →
          </button>
        </>
      )}
    </Card>
  );
}

export function AppStatusCard({ data, stats, loading }) {
  const { total = 378, approved = 210, pending = 128, incomplete = 40 } = data ?? {};
  const bars = [
    ["Approved", approved, "#1a5c1a"],
    ["Pending", pending, "#d97706"],
    ["Incomplete", incomplete, "#dc2626"],
  ];
  return (
    <Card style={{ width: 260, flexShrink: 0 }} testId="app-status-card">
      <SectionTitle>Application Status</SectionTitle>
      {loading ? (
        <Skel h={120} r={10} mb={12} />
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#111f11", lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 11, color: "#6b7c6b", marginTop: 2 }}>Total applications this SY</div>
            <div style={{ display: "flex", height: 8, borderRadius: 6, overflow: "hidden", marginTop: 10, gap: 2 }}>
              {bars.map(([l, v, c]) => (
                <div key={l} style={{ width: `${(v / total) * 100}%`, background: c, borderRadius: 3 }} />
              ))}
            </div>
          </div>
          <Divider />
          {bars.map(([label, val, color]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f4f6f4",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }}
                />
                <span style={{ fontSize: 12.5, color: "#1a3a1a" }}>{label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111f11" }}>{val}</span>
            </div>
          ))}
          {stats?.todayQuota && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                background: "#f9fbf9",
                border: "1px solid #e8ede8",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 10, color: "#9aaa9a", fontWeight: 600, marginBottom: 4 }}>
                {"TODAY'S QUOTA"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(stats.todayQuota.done / stats.todayQuota.total) * 100}%`,
                      background: "#1a5c1a",
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1a5c1a" }}>
                  {stats.todayQuota.done}/{stats.todayQuota.total}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export function MissingDocsCard({ data, loading, onSendReminders }) {
  return (
    <Card style={{ flex: 1 }} testId="missing-docs-card">
      <SectionTitle action="Send Reminders" onAction={onSendReminders}>
        Missing Documents
      </SectionTitle>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skel key={i} h={48} mb={8} r={8} />)
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {data.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 0",
                borderBottom: i < data.length - 1 ? "1px solid #f4f6f4" : "none",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
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
                {toText(s.name).charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111f11", marginBottom: 3 }}>
                  {toText(s.name)}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {s.missing.map((doc) => (
                    <span
                      key={doc}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#b91c1c",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        padding: "2px 7px",
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
      )}
    </Card>
  );
}

export function DocTrackerCard({ data, loading }) {
  const totalStudents = 378;
  return (
    <Card style={{ flex: 1 }} testId="doc-tracker-card">
      <SectionTitle>Document Submission Tracker</SectionTitle>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => <Skel key={i} h={40} mb={10} />)
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.map(({ name, submitted, pending }) => {
            const pct = Math.round((submitted / totalStudents) * 100);
            const color = pct >= 90 ? "#15803d" : pct >= 70 ? "#d97706" : "#dc2626";
            return (
              <div key={name}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 12, color: "#1a3a1a", fontWeight: 500 }}>{name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color }}>{submitted}/{totalStudents}</span>
                    <span style={{ fontSize: 10, color: "#dc2626" }}>−{pending} missing</span>
                  </div>
                </div>
                <div className="progress-track" style={{ height: 7 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function RecentlyProcessedCard({ data, loading }) {
  return (
    <Card style={{ width: 300, flexShrink: 0 }} testId="recently-processed-card">
      <SectionTitle>Recently Processed</SectionTitle>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => <Skel key={i} h={44} mb={6} r={8} />)
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {data.map((r, i) => {
            const ac = actionColor[r.action] || actionColor.Enrolled;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 0",
                  borderBottom: i < data.length - 1 ? "1px solid #f4f6f4" : "none",
                }}
              >
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
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#1a5c1a",
                  }}
                >
                  {r.name.split(",")[0][0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#111f11",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {toText(r.name)}
                  </div>
                  <div style={{ fontSize: 10, color: "#9aaa9a" }}>
                    G{r.grade} · {r.time} · {r.by}
                  </div>
                </div>
                <span className="badge" style={{ color: ac.color, background: ac.bg }}>
                  {r.action}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function TransfereesCard({ data, loading, onViewAll }) {
  return (
    <Card style={{ flex: 1 }} testId="transferees-card">
      <SectionTitle action="View All" onAction={onViewAll}>
        Transferee Applications
      </SectionTitle>
      {loading ? (
        <Skel h={120} r={10} mb={12} />
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {[
              [String(data.length), "Total", "#111f11"],
              [String(data.filter((t) => t.status === "Approved").length), "Approved", "#15803d"],
              [String(data.filter((t) => t.status === "Pending Docs").length), "Pending", "#a16207"],
              [String(data.filter((t) => t.status === "For Interview").length), "Interview", "#1d4ed8"],
            ].map(([v, l, c]) => (
              <div
                key={l}
                style={{
                  flex: 1,
                  background: "#f4f6f4",
                  borderRadius: 10,
                  padding: "10px 8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 9, color: "#6b7c6b", fontWeight: 600, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {data.slice(0, 5).map((t, i) => {
              const sColor =
                t.status === "Approved"
                  ? { bg: "#f0fdf4", color: "#15803d" }
                  : t.status === "For Interview"
                    ? { bg: "#eff6ff", color: "#1d4ed8" }
                    : { bg: "#fefce8", color: "#a16207" };
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 0",
                    borderBottom: i < Math.min(data.length, 5) - 1 ? "1px solid #f4f6f4" : "none",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111f11" }}>{toText(t.name)}</div>
                    <div style={{ fontSize: 11, color: "#9aaa9a" }}>
                      From: {t.from} · Grade {t.grade}
                    </div>
                  </div>
                  <span className="badge" style={{ color: sColor.color, background: sColor.bg }}>
                    {toText(t.status)}
                  </span>
                </div>
              );
            })}
          </div>
          {data.length > 5 && (
            <button
              onClick={onViewAll}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "8px",
                border: "1.5px solid #1a5c1a",
                borderRadius: 8,
                background: "transparent",
                color: "#1a5c1a",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              View All {data.length} Transferees →
            </button>
          )}
        </>
      )}
    </Card>
  );
}

export function SectionCapacityCard({ data, loading }) {
  return (
    <Card style={{ flex: 1 }} testId="section-capacity-card">
      <SectionTitle>Section Capacity</SectionTitle>
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={44} mb={8} r={8} />)
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {data.map((sec, i) => {
            const pct = Math.round((sec.enrolled / sec.cap) * 100);
            const status = getStatus(sec.enrolled, sec.cap);
            const sc = statusColor[status];
            return (
              <div
                key={i}
                style={{ padding: "10px 0", borderBottom: i < data.length - 1 ? "1px solid #f4f6f4" : "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 5,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111f11" }}>
                      Grade {sec.section}
                    </span>
                    <span style={{ fontSize: 11, color: "#9aaa9a", marginLeft: 8 }}>{sec.adviser}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111f11" }}>
                      {sec.enrolled}/{sec.cap}
                    </span>
                    <span
                      className="badge"
                      style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}
                    >
                      {status}
                    </span>
                  </div>
                </div>
                <div className="progress-track" style={{ height: 6 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? "#ef4444" : pct >= 85 ? "#eab308" : "#1a5c1a",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function CalendarCard({ data, loading }) {
  return (
    <Card style={{ flex: 1 }} testId="calendar-card">
      <SectionTitle>Upcoming Deadlines & Events</SectionTitle>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => <Skel key={i} h={50} mb={8} r={8} />)
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {data.map((ev, i) => {
            const [mon, day] = ev.date.split(" ");
            const color = eventColor[ev.type] || "#6b7c6b";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i < data.length - 1 ? "1px solid #f4f6f4" : "none",
                }}
              >
                <div
                  style={{
                    width: 44,
                    textAlign: "center",
                    background: "#f4f6f4",
                    borderRadius: 8,
                    padding: "6px 4px",
                    flexShrink: 0,
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: "#6b7c6b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {mon}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#111f11", lineHeight: 1 }}>{day}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "#1a3a1a", fontWeight: 500, lineHeight: 1.3 }}>
                    {toText(ev.label)}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color,
                      fontWeight: 700,
                      marginTop: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    {toText(ev.type)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function NotificationsCard({ data, loading }) {
  return (
    <Card style={{ width: 290, flexShrink: 0 }} testId="notifications-card">
      <SectionTitle>Alerts</SectionTitle>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skel key={i} h={60} mb={8} r={10} />)
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.map((n, i) => {
            const nc = notifColor[n.type] || notifColor.info;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  background: nc.bg,
                  border: `1px solid ${nc.border}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: nc.color,
                    flexShrink: 0,
                    fontWeight: 800,
                    width: 18,
                    textAlign: "center",
                  }}
                >
                  {nc.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#1a3a1a", lineHeight: 1.4 }}>{n.msg}</div>
                  <div style={{ fontSize: 10, color: "#9aaa9a", marginTop: 2 }}>{n.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function DocumentStatsCard({ data, loading }) {
  const safeData = data ?? { completionRate: 0, fullyComplete: 0, withMissing: 0, notSubmitted: 0 };
  return (
    <Card style={{ width: 260, flexShrink: 0 }} testId="doc-stats-card">
      <SectionTitle>Document Stats</SectionTitle>
      {loading ? (
        <Skel h={200} r={10} />
      ) : (
        <>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#1a5c1a", lineHeight: 1 }}>
              {safeData.completionRate}%
            </div>
            <div style={{ fontSize: 12, color: "#6b7c6b" }}>Overall completion rate</div>
          </div>
          <Divider />
          {[
            ["Fully Complete", safeData.fullyComplete, "#15803d"],
            ["With Missing", safeData.withMissing, "#a16207"],
            ["Not Submitted", safeData.notSubmitted, "#b91c1c"],
          ].map(([l, v, c]) => (
            <div
              key={l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #f4f6f4",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: "#1a3a1a" }}>{l}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111f11" }}>{v}</span>
            </div>
          ))}
          <button
            style={{
              marginTop: 14,
              width: "100%",
              padding: "8px",
              border: "1.5px solid #1a5c1a",
              borderRadius: 8,
              background: "transparent",
              color: "#1a5c1a",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Export Report →
          </button>
        </>
      )}
    </Card>
  );
}

export function EnrollmentBreakdownCard({ data, loading }) {
  const safeData = data ?? { new: 0, returning: 0, transferees: 0, reEnrollees: 0 };
  return (
    <Card style={{ width: 280, flexShrink: 0 }} testId="enrollment-breakdown-card">
      <SectionTitle>Enrollment Type Breakdown</SectionTitle>
      {loading ? (
        <Skel h={200} r={10} />
      ) : (
        <>
          {[
            ["New Enrollees", safeData.new, "#1a5c1a"],
            ["Returning", safeData.returning, "#1d4ed8"],
            ["Transferees", safeData.transferees, "#d97706"],
            ["Re-enrollees", safeData.reEnrollees, "#7c3aed"],
          ].map(([l, v, c]) => (
            <div
              key={l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #f4f6f4",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#1a3a1a" }}>{l}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#111f11" }}>{(v || 0).toLocaleString()}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 14,
              padding: "12px",
              background: "#f9fbf9",
              border: "1px solid #e8ede8",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#9aaa9a",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Male / Female Split
            </div>
            <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.round((data.male / (data.male + data.female)) * 100)}%`,
                  background: "#1a5c1a",
                }}
              />
              <div style={{ flex: 1, background: "#d4a017" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 11, color: "#1a5c1a", fontWeight: 700 }}>
                ♂ {(data.male || 0).toLocaleString()} ({Math.round((data.male / (data.male + data.female)) * 100)}%)
              </span>
              <span style={{ fontSize: 11, color: "#d4a017", fontWeight: 700 }}>
                ♀ {(data.female || 0).toLocaleString()} ({Math.round((data.female / (data.male + data.female)) * 100)}%)
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export function ComplianceChecklistCard({ data, loading }) {
  return (
    <Card style={{ flex: 1 }} testId="compliance-card">
      <SectionTitle>DepEd Compliance Checklist</SectionTitle>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => <Skel key={i} h={48} mb={8} r={10} />)
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.map(({ label, done, note }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                background: done ? "#f9fbf9" : "#fff",
                border: `1.5px solid ${done ? "#e8ede8" : "#fde68a"}`,
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: done ? "#1a5c1a" : "#fefce8",
                  border: done ? "none" : "1.5px solid #fde68a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: done ? "#fff" : "#a16207", fontSize: 11 }}>{done ? "✓" : "!"}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111f11" }}>{label}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: done ? "#9aaa9a" : "#a16207",
                    marginTop: 1,
                    fontWeight: done ? 400 : 600,
                  }}
                >
                  {note}
                </div>
              </div>
              {!done && (
                <button
                  style={{
                    padding: "5px 12px",
                    border: "1.5px solid #d97706",
                    borderRadius: 20,
                    background: "transparent",
                    color: "#d97706",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                >
                  Prepare
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function QuickActionsCard({ onSendReminders, onEnrollStudent, onViewRecords }) {
  return (
    <Card style={{ flex: 1 }} testId="quick-actions-card">
      <SectionTitle>Quick Actions</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          ["📋", "Enroll Student", "#1a5c1a", "#f0fdf4", "#bbf7d0", onEnrollStudent],
          ["📄", "Print Form 138", "#1d4ed8", "#eff6ff", "#93c5fd", null],
          ["📤", "Export SF1 Report", "#7c3aed", "#f5f3ff", "#c4b5fd", null],
          ["🔍", "Look Up Record", "#0891b2", "#f0f9ff", "#7dd3fc", onViewRecords],
          ["📬", "Send Doc Reminder", "#d97706", "#fefce8", "#fde68a", onSendReminders],
          ["✅", "Approve Batch", "#15803d", "#f0fdf4", "#86efac", null],
        ].map(([icon, label, color, bg, border, handler]) => (
          <button
            key={label}
            data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={handler}
            className="quick-action-btn"
            style={{ background: bg, border: `1.5px solid ${border}` }}
          >
            <span className="quick-action-icon">{icon}</span>
            <span className="quick-action-label" style={{ color }}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}