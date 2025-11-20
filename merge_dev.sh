#!/bin/bash
set -e

echo "🔄 Fetching latest dev..."
git fetch origin dev

echo "🔀 Merging origin/dev into current branch..."
# Allow merge to fail so we can see conflicts
git merge origin/dev || true

echo "⚠️  Merge attempt complete. Checking status..."
git status
