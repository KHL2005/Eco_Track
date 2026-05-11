# Resolution Visibility Fix Summary

## Problem
Resolutions posted/updated by agency officers were being stored in the database but were not immediately visible to citizens viewing their issue details.

## Root Causes Identified
1. **Frontend Polling Interval**: The refetch interval was too long (5 seconds), causing delays in showing updates
2. **Missing Query Invalidation**: IssueDetailPage wasn't invalidating both the issue and resolution queries after mutations
3. **API Response Type**: Resolution endpoints were returning only `ResolutionResponse` instead of the full `IssueResponse` with embedded resolution

## Changes Made

### Backend Changes

#### 1. IssueController.java
**File**: `Backend/citizen-reporting-service/src/main/java/com/ecotrack/citizen/controller/IssueController.java`

- **Line 155-160**: Updated `addResolution()` endpoint to return `IssueResponse` instead of `ResolutionResponse`
  - Changed: `ResponseEntity<ResolutionResponse>` → `ResponseEntity<IssueResponse>`
  - Now calls: `issueService.addResolutionAndReturnIssue(issueId, request)`

- **Line 193-198**: Updated `updateResolution()` endpoint to return `IssueResponse` instead of `ResolutionResponse`
  - Changed: `ResponseEntity<ResolutionResponse>` → `ResponseEntity<IssueResponse>`
  - Now calls: `issueService.updateResolutionAndReturnIssue(resolutionId, request)`

**Benefit**: Officers immediately see the updated issue with resolution embedded in the response, and citizens' auto-polling will fetch the complete issue data with resolution.

#### 2. IssueService.java
**File**: `Backend/citizen-reporting-service/src/main/java/com/ecotrack/citizen/service/IssueService.java`

- **Line 193-198**: Added new method `addResolutionAndReturnIssue()`
  - Calls existing `addResolution()` method
  - Returns full `IssueResponse` with embedded resolution

- **Line 255-260**: Added new method `updateResolutionAndReturnIssue()`
  - Calls existing `updateResolution()` method
  - Returns full `IssueResponse` with embedded resolution

**Benefit**: Ensures resolution data is properly fetched and included in the response through the existing `toIssueResponse()` method which already handles resolution fetching via `resolutionRepository.findByIssueId()`.

### Frontend Changes

#### 1. CitizenIssueDetail.jsx
**File**: `Frontend/src/pages/CitizenIssueDetail.jsx`

- **Line 1-10**: Added imports
  - Added `RefreshCw` icon from lucide-react
  - Added `toast` from sonner for feedback

- **Line 16-23**: Improved React Query configuration
  - Reduced `refetchInterval` from 5000ms to **3000ms** (more responsive)
  - Added `staleTime: 2000` (data fresh for 2 seconds)
  - Added `retry: 2` (retry failed requests)
  - Extracted `refetch` function for manual refresh capability

- **Line 33-48**: Added manual refresh button
  - Users can click "Refresh" to immediately check for updates
  - Shows toast notification for user feedback

- **Line 96-129**: Enhanced Resolution display section
  - Better error handling for null/undefined resolution fields
  - Shows helpful tip directing users to click refresh
  - Displays officer name with default fallback
  - Shows resolution date and last update timestamp
  - Better visual styling with background and borders

**Benefits**:
- Citizens see resolution updates faster (3 sec vs 5 sec polls)
- Manual refresh option provides immediate feedback
- Better visual hierarchy and information display
- More user-friendly messaging

#### 2. IssueDetailPage.jsx
**File**: `Frontend/src/pages/IssueDetailPage.jsx`

- **Line 65-90**: Updated mutation callbacks
  - `addResolution` mutation now invalidates both:
    - `['issue', id]` query
    - `['resolution', 'issue', id]` query
  
  - `updateResolution` mutation now invalidates both:
    - `['issue', id]` query
    - `['resolution', 'issue', id]` query

**Benefits**:
- When officers add/update resolutions, the issue status is also refreshed
- Both queries now stay in sync
- Prevents showing stale issue status data

## Data Flow Improvements

### Before Fix:
```
Officer adds resolution → API saves to DB → Only ResolutionResponse returned
    ↓
Citizen polls GET /issues/{id} every 5 seconds
    ↓
Resolution not included in response (or delayed due to polling interval)
```

### After Fix:
```
Officer adds resolution → API saves to DB → Full IssueResponse returned with embedded resolution
    ↓
Both officer and citizen see immediate update
    ↓
Citizen page also:
  - Polls every 3 seconds (vs 5)
  - Has manual refresh button for immediate checks
  - Properly invalidates queries for forced refresh
```

## Technical Details

### Resolution Fetching in Backend
The `toIssueResponse()` method in IssueService already properly fetches the resolution:
```java
resolution = resolutionRepository.findByIssueId(issue.getIssueId())
        .map(this::toResolutionResponse)
        .orElse(null);
```

The fix ensures this is always called by returning the full IssueResponse from the API.

### Query Strategy
- **IssueDetailPage**: Uses separate queries for issue and resolution (both now invalidated on mutation)
- **CitizenIssueDetail**: Uses single query for issue (includes embedded resolution) with auto-polling

## Testing Recommendations

1. **Test as Officer**:
   - Add a resolution to an issue
   - Verify response includes full issue with resolution
   - Check issue status is updated to IN_PROGRESS

2. **Test as Citizen** (on CitizenIssueDetail):
   - Report an issue
   - Have officer add resolution
   - Observe resolution appears within 3 seconds
   - Test manual "Refresh" button
   
3. **Test as Officer** (on IssueDetailPage):
   - View an issue
   - Add resolution
   - Verify both issue status badge and resolution display update
   - Update resolution status
   - Verify issue status changes accordingly

## Files Modified
- ✅ Backend/citizen-reporting-service/src/main/java/com/ecotrack/citizen/controller/IssueController.java
- ✅ Backend/citizen-reporting-service/src/main/java/com/ecotrack/citizen/service/IssueService.java
- ✅ Frontend/src/pages/CitizenIssueDetail.jsx
- ✅ Frontend/src/pages/IssueDetailPage.jsx

## Backwards Compatibility
- Existing resolution fetching endpoints (GET) remain unchanged
- New methods added don't break existing code
- Frontend API calls automatically use camelCase conversion (resolution field name)

