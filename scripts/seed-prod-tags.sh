#!/bin/bash

# Seed tags to production Convex deployment
# Usage: ./scripts/seed-prod-tags.sh

echo "🌱 Seeding tags to production deployment (ardent-egret-416)..."

# Check if tag file exists (now using the full tags with counts)
if [ ! -f "dev-tags.json" ]; then
    echo "❌ dev-tags.json not found. Run export-dev-tags.sh first."
    exit 1
fi

# Set the production deployment
export CONVEX_DEPLOYMENT=prod:ardent-egret-416

# Get tag count
TAG_COUNT=$(jq '. | length' dev-tags.json)
echo "📊 Found $TAG_COUNT tags to seed with counts preserved"

# Show sample of tags with counts
echo "Sample tags with counts:"
jq '.[:5] | .[] | "\(.name): \(.count) uses"' dev-tags.json

# Read the tags from the file (full objects with counts)
TAGS=$(cat dev-tags.json)

# Seed the tags using the new function that preserves counts
echo "🚀 Seeding tags to production with counts..."
RESULT=$(bunx convex run seed:seedProductionTagsWithCounts "{\"tags\": $TAGS}" 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Seeding complete!"
    echo "$RESULT" | jq '.'
    
    # Verify the tags were seeded
    echo ""
    echo "🔍 Verifying tags in production..."
    PROD_TAGS=$(bunx convex run tags:getAllTags 2>/dev/null)
    PROD_TAG_COUNT=$(echo "$PROD_TAGS" | jq '. | length')
    TOTAL_COUNT=$(echo "$PROD_TAGS" | jq '[.[] | .count] | add')
    echo "✅ Production now has $PROD_TAG_COUNT tags with total usage count: $TOTAL_COUNT"
    
    # Show sample of tags with their preserved counts
    echo ""
    echo "Top 5 production tags (with preserved counts):"
    bunx convex run tags:getPopularTags '{"limit": 5}' 2>/dev/null | jq '.'
else
    echo "❌ Failed to seed tags to production"
    echo "$RESULT"
    exit 1
fi