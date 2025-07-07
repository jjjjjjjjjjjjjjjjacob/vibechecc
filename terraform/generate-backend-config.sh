#!/bin/bash

# Script to generate backend.tfvars file for Terraform R2 backend configuration
# Based on environment variables

set -e

# Check required environment variables
if [ -z "$R2_BUCKET" ]; then
    echo "Error: R2_BUCKET environment variable is required"
    exit 1
fi

if [ -z "$TF_VAR_cloudflare_account_id" ]; then
    echo "Error: TF_VAR_cloudflare_account_id environment variable is required"
    exit 1
fi

if [ -z "$TF_VAR_environment" ]; then
    echo "Error: TF_VAR_environment environment variable is required"
    exit 1
fi

if [ -z "$R2_ACCESS_KEY_ID" ]; then
    echo "Error: R2_ACCESS_KEY_ID environment variable is required"
    exit 1
fi

if [ -z "$R2_SECRET_ACCESS_KEY" ]; then
    echo "Error: R2_SECRET_ACCESS_KEY environment variable is required"
    exit 1
fi

# Determine the key based on environment and PR number
if [ "$TF_VAR_environment" = "ephemeral" ] && [ -n "$TF_VAR_pr_number" ]; then
    KEY="vibechecc/pr-${TF_VAR_pr_number}/terraform.tfstate"
else
    KEY="vibechecc/terraform.tfstate"
fi

# Set endpoints
ENDPOINTS="{ s3 = \"https://${TF_VAR_cloudflare_account_id}.r2.cloudflarestorage.com\" }"

# Generate the .tfvars file
cat > backend.tfvars << EOF
bucket = "$R2_BUCKET"
key = "$KEY"
endpoints = $ENDPOINTS
access_key = "$R2_ACCESS_KEY_ID"
secret_key = "$R2_SECRET_ACCESS_KEY"
EOF

echo "Generated backend.tfvars file:"
echo "=============================="
cat backend.tfvars
echo "==============================" 