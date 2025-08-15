#!/bin/bash

# Agent helper script for common tasks
# This script provides utilities for the GitHub Actions agent workflow

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

function log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

function create_task_log() {
    local task="$1"
    local timestamp="$2"
    local auto_merge="$3"
    
    local log_file="agent-logs/task-${timestamp}.md"
    
    cat > "$log_file" << EOF
# Agent Task Log

**Task:** $task
**Timestamp:** $(date)
**Auto-merge:** $auto_merge
**Status:** Completed

## Changes Made

This is a placeholder for the actual agent implementation.
In a real scenario, this would contain:

- List of files modified
- Summary of changes
- Test results
- Validation status

## Next Steps

- Review the changes
- Verify functionality
- Merge if approved
EOF

    echo "$log_file"
}

function validate_changes() {
    log "Validating project integrity..."
    
    # Run build to ensure no breaking changes
    if npm run build > /dev/null 2>&1; then
        log "✅ Build successful"
        return 0
    else
        log "❌ Build failed"
        return 1
    fi
}

function main() {
    case "${1:-}" in
        "create-log")
            create_task_log "$2" "$3" "$4"
            ;;
        "validate")
            validate_changes
            ;;
        *)
            echo "Usage: $0 {create-log|validate}"
            echo "  create-log <task> <timestamp> <auto_merge>"
            echo "  validate"
            exit 1
            ;;
    esac
}

main "$@"