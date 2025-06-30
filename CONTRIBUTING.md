# Contributing to VibeChecc

This document provides guidelines for contributing to the VibeChecc application.

## Adding New Convex Queries and Mutations

When adding new Convex queries and mutations, please follow these guidelines:
- Create a new file in the `convex/` directory for each new feature.
- Use the `query` and `mutation` functions from `@convex-dev/server` to define your queries and mutations.
- Use the `v` object from `@convex-dev/values` to define the validation for your query and mutation arguments.
- Use the `internal` mutations/queries for sensitive operations and only expose them via actions where necessary.
