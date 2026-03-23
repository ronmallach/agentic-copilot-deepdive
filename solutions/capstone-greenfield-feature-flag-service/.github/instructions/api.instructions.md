---
applyTo: '**/*.js'
---

# Feature Flag API Standards

## Route Pattern

- Route files export a **factory function** receiving a `deps` object: `module.exports = function createXRouter(deps) { ... }`
- The `deps` object provides shared utilities: `authenticateToken`, data accessors, and helpers.
- Register all routers in a central `backend/routes/index.js`.

## Authentication

- Use `authenticateToken` middleware on all mutation endpoints (POST, PUT, DELETE).
- GET endpoints for flag evaluation are public — do not require auth.

## Error Responses

- Return `{ error: 'message' }` for all error responses.
- Use correct HTTP status codes:
  - `200` — success
  - `201` — resource created
  - `400` — invalid or missing request body fields
  - `401` — unauthorized (missing or invalid token)
  - `404` — resource not found
  - `409` — conflict (duplicate flag name per environment)
  - `500` — unexpected server error

## Validation

- Always validate request body fields before processing.
- Flag names must be unique per environment and match kebab-case: `^[a-z0-9-]+$`.
- Reject requests with missing or invalid fields with a `400` status.

## Audit Logging

- Every mutation (create, update, delete, toggle) must append an entry to the audit log.
- Audit entries include: `userId`, `action`, `flagName`, `changes`, and `timestamp`.
