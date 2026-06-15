// src/pages/Admin/Enrollment.jsx
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


