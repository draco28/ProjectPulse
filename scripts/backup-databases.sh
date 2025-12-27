#!/bin/bash
# =============================================================================
# Database Backup Script for ProjectPulse
# =============================================================================
#
# This script creates PostgreSQL backups and stores them on the external SSD.
#
# Usage:
#   ./scripts/backup-databases.sh           # Backup both dev and prod
#   ./scripts/backup-databases.sh --prod    # Backup production only
#   ./scripts/backup-databases.sh --dev     # Backup development only
#   ./scripts/backup-databases.sh --list    # List existing backups
#   ./scripts/backup-databases.sh --prune   # Remove backups older than 30 days
#
# Prerequisites:
#   - External SSD mounted at /Volumes/master_ssd
#   - Docker containers running (postgres-cloud, prod-postgres)
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/Volumes/master_ssd/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Dev database (docker-compose.cloud.yml uses postgres user)
DEV_CONTAINER="projectpulse-postgres-cloud"
DEV_USER="postgres"
DEV_DB="projectpulse_dev"

# Prod database (docker-compose.prod-local.yml uses projectpulse user)
PROD_CONTAINER="projectpulse-prod-postgres"
PROD_USER="projectpulse"
PROD_DB="projectpulse_prod"

# Functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

header() {
    echo ""
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================================${NC}"
    echo ""
}

check_prerequisites() {
    # Check if external SSD is mounted
    if [ ! -d "/Volumes/master_ssd" ]; then
        log_error "External SSD not mounted at /Volumes/master_ssd"
        exit 1
    fi

    # Create backup directory if it doesn't exist
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

backup_dev() {
    header "Backing Up Development Database"

    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${DEV_CONTAINER}$"; then
        log_warn "Development container not running, skipping..."
        return 0
    fi

    BACKUP_FILE="${BACKUP_DIR}/dev_${DATE}.sql.gz"
    log_info "Creating backup: $BACKUP_FILE"

    # Create compressed backup
    docker exec "$DEV_CONTAINER" pg_dump -U "$DEV_USER" "$DEV_DB" | gzip > "$BACKUP_FILE"

    # Verify backup
    if [ -s "$BACKUP_FILE" ]; then
        SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        log_success "Development backup complete: $SIZE"
    else
        log_error "Development backup failed (empty file)"
        rm -f "$BACKUP_FILE"
        return 1
    fi
}

backup_prod() {
    header "Backing Up Production Database"

    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${PROD_CONTAINER}$"; then
        log_warn "Production container not running, skipping..."
        return 0
    fi

    BACKUP_FILE="${BACKUP_DIR}/prod_${DATE}.sql.gz"
    log_info "Creating backup: $BACKUP_FILE"

    # Create compressed backup
    docker exec "$PROD_CONTAINER" pg_dump -U "$PROD_USER" "$PROD_DB" | gzip > "$BACKUP_FILE"

    # Verify backup
    if [ -s "$BACKUP_FILE" ]; then
        SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        log_success "Production backup complete: $SIZE"
    else
        log_error "Production backup failed (empty file)"
        rm -f "$BACKUP_FILE"
        return 1
    fi
}

list_backups() {
    header "Existing Backups"

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        log_info "No backups found"
        return 0
    fi

    echo "Development backups:"
    ls -lh "$BACKUP_DIR"/dev_*.sql.gz 2>/dev/null | awk '{print "  " $NF " (" $5 ")"}' || echo "  (none)"

    echo ""
    echo "Production backups:"
    ls -lh "$BACKUP_DIR"/prod_*.sql.gz 2>/dev/null | awk '{print "  " $NF " (" $5 ")"}' || echo "  (none)"

    echo ""
    TOTAL=$(du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print $1}')
    log_info "Total backup size: $TOTAL"
}

prune_old_backups() {
    header "Pruning Old Backups"

    log_info "Removing backups older than $RETENTION_DAYS days..."

    DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l | tr -d ' ')

    if [ "$DELETED" -gt 0 ]; then
        log_success "Deleted $DELETED old backup(s)"
    else
        log_info "No old backups to delete"
    fi
}

backup_all() {
    check_prerequisites
    backup_dev
    backup_prod

    header "Backup Summary"
    list_backups
}

# Main
case "${1:-}" in
    --prod)
        check_prerequisites
        backup_prod
        ;;
    --dev)
        check_prerequisites
        backup_dev
        ;;
    --list)
        list_backups
        ;;
    --prune)
        prune_old_backups
        ;;
    --help|-h)
        echo "Usage: $0 [--prod|--dev|--list|--prune|--help]"
        echo ""
        echo "Options:"
        echo "  (none)    Backup both dev and prod databases"
        echo "  --prod    Backup production database only"
        echo "  --dev     Backup development database only"
        echo "  --list    List existing backups"
        echo "  --prune   Remove backups older than $RETENTION_DAYS days"
        echo "  --help    Show this help"
        echo ""
        echo "Backup location: $BACKUP_DIR"
        ;;
    *)
        backup_all
        ;;
esac
