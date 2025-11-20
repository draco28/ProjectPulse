# Sprint 9 Onboarding Refactor - Testing Checklist

**Status**: Ready for Testing  
**Date**: 2025-11-20  
**Blocker**: Docker containers need rebuild with new code

---

## 🚨 CRITICAL: Pre-Test Setup (DO THIS FIRST)

### Step 1: Rebuild Docker Containers
```bash
cd /Users/draco/projects/AI_HUB
docker compose -f docker-compose.cloud.yml up --build -d nextjs mcp-server
```

**Wait for healthy status:**
```bash
sleep 10
docker ps --filter "name=projectpulse" --format "table {{.Names}}\t{{.Status}}"
curl http://192.168.1.15:3000/api/health
```

### Step 2: Verify Project ID
```bash
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "SELECT id, name FROM \"Project\" LIMIT 5;"
```

**Expected**: Should see project with ID (use this ID in all tests below)

---

## ✅ Test Suite 1: Session 1 Tools (Phase-Based Q&A)

### Test 1.1: Save Phase 1 Answers
```bash
PROJECT_ID=5  # Replace with actual ID from Step 2

curl -X POST http://192.168.1.15:3000/api/onboarding/phase \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"phase\": 1,
    \"answers\": {
      \"phase1_q1\": \"Solo developers and small dev teams (2-5 people)\",
      \"phase1_q2\": \"Ages 25-45, work remotely, struggle with task tracking\",
      \"phase1_q3\": \"Save 10+ hours per week on manual tracking\"
    }
  }" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "projectId": 5,
  "phase": 1,
  "phasesComplete": 1,
  "progress": 10,
  "nextPhase": 2,
  "message": "Phase 1 saved ✅. Proceed to Phase 2."
}
```

### Test 1.2: Save Phase 2 Answers
```bash
curl -X POST http://192.168.1.15:3000/api/onboarding/phase \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"phase\": 2,
    \"answers\": {
      \"phase2_q1\": [\"Next.js\", \"React\", \"PostgreSQL\", \"Prisma\"],
      \"phase2_q2\": \"3 months\",
      \"phase2_q3\": \"$5000\"
    }
  }" | jq
```

**Expected**: `"phasesComplete": 2, "progress": 20, "nextPhase": 3`

### Test 1.3: Check Token Budget
```bash
curl -X POST http://192.168.1.15:3000/api/onboarding/token-budget \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"estimatedTokens\": 5000
  }" | jq
```

**Expected Response:**
```json
{
  "projectId": 5,
  "sessionNumber": 1,
  "tokensUsed": 0,
  "estimatedTokens": 5000,
  "totalEstimated": 5000,
  "budgetLimit": 200000,
  "remaining": 195000,
  "safe": true,
  "recommendation": "Proceed with operation"
}
```

### Test 1.4: Complete All 10 Phases (Fast Track)
```bash
# Phases 3-10 (abbreviated for speed)
for phase in {3..10}; do
  curl -s -X POST http://192.168.1.15:3000/api/onboarding/phase \
    -H "Content-Type: application/json" \
    -d "{
      \"projectId\": $PROJECT_ID,
      \"phase\": $phase,
      \"answers\": {
        \"phase${phase}_q1\": \"Test answer for phase $phase\"
      }
    }" | jq -r '.message'
  sleep 1
done
```

**Expected**: Final message should say "All phases complete! Call finalizeSummary."

### Test 1.5: Get Executive Summary Prompt
```bash
curl -s "http://192.168.1.15:3000/api/onboarding/summary-prompt?projectId=$PROJECT_ID" | jq -r '.guidance'
```

**Expected**: Should return systemPrompt, userPrompt with all 96 Q&A pairs injected

---

## ✅ Test Suite 2: Session 2 Tools (Batched Documents)

### Test 2.1: Store Executive Summary (Prerequisite)
```bash
curl -X POST http://192.168.1.15:3000/api/onboarding/executive-summary \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"executiveSummary\": \"This is a test project for AI-powered task tracking. Target users are solo developers. Key features include sprint planning, issue tracking, and AI agent integration.\",
    \"wordCount\": 25
  }" | jq
```

### Test 2.2: Get Doc Batch 1 Prompt (Planning Docs)
```bash
curl -s "http://192.168.1.15:3000/api/onboarding/doc-batch?projectId=$PROJECT_ID&batch=1" | jq '{batchName, documentCount: (.documents | length), estimatedTotalTokens}'
```

**Expected Response:**
```json
{
  "batchName": "Planning",
  "documentCount": 4,
  "estimatedTotalTokens": 45000
}
```

### Test 2.3: Store Batch 1 Documents
```bash
curl -X POST http://192.168.1.15:3000/api/onboarding/documents/batch \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"documents\": [
      {
        \"filename\": \"01-PRD.md\",
        \"content\": \"$(printf '# Product Requirements Document\n\n## Overview\nTest PRD content for batch storage.\n\n%.0s' {1..100})\",
        \"category\": \"planning\",
        \"wordCount\": 500
      },
      {
        \"filename\": \"02-SRS.md\",
        \"content\": \"$(printf '# Software Requirements Specification\n\n## Functional Requirements\nTest SRS content.\n\n%.0s' {1..100})\",
        \"category\": \"planning\",
        \"wordCount\": 500
      }
    ]
  }" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "created": 2,
  "batchesComplete": 1,
  "totalDocuments": 2,
  "progress": 13,
  "message": "Batch 1 stored ✅. 2/15 documents complete. Proceed to batch 2."
}
```

### Test 2.4: Verify No Duplicate Filenames
```bash
# Try to store same filename again - should fail
curl -X POST http://192.168.1.15:3000/api/onboarding/documents/batch \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"documents\": [
      {
        \"filename\": \"01-PRD.md\",
        \"content\": \"Duplicate test\",
        \"category\": \"planning\",
        \"wordCount\": 10
      }
    ]
  }" | jq
```

**Expected**: `"error": "Duplicate filenames"`

---

## ✅ Test Suite 3: Session 3 Tools (Bootstrap)

### Test 3.1: Store 13-Project-Plan.md (Prerequisite)
```bash
curl -X POST http://192.168.1.15:3000/api/onboarding/documents/batch \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"documents\": [
      {
        \"filename\": \"13-Project-Plan.md\",
        \"content\": \"# Project Plan\n\n## Phase A: Foundation\n\n### Sprint 1 (Weeks 1-2, 8 points)\n- Setup PostgreSQL\n- Implement Prisma\n\n### Sprint 2 (Weeks 3-4, 10 points)\n- Build API routes\n- Create UI components\",
        \"category\": \"planning\",
        \"wordCount\": 50
      }
    ]
  }" | jq
```

### Test 3.2: Get Bootstrap Prompt
```bash
curl -s "http://192.168.1.15:3000/api/onboarding/bootstrap-prompt?projectId=$PROJECT_ID" | jq '{projectId, techStackCount: (.techStack | length), guidance}'
```

**Expected**: Should return systemPrompt, userPrompt with project plan markdown and tech stack

### Test 3.3: Write Minimal Repo Files
```bash
curl -X POST http://192.168.1.15:3000/api/repo/write-minimal \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"repoPath\": \"/tmp/test-repo\"
  }" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "filesWritten": ["CLAUDE.md", "AGENTS.md"],
  "message": "Optional files written to repo ✅"
}
```

**Verify Files:**
```bash
ls -lh /tmp/test-repo/
cat /tmp/test-repo/CLAUDE.md | head -20
```

---

## ✅ Test Suite 4: MCP Tools (Via MCP Server)

### Test 4.1: Health Check
```bash
# Via MCP tool (if connected)
mcp0_projectpulse_health_check(verbose=true)
```

### Test 4.2: Legacy Tools Still Work
```bash
# Test old getQuestions tool (backward compat)
mcp0_projectpulse_onboarding_getQuestions(projectId=$PROJECT_ID, phase=1)
```

**Expected**: Should return questions for phase 1 (legacy tool still works)

### Test 4.3: New Refactored Tools Available
```bash
# After MCP server restart, these should be available:
# - projectpulse_onboarding_getPhasedQuestions
# - projectpulse_onboarding_savePhase
# - projectpulse_onboarding_finalizeSummary
# - projectpulse_onboarding_checkTokenBudget
# - projectpulse_onboarding_getDocBatchPrompt
# - projectpulse_onboarding_storeBatch
# - projectpulse_onboarding_getBootstrapPrompt
# - projectpulse_repo_writeMinimal
```

---

## ✅ Test Suite 5: Database Validation

### Test 5.1: Verify OnboardingSession Schema
```bash
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
SELECT 
  id, 
  \"projectId\", 
  \"sessionNumber\",
  \"planningAnswers\" IS NOT NULL as has_planning,
  \"projectContextJson\" IS NOT NULL as has_context,
  metrics IS NOT NULL as has_metrics,
  status
FROM \"OnboardingSession\"
WHERE \"projectId\" = $PROJECT_ID
ORDER BY \"sessionNumber\";
"
```

**Expected**: Should show Session 1 with `has_planning=t`, `has_context=t`, `has_metrics=t`

### Test 5.2: Verify OnboardingPromptTemplate Count
```bash
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
SELECT 
  \"sessionNumber\",
  phase,
  batch,
  COUNT(*) as template_count
FROM onboarding_prompt_templates
WHERE \"isActive\" = true
GROUP BY \"sessionNumber\", phase, batch
ORDER BY \"sessionNumber\", phase, batch;
"
```

**Expected**: 
- Session 1: 10 phase templates + 1 summary = 11 total
- Session 2: 4 batch templates
- Session 3: 1 bootstrap template
- **Total: 16 templates**

### Test 5.3: Verify Document Storage
```bash
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
SELECT 
  filename,
  category,
  \"wordCount\",
  LENGTH(content) as content_length
FROM \"Document\"
WHERE \"onboardingSessionId\" IN (
  SELECT id FROM \"OnboardingSession\" WHERE \"projectId\" = $PROJECT_ID
)
ORDER BY filename;
"
```

**Expected**: Should show all stored documents with correct categories

---

## ✅ Test Suite 6: Error Handling

### Test 6.1: Invalid Project ID
```bash
curl -s -X POST http://192.168.1.15:3000/api/onboarding/phase \
  -H "Content-Type: application/json" \
  -d '{"projectId": 99999, "phase": 1, "answers": {}}' | jq
```

**Expected**: Foreign key constraint error

### Test 6.2: Invalid Phase Number
```bash
curl -s -X POST http://192.168.1.15:3000/api/onboarding/phase \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": $PROJECT_ID, \"phase\": 11, \"answers\": {}}" | jq
```

**Expected**: Validation error "Phase must be between 1-10"

### Test 6.3: Token Budget Exceeded
```bash
curl -s -X POST http://192.168.1.15:3000/api/onboarding/token-budget \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": $PROJECT_ID, \"estimatedTokens\": 250000}" | jq
```

**Expected**: `"safe": false, "recommendation": "Token budget exceeded"`

---

## 📊 Success Criteria

### All Tests Must Pass:
- ✅ All API routes return 200 OK (no 500 errors)
- ✅ Database schema has new fields (planningAnswers, projectContextJson, metrics)
- ✅ 16 prompt templates seeded and active
- ✅ Phase answers stored correctly in planningAnswers JSONB
- ✅ Token budget tracking works
- ✅ Batch document storage works (no duplicates)
- ✅ Bootstrap prompt returns project plan markdown
- ✅ Repo files written successfully
- ✅ Legacy tools still work (backward compat)
- ✅ Error handling works correctly

### Performance Benchmarks:
- ✅ API response time <500ms (P95)
- ✅ Token budget check <100ms
- ✅ Batch document insert <1s for 5 docs

---

## 🐛 Known Issues & Fixes

### Issue 1: Prisma Client Out of Sync
**Symptom**: "Unknown field `planningAnswers`"  
**Fix**: Rebuild Docker containers (see Step 1)

### Issue 2: Project ID Not Found
**Symptom**: Foreign key constraint error  
**Fix**: Run `pnpm prisma db seed` and use correct project ID

### Issue 3: Code Changes Not Reflected
**Symptom**: Old behavior persists after code changes  
**Fix**: Rebuild Docker images, not just restart

---

## 📝 Testing Notes

**Test Duration**: ~10-15 minutes for full suite  
**Prerequisites**: Docker containers rebuilt with new code  
**Test Order**: Must follow sequence (Session 1 → 2 → 3)  
**Cleanup**: Each test uses same project, no cleanup needed between tests

---

## ✅ Final Validation Checklist

After all tests pass:

- [ ] All 6 test suites completed successfully
- [ ] No 500 errors in any API route
- [ ] Database has correct schema and data
- [ ] MCP tools registered and accessible
- [ ] Legacy tools still work
- [ ] Performance benchmarks met
- [ ] Error handling validated
- [ ] Documentation updated

---

**Next Steps After Testing:**
1. Update `.agent/task/current-plan.md` with test results
2. Create summary document of findings
3. Plan Week 3 enhancements (optional batch create tools, observability)
4. Update user documentation with new tool names

---

**Last Updated**: 2025-11-20  
**Tested By**: [To be filled after testing]  
**Test Status**: Ready for Execution
