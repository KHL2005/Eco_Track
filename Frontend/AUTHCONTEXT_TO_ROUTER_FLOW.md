# 🔐 AuthContext → App → Router Flow Diagram

## 📊 Complete Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION BOOTSTRAP                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ① main.jsx (Entry Point)                                                   │
│     └─> createRoot(#root).render()                                          │
│         └─> <StrictMode>                                                     │
│             └─> <App />                                                      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ⬇️
┌─────────────────────────────────────────────────────────────────────────────┐
│                              App.jsx (Root Component)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ② Provider Hierarchy (Nested Contexts & State)                             │
│     ┌──────────────────────────────────────────────────────────────────┐    │
│     │ <QueryClientProvider client={queryClient}>                      │    │
│     │   Query Caching & Server State Management                       │    │
│     │   (staleTime: 30s, retry: 1)                                    │    │
│     │   ┌──────────────────────────────────────────────────────────┐  │    │
│     │   │ <AuthProvider>                                           │  │    │
│     │   │   Authentication State & Persistence                    │  │    │
│     │   │   ┌────────────────────────────────────────────────────┐ │  │    │
│     │   │   │ <AppRouter />                                      │ │  │    │
│     │   │   │   Routing & Guard Logic                            │ │  │    │
│     │   │   │                                                    │ │  │    │
│     │   │   │ <Toaster position="top-right" />                 │ │  │    │
│     │   │   │   Notifications                                   │ │  │    │
│     │   │   └────────────────────────────────────────────────────┘ │  │    │
│     │   └──────────────────────────────────────────────────────────┘  │    │
│     └──────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ⬇️
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AuthContext.jsx (Context Layer)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ③ State Management & Persistence                                           │
│                                                                               │
│     useEffect(() => {                                                        │
│       // On App Load: Restore from localStorage                              │
│       const stored = localStorage.getItem('ecotrack_auth')                   │
│       IF stored:                                                             │
│         → Parse JSON                                                         │
│         → setToken(token)                                                    │
│         → setUser({ userId, email, role, name, phone })                     │
│     }, [])                                                                   │
│                                                                               │
│     Context Value Provided:                                                 │
│     ┌──────────────────────────────────────────────────────────────────┐    │
│     │ {                                                                │    │
│     │   user: { userId, email, role, name, phone },                  │    │
│     │   token: string | null,                                        │    │
│     │   role: string | null,                                         │    │
│     │   isAuthenticated: boolean,                                    │    │
│     │   loading: boolean,                                            │    │
│     │   login(data): store token & user,                             │    │
│     │   logout(): clear token & user,                                │    │
│     │ }                                                               │    │
│     └──────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ⬇️
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AppRouter.jsx (Routing Layer)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ④ Route Configuration with Guard Wrappers                                  │
│                                                                               │
│     <BrowserRouter>                                                          │
│       <Routes>                                                               │
│         {/* Public Routes */}                                                │
│         <Route path="/" element={<HomePage />} />                            │
│         <Route path="/login"                                                 │
│           element={<GuestRoute><LoginPage /></GuestRoute>} />                │
│         <Route path="/register"                                              │
│           element={<GuestRoute><RegisterPage /></GuestRoute>} />             │
│                                                                               │
│         {/* Protected Routes */}                                             │
│         <Route path="/dashboard"                                             │
│           element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />    │
│         <Route path="/issues"                                                │
│           element={<ProtectedRoute><IssuesPage /></ProtectedRoute>} />       │
│         ... (more protected routes)                                          │
│       </Routes>                                                              │
│     </BrowserRouter>                                                         │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ⬇️
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Guards.jsx (Access Control Layer)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ⑤ ProtectedRoute Guard                                                     │
│     ┌──────────────────────────────────────────────────────────────────┐    │
│     │ const { isAuthenticated, loading } = useAuth()                   │    │
│     │ const { role } = useRole()                                       │    │
│     │ const location = useLocation()                                   │    │
│     │                                                                  │    │
│     │ IF loading → return null  (Wait for auth restore)               │    │
│     │                                                                  │    │
│     │ IF NOT isAuthenticated → Navigate to "/"  (Redirect to Home)    │    │
│     │                                                                  │    │
│     │ IF role not in allowedRoutes → Navigate based on role           │    │
│     │   • AGENCY_OFFICER → /analysis                                  │    │
│     │   • Others → /dashboard                                          │    │
│     │                                                                  │    │
│     │ ELSE → Return children (Allow access)                           │    │
│     └──────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ⑥ GuestRoute Guard                                                         │
│     ┌──────────────────────────────────────────────────────────────────┐    │
│     │ const { isAuthenticated, loading } = useAuth()                   │    │
│     │                                                                  │    │
│     │ IF loading → return null  (Wait for auth restore)               │    │
│     │                                                                  │    │
│     │ IF isAuthenticated → Navigate to "/dashboard"  (Already logged) │    │
│     │                                                                  │    │
│     │ ELSE → Return children (Allow access to login/register)         │    │
│     └──────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Journey Flow

### **Scenario 1: First Time User (No Token)**

```
User visits app
    ⬇️
main.jsx loads App component
    ⬇️
App.jsx wraps with AuthProvider + QueryClientProvider
    ⬇️
AuthContext useEffect runs:
  • localStorage.getItem('ecotrack_auth') → null
  • setLoading(false)
  • isAuthenticated = false
    ⬇️
AppRouter checks route: "/"
    ⬇️
HomePage rendered (public route)
    ⬇️
User clicks "Login"
    ⬇️
Router navigates to "/login"
    ⬇️
GuestRoute checks:
  • isAuthenticated = false ✓
  • Allows <LoginPage />
    ⬇️
User enters credentials
    ⬇️
LoginPage calls authApi.login(email, password)
    ⬇️
Backend validates → returns JWT token + user data
    ⬇️
LoginPage calls: authContext.login({
  token: "eyJhbGc...",
  userId: "123",
  email: "user@example.com",
  role: "CITIZEN",
  name: "John Doe",
  phone: "9876543210"
})
    ⬇️
AuthContext.login() executes:
  • setToken(token)
  • setUser({ userId, email, role, name, phone })
  • localStorage.setItem('ecotrack_auth', JSON.stringify(...))
    ⬇️
isAuthenticated = true
    ⬇️
LoginPage redirects to "/dashboard" (useEffect dependency on isAuthenticated)
    ⬇️
AppRouter navigates to "/dashboard"
    ⬇️
ProtectedRoute checks:
  • isAuthenticated = true ✓
  • role = "CITIZEN" ✓
  • CITIZEN allowed to access /dashboard ✓
  • Renders <DashboardPage />
```

### **Scenario 2: User Refreshes Page (Token Persists)**

```
User refreshes page at /dashboard
    ⬇️
main.jsx loads App component again
    ⬇️
AuthContext useEffect runs:
  • localStorage.getItem('ecotrack_auth') → EXISTS!
  • Parse JSON: { token: "eyJhbGc...", userId: "123", ... }
  • setToken("eyJhbGc...")
  • setUser({ userId, email, role, name, phone })
  • setLoading(false)
    ⬇️
isAuthenticated = true (restored)
    ⬇️
AppRouter checks current route "/dashboard"
    ⬇️
ProtectedRoute validates:
  • isAuthenticated = true ✓
  • role = "CITIZEN" ✓
  • access allowed ✓
    ⬇️
<DashboardPage /> renders with restored auth state
```

### **Scenario 3: User Logs Out**

```
User clicks "Logout" button
    ⬇️
Calls: authContext.logout()
    ⬇️
AuthContext.logout() executes:
  • setToken(null)
  • setUser(null)
  • localStorage.removeItem('ecotrack_auth')
    ⬇️
isAuthenticated = false
    ⬇️
Component detects isAuthenticated change
    ⬇️
Router navigates to "/"
    ⬇️
HomePage rendered
```

### **Scenario 4: Unauthorized Route Access**

```
Logged-in CITIZEN tries to access "/admin/users"
    ⬇️
Router navigates to "/admin/users"
    ⬇️
ProtectedRoute checks:
  • isAuthenticated = true ✓
  • role = "CITIZEN" ✓
  • allowedRoutes for CITIZEN = ['/dashboard', '/issues/new', '/issues/mine', '/issues/:id', '/notifications', '/profile']
  • /admin/users NOT in allowedRoutes ✗
    ⬇️
Redirect to "/dashboard" (role fallback)
    ⬇️
<DashboardPage /> renders instead
```

---

## 🎯 Role-Based Route Access Matrix

| Role | Allowed Routes |
|------|---|
| **CITIZEN** | `/dashboard`, `/issues/new`, `/issues/mine`, `/issues/:id`, `/notifications`, `/profile` |
| **AGENCY_OFFICER** | Dashboard, Issues (all), Analysis, Projects, Reports, Notifications, Profile |
| **INDUSTRY** | `/dashboard`, `/emissions`, `/documents`, `/notifications`, `/profile` |
| **SCIENTIST** | `/dashboard`, `/sensors`, `/sensor-data`, `/analysis`, `/notifications`, `/profile` |
| **COMPLIANCE_OFFICER** | `/dashboard`, `/compliance`, `/audits`, `/emissions`, `/documents`, `/notifications`, `/profile` |
| **ADMINISTRATOR** | ✅ ALL routes |
| **SUPER_ADMIN** | ✅ ALL routes |

---

## 💾 localStorage Structure

**Key:** `ecotrack_auth`

**Value:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "citizen@example.com",
  "role": "CITIZEN",
  "name": "John Doe",
  "phone": "9876543210"
}
```

---

## 🔗 Integration Points

### **1. AuthContext → Components**
```javascript
// In any component
const { user, token, role, isAuthenticated, login, logout } = useAuth();
```

### **2. AuthContext → Guards**
```javascript
// Guards.jsx
const { isAuthenticated, loading } = useAuth();
const { role } = useRole();
```

### **3. Router → Guards**
```javascript
// AppRouter.jsx wraps routes with guards
<Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
```

### **4. Components → Router (Navigation)**
```javascript
// After login, redirect
navigate('/dashboard');  // useNavigate hook
```

---

## ✅ Summary: Complete Flow Path

```
User Action
    ⬇️ 
main.jsx (bootstrap)
    ⬇️
App.jsx (provider setup)
    ⬇️
AuthProvider (context initialization)
    ⬇️
AppRouter (route setup)
    ⬇️
Guards.jsx (access control)
    ⬇️
Protected/Public Pages (render)
```

**Key Takeaway:** AuthContext provides global auth state → AppRouter applies guards → Guards check auth status + role → Route renders or redirects! 🚀

