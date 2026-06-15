import DashboardErrorBoundary from "../../Components/DashboardErrorBoundary";
import "../../Css/Principal/PrincipalDashboard.css";
import { PrincipalDashboardContent } from "./dashboard/PrincipalDashboardContent.jsx";

export default function PrincipalDashboard() {
  return (
    <DashboardErrorBoundary>
      <PrincipalDashboardContent />
    </DashboardErrorBoundary>
  );
}
