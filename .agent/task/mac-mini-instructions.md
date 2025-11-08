# Mac Mini Instructions from Windows Claude Code

**Last Updated**: 2025-11-08 23:14 IST
**Status**: PENDING EXECUTION
**Commit**: (pending)

---

## 🎯 TASK: Query Database for Integration Testing

### Context

Windows Claude Code needs to perform integration testing of the complete workflow:
- Phase → Week → Day → Task → Session → Progress

We have an existing "Mac Mini Cloud Test" phase in the database (ID: `cmhqhobm90000zhljjbmlwnsw`). We need the complete hierarchy to create tasks, sessions, and test progress updates.

**Current Testing Status**:
- ✅ POST /api/phases (bug fix verified)
- ⚠️ POST /api/progress, /api/tasks, /api/sessions blocked by UUID/CUID validation mismatch
- 🎯 **Workaround**: Use existing database entities for testing

---

## 📋 Instructions

Execute these SQL queries to get the complete hierarchy:

### Step 1: Get Phase → Week → Day Hierarchy

```bash
cd ~/projects/AI_HUB
docker exec -it projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
SELECT
  p.id as phase_id,
  p.title as phase_title,
  w.id as week_id,
  w.title as week_title,
  w.\"weekNumber\",
  d.id as day_id,
  d.title as day_title,
  d.\"dayNumber\"
FROM \"Phase\" p
LEFT JOIN \"Week\" w ON w.\"phaseId\" = p.id
LEFT JOIN \"Day\" d ON d.\"weekId\" = w.id
WHERE p.title = 'Mac Mini Cloud Test'
ORDER BY w.\"weekNumber\", d.\"dayNumber\";
"
```

### Step 2: Check for Existing Tasks (if any)

```bash
docker exec -it projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
SELECT
  t.id as task_id,
  t.title as task_title,
  t.\"dayId\",
  t.progress,
  s.id as session_id,
  s.title as session_title
FROM \"Task\" t
LEFT JOIN \"Session\" s ON s.\"taskId\" = t.id
WHERE t.\"dayId\" IN (
  SELECT d.id FROM \"Day\" d
  JOIN \"Week\" w ON d.\"weekId\" = w.id
  JOIN \"Phase\" p ON w.\"phaseId\" = p.id
  WHERE p.title = 'Mac Mini Cloud Test'
)
ORDER BY t.title, s.title;
"
```

### Step 3: Report Results

Update this file with the query results in this format:

```markdown
## ✅ COMPLETED - 2025-11-08 [TIME]

**Phase Hierarchy**:
| Phase ID | Week ID | Week # | Day ID | Day # | Day Title |
|----------|---------|--------|--------|-------|-----------|
| cmh... | cmh... | 1 | cmh... | 1 | Day 1 |
| (paste all rows here) |

**Existing Tasks** (if any):
| Task ID | Task Title | Day ID | Progress | Session ID | Session Title |
|---------|------------|--------|----------|------------|---------------|
| (paste results or "None found") |

**IDs for Integration Testing**:
- Phase ID: `cmhqhobm90000zhljjbmlwnsw`
- Week ID: `[first week from results]`
- Day ID for Task Creation: `[first day from results]`
- Recommended Day: Day 1 (first day of Week 1)
```

Then commit and push:
```bash
git add .agent/task/mac-mini-instructions.md
git commit -m "chore: database hierarchy query results for integration testing"
git push origin feature/sprint-1-foundation
```

---

## 🎯 Success Criteria

- ✅ SQL queries executed successfully
- ✅ Phase hierarchy retrieved (Phase → Week → Day IDs)
- ✅ Existing tasks checked (if any)
- ✅ Day ID identified for creating test task
- ✅ Results formatted and committed to Git

---

## 💡 What Windows Will Do Next

Once Mac mini reports the Day ID, Windows Claude Code will:

1. **Create Task** via POST /api/tasks (using Day ID)
2. **Create Session** via POST /api/sessions (using Task ID from step 1)
3. **Update Progress** via POST /api/progress (using Session ID from step 2)
4. **Verify Roll-Up** - Check that progress propagates: Session → Task → Day → Week → Phase

This tests the complete integration workflow.

---

