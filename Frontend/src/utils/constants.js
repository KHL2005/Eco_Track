export const ROLES = {
  CITIZEN: 'CITIZEN',
  AGENCY_OFFICER: 'AGENCY_OFFICER',
  COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
  INDUSTRY: 'INDUSTRY',
  SCIENTIST: 'SCIENTIST',
  ADMINISTRATOR: 'ADMINISTRATOR',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

export const ROLE_LABELS = {
  CITIZEN: 'Citizen',
  AGENCY_OFFICER: 'Agency Officer',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  INDUSTRY: 'Industry Representative',
  SCIENTIST: 'Environmental Scientist',
  ADMINISTRATOR: 'Administrator',
  SUPER_ADMIN: 'Super Admin',
};

export const ISSUE_TYPES = [
  'AIR_POLLUTION',
  'WATER_POLLUTION',
  'NOISE_POLLUTION',
  'DEFORESTATION',
  'WASTE_DUMPING',
  'OTHER',
];

export const ISSUE_TYPE_LABELS = {
  AIR_POLLUTION: 'Air Pollution',
  WATER_POLLUTION: 'Water Pollution',
  NOISE_POLLUTION: 'Noise Pollution',
  DEFORESTATION: 'Deforestation',
  WASTE_DUMPING: 'Waste Dumping',
  OTHER: 'Other',
};

export const ISSUE_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const RESOLUTION_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
export const SENSOR_TYPES = ['AIR', 'WATER', 'NOISE'];
export const SENSOR_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];
export const ANALYSIS_STATUSES = ['PENDING', 'REVIEWED', 'FLAGGED'];
export const EMISSION_TYPES = ['CO2', 'NOX', 'SOX', 'PARTICULATES', 'METHANE', 'OTHER'];
export const EMISSION_STATUSES = ['SUBMITTED', 'APPROVED', 'REJECTED'];

// Per-type upper bound for emission values, sourced from the scientist module's
// air-sensor reference ranges in idFormatters.js. Types without a scientist
// reference (METHANE, OTHER) are intentionally omitted — no warning is shown.
export const EMISSION_STANDARDS = {
  CO2: 1200,
  NOX: 40,
  SOX: 20,
  PARTICULATES: 50,
};
export const DOC_TYPES = ['PERMIT', 'COMPLIANCE', 'OTHERS'];
export const PROJECT_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
export const MILESTONE_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];
export const IMPACT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
export const REPORT_SCOPES = ['ISSUE', 'EMISSION', 'PROJECT'];
export const COMPLIANCE_TYPES = ['EMISSION', 'DOCUMENT', 'AUDIT', 'SAFETY', 'ENVIRONMENTAL'];
export const COMPLIANCE_RESULTS = ['COMPLIANT', 'NON_COMPLIANT', 'PARTIALLY_COMPLIANT', 'PENDING'];
export const AUDIT_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export const STATUS_COLORS = {
  // Issues
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  // Resolutions / general
  PENDING: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  // Sensor
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  // Analysis
  REVIEWED: 'bg-green-100 text-green-700',
  FLAGGED: 'bg-red-100 text-red-700',
  // Submissions
  SUBMITTED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  // Projects
  PLANNED: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
  // Milestones
  DELAYED: 'bg-red-100 text-red-700',
  // Impact
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-purple-100 text-purple-700',
  // Compliance
  COMPLIANT: 'bg-green-100 text-green-700',
  NON_COMPLIANT: 'bg-red-100 text-red-700',
  PARTIALLY_COMPLIANT: 'bg-yellow-100 text-yellow-700',
  // Audit
  SCHEDULED: 'bg-blue-100 text-blue-700',
  // Notifications
  UNREAD: 'bg-blue-100 text-blue-700',
  READ: 'bg-gray-100 text-gray-600',
  // User
  ACTIVE_USER: 'bg-green-100 text-green-700',
  INACTIVE_USER: 'bg-gray-100 text-gray-600',
};

