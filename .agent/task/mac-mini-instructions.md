# Mac Mini Instructions - Sprint 2 Week 4 Verification

**Created**: 2025-11-12 14:00
**Phase**: Sprint 2 Week 4 (Onboarding System)
**Task**: Restart Next.js Server + Verify Onboarding API Endpoints

---

## Context

Sprint 2 Week 4 implementation (US-026 to US-031) is complete on Windows side:
- ✅ Prisma schema: OnboardingSession + OnboardingTemplate models
- ✅ Migration: Applied locally on Windows
- ✅ Seed: 3 templates created
- ✅ API Routes: GET /api/onboarding/prompt + POST /api/onboarding/responses
- ✅ MCP Tools: onboarding.getPrompt + onboarding.submitResponse
- ✅ TypeScript: 0 errors (compiles successfully)

**CRITICAL**: Mac mini Next.js server needs to restart to reload Prisma client with new models.

Branch: `feature/sprint-2-week-4`

---

## Instructions

### Step 1: Pull Latest Code
```bash
cd ~/Projects/AI_HUB
git fetch origin feature/sprint-2-week-4
git pull origin feature/sprint-2-week-4
```

**Expected**: Clean pull with new files:
- `apps/web/prisma/migrations/[timestamp]_add_onboarding_models/migration.sql`
- `apps/web/app/api/onboarding/prompt/route.ts`
- `apps/web/app/api/onboarding/responses/route.ts`
- `apps/web/lib/validations/onboarding.ts`
- `apps/mcp-server/src/tools/onboarding/*`

### Step 2: Apply Migration to Mac Mini Database
```bash
cd ~/Projects/AI_HUB/apps/web
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" npx prisma migrate deploy
```

**Expected Output**:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "projectpulse_dev"

1 migration found in prisma/migrations

Applying migration `[timestamp]_add_onboarding_models`

The following migration have been applied:

migrations/
  └─ [timestamp]_add_onboarding_models/
    └─ migration.sql

All migrations have been successfully applied.
```

### Step 3: Regenerate Prisma Client
```bash
cd ~/Projects/AI_HUB/apps/web
npx prisma generate
```

**Expected Output**:
```
✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client
```

### Step 4: Run Seed Script (Add 3 Templates)
```bash
cd ~/Projects/AI_HUB/apps/web
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" npx tsx prisma/seed.ts
```

**Expected**: Seed should show onboarding templates created:
```
✅ Onboarding templates seeded (3 templates)
```

### Step 5: Restart Docker Compose (Next.js Server)
```bash
cd ~/Projects/AI_HUB
docker-compose restart web
```

**Alternative** (if restart doesn't work):
```bash
# Stop and start to force full reload
docker-compose stop web
docker-compose up -d web
```

**Verification**:
```bash
# Check container is running
docker ps | grep projectpulse-web

# Check logs for successful start
docker logs projectpulse-web --tail 50

# Look for: "ready started server on 0.0.0.0:3000"
```

### Step 6: Verify Health Check
```bash
curl http://localhost:3000/api/health
```

**Expected Output**:
```json
{"status":"healthy","database":"connected"}
```

### Step 7: Test Onboarding API Endpoints

**Test 1: GET Prompt (Session 1)**
```bash
curl -X GET "http://localhost:3000/api/onboarding/prompt?projectId=4&sessionNumber=1" -H "Content-Type: application/json"
```

**Expected Output** (200 OK):
```json
{
  "data": {
    "sessionNumber": 1,
    "title": "Executive Summary",
    "promptText": "...",
    "placeholders": ["PROJECT_NAME", "OWNER_NAME"],
    "resolvedVariables": {}
  }
}
```

**Test 2: POST Response**
```bash
curl -X POST "http://localhost:3000/api/onboarding/responses" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 4,
    "sessionNumber": 1,
    "responses": {
      "PROJECT_NAME": "Test Project",
      "OWNER_NAME": "Moksha Dev"
    }
  }'
```

**Expected Output** (200 OK):
```json
{
  "data": {
    "sessionId": "...",
    "sessionNumber": 1,
    "completedAt": "2025-11-12T...",
    "nextSession": 2
  }
}
```

**Test 3: GET Prompt (Session 2 with prefilled variables)**
```bash
curl -X GET "http://localhost:3000/api/onboarding/prompt?projectId=4&sessionNumber=2" -H "Content-Type: application/json"
```

**Expected Output** (200 OK with resolvedVariables prefilled from Session 1):
```json
{
  "data": {
    "sessionNumber": 2,
    "title": "Industry & Domain Context",
    "promptText": "...",
    "placeholders": ["PROJECT_NAME", "INDUSTRY", "DOMAIN"],
    "resolvedVariables": {
      "PROJECT_NAME": "Test Project",
      "OWNER_NAME": "Moksha Dev"
    }
  }
}
```

### Step 8: Verify Database Records
```bash
cd ~/Projects/AI_HUB/apps/web
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" npx prisma studio
```

**Verify**:
1. Navigate to `OnboardingTemplate` table → Should show 3 records (Sessions 1-3)
2. Navigate to `OnboardingSession` table → Should show 1 record (projectId: 4, sessionNumber: 1, responses JSON)

---

## Troubleshooting

**If migration fails (table already exists)**:
```bash
# Check if tables exist
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" psql -c "\dt onboarding*"

# If tables exist but migration not recorded:
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" npx prisma migrate resolve --applied [migration_name]
```

**If API returns 404**:
```bash
# Check route files exist
ls -la ~/Projects/AI_HUB/apps/web/app/api/onboarding/

# Check Next.js server logs
docker logs projectpulse-web --tail 100
```

**If API returns 500 (Prisma model not found)**:
```bash
# Verify Prisma client was regenerated
ls -la ~/Projects/AI_HUB/apps/web/node_modules/.prisma/client/

# Force regenerate and restart
cd ~/Projects/AI_HUB/apps/web
npx prisma generate
docker-compose restart web
```

**If templates not in database**:
```bash
# Check seed script
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" \
  psql -c "SELECT COUNT(*) FROM \"OnboardingTemplate\";"

# If 0, re-run seed
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" \
  npx tsx prisma/seed.ts
```

---

## Results

**Executed by**: Mac mini Claude Code
**Timestamp**: [To be filled by Mac mini]
**Status**: [To be filled by Mac mini]

### Execution Log

**Step 1**: Pull latest code → [STATUS]
**Step 2**: Apply migration → [STATUS]
**Step 3**: Regenerate Prisma Client → [STATUS]
**Step 4**: Run seed script → [STATUS]
**Step 5**: Restart Docker Compose → [STATUS]
**Step 6**: Health check → [STATUS]
**Step 7**: API endpoint tests → [STATUS]
**Step 8**: Database verification → [STATUS]

### Test Results

**GET /api/onboarding/prompt?projectId=4&sessionNumber=1**:
```
[Output to be pasted here]
```

**POST /api/onboarding/responses**:
```
[Output to be pasted here]
```

**GET /api/onboarding/prompt?projectId=4&sessionNumber=2**:
```
[Output to be pasted here]
```

### Database Verification

**OnboardingTemplate count**: [NUMBER]
**OnboardingSession count**: [NUMBER]

**Screenshot from Prisma Studio** (optional): [Describe what you see]

---

## Next Steps

Once all tests pass successfully:
1. Mac mini commits results to this file
2. Mac mini pushes to `feature/sprint-2-week-4` branch
3. Windows Claude Code pulls and proceeds with documentation updates
4. Final commit: "feat(onboarding): Implement US-026 to US-031 (24 points)"

---

**Note**: This is a critical checkpoint. All 8 steps must succeed before Sprint 2 Week 4 can be marked COMPLETE.
