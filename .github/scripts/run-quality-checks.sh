#!/bin/bash

if [ "$GITHUB_EVENT_NAME" == "pull_request" ]; then
  # Get changed .ts files in the PR
  CHANGED_FILES=$(git diff --name-only $PR_BASE_SHA $PR_HEAD_SHA | grep '\.ts$' | tr '\n' ' ')
  if [ -n "$CHANGED_FILES" ]; then
    echo "Running quality checks on changed files: $CHANGED_FILES"
    npm run quality -- $CHANGED_FILES
  else
    echo "No TypeScript files changed, skipping quality checks"
  fi
else
  # For push events, run on files changed in the current commit
  CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD | grep '\.ts$' | tr '\n' ' ')
  if [ -n "$CHANGED_FILES" ]; then
    echo "Running quality checks on files changed in current commit: $CHANGED_FILES"
    npm run quality -- $CHANGED_FILES
  else
    echo "No TypeScript files changed in current commit, skipping quality checks"
  fi
fi