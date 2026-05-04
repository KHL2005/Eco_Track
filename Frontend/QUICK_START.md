# EcoTrack Frontend - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Prerequisites
```bash
# Verify you have Node.js 18+
node --version  # Should be v18.x or higher

# Verify npm is installed
npm --version
```

### 2. Install Dependencies
```bash
cd Frontend
npm install
```

### 3. Start Development Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 4. Backend Requirements
Ensure backend is running:
```bash
# Backend should be running on http://localhost:8090
# Check via: curl http://localhost:8090/health
```

---

## 📂 Project Structure at a Glance

```
src/
├── components/          # Reusable UI widgets
├── pages/              # Full pages (ProjectsPage, ProjectDetailPageEnhanced, etc.)
├── api/                # API layer (projectsApi.js)
├── context/            # Global state (AuthContext)
├── routes/             # Routing configuration
├── utils/              # Helpers, constants, formatters
├── hooks/              # Custom React hooks
├── layouts/            # Layout wrappers
└── types/              # TypeScript types (if using)
```

---

## 🎯 Main Pages

| Path | Component | Purpose |
|------|-----------|---------|
| `/projects` | ProjectsPage | List all projects, create/edit/delete |
| `/projects/:id` | ProjectDetailPageEnhanced | Project details with milestones & impact |
| `/projects/dashboard` | ProjectDashboard | Analytics dashboard |
| `/login` | LoginPage | Authentication |

---

## 🔑 Key Components

### Projects
```javascript
// List and manage projects
<ProjectsPage />

// View detailed project with nested features
<ProjectDetailPageEnhanced />
```

### Milestones
```javascript
// Add/edit/delete milestones within project details
<MilestoneManagement
  projectId={projectId}
  milestones={milestones}
  onRefresh={refetch}
  canEdit={canManageProjects}
/>
```

### Impact Metrics
```javascript
// Create/update environmental impact
<ImpactManagement
  projectId={projectId}
  impact={impact}
  onRefresh={refetch}
  canEdit={canManageProjects}
/>
```

---

## 🔌 API Usage Example

```javascript
import * as projectsApi from '../api/projectsApi';

// Get all projects
const { data: projects } = await projectsApi.getProjects();

// Create new project
const newProject = await projectsApi.createProject({
  title: "Solar Panels",
  startDate: "2026-06-01",
  description: "Install solar panels",
});

// Get project by ID
const project = await projectsApi.getProjectById(1);

// Update project (PATCH)
const updated = await projectsApi.updateProject(1, {
  status: "IN_PROGRESS"
});

// Add milestone
const milestone = await projectsApi.addMilestone(1, {
  title: "Site Survey",
  date: "2026-06-15",
});

// Create impact
const impact = await projectsApi.addOrUpdateImpact(1, {
  metrics: {
    treesPlanted: 500,
    co2ReducedTons: 120,
  }
});
```

---

## 🎨 Component Usage

### Modal Example
```javascript
import Modal from '../components/Modal';
import Button from '../components/Button';

export function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      
      <Modal 
        open={open} 
        onClose={() => setOpen(false)} 
        title="My Modal"
        size="md"  // sm, md, lg
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

### Status Badge Example
```javascript
import StatusBadge from '../components/StatusBadge';

// Auto-colors based on status
<StatusBadge status="COMPLETED" />  // Green
<StatusBadge status="IN_PROGRESS" /> // Yellow
<StatusBadge status="PLANNED" />     // Blue
```

### Card Example
```javascript
import Card from '../components/Card';

<Card>
  <h2>Project Title</h2>
  <p>Project description</p>
</Card>
```

---

## 🔄 State Management Pattern

### Using React Query
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data
const { data: projects, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: () => projectsApi.getProjects().then(r => r.data),
});

// Mutate data
const createMut = useMutation({
  mutationFn: (data) => projectsApi.createProject(data),
  onSuccess: () => {
    // Invalidate cache to refetch
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  },
});
```

---

## 📢 Error Handling

Errors are automatically handled by Axios interceptor:

```javascript
// Automatic toast notification on error
try {
  await projectsApi.getProjects();
} catch (err) {
  // Toast shown automatically
  // 401 → Auto logout
  // 403 → Permission denied message
  // 5xx → Server error message
}
```

---

## 🎯 Common Tasks

### Add New Project Field
1. Backend: Add field to `ProjectRequest` DTO
2. Frontend: Update `projectsApi.js`
3. Component: Add field to form
4. Example:
```javascript
// In ProjectsPage form
<input 
  value={form.newField}
  onChange={set('newField')}
  placeholder="New Field"
/>
```

### Add New Page
1. Create file in `src/pages/`
2. Add route in `src/routes/AppRouter.jsx`
```javascript
<Route 
  path="/my-page" 
  element={<ProtectedRoute><MyPage /></ProtectedRoute>} 
/>
```
3. Add navigation link in layout

### Format Data Display
```javascript
import { formatDate, formatCurrency, formatNumber } from '../utils/formatters';

formatDate("2026-05-04")      // "May 4, 2026"
formatCurrency(1000000)       // "$1,000,000.00"
formatNumber(1000)            // "1,000"
```

---

## 🧪 Testing Endpoints

### Test Create Project
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Project",
    "startDate": "2026-05-04",
    "description": "Test"
  }'
```

### Test Get Projects
```bash
curl -X GET http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Debug Tips

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Look for `/api/v1/...` requests
4. Check response format matches expectation

### Check Console Logs
1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check component prop values

### Check React State
1. Install React DevTools browser extension
2. Open DevTools (F12)
3. Go to Components tab
4. Inspect component state and props

---

## 📚 Build & Deploy

### Local Build
```bash
npm run build
# Creates optimized build in dist/ folder
```

### Preview Production Build
```bash
npm run preview
# Starts server with production build
```

### Deploy to Server
```bash
# Build
npm run build

# Copy dist/ folder to web server
# Configure web server to point to index.html

# Set environment variables
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot GET /api/v1/projects" | Backend not running on 8090 |
| "Token not attached" | Check localStorage has `ecotrack_auth` |
| "Fields undefined" | Check API returns correct field names |
| "Styles not loading" | Ensure Tailwind installed: `npm install` |
| "Infinite loading" | Check network tab for failed requests |

---

## 📖 Documentation Files

- **IMPLEMENTATION_COMPLETE.md** - Full feature list
- **TESTING_VALIDATION_GUIDE.md** - QA checklist
- **IMPACT_METRICS_FORM_GUIDE.md** - Component details
- **IMPLEMENTATION_SUMMARY.md** - What was changed

---

## 🔗 Useful Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run lint  # (if eslint configured)
```

---

## 📞 Quick Help

**Need to add a feature?**
1. Check if API endpoint exists in backend
2. Add API call to `src/api/projectsApi.js`
3. Use in component with `useQuery` or `useMutation`
4. Add UI component to display results

**Need to fix a bug?**
1. Check browser console for errors
2. Check network tab for API failures
3. Verify API response format
4. Check component prop values in React DevTools

**Need to style something?**
1. Use Tailwind CSS classes
2. Reference color scheme: forest-600, green-600, earth-50, bark-800, red-600
3. See `src/utils/constants.js` for status colors

---

**Happy coding! 🎉**

For detailed information, see the full documentation files in the Frontend directory.

