#!/bin/bash

# ProjectPulse Auto-Pull Script
# Runs on Mac mini to automatically pull latest changes from development
# Designed to run via cron (scheduled) from any branch
# Usage: ./auto-pull.sh
# Cron: 0 * * * * /Users/draco/projects/AI_HUB/.agent/scripts/auto-pull.sh >> /var/log/projectpulse-autopull.log 2>&1

# Configuration
PROJECT_DIR="/Users/draco/projects/AI_HUB"
LOG_FILE="/var/log/projectpulse-autopull.log"
LOCK_FILE="/tmp/projectpulse-autopull.lock"
LOCK_TIMEOUT=300  # 5 minutes

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ❌ ERROR: $1" >> "$LOG_FILE"
}

log_success() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✅ SUCCESS: $1" >> "$LOG_FILE"
}

# Cleanup lock file function
cleanup_lock() {
    rm -f "$LOCK_FILE"
}

# Trap for cleanup on exit
trap cleanup_lock EXIT

# Check lock file (prevent concurrent pulls)
if [ -f "$LOCK_FILE" ]; then
    LOCK_AGE=$(($(date +%s) - $(stat -f%m "$LOCK_FILE" 2>/dev/null || echo 0)))
    if [ $LOCK_AGE -lt $LOCK_TIMEOUT ]; then
        log "⏳ Pull already in progress (lock file exists)"
        exit 0
    else
        log "⚠️ Lock file stale, removing and proceeding"
        rm -f "$LOCK_FILE"
    fi
fi

# Create lock file
touch "$LOCK_FILE"

# Change to project directory
cd "$PROJECT_DIR" || {
    log_error "Failed to change to project directory: $PROJECT_DIR"
    exit 1
}

log "🔄 Starting auto-pull..."

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ -z "$CURRENT_BRANCH" ]; then
    log_error "Failed to determine current git branch"
    exit 1
fi

log "📍 Current branch: $CURRENT_BRANCH"

# Fetch latest changes from remote
log "📡 Fetching from origin..."
if ! git fetch origin "$CURRENT_BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
    log_error "git fetch failed"
    exit 1
fi

# Check if there are changes to pull
UPSTREAM="origin/$CURRENT_BRANCH"
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse "$UPSTREAM" 2>/dev/null)
BASE=$(git merge-base @ "$UPSTREAM" 2>/dev/null)

if [ -z "$REMOTE" ]; then
    log "⚠️ Remote branch '$UPSTREAM' not found"
    exit 0
fi

if [ "$LOCAL" = "$REMOTE" ]; then
    log "✓ Already up to date with $CURRENT_BRANCH"
    exit 0
fi

# Check for uncommitted changes (safety check)
if ! git diff-index --quiet HEAD --; then
    log_error "Uncommitted changes detected. Skipping pull to prevent data loss."
    exit 1
fi

# Perform the pull
log "⬇️ Pulling changes from $CURRENT_BRANCH..."
if git pull origin "$CURRENT_BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Successfully pulled changes from $CURRENT_BRANCH"

    # Log new commit info
    COMMIT_HASH=$(git rev-parse --short HEAD)
    COMMIT_MSG=$(git log -1 --pretty=%B)
    log "  📝 Latest commit: $COMMIT_HASH - $COMMIT_MSG"

    exit 0
else
    log_error "git pull failed - there may be merge conflicts"
    exit 1
fi
