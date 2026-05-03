# IAM Service - Validation Quick Reference Guide

## 📌 Quick Lookup by Field Type

### 🆔 Name/Text Fields

**Pattern:**
```java
@NotBlank(message = "Name is required")
@Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
@Pattern(regexp = "^[a-zA-Z\\s'-]+$", message = "Name must contain only letters, spaces, hyphens, or apostrophes")
private String name;
```

**Accepts:** Letters (A-Z, a-z), spaces, hyphens (-), apostrophes (')  
**Rejects:** Numbers, special characters (!@#$), emojis  
**Examples:**
- ✅ `John Doe`
- ✅ `Mary O'Connor`
- ✅ `Jean-Paul`
- ❌ `John123`
- ❌ `John@Doe`

---

### 🔐 Password Fields

**Pattern:**
```java
@NotBlank(message = "Password is required")
@Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
@Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$",
         message = "Password must have min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character")
private String password;
```

**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 digit (0-9)
- At least 1 special character (@#$%^&+=!)
- No whitespace

**Examples:**
- ✅ `SecurePass@123`
- ✅ `MyPwd#2026`
- ✅ `Admin@Pass99`
- ❌ `password` (no uppercase/number/special)
- ❌ `Pass@123 ` (contains space)
- ❌ `Short@1` (less than 8 chars)

---

### 📧 Email Fields

**Pattern:**
```java
@NotBlank(message = "Email is required")
@Email(message = "Please provide a valid email address")
@Size(max = 100, message = "Email must not exceed 100 characters")
private String email;
```

**Requirements:**
- Valid email format (contains @)
- Max 100 characters
- Follows RFC 5322 standards

**Examples:**
- ✅ `john.doe@example.com`
- ✅ `user+tag@subdomain.co.uk`
- ✅ `test_123@company.org`
- ❌ `invalid.email`
- ❌ `missing@domain`
- ❌ `user@` (incomplete)

---

### 📱 Phone Number Fields

**Pattern:**
```java
@Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Phone number must be 10-15 digits")
private String phone;
```

**Requirements:**
- 10-15 digits
- Optional + prefix for international format
- Only digits (0-9) and optional +

**Examples:**
- ✅ `1234567890`
- ✅ `9876543210`
- ✅ `+11234567890`
- ✅ `+44201234567`
- ❌ `123456789` (only 9 digits)
- ❌ `+1 234 567 890` (contains spaces)
- ❌ `(123) 456-7890` (contains special chars)

---

### 🆔 ID/Number Fields

**Pattern:**
```java
@NotNull(message = "User ID is required")
@Positive(message = "User ID must be a positive number")
private Long userId;
```

**Requirements:**
- Must be a positive number (> 0)
- Cannot be null for required fields
- Can be null for optional fields

**Examples:**
- ✅ `1`
- ✅ `12345`
- ✅ `999999999`
- ❌ `0` (not positive)
- ❌ `-1` (negative)
- ❌ `null` (if @NotNull is present)

---

### 🏷️ Role/Enum Fields

**Pattern:**
```java
@NotNull(message = "Role is required")
private UserRole role;
```

**Requirements:**
- Must be a valid enum value
- Cannot be null for required fields

**Valid Values:** `SUPER_ADMIN`, `ADMINISTRATOR`, `AUDITOR`, `ANALYST`, `CITIZEN`

**Examples:**
- ✅ `SUPER_ADMIN`
- ✅ `CITIZEN`
- ❌ `ADMIN` (not a valid enum)
- ❌ `null` (if @NotNull is present)

---

## 📊 Validation Annotations Reference

| Annotation | Purpose | Parameter |
|-----------|---------|-----------|
| `@NotBlank` | String not empty/whitespace | message |
| `@NotNull` | Not null | message |
| `@Size` | String/collection size limits | min, max, message |
| `@Pattern` | Regex pattern match | regexp, message |
| `@Email` | Valid email format | message |
| `@Positive` | Positive number (> 0) | message |
| `@NotEmpty` | Not empty collection | message |

---

## 🚀 DTOs and Their Validations

### AuthController

#### **POST /api/v1/auth/register** → RegisterRequest
```
name         → @NotBlank, @Size(2-50), @Pattern (letters/spaces/hyphens/apostrophes)
email        → @NotBlank, @Email, @Size(100)
password     → @NotBlank, @Size(8-100), @Pattern (strong password)
phone        → @Pattern (10-15 digits) [OPTIONAL]
```

#### **POST /api/v1/auth/login** → LoginRequest
```
email        → @NotBlank, @Email, @Size(100)
password     → @NotBlank, @Size(8-100)
```

---

### UserController

#### **POST /api/v1/users** → CreateUserRequest
```
name         → @NotBlank, @Size(2-50), @Pattern (letters/spaces/hyphens/apostrophes)
email        → @NotBlank, @Email, @Size(100)
password     → @NotBlank, @Size(8-100), @Pattern (strong password)
phone        → @Pattern (10-15 digits) [OPTIONAL]
role         → @NotNull
```

#### **PUT /api/v1/users/{id}** → UpdateUserRequest
```
name         → @Size(2-50), @Pattern (letters/spaces/hyphens/apostrophes) [OPTIONAL]
phone        → @Pattern (10-15 digits) [OPTIONAL]
status       → No validation [OPTIONAL]
```

#### **PUT /api/v1/users/change-password** → ChangePasswordRequest
```
currentPassword  → @NotBlank, @Size(8-100)
newPassword      → @NotBlank, @Size(8-100), @Pattern (strong password)
```

#### **PUT /api/v1/users/update-profile** → UpdateProfileRequest
```
name             → @NotBlank, @Size(2-50), @Pattern (letters/spaces/hyphens/apostrophes)
phoneNumber      → @NotBlank, @Pattern (10-15 digits)
```

---

## 🔧 Error Response Format

### Request (invalid):
```json
{
  "name": "John123",
  "email": "invalid",
  "password": "weak",
  "phone": "123"
}
```

### Response (400 Bad Request):
```json
{
  "error": "Validation Failed",
  "messages": {
    "name": "Name must contain only letters, spaces, hyphens, or apostrophes",
    "email": "Please provide a valid email address",
    "password": "Password must have min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character",
    "phone": "Phone number must be 10-15 digits"
  },
  "status": 400,
  "timestamp": "2026-05-03T14:56:16"
}
```

---

## 💡 Common Issues & Solutions

### Issue: "Password must have min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character"

**Cause:** Password doesn't meet complexity requirements

**Solutions:**
- Add uppercase letter: `Pass123!`
- Add ower case letter: `PASS123!`
- Add digit: `Pass!abc`
- Add special char: `Pass123@`

---

### Issue: "Name must contain only letters, spaces, hyphens, or apostrophes"

**Cause:** Name contains numbers or invalid special characters

**Solutions:**
- Remove numbers: `John Doe` (not `John123`)
- Use only allowed characters: `Mary O'Connor` (apostrophe OK)
- Use hyphens for compound names: `Jean-Paul` (hyphen OK)

---

### Issue: "Email must not exceed 100 characters"

**Cause:** Email address is too long

**Solution:**
- Use shorter email: `john@example.com` (not `john.very.long.name+tag@very.long.subdomain.example.co.uk`)

---

### Issue: "Phone number must be 10-15 digits"

**Cause:** Phone number format incorrect

**Solutions:**
- Remove spaces: `+11234567890` (not `+1 123 456 7890`)
- Remove dashes: `1234567890` (not `123-456-7890`)
- Add country code: `+11234567890` (for USA)
- Ensure 10-15 digits: `1234567890` (OK) vs `123456789` (too short)

---

## 🧪 Testing Commands

### Test Valid Registration
```bash
curl -X POST http://localhost:8090/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass@123",
    "phone": "+1234567890"
  }'
```

### Test Invalid Name (Numbers Present)
```bash
curl -X POST http://localhost:8090/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John123",
    "email": "john@example.com",
    "password": "SecurePass@123",
    "phone": "+1234567890"
  }'
```

### Test Weak Password
```bash
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "weak123"
  }'
```

### Test Invalid Email
```bash
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "SecurePass@123"
  }'
```

### Test Phone Number Format
```bash
curl -X POST http://localhost:8090/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePass@123",
    "phone": "+1-234-567-8900"
  }'
# Will fail due to dashes - use: "+12345678900"
```

---

## 📖 Writing Custom Validation Logic

If you need to add custom validations beyond the standard annotations:

```java
// Example: Custom validator for specific field
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = CustomValidator.class)
public @interface CustomValidation {
    String message() default "Validation failed";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// Usage in DTO:
public class MyRequest {
    @CustomValidation
    private String customField;
}
```

---

## 🔐 Security Best Practices

1. **Always validate on server side** - Never rely on client-side validation
2. **Use strong password requirements** - Enforced minimum complexity
3. **Sanitize input** - Pattern matching prevents injection attacks
4. **Limit field sizes** - Prevents buffer overflow attacks
5. **Use @NotNull and @NotBlank** - Prevents null/empty injection
6. **Log validation failures** - Monitor for brute force attempts
7. **Rate limit endpoints** - Prevent automated validation bypasses

---

## 📝 Notes

- All validation annotations use **Jakarta validation** (jakarta.validation.constraints.*)
- The `@Valid` decorator on controller endpoints triggers validation
- Validation errors are caught by `GlobalExceptionHandler`
- Field-level error messages are returned in structured JSON format
- Optional fields can be null but if provided, must pass validation
- Pattern validation allows null by default for optional fields

---

**Last Updated:** May 3, 2026  
**Status:** ✅ Production Ready

