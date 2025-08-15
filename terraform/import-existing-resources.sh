#!/bin/bash

# Script to import existing Cloudflare resources into Terraform state
# This script checks for existing DNS records and Worker scripts and imports them if they exist

set -e

# Map CLOUDFLARE_* environment variables to TF_VAR_* if TF_VAR is not already set
[ -z "${TF_VAR_cloudflare_api_token:-}" ] && [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && export TF_VAR_cloudflare_api_token="$CLOUDFLARE_API_TOKEN"
[ -z "${TF_VAR_cloudflare_account_id:-}" ] && [ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] && export TF_VAR_cloudflare_account_id="$CLOUDFLARE_ACCOUNT_ID"
[ -z "${TF_VAR_cloudflare_zone:-}" ] && [ -n "${CLOUDFLARE_ZONE:-}" ] && export TF_VAR_cloudflare_zone="$CLOUDFLARE_ZONE"
[ -z "${TF_VAR_cloudflare_zone_id:-}" ] && [ -n "${CLOUDFLARE_ZONE_ID:-}" ] && export TF_VAR_cloudflare_zone_id="$CLOUDFLARE_ZONE_ID"

# Required environment variables check
required_vars=(
  "TF_VAR_cloudflare_account_id"
  "TF_VAR_cloudflare_zone_id"
  "TF_VAR_cloudflare_api_token"
  "TF_VAR_cloudflare_zone"
  "TF_VAR_environment"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
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

# Helper function to check if resource exists in terraform state
terraform_state_exists() {
  local resource_address="$1"
  terraform state show "$resource_address" >/dev/null 2>&1
}

# Check if Terraform state exists and has resources
echo "Checking Terraform state..."
STATE_COUNT=$(terraform state list 2>/dev/null | wc -l | tr -d ' ')
if [ "$STATE_COUNT" -eq "0" ]; then
  echo "Fresh environment detected - no resources in state"
  IS_FRESH_ENV="true"
else
  echo "Existing environment detected - $STATE_COUNT resources in state"
  IS_FRESH_ENV="false"
fi

# Check if we need to fetch resources from Cloudflare API
# Only fetch if it's a fresh environment or if specific resources are missing
NEED_API_FETCH="false"

if [ "$IS_FRESH_ENV" = "true" ]; then
  echo "Fresh environment - will fetch resources from Cloudflare API"
  NEED_API_FETCH="true"
else
  # Check if specific resources are missing from state
  if [ "$TF_VAR_environment" = "production" ]; then
    if ! terraform_state_exists 'module.app_worker.cloudflare_dns_record.web_a[0]' || \
       ! terraform_state_exists 'module.app_worker.cloudflare_dns_record.web_aaaa[0]'; then
      echo "Missing production DNS records in state - will fetch from API"
      NEED_API_FETCH="true"
    fi
  else
    if ! terraform_state_exists 'module.app_worker.cloudflare_dns_record.web_cname[0]'; then
      echo "Missing CNAME record in state - will fetch from API"
      NEED_API_FETCH="true"
    fi
  fi
  
  if ! terraform_state_exists 'module.app_worker.cloudflare_workers_script.web' || \
     ! terraform_state_exists 'module.app_worker.cloudflare_workers_route.web'; then
    echo "Missing Worker resources in state - will fetch from API"
    NEED_API_FETCH="true"
  fi
fi

if [ "$NEED_API_FETCH" = "true" ]; then
  # Get DNS records from Cloudflare API
  echo "Fetching DNS records..."
  DNS_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$TF_VAR_cloudflare_zone_id/dns_records" \
    -H "Authorization: Bearer $TF_VAR_cloudflare_api_token" \
    -H "Content-Type: application/json")

  # Check if the DNS API call was successful
  if echo "$DNS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "$DNS_RESPONSE" | jq '.' > dns_output.json || echo '{"result": []}' > dns_output.json
    echo "DNS records fetched successfully"
  else
    echo "Error fetching DNS records:"
    echo "$DNS_RESPONSE" | jq '.' 2>/dev/null || echo "$DNS_RESPONSE"
    echo '{"result": []}' > dns_output.json
  fi

  # Get Workers scripts from Cloudflare API
  echo "Fetching Workers scripts..."
  WORKERS_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$TF_VAR_cloudflare_account_id/workers/scripts" \
    -H "Authorization: Bearer $TF_VAR_cloudflare_api_token" \
    -H "Content-Type: application/json")

  # Check if the Workers API call was successful
  if echo "$WORKERS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "$WORKERS_RESPONSE" | jq '.' > workers_output.json || echo '{"result": []}' > workers_output.json
    echo "Workers scripts fetched successfully"
  else
    echo "Error fetching Workers scripts:"
    echo "$WORKERS_RESPONSE" | jq '.' 2>/dev/null || echo "$WORKERS_RESPONSE"
    echo '{"result": []}' > workers_output.json
  fi
else
  echo "All expected resources found in state - skipping API fetch"
  echo '{"result": []}' > dns_output.json
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

# Helper function to import resource if not in state
import_resource() {
  local resource_address="$1"
  local import_id="$2"
  local resource_name="$3"
  
  if terraform_state_exists "$resource_address"; then
    echo "Skipping import, already in state: $resource_address"
    return 0
  else
    echo "Importing $resource_name with ID: ${import_id##*/}"
    terraform import "$resource_address" "$import_id" || return 1
  fi
}

echo "Found resources:"
if [ "$TF_VAR_environment" = "production" ] && [ -n "$A_RECORD_ID" ] && [ "$A_RECORD_ID" != "null" ]; then
  if terraform_state_exists 'module.app_worker.cloudflare_dns_record.web_a[0]'; then
    echo "  A record: in state (ID: $A_RECORD_ID)"
  else
    echo "  A record: found in API (ID: $A_RECORD_ID)"
  fi
else
  echo "  A record: not applicable"
fi

if [ "$TF_VAR_environment" = "production" ] && [ -n "$AAAA_RECORD_ID" ] && [ "$AAAA_RECORD_ID" != "null" ]; then
  if terraform_state_exists 'module.app_worker.cloudflare_dns_record.web_aaaa[0]'; then
    echo "  AAAA record: in state (ID: $AAAA_RECORD_ID)"
  else
    echo "  AAAA record: found in API (ID: $AAAA_RECORD_ID)"
  fi
else
  echo "  AAAA record: not applicable"
fi

if [ "$TF_VAR_environment" != "production" ] && [ -n "$CNAME_RECORD_ID" ] && [ "$CNAME_RECORD_ID" != "null" ]; then
  if terraform_state_exists 'module.app_worker.cloudflare_dns_record.web_cname[0]'; then
    echo "  CNAME record: in state (ID: $CNAME_RECORD_ID)"
  else
    echo "  CNAME record: found in API (ID: $CNAME_RECORD_ID)"
  fi
else
  echo "  CNAME record: not applicable"
fi

if [ -n "$WORKER_SCRIPT_EXISTS" ] && [ "$WORKER_SCRIPT_EXISTS" != "null" ]; then
  if terraform_state_exists 'module.app_worker.cloudflare_workers_script.web'; then
    echo "  Worker script: in state (Name: $WORKER_SCRIPT_EXISTS)"
  else
    echo "  Worker script: found in API (Name: $WORKER_SCRIPT_EXISTS)"
  fi
else
  echo "  Worker script: not found"
fi

# Import A record if it exists (production only)
if [ "$TF_VAR_environment" = "production" ] && [ -n "$A_RECORD_ID" ] && [ "$A_RECORD_ID" != "null" ]; then
  import_resource 'module.app_worker.cloudflare_dns_record.web_a[0]' "$TF_VAR_cloudflare_zone_id/$A_RECORD_ID" "A record" || true
fi

# Import AAAA record if it exists (production only)
if [ "$TF_VAR_environment" = "production" ] && [ -n "$AAAA_RECORD_ID" ] && [ "$AAAA_RECORD_ID" != "null" ]; then
  import_resource 'module.app_worker.cloudflare_dns_record.web_aaaa[0]' "$TF_VAR_cloudflare_zone_id/$AAAA_RECORD_ID" "AAAA record" || true
fi

# Import CNAME record if it exists (non-production only)
if [ "$TF_VAR_environment" != "production" ] && [ -n "$CNAME_RECORD_ID" ] && [ "$CNAME_RECORD_ID" != "null" ]; then
  import_resource 'module.app_worker.cloudflare_dns_record.web_cname[0]' "$TF_VAR_cloudflare_zone_id/$CNAME_RECORD_ID" "CNAME record" || true
fi

# Import Worker script if it exists
if [ -n "$WORKER_SCRIPT_EXISTS" ] && [ "$WORKER_SCRIPT_EXISTS" != "null" ]; then
  import_resource 'module.app_worker.cloudflare_workers_script.web' "$TF_VAR_cloudflare_account_id/$WORKER_SCRIPT_EXISTS" "Worker script" || true
fi

# Import Workers route if it exists
if [ "$TF_VAR_environment" != "production" ]; then
  ROUTE_PATTERN="$PREFIX.$TF_VAR_cloudflare_zone/*"
else
  ROUTE_PATTERN="$TF_VAR_cloudflare_zone/*"
fi

# Only check for Workers route if we need to import it
if [ "$NEED_API_FETCH" = "true" ] && ! terraform_state_exists 'module.app_worker.cloudflare_workers_route.web'; then
  echo "Checking for Workers route with pattern: $ROUTE_PATTERN"
  
  # Get Workers routes
  ROUTES_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$TF_VAR_cloudflare_zone_id/workers/routes" \
    -H "Authorization: Bearer $TF_VAR_cloudflare_api_token" \
    -H "Content-Type: application/json")

  if echo "$ROUTES_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    ROUTE_ID=$(echo "$ROUTES_RESPONSE" | jq -r --arg pattern "$ROUTE_PATTERN" '.result[]? | select(.pattern == $pattern) | .id' 2>/dev/null || echo "")
    
    if [ -n "$ROUTE_ID" ] && [ "$ROUTE_ID" != "null" ]; then
      import_resource 'module.app_worker.cloudflare_workers_route.web' "$TF_VAR_cloudflare_zone_id/$ROUTE_ID" "Workers route" || true
    else
      echo "No Workers route found to import"
    fi
  else
    echo "Error fetching Workers routes"
  fi
else
  if terraform_state_exists 'module.app_worker.cloudflare_workers_route.web'; then
    echo "Workers route already in state - skipping import"
  fi
fi

echo "Import process completed"