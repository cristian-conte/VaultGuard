#!/bin/bash
set -e

echo "🔄 Fetching latest dev..."
git fetch origin dev

echo "🔀 Merging origin/dev into current branch (favoring our changes)..."
# Use -X ours to auto-resolve conflicts by keeping our version
git merge origin/dev -X ours -m "Merge branch 'dev' into fix/configuration-ui-enhancements"

echo "✅ Merge successful (or already up to date)."

echo "fw Pushing resolved branch..."
git push origin fix/configuration-ui-enhancements

echo "🎉 Done! The PR should now be mergeable."
