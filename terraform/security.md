# Security Procedures

This document outlines the security procedures for the VibeChecc application.

## IAM Least-Privilege Policies

The IAM roles for GitHub Actions are configured with the minimum necessary permissions to perform their tasks. The policies are defined in the `terraform/modules/github-oidc/main.tf` file.

## Secret Scanning and Rotation

Secrets are stored in AWS Secrets Manager and are not exposed in the codebase. Secret scanning is performed by GitHub Actions to prevent accidental exposure. Secret rotation policies will be implemented in the future.

## Network Security Groups

The Amplify application is not configured with any custom network security groups. The default security groups are used.
