import { useRole } from '../../hooks/useRole';
import CitizenDashboard from './CitizenDashboard';
import ComplianceDashboard from './ComplianceDashboard';
import IndustryDashboard from './IndustryDashboard';
import ScientistDashboard from './ScientistDashboard';
import OperationsDashboard from './OperationsDashboard';

export default function DashboardPage() {
  const { role } = useRole();

  switch (role) {
    case 'CITIZEN':
      return <CitizenDashboard />;
    case 'COMPLIANCE_OFFICER':
      return <ComplianceDashboard />;
    case 'INDUSTRY':
      return <IndustryDashboard />;
    case 'SCIENTIST':
      return <ScientistDashboard />;
    case 'AGENCY_OFFICER':
    case 'ADMINISTRATOR':
    case 'SUPER_ADMIN':
    default:
      return <OperationsDashboard />;
  }
}
