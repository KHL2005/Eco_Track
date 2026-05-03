# Notification Service - Quick Reference Guide

## Service Information

| Property | Value |
|----------|-------|
| **Service Name** | notification-service |
| **Port** | 8083 |
| **Package** | com.ecotrack.notification |
| **Database** | ecotrack_notification (MySQL) |
| **Eureka** | Registered as "notification-service" |
| **API Base Path** | /api/v1/notifications |

---

## Directory Structure

```
notification-service/
├── src/main/java/com/ecotrack/notification/
│   ├── NotificationServiceApplication.java      # Main entry point
│   ├── controller/NotificationController.java   # REST endpoints
│   ├── service/NotificationService.java         # Business logic
│   ├── dto/
│   │   ├── NotificationRequest.java
│   │   └── NotificationResponse.java
│   ├── entity/Notification.java                 # JPA entity
│   ├── repository/NotificationRepository.java   # Data access
│   ├── enums/
│   │   ├── NotificationCategory.java
│   │   └── NotificationStatus.java
│   └── exception/
│       ├── GlobalExceptionHandler.java
│       └── ResourceNotFoundException.java
├── src/main/resources/
│   └── application.yml
└── pom.xml
```

---

## Key Classes

### NotificationController
- **Location:** `controller/NotificationController.java`
- **Endpoints:** 8 REST endpoints for notification management
- **Security:** Requires bearer token authentication

### NotificationService
- **Location:** `service/NotificationService.java`
- **Methods:**
  - `createNotification(NotificationRequest)` - Create new notification
  - `getAllNotifications()` - Get all notifications
  - `getByUser(userId)` - Get user's notifications
  - `getUnreadByUser(userId)` - Get unread notifications
  - `markAsRead(id)` - Mark notification as read
  - `markAsArchived(id)` - Archive notification
  - `markAllReadForUser(userId)` - Mark all user notifications as read
  - `deleteNotification(id)` - Delete notification

### Notification Entity
- **Location:** `entity/Notification.java`
- **Table:** notification
- **Key Fields:**
  - `notificationId` (PK, auto-increment)
  - `userId` (required, indexed)
  - `entityId` (optional)
  - `message` (required, text)
  - `category` (required, enum)
  - `status` (default: UNREAD, enum)
  - `createdDate` (auto-populated)

### NotificationCategory Enum
```
ISSUE, EMISSION, COMPLIANCE, PROJECT, AUDIT, GENERAL
```

### NotificationStatus Enum
```
UNREAD, READ, ARCHIVED
```

---

## API Endpoints

### 1. Create Notification
```
POST /api/v1/notifications
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": 1,
  "entityId": 100,
  "message": "Your notification message",
  "category": "GENERAL"
}

Response: 201 Created
{
  "notificationId": 1,
  "userId": 1,
  "entityId": 100,
  "message": "Your notification message",
  "category": "GENERAL",
  "status": "UNREAD",
  "createdDate": "2026-05-03T10:30:00"
}
```

### 2. Get All Notifications
```
GET /api/v1/notifications
Authorization: Bearer {token}

Response: 200 OK
[{notification objects}]
```

### 3. Get User's Notifications
```
GET /api/v1/notifications/user/{userId}
Authorization: Bearer {token}

Response: 200 OK
[{notification objects for userId}]
```

### 4. Get Unread Notifications
```
GET /api/v1/notifications/user/{userId}/unread
Authorization: Bearer {token}

Response: 200 OK
[{unread notification objects}]
```

### 5. Mark as Read
```
PATCH /api/v1/notifications/{id}/read
Authorization: Bearer {token}

Response: 200 OK
{notification object with status: READ}
```

### 6. Archive Notification
```
PATCH /api/v1/notifications/{id}/archive
Authorization: Bearer {token}

Response: 200 OK
{notification object with status: ARCHIVED}
```

### 7. Mark All as Read
```
PATCH /api/v1/notifications/user/{userId}/read-all
Authorization: Bearer {token}

Response: 200 OK
```

### 8. Delete Notification
```
DELETE /api/v1/notifications/{id}
Authorization: Bearer {token}

Response: 204 No Content
```

---

## Error Responses

### 404 Not Found
```json
{
  "timestamp": "2026-05-03T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Notification not found with id: 999"
}
```

### 400 Bad Request
```json
{
  "timestamp": "2026-05-03T10:30:00",
  "status": 400,
  "error": "Validation Failed",
  "message": "User ID is required; Category is required"
}
```

### 500 Internal Server Error
```json
{
  "timestamp": "2026-05-03T10:30:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Error message details"
}
```

---

## Using Notification Service from IAM

### Option 1: Via API Gateway
```java
// External call through API Gateway
URL: http://localhost:8090/api/v1/notifications
```

### Option 2: Via FeignClient (Internal)
```java
// From IAM service using NotificationClient
@Autowired
private NotificationClient notificationClient;

// Create notification
NotificationResponse response = notificationClient.createNotification(request);

// Get notifications
List<NotificationResponse> notifications = notificationClient.getByUser(userId);
```

---

## Database Schema

```sql
CREATE TABLE notification (
  notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  entity_id BIGINT,
  message TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'UNREAD',
  created_date DATETIME NOT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

---

## Configuration

### application.yml
```yaml
server:
  port: 8083

spring:
  application:
    name: notification-service
  datasource:
    url: jdbc:mysql://localhost:3306/ecotrack_notification
    username: root
    password: Chandreish@123

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

### pom.xml Dependencies
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- spring-boot-starter-security
- spring-boot-starter-validation
- spring-cloud-starter-netflix-eureka-client
- spring-cloud-starter-config
- mysql-connector-j
- lombok
- springdoc-openapi-starter-webmvc-ui

---

## Common Tasks

### Adding a New Notification Category
1. Update `NotificationCategory.java` enum
2. Redeploy the service
3. Existing notifications are unaffected

### Changing Database
1. Update `application.yml` datasource URL
2. Update database name in connection string
3. Ensure new database exists

### Adding Authentication Headers
- All requests require `Authorization: Bearer {JWT_TOKEN}` header
- Token validation is handled by Spring Security

---

## Deployment

### Docker (Future)
Service can be containerized using:
```dockerfile
FROM openjdk:21-slim
COPY target/notification-service-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Kubernetes (Future)
Service is compatible with Kubernetes deployment with proper:
- Service definitions
- Deployment manifests
- ConfigMaps for configuration

---

## Monitoring

### Actuator Endpoints
- Health: `GET http://localhost:8083/actuator/health`
- Metrics: `GET http://localhost:8083/actuator/metrics`

### Eureka Dashboard
- URL: `http://localhost:8761/`
- Verify notification-service is listed as "UP"

### Circuit Breaker Status (via Gateway)
- URL: `GET http://localhost:8090/actuator/circuitbreakers/notificationCB`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Service not found in Eureka | Verify Eureka server is running; check logs for registration issues |
| Database connection error | Ensure MySQL is running and database exists |
| 401 Unauthorized | Check JWT token validity and headers |
| 404 notification not found | Verify notification ID exists in database |
| Circuit breaker OPEN | Check notification-service health; circuit will auto-recover |

---

## Testing Examples

### Using cURL
```bash
# Create notification
curl -X POST http://localhost:8090/api/v1/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "message": "Test",
    "category": "GENERAL"
  }'

# Get notifications
curl http://localhost:8090/api/v1/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman
1. Import provided `EcoTrack Microservices.postman_collection.json`
2. Select notification endpoints
3. Set Authorization header with JWT token
4. Execute requests

---

## Notes

- All timestamps are in UTC (LocalDateTime format)
- Notifications are immutable after creation (no update endpoint)
- Deletion is soft (logical) or hard based on business requirements
- Status can only transition: UNREAD → READ or UNREAD → ARCHIVED
- Multiple notifications per user are supported
- Bulk operations use batch processing for performance

---

*Version: 1.0*
*Last Updated: May 3, 2026*


