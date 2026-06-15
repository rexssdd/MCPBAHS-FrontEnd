import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import RoleProtectedRoute from "./Components/RoleProtectedRoute";
import { useAuth } from "./context/useAuth";
import ErrorBoundary from "./Components/ErrorBoundary";
import ToastContainer from "./Components/ToastNotification";
import NotFound from "./pages/NotFound";

/* ───────── ERROR BOUNDARIES ───────── */
import HomePageErrorBoundary from "./Components/HomePageErrorBoundary";
import DashboardErrorBoundary from "./Components/DashboardErrorBoundary";
import EnrollmentErrorBoundary from "./Components/EnrollmentErrorBoundary";
import EnrollmentFormErrorBoundary from "./Components/EnrollmentFormErrorBoundary";
import FacultyErrorBoundary from "./Components/FacultyErrorBoundary";
import ClassSchedulingErrorBoundary from "./Components/ClassSchedulingErrorBoundary";
import ProfileErrorBoundary from "./Components/ProfileErrorBoundary";

/* ───────── PUBLIC ───────── */
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import G7Form from "./pages/enrollment/G7Form";
import OldStudentForm from "./pages/enrollment/OldStudentForm";
import TransfereeForm from "./pages/enrollment/Transferee";
/* ───────── SHARED ───────── */
import ProfilePage from "./pages/ProfilePage";

/* ───────── ADMIN ───────── */
import Dashboard from "./pages/Admin/Dashboard";
import FacultyAndStaff from "./pages/Admin/FacultyandStaff";
import Enrollmentlist from "./pages/Admin/Enrollment";
import AdminReports from "./pages/Admin/Reports";
import UserManagement from "./pages/Admin/UserManagement";
import NotificationPage from "./pages/Admin/Notification";
import AdminAnnouncementsPage from "./pages/Admin/Announcements";
import SchedulingAndSection from "./pages/Admin/ClassScheduling";

/* ───────── PRINCIPAL ───────── */
import PrincipalDashboard from "./pages/Principal/Dashboard";
import AnnouncementsPage from "./pages/Principal/AnnouncementsPage";
import NotificationsPage from "./pages/Principal/NotificationsPage";
import ReportsPage from "./pages/Principal/ReportsPage";
import PrincipalEnrollmentPage from "./pages/Principal/Enrollment";

/* ───────── REGISTRAR ───────── */
import RegistrarDashboard from "./pages/Registrar/Dashboard";
import EnrollmentPage from "./pages/Registrar/EnrollmentPage";
import RegistrarNotificationsPage from "./pages/Registrar/Notification";
import RegistrarProfile from "./pages/Registrar/Profile";

/* ───────── TEACHER ───────── */
import TeacherDashboard from "./pages/Teacher/Dashboard";
import TeacherReportsPage from "./pages/Teacher/ReportsPage";
import TeacherClassScheduling from "./pages/Teacher/ClassScheduling";
import TeacherNotificationsPage from "./pages/Teacher/NotificationsPage";
import TeacherProfilePage from "./pages/Teacher/ProfilePage";

export default function App() {
  const { auth } = useAuth();
  const currentUserRole = auth?.isAuthenticated ? auth.role : null;

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {/* Skip-to-content for keyboard/screen reader users */}
        <a href="#main-content" className="skip-to-content">Skip to main content</a>
        <ToastContainer />
        <Routes>

        {/* ───────── PUBLIC ───────── */}
        <Route path="/" element={<HomePageErrorBoundary><HomePage /></HomePageErrorBoundary>} />
        <Route path="/login" element={<LoginPage />} />

        {/* ───────── PUBLIC ENROLLMENT FORMS ───────── */}
        <Route path="/g7-form"          element={<EnrollmentFormErrorBoundary><G7Form /></EnrollmentFormErrorBoundary>} />
        <Route path="/old-student-form" element={<EnrollmentFormErrorBoundary><OldStudentForm /></EnrollmentFormErrorBoundary>} />
        <Route path="/transferee-form"  element={<EnrollmentFormErrorBoundary><TransfereeForm /></EnrollmentFormErrorBoundary>} />

        {/* ───────── SHARED PROFILE ───────── */}
        <Route
          path="/view-profile"
          element={
            <RoleProtectedRoute
              userRole={currentUserRole}
              allowedRoles={["admin", "principal", "registrar", "teacher"]}
            >
              <ProfileErrorBoundary>
                <ProfilePage role={currentUserRole} />
              </ProfileErrorBoundary>
            </RoleProtectedRoute>
          }
        />

        {/* ───────── ADMIN ROUTES ───────── */}
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute userRole={currentUserRole} allowedRoles={["admin"]}>
              <Outlet />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"        element={<DashboardErrorBoundary><Dashboard /></DashboardErrorBoundary>} />
          <Route path="faculty-and-staff" element={<FacultyErrorBoundary><FacultyAndStaff /></FacultyErrorBoundary>} />
          <Route path="enrollmentlist"   element={<EnrollmentErrorBoundary><Enrollmentlist /></EnrollmentErrorBoundary>} />
          <Route path="reports"          element={<DashboardErrorBoundary><AdminReports /></DashboardErrorBoundary>} />
          <Route path="usermanagement"   element={<DashboardErrorBoundary><UserManagement /></DashboardErrorBoundary>} />
          <Route path="announcements"    element={<DashboardErrorBoundary><AdminAnnouncementsPage /></DashboardErrorBoundary>} />
          <Route path="notifications"    element={<DashboardErrorBoundary><NotificationPage /></DashboardErrorBoundary>} />
          <Route path="scheduling"       element={<ClassSchedulingErrorBoundary><SchedulingAndSection /></ClassSchedulingErrorBoundary>} />
        </Route>

        {/* ───────── PRINCIPAL ROUTES ───────── */}
        <Route
          path="/principal"
          element={
            <RoleProtectedRoute userRole={currentUserRole} allowedRoles={["principal"]}>
              <Outlet />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"     element={<DashboardErrorBoundary><PrincipalDashboard /></DashboardErrorBoundary>} />
          <Route path="announcements" element={<DashboardErrorBoundary><AnnouncementsPage /></DashboardErrorBoundary>} />
          <Route path="notifications" element={<DashboardErrorBoundary><NotificationsPage /></DashboardErrorBoundary>} />
          <Route path="reports"       element={<DashboardErrorBoundary><ReportsPage /></DashboardErrorBoundary>} />
          <Route path="enrollmentlist" element={<EnrollmentErrorBoundary><PrincipalEnrollmentPage /></EnrollmentErrorBoundary>} />
        </Route>

        {/* ───────── REGISTRAR ROUTES ───────── */}
        <Route
          path="/registrar"
          element={
            <RoleProtectedRoute
              userRole={currentUserRole}
              allowedRoles={["registrar", "admin"]}
            >
              <Outlet />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"     element={<DashboardErrorBoundary><RegistrarDashboard /></DashboardErrorBoundary>} />
          <Route path="enrollment"    element={<EnrollmentErrorBoundary><EnrollmentPage /></EnrollmentErrorBoundary>} />
          <Route path="notifications" element={<DashboardErrorBoundary><RegistrarNotificationsPage /></DashboardErrorBoundary>} />
          <Route path="profile"       element={<ProfileErrorBoundary><RegistrarProfile /></ProfileErrorBoundary>} />
        </Route>

        {/* ───────── TEACHER ROUTES ───────── */}
        <Route
          path="/teacher"
          element={
            <RoleProtectedRoute userRole={currentUserRole} allowedRoles={["teacher"]}>
              <Outlet />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"     element={<DashboardErrorBoundary><TeacherDashboard /></DashboardErrorBoundary>} />
          <Route path="reports"       element={<DashboardErrorBoundary><TeacherReportsPage /></DashboardErrorBoundary>} />
          <Route path="scheduling"    element={<ClassSchedulingErrorBoundary><TeacherClassScheduling /></ClassSchedulingErrorBoundary>} />
          <Route path="notifications" element={<DashboardErrorBoundary><TeacherNotificationsPage /></DashboardErrorBoundary>} />
          <Route path="profile"       element={<ProfileErrorBoundary><TeacherProfilePage /></ProfileErrorBoundary>} />
        </Route>

        {/* ───────── 404 ───────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}