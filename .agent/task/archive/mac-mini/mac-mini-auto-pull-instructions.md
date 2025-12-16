# Mac Mini Auto-Pull Setup Instructions

**For**: Mac mini user (copy-paste these commands)
**Time**: 5 minutes
**Status**: Ready to execute

---

## One-Time Setup (Run These Commands on Mac Mini)

### 1. Verify Script Exists and is Executable

```bash
ls -la /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh
```

Expected output:
```
-rwxr-xr-x  ...  auto-pull.sh
```

If not executable:
```bash
chmod +x /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh
```

### 2. Set Up Log File with Permissions

```bash
sudo touch /var/log/projectpulse-autopull.log
sudo chmod 666 /var/log/projectpulse-autopull.log
```

Verify:
```bash
ls -la /var/log/projectpulse-autopull.log
```

### 3. Add Cron Job

```bash
crontab -e
```

This opens the cron editor. **Add this single line** (paste at the end):

```
0 * * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1
```

Then:
- Press `Ctrl+X` (or `Cmd+X` on Mac)
- Type `Y` to confirm
- Press `Enter` to save

### 4. Verify Cron Job Added

```bash
crontab -l
```

You should see the line we just added.

### 5. Test It Works

```bash
/Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh
```

Check logs:
```bash
tail -10 /var/log/projectpulse-autopull.log
```

You should see something like:
```
[2025-11-09 14:32:15] 🔄 Starting auto-pull...
[2025-11-09 14:32:15] 📍 Current branch: feature/sprint-1-foundation
[2025-11-09 14:32:16] ✓ Already up to date with feature/sprint-1-foundation
```

---

## That's It! ✅

Your Mac mini will now automatically pull changes from GitHub **every hour**.

---

## Monitoring (Ongoing)

### Check Recent Pulls

```bash
tail -20 /var/log/projectpulse-autopull.log
```

### Search for Issues

```bash
grep "ERROR" /var/log/projectpulse-autopull.log
```

### See What Was Pulled

```bash
cd /Users/draco/projects/AI_HUB
git log --oneline -5
```

---

## If Something Goes Wrong

### Cron not running?

```bash
# Check if enabled
crontab -l

# Re-add if needed
crontab -e
```

### Permission denied on log file?

```bash
sudo chmod 666 /var/log/projectpulse-autopull.log
```

### Git errors?

```bash
# Check git status
cd /Users/draco/projects/AI_HUB
git status

# If uncommitted changes exist, commit them
git add .
git commit -m "chore: save local changes"
```

---

## Full Documentation

See: [mac-mini-auto-pull-setup.md](../sops/mac-mini-auto-pull-setup.md)

