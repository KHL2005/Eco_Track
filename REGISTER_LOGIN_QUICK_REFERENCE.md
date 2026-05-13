# 🚀 REGISTER & LOGIN Flow - Quick Summary Reference

**Last Updated:** May 8, 2026  
**Full Documentation:** See `COMPLETE_REGISTER_LOGIN_FLOW.md`

---

## 📊 Quick Layer Breakdown

| Layer | Port | File | Responsibility |
|-------|------|------|-----------------|
| **Frontend (React)** | 3000 | `RegisterPage.jsx`, `LoginPage.jsx` | Form validation, state management, API calls |
| **HTTP Client** | 3000 | `axiosInstance.js` | JWT token injection, request/response interception |
| **API Gateway** | 8090 | `GatewayConfig.java` | Rate limiting, circuit breaker, request routing |
| **IAM Service** | 8081 | `AuthService.java` | User registration, password verification, JWT generation |
| **Database** | 3306 | MySQL `users` table | User data persistence |

---

## 🔄 REGISTER FLOW (Button → Database → JWT)

```
1️⃣  USER EVENT
    └─ Clicks "Create Citizen Account" button
       Form: { name, email, phone, password }

2️⃣  CLIENT VALIDATION (Frontend)
    └─ File: RegisterPage.jsx
       ├─ name: 2-50 chars, letters/spaces/hyphens/apostrophes only
       ├─ email: valid format (contains @)
       ├─ phone: exactly 10 digits
       ├─ password: min 8, uppercase, lowercase, digit, special char
       └─ All pass? → Continue

3️⃣  API CALL
    └─ File: authApi.js
       └─ registerApi(form) 
          → axiosInstance.post('/auth/register', form)
          → Proxied to: POST http://localhost:8090/api/v1/auth/register

4️⃣  API GATEWAY (Port 8090)
    └─ File: GatewayConfig.java route "iam-auth"
       ├─ RequestRateLimiter (20 req/s sustained, 40 burst)
       ├─ CircuitBreaker (iamCB) - checks iam-service health
       ├─ Retry filter (GET only - POST not retried)
       └─ Load balance to: http://localhost:8081

5️⃣  IAM SERVICE CONTROLLER (Port 8081)
    └─ File: AuthController.java
       └─ @PostMapping("/register")
          ├─ @Valid decorator triggers DTO validation
          ├─ All fields checked against @constraints
          └─ Calls: AuthService.register(request)

6️⃣  IAM SERVICE - BUSINESS LOGIC
    └─ File: AuthService.java
       ├─ Check if email already exists
       │  └─ userRepository.existsByEmail(email) → if true, return 409
       │
       ├─ Create User entity:
       │  ├─ password = BCryptPasswordEncoder.encode(plaintext)
       │  ├─ role = UserRole.CITIZEN (always for public register)
       │  └─ status = UserStatus.ACTIVE
       │
       ├─ @Transactional Begin
       │
       ├─ Save to database:
       │  └─ userRepository.save(user)
       │     └─ INSERT INTO users VALUES(...)
       │        └─ DB returns auto-generated userId = 1
       │
       ├─ Generate JWT token:
       │  ├─ JwtUtil.generateToken(userDetails, extraClaims)
       │  ├─ Token = Header.Payload.Signature
       │  ├─ Subject = email
       │  ├─ Claims = { role: "CITIZEN", userId: 1 }
       │  ├─ Expiry = now + 24 hours
       │  └─ Signed with secret key (HS256)
       │
       ├─ Build AuthResponse:
       │  ├─ token: JWT string
       │  ├─ userId: 1
       │  ├─ email: "john@example.com"
       │  ├─ role: "CITIZEN"
       │  └─ name: "John Doe"
       │
       └─ @Transactional Commit

7️⃣  RESPONSE (HTTP 201 Created)
    └─ Returns AuthResponse JSON to browser

8️⃣  FRONTEND - PROCESS RESPONSE
    └─ File: RegisterPage.jsx
       ├─ const { data } = await registerApi(form)
       ├─ Call login(data) from AuthContext
       └─ navigate('/dashboard')

9️⃣  AUTHCONTEXT - STORE CREDENTIALS
    └─ File: AuthContext.jsx
       ├─ setToken(data.token) → React state
       ├─ setUser(data) → React state
       ├─ localStorage.setItem('ecotrack_auth', JSON.stringify({...}))
       └─ Now AUTHENTICATED for future requests

🔟 SUCCESS
    └─ User redirected to /dashboard (authenticated)
```

---

## 🔐 LOGIN FLOW (Credentials → Password Verification → JWT)

```
1️⃣  USER EVENT
    └─ Clicks "Sign In" button
       Form: { email, password }

2️⃣  CLIENT VALIDATION (Frontend)
    └─ email format check (contains @)
    └─ password min 8 chars
    └─ Both pass? → Continue

3️⃣  API CALL
    └─ loginApi(email, password)
       → axiosInstance.post('/auth/login', { email, password })
       → POST http://localhost:8090/api/v1/auth/login

4️⃣  API GATEWAY (Port 8090)
    └─ Same filters as register
       ├─ Rate limit check
       ├─ Circuit breaker check
       └─ Forward to iam-service:8081

5️⃣  IAM SERVICE CONTROLLER
    └─ File: AuthController.java
       └─ @PostMapping("/login")
          └─ Calls: AuthService.login(request)

6️⃣  IAM SERVICE - AUTHENTICATION & JWT
    └─ File: AuthService.java
    
       STEP 1: AUTHENTICATE PASSWORD
       ├─ authenticationManager.authenticate(
       │    new UsernamePasswordAuthenticationToken(email, password)
       │  )
       │
       ├─ AuthenticationManager delegates to DaoAuthenticationProvider
       │
       ├─ DaoAuthenticationProvider calls:
       │  └─ UserDetailsServiceImpl.loadUserByUsername(email)
       │     ├─ SELECT * FROM users WHERE email = 'john@example.com'
       │     └─ Returns User entity with password HASH
       │
       ├─ PasswordEncoder.matches(plaintext, hash) verifies:
       │  ├─ Extract salt from stored hash
       │  ├─ BCrypt hash the entered password with same salt
       │  ├─ Compare: hash(plaintext) == stored_hash
       │  └─ ✅ MATCH → Authentication succeeds
       │     ❌ NO MATCH → Throws BadCredentialsException → 401
       │
       STEP 2: LOAD USER FROM DB
       ├─ userRepository.findByEmail(email)
       └─ Returns User(userId=1, role=CITIZEN, status=ACTIVE, ...)
       │
       STEP 3: CHECK ACCOUNT STATUS
       ├─ If status == SUSPENDED or INACTIVE
       └─ Throw BadRequestException → 400
       │
       STEP 4: BUILD UserDetails
       ├─ New org.springframework.security.User(
       │    email, hashedPassword, [ROLE_CITIZEN]
       │  )
       │
       STEP 5: GENERATE JWT
       ├─ JwtUtil.generateToken(userDetails, extraClaims)
       ├─ Token with: sub=email, role=CITIZEN, userId=1
       ├─ Signed with HS256 + secret key
       └─ Expires in 24 hours
       │
       STEP 6: BUILD RESPONSE
       ├─ AuthResponse(
       │    token: JWT,
       │    userId: 1,
       │    email: "john@example.com",
       │    role: "CITIZEN",
       │    name: "John Doe"
       │  )
       │
       RETURN: HTTP 200 OK

7️⃣  FRONTEND - PROCESS RESPONSE
    └─ const { data } = await loginApi(...)
    └─ login(data) from AuthContext
    └─ navigate('/dashboard')

8️⃣  AUTHCONTEXT - STORE JWT
    └─ setToken(token)
    └─ localStorage.setItem('ecotrack_auth', {...})

🔟 SUCCESS
    └─ User authenticated, redirected to dashboard
    └─ Subsequent requests include: Authorization: Bearer <token>
```

---

## 🎯 Key Request/Response Bodies

### REGISTER Request
```json
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePass@123"
}
```

### REGISTER Response (201 Created)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "email": "john@example.com",
  "role": "CITIZEN",
  "name": "John Doe"
}
```

### LOGIN Request
```json
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

### LOGIN Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "email": "john@example.com",
  "role": "CITIZEN",
  "name": "John Doe"
}
```

---

## 🔍 Validation Annotations Applied

### **RegisterRequest.java**
| Field | Annotations | Rules |
|-------|-------------|-------|
| name | @NotBlank, @Size(2-50), @Pattern | Letters/spaces/hyphens/apostrophes only |
| email | @NotBlank, @Email, @Size(100) | Valid email format |
| phone | @Pattern | Exactly 10 digits |
| password | @NotBlank, @Size(8-100), @Pattern | min 8, upper, lower, digit, special |

### **LoginRequest.java**
| Field | Annotations | Rules |
|-------|-------------|-------|
| email | @NotBlank, @Email, @Size(100) | Valid email format |
| password | @NotBlank, @Size(8-100) | min 8 characters |

---

## 🛡️ Password Security

### During Registration
```
Plaintext Password: "SecurePass@123"
           ↓
BCryptPasswordEncoder.encode()
           ↓
Hash: "$2a$10$K1M2n3P4q5r6s7t8u9v0W..."  [60 chars]
           ↓
Stored in database (NEVER plaintext)
```

### During Login
```
Entered Password: "SecurePass@123"
           ↓
PasswordEncoder.matches(plaintext, hash)
           ↓
Extract salt from hash → Hash plaintext with same salt
           ↓
Compare hashes → ✅ MATCH or ❌ NO MATCH
           ↓
401 Unauthorized if no match
```

---

## 🎫 JWT Token Structure

### Encoded Form
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6IkNJVElaRU4iLCJ1c2VySWQiOjEsImlhdCI6MTcxNTEzNDgwMCwiZXhwIjoxNzE1MjIxMjAwfQ.
HmacSha256Signature...
```

### Decoded Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Decoded Payload
```json
{
  "sub": "john@example.com",
  "role": "CITIZEN",
  "userId": 1,
  "iat": 1715134800,
  "exp": 1715221200
}
```

### Signature
```
HMAC-SHA256(
  base64(header) + "." + base64(payload),
  secret_key_from_config
)
```

---

## 📊 Database Schema

### **users Table**
```sql
CREATE TABLE users (
  user_id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  name              VARCHAR(100) NOT NULL,
  email             VARCHAR(100) NOT NULL UNIQUE,
  password          VARCHAR(255) NOT NULL,  -- BCrypt hash
  phone             VARCHAR(20),
  role              VARCHAR(50) NOT NULL,   -- CITIZEN, ADMINISTRATOR, etc.
  status            VARCHAR(50) NOT NULL,   -- ACTIVE, SUSPENDED, INACTIVE
  created_at        DATETIME NOT NULL,
  updated_at        DATETIME NOT NULL,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
);
```

### Sample Row After Register
```sql
INSERT INTO users VALUES(
  1,                                              -- user_id
  'John Doe',                                     -- name
  'john@example.com',                             -- email (UNIQUE)
  '$2a$10$K1M2n3P4q5r6s7t8u9v0W...',  -- password (BCrypt)
  '9876543210',                                   -- phone
  'CITIZEN',                                      -- role (always CITIZEN on public register)
  'ACTIVE',                                       -- status
  '2026-05-08 10:15:30',                          -- created_at
  '2026-05-08 10:15:30'                           -- updated_at
);
```

---

## ❌ Error Scenarios

### Register Errors
| Scenario | HTTP | Response |
|----------|------|----------|
| Invalid name (John123) | 400 | "Name must contain only letters..." |
| Invalid email | 400 | "Please provide a valid email address" |
| Duplicate email | 409 | "Email already registered" |
| Weak password | 400 | "Password must have min 8 chars, 1 uppercase..." |
| Wrong phone format | 400 | "Phone number must be exactly 10 digits" |

### Login Errors
| Scenario | HTTP | Response |
|----------|------|----------|
| User not found | 401 | "Bad credentials" |
| Wrong password | 401 | "Bad credentials" |
| Account suspended | 400 | "Account is suspended" |
| Account inactive | 400 | "Account is inactive" |

---

## 🔐 After Login - JWT Usage

### Future Authenticated Requests (e.g., Update Profile)
```
PUT /api/v1/users/update-profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Jane Doe"
}
```

### JwtAuthFilter Processing
```
1. Extract "Bearer <token>" from Authorization header
2. Parse token using JwtUtil.extractUsername(token)
   ├─ Validates signature with secret key
   ├─ Checks expiration (not > 24h old)
   └─ Returns email from "sub" claim
3. Load UserDetails from database using email
4. Set SecurityContext with user authentication
5. Request continues as AUTHENTICATED user
```

---

## 📁 File Quick Reference

### Frontend Files
```
Frontend/
├── src/pages/
│   ├── RegisterPage.jsx         ← Register form
│   └── LoginPage.jsx            ← Login form
├── src/api/
│   ├── authApi.js               ← API endpoints
│   └── axiosInstance.js         ← HTTP client + JWT injection
└── src/context/
    └── AuthContext.jsx          ← Global auth state + storage
```

### Backend Files
```
Backend/iam-service/
├── controller/
│   └── AuthController.java      ← @PostMapping /register, /login
├── service/
│   ├── AuthService.java         ← Business logic
│   └── UserService.java         ← User operations
├── security/
│   ├── JwtUtil.java             ← JWT generation & validation
│   ├── JwtAuthFilter.java       ← Intercept & validate tokens
│   └── UserDetailsServiceImpl.java ← Load user for Spring Security
├── dto/
│   ├── RegisterRequest.java     ← Request validation
│   ├── LoginRequest.java        ← Request validation
│   ├── AuthResponse.java        ← Response structure
│   └── UserResponse.java        ← User data
├── entity/
│   └── User.java                ← Database model
├── repository/
│   └── UserRepository.java      ← Database queries
└── config/
    └── SecurityConfig.java      ← Spring Security configuration

Backend/api-gateway/
├── config/
│   └── GatewayConfig.java       ← Routes & filters
└── resources/
    └── application.yml          ← Route configuration
```

---

## 🚀 Testing Quick Commands

### Register
```bash
curl -X POST http://localhost:8090/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "SecurePass@123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass@123"
  }'
```

### Using JWT in Authenticated Request
```bash
curl -X PUT http://localhost:8090/api/v1/users/update-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Jane Doe"
  }'
```

---

## ✅ Configuration Reference

### Frontend (Vite)
**File:** `Frontend/vite.config.js`
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8090',
      changeOrigin: true
    }
  }
}
```

### IAM Service (Spring Boot)
**File:** `Backend/iam-service/src/main/resources/application.yml`
```yaml
server.port: 8081
jwt.secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
jwt.expiration: 86400000  # 24 hours
```

### API Gateway
**File:** `Backend/api-gateway/src/main/resources/application.yml`
```yaml
server.port: 8090
jwt.secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
```

---

## 🎯 Key Takeaways

✅ **Registration**
- Creates new CITIZEN user with BCrypt-hashed password
- Returns JWT token immediately (auto-login)
- Email must be unique

✅ **Login**
- Verifies email exists and password matches
- Checks account status (not suspended)
- Returns JWT token for future authenticated requests

✅ **Security**
- Passwords: BCrypt hashing (never plaintext in DB)
- JWT: HS256 signature (prevents tampering)
- Stateless: No server-side session storage
- Expiry: 24 hours from issuance

✅ **Architecture**
- Frontend → Vite proxy → API Gateway (8090) → IAM Service (8081) → MySQL
- All requests go through gateway (rate limiting, circuit breaker)
- JWT stored in browser localStorage
- JWT attached to all authenticated requests

---

**Full Documentation:** See `COMPLETE_REGISTER_LOGIN_FLOW.md` for detailed code walkthroughs with method signatures.


