/**
 * @file JSDoc typedef definitions for all EcoTrack DTOs.
 * These act as "types" for editors (autocomplete, hover docs) without TypeScript.
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} token
 * @property {number} userId
 * @property {string} name
 * @property {string} email
 * @property {string} role
 */

/**
 * @typedef {Object} UserResponse
 * @property {number} userId
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {'CITIZEN'|'AGENCY_OFFICER'|'COMPLIANCE_OFFICER'|'INDUSTRY'|'SCIENTIST'|'ADMINISTRATOR'|'SUPER_ADMIN'} role
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {string} createdAt
 */

/**
 * @typedef {Object} NotificationResponse
 * @property {number} notificationId
 * @property {number} userId
 * @property {number} entityId
 * @property {string} message
 * @property {'ISSUE'|'EMISSION'|'PROJECT'|'COMPLIANCE'} category
 * @property {'UNREAD'|'READ'|'ARCHIVED'} status
 * @property {string} createdDate
 */

/**
 * @typedef {Object} IssueResponse
 * @property {number} id
 * @property {number} citizenId
 * @property {string} citizenName
 * @property {string} title
 * @property {string} description
 * @property {'AIR_POLLUTION'|'WATER_POLLUTION'|'NOISE'|'DEFORESTATION'|'WASTE_DUMPING'|'OTHER'} type
 * @property {'OPEN'|'IN_PROGRESS'|'RESOLVED'|'CLOSED'} status
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} location
 * @property {string[]} mediaUrls
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} ResolutionResponse
 * @property {number} id
 * @property {number} issueId
 * @property {number} officerId
 * @property {string} officerName
 * @property {string} actions
 * @property {'PENDING'|'IN_PROGRESS'|'COMPLETED'} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} SensorResponse
 * @property {number} id
 * @property {string} name
 * @property {'AIR'|'WATER'|'NOISE'|'SOIL'} type
 * @property {'ACTIVE'|'INACTIVE'|'MAINTENANCE'} status
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} location
 * @property {string} installedAt
 */

/**
 * @typedef {Object} SensorDataResponse
 * @property {number} id
 * @property {number} sensorId
 * @property {string} sensorName
 * @property {number} value
 * @property {string} unit
 * @property {string} recordedAt
 * @property {string} notes
 */

/**
 * @typedef {Object} AnalysisResponse
 * @property {number} id
 * @property {number} dataId
 * @property {number} scientistId
 * @property {string} scientistName
 * @property {'PENDING'|'REVIEWED'|'FLAGGED'} status
 * @property {string} findings
 * @property {string} createdAt
 */

/**
 * @typedef {Object} EmissionLogResponse
 * @property {number} id
 * @property {number} industryId
 * @property {string} industryName
 * @property {'CO2'|'NOX'|'SOX'|'PARTICULATES'|'METHANE'|'OTHER'} emissionType
 * @property {number} value
 * @property {string} unit
 * @property {'SUBMITTED'|'APPROVED'|'REJECTED'} status
 * @property {string} recordedAt
 * @property {string} notes
 */

/**
 * @typedef {Object} IndustryDocumentResponse
 * @property {number} id
 * @property {number} industryId
 * @property {string} industryName
 * @property {'PERMIT'|'COMPLIANCE'|'OTHERS'} docType
 * @property {string} description
 * @property {string} fileName
 * @property {string} fileUri
 * @property {'SUBMITTED'|'APPROVED'|'REJECTED'} verificationStatus
 * @property {string} uploadedAt
 */

/**
 * @typedef {Object} ProjectResponse
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {'PLANNED'|'IN_PROGRESS'|'COMPLETED'|'ON_HOLD'|'CANCELLED'} status
 * @property {string} startDate
 * @property {string} endDate
 * @property {number} budget
 * @property {string} managerName
 * @property {string} createdAt
 */

/**
 * @typedef {Object} MilestoneResponse
 * @property {number} id
 * @property {number} projectId
 * @property {string} title
 * @property {string} description
 * @property {'PENDING'|'IN_PROGRESS'|'COMPLETED'|'DELAYED'} status
 * @property {string} dueDate
 * @property {string} completedAt
 */

/**
 * @typedef {Object} ImpactResponse
 * @property {number} id
 * @property {number} projectId
 * @property {'DRAFT'|'PUBLISHED'|'ARCHIVED'} status
 * @property {number} treesPlanted
 * @property {number} co2ReducedTons
 * @property {number} waterSavedLiters
 * @property {number} areaRestoredSqm
 * @property {number} beneficiariesCount
 * @property {Object} customMetrics
 */

/**
 * @typedef {Object} ReportResponse
 * @property {number} id
 * @property {string} title
 * @property {'ISSUE'|'EMISSION'|'PROJECT'} scope
 * @property {string} description
 * @property {string} generatedBy
 * @property {string} generatedAt
 * @property {string} content
 */

/**
 * @typedef {Object} ComplianceRecordResponse
 * @property {number} id
 * @property {number} entityId
 * @property {string} entityName
 * @property {'INDUSTRY'|'PROJECT'|'POLICY'} type
 * @property {'COMPLIANT'|'NON_COMPLIANT'|'PENDING'} result
 * @property {string} notes
 * @property {string} recordedAt
 */

/**
 * @typedef {Object} AuditResponse
 * @property {number} id
 * @property {number} entityId
 * @property {string} entityName
 * @property {number} officerId
 * @property {string} officerName
 * @property {'SCHEDULED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED'} status
 * @property {string} findings
 * @property {string} scheduledDate
 * @property {string} completedAt
 */

