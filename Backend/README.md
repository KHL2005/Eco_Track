# EcoTrack Microservices Architecture

Environmental Monitoring & Sustainability Management System – Microservices Edition

---

## 🏗️ Architecture Overview

```
ecotrack-microservices/
├── eureka-server                        (Port: 8761)  - Service Discovery
├── config-server                        (Port: 8888)  - Centralized Configuration
├── api-gateway                          (Port: 8090)  - Single Entry Point + JWT Filter
├── iam-service                          (Port: 8081)  - Identity, Access, Notifications
├── citizen-reporting-service            (Port: 8083)  - Issues & Resolutions
├── environmental-monitoring-service     (Port: 8084)  - Sensors, SensorData, Analysis
├── industry-compliance-service          (Port: 8085)  - Emissions, Documents
├── project-management-service           (Port: 8086)  - Projects, Milestones, Impacts, Reports
└── compliance-audit-service             (Port: 8087)  - Compliance Records, Audits
```

---

## 🗄️ Databases (MySQL)

| Service | Database |
|---|---|
| iam-service | ecotrack_iam |
| citizen-reporting-service | ecotrack_citizen |
| environmental-monitoring-service | ecotrack_monitoring |
| industry-compliance-service | ecotrack_industry |
| project-management-service | ecotrack_project |
| compliance-audit-service | ecotrack_compliance |

> All databases are created automatically via `createDatabaseIfNotExist=true`

---

## ⚙️ Prerequisites

- Java 21+
- Maven 3.8+
- MySQL 8.0+
- Apache Kafka (optional — used for async notifications; services start without it)

---

## 🚀 Startup Order (IMPORTANT)

Start services **in this exact order**:

### Step 1 – Eureka Server
```bash
cd eureka-server
mvn spring-boot:run
```
Wait until: `Started EurekaServerApplication` → http://localhost:8761

### Step 2 – Config Server
```bash
cd config-server
mvn spring-boot:run
```
Wait until: `Started ConfigServerApplication` → http://localhost:8888

### Step 3 – Business Services (any order)
```bash
cd iam-service
mvn spring-boot:run

cd citizen-reporting-service
mvn spring-boot:run

cd environmental-monitoring-service
mvn spring-boot:run

cd industry-compliance-service
mvn spring-boot:run

cd project-management-service
mvn spring-boot:run

cd compliance-audit-service
mvn spring-boot:run
```

### Step 4 – API Gateway (last)
```bash
cd api-gateway
mvn spring-boot:run
```

---

## 🔐 Security & JWT

- JWT validation is handled **exclusively at the API Gateway** (port 8090)
- All requests (except auth endpoints) must include: `Authorization: Bearer <token>`
- The gateway extracts `userId` and `role` from the token and forwards them as headers:
  - `X-User-Id`
  - `X-User-Role`
- Individual microservices use `@PreAuthorize` with `hasAuthority(...)` for method-level access control
- JWT Secret is configured in `config-server/src/main/resources/config-repo/application.properties`

### Public Endpoints (no token required):
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

---

## 🛡️ User Roles & Access Control

| Role | Description | Accessible APIs |
|---|---|---|
| `ADMIN` | Full system access, user management | All endpoints |
| `OFFICER` | Issue resolution, audit management | Issues (resolve), Audits, Compliance |
| `SCIENTIST` | Sensor analysis review | Sensors, Sensor Data, Analysis |
| `INDUSTRY` | Emission logging, document upload | Emissions, Industry Documents |
| `CITIZEN` | Issue reporting | Issues (create/view own) |

> **Important:** Always send requests through the **API Gateway (port 8090)**.  
> The gateway injects `X-User-Role` headers that downstream services depend on for authorization.

---

## 📡 API Routes (via Gateway on port 8090)

| Module | Base Path | Service Port |
|---|---|---|
| Auth | `/api/v1/auth/**` | iam-service (8081) |
| Users | `/api/v1/users/**` | iam-service (8081) |
| Notifications | `/api/v1/notifications/**` | iam-service (8081) |
| Issues | `/api/v1/issues/**` | citizen-reporting-service (8083) |
| Sensors | `/api/v1/sensors/**` | environmental-monitoring-service (8084) |
| Sensor Data | `/api/v1/sensor-data/**` | environmental-monitoring-service (8084) |
| Analysis | `/api/v1/analysis/**` | environmental-monitoring-service (8084) |
| CSV Upload | `/api/v1/upload-csv/**` | environmental-monitoring-service (8084) |
| Emissions | `/api/v1/emissions/**` | industry-compliance-service (8085) |
| Documents | `/api/v1/industry-documents/**` | industry-compliance-service (8085) |
| Projects | `/api/v1/projects/**` | project-management-service (8086) |
| Reports | `/api/v1/reports/**` | project-management-service (8086) |
| Compliance | `/api/v1/compliance/**` | compliance-audit-service (8087) |
| Audits | `/api/v1/audits/**` | compliance-audit-service (8087) |

---

## 📘 Swagger UI

### Via API Gateway (recommended — JWT auth applied):

| Service | Swagger UI URL |
|---|---|
| iam-service | http://localhost:8090/iam/swagger-ui/index.html |
| citizen-reporting-service | http://localhost:8090/citizen/swagger-ui/index.html |
| environmental-monitoring-service | http://localhost:8090/monitoring/swagger-ui/index.html |
| industry-compliance-service | http://localhost:8090/industry/swagger-ui/index.html |
| project-management-service | http://localhost:8090/project/swagger-ui/index.html |
| compliance-audit-service | http://localhost:8090/compliance/swagger-ui/index.html |

### Direct Service Swagger (development only — bypasses JWT):

| Service | Direct URL |
|---|---|
| iam-service | http://localhost:8081/swagger-ui/index.html |
| citizen-reporting-service | http://localhost:8083/swagger-ui/index.html |
| environmental-monitoring-service | http://localhost:8084/swagger-ui/index.html |
| industry-compliance-service | http://localhost:8085/swagger-ui/index.html |
| project-management-service | http://localhost:8086/swagger-ui/index.html |
| compliance-audit-service | http://localhost:8087/swagger-ui/index.html |

### How to use Swagger UI with JWT:
1. Register a user via `POST /api/v1/auth/register`
2. Login via `POST /api/v1/auth/login` → copy the token
3. Open any Swagger UI URL above
4. Click **Authorize** (🔒 button, top right)
5. Enter: `Bearer <your_token>`
6. Click **Authorize** → **Close**
7. All API calls will now include the JWT automatically

---

## 📋 API Endpoints & Request Examples

> **Base URL:** `http://localhost:8090` (API Gateway)  
> **Auth Header:** `Authorization: Bearer <token>` (required for all except register/login)

---

### 1️⃣ Authentication (IAM Service)

#### Register User
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@ecotrack.com",
  "password": "admin123",
  "phone": "9876543210",
  "role": "ADMIN"
}
```
> Roles: `ADMIN`, `OFFICER`, `SCIENTIST`, `INDUSTRY`, `CITIZEN`

#### Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@ecotrack.com",
  "password": "admin123"
}
```

---

### 2️⃣ User Management (IAM Service)

#### Get All Users
```
GET /api/v1/users
```

#### Get User By ID
```
GET /api/v1/users/1
```

#### Get Users By Role
```
GET /api/v1/users/role/CITIZEN
```

#### Update User
```
PUT /api/v1/users/1
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "9876543210",
  "status": "ACTIVE"
}
```
> Status values: `ACTIVE`, `INACTIVE`

#### Delete User
```
DELETE /api/v1/users/1
```

---

### 3️⃣ Notifications (IAM Service)

#### Create Notification
```
POST /api/v1/notifications
Content-Type: application/json

{
  "userId": 1,
  "entityId": 10,
  "message": "Your issue has been resolved.",
  "category": "ISSUE_UPDATE"
}
```

#### Get All Notifications
```
GET /api/v1/notifications
```

#### Get Notifications By User
```
GET /api/v1/notifications/user/1
```

#### Get Unread Notifications By User
```
GET /api/v1/notifications/user/1/unread
```

#### Mark Notification As Read
```
PATCH /api/v1/notifications/1/read
```

#### Archive Notification
```
PATCH /api/v1/notifications/1/archive
```

#### Mark All Read For User
```
PATCH /api/v1/notifications/user/1/read-all
```

#### Delete Notification
```
DELETE /api/v1/notifications/1
```

---

### 4️⃣ Issues (Citizen Reporting Service)

#### Create Issue
```
POST /api/v1/issues
Content-Type: application/json

{
  "citizenId": 1,
  "type": "AIR_POLLUTION",
  "location": "Industrial Zone, Sector 5",
  "description": "Heavy smoke coming from the factory chimney."
}
```

#### Get All Issues
```
GET /api/v1/issues
```

#### Get Issue By ID
```
GET /api/v1/issues/1
```

#### Get Issues By Citizen
```
GET /api/v1/issues/citizen/1
```

#### Get Issues By Status
```
GET /api/v1/issues/status/OPEN
```
> Status values: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`

#### Get Issues By Type
```
GET /api/v1/issues/type/AIR_POLLUTION
```

#### Update Issue (Partial)
```
PATCH /api/v1/issues/1
Content-Type: application/json

{
  "description": "Updated description with more details.",
  "location": "Updated Location"
}
```

#### Update Issue Status
```
PATCH /api/v1/issues/1/status
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}
```

#### Delete Issue
```
DELETE /api/v1/issues/1
```

---

### 5️⃣ Resolutions (Citizen Reporting Service)

#### Add Resolution To Issue
```
POST /api/v1/issues/1/resolutions
Content-Type: application/json

{
  "officerId": 2,
  "actions": "Inspected the factory and issued a warning."
}
```

#### Get Resolution By Issue
```
GET /api/v1/issues/1/resolutions
```

#### Get All Resolutions
```
GET /api/v1/issues/resolutions
```

#### Get Resolution By ID
```
GET /api/v1/issues/resolutions/1
```

#### Get Resolutions By Officer
```
GET /api/v1/issues/resolutions/officer/2
```

#### Get Resolutions By Status
```
GET /api/v1/issues/resolutions/status/PENDING
```
> Status values: `PENDING`, `IN_PROGRESS`, `COMPLETED`

#### Update Resolution
```
PATCH /api/v1/issues/resolutions/1
Content-Type: application/json

{
  "status": "COMPLETED",
  "actions": "Factory was shut down for violation."
}
```

#### Delete Resolution
```
DELETE /api/v1/issues/resolutions/1
```

---

### 6️⃣ Sensors (Environmental Monitoring Service)

#### Create Sensor
```
POST /api/v1/sensors
Content-Type: application/json

{
  "location": "Industrial Zone, Sector 5",
  "type": "AIR"
}
```

#### Get All Sensors
```
GET /api/v1/sensors
```

#### Get Sensor By ID
```
GET /api/v1/sensors/1
```

#### Get Sensors By Type
```
GET /api/v1/sensors/type/AIR
```
> Type values: `AIR`, `WATER`, `NOISE`

#### Update Sensor
```
PATCH /api/v1/sensors/1
Content-Type: application/json

{
  "location": "Updated Location, Zone 2",
  "type": "WATER"
}
```

#### Update Sensor Status
```
PATCH /api/v1/sensors/1/status?status=MAINTENANCE
```
> Status values: `ACTIVE`, `INACTIVE`, `MAINTENANCE`

#### Delete Sensor
```
DELETE /api/v1/sensors/1
```

---

### 7️⃣ Sensor Data (Environmental Monitoring Service)

#### Add Sensor Data
```
POST /api/v1/sensor-data
Content-Type: application/json

{
  "sensorId": 1,
  "parametersJson": "{\"PM2.5\": 85.5, \"PM10\": 120.3, \"CO2\": 420.0}"
}
```

#### Get All Sensor Data
```
GET /api/v1/sensor-data
```

#### Get Sensor Data By ID
```
GET /api/v1/sensor-data/1
```

#### Get Sensor Data By Sensor
```
GET /api/v1/sensor-data/sensor/1
```

#### Delete Sensor Data
```
DELETE /api/v1/sensor-data/1
```

#### Upload CSV
```
POST /api/v1/upload-csv
Content-Type: multipart/form-data

file: <select CSV file>
sensorId: 1
sensorType: AIR
```
> sensorType values: `AIR`, `WATER`, `NOISE`

---

### 8️⃣ Analysis (Environmental Monitoring Service)

#### Create Analysis
```
POST /api/v1/analysis
Content-Type: application/json

{
  "dataId": 1,
  "scientistId": 3,
  "findings": "PM2.5 levels exceed safe limits by 40%.",
  "status": "PENDING"
}
```

#### Get All Analyses
```
GET /api/v1/analysis
```

#### Get Analysis By ID
```
GET /api/v1/analysis/1
```

#### Get Analyses By Data ID
```
GET /api/v1/analysis/data/1
```

#### Get Analyses By Status
```
GET /api/v1/analysis/status/PENDING
```
> Status values: `PENDING`, `REVIEWED`, `FLAGGED`

#### Get Analyses By Sensor
```
GET /api/v1/analysis/sensor/1
```

#### Get Analyses By Scientist
```
GET /api/v1/analysis/scientist/3
```

#### Review Analysis
```
PATCH /api/v1/analysis/1/review?scientistId=3&findings=Pollution levels are critical
```

#### Update Analysis Status
```
PATCH /api/v1/analysis/1/status?status=FLAGGED
```
> Status values: `PENDING`, `REVIEWED`, `FLAGGED`

#### Delete Analysis
```
DELETE /api/v1/analysis/1
```

---

### 9️⃣ Emissions (Industry Compliance Service)

#### Log Emission
```
POST /api/v1/emissions
Content-Type: application/json

{
  "industryId": 4,
  "type": "CO2",
  "quantity": 150.5
}
```

#### Get All Emissions
```
GET /api/v1/emissions
```

#### Get Emission By ID
```
GET /api/v1/emissions/1
```

#### Get Emissions By Industry
```
GET /api/v1/emissions/industry/4
```

#### Get Emissions By Status
```
GET /api/v1/emissions/status/SUBMITTED
```
> Status values: `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`

#### Get Emissions By Industry And Status
```
GET /api/v1/emissions/industry/4/status/SUBMITTED
```

#### Get Emissions By Type
```
GET /api/v1/emissions/type/CO2
```

#### Update Emission
```
PATCH /api/v1/emissions/1
Content-Type: application/json

{
  "type": "CO2",
  "quantity": 160.0,
  "status": "UNDER_REVIEW"
}
```

#### Update Emission Status
```
PATCH /api/v1/emissions/1/status?status=UNDER_REVIEW
```

#### Delete Emission
```
DELETE /api/v1/emissions/1
```

---

### 🔟 Industry Documents (Industry Compliance Service)

#### Submit Document
```
POST /api/v1/industry-documents
Content-Type: application/json

{
  "industryId": 4,
  "docType": "COMPLIANCE_REPORT",
  "fileUri": "https://storage.ecotrack.com/docs/compliance_2026_q1.pdf"
}
```

#### Get All Documents
```
GET /api/v1/industry-documents
```

#### Get Document By ID
```
GET /api/v1/industry-documents/1
```

#### Get Documents By Industry
```
GET /api/v1/industry-documents/industry/4
```

#### Get Documents By Verification Status
```
GET /api/v1/industry-documents/verification/PENDING
```
> Status values: `PENDING`, `VERIFIED`, `REJECTED`

#### Get Documents By Type
```
GET /api/v1/industry-documents/type/COMPLIANCE_REPORT
```

#### Get Documents By Industry And Status
```
GET /api/v1/industry-documents/industry/4/verification/PENDING
```

#### Update Document
```
PATCH /api/v1/industry-documents/1
Content-Type: application/json

{
  "docType": "COMPLIANCE_REPORT",
  "fileUri": "https://storage.ecotrack.com/docs/updated_compliance.pdf",
  "verificationStatus": "PENDING"
}
```

#### Verify Document
```
PATCH /api/v1/industry-documents/1/verify?status=VERIFIED
```
> Status values: `PENDING`, `VERIFIED`, `REJECTED`

#### Delete Document
```
DELETE /api/v1/industry-documents/1
```

---

### 1️⃣1️⃣ Projects (Project Management Service)

#### Create Project
```
POST /api/v1/projects
Content-Type: application/json

{
  "title": "Clean Air Initiative 2026",
  "description": "Project to reduce air pollution in industrial zones.",
  "startDate": "2026-05-01",
  "endDate": "2026-12-31",
  "budget": 500000.00,
  "status": "PLANNED"
}
```

#### Get All Projects
```
GET /api/v1/projects
```

#### Get Project By ID
```
GET /api/v1/projects/1
```

#### Get Projects By Status
```
GET /api/v1/projects/status/PLANNED
```
> Status values: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`, `CANCELLED`

#### Update Project
```
PATCH /api/v1/projects/1
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "budget": 600000.00
}
```

#### Delete Project
```
DELETE /api/v1/projects/1
```

---

### 1️⃣2️⃣ Milestones (Project Management Service)

#### Add Milestone To Project
```
POST /api/v1/projects/1/milestones
Content-Type: application/json

{
  "title": "Phase 1 - Assessment Complete",
  "date": "2026-06-30",
  "status": "PENDING"
}
```

#### Get Milestones By Project
```
GET /api/v1/projects/1/milestones
```

#### Get Milestone By ID
```
GET /api/v1/projects/milestones/1
```

#### Get Milestones By Status
```
GET /api/v1/projects/milestones/status/PENDING
```
> Status values: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `DELAYED`

#### Update Milestone
```
PATCH /api/v1/projects/milestones/1
Content-Type: application/json

{
  "title": "Phase 1 - Assessment Complete",
  "date": "2026-07-15",
  "status": "IN_PROGRESS"
}
```

#### Delete Milestone
```
DELETE /api/v1/projects/milestones/1
```

---

### 1️⃣3️⃣ Impacts (Project Management Service)

#### Add Impact To Project
```
POST /api/v1/projects/1/impact
Content-Type: application/json

{
  "metricsJson": "{\"co2Reduced\": 500.0, \"treesPlanted\": 200, \"pm25Reduction\": 30}",
  "status": "DRAFT"
}
```

#### Get Impact By Project
```
GET /api/v1/projects/1/impact
```

#### Get Impact By ID
```
GET /api/v1/projects/impact/1
```

#### Get Impacts By Status
```
GET /api/v1/projects/impact/status/DRAFT
```
> Status values: `DRAFT`, `PUBLISHED`, `ARCHIVED`

#### Update Impact Status
```
PATCH /api/v1/projects/1/impact/status?status=PUBLISHED
```

#### Delete Impact
```
DELETE /api/v1/projects/1/impact
```

---

### 1️⃣4️⃣ Reports (Project Management Service)

#### Create Report
```
POST /api/v1/reports
Content-Type: application/json

{
  "scope": "QUARTERLY",
  "metrics": "Comprehensive summary of environmental metrics for Q1 2026."
}
```

#### Get All Reports
```
GET /api/v1/reports
```

#### Get Report By ID
```
GET /api/v1/reports/1
```

#### Get Reports By Scope
```
GET /api/v1/reports/scope/QUARTERLY
```

#### Delete Report
```
DELETE /api/v1/reports/1
```

---

### 1️⃣5️⃣ Compliance (Compliance Audit Service)

#### Create Compliance Record
```
POST /api/v1/compliance
Content-Type: application/json

{
  "entityId": 4,
  "type": "EMISSION",
  "result": "COMPLIANT",
  "notes": "Annual emission compliance check for industry ID 4."
}
```

#### Get All Compliance Records
```
GET /api/v1/compliance
```

#### Get Compliance Record By ID
```
GET /api/v1/compliance/1
```

#### Get Compliance By Entity ID
```
GET /api/v1/compliance/entity/4
```

#### Get Compliance By Type
```
GET /api/v1/compliance/type/EMISSION
```

#### Get Compliance By Result
```
GET /api/v1/compliance/result/COMPLIANT
```

#### Delete Compliance Record
```
DELETE /api/v1/compliance/1
```

---

### 1️⃣6️⃣ Audits (Compliance Audit Service)

#### Create Audit
```
POST /api/v1/audits
Content-Type: application/json

{
  "officerId": 2,
  "scope": "Annual compliance audit for Factory 4.",
  "findings": ""
}
```

#### Get All Audits
```
GET /api/v1/audits
```

#### Get Audit By ID
```
GET /api/v1/audits/1
```

#### Get Audits By Officer
```
GET /api/v1/audits/officer/2
```

#### Update Audit Status
```
PATCH /api/v1/audits/1/status?status=COMPLETED&findings=No major violations found.
```
