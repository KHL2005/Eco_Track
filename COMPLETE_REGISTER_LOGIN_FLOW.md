# 🔐 Complete REGISTER & LOGIN Flow - EcoTrack Microservices

**Date:** May 8, 2026  
**Project:** EcoTrack (Environmental Monitoring & Sustainability Management System)  
**Scope:** Full end-to-end trace of Register and Login flows with detailed code references

---

## 📋 Table of Contents

1. [FLOW 1: REGISTER Button Click](#flow-1-register-button-click)
2. [FLOW 2: LOGIN Button Click](#flow-2-login-button-click)
3. [Common/Shared Infrastructure](#commonshared-infrastructure)
4. [Database Schema](#database-schema)
5. [Visual Flowcharts](#visual-flowcharts)
6. [Error Handling](#error-handling)
7. [Security Implementation](#security-implementation)

---

# FLOW 1: REGISTER Button CLICK

## 📱 FRONTEND (React.js - Vite)

### **File:** `Frontend/src/pages/RegisterPage.jsx`

#### **Component Overview**
```jsx
export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();  // ← AuthContext hook
  const navigate = useNavigate();
  // ...
}
```

#### **When User Fills Form & Clicks "Create Citizen Account" Button:**

**Step 1: Form Fields Collected**
```jsx
// State in RegisterPage
const [form, setForm] = useState({ 
  name: '',        // e.g., "John Doe"
  email: '',       // e.g., "john@example.com"
  phone: '',       // e.g., "9876543210"
  password: ''     // e.g., "SecurePass@123"
});
```

**Step 2: Client-Side Validation**
```jsx
const validate = () => {
  const e = {};
  // Validation rules (same as backend for better UX)
  if (!form.name || form.name.trim().length < 2) 
    e.name = 'Name is required (min 2 chars)';
  if (!form.email) 
    e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) 
    e.email = 'Invalid email format';
  if (!form.phone) 
    e.phone = 'Phone is required';
  else if (!/^\d{10}$/.test(form.phone)) 
    e.phone = 'Must be 10 digits';  // ← Exactly 10 digits
  if (!form.password)
    e.password = 'Password is required';
  else if (form.password.length < 8)
    e.password = 'Minimum 8 characters';
  
  setErrors(e);
  return Object.keys(e).length === 0;
};
```

**Step 3: Form Submission & API Call**
```jsx
const handleSubmit = async () => {
  setApiError('');
  if (!validate()) return;  // Don't proceed if validation fails
  
  setLoading(true);
  try {
    // Call API
    const { data } = await registerApi(form);  // ← Calls authApi.js
    
    // Update AuthContext with response
    login(data);  // ← Stores token & user info
    
    // Redirect to dashboard
    navigate('/dashboard', { replace: true });
  } catch (err) {
    // Handle error
    const msg = err.response?.data?.message || 
                err.response?.data?.error || 
                'Registration failed. Please try again.';
    setApiError(msg);
  } finally {
    setLoading(false);
  }
};
```

#### **Button Click Handler**
```jsx
<button onClick={handleSubmit} disabled={loading}
  className="w-full py-3.5 rounded-xl bg-forest-600 ...">
  {loading && <svg className="animate-spin ..."></svg>}
  {loading ? 'Creating account…' : 'Create Citizen Account'}
</button>
```

---

### **File:** `Frontend/src/api/authApi.js`

#### **API Call Function**
```javascript
export const registerApi = (data) =>
  axiosInstance.post('/auth/register', data);
  
// Equivalent to:
// POST http://localhost:3000/api/v1/auth/register
// (Proxied to http://localhost:8090/api/v1/auth/register)
```

#### **Request Payload Sent**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePass@123"
}
```

---

### **File:** `Frontend/src/api/axiosInstance.js`

#### **HTTP Client Configuration**
```javascript
const axiosInstance = axios.create({
  baseURL: '/api/v1',  // ← Proxied by Vite to http://localhost:8090/api/v1
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});
```

#### **Request Interceptor**
```javascript
axiosInstance.interceptors.request.use(
  (config) => {
    // For register/login, NO token yet
    // Token attachment happens AFTER login
    return config;
  },
  (error) => Promise.reject(error)
);
```

#### **Response Interceptor**
```javascript
axiosInstance.interceptors.response.use(
  (response) => response,  // ✅ 201 Created — return as-is
  (error) => {
    if (error.response?.status === 401) {
      // For /auth/login or /auth/register: keep local error handling
      if (url.includes('/auth/')) {
        return Promise.reject(error);  // ← Page handles error
      }
    }
    return Promise.reject(error);
  }
);
```

---

### **File:** `Frontend/src/context/AuthContext.jsx`

#### **AuthContext - login() Function**
```jsx
const login = useCallback((data) => {
  // data = { token, userId, email, role, name }
  
  const { token, userId, email, role, name } = data;
  
  // Update React state
  setToken(token);
  setUser({ userId, email, role, name });
  
  // Persist to localStorage
  localStorage.setItem('ecotrack_auth', JSON.stringify({ 
    token, userId, email, role, name 
  }));
}, []);
```

#### **Data Structure Stored in localStorage**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
  "userId": 1,
  "email": "john@example.com",
  "role": "CITIZEN",
  "name": "John Doe"
}
```

---

### **Vite.js Dev Server Proxy**

**File:** `Frontend/vite.config.js`
```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8090',  // ← API Gateway
        changeOrigin: true,
      },
    },
  },
})
```

**When browser makes:**
```
POST http://localhost:3000/api/v1/auth/register
        ↓
Vite proxy redirects to:
POST http://localhost:8090/api/v1/auth/register
```

---

## 🚪 API GATEWAY (Spring Cloud Gateway)

### **File:** `Backend/api-gateway/src/main/resources/application.yml`

**Port:** 8090

### **File:** `Backend/api-gateway/src/main/java/com/ecotrack/gateway/config/GatewayConfig.java`

#### **Route Definition for Register Endpoint**
```java
@Bean
public RouteLocator routeLocator(RouteLocatorBuilder builder) {
  return builder.routes()
    .route("iam-auth",  // Route ID
        r -> r.path("/api/v1/auth/**")  // ← Matches /auth/register
              .filters(f -> applyFilters(f, "iamCB", "/fallback/iam"))
              .uri("lb://iam-service"))  // ← Load balances to iam-service
    .build();
}
```

#### **Route Processing (Register)**

```
┌─────────────────────────────────────────────────────────────┐
│ API Gateway (Port 8090)                                     │
│                                                             │
│ Incoming:                                                   │
│ POST /api/v1/auth/register                                 │
│ { name, email, phone, password }                           │
│ (No JWT token - public endpoint)                           │
│                                                             │
│ 1. RequestRateLimiter                                      │
│    ├─ Extract IP from request remote address              │
│    ├─ Check token bucket (20 req/s sustained, 40 burst)   │
│    └─ Allow → Continue (rate limit OK)                    │
│                                                             │
│ 2. CircuitBreaker (iamCB)                                  │
│    ├─ Check if iam-service is healthy                     │
│    ├─ Status: CLOSED (service is up)                      │
│    └─ Allow → Continue                                     │
│                                                             │
│ 3. Retry Filter                                            │
│    ├─ Only for GET requests                               │
│    ├─ POST register → No retry                            │
│    └─ Continue to iam-service                             │
│                                                             │
│ 4. URI Transformation                                      │
│    ├─ lb://iam-service → Service discovery (Eureka)      │
│    ├─ Find instance of iam-service                        │
│    ├─ Load balance → http://localhost:8081                │
│    └─ Forward request: POST http://localhost:8081/...    │
└─────────────────────────────────────────────────────────────┘
```

#### **Key Filter Applied: applyFilters()**
```java
private GatewayFilterSpec applyFilters(GatewayFilterSpec f, String cbName, String fallbackUri) {
  return f
    // 1. Rate Limiter (checked first)
    .requestRateLimiter(c -> c
        .setRateLimiter(redisRateLimiter())  // ← Redis token bucket
        .setKeyResolver(ipKeyResolver()))    // ← IP-based key

    // 2. Circuit Breaker
    .circuitBreaker(c -> c
        .setName(cbName)  // "iamCB"
        .setFallbackUri(fallbackUri)  // "/fallback/iam"
        .setStatusCodes(Set.of("500", "502", "503", "504")))

    // 3. Retry (GET only)
    .retry(c -> c
        .setRetries(RETRY_COUNT)  // 2 retries max (3 total calls)
        .setStatuses(HttpStatus.BAD_GATEWAY, HttpStatus.SERVICE_UNAVAILABLE, ...)
        .setMethods(HttpMethod.GET));  // ← POST NOT retried
}
```

---

## 🛡️ IAM SERVICE (Spring Boot - Port 8081)

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/controller/AuthController.java`

#### **Register Endpoint**
```java
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
  
  private final AuthService authService;

  @PostMapping("/register")
  @Operation(summary = "Register a new user")
  public ResponseEntity<AuthResponse> register(
      @Valid @RequestBody RegisterRequest request
  ) {
    // ✅ @Valid triggers validation of RegisterRequest
    return ResponseEntity
      .status(HttpStatus.CREATED)  // 201 Created
      .body(authService.register(request));
  }
}
```

#### **Note on @Valid:** 
```
@Valid annotation causes Spring to:
1. Create validator for RegisterRequest
2. Check all @constraints on fields
3. If any validation fails → MethodArgumentNotValidException
4. GlobalExceptionHandler catches → returns 400 with field errors
```

---

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/dto/RegisterRequest.java`

#### **Request DTO with Full Validation**
```java
@Data
public class RegisterRequest {
  
  @NotBlank(message = "Name is required")
  @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
  @Pattern(regexp = "^[a-zA-Z\\s'-]+$", 
           message = "Name must contain only letters, spaces, hyphens, or apostrophes")
  private String name;

  @NotBlank(message = "Email is required")
  @Email(message = "Please provide a valid email address")
  @Size(max = 100, message = "Email must not exceed 100 characters")
  private String email;

  @NotBlank(message = "Password is required")
  @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
  @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$",
           message = "Password must have min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character")
  private String password;

  @Pattern(regexp = "^[+]?[0-9]{10}$", 
           message = "Phone number must be exactly 10 digits")
  private String phone;

  // Role is ignored on public registration — always defaults to CITIZEN
  private UserRole role;
}
```

#### **Validation Flow (if invalid data sent)**
```
RegisterRequest validation fails (e.g., name = "John123")
  ↓
@NotValid catches violation
  ↓
MethodArgumentNotValidException thrown
  ↓
GlobalExceptionHandler.handleValidation() catches
  ↓
Returns 400 Bad Request with field errors:
{
  "error": "Validation Failed",
  "messages": {
    "name": "Name must contain only letters, spaces, hyphens, or apostrophes"
  },
  "status": 400,
  "timestamp": "2026-05-08T10:15:30"
}
```

---

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/service/AuthService.java`

#### **register() Method Execution**
```java
@Transactional  // ← Single atomic transaction for this method
public AuthResponse register(RegisterRequest request) {
  
  // STEP 1: Check for duplicate email
  if (userRepository.existsByEmail(request.getEmail())) {
    throw new DuplicateResourceException(
      "Email already registered: " + request.getEmail()
    );
    // ✅ Returns 409 Conflict
  }

  // STEP 2: Create User entity (NOT persisted yet)
  User user = User.builder()
    .name(request.getName())              // "John Doe"
    .email(request.getEmail())            // "john@example.com"
    .password(passwordEncoder.encode(     // ← BCrypt hash
      request.getPassword()               //   SecurePass@123 → $2a$10$K...
    ))
    .phone(request.getPhone())            // "9876543210"
    .role(UserRole.CITIZEN)               // ← Always CITIZEN on public register
    .status(UserStatus.ACTIVE)            // ← Default to ACTIVE
    .build();

  // STEP 3: Persist user to database
  userRepository.save(user);  // INSERT into users table
  
  // STEP 4: Build UserDetails for JWT generation
  UserDetails userDetails = buildUserDetails(user);
  // buildUserDetails() returns:
  // new User(
  //   email="john@example.com",
  //   password="$2a$10$K...",
  //   authorities=[SimpleGrantedAuthority("ROLE_CITIZEN")]
  // )

  // STEP 5: Generate JWT token
  String token = jwtUtil.generateToken(userDetails, Map.of(
    "role", user.getRole().name(),     // "CITIZEN"
    "userId", user.getUserId()         // 1 (auto-generated ID)
  ));
  
  // Token structure (JWT):
  // Header.Payload.Signature
  // {
  //   "alg": "HS256",
  //   "typ": "JWT"
  // }.{
  //   "sub": "john@example.com",
  //   "role": "CITIZEN",
  //   "userId": 1,
  //   "iat": 1715134800,
  //   "exp": 1715221200  (24 hours later)
  // }.HMAC-SHA256(secret)

  // STEP 6: Build response
  return AuthResponse.builder()
    .token(token)              // JWT token
    .email(user.getEmail())    // "john@example.com"
    .role(user.getRole().name()) // "CITIZEN"
    .name(user.getName())      // "John Doe"
    .userId(user.getUserId())  // 1
    .build();
}
```

---

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/security/JwtUtil.java`

#### **JWT Generation Process**
```java
public String generateToken(UserDetails userDetails, Map<String, Object> extraClaims) {
  return buildToken(extraClaims, userDetails.getUsername());
}

private String buildToken(Map<String, Object> extraClaims, String subject) {
  return Jwts.builder()
    .claims(extraClaims)  // { "role": "CITIZEN", "userId": 1 }
    .subject(subject)     // "john@example.com"
    .issuedAt(new Date(System.currentTimeMillis()))
    .expiration(new Date(System.currentTimeMillis() + expiration))  // +24h
    .signWith(getSigningKey())  // HMAC-SHA256 with secret key
    .compact();  // ← Returns signed JWT string
}

private SecretKey getSigningKey() {
  // Secret from application.yml:
  // jwt.secret = 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  byte[] keyBytes = hexStringToByteArray(secret);
  return Keys.hmacShaKeyFor(keyBytes);
}
```

---

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/entity/User.java`

#### **User Entity (Persisted to Database)**
```java
@Entity
@Table(name = "users")
public class User {
  
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "user_id")
  private Long userId;  // ← Auto-generated by DB (1, 2, 3, ...)

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, unique = true, length = 100)
  private String email;  // ← UNIQUE constraint

  @Column(nullable = false)
  private String password;  // ← BCrypt hash

  @Column(length = 20)
  private String phone;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private UserRole role;  // ← Stored as VARCHAR in DB

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private UserStatus status = UserStatus.ACTIVE;

  @Column(name = "created_at")
  private LocalDateTime createdAt;  // ← Auto-set on insert

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;  // ← Auto-set on insert

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }
}
```

---

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/repository/UserRepository.java`

#### **Repository Interface (Data Access)**
```java
public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);
  boolean existsByEmail(String email);  // ← Used for duplicate check
  List<User> findByRole(UserRole role);
}
```

#### **What Happens During userRepository.save(user)**
```
1. JPA/Hibernate detects this is a NEW entity (no ID set)
2. Generates INSERT SQL:
   INSERT INTO users (name, email, password, phone, role, status, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
3. Executes against MySQL database
4. Returns user with auto-generated userId populated (e.g., 1)
5. @PrePersist hook already set created_at and updated_at
```

---

## 📨 RESPONSE RETURNED

```json
HTTP 201 Created

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6IkNJVElaRU4iLCJ1c2VySWQiOjEsImlhdCI6MTcxNTEzNDgwMCwiZXhwIjoxNzE1MjIxMjAwfQ.xyz...",
  "userId": 1,
  "email": "john@example.com",
  "role": "CITIZEN",
  "name": "John Doe"
}
```

---

## 🔄 BROWSER RECEIVES & PROCESSES RESPONSE

### **Frontend - authApi.js returns:**
```javascript
// registerApi() resolved with 201 Created response
const { data } = await registerApi(form);
// data = {
//   token: "eyJ...",
//   userId: 1,
//   email: "john@example.com",
//   role: "CITIZEN",
//   name: "John Doe"
// }
```

### **Frontend - AuthContext login() stores:**
```jsx
login(data);  // Calls:
// 1. setToken(token) → React state
// 2. setUser({ userId, email, role, name }) → React state
// 3. localStorage.setItem('ecotrack_auth', JSON.stringify({...})) → Browser storage
```

### **Frontend - Navigation:**
```jsx
navigate('/dashboard', { replace: true });
// ✅ User redirected to dashboard (now AUTHENTICATED)
```

---

---

# FLOW 2: LOGIN BUTTON CLICK

## 📱 FRONTEND (React.js)

### **File:** `Frontend/src/pages/LoginPage.jsx`

#### **Component Setup**
```jsx
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();  // ← From AuthContext
  const navigate = useNavigate();
}
```

#### **When User Fills Email/Password & Clicks "Sign In" Button:**

**Step 1: Client-Side Validation**
```jsx
const validate = () => {
  const e = {};
  if (!email) 
    e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    e.email = 'Invalid email format';
  
  if (!password) 
    e.password = 'Password is required';
  else if (password.length < 8)
    e.password = 'Minimum 8 characters';
  
  setErrors(e);
  return Object.keys(e).length === 0;
};
```

**Step 2: Form Submission**
```jsx
const handleSubmit = async () => {
  setApiError('');
  if (!validate()) return;
  
  setLoading(true);
  try {
    // CALL API
    const { data } = await loginApi(email, password);
    
    // STORE IN CONTEXT
    login(data);
    
    // REDIRECT
    navigate('/dashboard', { replace: true });
  } catch (err) {
    // ERROR HANDLING
    const msg = err.response?.data?.message || 
                err.response?.data?.error || 
                'Login failed. Please try again.';
    setApiError(msg);
    
    // Clear password field for security
    setEmail('');
    setPassword('');
  } finally {
    setLoading(false);
  }
};
```

---

### **File:** `Frontend/src/api/authApi.js`

#### **Login API Call**
```javascript
export const loginApi = (email, password) =>
  axiosInstance.post('/auth/login', { email, password });
  
// Request:
// POST http://localhost:8090/api/v1/auth/login
// {
//   "email": "john@example.com",
//   "password": "SecurePass@123"
// }
```

---

### **Vite Proxy & axiosInstance - Same as Register**

Request goes through same proxy and interceptor chain as registration.

---

## 🚪 API GATEWAY (Same Route)

The login request matches the same route `iam-auth`:
```java
.route("iam-auth",
    r -> r.path("/api/v1/auth/**")  // ← Matches /auth/login
          .filters(f -> applyFilters(f, "iamCB", "/fallback/iam"))
          .uri("lb://iam-service"))
```

Applies same filters:
```
Rate Limiter → Check IP bucket → Allow
       ↓
Circuit Breaker → Check iam-service health → CLOSED (allow)
       ↓
Retry → Only for GET (login is POST) → No retry
       ↓
Forward to iam-service:8081
```

---

## 🛡️ IAM SERVICE - LOGIN ENDPOINT

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/controller/AuthController.java`

#### **Login Endpoint**
```java
@PostMapping("/login")
@Operation(summary = "Login with email and password")
public ResponseEntity<AuthResponse> login(
    @Valid @RequestBody LoginRequest request
) {
  return ResponseEntity.ok(authService.login(request));
}
```

---

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/dto/LoginRequest.java`

#### **Login Request DTO**
```java
@Data
public class LoginRequest {
  
  @NotBlank(message = "Email is required")
  @Email(message = "Please provide a valid email address")
  @Size(max = 100, message = "Email must not exceed 100 characters")
  private String email;

  @NotBlank(message = "Password is required")
  @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
  private String password;
}
```

---

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/service/AuthService.java`

#### **login() Method Execution**

```java
public AuthResponse login(LoginRequest request) {
  
  // STEP 1: Authenticate with password verification
  authenticationManager.authenticate(
    new UsernamePasswordAuthenticationToken(
      request.getEmail(),      // "john@example.com"
      request.getPassword()    // "SecurePass@123"
    )
  );
  // This calls UserDetailsServiceImpl.loadUserByUsername()
  // which queries the database for the user
  // If successful, Spring Security verifies password using BCryptPasswordEncoder
  // Throws BadCredentialsException if password doesn't match

  // STEP 2: Load user from database
  User user = userRepository.findByEmail(request.getEmail())
    .orElseThrow(() -> new BadRequestException("User not found"));

  // STEP 3: Check account status
  if (user.getStatus() == UserStatus.SUSPENDED || 
      user.getStatus() == UserStatus.INACTIVE) {
    throw new BadRequestException(
      "Account is " + user.getStatus().name().toLowerCase()
    );
    // ✅ Returns 400 Bad Request
  }

  // STEP 4: Build UserDetails
  UserDetails userDetails = buildUserDetails(user);
  // Returns: new User(
  //   email="john@example.com",
  //   password="$2a$10$K...",  (hashed)
  //   authorities=[SimpleGrantedAuthority("ROLE_CITIZEN")]
  // )

  // STEP 5: Generate JWT token
  String token = jwtUtil.generateToken(userDetails, Map.of(
    "role", user.getRole().name(),
    "userId", user.getUserId()
  ));

  // STEP 6: Build and return response
  return AuthResponse.builder()
    .token(token)
    .email(user.getEmail())
    .role(user.getRole().name())
    .name(user.getName())
    .userId(user.getUserId())
    .build();
}

private UserDetails buildUserDetails(User user) {
  return new org.springframework.security.core.userdetails.User(
    user.getEmail(),
    user.getPassword(),
    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
  );
}
```

#### **Password Verification Details**

```
User enters password: "SecurePass@123"
                ↓
Sent in request body to backend
                ↓
authenticationManager.authenticate() called
                ↓
AuthenticationManager delegates to DaoAuthenticationProvider
                ↓
DaoAuthenticationProvider calls UserDetailsServiceImpl.loadUserByUsername()
                ↓
UserDetailsServiceImpl queries db: SELECT * FROM users WHERE email = 'john@example.com'
                ↓
Finds User entity with password hash: "$2a$10$K1M2n3..."
                ↓
DaoAuthenticationProvider calls passwordEncoder.matches():
    passwordEncoder.matches("SecurePass@123", "$2a$10$K1M2n3...")
                ↓
BCryptPasswordEncoder verifies:
    - Extract salt from hash
    - Hash the entered password with salt
    - Compare with stored hash
                ↓
✅ MATCH → Authentication succeeds
❌ NO MATCH → Throws BadCredentialsException → 401 Unauthorized
```

---

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/security/UserDetailsServiceImpl.java`

#### **User Details Loading (used by Spring Security)**
```java
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
  
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    // username = email in this system
    User user = userRepository.findByEmail(username)
      .orElseThrow(() -> new UsernameNotFoundException("User not found"));

    return org.springframework.security.core.userdetails.User.builder()
      .username(user.getEmail())
      .password(user.getPassword())  // ← Hashed password
      .authorities("ROLE_" + user.getRole().name())
      .accountNonExpired(true)
      .accountNonLocked(true)
      .credentialsNonExpired(true)
      .enabled(user.getStatus() == UserStatus.ACTIVE)
      .build();
  }
}
```

---

## 📨 LOGIN RESPONSE RETURNED

```json
HTTP 200 OK

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6IkNJVElaRU4iLCJ1c2VySWQiOjEsImlhdCI6MTcxNTEzNDgwMCwiZXhwIjoxNzE1MjIxMjAwfQ.xyz...",
  "userId": 1,
  "email": "john@example.com",
  "role": "CITIZEN",
  "name": "John Doe"
}
```

---

## 🔄 BROWSER RECEIVES & PROCESSES RESPONSE

```jsx
const { data } = await loginApi(email, password);
// data = AuthResponse { token, userId, email, role, name }

login(data);
// Stores in AuthContext + localStorage

navigate('/dashboard', { replace: true });
// ✅ User is now authenticated and on dashboard
```

---

---

# COMMON/SHARED INFRASTRUCTURE

## 🔐 Security Configuration

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/config/SecurityConfig.java`

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) 
      throws Exception {
    http
      .csrf(csrf -> csrf.disable())  // Stateless API
      .httpBasic(Customizer.withDefaults())
      .sessionManagement(session -> 
        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      )
      .authorizeHttpRequests(auth -> auth
        // Public endpoints (no auth required)
        .requestMatchers("/api/v1/auth/**").permitAll()
        .requestMatchers("/v3/api-docs/**").permitAll()
        .requestMatchers("/swagger-ui/**").permitAll()
        .requestMatchers("/actuator/**").permitAll()
        // All other endpoints require authentication
        .anyRequest().authenticated()
      )
      .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    
    return http.build();
  }
}
```

---

### **File:** `Backend/iam-service/src/main/java/com/ecotrack/iam/security/JwtAuthFilter.java`

#### **JWT Filter for Authenticated Requests (After Login)**

```java
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
  
  private final JwtUtil jwtUtil;
  private final UserDetailsService userDetailsService;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    
    try {
      // STEP 1: Extract JWT from header
      final String authHeader = request.getHeader("Authorization");
      final String jwt;
      final String userEmail;
      
      if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        // No token → Continue (might be public endpoint like /auth/login)
        filterChain.doFilter(request, response);
        return;
      }
      
      // Extract token from "Bearer <token>"
      jwt = authHeader.substring(7);
      
      // STEP 2: Extract email from token
      userEmail = jwtUtil.extractUsername(jwt);
      
      // STEP 3: Load user details
      UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
      
      // STEP 4: Validate token
      if (jwtUtil.isTokenValid(jwt, userDetails)) {
        // STEP 5: Create authentication object
        UsernamePasswordAuthenticationToken authentication = 
          new UsernamePasswordAuthenticationToken(
            userDetails, null, userDetails.getAuthorities()
          );
        authentication.setDetails(
          new WebAuthenticationDetailsSource().buildDetails(request)
        );
        
        // STEP 6: Set authentication in SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
      
      // STEP 7: Continue filter chain
      filterChain.doFilter(request, response);
      
    } catch (Exception e) {
      // Token validation failed
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "JWT validation failed");
    }
  }
}
```

---

## 💾 DATABASE SCHEMA

### **MySQL Database: ecotrack_iam**

#### **Table: users**

```sql
CREATE TABLE users (
  user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,  -- Stores BCrypt hash
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL,       -- SUPER_ADMIN, ADMINISTRATOR, CITIZEN, etc.
  status VARCHAR(50) NOT NULL,     -- ACTIVE, SUSPENDED, INACTIVE
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
);
```

#### **Sample Row After Registration**

```sql
INSERT INTO users 
(user_id, name, email, password, phone, role, status, created_at, updated_at)
VALUES
(
  1,
  'John Doe',
  'john@example.com',
  '$2a$10$K1M2n3P4q5r6s7t8u9v0W.aB1CdE2fG3hI4jK5lM6nO7pQ8rS9t',  -- BCrypt hash
  '9876543210',
  'CITIZEN',
  'ACTIVE',
  '2026-05-08 10:15:30',
  '2026-05-08 10:15:30'
);
```

---

## 📊 JWT Token Structure

### **Example JWT Token (Decoded)**

```
Encoded:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6IkNJVElaRU4iLCJ1c2VySWQiOjEsImlhdCI6MTcxNTEzNDgwMCwiZXhwIjoxNzE1MjIxMjAwfQ.HmacSha256Signature...

Decoded Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Decoded Payload:
{
  "sub": "john@example.com",      -- user's email (subject)
  "role": "CITIZEN",               -- user's role (custom claim)
  "userId": 1,                     -- user's ID (custom claim)
  "iat": 1715134800,               -- issued at (timestamp)
  "exp": 1715221200                -- expires at (24 hours later)
}

Signature:
HMAC-SHA256(
  base64(header) + "." + base64(payload),
  secret_key_from_config
)
```

---

### **Configuration (From application.yml)**

```yaml
jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration: 86400000  # 24 hours in milliseconds
```

---

---

# VISUAL FLOWCHARTS

## 📈 REGISTER FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      BROWSER (React)                                     │
│                                                                          │
│  1. User fills RegisterPage form:                                        │
│     name = "John Doe"                                                    │
│     email = "john@example.com"                                           │
│     phone = "9876543210"                                                 │
│     password = "SecurePass@123"                                          │
│                                                                          │
│  2. Clicks "Create Citizen Account"                                      │
│     ↓                                                                     │
│  3. Client-side validation (JS regex)                                    │
│     ✅ All fields valid → Continue                                       │
│                                                                          │
│  4. setLoading(true) → Button shows spinner                              │
│                                                                          │
│  5. POST /api/v1/auth/register                                           │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               │ (Vite proxy: localhost:3000 → localhost:8090)
               ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Port 8090)                               │
│                                                                          │
│  POST /api/v1/auth/register                                              │
│  ├─ Route matcher: path = "/api/v1/auth/**" ✅ MATCH                     │
│  │   → route ID: "iam-auth"                                              │
│  │                                                                        │
│  ├─ Filter Chain Applied:                                                │
│  │  ├─ RequestRateLimiter                                                │
│  │  │  ├─ IP: 127.0.0.1 (localhost)                                     │
│  │  │  ├─ Token bucket check (Redis)                                    │
│  │  │  └─ ✅ Allow (20 req/s sustained)                                 │
│  │  │                                                                    │
│  │  ├─ CircuitBreaker (iamCB)                                            │
│  │  │  ├─ Status: CLOSED (iam-service is up)                            │
│  │  │  └─ ✅ Allow                                                       │
│  │  │                                                                    │
│  │  └─ Retry Filter                                                      │
│  │     ├─ Method: POST (non-idempotent)                                  │
│  │     └─ ✅ Skip retry (GET only)                                       │
│  │                                                                        │
│  └─ Service Discovery (Eureka)                                           │
│     ├─ URI: lb://iam-service                                             │
│     ├─ Query Eureka for iam-service instances                            │
│     └─ Load balance → http://localhost:8081                              │
│                                                                          │
│  Forward to: http://localhost:8081/api/v1/auth/register                  │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               │ (Request body: JSON with name, email, phone, password)
               ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    IAM SERVICE (Port 8081)                               │
│                                                                          │
│  POST /api/v1/auth/register                                              │
│  │                                                                        │
│  └─→ AuthController.register(@Valid RegisterRequest)                     │
│       │                                                                   │
│       ├─ @Valid annotation triggers validation                           │
│       │  ├─ name: @NotBlank ✓, @Size(2-50) ✓, @Pattern ✓               │
│       │  ├─ email: @NotBlank ✓, @Email ✓, @Size(100) ✓                 │
│       │  ├─ phone: @Pattern (10 digits) ✓                               │
│       │  └─ password: @NotBlank ✓, @Size(8-100) ✓, @Pattern ✓          │
│       │     (min 8, uppercase, lowercase, digit, special char)           │
│       │                                                                   │
│       └─→ AuthService.register(RegisterRequest request)                  │
│           │                                                              │
│           ├─ Check duplicate email                                       │
│           │  └─ userRepository.existsByEmail(request.getEmail())  ✓      │
│           │                                                              │
│           ├─ Create User entity                                          │
│           │  ├─ name: "John Doe"                                         │
│           │  ├─ email: "john@example.com"                                │
│           │  ├─ password: BCryptPasswordEncoder.encode("SecurePass@123") │
│           │  │            → "$2a$10$K1M2n3P4q5r6s7t8u9v0W..."           │
│           │  ├─ phone: "9876543210"                                      │
│           │  ├─ role: UserRole.CITIZEN  (always CITIZEN on public reg)   │
│           │  └─ status: UserStatus.ACTIVE                               │
│           │                                                              │
│           ├─ @Transactional: Begin transaction                           │
│           │                                                              │
│           ├─ Save user to database                                       │
│           │  └─ userRepository.save(user)                                │
│           │     ├─ INSERT INTO users (...)                               │
│           │     └─ DB returns with auto-generated userId = 1             │
│           │                                                              │
│           ├─ Generate JWT token                                          │
│           │  ├─ JwtUtil.generateToken(userDetails, claims)               │
│           │  └─ Jwts.builder()                                           │
│           │     ├─ .claims({"role": "CITIZEN", "userId": 1})             │
│           │     ├─ .subject("john@example.com")                          │
│           │     ├─ .issuedAt(now)                                        │
│           │     ├─ .expiration(now + 24h)                                │
│           │     ├─ .signWith(HS256, secret)                              │
│           │     └─ .compact() → "eyJ..."                                 │
│           │                                                              │
│           ├─ Build AuthResponse                                          │
│           │  ├─ token: "eyJ..."                                          │
│           │  ├─ userId: 1                                                │
│           │  ├─ email: "john@example.com"                                │
│           │  ├─ role: "CITIZEN"                                          │
│           │  └─ name: "John Doe"                                         │
│           │                                                              │
│           ├─ @Transactional: Commit transaction ✅                       │
│           │                                                              │
│           └─ Return AuthResponse                                         │
│                                                                          │
│  ResponseEntity.status(201).body(response)                               │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               │ HTTP 201 Created
               │ Content-Type: application/json
               │ {
               │   "token": "eyJ...",
               │   "userId": 1,
               │   "email": "john@example.com",
               │   "role": "CITIZEN",
               │   "name": "John Doe"
               │ }
               ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Port 8090)                               │
│                                                                          │
│  Response 201 passes back through gateway (no modification)              │
│  No errors, circuit breaker records success                              │
│                                                                          │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               │ (Proxied back to Vite)
               ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      BROWSER (React)                                     │
│                                                                          │
│  Response received (201 Created)                                         │
│  │                                                                        │
│  ├─ No errors in interceptor (not 401)                                   │
│  │                                                                        │
│  ├─ Extract AuthResponse from response.data                              │
│  │  └─ data = { token, userId, email, role, name }                      │
│  │                                                                        │
│  ├─ Call AuthContext.login(data)                                         │
│  │  ├─ setToken(token) → React state                                     │
│  │  ├─ setUser({ userId, email, role, name }) → React state             │
│  │  └─ localStorage.setItem('ecotrack_auth', JSON.stringify({...}))      │
│  │     → Persists in browser storage                                     │
│  │                                                                        │
│  ├─ setLoading(false) → Button stops spinner                             │
│  │                                                                        │
│  └─ navigate('/dashboard', { replace: true })                            │
│     ✅ USER AUTHENTICATED - REDIRECT IN PROGRESS                         │
│                                                                          │
│     Browser URL changes to: http://localhost:3000/dashboard              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📈 LOGIN FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      BROWSER (React)                                     │
│                                                                          │
│  1. User fills LoginPage form:                                           │
│     email = "john@example.com"                                           │
│     password = "SecurePass@123"                                          │
│                                                                          │
│  2. Clicks "Sign In" button or presses Enter                             │
│                                                                          │
│  3. Client-side validation (JS regex)                                    │
│     ✅ All fields valid → Continue                                       │
│                                                                          │
│  4. setLoading(true) → Button shows spinner                              │
│                                                                          │
│  5. POST /api/v1/auth/login                                              │
│     Body: { email, password }                                            │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               │ (Vite proxy: localhost:3000 → localhost:8090)
               ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Port 8090)                               │
│                                                                          │
│  POST /api/v1/auth/login                                                 │
│  ├─ Route matcher: path = "/api/v1/auth/**" ✅ MATCH                     │
│  ├─ Apply filters: RequestRateLimiter → CircuitBreaker → Retry           │
│  └─ Forward to iam-service:8081                                          │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    IAM SERVICE (Port 8081)                               │
│                                                                          │
│  POST /api/v1/auth/login                                                 │
│  │                                                                        │
│  └─→ AuthController.login(@Valid LoginRequest request)                   │
│       │                                                                   │
│       ├─ @Valid annotation triggers validation                           │
│       │  ├─ email: @Email ✓                                              │
│       │  └─ password: @Size(8-100) ✓                                     │
│       │                                                                   │
│       └─→ AuthService.login(LoginRequest request)                        │
│           │                                                              │
│           ├─ STEP 1: Authenticate password                               │
│           │  │                                                            │
│           │  └─ authenticationManager.authenticate(                       │
│           │      new UsernamePasswordAuthenticationToken(                 │
│           │        "john@example.com",                                    │
│           │        "SecurePass@123"                                       │
│           │      )                                                        │
│           │    )                                                          │
│           │    │                                                          │
│           │    ├─ DaoAuthenticationProvider delegates to:                 │
│           │    │  UserDetailsServiceImpl.loadUserByUsername(email)         │
│           │    │                                                          │
│           │    ├─ UserDetailsServiceImpl queries database:                 │
│           │    │  SELECT * FROM users WHERE email = 'john@example.com'    │
│           │    │  ├─ Finds User record                                    │
│           │    │  ├─ password: "$2a$10$K1M2n3P4q5r6s7t8u9v0W..."          │
│           │    │  └─ Builds UserDetails with password                     │
│           │    │                                                          │
│           │    └─ PasswordEncoder.matches() verifies:                     │
│           │       ├─ Input: "SecurePass@123"                              │
│           │       ├─ Hash from DB: "$2a$10$K1M2n3..."                     │
│           │       ├─ BCrypt extracts salt from hash                       │
│           │       ├─ BCrypt hashes input with salt                        │
│           │       ├─ Compares hashes                                      │
│           │       ├─ ✅ MATCH                                             │
│           │       └─ Authentication succeeds ✓                            │
│           │                                                              │
│           ├─ STEP 2: Load user from DB                                   │
│           │  └─ userRepository.findByEmail("john@example.com")            │
│           │     ├─ Query: SELECT * FROM users WHERE email = ...           │
│           │     └─ Returns: User(userId=1, name="John Doe", ...)          │
│           │                                                              │
│           ├─ STEP 3: Check account status                                │
│           │  ├─ user.status = UserStatus.ACTIVE ✓                        │
│           │  └─ Not SUSPENDED or INACTIVE → Continue                    │
│           │                                                              │
│           ├─ STEP 4: Build UserDetails                                   │
│           │  └─ User(                                                     │
│           │      username = "john@example.com",                           │
│           │      password = "$2a$10$K...",                                │
│           │      authorities = ["ROLE_CITIZEN"]                           │
│           │    )                                                          │
│           │                                                              │
│           ├─ STEP 5: Generate JWT token                                  │
│           │  ├─ JwtUtil.generateToken(userDetails, extraClaims)           │
│           │  └─ Token header.payload.signature:                           │
│           │     {                                                         │
│           │       "alg": "HS256",                                         │
│           │       "typ": "JWT"                                            │
│           │     }.{                                                       │
│           │       "sub": "john@example.com",                              │
│           │       "role": "CITIZEN",                                      │
│           │       "userId": 1,                                            │
│           │       "iat": 1715134800,                                      │
│           │       "exp": 1715221200  (24h later)                          │
│           │     }.HMAC-SHA256(...)                                        │
│           │                                                              │
│           ├─ STEP 6: Build AuthResponse                                  │
│           │  ├─ token: "eyJ..."                                           │
│           │  ├─ userId: 1                                                 │
│           │  ├─ email: "john@example.com"                                 │
│           │  ├─ role: "CITIZEN"                                           │
│           │  └─ name: "John Doe"                                          │
│           │                                                              │
│           └─ Return AuthResponse                                         │
│                                                                          │
│  ResponseEntity.ok(response)  [200 OK]                                   │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               │ HTTP 200 OK
               │ {
               │   "token": "eyJ...",
               │   "userId": 1,
               │   "email": "john@example.com",
               │   "role": "CITIZEN",
               │   "name": "John Doe"
               │ }
               ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY                                           │
│  Response 200 passes back through gateway                                │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      BROWSER (React)                                     │
│                                                                          │
│  Response received (200 OK)                                              │
│  │                                                                        │
│  ├─ Interceptor: Not 401 → Continue                                      │
│  │                                                                        │
│  ├─ Extract data = { token, userId, email, role, name }                  │
│  │                                                                        │
│  ├─ Call login(data) from AuthContext                                    │
│  │  ├─ setToken(token)                                                   │
│  │  ├─ setUser({ userId, email, role, name })                            │
│  │  └─ localStorage.setItem('ecotrack_auth', JSON.stringify({...}))      │
│  │                                                                        │
│  ├─ setLoading(false)                                                    │
│  │                                                                        │
│  └─ navigate('/dashboard', { replace: true })                            │
│     ✅ USER AUTHENTICATED - REDIRECT TO DASHBOARD                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

# ERROR HANDLING

## ❌ Registration Errors

### **1. Client-Side Validation Failure**

```
Invalid name "John123"
  ↓
validate() regex fails
  ↓
errors.name = "Name must contain only letters..."
  ↓
Form doesn't submit
  ↓
Show error under name field (red text)
```

### **2. Duplicate Email**

```
Backend receives email "john@example.com" (already exists)
  ↓
userRepository.existsByEmail() → true
  ↓
Throws DuplicateResourceException
  ↓
GlobalExceptionHandler catches
  ↓
Returns 409 Conflict
{
  "error": "Email already registered: john@example.com",
  "status": 409,
  "timestamp": "2026-05-08T10:15:30"
}
  ↓
Frontend showsapiError toast
```

### **3. Weak Password**

```
@Pattern validation fails on password
  ↓
MethodArgumentNotValidException
  ↓
GlobalExceptionHandler returns 400
{
  "error": "Validation Failed",
  "messages": {
    "password": "Password must have min 8 chars, ..."
  },
  "status": 400
}
```

---

## ❌ Login Errors

### **1. User Not Found**

```
Email "notfound@example.com"
  ↓
AuthenticationManager tries to authenticate
  ↓
UserDetailsServiceImpl.loadUserByUsername() called
  ↓
userRepository.findByEmail() → Optional.empty()
  ↓
Throws UsernameNotFoundException
  ↓
Spring Security catches → BadCredentialsException
  ↓
Returns 401 Unauthorized
```

### **2. Wrong Password**

```
Email: "john@example.com"
Password: "WrongPassword"
  ↓
DaoAuthenticationProvider loads user from DB
  ↓
passwordEncoder.matches("WrongPassword", "$2a$10$K...") → false
  ↓
Throws BadCredentialsException
  ↓
Returns 401 Unauthorized
{
  "error": "Unauthorized",
  "message": "Bad credentials",
  "status": 401
}
```

### **3. Account Suspended**

```
User found with email "john@example.com"
  ↓
Password matches ✓
  ↓
Check status: user.getStatus() == SUSPENDED
  ↓
Throws BadRequestException("Account is suspended")
  ↓
Returns 400 Bad Request
```

---

# SECURITY IMPLEMENTATION

## 🔐 Password Security

### **Registration Password Flow**

```
User enters: "SecurePass@123"
  ↓
@Pattern validation checks:
  ✓ 8+ characters
  ✓ Contains uppercase (S, P)
  ✓ Contains lowercase (e, c, u, r, a, s, s,...)
  ✓ Contains digit (123)
  ✓ Contains special char (@)
  ✓ No whitespace
  ↓
PasswordEncoder (BCryptPasswordEncoder) called:
  ├─ Generate random salt
  ├─ Hash password with salt (iterative): bcrypt(password, salt)
  └─ Result: "$2a$10$K1M2n3P4q5r6s7t8u9v0W..." (60 chars)
  ↓
Hash stored in database (NEVER plaintext)
```

### **Login Password Verification**

```
User enters: "SecurePass@123"
  ↓
Backend receives (plain) in HTTP body
  ↓
PasswordEncoder.matches(plaintext, hash) called:
  ├─ Extract salt from stored hash
  ├─ Hash the plaintext with same salt
  ├─ Compare hash(plaintext) == stored_hash
  ↓
If match ✓ → Continue authentication
If no match ✗ → Return 401 Unauthorized
```

---

## 🎫 JWT Token Security

### **Token Generation**

```java
// Secret is read from application.yml (ENVIRONMENT VARIABLE in prod)
jwt.secret = 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970

// Token built with:
Jwts.builder()
  .claims({
    "role":   "CITIZEN",     // User's role (can be checked in @PreAuthorize)
    "userId": 1              // User's ID (for lookup)
  })
  .subject("john@example.com")  // Email (unique identifier)
  .issuedAt(now)
  .expiration(now + 24h)
  .signWith(HS256, secretKey)   // Signs to prevent tampering
  .compact()
  → "eyJ..." (3 parts separated by dots)
```

### **Token Usage in Authenticated Requests**

```
Browser has token from login
  ↓
axiosInstance request interceptor:
  ├─ Reads token from localStorage
  ├─ Adds to header: "Authorization: Bearer <token>"
  └─ Sends request
  ↓
API Gateway forwards with Authorization header
  ↓
IAM Service receives request
  ↓
JwtAuthFilter intercepts:
  ├─ Extracts "Bearer <token>" from header
  ├─ Calls jwtUtil.extractUsername(token)
  │   ├─ Validates signature (verifies not tampered)
  │   ├─ Checks expiration (not > 24h old)
  │   └─ Returns "john@example.com"
  ├─ Loads UserDetails from DB
  ├─ Sets SecurityContext with authentication object
  └─ Request continues with authenticated user
  ↓
Controller/Service can access:
  - SecurityContextHolder.getContext().getAuthentication()
  - user's email, roles, etc.
```

---

## 🎯 Stateless Authentication

```
Traditional Stateful (Cookies):
  Client Login
    → Server creates Session (stored in memory)
    → Returns JSESSIONID cookie
    → Client sends cookie with every request
    ✓ Server knows session → Allow request

EcoTrack Stateless (JWT):
  Client Login
    → Server generates JWT (no server-side storage)
    → Server returns token to client
    → Client stores in localStorage
    → Client sends token in Authorization header
    ✓ Server verifies signature → Allow request
    ✓ No session storage needed
    ✓ Scales horizontally (any server can verify any token)
```

---

## ✅ Conclusion

**Complete flow documented with:**
- ✅ Exact file names and locations
- ✅ Method signatures and parameters
- ✅ Data structures at each layer
- ✅ Validation annotations applied
- ✅ Error handling & exception flow
- ✅ Database schema
- ✅ JWT token structure
- ✅ Security mechanisms
- ✅ Visual flowcharts

**Key Takeaways:**
1. **Register** → Create user with CITIZEN role + BCrypt password + Generate JWT
2. **Login** → Authenticate password + Generate JWT
3. **Post-Login** → JWT in localStorage → Attached to all requests → JwtAuthFilter validates
4. **Database** → MySQL stores only hashed passwords, never plaintext
5. **Stateless** → No server-side session storage, everything in JWT payload

---

**Date:** May 8, 2026  
**Status:** ✅ Complete End-to-End Flow Documentation


