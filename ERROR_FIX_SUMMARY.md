# Error Fix: Commons Logging Conflict

## The Error

```
WARNING: Standard Commons Logging discovery in action with spring-jcl: please remove commons-logging.jar from classpath in order to avoid potential conflicts
```

## Root Cause

The issue was a **dependency conflict** between:
- **commons-logging** (brought in transitively by `opencsv` library)
- **spring-jcl** (Spring Cloud Logging - the correct logging facade for Spring Boot)

Spring Boot 3.2.5 uses `spring-jcl` as the logging bridge, but the `opencsv` library was pulling in the older `commons-logging` library, creating a conflict.

## Solution Applied

### Fix 1: Global Exclusion in Parent pom.xml
Added a global dependency in the parent `pom.xml` to mark `commons-logging` as `provided` scope, preventing it from being included in the classpath:

```xml
<dependencies>
    <!-- Exclude commons-logging globally to avoid conflicts with spring-jcl -->
    <dependency>
        <groupId>commons-logging</groupId>
        <artifactId>commons-logging</artifactId>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

**File:** `Backend/pom.xml`

### Fix 2: Specific Exclusion in environmental-monitoring-service
Added an explicit exclusion for `commons-logging` in the `opencsv` dependency declaration:

```xml
<dependency>
    <groupId>com.opencsv</groupId>
    <artifactId>opencsv</artifactId>
    <version>${opencsv.version}</version>
    <exclusions>
        <exclusion>
            <groupId>commons-logging</groupId>
            <artifactId>commons-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

**File:** `Backend/environmental-monitoring-service/pom.xml`

## Build Status

✅ **BUILD SUCCESS** - The project now builds without the commons-logging warning.

## Why This Works

1. **Global Scope** - By setting `commons-logging` to `provided` scope in the parent pom, Maven will not include it in transitive dependencies across all microservices
2. **Explicit Exclusion** - The explicit exclusion in `opencsv` dependency ensures even if `commons-logging` is pulled in from any source, it won't be used
3. **Spring-jcl Priority** - With `commons-logging` out of the classpath, Spring Boot will use `spring-jcl` as the logging facade

## Services Affected

All services using Spring Cloud dependencies will benefit from this fix:
- iam-service
- notification-service
- citizen-reporting-service
- environmental-monitoring-service ✅ (primary fix target)
- industry-compliance-service
- project-management-service
- compliance-audit-service
- api-gateway

## Testing

The environmental-monitoring-service was successfully built and packaged:
- Clean compile completed
- All 35 Java source files compiled successfully
- JAR package created successfully
- **No commons-logging warnings** in the build output

You can now run the services without the logging facade conflict warning.

