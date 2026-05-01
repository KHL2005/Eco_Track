# EcoTrack API Inventory

> All requests route through the **API Gateway** at `http://localhost:8090`  
> Authentication: **JWT Bearer Token** — header `Authorization: Bearer <token>`  
> JWT is returned by `/api/v1/auth/login` and `/api/v1/auth/register`

---

## 1. Authentication (IAM Service — port 8081)

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/v1/auth/register` | ❌ Public | `{name, email, password, phone, role?}` | `{token, userId, name, email, role}` |
| POST | `/api/v1/auth/login` | ❌ Public | `{email, password}` | `{token, userId, name, email, role}` |

**Roles:** `CITIZEN` · `OFFICER` · `INDUSTRY` · `SCIENTIST` · `COMPLIANCE_OFFICER` · `ADMINISTRATOR` · `SUPER_ADMIN`

---

## 2. User Management (IAM Service — port 8081)

| Method | Path | Auth/Role | Body / Params | Response |
|--------|------|-----------|---------------|----------|
| POST | `/api/v1/users` | SUPER_ADMIN / ADMINISTRATOR | `{name,email,password,phone,role}` + header `X-User-Role` | `UserResponse` |
| GET | `/api/v1/users` | SUPER_ADMIN / ADMINISTRATOR | — | `UserResponse[]` |
| GET | `/api/v1/users/{id}` | Any authenticated | — | `UserResponse` |
| GET | `/api/v1/users/role/{role}` | SUPER_ADMIN / ADMINISTRATOR | path: role | `UserResponse[]` |
| PUT | `/api/v1/users/{id}` | SUPER_ADMIN / ADMINISTRATOR | `{name, phone, status}` | `UserResponse` |
| DELETE | `/api/v1/users/{id}` | SUPER_ADMIN / ADMINISTRATOR | — | `204` |
| PUT | `/api/v1/users/change-password` | Any authenticated | `{currentPassword, newPassword}` | `"Password changed successfully"` |

**UserResponse:** `{ userId, name, email, phone, role, status (ACTIVE/INACTIVE), createdAt }`

---

## 3. Notifications (IAM Service — port 8081)

| Method | Path | Auth | Body / Params | Response |
|--------|------|------|---------------|----------|
| POST | `/api/v1/notifications` | Authenticated | `{userId, entityId, message, category}` | `NotificationResponse` |
| GET | `/api/v1/notifications` | Authenticated | — | `NotificationResponse[]` |
| GET | `/api/v1/notifications/user/{userId}` | Authenticated | — | `NotificationResponse[]` |
| GET | `/api/v1/notifications/user/{userId}/unread` | Authenticated | — | `NotificationResponse[]` |
| PATCH | `/api/v1/notifications/{id}/read` | Authenticated | — | `NotificationResponse` |
| PATCH | `/api/v1/notifications/{id}/archive` | Authenticated | — | `NotificationResponse` |
| PATCH | `/api/v1/notifications/user/{userId}/read-all` | Authenticated | — | `200` |
| DELETE | `/api/v1/notifications/{id}` | Authenticated | — | `204` |

**NotificationResponse:** `{ notificationId, userId, entityId, message, category (ISSUE/EMISSION/PROJECT/COMPLIANCE), status (UNREAD/READ/ARCHIVED), createdDate }`

---

## 4. Issues — Citizen Reporting (port 8083)

| Method | Path | Auth/Role | Body / Params | Response |
|--------|------|-----------|---------------|----------|
| POST | `/api/v1/issues` | CITIZEN / OFFICER / ADMIN | `IssueRequest` | `IssueResponse` |
| GET | `/api/v1/issues` | Public | — | `IssueResponse[]` |
| GET | `/api/v1/issues/{id}` | Public | — | `IssueResponse` |
| GET | `/api/v1/issues/citizen/{citizenId}` | Public | — | `IssueResponse[]` |
| GET | `/api/v1/issues/status/{status}` | Public | status: OPEN/IN_PROGRESS/RESOLVED/CLOSED | `IssueResponse[]` |
| GET | `/api/v1/issues/type/{type}` | Public | type: AIR_POLLUTION/WATER_POLLUTION/NOISE/DEFORESTATION/WASTE_DUMPING/OTHER | `IssueResponse[]` |
| PATCH | `/api/v1/issues/{id}` | CITIZEN / OFFICER / ADMIN | `IssueRequest` (partial) | `IssueResponse` |
| PATCH | `/api/v1/issues/{id}/status` | OFFICER / ADMIN | `{status}` | `IssueResponse` |
| DELETE | `/api/v1/issues/{id}` | OFFICER / ADMIN | — | `204` |
| POST | `/api/v1/issues/{id}/media` | Authenticated | `multipart/form-data` field: `file` | `IssueResponse` |
| GET | `/api/v1/issues/{id}/media/{fileName}` | Public | — | Binary stream |
| DELETE | `/api/v1/issues/{id}/media/{fileName}` | CITIZEN / OFFICER / ADMIN | — | `IssueResponse` |
| POST | `/api/v1/issues/{issueId}/resolutions` | OFFICER / ADMIN | `ResolutionRequest` | `ResolutionResponse` |
| GET | `/api/v1/issues/{issueId}/resolutions` | Public | — | `ResolutionResponse` |
| GET | `/api/v1/issues/resolutions` | Public | — | `ResolutionResponse[]` |
| GET | `/api/v1/issues/resolutions/{resolutionId}` | Public | — | `ResolutionResponse` |
| GET | `/api/v1/issues/resolutions/officer/{officerId}` | Public | — | `ResolutionResponse[]` |
| GET | `/api/v1/issues/resolutions/status/{status}` | Public | status: PENDING/IN_PROGRESS/COMPLETED | `ResolutionResponse[]` |
| PATCH | `/api/v1/issues/resolutions/{resolutionId}` | OFFICER / ADMIN | `{status, actions}` | `ResolutionResponse` |
| DELETE | `/api/v1/issues/resolutions/{resolutionId}` | OFFICER / ADMIN | — | `204` |

**IssueRequest:** `{ citizenId, citizenName, title, description, type, latitude, longitude, location }`  
**IssueResponse:** `{ id, citizenId, citizenName, title, description, type, status, latitude, longitude, location, mediaUrls[], createdAt, updatedAt }`  
**ResolutionRequest:** `{ issueId, officerId, officerName, actions }`  
**ResolutionResponse:** `{ id, issueId, officerId, officerName, actions, status, createdAt, updatedAt }`

---

## 5. Sensors & Monitoring (Environmental Monitoring Service — port 8084)

| Method | Path | Auth/Role | Body / Params | Response |
|--------|------|-----------|---------------|----------|
| POST | `/api/v1/sensors` | OFFICER / SCIENTIST / ADMIN | `SensorRequest` | `SensorResponse` |
| GET | `/api/v1/sensors` | OFFICER / SCIENTIST / ADMIN | — | `SensorResponse[]` |
| GET | `/api/v1/sensors/{id}` | OFFICER / SCIENTIST / ADMIN | — | `SensorResponse` |
| PATCH | `/api/v1/sensors/{id}/status` | OFFICER / ADMIN | query: `status=ACTIVE\|INACTIVE\|MAINTENANCE` | `SensorResponse` |
| DELETE | `/api/v1/sensors/{id}` | OFFICER / ADMIN | — | `204` |
| POST | `/api/v1/sensor-data` | OFFICER / SCIENTIST / ADMIN | `SensorDataRequest` | `SensorDataResponse` |
| GET | `/api/v1/sensor-data` | OFFICER / SCIENTIST / ADMIN | — | `SensorDataResponse[]` |
| GET | `/api/v1/sensor-data/{dataId}` | OFFICER / SCIENTIST / ADMIN | — | `SensorDataResponse` |
| GET | `/api/v1/sensor-data/sensor/{sensorId}` | OFFICER / SCIENTIST / ADMIN | — | `SensorDataResponse[]` |
| DELETE | `/api/v1/sensor-data/{dataId}` | OFFICER / ADMIN | — | `204` |
| POST | `/api/v1/upload-csv` | OFFICER / SCIENTIST / ADMIN | `multipart/form-data`: file, sensorId, sensorType | `CsvUploadResponse` |
| POST | `/api/v1/analysis` | OFFICER / SCIENTIST / ADMIN | `AnalysisRequest` | `AnalysisResponse` |
| GET | `/api/v1/analysis` | OFFICER / SCIENTIST / ADMIN | — | `AnalysisResponse[]` |
| GET | `/api/v1/analysis/{id}` | OFFICER / SCIENTIST / ADMIN | — | `AnalysisResponse` |
| GET | `/api/v1/analysis/data/{dataId}` | OFFICER / SCIENTIST / ADMIN | — | `AnalysisResponse[]` |
| GET | `/api/v1/analysis/scientist/{scientistId}` | OFFICER / SCIENTIST / ADMIN | — | `AnalysisResponse[]` |
| PATCH | `/api/v1/analysis/{id}/review` | SCIENTIST / ADMIN | query: `status`, `findings`; headers: `X-User-Id`, `X-User-Role` | `AnalysisResponse` |
| DELETE | `/api/v1/analysis/{id}` | OFFICER / ADMIN | — | `204` |

**SensorRequest:** `{ name, type (AIR/WATER/NOISE/SOIL), latitude, longitude, location }`  
**SensorResponse:** `{ id, name, type, status (ACTIVE/INACTIVE/MAINTENANCE), latitude, longitude, location, installedAt }`  
**SensorDataRequest:** `{ sensorId, value, unit, recordedAt, notes }`  
**SensorDataResponse:** `{ id, sensorId, sensorName, value, unit, recordedAt, notes }`  
**AnalysisRequest:** `{ dataId, scientistId, findings }`  
**AnalysisResponse:** `{ id, dataId, scientistId, scientistName, status (PENDING/REVIEWED/FLAGGED), findings, createdAt }`

---

## 6. Emissions & Industry Documents (Industry Compliance Service — port 8085)

| Method | Path | Auth/Role | Body / Params | Response |
|--------|------|-----------|---------------|----------|
| POST | `/api/v1/emissions` | INDUSTRY / ADMIN | `EmissionLogRequest` | `EmissionLogResponse` |
| GET | `/api/v1/emissions` | Public | — | `EmissionLogResponse[]` |
| GET | `/api/v1/emissions/{id}` | Public | — | `EmissionLogResponse` |
| GET | `/api/v1/emissions/industry` | Public | query: `industryName` | `EmissionLogResponse[]` |
| PATCH | `/api/v1/emissions/{id}/status` | OFFICER / ADMIN | query: `status=SUBMITTED\|APPROVED\|REJECTED` | `EmissionLogResponse` |
| DELETE | `/api/v1/emissions/{id}` | INDUSTRY / ADMIN | — | `204` |
| POST | `/api/v1/industry-documents` | INDUSTRY / ADMIN | `multipart/form-data`: industryId, industryName, docType, description?, file (PDF ≤10 MB) | `IndustryDocumentResponse` |
| GET | `/api/v1/industry-documents` | Public | — | `IndustryDocumentResponse[]` |
| GET | `/api/v1/industry-documents/{docId}` | Public | `?view=true` for PDF inline, `?download=true` to save | JSON or PDF |
| GET | `/api/v1/industry-documents/industry` | Public | query: `industryName` | `IndustryDocumentResponse[]` |
| PATCH | `/api/v1/industry-documents/{docId}/verify` | OFFICER / ADMIN | query: `status=SUBMITTED\|APPROVED\|REJECTED` | `IndustryDocumentResponse` |
| DELETE | `/api/v1/industry-documents/{docId}` | INDUSTRY / ADMIN | — | `204` |

**EmissionLogRequest:** `{ industryId, industryName, emissionType (CO2/NOX/SOX/PARTICULATES/METHANE/OTHER), value, unit, notes }`  
**EmissionLogResponse:** `{ id, industryId, industryName, emissionType, value, unit, status (SUBMITTED/APPROVED/REJECTED), recordedAt, notes }`  
**IndustryDocumentResponse:** `{ id, industryId, industryName, docType (PERMIT/COMPLIANCE/OTHERS), description, fileName, fileUri, verificationStatus (SUBMITTED/APPROVED/REJECTED), uploadedAt }`

---

## 7. Sustainability Projects (Project Management Service — port 8086)

| Method | Path | Auth/Role | Body / Params | Response |
|--------|------|-----------|---------------|----------|
| POST | `/api/v1/projects` | OFFICER / ADMIN | `ProjectRequest` | `ProjectResponse` |
| GET | `/api/v1/projects` | Public | — | `ProjectResponse[]` |
| GET | `/api/v1/projects/{id}` | Public | — | `ProjectResponse` |
| GET | `/api/v1/projects/status/{status}` | Public | PLANNED/IN_PROGRESS/COMPLETED/ON_HOLD/CANCELLED | `ProjectResponse[]` |
| PATCH | `/api/v1/projects/{id}` | OFFICER / ADMIN | `ProjectRequest` (partial) | `ProjectResponse` |
| DELETE | `/api/v1/projects/{id}` | ADMIN | — | `204` |
| POST | `/api/v1/projects/{projectId}/milestones` | OFFICER / ADMIN | `MilestoneRequest` | `MilestoneResponse` |
| GET | `/api/v1/projects/{projectId}/milestones` | Public | — | `MilestoneResponse[]` |
| GET | `/api/v1/projects/milestones/{milestoneId}` | Public | — | `MilestoneResponse` |
| GET | `/api/v1/projects/milestones/status/{status}` | Public | PENDING/IN_PROGRESS/COMPLETED/DELAYED | `MilestoneResponse[]` |
| PATCH | `/api/v1/projects/milestones/{milestoneId}` | OFFICER / ADMIN | `MilestoneRequest` (partial) | `MilestoneResponse` |
| DELETE | `/api/v1/projects/milestones/{milestoneId}` | OFFICER / ADMIN | — | `204` |
| POST | `/api/v1/projects/{projectId}/impact` | OFFICER / SCIENTIST / ADMIN | `ImpactRequest` | `ImpactResponse` |
| GET | `/api/v1/projects/{projectId}/impact` | Public | — | `ImpactResponse` |
| GET | `/api/v1/projects/impact/{impactId}` | Public | — | `ImpactResponse` |
| GET | `/api/v1/projects/impact/status/{status}` | Public | DRAFT/PUBLISHED/ARCHIVED | `ImpactResponse[]` |
| PATCH | `/api/v1/projects/{projectId}/impact/status` | OFFICER / ADMIN | query: `status` | `ImpactResponse` |
| PATCH | `/api/v1/projects/{projectId}/impact/metrics` | OFFICER / SCIENTIST / ADMIN | `ImpactMetrics` | `ImpactResponse` |
| PATCH | `/api/v1/projects/{projectId}/impact/metrics/custom` | OFFICER / SCIENTIST / ADMIN | `{key: value}` map | `ImpactResponse` |
| DELETE | `/api/v1/projects/{projectId}/impact/metrics/custom/{key}` | OFFICER / ADMIN | — | `ImpactResponse` |
| DELETE | `/api/v1/projects/{projectId}/impact` | ADMIN | — | `204` |

**ProjectRequest:** `{ title, description, startDate, endDate, budget, managerName, status }`  
**ProjectResponse:** `{ id, title, description, status, startDate, endDate, budget, managerName, createdAt }`  
**MilestoneRequest:** `{ title, description, dueDate, status }`  
**MilestoneResponse:** `{ id, projectId, title, description, status (PENDING/IN_PROGRESS/COMPLETED/DELAYED), dueDate, completedAt }`  
**ImpactResponse:** `{ id, projectId, status (DRAFT/PUBLISHED/ARCHIVED), treesPlanted, co2ReducedTons, waterSavedLiters, areaRestoredSqm, beneficiariesCount, customMetrics{} }`

---

## 8. Reports (Project Management Service — port 8086)

| Method | Path | Auth/Role | Body / Params | Response |
|--------|------|-----------|---------------|----------|
| POST | `/api/v1/reports` | OFFICER / ADMIN | `ReportRequest` | `ReportResponse` |
| GET | `/api/v1/reports` | Public | — | `ReportResponse[]` |
| GET | `/api/v1/reports/{id}` | Public | — | `ReportResponse` |
| GET | `/api/v1/reports/scope/{scope}` | Public | scope: ISSUE/EMISSION/PROJECT | `ReportResponse[]` |
| DELETE | `/api/v1/reports/{id}` | ADMIN | — | `204` |

**ReportRequest:** `{ title, scope (ISSUE/EMISSION/PROJECT), description, generatedBy, content }`  
**ReportResponse:** `{ id, title, scope, description, generatedBy, generatedAt, content }`

---

## 9. Compliance & Audits (Compliance Audit Service — port 8087)

| Method | Path | Auth/Role | Body / Params | Response |
|--------|------|-----------|---------------|----------|
| POST | `/api/v1/compliance` | OFFICER / ADMIN | `ComplianceRecordRequest` | `ComplianceRecordResponse` |
| GET | `/api/v1/compliance` | Public | — | `ComplianceRecordResponse[]` |
| GET | `/api/v1/compliance/{id}` | Public | — | `ComplianceRecordResponse` |
| GET | `/api/v1/compliance/entity/{entityId}` | Public | — | `ComplianceRecordResponse[]` |
| GET | `/api/v1/compliance/type/{type}` | Public | INDUSTRY/PROJECT/POLICY | `ComplianceRecordResponse[]` |
| GET | `/api/v1/compliance/result/{result}` | Public | COMPLIANT/NON_COMPLIANT/PENDING | `ComplianceRecordResponse[]` |
| DELETE | `/api/v1/compliance/{id}` | ADMIN | — | `204` |
| POST | `/api/v1/audits` | OFFICER / ADMIN | `AuditRequest` | `AuditResponse` |
| GET | `/api/v1/audits` | Public | — | `AuditResponse[]` |
| GET | `/api/v1/audits/{id}` | Public | — | `AuditResponse` |
| GET | `/api/v1/audits/officer/{officerId}` | Public | — | `AuditResponse[]` |
| PATCH | `/api/v1/audits/{id}/status` | OFFICER / ADMIN | query: `status`, `findings` | `AuditResponse` |

**ComplianceRecordRequest:** `{ entityId, entityName, type (INDUSTRY/PROJECT/POLICY), result (COMPLIANT/NON_COMPLIANT/PENDING), notes }`  
**ComplianceRecordResponse:** `{ id, entityId, entityName, type, result, notes, recordedAt }`  
**AuditRequest:** `{ entityId, entityName, officerId, officerName, scheduledDate, findings }`  
**AuditResponse:** `{ id, entityId, entityName, officerId, officerName, status (SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED), findings, scheduledDate, completedAt }`

---

## Gateway Routes Summary

| Path Prefix | Routes To | Circuit Breaker |
|------------|-----------|-----------------|
| `/api/v1/auth/**` | `iam-service:8081` | iamCB |
| `/api/v1/users/**` | `iam-service:8081` | iamCB |
| `/api/v1/notifications/**` | `iam-service:8081` | iamCB |
| `/api/v1/issues/**` | `citizen-reporting-service:8083` | citizenCB |
| `/api/v1/sensors/**` | `environmental-monitoring-service:8084` | monitoringCB |
| `/api/v1/sensor-data/**` | `environmental-monitoring-service:8084` | monitoringCB |
| `/api/v1/analysis/**` | `environmental-monitoring-service:8084` | monitoringCB |
| `/api/v1/upload-csv/**` | `environmental-monitoring-service:8084` | monitoringCB |
| `/api/v1/emissions/**` | `industry-compliance-service:8085` | industryCB |
| `/api/v1/industry-documents/**` | `industry-compliance-service:8085` | industryCB |
| `/api/v1/projects/**` | `project-management-service:8086` | projectCB |
| `/api/v1/reports/**` | `project-management-service:8086` | projectCB |
| `/api/v1/compliance/**` | `compliance-audit-service:8087` | complianceCB |
| `/api/v1/audits/**` | `compliance-audit-service:8087` | complianceCB |

