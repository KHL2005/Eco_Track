# EcoTrack Notification Service Extraction - Migration Summary

## Overview
Successfully extracted the Notification feature from the IAM service into a separate standalone microservice called **notification-service**. This document provides a complete overview of all changes made.

---

## ✅ COMPLETED TASKS

### 1. Created notification-service Microservice

**Location:** `C:\Users\2479746\Documents\Project\Backend\notification-service\`

#### Directory Structure:
```
notification-service/
├── pom.xml
└── src/main/
    ├── java/com/ecotrack/notification/
    │   ├── NotificationServiceApplication.java
    │   ├── controller/
    │   │   └── NotificationController.java
    │   ├── service/
    │   │   └── NotificationService.java
    │   ├── dto/
    │   │   ├── NotificationRequest.java
    │   │   └── NotificationResponse.java
    │   ├── entity/
    │   │   └── Notification.java
    │   ├── repository/
    │   │   └── NotificationRepository.java
    │   ├── enums/
    │   │   ├── NotificationCategory.java
    │   │   └── NotificationStatus.java
    │   └── exception/
    │       ├── ResourceNotFoundException.java
    │       └── GlobalExceptionHandler.java
    └── resources/
        └── application.yml
```

#### Key Configuration:
- **Port:** 8083
- **Database:** `ecotrack_notification` (MySQL)
- **Application Name:** notification-service
- **Eureka Registration:** Enabled with IP preference
- **Package:** `com.ecotrack.notification`

---

### 2. Updated IAM Service

#### Files Removed:
- ✅ `controller/NotificationController.java`
- ✅ `service/NotificationService.java`
- ✅ `entity/Notification.java`
- ✅ `repository/NotificationRepository.java`
- ✅ `enums/NotificationCategory.java`
- ✅ `enums/NotificationStatus.java`

#### Files Added:
- ✅ `client/NotificationClient.java` (FeignClient for inter-service communication)
- ✅ `dto/NotificationRequest.java` (re-added for FeignClient)
- ✅ `dto/NotificationResponse.java` (re-added for FeignClient)
- ✅ `enums/NotificationCategory.java` (re-added for FeignClient)
- ✅ `enums/NotificationStatus.java` (re-added for FeignClient)

#### Modified Files:
- ✅ `IamServiceApplication.java` - Added `@EnableFeignClients` annotation
- ✅ `pom.xml` - Added `spring-cloud-starter-openfeign` dependency

---

### 3. FeignClient Implementation

**File:** `iam-service/src/main/java/com/ecotrack/iam/client/NotificationClient.java`

```java
@FeignClient(name = "notification-service")
public interface NotificationClient {
    @PostMapping("/api/v1/notifications")
    NotificationResponse createNotification(@RequestBody NotificationRequest request);
    
    @GetMapping("/api/v1/notifications")
    List<NotificationResponse> getAllNotifications();
    
    @GetMapping("/api/v1/notifications/user/{userId}")
    List<NotificationResponse> getByUser(@PathVariable Long userId);
    
    @GetMapping("/api/v1/notifications/user/{userId}/unread")
    List<NotificationResponse> getUnreadByUser(@PathVariable Long userId);
    
    @PatchMapping("/api/v1/notifications/{id}/read")
    NotificationResponse markAsRead(@PathVariable Long id);
    
    @PatchMapping("/api/v1/notifications/{id}/archive")
    NotificationResponse markAsArchived(@PathVariable Long id);
    
    @PatchMapping("/api/v1/notifications/user/{userId}/read-all")
    void markAllReadForUser(@PathVariable Long userId);
    
    @DeleteMapping("/api/v1/notifications/{id}")
    void deleteNotification(@PathVariable Long id);
}
```

---

### 4. API Gateway Configuration Updates

#### Modified Files:
- ✅ `api-gateway/src/main/resources/application.yml`
- ✅ `api-gateway/src/main/java/com/ecotrack/gateway/config/GatewayConfig.java`

#### Changes:

**GatewayConfig.java:**
```java
// Route updated from IAM to Notification Service
.route("notification-notifications",
    r -> r.path("/api/v1/notifications/**")
          .filters(f -> applyFilters(f, "notificationCB", "/fallback/notification"))
          .uri("lb://notification-service"));
```

**application.yml:**
- Added circuit breaker instance: `notificationCB`
- Added timelimiter instance: `notificationCB`
- Base configuration inherited from default settings

---

### 5. Parent POM Update

**File:** `Backend/pom.xml`

Added notification-service module:
```xml
<module>notification-service</module>
```

Module is now part of the build order between `iam-service` and `citizen-reporting-service`.

---

## 🔄 API Routing Changes

### Before Migration:
```
Client Request → API Gateway (port 8090)
    ↓
/api/v1/notifications/** → IAM Service (port 8081)
```

### After Migration:
```
Client Request → API Gateway (port 8090)
    ↓ (with circuit breaker notificationCB)
/api/v1/notifications/** → Notification Service (port 8083)
```

### IAM Service Internal Calls:
If IAM service needs to interact with notifications, it uses FeignClient:
```
IAM Service → NotificationClient (FeignClient)
    ↓ (via service discovery)
Notification Service (port 8083)
```

---

## 📋 API Endpoints (Unchanged)

All notification endpoints remain identical:

| Method | Endpoint | Handler |
|--------|----------|---------|
| POST | `/api/v1/notifications` | Create notification |
| GET | `/api/v1/notifications` | Get all notifications |
| GET | `/api/v1/notifications/user/{userId}` | Get user's notifications |
| GET | `/api/v1/notifications/user/{userId}/unread` | Get unread notifications |
| PATCH | `/api/v1/notifications/{id}/read` | Mark as read |
| PATCH | `/api/v1/notifications/{id}/archive` | Archive notification |
| PATCH | `/api/v1/notifications/user/{userId}/read-all` | Mark all as read |
| DELETE | `/api/v1/notifications/{id}` | Delete notification |

---

## 🚀 Deployment Instructions

### 1. Build the Services:
```bash
cd C:\Users\2479746\Documents\Project\Backend
mvn clean package
```

### 2. Ensure Eureka Server is Running:
- Eureka Server should be running on `http://localhost:8761/eureka/`

### 3. Start Services in Order:
```bash
# Terminal 1: Config Server (port 8888)
java -jar config-server/target/config-server-1.0.0.jar

# Terminal 2: Eureka Server (port 8761)
java -jar eureka-server/target/eureka-server-1.0.0.jar

# Terminal 3: Notification Service (port 8083)
java -jar notification-service/target/notification-service-1.0.0.jar

# Terminal 4: IAM Service (port 8081)
java -jar iam-service/target/iam-service-1.0.0.jar

# Terminal 5: API Gateway (port 8090)
java -jar api-gateway/target/api-gateway-1.0.0.jar
```

---

## ✓ Verification Checklist

- [x] notification-service created with all required files
- [x] All classes use correct package: `com.ecotrack.notification`
- [x] Database configuration points to `ecotrack_notification`
- [x] NotificationController is removed from IAM service
- [x] NotificationService is removed from IAM service
- [x] FeignClient added to IAM service for inter-service communication
- [x] API Gateway routing updated to point to notification-service
- [x] Circuit breaker configuration added for notification-service
- [x] Parent pom.xml includes notification-service module
- [x] All endpoints remain unchanged (backward compatible)
- [x] Eureka discovery enabled for both services
- [x] Swagger documentation preserved in notification-service

---

## 🔗 Service Dependencies

**notification-service depends on:**
- Spring Boot 3.2.5
- Spring Cloud 2023.0.1
- MySQL (MySQL Connector/J)
- Spring Security
- Eureka Client
- SpringDoc OpenAPI

**IAM service now depends on:**
- Previous dependencies (unchanged)
- Spring Cloud OpenFeign (added)

---

## 📝 Database Migration

Create the notification database:
```sql
CREATE DATABASE IF NOT EXISTS ecotrack_notification;
```

JPA will auto-create tables based on `ddl-auto: update` setting in `application.yml`.

---

## 🎯 Testing Instructions

### Test Notification Service Directly:
```bash
# Create a notification
curl -X POST http://localhost:8083/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "entityId": 100,
    "message": "Test notification",
    "category": "GENERAL"
  }'

# Get all notifications
curl http://localhost:8083/api/v1/notifications

# Get user notifications
curl http://localhost:8083/api/v1/notifications/user/1
```

### Test via API Gateway:
```bash
# All routes should work through gateway (port 8090)
curl http://localhost:8090/api/v1/notifications
```

### Test IAM → Notification Communication:
If IAM service makes calls to notification-service via FeignClient, it will automatically route through Eureka service discovery.

---

## 🛠️ Troubleshooting

### Issue: notification-service not registering with Eureka
- **Solution:** Ensure Eureka server is running on `http://localhost:8761/eureka/`

### Issue: API Gateway returns 503 (Service Unavailable)
- **Solution:** Check if notification-service is running and registered with Eureka

### Issue: Database connection errors
- **Solution:** Verify MySQL is running and database `ecotrack_notification` is created

### Issue: FeignClient communication failing from IAM
- **Solution:** Ensure `@EnableFeignClients` is present in IamServiceApplication.java

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Clients                              │
└────────────┬──────────────────────────────────────────────────┬──┘
             │                                                  │
             │                                                  │
        ┌────▼──────────────────────────────────────────────────▼────┐
        │               API Gateway (port 8090)                      │
        │  ◆ Rate Limiter │ Circuit Breaker │ Retry                 │
        └────┬──────────────────────────────────────────────────┬────┘
             │                                                  │
             │ /api/v1/auth & /api/v1/users                    │ /api/v1/notifications
             │                                                  │
        ┌────▼──────────────────────────┐               ┌──────▼──────────────────────┐
        │   IAM Service (port 8081)     │               │ Notification Service (8083) │
        │ ◆ com.ecotrack.iam.*         │               │ ◆ com.ecotrack.notification.*
        │ ◆ Manages Users & Auth        │               │ ◆ Manages Notifications    │
        └────┬──────────────────────────┘               └──────┬──────────────────────┘
             │                                                 │
             │ (FeignClient)                                  │
             │ notify-service: localhost:8083                 │
             │                                                │
             └────────────────┬────────────────────────────────┘
                              │
                        ┌─────▼──────┐
                        │   Eureka   │
                        │  (8761)    │
                        └────────────┘
```

---

## 📌 Next Steps

1. **Test the migration:**
   - Start all services
   - Verify notification-service is registered in Eureka
   - Test notification endpoints via API Gateway

2. **Update documentation:**
   - Update API documentation to reflect new port/service ownership
   - Update deployment guides

3. **Monitor logs:**
   - Watch for any FeignClient communication issues
   - Verify circuit breaker metrics

4. **Performance testing:**
   - Load test the notification endpoints
   - Monitor response times and circuit breaker status

---

## 📞 Summary of Changes

| Component | Change | Impact |
|-----------|--------|--------|
| notification-service | Created | New microservice for notifications |
| iam-service | Notification files removed | Cleaner separation of concerns |
| api-gateway | Route updated | Notifications now routed to dedicated service |
| parent pom.xml | notification-service added | Part of multi-module build |
| Eureka | New service registration | notification-service auto-discovers |

**Migration Status: ✅ COMPLETE**

---

*Generated: May 3, 2026*
*EcoTrack Microservices - Notification Service Migration*


