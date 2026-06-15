// src/pages/Admin/FacultyandStaff.jsx
import FacultyErrorBoundary from "../../Components/FacultyErrorBoundary";
import "../../Css/Admin/FacultyAndStaff.css";
import { FacultyandStaffPage } from "./faculty/AdminFacultySections.jsx";

export default function FacultyandStaff() {
  return (
    <FacultyErrorBoundary>
      <FacultyandStaffPage />
    </FacultyErrorBoundary>
  );
}


