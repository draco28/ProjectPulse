# Mac Mini Auto-Pull Setup

**Purpose**: Keep the Mac mini Docker environment synchronized with the latest code changes from Windows development environment.

**Version**: 1.0
**Last Updated**: 2025-11-09

---

## Overview

The Mac mini auto-pull system:
- ✅ Automatically pulls latest changes **every hour** from remote git
- ✅ Pulls from **current branch** (intelligently switches if branch changes)
- ✅ **Prevents merge conflicts** with safety checks
- ✅ **Logs all activity** for monitoring and debugging
- ✅ **Prevents concurrent pulls** with lock file mechanism
- ✅ Works with both `feature/sprint-1-foundation` and `master`

---

## Setup Instructions

### Step 1: Make Script Executable

```bash
chmod +x /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh
```

**Verify**:
```bash
ls -la /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh
# Should show: -rwxr-xr-x (executable)
```

### Step 2: Create Log File with Proper Permissions

```bash
sudo touch /var/log/projectpulse-autopull.log
sudo chmod 666 /var/log/projectpulse-autopull.log
```

**Verify**:
```bash
ls -la /var/log/projectpulse-autopull.log
# Should show: -rw-rw-rw-
```

### Step 3: Add Cron Job

Edit crontab:
```bash
crontab -e
```

Add this line (runs at the top of every hour):
```cron
0 * * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1
```

**Verify**:
```bash
crontab -l | grep auto-pull
```

Should output:
```
0 * * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1
```

### Step 4: Test the Setup

Run manually to verify it works:
```bash
/Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh
```

Check logs:
```bash
tail -20 /var/log/projectpulse-autopull.log
```

You should see output like:
```
[2025-11-09 14:32:15] 🔄 Starting auto-pull...
[2025-11-09 14:32:15] 📍 Current branch: feature/sprint-1-foundation
[2025-11-09 14:32:16] 📡 Fetching from origin...
[2025-11-09 14:32:18] ✓ Already up to date with feature/sprint-1-foundation
```

---

## How It Works

### Pull Schedule

- **Frequency**: Every hour (runs at :00 minute)
- **Timing**: Automatic via macOS cron
- **No manual intervention needed**

### Smart Branch Handling

The script automatically detects the current branch and pulls from that branch:

```
On Mac mini running feature/sprint-1-foundation:
→ Auto-pull pulls from origin/feature/sprint-1-foundation

If branch switches to master:
→ Auto-pull pulls from origin/master
```

### Safety Checks

1. **Merge conflict prevention**: Skips pull if uncommitted changes exist
2. **Lock file mechanism**: Prevents concurrent pulls (timeout: 5 minutes)
3. **Remote tracking**: Checks if remote branch exists before pulling
4. **Already up-to-date check**: Skips pull if no changes exist

### Logging

All activities logged to `/var/log/projectpulse-autopull.log`:

```
✅ SUCCESS - Pull completed with new changes
⚠️ Already up to date - No new changes
❌ ERROR - Merge conflicts or permissions issue
```

---

## Monitoring

### View Recent Pulls

```bash
# Last 10 pulls
tail -10 /var/log/projectpulse-autopull.log

# Search for errors
grep "ERROR" /var/log/projectpulse-autopull.log

# Search for successful pulls with new commits
grep "SUCCESS" /var/log/projectpulse-autopull.log
```

### Check Cron Execution

macOS logs cron execution to system log:
```bash
log stream --predicate 'process == "cron"' --level debug
```

### Monitor Git Status

```bash
cd /Users/draco/projects/AI_HUB
git log -1 --oneline
git status
git rev-parse --abbrev-ref HEAD
```

---

## Troubleshooting

### Cron Job Not Running

**Check if cron is enabled:**
```bash
crontab -l
```

**If empty or error**, re-add the job:
```bash
crontab -e
# Paste the auto-pull line again
```

### Pull Fails with Merge Conflicts

**Cause**: Uncommitted changes in the repo

**Fix**: Log into Mac mini and resolve manually:
```bash
cd /Users/draco/projects/AI_HUB
git status
# Commit or stash changes
git add .
git commit -m "chore: save local changes before auto-pull"
```

### Permission Denied on Log File

**Fix**:
```bash
sudo chmod 666 /var/log/projectpulse-autopull.log
```

### Script Fails with "Not a git repository"

**Verify**:
```bash
cd /Users/draco/projects/AI_HUB
git status
```

**Fix**: Ensure you're in the correct project directory

### Lock File Stale

If you see "Lock file stale" messages:
```bash
rm -f /tmp/projectpulse-autopull.lock
```

The script will automatically proceed on next run.

---

## Maintenance

### Viewing Full Logs

```bash
cat /var/log/projectpulse-autopull.log
```

### Clearing Old Logs

```bash
# Clear logs older than 7 days
sudo find /var/log/projectpulse-autopull.log -mtime +7 -delete

# Or truncate current log
sudo > /var/log/projectpulse-autopull.log
```

### Temporarily Disable Auto-Pull

Comment out the cron job:
```bash
crontab -e
# Change: 0 * * * * ...
# To:     # 0 * * * * ...
```

### Re-enable Auto-Pull

```bash
crontab -e
# Change: # 0 * * * * ...
# To:     0 * * * * ...
```

### Update Pull Frequency

Edit crontab and change the schedule (cron syntax):

```cron
# Every 5 minutes
*/5 * * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1

# Every 30 minutes
*/30 * * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1

# Every hour (current)
0 * * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1

# Every 6 hours
0 */6 * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1
```

---

## Integration with Docker Restart

If you want auto-pull to also restart Docker containers with new code:

1. Update the cron job to call a wrapper script
2. Wrapper script calls auto-pull.sh
3. If successful, restart Docker

**Example wrapper** (advanced):
```bash
#!/bin/bash
if /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh; then
    docker-compose -f /Users/draco/projects/AI_HUB/docker-compose.cloud.yml restart
fi
```

See [mac-mini-cloud-architecture.md](mac-mini-cloud-architecture.md) for Docker restart details.

---

## Quick Reference

**Setup time**: 2-3 minutes

**Files involved**:
- `.agent/scripts/auto-pull.sh` - Main pull script
- `/var/log/projectpulse-autopull.log` - Logs
- `crontab -e` - Cron configuration

**Commands**:
```bash
# Check if running
crontab -l

# View logs
tail -20 /var/log/projectpulse-autopull.log

# Test manually
/Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh

# Edit schedule
crontab -e

# View all commits pulled
git log --oneline -10
```

**Support**: If issues occur, check logs first:
```bash
tail -50 /var/log/projectpulse-autopull.log
```

---

## Architecture Diagram

```
Windows (Development)
    ↓
git push origin feature/sprint-1-foundation
    ↓
GitHub Repository
    ↓
Mac mini (Every hour via cron)
    ├─ .agent/scripts/auto-pull.sh
    ├─ git fetch origin feature/sprint-1-foundation
    ├─ git pull origin feature/sprint-1-foundation
    └─ Logs to /var/log/projectpulse-autopull.log
    ↓
Docker containers automatically use latest code
```

---

## Related Documentation

- [mac-mini-cloud-architecture.md](mac-mini-cloud-architecture.md) - Overall Mac mini setup
- [mac-mini-communication-protocol.md](mac-mini-communication-protocol.md) - Git-based communication
- [git-workflow.md](git-workflow.md) - Git branching strategy

