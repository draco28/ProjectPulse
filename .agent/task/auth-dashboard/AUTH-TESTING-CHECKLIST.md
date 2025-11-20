# Auth & User Dashboard - Testing Checklist

**Sprint:** Sprint 8.9  
**Date:** 2025-11-21  
**Status:** Ready for Manual Testing  

---

## Pre-Test Setup

### 1. Start Docker Services

```bash
cd /Users/draco/projects/AI_HUB
docker compose -f docker-compose.cloud.yml up -d
```

Expected: All services (postgres, redis, nextjs, mcp-server) start successfully.

### 2. Verify Services Health

```bash
# Check containers
docker compose -f docker-compose.cloud.yml ps

# Check Next.js health (should see welcome page or redirect)
curl -I http://192.168.1.15:3000

# Check database
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "SELECT COUNT(*) FROM users;"

# Check Redis
docker exec projectpulse-redis-cloud redis-cli ping
```

Expected outputs:
- All containers: `Up` status
- Next.js: `302` or `200` response
- Database: Returns count of users
- Redis: `PONG`

### 3. Seed Test Data (if needed)

```bash
docker exec projectpulse-nextjs-cloud sh -c "cd apps/web && pnpm prisma db seed"
```

---

## Test Suite 1: Authentication Flow

### Test 1.1: Root Redirect (Unauthenticated)
- **URL:** `http://192.168.1.15:3000/`
- **Expected:** Redirect to `/login`
- **Pass Criteria:** Login page loads with signup/login forms

### Test 1.2: Signup Flow
- **URL:** `http://192.168.1.15:3000/login`
- **Steps:**
  1. Click "Sign up" toggle
  2. Enter name: "Test User"
  3. Enter email: "test@example.com"
  4. Enter password: "testpass123"
  5. Click "Sign Up"
- **Expected:**
  - Account created successfully
  - Auto-login happens
  - Redirect to `/app` (user dashboard)
- **Pass Criteria:** User dashboard loads with no projects

### Test 1.3: Login Flow (Existing User)
- **URL:** `http://192.168.1.15:3000/login`
- **Steps:**
  1. Enter email: "dev@projectpulse.local"
  2. Enter password: "dev123456"
  3. Click "Sign In"
- **Expected:**
  - Login successful
  - Redirect to `/app`
- **Pass Criteria:** User dashboard loads with "Moksha DevHub" project

### Test 1.4: Login Flow (Invalid Credentials)
- **URL:** `http://192.168.1.15:3000/login`
- **Steps:**
  1. Enter email: "test@example.com"
  2. Enter password: "wrongpassword"
  3. Click "Sign In"
- **Expected:**
  - Error message: "Invalid email or password"
  - No redirect
- **Pass Criteria:** Error shown, user stays on login page

### Test 1.5: Rate Limiting
- **URL:** `http://192.168.1.15:3000/login`
- **Steps:**
  1. Try signup with same email 6 times rapidly
- **Expected:**
  - First 5 attempts: Normal validation errors
  - 6th attempt: "Too many attempts. Please try again later."
  - Status 429
- **Pass Criteria:** Rate limit enforced after 5 attempts

---

## Test Suite 2: User Dashboard (/app)

### Test 2.1: Empty Projects State
- **Pre-condition:** Login as new user with no projects
- **URL:** `http://192.168.1.15:3000/app`
- **Expected:**
  - Welcome message with user name
  - "No projects yet" message
  - "Create Project" CTA button
- **Pass Criteria:** Empty state displays correctly

### Test 2.2: Create New Project
- **Pre-condition:** On `/app` page
- **Steps:**
  1. Click "New Project" button
  2. Enter name: "Test Project"
  3. Enter description: "My test project"
  4. Click "Create Project"
- **Expected:**
  - Modal closes
  - New project appears in grid
  - Onboarding shows 0% progress
- **Pass Criteria:** Project created and visible

### Test 2.3: Projects List Display
- **Pre-condition:** Login as dev@projectpulse.local (has Moksha DevHub)
- **URL:** `http://192.168.1.15:3000/app`
- **Expected:**
  - Welcome banner with user name
  - Project card showing:
    - Name: "Moksha DevHub"
    - Onboarding progress bar
    - Created date
    - Issue count
  - "New Project" and "Sign Out" buttons
- **Pass Criteria:** All project info displays correctly

### Test 2.4: Sign Out
- **Pre-condition:** On `/app` page, logged in
- **Steps:**
  1. Click "Sign Out" button
- **Expected:**
  - Redirect to `/login`
  - Session cleared (verify by trying to access `/app` directly)
- **Pass Criteria:** User logged out, `/app` redirects to `/login`

---

## Test Suite 3: Project Dashboard Integration

### Test 3.1: Open Project from User Dashboard
- **Pre-condition:** On `/app` with at least one project
- **Steps:**
  1. Click on "Moksha DevHub" project card
- **Expected:**
  - Redirect to `/dashboard?project=1` (or appropriate ID)
  - Dashboard loads with project stats
  - "Back to Projects" link visible
- **Pass Criteria:** Dashboard loads for correct project

### Test 3.2: Dashboard with Project Param
- **URL:** `http://192.168.1.15:3000/dashboard?project=1`
- **Expected:**
  - Dashboard loads if user owns project #1
  - Shows stats, recent issues, agents
  - Onboarding widget shows status
  - "Back to Projects" link works
- **Pass Criteria:** Dashboard displays correctly

### Test 3.3: Dashboard without Project Param
- **URL:** `http://192.168.1.15:3000/dashboard`
- **Expected:**
  - Loads first owned project automatically
  - OR redirects to `/app` if no projects
- **Pass Criteria:** Smart default behavior works

### Test 3.4: Ownership Check (Unauthorized Access)
- **Pre-condition:** User A owns project #1, User B owns project #2
- **Steps:**
  1. Login as User A
  2. Try to access `/dashboard?project=2` (User B's project)
- **Expected:**
  - Redirect to `/app`
  - Cannot view User B's project
- **Pass Criteria:** Ownership enforced, unauthorized access blocked

### Test 3.5: Back to Projects Link
- **Pre-condition:** On `/dashboard?project=1`
- **Steps:**
  1. Click "Back to Projects" link
- **Expected:**
  - Navigate to `/app`
  - Projects list loads
- **Pass Criteria:** Navigation works correctly

---

## Test Suite 4: Protected Routes (Middleware)

### Test 4.1: Access Protected Route (Unauthenticated)
- **Pre-condition:** Not logged in
- **URLs to test:**
  - `http://192.168.1.15:3000/app`
  - `http://192.168.1.15:3000/dashboard`
  - `http://192.168.1.15:3000/issues`
  - `http://192.168.1.15:3000/wiki`
- **Expected:**
  - All redirect to `/login?callbackUrl=/original-path`
- **Pass Criteria:** All protected routes require authentication

### Test 4.2: Access Public Route (Unauthenticated)
- **Pre-condition:** Not logged in
- **URLs to test:**
  - `http://192.168.1.15:3000/login`
  - `http://192.168.1.15:3000/api/auth/signup`
- **Expected:**
  - Login page loads normally
  - API routes accessible
- **Pass Criteria:** Public routes work without auth

---

## Test Suite 5: API Endpoints

### Test 5.1: GET /api/projects (Authenticated)
```bash
# Login first to get session cookie, then:
curl -H "Cookie: next-auth.session-token=..." \
  http://192.168.1.15:3000/api/projects
```
- **Expected:** JSON array of user's projects with onboarding progress
- **Pass Criteria:** Returns projects for authenticated user only

### Test 5.2: POST /api/projects (Create Project)
```bash
curl -X POST http://192.168.1.15:3000/api/projects \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test Project","description":"Created via API"}'
```
- **Expected:** 201 status, project JSON returned
- **Pass Criteria:** Project created and owned by current user

### Test 5.3: POST /api/auth/signup (Rate Limiting)
```bash
# Run 6 times rapidly
for i in {1..6}; do
  curl -X POST http://192.168.1.15:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"pass123\",\"name\":\"Test$i\"}"
done
```
- **Expected:** First 5 succeed or fail validation, 6th returns 429
- **Pass Criteria:** Rate limit enforced

---

## Test Suite 6: Data Integrity

### Test 6.1: Verify Database Schema
```bash
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema='public' AND table_name IN ('users', 'auth_sessions', 'projects');
"
```
- **Expected:** All three tables exist
- **Pass Criteria:** Schema updated correctly

### Test 6.2: Verify User-Project Relationship
```bash
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
  SELECT u.email, p.name, p.\"ownerId\" 
  FROM users u 
  JOIN projects p ON u.id = p.\"ownerId\";
"
```
- **Expected:** Shows user email and their owned projects
- **Pass Criteria:** Foreign key relationship works

### Test 6.3: Verify Onboarding Sessions Link
```bash
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
  SELECT os.id, os.\"projectId\", os.\"userId\", os.status 
  FROM onboarding_sessions os 
  WHERE os.\"userId\" IS NOT NULL 
  LIMIT 5;
"
```
- **Expected:** Shows onboarding sessions with optional userId
- **Pass Criteria:** userId field exists and nullable

---

## Test Suite 7: Edge Cases & Error Handling

### Test 7.1: Duplicate Project Name
- **Steps:**
  1. Create project "Test Project"
  2. Try to create another project "Test Project"
- **Expected:** Error: "A project with this name already exists"
- **Pass Criteria:** Duplicate names prevented per user

### Test 7.2: Invalid Email Format (Signup)
- **Steps:**
  1. Try signup with email: "notanemail"
- **Expected:** Validation error: "Invalid email address"
- **Pass Criteria:** Email validation works

### Test 7.3: Weak Password (Signup)
- **Steps:**
  1. Try signup with password: "123" (< 8 chars)
- **Expected:** Validation error: "Password must be at least 8 characters"
- **Pass Criteria:** Password validation works

### Test 7.4: Session Expiry
- **Steps:**
  1. Login
  2. Wait 7+ days (or manually expire JWT)
  3. Try to access `/app`
- **Expected:** Redirect to `/login`
- **Pass Criteria:** Expired sessions handled

---

## Test Suite 8: UI/UX Consistency

### Test 8.1: Theme Consistency
- **Check:** Login page, User dashboard, Project dashboard all use same:
  - Neumorphic design
  - Coral accent colors
  - shadcn/ui components
  - FloatingBackground
- **Pass Criteria:** Visual consistency across all pages

### Test 8.2: Responsive Design
- **Test on:** Mobile (375px), Tablet (768px), Desktop (1920px)
- **Pages:** `/login`, `/app`, `/dashboard`
- **Pass Criteria:** All pages responsive and usable

### Test 8.3: Accessibility
- **Check:**
  - Tab navigation works
  - Form labels present
  - Error messages announced
  - "Skip to content" links work
- **Pass Criteria:** Keyboard navigation and screen reader support

---

## Known Issues & Limitations

### Current Scope (MVP)
- ✅ Single-user per project (no sharing yet)
- ✅ Projects scoped only in dashboard (issues/wiki still global)
- ✅ No forgot password flow
- ✅ No email verification
- ✅ No MFA/2FA
- ✅ No social login (Google, GitHub)

### Post-MVP Enhancements
- Add project scoping to /issues, /wiki, /agents pages
- Multi-user project collaboration
- Role-based permissions
- Email verification
- Password reset flow
- Activity logs

---

## Success Criteria

All tests must pass before marking Phase 7 complete:

- [ ] **Authentication:** Signup, login, logout work
- [ ] **User Dashboard:** List projects, create project, navigate work
- [ ] **Project Dashboard:** Ownership checks, data scoped correctly
- [ ] **Middleware:** Protected routes enforced
- [ ] **API:** Endpoints secured and functional
- [ ] **Database:** Schema correct, relationships work
- [ ] **UI/UX:** Consistent theme, responsive, accessible
- [ ] **Edge Cases:** Errors handled gracefully

---

## Test Execution Log

### Session 1: [DATE]
**Tester:** [NAME]

- Test 1.1: [ ] Pass / [ ] Fail - Notes:
- Test 1.2: [ ] Pass / [ ] Fail - Notes:
- Test 1.3: [ ] Pass / [ ] Fail - Notes:
- ...

### Issues Found:
1. [Issue description] - Priority: High/Medium/Low - Status: Open/Fixed
2. ...

---

## Deployment Checklist

Once all tests pass:

- [ ] Generate production NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Update docker-compose.cloud.yml with production secret
- [ ] Rebuild containers: `docker compose -f docker-compose.cloud.yml up -d --build`
- [ ] Verify health checks pass
- [ ] Run smoke tests in production
- [ ] Update documentation
- [ ] Notify team of completion
