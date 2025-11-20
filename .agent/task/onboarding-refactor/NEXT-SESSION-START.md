# Next Session: Complete Testing (Copy-Paste This)

**Session Goal**: Execute full test suite and validate Sprint 9 refactor

---

## 🚀 Quick Start Commands (Run These First)

```bash
# 1. Rebuild Docker containers with new code
cd /Users/draco/projects/AI_HUB
docker compose -f docker-compose.cloud.yml up --build -d nextjs mcp-server

# 2. Wait for healthy status
sleep 15
docker ps --filter "name=projectpulse" --format "table {{.Names}}\t{{.Status}}"

# 3. Verify health
curl http://192.168.1.15:3000/api/health | jq

# 4. Get project ID
PROJECT_ID=$(docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -t -c "SELECT id FROM \"Project\" LIMIT 1;" | tr -d ' ')
echo "Project ID: $PROJECT_ID"
```

---

## ✅ Execute Test Suite (Copy-Paste Block by Block)

### Block 1: Session 1 - Phase Answers
```bash
# Test saving phase 1
curl -X POST http://192.168.1.15:3000/api/onboarding/phase \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": $PROJECT_ID, \"phase\": 1, \"answers\": {\"phase1_q1\": \"Solo developers\", \"phase1_q2\": \"Ages 25-45\", \"phase1_q3\": \"Save 10+ hours\"}}" | jq

# Test saving phase 2
curl -X POST http://192.168.1.15:3000/api/onboarding/phase \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": $PROJECT_ID, \"phase\": 2, \"answers\": {\"phase2_q1\": [\"Next.js\", \"React\", \"PostgreSQL\"], \"phase2_q2\": \"3 months\"}}" | jq

# Fast-track phases 3-10
for phase in {3..10}; do
  curl -s -X POST http://192.168.1.15:3000/api/onboarding/phase \
    -H "Content-Type: application/json" \
    -d "{\"projectId\": $PROJECT_ID, \"phase\": $phase, \"answers\": {\"phase${phase}_q1\": \"Test answer $phase\"}}" | jq -r '.message'
  sleep 1
done
```

### Block 2: Token Budget Check
```bash
curl -X POST http://192.168.1.15:3000/api/onboarding/token-budget \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": $PROJECT_ID, \"estimatedTokens\": 5000}" | jq
```

### Block 3: Executive Summary
```bash
# Get summary prompt
curl -s "http://192.168.1.15:3000/api/onboarding/summary-prompt?projectId=$PROJECT_ID" | jq '{projectId, metadata, guidance}'

# Store summary
curl -X POST http://192.168.1.15:3000/api/onboarding/executive-summary \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": $PROJECT_ID, \"executiveSummary\": \"Test project for AI-powered task tracking. Target: solo developers. Features: sprint planning, issue tracking, AI agents.\", \"wordCount\": 20}" | jq
```

### Block 4: Session 2 - Document Batches
```bash
# Get batch 1 prompt
curl -s "http://192.168.1.15:3000/api/onboarding/doc-batch?projectId=$PROJECT_ID&batch=1" | jq '{batchName, documentCount: (.documents | length)}'

# Store batch 1 documents
curl -X POST http://192.168.1.15:3000/api/onboarding/documents/batch \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": $PROJECT_ID, \"documents\": [{\"filename\": \"01-PRD.md\", \"content\": \"$(printf '# PRD\n\nTest content\n%.0s' {1..50})\", \"category\": \"planning\", \"wordCount\": 500}, {\"filename\": \"02-SRS.md\", \"content\": \"$(printf '# SRS\n\nTest content\n%.0s' {1..50})\", \"category\": \"planning\", \"wordCount\": 500}]}" | jq
```

### Block 5: Session 3 - Bootstrap
```bash
# Store project plan
curl -X POST http://192.168.1.15:3000/api/onboarding/documents/batch \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": $PROJECT_ID, \"documents\": [{\"filename\": \"13-Project-Plan.md\", \"content\": \"# Project Plan\n\n## Phase A\n\n### Sprint 1 (Weeks 1-2, 8 points)\n- Setup\n- Implement\", \"category\": \"planning\", \"wordCount\": 50}]}" | jq

# Get bootstrap prompt
curl -s "http://192.168.1.15:3000/api/onboarding/bootstrap-prompt?projectId=$PROJECT_ID" | jq '{projectId, techStackCount: (.techStack | length)}'

# Write repo files
mkdir -p /tmp/test-repo
curl -X POST http://192.168.1.15:3000/api/repo/write-minimal \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": $PROJECT_ID, \"repoPath\": \"/tmp/test-repo\"}" | jq

# Verify files
ls -lh /tmp/test-repo/
```

### Block 6: Database Validation
```bash
# Check OnboardingSession
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "SELECT id, \"sessionNumber\", \"planningAnswers\" IS NOT NULL as has_planning, \"projectContextJson\" IS NOT NULL as has_context, status FROM \"OnboardingSession\" WHERE \"projectId\" = $PROJECT_ID;"

# Check prompt templates
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "SELECT \"sessionNumber\", COUNT(*) FROM onboarding_prompt_templates WHERE \"isActive\" = true GROUP BY \"sessionNumber\";"

# Check documents
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "SELECT filename, category FROM \"Document\" WHERE \"onboardingSessionId\" IN (SELECT id FROM \"OnboardingSession\" WHERE \"projectId\" = $PROJECT_ID) ORDER BY filename;"
```

---

## ✅ Success Indicators

After running all blocks, you should see:

1. **Phase Answers**: All 10 phases saved, progress = 100%
2. **Token Budget**: safe=true, remaining ~195K
3. **Executive Summary**: Stored successfully
4. **Documents**: 3+ documents stored (PRD, SRS, Project Plan)
5. **Bootstrap**: CLAUDE.md and AGENTS.md written
6. **Database**: 
   - OnboardingSession has planningAnswers, projectContextJson
   - 16 prompt templates active
   - All documents stored with correct categories

---

## 🐛 If Tests Fail

### Error: "Unknown field planningAnswers"
**Fix**: Docker rebuild didn't complete. Run:
```bash
docker compose -f docker-compose.cloud.yml down
docker compose -f docker-compose.cloud.yml up --build -d
```

### Error: "Foreign key constraint"
**Fix**: Project doesn't exist. Run:
```bash
cd apps/web && pnpm prisma db seed
```

### Error: "Duplicate filenames"
**Fix**: Clean test data:
```bash
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "DELETE FROM \"Document\" WHERE \"onboardingSessionId\" IN (SELECT id FROM \"OnboardingSession\" WHERE \"projectId\" = $PROJECT_ID);"
```

---

## 📊 Final Report Template

After all tests pass, create summary:

```markdown
# Sprint 9 Onboarding Refactor - Test Results

**Date**: [Date]
**Duration**: [X minutes]
**Status**: ✅ PASS / ❌ FAIL

## Test Results
- Session 1 Tools: ✅ PASS
- Session 2 Tools: ✅ PASS  
- Session 3 Tools: ✅ PASS
- Database Schema: ✅ PASS
- Error Handling: ✅ PASS
- Performance: ✅ PASS

## Metrics
- API Response Time: [X]ms
- Token Budget Check: [X]ms
- Documents Stored: [X]
- Prompt Templates: 16/16

## Issues Found
[List any issues]

## Next Steps
[Week 3 enhancements or production deployment]
```

---

**Estimated Time**: 10-15 minutes  
**Prerequisites**: Docker rebuild complete  
**Output**: Full test results + summary document
