#!/bin/bash

set -e

get_changed_ts_files() {
    local base_ref="$1"
    local head_ref="$2"
    
    if [ -n "$base_ref" ] && [ -n "$head_ref" ]; then
        git diff --name-only "$base_ref" "$head_ref" | grep '\.ts$' || true
    else
        git diff --name-only HEAD~1 HEAD | grep '\.ts$' || true
    fi
}

run_quality_checks() {
    local event_type="$1"
    local changed_files_raw
    
    if [ "$event_type" == "pull_request" ]; then
        changed_files_raw=$(get_changed_ts_files "$PR_BASE_SHA" "$PR_HEAD_SHA")
        local context_message="changed files in the PR"
    else
        changed_files_raw=$(get_changed_ts_files)
        local context_message="files changed in current commit"
    fi
    
    if [ -n "$changed_files_raw" ]; then
        # Convert to array
        readarray -t changed_files <<< "$changed_files_raw"
        
        echo "Running quality checks on $context_message: ${changed_files[*]}"
        npm run quality -- "${changed_files[@]}"
    else
        echo "No TypeScript files changed, skipping quality checks"
    fi
}

run_quality_checks "$GITHUB_EVENT_NAME"