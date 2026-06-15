import { useState, useMemo } from "react";
import Sidebar from "../../../Components/Sidebar";
import { StatCard } from "./PrincipalDashboardPrimitives.jsx";
import { ALL_TABS, EMPTY, fmt, fmtNum, fmtPct } from "./principalDashboardTokens.js";
import { usePrincipalDashboard } from "./usePrincipalDashboard.js";
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
  TransfereeCard,
  FeeCard,
  ReportsCard,
  ExecutiveSummaryCard,
  SchoolHealthCard,
  QuarterlyReportCard,
  StaffPerformanceCard,
  SIPProgressCard,
} from "./PrincipalDashboardCards.jsx";

export function PrincipalDashboardContent() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: d, apiState, error, loading, retry } = usePrincipalDashboard();

  const s = useMemo(() => d.stats ?? EMPTY.stats, [d.stats]);

  const apiLabel = {
    connected: "● Live",
    loading:   "⟳ Syncing…",
    error:     "⚠ Connection issue",
  }[apiState] ?? "⟳ Syncing…";

  // Hard failure — API completely unreachable and no data at all
  if (apiState === "error" && error && !d?.stats) {
    return (
      <div className="db-root">
        <Sidebar role="principal" />
        <main id="main-content" className="db-main">
          <div className="error-panel">
            <div className="error-panel__icon">⚠</div>
            <h2 className="error-panel__title">Unable to load dashboard</h2>
            <p className="error-panel__desc">{error}</p>
            <button className="btn btn--primary" onClick={retry}>⟳ Retry Connection</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="db-root">
      <Sidebar role="principal" />
      <main id="main-content" className="db-main">

        {/* ── Header ── */}
        <div className="db-header">
          <div className="db-header-left">
            <span className="db-school-badge">M.C.P.B.A High School · SY 2024–2025</span>
            <h1 className="db-title">Principal's Dashboard</h1>
            <p className="db-subtitle">
              Quarter 3 ·{" "}
              {new Date().toLocaleDateString("en-PH", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>

          <div className="db-header-right">
            <span className={`db-api-status ${apiState}`}>{apiLabel}</span>

            {/* Soft partial-data warning (some endpoints failed, rest succeeded) */}
            {error && apiState !== "error" && (
              <span className="db-api-status fallback" title={error} style={{ cursor: "help" }}>
                ⚠ Partial data
              </span>
            )}

            <button className="btn btn--ghost" onClick={retry} title="Refresh data">
              ⟳ Refresh
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="db-tabs">
          {ALL_TABS.map(t => (
            <button
              key={t.id}
              className={`db-tab${activeTab === t.id ? " active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="db-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══ */}
        {activeTab === "overview" && (
          <div className="tab-content">
            <div className="db-row db-row--equal">
              <StatCard label="Enrolled Today"   value={s.enrolledToday}          sub="vs. prior day"      subColor="var(--semantic-green)"             loading={loading} />
              <StatCard label="Total Enrolled"   value={fmtNum(s.totalEnrolled)}  sub="Grades 7–12"        subColor="var(--brand-primary)"              loading={loading} />
              <StatCard label="Pending Apps"     value={s.pendingApps}            action="Review"                                                       loading={loading} />
              <StatCard label="Completion Rate"  value={fmtPct(s.completionRate)} sub="vs. last SY"        subColor="var(--semantic-green)"             loading={loading} />
              <StatCard label="At-Risk Students" value={s.atRiskCount}            sub="Needs intervention" subColor="var(--semantic-red)" accent="var(--semantic-red)" loading={loading} />
            </div>
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

        {/* ══ ACADEMIC ══ */}
        {activeTab === "academic" && (
          <div className="tab-content">
            <div className="db-row db-row--equal">
              <StatCard label="Avg GPA"        value={s.avgGpa}                sub="Current quarter"    subColor="var(--semantic-green)"             loading={loading} />
              <StatCard label="Pass Rate"      value={fmtPct(s.passRate)}      sub="Grades 7–12"        subColor="var(--brand-primary)"              loading={loading} />
              <StatCard label="Low Attendance" value={s.lowAttendanceSections} sub="Sections below 88%" subColor="var(--semantic-red)" accent="var(--semantic-red)" loading={loading} />
              <StatCard label="Total Sections" value={s.totalSections}         sub="All grade levels"   subColor="var(--n-500)"                      loading={loading} />
            </div>
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

        {/* ══ PEOPLE & HR ══ */}
        {activeTab === "people" && (
          <div className="tab-content">
            <div className="db-row db-row--equal">
              <StatCard label="Total Students"  value={fmtNum(s.totalStudents)}  sub="Grades 7–12"         subColor="var(--brand-primary)"  loading={loading} />
              <StatCard label="Teaching Staff"  value={s.teachingStaff}          sub={`${s.teachingActive ?? "—"} active, ${s.teachingLeave ?? "—"} on leave`} subColor="var(--brand-primary)" loading={loading} />
              <StatCard label="Non-teaching"    value={s.nonTeaching}            sub="Admin & support"     subColor="var(--n-500)"          loading={loading} />
              <StatCard label="Parent Contacts" value={fmtNum(s.parentContacts)} sub="Registered contacts" subColor="var(--brand-primary)"  loading={loading} />
            </div>
            <div className="db-row">
              {/* Teacher roster (Group A) + IPCRF breakdown (Group B) side by side */}
              <TeacherCard data={d.teacherData} stats={s} />
              <StaffPerformanceCard data={d.staffPerformance} />
            </div>
            <div className="db-row">
              <TransfereeCard data={d.transferees} />
              <RecentActivity data={d.recentActivity} />
            </div>
          </div>
        )}

        {/* ══ OPERATIONS ══ */}
        {activeTab === "operations" && (
          <div className="tab-content">
            <div className="db-row db-row--equal">
              <StatCard label="Total Collected" value={fmt(s.totalCollected)}  sub={`of ${fmt(s.totalBilled)} billed`} subColor="var(--brand-primary)"             loading={loading} />
              <StatCard label="Unpaid Balances" value={fmt(s.unpaidBalances)}  sub={`${s.unpaidCount ?? "—"} students`} subColor="var(--semantic-red)" accent="var(--semantic-red)"  loading={loading} />
              <StatCard label="With Waiver"     value={s.waiverCount}          sub="Approved waivers"                   subColor="var(--accent-gold)"  accent="var(--accent-gold)"   loading={loading} />
              <StatCard label="Overdue Reports" value={s.overdueReports}       action="Submit Now"                      accent="var(--semantic-red)"   loading={loading} />
            </div>
            <div className="db-row">
              <FeeCard data={d.feeData} />
              <CalendarCard data={d.calendarEvents} />
            </div>
            <div className="db-row">
              <ReportsCard data={d.reports} />
              <NotificationsCard data={d.notifications} />
            </div>
          </div>
        )}

        {/* ══ EXECUTIVE (Principal-exclusive) ══
             All four Group B endpoints rendered here plus supporting Group A cards. */}
        {activeTab === "executive" && (
          <div className="tab-content">

            {/* /dashboard/executive-summary */}
            <ExecutiveSummaryCard
              executiveSummary={d.executiveSummary}
              stats={s}
              feeData={d.feeData}
              attendanceData={d.attendanceData}
            />

            {/* /dashboard/school-health  +  /dashboard/sip-progress */}
            <div className="db-row">
              <SchoolHealthCard
                schoolHealth={d.schoolHealth}
                stats={s}
                attendanceData={d.attendanceData}
                feeData={d.feeData}
              />
              <SIPProgressCard data={d.sipProgress} />
            </div>

            {/* /reports/quarterly-summary  +  /reports/staff-performance */}
            <div className="db-row">
              <QuarterlyReportCard data={d.quarterlyReport} />
              <StaffPerformanceCard data={d.staffPerformance} />
            </div>

            {/* Supporting Group A cards */}
            <div className="db-row">
              <AtRiskCard data={d.atRiskStudents} />
              <ReportsCard data={d.reports} />
            </div>

          </div>
        )}

      </main>
    </div>
  );
}