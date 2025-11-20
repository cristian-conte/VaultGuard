#!/bin/bash
set -e

# Configuration
BRANCH_NAME="fix/configuration-ui-enhancements"
COMMIT_MESSAGE="fix: enhance configuration UI and SKU management"
REPO_URL="https://github.com/cristian-conte/VaultGuard"

echo "🚀 Starting feature finalization workflow..."

# 1. Create and checkout feature branch
echo "🌿 Creating feature branch: $BRANCH_NAME"
git checkout -b $BRANCH_NAME || git checkout $BRANCH_NAME

# 2. Stage and commit changes
echo "📦 Staging and committing changes..."
git add src/views/configurationView.ts src/config/skuCatalog.ts src/extension.ts src/config/settingsManager.ts
git commit -m "$COMMIT_MESSAGE" || echo "Nothing to commit"

# 3. Push to remote
echo "fw Pushing to origin..."
git push -u origin $BRANCH_NAME

# 4. Instructions for PR and Merge
echo ""
echo "✅ Changes pushed successfully!"
echo "----------------------------------------------------------------"
echo "👉 Step 1: Create a Pull Request (PR) to 'dev' branch:"
echo "   $REPO_URL/compare/dev...$BRANCH_NAME?expand=1"
echo ""
echo "👉 Step 2: Review and Merge the PR on GitHub."
echo ""
echo "👉 Step 3: After merging, update your local dev branch:"
echo "   git checkout dev"
echo "   git pull origin dev"
echo "----------------------------------------------------------------"
