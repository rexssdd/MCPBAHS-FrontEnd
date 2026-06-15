import Sidebar from "../../../Components/Sidebar";
import { Toast } from "../../../Components/ui";
import {
  ApiStatusBanner,
  DeleteDlg,
  TabBar,
} from "./AdminClassSchedulingUIKit.jsx";
import {
  SectionList,
  SectionView,
  SectionForm,
  ScheduleList,
  ScheduleView,
  ScheduleForm,
  MasterTimetable,
} from "./AdminClassSchedulingBlocks.jsx";
import { useClassSchedulingPage } from "./useClassSchedulingPage.js";

export function ClassSchedulingPage() {
  const cs = useClassSchedulingPage();

  const renderContent = () => {
    if (cs.view === "viewSection") {
      return (
        <SectionView
          section={cs.activeSection}
          onBack={cs.goList}
          onEdit={(s) => {
            cs.setActiveSection(s);
            cs.setView("editSection");
          }}
        />
      );
    }
    if (cs.view === "addSection") {
      return <SectionForm isAdd sections={cs.sections} onBack={cs.goList} onSave={(form) => cs.addSection(form)} />;
    }
    if (cs.view === "editSection") {
      return (
        <SectionForm
          initial={cs.activeSection}
          sections={cs.sections}
          onBack={cs.goList}
          onSave={(form) => cs.editSection(cs.activeSection, form)}
        />
      );
    }
    if (cs.view === "viewSchedule") {
      return (
        <ScheduleView
          schedule={cs.activeSchedule}
          onBack={cs.goList}
          onEdit={(s) => {
            cs.setActiveSchedule(s);
            cs.setView("editSchedule");
          }}
        />
      );
    }
    if (cs.view === "addSchedule") {
      return (
        <ScheduleForm
          isAdd
          sections={cs.sections}
          schedules={cs.schedules}
          onBack={cs.goList}
          onSave={(form) => cs.addSchedule(form)}
        />
      );
    }
    if (cs.view === "editSchedule") {
      return (
        <ScheduleForm
          initial={cs.activeSchedule}
          sections={cs.sections}
          schedules={cs.schedules}
          onBack={cs.goList}
          onSave={(form) => cs.editSchedule(cs.activeSchedule, form)}
        />
      );
    }
    if (cs.view === "timetable") {
      return <MasterTimetable schedules={cs.schedules} onBack={cs.goList} />;
    }

    return (
      <div className="content-area">
        <div className="page-heading">
          <h1 className="page-heading__title">Scheduling and Section</h1>
          <p className="page-heading__sub">Manage the school timetables and sectioning.</p>
        </div>
        <TabBar tabs={["Sections", "Schedule"]} active={cs.mainTab} onChange={cs.setMainTab} />
        <div style={{ marginTop: 20 }}>
          {cs.mainTab === "Sections" ? (
            <>
              <ApiStatusBanner status={cs.sectionStatus} errorMsg={cs.sectionError} onRetry={cs.fetchSections} />
              <SectionList
                sections={cs.sections}
                loading={cs.sectionLoading}
                onAdd={() => cs.setView("addSection")}
                onEdit={(s) => {
                  cs.setActiveSection(s);
                  cs.setView("editSection");
                }}
                onView={(s) => {
                  cs.setActiveSection(s);
                  cs.setView("viewSection");
                }}
                onDelete={cs.delSection}
                onArchive={cs.handleArchiveSection}
              />
            </>
          ) : (
            <>
              <ApiStatusBanner status={cs.scheduleStatus} errorMsg={cs.scheduleError} onRetry={cs.fetchSchedules} />
              <ScheduleList
                schedules={cs.schedules}
                sections={cs.sections}
                loading={cs.scheduleLoading}
                onAdd={() => cs.setView("addSchedule")}
                onEdit={(s) => {
                  cs.setActiveSchedule(s);
                  cs.setView("editSchedule");
                }}
                onView={(s) => {
                  cs.setActiveSchedule(s);
                  cs.setView("viewSchedule");
                }}
                onDelete={cs.delSchedule}
                onArchive={cs.handleArchiveSchedule}
                onTimetable={() => cs.setView("timetable")}
              />
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-layout">
      <Sidebar role="admin" />
      <main id="main-content" className="page-main" style={{ display: "flex" }}>
        {renderContent()}
      </main>

      {cs.delTarget && (
        <DeleteDlg
          name={cs.delTarget.item.sectionName || cs.delTarget.item.subject}
          loading={cs.delLoading}
          onCancel={() => cs.setDelTarget(null)}
          onConfirm={cs.confirmDel}
        />
      )}
      {cs.toast && <Toast message={cs.toast} onClose={() => cs.setToast(null)} />}
    </div>
  );
}


