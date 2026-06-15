import { useState } from "react";
import Sidebar from "../../Components/Sidebar";
import { useDashboard } from "../../hooks/Teacher/useDashboard";
import "../../Css/Teacher/Dashboard.css";
import { TABS } from "./dashboard/teacherDashboardTokens.js";
import {
  ApiStatusBar,
  Toast,
  StatCard,
} from "./dashboard/TeacherDashboardPrimitives.jsx";
import {
  AllAttendanceModal,
  AllGradesModal,
  LowPerformersModal,
} from "./dashboard/TeacherDashboardModals.jsx";
import {
  AttendanceCard,
  GradeBookCard,
  LowPerformersCard,
  ClassSummaryCard,
  ScheduleCard,
  SubjectPerformanceCard,
  RecentActivityCard,
  CalendarCard,
  NotificationsCard,
  QuickActionsCard,
} from "./dashboard/TeacherDashboardCards.jsx";

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // ── Modal state ────────────────────────────────────────
  const [modal, setModal] = useState({
    attendance:    false,
    grades:        false,
    lowPerformers: false,
  });
  const [lowPerformersKey, setLowPerformersKey] = useState(0);

  const openModal  = (k) => setModal(m => ({ ...m, [k]: true  }));
  const closeModal = (k) => setModal(m => ({ ...m, [k]: false }));
  const openLowPerformersModal = () => {
    setLowPerformersKey((k) => k + 1);
    openModal("lowPerformers");
  };

  // ── Hook ───────────────────────────────────────────────
  const {
    globalStatus,
    loading,
    toast,
    dismissToast,
    refresh,
    stats,
    attendance,
    grades,
    lowPerformers,
    schedule,
    calendarEvents,
    notifications,
    subjectPerformance,
    recentActivities,
    logIntervention,
  } = useDashboard();

  const today = new Date().toLocaleDateString("en-US", {
    weekday:"long", year:"numeric", month:"long", day:"numeric",
  });

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');`}</style>

      <div className="db-root" data-testid="teacher-dashboard">
        <Sidebar role="teacher" />
        <main id="main-content" className="db-main">

          {/* ── Page Header ─────────────────────────────── */}
          <div className="db-header">
            <div>
              <h1 className="db-header-title">Teacher Dashboard</h1>
              <p className="db-header-sub">School Year 2024–2025 · 3rd Quarter · {today}</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {/* <div style={{ textAlign:"right" }}>
                <div className="db-user-name">Dela Rosa, Alma F.</div>
                <div className="db-user-role">Mathematics Teacher · Grade 8</div>
              </div>
              <div className="db-avatar">AD</div> */}
            </div>
          </div>

          {/* ── API Status ──────────────────────────────── */}
          {/* <ApiStatusBar status={globalStatus} onRetry={refresh} /> */}

          {/* ── Tabs ────────────────────────────────────── */}
          <div className="db-tabs" role="tablist" data-testid="dashboard-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                data-testid={`tab-${t.id}`}
                className={`db-tab${activeTab === t.id ? " active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════
              OVERVIEW TAB
          ══════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <>
              <div className="db-row">
                <AttendanceCard
                  data={attendance}
                  onViewAll={() => openModal("attendance")}
                  loading={loading.attendance}
                />
                <ClassSummaryCard
                  stats={stats}
                  grades={grades}
                  loading={loading.grades}
                />
              </div>
              <div className="db-row">
                <GradeBookCard
                  data={grades}
                  onViewAll={() => openModal("grades")}
                  loading={loading.grades}
                />
                <SubjectPerformanceCard
                  data={subjectPerformance}
                  loading={loading.subjectPerformance}
                />
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════
              GRADES TAB
          ══════════════════════════════════════════════ */}
          {activeTab === "grades" && (
            <>
              <div className="db-row">
                <GradeBookCard
                  data={grades}
                  onViewAll={() => openModal("grades")}
                  loading={loading.grades}
                />
                <SubjectPerformanceCard
                  data={subjectPerformance}
                  loading={loading.subjectPerformance}
                />
              </div>
              <div className="db-row">
                <LowPerformersCard
                  data={lowPerformers}
                  onViewAll={() => openLowPerformersModal()}
                  loading={loading.lowPerformers}
                />
                <NotificationsCard
                  data={notifications}
                  loading={loading.notifications}
                />
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════
              ATTENDANCE TAB
          ══════════════════════════════════════════════ */}
          {activeTab === "attendance" && (
            <>
              <div className="db-row">
                <AttendanceCard
                  data={attendance}
                  onViewAll={() => openModal("attendance")}
                  loading={loading.attendance}
                />
                <RecentActivityCard
                  data={recentActivities}
                  loading={loading.recentActivities}
                />
              </div>
              <div className="db-row">
                <SubjectPerformanceCard
                  data={subjectPerformance}
                  loading={loading.subjectPerformance}
                />
                <NotificationsCard
                  data={notifications}
                  loading={loading.notifications}
                />
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════
              SCHEDULE TAB
          ══════════════════════════════════════════════ */}
          {activeTab === "schedule" && (
            <>
              <div className="db-row">
                <ScheduleCard
                  data={schedule}
                  loading={loading.schedule}
                />
                <NotificationsCard
                  data={notifications}
                  loading={loading.notifications}
                />
              </div>
              <div className="db-row">
                <CalendarCard
                  data={calendarEvents}
                  loading={loading.calendar}
                />
                <QuickActionsCard
                  onViewGrades={() => openModal("grades")}
                  onViewAttendance={() => openModal("attendance")}
                  onViewLowPerformers={() => openLowPerformersModal()}
                />
              </div>
            </>
          )}

        </main>
      </div>

      {/* ══════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════ */}
      <AllAttendanceModal
        open={modal.attendance}
        onClose={() => closeModal("attendance")}
        data={attendance}
      />
      <AllGradesModal
        open={modal.grades}
        onClose={() => closeModal("grades")}
        data={grades}
      />
      <LowPerformersModal
        key={lowPerformersKey}
        open={modal.lowPerformers}
        onClose={() => closeModal("lowPerformers")}
        data={lowPerformers}
        onLogIntervention={logIntervention}
      />

      {/* ── Global Toast ────────────────────────────────── */}
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
