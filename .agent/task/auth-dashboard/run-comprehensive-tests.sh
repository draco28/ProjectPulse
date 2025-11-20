#!/bin/bash

# Comprehensive Auth & Project Isolation Test Suite
# Sprint 8.9 - Complete End-to-End Testing
# Date: 2025-11-21

set -e  # Exit on error

BASE_URL="http://192.168.1.15:3000"
TEST_EMAIL="autotest-$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
TEST_NAME="Auto Test User"
PROJECT_NAME="AutoTest Project $(date +%s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

log_fail() {
    echo -e "${RED}❌ $1${NC}"
    echo -e "${RED}   $2${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

log_section() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📋 $1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Helper function to check HTTP status
check_http_status() {
    local url=$1
    local expected=$2
    local description=$3
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" = "$expected" ]; then
        log_success "$description (HTTP $status)"
    else
        log_fail "$description" "Expected HTTP $expected, got $status"
    fi
}

# Helper function to check if string contains substring
check_contains() {
    local text=$1
    local substring=$2
    local description=$3
    
    if echo "$text" | grep -q "$substring"; then
        log_success "$description"
    else
        log_fail "$description" "Expected to find '$substring' in response"
    fi
}

# ============================================================================
# PRE-TEST SETUP
# ============================================================================

log_section "PRE-TEST SETUP"

log_info "Checking Docker services..."
docker compose -f docker-compose.cloud.yml ps | grep -q "Up" && log_success "Docker services running" || log_fail "Docker services check" "Services not running"

log_info "Checking Next.js health..."
check_http_status "$BASE_URL/api/health" "200" "Health endpoint accessible"

log_info "Checking PostgreSQL..."
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "SELECT 1;" > /dev/null 2>&1 && log_success "PostgreSQL accessible" || log_fail "PostgreSQL check" "Database not accessible"

log_info "Checking Redis..."
docker exec projectpulse-redis-cloud redis-cli ping | grep -q "PONG" && log_success "Redis accessible" || log_fail "Redis check" "Redis not responding"

log_info "Regenerating Prisma Client..."
docker exec projectpulse-nextjs-cloud sh -c "cd apps/web && pnpm prisma generate" > /dev/null 2>&1 && log_success "Prisma Client regenerated" || log_fail "Prisma generation" "Failed to generate Prisma Client"

# ============================================================================
# TEST SUITE 1: BASIC CONNECTIVITY
# ============================================================================

log_section "TEST SUITE 1: BASIC CONNECTIVITY"

check_http_status "$BASE_URL/" "302" "Root redirect (unauthenticated)"
check_http_status "$BASE_URL/login" "200" "Login page accessible"
check_http_status "$BASE_URL/api/health" "200" "Health API endpoint"

# Check that protected routes redirect when not authenticated
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/app")
if [ "$response" = "307" ] || [ "$response" = "302" ]; then
    log_success "Protected route /app redirects when unauthenticated"
else
    log_fail "Protected route /app" "Expected redirect (302/307), got $response"
fi

response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dashboard")
if [ "$response" = "307" ] || [ "$response" = "302" ]; then
    log_success "Protected route /dashboard redirects when unauthenticated"
else
    log_fail "Protected route /dashboard" "Expected redirect (302/307), got $response"
fi

# ============================================================================
# TEST SUITE 2: DATABASE SCHEMA VERIFICATION
# ============================================================================

log_section "TEST SUITE 2: DATABASE SCHEMA VERIFICATION"

log_info "Checking database schema..."

# Check if users table exists
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "\dt users" 2>/dev/null | grep -q "users" && log_success "Users table exists" || log_fail "Users table" "Table not found"

# Check if Project table exists (Prisma uses model name by default)
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "\dt \"Project\"" 2>/dev/null | grep -q "Project" && log_success "Project table exists" || log_fail "Project table" "Table not found"

# Check if Project has ownerId column
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "\d \"Project\"" 2>/dev/null | grep -q "ownerId" && log_success "Project.ownerId column exists" || log_fail "Project.ownerId" "Column not found"

# Check if KnowledgeItem has projectId
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "\d knowledge_items" 2>/dev/null | grep -q "projectId" && log_success "KnowledgeItem.projectId column exists" || log_fail "KnowledgeItem.projectId" "Column not found"

# Check if SecurityFinding has projectId
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "SELECT column_name FROM information_schema.columns WHERE table_name='SecurityFinding' AND column_name='projectId';" 2>/dev/null | grep -q "projectId" && log_success "SecurityFinding.projectId column exists" || log_fail "SecurityFinding.projectId" "Column not found"

# Check if WikiPage has projectId
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "SELECT column_name FROM information_schema.columns WHERE table_name='WikiPage' AND column_name='projectId';" 2>/dev/null | grep -q "projectId" && log_success "WikiPage.projectId column exists" || log_fail "WikiPage.projectId" "Column not found"

# ============================================================================
# TEST SUITE 3: AUTHENTICATION API
# ============================================================================

log_section "TEST SUITE 3: AUTHENTICATION API"

log_info "Testing signup API with unique email: $TEST_EMAIL"

# Test signup
signup_response=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$signup_response" | grep -q "success"; then
    log_success "User signup successful"
    USER_ID=$(echo "$signup_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    log_info "Created user ID: $USER_ID"
else
    log_fail "User signup" "Response: $signup_response"
fi

# Test duplicate signup (should fail)
duplicate_response=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$duplicate_response" | grep -q "already exists"; then
    log_success "Duplicate email prevented"
else
    log_fail "Duplicate email prevention" "Expected 'already exists' error"
fi

# Test invalid email format
invalid_email_response=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"notanemail","password":"TestPass123!"}')

if echo "$invalid_email_response" | grep -q -i "invalid"; then
    log_success "Invalid email format rejected"
else
    log_fail "Email validation" "Should reject invalid email"
fi

# Test weak password
weak_password_response=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test2@example.com","password":"123"}')

if echo "$weak_password_response" | grep -q "8 characters"; then
    log_success "Weak password rejected"
else
    log_fail "Password validation" "Should reject passwords < 8 characters"
fi

# ============================================================================
# TEST SUITE 4: PROJECT ISOLATION
# ============================================================================

log_section "TEST SUITE 4: PROJECT ISOLATION (Critical)"

log_info "Creating test project in database..."

# Create a project directly via database for the test user
if [ -n "$USER_ID" ]; then
    project_created=$(docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c \
        "INSERT INTO \"Project\" (name, description, \"ownerId\", \"createdAt\", \"updatedAt\") 
         VALUES ('$PROJECT_NAME', 'Test project for isolation', '$USER_ID', NOW(), NOW()) 
         RETURNING id;" 2>&1)
    
    if echo "$project_created" | grep -q "INSERT"; then
        PROJECT_ID=$(echo "$project_created" | grep -o '[0-9]\+' | head -1)
        log_success "Test project created (ID: $PROJECT_ID)"
    else
        log_fail "Project creation" "Failed to create test project"
    fi
fi

# Verify project isolation in database
if [ -n "$PROJECT_ID" ]; then
    log_info "Verifying project isolation..."
    
    # Check that knowledge items are scoped to projectId
    knowledge_query="SELECT COUNT(*) FROM knowledge_items WHERE \"projectId\" = $PROJECT_ID;"
    knowledge_count=$(docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -t -c "$knowledge_query" 2>/dev/null | tr -d ' ')
    
    if [ "$knowledge_count" = "0" ]; then
        log_success "New project has 0 knowledge items (isolated)"
    else
        log_fail "Knowledge item isolation" "New project should have 0 items, found $knowledge_count"
    fi
    
    # Check that issues are scoped to projectId
    issue_query="SELECT COUNT(*) FROM issues WHERE \"projectId\" = $PROJECT_ID;"
    issue_count=$(docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -t -c "$issue_query" 2>/dev/null | tr -d ' ')
    
    if [ "$issue_count" = "0" ]; then
        log_success "New project has 0 issues (isolated)"
    else
        log_fail "Issue isolation" "New project should have 0 issues, found $issue_count"
    fi
fi

# ============================================================================
# TEST SUITE 5: API ENDPOINTS PROTECTION
# ============================================================================

log_section "TEST SUITE 5: API ENDPOINTS PROTECTION"

log_info "Testing API protection (without auth)..."

# Test that /api/projects requires auth
projects_unauth=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/projects")
if [ "$projects_unauth" = "401" ] || [ "$projects_unauth" = "403" ]; then
    log_success "GET /api/projects requires authentication"
else
    log_fail "API protection /api/projects" "Should return 401/403, got $projects_unauth"
fi

# ============================================================================
# TEST SUITE 6: PAGE ACCESSIBILITY
# ============================================================================

log_section "TEST SUITE 6: PAGE ACCESSIBILITY"

log_info "Checking critical pages load without errors..."

# Test Issues page (should redirect or require auth)
check_http_status "$BASE_URL/issues" "307" "Issues page redirects when unauthenticated"

# Test Wiki page (should redirect or require auth)
check_http_status "$BASE_URL/wiki" "307" "Wiki page redirects when unauthenticated"

# Test Agents page (should redirect or require auth)
check_http_status "$BASE_URL/agents" "307" "Agents page redirects when unauthenticated"

# Test Roadmap page (should redirect or require auth)
check_http_status "$BASE_URL/roadmap" "307" "Roadmap page redirects when unauthenticated"

# Test Health page (should redirect or require auth)
check_http_status "$BASE_URL/health" "307" "Health page redirects when unauthenticated"

# ============================================================================
# TEST SUITE 7: DATA INTEGRITY
# ============================================================================

log_section "TEST SUITE 7: DATA INTEGRITY"

log_info "Checking foreign key relationships..."

# Check user-project relationship
user_project_check=$(docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -t -c \
    "SELECT COUNT(*) FROM users u JOIN \"Project\" p ON u.id = p.\"ownerId\";" 2>/dev/null | tr -d ' ')

if [ "$user_project_check" -gt "0" ]; then
    log_success "User-Project foreign key relationship working"
else
    log_fail "User-Project relationship" "No valid relationships found"
fi

# ============================================================================
# FINAL REPORT
# ============================================================================

log_section "TEST EXECUTION SUMMARY"

echo ""
echo -e "${BLUE}Total Tests Run: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}✅ Project isolation is working correctly${NC}"
    echo -e "${GREEN}✅ Authentication system is functional${NC}"
    echo -e "${GREEN}✅ Database schema is correct${NC}"
    echo -e "${GREEN}✅ All critical pages are protected${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  SOME TESTS FAILED ⚠️${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Please review the failed tests above and fix the issues.${NC}"
    echo ""
    exit 1
fi
