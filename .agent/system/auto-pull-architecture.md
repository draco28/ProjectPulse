# Auto-Pull Architecture

**Purpose**: Keep Mac mini Docker environment synchronized with Windows development changes
**Status**: Implemented and ready for deployment
**Deployment Date**: 2025-11-09

---

## System Architecture

### Data Flow

```
Windows (Developer Machine)
│
├─ Edit code
├─ Commit changes
└─ git push origin feature/sprint-1-foundation
        │
        └──► GitHub Remote Repository
                │
                ├──► Mac mini (Cloud Server)
                │    ├─ Auto-Pull Cron Job (Every Hour)
                │    ├─ Current Branch Detection
                │    ├─ Safety Checks (conflicts, uncommitted changes)
                │    ├─ Log Activity
                │    └─ git pull origin [current-branch]
                │         │
                │         └──► Latest Code Available
                │              Docker containers use new code
                │
                └──► CI/GitHub Actions (as needed)
```

### Components

#### 1. Auto-Pull Script (`.agent/scripts/auto-pull.sh`)

**What it does**:
- Detects current git branch
- Fetches latest changes from remote
- Checks for uncommitted changes (safety)
- Pulls changes if available
- Logs all activity

**Key Features**:
- Smart branch detection (works on any branch)
- Lock file prevents concurrent pulls
- Merge conflict avoidance
- Comprehensive logging
- Timestamps for all operations

**Technology**: Bash shell script

#### 2. Cron Scheduler

**What it does**:
- Runs auto-pull script on a schedule
- Invokes every hour at the top of the hour

**Schedule**:
```
Every Hour (00 minutes past)
0 * * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh
```

**Technology**: macOS native cron daemon

#### 3. Logging System

**What it does**:
- Records all pull attempts
- Tracks success/failure/already-up-to-date
- Enables monitoring and debugging

**Log Location**: `/var/log/projectpulse-autopull.log`

**Log Format**:
```
[2025-11-09 14:32:15] 🔄 Starting auto-pull...
[2025-11-09 14:32:15] 📍 Current branch: feature/sprint-1-foundation
[2025-11-09 14:32:16] ✓ Already up to date with feature/sprint-1-foundation
```

---

## How It Works

### Step-by-Step Flow

**1. Cron Triggers (Every Hour)**

```
macOS cron daemon wakes up
  → Executes: /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh
```

**2. Lock File Check**

```
Is another pull already running?
  ├─ Yes (recent lock) → Skip (prevent concurrent pulls)
  └─ No → Create lock file, continue
```

**3. Detect Current Branch**

```
git rev-parse --abbrev-ref HEAD
  → If on feature/sprint-1-foundation: will pull from origin/feature/sprint-1-foundation
  → If switched to master: will pull from origin/master
```

**4. Fetch Latest from Remote**

```
git fetch origin [current-branch]
  ├─ Success → Continue
  └─ Failure → Log error, exit
```

**5. Check for Changes**

```
Compare local HEAD with origin/[branch]
  ├─ Already up to date → Log and exit (no pull needed)
  ├─ Changes available → Continue to pull
  └─ Remote branch not found → Log and exit
```

**6. Safety Check: Uncommitted Changes**

```
Are there uncommitted local changes?
  ├─ Yes → Log error and SKIP PULL (prevent data loss)
  └─ No → Continue to pull
```

**7. Pull Latest Changes**

```
git pull origin [current-branch]
  ├─ Success → Log success + commit info, exit
  ├─ Merge conflict → Log error (manual intervention needed)
  └─ Permission error → Log error, exit
```

**8. Clean Up Lock File**

```
Remove lock file to allow next pull
```

### Timing Example

**At 3:00 PM**:
```
3:00:00 PM - Cron triggers auto-pull.sh
3:00:05 PM - Check lock file → none exists
3:00:06 PM - Fetch from origin
3:00:08 PM - Compare local vs remote
3:00:09 PM - Check for uncommitted changes → none
3:00:10 PM - Pull changes (if available)
3:00:15 PM - Log result, cleanup lock
3:00:15 PM - Script ends, ready for next hour
```

---

## Safety Mechanisms

### 1. Lock File (Prevent Concurrent Pulls)

```
File: /tmp/projectpulse-autopull.lock
Timeout: 5 minutes
Why: Prevents two pulls from running simultaneously
```

If a pull takes longer than expected:
- Stale lock files are automatically detected and removed
- Next pull proceeds after cleanup

### 2. Merge Conflict Avoidance

```
Scenario: Pull would cause merge conflict
Action: SKIP PULL and log error
Why: Better to miss an update than corrupt code
```

Resolution: Mac mini user manually resolves and commits changes

### 3. Uncommitted Changes Detection

```
if (git status has changes) {
    SKIP PULL
    log "Uncommitted changes detected"
}
Why: Pulling over uncommitted changes can cause data loss
```

### 4. Remote Tracking Verification

```
Check if origin/[branch] exists before pulling
Prevents errors pulling non-existent remote branches
```

---

## Branch-Aware Behavior

### Smart Branch Detection

The auto-pull script works intelligently with branch switching:

**Scenario 1: Feature Branch Development**
```
Mac mini branch: feature/sprint-1-foundation
→ Auto-pull pulls from: origin/feature/sprint-1-foundation
→ Gets latest development code
```

**Scenario 2: Branch Switch to Master**
```
Mac mini switched to: master
→ Auto-pull pulls from: origin/master
→ Gets latest stable release code
```

**Scenario 3: New Branch Created**
```
Mac mini on new branch: feature/new-epic
→ Auto-pull pulls from: origin/feature/new-epic
→ Follows the branch automatically
```

No configuration changes needed - it just works!

---

## Monitoring and Observability

### Logging Locations

**Auto-pull logs**:
```bash
/var/log/projectpulse-autopull.log
```

**macOS system cron logs**:
```bash
log stream --predicate 'process == "cron"'
```

**Git repository logs**:
```bash
cd /Users/draco/projects/AI_HUB
git log --oneline -20
```

### What Gets Logged

✅ Pull start/end timestamps
✅ Current branch being pulled
✅ Fetch operations
✅ Pull status (success/skip/error)
✅ Latest commit info
✅ Error messages for troubleshooting
✅ Lock file warnings

### Monitoring Examples

**See all successful pulls today**:
```bash
grep "SUCCESS" /var/log/projectpulse-autopull.log | grep "$(date +%Y-%m-%d)"
```

**See all errors**:
```bash
grep "ERROR" /var/log/projectpulse-autopull.log
```

**See last 5 pulls with timestamps**:
```bash
grep "Starting\|SUCCESS\|ERROR" /var/log/projectpulse-autopull.log | tail -10
```

---

## Integration with Docker

### Current Setup (No Auto-Restart)

```
Auto-Pull → Updates Code in /Users/draco/projects/AI_HUB
            ↓
Docker Container → Uses code on next restart or rebuild
```

**Manual process**: Restart Docker when you see logs indicate new code

### Future Enhancement (Optional)

Can be extended to auto-restart Docker after pulling:

```
Auto-Pull → Updates Code
            ↓
            Check for changes
            ↓
            (If changed) Restart Docker Containers
            ↓
Docker Container → Runs new code immediately
```

Requires wrapper script modification (see SOP for details)

---

## Troubleshooting Guide

### Symptom: No Updates Appearing

**Check**:
```bash
tail -20 /var/log/projectpulse-autopull.log
git log --oneline -5
```

**Possible Causes**:
- Cron not running (check `crontab -l`)
- GitHub not receiving pushes from Windows
- Merge conflicts blocking pull

**Fix**:
- Verify cron enabled: `crontab -l`
- Verify commits on GitHub
- Manually run: `/Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh`

### Symptom: Permission Denied Error

**Check**:
```bash
ls -la /var/log/projectpulse-autopull.log
```

**Fix** (if not -rw-rw-rw-):
```bash
sudo chmod 666 /var/log/projectpulse-autopull.log
```

### Symptom: Merge Conflict Errors

**Check**:
```bash
cd /Users/draco/projects/AI_HUB
git status
```

**Fix**:
1. Manually resolve conflicts
2. Commit changes: `git commit -m "chore: resolve conflicts"`
3. Next auto-pull will succeed

---

## Configuration

### Adjusting Pull Frequency

Edit crontab: `crontab -e`

Change schedule (examples):

```cron
# Every 5 minutes (aggressive)
*/5 * * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1

# Every 15 minutes (moderate)
*/15 * * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1

# Every hour (current)
0 * * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1

# Every 6 hours (conservative)
0 */6 * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1
```

### Disabling Auto-Pull

Comment out cron job:
```bash
crontab -e
# Change: 0 * * * * ...
# To:     # 0 * * * * ...
```

To re-enable, uncomment the line.

---

## Performance Impact

### Resource Usage

- **CPU**: Minimal (~10-20ms per pull)
- **Memory**: ~50MB for git process
- **Disk I/O**: Minimal (only actual file changes written)
- **Network**: ~10-100KB per pull (depends on changes)

### When Pull Happens

```
1:00 PM → Auto-pull runs (< 30 seconds)
1:30 PM → Already done
2:00 PM → Auto-pull runs if changes exist
```

No impact on Docker containers - they keep running.

---

## Security Considerations

### Authentication

Auto-pull uses HTTPS with GitHub:
```
https://github.com/draco28/ProjectPulse.git
```

**Credentials**: Uses system git credentials (SSH key or token)

**Setup**: Already configured if you can `git push` from Windows

### What Auto-Pull Can Access

✅ Can pull public/authorized repositories
✅ Reads from remote GitHub
✅ Writes to local /Users/draco/projects/AI_HUB

❌ Cannot access other directories
❌ Cannot execute arbitrary code (only git commands)
❌ Cannot modify GitHub (only pulls)

### Audit Trail

All pulls logged with timestamps:
```
/var/log/projectpulse-autopull.log
```

---

## Related Documentation

**Setup Instructions**: [.agent/task/mac-mini-auto-pull-instructions.md]
**Full SOP**: [.agent/sops/mac-mini-auto-pull-setup.md]
**Architecture**: [.agent/sops/mac-mini-cloud-architecture.md]
**Communication Protocol**: [.agent/sops/mac-mini-communication-protocol.md]

---

## Summary Table

| Aspect | Details |
|--------|---------|
| **Purpose** | Keep Mac mini code in sync with Windows development |
| **Schedule** | Every hour (hourly) |
| **Branch Mode** | Current branch aware (automatic) |
| **Restart Docker** | Manual (currently) |
| **Log Location** | `/var/log/projectpulse-autopull.log` |
| **Script Location** | `.agent/scripts/auto-pull.sh` |
| **Setup Time** | 5 minutes |
| **Resource Usage** | Minimal (<1% CPU during pull) |
| **Failure Handling** | Logs errors, skips on conflicts |
| **Monitoring** | Via log file (tail or grep) |

