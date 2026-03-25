---
name: Express API Standards
description: Use when writing or reviewing Express.js backend route files. Enforces route structure, dependency injection, HTTP status codes, error format, and data file conventions.
applyTo: '**/*.js'
---

# Express API Standards

## Route File Structure

Each resource gets its own file in `backend/routes/` (e.g., `books.js`, `favorites.js`).
Every route file exports a **factory function** that receives a `deps` object:

```js
const express = require('express');

function createBooksRouter({ booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  router.get('/', (req, res) => { ... });

  return router;
}

module.exports = createBooksRouter;
```

## Registering Routes

Mount new routers in `backend/routes/index.js` via `router.use()`:

```js
router.use('/books', createBooksRouter(deps));
router.use('/reading-lists', createReadingListsRouter(deps));
```

## URL Conventions

Use plural nouns for resource paths: `/books`, `/favorites`, `/reading-lists`.

## Authentication

Protect endpoints with the injected `authenticateToken` middleware:

```js
router.post('/', authenticateToken, (req, res) => { ... });
```

## HTTP Status Codes

| Situation | Code |
|-----------|------|
| Successful read | 200 |
| Resource created | 201 |
| Bad request / missing fields | 400 |
| Unauthorized / invalid token | 401 |
| Resource not found | 404 |
| Server error | 500 |

## Error Response Format

Always use `{ error: 'message' }`. Never expose stack traces:

```js
// ✅ Good
return res.status(404).json({ error: 'Book not found' });

// ❌ Bad
return res.status(500).json({ error: err.stack });
```

## Data Files

JSON data lives in `backend/data/`. Read and write via the injected helpers, and always pretty-print on write:

```js
const data = readJSON(booksFile);
data.push(newItem);
writeJSON(booksFile, JSON.stringify(data, null, 2));
```
