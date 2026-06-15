// src/pages/Admin/ClassScheduling.jsx
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


