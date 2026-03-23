---
applyTo: '**/*.{js,jsx}'
---

# Security Standards

## Input Validation

- Validate all inputs using allowlists — reject anything not explicitly permitted.
- Sanitize flag names: allow only lowercase letters, numbers, and hyphens (`^[a-z0-9-]+$`).
- Validate `environment` against the allowed enum: `development`, `staging`, `production`.
- Cap `description` length at 200 characters.

## Secrets & Code Safety

- **Never** use `eval()` or any form of dynamic code execution.
- **Never** hardcode secrets in source files.
- Use environment variables for the JWT secret: `process.env.JWT_SECRET` with a fallback for development only.

## Error Responses

- Return generic error messages to clients — never expose stack traces or internal details.

## Ownership & Authorization

- Users can only modify (update, delete, toggle) flags they created.
- Admin-role users may modify any flag.
- `userId` and `createdBy` must come from the JWT token, never from the request body.
