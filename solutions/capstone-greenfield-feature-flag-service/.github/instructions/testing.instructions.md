---
applyTo: '**/*.test.js'
---

# Testing Standards

## Framework & Location

- Use **Jest** as the test runner and **supertest** for HTTP assertions.
- Place all test files in `backend/tests/` with a `.test.js` extension.

## Structure

- One `describe` block per route or resource (e.g., `describe('POST /api/flags', ...)`).
- One `it` block per scenario.
- Test descriptions start with `should` (e.g., `it('should return 201 when creating a valid flag')`).

## Coverage Expectations

- Always test both **success** and **error** cases for each endpoint.
- Error cases to cover: `400` (invalid input), `401` (unauthorized), `404` (not found), `409` (conflict/duplicate).

## Comments

- All comments must start with `generated-by-copilot: `.
