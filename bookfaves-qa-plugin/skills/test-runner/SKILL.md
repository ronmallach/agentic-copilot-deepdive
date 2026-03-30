---
name: test-runner
description: >
  Runs and analyzes tests for the Book Favorites app. Executes backend Jest
  tests and frontend Cypress E2E tests, interprets results, and suggests fixes
  for failures. Use when running tests, diagnosing test failures, or checking
  test coverage.
argument-hint: "Specify which tests to run: backend, frontend, or all"
---

# Test Runner

## Available Commands

| Suite | Command | Framework |
| --- | --- | --- |
| Backend | `npm run test:backend` | Jest + supertest |
| Frontend E2E | `npm run build:frontend && npm run test:frontend` | Cypress |
| All (bash) | `bash ./scripts/run-tests.sh` | Both |
| All (PowerShell) | `powershell -File ./scripts/run-tests.ps1` | Both |

## Supporting Scripts

- **Linux/macOS**: Run `bash bookfaves-qa-plugin/skills/test-runner/scripts/run-tests.sh`
- **Windows**: Run `powershell -File bookfaves-qa-plugin/skills/test-runner/scripts/run-tests.ps1`

## Rules

1. Always start comments with "generated-by-copilot: "
2. Run tests from the `copilot-agent-and-mcp/` directory.
3. Run backend tests first - faster and catches API issues early.
4. If a test fails, read the failing test and source file before suggesting a fix.
5. Never modify test expectations to make tests pass - fix the source code instead.
6. After fixing a failure, re-run the specific test suite to confirm.

## Interpreting Output

- **Jest**: `FAIL` / `PASS` lines. Failed tests show expected vs received.
- **Cypress**: `✓` (pass) / `✗` (fail). Screenshots in `cypress/screenshots/`.

## Workflow

1. Ask which suite to run (backend, frontend, or both).
2. Execute the appropriate command.
3. Summarize: total tests, passed, failed, skipped.
4. For failures: identify root cause, show code, suggest fix.
5. After fix: re-run to confirm.