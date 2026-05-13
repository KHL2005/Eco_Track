# 🏗️ EcoTrack Microservices Architecture - Complete Reference

**Date:** May 8, 2026  
**Project:** EcoTrack Environmental Monitoring & Sustainability Management System  
**Scope:** Eureka, Config Server, Service Discovery, JWT Validation Across Services

---

## 📋 Table of Contents

1. [Eureka Server (Service Registry)](#eureka-server-service-registry)
2. [Config Server (Centralized Configuration)](#config-server-centralized-configuration)
3. [Service Configuration & Registration](#service-configuration--registration)
4. [Full Startup Order](#full-startup-order)
5. [API Gateway Routes & Service Discovery](#api-gateway-routes--service-discovery)
6. [JWT Validation Across Services](#jwt-validation-across-services)
7. [System Architecture Diagram](#system-architecture-diagram)
8. [Troubleshooting & Failure Scenarios](#troubleshooting--failure-scenarios)

---

# EUREKA SERVER (SERVICE REGISTRY)

## Overview
Eureka is a service registry that enables:
- ✅ Services to register themselves
- ✅ API Gateway to discover services dynamically
- ✅ Load balancing with health checks
- ✅ Automatic failover if instance goes down

## 🔧 Configuration

### **File:** `Backend/eureka-server/src/main/resources/application.yml`

```yaml
server:
  port: 8761                    # ← Eureka runs on 8761

spring:
  application:
    name: eureka-server         # ← Service name (registers with itself)

eureka:
  instance:
    hostname: localhost         # ← Eureka hostname (used in URLs)
    
  client:
    register-with-eureka: false # ← Eureka doesn't register itself
    fetch-registry: false       # ← Eureka doesn't fetch registry
    service-url:
      defaultZone: http://localhost:8761/eureka/  # ← Registry URL
      
  server:
    wait-time-in-ms-when-sync-empty: 0  # ← Don't wait for sync (dev mode)
    enable-self-preservation: false     # ← Disable self-preservation (dev mode)
    # In production:
    # enable-self-preservation: true
    # This prevents Eureka from removing instances if heartbeats stop
```

## 🚀 Starting Eureka Server

### **Application Class:** `Backend/eureka-server/src/main/java/com/ecotrack/eureka/EurekaServerApplication.java`

```java
package com.ecotrack.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer  // ← Enables Eureka server
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

### **Start Command**

```bash
# From Backend directory
mvn spring-boot:run -pl eureka-server

# Or build and run JAR
mvn clean package -pl eureka-server -DskipTests
java -jar eureka-server/target/eureka-server-1.0.0.jar
```

### **Access Eureka Dashboard**

```
http://localhost:8761
```

Shows:
- ✅ Registered instances
- ✅ Instance status (UP, DOWN, OUT_OF_SERVICE)
- ✅ Availability zones
- ✅ General Info (name, version, etc.)

---

## 📊 Eureka Dashboard After Services Register

### **Expected Services**

```
Instances currently registered with Eureka
┌─────────────────────────────────────────────────────────┐
│ Application          │ AMI         │ Availability      │
├──────────────────────┼─────────────┼──────────────────┤
│ API-GATEWAY          │ n/a         │ (2) (2)           │
│ CONFIG-SERVER        │ n/a         │ (1)               │
│ IAM-SERVICE          │ n/a         │ (1)               │
│ NOTIFICATION-SERVICE │ n/a         │ (1)               │
│ CITIZEN-REPORTING... │ n/a         │ (1)               │
│ MONITORING-SERVICE   │ n/a         │ (1)               │
│ INDUSTRY-COMPLIANCE  │ n/a         │ (1)               │
│ PROJECT-MANAGEMENT   │ n/a         │ (1)               │
│ COMPLIANCE-AUDIT     │ n/a         │ (1)               │
└─────────────────────────────────────────────────────────┘
```

### **Clicking on a Service Shows Instances**

Example: Clicking "IAM-SERVICE" shows:

```
Instances of IAM-SERVICE:
┌─────────────────────────────────────────────┐
│ Status: UP (1) - Availability Zone: (1)     │
├──────────────────────────┬──────────────────┤
│ Instance URL             │ localhost:8081   │
│ Status Page URL          │ http://loc...    │
│ Health Check URL         │ http://loc...    │
│ Last Heartbeat           │ 5 seconds ago    │
│ Action                   │ [Edit | Delete]  │
└──────────────────────────┴──────────────────┘
```

---

## ❤️ Eureka Heartbeat & Lease Expiry (Default Settings)

```yaml
# Default settings (in eureka.instance.*)

leaseRenewalIntervalInSeconds: 30
# Services send heartbeat every 30 seconds
# If IAM-SERVICE stops sending heartbeats, Eureka waits 90 seconds before marking as DOWN

leaseExpirationDurationInSeconds: 90
# After 90 seconds of no heartbeat, instance marked as DOWN
# After 180 seconds (2 x 90), instance is evicted from registry
```

### **Heartbeat Flow**

```
TIME:     0s              30s             60s             90s
          │               │               │               │
IAM-Svc:  ├─ HB sent      ├─ HB sent      ├─ HB sent     ├─ HB sent ✓
          │               │               │               │
          ▼               ▼               ▼               ▼
Eureka:   └─ HB received ─┴─ HB received ─┴─ HB received ─┘
          Status: UP      Status: UP      Status: UP      Status: UP


IF SERVICE CRASHES:
TIME:     0s              30s             90s             180s
          │               │               │               │
IAM-Svc:  ├─ HB sent      └─ CRASHED      │               │
          │                               │               │
          ▼                               ▼               ▼
Eureka:   └─ HB received ──────── [WAITING] ───► DOWN ──► EVICTED
          Status: UP              Status: UP     (90s)   (180s total)
```

---

# CONFIG SERVER (CENTRALIZED CONFIGURATION)

## Overview
Config Server provides:
- ✅ Centralized configuration management
- ✅ Environment-specific properties (dev, prod)
- ✅ Secrets management (JWT secret, DB passwords)
- ✅ Dynamic configuration updates (no restart needed for some properties)

## 🔧 Configuration

### **File:** `Backend/config-server/src/main/resources/application.yml`

```yaml
server:
  port: 8888                    # ← Config Server runs on 8888

spring:
  application:
    name: config-server

  cloud:
    config:
      server:
        native:
          search-locations: classpath:/config-repo  # ← Property source
          
  profiles:
    active: native              # ← Use native (file-based) mode, not Git

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
      
  instance:
    prefer-ip-address: true
```

### **Why "native" Profile?**

```
In development (native):
├─ Config files stored locally in classpath:/config-repo
├─ No external Git repository needed
├─ Easy to edit and test locally
└─ ✓ Used in this project

In production (Git):
├─ Config files stored in remote Git repository
├─ Version controlled, audit trail
├─ Jenkins/automated deployment
├─ Config server pulls latest from Git
```

## 🗂️ Configuration Repository

### **Directory Structure**

```
Backend/config-server/src/main/resources/config-repo/
├── application.properties           ← Shared across all services
├── iam-service.properties           ← IAM-specific config
├── citizen-reporting-service.properties
├── notification-service.properties
├── environmental-monitoring-service.properties
├── industry-compliance-service.properties
├── project-management-service.properties
└── compliance-audit-service.properties
```

### **File 1: application.properties (Shared)** 

**Path:** `Backend/config-server/src/main/resources/config-repo/application.properties`

```ini
# ═══════════════════════════════════════════════════════════════
# SHARED CONFIGURATION (Applied to ALL services)
# ═══════════════════════════════════════════════════════════════

# ── JWT Configuration ─────────────────────────────────────────
jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
jwt.expiration=86400000

# ╔═══════════════════════════════════════════════════════════╗
# ║ IMPORTANT: This secret is shared across ALL services     ║
# ║ Every service can validate JWT tokens issued by any      ║
# ║ other service (they all use the SAME secret)             ║
# ╚═══════════════════════════════════════════════════════════╝

# ── Database Configuration ─────────────────────────────────────
spring.datasource.username=root
spring.datasource.password=Chandreish@123
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.open-in-view=false

# ── Swagger/OpenAPI Configuration ──────────────────────────────
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html

# ── Eureka Client Configuration ────────────────────────────────
eureka.client.serviceUrl.defaultZone=http://localhost:8761/eureka/
eureka.instance.prefer-ip-address=true
```

### **File 2: iam-service.properties (IAM-Specific)**

**Path:** `Backend/config-server/src/main/resources/config-repo/iam-service.properties`

```ini
# ═══════════════════════════════════════════════════════════════
# IAM SERVICE CONFIGURATION
# ═══════════════════════════════════════════════════════════════

# ── Service Port ───────────────────────────────────────────────
server.port=8081

# ── Database (IAM-specific database) ───────────────────────────
spring.datasource.url=jdbc:mysql://localhost:3306/ecotrack_iam?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC

# Note: username and password come from application.properties (shared)
```

### **File 3: citizen-reporting-service.properties (Citizen Service-Specific)**

**Path:** `Backend/config-server/src/main/resources/config-repo/citizen-reporting-service.properties`

```ini
# Service Port
server.port=8084

# Database (Citizen-specific database)
spring.datasource.url=jdbc:mysql://localhost:3306/ecotrack_citizen?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
```

## 🔄 Configuration Loading Order

### **How Services Load Configuration**

```
Service Application starts
      │
      ├─ 1. Check application.yml (service-specific, loaded first)
      │      └─ Contains: server.port, spring.cloud.config.uri
      │
      ├─ 2. spring.cloud.config.uri specified
      │      └─ "optional:configserver:http://localhost:8888"
      │          (optional = don't fail if config server is down)
      │
      ├─ 3. Bootstrap from Config Server
      │      ├─ Query: GET http://localhost:8888/application.properties
      │      ├─ Download: Shared properties (jwt.secret, db.username, etc.)
      │      │
      │      ├─ Query: GET http://localhost:8888/{service-name}.properties
      │      └─ Download: Service-specific properties (port, database URL, etc.)
      │
      ├─ 4. Merge properties (service-specific overrides shared)
      │      └─ Example:
      │         ├─ jwt.secret (from application.properties)
      │         ├─ server.port (from iam-service.properties, overrides)
      │         └─ spring.datasource.url (from iam-service.properties)
      │
      ├─ 5. Register with Eureka
      │      └─ POST http://localhost:8761/eureka/apps/{service-name}
      │         ├─ Instance ID: localhost:iam-service:8081
      │         ├─ Status: UP
      │         └─ Eureka now tracks the service
      │
      └─ 6. Service ready to receive requests
```

### **Priority Order (Lowest to Highest)**

```
1. ❌ Config Server (if down and marked optional) → Use defaults
2. ⭐ application.properties (repo/application.properties) ← SHARED
3. ⭐⭐ {service-name}.properties (repo/iam-service.properties) ← SERVICE-SPECIFIC
4. ⭐⭐⭐ application.yml (local file) ← SERVICE LOCAL
5. ⭐⭐⭐⭐ Environment variables ← HIGHEST
```

Example for IAM Service:

```
Shared (from config-server):
  jwt.secret = 404E635266...
  eureka.client.serviceUrl.defaultZone = http://localhost:8761/eureka/
  spring.datasource.username = root

Service-Specific (from config-server):
  server.port = 8081
  spring.datasource.url = jdbc:mysql://localhost:3306/ecotrack_iam?...

Local (from application.yml):
  spring.jpa.hibernate.ddl-auto = update

FINAL MERGED CONFIG FOR IAM SERVICE:
  jwt.secret = 404E635266...
  server.port = 8081
  spring.datasource.url = jdbc:mysql://localhost:3306/ecotrack_iam?...
  spring.datasource.username = root
  eureka.client.serviceUrl.defaultZone = http://localhost:8761/eureka/
  spring.jpa.hibernate.ddl-auto = update
```

---

# SERVICE CONFIGURATION & REGISTRATION

## How Each Service Connects to Config Server & Eureka

### **Template: application.yml for Any Service**

**Example: IAM Service**

**File:** `Backend/iam-service/src/main/resources/application.yml`

```yaml
server:
  port: 8081                              # ← Override in config-server if needed

spring:
  application:
    name: iam-service                    # ← Name for Eureka registration

  # ── CONFIG SERVER BOOTSTRAP ─────────────────────────────────
  config:
    import: "optional:configserver:http://localhost:8888"
    # ├─ Loads from Config Server at http://localhost:8888
    # ├─ optional: = don't fail if config server is down
    # └─ Eureka registered services can still be discovered

  cloud:
    config:
      override-none: true                # ← Local config cannot override server config
      allow-override: true               # ← Config server can be overridden by...
      override-system-properties: false  # ← ...but not system properties

  # ── DATABASE (OVERRIDDEN BY CONFIG SERVER) ─────────────────
  datasource:
    url: jdbc:mysql://localhost:3306/ecotrack_iam?...
    username: root                       # ← From config-server
    password: admin                      # ← From config-server
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    open-in-view: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect

# ── JWT CONFIGURATION (FROM CONFIG SERVER) ────────────────────
jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration: 86400000

# ── EUREKA CLIENT REGISTRATION ────────────────────────────────
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/  # ← Eureka server URL
      
  instance:
    prefer-ip-address: true              # ← Use IP instead of hostname

# ── ACTUATOR (Health & Monitoring) ────────────────────────────
management:
  endpoints:
    web:
      exposure:
        include: health,info
```

### **Service Registration Flow**

```
IAM Service starts
│
└─ 1. Read application.yml
   ├─ spring.application.name = "iam-service"
   ├─ server.port = 8081
   └─ spring.config.import = "configserver:http://localhost:8888"
   
└─ 2. Connect to Config Server (8888)
   ├─ GET http://localhost:8888/application.properties
   ├─ GET http://localhost:8888/iam-service.properties
   └─ Merge into Spring Environment
   
└─ 3. Register with Eureka (8761)
   ├─ POST /eureka/apps/iam-service
   ├─ Payload:
   │  {
   │    "instance": {
   │      "instanceId": "localhost:iam-service:8081",
   │      "hostName": "localhost",
   │      "app": "IAM-SERVICE",
   │      "ipAddr": "127.0.0.1",
   │      "port": {
   │        "$": 8081,
   │        "@enabled": "true"
   │      },
   │      "status": "UP",
   │      "leaseInfo": {
   │        "renewalIntervalInSecs": 30,
   │        "durationInSecs": 90
   │      }
   │    }
   │  }
   └─ Response: 204 No Content (Success)
   
└─ 4. Start listening on port 8081
   ├─ Ready to handle /api/v1/auth/register
   ├─ Ready to handle /api/v1/auth/login
   └─ Ready to receive authenticated requests
```

---

# FULL STARTUP ORDER

## 🚀 Correct Sequence to Start All Services

### **Step 1: Start Eureka Server (FIRST)**

```bash
cd C:\Users\2479746\Documents\Project\Backend

# Terminal 1: Start Eureka
mvn spring-boot:run -pl eureka-server

# Wait for message: "Tomcat started on port(s): 8761"
# Then access: http://localhost:8761
# You should see "Eureka Server" but NO instances registered yet
```

**Why first?**
- ✅ Other services need to register with Eureka
- ✅ If Eureka is not up, services will fail registration (even with optional config)

### **Step 2: Start Config Server (SECOND)**

```bash
# Terminal 2: Start Config Server
mvn spring-boot:run -pl config-server

# Wait for message: "Tomcat started on port(s): 8888"
# Access: http://localhost:8888/application.properties
# You should see shared configuration
```

**Why second?**
- ✅ All microservices depend on this for configuration
- ✅ If Config Server is down, services use fallback (but JWT secret might not be available)
- ✅ Config Server itself registers with Eureka

### **Step 3: Start IAM Service (THIRD)**

```bash
# Terminal 3: Start IAM Service
mvn spring-boot:run -pl iam-service

# Wait for message: "Started IamServiceApplication"
# Check Eureka: http://localhost:8761/
# You should see IAM-SERVICE now listed as UP
```

**Required?**
- ✅ Essential for REGISTER and LOGIN flows
- ✅ Parent service (other services may call IAM for user validation)

### **Step 4: Start API Gateway (FOURTH)**

```bash
# Terminal 4: Start API Gateway
mvn spring-boot:run -pl api-gateway

# Wait for message: "Started ApiGatewayApplication"
# Check Eureka: http://localhost:8761/
# You should see API-GATEWAY now listed as UP
# Reload to verify all services registered
```

**Why after IAM?**
- ✅ Gateway discovers IAM-SERVICE from Eureka
- ✅ If IAM hasn't registered yet, gateway might fail health check
- ✅ To route /api/v1/auth/register and /api/v1/auth/login, requires iam-service

### **Step 5: Start Other Microservices (Optional, in any order)**

```bash
# Terminal 5+: Start remaining services (if needed)
mvn spring-boot:run -pl notification-service
mvn spring-boot:run -pl citizen-reporting-service
mvn spring-boot:run -pl environmental-monitoring-service
# ... etc
```

### **Step 6: Start Frontend (Optional)**

```bash
# Terminal X: Start Frontend
cd Frontend
npm run dev

# Access: http://localhost:3000
```

---

## 📊 Startup Dependency Graph

```
┌────────────────────────────────────────────────────────────┐
│                    EUREKA SERVER (8761)                    │
│                      START FIRST!!                          │
├─────────────────────────────────────────────────────────────┤
│ • Service Registry                                          │
│ • Tracks all service instances                             │
│ • No dependencies (standalone)                             │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    │ (depends on)
                    ▼
┌────────────────────────────────────────────────────────────┐
│                  CONFIG SERVER (8888)                      │
│                    START SECOND!!                           │
├─────────────────────────────────────────────────────────────┤
│ • Provides centralized config                              │
│ • Registers itself with Eureka                             │
│ • Dependency: Eureka (to register)                         │
└───────────────┬──────────────────┬──────────────────────────┘
                │                  │
                │ (depends on)     │ (depends on)
                ▼                  ▼
    ┌──────────────────────┐   ┌──────────────────────┐
    │   IAM SERVICE (8081) │   │ API GATEWAY (8090)   │
    │    START THIRD!!     │   │  START FOURTH!!      │
    ├──────────────────────┤   ├──────────────────────┤
    │ • User auth          │   │ • Request routing    │
    │ • JWT generation     │   │ • Rate limiting      │
    │ • Dependencies:      │   │ • Circuit breaker    │
    │  ├─ Eureka           │   │ • Dependencies:      │
    │  └─ Config Server    │   │  ├─ Eureka           │
    └──────────────────────┘   │  ├─ Config Server    │
            ▲                  │  └─ IAM Service      │
            │                  └──────────────────────┘
            │
            │ (depends on for login/register)
            │
    ┌──────────────────────────────────────────────────┐
    │         OTHER MICROSERVICES (Optional)           │
    │                                                  │
    │ • Notification Service (8083)                   │
    │ • Citizen Reporting Service (8084)              │
    │ • Environmental Monitoring (8085)               │
    │ • Industry Compliance (8086)                    │
    │ • Project Management (8087)                     │
    │ • Compliance Audit (8088)                       │
    │                                                  │
    │ Dependencies: Eureka + Config Server            │
    └──────────────────────────────────────────────────┘
```

---

## ⏱️ Startup Timing Example

```
TIME    ACTION                              SERVICE STATUS

00:00   Start Eureka                        EUREKA: UP ✓
        (Wait: "Tomcat started on port 8761")

00:05   Start Config Server                 EUREKA: UP ✓
        (Wait: "Started ConfigServerApplication")
                                            CONFIG: UP ✓

00:10   Start IAM Service                   EUREKA: UP ✓, CONFIG: UP ✓
        (Wait: "Started IamServiceApplication")
                                            IAM: Registering... ⏳
                                            
00:11   [Eureka shows IAM-SERVICE as UP]    EUREKA: UP ✓
                                            CONFIG: UP ✓, IAM: UP ✓

00:15   Start API Gateway                   EUREKA: UP ✓
        (Wait: "Started ApiGatewayApplication")
                                            GATEWAY: Discovering routes ⏳
                                            
00:16   [Eureka shows API-GATEWAY as UP]    EUREKA: UP ✓
                                            CONFIG: UP ✓, IAM: UP ✓
                                            GATEWAY: UP ✓

00:20   READY FOR TESTING!                  ✓ All up and ready
        • POST /api/v1/auth/register works
        • POST /api/v1/auth/login works
        • API Gateway routes requests
```

---

# API GATEWAY ROUTES & SERVICE DISCOVERY

## 📍 Complete Route Map

### **File:** `Backend/api-gateway/src/main/java/com/ecotrack/gateway/config/GatewayConfig.java`

```java
@Bean
public RouteLocator routeLocator(RouteLocatorBuilder builder) {
  
  // ═══════════════════════════════════════════════════════════
  // SERVICE ROUTING TABLE
  // ═══════════════════════════════════════════════════════════

  //  ┌─ IAM SERVICE  (Port 8081) ─┐
  //  │ Handles authentication      │
  //  │ Users registration/login    │
  //  └─────────────────────────────┘
  
  .route("iam-auth",
      r -> r.path("/api/v1/auth/**")           // ← /register, /login
            .filters(f -> applyFilters(f, "iamCB", "/fallback/iam"))
            .uri("lb://iam-service"))           // ← Load balance to iam-service
  
  .route("iam-users",
      r -> r.path("/api/v1/users/**")          // ← /users/*, /profile, etc.
            .filters(f -> applyFilters(f, "iamCB", "/fallback/iam"))
            .uri("lb://iam-service"))
  
  //  ┌─ NOTIFICATION SERVICE  (Port 8083) ─┐
  //  │ Sends notifications                   │
  //  └────────────────────────────────────────┘
  
  .route("notification-notifications",
      r -> r.path("/api/v1/notifications/**")
            .filters(f -> applyFilters(f, "notificationCB", "/fallback/notification"))
            .uri("lb://notification-service"))
  
  //  ┌─ CITIZEN REPORTING SERVICE  (Port 8084) ─┐
  //  │ Citizens report issues                     │
  //  └──────────────────────────────────────────┘
  
  .route("citizen-issues",
      r -> r.path("/api/v1/issues/**")
            .filters(f -> applyFilters(f, "citizenCB", "/fallback/citizen"))
            .uri("lb://citizen-reporting-service"))
  
  //  ┌─ ENVIRONMENTAL MONITORING SERVICE  (Port 8085) ─┐
  //  │ Sensor data, analysis, CSV uploads              │
  //  └───────────────────────────────────────────────┘
  
  .route("monitoring-sensors",
      r -> r.path("/api/v1/sensors/**")
            .filters(f -> applyFilters(f, "monitoringCB", "/fallback/monitoring"))
            .uri("lb://environmental-monitoring-service"))
  
  .route("monitoring-sensor-data",
      r -> r.path("/api/v1/sensor-data/**")
            .filters(f -> applyFilters(f, "monitoringCB", "/fallback/monitoring"))
            .uri("lb://environmental-monitoring-service"))
  
  .route("monitoring-analysis",
      r -> r.path("/api/v1/analysis/**")
            .filters(f -> applyFilters(f, "monitoringCB", "/fallback/monitoring"))
            .uri("lb://environmental-monitoring-service"))
  
  .route("monitoring-csv",
      r -> r.path("/api/v1/upload-csv/**")
            .filters(f -> applyFilters(f, "monitoringCB", "/fallback/monitoring"))
            .uri("lb://environmental-monitoring-service"))
  
  //  ┌─ INDUSTRY COMPLIANCE SERVICE  (Port 8086) ─┐
  //  │ Emissions, industry documents               │
  //  └──────────────────────────────────────────┘
  
  .route("industry-emissions",
      r -> r.path("/api/v1/emissions/**")
            .filters(f -> applyFilters(f, "industryCB", "/fallback/industry"))
            .uri("lb://industry-compliance-service"))
  
  .route("industry-documents",
      r -> r.path("/api/v1/industry-documents/**")
            .filters(f -> applyFilters(f, "industryCB", "/fallback/industry"))
            .uri("lb://industry-compliance-service"))
  
  //  ┌─ PROJECT MANAGEMENT SERVICE  (Port 8087) ─┐
  //  │ Projects, reports                           │
  //  └──────────────────────────────────────────┘
  
  .route("project-projects",
      r -> r.path("/api/v1/projects/**")
            .filters(f -> applyFilters(f, "projectCB", "/fallback/project"))
            .uri("lb://project-management-service"))
  
  .route("project-reports",
      r -> r.path("/api/v1/reports/**")
            .filters(f -> applyFilters(f, "projectCB", "/fallback/project"))
            .uri("lb://project-management-service"))
  
  //  ┌─ COMPLIANCE AUDIT SERVICE  (Port 8088) ─┐
  //  │ Compliance records, audits                 │
  //  └───────────────────────────────────────────┘
  
  .route("compliance-records",
      r -> r.path("/api/v1/compliance/**")
            .filters(f -> applyFilters(f, "complianceCB", "/fallback/compliance"))
            .uri("lb://compliance-audit-service"))
  
  .route("compliance-audits",
      r -> r.path("/api/v1/audits/**")
            .filters(f -> applyFilters(f, "complianceCB", "/fallback/compliance"))
            .uri("lb://compliance-audit-service"))

  return b.build();
}
```

## 🔍 How Service Discovery Works: `lb://iam-service`

### **Flow: Request to Discovered Service**

```
Browser Request:
POST http://localhost:3000/api/v1/auth/register

      ↓
      
Vite Proxy (Dev):
POST http://localhost:8090/api/v1/auth/register

      ↓
      
API Gateway (8090):
┌────────────────────────────────────────────────────┐
│ RouteLocator checks path="/api/v1/auth/**"        │
│ Match: "iam-auth" route                            │
│ URI: "lb://iam-service"                            │
│                                                    │
│ "lb" = Load Balancer                              │
│ "iam-service" = Service name to discover          │
└────────────────────────────────────────────────────┘

      ↓
      
Eureka Client (in API Gateway):
┌────────────────────────────────────────────────────┐
│ Query Eureka server:                               │
│ GET http://localhost:8761/eureka/apps/iam-service  │
│                                                    │
│ Response:
│ {
│   "application": {
│     "name": "IAM-SERVICE",
│     "instance": [
│       {
│         "instanceId": "localhost:iam-service:8081",
│         "hostName": "localhost",
│         "ipAddr": "127.0.0.1",
│         "port": 8081,
│         "status": "UP"
│       }
│     ]
│   }
│ }
└────────────────────────────────────────────────────┘

      ↓
      
Load Balance:
"localhost:iam-service:8081" (only 1 instance, so use it)

      ↓
      
Replace Route URI:
Transform: POST http://localhost:8090/api/v1/auth/register
      ↓↓↓
      POST http://localhost:8081/api/v1/auth/register

      ↓
      
Forward Request to IAM Service (8081)
```

### **Load Balancing with Multiple Instances**

If 2 instances of iam-service were registered:

```
Eureka Response:
{
  "application": {
    "instance": [
      {
        "instanceId": "localhost:iam-service:8081",
        "ipAddr": "127.0.0.1",
        "port": 8081,
        "status": "UP"
      },
      {
        "instanceId": "instance-2:iam-service:8081",
        "ipAddr": "192.168.1.100",
        "port": 8081,
        "status": "UP"
      }
    ]
  }
}

Load Balancer (Default: Round Robin):
Request 1 → 127.0.0.1:8081
Request 2 → 192.168.1.100:8081
Request 3 → 127.0.0.1:8081
Request 4 → 192.168.1.100:8081
...
```

---

# JWT VALIDATION ACROSS SERVICES

## 🔐 Shared JWT Secret

### **JWT Secret is Shared**

All services use the same JWT secret:

```ini
# config-server/src/main/resources/config-repo/application.properties
jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
```

**Implications:**
- ✅ Token issued by IAM service can be validated by ANY service
- ✅ Each service can independently verify JWT signature
- ✅ No per-service validation call needed
- ✓ Stateless authentication across microservices

## 📋 JWT Validation Flow

### **Scenario: After Login, User Accesses Citizen Service**

```
┌─ Step 1: User Login (IAM Service) ──────────────────┐
│                                                      │
│ Frontend POSTs to:                                   │
│ POST /api/v1/auth/login                              │
│ { email, password }                                  │
│                                                      │
│ IAM Service issues JWT:                              │
│ {                                                    │
│   "alg": "HS256",                                    │
│   "typ": "JWT"                                       │
│ }.{                                                  │
│   "sub": "john@example.com",                         │
│   "role": "CITIZEN",                                 │
│   "userId": 1,                                       │
│   "exp": 1715221200                                  │
│ }.HMAC_SHA256(                                       │
│   payload,                                           │
│   "404E635266..." ← shared secret                    │
│ )                                                    │
│                                                      │
│ Token stored in browser localStorage                │
└──────────────────────────────────────────────────────┘

┌─ Step 2: Frontend Stores Token ─────────────────────┐
│                                                      │
│ localStorage['ecotrack_auth'] = {                    │
│   "token": "eyJ...",                                 │
│   "userId": 1,                                       │
│   "email": "john@example.com",                       │
│   "role": "CITIZEN",                                 │
│   "name": "John Doe"                                 │
│ }                                                    │
└──────────────────────────────────────────────────────┘

┌─ Step 3: User Calls Citizen Service ────────────────┐
│                                                      │
│ Frontend creates new request:                        │
│ POST /api/v1/issues { title, description }           │
│                                                      │
│ axiosInstance interceptor runs:                      │
│ ├─ Read token from localStorage                      │
│ ├─ Add header: "Authorization: Bearer eyJ..."        │
│ └─ Send request                                      │
│                                                      │
│ Request goes to:                                     │
│ POST http://localhost:3000/api/v1/issues             │
│   Header: Authorization: Bearer eyJ...               │
└──────────────────────────────────────────────────────┘

┌─ Step 4: Vite Proxy → API Gateway ──────────────────┐
│                                                      │
│ Vite redirects to:                                   │
│ POST http://localhost:8090/api/v1/issues             │
│   Header: Authorization: Bearer eyJ...               │
│                                                      │
│ API Gateway receives request                         │
│ ├─ Checks path "/api/v1/issues/**"                   │
│ ├─ Matches route: "citizen-issues"                   │
│ ├─ Applies filters (rate limit, CB, retry)           │
│ └─ Forwards to: lb://citizen-reporting-service      │
└──────────────────────────────────────────────────────┘

┌─ Step 5: API Gateway → Discover Service ────────────┐
│                                                      │
│ Load balancer resolves:                              │
│ lb://citizen-reporting-service                       │
│   ↓ (Query Eureka)                                   │
│ citizen-reporting-service is at 127.0.0.1:8084      │
│                                                      │
│ Forward to:                                          │
│ POST http://127.0.0.1:8084/api/v1/issues             │
│   Header: Authorization: Bearer eyJ...               │
└──────────────────────────────────────────────────────┘

┌─ Step 6: Citizen Service Receives Request ──────────┐
│                                                      │
│ Citizen Service (8084):                              │
│ ├─ JwtAuthFilter intercepts request                  │
│ ├─ Extracts "Bearer eyJ..." from header              │
│ ├─ Calls JwtUtil.extractUsername(token)              │
│ │  ├─ Parses token using same secret                 │
│ │  ├─ Verifies signature:                            │
│ │  │  newSig = HMAC_SHA256(payload, secret)          │
│ │  │  if (newSig == tokenSig) ✓                      │
│ │  ├─ Checks expiration:                             │
│ │  │  if (exp < now()) ✓                             │
│ │  └─ Extracts "sub" = "john@example.com"            │
│ │                                                    │
│ ├─ NO CALL TO IAM SERVICE for validation!            │
│ │  (Each service validates independently)            │
│ │                                                    │
│ ├─ Loads UserDetails from database:                  │
│ │  SELECT * FROM users WHERE email = 'john@...'      │
│ │                                                    │
│ ├─ Sets SecurityContext:                             │
│ │  authenticated = true                              │
│ │  user = john@example.com                           │
│ │  role = CITIZEN                                    │
│ │                                                    │
│ └─ Request continues to controller (authenticated)   │
└──────────────────────────────────────────────────────┘

┌─ Step 7: Process Request ──────────────────────────┐
│                                                     │
│ CitizenController.createIssue(@Valid request) {     │
│   String email = SecurityContextHolder               │
│     .getContext()                                    │
│     .getAuthentication()                             │
│     .getName();                                      │
│   // email = "john@example.com"                      │
│                                                     │
│   // Create issue for this user...                   │
│   Issue issue = Issue.builder()                      │
│     .title(request.getTitle())                       │
│     .description(request.getDescription())           │
│     .citizenEmail(email)                             │
│     .build();                                        │
│                                                     │
│   repository.save(issue);                            │
│   return ResponseEntity.ok(issue);                   │
│ }                                                    │
└──────────────────────────────────────────────────────┘

┌─ Step 8: Response → Gateway → Frontend ────────────┐
│                                                     │
│ Citizen Service returns:                             │
│ HTTP 201 Created                                     │
│ {                                                    │
│   "issueId": 123,                                    │
│   "title": "...",                                    │
│   "citizen": "john@example.com"                      │
│ }                                                    │
│                                                     │
│ Response flows back through:                         │
│ Service 8084 → Gateway 8090 → Vite 3000 → Browser   │
└──────────────────────────────────────────────────────┘
```

## 🔑 Key Points: JWT Validation Architecture

### **Each Service Validates Independently**

```
Centralized Auth (❌ NOT used):
┌──────────────┐
│ IAM Service  │ ← Every request validates here
└──────────────┘
      ↑
      │ Every service queries IAM
      │
┌──────────────────────────────────────┐
│ Other Services | Other Services | ...│
└──────────────────────────────────────┘

Problems:
• IAM becomes bottleneck
• Latency for every request to ANY service
• Single point of failure
• Doesn't scale


Distributed Auth (✅ USED):
┌─────────────────────────────────────────────────────┐
│ Shared JWT Secret (in Config Server)                │
│ jwt.secret = 404E635266...                          │
└─────────────────────────────────────────────────────┘
       │
       ├─→ IAM Service validates (on login)
       │   └─ Generates token with secret
       │
       ├─→ Citizen Service validates (own check)
       │   └─ Verifies signature with SAME secret
       │
       ├─→ Monitoring Service validates (own check)
       │   └─ Verifies signature with SAME secret
       │
       └─→ Any Service validates independently
           └─ All have SAME secret, can verify ANY token

Advantages:
• No inter-service calls for validation
• Scales horizontally (each service validates)
• Low latency (local verification)
• Resilient (works even if IAM is down)
```

### **JWT Validation Code in Each Service**

Every microservice has identical JWT validation code:

**File Template:** `{service}/src/main/java/com/ecotrack/{service}/security/JwtAuthFilter.java`

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  
  @Autowired
  private JwtUtil jwtUtil;  // Same JwtUtil as IAM
  
  @Autowired
  private UserDetailsService userDetailsService;
  
  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {
    
    try {
      // Extract JWT from header
      String authHeader = request.getHeader("Authorization");
      if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        filterChain.doFilter(request, response);
        return;
      }
      
      String jwt = authHeader.substring(7);
      
      // Extract and validate (using SHARED SECRET)
      String email = jwtUtil.extractUsername(jwt);
      
      // Verify signature & expiration using same secret
      if (jwtUtil.isTokenValid(jwt, userDetails)) {
        // Token is valid → set authentication
        SecurityContextHolder
          .getContext()
          .setAuthentication(...);
      }
      
    } catch (Exception e) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }
    
    filterChain.doFilter(request, response);
  }
}
```

---

# SYSTEM ARCHITECTURE DIAGRAM

## Complete System Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         ECOTRACK MICROSERVICES SYSTEM                      │
│                         (May 8, 2026 - Production)                         │
└────────────────────────────────────────────────────────────────────────────┘

                           ┌─────────────┐
                           │  BROWSER    │
                           │ :3000       │
                           └──────┬──────┘
                                  │
                          Vite Dev Proxy
                           /api → :8090
                                  │
                    ┌─────────────▼─────────────────────┐
                    │     API GATEWAY (8090)            │
                    │  Spring Cloud Gateway             │
                    ├───────────────────────────────────┤
                    │ • Rate Limiting (Redis) 20req/s   │
                    │ • Circuit Breaker (Resilience4j)  │
                    │ • Retry (GET only, 2 attempts)    │
                    │ • Service Discovery (Eureka)      │
                    │ • JWT Validation                  │
                    └──────────┬──────────────────────┬─┘
                               │                      │
          lb://iam-service    │                      │  lb://citizen-...
                               │                      │
                        ┌──────▼────┐        ┌───────▼──────┐
                        │    IAM     │        │  CITIZEN     │
                        │  SERVICE   │        │  REPORTING   │
                        │   (8081)   │        │   (8084)     │
                        ├────────────┤        ├──────────────┤
                        │ • Auth     │        │ • Issues     │
                        │ • JWT Gen  │        │ • Validation │
                        │ • Users    │        │              │
                        └──────┬─────┘        └───────┬──────┘
                               │                     │
                        DB [ecotrack_iam]   DB [ecotrack_citizen]


═══════════════════════════════════════════════════════════════════════════
                          INFRASTRUCTURE TIER
═══════════════════════════════════════════════════════════════════════════

    ┌────────────────────────────┐
    │   EUREKA SERVER (8761)      │
    │  Spring Cloud Netflix       │
    ├────────────────────────────┤
    │ • Service Registry          │
    │ • Health Heartbeats (30s)   │
    │ • Lease Expiry (90s)        │
    │                             │
    │ Registered Services:        │
    │ ├─ api-gateway:8090         │
    │ ├─ config-server:8888       │
    │ ├─ iam-service:8081         │
    │ ├─ citizen-service:8084     │
    │ ├─ monitoring-service:8085  │
    │ ├─ industry-service:8086    │
    │ ├─ project-service:8087     │
    │ ├─ compliance-service:8088  │
    │ └─ notification-service:...  │
    └────────────────────────────┘
             ▲
             │ (services register)
             │


    ┌────────────────────────────┐
    │  CONFIG SERVER (8888)       │
    │  Spring Cloud Config        │
    ├────────────────────────────┤
    │ • Centralized Config        │
    │ • Property Source: Native   │
    │   (classpath:/config-repo)  │
    │                             │
    │ Config Files:              │
    │ ├─ application.properties  │
    │ │  ├─ jwt.secret (shared)  │
    │ │  ├─ jwt.expiration       │
    │ │  ├─ DB credentials       │
    │ │  ├─ Eureka URL           │
    │ │  └─ Swagger config       │
    │ ├─ iam-service.properties  │
    │ │  ├─ server.port = 8081   │
    │ │  └─ DB URL               │
    │ └─ {service}.properties    │
    │    └─ Per-service configs  │
    └────────────────────────────┘
             ▲
             │ (all services fetch config on startup)
             │


    ┌────────────────────────────┐
    │  REDIS (6379) - Optional   │
    │  (For rate limiter state)  │
    ├────────────────────────────┤
    │ • Distributed rate limit   │
    │ • Token bucket store       │
    │ • Scales horizontally      │
    │ • Used by: API Gateway     │
    └────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                        DATABASE TIER (MySQL 3306)
═══════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────┐
    │ ecotrack_iam          | ecotrack_citizen              │
    │ ├─ users            │ ├─ issues                      │
    │ ├─ audit_logs       │ ├─ issue_attachments           │
    │ └─ ...              │ └─ ...                         │
    │                     │                                 │
    │ ecotrack_monitoring | ecotrack_industry              │
    │ ├─ sensors          │ ├─ emissions                   │
    │ ├─ sensor_data      │ ├─ industry_docs               │
    │ └─ ...              │ └─ ...                         │
    └─────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                    REQUEST FLOW EXAMPLE: REGISTER
═══════════════════════════════════════════════════════════════════════════

Browser                API Gateway               IAM Service
  │                        │                         │
  ├──POST /register───────>│                         │
  │                        ├──[Path Match]           │
  │                        │  /api/v1/auth/**        │
  │                        │                         │
  │                        ├──[Rate Limiter]         │
  │                        │  Redis check            │
  │                        │  ✓ quota ok             │
  │                        │                         │
  │                        ├──[Circuit Breaker]      │
  │                        │  Eureka → iam-service   │
  │                        │  Status: UP             │
  │                        │  ✓ Allow                │
  │                        │                         │
  │                        ├──POST /register───────>│
  │                        │  Authorization: Bearer  │
  │                        │  (no token yet)         │
  │                        │                         │
  │                        │                         ├──[Validation]
  │                        │                         │  @Valid on DTO
  │                        │                         │  Name, email,
  │                        │                         │  phone, password
  │                        │                         │
  │                        │                         ├──[Hash Password]
  │                        │                         │  BCrypt encode
  │                        │                         │
  │                        │                         ├──[Save to DB]
  │                        │                         │  INSERT users
  │                        │                         │
  │                        │                         ├──[Generate JWT]
  │                        │                         │  HMAC_SHA256
  │                        │                         │  Shared secret
  │                        │                         │
  │                        │<──201 Created────────────
  │                        │   { token, userId, ... }│
  │                        │                         │
  │<──201 Created──────────│                         │
  │   { token, userId, ... }                        │
  │                                                 │
  └──localStorage.setItem────────────────────────────
     ecotrack_auth


═══════════════════════════════════════════════════════════════════════════
                    CONFIG PRI ORITY & SERVICE STARTUP
═══════════════════════════════════════════════════════════════════════════

1. Eureka Server
   └─ No dependencies, starts first

2. Config Server
   └─ Registers with Eureka (already started)

3. IAM Service
   ├─ Connects to Config Server
   │  ├─ GET http://localhost:8888/application.properties
   │  │  (jwt.secret, eureka.client.url, etc.)
   │  └─ GET http://localhost:8888/iam-service.properties
   │     (server.port=8081, jdbc:mysql://...8081...)
   │
   ├─ Registers with Eureka
   │  └─ POST http://localhost:8761/eureka/apps/iam-service
   │
   └─ Ready on port 8081

4. API Gateway
   ├─ Connects to Config Server
   └─ Registers with Eureka
   └─ Discovers iam-service via Eureka
   └─ Ready on port 8090

5. Other Services (optional)
   └─ Same as steps 3-4
```

---

# TROUBLESHOOTING & FAILURE SCENARIOS

## ⛔ What if Eureka is down?

### **Scenario: Start IAM Service without Eureka**

```bash
# Terminal 1: Eureka (NOT STARTED)
# Terminal 2: Start IAM Service
mvn spring-boot:run -pl iam-service
```

**Result:**
```
[ERROR] Failed to connect to Eureka at http://localhost:8761/eureka
[WARN] Application is running but NOT registered with service registry

IAM Service still starts and works:
✓ Can bind to port 8081
✓ Can receive direct requests: http://localhost:8081/api/v1/auth/...
✗ CANNOT be discovered by API Gateway (not in registry)
✗ Cannot be found by load balancer
```

**Fix:**
```
Start Eureka first, then IAM Service will auto-register
```

---

## ⛔ What if Config Server is down?

### **Scenario: Start IAM Service without Config Server**

```bash
# Terminal 1: Eureka (started)
# Terminal 2: Config Server (NOT STARTED)
# Terminal 3: Start IAM Service
mvn spring-boot:run -pl iam-service
```

**Result (with optional flag in application.yml):**
```
[ERROR] Failed to connect to config server at http://localhost:8888
[WARN] Config server connection failed, using local fallback

IAM Service:
✓ Starts with local application.yml values
✓ jwt.secret still available (locally defined)
✓ Can register with Eureka
✗ Some properties might be overridden versions
```

**What's missing:**
```
jwt.secret: LOCALLY defined ✓
eureka.client.url: LOCALLY defined ✓
server.port: LOCALLY defined ✓
spring.datasource.url: LOCALLY defined ✓

So IAM service functions WITHOUT config server!
```

**However, this is a development convenience. In production:**
```
spring.cloud.config.fail-fast: true
# ↓ Causes service to FAIL if config server is unreachable
# This ensures production uses centralized config only
```

---

## ⛔ What if both Config Server and Eureka are down?

### **Result:**
```
IAM Service fails to:
✗ Fetch centralized config
✗ Register with Eureka
✗ Discover other services

BUT:
✓ Service might still start locally (if local config present)
✓ Can respond to direct requests on localhost:8081
✓ Cannot be called from API Gateway (not discoverable)
```

---

## ⛔ JWT Secret Mismatch

### **Scenario 1: Service uses different secret**

```yaml
# Service A (IAM)
jwt.secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970

# Service B (Citizen) - accidentally different
jwt.secret: DIFFERENT_WRONG_SECRET_HERE_12345678901234567890
```

**Result:**
```
IAM Service issues JWT with Secret A
Citizen Service tries to validate with Secret B

Validation: FAILS!

Token signature verification:
- Recalculated: HMAC_SHA256(payload, SecretB) ≠ Stored signature
- Result: 401 Unauthorized
```

**Fix:**
```yaml
# Both services in config-server:
jwt.secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
# ↑ IDENTICAL across all services
```

---

## ⛔ Circuit Breaker Opens (Service Down)

### **Scenario: IAM Service crashes**

```
TIME:     0m              2m              5m
          │               │               │
IAM:      ├─ Running ✓    ├─ CRASHED ✗    ├─ Still down
          │               └─ Errors       │
          │
Gateway:  │ ┌─ Monitors failures        │
          ├─ 5 failures → 50% rate      ├─ Circuit OPENS!
          │   threshold met             │   Response: 503
          │                             │   (or fallback)
          │
Request:  ├─ ✓ 200 OK     ├─ ✗ 502        ├─ ✗ 503
          │                 │               │ Forwarded to:
          │                 │               │ /fallback/iam
          │                 │               └─ Static response
          │
          └─ User sees:   └─ User sees:  └─ User sees:
            ✓ Success       ✗ 502 Bad      ✗ Service Unavailable
                            Gateway
```

### **Recovery:**

```
TIME:     5m              6m              7m
          │               │               │
IAM:      ├─ Still down   ├─ Starts back  ├─ Running again ✓
          │               │               │
Gateway:  │ Circuit OPEN  ├─ HALF_OPEN   ├─ CLOSED
          │ (wait 15s)    │ (allow 3      │ ✓ Healthy
          │               │  probes)      │
          │               │               │
Request:  ├─ ✗ 503        ├─ Probe 1: ✓   ├─ ✓ 200 OK
          │               │ Probe 2: ✓    │ Full traffic
          │               │ Probe 3: ✓    │ restored
          │               │ All pass!     │
          │               └─ Circuit      │
          │                 closes        │
```

---

## ⛔ Rate Limiter Exceeded

### **Scenario: Client makes too many requests**

```
Browser IP: 127.0.0.1
Rate limit: 20 req/s sustained, 40 req/burst

Timeline:
T=0s    Tokens: 40 ✓
        Requests: [1][2][3]...[30] ✓
        Tokens left: 10

T=1s    NEW TOKENS: +20 = 30
        Requests: [31][32][33]...[50] ✓
        Tokens left: 0

T=1.5s  Requests: [51] ✗ 429 Too Many Requests
        [52] ✗ 429
        [53] ✗ 429

Client must WAIT for new tokens or reduce request rate
```

---

## ✅ Complete Startup Verification Checklist

After starting all services:

```
□ Eureka Server (8761)
  □ Page loads: http://localhost:8761
  □ Shows page: "Eureka Server"
  □ Status: No instances (until other services start)

□ Config Server (8888)
  □ Access: http://localhost:8888/application.properties
  □ Shows: jwt.secret, db credentials, etc.

□ IAM Service (8081)
  □ Eureka dashboard shows: IAM-SERVICE UP
  □ Access: http://localhost:8081/swagger-ui/index.html
  □ Endpoints visible: /auth/register, /auth/login, etc.

□ API Gateway (8090)
  □ Eureka shows: API-GATEWAY UP
  □ Access: http://localhost:8090/actuator/health
  □ Shows: All circuit breakers available
  □ Access: http://localhost:8090/actuator/gateway/routes
  □ Shows: All routes with proper URIs

□ Frontend (3000)
  □ Runs: npm run dev
  □ Access: http://localhost:3000/register
  □ Accessible: Can see registration form
  □ Test: Click register, check network tab
  □ Should see: POST to http://localhost:3000/api/v1/auth/register
  □ Then proxied to: http://localhost:8090/...

□ Test Register/Login
  □ POST /api/v1/auth/register
    ├─ Status: 201 Created
    ├─ Response: { token, userId, email, role }
    └─ Can login and get JWT

  □ POST /api/v1/auth/login
    ├─ Status: 200 OK
    ├─ Response: { token, userId, email, role }
    └─ JWT valid and not expired
```

---

**Status:** ✅ All microservices documentation complete!

**Key Takeaways:**
1. Eureka enables dynamic service discovery
2. Config Server provides centralized configuration
3. Shared JWT secret allows stateless validation across services
4. API Gateway orchestrates traffic with resilience patterns
5. Services are loosely coupled (can work independently)
6. Scaling is horizontal - add more instances, they auto-register


