#!/bin/bash
set -e

echo "🔍 Diagnosing merge state..."
git fetch origin dev

echo "🔀 Attempting merge of origin/dev..."
# Try to merge, but don't fail script if it conflicts
git merge origin/dev || true

echo "🛠 Resolving conflicts by keeping OUR changes..."
# For every file that is in conflict, keep our version
git checkout --ours .
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "No conflicts to resolve or already resolved."
else
    echo "💾 Committing resolution..."
    git commit -m "Merge branch 'dev' into fix/configuration-ui-enhancements (Resolved Conflicts)"
fi

echo "🚀 Pushing changes..."
git push origin fix/configuration-ui-enhancements

echo "✅ Done. Please check the PR again."
