# Review Button Implementation Summary

## Overview
Implemented role-based access control for the analysis review feature. The review button is now **only visible to ADMIN and AGENCY_OFFICER** users, not to Environmental Scientists. Unique review IDs are generated for each officer/admin using their JWT token.

## Changes Made

### 1. Frontend Changes (AnalysisPage.jsx)

**File:** `Frontend/src/pages/AnalysisPage.jsx` (Line 129-154)

**Change:** Updated the Review button visibility condition

```javascript
// BEFORE:
{r.status !== 'REVIEWED' && (
  <Button
    size="sm"
    variant="outline"
    className="text-xs"
    onClick={() => reviewMut.mutate({ id: r.analysisId, status: 'REVIEWED', findings: r.findings })}
    loading={reviewMut.isPending}
  >
    Review
  </Button>
)}

// AFTER:
{r.status !== 'REVIEWED' && (isAdmin || isAgencyOfficer) && (
  <Button
    size="sm"
    variant="outline"
    className="text-xs"
    onClick={() => reviewMut.mutate({ id: r.analysisId, status: 'REVIEWED', findings: r.findings })}
    loading={reviewMut.isPending}
  >
    Review
  </Button>
)}
```

**Impact:**
- Review button is now only visible when user is ADMIN or AGENCY_OFFICER
- Environmental Scientists can no longer see or click the Review button
- Other users (SCIENTIST, CITIZEN, INDUSTRY, COMPLIANCE_OFFICER) also cannot access the review functionality

---

### 2. Backend Controller Changes (MonitoringController.java)

**File:** `Backend/environmental-monitoring-service/src/main/java/com/ecotrack/monitoring/controller/MonitoringController.java` (Line 192-201)

**Changes:**
1. Updated the Swagger documentation
2. Updated the @PreAuthorize annotation

```java
// BEFORE:
@PatchMapping("/api/v1/analysis/{id}/review")
@Operation(summary = "Review analysis — SCIENTIST only. Status: REVIEWED or FLAGGED. ScientistId is auto-read from your login token.")
@PreAuthorize("hasAnyAuthority('SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
public ResponseEntity<AnalysisResponse> reviewAnalysis(...)

// AFTER:
@PatchMapping("/api/v1/analysis/{id}/review")
@Operation(summary = "Review analysis — AGENCY_OFFICER or ADMIN only. Status: REVIEWED or FLAGGED. ReviewerId is auto-read from your login token.")
@PreAuthorize("hasAnyAuthority('AGENCY_OFFICER', 'SUPER_ADMIN', 'ADMINISTRATOR')")
public ResponseEntity<AnalysisResponse> reviewAnalysis(...)
```

**Impact:**
- Only AGENCY_OFFICER, SUPER_ADMIN, and ADMINISTRATOR roles can access the review endpoint
- SCIENTIST role is now denied access at the authorization level
- API will return 403 Forbidden for unauthorized roles

---

### 3. Backend Service Changes (MonitoringService.java)

**File:** `Backend/environmental-monitoring-service/src/main/java/com/ecotrack/monitoring/service/MonitoringService.java` (Line 230-265)

**Changes:**
1. Updated role validation logic
2. Updated error messaging
3. Changed variable naming from `scientistId` to `reviewerId` (for clarity)
4. Added logging for audit trail

```java
// BEFORE:
@Transactional
public AnalysisResponse reviewAnalysis(Long id, String userId, String userRole, AnalysisStatus status, String findings) {
    // Validate that the caller is a SCIENTIST
    if (userRole == null || !userRole.equalsIgnoreCase("SCIENTIST")) {
        throw new UnauthorizedException("Only SCIENTIST role can review analysis. Your role: " + userRole);
    }
    // ... rest of code ...
    analysis.setScientistId(scientistId);
    // ... rest of code ...
}

// AFTER:
@Transactional
public AnalysisResponse reviewAnalysis(Long id, String userId, String userRole, AnalysisStatus status, String findings) {
    // Validate that the caller is an AGENCY_OFFICER or ADMIN
    if (userRole == null || (!userRole.equalsIgnoreCase("AGENCY_OFFICER") && 
        !userRole.equalsIgnoreCase("SUPER_ADMIN") && !userRole.equalsIgnoreCase("ADMINISTRATOR"))) {
        throw new UnauthorizedException("Only AGENCY_OFFICER or ADMIN roles can review analysis. Your role: " + userRole);
    }
    // ... rest of code ...
    Long reviewerId = Long.parseLong(userId);
    analysis.setScientistId(reviewerId);
    // ... logging code ...
    log.info("Analysis {} reviewed by {} (role: {}). Status: {}", id, reviewerId, userRole, status);
    // ... rest of code ...
}
```

**Key Features:**
- Role validation now accepts AGENCY_OFFICER, SUPER_ADMIN, and ADMINISTRATOR
- SCIENTIST role is explicitly denied
- Extracts unique reviewer ID from JWT token's X-User-Id header
- Different review IDs are created for different agency officers based on their JWT token
- Audit logging tracks who reviewed each analysis and with what role

---

## Unique ID Generation for Reviews

### Implementation Details:
- Each officer/admin has a unique `userId` extracted from their JWT token
- This userId is stored in the `scientistId` field of the Analysis entity when reviewing
- Different officers will have different userIds, ensuring **unique IDs for different agency officer reviews**
- The JWT token provides authentication and authorization

### Example Scenario:
```
Officer A (userId=101, JWT token) reviews Analysis #5
  → Analysis.scientistId = 101

Officer B (userId=202, JWT token) reviews Analysis #6
  → Analysis.scientistId = 202

Admin C (userId=303, JWT token) reviews Analysis #7
  → Analysis.scientistId = 303
```

Each review is uniquely associated with the person who performed it, creating an audit trail.

---

## Affected Roles

### Can NOW Review:
✅ SUPER_ADMIN
✅ ADMINISTRATOR
✅ AGENCY_OFFICER

### Cannot Review (Previously Could):
❌ SCIENTIST (authorization removed)

### Not Affected (Already Couldn't):
❌ CITIZEN
❌ INDUSTRY
❌ COMPLIANCE_OFFICER

---

## Testing Recommendations

### 1. Frontend Testing
- [ ] Login as ADMIN user → Verify Review button is visible
- [ ] Login as AGENCY_OFFICER user → Verify Review button is visible
- [ ] Login as SCIENTIST user → Verify Review button is NOT visible
- [ ] Logout and check if review button disappears

### 2. Backend API Testing
- [ ] Send PATCH request with ADMIN token → Should succeed (200)
- [ ] Send PATCH request with AGENCY_OFFICER token → Should succeed (200)
- [ ] Send PATCH request with SCIENTIST token → Should fail (403 Forbidden)
- [ ] Send PATCH request without Authorization header → Should fail (401 Unauthorized)

### 3. Audit Trail Testing
- [ ] Verify logs show "Analysis {} reviewed by {} (role: {})"
- [ ] Check different officers leave different userId entries in the database
- [ ] Verify timestamps are correctly recorded

### 4. Data Integrity Testing
- [ ] Verify REVIEWED status is correctly set
- [ ] Verify findings are properly saved (if provided)
- [ ] Verify scientistId (now acting as reviewerId) is correctly stored
- [ ] Test both REVIEWED and FLAGGED status transitions

---

## Database Schema Notes

**Note:** The existing database uses the `scientistId` column in the `analysis` table. This column now stores reviewer IDs (officer/admin IDs) instead of just scientist IDs. No schema migration is required as the column usage is backward compatible.

### Current Schema (No Changes Required):
```sql
CREATE TABLE analysis (
    analysis_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    data_id BIGINT NOT NULL,
    sensor_id BIGINT,
    scientist_id BIGINT,  -- Now also stores reviewer IDs from officers/admins
    findings TEXT NOT NULL,
    date DATETIME,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME,
    updated_at DATETIME,
    ...
);
```

---

## API Endpoint Changes

### Review Analysis Endpoint
**Endpoint:** `PATCH /api/v1/analysis/{id}/review`

**Request:**
```bash
curl -X PATCH http://localhost:8090/api/v1/analysis/5/review \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-User-Id: 101" \
  -H "X-User-Role: AGENCY_OFFICER" \
  -H "Content-Type: application/json" \
  -d "status=REVIEWED&findings=Analysis%20complete"
```

**Allowed Roles:**
- AGENCY_OFFICER ✅
- SUPER_ADMIN ✅
- ADMINISTRATOR ✅
- SCIENTIST ❌ (403 Forbidden)

**Response (Success - 200):**
```json
{
  "analysisId": 5,
  "dataId": 123,
  "sensorId": 456,
  "scientistId": 101,
  "findings": "Analysis complete",
  "status": "REVIEWED",
  "createdAt": "2024-05-08T10:00:00",
  "updatedAt": "2024-05-08T10:30:00"
}
```

**Response (Unauthorized - 403):**
```json
{
  "error": "Only AGENCY_OFFICER or ADMIN roles can review analysis. Your role: SCIENTIST"
}
```

---

## No Impact on Other Services

The following services and features are **NOT affected**:

- **Officer Dashboard**: Can still access and review emissions/documents
- **Scientist Dashboard**: Can still create and view sensor analysis
- **Admin Dashboard**: Full access maintained
- **Citizen Portal**: No changes
- **Industry Compliance**: No changes
- **Compliance Audit Service**: No changes

---

## Migration Steps (If Deployed)

1. **Backend Deployment:**
   - Deploy updated `environmental-monitoring-service`
   - Verify API endpoint is accessible with new authorization rules

2. **Frontend Deployment:**
   - Deploy updated `AnalysisPage.jsx`
   - Clear browser cache to load new frontend code

3. **Testing:**
   - Test as described above
   - Verify no errors in application logs

4. **No Database Migration Required:**
   - Existing data remains unchanged
   - No schema alterations needed

---

## Rollback Procedure (If Needed)

If you need to revert these changes:

1. Revert Frontend to show Review button for all authenticated users
2. Update Controller @PreAuthorize back to `'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR'`
3. Update Service role validation back to accept only SCIENTIST role
4. Redeploy both services

No data cleanup needed as the changes are purely functional.

---

## Summary of Requirements Met

✅ **Review button only visible for ADMIN and AGENCY_OFFICER** - Implemented in Frontend condition
✅ **Review button NOT visible for SCIENTIST** - Explicitly excluded from role check
✅ **Different IDs created for different agency officer reviews** - Each officer's JWT token userId is unique and stored as reviewerId
✅ **IDs use JWT tokens** - Direct extraction from X-User-Id header from JWT token
✅ **No impact on other services** - Changes isolated to analysis review endpoint
✅ **Backward compatible** - Uses existing database schema


