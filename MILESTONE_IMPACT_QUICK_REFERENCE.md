# Quick Reference: Milestone & Impact Management

## 🚀 Quick Start

### File to Modify
`Frontend/src/pages/ProjectDetailPage.jsx`

### Key Components

#### 1. Milestone Operations
```javascript
// Add milestone
const addMilestoneMutation = useMutation({
  mutationFn: (data) => projectsApi.addMilestone(id, data),
  // ...
});

// Update milestone
const updateMilestoneMutation = useMutation({
  mutationFn: (data) => projectsApi.updateMilestone(milestoneId, data),
  // ...
});

// Delete milestone
const deleteMilestoneMutation = useMutation({
  mutationFn: (id) => projectsApi.deleteMilestone(id),
  // ...
});
```

#### 2. Impact Operations
```javascript
// Add/Update impact
const addOrUpdateImpactMutation = useMutation({
  mutationFn: (data) => projectsApi.addOrUpdateImpact(id, data),
  // ...
});

// Delete impact
const deleteImpactMutation = useMutation({
  mutationFn: () => projectsApi.deleteImpact(id),
  // ...
});
```

---

## 📊 Data Structures

### Milestone Object
```javascript
{
  milestoneId: 1,
  projectId: 101,
  title: "Site Assessment",
  date: "2024-06-15",           // LocalDate format
  status: "PENDING",             // PENDING | IN_PROGRESS | COMPLETED | DELAYED
  createdAt: "2024-05-04T10:30:00",
  updatedAt: "2024-05-04T10:30:00"
}
```

### Impact Object
```javascript
{
  impactId: 1,
  projectId: 101,
  metrics: {
    treesPlanted: 500,
    areaRestoredHectares: 25.5,
    co2ReducedTons: 120.0,
    renewableEnergyKwh: 5000.0,
    wasteCollectedKg: 3000.0,
    waterBodiesCleaned: 3,
    pollutionIncidentsResolved: 12,
    peopleBenefited: 10000,
    awarenessSessionsConducted: 8,
    volunteerEngagements: 150,
    customMetrics: {...},
    notes: "Optional notes string"
  },
  date: "2024-05-04",
  status: "DRAFT",               // DRAFT | PUBLISHED | ARCHIVED
  createdAt: "2024-05-04T10:30:00",
  updatedAt: "2024-05-04T10:30:00"
}
```

---

## 🎛️ UI States

### Milestone Card States
```
PENDING     → Slate/Gray border-left + light gray background
IN_PROGRESS → Yellow border-left + light yellow background
COMPLETED   → Green border-left + light green background
DELAYED     → Red border-left + light red background
```

### Impact Status Badge States
```
DRAFT       → bg-slate-100 text-slate-700
PUBLISHED   → bg-green-100 text-green-700
ARCHIVED    → bg-purple-100 text-purple-700
```

---

## 🔗 API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/projects/{projectId}/milestones` | Create milestone |
| GET | `/api/v1/projects/{projectId}/milestones` | List milestones |
| PATCH | `/api/v1/projects/milestones/{milestoneId}` | Update milestone |
| DELETE | `/api/v1/projects/milestones/{milestoneId}` | Delete milestone |
| POST | `/api/v1/projects/{projectId}/impact` | Create/update impact |
| GET | `/api/v1/projects/{projectId}/impact` | Get impact |
| DELETE | `/api/v1/projects/{projectId}/impact` | Delete impact |

---

## ✅ Common Tasks

### Add a New Milestone Field
1. Update backend `MilestoneRequest.java` DTO
2. Update backend `Milestone.java` entity
3. Update frontend form state in `setMilestoneForm`
4. Add input field to milestone modal
5. Test with backend endpoint

### Add a New Impact Metric
1. Update backend `ImpactMetrics.java` DTO
2. Add to frontend `impactForm.metrics` object
3. Add input in impact modal
4. (Optional) Add to chart visualization
5. Test with backend endpoint

### Change Status Colors
1. Update `MILESTONE_COLOR` or `MILESTONE_BADGE_COLOR` map
2. Or use status-based inline Tailwind classes
3. Test rendering on different statuses

---

## 🧪 Testing Guide

### Test Milestone Creation
```javascript
// Form data
{
  title: "Phase 1",
  date: "2024-06-15",
  status: "PENDING"
}
// Expected: Toast success → Milestone appears in list
```

### Test Impact Update
```javascript
// Form data
{
  metrics: {
    treesPlanted: 500,
    co2ReducedTons: 100,
    notes: "Test impact"
  },
  status: "PUBLISHED"
}
// Expected: Toast success → Chart updates → Status badge shows PUBLISHED
```

### Test Progress Calculation
```javascript
// With milestones: [PENDING, IN_PROGRESS, COMPLETED, COMPLETED]
// Expected progress: 50% (2 out of 4 completed)
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Milestones not loading | API error | Check network tab, verify auth token |
| Chart not showing | No impact data | Ensure metrics have non-zero values |
| "Create" button disabled | Form validation failed | Check required fields highlighted |
| Modal won't close | Mutation still loading | Wait for loading spinner to stop |
| 401 Unauthorized | Invalid token | Re-authenticate user |
| 403 Forbidden | Insufficient permissions | Verify user is OFFICER or ADMIN |

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
grid-cols-2 gap-4  /* Milestone cards: 1 col */
grid-cols-2 gap-3  /* Impact cards: 2 cols */

/* Tablet */
md:grid-cols-3     /* Impact cards: 3 cols */

/* Desktop */
lg:grid-cols-6     /* Impact cards: 6 cols */
```

---

## 🎨 Color Reference

| Color | Tailwind | Use Case |
|-------|----------|----------|
| forest-600 | #16a34a | Primary action, icons |
| leaf-400 | #4ade80 | Accents, success |
| sky-500 | #0ea5e9 | Info, links |
| yellow-400 | #f59e0b | In-progress warning |
| red-600 | #dc2626 | Delete, error, delayed |
| bark-800 | #292524 | Text, headings |
| bark-600 | #57534e | Secondary text |
| earth-100 | #f5f5f4 | Background cards |

---

## 💾 State Management Patterns

### Using React Query
```javascript
// Fetch
const { data: milestones = [] } = useQuery({
  queryKey: ['milestones', id],
  queryFn: () => projectsApi.getMilestonesByProject(id)
    .then(r => r.data),
});

// Mutate
const mutation = useMutation({
  mutationFn: (data) => projectsApi.addMilestone(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['milestones', id] });
    toast.success('Success');
  },
});

// Submit
mutation.mutate(formData);
```

### Using useState
```javascript
const [milestoneForm, setMilestoneForm] = useState({
  title: '',
  date: '',
  status: 'PENDING'
});

// Update
setMilestoneForm({ ...milestoneForm, title: 'New Title' });

// Reset
setMilestoneForm({ title: '', date: '', status: 'PENDING' });
```

---

## 🔐 Permission Checks

```javascript
import { useRole } from '../hooks/useRole';

export default function MyComponent() {
  const { canManageProjects } = useRole();
  
  return (
    <>
      {canManageProjects && (
        <Button onClick={handleAdd}>Add Item</Button>
      )}
    </>
  );
}
```

### Roles that can manage:
- ADMINISTRATOR
- SUPER_ADMIN
- OFFICER

---

## 📦 Package Dependencies

Already installed:
- `@tanstack/react-query` - Data fetching
- `recharts` - Charting
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `framer-motion` - Animations
- `react-router-dom` - Routing

---

## 🎯 Performance Tips

1. Use `useMemo` for computed values
2. Avoid inline event handlers
3. Use loading states to prevent double-clicks
4. Lazy load charts only when data exists
5. Leverage React Query caching

---

## 🔍 Debugging

### Check Console Logs
```javascript
console.log('Milestones:', milestones);
console.log('Impact:', impact);
console.log('Progress:', progress);
```

### Inspect API Responses
```javascript
const { data: milestones } = useQuery({
  queryKey: ['milestones', id],
  queryFn: async () => {
    const res = await projectsApi.getMilestonesByProject(id);
    console.log('API Response:', res.data);
    return res.data;
  },
});
```

### Check Form State
```javascript
console.log('Milestone Form:', milestoneForm);
console.log('Impact Form:', impactForm);
```

---

## 📞 Support Resources

- **Backend Docs**: `Backend/project-management-service/README.md`
- **API Specs**: Postman collection in `Backend/`
- **Frontend Guides**: All `.md` files in `Frontend/`

---

## ✨ Next Enhancements

Potential future features:
- [ ] Milestone templates
- [ ] Impact predictions
- [ ] Milestone notifications
- [ ] Team collaboration on milestones
- [ ] Milestone dependencies
- [ ] Historical impact trends
- [ ] Impact sharing/export

---

Generated: May 4, 2024
Version: 1.0

