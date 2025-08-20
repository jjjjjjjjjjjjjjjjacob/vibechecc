#!/bin/bash

# Export tags from dev Convex deployment
# Usage: ./scripts/export-dev-tags.sh

echo "🔍 Fetching all tags from dev deployment (reliable-porpoise-366)..."

# Set the dev deployment
export CONVEX_DEPLOYMENT=dev:reliable-porpoise-366

# Get all tags and save to JSON file
bunx convex run tags:getAllTags 2>/dev/null > dev-tags.json

if [ $? -eq 0 ]; then
    TAG_COUNT=$(jq '. | length' dev-tags.json)
    TOTAL_COUNT=$(jq '[.[] | .count] | add' dev-tags.json)
    echo "✅ Successfully exported $TAG_COUNT tags with total usage count: $TOTAL_COUNT"
    echo "📁 Full tags with counts saved to dev-tags.json"
    
    # Also create a file with just the tag names for backward compatibility
    jq '[.[] | .name]' dev-tags.json > dev-tag-names.json
    echo "📝 Tag names only saved to dev-tag-names.json (for backward compatibility)"
    
    # Show sample of tags with their counts
    echo ""
    echo "Sample of exported tags with counts:"
    jq '.[:5] | .[] | {name: .name, count: .count}' dev-tags.json
else
    echo "❌ Failed to export tags from dev deployment"
    exit 1
fi