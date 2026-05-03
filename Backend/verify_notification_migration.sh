#!/bin/bash
# Notification Service Migration - Verification Script
# This script helps verify the migration is complete and correct

echo "=========================================="
echo "Notification Service Migration Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} File NOT found: $1"
        ((CHECKS_FAILED++))
    fi
}

# Function to check if file does NOT exist
check_file_not_exists() {
    if [ ! -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Correctly removed: $1"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} File still exists (should be removed): $1"
        ((CHECKS_FAILED++))
    fi
}

# Set backend path
BACKEND_PATH="$(pwd)/Backend"

echo "Checking Backend path: $BACKEND_PATH"
echo ""

# ========================
# Phase 1: notification-service Files
# ========================
echo "${YELLOW}Phase 1: Checking notification-service creation${NC}"
echo ""

check_file "$BACKEND_PATH/notification-service/pom.xml"
check_file "$BACKEND_PATH/notification-service/src/main/resources/application.yml"
check_file "$BACKEND_PATH/notification-service/src/main/java/com/ecotrack/notification/NotificationServiceApplication.java"
check_file "$BACKEND_PATH/notification-service/src/main/java/com/ecotrack/notification/controller/NotificationController.java"
check_file "$BACKEND_PATH/notification-service/src/main/java/com/ecotrack/notification/service/NotificationService.java"
check_file "$BACKEND_PATH/notification-service/src/main/java/com/ecotrack/notification/dto/NotificationRequest.java"
check_file "$BACKEND_PATH/notification-service/src/main/java/com/ecotrack/notification/dto/NotificationResponse.java"
check_file "$BACKEND_PATH/notification-service/src/main/java/com/ecotrack/notification/entity/Notification.java"
check_file "$BACKEND_PATH/notification-service/src/main/java/com/ecotrack/notification/repository/NotificationRepository.java"
check_file "$BACKEND_PATH/notification-service/src/main/java/com/ecotrack/notification/enums/NotificationCategory.java"
check_file "$BACKEND_PATH/notification-service/src/main/java/com/ecotrack/notification/enums/NotificationStatus.java"
check_file "$BACKEND_PATH/notification-service/src/main/java/com/ecotrack/notification/exception/ResourceNotFoundException.java"
check_file "$BACKEND_PATH/notification-service/src/main/java/com/ecotrack/notification/exception/GlobalExceptionHandler.java"

echo ""

# ========================
# Phase 2: IAM Service Cleanup
# ========================
echo "${YELLOW}Phase 2: Checking IAM service cleanup${NC}"
echo ""

check_file_not_exists "$BACKEND_PATH/iam-service/src/main/java/com/ecotrack/iam/controller/NotificationController.java"
check_file_not_exists "$BACKEND_PATH/iam-service/src/main/java/com/ecotrack/iam/service/NotificationService.java"
check_file_not_exists "$BACKEND_PATH/iam-service/src/main/java/com/ecotrack/iam/entity/Notification.java"
check_file_not_exists "$BACKEND_PATH/iam-service/src/main/java/com/ecotrack/iam/repository/NotificationRepository.java"

echo ""

# ========================
# Phase 3: IAM FeignClient
# ========================
echo "${YELLOW}Phase 3: Checking IAM FeignClient setup${NC}"
echo ""

check_file "$BACKEND_PATH/iam-service/src/main/java/com/ecotrack/iam/client/NotificationClient.java"
check_file "$BACKEND_PATH/iam-service/src/main/java/com/ecotrack/iam/dto/NotificationRequest.java"
check_file "$BACKEND_PATH/iam-service/src/main/java/com/ecotrack/iam/dto/NotificationResponse.java"
check_file "$BACKEND_PATH/iam-service/src/main/java/com/ecotrack/iam/enums/NotificationCategory.java"
check_file "$BACKEND_PATH/iam-service/src/main/java/com/ecotrack/iam/enums/NotificationStatus.java"

echo ""

# ========================
# Phase 4: Configuration Files
# ========================
echo "${YELLOW}Phase 4: Checking configuration files${NC}"
echo ""

check_file "$BACKEND_PATH/pom.xml"
check_file "$BACKEND_PATH/api-gateway/src/main/resources/application.yml"

echo ""

# ========================
# Check file contents
# ========================
echo "${YELLOW}Phase 5: Checking file contents${NC}"
echo ""

# Check if parent pom includes notification-service
if grep -q "notification-service" "$BACKEND_PATH/pom.xml"; then
    echo -e "${GREEN}✓${NC} Parent pom.xml includes notification-service module"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Parent pom.xml missing notification-service module"
    ((CHECKS_FAILED++))
fi

# Check if IamServiceApplication has @EnableFeignClients
if grep -q "EnableFeignClients" "$BACKEND_PATH/iam-service/src/main/java/com/ecotrack/iam/IamServiceApplication.java"; then
    echo -e "${GREEN}✓${NC} IamServiceApplication has @EnableFeignClients"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} IamServiceApplication missing @EnableFeignClients"
    ((CHECKS_FAILED++))
fi

# Check if API Gateway has notification route
if grep -q "notification-notifications" "$BACKEND_PATH/api-gateway/src/main/java/com/ecotrack/gateway/config/GatewayConfig.java"; then
    echo -e "${GREEN}✓${NC} API Gateway has notification-notifications route"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} API Gateway missing notification-notifications route"
    ((CHECKS_FAILED++))
fi

# Check if API Gateway routes to notification-service
if grep -q "lb://notification-service" "$BACKEND_PATH/api-gateway/src/main/java/com/ecotrack/gateway/config/GatewayConfig.java"; then
    echo -e "${GREEN}✓${NC} API Gateway routes to notification-service"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} API Gateway not routing to notification-service"
    ((CHECKS_FAILED++))
fi

# Check if notification-service has correct port
if grep -q "port: 8083" "$BACKEND_PATH/notification-service/src/main/resources/application.yml"; then
    echo -e "${GREEN}✓${NC} Notification-service configured for port 8083"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Notification-service port not configured correctly"
    ((CHECKS_FAILED++))
fi

# Check if notification-service registered with Eureka
if grep -q "eureka:" "$BACKEND_PATH/notification-service/src/main/resources/application.yml"; then
    echo -e "${GREEN}✓${NC} Notification-service has Eureka configuration"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Notification-service missing Eureka configuration"
    ((CHECKS_FAILED++))
fi

# Check FeignClient annotation
if grep -q "@FeignClient(name = \"notification-service\")" "$BACKEND_PATH/iam-service/src/main/java/com/ecotrack/iam/client/NotificationClient.java"; then
    echo -e "${GREEN}✓${NC} NotificationClient has correct FeignClient annotation"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} NotificationClient missing or incorrect FeignClient annotation"
    ((CHECKS_FAILED++))
fi

echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "${GREEN}Checks Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Checks Failed: $CHECKS_FAILED${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All checks passed! Migration appears complete.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}✗ Some checks failed. Please review the issues above.${NC}"
    exit 1
fi

