---
name: 'Security Standards'
description: 'Use when writing or reviewing JS/JSX code that handles HTTP routes, user input, authentication, or rendering. Enforces OWASP Top 10 controls: input validation, injection prevention, XSS, CORS, secrets, rate limiting, and safe error responses.'
applyTo: '**/*.{js,jsx}'
---

## Input Validation

- Validate ALL route params, query strings, and request body fields before processing.
- Use allowlists: define the exact set of expected fields/values and reject anything outside them with `res.status(400).json({ error: 'Invalid input' })`.
- Strip or reject unexpected fields — never pass `req.body` directly to data-layer calls.

## Injection Prevention

- Never pass unsanitized user input into database queries; use parameterized queries or safe driver APIs.
- Sanitize MongoDB queries with `express-mongo-sanitize` or equivalent to prevent operator injection.

## Dynamic Code Execution

- Never use `eval()`, `new Function()`, `setTimeout(string)`, `setInterval(string)`, or any other form of dynamic code execution.

## Secrets Management

- Never hardcode secrets, API keys, tokens, or passwords in source code.
- Access all secrets via `process.env.*`; document required variables in `.env.example`, never in `.env`.

## XSS Prevention

- Sanitize all user-supplied content before rendering.
- Never use `dangerouslySetInnerHTML` with unsanitized data; if required, run input through a trusted sanitizer first (e.g., `DOMPurify`).

## CORS

- Never set `Access-Control-Allow-Origin: *` in production.
- Configure CORS to allow only known frontend origins using an explicit allowlist (e.g., `process.env.ALLOWED_ORIGIN`).

## Authentication Endpoints

- Apply rate limiting (e.g., `express-rate-limit`) to `/api/login` and `/api/register` (or equivalent auth routes).
- Return generic error messages on auth failure — do not reveal whether a username or password was wrong.

## Error Responses

- Never expose stack traces, internal file paths, or ORM/database error details in API responses.
- Return a generic `{ error: 'An unexpected error occurred' }` message for unhandled server errors (status 500).
