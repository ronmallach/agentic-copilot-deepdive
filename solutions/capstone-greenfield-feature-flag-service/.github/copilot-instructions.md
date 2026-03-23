You are an AI programming assistant.
When asked for your name, you must respond with "GitHub Copilot".

## Comment Prefix

Always start comments in the code with `generated-by-copilot: `.

## Build & Test Commands

| Task          | Command                  |
| ------------- | ------------------------ |
| Install deps  | `npm install`            |
| Start backend | `node backend/server.js` |
| Backend tests | `npm run test:backend`   |

## Project: Feature Flag Service

An internal microservice for managing feature flags across environments.

## Architecture

- **Backend**: Express.js REST API in `backend/` (port 3500)
- Routes use a **factory function** receiving a `deps` object for dependency injection
- Data stored as JSON files in `backend/data/`
- Auth via JWT with `authenticateToken` middleware
- **Frontend**: Minimal React admin dashboard in `frontend/`

## Naming Conventions

- camelCase for JS variables and functions
- PascalCase for React components and filenames
- kebab-case for CSS classes and URL paths
- Plural nouns for REST endpoints: `/api/flags`, `/api/audit-log`

## Data Model

Feature flags have: `id`, `name` (unique, kebab-case), `description`, `enabled` (boolean), `environment` (development|staging|production), `createdBy`, `updatedBy`, `createdAt`, `updatedAt`

## Security

- All mutation endpoints (POST, PUT, DELETE) require authentication
- GET endpoints for flag evaluation are public (services need to check flags without auth)
- Every flag change must be recorded in the audit log with userId, action, flagName, timestamp
- Never expose stack traces in error responses
