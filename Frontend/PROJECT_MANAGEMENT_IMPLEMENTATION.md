# EcoTrack Project Management Frontend - Implementation Guide

## Overview

This document describes the complete, production-ready React frontend for the EcoTrack Project Management Microservice, built with modern enterprise architecture patterns.

---

## 🎯 Features Implemented

### 1. **Project Management**
- ✅ Create projects with title, description, manager name, dates, and budget
- ✅ View all projects in a responsive card grid
- ✅ Edit existing projects (partial/PATCH updates)
- ✅ Delete projects with confirmation dialog
- ✅ Filter projects by status
- ✅ Display project metadata (dates, budget, manager)

### 2. **Milestone Management**
- ✅ Create milestones for projects with title, due date, and description
- ✅ View milestones in a detailed list format
- ✅ Edit milestone details (title, date, description, status)
- ✅ Update milestone status inline (PENDING → IN_PROGRESS → COMPLETED → DELAYED)
- ✅ Delete milestones with confirmation
- ✅ Track completion dates automatically
- ✅ Visual status indicators with color coding

### 3. **Impact Metrics Management**
- ✅ Create impact records with structured form (not JSON)
- ✅ Track multiple predefined metrics:
  - Trees Planted
  - CO₂ Reduced (tons)
  - Water Saved (liters)
  - Area Restored (m²)
  - Number of Beneficiaries
  - Pollution Reduced (%)
- ✅ Add custom metrics dynamically
- ✅ Edit and delete impact metrics
- ✅ Update impact status (DRAFT → PUBLISHED → ARCHIVED)
- ✅ Visual metric display with icons and values

### 4. **Project Dashboard**
- ✅ Comprehensive analytics dashboard
- ✅ Key statistics:
  - Total projects count
  - Completed projects with completion rate
  - In-progress and planned projects
  - Total budget across all projects
- ✅ Status distribution pie chart
- ✅ Top projects by budget bar chart
- ✅ Project timeline line chart
- ✅ Projects table with quick info
- ✅ Responsive grid layout

### 5. **Project Progress Tracking**
- ✅ Automatic progress calculation based on milestones
- ✅ Visual progress bar with percentage
- ✅ Milestone completion counter
- ✅ Real-time updates as milestones are marked complete

### 6. **Project Detail Page**
- ✅ Comprehensive project information display
- ✅ Edit and delete project buttons
- ✅ Embedded milestone management
- ✅ Embedded impact metrics management
- ✅ Impact data visualization with charts
- ✅ Statistics cards (milestone count, completed, in progress)
- ✅ Responsive design for all screen sizes

### 7. **UI/UX Features**
- ✅ Status badges with color coding
- ✅ Smooth animations and transitions
- ✅ Loading skeletons for data fetching
- ✅ Empty states with helpful messages
- ✅ Toast notifications for actions (success/error)
- ✅ Confirmation dialogs before destructive actions
- ✅ Modal dialogs for CRUD operations
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Tailwind CSS with eco-friendly color scheme

### 8. **API Integration**
- ✅ Centralized API service layer (projectsApi.js)
- ✅ Axios request interceptor for JWT token injection
- ✅ Axios response interceptor for error handling
- ✅ Proper error messages from backend
- ✅ React Query for data fetching and caching
- ✅ Optimistic updates and mutations

### 9. **Authentication & Authorization**
- ✅ Role-based access control (ADMIN, OFFICER can manage projects)
- ✅ Protected routes with authentication guard
- ✅ JWT token handling and persistence
- ✅ Automatic session expiration handling (401 redirect)
- ✅ Graceful permission denied handling (403)

### 10. **State Management**
- ✅ React Query for server state
- ✅ Context API for auth state
- ✅ Local state for UI interactions
- ✅ Proper cache invalidation after mutations

---

## 📁 Project Structure

```
src/
├── api/
│   ├── projectsApi.js          # All project, milestone, impact API calls
│   ├── axiosInstance.js        # Axios configuration with interceptors
│   └── ...other services...
├── components/
│   ├── MilestoneManagement.jsx # Milestone CRUD and status updates
│   ├── ImpactManagement.jsx    # Impact metrics CRUD with forms
│   ├── Button.jsx              # Reusable button component
│   ├── Card.jsx                # Reusable card component
│   ├── Modal.jsx               # Reusable modal dialog
│   ├── StatusBadge.jsx         # Status indicator component
│   ├── PageHeader.jsx          # Page title and action area
│   └── ...other components...
├── pages/
│   ├── ProjectsPage.jsx        # Projects list with create/edit/delete
│   ├── ProjectDetailPageEnhanced.jsx  # Full project detail view
│   ├── ProjectDashboard.jsx    # Dashboard with analytics
│   └── ...other pages...
├─��� context/
│   └── AuthContext.jsx         # Authentication state management
├── hooks/
│   ├── useRole.js              # Role-based access checks
│   └── ...other hooks...
├── utils/
│   ├── constants.js            # Status enums, colors, labels
│   ├── formatters.js           # Date, currency, number formatting
│   └── ...other utilities...
├── routes/
│   ├── AppRouter.jsx           # Route configuration
│   └── Guards.jsx              # Protected route guards
└── App.jsx                     # App root with providers
```

---

## 🔗 API Routes

All routes are relative to `/api/v1`:

### Projects
```
GET    /projects                    # Get all projects
GET    /projects/:id                # Get project by ID
GET    /projects/status/:status     # Filter by status
POST   /projects                    # Create project (ADMIN/OFFICER)
PATCH  /projects/:id                # Update project (ADMIN/OFFICER)
DELETE /projects/:id                # Delete project (ADMIN)
```

### Milestones
```
GET    /projects/:projectId/milestones              # Get milestones for project
GET    /projects/milestones/:id                     # Get milestone by ID
GET    /projects/milestones/status/:status          # Filter by status
POST   /projects/:projectId/milestones              # Create milestone (ADMIN/OFFICER)
PATCH  /projects/milestones/:id                     # Update milestone (ADMIN/OFFICER)
DELETE /projects/milestones/:id                     # Delete milestone (ADMIN/OFFICER)
```

### Impact Metrics
```
GET    /projects/:projectId/impact                  # Get impact for project
GET    /projects/impact/:id                         # Get impact by ID
GET    /projects/impact/status/:status              # Filter by status
POST   /projects/:projectId/impact                  # Create/update impact (ADMIN/OFFICER/SCIENTIST)
PATCH  /projects/:projectId/impact/status           # Update impact status (ADMIN/OFFICER)
PATCH  /projects/:projectId/impact/metrics          # Patch specific metrics (ADMIN/OFFICER/SCIENTIST)
PATCH  /projects/:projectId/impact/metrics/custom   # Add custom metrics (ADMIN/OFFICER/SCIENTIST)
DELETE /projects/:projectId/impact                  # Delete impact (ADMIN)
DELETE /projects/:projectId/impact/metrics/custom/:key  # Remove custom metric (ADMIN)
```

---

## 🎨 Design System

### Colors (Tailwind Custom Classes)
- **Primary**: `#2D6A4F` (forest-600)
- **Accent**: `#52B788` (forest-500)
- **Background**: `#F0F4F0` (earth-50)
- **Text**: `#1B1B1B` (bark-800)
- **Error**: `#D62828` (red-600)
- **Font**: Inter (via Tailwind)

### Key Styling Classes
- `bark-800/600/400`: Text colors (dark to light)
- `forest-600/500`: Primary colors
- `earth-100/50`: Background tints
- `bg-green-100`: Success states
- `bg-yellow-100`: Warning states
- `bg-red-100`: Error states

### Components
- **Card**: Rounded corners (rounded-2xl), subtle shadows, padding
- **Buttons**: Multiple sizes (sm, md, lg) and variants (primary, outline, ghost)
- **Modals**: Centered, backdrop blur, smooth animations
- **Status Badges**: Color-coded, inline display
- **Status Options**: Dropdown or radial button selections

---

## 🚀 Usage Guide

### Creating a Project
1. Navigate to `/projects`
2. Click "New Project" button
3. Fill in project details (title, description, manager, dates, budget)
4. Click "Create"
5. Project appears in the grid with color-coded status

### Managing Milestones
1. Open project detail page
2. Scroll to Milestones section
3. Click "Add Milestone"
4. Enter milestone title, due date, and description
5. Click "Create"
6. To edit or change status, hover over milestone and click buttons
7. To delete, click trash icon and confirm

### Managing Impact Metrics
1. Open project detail page
2. Scroll to Environmental Impact section
3. Click "Create Impact Metrics"
4. Fill in metric values (all fields optional initially)
5. Can add custom metrics dynamically
6. Update, change status, or delete as needed

### Viewing Dashboard
1. Navigate to `/projects/dashboard`
2. View comprehensive statistics and charts
3. See project timeline and budget distribution
4. Quick table of all active projects

---

## 🔐 Authentication & Authorization

### Role Requirements
- **Create/Edit/Delete Projects**: ADMIN, OFFICER
- **Create/Edit/Delete Milestones**: ADMIN, OFFICER
- **Create/Edit Impact**: ADMIN, OFFICER, SCIENTIST
- **View All**: All authenticated users

### Token Management
- Tokens stored in localStorage as `ecotrack_auth`
- Automatically attached to all requests via axios interceptor
- Automatically clear on 401 (session expired)
- Redirect to login on authentication failure

---

## 📊 Data Models

### Project
```javascript
{
  id: number,
  title: string,
  description: string,
  managerName: string,
  startDate: ISO8601,
  endDate: ISO8601,
  budget: decimal,
  status: enum(PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED),
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

### Milestone
```javascript
{
  id: number,
  projectId: number,
  title: string,
  date: ISO8601,        // Note: backend uses 'date', not 'dueDate'
  dueDate: ISO8601,     // Alternative field name
  description: string,
  status: enum(PENDING, IN_PROGRESS, COMPLETED, DELAYED),
  completedAt: ISO8601,
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

### Impact
```javascript
{
  id: number,
  projectId: number,
  treesPlanted: number,
  co2ReducedTons: number,
  waterSavedLiters: number,
  areaRestoredSqm: number,
  beneficiariesCount: number,
  pollutionReduced: number,
  customMetrics: object,      // Dynamic key-value pairs
  status: enum(DRAFT, PUBLISHED, ARCHIVED),
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

---

## 🛠️ Development Tips

### Adding New Features

1. **Add API calls** in `src/api/projectsApi.js`
2. **Create components** in `src/components/` for reusability
3. **Create pages** in `src/pages/` for new routes
4. **Register routes** in `src/routes/AppRouter.jsx`
5. **Use existing patterns** for consistency

### Common Patterns

**Data Fetching:**
```javascript
const { data, isLoading } = useQuery({
  queryKey: ['projects', id],
  queryFn: () => projectsApi.getProjectById(id).then(r => r.data),
});
```

**Mutations:**
```javascript
const mut = useMutation({
  mutationFn: (d) => projectsApi.updateProject(id, d),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['projects'] });
    toast.success('Updated');
  },
  onError: (err) => toast.error(err.response?.data?.message),
});
```

**State Management:**
```javascript
const [form, setForm] = useState({ title: '' });
const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
```

---

## 🧪 Testing Checklist

- [ ] Create project with valid data
- [ ] Edit project details
- [ ] Delete project with confirmation
- [ ] Add milestone to project
- [ ] Update milestone status
- [ ] Delete milestone
- [ ] Create impact metrics
- [ ] Add custom metrics
- [ ] Delete impact metrics
- [ ] View project dashboard
- [ ] Check responsive design on mobile
- [ ] Verify error handling (invalid data, network errors)
- [ ] Test permission denied scenarios
- [ ] Verify session expiration handling

---

## 📝 Notes

- All API calls use PATCH for updates (supports partial updates)
- Milestone date field may be `date` or `dueDate` depending on backend response
- Custom metrics are stored as a JSON object and can be any key-value pairs
- Progress percentage is calculated as: (completed milestones / total milestones) × 100
- Delete operations require confirmation to prevent accidental data loss
- Toast notifications provide feedback for all user actions

---

## 🔄 Future Enhancements

- [ ] Bulk operations (create multiple milestones at once)
- [ ] Project templates for common project types
- [ ] Milestone dependencies (milestone B cannot start until milestone A is done)
- [ ] Export project reports to PDF
- [ ] Project timeline gantt chart
- [ ] Milestone notifications
- [ ] Project collaboration features
- [ ] Advanced filtering and search
- [ ] Project comparison view
- [ ] Performance metrics and KPIs

---

## 📞 Support

For issues or questions, refer to the backend API documentation or the swagger UI at:
- `http://localhost:8090/project/swagger-ui/index.html`

---

**Last Updated**: May 4, 2026
**Version**: 1.0.0
**Status**: Production Ready

