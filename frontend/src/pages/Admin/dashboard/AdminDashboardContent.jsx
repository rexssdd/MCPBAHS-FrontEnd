import { useState, useCallback, useMemo } from "react";
import Sidebar from "../../../Components/Sidebar";
import { ROLE_CONFIG, DEFAULT, ALL_TABS, ROLES } from "./adminDashboardTokens.js";
import { StatCard } from "./AdminDashboardPrimitives.jsx";
import { useAdminRoleDashboard } from "./useAdminRoleDashboard.js";
import {
  BarChart,
  NotificationsCard,
  EnrollmentTable,
  AppStatusCard,
  CalendarCard,
  RecentActivity,
  AttendanceCard,
  AtRiskCard,
  StrandCard,
  TeacherCard,
  RpmsPersonnelReportCard,
  TransfereeCard,
  FeeCard,
  ReportsCard,
} from "./AdminDashboardCards.jsx";

export function AdminDashboardContent() {
  const [activeRole, setActiveRole] = useState("Admin");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: d, apiState, error, retry } = useAdminRoleDashboard(activeRole);

  const availableTabs = useMemo(
    () => ALL_TABS.filter((t) => ROLE_CONFIG[activeRole].tabs.includes(t.id)),
    [activeRole],
  );

  const handleRoleChange = useCallback((role) => {
    setActiveRole(role);
    const firstTab = ROLE_CONFIG[role].tabs[0];
    setActiveTab(firstTab);
  }, []);

  const s = useMemo(() => d.stats ?? DEFAULT.stats, [d.stats]);

  const apiLabel = {
    connected: "● Live Data",
    loading: "⟳ Loading…",
    fallback: "○ Demo Data",
  }[apiState] ?? "○ Demo Data";

  if (error && apiState === "fallback" && !d) {
    return (
      <div className="db-root">
        <Sidebar role={activeRole.toLowerCase()} />
        <main id="main-content" className="db-main">
          <div
            className="error-message"
            style={{ padding: "20px", background: "#FFEBEE", borderRadius: "8px", margin: "20px" }}
          >
            <p style={{ color: "#C62828", fontWeight: 600 }}>Error: {error}</p>
            <button type="button" className="btn btn--outline" onClick={retry} style={{ marginTop: "10px" }}>
              ⟳ Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="db-root">
      <Sidebar role={activeRole.toLowerCase()} />
      <main id="main-content" className="db-main">
        <div className="db-header">
          <div className="db-header-left">
            <span className="db-school-badge">M.C.P.B.A High School · SY 2024–2025</span>
            <h1 className="db-title">
              {activeRole === "Admin" && "Admin Dashboard"}
              {activeRole === "Registrar" && "Registrar Dashboard"}
              {activeRole === "Teacher" && "Teacher Dashboard"}
            </h1>
            <p className="db-subtitle">
              Quarter 3 ·{" "}
              {new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="db-header-right">
            <span className={`db-api-status ${apiState}`}>{apiLabel}</span>

            {error && apiState === "fallback" && (
              <span className="db-api-status fallback" title={error} style={{ cursor: "help" }}>
                ⚠ Using demo data
              </span>
            )}

            <button type="button" className="btn btn--ghost" onClick={retry} title="Refresh data">
              ⟳ Refresh
            </button>

            <div className="db-role-group">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`db-role-btn${activeRole === r ? " active" : ""}`}
                  onClick={() => handleRoleChange(r)}
                  aria-pressed={activeRole === r}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="db-tabs">
          {availableTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`db-tab${activeTab === t.id ? " active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="db-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="tab-content">

            <div className="db-row">
              <BarChart data={d.gradeData} />
              <NotificationsCard data={d.notifications} />
            </div>

            <div className="db-row">
              <EnrollmentTable data={d.enrollmentTable} />
              <AppStatusCard data={d.applicationStatus} />
            </div>
          </div>
        )}

        {activeTab === "academic" && (
          <div className="tab-content">
            <div className="db-row">
              <AttendanceCard data={d.attendanceData} />
              <AtRiskCard data={d.atRiskStudents} />
            </div>
            <div className="db-row">
              <StrandCard data={d.strands} />
              <EnrollmentTable data={d.enrollmentTable} />
            </div>
          </div>
        )}

        {activeTab === "people" && (
          <div className="tab-content">
            <div className="db-row">
              {ROLE_CONFIG[activeRole].visibleStats.includes("teachingStaff") ? (
                <>
                  <TeacherCard data={d.teacherData} stats={s} />
                  {activeRole === "Admin" && <RpmsPersonnelReportCard teacherData={d.teacherData} stats={s} />}
                </>
              ) : (
                <AttendanceCard data={d.attendanceData} />
              )}
              <AtRiskCard data={d.atRiskStudents} />
            </div>
            <div className="db-row">
              <TransfereeCard data={d.transferees} />
              <RecentActivity data={d.recentActivity} />
            </div>
          </div>
        )}

        {activeTab === "operations" && (
          <div className="tab-content">
            <div className="db-row">
              <FeeCard data={d.feeData} />
              <CalendarCard data={d.calendarEvents} />
            </div>
            <div className="db-row">
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


