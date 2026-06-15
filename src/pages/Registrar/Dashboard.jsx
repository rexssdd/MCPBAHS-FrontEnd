import { useState } from "react";
import Sidebar from "../../Components/Sidebar";
import { useDashboard } from "../../hooks/Principal/useDashboard";
import "../../Css/Registrar/Dashboard.css";
import { ApiStatusBar, Toast, StatCard } from "./dashboard/RegistrarDashboardPrimitives.jsx";
import {
  EnrollmentGradeModal,
  AllApplicationsModal,
  ProcessApplicationModal,
  AllTransfereesModal,
  SendRemindersModal,
} from "./dashboard/RegistrarDashboardModals.jsx";
import {
  EnrollmentGradeCard,
  PendingApplicationsCard,
  AppStatusCard,
  MissingDocsCard,
  DocTrackerCard,
  RecentlyProcessedCard,
  TransfereesCard,
  SectionCapacityCard,
  CalendarCard,
  NotificationsCard,
  DocumentStatsCard,
  EnrollmentBreakdownCard,
  ComplianceChecklistCard,
  QuickActionsCard,
} from "./dashboard/RegistrarDashboardCards.jsx";
import { TABS } from "./dashboard/registrarDashboardTokens.js";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("enrollment");

  const [modal, setModal] = useState({
    enrollmentGrade: false,
    allApplications: false,
    processApplication: false,
    allTransferees: false,
    sendReminders: false,
  });
  const [selectedApp, setSelectedApp] = useState(null);
  const [processingApp, setProcessingApp] = useState(false);
  const [sendRemindersKey, setSendRemindersKey] = useState(0);

  const openModal = (key) => setModal((m) => ({ ...m, [key]: true }));
  const closeModal = (key) => setModal((m) => ({ ...m, [key]: false }));

  const {
    globalStatus,
    loading,
    toast,
    stats,
    enrollmentByGrade,
    applicationStats,
    pendingApplications,
    recentlyProcessed,
    missingDocuments,
    documentTracker,
    documentStats,
    sectionCapacity,
    enrollmentBreakdown,
    transferees,
    calendarEvents,
    complianceChecklist,
    notifications,
    processApplication,
    sendDocumentReminders,
    refresh,
    dismissToast,
  } = useDashboard();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleOpenProcess = (app) => {
    setSelectedApp(app);
    openModal("processApplication");
  };

  const handleConfirmProcess = async (appId, action) => {
    setProcessingApp(true);
    await processApplication(appId, action);
    setProcessingApp(false);
    closeModal("processApplication");
    closeModal("allApplications");
  };

  const handleSendReminders = async () => {
    await sendDocumentReminders();
  };

  const handleOpenReminders = () => {
    setSendRemindersKey((k) => k + 1);
    openModal("sendReminders");
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');`}</style>

      <div className="db-root" data-testid="registrar-dashboard">
        <Sidebar role="registrar" />
        <main id="main-content" className="db-main">
          <div className="db-header">
            <div>
              <h1 className="db-header-title">Registrar Dashboard</h1>
              <p className="db-header-sub">School Year 2024–2025 · Enrollment Period · {today}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "right" }}>
                <div className="db-user-name">Santos, Maria Cruz</div>
                <div className="db-user-role">School Registrar</div>
              </div>
              <div className="db-avatar">SC</div>
            </div>
          </div>

          <ApiStatusBar status={globalStatus} onRetry={refresh} />

          <div className="db-tabs" role="tablist" data-testid="dashboard-tabs">
            {TABS.map((t) => (
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

          {activeTab === "enrollment" && (
            <>
              <div className="db-row">
                <EnrollmentGradeCard
                  data={enrollmentByGrade}
                  loading={loading.enrollment}
                  onViewAll={() => openModal("enrollmentGrade")}
                />
                <AppStatusCard data={applicationStats} stats={stats} loading={loading.applications} />
              </div>
              <div className="db-row">
                <PendingApplicationsCard
                  data={pendingApplications}
                  loading={loading.applications}
                  onProcess={handleOpenProcess}
                  onViewAll={() => openModal("allApplications")}
                />
                <RecentlyProcessedCard data={recentlyProcessed} loading={loading.recentlyProcessed} />
              </div>
            </>
          )}

          {activeTab === "documents" && (
            <>
              <div className="db-row">
                <DocTrackerCard data={documentTracker} loading={loading.documents} />
                <NotificationsCard data={notifications} loading={loading.notifications} />
              </div>
              <div className="db-row">
                <MissingDocsCard
                  data={missingDocuments}
                  loading={loading.documents}
                  onSendReminders={handleOpenReminders}
                />
                <DocumentStatsCard data={documentStats} loading={loading.documents} />
              </div>
            </>
          )}

          {activeTab === "records" && (
            <>
              <div className="db-row">
                <EnrollmentGradeCard
                  data={enrollmentByGrade}
                  loading={loading.enrollment}
                  onViewAll={() => openModal("enrollmentGrade")}
                />
                <TransfereesCard
                  data={transferees}
                  loading={loading.records}
                  onViewAll={() => openModal("allTransferees")}
                />
              </div>
              <div className="db-row">
                <SectionCapacityCard data={sectionCapacity} loading={loading.records} />
                <EnrollmentBreakdownCard data={enrollmentBreakdown} loading={loading.records} />
              </div>
            </>
          )}

          {activeTab === "schedule" && (
            <>
              <div className="db-row">
                <CalendarCard data={calendarEvents} loading={loading.schedule} />
                <NotificationsCard data={notifications} loading={loading.notifications} />
              </div>
              <div className="db-row">
                <ComplianceChecklistCard data={complianceChecklist} loading={loading.schedule} />
                <QuickActionsCard
                  onSendReminders={handleOpenReminders}
                  onEnrollStudent={() => openModal("allApplications")}
                />
              </div>
            </>
          )}
        </main>
      </div>

      <EnrollmentGradeModal
        open={modal.enrollmentGrade}
        onClose={() => closeModal("enrollmentGrade")}
        data={enrollmentByGrade}
      />

      <AllApplicationsModal
        open={modal.allApplications}
        onClose={() => closeModal("allApplications")}
        data={pendingApplications}
        onProcess={handleOpenProcess}
      />

      <ProcessApplicationModal
        key={`proc-${modal.processApplication}-${selectedApp?.id ?? "none"}`}
        open={modal.processApplication}
        onClose={() => closeModal("processApplication")}
        application={selectedApp}
        onConfirm={handleConfirmProcess}
        loading={processingApp}
      />

      <AllTransfereesModal
        open={modal.allTransferees}
        onClose={() => closeModal("allTransferees")}
        data={transferees}
      />

      <SendRemindersModal
        key={sendRemindersKey}
        open={modal.sendReminders}
        onClose={() => closeModal("sendReminders")}
        data={missingDocuments}
        onSend={handleSendReminders}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
