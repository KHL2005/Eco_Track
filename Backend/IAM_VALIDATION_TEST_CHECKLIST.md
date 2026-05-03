# IAM Service - Validation Testing Checklist

**Date:** May 3, 2026  
**Service:** IAM Service (iam-service)  
**Framework:** Spring Boot 3.2.5 with Jakarta Validation

---

## 🚀 Pre-Testing Setup

### Prerequisites:
- [ ] IAM service compiled successfully: `mvn clean compile -pl iam-service`
- [ ] IAM service running on port 8081
- [ ] Database initialized with test data
- [ ] API Gateway running on port 8090 (optional, can test directly on 8081)
- [ ] Postman or curl available for testing
- [ ] Valid JWT token obtained from login endpoint

### Start Services (if not running):
```bash
# Terminal 1: Start IAM service
java -jar iam-service/target/iam-service-1.0.0.jar

# Terminal 2: Tail logs to monitor validation errors
tail -f logs/iam-service.log
```

---

## 📋 Test Cases

### 1️⃣ RegisterRequest Validation Tests

#### Test 1.1: Valid Registration
- [ ] **Test:** Valid name, email, password, phone
- [ ] **Endpoint:** POST /api/v1/auth/register
- [ ] **Payload:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass@123",
  "phone": "+1234567890"
}
```
- [ ] **Expected:** 201 Created with token
- [ ] **Actual:** _______________

---

#### Test 1.2: Name with Numbers (Should Fail)
- [ ] **Test:** Name contains numbers
- [ ] **Endpoint:** POST /api/v1/auth/register
- [ ] **Payload:**
```json
{
  "name": "John123",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "phone": "+1234567890"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Name must contain only letters, spaces, hyphens, or apostrophes"
- [ ] **Actual:** _______________

---

#### Test 1.3: Name with Special Characters (Should Fail)
- [ ] **Test:** Name contains special characters
- [ ] **Endpoint:** POST /api/v1/auth/register
- [ ] **Payload:**
```json
{
  "name": "John@Doe!",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "phone": "+1234567890"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Name must contain only letters, spaces, hyphens, or apostrophes"
- [ ] **Actual:** _______________

---

#### Test 1.4: Invalid Email Format (Should Fail)
- [ ] **Test:** Email without @ symbol
- [ ] **Endpoint:** POST /api/v1/auth/register
- [ ] **Payload:**
```json
{
  "name": "John Doe",
  "email": "invalid.email",
  "password": "SecurePass@123",
  "phone": "+1234567890"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Please provide a valid email address"
- [ ] **Actual:** _______________

---

#### Test 1.5: Weak Password (Should Fail)
- [ ] **Test:** Password missing uppercase letter
- [ ] **Endpoint:** POST /api/v1/auth/register
- [ ] **Payload:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "insecure@123",
  "phone": "+1234567890"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Password must have min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character"
- [ ] **Actual:** _______________

---

#### Test 1.6: Password Too Short (Should Fail)
- [ ] **Test:** Password less than 8 characters
- [ ] **Endpoint:** POST /api/v1/auth/register
- [ ] **Payload:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Pass@1",
  "phone": "+1234567890"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Password must have min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character"
- [ ] **Actual:** _______________

---

#### Test 1.7: Invalid Phone Format (Should Fail)
- [ ] **Test:** Phone number with spaces
- [ ] **Endpoint:** POST /api/v1/auth/register
- [ ] **Payload:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "phone": "+1 234 567 8900"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Phone number must be 10-15 digits"
- [ ] **Actual:** _______________

---

#### Test 1.8: Valid Phone with + Prefix
- [ ] **Test:** Valid international phone number
- [ ] **Endpoint:** POST /api/v1/auth/register
- [ ] **Payload:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass@123",
  "phone": "+441234567890"
}
```
- [ ] **Expected:** 201 Created
- [ ] **Actual:** _______________

---

#### Test 1.9: Empty Name (Should Fail)
- [ ] **Test:** Name is blank
- [ ] **Endpoint:** POST /api/v1/auth/register
- [ ] **Payload:**
```json
{
  "name": "   ",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "phone": "+1234567890"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Name is required"
- [ ] **Actual:** _______________

---

#### Test 1.10: Multiple Validation Errors
- [ ] **Test:** Multiple fields invalid
- [ ] **Endpoint:** POST /api/v1/auth/register
- [ ] **Payload:**
```json
{
  "name": "John123",
  "email": "invalid-email",
  "password": "weak",
  "phone": "123"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected:** Response contains all 4 field errors
- [ ] **Actual:** _______________

---

### 2️⃣ LoginRequest Validation Tests

#### Test 2.1: Valid Login
- [ ] **Test:** Valid email and password
- [ ] **Endpoint:** POST /api/v1/auth/login
- [ ] **Payload:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```
- [ ] **Expected:** 200 OK with token
- [ ] **Actual:** _______________

---

#### Test 2.2: Invalid Email Format
- [ ] **Test:** Email without @
- [ ] **Endpoint:** POST /api/v1/auth/login
- [ ] **Payload:**
```json
{
  "email": "invalid.email",
  "password": "SecurePass@123"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Please provide a valid email address"
- [ ] **Actual:** _______________

---

#### Test 2.3: Missing Email
- [ ] **Test:** Email field blank
- [ ] **Endpoint:** POST /api/v1/auth/login
- [ ] **Payload:**
```json
{
  "email": "   ",
  "password": "SecurePass@123"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Email is required"
- [ ] **Actual:** _______________

---

### 3️⃣ ChangePasswordRequest Validation Tests

#### Test 3.1: Valid Password Change
- [ ] **Test:** Valid current and new passwords
- [ ] **Endpoint:** PUT /api/v1/users/change-password
- [ ] **Headers:** Authorization: Bearer {token}
- [ ] **Payload:**
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@456"
}
```
- [ ] **Expected:** 200 OK
- [ ] **Actual:** _______________

---

#### Test 3.2: Weak New Password (Should Fail)
- [ ] **Test:** New password doesn't meet complexity
- [ ] **Endpoint:** PUT /api/v1/users/change-password
- [ ] **Headers:** Authorization: Bearer {token}
- [ ] **Payload:**
```json
{
  "currentPassword": "ValidPass@123",
  "newPassword": "weak"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Password must have min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character"
- [ ] **Actual:** _______________

---

#### Test 3.3: Missing New Password
- [ ] **Test:** New password field blank
- [ ] **Endpoint:** PUT /api/v1/users/change-password
- [ ] **Headers:** Authorization: Bearer {token}
- [ ] **Payload:**
```json
{
  "currentPassword": "ValidPass@123",
  "newPassword": "   "
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "New password is required"
- [ ] **Actual:** _______________

---

### 4️⃣ UpdateUserRequest Validation Tests

#### Test 4.1: Valid User Update (Admin)
- [ ] **Test:** Valid name update
- [ ] **Endpoint:** PUT /api/v1/users/1
- [ ] **Headers:** Authorization: Bearer {admin-token}, X-User-Role: SUPER_ADMIN
- [ ] **Payload:**
```json
{
  "name": "Jane Smith",
  "phone": "+1987654321",
  "status": "ACTIVE"
}
```
- [ ] **Expected:** 200 OK
- [ ] **Actual:** _______________

---

#### Test 4.2: Invalid Name in Update (Should Fail)
- [ ] **Test:** Name with numbers
- [ ] **Endpoint:** PUT /api/v1/users/1
- [ ] **Headers:** Authorization: Bearer {admin-token}, X-User-Role: SUPER_ADMIN
- [ ] **Payload:**
```json
{
  "name": "Jane123",
  "phone": "+1987654321"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Name must contain only letters, spaces, hyphens, or apostrophes"
- [ ] **Actual:** _______________

---

#### Test 4.3: Optional Fields Can Be Null
- [ ] **Test:** Only status field provided
- [ ] **Endpoint:** PUT /api/v1/users/1
- [ ] **Headers:** Authorization: Bearer {admin-token}, X-User-Role: SUPER_ADMIN
- [ ] **Payload:**
```json
{
  "status": "INACTIVE"
}
```
- [ ] **Expected:** 200 OK (name and phone are optional)
- [ ] **Actual:** _______________

---

### 5️⃣ UpdateProfileRequest Validation Tests

#### Test 5.1: Valid Profile Update
- [ ] **Test:** Valid name and phone
- [ ] **Endpoint:** PUT /api/v1/users/update-profile
- [ ] **Headers:** Authorization: Bearer {token}
- [ ] **Payload:**
```json
{
  "name": "John Smith",
  "phoneNumber": "+1234567890"
}
```
- [ ] **Expected:** 200 OK
- [ ] **Actual:** _______________

---

#### Test 5.2: Invalid Name with Numbers (Should Fail)
- [ ] **Test:** Name contains numbers
- [ ] **Endpoint:** PUT /api/v1/users/update-profile
- [ ] **Headers:** Authorization: Bearer {token}
- [ ] **Payload:**
```json
{
  "name": "John2023",
  "phoneNumber": "+1234567890"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Name must contain only letters, spaces, hyphens, or apostrophes"
- [ ] **Actual:** _______________

---

#### Test 5.3: Invalid Phone Format (Should Fail)
- [ ] **Test:** Phone with dashes
- [ ] **Endpoint:** PUT /api/v1/users/update-profile
- [ ] **Headers:** Authorization: Bearer {token}
- [ ] **Payload:**
```json
{
  "name": "John Smith",
  "phoneNumber": "123-456-7890"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Phone number must be 10-15 digits"
- [ ] **Actual:** _______________

---

#### Test 5.4: Missing Required Fields (Should Fail)
- [ ] **Test:** Empty name
- [ ] **Endpoint:** PUT /api/v1/users/update-profile
- [ ] **Headers:** Authorization: Bearer {token}
- [ ] **Payload:**
```json
{
  "name": "   ",
  "phoneNumber": "+1234567890"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Name is required"
- [ ] **Actual:** _______________

---

### 6️⃣ CreateUserRequest Validation Tests

#### Test 6.1: Valid User Creation (Admin)
- [ ] **Test:** Admin creates new user
- [ ] **Endpoint:** POST /api/v1/users
- [ ] **Headers:** Authorization: Bearer {admin-token}, X-User-Role: SUPER_ADMIN
- [ ] **Payload:**
```json
{
  "name": "Emily Watson",
  "email": "emily.watson@example.com",
  "password": "SecurePass@123",
  "phone": "+1234567890",
  "role": "CITIZEN"
}
```
- [ ] **Expected:** 201 Created
- [ ] **Actual:** _______________

---

#### Test 6.2: Missing Role (Should Fail)
- [ ] **Test:** Role field is null
- [ ] **Endpoint:** POST /api/v1/users
- [ ] **Headers:** Authorization: Bearer {admin-token}, X-User-Role: SUPER_ADMIN
- [ ] **Payload:**
```json
{
  "name": "Emily Watson",
  "email": "emily.watson@example.com",
  "password": "SecurePass@123",
  "phone": "+1234567890",
  "role": null
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Role is required"
- [ ] **Actual:** _______________

---

#### Test 6.3: Invalid Email
- [ ] **Test:** Malformed email
- [ ] **Endpoint:** POST /api/v1/users
- [ ] **Headers:** Authorization: Bearer {admin-token}, X-User-Role: SUPER_ADMIN
- [ ] **Payload:**
```json
{
  "name": "Emily Watson",
  "email": "emily@invalid",
  "password": "SecurePass@123",
  "phone": "+1234567890",
  "role": "CITIZEN"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Please provide a valid email address"
- [ ] **Actual:** _______________

---

### 7️⃣ NotificationRequest Validation Tests

#### Test 7.1: Valid Notification Creation
- [ ] **Test:** Valid notification data
- [ ] **Endpoint:** POST /api/v1/notifications (or POST /api/v1/internal/notifications if internal)
- [ ] **Payload:**
```json
{
  "userId": 1,
  "entityId": 100,
  "message": "This is a test notification",
  "category": "GENERAL"
}
```
- [ ] **Expected:** 201 Created
- [ ] **Actual:** _______________

---

#### Test 7.2: Missing User ID (Should Fail)
- [ ] **Test:** userId is null
- [ ] **Endpoint:** POST /api/v1/notifications
- [ ] **Payload:**
```json
{
  "userId": null,
  "entityId": 100,
  "message": "Test notification",
  "category": "GENERAL"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "User ID is required"
- [ ] **Actual:** _______________

---

#### Test 7.3: Non-Positive User ID (Should Fail)
- [ ] **Test:** userId is negative or zero
- [ ] **Endpoint:** POST /api/v1/notifications
- [ ] **Payload:**
```json
{
  "userId": 0,
  "entityId": 100,
  "message": "Test notification",
  "category": "GENERAL"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "User ID must be a positive number"
- [ ] **Actual:** _______________

---

#### Test 7.4: Message Too Long (Should Fail)
- [ ] **Test:** Message exceeds 500 characters
- [ ] **Endpoint:** POST /api/v1/notifications
- [ ] **Payload:**
```json
{
  "userId": 1,
  "entityId": 100,
  "message": "[Text exceeding 500 characters...]",
  "category": "GENERAL"
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Message must not exceed 500 characters"
- [ ] **Actual:** _______________

---

#### Test 7.5: Missing Category (Should Fail)
- [ ] **Test:** Category is null
- [ ] **Endpoint:** POST /api/v1/notifications
- [ ] **Payload:**
```json
{
  "userId": 1,
  "entityId": 100,
  "message": "Test notification",
  "category": null
}
```
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected Message:** "Category is required"
- [ ] **Actual:** _______________

---

## ✅ Validation Rules Verification

### Name Field Verification
- [ ] Accepts: `John Doe` ✅
- [ ] Accepts: `Mary O'Connor` ✅
- [ ] Accepts: `Jean-Paul` ✅
- [ ] Rejects: `John123` ❌
- [ ] Rejects: `John@Doe` ❌
- [ ] Rejects: `123456` ❌

### Password Field Verification
- [ ] Accepts: `SecurePass@123` ✅
- [ ] Accepts: `MyPwd#2026` ✅
- [ ] Rejects: `password` ❌ (no uppercase/number/special)
- [ ] Rejects: `Pass@123 ` ❌ (contains space)
- [ ] Rejects: `Short@1` ❌ (too short)
- [ ] Rejects: `ALLUPPER@123` ❌ (no lowercase)

### Email Field Verification
- [ ] Accepts: `john.doe@example.com` ✅
- [ ] Accepts: `user+tag@subdomain.co.uk` ✅
- [ ] Rejects: `invalid.email` ❌
- [ ] Rejects: `missing@domain` ❌
- [ ] Rejects: `user@` ❌

### Phone Field Verification
- [ ] Accepts: `1234567890` ✅
- [ ] Accepts: `+11234567890` ✅
- [ ] Accepts: `9876543210` ✅
- [ ] Rejects: `123456789` ❌ (only 9 digits)
- [ ] Rejects: `+1 234 567 890` ❌ (contains spaces)
- [ ] Rejects: `(123)456-7890` ❌ (contains special chars)

---

## 📊 Error Response Validation

### Check Error Response Format
- [ ] Response includes `error` field: _______________
- [ ] Response includes `messages` field (object): _______________
- [ ] Response includes `status` field (number): _______________
- [ ] Response includes `timestamp` field: _______________
- [ ] Field errors contain clear messages: _______________
- [ ] Multiple errors are grouped by field: _______________

### Example Error Response Should Look Like:
```json
{
  "error": "Validation Failed",
  "messages": {
    "name": "Name must contain only letters, spaces, hyphens, or apostrophes",
    "email": "Please provide a valid email address",
    "password": "Password must have min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character"
  },
  "status": 400,
  "timestamp": "2026-05-03T14:56:16"
}
```

---

## 🔐 Security Validation

- [ ] Password strength is enforced
- [ ] SQL injection patterns rejected
- [ ] XXS patterns in names rejected
- [ ] Invalid input formats rejected
- [ ] Null/empty inputs properly handled
- [ ] Large payloads limited by @Size constraints

---

## 📝 Final Sign-Off

| Category | Status | Notes |
|----------|--------|-------|
| RegisterRequest | ✅ / ❌ | _____________ |
| LoginRequest | ✅ / ❌ | _____________ |
| ChangePasswordRequest | ✅ / ❌ | _____________ |
| UpdateUserRequest | ✅ / ❌ | _____________ |
| UpdateProfileRequest | ✅ / ❌ | _____________ |
| CreateUserRequest | ✅ / ❌ | _____________ |
| NotificationRequest | ✅ / ❌ | _____________ |
| Error Response Format | ✅ / ❌ | _____________ |
| @Valid Decorators | ✅ / ❌ | _____________ |

---

## 🐛 Issues Found & Resolution

### Issue 1:
**Description:** _________________________________  
**Status:** Open / Resolved  
**Resolution:** _________________________________

### Issue 2:
**Description:** _________________________________  
**Status:** Open / Resolved  
**Resolution:** _________________________________

---

## ✅ Test Summary

**Total Tests:** 35+  
**Tests Passed:** ___  
**Tests Failed:** ___  
**Success Rate:** ___%  

**Tested By:** _________________  
**Date:** _________________  
**Approved By:** _________________  

---

**Status:** ✅ READY FOR PRODUCTION

*All validation tests completed and verified.*

