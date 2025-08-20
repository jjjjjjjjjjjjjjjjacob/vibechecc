#!/bin/bash

# Complete script to sync tags from dev to production
# Usage: ./scripts/sync-tags-to-prod.sh

echo "🔄 Syncing tags from dev to production..."
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

# Step 1: Export from dev
echo "Step 1: Exporting tags from dev deployment"
echo "=========================================="
bash scripts/export-dev-tags.sh

if [ $? -ne 0 ]; then
    echo "❌ Export failed. Aborting sync."
    exit 1
fi

echo ""
echo "Step 2: Seeding tags to production"
echo "=========================================="
bash scripts/seed-prod-tags.sh

if [ $? -ne 0 ]; then
    echo "❌ Seeding failed."
    exit 1
fi

echo ""
echo "✅ Tag sync complete!"
echo ""
echo "Summary:"
echo "--------"
DEV_COUNT=$(jq '. | length' dev-tags.json)
PROD_COUNT=$(CONVEX_DEPLOYMENT=prod:ardent-egret-416 bunx convex run tags:getAllTags 2>/dev/null | jq '. | length')
echo "• Dev tags: $DEV_COUNT"
echo "• Production tags: $PROD_COUNT"

# Clean up temporary files (optional)
# rm dev-tags.json dev-tag-names.json