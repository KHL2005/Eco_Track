# EcoTrack Frontend - Milestone & Impact Management Implementation

## Overview

The EcoTrack frontend has been enhanced with comprehensive Milestone Management and Impact Metrics tracking features. These features are fully integrated with the Project Management Microservice backend APIs and provide a production-ready user experience for tracking sustainability projects.

---

## ✨ Features Implemented

### 1. **Milestone Management** 📋

#### Core Features:
- **Create Milestones**: Add new project milestones with title, due date, and status
- **View Milestones**: Display all milestones for a project with color-coded status indicators
- **Edit Milestones**: Update milestone details (title, date, status)
- **Delete Milestones**: Remove milestones with confirmation dialog
- **Status Tracking**: Milestone statuses - PENDING, IN_PROGRESS, COMPLETED, DELAYED
- **Progress Calculation**: Automatic calculation of project progress based on completed milestones

#### UI Components:
- Milestone cards with left-border color coding by status
- Status badges with semantic colors
- Progress bar showing project completion percentage
- Summary statistics showing breakdown by status
- Modal dialogs for add/edit operations
- Delete confirmation modal

#### API Integration:
```javascript
// Endpoints used:
GET    /api/v1/projects/{projectId}/milestones
POST   /api/v1/projects/{projectId}/milestones
PATCH  /api/v1/projects/milestones/{milestoneId}
DELETE /api/v1/projects/milestones/{milestoneId}
```

---

### 2. **Impact Metrics Management** 🌍

#### Core Features:
- **Add/Update Impact**: Create or update comprehensive environmental impact metrics
- **View Impact**: Display all impact metrics with visual cards and charts
- **Delete Impact**: Remove impact data with confirmation
- **Status Management**: Impact statuses - DRAFT, PUBLISHED, ARCHIVED
- **Rich Metrics Support**: 10+ predefined environmental metrics plus custom metrics
- **Visual Analytics**: Interactive bar charts showing impact distribution

#### Supported Metrics:
- **Green Coverage**: Trees Planted, Area Restored (hectares)
- **Carbon & Climate**: CO₂ Reduced (tons), Renewable Energy (kWh)
- **Pollution**: Waste Collected (kg), Water Bodies Cleaned, Pollution Incidents Resolved
- **Community**: People Benefited, Awareness Sessions, Volunteer Engagements
- **Custom Metrics**: Unlimited project-specific key-value metrics
- **Notes**: Free-text observations and achievements

#### UI Components:
- Impact metric cards with color-coded icons
- Responsive grid layout (2 columns on mobile, 6 on desktop)
- Bar chart visualization with color-coded bars
- Impact status badges (DRAFT, PUBLISHED, ARCHIVED)
- Comprehensive edit modal with all metrics
- Deletion capability with confirmation

#### API Integration:
```javascript
// Endpoints used:
GET    /api/v1/projects/{projectId}/impact
POST   /api/v1/projects/{projectId}/impact
PATCH  /api/v1/projects/{projectId}/impact/status
PATCH  /api/v1/projects/{projectId}/impact/metrics
PATCH  /api/v1/projects/{projectId}/impact/metrics/custom
DELETE /api/v1/projects/{projectId}/impact/metrics/custom/{key}
DELETE /api/v1/projects/{projectId}/impact
```

---

## 🏗️ Architecture

### File Structure
```
Frontend/
├── src/
│   ├── pages/
│   │   ├── ProjectDetailPage.jsx        ← REFACTORED (Milestones + Impact)
│   │   └── ProjectsPage.jsx             (Project listings)
│   ├── api/
│   │   └── projectsApi.js               (API service layer)
│   ├── components/
│   │   ├── Card.jsx                     (Reusable card)
│   │   ├── Button.jsx                   (Reusable button)
│   │   ├── Modal.jsx                    (Reusable modal)
│   │   └── StatusBadge.jsx              (Status display)
│   ├── hooks/
│   │   └── useRole.js                   (Permission checks)
│   ├── utils/
│   │   ├── constants.js                 (Status enums)
│   │   └── formatters.js                (Date/number formatting)
│   └── index.css                        (EcoTrack color scheme)
```

### Component Hierarchy
```
ProjectDetailPage
├── Project Header (with status)
├── Progress Bar (milestone-based)
├── Milestones Section
│   ├── Add Milestone Button
│   └── Milestone List
│       └── Milestone Cards (editable/deletable)
├── Impact Section
│   ├── Impact Metrics Cards Grid
│   ├── Impact Visualization Chart
│   └── Edit/Delete Buttons
├── Modals
│   ├── Add Milestone Modal
│   ├── Edit Milestone Modal
│   ├── Delete Confirmation Modal
│   ├── Add/Edit Impact Modal
│   └── Delete Impact Confirmation Modal
```

---

## 🎨 Design System

### Color Scheme (EcoTrack Theme)
Based on nature-inspired palette:

#### Status Colors:
- **PENDING**: Slate/Gray (#a8a29e)
- **IN_PROGRESS**: Yellow (#f59e0b)
- **COMPLETED**: Green (#16a34a)
- **DELAYED**: Red (#dc2626)
- **DRAFT**: Gray (#a8a29e)
- **PUBLISHED**: Green (#16a34a)
- **ARCHIVED**: Purple (#a855f7)

#### Semantic Colors:
- **Primary**: Forest Green (#16a34a)
- **Success**: Leaf Green (#22c55e)
- **Info**: Sky Blue (#0ea5e9)
- **Background**: Earth Color (#f5f5f4)
- **Text Dark**: Bark (#292524)
- **Text Light**: Bark Light (#a8a29e)

### Typography:
- Font Family: Inter (Google Fonts)
- Headings: Bold (800 weight)
- Body: Regular (400 weight)
- Labels: Medium (500 weight)

---

## 👥 Role-Based Access Control (RBAC)

### Who Can Manage Projects?
- **ADMINISTRATOR**: Full access
- **SUPER_ADMIN**: Full access
- **OFFICER**: Can manage projects, milestones, and impact

### Who Can View?
- All authenticated users can view projects and details

### Permissions Matrix:
| Action | Admin | Officer | Scientist | Citizen |
|--------|-------|---------|-----------|---------|
| View Project | ✅ | ✅ | ✅ | ✅ |
| Create Milestone | ✅ | ✅ | ❌ | ❌ |
| Edit Milestone | ✅ | ✅ | ❌ | ❌ |
| Delete Milestone | ✅ | ✅ | ❌ | ❌ |
| Add Impact | ✅ | ✅ | ✅ | ❌ |
| Edit Impact | ✅ | ✅ | ✅ | ❌ |
| Delete Impact | ✅ | ❌ | ❌ | ❌ |

---

## 📊 State Management

### React Query (TanStack Query)
All data fetching uses React Query for:
- Automatic caching
- Background synchronization
- Error handling
- Loading states
- Optimistic updates

### Local State (useState)
Used for:
- Modal visibility
- Form data
- Current editing item
- Delete confirmation

### Query Keys:
```javascript
['project', id]              // Single project
['milestones', id]           // All milestones for project
['impact', id]               // Impact for project
```

---

## 🔄 Data Flow

### Creating a Milestone:
1. User clicks "Add Milestone" button
2. Modal opens with form fields (title, date, status)
3. User fills form and clicks "Create"
4. `addMilestoneMutation.mutate()` sends POST to backend
5. Backend creates milestone and returns response
6. React Query invalidates `['milestones', id]` cache
7. Component re-fetches and displays updated list
8. Toast notification shows "Milestone created successfully"
9. Modal closes and form resets

### Updating Impact Metrics:
1. User clicks "Edit" on impact card
2. Modal opens pre-filled with current metrics
3. User updates metrics and/or status
4. Clicks "Update Impact"
5. `addOrUpdateImpactMutation.mutate()` sends POST/PATCH to backend
6. Backend creates or updates impact
7. React Query invalidates `['impact', id]` cache
8. Component re-fetches and displays updated data
9. Charts and cards automatically re-render
10. Toast confirms success

---

## 🎯 Key Implementation Details

### Progress Calculation:
```javascript
const progress = useMemo(() => {
  if (milestones.length === 0) return 0;
  const completed = milestones.filter(m => m.status === 'COMPLETED').length;
  return Math.round((completed / milestones.length) * 100);
}, [milestones]);
```

### Impact Chart Data Preparation:
```javascript
const impactChartData = useMemo(() => {
  if (!impact?.metrics) return [];
  return [
    { name: 'Trees', value: impact.metrics.treesPlanted || 0, color: '#16a34a' },
    { name: 'Area (ha)', value: impact.metrics.areaRestoredHectares || 0, color: '#22c55e' },
    // ... more metrics
  ].filter(d => d.value > 0);
}, [impact]);
```

### Error Handling:
- API errors caught by mutation onError callbacks
- User-friendly error messages via toast notifications
- Validation errors shown before API calls
- Graceful fallbacks for missing data

### Loading States:
- Skeleton screens for initial load
- Loading spinners on buttons during mutations
- Skeleton cards for milestone/impact sections
- Disabled buttons during async operations

---

## 📱 Responsive Design

### Breakpoints:
- **Mobile** (< 640px): Single column, stacked cards
- **Tablet** (640px-1024px): 2-column grid for metrics
- **Desktop** (> 1024px): Full responsive layout with 6-column metric grid

### Responsive Components:
- Milestone cards: Full width → consistent layout
- Impact cards: 2-column → 3-column → 6-column
- Charts: Responsive container scales with parent
- Modals: Mobile-optimized sizing

---

## 🚀 Performance Optimizations

1. **Memoization**: useMemo for data transformations
2. **Lazy Loading**: Charts only render when data exists
3. **Efficient Re-renders**: Proper React Query cache invalidation
4. **Debouncing**: Input debouncing on form changes (via React Query)
5. **Code Splitting**: Page components lazy-loaded via routing

---

## 🧪 Testing Checklist

### Milestone Operations:
- [ ] Add milestone with valid data → Success notification
- [ ] Add milestone without title → Validation error
- [ ] Edit milestone and change status → Updated in list
- [ ] Delete milestone → Confirmation modal → Removed from list
- [ ] Progress bar updates when milestone status changes
- [ ] Color-coding reflects correct status

### Impact Operations:
- [ ] Add impact metrics → Visible in cards and chart
- [ ] Edit impact and update metrics → Chart reflects changes
- [ ] Delete impact → Success notification
- [ ] Change impact status (DRAFT/PUBLISHED/ARCHIVED) → Badge updates
- [ ] Custom metrics support → Saved and displayed

### UI/UX:
- [ ] Modals close on cancel
- [ ] Form validation prevents invalid submissions
- [ ] Toast notifications appear for all actions
- [ ] Animations smooth and not jarring
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Icons and colors consistent with design system

### Permissions:
- [ ] Non-admins cannot see edit/delete buttons
- [ ] Unauthorized API calls handled gracefully
- [ ] Role-based visibility working correctly

---

## 📚 API Documentation

### Milestone Endpoints

#### Create Milestone
```
POST /api/v1/projects/{projectId}/milestones
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Site Assessment",
  "date": "2024-06-15",
  "status": "PENDING"
}

Response (201):
{
  "milestoneId": 1,
  "projectId": 101,
  "title": "Site Assessment",
  "date": "2024-06-15",
  "status": "PENDING",
  "createdAt": "2024-05-04T10:30:00",
  "updatedAt": "2024-05-04T10:30:00"
}
```

#### Get Project Milestones
```
GET /api/v1/projects/{projectId}/milestones
Authorization: Bearer {token}

Response (200):
[
  {
    "milestoneId": 1,
    "projectId": 101,
    "title": "Site Assessment",
    "date": "2024-06-15",
    "status": "PENDING",
    "createdAt": "2024-05-04T10:30:00",
    "updatedAt": "2024-05-04T10:30:00"
  }
]
```

#### Update Milestone
```
PATCH /api/v1/projects/milestones/{milestoneId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Site Assessment - Updated",
  "status": "IN_PROGRESS"
}

Response (200): Updated milestone object
```

#### Delete Milestone
```
DELETE /api/v1/projects/milestones/{milestoneId}
Authorization: Bearer {token}

Response (204): No content
```

### Impact Endpoints

#### Create/Update Impact
```
POST /api/v1/projects/{projectId}/impact
Authorization: Bearer {token}
Content-Type: application/json

{
  "metrics": {
    "treesPlanted": 500,
    "areaRestoredHectares": 25.5,
    "co2ReducedTons": 120.0,
    "renewableEnergyKwh": 5000.0,
    "wasteCollectedKg": 3000.0,
    "peopleBenefited": 10000,
    "awarenessSessionsConducted": 8,
    "volunteerEngagements": 150,
    "customMetrics": {
      "aqiBefore": 180,
      "aqiAfter": 95
    },
    "notes": "Local AQI improved significantly"
  },
  "status": "PUBLISHED"
}

Response (201):
{
  "impactId": 1,
  "projectId": 101,
  "metrics": {...},
  "date": "2024-05-04",
  "status": "PUBLISHED",
  "createdAt": "2024-05-04T10:30:00",
  "updatedAt": "2024-05-04T10:30:00"
}
```

#### Get Project Impact
```
GET /api/v1/projects/{projectId}/impact
Authorization: Bearer {token}

Response (200): Impact object or 404 if not found
```

#### Delete Impact
```
DELETE /api/v1/projects/{projectId}/impact
Authorization: Bearer {token}

Response (204): No content
```

---

## 🔧 Troubleshooting

### Issue: Milestones not loading
**Solution**: Check API URLs in `projectsApi.js`, verify authentication token is valid

### Issue: Impact chart not showing
**Solution**: Ensure impact metrics have non-zero values, check console for data shape

### Issue: Modal won't close after submit
**Solution**: Check if mutation is in loading state, verify error notifications

### Issue: Progress bar stuck at 0%
**Solution**: Ensure milestones have status "COMPLETED" for progress calculation

### Issue: Permissions blocked (401/403)
**Solution**: Verify user role is ADMINISTRATOR or OFFICER, check token expiration

---

## 📖 Usage Guide

### For Project Managers/Officers:

1. **To Create a Milestone:**
   - Navigate to project details
   - Click "+ Add Milestone" button
   - Enter title (required)
   - Set due date (required)
   - Choose status (defaults to PENDING)
   - Click "Create Milestone"

2. **To Track Progress:**
   - View progress bar on project detail page
   - Update milestone statuses as work progresses
   - Progress bar auto-updates based on completed milestones

3. **To Add Environmental Impact:**
   - Click "+ Add Impact" button (if no impact exists)
   - Fill in environmental metrics (at least one required)
   - Add optional notes
   - Set status (DRAFT for working, PUBLISHED for finalized)
   - Click "Create Impact"

4. **To Share Published Impact:**
   - Set impact status to "PUBLISHED"
   - Metrics now visible to all users
   - Can still edit published impacts if needed

---

## 🎓 Code Examples

### Querying Milestones:
```javascript
const { data: milestones = [] } = useQuery({
  queryKey: ['milestones', projectId],
  queryFn: () => projectsApi.getMilestonesByProject(projectId)
    .then(r => r.data)
    .catch(() => []),
});
```

### Creating Impact:
```javascript
const mutation = useMutation({
  mutationFn: (impactData) => projectsApi.addOrUpdateImpact(projectId, impactData),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['impact', projectId] });
    toast.success('Impact updated successfully');
  },
  onError: (err) => {
    toast.error(err.response?.data?.message);
  },
});

mutation.mutate({
  metrics: { treesPlanted: 500, co2ReducedTons: 100 },
  status: 'PUBLISHED',
});
```

---

## 📝 Summary

The ProjectDetailPage has been completely refactored to provide:
- ✅ Comprehensive milestone management
- ✅ Rich environmental impact tracking
- ✅ Visual progress analytics
- ✅ Production-ready UI/UX
- ✅ Full RBAC integration
- ✅ Error handling and validation
- ✅ Responsive design
- ✅ Data caching and optimization

All features are fully integrated with the Project Management Microservice backend and follow EcoTrack's design system and best practices.

---

## 📞 Support

For issues or questions, refer to:
- API Documentation: `/Backend/project-management-service/README.md`
- Frontend Architecture: `/Frontend/ARCHITECTURE_GUIDE.md`
- Component Documentation: `/Frontend/DOCUMENTATION_INDEX.md`

