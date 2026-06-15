import DashboardErrorBoundary from "../../Components/DashboardErrorBoundary";
import "../../Css/Admin/Dashboard.css";
import { AdminDashboardContent } from "./dashboard/AdminDashboardContent.jsx";

export default function Dashboard() {
  return (
    <DashboardErrorBoundary>
      <AdminDashboardContent />
    </DashboardErrorBoundary>
  );
}


