# EcoTrack

**Environmental Monitoring & Sustainability Management System**

A full-stack platform for citizens, environmental officers, scientists, industries, and compliance auditors to report, monitor, analyse, and act on environmental data. Built on a Spring Boot microservices backend and a React 19 frontend.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Repository Layout](#repository-layout)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Quick Start](#quick-start)
6. [Backend — Microservices](#backend--microservices)
7. [Frontend — React Application](#frontend--react-application)
8. [Authentication & Authorization](#authentication--authorization)
9. [Roles & Permissions](#roles--permissions)
10. [API Reference](#api-reference)
11. [Swagger / OpenAPI](#swagger--openapi)
12. [Databases](#databases)
13. [Environment Variables](#environment-variables)
14. [Troubleshooting](#troubleshooting)

---

## System Overview

EcoTrack is divided into two top-level applications:

- **Backend** — Java 21 / Spring Boot 3 microservices, MySQL, Eureka service discovery, Spring Cloud Config, Spring Cloud Gateway, JWT-secured.
- **Frontend** — React 19 + Vite SPA with TanStack Query, React Router 7, Tailwind CSS 4, Recharts, and Leaflet maps.

The frontend communicates exclusively through the API Gateway (`http://localhost:8090`), which validates JWTs and routes traffic to the appropriate downstream service.

---

## Repository Layout

```
Eco_Track/
├── Backend/
│   ├── eureka-server/                       (8761)  Service Discovery
│   ├── config-server/                       (8888)  Centralized Configuration
│   ├── api-gateway/                         (8090)  Single entry point + JWT filter
│   ├── iam-service/                         (8081)  Identity, Access, Notifications
│   ├── citizen-reporting-service/           (8083)  Issues & Resolutions
│   ├── environmental-monitoring-service/    (8084)  Sensors, SensorData, Analysis
│   ├── industry-compliance-service/         (8085)  Emissions, Documents
│   ├── project-management-service/          (8086)  Projects, Milestones, Impacts, Reports
│   ├── compliance-audit-service/            (8087)  Compliance Records, Audits
│   ├── notification-service/                Async notifications (Kafka, optional)
│   ├── sample-csv/                          Sample sensor data uploads
│   ├── EcoTrack Microservices.postman_collection.json
│   └── pom.xml                              Parent Maven POM
├── Frontend/
│   ├── src/
│   │   ├── api/                             Axios instance + per-module API services
│   │   ├── components/                      Reusable UI components
│   │   ├── context/                         React Context (Auth)
│   │   ├── features/                        Feature-level components (e.g. notifications)
│   │   ├── hooks/                           Custom hooks
│   │   ├── layouts/                         Public / Dashboard layouts
│   │   ├── pages/                           Route-level pages
│   │   ├── routes/                          Router + guards
│   │   ├── types/                           JSDoc typedefs
│   │   └── utils/                           Helpers, formatters, constants
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Tech Stack

### Backend

| Category              | Technology                                  |
|-----------------------|---------------------------------------------|
| Language              | Java 21                                     |
| Framework             | Spring Boot 3                               |
| Service Discovery     | Spring Cloud Netflix Eureka                 |
| Configuration         | Spring Cloud Config Server                  |
| API Gateway           | Spring Cloud Gateway                        |
| Security              | Spring Security + JWT (HS256)               |
| Persistence           | Spring Data JPA + Hibernate                 |
| Database              | MySQL 8                                     |
| Messaging (optional)  | Apache Kafka                                |
| Build Tool            | Maven                                       |
| API Docs              | springdoc-openapi (Swagger UI)              |

### Frontend

| Category              | Library                                     |
|-----------------------|---------------------------------------------|
| Framework             | React 19 + Vite                             |
| Routing               | React Router v7                             |
| Server State          | TanStack Query (React Query) v5             |
| Auth State            | React Context + localStorage                |
| HTTP                  | Axios with interceptors                     |
| Forms / Validation    | React Hook Form + Zod                       |
| Styling               | Tailwind CSS v4                             |
| Charts                | Recharts                                    |
| Maps                  | React-Leaflet + Leaflet                     |
| Icons                 | lucide-react                                |
| Notifications (toast) | sonner                                      |
| Animations            | Framer Motion                               |
| Date utilities        | date-fns                                    |

---

## Prerequisites

- Java 21+
- Maven 3.8+
- MySQL 8.0+ (running locally with credentials configured in `config-server`)
- Node.js 18+ and npm
- Apache Kafka *(optional — used for async notifications; services start without it)*

---

## Quick Start

### 1. Start MySQL

Ensure MySQL is running. Databases are created automatically on first run via `createDatabaseIfNotExist=true`.

### 2. Start the Backend (in order)

```bash
# Step 1 — Eureka Server (service discovery)
cd Backend/eureka-server
mvn spring-boot:run
# Wait for: Started EurekaServerApplication → http://localhost:8761

# Step 2 — Config Server (centralized configuration)
cd Backend/config-server
mvn spring-boot:run
# Wait for: Started ConfigServerApplication → http://localhost:8888

# Step 3 — Business services (any order, can run in parallel)
cd Backend/iam-service                        && mvn spring-boot:run
cd Backend/citizen-reporting-service          && mvn spring-boot:run
cd Backend/environmental-monitoring-service   && mvn spring-boot:run
cd Backend/industry-compliance-service        && mvn spring-boot:run
cd Backend/project-management-service         && mvn spring-boot:run
cd Backend/compliance-audit-service           && mvn spring-boot:run

# Step 4 — API Gateway (last)
cd Backend/api-gateway
mvn spring-boot:run
# → http://localhost:8090
```

### 3. Start the Frontend

```bash
cd Frontend
npm install
npm run dev
# → http://localhost:3000
```

The Vite dev server proxies `localhost:3000/api` → `localhost:8090/api`. The API Gateway must be running on port 8090.

---

## Backend — Microservices

| Service                              | Port | Responsibility                                    |
|--------------------------------------|------|---------------------------------------------------|
| eureka-server                        | 8761 | Service registry / discovery                      |
| config-server                        | 8888 | Centralized configuration (`config-repo/`)        |
| api-gateway                          | 8090 | Single entry point, JWT validation, route mapping |
| iam-service                          | 8081 | Auth, users, roles, notifications                 |
| citizen-reporting-service            | 8083 | Citizen-reported issues & officer resolutions     |
| environmental-monitoring-service     | 8084 | Sensors, sensor data, scientist analysis          |
| industry-compliance-service          | 8085 | Industry emission logs, compliance documents      |
| project-management-service           | 8086 | Projects, milestones, impacts, reports            |
| compliance-audit-service             | 8087 | Compliance records, audits                        |

JWT secret and database credentials are managed centrally in `Backend/config-server/src/main/resources/config-repo/application.properties`.

---

## Frontend — React Application

### Available Scripts

| Command            | Description                          |
|--------------------|--------------------------------------|
| `npm run dev`      | Start dev server on port 3000        |
| `npm run build`    | Production build                     |
| `npm run preview`  | Preview the production build locally |

### Feature Modules

- **Authentication** — Register, login, role-based redirect, persisted session.
- **Issues** — Citizens report environmental issues; officers triage and resolve.
- **Sensors** — Officers manage sensors; scientists upload data (CSV) and analyse readings.
- **Emissions** — Industries log emissions; officers approve / reject submissions.
- **Documents** — Industries upload compliance documents; officers verify.
- **Projects** — Create, list, edit, delete environmental projects.
- **Milestones** — Track progress per project with status indicators.
- **Impact Metrics** — Record CO₂ reduced, trees planted, area restored, custom metrics.
- **Compliance & Audits** — Compliance records and audit findings.
- **Reports** — Quarterly / annual environmental reports.
- **Dashboard** — Aggregated stats, charts, completion rates, monthly trends.
- **Notifications** — In-app notifications with read / archive states.
- **Admin** — User management for system administrators.

### Folder Structure

```
src/
├── api/               Axios instance + per-module API services
│   ├── axiosInstance.js
│   ├── authApi.js
│   ├── usersApi.js
│   ├── notificationsApi.js
│   ├── issuesApi.js
│   ├── sensorsApi.js
│   ├── emissionsApi.js
│   ├── projectsApi.js
│   ├── reportsApi.js
│   └── complianceApi.js
├── components/        Button, Card, Modal, DataTable, StatusBadge, etc.
├── context/           AuthContext.jsx
├── features/          Feature components (e.g. NotificationBell)
├── hooks/             useRole.js, etc.
├── layouts/           PublicLayout.jsx, DashboardLayout.jsx
├── pages/             HomePage, LoginPage, DashboardPage, IssuesPage, …
├── routes/            AppRouter.jsx, Guards.jsx
├── types/             models.js (JSDoc typedefs)
└── utils/             constants.js, formatters.js, rolePaths.js
```

---

## Authentication & Authorization

- JWT validation is performed **exclusively at the API Gateway** (port 8090).
- All requests except `/api/v1/auth/register` and `/api/v1/auth/login` must include:
  ```
  Authorization: Bearer <token>
  ```
- The gateway extracts `userId` and `role` from the token and forwards them as headers to downstream services:
  - `X-User-Id`
  - `X-User-Role`
- Microservices use Spring Security `@PreAuthorize` with `hasAuthority(...)` for method-level access control.
- Always send requests through the **API Gateway**. Direct service calls bypass JWT validation and are intended for development only.

### Public Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

---

## Roles & Permissions

| Role                  | Description                                  |
|-----------------------|----------------------------------------------|
| `ADMIN` / `SUPER_ADMIN` | Full system access, user management        |
| `OFFICER`             | Issue resolution, audits, compliance reviews |
| `SCIENTIST`           | Sensor analysis review                       |
| `INDUSTRY`            | Emission logging, document upload            |
| `COMPLIANCE_OFFICER`  | Compliance & audit oversight                 |
| `CITIZEN`             | Issue reporting                              |

### Frontend Access Matrix

| Feature              | CITIZEN | OFFICER | INDUSTRY | SCIENTIST | COMPLIANCE_OFFICER | ADMIN |
|----------------------|:-------:|:-------:|:--------:|:---------:|:------------------:|:-----:|
| View Issues          |   ✓     |   ✓     |    ✓     |    ✓      |         ✓          |   ✓   |
| Report Issue         |   ✓     |   ✓     |    —     |    —      |         —          |   ✓   |
| Manage Issues        |   —     |   ✓     |    —     |    —      |         —          |   ✓   |
| View Sensors         |   —     |   ✓     |    —     |    ✓      |         —          |   ✓   |
| Manage Sensors       |   —     |   ✓     |    —     |    —      |         —          |   ✓   |
| Analysis             |   —     |   ✓     |    —     |    ✓      |         —          |   ✓   |
| Log Emissions        |   —     |   —     |    ✓     |    —      |         —          |   ✓   |
| Approve Emissions    |   —     |   ✓     |    —     |    —      |         —          |   ✓   |
| Upload Documents     |   —     |   —     |    ✓     |    —      |         —          |   ✓   |
| Verify Documents     |   —     |   ✓     |    —     |    —      |         —          |   ✓   |
| Projects             |  View   | Manage  |   View   |   View    |        View        | Manage|
| Compliance / Audits  |   —     |   ✓     |    —     |    —      |         ✓          |   ✓   |
| Reports              |   —     |   ✓     |    —     |    —      |         ✓          |   ✓   |
| User Management      |   —     |   —     |    —     |    —      |         —          |   ✓   |

---

## API Reference

> **Base URL:** `http://localhost:8090` (API Gateway)
> **Auth Header:** `Authorization: Bearer <token>` (required for all except register/login)

### Route Map

| Module          | Base Path                        | Service (Port)                          |
|-----------------|----------------------------------|------------------------------------------|
| Auth            | `/api/v1/auth/**`                | iam-service (8081)                       |
| Users           | `/api/v1/users/**`               | iam-service (8081)                       |
| Notifications   | `/api/v1/notifications/**`       | iam-service (8081)                       |
| Issues          | `/api/v1/issues/**`              | citizen-reporting-service (8083)         |
| Sensors         | `/api/v1/sensors/**`             | environmental-monitoring-service (8084)  |
| Sensor Data     | `/api/v1/sensor-data/**`         | environmental-monitoring-service (8084)  |
| Analysis        | `/api/v1/analysis/**`            | environmental-monitoring-service (8084)  |
| CSV Upload      | `/api/v1/upload-csv/**`          | environmental-monitoring-service (8084)  |
| Emissions       | `/api/v1/emissions/**`           | industry-compliance-service (8085)       |
| Documents       | `/api/v1/industry-documents/**`  | industry-compliance-service (8085)       |
| Projects        | `/api/v1/projects/**`            | project-management-service (8086)        |
| Reports         | `/api/v1/reports/**`             | project-management-service (8086)        |
| Compliance      | `/api/v1/compliance/**`          | compliance-audit-service (8087)          |
| Audits          | `/api/v1/audits/**`              | compliance-audit-service (8087)          |

### 1. Authentication

```http
POST /api/v1/auth/register
{
  "name": "Admin User",
  "email": "admin@ecotrack.com",
  "password": "admin123",
  "phone": "9876543210",
  "role": "ADMIN"
}
```
Roles: `ADMIN`, `OFFICER`, `SCIENTIST`, `INDUSTRY`, `CITIZEN`

```http
POST /api/v1/auth/login
{ "email": "admin@ecotrack.com", "password": "admin123" }
```

### 2. Users

```
GET    /api/v1/users
GET    /api/v1/users/{id}
GET    /api/v1/users/role/{role}
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}
```
Status values: `ACTIVE`, `INACTIVE`

### 3. Notifications

```
POST   /api/v1/notifications
GET    /api/v1/notifications
GET    /api/v1/notifications/user/{userId}
GET    /api/v1/notifications/user/{userId}/unread
PATCH  /api/v1/notifications/{id}/read
PATCH  /api/v1/notifications/{id}/archive
PATCH  /api/v1/notifications/user/{userId}/read-all
DELETE /api/v1/notifications/{id}
```

### 4. Issues

```
POST   /api/v1/issues
GET    /api/v1/issues
GET    /api/v1/issues/{id}
GET    /api/v1/issues/citizen/{citizenId}
GET    /api/v1/issues/status/{status}
GET    /api/v1/issues/type/{type}
PATCH  /api/v1/issues/{id}
PATCH  /api/v1/issues/{id}/status
DELETE /api/v1/issues/{id}
```
Status values: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`

### 5. Resolutions

```
POST   /api/v1/issues/{issueId}/resolutions
GET    /api/v1/issues/{issueId}/resolutions
GET    /api/v1/issues/resolutions
GET    /api/v1/issues/resolutions/{id}
GET    /api/v1/issues/resolutions/officer/{officerId}
GET    /api/v1/issues/resolutions/status/{status}
PATCH  /api/v1/issues/resolutions/{id}
DELETE /api/v1/issues/resolutions/{id}
```
Status values: `PENDING`, `IN_PROGRESS`, `COMPLETED`

### 6. Sensors

```
POST   /api/v1/sensors
GET    /api/v1/sensors
GET    /api/v1/sensors/{id}
GET    /api/v1/sensors/type/{type}
PATCH  /api/v1/sensors/{id}
PATCH  /api/v1/sensors/{id}/status?status={status}
DELETE /api/v1/sensors/{id}
```
Type values: `AIR`, `WATER`, `NOISE`
Status values: `ACTIVE`, `INACTIVE`, `MAINTENANCE`

### 7. Sensor Data

```
POST   /api/v1/sensor-data
GET    /api/v1/sensor-data
GET    /api/v1/sensor-data/{id}
GET    /api/v1/sensor-data/sensor/{sensorId}
DELETE /api/v1/sensor-data/{id}

POST   /api/v1/upload-csv      (multipart: file, sensorId, sensorType)
```

### 8. Analysis

```
POST   /api/v1/analysis
GET    /api/v1/analysis
GET    /api/v1/analysis/{id}
GET    /api/v1/analysis/data/{dataId}
GET    /api/v1/analysis/status/{status}
GET    /api/v1/analysis/sensor/{sensorId}
GET    /api/v1/analysis/scientist/{scientistId}
PATCH  /api/v1/analysis/{id}/review?scientistId={id}&findings={text}
PATCH  /api/v1/analysis/{id}/status?status={status}
DELETE /api/v1/analysis/{id}
```
Status values: `PENDING`, `REVIEWED`, `FLAGGED`

### 9. Emissions

```
POST   /api/v1/emissions
GET    /api/v1/emissions
GET    /api/v1/emissions/{id}
GET    /api/v1/emissions/industry/{industryId}
GET    /api/v1/emissions/status/{status}
GET    /api/v1/emissions/industry/{industryId}/status/{status}
GET    /api/v1/emissions/type/{type}
PATCH  /api/v1/emissions/{id}
PATCH  /api/v1/emissions/{id}/status?status={status}
DELETE /api/v1/emissions/{id}
```
Status values: `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`

### 10. Industry Documents

```
POST   /api/v1/industry-documents
GET    /api/v1/industry-documents
GET    /api/v1/industry-documents/{id}
GET    /api/v1/industry-documents/industry/{industryId}
GET    /api/v1/industry-documents/verification/{status}
GET    /api/v1/industry-documents/type/{docType}
GET    /api/v1/industry-documents/industry/{industryId}/verification/{status}
PATCH  /api/v1/industry-documents/{id}
PATCH  /api/v1/industry-documents/{id}/verify?status={status}
DELETE /api/v1/industry-documents/{id}
```
Verification status: `PENDING`, `VERIFIED`, `REJECTED`

### 11. Projects

```
POST   /api/v1/projects
GET    /api/v1/projects
GET    /api/v1/projects/{id}
GET    /api/v1/projects/status/{status}
PATCH  /api/v1/projects/{id}
DELETE /api/v1/projects/{id}
```
Status values: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`, `CANCELLED`

### 12. Milestones

```
POST   /api/v1/projects/{projectId}/milestones
GET    /api/v1/projects/{projectId}/milestones
GET    /api/v1/projects/milestones/{id}
GET    /api/v1/projects/milestones/status/{status}
PATCH  /api/v1/projects/milestones/{id}
DELETE /api/v1/projects/milestones/{id}
```
Status values: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `DELAYED`

### 13. Impacts

```
POST   /api/v1/projects/{projectId}/impact
GET    /api/v1/projects/{projectId}/impact
GET    /api/v1/projects/impact/{id}
GET    /api/v1/projects/impact/status/{status}
PATCH  /api/v1/projects/{projectId}/impact/status?status={status}
DELETE /api/v1/projects/{projectId}/impact
```
Status values: `DRAFT`, `PUBLISHED`, `ARCHIVED`

### 14. Reports

```
POST   /api/v1/reports
GET    /api/v1/reports
GET    /api/v1/reports/{id}
GET    /api/v1/reports/scope/{scope}
DELETE /api/v1/reports/{id}
```

### 15. Compliance

```
POST   /api/v1/compliance
GET    /api/v1/compliance
GET    /api/v1/compliance/{id}
GET    /api/v1/compliance/entity/{entityId}
GET    /api/v1/compliance/type/{type}
GET    /api/v1/compliance/result/{result}
DELETE /api/v1/compliance/{id}
```

### 16. Audits

```
POST   /api/v1/audits
GET    /api/v1/audits
GET    /api/v1/audits/{id}
GET    /api/v1/audits/officer/{officerId}
PATCH  /api/v1/audits/{id}/status?status={status}&findings={text}
```

A ready-to-import Postman collection is available at `Backend/EcoTrack Microservices.postman_collection.json`.

---

## Swagger / OpenAPI

### Via API Gateway (recommended — JWT auth applied)

| Service                          | URL                                                              |
|----------------------------------|------------------------------------------------------------------|
| iam-service                      | http://localhost:8090/iam/swagger-ui/index.html                  |
| citizen-reporting-service        | http://localhost:8090/citizen/swagger-ui/index.html              |
| environmental-monitoring-service | http://localhost:8090/monitoring/swagger-ui/index.html           |
| industry-compliance-service      | http://localhost:8090/industry/swagger-ui/index.html             |
| project-management-service       | http://localhost:8090/project/swagger-ui/index.html              |
| compliance-audit-service         | http://localhost:8090/compliance/swagger-ui/index.html           |

### Direct Service Swagger (development only — bypasses JWT)

| Service                          | URL                                            |
|----------------------------------|------------------------------------------------|
| iam-service                      | http://localhost:8081/swagger-ui/index.html    |
| citizen-reporting-service        | http://localhost:8083/swagger-ui/index.html    |
| environmental-monitoring-service | http://localhost:8084/swagger-ui/index.html    |
| industry-compliance-service      | http://localhost:8085/swagger-ui/index.html    |
| project-management-service       | http://localhost:8086/swagger-ui/index.html    |
| compliance-audit-service         | http://localhost:8087/swagger-ui/index.html    |

### Using Swagger UI with JWT

1. Register a user via `POST /api/v1/auth/register`.
2. Login via `POST /api/v1/auth/login` and copy the returned token.
3. Open any Swagger UI URL above.
4. Click **Authorize** (top right).
5. Enter `Bearer <your_token>` and confirm.
6. All API calls now include the JWT automatically.

---

## Databases

All databases are MySQL and are created automatically on first run via `createDatabaseIfNotExist=true`.

| Service                          | Database               |
|----------------------------------|------------------------|
| iam-service                      | `ecotrack_iam`         |
| citizen-reporting-service        | `ecotrack_citizen`     |
| environmental-monitoring-service | `ecotrack_monitoring`  |
| industry-compliance-service      | `ecotrack_industry`    |
| project-management-service       | `ecotrack_project`     |
| compliance-audit-service         | `ecotrack_compliance`  |

Database credentials and JDBC URLs are centralized in:
`Backend/config-server/src/main/resources/config-repo/application.properties`

---

## Environment Variables

### Frontend (`Frontend/.env`)

| Variable             | Default                  | Description       |
|----------------------|--------------------------|-------------------|
| `VITE_API_BASE_URL`  | `http://localhost:8090`  | API Gateway URL   |

### Backend

Backend configuration is managed centrally by the Config Server. Edit:
`Backend/config-server/src/main/resources/config-repo/application.properties`

Key properties include:
- `spring.datasource.username` / `spring.datasource.password`
- `jwt.secret` / `jwt.expiration`
- Service ports and Eureka registration URLs

---

## Troubleshooting

**"Cannot connect to API"**
- Check the backend is reachable: `curl http://localhost:8090/api/v1/projects`
- Verify `Frontend/.env` has the correct `VITE_API_BASE_URL`.
- Confirm Eureka shows all services registered: http://localhost:8761

**"401 Unauthorized"**
- Token is missing, expired, or malformed.
- Clear localStorage in the browser and log in again.
- Confirm the request goes through the API Gateway (port 8090), not a service port directly.

**"503 Service Unavailable" from gateway**
- Downstream service is not registered with Eureka yet — wait ~30s after start.
- Check the service log for startup errors (DB connection, port conflict).

**Build fails (Frontend)**
```bash
cd Frontend
rm -rf node_modules dist
npm install
npm run build
```

**Database errors on startup**
- Verify MySQL is running and the credentials in `config-repo/application.properties` are correct.
- The user must have `CREATE DATABASE` privileges (databases are auto-created on first run).

---

**Version:** 1.0.0
