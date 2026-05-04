# EcoTrack Project Management Frontend - Quick Reference

## 🎯 Feature Checklist

### Core Features
- [x] Create projects with full details
- [x] View projects in responsive grid
- [x] Edit projects (partial PATCH updates)
- [x] Delete projects with confirmation
- [x] Filter projects by status
- [x] Create milestones for projects
- [x] Edit milestone details and status
- [x] Delete milestones with confirmation
- [x] Create impact metrics with structured form
- [x] Add custom metrics dynamically
- [x] Edit impact metrics
- [x] Delete impact records
- [x] View project dashboard with analytics
- [x] Calculate and display project progress
- [x] Show environmental impact visualizations
- [x] Role-based access control (ADMIN, OFFICER)
- [x] JWT authentication and token management
- [x] Error handling and user feedback
- [x] Responsive design for all devices

### UI Components
- [x] Status badges with color coding
- [x] Modal dialogs for CRUD operations
- [x] Confirmation dialogs for destructive actions
- [x] Toast notifications for feedback
- [x] Loading skeletons while fetching
- [x] Empty states with helpful messages
- [x] Smooth animations and transitions
- [x] Responsive card layouts
- [x] Progress bars with percentages
- [x] Chart visualizations (bar, pie, line)

### Data Management
- [x] React Query for server state
- [x] Context API for auth state
- [x] Axios interceptors for API calls
- [x] Cache management and invalidation
- [x] Optimistic updates
- [x] Error boundary handling

---

## 🔗 API Endpoints Reference

### Projects
```
GET    /api/v1/projects
POST   /api/v1/projects                    (ADMIN/OFFICER)
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id                (ADMIN/OFFICER)
DELETE /api/v1/projects/:id                (ADMIN)
GET    /api/v1/projects/status/:status
```

### Milestones
```
GET    /api/v1/projects/:projectId/milestones
POST   /api/v1/projects/:projectId/milestones      (ADMIN/OFFICER)
GET    /api/v1/projects/milestones/:id
PATCH  /api/v1/projects/milestones/:id             (ADMIN/OFFICER)
DELETE /api/v1/projects/milestones/:id             (ADMIN/OFFICER)
GET    /api/v1/projects/milestones/status/:status
```

### Impact
```
GET    /api/v1/projects/:projectId/impact
POST   /api/v1/projects/:projectId/impact          (ADMIN/OFFICER/SCIENTIST)
PATCH  /api/v1/projects/:projectId/impact/status   (ADMIN/OFFICER)
PATCH  /api/v1/projects/:projectId/impact/metrics  (ADMIN/OFFICER/SCIENTIST)
PATCH  /api/v1/projects/:projectId/impact/metrics/custom  (ADMIN/OFFICER/SCIENTIST)
DELETE /api/v1/projects/:projectId/impact          (ADMIN)
DELETE /api/v1/projects/:projectId/impact/metrics/custom/:key  (ADMIN)
GET    /api/v1/projects/impact/:id
GET    /api/v1/projects/impact/status/:status
```

---

## 🎨 Tailwind Classes Used

### Colors
```
bark-800/600/400        - Text colors
forest-600/500          - Primary colors
earth-100/50            - Background tints
green-100/600           - Success states
yellow-100/600          - Warning states
red-100/600             - Error states
blue-100/600            - Info states
```

### Components
```
rounded-2xl             - Cards and modals
rounded-xl              - Input fields and buttons
rounded-lg              - Small components
rounded-full            - Badges
shadow-md               - Card shadows
shadow-lg               - Modal shadows
```

### Layout
```
grid                    - Grid layouts
gap-4/5/6               - Spacing
p-4                     - Padding
px-3 py-2.5             - Input spacing
flex items-center       - Flex utilities
```

---

## 📄 Page Routes

| Route | File | Purpose | Auth Required |
|-------|------|---------|---|
| `/projects` | ProjectsPage.jsx | Projects list | Yes |
| `/projects/dashboard` | ProjectDashboard.jsx | Analytics | Yes |
| `/projects/:id` | ProjectDetailPageEnhanced.jsx | Project detail | Yes |

---

## 🔐 Role Permissions

| Role | Can... |
|------|--------|
| ADMIN | Create, edit, delete projects, milestones, impact |
| OFFICER | Create, edit, delete projects, milestones; create/edit impact |
| SCIENTIST | View all; create/edit impact |
| CITIZEN | View all |
| INDUSTRY | View all |

---

## 📊 Component Hierarchy

```
App
├── AuthProvider
├── QueryClientProvider
├── AppRouter
│   ├── ProjectsPage
│   │   ├── ProjectCard
│   │   ├── CreateModal
│   │   └── EditModal
│   ├── ProjectDashboard
│   │   ├── StatisticCard
│   │   ├── Charts (Pie, Bar, Line)
│   │   └── ProjectsTable
│   └── ProjectDetailPageEnhanced
│       ├── ProjectCard
│       ├── MilestoneManagement
│       │   ├── MilestoneList
│       │   ├── MilestoneForm
│       │   └── StatusSelector
│       ├── ImpactManagement
│       │   ├── MetricsDisplay
│       │   ├── MetricsForm
│       │   ├── CustomMetricsInput
│       │   └── ImpactChart
│       └── EditProjectModal
```

---

## 🛠️ Common Tasks

### Create a Project
```
1. Click "New Project" button in /projects
2. Fill form: title, description, manager, dates, budget
3. Click "Create"
4. Project appears in grid
```

### Add Milestone to Project
```
1. Open project detail page (/projects/:id)
2. Scroll to Milestones section
3. Click "Add Milestone" button
4. Fill form: title, due date, description, status
5. Click "Create"
```

### Update Milestone Status
```
1. Hover over milestone
2. Click up/down arrow icon for status change
3. Select new status from dropdown/modal
4. Status updates immediately
```

### Add Impact Metrics
```
1. Open project detail page
2. In Impact section, click "Create Impact Metrics"
3. Fill structured form (not JSON)
4. Can add custom metrics later
5. Click "Create"
```

### Delete with Confirmation
```
1. Click trash/delete icon
2. Confirmation dialog appears
3. Review message about consequences
4. Click "Delete" to confirm or "Cancel" to abort
```

---

## 🧪 Testing Scenarios

```
✓ Create project with valid data
✓ Create project with missing required field (error)
✓ Edit project and verify changes saved
✓ Delete project and verify removed from list
✓ Create milestone for project
✓ Change milestone status multiple times
✓ Delete milestone and verify removed
✓ Create impact metrics with all fields
✓ Create impact with partial fields
✓ Add custom metric and verify saved
✓ Delete custom metric
✓ View dashboard and verify charts display
✓ View project detail and all sections visible
✓ Test on mobile - verify responsive layout
✓ Login as different roles and verify permissions
✓ Session expires and verify 401 redirect
✓ Network error - verify error message displayed
✓ Invalid data - verify validation displayed
```

---

## 🔍 Debugging Tips

### Check localStorage
```javascript
// In browser console
localStorage.getItem('ecotrack_auth')
// Should show: {"token":"...","userId":1,"role":"ADMIN",...}
```

### Check React Query cache
```javascript
// In browser React Query DevTools
// Open at bottom right of screen
// Shows all queries and mutations
```

### Check Network Requests
```javascript
// In browser DevTools Network tab
// Check request headers for Authorization: Bearer token
// Check response status codes (200, 400, 401, 403, 500)
```

### Common Error Messages
```
"Session expired. Please sign in again." 
→ 401 error, token invalid or expired

"Access denied. Insufficient permissions."
→ 403 error, user role not authorized

"Failed to create project"
→ 400/422 error, validation failed

"Server error. Please try again later."
→ 500 error, backend issue
```

---

## 📈 Performance Notes

- React Query caches for 30 seconds by default
- Vite builds with code splitting enabled
- Total JS bundle: ~1.1 MB (gzip: ~343 KB)
- Total CSS bundle: ~68 KB (gzip: ~16 KB)
- Load time: Optimized for fast initial load

---

## 🔄 State Flow Examples

### Creating a Project
```
1. User fills form → state updates
2. Click "Create" → mutation starts
3. API POST request sent with JWT
4. Backend validates and creates
5. Cache invalidated
6. Query auto-refetch
7. New project in list
8. Toast shows success
9. Modal closes
```

### Updating Milestone Status
```
1. Current status displayed
2. User clicks status icon
3. Status options shown in modal
4. User selects new status
5. PATCH request sent with JWT
6. Backend updates
7. Cache invalidated
8. Query refetch
9. UI shows new status
10. Toast confirms update
```

### Deleting Impact
```
1. User clicks delete
2. Confirmation dialog shown
3. User confirms deletion
4. DELETE request sent
5. Backend deletes record
6. Cache invalidated
7. Impact section cleared
8. Toast shows success
```

---

## 🎓 Code Examples

### Using useRole Hook
```javascript
import { useRole } from '../hooks/useRole';

export function MyComponent() {
  const { canManageProjects, role } = useRole();
  
  if (canManageProjects) {
    // Show edit/delete buttons
  }
  
  if (role === 'ADMIN') {
    // Show admin-only features
  }
}
```

### Working with Mutations
```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const qc = useQueryClient();
const mut = useMutation({
  mutationFn: (data) => projectsApi.updateProject(id, data),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['project', id] });
    toast.success('Updated');
  },
  onError: (err) => {
    toast.error(err.response?.data?.message || 'Error');
  }
});

// Usage
mut.mutate({ title: 'New Title' });
```

### Controlled Form Input
```javascript
const [form, setForm] = useState({ title: '', budget: '' });
const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

<input value={form.title} onChange={set('title')} />
```

---

## 📞 Support & Troubleshooting

### Build Issues
```sh
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Dev Server Issues
```sh
# Kill port 5173 and restart
npm run dev
```

### API Connection Issues
```
Check if backend is running on correct port
Check CORS settings if different origins
Check JWT token is valid
Check API base URL in axiosInstance.js
```

---

## 📅 Maintenance Checklist

- [ ] Weekly: Check error logs
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Performance audit
- [ ] Yearly: Security review

---

**Last Updated**: May 4, 2026
**Version**: 1.0.0
**Status**: Verified and Tested ✅

