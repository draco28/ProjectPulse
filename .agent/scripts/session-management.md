# Session Management Scripts and Commands

**Purpose**: Helpful commands and procedures for managing session context files.

**Last Updated**: 2025-10-27

---

## 📋 Quick Commands Reference

### Finding Latest Session File

**Purpose**: Find the most recent session file when resuming work

**Command** (Bash/Unix):

```bash
ls -t .agent/task/current-session-*.md | head -1
```

**Command** (Windows PowerShell):

```powershell
Get-ChildItem .agent/task/current-session-*.md | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

**Manual**: Look for highest timestamp in format `YYYYMMDD-HHMM`

```
current-session-20251027-0830.md  ← Latest (highest timestamp)
current-session-20251026-1430.md
current-session-20251026-0915.md
```

---

## 🆕 Starting a New Session

### Step 1: Create Session File

**Filename format**: `current-session-[YYYYMMDD-HHMM].md`

**Example**:

```bash
# Get current timestamp (Unix/Mac)
date +"%Y%m%d-%H%M"
# Output: 20251027-0830

# Create new session file from template
cp .agent/task/templates/current-session-template.md .agent/task/current-session-20251027-0830.md
```

**Windows PowerShell**:

```powershell
# Get current timestamp
Get-Date -Format "yyyyMMdd-HHmm"

# Create new session file from template
Copy-Item .agent/task/templates/current-session-template.md .agent/task/current-session-20251027-0830.md
```

### Step 2: Fill in Session Details

Open the new file and replace placeholders:

- `[TIMESTAMP]` → Actual timestamp (20251027-0830)
- `[Phase name]` → Current phase from STATUS.md
- `[HH:MM]` → Session start time

### Step 3: Create/Update Current Todos

If starting a new phase:

```bash
cp .agent/task/templates/current-todos-template.md .agent/task/current-todos.md
# Edit to add phase-specific todos
```

If continuing existing phase:

```bash
# current-todos.md already exists, just read it
cat .agent/task/current-todos.md
```

---

## 📝 Sub-Agent Output Locations

**Where Sub-Agents Save Their Reports**:

Sub-agents always save their output reports to `.agent/task/` with descriptive filenames:

**Format**: `[agent-type]-[topic]-[timestamp].md`

**Examples**:

- `explore-api-patterns-20251027-1430.md` - Codebase exploration report
- `architecture-search-20251027-1445.md` - Architecture analysis
- `prisma-design-schema-20251027-1502.md` - Database design plan
- `react-component-arch-20251027-1515.md` - Component architecture
- `synthesize-sop-endpoints-20251027-1530.md` - Generated SOP

**Finding Sub-Agent Reports**:

```bash
# List all sub-agent reports from today
ls .agent/task/*-$(date +%Y%m%d)-*.md
```

**Important**: Sub-agents create these files but NEVER update `current-session.md`. Only the parent agent reads sub-agent reports and updates the session file.

---

## 🔄 Resuming After Interruption

### Recovery Procedure

**Step 1**: Read STATUS.md

```bash
# Find last completed task
grep "Last Task Completed" STATUS.md

# Find last checkpoint
grep "Last Checkpoint" STATUS.md
```

**Step 2**: Find and read latest session file

```bash
# Unix/Mac
LATEST_SESSION=$(ls -t .agent/task/current-session-*.md | head -1)
cat "$LATEST_SESSION"

# Windows PowerShell
$latestSession = Get-ChildItem .agent/task/current-session-*.md | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Get-Content $latestSession.FullName
```

**Step 3**: Read current todos

```bash
cat .agent/task/current-todos.md
# Look for "🔄 In Progress" section
```

**Step 4**: Resume work

- Continue from in-progress task
- Update session file as work progresses
- Update current-todos.md when tasks complete

---

## 📂 Archiving Old Sessions

**When to archive**:

- Phase completed
- Week ended
- Session interrupted and new one started
- Disk space cleanup (keep last 10 sessions active)

**How to archive**:

**Unix/Mac**:

```bash
# Archive specific session
mv .agent/task/current-session-20251026-1430.md .agent/task/archive/

# Archive all sessions older than current
LATEST=$(ls -t .agent/task/current-session-*.md | head -1)
ls .agent/task/current-session-*.md | grep -v "$(basename $LATEST)" | xargs -I {} mv {} .agent/task/archive/

# Archive sessions older than 7 days
find .agent/task -name "current-session-*.md" -mtime +7 -exec mv {} .agent/task/archive/ \;
```

**Windows PowerShell**:

```powershell
# Archive specific session
Move-Item .agent/task/current-session-20251026-1430.md .agent/task/archive/

# Archive all sessions except latest
$latest = Get-ChildItem .agent/task/current-session-*.md | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Get-ChildItem .agent/task/current-session-*.md | Where-Object { $_.Name -ne $latest.Name } | Move-Item -Destination .agent/task/archive/

# Archive sessions older than 7 days
Get-ChildItem .agent/task/current-session-*.md | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Move-Item -Destination .agent/task/archive/
```

**Note**: Keep `current-todos.md` active - do NOT archive it until phase is complete!

---

## 📊 Session File Maintenance

### Clean Up Sub-Agent Reports

Sub-agents create report files that accumulate over time:

- `explore-[topic]-[timestamp].md`
- `architecture-[topic]-[timestamp].md`
- `prisma-[topic]-[timestamp].md`
- etc.

**Archive old reports** (keep last 5 per agent type):

**Unix/Mac**:

```bash
# Archive old explore reports (keep last 5)
ls -t .agent/task/explore-*.md | tail -n +6 | xargs -I {} mv {} .agent/task/archive/

# Archive all report types
for prefix in explore architecture prisma react nextjs; do
  ls -t .agent/task/${prefix}-*.md 2>/dev/null | tail -n +6 | xargs -I {} mv {} .agent/task/archive/
done
```

**Windows PowerShell**:

```powershell
# Archive old explore reports (keep last 5)
Get-ChildItem .agent/task/explore-*.md | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5 | Move-Item -Destination .agent/task/archive/

# Archive all report types
$prefixes = @('explore', 'architecture', 'prisma', 'react', 'nextjs')
foreach ($prefix in $prefixes) {
    Get-ChildItem .agent/task/$prefix-*.md -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -Skip 5 |
        Move-Item -Destination .agent/task/archive/
}
```

### Check Disk Usage

**Unix/Mac**:

```bash
# Check .agent/task/ directory size
du -sh .agent/task/

# Count files
ls .agent/task/*.md | wc -l

# Check archive size
du -sh .agent/task/archive/
```

**Windows PowerShell**:

```powershell
# Check .agent/task/ directory size
(Get-ChildItem .agent/task -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

# Count files
(Get-ChildItem .agent/task/*.md).Count

# Check archive size
(Get-ChildItem .agent/task/archive -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
```

---

## 🔍 Searching Session History

### Find When Something Was Done

**Search all session files**:

**Unix/Mac**:

```bash
# Find when a specific task was completed
grep -r "Implemented POST /api/issues" .agent/task/current-session-*.md
grep -r "Implemented POST /api/issues" .agent/task/archive/

# Search with timestamp
grep -H "Implemented POST /api/issues" .agent/task/*.md | sed 's/.*current-session-\([0-9-]*\).md.*/\1/'
```

**Windows PowerShell**:

```powershell
# Find when a specific task was completed
Select-String -Path .agent/task/current-session-*.md -Pattern "Implemented POST /api/issues"
Select-String -Path .agent/task/archive/*.md -Pattern "Implemented POST /api/issues"

# Extract timestamps
Select-String -Path .agent/task/*.md -Pattern "Implemented POST /api/issues" |
    ForEach-Object { $_.Filename -match '\d{8}-\d{4}'; $matches[0] }
```

### Find Sub-Agent Reports by Topic

**Unix/Mac**:

```bash
# Find all architecture analyses
ls .agent/task/architecture-*.md .agent/task/archive/architecture-*.md

# Find specific topic
ls .agent/task/*-search-*.md .agent/task/archive/*-search-*.md
```

**Windows PowerShell**:

```powershell
# Find all architecture analyses
Get-ChildItem .agent/task/architecture-*.md, .agent/task/archive/architecture-*.md

# Find specific topic
Get-ChildItem .agent/task/*-search-*.md, .agent/task/archive/*-search-*.md
```

---

## 📈 Session Statistics

### Count Sessions This Week

**Unix/Mac**:

```bash
# Count sessions in last 7 days
find .agent/task -name "current-session-*.md" -mtime -7 | wc -l

# List sessions this week with timestamps
find .agent/task -name "current-session-*.md" -mtime -7 -exec basename {} \; | sort
```

**Windows PowerShell**:

```powershell
# Count sessions in last 7 days
(Get-ChildItem .agent/task/current-session-*.md | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }).Count

# List sessions this week with timestamps
Get-ChildItem .agent/task/current-session-*.md |
    Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) } |
    ForEach-Object { $_.Name } | Sort-Object
```

### Calculate Session Duration

From session file:

```bash
# Extract started and last updated times
grep "Started:" .agent/task/current-session-20251027-0830.md
grep "Last Updated:" .agent/task/current-session-20251027-0830.md

# Manual calculation: [Last Updated] - [Started]
```

---

## 🛠️ Troubleshooting

### No current-session Files Exist

**Cause**: First time using persistence system or files accidentally deleted

**Fix**:

```bash
# Create new session file from template
cp .agent/task/templates/current-session-template.md .agent/task/current-session-$(date +"%Y%m%d-%H%M").md

# Read STATUS.md to fill in current phase
cat STATUS.md
```

### Multiple In-Progress Sessions

**Cause**: Started new session without archiving old one

**Fix**: Archive all but the latest

```bash
# Unix/Mac
LATEST=$(ls -t .agent/task/current-session-*.md | head -1)
ls .agent/task/current-session-*.md | grep -v "$(basename $LATEST)" | xargs -I {} mv {} .agent/task/archive/
```

### current-todos.md Out of Sync with TodoWrite

**Cause**: Forgot to update file after TodoWrite changes

**Fix**: Manually sync from TodoWrite UI or recreation

```bash
# Recreate from template
cp .agent/task/templates/current-todos-template.md .agent/task/current-todos.md
# Then manually fill in current todos
```

### Session File Conflicts (Git)

**Cause**: Multiple developers/sessions creating same timestamp

**Prevention**: Include initials in timestamp

```bash
# Instead of: current-session-20251027-0830.md
# Use: current-session-20251027-0830-jd.md (John Doe)
```

**Resolution**:

```bash
# Keep both, merge manually
git checkout --ours .agent/task/current-session-20251027-0830.md
git checkout --theirs .agent/task/current-session-20251027-0830-alt.md
# Then manually merge important information
```

---

## 🔐 Best Practices

### 1. **Always Create New Session File at Session Start**

Don't reuse old session files - create a fresh one for each work session.

### 2. **Update Session File Frequently**

After completing each major step, update the session file. Aim for every 15-30 minutes.

### 3. **Archive Regularly**

Archive old session files weekly or after phase completion to keep .agent/task/ clean.

### 4. **Backup Archive Folder**

The archive contains historical context - backup to cloud/git regularly.

### 5. **Use Consistent Timestamps**

Always use `YYYYMMDD-HHMM` format. Don't use variations like `YYYY-MM-DD` or `current`.

### 6. **Keep current-todos.md Active**

Don't archive `current-todos.md` until the phase is complete. It should always represent the current phase's todo list.

### 7. **Clean Up Sub-Agent Reports**

Keep last 5 reports per agent type, archive the rest to prevent clutter.

---

## 📚 Related Documentation

- [.agent/task/README.md](.agent/task/README.md) - Task context file system overview
- [.agent/task/templates/](.agent/task/templates/) - File templates
- [.agent/workflows/persistence-rules.md](.agent/workflows/persistence-rules.md) - Rules for all agents
- [CLAUDE.md](../../CLAUDE.md) - Integration guide

---

## 💡 Pro Tips

### Alias Commands (Unix/Mac)

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Quick access to latest session
alias session-latest='cat $(ls -t .agent/task/current-session-*.md | head -1)'

# Quick access to todos
alias todos='cat .agent/task/current-todos.md'

# Archive old sessions (keep last 3)
alias session-clean='ls -t .agent/task/current-session-*.md | tail -n +4 | xargs -I {} mv {} .agent/task/archive/'
```

### PowerShell Functions

Add to `$PROFILE`:

```powershell
# Quick access to latest session
function Get-LatestSession {
    $latest = Get-ChildItem .agent/task/current-session-*.md | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Get-Content $latest.FullName
}
Set-Alias session-latest Get-LatestSession

# Quick access to todos
function Get-Todos {
    Get-Content .agent/task/current-todos.md
}
Set-Alias todos Get-Todos

# Archive old sessions (keep last 3)
function Clear-OldSessions {
    Get-ChildItem .agent/task/current-session-*.md | Sort-Object LastWriteTime -Descending | Select-Object -Skip 3 | Move-Item -Destination .agent/task/archive/
}
Set-Alias session-clean Clear-OldSessions
```

---

**Remember**: These session files are your safety net against context compaction. Use them consistently!
