# 401 Unauthorized Issue - Fix Summary

## Problem
POST requests to notification-service were returning:
```
401 Unauthorized
```

## Root Cause
The notification-service lacked essential security configuration for JWT token validation.

---

## ✅ Solution Implemented

### Files Created (4 files)

#### 1. **JwtUtil.java** (Security Component)
**Path:** `notification-service/src/main/java/com/ecotrack/notification/security/JwtUtil.java`

✅ Purpose:
- Parse and validate JWT tokens
- Extract user information from tokens
- Check token expiration
- Verify token signatures using shared secret

Key Methods:
- `extractUsername(token)` - Extract email from token
- `isTokenValid(token, userDetails)` - Validate token
- `extractExpiration(token)` - Get token expiration date

---

#### 2. **JwtAuthFilter.java** (Security Filter)
**Path:** `notification-service/src/main/java/com/ecotrack/notification/security/JwtAuthFilter.java`

✅ Purpose:
- Intercept all incoming requests
- Extract JWT from Authorization header
- Validate token and set authentication context
- Allow filter chain to continue if valid

How it works:
```
1. Check for "Authorization: Bearer {token}" header
2. Extract token from header
3. Parse token using JwtUtil
4. Set authenticated user in SecurityContext
5. Allow request to proceed if valid
6. Return 401 if token invalid/missing
```

---

#### 3. **SecurityConfig.java** (Security Configuration)
**Path:** `notification-service/src/main/java/com/ecotrack/notification/config/SecurityConfig.java`

✅ Purpose:
- Configure Spring Security for stateless API
- Define authentication rules
- Register JWT filter in security chain

Configuration Details:
```java
// CSRF disabled (stateless API)
.csrf(csrf -> csrf.disable())

// Public endpoints (no auth required)
- /v3/api-docs/**
- /swagger-ui/**
- /swagger-ui.html
- /actuator/**

// Protected endpoints (auth required)
- /api/v1/notifications/**

// Stateless sessions (no cookies)
.sessionManagement(...SessionCreationPolicy.STATELESS)

// JWT filter before auth
.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
```

---

#### 4. **SwaggerConfig.java** (API Documentation)
**Path:** `notification-service/src/main/java/com/ecotrack/notification/config/SwaggerConfig.java`

✅ Purpose:
- Configure OpenAPI/Swagger documentation
- Support bearer token in Swagger UI
- Document API with authentication requirement

Features:
- Bearer token authentication support
- API Gateway endpoint documentation
- API versioning

---

### Files Modified (2 files)

#### 1. **pom.xml** (Maven Configuration)
**Path:** `notification-service/pom.xml`

✅ Added JWT Dependencies:
```xml
<!-- JWT API -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>${jjwt.version}</version>
</dependency>

<!-- JWT Implementation -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>${jjwt.version}</version>
    <scope>runtime</scope>
</dependency>

<!-- JWT Jackson Support -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>${jjwt.version}</version>
    <scope>runtime</scope>
</dependency>
```

---

#### 2. **application.yml** (Service Configuration)
**Path:** `notification-service/src/main/resources/application.yml`

✅ Added JWT Configuration:
```yaml
jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration: 86400000  # 24 hours in milliseconds
```

---

## 🔄 How JWT Authentication Works Now

```
┌──────────────────────────────────────────────────────────┐
│ Client                                                   │
│ 1. Login → GET JWT Token                                │
│    POST /auth/login → Returns {"token": "..."}           │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ 2. Use Token in Authorization Header
                   │    Authorization: Bearer {JWT}
                   ▼
┌──────────────────────────────────────────────────────────┐
│ API Gateway (8090)                                       │
│ - Receives request with JWT                             │
│ - Routes to notification-service                        │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ 3. Request arrives with Authorization header
                   ▼
┌──────────────────────────────────────────────────────────┐
│ Notification Service (8083)                              │
│                                                          │
│ JwtAuthFilter:                                           │
│ ├─ Check Authorization header exists                    │
│ ├─ Extract "Bearer ..." token                           │
│ ├─ Parse token using JwtUtil                            │
│ ├─ Validate signature with secret key                   │
│ ├─ Check token not expired                              │
│ ├─ Set SecurityContext with user info                   │
│ └─ Pass to NotificationController if valid              │
│                                                          │
│ SecurityConfig:                                          │
│ ├─ Permit: /swagger-ui/**, /v3/api-docs/**, etc.       │
│ ├─ Require auth: /api/v1/notifications/**              │
│ └─ Return 401 if not authenticated                      │
│                                                          │
│ NotificationController:                                  │
│ └─ Process authenticated request                        │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ 4. Response (201, 404, 500, etc.)
                   ▼
┌──────────────────────────────────────────────────────────┐
│ Client receives response                                 │
└──────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing the Fix

### Test 1: Get JWT Token (from IAM Service)
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

---

### Test 2: Create Notification (with valid token)
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

**Response (201 Created):**
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

### Test 3: Without Token (Should Get 401)
```bash
curl -X POST http://localhost:8090/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "entityId": 100,
    "message": "Test",
    "category": "GENERAL"
  }'
```

**Response (401 Unauthorized):**
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "JWT token is missing or invalid"
}
```

---

### Test 4: Access Public Endpoints (No Token Needed)
```bash
# Swagger UI
curl http://localhost:8090/swagger-ui/index.html

# Health Check
curl http://localhost:8090/actuator/health

# API Docs
curl http://localhost:8090/v3/api-docs
```

**Response (200 OK)** - All accessible without token

---

## 🚀 Rebuild & Deploy Steps

### Step 1: Clean Build
```bash
cd C:\Users\2479746\Documents\Project\Backend
mvn clean package -DskipTests
```

### Step 2: Run Services in Order
```bash
# Terminal 1: Eureka
java -jar eureka-server/target/eureka-server-1.0.0.jar

# Terminal 2: Config Server  
java -jar config-server/target/config-server-1.0.0.jar

# Terminal 3: Notification Service (Should now work!)
java -jar notification-service/target/notification-service-1.0.0.jar

# Terminal 4: IAM Service
java -jar iam-service/target/iam-service-1.0.0.jar

# Terminal 5: API Gateway
java -jar api-gateway/target/api-gateway-1.0.0.jar
```

### Step 3: Verify Services
```bash
# Check all services registered in Eureka
curl http://localhost:8761/

# Check notification-service running
curl http://localhost:8083/actuator/health

# Check JWT is working
- Get token from IAM
- Use token in notification endpoints
```

---

## 🔐 Security Details

### JWT Token Components

**Token Structure:** `Header.Payload.Signature`

Example Decoded Token:
```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "sub": "admin@ecotrack.com",
  "iat": 1714730400,
  "exp": 1714816800
}

Signature: [HMAC-SHA256 using secret key]
```

### Token Validation Process

1. **Extract token** from `Authorization: Bearer {token}` header
2. **Parse header** - Verify algorithm is HS256
3. **Verify signature** - Use secret key to validate
4. **Check expiration** - Ensure `exp` claim hasn't passed
5. **Extract username** - Get `sub` claim (email)
6. **Set authentication** - Create SecurityContext entry

---

## 📋 Troubleshooting

### Issue: Still Getting 401
**Solution:**
- Ensure JWT dependencies are on classpath
- Check SecurityConfig is being loaded
- Verify JWT secret is correct
- Check token format: `Bearer {token}` (with space)
- Look for JWT validation errors in logs

### Issue: Token Expired
**Solution:**
- Get a new token
- Token expires after 24 hours
- Check system clock is correct

### Issue: Invalid Token
**Solution:**
- Ensure token is from same IAM service
- Check JWT secret matches between services
- Verify token hasn't been modified

### Issue: CORS Error
**Note:** Not directly related to JWT
- Check API Gateway CORS config
- May need to add OPTIONS endpoint

---

## ✅ Verification Checklist

After rebuild:

- [ ] notification-service starts without errors
- [ ] Can access Swagger UI: http://localhost:8083/swagger-ui.html
- [ ] "Authorize" button appears in Swagger
- [ ] Can enter JWT token in Swagger
- [ ] `401 Unauthorized` without token
- [ ] `201 Created` with valid token
- [ ] All notification endpoints work with token
- [ ] Eureka shows notification-service as UP
- [ ] API Gateway routes to notification-service

---

## 📊 Files Summary

| File | Type | Purpose | Status |
|------|------|---------|--------|
| JwtUtil.java | Security Util | Token validation | ✅ Created |
| JwtAuthFilter.java | Security Filter | Request filtering | ✅ Created |
| SecurityConfig.java | Configuration | Spring Security config | ✅ Created |
| SwaggerConfig.java | Configuration | API documentation | ✅ Created |
| pom.xml | Maven Config | JWT dependencies | ✅ Updated |
| application.yml | Service Config | JWT settings | ✅ Updated |

---

## 📚 Next Steps

1. **Rebuild the project**
   ```bash
   mvn clean package
   ```

2. **Start all services** in correct order

3. **Test with JWT token**
   ```bash
   # Get token, then use in notification endpoints
   ```

4. **Verify in Swagger UI**
   - Click "Authorize" button
   - Paste JWT token
   - Try endpoints

5. **Monitor logs** for any JWT validation errors

---

## 🎯 Expected Behavior After Fix

✅ **Before Fix:**
```
POST /api/v1/notifications
→ 401 Unauthorized (no security config)
```

✅ **After Fix:**
```
POST /api/v1/notifications (no token)
→ 401 Unauthorized (as expected)

POST /api/v1/notifications (with valid token)
→ 201 Created (works!)
```

---

## 📞 Quick Reference

**Get Token:**
```
POST /api/v1/auth/login
```

**Create Notification (with token):**
```
POST /api/v1/notifications
Headers: Authorization: Bearer {token}
Body: {"userId": 1, "message": "...", "category": "GENERAL"}
```

**View Token Details (JWT.io):**
```
Go to https://jwt.io
Paste token in "Encoded" section
View decoded payload and signature verification
```

---

**Status:** ✅ Security Configuration Complete

*Date: May 3, 2026*
*Changes Applied: 4 new files + 2 modified*
*Ready for Testing: YES*


