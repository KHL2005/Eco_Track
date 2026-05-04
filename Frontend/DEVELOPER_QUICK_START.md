# EcoTrack Frontend - Developer Quick Start

## 🚀 Getting Started (5 minutes)

### Prerequisites
```bash
Node.js >= 16.0.0
npm >= 8.0.0
```

### Setup
```bash
# 1. Navigate to frontend directory
cd Frontend/

# 2. Install dependencies
npm install

# 3. Create .env file (copy from .env.example)
cp .env.example .env

# 4. Edit .env - set correct API URL
VITE_API_BASE_URL=http://localhost:8090

# 5. Start development server
npm run dev

# 6. Open browser
open http://localhost:3000
```

---

## 📁 Project Structure

```
src/
├── api/                    # API service layer
│   ├── axiosInstance.js   # Axios config with interceptors
│   └── projectsApi.js     # Projects, milestones, impact endpoints
├── components/            # Reusable UI components
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Modal.jsx
│   ├── StatusBadge.jsx
│   ├── MilestoneManagement.jsx
│   ├── ImpactManagement.jsx
│   ├── ImpactMetricsForm.jsx
│   └── ... (20+ more)
├── context/              # Global state
│   └── AuthContext.jsx
├── hooks/               # Custom hooks
│   └── useRole.js
├── layouts/             # Page layouts
│   ├── DashboardLayout.jsx
│   └── PublicLayout.jsx
├── pages/              # Route-level pages
│   ├── ProjectsPage.jsx
│   ├── ProjectDetailPageEnhanced.jsx
│   ├── ProjectDashboard.jsx
│   ├── LoginPage.jsx
│   └── ... (20+ more)
├── routes/            # Routing & guards
│   ├── AppRouter.jsx
│   └── Guards.jsx
├── utils/            # Helper functions
│   ├── constants.js
│   └── formatters.js
└── App.jsx, main.jsx, index.css
```

---

## 🎯 Quick Tasks

### Add a New Page

**1. Create page file**
```javascript
// pages/MyNewPage.jsx
import DashboardLayout from '../layouts/DashboardLayout';

export default function MyNewPage() {
  return (
    <DashboardLayout>
      <h1>My New Page</h1>
    </DashboardLayout>
  );
}
```

**2. Add route**
```javascript
// routes/AppRouter.jsx
import MyNewPage from '../pages/MyNewPage';

<Route 
  path="/my-new-page" 
  element={<ProtectedRoute><MyNewPage /></ProtectedRoute>} 
/>
```

**3. Add navigation**
```javascript
// layouts/DashboardLayout.jsx
const navByRole = {
  OFFICER: [
    ...existing,
    { label: 'My New Page', icon: MyIcon, to: '/my-new-page' },
  ]
}
```

### Create a New Component

**1. Component file**
```javascript
// components/MyComponent.jsx
import PropTypes from 'prop-types';

export default function MyComponent({ title, onAction }) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onAction: PropTypes.func,
};
```

**2. Use in page**
```javascript
import MyComponent from '../components/MyComponent';

<MyComponent title="Hello" onAction={() => console.log('clicked')} />
```

### Add a New API Service

**1. Create API file**
```javascript
// api/myFeatureApi.js
import axiosInstance from './axiosInstance';

export const getMyFeature = () => 
  axiosInstance.get('/my-feature');

export const createMyFeature = (data) => 
  axiosInstance.post('/my-feature', data);

export const updateMyFeature = (id, data) => 
  axiosInstance.patch(`/my-feature/${id}`, data);

export const deleteMyFeature = (id) => 
  axiosInstance.delete(`/my-feature/${id}`);
```

**2. Use in component**
```javascript
import { useQuery, useMutation } from '@tanstack/react-query';
import * as myFeatureApi from '../api/myFeatureApi';

const { data, isLoading } = useQuery({
  queryKey: ['myFeature'],
  queryFn: () => myFeatureApi.getMyFeature().then(r => r.data)
});

const mutation = useMutation({
  mutationFn: (data) => myFeatureApi.createMyFeature(data),
  onSuccess: () => {
    // Handle success
  }
});
```

---

## 💡 Common Patterns

### Feature CRUD Pattern

```javascript
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { toast } from 'sonner';
import * as featureApi from '../api/featureApi';

export default function FeatureManager() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '' });

  // Read
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => featureApi.getAll().then(r => r.data).catch(() => []),
  });

  // Create
  const createMut = useMutation({
    mutationFn: (data) => featureApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      toast.success('Created!');
      setModal(false);
    }
  });

  // Update
  const updateMut = useMutation({
    mutationFn: (data) => featureApi.update(editId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      toast.success('Updated!');
      setModal(false);
    }
  });

  // Delete
  const deleteMut = useMutation({
    mutationFn: (id) => featureApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      toast.success('Deleted!');
    }
  });

  const handleSubmit = () => {
    if (!form.title) {
      toast.error('Title required');
      return;
    }
    if (editId) {
      updateMut.mutate(form);
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <div>
      <Button onClick={() => { setModal(true); setEditId(null); }}>
        New Item
      </Button>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="p-4 border rounded">
            <h3>{item.title}</h3>
            <button onClick={() => { setEditId(item.id); setModal(true); }}>
              Edit
            </button>
            <button onClick={() => deleteMut.mutate(item.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit' : 'Create'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              loading={createMut.isPending || updateMut.isPending}
            >
              {editId ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

### Form Pattern with Validation

```javascript
const [form, setForm] = useState({
  title: '',
  email: '',
  age: '',
});
const [errors, setErrors] = useState({});

const validate = () => {
  const newErrors = {};
  if (!form.title) newErrors.title = 'Title required';
  if (!form.email?.includes('@')) newErrors.email = 'Valid email required';
  if (form.age && form.age < 18) newErrors.age = 'Must be 18+';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = () => {
  if (!validate()) return;
  // Submit form
};

return (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-1">Title *</label>
      <input
        className={`w-full border rounded px-3 py-2 ${
          errors.title ? 'border-red-500' : 'border-gray-300'
        }`}
        value={form.title}
        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
      />
      {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
    </div>
  </div>
);
```

### Permission Check Pattern

```javascript
import { useRole } from '../hooks/useRole';

export default function AdminPanel() {
  const { isAdmin, canManageProjects } = useRole();

  if (!isAdmin) {
    return <div>You don't have permission</div>;
  }

  return (
    <div>
      {canManageProjects && (
        <button>Manage Projects</button>
      )}
    </div>
  );
}
```

---

## 🔧 Available Hooks & Utils

### useRole
```javascript
import { useRole } from '../hooks/useRole';

const {
  role,
  user,
  isAdmin,
  isOfficer,
  isCitizen,
  isScientist,
  canManageProjects,
  canManageIssues,
  hasRole('OFFICER', 'SCIENTIST')
} = useRole();
```

### useAuth
```javascript
import { useAuth } from '../context/AuthContext';

const { user, token, login, logout, isAuthenticated } = useAuth();
```

### Formatters
```javascript
import { formatDate, formatCurrency, formatNumber, labelify } from '../utils/formatters';

formatDate('2026-05-04')              // "May 4, 2026"
formatCurrency(50000)                 // "$50,000.00"
formatNumber(1500.5)                  // "1,500.5"
labelify('IN_PROGRESS')               // "In Progress"
```

### Constants
```javascript
import { PROJECT_STATUSES, MILESTONE_STATUSES, IMPACT_STATUSES } from '../utils/constants';

PROJECT_STATUSES      // ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']
MILESTONE_STATUSES    // ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED']
IMPACT_STATUSES       // ['DRAFT', 'PUBLISHED', 'ARCHIVED']
```

---

## 🎨 Tailwind Classes Reference

### Colors
```
// Primary Green Palette
bg-forest-900        text-forest-600
bg-forest-800        text-forest-700
bg-forest-700        text-leaf-400
bg-forest-600        text-leaf-200
text-forest-500      text-sky-500

// Neutral
bg-earth-100         text-bark-800
bg-earth-50          text-bark-600
                     text-bark-400
```

### Common Classes
```
// Rounded
rounded-xl           // 12px
rounded-2xl          // 16px

// Padding
p-4                  // 1rem (16px)
p-6                  // 1.5rem (24px)
px-4 py-2           // Horizontal & vertical

// Grid
grid md:grid-cols-2  // 1 col on mobile, 2 on tablet+
grid md:grid-cols-3 xl:grid-cols-4

// Gaps
gap-3               // 0.75rem
gap-4               // 1rem

// Shadows
shadow-sm           // Subtle
shadow-md           // Medium

// Transitions
transition-all duration-200
hover:bg-earth-100
```

---

## 🐛 Debugging Tips

### Check API Requests
```javascript
// In browser DevTools (F12)
// Network tab → Filter by "Fetch/XHR"
// Click request → Request tab shows payload
// Response tab shows JSON response
```

### Check State
```javascript
// In component
console.log('Form state:', form);
console.log('Query data:', data);
console.log('User:', user);

// React DevTools extension
// Click component → Props tab shows values
```

### Check Styles
```javascript
// DevTools → Elements tab
// Right-click element → Inspect
// Styles panel shows applied CSS
// Check if classes are applied
```

---

## 📚 Resources

- **React Docs:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com
- **React Query:** https://tanstack.com/query
- **React Router:** https://reactrouter.com
- **Axios:** https://axios-http.com

---

## ✅ Development Workflow

**Every day:**
```bash
# 1. Start dev server
npm run dev

# 2. Make changes
# 3. See hot-reload in browser (instant)

# 4. Check console for errors (F12)
# 5. Test features manually

# 6. Git commit
git add .
git commit -m "feat: add new feature"
```

**Before pushing:**
```bash
# 1. Build locally
npm run build

# 2. Preview build
npm run preview

# 3. No errors? ✅ Continue

# 4. Push to repo
git push
```

---

**Happy coding! 🚀**

