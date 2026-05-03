# Notification Service - 401 Unauthorized Fix

## Issue
When trying to POST to notification endpoint, you're getting:
```
401 Unauthorized
```

## Root Cause
The notification-service was missing security configuration files and JWT dependencies needed to validate authentication tokens.

## ✅ Solution Applied

I've added the following to notification-service:

### 1. **Security Classes** (3 files)
- ✅ `security/JwtUtil.java` - JWT token parsing and validation
- ✅ `security/JwtAuthFilter.java` - JWT authentication filter
- ✅ `config/SecurityConfig.java` - Spring Security configuration

### 2. **Configuration** (1 file)
- ✅ `config/SwaggerConfig.java` - API documentation with bearer token support

### 3. **Dependencies** (pom.xml updated)
```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>${jjwt.version}</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>${jjwt.version}</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>${jjwt.version}</version>
    <scope>runtime</scope>
</dependency>
```

### 4. **Configuration** (application.yml updated)
```yaml
jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration: 86400000
```

---

## 🔧 How to Test

### Step 1: Rebuild notification-service
```bash
cd C:\Users\2479746\Documents\Project\Backend
mvn clean package -DskipTests
```

### Step 2: Ensure Services are Running
```
1. Eureka Server (port 8761)
2. Config Server (port 8888)
3. IAM Service (port 8081)
4. Notification Service (port 8083)
5. API Gateway (port 8090)
```

### Step 3: Get a Valid JWT Token

**First, login through IAM service to get a token:**

```bash
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecotrack.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userEmail": "admin@ecotrack.com"
}
```

Copy the `token` value.

### Step 4: Use Token to Create Notification

**Using cURL:**
```bash
curl -X POST http://localhost:8090/api/v1/notifications \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "entityId": 100,
    "message": "Test notification",
    "category": "GENERAL"
  }'
```

**Expected Response (201 Created):**
```json
{
  "notificationId": 1,
  "userId": 1,
  "entityId": 100,
  "message": "Test notification",
  "category": "GENERAL",
  "status": "UNREAD",
  "createdDate": "2026-05-03T10:30:00"
}
```

---

## 📊 Authentication Flow

```
┌─────────────────┐
│  Client Request │
│ with JWT Token  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  API Gateway (8090)         │
│  /api/v1/notifications      │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Notification Service (8083)     │
│  ┌────────────────────────────┐  │
│  │  JwtAuthFilter             │  │
│  │  - Extract token           │  │
│  │  - Validate signature      │  │
│  │  - Check expiration        │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  SecurityConfig            │  │
│  │  - Stateless sessions      │  │
│  │  - Require auth for /api/* │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  NotificationController    │  │
│  │  Process request           │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
         │
         ▼
    ┌─────────┐
    │Response │
    │ 201 OK  │
    └─────────┘
```

---

## 🔐 Security Details

### JWT Token Structure
```
Header.Payload.Signature
```

- **Header:** Algorithm (HS256)
- **Payload:** Contains user email and issued/expiration times
- **Signature:** HMAC-SHA256 validation using secret key

### Token Expiration
- **Duration:** 24 hours (86400000 milliseconds)
- **Secret:** Shared with IAM (same `jwt.secret` value)

### Authorization Header
```
Authorization: Bearer {JWT_TOKEN}
```

If token is missing or invalid:
- ✅ Response: `401 Unauthorized`
- ✅ Reason: JWT validation failed or expired

---

## 🛠️ Troubleshooting

### Still Getting 401?

**1. Check Token is Valid:**
```bash
# Verify token has Bearer prefix
curl -i -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8090/api/v1/notifications
```

**2. Check Token Expiration:**
```java
// In logs, you should see:
// "JWT validation failed: JWT expired"
```
Solution: Get a new token

**3. Check Service is Running:**
```bash
curl http://localhost:8083/actuator/health
# Should return: {"status":"UP"}
```

**4. Check Configuration:**
Verify `application.yml` has:
```yaml
jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration: 86400000
```

**5. Check Logs:**
```bash
# Look for JWT validation errors
# Run notification-service and check console:
# "JWT validation failed: {error message}"
```

---

## 📝 Configuration Files Added

### SecurityConfig.java
- Disables CSRF (stateless API)
- Requires authentication for `/api/v1/notifications/**`
- Permits access to Swagger and actuator endpoints
- Uses stateless session policy
- Adds JWT filter before auth

### JwtAuthFilter.java
- Intercepts all requests
- Extracts JWT from Authorization header
- Validates token signature and expiration
- Sets authenticated principal in SecurityContext

### JwtUtil.java
- Parses JWT claims
- Validates token expiration
- Extracts username from token
- Uses HMAC-SHA256 signing

### SwaggerConfig.java
- Configures API documentation
- Adds Bearer token authentication scheme
- Test endpoint with "Try it out" button

---

## ✅ Verification Checklist

After rebuilding, verify:

- [ ] Notification-service starts on port 8083
- [ ] Logs show no JWT-related errors
- [ ] Can access Swagger UI: http://localhost:8083/swagger-ui.html
- [ ] Can get JWT token from IAM service
- [ ] Can POST to `/api/v1/notifications` with valid token
- [ ] Gets 401 with invalid/missing token
- [ ] GET requests work with valid token

---

## 📚 Related Endpoints

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | `/api/v1/auth/login` | ❌ No |
| POST | `/api/v1/auth/register` | ❌ No |
| POST | `/api/v1/notifications` | ✅ Yes |
| GET | `/api/v1/notifications` | ✅ Yes |
| GET | `/api/v1/notifications/user/{userId}` | ✅ Yes |
| PATCH | `/api/v1/notifications/{id}/read` | ✅ Yes |
| DELETE | `/api/v1/notifications/{id}` | ✅ Yes |
| GET | `/v3/api-docs/**` | ❌ No |
| GET | `/swagger-ui/**` | ❌ No |
| GET | `/actuator/**` | ❌ No |

---

## 🎯 Quick Reference

### Get Token:
```bash
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecotrack.com", "password": "password123"}'
```

### Test Notification Creation:
```bash
curl -X POST http://localhost:8090/api/v1/notifications \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "message": "Test",
    "category": "GENERAL"
  }'
```

### Test Without Token (Should Fail):
```bash
curl -X POST http://localhost:8090/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "message": "Test", "category": "GENERAL"}'
# Returns: 401 Unauthorized
```

---

## 📞 Additional Resources

- JWT Documentation: https://tools.ietf.org/html/rfc7519
- jjwt Library: https://github.com/jwtk/jjwt
- Spring Security: https://spring.io/projects/spring-security

---

**Status:** ✅ Fixed & Ready to Test

*Changes Applied: May 3, 2026*
*Files Added: 4 new files*
*Files Modified: 2 files (pom.xml, application.yml)*


