# Frontend Testing & Validation Guide

## Pre-Deployment Checks

### 1. Environment Setup ✅
- [ ] .env file created with VITE_API_BASE_URL=http://localhost:8090
- [ ] Backend running on port 8090
- [ ] Node.js 18+ installed
- [ ] npm dependencies installed (`npm install`)

### 2. API Validation

**Test Project APIs:**
```bash
# Create test project
curl -X POST http://localhost:8090/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Project",
    "startDate": "2026-05-04",
    "description": "Test"
  }'

# Get projects
curl -X GET http://localhost:8090/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get project by ID
curl -X GET http://localhost:8090/api/v1/projects/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response Format Validation:**
- Projects should return `projectId` (not `id`)
- Milestones should return `milestoneId` and `date` (not `dueDate`)
- Impact should return `impactId` and nested `metrics` object

### 3. Frontend Dev Server

```bash
# From Frontend directory
npm run dev

# Server should start on http://localhost:3000
# Check for any build errors in terminal
```

---

## Feature Testing Checklist

### Projects Page (/projects)

- [ ] **List Projects**: All projects display in grid
- [ ] **Create Project**: Click "New Project" → Modal appears
  - [ ] Title field required (shows error if empty)
  - [ ] Optional fields: Description, Start Date, End Date, Budget, Status
  - [ ] Submit creates project and refreshes list
  - [ ] Toast notification shows "Project created"

- [ ] **Edit Project**: Click edit icon on project card
  - [ ] Form prefills with existing data
  - [ ] Can update fields
  - [ ] Submit shows "Project updated" toast
  - [ ] Page updates automatically

- [ ] **Delete Project**: Click trash icon
  - [ ] Confirmation modal appears
  - [ ] Confirming deletes project
  - [ ] Toast shows "Project deleted"
  - [ ] Project removed from list

- [ ] **Status Filtering**: Projects show correct status badges
  - [ ] PLANNED → Blue
  - [ ] IN_PROGRESS → Yellow
  - [ ] COMPLETED → Green
  - [ ] ON_HOLD → Gray
  - [ ] CANCELLED → Red

- [ ] **Responsive Design**:
  - [ ] Mobile: 1 column
  - [ ] Tablet: 2 columns
  - [ ] Desktop: 3 columns

### Project Details (/projects/:id)

- [ ] **Page Loads**: Project info displays
  - [ ] Title shows correctly
  - [ ] Description displays
  - [ ] Dates show in correct format
  - [ ] Budget shows as currency
  - [ ] Status badge visible

- [ ] **Progress Bar**:
  - [ ] Shows % based on completed milestones
  - [ ] Updates when milestones change status
  - [ ] Shows completed/total milestone count

- [ ] **Edit Project from Details**:
  - [ ] Click "Edit" button → Modal appears
  - [ ] All fields prefilled correctly
  - [ ] Can update fields
  - [ ] Submit updates project

- [ ] **Delete Project from Details**:
  - [ ] Click delete icon → Confirmation modal
  - [ ] Confirming redirects to /projects
  - [ ] Project no longer appears in list

### Milestones Management

- [ ] **Display Milestones**: All project milestones show as cards
  - [ ] Title displays
  - [ ] Date shows in format "MMM d, yyyy"
  - [ ] Status badge color-coded

- [ ] **Add Milestone**:
  - [ ] Click "Add Milestone" button → Modal
  - [ ] Title field (required) - shows error if empty
  - [ ] Date field (required) - date picker works
  - [ ] Status field optional
  - [ ] Submit creates milestone

- [ ] **Edit Milestone**:
  - [ ] Click edit icon on milestone
  - [ ] Form prefills with existing data
  - [ ] Can update title, date, status
  - [ ] Submit updates milestone

- [ ] **Delete Milestone**:
  - [ ] Click trash icon → Confirmation
  - [ ] Confirming removes milestone

- [ ] **Change Milestone Status**:
  - [ ] Click status change icon (↕️) → Status modal
  - [ ] Select PENDING, IN_PROGRESS, COMPLETED, or DELAYED
  - [ ] Milestone updates immediately
  - [ ] Project progress bar updates

- [ ] **Status Display**:
  - [ ] PENDING → Gray background
  - [ ] IN_PROGRESS → Yellow background
  - [ ] COMPLETED → Green background
  - [ ] DELAYED → Red background

### Impact Metrics Management

- [ ] **No Impact Initial State**:
  - [ ] Message shows "No environmental impact metrics recorded yet"
  - [ ] "Create Impact Metrics" button visible

- [ ] **Create Impact**:
  - [ ] Click "Create Impact Metrics" → Modal with form
  - [ ] All 10 predefined fields with icons shown
  - [ ] Custom metrics section visible
  - [ ] Notes textarea appears
  - [ ] Fill some predefined fields
  - [ ] Submit creates impact

- [ ] **View Impact**:
  - [ ] Created metrics display as cards
  - [ ] Only filled metrics show (empty ones hidden)
  - [ ] Values display with formatNumber()
  - [ ] Icons match field types

- [ ] **Custom Metrics**:
  - [ ] Custom metrics section shows with filled custom metrics
  - [ ] Can add new custom metric (key + value)
  - [ ] Delete custom metric removes it (with confirmation)
  - [ ] Custom metrics persist after save

- [ ] **Edit Impact**:
  - [ ] Click "Edit" button → Modal with prefilled data
  - [ ] All metrics show current values
  - [ ] Can add/remove custom metrics
  - [ ] Submit updates impact

- [ ] **Change Impact Status**:
  - [ ] Click "Change Status" → Status modal
  - [ ] Select DRAFT, PUBLISHED, or ARCHIVED
  - [ ] Status updates immediately
  - [ ] Status card reflects change

- [ ] **Delete Impact**:
  - [ ] Click trash icon → Confirmation
  - [ ] Confirming removes all impact
  - [ ] Page returns to "No impact" state

- [ ] **Impact Visualization**:
  - [ ] Bar chart shows key metrics
  - [ ] Chart only shows metrics with values > 0
  - [ ] Chart title: "Impact Visualization"

### Project Dashboard

- [ ] **KPI Cards Display**:
  - [ ] Total Projects count
  - [ ] Completed Projects count with %
  - [ ] In Progress count
  - [ ] Total Budget amount

- [ ] **Charts Render**:
  - [ ] Pie chart shows status distribution
  - [ ] Line chart shows timeline
  - [ ] Both charts responsive

- [ ] **Status Summary**:
  - [ ] 5 status cards showing counts
  - [ ] Color-coded backgrounds

- [ ] **Recent Projects**:
  - [ ] Recent projects list shows up to 5
  - [ ] Click project card navigates to details
  - [ ] Project status visible

---

## API Integration Tests

### Axios Interceptors

- [ ] **Request Interceptor**:
  - [ ] JWT token attached from localStorage
  - [ ] Authorization header format: "Bearer TOKEN"

- [ ] **Response Interceptor**:
  - [ ] 401 errors redirect to login
  - [ ] 403 errors show permission denied toast
  - [ ] 5xx errors show generic error message
  - [ ] Network errors handled

### Error Handling

- [ ] **Form Validation Errors**:
  - [ ] Required fields show validation errors
  - [ ] Toast notifications appear for errors

- [ ] **API Errors**:
  - [ ] Failed requests show error toast
  - [ ] Error message from backend displays

- [ ] **Loading States**:
  - [ ] Form buttons show loading spinner
  - [ ] Mutations disable buttons while loading

---

## Browser Testing

### Desktop (Chrome/Firefox)
- [ ] All features work as expected
- [ ] Responsive design looks correct
- [ ] No console errors

### Mobile (Using DevTools)
- [ ] Mobile viewport displays correctly
- [ ] Buttons are touch-friendly (larger tap targets)
- [ ] Forms are easy to interact with
- [ ] Horizontal scrolling not needed

### Tablet
- [ ] Layout adapts to tablet size
- [ ] Cards display in 2-column grid
- [ ] Modals look proportional

---

## Performance Testing

- [ ] **Network Tab**: 
  - [ ] API calls take < 1 second
  - [ ] Bundle size acceptable

- [ ] **Performance Tab**:
  - [ ] No layout thrashing
  - [ ] Frame rate high (60fps ideal)

- [ ] **Memory Usage**:
  - [ ] No memory leaks
  - [ ] Reasonable memory consumption

---

## Accessibility Testing

- [ ] **Keyboard Navigation**: All interactive elements accessible via Tab
- [ ] **Color Contrast**: All text readable (WCAG AA compliant)
- [ ] **Labels**: Form inputs have associated labels
- [ ] **Alt Text**: Images have alt attributes (if any)

---

## Common Issues & Solutions

### Issue: "Cannot GET /api/v1/projects"
**Solution**: Check backend is running on port 8090 and API routes configured correctly

### Issue: "Milestones not showing date"
**Solution**: Verify API returns `date` field (not `dueDate` or other naming)

### Issue: "Impact metrics show as undefined"
**Solution**: Check API returns metrics under nested `metrics` object, not as direct properties

### Issue: "Cannot read property 'projectId'"
**Solution**: Ensure API returns `projectId` not `id`

### Issue: "Token not attached to requests"
**Solution**: Check JWT stored in localStorage with key `ecotrack_auth` and token property exists

### Issue: "Form shows error about required field"
**Solution**: Backend validation is stricter; ensure all required fields filled

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passed
- [ ] No console errors
- [ ] No network errors in DevTools
- [ ] API responses match expected format
- [ ] Environment variables configured
- [ ] Build succeeds without warnings
- [ ] Responsive design verified on multiple devices
- [ ] Performance acceptable
- [ ] Security headers configured (HTTPS)
- [ ] Authentication working correctly
- [ ] Error handling covers edge cases

---

## Live Testing URLs

When frontend deployed:

- Projects List: `https://yourdomain.com/projects`
- Project Details: `https://yourdomain.com/projects/1`
- Dashboard: `https://yourdomain.com/projects/dashboard`
- Login: `https://yourdomain.com/login`

---

**Last Updated:** May 4, 2026  
**Version:** 1.0.0  
**Status:** Ready for Testing

