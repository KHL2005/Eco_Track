import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

export function useRole() {
  const { role, user } = useAuth();

  const isAdmin = role === ROLES.ADMINISTRATOR || role === ROLES.SUPER_ADMIN;
  const isOfficer = role === ROLES.OFFICER;
  const isCitizen = role === ROLES.CITIZEN;
  const isScientist = role === ROLES.SCIENTIST;
  const isIndustry = role === ROLES.INDUSTRY;
  const isComplianceOfficer = role === ROLES.COMPLIANCE_OFFICER;

  const hasRole = (...roles) => roles.includes(role);
  const canManageIssues = isAdmin || isOfficer;
  const canManageSensors = isAdmin || isOfficer || isScientist;
  const canManageProjects = isAdmin || isOfficer;
  const canManageCompliance = isAdmin || isOfficer || isComplianceOfficer;
  const canManageEmissions = isAdmin || isOfficer || isIndustry;
  const canViewSensors = isAdmin || isOfficer || isScientist;

  return {
    role,
    user,
    isAdmin,
    isOfficer,
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

