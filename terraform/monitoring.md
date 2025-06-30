# Monitoring & Alerting

This document outlines the monitoring and alerting procedures for the VibeChecc application.

## CloudWatch Monitoring for Amplify

AWS Amplify provides monitoring and alerting out of the box. The following metrics are monitored:
- Requests
- 4xx Errors
- 5xx Errors
- Latency

## Convex Monitoring and Alerts

Convex provides monitoring and alerting out of the box. The following metrics are monitored:
- Function execution time
- Function errors
- Database reads/writes

## Cost Monitoring and Budgets

AWS Budgets is used to monitor and alert on the cost of the AWS resources.

## Deployment Status Monitoring

GitHub Actions provides monitoring and alerting for the deployment status.
