---
name: Testing Standards
description: Use when writing or reviewing backend Jest tests or frontend Cypress E2E tests. Enforces file location, test structure, selectors, and run commands.
applyTo: '**/*.{test,spec,cy}.{js,jsx}'
---

# Testing Standards

## Backend: Jest + Supertest

- Files go in `backend/tests/` with `.test.js` extension.
- Run with: `npm run test:backend`
- Use `supertest` for HTTP-level testing — do not call route logic directly.
- One `describe` block per route file, one `it` block per scenario.
- Always test both the success path and relevant error cases (400, 401, 404).
- Start every `it` description with `should`.

```js
const request = require('supertest');
const app = require('../server');

describe('GET /api/books', () => {
  it('should return all books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it('should return 401 when token is missing', async () => {
    const res = await request(app).post('/api/favorites').send({ bookId: '1' });
    expect(res.statusCode).toBe(401);
  });
});
```

## Frontend: Cypress E2E

- Files go in `frontend/cypress/e2e/` with `.cy.js` extension.
- Run with: `npm run build:frontend && npm run test:frontend`
- Select elements with `cy.get('[data-testid="..."]')` — never use CSS classes, IDs, or tag names.
- Start every `it` description with `should`.

```js
describe('Favorites', () => {
  it('should add a book to favorites', () => {
    cy.get('[data-testid="book-item"]').first().find('[data-testid="add-favorite"]').click();
    cy.get('[data-testid="favorites-list"]').should('contain', 'My Book');
  });
});
```
