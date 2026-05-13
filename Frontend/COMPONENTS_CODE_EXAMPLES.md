# 💻 Custom Components - Code Examples & Integration Guide

**Date:** May 8, 2026

---

## 📋 Real-World Usage Examples

### Example 1: Button Component Usage

**Simple Button:**
```jsx
import Button from '../components/Button'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  return (
    <Button 
      variant="primary"
      size="lg"
      onClick={handleLogin}
      loading={loading}
      type="submit"
    >
      Sign In
    </Button>
  )
}
```

**Button Variants Showcase:**
```jsx
<div className="flex gap-4">
  {/* Primary (default) */}
  <Button>Create</Button>
  
  {/* Secondary */}
  <Button variant="secondary">Cancel</Button>
  
  {/* Danger */}
  <Button variant="danger">Delete</Button>
  
  {/* Ghost (subtle) */}
  <Button variant="ghost">More Options</Button>
  
  {/* Outline */}
  <Button variant="outline">Learn More</Button>
</div>
```

**Button Sizes:**
```jsx
<div className="flex gap-4 items-center">
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
</div>
```

---

### Example 2: Modal Component Usage

**Complete Modal with Form:**
```jsx
import { useState } from 'react'
import Modal from '../components/Modal'
import Button from '../components/Button'

export default function CreateProjectPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      await projectsApi.createProject({
        title,
        description,
        budget: parseFloat(budget),
      })
      toast.success('Project created!')
      setIsOpen(false)
      // Reset form
      setTitle('')
      setDescription('')
      setBudget('')
    } catch (error) {
      toast.error(error.response?.data?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Create Project
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Project"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-2">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Urban Forest Initiative"
              className="w-full px-4 py-2 border border-bark-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-bark-600 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project details..."
              rows="4"
              className="w-full px-4 py-2 border border-bark-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-bark-600 mb-2">
              Budget ($)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., 50000"
              className="w-full px-4 py-2 border border-bark-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={loading}
            >
              Create Project
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
```

---

### Example 3: DataTable Component Usage

**Complete Data Table with Sorting & Pagination:**
```jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'
import * as usersApi from '../api/usersApi'

export default function AdminUsersPage() {
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers().then(r => r.data)
  })

  // Define columns
  const columns = [
    {
      key: 'userId',
      label: 'ID',
      sortable: true,
      render: (row) => <span className="text-xs text-bark-400">{row.userId}</span>
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => <span className="font-medium">{row.name}</span>
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-forest-600/10 text-forest-700">
          {row.role.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (row) => (
        <span className="text-xs text-bark-400">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleEdit(row)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row.userId)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      
      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        searchable={true}
        searchPlaceholder="Search by name, email, or ID..."
        currentPage={currentPage}
        recordsPerPage={10}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
```

---

### Example 4: PageHeader with Action

**Header with Create Button:**
```jsx
import { Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <>
      <PageHeader
        emoji="📁"
        title="Projects"
        description="Manage environmental projects across your organization"
        action={
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2"
          >
            <Plus size={16} />
            New Project
          </Button>
        }
      />

      {/* Rest of page content */}
    </>
  )
}
```

---

### Example 5: Card Component Usage

**Grid of Cards:**
```jsx
import Card from '../components/Card'

export default function DashboardPage() {
  const stats = [
    { label: 'Active Projects', value: 12, icon: '📁', color: 'text-forest-600' },
    { label: 'Total Emissions', value: '2,450T', icon: '💨', color: 'text-orange-600' },
    { label: 'Area Restored', value: '450 ha', icon: '🌾', color: 'text-green-600' },
    { label: 'Users', value: 87, icon: '👥', color: 'text-blue-600' },
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-bark-500 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-bark-800">{stat.value}</p>
            </div>
            <span className={`text-3xl ${stat.color}`}>{stat.icon}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
```

---

### Example 6: ConfirmDialog Component Usage

**Delete Confirmation:**
```jsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ConfirmDialog from '../components/ConfirmDialog'
import Button from '../components/Button'
import * as projectsApi from '../api/projectsApi'

export default function ProjectsPage() {
  const [deleteId, setDeleteId] = useState(null)
  const qc = useQueryClient()

  const deleteMut = useMutation({
    mutationFn: (id) => projectsApi.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted')
      setDeleteId(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete')
    }
  })

  return (
    <>
      <Button
        variant="danger"
        onClick={() => setDeleteId(123)}
      >
        Delete Project
      </Button>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
        title="Delete Project"
        message="Are you sure you want to delete this project? All associated data will be permanently removed. This action cannot be undone."
        loading={deleteMut.isPending}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  )
}
```

---

### Example 7: FileUpload Component

**CSV Upload with Progress:**
```jsx
import { useState } from 'react'
import FileUpload from '../components/FileUpload'
import Button from '../components/Button'

export default function SensorsPage() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileSelect = (file) => {
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      setUploadProgress(0)
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) clearInterval(interval)
          return prev + 10
        })
      }, 300)

      const response = await sensorsApi.uploadCSV(formData)
      
      clearInterval(interval)
      setUploadProgress(100)
      
      toast.success('Sensors imported successfully!')
      setSelectedFile(null)
      setUploadProgress(0)
      
      // Refetch sensors list
      queryClient.invalidateQueries({ queryKey: ['sensors'] })
    } catch (error) {
      toast.error('Failed to upload CSV')
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Bulk Import Sensors</h2>
      
      <FileUpload
        accept=".csv"
        label="Upload CSV File"
        onFile={handleFileSelect}
        progress={uploadProgress}
      />

      {selectedFile && (
        <Button
          onClick={handleUpload}
          loading={uploadProgress > 0 && uploadProgress < 100}
        >
          Upload CSV
        </Button>
      )}
    </div>
  )
}
```

---

### Example 8: AuthenticatedMedia Component

**Protected Image with Lightbox:**
```jsx
import { useState } from 'react'
import { AuthenticatedImage, AuthenticatedVideo } from '../components/AuthenticatedMedia'

export default function IssueDetailPage({ issueId }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const handleImageClick = (blobUrl) => {
    setSelectedImage(blobUrl)
    setLightboxOpen(true)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Citizen Report Media</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Protected Image with Auth */}
        <AuthenticatedImage
          src={`/api/v1/issues/${issueId}/media/photo1.jpg`}
          alt="Issue photo 1"
          className="w-full h-64 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
          onClick={handleImageClick}
        />

        {/* Protected Video with Auth */}
        <div>
          <h3 className="text-sm font-medium mb-2">Video Evidence</h3>
          <AuthenticatedVideo
            src={`/api/v1/issues/${issueId}/media/video.mp4`}
            className="w-full rounded-xl"
          />
        </div>
      </div>

      {/* Lightbox Modal (future enhancement) */}
      {lightboxOpen && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={selectedImage}
            alt="Lightbox"
            className="max-w-4xl max-h-[90vh] rounded-xl"
          />
        </div>
      )}
    </div>
  )
}
```

---

### Example 9: ImpactMetricsForm Integration

**In Project Detail Page:**
```jsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import ImpactMetricsForm from '../components/ImpactMetricsForm'
import Card from '../components/Card'
import * as projectsApi from '../api/projectsApi'

export default function ProjectDetailPage({ projectId }) {
  const [showMetricsForm, setShowMetricsForm] = useState(false)

  const updateMetricsMut = useMutation({
    mutationFn: (data) => projectsApi.updateProjectMetrics(projectId, data),
    onSuccess: () => {
      toast.success('Impact metrics saved!')
      setShowMetricsForm(false)
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save metrics')
    }
  })

  return (
    <Card className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🌍 Environmental Impact</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMetricsForm(!showMetricsForm)}
        >
          {showMetricsForm ? 'Cancel' : 'Edit Metrics'}
        </Button>
      </div>

      {showMetricsForm ? (
        <ImpactMetricsForm
          initialMetrics={project?.metrics || {}}
          onSave={(data) => updateMetricsMut.mutate(data)}
          loading={updateMetricsMut.isPending}
          isEdit={true}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-bark-500">🌳 Trees Planted</p>
            <p className="text-2xl font-bold">{project?.metrics?.treesPlanted || 0}</p>
          </div>
          <div>
            <p className="text-bark-500">💨 CO₂ Reduced (tons)</p>
            <p className="text-2xl font-bold">{project?.metrics?.co2ReducedTons || 0}</p>
          </div>
          {/* More metrics... */}
        </div>
      )}
    </Card>
  )
}
```

---

### Example 10: MilestoneManagement Integration

**In Project Detail Page:**
```jsx
import MilestoneManagement from '../components/MilestoneManagement'
import { useQuery } from '@tanstack/react-query'

export default function ProjectDetailPage({ projectId }) {
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId)
  })

  return (
    <div className="space-y-6">
      {/* Other sections... */}

      <MilestoneManagement
        projectId={projectId}
        milestones={project?.milestones || []}
        onRefresh={() => refetchProject()}
        canEdit={userCanEditProject}
      />
    </div>
  )
}
```

---

## 🎨 Component Composition Patterns

### Pattern 1: Loading + Error + Success States

```jsx
function MyComponent() {
  const { data, isLoading, error } = useQuery(...)

  if (isLoading) {
    return <LoadingSkeleton rows={5} cols={4} />
  }

  if (error) {
    return (
      <EmptyState
        emoji="⚠️"
        title="Error Loading Data"
        description={error.message}
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        emoji="📭"
        title="No data yet"
        description="Create your first record to get started"
        action={<Button onClick={() => setShowCreate(true)}>Create</Button>}
      />
    )
  }

  return <DataTable columns={columns} data={data} />
}
```

### Pattern 2: Form with Validation Feedback

```jsx
function MyForm() {
  const [form, setForm] = useState({ name: '', email: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!form.name) newErrors.name = 'Name is required'
    if (!form.email) newErrors.email = 'Email is required'
    if (!form.email.includes('@')) newErrors.email = 'Email is invalid'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await api.submit(form)
      toast.success('Saved!')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2
            ${errors.name ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-forest-300'}`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2
            ${errors.email ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-forest-300'}`}
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>

      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={Object.keys(errors).length > 0}
      >
        Submit
      </Button>
    </div>
  )
}
```

---

## 🔄 Component Integration Checklist

When integrating components into a page:

- [ ] Import component from components folder
- [ ] Identify props needed for component
- [ ] Create state for component (open, data, loading, error)
- [ ] Setup API calls with useQuery/useMutation
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Handle success state
- [ ] Pass callbacks (onClick, onSave, onClose)
- [ ] Add toast notifications
- [ ] Invalidate React Query cache on mutations
- [ ] Test responsive design
- [ ] Test accessibility (keyboard nav, screen reader)

---

## 📚 Common Component Combinations

### CRUD Operations Pattern

```jsx
// Typical CRUD flow using components

// 1. Display list
<DataTable columns={columns} data={items} />

// 2. Add button in header
<PageHeader action={<Button onClick={() => setShowCreate(true)}>Add</Button>} />

// 3. Create modal
<Modal open={showCreate} onClose={...}>
  <form>...</form>
</Modal>

// 4. Edit via table row action
<DataTable ... render={(row) => <Button onClick={() => editItem(row)}>Edit</Button>} />

// 5. Edit modal
<Modal open={editId} onClose={...}>
  <form>...</form>
</Modal>

// 6. Delete via confirm dialog
<ConfirmDialog open={deleteId} onConfirm={() => deleteItem(deleteId)} />
```

---

**Status: ✅ Code Examples Complete & Ready for Reference**

*Last Updated: May 8, 2026*

