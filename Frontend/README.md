# EcoTrack Frontend

A complete, production-ready React 18 frontend for the **EcoTrack Environmental Monitoring & Sustainability Management System**.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env
# Edit .env if your API Gateway runs on a different port

# 3. Start development server
npm run dev
# → http://localhost:3000
```

> **Note:** All API calls are proxied from `localhost:3000/api` → `localhost:8090/api` via Vite's proxy (see `vite.config.js`). The backend API Gateway must be running on port 8090.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8090` | API Gateway URL |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## Tech Stack

| Category | Library |
|----------|---------|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Server State | TanStack Query (React Query) v5 |
| Auth State | React Context + localStorage |
| HTTP | Axios with interceptors |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Maps | React-Leaflet + Leaflet |
| Icons | lucide-react |
| Notifications | sonner |
| Animations | Framer Motion |
| Date utils | date-fns |

---

## Folder Structure

```
src/
├── api/               # Axios instance + per-module API services
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
├── components/        # Reusable UI components
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Modal.jsx
│   ├── DataTable.jsx
│   ├── StatusBadge.jsx
│   ├── LoadingSkeleton.jsx
│   ├── EmptyState.jsx
│   ├── PageHeader.jsx
│   ├── ConfirmDialog.jsx
│   └── FileUpload.jsx
├── context/           # React Context (Auth)
│   └── AuthContext.jsx
├── features/          # Feature-level components
│   └── notifications/
│       └── NotificationBell.jsx
├── hooks/             # Custom hooks
│   └── useRole.js
├── layouts/           # Page layouts
│   ├── PublicLayout.jsx
│   └── DashboardLayout.jsx
├── pages/             # Route-level pages
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── NotFoundPage.jsx
│   ├── DashboardPage.jsx
│   ├── IssuesPage.jsx
│   ├── IssueDetailPage.jsx
│   ├── CreateIssuePage.jsx
│   ├── SensorsPage.jsx
│   ├── SensorDetailPage.jsx
│   ├── AnalysisPage.jsx
│   ├── EmissionsPage.jsx
│   ├── DocumentsPage.jsx
│   ├── ProjectsPage.jsx
│   ├── ProjectDetailPage.jsx
│   ├── CompliancePage.jsx
│   ├── AuditsPage.jsx
│   ├── ReportsPage.jsx
│   ├── NotificationsPage.jsx
│   ├── ProfilePage.jsx
│   └── AdminUsersPage.jsx
├── routes/            # Router + guards
│   ├── AppRouter.jsx
│   └── Guards.jsx
├── types/             # JSDoc typedefs
│   └── models.js
└── utils/             # Helpers
    ├── constants.js
    ├── formatters.js
    └── rolePaths.js
```

---

## Role & Permission Matrix

| Feature | CITIZEN | OFFICER | INDUSTRY | SCIENTIST | COMPLIANCE_OFFICER | ADMIN/SUPER_ADMIN |
|---------|---------|---------|----------|-----------|-------------------|-------------------|
| View Issues | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Report Issue | ✅ | ✅ | — | — | — | ✅ |
| Manage Issues | — | ✅ | — | — | — | ✅ |
| View Sensors | — | ✅ | — | ✅ | — | ✅ |
| Manage Sensors | — | ✅ | — | — | — | ✅ |
| Analysis | — | ✅ | — | ✅ | — | ✅ |
| Log Emissions | — | — | ✅ | — | — | ✅ |
| Approve Emissions | — | ✅ | — | — | — | ✅ |
| Upload Documents | — | — | ✅ | — | — | ✅ |
| Verify Documents | — | ✅ | — | — | — | ✅ |
| Projects | View | Manage | View | View | View | Manage |
| Compliance/Audits | — | ✅ | — | — | ✅ | ✅ |
| Reports | — | ✅ | — | — | ✅ | ✅ |
| User Management | — | — | — | — | — | ✅ |

---

## Screenshots

_Add screenshots here after running the app._

---

## API Inventory

See [`API_INVENTORY.md`](./API_INVENTORY.md) for the complete list of all backend endpoints.

