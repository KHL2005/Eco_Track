const ROLE_PATHS = {
  SUPER_ADMIN: '/dashboard/super-admin',
  ADMINISTRATOR: '/dashboard/admin',
  AGENCY_OFFICER: '/dashboard/agency-officer',
  SCIENTIST: '/dashboard/scientist',
  INDUSTRY: '/dashboard/industry',
  CITIZEN: '/dashboard/citizen',
};

export const getDashboardPath = (role) => ROLE_PATHS[role] || '/login';

export default ROLE_PATHS;

