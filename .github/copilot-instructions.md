# Project Guidelines

## Build & Dev

```bash
npm run install:all          # install root + frontend deps
npm run start                # backend (:4000) + frontend (:5173) concurrently
npm run start:backend        # backend only
npm run start:frontend       # frontend only (Vite)
```

## Testing

```bash
npm run test:backend         # copies test data, then runs Jest
npm run build:frontend && npm run test:frontend   # builds, then runs Cypress E2E
```

> Backend tests copy fixture files from `backend/data/test-*.json` before each run — do not rely on production data files in tests.

See `.github/instructions/testing.instructions.md` for test file conventions.

## Architecture

**Backend** — Express.js REST API (`backend/`)

- Every route file exports a **factory function** injected with `{ readJSON, writeJSON, usersFile, booksFile, reviewsFile, authenticateToken, SECRET_KEY }`. See `backend/routes/index.js` for how deps flow in.
- Data persisted as JSON files in `backend/data/`. Never use a database or external storage.
- Auth: `POST /api/login` returns a JWT; protected routes use the `authenticateToken` middleware from `backend/server.js`.
- See `.github/instructions/express.instructions.md` for route conventions.

**Frontend** — React 19 + Redux Toolkit (`frontend/src/`)

- Redux slices in `frontend/src/store/`; use `useAppDispatch` / `useAppSelector` from `store/hooks.js`.
- CSS Modules for all styling (`*.module.css`). See `.github/instructions/css.instructions.md`.
- React Router for navigation. See `.github/instructions/react.instructions.md`.

## Conventions

- **Code comments**: always prefix with `generated-by-copilot: `
- **Naming**: camelCase for JS, PascalCase for React components/files, kebab-case for CSS classes and URL paths
- **REST resources**: plural nouns — `/api/books`, `/api/reading-lists`, `/api/favorites`
- **New routes**: add the factory function in `backend/routes/<resource>.js`, then mount in `backend/routes/index.js`