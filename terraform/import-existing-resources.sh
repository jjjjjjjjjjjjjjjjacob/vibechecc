#!/bin/bash

# Script to import existing Cloudflare resources into Terraform state
# This script checks for existing DNS records and Worker scripts and imports them if they exist

set -e

# Required environment variables check
required_vars=(
  "TF_VAR_cloudflare_account_id"
  "TF_VAR_cloudflare_zone_id"
  "TF_VAR_cloudflare_api_token"
  "TF_VAR_cloudflare_zone"
  "TF_VAR_environment"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set"
    exit 1
  fi
done

# Optional PR number for ephemeral environments
PR_NUMBER="${TF_VAR_pr_number:-}"

# Set prefix based on environment
PREFIX=""
if [ "$TF_VAR_environment" = "ephemeral" ]; then
  if [ -z "$PR_NUMBER" ]; then
    echo "Error: PR number is required for ephemeral environment"
    exit 1
  fi
  PREFIX="pr-$PR_NUMBER"
elif [ "$TF_VAR_environment" = "production" ]; then
  PREFIX="prod"
elif [ "$TF_VAR_environment" = "development" ]; then
  PREFIX="dev"
else
  echo "Error: Invalid environment: $TF_VAR_environment"
  exit 1
fi

echo "Environment: $TF_VAR_environment"
echo "Prefix: $PREFIX"

# Get DNS records from Cloudflare API
echo "Fetching DNS records..."
DNS_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$TF_VAR_cloudflare_zone_id/dns_records" \
  -H "Authorization: Bearer $TF_VAR_cloudflare_api_token" \
  -H "Content-Type: application/json")

# Check if the DNS API call was successful
if echo "$DNS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "$DNS_RESPONSE" | jq '.' > dns_output.json
  echo "DNS records fetched successfully"
else
  echo "Error fetching DNS records:"
  echo "$DNS_RESPONSE" | jq '.'
  echo '{"result": []}' > dns_output.json
fi

# Get Workers scripts from Cloudflare API
echo "Fetching Workers scripts..."
WORKERS_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$TF_VAR_cloudflare_account_id/workers/scripts" \
  -H "Authorization: Bearer $TF_VAR_cloudflare_api_token" \
  -H "Content-Type: application/json")

# Check if the Workers API call was successful
if echo "$WORKERS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "$WORKERS_RESPONSE" | jq '.' > workers_output.json
  echo "Workers scripts fetched successfully"
else
  echo "Error fetching Workers scripts:"
  echo "$WORKERS_RESPONSE" | jq '.'
  echo '{"result": []}' > workers_output.json
fi

# Extract A record ID for vibechecc.io (with null check)
A_RECORD_ID=$(jq -r '.result[]? | select(.type == "A" and .name == "'"$TF_VAR_cloudflare_zone"'") | .id' dns_output.json 2>/dev/null || echo "")

# Extract AAAA record ID for vibechecc.io (with null check)
AAAA_RECORD_ID=$(jq -r '.result[]? | select(.type == "AAAA" and .name == "'"$TF_VAR_cloudflare_zone"'") | .id' dns_output.json 2>/dev/null || echo "")

# Extract CNAME record ID for the subdomain (with null check)
CNAME_RECORD_ID=$(jq -r --arg prefix "$PREFIX.$TF_VAR_cloudflare_zone" '.result[]? | select(.type == "CNAME" and .name == $prefix) | .id' dns_output.json 2>/dev/null || echo "")

# Extract Worker script name
if [ "$TF_VAR_environment" = "ephemeral" ]; then
  WORKER_SCRIPT_NAME="vibechecc-pr-$PR_NUMBER-web"
else
  WORKER_SCRIPT_NAME="vibechecc-$TF_VAR_environment-web"
fi
WORKER_SCRIPT_EXISTS=$(jq -r --arg script_name "$WORKER_SCRIPT_NAME" '.result[]? | select(.id == $script_name) | .id' workers_output.json 2>/dev/null || echo "")

echo "Found resources:"
echo "  A record ID: ${A_RECORD_ID:-not found}"
echo "  AAAA record ID: ${AAAA_RECORD_ID:-not found}"
echo "  CNAME record ID: ${CNAME_RECORD_ID:-not found}"
echo "  Worker script: ${WORKER_SCRIPT_EXISTS:-not found}"

# Import A record if it exists (production only)
if [ "$TF_VAR_environment" = "production" ] && [ -n "$A_RECORD_ID" ] && [ "$A_RECORD_ID" != "null" ]; then
  echo "Importing A record with ID: $A_RECORD_ID"
  terraform import 'module.vibechecc_worker.cloudflare_dns_record.web_a[0]' "$TF_VAR_cloudflare_zone_id/$A_RECORD_ID" || true
else
  echo "No A record to import for environment: $TF_VAR_environment"
fi

# Import AAAA record if it exists (production only)
if [ "$TF_VAR_environment" = "production" ] && [ -n "$AAAA_RECORD_ID" ] && [ "$AAAA_RECORD_ID" != "null" ]; then
  echo "Importing AAAA record with ID: $AAAA_RECORD_ID"
  terraform import 'module.vibechecc_worker.cloudflare_dns_record.web_aaaa[0]' "$TF_VAR_cloudflare_zone_id/$AAAA_RECORD_ID" || true
else
  echo "No AAAA record to import for environment: $TF_VAR_environment"
fi

# Import CNAME record if it exists (non-production only)
if [ "$TF_VAR_environment" != "production" ] && [ -n "$CNAME_RECORD_ID" ] && [ "$CNAME_RECORD_ID" != "null" ]; then
  echo "Importing CNAME record with ID: $CNAME_RECORD_ID"
  terraform import 'module.vibechecc_worker.cloudflare_dns_record.web_cname[0]' "$TF_VAR_cloudflare_zone_id/$CNAME_RECORD_ID" || true
else
  echo "No CNAME record to import for environment: $TF_VAR_environment"
fi

# Import Worker script if it exists
if [ -n "$WORKER_SCRIPT_EXISTS" ] && [ "$WORKER_SCRIPT_EXISTS" != "null" ]; then
  echo "Importing Worker script: $WORKER_SCRIPT_EXISTS"
  terraform import module.vibechecc_worker.cloudflare_workers_script.web "$TF_VAR_cloudflare_account_id/$WORKER_SCRIPT_EXISTS" || true
else
  echo "No Worker script found to import"
fi

# Import Workers route if it exists
if [ "$TF_VAR_environment" != "production" ]; then
  ROUTE_PATTERN="$PREFIX.$TF_VAR_cloudflare_zone/*"
else
  ROUTE_PATTERN="$TF_VAR_cloudflare_zone/*"
fi

echo "Checking for Workers route with pattern: $ROUTE_PATTERN"

# Get Workers routes
ROUTES_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$TF_VAR_cloudflare_zone_id/workers/routes" \
  -H "Authorization: Bearer $TF_VAR_cloudflare_api_token" \
  -H "Content-Type: application/json")

if echo "$ROUTES_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  ROUTE_ID=$(echo "$ROUTES_RESPONSE" | jq -r --arg pattern "$ROUTE_PATTERN" '.result[]? | select(.pattern == $pattern) | .id' 2>/dev/null || echo "")
  
  if [ -n "$ROUTE_ID" ] && [ "$ROUTE_ID" != "null" ]; then
    echo "Importing Workers route with ID: $ROUTE_ID"
    terraform import module.vibechecc_worker.cloudflare_workers_route.web "$TF_VAR_cloudflare_zone_id/$ROUTE_ID" || true
  else
    echo "No Workers route found to import"
  fi
else
  echo "Error fetching Workers routes"
fi

echo "Import process completed"