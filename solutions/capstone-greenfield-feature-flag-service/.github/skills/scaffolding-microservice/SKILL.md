---
name: scaffolding-microservice
description: Scaffolds an Express.js microservice with JSON file storage, JWT auth, and audit logging. It creates data files, route handlers, server wiring, and tests following a consistent factory function pattern.
argument-hint: 'Describe the service (e.g., "feature flag service with CRUD operations and audit trail")'
---

# Scaffolding Microservice

Use this skill when the user asks to scaffold a service, create a new microservice, build an API, create an API, or add a resource.

## Scaffolding Checklist

Follow these steps in order. Do not skip steps or reorder them.

### Step 1 - Create Data Files

Create `backend/data/{resource}.json` with an empty array `[]` or seed data if provided.
Create `backend/data/audit-log.json` with an empty array `[]`.
Create `backend/data/users.json` with default admin/user accounts for development.

### Step 2 - Create Route Handlers

Create `backend/routes/{resource}.js` using the **factory function pattern**:

- Export a function that receives a `deps` object (`{ readData, writeData, authenticateToken, uuidv4 }`)
- Return an Express Router
- Include CRUD endpoints with input validation
- Protected mutations require `deps.authenticateToken` middleware
- Every mutation appends to the audit log via `deps.writeData`

See `templates.md` for the route skeleton.

### Step 3 - Create Route Index

Create `backend/routes/index.js` to compose all routers:

- Import each route factory
- Call each with the shared `deps` object
- Mount routers on their base paths (e.g., `/api/flags`, `/api/audit-log`, `/api/auth`)

### Step 4 - Create Server

Create `backend/server.js` with:

- Express app setup with CORS and JSON body parsing
- JWT `authenticateToken` middleware function
- `readData` / `writeData` helpers for JSON file storage
- A `deps` object bundling all shared utilities
- Route wiring via `routes/index.js`
- Server start on port 3500

See `templates.md` for the server skeleton.

### Step 5 - Wire and Verify

Ensure all routes are registered in `routes/index.js`.
Ensure `server.js` imports and uses the composed router.
Verify the server starts without errors: `node backend/server.js`.

### Step 6 - Create Tests

Create `backend/tests/{resource}.test.js` with:

- Jest + supertest
- `describe` block per route group
- `it` block per scenario (success + error cases)
- Test descriptions start with "should"
- Test status codes: 200, 201, 400, 401, 404, 409

See `templates.md` for the test skeleton.

### Step 7 - Run Tests

Run `npm run test:backend` and fix any failures before finishing.

## Conventions

- All comments start with `generated-by-copilot: `
- camelCase for variables and functions
- kebab-case for URL paths and flag names
- PascalCase for React components
- Routes export factory functions, never side-effect imports
- `userId` and `createdBy` come from the JWT token, never from the request body
- Error responses use `{ error: 'message' }` format
- Flag names validated with `^[a-z0-9-]+$`
- Descriptions capped at 200 characters
- Environment must be one of: `development`, `staging`, `production`

## What This Skill Does NOT Cover

- Docker or containerization
- CI/CD pipelines
- Deployment configuration
- Logging frameworks
