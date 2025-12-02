Admin System Implementation Plan

 Task: Add admin user, admin dashboard, MCP agent controls, and delete demo user
 Branch: feature/sprint-11
 Date: 2025-12-02
 Status: Planning (Gap Analysis Complete)
 Last Updated: 2025-12-02 (Added security fixes + MCP admin controls)

 ---
 Requirements Summary

 | Requirement                 | Decision
 |
 |-----------------------------|-------------------------------------------------------
 |
 | Demo user ("Moksha DevHub") | Delete completely
 |
 | Admin features              | User management + System settings
 |
 | Project access              | NO - Admin cannot view/modify user projects (privacy)
 |
 | Admin dashboard             | SEPARATE from user dashboard (/admin/*)
 |
 | Admin creation              | Seed script with env vars
 |
 | Admin login redirect        | Always → /admin (can navigate to /app manually)
 |

 ---
 Current State

 User Model (no role field):
 model User {
   id, email, name, passwordHash, isActive, createdAt, updatedAt
   // NO role field!
 }

 Security Issue Found: /api/admin/reset-onboarding has NO auth check!

Demo User: dev@projectpulse.local with "Moksha DevHub" project exists in production.

---
Gap Analysis (2025-12-02)

CRITICAL SECURITY GAPS IDENTIFIED:

1. /api/admin/ is PUBLIC in middleware.ts (line 19) - LIVE VULNERABILITY
   - Anyone can call reset-onboarding with curl
   - FIX: Remove from publicApiPrefixes IMMEDIATELY

2. No isActive check on login
   - Deactivated users can still log in
   - FIX: Add isActive check in authorize callback

3. No rate limiting for admin actions
   - Brute force risk on password reset
   - FIX: Add rate limiting middleware

4. No session invalidation on role change
   - Demoted admin retains JWT until expiry
   - FIX: Add tokenInvalidatedAt or short token expiry

5. No audit logging
   - No accountability for admin actions
   - FIX: Create AdminAuditLog model

FUNCTIONAL GAPS IDENTIFIED:

6. Admin redirect timing issue
   - JWT may not be populated in redirect callback
   - FIX: Handle redirect in login page after signIn

7. No last-admin protection
   - Can demote/deactivate the only admin
   - FIX: Check admin count before role change

8. Password reset security unclear
   - How is new password delivered?
   - FIX: Admin provides new password in request body

9. Demo cleanup needs dry-run mode
   - FIX: Add --dry-run flag to cleanup script

---
Implementation Plan

Phase 0: HOTFIX (Do IMMEDIATELY - Live Security Fix)

0.1 Remove /api/admin/ from public prefixes
File: apps/web/middleware.ts

Remove '/api/admin/' from publicApiPrefixes array.
This is a LIVE vulnerability - must be fixed before any other work.

0.2 Add isActive check to login
File: apps/web/lib/auth.ts

In authorize callback, after password check:
if (!user.isActive) {
  return null;
}

0.3 Add basic auth to reset-onboarding
File: apps/web/app/api/admin/reset-onboarding/route.ts

Temporarily add requireUser() check until role system is ready.

---
Phase 1: Database & Auth Foundation

 1.1 Add UserRole to Prisma Schema

 File: apps/web/prisma/schema.prisma

 enum UserRole {
   USER
   ADMIN
 }

 model User {
   // ... existing fields
   role         UserRole @default(USER)  // NEW
 }

 Migration: pnpm prisma migrate dev --name add-user-role

 1.2 TypeScript Type Declarations

 New file: apps/web/types/next-auth.d.ts

 import { UserRole } from '@prisma/client';
 import 'next-auth';
 import 'next-auth/jwt';

 declare module 'next-auth' {
   interface Session {
     user: {
       id: string;
       email: string;
       name?: string | null;
       role: UserRole;
     };
   }
   interface User {
     role: UserRole;
   }
 }

 declare module 'next-auth/jwt' {
   interface JWT {
     userId: string;
     role: UserRole;
   }
 }

 1.3 Update NextAuth Configuration

 File: apps/web/lib/auth.ts

 Changes:
 1. Include role in user object returned from authorize
 2. Add role to JWT callback
 3. Expose role in session callback
 4. Update redirect callback to send admins to /admin:
 async redirect({ url, baseUrl }) {
   // If user is admin, redirect to admin dashboard
   // Check JWT token for role
   if (url.startsWith(baseUrl)) return url;
   return baseUrl;
 }

 Note: The login page also needs to check role after successful signin and redirect to
 /admin for admin users.

 1.4 Update Server Auth Helpers

 File: apps/web/lib/auth-server.ts

 Add new function:
 export async function requireAdmin() {
   const user = await getCurrentUser();
   if (!user) throw new Error('Unauthorized');
   if (user.role !== 'ADMIN') throw new Error('Forbidden: Admin access required');
   return user;
 }

 ---
 Phase 2: Middleware & Security

 2.1 Update Middleware

 File: apps/web/middleware.ts

 Changes:
 1. REMOVE /api/admin/ from publicApiPrefixes (SECURITY FIX!)
 2. Add admin route protection:

 // Admin route protection
 const isAdminRoute = pathname.startsWith('/admin');
 const isAdminApi = pathname.startsWith('/api/admin/');

 if (isAdminRoute || isAdminApi) {
   if (!token) {
     // Redirect to login or return 401
   }
   if (token.role !== 'ADMIN') {
     // Return 403 or redirect to /app
   }
 }

 2.2 Fix Existing Admin Endpoint

 File: apps/web/app/api/admin/reset-onboarding/route.ts

 Add at start of POST handler:
 await requireAdmin();

 ---
 Phase 3: Admin API Routes

 3.1 Stats API

 New file: apps/web/app/api/admin/stats/route.ts

 // GET: Returns aggregate stats only (no user data)
 // - totalUsers, activeUsers, totalProjects, totalTickets, recentSignups

 3.2 User Management API

 New file: apps/web/app/api/admin/users/route.ts

 // GET: List users with pagination, search, filters
 // Returns: id, email, name, role, isActive, createdAt, _count.projects
 // Does NOT return: passwordHash, project contents

 3.3 Single User API

 New file: apps/web/app/api/admin/users/[id]/route.ts

 // GET: Single user details
 // PATCH: Update user (isActive, role, name)
 // Self-protection: Cannot modify own account

 3.4 Password Reset API

 New file: apps/web/app/api/admin/users/[id]/reset-password/route.ts

 // POST: Reset user password
 // Generates temporary password or accepts new password
 // Self-protection: Cannot reset own password

 ---
 Phase 4: Admin Dashboard UI

 4.1 Admin Layout (SEPARATE from user dashboard)

 New file: apps/web/app/admin/layout.tsx

 - Different layout from /(authenticated)/layout.tsx
 - Uses AdminSidebar, AdminHeader
 - No project context required

 4.2 Admin Components

 New files:
 - apps/web/components/admin/AdminSidebar.tsx - Navigation (Overview, Users, Settings)
 - apps/web/components/admin/AdminHeader.tsx - "Admin Panel" badge, user info

 4.3 Admin Pages

 | Page     | File                                 | Features
    |
 |----------|--------------------------------------|-----------------------------------
 ---|
 | Overview | apps/web/app/admin/page.tsx          | Stats cards (aggregate only)
    |
 | Users    | apps/web/app/admin/users/page.tsx    | User table, search, actions
 dropdown |
 | Settings | apps/web/app/admin/settings/page.tsx | Seed management, system info
    |

 ---
 Phase 5: Seed Script & Cleanup

 5.1 Update Production Seed

 File: apps/web/prisma/seed-prod.ts

 Add function:
 async function seedAdminUser() {
   const adminEmail = process.env.ADMIN_EMAIL;
   const adminPassword = process.env.ADMIN_PASSWORD;

   if (!adminEmail || !adminPassword) {
     console.log('  [Admin] Skipped - env vars not set');
     return;
   }

   await prisma.user.upsert({
     where: { email: adminEmail.toLowerCase() },
     update: { role: 'ADMIN' },
     create: {
       email: adminEmail.toLowerCase(),
       name: 'Administrator',
       passwordHash: await bcrypt.hash(adminPassword, 12),
       role: 'ADMIN',
       isActive: true,
     },
   });
 }

 5.2 Demo User Cleanup Script

 New file: apps/web/prisma/scripts/cleanup-demo-user.ts

 // Find user by email: dev@projectpulse.local
 // Delete all their projects (cascades)
 // Delete the user

 Add to package.json:
 "db:cleanup-demo": "tsx prisma/scripts/cleanup-demo-user.ts"
 "db:cleanup-demo-dry": "tsx prisma/scripts/cleanup-demo-user.ts --dry-run"

 ---
 Phase 6: Audit Logging

 6.1 Add AdminAuditLog Model

 File: apps/web/prisma/schema.prisma

 model AdminAuditLog {
   id        Int      @id @default(autoincrement())
   adminId   String   // User ID of admin who performed action
   action    String   // DEACTIVATE_USER, ACTIVATE_USER, RESET_PASSWORD, 
                      // PROMOTE_TO_ADMIN, DEMOTE_FROM_ADMIN, REVOKE_TOKEN, etc.
   targetType String  // USER, PROJECT_TOKEN
   targetId  String   // Target entity ID
   metadata  Json?    @db.JsonB // Additional context (old values, new values, etc.)
   ipAddress String?
   userAgent String?
   createdAt DateTime @default(now())

   @@index([adminId])
   @@index([targetType, targetId])
   @@index([action])
   @@index([createdAt(sort: Desc)])
   @@map("admin_audit_logs")
 }

 6.2 Create Audit Helper

 New file: apps/web/lib/audit.ts

 export async function logAdminAction(params: {
   adminId: string;
   action: string;
   targetType: string;
   targetId: string;
   metadata?: Record<string, any>;
   request?: Request;
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata,
      ipAddress: params.request?.headers.get('x-forwarded-for'),
      userAgent: params.request?.headers.get('user-agent'),
    },
  });
}

---
Phase 7: MCP Agent Admin Controls (AGENT-FIRST PRODUCT)

CONTEXT: 90% of product usage is by AI agents via MCP. Admin needs control over:
- Which agents can connect
- What tools agents can use
- Token lifecycle (create, revoke, expire)
- Agent activity monitoring
- Emergency shutdown capability

7.1 MCPToolLog Model (Full Activity Logging)

File: apps/web/prisma/schema.prisma

model MCPToolLog {
  id        BigInt   @id @default(autoincrement())
  tokenId   Int      // Which token executed
  projectId Int      // Which project
  toolName  String   // Tool name (e.g., "ticket_create")
  duration  Int      // Execution time in ms
  success   Boolean  // Did it succeed?
  error     String?  @db.Text // Error message if failed
  createdAt DateTime @default(now())

  // Relations
  token   ProjectToken @relation(fields: [tokenId], references: [id], onDelete: Cascade)
  project Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([tokenId])
  @@index([projectId])
  @@index([toolName])
  @@index([createdAt(sort: Desc)])
  @@index([projectId, createdAt])
  @@index([success]) // Quick filter for errors
  @@map("mcp_tool_logs")
}

model MCPToolAggregate {
  id        Int      @id @default(autoincrement())
  date      DateTime @db.Date // Aggregation date
  projectId Int
  toolName  String
  callCount Int      // Total calls that day
  errorCount Int     // Total errors
  avgDuration Int    // Average duration in ms
  
  @@unique([date, projectId, toolName])
  @@index([date(sort: Desc)])
  @@index([projectId])
  @@map("mcp_tool_aggregates")
}

Retention: Raw logs deleted after 30 days, aggregates kept indefinitely.
Cleanup job: Scheduled task or cron to delete old logs.

7.2 Admin MCP Dashboard Page

New file: apps/web/app/admin/agents/page.tsx

Features:
- List all ProjectTokens across all projects (admin view)
- Show: project name, token name, created, last used, expires, status
- Actions: Revoke token (cannot create - that's project owner's job)
- Filter by: project, status (active/revoked/expired), last used
- Active sessions panel: project name, token name, session start time

7.3 Admin Token Management API

New file: apps/web/app/api/admin/tokens/route.ts

GET: List all tokens (paginated)
- projectId filter (optional)
- status filter: active, revoked, expired
- Returns: token metadata (NOT the hash), project info, usage stats

New file: apps/web/app/api/admin/tokens/[id]/route.ts

GET: Single token details + recent activity
PATCH: Revoke token (set isRevoked=true)
- Cannot un-revoke (security)
- Audit log entry created

7.4 MCP Connection Monitoring API

New file: apps/web/app/api/admin/mcp/stats/route.ts

GET: MCP usage statistics
- Active sessions (with project name, token name, start time)
- Total tool calls (last 24h, 7d, 30d) from aggregates
- Most used tools (top 10)
- Error rate and recent failures

New file: apps/web/app/api/admin/mcp/sessions/route.ts

GET: List active MCP sessions
- Calls MCP server health endpoint internally
- Enriches with project/token info from database
- Returns: sessionId, projectName, tokenName, startTime

7.5 Global Tool Blocklist (Admin Setting)

Admin can block specific MCP tools globally (emergency kill switch).

New file: apps/web/app/api/admin/mcp/blocked-tools/route.ts

GET: List globally blocked tools
POST: Add tool to blocklist
DELETE: Remove tool from blocklist

Storage: Use existing Setting model with key='mcp.blockedTools'

Tool execution order (MCP server):
1. Check global blocklist (Setting) → 403 if blocked
2. Check token-level blockedTools → 403 if blocked
3. Execute tool
4. Log to MCPToolLog

7.6 Emergency Shutdown

New file: apps/web/app/api/admin/mcp/emergency/route.ts

GET: Check emergency shutdown status
POST: Enable emergency shutdown (requires reason)
DELETE: Disable emergency shutdown

Storage: Setting model with key='mcp.emergencyShutdown'
Value: { enabled: boolean, reason: string, enabledAt: ISO timestamp, enabledBy: adminId }

MCP server checks on EVERY tool call:
if (emergencyShutdownEnabled) {
  logToMCPToolLog(toolName, success=false, error='Emergency shutdown active');
  throw new Error('MCP temporarily disabled by administrator: ' + reason);
}

7.7 Log Cleanup Job

New file: apps/web/lib/jobs/mcp-log-cleanup.ts

Schedule: Daily at 3 AM (or via external cron)
Actions:
1. Delete MCPToolLog entries older than 30 days
2. Generate MCPToolAggregate for yesterday (if not exists)
3. Log cleanup stats to console

Can be triggered manually via admin API:
POST /api/admin/mcp/cleanup (for testing)

 ---
 Phase 8: Session Security Hardening

 8.1 Reduce JWT Token Expiry

 File: apps/web/lib/auth.ts

 Change session strategy to include shorter maxAge:
 session: {
   strategy: 'jwt',
   maxAge: 4 * 60 * 60, // 4 hours instead of 30 days
 }

 8.2 Add Token Invalidation Timestamp (Alternative)

 If short expiry is too disruptive, add to User model:
 tokenInvalidatedAt DateTime?

 In JWT callback, check if token was issued before tokenInvalidatedAt.
 If so, return null (force re-login).

 When admin demotes/deactivates user:
 await prisma.user.update({
   where: { id: userId },
   data: { tokenInvalidatedAt: new Date() }
 });

 ---
 Phase 9: Rate Limiting (Optional but Recommended)

 9.1 Add Rate Limiting Middleware

 New file: apps/web/lib/rate-limit.ts

 Use in-memory rate limiting (or Redis in production):
 - /api/admin/users/[id]/reset-password: 5 requests per 15 minutes
 - /api/admin/tokens/[id]: 10 requests per minute
 - /api/admin/*: 100 requests per minute (general)

---
Files to Create

Phase 0-5 (Core Admin):
| File                                                      | Purpose                    |
|-----------------------------------------------------------|----------------------------|
| apps/web/types/next-auth.d.ts                             | TypeScript declarations    |
| apps/web/app/admin/layout.tsx                             | Admin layout               |
| apps/web/app/admin/page.tsx                               | Admin overview/dashboard   |
| apps/web/app/admin/users/page.tsx                         | User management            |
| apps/web/app/admin/settings/page.tsx                      | System settings            |
| apps/web/components/admin/AdminSidebar.tsx                | Admin navigation           |
| apps/web/components/admin/AdminHeader.tsx                 | Admin header               |
| apps/web/app/api/admin/stats/route.ts                     | Stats API                  |
| apps/web/app/api/admin/users/route.ts                     | User list API              |
| apps/web/app/api/admin/users/[id]/route.ts                | Single user API            |
| apps/web/app/api/admin/users/[id]/reset-password/route.ts | Password reset API         |
| apps/web/prisma/scripts/cleanup-demo-user.ts              | Demo user cleanup          |

Phase 6 (Audit):
| File                                                      | Purpose                    |
|-----------------------------------------------------------|----------------------------|
| apps/web/lib/audit.ts                                     | Audit logging helper       |

Phase 7 (MCP Admin):
| File                                                      | Purpose                    |
|-----------------------------------------------------------|----------------------------|
| apps/web/app/admin/agents/page.tsx                        | MCP agent token dashboard  |
| apps/web/app/api/admin/tokens/route.ts                    | List all project tokens    |
| apps/web/app/api/admin/tokens/[id]/route.ts               | Single token + revoke      |
| apps/web/app/api/admin/mcp/stats/route.ts                 | MCP usage statistics       |
| apps/web/app/api/admin/mcp/sessions/route.ts              | Active MCP sessions list   |
| apps/web/app/api/admin/mcp/blocked-tools/route.ts         | Global tool blocklist      |
| apps/web/app/api/admin/mcp/emergency/route.ts             | Emergency shutdown toggle  |
| apps/web/app/api/admin/mcp/cleanup/route.ts               | Manual log cleanup trigger |
| apps/web/lib/jobs/mcp-log-cleanup.ts                      | Log retention job          |

Phase 9 (Rate Limiting - Optional):
| File                                                      | Purpose                    |
|-----------------------------------------------------------|----------------------------|
| apps/web/lib/rate-limit.ts                                | Rate limiting middleware   |

---
Files to Modify

| File                                             | Changes                                |
|--------------------------------------------------|----------------------------------------|
| apps/web/middleware.ts                           | HOTFIX: Remove /api/admin/ from public |
| apps/web/lib/auth.ts                             | Add isActive check + role in JWT       |
| apps/web/app/api/admin/reset-onboarding/route.ts | Add requireUser() temporarily          |
| apps/web/prisma/schema.prisma                    | UserRole, AuditLog, MCPToolLog models  |
| apps/web/lib/auth-server.ts                      | Add requireAdmin(), getCurrentUser role|
| apps/web/prisma/seed-prod.ts                     | Add admin user seeding                 |
| apps/mcp-server/src/index-http.ts                | Add tool logging + emergency check     |

---
Environment Variables

Add to .env.prod-local:
ADMIN_EMAIL=admin@projectpulse.local
ADMIN_PASSWORD=your-secure-password-here

---
Execution Order (Revised)

PHASE 0: HOTFIX (Do FIRST - Separate Commit)
0.1 Remove /api/admin/ from publicApiPrefixes
0.2 Add isActive check to authorize callback
0.3 Add requireUser() to reset-onboarding route
0.4 Commit & deploy hotfix

PHASE 1-2: Database & Auth
1. Add UserRole enum and role field to schema
2. Add AdminAuditLog model to schema
3. Run Prisma migration: add-user-role-and-audit
4. Create types/next-auth.d.ts
5. Update lib/auth.ts (role in JWT/session, shorter expiry)
6. Update lib/auth-server.ts (requireAdmin, include role in getCurrentUser)
7. Update middleware.ts (admin route protection with role check)
8. Replace requireUser() with requireAdmin() in reset-onboarding

PHASE 3-4: Admin APIs & UI (User Management)
9. Create admin API routes (stats, users, reset-password)
10. Create lib/audit.ts helper
11. Add audit logging to all admin write operations
12. Create admin layout and components
13. Create admin pages (overview, users, settings)

PHASE 5: Seed & Cleanup
14. Update seed-prod.ts with admin seeding
15. Create cleanup-demo-user.ts script with --dry-run

PHASE 7: MCP Admin Controls
16. Add MCPToolLog and MCPToolAggregate models to schema
17. Run migration for MCP logging tables
18. Create admin tokens API (list, revoke)
19. Create MCP stats API + sessions API
20. Create global tool blocklist API
21. Create emergency shutdown API
22. Create log cleanup job + API trigger
23. Update MCP server to log tool calls + check emergency/blocklist
24. Create admin/agents page

PHASE 8-9: Hardening (Optional)
25. Implement rate limiting (if time permits)
26. Add tokenInvalidatedAt if short JWT expiry is problematic

DEPLOYMENT:
27. Run migration on production (prisma migrate deploy)
28. Run seed with ADMIN_EMAIL/PASSWORD env vars
29. Run cleanup-demo-user script
30. Verify admin login and features
31. Monitor audit logs

---
Success Criteria

Core Admin:
- [ ] Admin can login at /login with admin credentials
- [ ] Admin is redirected to /admin (not /app)
- [ ] Admin can view user list (no project contents)
- [ ] Admin can deactivate/activate users
- [ ] Admin can reset user passwords
- [ ] Admin can promote/demote users to/from admin
- [ ] Admin CANNOT view user project contents
- [ ] Non-admin users get 403 on /admin/* routes
- [ ] Last admin cannot be demoted/deactivated

Security:
- [ ] /api/admin/* requires admin role (not public)
- [ ] Deactivated users cannot login
- [ ] All admin actions logged to AdminAuditLog
- [ ] JWT expiry reduced to 4 hours (or tokenInvalidatedAt works)

MCP Agent Controls:
- [ ] Admin can view all project tokens across system
- [ ] Admin can revoke any project token
- [ ] Admin can view MCP usage statistics (calls, errors, top tools)
- [ ] Admin can see active sessions (project name, token name, start time)
- [ ] Admin can block specific tools globally
- [ ] Blocked tools return error when agent tries to use them
- [ ] All tool calls logged to MCPToolLog
- [ ] Emergency shutdown stops all MCP tool execution
- [ ] Log cleanup job deletes logs older than 30 days
- [ ] Daily aggregates generated for analytics

Cleanup:
- [ ] Demo user and "Moksha DevHub" project deleted
- [ ] Cleanup script has --dry-run mode

---
Design Decisions (Finalized 2025-12-02)

1. TOOL BLOCKING HIERARCHY:
   ✅ Global (admin) > Project (owner) > Token (agent)
   - Admin blocklist takes precedence over everything
   - If admin blocks a tool, no project/token can use it

2. MCP SESSION VISIBILITY:
   ✅ Admin can see: project name, token name, session start time
   - Does NOT show: tool execution history (user privacy)

3. AGENT ACTIVITY LOGGING:
   ✅ Full logging with 30-day retention + aggregation
   - Every tool call logged to MCPToolLog table
   - Aggregation job runs daily to create usage summaries
   - Raw logs deleted after 30 days, aggregates kept indefinitely

4. PROJECT TOKEN CREATION:
   ❌ Admin cannot create tokens for other users' projects
   - Respects user ownership and privacy
   - Admin can only view and revoke

5. EMERGENCY SHUTDOWN:
   ✅ Include "Kill All MCP" button
   - Critical safety feature
   - Stored in Setting table (mcp.emergencyShutdown)
   - MCP server checks on every tool call