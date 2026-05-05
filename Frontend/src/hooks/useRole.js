import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

export function useRole() {
  const { role, user } = useAuth();

  const isAdmin = role === ROLES.ADMINISTRATOR || role === ROLES.SUPER_ADMIN;
  const isAgencyOfficer = role === ROLES.AGENCY_OFFICER;
  const isCitizen = role === ROLES.CITIZEN;
  const isScientist = role === ROLES.SCIENTIST;
  const isIndustry = role === ROLES.INDUSTRY;
  const isComplianceOfficer = role === ROLES.COMPLIANCE_OFFICER;

  const hasRole = (...roles) => roles.includes(role);
  const canManageIssues = isAdmin || isAgencyOfficer;
  const canManageSensors = isAdmin || isAgencyOfficer || isScientist;
  const canManageProjects = isAdmin || isAgencyOfficer;
  const canManageCompliance = isAdmin || isComplianceOfficer;
  const canManageEmissions = isAdmin || isComplianceOfficer || isIndustry;
  const canViewSensors = isAdmin || isAgencyOfficer || isScientist;

  return {
    role,
    user,
    isAdmin,
    isAgencyOfficer,
    isCitizen,
    isScientist,
    isIndustry,
    isComplianceOfficer,
    hasRole,
    canManageIssues,
    canManageSensors,
    canManageProjects,
    canManageCompliance,
    canManageEmissions,
    canViewSensors,
  };
}
