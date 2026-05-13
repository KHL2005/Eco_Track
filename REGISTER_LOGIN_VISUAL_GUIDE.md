# 🎯 REGISTER & LOGIN - Visual Architecture & Data Flow

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EcoTrack System Architecture                      │
└─────────────────────────────────────────────────────────────────────────────┘

                         🌐 FRONTEND (React - Vite)
                         ┌───────────────────────────┐
                         │   localhost:3000          │
                         │                           │
                         │  ┌────────────────────┐   │
                         │  │  RegisterPage.jsx  │   │
                         │  │  LoginPage.jsx     │   │
                         │  │  AuthContext.jsx   │   │
                         │  └────────────────────┘   │
                         └─────────────┬─────────────┘
                                       │
                      Vite Proxy (Dev)  │  /api → localhost:8090
                                       │
                         ┌─────────────▼─────────────┐
                         │   🛑 API GATEWAY          │
                         │   Port 8090               │
                         │   ┌────────────────────┐  │
                         │   │ Rate Limiter       │  │
                         │   │ Circuit Breaker    │  │
                         │   │ Retry              │  │
                         │   │ Route Locator      │  │
                         │   └────────────────────┘  │
                         │   Service Discovery:      │
                         │   Eureka (8761)           │
                         └─────────────┬─────────────┘
                                       │
                       Load Balancer    │  /api/v1/auth/** → iam-service
                                       │
                         ┌─────────────▼─────────────┐
                         │   🛡️  IAM SERVICE         │
                         │   Port 8081               │
                         │   ┌────────────────────┐  │
                         │   │ AuthController     │  │
                         │   │ AuthService        │  │
                         │   │ JwtAuthFilter      │  │
                         │   │ JwtUtil            │  │
                         │   │ UserRepository     │  │
                         │   └────────────────────┘  │
                         │   Spring Security        │
                         │   BCryptPasswordEncoder   │
                         └─────────────┬─────────────┘
                                       │
                                       │
                         ┌─────────────▼─────────────┐
                         │   💾 MySQL Database       │
                         │   Port 3306               │
                         │   ┌────────────────────┐  │
                         │   │ ecotrack_iam       │  │
                         │   │  ↳ users table     │  │
                         │   └────────────────────┘  │
                         └───────────────────────────┘
```

---

## 📤 REGISTER Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         REGISTER FLOW (DETAILED)                         │
└──────────────────────────────────────────────────────────────────────────┘

STEP 1: BROWSER (Frontend)
═══════════════════════════════════════════════════════════════════════════
┌─ User Input ─────────────────────────────────────────────┐
│                                                          │
│  RegisterPage.jsx                                       │
│  ├─ name:     "John Doe"                                │
│  ├─ email:    "john@example.com"                        │
│  ├─ phone:    "9876543210"    ← Exactly 10 digits      │
│  └─ password: "SecurePass@123"                          │
│               ↑ min 8, upper, lower, digit, special    │
│                                                          │
└─ Validate Locally ────────────────────────────────────────┘
  │
  ├─ Check: name length 2-50 ✓
  ├─ Check: email format ✓
  ├─ Check: phone 10 digits ✓
  └─ Check: password strength ✓
    │
    └─→ POST /api/v1/auth/register


STEP 2: HTTP REQUEST (Vite Dev Server)
═══════════════════════════════════════════════════════════════════════════
POST http://localhost:3000/api/v1/auth/register
  │
  ├─ Vite proxy intercepts
  ├─ Redirects to: http://localhost:8090/api/v1/auth/register
  │
  └─→ REQUEST HEADERS
      Content-Type: application/json
      
      BODY:
      {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "password": "SecurePass@123"
      }


STEP 3: API GATEWAY (Port 8090)
═══════════════════════════════════════════════════════════════════════════
GatewayConfig.java
  │
  ├─ ROUTE MATCHING
  │  Route ID: "iam-auth"
  │  Path: "/api/v1/auth/**" ✅ MATCHES /auth/register
  │  │
  │  ├─ FILTER 1: RequestRateLimiter
  │  │  ├─ Key: IP address (localhost)
  │  │  ├─ Bucket: 20 req/s sustained, 40 burst (Redis)
  │  │  └─ Decision: ✅ ALLOW
  │  │
  │  ├─ FILTER 2: CircuitBreaker (iamCB)
  │  │  ├─ Service: iam-service
  │  │  ├─ Health: CLOSED (service up)
  │  │  └─ Decision: ✅ ALLOW
  │  │
  │  ├─ FILTER 3: Retry
  │  │  ├─ Method: POST (not idempotent)
  │  │  └─ Decision: ✅ SKIP (GET only)
  │  │
  │  └─ SERVICE DISCOVERY
  │     ├─ URI: lb://iam-service
  │     ├─ Query Eureka (port 8761)
  │     ├─ Find iam-service instance: localhost:8081
  │     └─ Load balance → Forward
  │
  └─→ FORWARD TO: http://localhost:8081/api/v1/auth/register


STEP 4: IAM SERVICE - CONTROLLER (Port 8081)
═══════════════════════════════════════════════════════════════════════════
AuthController.java

@PostMapping("/register")
public ResponseEntity<AuthResponse> register(
    @Valid @RequestBody RegisterRequest request
) {
    // @Valid triggers validation of RegisterRequest DTO
    
    VALIDATION CHECK:
    ├─ name field:
    │  ├─ @NotBlank → "John Doe" is not blank ✓
    │  ├─ @Size(2-50) → Length 8 is within range ✓
    │  └─ @Pattern("^[a-zA-Z\\s'-]+$") → All letters & spaces ✓
    │
    ├─ email field:
    │  ├─ @NotBlank → "john@example.com" is not blank ✓
    │  ├─ @Email → Valid format (contains @) ✓
    │  └─ @Size(100) → Length 18 is under 100 ✓
    │
    ├─ phone field:
    │  └─ @Pattern("^[+]?[0-9]{10}$") → Exactly 10 digits ✓
    │
    ├─ password field:
    │  ├─ @NotBlank → Not blank ✓
    │  ├─ @Size(8-100) → 18 chars within range ✓
    │  └─ @Pattern → Has upper, lower, digit, special ✓
    │
    └─ ✅ ALL VALIDATIONS PASS → Continue

    return ResponseEntity
        .status(HttpStatus.CREATED)  // 201 Created
        .body(authService.register(request));
}


STEP 5: IAM SERVICE - BUSINESS LOGIC (AuthService.java)
═══════════════════════════════════════════════════════════════════════════
@Transactional  ← Database transaction begins
public AuthResponse register(RegisterRequest request) {
    
    ┌─ DUPLICATE CHECK ─────────────────────┐
    │                                       │
    │ if (userRepository.existsByEmail(     │
    │     "john@example.com"                │
    │ )) {                                  │
    │   throw DuplicateResourceException()  │
    │   ↓                                   │
    │   HTTP 409 Conflict                   │
    │ }                                     │
    │                                       │
    │ Query: SELECT COUNT(*) FROM users     │
    │        WHERE email = 'john@...'       │
    │ Result: 0 (not found) → Continue ✓   │
    │                                       │
    └───────────────────────────────────────┘
    
    ┌─ CREATE USER ENTITY ──────────────────┐
    │                                       │
    │ User user = User.builder()            │
    │   .name("John Doe")                   │
    │   .email("john@example.com")          │
    │   .phone("9876543210")                │
    │   .password(                          │
    │      passwordEncoder.encode(          │
    │        "SecurePass@123"               │
    │      )  ← BCrypt hash applied         │
    │   )                                   │
    │   .role(UserRole.CITIZEN)             │
    │   ├─ ↑ Always CITIZEN on public reg   │
    │   .status(UserStatus.ACTIVE)          │
    │   .build()                            │
    │                                       │
    │ Local object created (not in DB yet)  │
    │                                       │
    └───────────────────────────────────────┘
    
    ┌─ PASSWORD HASHING DETAIL ─────────────┐
    │                                       │
    │ Input: "SecurePass@123"               │
    │   ↓                                   │
    │ BCryptPasswordEncoder.encode()        │
    │   ├─ Generate random salt             │
    │   ├─ Apply bcrypt algorithm:          │
    │   │  bcrypt_hash = bcrypt(            │
    │   │    password,                      │
    │   │    cost=10,    ← 2^10 iterations  │
    │   │    salt                           │
    │   │  )                                │
    │   └─ Return 60-character hash         │
    │   ↓                                   │
    │ Output: "$2a$10$K1M2n3P4q5r6..."     │
    │         (Different every time!)       │
    │                                       │
    └───────────────────────────────────────┘
    
    ┌─ PERSIST TO DATABASE ─────────────────┐
    │                                       │
    │ userRepository.save(user)             │
    │   ↓                                   │
    │ Hibernate detects: NEW entity (no ID) │
    │   ↓                                   │
    │ INSERT INTO users (                   │
    │   name, email, password, phone, role, │
    │   status, created_at, updated_at      │
    │ ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)    │
    │   ↓                                   │
    │ MySQL auto-increment:                 │
    │   userId = 1 (auto-generated)         │
    │   created_at = NOW()                  │
    │   (via @PrePersist)                   │
    │   ↓                                   │
    │ user object returned with userId=1 ✓ │
    │                                       │
    └───────────────────────────────────────┘
    
    ┌─ GENERATE JWT TOKEN ──────────────────┐
    │                                       │
    │ JwtUtil.generateToken(                │
    │   userDetails,                        │
    │   extraClaims: {                      │
    │     "role": "CITIZEN",                │
    │     "userId": 1                       │
    │   }                                   │
    │ )                                     │
    │   ↓                                   │
    │ Jwts.builder()                        │
    │   .claims({ role, userId })           │
    │   .subject("john@example.com")        │
    │   .issuedAt(NOW)                      │
    │   .expiration(NOW + 24h)              │
    │   .signWith(HS256, secret_key)        │
    │   .compact()                          │
    │   ↓                                   │
    │ Token = Header.Payload.Signature     │
    │   ↓                                   │
    │ "eyJ..." (very long string)           │
    │                                       │
    └───────────────────────────────────────┘
    
    ┌─ BUILD RESPONSE ──────────────────────┐
    │                                       │
    │ AuthResponse.builder()                │
    │   .token("eyJ...")                    │
    │   .userId(1)                          │
    │   .email("john@example.com")          │
    │   .role("CITIZEN")                    │
    │   .name("John Doe")                   │
    │   .build()                            │
    │                                       │
    └───────────────────────────────────────┘

} // @Transactional commits the transaction to database ✓


STEP 6: RESPONSE SENT BACK
═══════════════════════════════════════════════════════════════════════════
HTTP 201 Created
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6IkNJVElaRU4iLCJ1c2VySWQiOjEsImlhdCI6MTcxNTEzNDgwMCwiZXhwIjoxNzE1MjIxMjAwfQ.HmacSha256Signature...",
  "userId": 1,
  "email": "john@example.com",
  "role": "CITIZEN",
  "name": "John Doe"
}
  │
  ├─ Response goes back through API Gateway (no modification)
  │
  └─→ Returns to Browser (Vite proxy)


STEP 7: BROWSER PROCESSES RESPONSE
═══════════════════════════════════════════════════════════════════════════
RegisterPage.jsx

const { data } = await registerApi(form);
// data = AuthResponse { token, userId, email, role, name }

// No interceptor errors (201 is not 401)

// Call AuthContext.login(data)
AuthContext.jsx - login() function:
  ├─ setToken(data.token)
  │  └─ React state updated
  │
  ├─ setUser({ userId, email, role, name })
  │  └─ React state updated
  │
  ├─ localStorage.setItem(
  │    'ecotrack_auth',
  │    JSON.stringify({ token, userId, email, role, name })
  │  )
  │  └─ Persisted in browser storage ✓
  │
  └─ navigate('/dashboard', { replace: true })
     └─ User redirected to authenticated page ✓


RESULT: ✅ USER REGISTERED & AUTHENTICATED
═══════════════════════════════════════════════════════════════════════════
• User created in database (user_id = 1)
• Password stored as BCrypt hash (never plaintext)
• JWT token issued (expires in 24 hours)
• Token stored in browser localStorage
• User redirected to /dashboard
• User can now make authenticated requests with JWT
```

---

## 📥 LOGIN Data Flow

```
STEP 1-3: SAME AS REGISTER (Request → Gateway routing)
═══════════════════════════════════════════════════════════════════════════
POST http://localhost:8090/api/v1/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}


STEP 4: IAM SERVICE - CONTROLLER
═══════════════════════════════════════════════════════════════════════════
AuthController.java

@PostMapping("/login")
public ResponseEntity<AuthResponse> login(
    @Valid @RequestBody LoginRequest request
) {
    // Validation: email @Email ✓, password @Size(8-100) ✓
    return ResponseEntity.ok(authService.login(request));
}


STEP 5: IAM SERVICE - PASSWORD VERIFICATION (AuthService.java)
═══════════════════════════════════════════════════════════════════════════
@Transactional
public AuthResponse login(LoginRequest request) {
    
    ┌─ AUTHENTICATE CREDENTIALS ────────────┐
    │                                       │
    │ authenticationManager.authenticate(   │
    │   new UsernamePasswordAuthenticationToken(
    │     "john@example.com",               │
    │     "SecurePass@123"                  │
    │   )                                   │
    │ )                                     │
    │   ↓                                   │
    │ Spring Security delegates to:         │
    │ DaoAuthenticationProvider             │
    │   ↓                                   │
    │ Calls UserDetailsServiceImpl:          │
    │   ├─ loadUserByUsername("john@...")   │
    │   ├─ Query: SELECT * FROM users       │
    │   │         WHERE email = 'john@...'  │
    │   ├─ Found! Returns User object       │
    │   │ with password hash: "$2a$10$..."  │
    │   └─ Build UserDetails object         │
    │   ↓                                   │
    │ DaoAuthenticationProvider calls:      │
    │   ├─ passwordEncoder.matches(         │
    │   │    "SecurePass@123",    ← entered │
    │   │    "$2a$10$K1M2n3..."   ← hashed  │
    │   │  )                                │
    │   ├─ BCrypt verification:             │
    │   │  ├─ Extract salt from hash        │
    │   │  ├─ bcrypt_hash(user_input, salt)│
    │   │  ├─ Compare: hash(input) == DB   │
    │   │  └─ ✅ MATCH!                     │
    │   └─ Return: true                     │
    │   ↓                                   │
    │ Authentication succeeds ✓             │
    │                                       │
    │ (If password wrong: BadCredentialsEx  │
    │  ↓ HTTP 401 Unauthorized)             │
    │                                       │
    └───────────────────────────────────────┘
    
    ┌─ LOAD USER FROM DATABASE ────────────┐
    │                                       │
    │ userRepository.findByEmail(           │
    │   "john@example.com"                  │
    │ )  ← Returns Optional<User>           │
    │   .orElseThrow(                       │
    │     () → BadRequestException()        │
    │   )                                   │
    │   ↓                                   │
    │ User found:                           │
    │ ├─ userId: 1                          │
    │ ├─ name: "John Doe"                   │
    │ ├─ email: "john@example.com"          │
    │ ├─ password: "$2a$10$K..."            │
    │ ├─ phone: "9876543210"                │
    │ ├─ role: CITIZEN                      │
    │ ├─ status: ACTIVE ← Check this!       │
    │ └─ created_at: 2026-05-08 10:15:30    │
    │                                       │
    └───────────────────────────────────────┘
    
    ┌─ CHECK ACCOUNT STATUS ─────────────────┐
    │                                        │
    │ if (user.getStatus() ==                │
    │     UserStatus.SUSPENDED ||            │
    │     UserStatus.INACTIVE                │
    │ ) {                                    │
    │   throw BadRequestException(           │
    │     "Account is suspended"             │
    │   )                                    │
    │ }                                      │
    │                                        │
    │ user.status = ACTIVE → Continue ✓     │
    │                                        │
    └────────────────────────────────────────┘
    
    ┌─ BUILD UserDetails ────────────────────┐
    │                                        │
    │ new org.springframework.                │
    │   security.core.userdetails.User(     │
    │   "john@example.com",                  │
    │   "$2a$10$K...",                       │
    │   [SimpleGrantedAuthority("           │
    │     ROLE_CITIZEN"                      │
    │   )]                                   │
    │ )                                      │
    │                                        │
    └────────────────────────────────────────┘
    
    ┌─ GENERATE JWT TOKEN (same as register)─┐
    │                                        │
    │ JwtUtil.generateToken(                 │
    │   userDetails,                         │
    │   Map.of(                              │
    │     "role", "CITIZEN",                 │
    │     "userId", 1                        │
    │   )                                    │
    │ )                                      │
    │   ↓                                    │
    │ "eyJ..." (JWT token string)            │
    │                                        │
    └────────────────────────────────────────┘
    
    ┌─ RETURN AuthResponse ──────────────────┐
    │                                        │
    │ AuthResponse.builder()                 │
    │   .token("eyJ...")                     │
    │   .userId(1)                           │
    │   .email("john@example.com")           │
    │   .role("CITIZEN")                     │
    │   .name("John Doe")                    │
    │   .build()                             │
    │                                        │
    └────────────────────────────────────────┘

} // @Transactional commits ✓


STEP 6-7: RESPONSE & BROWSER PROCESSING (same as register)
═══════════════════════════════════════════════════════════════════════════
HTTP 200 OK (same response structure)

Browser:
├─ Extract AuthResponse
├─ Call login(data)  ← Stores in AuthContext + localStorage
└─ navigate('/dashboard')

✅ USER LOGGED IN & AUTHENTICATED
```

---

## 🔐 Password Verification Algorithm

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PASSWORD FLOW: REGISTER vs LOGIN                 │
└─────────────────────────────────────────────────────────────────────┘

REGISTRATION (Plaintext → Hash → Store)
═════════════════════════════════════════════════════════════════════
User: "SecurePass@123"
      ↓
      [Frontend validation: min 8, upper, lower, digit, special]
      ↓
      Sent as plaintext in HTTP body (HTTPS in production)
      ↓
Backend - BCryptPasswordEncoder.encode():
  ├─ Generate random 16-byte salt
  ├─ iterations = 2^10 = 1024 (cost factor)
  ├─ Apply bcrypt algorithm:
  │  for (0 to 1023 iterations):
  │    hash = bcrypt(password, salt)
  │  (exponential slowness by design)
  ├─ Result format: $2a$10$salt(22 chars)hash(31 chars)
  └─ Example: $2a$10$K1M2n3.../Abcdef...
      ↑ Version
           ↑ Cost (10)
              ↑ Result

Database stores: $2a$10$K1M2n3P4q5...
  (Never plaintext!)
  (Different hash every time due to random salt)


LOGIN (Entered → Hash with saved salt → Compare)
═════════════════════════════════════════════════════════════════════
User enters: "SecurePass@123"
      ↓
      Sent to backend
      ↓
Backend - PasswordEncoder.matches():
  ├─ Receive:
  │  ├─ plaintext: "SecurePass@123"
  │  └─ hash_from_db: "$2a$10$K1M2n3P4q5..."
  │
  ├─ Extract salt from hash: "K1M2n3P4q5..." (first 22 chars)
  │
  ├─ Apply bcrypt with SAME salt:
  │  new_hash = bcrypt("SecurePass@123", extracted_salt)
  │  (2^10 iterations again)
  │
  ├─ Compare hashes:
  │  if (new_hash == hash_from_db) {
  │    ✅ Password correct!
  │  } else {
  │    ❌ Password wrong → 401 Unauthorized
  │  }
  │
  └─ Return boolean: true/false


CRUCIAL SECURITY PROPERTIES
═════════════════════════════════════════════════════════════════════
✓ Salt is stored in the hash (embedded in the 60-char string)
✓ Same password creates different hashes (random salt each time)
✓ Database breach doesn't leak passwords (only hashes)
✓ Computationally impossible to reverse-engineer (bcrypt slowed)
✓ 2^10 cost = ~100ms per hash attempt (slows brute force attacks)


Example Breakdown:
═════════════════════════════════════════════════════════════════════
Hash in DB: $2a$10$jmF6G0z9O.x5Z1y3A.b7mOrGrxqP8hK2L4M5nO6pQ7rS8t9UvW

$2a        → BCrypt algorithm version (2a = current)
$10        → Cost factor (2^10 = 1024 iterations)
$jmF...    → Salt (22 base64 characters)
G0z9O...   → Hash output (31 base64 characters)
```

---

## 🎫 JWT Token Deep Dive

```
┌─────────────────────────────────────────────────────────────────────┐
│                        JWT TOKEN ANATOMY                            │
└─────────────────────────────────────────────────────────────────────┘

ENCODED (What you see in browser)
═════════════════════════════════════════════════════════════════════
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6IkNJVElaRU4iLCJ1c2VySWQiOjEsImlhdCI6MTcxNTEzNDgwMCwiZXhwIjoxNzE1MjIxMjAwfQ.
HmacSha256Signature...


PART 1: HEADER (Before first dot)
═════════════════════════════════════════════════════════════════════
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
  ↓ Base64 decode
{
  "alg": "HS256",    ← Algorithm for signature
  "typ": "JWT"       ← Token type
}

Meaning:
├─ Use HMAC with SHA256 for signature
└─ This is a JSON Web Token


PART 2: PAYLOAD (After first dot, before second)
═════════════════════════════════════════════════════════════════════
eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6IkNJVElaRU4iLCJ1c2VySWQiOjEsImlhdCI6MTcxNTEzNDgwMCwiZXhwIjoxNzE1MjIxMjAwfQ
  ↓ Base64 decode
{
  "sub": "john@example.com",      ← Subject (email)
  "role": "CITIZEN",               ← Custom claim
  "userId": 1,                     ← Custom claim
  "iat": 1715134800,               ← Issued At (timestamp)
  "exp": 1715221200                ← Expiration (24h later)
}

Meaning:
├─ Issued for user: john@example.com
├─ User role: CITIZEN
├─ User ID: 1
├─ Created at: May 8, 2026 10:30:00 UTC
└─ Expires at: May 9, 2026 10:30:00 UTC


PART 3: SIGNATURE (After second dot)
═════════════════════════════════════════════════════════════════════
HmacSha256Signature...
  ↓ Created by:
signature = HMAC_SHA256(
  base64(header) + "." + base64(payload),
  secret_key
)

Where secret_key from config:
jwt.secret = 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970

Meaning:
├─ Signature proves no one tampered with the token
├─ Only server knows the secret key
├─ Changing any bit invalidates the signature
└─ Client cannot forge a valid token


TOKEN VERIFICATION (When used later)
═════════════════════════════════════════════════════════════════════
When browser sends: Authorization: Bearer <token>

Backend (JwtAuthFilter):
1. Extract: header.payload.signature
2. Recompute: new_signature = HMAC_SHA256(header.payload, secret)
3. Compare:
   if (new_signature == received_signature) {
     ✅ Token is valid (not tampered)
   } else {
     ❌ Token is invalid → 401 Unauthorized
   }
4. Check expiration:
   if (exp_timestamp < now()) {
     ❌ Token expired → 401 Unauthorized
   } else {
     ✅ Token is fresh → Continue
   }
5. Extract claims:
   sub = "john@example.com"
   role = "CITIZEN"
   Set SecurityContext with this info


TOKEN FLOW IN REQUEST
═════════════════════════════════════════════════════════════════════
Step 1: Browser has token in localStorage
Step 2: User makes authenticated request
Step 3: axiosInstance interceptor runs:
        ├─ Read token from localStorage
        ├─ Add header: Authorization: Bearer <token>
        └─ Send request
Step 4: API Gateway forwards header
Step 5: IAM Service JwtAuthFilter:
        ├─ Extract header value
        ├─ Remove "Bearer " prefix → Get token
        ├─ Parse & verify token
        ├─ Load user from DB using email
        ├─ Set SecurityContext
        └─ Continue to controller (AUTHENTICATED)
Step 6: Controller/Service can access:
        ├─ SecurityContextHolder.getContext().getAuthentication()
        ├─ user's email
        ├─ user's roles
        └─ user's ID


TOKEN EXPIRY HANDLING
═════════════════════════════════════════════════════════════════════
Current config:
jwt.expiration = 86400000  ← milliseconds
                           ← 86400 seconds
                           ← 24 hours

Usage:
expiration_time = issued_time + jwt.expiration
exp_claim = 1715134800 + 86400 = 1715221200

If user tries to use token after 24 hours:
├─ Token still looks valid (properly signed)
├─ But exp < now() → EXPIRED
├─ Backend rejects → 401 Unauthorized
├─ axiosInstance interceptor catches 401
├─ Clears localStorage
├─ Redirects to home (login page)
└─ User must login again


REFRESH TOKENS (Future Enhancement)
═════════════════════════════════════════════════════════════════════
Not currently implemented, but pattern is:

1. Short-lived access token (15 mins)
2. Long-lived refresh token (7 days)
3. User keeps refresh token in localStorage
4. When access token expires:
   ├─ Send refresh token
   ├─ Backend validates & generates new access token
   └─ User continues without re-login
5. Very long expiry is security risk (if stolen)
```

---

## 🛡️ Authentication & Authorization (Post-Login)

```
┌─────────────────────────────────────────────────────────────────────┐
│           AUTHENTICATED REQUEST FLOW (POST-LOGIN)                   │
│                                                                     │
│  User makes request to protected endpoint with JWT token            │
└─────────────────────────────────────────────────────────────────────┘

REQUEST WITH JWT TOKEN
═════════════════════════════════════════════════════════════════════
Example: Update profile (protected endpoint)

PUT http://localhost:8090/api/v1/users/update-profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Jane Doe"
}


axiosInstance REQUEST INTERCEPTOR
═════════════════════════════════════════════════════════════════════
// Frontend - axiosInstance.js

axiosInstance.interceptors.request.use(
  (config) => {
    // 1. Check if token in localStorage
    const stored = localStorage.getItem('ecotrack_auth');
    
    if (stored) {
      try {
        const { token } = JSON.parse(stored);
        
        // 2. Add to every request header
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          // Header becomes: "Authorization: Bearer eyJ..."
        }
      } catch { /* ignore */ }
    }
    
    return config;
  }
);


API GATEWAY (Port 8090)
═════════════════════════════════════════════════════════════════════
Request arrives: PUT /api/v1/users/update-profile
Header: Authorization: Bearer eyJ...

Note: API Gateway has JwtAuthenticationFilter for itself
(Different from IAM service's JwtAuthFilter)

GatewayConfig routes to iam-service


IAM SERVICE - JwtAuthFilter (Port 8081)
═════════════════════════════════════════════════════════════════════
// Backend - iam-service/security/JwtAuthFilter.java

@Override
protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
) throws ServletException, IOException {
  
  try {
    // 1. Extract Authorization header
    String authHeader = request.getHeader("Authorization");
    String jwt;
    String userEmail;
    
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      // No token provided
      filterChain.doFilter(request, response);
      return;  // Continue (might be public endpoint)
    }
    
    // 2. Extract token from "Bearer <token>"
    jwt = authHeader.substring(7);
    // jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    
    // 3. Extract email from token
    userEmail = jwtUtil.extractUsername(jwt);
    // userEmail = "john@example.com"
    
    // 4. Load user details
    UserDetails userDetails = userDetailsService
        .loadUserByUsername(userEmail);
    // Query: SELECT * FROM users WHERE email = 'john@...'
    // Returns: org.springframework.security.User
    //   with username, password, authorities
    
    // 5. Validate token
    if (jwtUtil.isTokenValid(jwt, userDetails)) {
      // Checks:
      // ├─ Signature verification (HMAC_SHA256)
      // ├─ Expiration check (exp < now?)
      // ├─ Username match (sub == userDetails.username)
      // └─ All pass ✓
      
      // 6. Create authentication object
      UsernamePasswordAuthenticationToken authentication =
          new UsernamePasswordAuthenticationToken(
            userDetails,           // Principal
            null,                  // Credentials (null for token)
            userDetails.getAuthorities()  // [ROLE_CITIZEN]
          );
      
      // 7. Set authentication in SecurityContext
      SecurityContextHolder
          .getContext()
          .setAuthentication(authentication);
      // Now Spring Security knows: THIS IS AUTHENTICATED USER
    }
    
    // 8. Continue filter chain with auth set
    filterChain.doFilter(request, response);
    
  } catch (Exception e) {
    // Token validation failed
    response.sendError(
      HttpServletResponse.SC_UNAUTHORIZED,
      "JWT validation failed"
    );
    // Returns 401 Unauthorized
  }
}


UserController RECEIVES AUTHENTICATED REQUEST
═════════════════════════════════════════════════════════════════════
// Backend - Controller

@PutMapping("/update-profile")
@PreAuthorize("hasAnyAuthority('ROLE_CITIZEN', 'ROLE_ADMINISTRATOR')")
public ResponseEntity<UserResponse> updateProfile(
    @Valid @RequestBody UpdateProfileRequest request,
    Principal principal  // ← Spring injects authenticated user
) {
  String email = principal.getName();  // "john@example.com"
  
  // Verify user is updating their own profile
  // Return updated user info
  // ...
}


@PreAuthorize ANNOTATION
═════════════════════════════════════════════════════════════════════
What it does:
├─ Before method execution
├─ Check if user has required authorities
├─ @PreAuthorize("hasAnyAuthority('ROLE_CITIZEN')")
│  └─ Only allow users with ROLE_CITIZEN authority
└─ If no match → Throw AccessDeniedException → 403 Forbidden

Check Flow:
1. JwtAuthFilter set SecurityContext ✓
2. Method interceptor reads SecurityContext
3. Check: Does user have required authority?
   if (authorities.contains("ROLE_CITIZEN")) {
     ✅ ALLOW → Execute method
   } else {
     ❌ DENY → Throw AccessDeniedException → 403
   }


RESPONSE INTERCEPTOR - 401 HANDLING
═════════════════════════════════════════════════════════════════════
// Frontend - axiosInstance.js

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      
      // Special case: /auth/login or /auth/register
      // These are public endpoints returning 401 for wrong credentials
      if (url.includes('/auth/')) {
        return Promise.reject(error);
        // Let page handle the error message
      }
      
      // Any other 401: Session expired
      localStorage.removeItem('ecotrack_auth');
      toast.error('Session expired. Please sign in again.');
      window.location.href = '/';
      // Bounce to home (user must re-login)
    }
    
    return Promise.reject(error);
  }
);


FINAL RESULT
═════════════════════════════════════════════════════════════════════
✅ Token valid & user authenticated
└─ UserController method executes
   └─ Can access user's email, ID, role
   └─ Updates profile in database
   └─ Returns 200 OK with updated data

❌ Token missing/invalid/expired
└─ JwtAuthFilter catches
└─ Returns 401 Unauthorized
└─ axiosInstance interceptor catches
└─ Clears localStorage
└─ Redirects to login page
```

---

## 📊 Database State After Register & Login

```
BEFORE:
═════════════════════════════════════════════════════════════════════
users table: EMPTY


AFTER REGISTER (john@example.com / SecurePass@123):
═════════════════════════════════════════════════════════════════════
user_id │ name      │ email                │ password                  │ phone       │ role    │ status │ created_at          │ updated_at
────────┼───────────┼──────────────────────┼───────────────────────────┼─────────────┼─────────┼────────┼─────────────────────┼──────────────────
1       │ John Doe  │ john@example.com     │ $2a$10$K1M2n3P4q5r6s...   │ 9876543210  │ CITIZEN │ ACTIVE │ 2026-05-08 10:15:30 │ 2026-05-08 10:15:30

Key points:
├─ user_id: Auto-generated by database
├─ password: BCrypt hash (NOT plaintext)
├─ role: Always CITIZEN for public registration
├─ status: ACTIVE by default
└─ created_at/updated_at: Auto-set by @PrePersist


AFTER LOGIN (same user):
═════════════════════════════════════════════════════════════════════
Database unchanged (login doesn't modify user_id table)
But if you were to add a login_log table:

login_log table:
log_id │ user_id │ login_timestamp     │ ip_address
───────┼─────────┼─────────────────────┼─────────────
1      │ 1       │ 2026-05-08 10:15:30 │ 127.0.0.1
2      │ 1       │ 2026-05-08 11:45:00 │ 127.0.0.1
  ...

(Not currently tracked in EcoTrack, but common pattern)


ADDITIONAL OPERATIONS:
═════════════════════════════════════════════════════════════════════
Register new user (jane@example.com):
└─ INSERT new row with user_id = 2, role = CITIZEN

Admin creates user (officer@example.com, AGENCY_OFFICER role):
└─ INSERT with user_id = 3, role = AGENCY_OFFICER

Update user profile:
└─ UPDATE users SET name = '...' WHERE user_id = 1

Change password:
└─ UPDATE users SET password = NEW_BCRYPT_HASH WHERE user_id = 1
  (Old password hash is overwritten)

Delete user:
└─ DELETE FROM users WHERE user_id = 1
  (Hard delete - user completely removed)
  (Or soft delete: UPDATE users SET status = DELETED)
```

---

## ✅ Summary Checklist

After both REGISTER and LOGIN complete, verify:

```
CLIENT STATE (localStorage)
  ☑ Token stored: localStorage['ecotrack_auth'].token
  ☑ User ID stored: localStorage['ecotrack_auth'].userId
  ☑ Email stored: localStorage['ecotrack_auth'].email
  ☑ Role stored: localStorage['ecotrack_auth'].role (CITIZEN)

REACT STATE (AuthContext)
  ☑ isAuthenticated === true
  ☑ user !== null
  ☑ token !== null

DATABASE (MySQL - users table)
  ☑ Row exists for john@example.com
  ☑ password is BCrypt hash (not plaintext)
  ☑ role = CITIZEN
  ☑ status = ACTIVE

JWT TOKEN (If decoded)
  ☑ Header has alg: HS256, typ: JWT
  ☑ Payload has sub: john@example.com
  ☑ Payload has role: CITIZEN
  ☑ Payload has userId: 1
  ☑ exp is 24 hours from now
  ☑ Signature is valid (matches recalculated HMAC)

FRONTEND - NEXT REQUEST
  ☑ Authorization header: Bearer <token>
  ☑ Token automatically injected by axiosInstance
  ☑ Token verified by backend JwtAuthFilter
  ☑ User can access protected endpoints
```

---

**Complete flow documented with visual ASCII diagrams!** 🎉


