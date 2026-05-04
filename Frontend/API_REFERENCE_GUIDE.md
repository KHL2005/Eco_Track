# EcoTrack Frontend - API Reference & Integration Guide

## Overview

This comprehensive API reference documents all 24 integrated endpoints in the EcoTrack Project Management frontend, including request/response formats, error handling, and usage examples.

---

## Base URL Configuration

```javascript
// src/api/axiosInstance.js
const API_BASE = '/api/v1'

// Full URL in development
// http://localhost:3000/api/v1

// Full URL in production
// https://api.yourdomain.com/api/v1
```

## Authentication

All requests require a Bearer token in the Authorization header:

```javascript
Authorization: Bearer <JWT_TOKEN>

// Automatically added by Axios interceptor
// Token stored in localStorage with key: 'ecotrack_auth'
```

---

## 📋 PROJECTS API

### 1. GET - Get All Projects

```javascript
projectsApi.getProjects()

// URL: GET /api/v1/projects
// Auth: Required

// Response: ProjectResponse[]
[
  {
    "projectId": 1,
    "title": "Solar Panel Installation",
    "description": "Install solar panels in 50 schools",
    "startDate": "2026-06-01",
    "endDate": "2026-12-31",
    "budget": 500000,
    "status": "PLANNED",  // PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED
    "createdAt": "2026-05-04T10:30:00",
    "updatedAt": "2026-05-04T10:30:00"
  }
]

// Error Responses:
// 401 Unauthorized - No/invalid token
// 403 Forbidden - User lacks permission
// 500 Server Error
```

### 2. GET - Get Project by ID

```javascript
projectsApi.getProjectById(projectId)

// URL: GET /api/v1/projects/{id}
// Auth: Required
// Params: projectId (number)

// Response: ProjectResponse
{
  "projectId": 1,
  "title": "Solar Panel Installation",
  ...
}

// Error Responses:
// 404 Not Found - Project doesn't exist
// 401 Unauthorized
```

### 3. POST - Create Project

```javascript
projectsApi.createProject({
  title: "Carbon Offset Program",
  description: "Plant 10,000 trees",
  startDate: "2026-06-01",
  endDate: "2026-12-31",
  budget: 250000,
  status: "PLANNED"  // Optional, defaults to PLANNED
})

// URL: POST /api/v1/projects
// Auth: Required (OFFICER or ADMIN role)
// Body: ProjectRequest

// Request Schema:
{
  "title": "string",                    // Required, max 200 chars
  "description": "string",              // Optional
  "startDate": "YYYY-MM-DD",           // Required
  "endDate": "YYYY-MM-DD",             // Optional
  "budget": number,                     // Optional, decimal
  "status": "string"                    // Optional (PLANNED, etc.)
}

// Response: ProjectResponse
{
  "projectId": 2,
  "title": "Carbon Offset Program",
  "status": "PLANNED",
  ...
}

// Error Responses:
// 400 Bad Request - Validation failed (title blank, invalid date, etc.)
// 403 Forbidden - User not OFFICER or ADMIN
// 401 Unauthorized
```

### 4. PATCH - Update Project

```javascript
projectsApi.updateProject(projectId, {
  title: "Updated Title",
  status: "IN_PROGRESS"
  // Only send fields to update
})

// URL: PATCH /api/v1/projects/{id}
// Auth: Required (OFFICER or ADMIN)
// Partial update - only provided fields updated

// Response: ProjectResponse (updated)

// Error Responses:
// 404 Not Found
// 400 Bad Request
// 403 Forbidden
```

### 5. DELETE - Delete Project

```javascript
projectsApi.deleteProject(projectId)

// URL: DELETE /api/v1/projects/{id}
// Auth: Required (ADMIN only)
// Note: Deletes all related milestones and impact

// Response: No content (204)

// Error Responses:
// 404 Not Found
// 403 Forbidden (not ADMIN)
// 401 Unauthorized
```

### 6. GET - Get Projects by Status

```javascript
projectsApi.getProjectsByStatus("IN_PROGRESS")

// URL: GET /api/v1/projects/status/{status}
// Auth: Required
// Params: status (PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED)

// Response: ProjectResponse[]
```

### 7. GET - Get Project Progress

```javascript
projectsApi.getProjectProgress(projectId)

// URL: GET /api/v1/projects/{id}/progress
// Auth: Required

// Response:
{
  "totalMilestones": 10,
  "completedMilestones": 7,
  "progressPercentage": 70
}

// Calculated from milestone completion status
```

---

## 🎯 MILESTONES API

### 1. POST - Add Milestone to Project

```javascript
projectsApi.addMilestone(projectId, {
  title: "Site Survey Complete",
  date: "2026-06-15",
  status: "PENDING"  // Optional
})

// URL: POST /api/v1/projects/{projectId}/milestones
// Auth: Required (OFFICER or ADMIN)
// Body: MilestoneRequest

// Request Schema:
{
  "title": "string",           // Required, max 200 chars
  "date": "YYYY-MM-DD",       // Required
  "status": "string"           // Optional (PENDING, IN_PROGRESS, COMPLETED, DELAYED)
}

// Response: MilestoneResponse
{
  "milestoneId": 1,
  "projectId": 1,
  "title": "Site Survey Complete",
  "date": "2026-06-15",
  "status": "PENDING",
  "createdAt": "2026-05-04T10:35:00",
  "updatedAt": "2026-05-04T10:35:00"
}

// Error Responses:
// 400 Bad Request - Validation failed
// 404 Not Found - Project doesn't exist
// 403 Forbidden
```

### 2. GET - Get All Milestones for Project

```javascript
projectsApi.getMilestonesByProject(projectId)

// URL: GET /api/v1/projects/{projectId}/milestones
// Auth: Required

// Response: MilestoneResponse[]
[
  {
    "milestoneId": 1,
    "projectId": 1,
    "title": "Site Survey Complete",
    "date": "2026-06-15",
    "status": "PENDING",
    ...
  }
]

// Used for:
// - Progress calculation
// - Milestone timeline display
// - Status filtering
```

### 3. GET - Get Milestone by ID

```javascript
projectsApi.getMilestoneById(milestoneId)

// URL: GET /api/v1/projects/milestones/{milestoneId}
// Auth: Required

// Response: MilestoneResponse
```

### 4. PATCH - Update Milestone

```javascript
projectsApi.updateMilestone(milestoneId, {
  title: "Updated Title",
  date: "2026-07-01",
  status: "COMPLETED"
})

// URL: PATCH /api/v1/projects/milestones/{milestoneId}
// Auth: Required (OFFICER or ADMIN)
// Partial update

// Response: MilestoneResponse

// Common Use Cases:
// - Change status only: { status: "COMPLETED" }
// - Postpone deadline: { date: "2026-07-01" }
// - Update description: { title: "New title" }
```

### 5. DELETE - Delete Milestone

```javascript
projectsApi.deleteMilestone(milestoneId)

// URL: DELETE /api/v1/projects/milestones/{milestoneId}
// Auth: Required (OFFICER or ADMIN)

// Response: No content (204)

// Effect: Removes milestone from project
// Note: Deleting all milestones doesn't delete project
```

### 6. GET - Get Milestones by Status

```javascript
projectsApi.getMilestonesByStatus("COMPLETED")

// URL: GET /api/v1/projects/milestones/status/{status}
// Auth: Required
// Params: status (PENDING, IN_PROGRESS, COMPLETED, DELAYED)

// Response: MilestoneResponse[]
// Used for filtering milestones across all projects
```

---

## 🌍 IMPACT METRICS API

### 1. POST - Create/Update Impact for Project

```javascript
projectsApi.addOrUpdateImpact(projectId, {
  metrics: {
    treesPlanted: 500,
    areaRestoredHectares: 25.5,
    co2ReducedTons: 120,
    renewableEnergyKwh: 5000,
    wasteCollectedKg: 3000,
    waterBodiesCleaned: 3,
    pollutionIncidentsResolved: 12,
    peopleBenefited: 10000,
    awarenessSessionsConducted: 8,
    volunteerEngagements: 150,
    customMetrics: {
      "aqiBefore": 180,
      "aqiAfter": 95,
      "treesPlantedNearFactory": 50
    },
    notes: "Local AQI improved from 180 to 95 over project duration"
  },
  status: "DRAFT"  // Optional (DRAFT, PUBLISHED, ARCHIVED)
})

// URL: POST /api/v1/projects/{projectId}/impact
// Auth: Required (OFFICER, SCIENTIST, or ADMIN)

// Request Schema:
{
  "metrics": {
    // Predefined fields (all optional)
    "treesPlanted": number,
    "areaRestoredHectares": number,
    "co2ReducedTons": number,
    "renewableEnergyKwh": number,
    "wasteCollectedKg": number,
    "waterBodiesCleaned": number,
    "pollutionIncidentsResolved": number,
    "peopleBenefited": number,
    "awarenessSessionsConducted": number,
    "volunteerEngagements": number,
    
    // Custom metrics (optional)
    "customMetrics": {
      "metricName": value,  // Any key-value pairs
      ...
    },
    
    // Observations (optional)
    "notes": "string"
  },
  "status": "string"  // DRAFT, PUBLISHED, ARCHIVED
}

// Response: ImpactResponse
{
  "impactId": 1,
  "projectId": 1,
  "metrics": { ... },
  "date": "2026-05-04",
  "status": "DRAFT",
  "createdAt": "2026-05-04T10:40:00",
  "updatedAt": "2026-05-04T10:40:00"
}

// Business Rules:
// - One impact per project
// - Unique constraint: projectId must be unique
// - If impact exists, this updates it
// - If impact doesn't exist, this creates it
```

### 2. GET - Get Impact by Project

```javascript
projectsApi.getImpactByProject(projectId)

// URL: GET /api/v1/projects/{projectId}/impact
// Auth: Required

// Response: ImpactResponse
{
  "impactId": 1,
  "projectId": 1,
  "metrics": { ... },
  "status": "DRAFT",
  ...
}

// Response if not found: null or 404
// Used for: Displaying impact details, checking if impact exists
```

### 3. PATCH - Update Impact Status

```javascript
projectsApi.updateImpactStatus(projectId, "PUBLISHED")

// URL: PATCH /api/v1/projects/{projectId}/impact/status?status=PUBLISHED
// Auth: Required (OFFICER or ADMIN)
// Params: status (DRAFT, PUBLISHED, ARCHIVED)

// Response: ImpactResponse (updated)

// Use Cases:
// - Draft → Publish when metrics finalized
// - Published → Archive when project ends
```

### 4. PATCH - Update Impact Metrics (Partial)

```javascript
projectsApi.patchImpactMetrics(projectId, {
  treesPlanted: 600,  // Update only this field
  notes: "Updated trees planted count"
})

// URL: PATCH /api/v1/projects/{projectId}/impact/metrics
// Auth: Required (OFFICER, SCIENTIST, or ADMIN)
// Partial update - only provided metrics updated

// Response: ImpactResponse

// Merging Behavior:
// - Fields in request are merged
// - Old values for missing fields retained
// - customMetrics are merged (merge-add pattern)
```

### 5. PATCH - Add/Update Custom Metrics

```javascript
projectsApi.addCustomMetrics(projectId, {
  "aqiBefore": 180,
  "aqiAfter": 95,
  "soilErosionReducedTons": 80
})

// URL: PATCH /api/v1/projects/{projectId}/impact/metrics/custom
// Auth: Required (OFFICER, SCIENTIST, or ADMIN)
// Body: Key-value pairs to merge

// Response: ImpactResponse

// Behavior:
// - Adds new custom metrics
// - Updates existing custom metrics
// - Other metrics unchanged
```

### 6. DELETE - Remove Custom Metric

```javascript
projectsApi.deleteCustomMetric(projectId, "aqiBefore")

// URL: DELETE /api/v1/projects/{projectId}/impact/metrics/custom/{key}
// Auth: Required (OFFICER or ADMIN)
// Params: key (metric key to remove)

// Response: ImpactResponse (updated)

// Effect: Removes only the specified custom metric
```

### 7. GET - Get Impact by ID

```javascript
projectsApi.getImpactById(impactId)

// URL: GET /api/v1/projects/impact/{impactId}
// Auth: Required

// Response: ImpactResponse
```

### 8. GET - Get Impacts by Status

```javascript
projectsApi.getImpactsByStatus("PUBLISHED")

// URL: GET /api/v1/projects/impact/status/{status}
// Auth: Required
// Params: status (DRAFT, PUBLISHED, ARCHIVED)

// Response: ImpactResponse[]
// Used for: Filtering impacts across all projects
```

### 9. DELETE - Delete Impact

```javascript
projectsApi.deleteImpact(projectId)

// URL: DELETE /api/v1/projects/{projectId}/impact
// Auth: Required (ADMIN only)

// Response: No content (204)

// Effect: Removes all impact data for project
// Note: Project continues to exist
```

---

## 🔄 Request/Response Flow Examples

### Example 1: Complete Project Workflow

```javascript
// 1. Create project
const projectRes = await projectsApi.createProject({
  title: "Reforestation Initiative",
  startDate: "2026-06-01",
  endDate: "2026-12-31",
  budget: 100000
});
const projectId = projectRes.data.projectId;  // 1

// 2. Add milestones
await projectsApi.addMilestone(projectId, {
  title: "Land assessment",
  date: "2026-06-30"
});

await projectsApi.addMilestone(projectId, {
  title: "Tree planting",
  date: "2026-08-15"
});

// 3. Create impact
await projectsApi.addOrUpdateImpact(projectId, {
  metrics: {
    treesPlanted: 5000,
    areaRestoredHectares: 50,
    volunteerEngagements: 200
  }
});

// 4. Complete first milestone
const milestones = await projectsApi.getMilestonesByProject(projectId);
await projectsApi.updateMilestone(milestones.data[0].milestoneId, {
  status: "COMPLETED"
});

// 5. Check progress
const progress = await projectsApi.getProjectProgress(projectId);
console.log(progress.data);  // { totalMilestones: 2, completedMilestones: 1, progressPercentage: 50 }

// 6. Publish impact metrics
await projectsApi.updateImpactStatus(projectId, "PUBLISHED");
```

### Example 2: Error Handling

```javascript
try {
  const projects = await projectsApi.getProjects();
} catch (error) {
  // Automatically handled by Axios interceptor
  // Toast notification shown
  
  // Manual handling if needed:
  const status = error.response?.status;
  const message = error.response?.data?.message;
  
  if (status === 401) {
    // Auto-logout triggered by interceptor
    // Redirect to login happens automatically
  } else if (status === 403) {
    // Permission denied
    console.error("User lacks permission");
  } else if (status === 404) {
    // Resource not found
    console.error("Resource not found");
  } else if (status >= 500) {
    // Server error
    console.error("Server error occurred");
  }
}
```

---

## 📊 Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK - Request successful | GET projects |
| 201 | Created - Resource created | POST project |
| 204 | No Content - Success, no body | DELETE project |
| 400 | Bad Request - Validation failed | Missing title |
| 401 | Unauthorized - No/invalid token | Expired JWT |
| 403 | Forbidden - Lacks permission | Non-ADMIN deleting |
| 404 | Not Found - Resource doesn't exist | Project ID not found |
| 500 | Server Error | Database failure |

---

## ⚡ Performance Tips

1. **Caching**: React Query caches results automatically
   - Disable with `staleTime: 0` if real-time updates needed
   - Force refetch: `queryClient.invalidateQueries({ queryKey: ['projects'] })`

2. **Pagination**: Implement for large datasets
   - Add limit/offset to API calls

3. **Batch Operations**: Combine related updates
   - Create project → Add milestones → Create impact in sequence

4. **Lazy Loading**: Load details on demand
   - Load projects list first
   - Load project details only when viewing

---

## 🔒 Common Security Patterns

```javascript
// Always pass token
const config = {
  headers: {
    Authorization: `Bearer ${token}`
  }
};

// Handle 401 gracefully
if (error.response?.status === 401) {
  localStorage.removeItem('ecotrack_auth');
  window.location.href = '/login';
}

// Validate user permissions before API call
if (!canManageProjects) {
  return <Unauthorized />;
}
```

---

## 📝 API Contract Guarantees

✅ All endpoints follow REST principles  
✅ Consistent error response format  
✅ Partial updates (PATCH) supported  
✅ Timestamp formats: ISO 8601 (YYYY-MM-DDTHH:mm:ss)  
✅ Date formats: YYYY-MM-DD  
✅ Numeric precision: BigDecimal for money, Double for metrics  
✅ Pagination: Optional (implement as needed)  
✅ Versioning: /api/v1/ prefix (future-proof)

---

## 🚀 Integration Checklist

Before going to production verify:

- [ ] All API endpoints tested manually
- [ ] Error responses handled gracefully
- [ ] Authentication token properly configured
- [ ] CORS configured on backend
- [ ] API base URL correct for production
- [ ] Rate limiting (if applicable) understood
- [ ] API documentation shared with team
- [ ] Error codes documented
- [ ] Logging configured
- [ ] Monitoring set up

---

**Last Updated:** May 4, 2026  
**API Version:** v1  
**Total Endpoints:** 24  
**Authentication:** JWT Bearer Token

