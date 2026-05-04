# EcoTrack Project Management Frontend - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Backend services running (see Backend README)
- WiFi/Internet connection

### 2. Installation

```bash
# Navigate to frontend directory
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### 3. Initial Setup

#### Create a Test Account
1. Click "Register" on the login page
2. Fill in details:
   - Name: "Project Manager"
   - Email: "pm@ecotrack.com"
   - Password: "password123"
   - Phone: "9876543210"
   - Role: **Select "OFFICER"** (required for project management)
3. Click "Register"
4. Login with your credentials

#### Alternative: Use Admin Account
If admin user already exists:
- Email: `admin@ecotrack.com`
- Password: `admin123`

### 4. Navigate to Projects

After login:
1. Click "Projects" in the sidebar (or go to `/projects`)
2. Click the green "New Project" button
3. Fill in project details
4. Click "Create"

### 5. First Actions

**View Projects**
- Navigate to `/projects`
- See all projects in a grid layout
- Click a project card to see details

**Create a Milestone**
1. Open any project detail page
2. Scroll to "Milestones" section
3. Click "Add Milestone"
4. Enter title, due date
5. Click "Create"

**Add Impact Metrics**
1. On project detail page
2. Scroll to "Environmental Impact"
3. Click "Create Impact Metrics"
4. Fill in metric values (trees, CO₂, water, etc.)
5. Click "Create Impact"

**View Dashboard**
1. From `/projects` page
2. Click "Dashboard" button in the top right
3. See analytics, charts, and statistics

---

## 📍 Navigation Map

```
Home Page (/)
    ↓
Login (/login)
    ↓
Dashboard (/dashboard)
    ├── Profile (/profile)
    ├── Notifications (/notifications)
    └── Projects (/projects)
        ├── Dashboard (/projects/dashboard)  ← Analytics & Charts
        └── Project Detail (/projects/:id)
            ├── Milestones (manage inline)
            └── Impact Metrics (manage inline)
```

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus on search | `Cmd/Ctrl + K` |
| Close modal | `Esc` |
| Submit form | `Cmd/Ctrl + Enter` |

---

## 🎯 Common Tasks

### Create Your First Project
```
1. Go to /projects
2. Click "New Project"
3. Fill in:
   - Title: "Solar Panel Installation"
   - Description: "Install solar panels in district"
   - Manager Name: "John Doe"
   - Start Date: 2026-06-01
   - End Date: 2026-12-31
   - Budget: 50000
   - Status: PLANNED
4. Click "Create"
```

### Track Milestones
```
1. Open project detail
2. Click "Add Milestone"
3. Add multiple milestones:
   - "Site Assessment" - Due 2026-06-30
   - "Equipment Delivery" - Due 2026-07-31
   - "Installation" - Due 2026-11-30
4. Click status icons to update progress
```

### Record Environmental Impact
```
1. In Impact section, click "Create Impact Metrics"
2. Fill in:
   - Trees Planted: 500
   - CO₂ Reduced: 250 (tons)
   - Water Saved: 100000 (liters)
   - Area Restored: 5000 (m²)
   - Beneficiaries: 150
3. Click "Create Impact"
4. Add custom metrics if needed
```

### Update Project Status
```
1. Click project card
2. Click "Edit" button
3. Change Status dropdown
4. Click "Update Project"
5. Project status updates immediately
```

### View Your Progress
```
1. Open any project
2. At top, see blue progress bar
3. Shows: "X% Progress - Y/Z milestones"
4. View Milestones section for breakdown
5. Check dashboard for all projects
```

---

## 🎨 Interface Overview

### Projects Page
```
┌─────────────────────────────────────────┐
│ Sustainability Projects    [New][Dashboard]  
│ Track green initiatives and their impact
├─────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ │ Project1 │ │ Project2 │ │ Project3 │
│ │ PLANNED  │ │ IN PROG  │ │COMPLETED │
│ │[Details] │ │[Details] │ │[Details] │
│ └──────────┘ └──────────┘ └──────────┘
└─────────────────────────────────────────┘
```

### Project Detail Page
```
┌────── Back  [Edit] [Delete] ──────┐
│ Project Title              [Status]
│ Description text here...
│ Manager: John  |  Dates  |  Budget
│ ██████░░░░ 60% Progress (6/10)
├─────────────────────────────────────┤
│ 📍 MILESTONES (6/10)               │
│ ├─ Milestone 1 [COMPLETED]  ✓      │
│ ├─ Milestone 2 [IN PROGRESS] [✎] [🗑]
│ └─ Milestone 3 [PENDING]    [✎] [🗑]
│ [+ Add Milestone]
├─────────────────────────────────────┤
│ 🌿 ENVIRONMENTAL IMPACT            │
│ ├─ Trees Planted: 500              │
│ ├─ CO₂ Reduced: 250 t              │
│ ├─ Water Saved: 100k L             │
│ └─ [📊 Chart visualization]        │
│ [+ Create/Update]
└────��────────────────────────────────┘
```

### Dashboard Page
```
stats    Total: 10  |  Completed: 5  |  In Progress: 3  |  On Hold: 1  |  Cancelled: 1
charts   [Pie Chart]  [Bar Chart]  [Line Chart]
table    Project | Status | Budget | Timeline | Actions
```

---

## ✅ Status Meanings

### Project Status
| Status | Color | Meaning |
|--------|-------|---------|
| PLANNED | 🔵 Blue | Not started |
| IN_PROGRESS | 🟡 Yellow | Active work |
| COMPLETED | 🟢 Green | Finished |
| ON_HOLD | ⚫ Gray | Paused |
| CANCELLED | 🔴 Red | Abandoned |

### Milestone Status
| Status | Color | Meaning |
|--------|-------|---------|
| PENDING | ⚫ Gray | Waiting to start |
| IN_PROGRESS | 🟡 Yellow | Active work |
| COMPLETED | 🟢 Green | Finished |
| DELAYED | 🔴 Red | Past due |

### Impact Status
| Status | Color | Meaning |
|--------|-------|---------|
| DRAFT | ⚫ Gray | Being prepared |
| PUBLISHED | 🟢 Green | Published/Final |
| ARCHIVED | 🟣 Purple | Archived/Old |

---

## 🔐 User Roles & Permissions

### ADMIN
✅ Full access to everything
✅ Can create/edit/delete projects
✅ Can manage all milestones
✅ Can manage all impact records
✅ Can delete any data

### OFFICER
✅ Can create/edit/delete projects
✅ Can manage all milestones
✅ Can create/edit impact records
✅ Can create/edit/delete milestones

### SCIENTIST
✅ Can view all projects
✅ Can create/edit impact records
✅ Cannot delete data

### CITIZEN / INDUSTRY
✅ Can view all projects
✅ Read-only access

---

## 🆘 Troubleshooting

### "Session expired. Please sign in again"
```
→ Your JWT token is invalid or expired
→ Click "Login" and enter credentials again
→ Re-enter your email and password
```

### "Access denied. Insufficient permissions"
```
→ Your user role doesn't allow this action
→ ADMIN: Can do everything
→ OFFICER: Can manage projects/milestones
→ Ask administrator for permission upgrade
```

### "Failed to create project" (error message)
```
→ Missing required field (title)
→ Invalid date format
→ Budget must be a number
→ Check console for detailed error
```

### "Connection error"
```
→ Backend is not running
→ Start backend services first (see README)
→ Check if correct port (8090) is accessible
→ Check internet connection
```

### Form not submitting
```
→ Click "Create/Update" button
→ Wait for loading spinner
→ Check that button is not disabled
→ Verify all required fields are filled
```

### Page shows skeleton loading forever
```
→ Backend might be down
→ Check browser console for errors
→ Refresh the page
→ Try logging out and in again
```

---

## 💾 Data Persistence

- All data is saved to backend database
- Changes sync immediately across devices
- Refreshing the page reloads data
- No local storage needed (except JWT token)

---

## 📱 Mobile Tips

- Swipe to navigate between sections
- Tap status badges to change
- Scroll horizontally for tables
- Use portrait orientation for best view
- Touch buttons for quick actions

---

## 🚀 Performance Tips

1. **Use dashboard for overview** - Faster than loading all individual projects
2. **Filter by status** - Reduces data loaded
3. **Close unused modals** - Better performance
4. **Clear browser cache** - If stuck on old version
5. **Use Chrome/Edge** - Better React DevTools support

---

## 🎓 Learning Path

1. **Day 1**: Create and view projects
2. **Day 2**: Add milestones and track progress
3. **Day 3**: Record impact metrics
4. **Day 4**: Use dashboard for analysis
5. **Day 5**: Master all features

---

## 📞 Getting Help

### Common Issues & Solutions

**Q: Can I export projects?**
A: Not yet, but planned for future release

**Q: Can I undo a deletion?**
A: No, deletions are permanent. That's why we confirm first.

**Q: How often is data saved?**
A: Every action automatically saves to backend

**Q: Can multiple people edit same project?**
A: Yes, but changes may need refresh to see

**Q: Is there an API I can integrate with?**
A: Yes, all endpoints documented in Backend README

---

## 🎉 Next Steps

1. **Create your first project** ✅
2. **Add some milestones** ✅
3. **Record impact metrics** ✅
4. **View the dashboard** ✅
5. **Share with your team** ✅

---

## 📖 Documentation

- **Full Guide**: `PROJECT_MANAGEMENT_IMPLEMENTATION.md`
- **Quick Reference**: `FRONTEND_QUICK_REFERENCE.md`
- **Backend API**: `../Backend/README.md`

---

## 🎯 Success Checklist

- [ ] Installed dependencies
- [ ] Started dev server
- [ ] Created user account
- [ ] Created first project
- [ ] Added milestones
- [ ] Recorded impact metrics
- [ ] Viewed dashboard
- [ ] Tested on mobile (if applicable)
- [ ] Understood role permissions
- [ ] Ready for production use

---

**Happy project managing! 🌱**

For support, check the Backend README or contact your administrator.

**Version**: 1.0.0
**Last Updated**: May 4, 2026

