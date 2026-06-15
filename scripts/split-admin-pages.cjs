const fs = require("fs");
const path = require("path");

const admin = path.join(__dirname, "../src/pages/Admin");

function readLines(rel) {
  return fs.readFileSync(path.join(admin, rel), "utf8").split(/\r?\n/);
}
function slice(lines, a, b) {
  return lines.slice(a - 1, b).join("\n");
}
function write(rel, body) {
  const p = path.join(admin, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body.endsWith("\n") ? body : `${body}\n`);
}

/* Enrollment */
const en = readLines("Enrollment.jsx");
write(
  "enrollment/adminEnrollmentConstants.js",
  slice(en, 15, 42).replace(/^const /gm, "export const "),
);
write(
  "enrollment/AdminEnrollmentSections.jsx",
  `import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../../components/Sidebar";
import { Toast, ConfirmModal, Modal, ModalHeader, ModalBody, ModalFooter,
         Breadcrumb, Pagination, SearchInput, DataTable, FormInput, FormSelect,
         InfoCard, InfoField, Badge } from "../../../components/ui";
import * as enrollmentService from "../../../services/Admin/Enrollment/enrollmentService";
import { validateEnrollees, validateEnrollee, getEnrolleeName, getEnrolleeGrade, getEnrolleeStatus } from "../../../utils/enrollmentValidation";
import {
  GRADE_LEVELS, SCHOOL_TYPES, PALETTE, PAGE_SIZE, getInitials, getAvatarBg,
  EMPTY_FORM,
} from "./adminEnrollmentConstants.js";

${slice(en, 47, 510).replace(/^function /gm, "export function ")}`,
);
write(
  "enrollment/EnrollmentAdminContent.jsx",
  `import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../../components/Sidebar";
import { Toast } from "../../../components/ui";
import * as enrollmentService from "../../../services/Admin/Enrollment/enrollmentService";
import { validateEnrollees, validateEnrollee } from "../../../utils/enrollmentValidation";
import {
  GRADE_LEVELS, PAGE_SIZE, generateDefaultEnrollees, EMPTY_FORM,
} from "./adminEnrollmentConstants.js";
import {
  ApiStatusBanner, SkeletonRows, SkeletonView, EnrolleeView, EnrolleeForm, EnrolleeList,
} from "./AdminEnrollmentSections.jsx";

${slice(en, 515, 800).replace(/^function EnrollmentAdminContent/, "export function EnrollmentAdminContent")}`,
);
write(
  "Enrollment.jsx",
  `// src/pages/Admin/Enrollment.jsx
import EnrollmentErrorBoundary from "../../Components/EnrollmentErrorBoundary";
import "../../Css/Admin/Enrollment.css";
import { EnrollmentAdminContent } from "./enrollment/EnrollmentAdminContent.jsx";

export default function EnrollmentAdmin() {
  return (
    <EnrollmentErrorBoundary>
      <EnrollmentAdminContent />
    </EnrollmentErrorBoundary>
  );
}
`,
);

/* Faculty */
const fa = readLines("FacultyandStaff.jsx");
const facConst = slice(fa, 16, 54).replace(/^const /gm, "export const ");
write("faculty/adminFacultyConstants.js", facConst);
write(
  "faculty/AdminFacultySections.jsx",
  `import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../../components/Sidebar";
import { Toast, ConfirmModal, Modal, ModalHeader, ModalBody, ModalFooter,
         Breadcrumb, Pagination, SearchInput, DataTable, FormInput, FormSelect,
         InfoCard, InfoField, Badge } from "../../../components/ui";
import * as facultyService from "../../../services/Admin/FacultyAndStaff/facultyAndStaffService";
import { validateFacultyList, validateFaculty, sanitizeFaculty, getFacultyFullName, getFacultyRole, getFacultyCity } from "../../../utils/facultyValidation";
import {
  USE_API, PALETTE, STATUSES, ROLES_LIST, getAvatarBg, getInitials, MOCK_FACULTY, EMPTY_FORM, validateFacultyForm,
} from "./adminFacultyConstants.js";

${slice(fa, 59, 818).replace(/^function /gm, "export function ")}`,
);
write(
  "FacultyandStaff.jsx",
  `// src/pages/Admin/FacultyandStaff.jsx
import FacultyErrorBoundary from "../../Components/FacultyErrorBoundary";
import "../../Css/Admin/FacultyandStaff.css";
import { FacultyandStaffPage } from "./faculty/AdminFacultySections.jsx";

export default function FacultyandStaff() {
  return (
    <FacultyErrorBoundary>
      <FacultyandStaffPage />
    </FacultyErrorBoundary>
  );
}
`,
);

/* Notification */
const no = readLines("Notification.jsx");
const dataBlock = slice(no, 13, 152);
write(
  "notification/adminNotificationData.js",
  `import apiClient from "../../../services/Admin/apiClient";

${dataBlock
  .replace(/^function normalize/gm, "export function normalize")
  .replace(/^const /gm, "export const ")}`,
);

write(
  "notification/AdminNotificationIcons.jsx",
  slice(no, 157, 237).replace(/^const /gm, "export const "),
);
write(
  "notification/AdminNotificationSections.jsx",
  `import { useState, useEffect, useRef, useCallback } from "react";
import { isPastDate, validateFileList, validateTextField } from "../../../utils/inputValidation";
import {
  MOCK_NOTIFICATIONS,
  MOCK_ANNOUNCEMENTS,
  GROUP_ORDER,
  DEFAULT_DETAIL,
  PRIORITY_OPTIONS,
  AUDIENCE_OPTIONS,
  EMPTY_ANNOUNCEMENT_FORM,
  normalizeNotification,
  normalizeNotifications,
  normalizeAnnouncement,
  normalizeAnnouncements,
  announcementService,
} from "./adminNotificationData.js";
import {
  BellIcon,
  EyeIcon,
  CheckIcon,
  TrashIcon,
  ArrowIcon,
  AlertIcon,
  CloseIcon,
  MegaphoneIcon,
  PlusIcon,
  EditIcon,
  SendIcon,
  PaperclipIcon,
  RefreshIcon,
  XCircleIcon,
} from "./AdminNotificationIcons.jsx";

${slice(no, 242, 707).replace(/^function /gm, "export function ")}`,
);
write(
  "notification/AdminNotificationPage.jsx",
  `import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import notificationService from "../../../services/Admin/Notification/notificationService";
import {
  MOCK_NOTIFICATIONS,
  MOCK_ANNOUNCEMENTS,
  GROUP_ORDER,
  normalizeNotifications,
  normalizeAnnouncements,
  announcementService,
} from "./adminNotificationData.js";
import {
  ErrorBanner,
  DetailModal,
  AnnouncementFormModal,
  DeleteConfirmModal,
  PublishModal,
  NotifItem,
  AnnouncementCard,
} from "./AdminNotificationSections.jsx";
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  MegaphoneIcon,
  PlusIcon,
} from "./AdminNotificationIcons.jsx";

${slice(no, 712, 1223)}`,
);
write(
  "Notification.jsx",
  `// src/pages/Admin/Notification.jsx
import "../../Css/Admin/Notification.css";
import NotificationPage from "./notification/AdminNotificationPage.jsx";

export default NotificationPage;
`,
);

/* ClassScheduling */
const cs = readLines("ClassScheduling.jsx");
write(
  "classScheduling/adminClassSchedulingConstants.js",
  slice(cs, 16, 55).replace(/^const /gm, "export const "),
);
write(
  "classScheduling/adminClassSchedulingTimetable.js",
  slice(cs, 648, 652)
    .replace(/^const /gm, "export const ")
    .replace(/;const HOURS=/, ";\nexport const HOURS="),
);
write(
  "classScheduling/AdminClassSchedulingUIKit.jsx",
  `import { useState, useEffect, useCallback, useRef } from "react";
import { PAGE_SIZE } from "./adminClassSchedulingConstants.js";

${slice(cs, 61, 271).replace(/^const /gm, "export const ")}`,
);
write(
  "classScheduling/AdminClassSchedulingBlocks.jsx",
  `import { useState, useEffect, useCallback, useRef } from "react";
import {
  DEFAULT_SECTIONS, DEFAULT_SCHEDULES, STUDENT_ROSTER, TEACHERS, SUBJECTS, GRADE_LEVELS, SECTION_NAMES, TIMESLOTS, PAGE_SIZE,
} from "./adminClassSchedulingConstants.js";
import {
  SUB_COLORS, getC, DAYS, HOURS, fmtH, parseSlot,
} from "./adminClassSchedulingTimetable.js";
import {
  ApiStatusBanner, SkeletonRow, SkeletonTable, Ico, Checkbox, TabBar, CardTitle, Field, Err, SelectF, Pager, Overlay, DeleteDlg, PreviewDlg, Breadcrumb,
} from "./AdminClassSchedulingUIKit.jsx";

${(slice(cs, 276, 646) + "\n" + slice(cs, 654, 712)).replace(/^const /gm, "export const ")}`,
);
write(
  "classScheduling/ClassSchedulingPage.jsx",
  `import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../../components/Sidebar";
import { Toast } from "../../../components/ui";
import * as schedulingService from "../../../services/Admin/ClassScheduling/schedulingService";
import {
  validateSections, validateSchedules, sanitizeSection, sanitizeSchedule,
} from "../../../utils/schedulingValidation";
import {
  DEFAULT_SECTIONS, DEFAULT_SCHEDULES,
} from "./adminClassSchedulingConstants.js";
import {
  ApiStatusBanner, Ico, Overlay, DeleteDlg,
} from "./AdminClassSchedulingUIKit.jsx";
import {
  SectionList, SectionView, SectionForm, ScheduleList, ScheduleView, ScheduleForm, MasterTimetable,
} from "./AdminClassSchedulingBlocks.jsx";

${slice(cs, 717, 1061).replace(/^function ClassSchedulingPage/, "export function ClassSchedulingPage")}`,
);
write(
  "ClassScheduling.jsx",
  `// src/pages/Admin/ClassScheduling.jsx
import ClassSchedulingErrorBoundary from "../../Components/ClassSchedulingErrorBoundary";
import "../../Css/Admin/ClassScheduling.css";
import { ClassSchedulingPage } from "./classScheduling/ClassSchedulingPage.jsx";

export default function ClassScheduling() {
  return (
    <ClassSchedulingErrorBoundary>
      <ClassSchedulingPage />
    </ClassSchedulingErrorBoundary>
  );
}
`,
);

/* Reports */
const rp = readLines("Reports.jsx");
const constPart = slice(rp, 29, 80);
const subjectsLine = rp[251]; // 0-indexed line 252
write(
  "reports/adminReportsConstants.js",
  `${constPart.replace(/^const /gm, "export const ")}\nexport const ${subjectsLine.replace(/^const SUBJECTS = /, "")}`,
);
write(
  "reports/AdminReportsIcons.jsx",
  slice(rp, 85, 110).replace(/^const /gm, "export const "),
);
const docBody = slice(rp, 115, 302);
write(
  "reports/AdminReportsDocumentKit.jsx",
  `import { LEARNERS, SUBJECTS } from "./adminReportsConstants.js";
import { IWifi, IWifiOff, IDatabase, IRefresh, IBChev } from "./AdminReportsIcons.jsx";
${docBody.replace(/^const SUBJECTS = .*$/m, "").replace(/^const /gm, "export const ")}`,
);
write(
  "reports/AdminReportsSubpages.jsx",
  `import { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../../../components/Sidebar";
import reportsService from "../../../services/Admin/Reports/reportService";
import { validateFileList, validateSchoolYearField, validateTextField } from "../../../utils/inputValidation";
import { SF_INFO, MOCK_REPORTS, PAGE_SIZE } from "./adminReportsConstants.js";
import {
  ISearch, IFilter, ISort, IChevL, IChevR, IBChev, ICancel, ICheck, IInfo, IClose, IDisapprove, IApprove, ISubmitDoc, IEvaluate, IDownload, IDelete, IArchive, IRefresh, IUploadDoc, IBadge, IForward, IEye, IX, IWifi, IWifiOff, IDatabase,
} from "./AdminReportsIcons.jsx";
import {
  ApiStatusBar, SkeletonRow, SkeletonTable, SkeletonPreviewPanel, Checkbox, Toast, STATUS_MAP, StatusBadge, Breadcrumb, DocHeader, MetaRow,
  SF1View, SF2View, SF3View, SF4View, SF5View, SF6View, SF7View, SF8View, SF9View, SF10View, SFDocument,
} from "./AdminReportsDocumentKit.jsx";

${slice(rp, 307, 742).replace(/^const /gm, "export const ")}`,
);
write(
  "Reports.jsx",
  `${slice(rp, 1, 18)}
import { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import "../../Css/Admin/Reports.css";
import reportsService from "../../services/Admin/Reports/reportService";
import { SF_INFO, MOCK_REPORTS, PAGE_SIZE } from "./reports/adminReportsConstants.js";
import {
  PreviewPanel, ConfirmModal, SubmitReport, ViewReportPage, EvaluatePage,
} from "./reports/AdminReportsSubpages.jsx";
import {
  ISearch, IFilter, ISort, IChevL, IChevR, ICancel, IDelete, IArchive, IRefresh, ISubmitDoc, IEvaluate, IEye, IDownload,
} from "./reports/AdminReportsIcons.jsx";
import {
  ApiStatusBar, SkeletonTable, Checkbox, Toast, StatusBadge,
} from "./reports/AdminReportsDocumentKit.jsx";

${slice(rp, 747, 1157)}`,
);

console.log("split-admin-pages.cjs done");
