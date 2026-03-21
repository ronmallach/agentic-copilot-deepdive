# Lab: Custom Instructions in VS Code - Define Coding Standards for AI

> \[!NOTE\]  
> This lab uses the **Custom Instructions** feature in VS Code to define coding standards, conventions, and guidelines that GitHub Copilot follows automatically. You will configure instructions for the **Book Favorites** app (`copilot-agent-and-mcp/`).
> 
> **This lab is a prerequisite for the** [**Custom Agents lab**](01-custom-agents-exercise.md)**.** Custom instructions define _what rules to follow_; custom agents define _who follows them_ and _with which tools_. Understanding instructions first makes agent design much clearer.

## Overview

Custom instructions let you tell GitHub Copilot how your project works - coding conventions, naming patterns, architecture rules, testing commands - so it produces consistent, project-aligned code without you repeating yourself in every prompt.

Instead of typing "always use single quotes and semicolons" in every chat, you write it once in an instruction file and Copilot applies it automatically.

### Custom Instructions vs Custom Agents vs Agent Skills

|   | Custom Instructions | Custom Agents | Agent Skills |
| --- | --- | --- | --- |
| **Purpose** | Define coding standards and guidelines | Configure AI personas with tool restrictions | Teach specialized capabilities and workflows |
| **Format** | `.instructions.md` or `copilot-instructions.md` | `.agent.md` | `SKILL.md` |
| **Scope** | Always-on or file-pattern based | Switched manually or via handoffs | Task-specific, loaded on-demand |
| **Controls tools?** | No | Yes | No |
| **Portability** | VS Code, GitHub.com, and Copilot coding agent | VS Code only | VS Code, Copilot CLI, Copilot coding agent |

### What You Will Learn

**Total Time: ~45 minutes**

| Part | Topic | Description | Time&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |
| --- | --- | --- | --- |
| Pre | [Prerequisites](#prerequisites) | VS Code, Copilot subscription, repo cloned, Context7 MCP configured, app running | 10 min |
| 1 | [Always-On Instructions with `copilot-instructions.md`](#part-1---always-on-instructions-with-copilot-instructionsmd-10-min) | Understand always-on vs file-based instructions; enhance `copilot-instructions.md` with project conventions | 10 min |
| 2 | [File-Based Instructions with `/create-instruction`](#part-2---file-based-instructions-with-create-instruction-20-min) | Generate targeted `.instructions.md` files with `applyTo` glob patterns; extract instructions from conversations | 20 min |
| 3 | [Organize and Verify Instructions](#part-3---organize-and-verify-instructions-5-min) | Use `/instructions` to verify loaded files; troubleshoot with Diagnostics; understand instruction priority | 5 min |
| | | **Total** | **45&nbsp;min** |

### Prerequisites (10 min)

| Requirement | Details |
| --- | --- |
| **VS Code** | Insiders or latest Stable with GitHub Copilot extension (Agent Mode enabled) |
| **GitHub Copilot** | Copilot Pro, Pro+, Business, or Enterprise subscription |
| **Workspace** | This repository cloned locally |
| **Context7 MCP** | Context7 MCP server configured in VS Code (see setup below) |
| **App running** | `npm install && npm start` in `copilot-agent-and-mcp/` - backend on :4000, frontend on :5173 |

### Context7 MCP Setup

This lab uses the **Context7 MCP server** to pull up-to-date library documentation directly into your prompts. This ensures the instruction files you generate reflect current best practices - not outdated patterns.

1.  Open **Settings** (`Ctrl+,`) and search for `mcp`.
2.  Open your MCP configuration (user or workspace `settings.json`) and add the Context7 server if not already present:

```
"mcp": {
    "servers": {
        "context7": {
            "type": "stdio",
            "command": "npx",
            "args": ["-y", "@upstash/context7-mcp@latest"]
        }
    }
}
```

1.  Restart VS Code to activate the MCP server.
2.  Verify it is running: in the Chat view, type `@` and check that Context7 tools (`context7_resolve-library-id`, `context7_get-library-docs`) appear in the tool list.

> **Why Context7?** When you ask `/create-instruction` to generate conventions for React or Express, the AI relies on its training data which may be outdated. By referencing Context7 in your prompt, Copilot first fetches the **latest official documentation** for each library, then generates instructions that align with current APIs and best practices.

---

## Instruction Files at a Glance

```
Instruction Types
─────────────────

Always-on (every chat request)          File-based (pattern-matched)
┌────────────────────────────────┐      ┌────────────────────────────────┐
│ .github/copilot-instructions.md│      │ .github/instructions/          │
│ AGENTS.md                      │      │   react.instructions.md        │
│ CLAUDE.md                      │      │   express.instructions.md      │
└────────────────────────────────┘      │   testing.instructions.md      │
                                        └────────────────────────────────┘
       ▼ applied automatically                ▼ applied when applyTo
         to ALL requests                        pattern matches files
                                                being worked on
```

### Priority Order

When multiple instruction sources exist, they are all provided to the AI. Higher-priority instructions take precedence on conflicts:

1.  **Personal instructions** (user-level `~/.copilot/instructions/`) - highest priority
2.  **Repository instructions** (`.github/copilot-instructions.md` or `AGENTS.md`)
3.  **Organization instructions** - lowest priority

---

## Part 1 - Always-On Instructions with `copilot-instructions.md` (10 min)

**Objective:** Understand the existing `copilot-instructions.md` file, enhance it with project-specific conventions, and verify that Copilot applies it to every chat request.

### Exercise 1.1 - Examine the Existing Instructions

The Book Favorites app already has a `copilot-instructions.md` file. Open it and review its contents:

1.  Open `copilot-agent-and-mcp/.github/copilot-instructions.md` in the editor.
2.  Read through the instructions. You should see rules about comment prefixes, test commands, and change verification.

**Current content:**

```
You are an AI programming assistant.
When asked for your name, you must respond with "GitHub Copilot".

Important Instructions:
1. Always start comments in the code with "generated-by-copilot: "
2. When testing is needed, use these exact commands:
   - Backend tests: `npm run test:backend`
   - E2E tests: `npm run build:frontend && npm run test:frontend`
3. Before suggesting changes:
   - Check existing code context
   - Explain what changes will be made
   - Consider both frontend and backend implications
4. After making changes:
   - Verify the changes work
   - Run relevant tests
   - Suggest any additional improvements
```

### Exercise 1.2 - Enhance with Project Conventions

Add the following project-specific conventions to the bottom of `copilot-instructions.md`:

```

## Project Architecture

- **Backend**: Express.js REST API in `backend/`
  - Routes are modular: `backend/routes/auth.js`, `backend/routes/books.js`, etc.
  - Router composition in `backend/routes/index.js`
  - Data stored as JSON files in `backend/data/`
  - Authentication uses JWT via `authenticateToken` middleware
- **Frontend**: React 18 with Redux Toolkit in `frontend/src/`
  - State management via Redux slices in `frontend/src/store/`
  - CSS Modules for styling (`*.module.css`)
  - React Router for navigation

## Naming Conventions

- Use camelCase for JavaScript variables and functions
- Use PascalCase for React component names and files
- Use kebab-case for CSS class names and URL paths
- Use plural nouns for REST resource endpoints (e.g., `/api/books`, `/api/reading-lists`)
```

### Exercise 1.3 - Verify Instructions Are Applied

1.  Open the Chat view in VS Code.
2.  Type `/instructions` in the chat input box and press Enter.
3.  This opens the **Configure Instructions and Rules** menu showing all instruction files Copilot has detected.

**Verify:**

*   `copilot-instructions.md` appears in the list with a checkmark (enabled)
*   Hover over it to see its source path: `.github/copilot-instructions.md`

1.  Now test that Copilot follows the instructions. Open a **new chat** and enter:

> "Add a comment to the top of `copilot-agent-and-mcp/backend/routes/books.js` describing what this file does."

**Verify:**

*   The generated comment starts with `generated-by-copilot:` (following rule #1)
*   Copilot references the existing code conventions (modular routes, Express.js)

### Exercise 1.4 - Check the References Section

After Copilot responds, look at the **References** section at the bottom of the chat response (click to expand if collapsed). You should see `copilot-instructions.md` listed as a context source.

> **Tip:** If you don't see it in References, right-click in the Chat view and select **Diagnostics** to check if the file was loaded.

---

## Part 2 - File-Based Instructions with `/create-instruction` (20 min)

**Objective:** Use the `/create-instruction` command to generate targeted instruction files that apply only when Copilot is working on specific file types. You will create four instruction files - one each for React, Express, Testing, and CSS - review and refine the AI-generated output, then verify everything with `/instructions`.

### How File-Based Instructions Work

File-based instructions use `.instructions.md` files stored in `.github/instructions/`. Each file has optional YAML frontmatter with an `applyTo` glob pattern that tells Copilot when to include it:

```
┌──────────────────────────────────────────────────────────────┐
│                   .github/instructions/                      │
│                                                              │
│  react.instructions.md          applyTo: '**/*.jsx'          │
│  express.instructions.md        applyTo: '**/*.js'           │
│  testing.instructions.md        applyTo: '**/*.test.js'      │
│  css.instructions.md            applyTo: '**/*.module.css'   │
└──────────────────────────────────────────────────────────────┘
          │                                │
          ▼                                ▼
  Working on BookList.jsx?          Working on books.js?
  → react.instructions.md            → express.instructions.md
    is applied automatically            is applied automatically
```

### Exercise 2.1 - Generate React Instructions

1.  Type `/create-instruction` in the Chat view.
2.  When prompted for a location, choose `.github/instructions` and enter `react` as the file name.
3.  Copilot will ask you to describe the convention. Enter:

> "Use Context7 to fetch the latest React and Redux Toolkit documentation first. Then create a concise instruction file (under 50 lines in the body) and save it as `.github/instructions/react.instructions.md`. In the YAML frontmatter, include `name: 'React Component Standards'`, a one-line `description`, and `applyTo: '**/*.jsx'` as a plain string - not an array, and do not include TSX. Conventions to enforce: use functional components with hooks only (no class components), import order is React → third-party → local components → styles, destructure props in the function signature with defaults, use useAppDispatch and useAppSelector from `../store/hooks` instead of raw useDispatch/useSelector from react-redux, use Redux Toolkit slices in `frontend/src/store/` for shared state and useState only for local UI state (dropdowns, form inputs), use CSS Modules with `import styles from '../styles/ComponentName.module.css'` and reference classes as `styles.className`, and always check for token before dispatching authenticated API calls - redirect to login if missing. Include one short good/bad code example for the Redux hooks rule. Do not add performance optimization, testing, or custom hooks sections - keep it focused on the conventions listed above."

> **What happens:** Copilot calls Context7 to resolve and fetch docs for `react` and `@reduxjs/toolkit`, then uses those docs alongside your conventions to generate an instruction file with up-to-date patterns.

1.  Copilot generates a `.instructions.md` file and opens it for review. **Do not accept it yet** - check it against the checklist below.

**Review checklist:**

| Field | What to look for | If missing |
| --- | --- | --- |
| `name` | Something like "React Component Standards" | Add `name: 'React Component Standards'` |
| `description` | Mentions React components and conventions | Add a clear one-liner |
| `applyTo` | Must be `'**/*.jsx'` as a **plain string** (not an array, no TSX) | Replace with `applyTo: '**/*.jsx'` |
| Body | Mentions `useAppSelector`/`useAppDispatch` from `../store/hooks` | Add the rule |
| Body | Mentions CSS Modules with `styles.className` | Add the rule |
| Body | Mentions functional components only | Add the rule |
| Body | Mentions token check before authenticated calls | Add the rule |
| Length | Under ~50 lines in the body - no performance, testing, or custom hooks sections | Remove extra sections |

Fix any issues from the checklist. Common problems to watch for:

*   `**applyTo**` **is an array** - e.g. `applyTo: ['frontend/**/*.jsx', '**/*.tsx']`. Replace with the plain string `applyTo: '**/*.jsx'`.
*   **Includes TSX** - this project uses `.jsx` only. Remove any `.tsx` patterns.
*   **Too long** - if the body exceeds ~50 lines, delete sections you didn't ask for (performance optimization, custom hooks, testing considerations, summary checklists).
*   **Contradicts other instructions** - e.g. says "use camelCase for CSS class names" when the CSS instructions say kebab-case. Remove CSS naming rules from this file (they belong in the CSS instruction).
*   **Invents patterns not in the codebase** - e.g. a `useAuth` custom hook or `helperFunction` utility that don't exist. Remove invented examples.

Accept the file once it looks reasonable.

**Expected output reference** - the generated file should resemble this (your exact output will differ):

````
---
name: 'React Component Standards'
description: 'Conventions for React components in the Book Favorites frontend'
applyTo: '**/*.jsx'
---

# React Component Standards

## Component Structure

- Use functional components with hooks (no class components)
- Import order: React, third-party libraries, local imports, styles
- Destructure props in the function signature
- Use `useAppDispatch` and `useAppSelector` from `../store/hooks` (not raw `useDispatch`/`useSelector`)

## State Management

- Use Redux Toolkit slices for shared state (`frontend/src/store/`)
- Use `useState` for local UI state only (dropdowns, form inputs)
- Dispatch actions in `useEffect` for data fetching on mount
- Always check for `token` before making authenticated API calls

## Styling

- Use CSS Modules: `import styles from '../styles/ComponentName.module.css'`
- Reference classes as `styles.className` (not string literals)
- One CSS Module file per component

## Patterns to Follow

```jsx
// Good: useAppSelector from store hooks
import { useAppSelector, useAppDispatch } from '../store/hooks';
const token = useAppSelector(state => state.user.token);

// Bad: raw useSelector
import { useSelector } from 'react-redux';
const token = useSelector(state => state.user.token);
````

### Exercise 2.2 - Generate Express Backend Instructions

1.  Type `/create-instruction` in a new Chat view.
2.  When prompted for a location, choose `.github/instructions` and enter `express` as the file name.
3.  Enter this description:

```
"Use Context7 to fetch the latest Express.js documentation first. Then create a concise instruction file (under 40 lines in the body) and save it as `.github/instructions/express.instructions.md`. In the YAML frontmatter, include `name: 'Express API Standards'`, a one-line `description`, and `applyTo: '**/*.js'` as a plain string - not an array. Conventions to enforce: each resource gets its own route file in `backend/routes/` (e.g., `books.js`, `favorites.js`), route files export a factory function that receives a `deps` object for dependency injection, register new routers in `backend/routes/index.js` via `router.use()`, use plural nouns for resource paths like `/books` and `/reading-lists`, use `authenticateToken` middleware for protected endpoints, return appropriate HTTP status codes (200, 201, 400, 401, 404, 500), use consistent error format `{ error: 'message' }`, never expose stack traces, JSON data files live in `backend/data/`, write with `JSON.stringify(data, null, 2)`. Do not add testing, deployment, or logging sections - keep it focused on route and API conventions only."
```

1.  Review the generated file against this checklist:

| Field | What to look for | If missing |
| --- | --- | --- |
| `name` | Something like "Express API Standards" | Add `name: 'Express API Standards'` |
| `applyTo` | Must be `'**/*.js'` as a **plain string** (not an array) | Replace with `applyTo: '**/*.js'` |
| Body | Mentions factory function pattern with `deps` | Add the rule |
| Body | Mentions `authenticateToken` middleware | Add the rule |
| Body | Mentions error response format `{ error: '...' }` | Add the rule |
| Length | Under ~40 lines - no testing, deployment, or logging sections | Remove extra sections |

1.  Accept the file.

**Expected output reference:**

```
---
name: 'Express API Standards'
description: 'Conventions for Express.js backend routes and middleware'
applyTo: '**/*.js'
---

# Express API Standards

## Route Structure

- Each resource gets its own route file in `backend/routes/` (e.g., `books.js`, `favorites.js`)
- Route files export a factory function that receives `deps` (dependency injection)
- Register new routers in `backend/routes/index.js` via `router.use()`
- Use plural nouns for resource paths: `/books`, `/favorites`, `/reading-lists`

## Authentication

- Use `authenticateToken` middleware for any endpoint that requires login
- Public endpoints (no auth): `GET /api/books`
- Protected endpoints (auth required): `POST /api/favorites`, `DELETE /api/favorites/:id`
- Extract user info from `req.user` (set by middleware)

## Error Handling

- Return appropriate HTTP status codes: 200, 201, 400, 401, 404, 500
- Use consistent error response format: `{ error: 'Description of what went wrong' }`
- Never expose stack traces or internal paths in error responses
- Validate required fields and return 400 with a descriptive message

## Data Access

- JSON data files live in `backend/data/` (e.g., `books.json`, `users.json`)
- Read with `require()` or `fs.readFileSync()` for simplicity
- Write with `fs.writeFileSync()` with `JSON.stringify(data, null, 2)` for readability
```

### Exercise 2.3 - Generate Testing Instructions

1.  Type `/create-instruction` in the Chat view.
2.  When prompted for a location, choose `.github/instructions` and enter `testing` as the file name.
3.  Enter this description:

> "Use Context7 to fetch the latest Jest and Cypress documentation first. Then create a concise instruction file (under 30 lines in the body) and save it as `.github/instructions/testing.instructions.md`. In the YAML frontmatter, include `name: 'Testing Standards'`, a one-line `description`, and `applyTo: '**/*.{test,spec,cy}.{js,jsx}'` as a plain string - not an array. Conventions to enforce: backend Jest tests go in `backend/tests/` with `.test.js` extension using supertest for HTTP testing, run with `npm run test:backend`, structure as describe block per route and it block per scenario, always test both success and error cases (400, 401, 404). Frontend Cypress E2E tests go in `frontend/cypress/e2e/` with `.cy.js` extension, run with `npm run build:frontend && npm run test:frontend`, use `cy.get('[data-testid="..."]')` for element selection. Always start test descriptions with 'should'. Do not add CI/CD, coverage, or snapshot testing sections."

1.  Review and accept the file.

**Expected output reference:**

```
---
name: 'Testing Standards'
description: 'Conventions for Jest unit tests and Cypress E2E tests'
applyTo: '**/*.{test,spec,cy}.{js,jsx}'
---

# Testing Standards

## Backend Tests (Jest)

- Test files go in `backend/tests/` with `.test.js` extension
- Use `supertest` for HTTP endpoint testing
- Run with: `npm run test:backend`
- Structure: describe block per route, it block per scenario
- Always test both success and error cases (400, 401, 404)

## Frontend E2E Tests (Cypress)

- Test files go in `frontend/cypress/e2e/` with `.cy.js` extension
- Run with: `npm run build:frontend && npm run test:frontend`
- Use `cy.get('[data-testid="..."]')` for element selection
- Test user flows end-to-end: login → action → verify result

## General Rules

- Every new endpoint needs at least one happy-path and one error test
- Mock external dependencies, not internal modules
- Use descriptive test names: `should return 401 when no token is provided`
- Always start test descriptions with "should"
```

### Exercise 2.4 - Generate CSS Module Instructions

1.  Type `/create-instruction` in the Chat view.
2.  When prompted for a location, choose `.github/instructions` and enter `css` as the file name.
3.  Enter this description:

> "Use Context7 to fetch the latest CSS Modules documentation first. Then create a concise instruction file (under 30 lines in the body) and save it as `.github/instructions/css.instructions.md`. In the YAML frontmatter, include `name: 'CSS Module Standards'`, a one-line `description`, and `applyTo: '**/*.module.css'` as a plain string - not an array. Conventions to enforce: use kebab-case for all class names (e.g., `.book-card`, `.nav-header`), never use `!important`, use CSS custom properties (variables) defined in `App.module.css` for colors and spacing, mobile-first responsive design with `min-width` media queries, and keep selectors flat - maximum 2 levels of nesting. Include one short good/bad CSS example. Do not add animation, theming, or preprocessor sections."

1.  Review the generated file against this checklist:

| Field | What to look for | If missing |
| --- | --- | --- |
| `name` | Something like "CSS Module Standards" | Add `name: 'CSS Module Standards'` |
| `applyTo` | Must be `'**/*.module.css'` as a **plain string** (not an array) | Replace with `applyTo: '**/*.module.css'` |
| Body | Mentions kebab-case class names | Add the rule |
| Body | Mentions no `!important` | Add the rule |
| Body | Mentions CSS custom properties | Add the rule |
| Length | Under ~30 lines - no animation, theming, or preprocessor sections | Remove extra sections |

1.  Accept the file.

**Expected output reference:**

````
---
name: 'CSS Module Standards'
description: 'Styling conventions for CSS Module files in the Book Favorites app'
applyTo: '**/*.module.css'
---

# CSS Module Standards

## Naming

- Use kebab-case for all class names (e.g., `.book-card`, `.nav-header`)
- File name must match the component: `BookList.module.css` for `BookList.jsx`

## Rules

1. Never use `!important` - restructure specificity instead.
2. Use CSS custom properties from `App.module.css` for colors and spacing.
3. Keep selectors flat - maximum 2 levels of nesting.
4. Use mobile-first responsive design with `min-width` media queries.

## Patterns

```css
/* Good: flat selectors, kebab-case, custom properties */
.book-card {
  padding: var(--spacing-md);
  background: var(--color-surface);
}

.book-card .title {
  font-size: var(--font-size-lg);
}

/* Bad: deeply nested, hardcoded values, !important */
.book-card .content .inner .title {
  font-size: 18px !important;
  background: #ffffff;
}
````

### Exercise 2.5 - Verify All Instructions with `/instructions`

1.  Type `/instructions` in the chat input and press Enter.
2.  You should now see all instruction files listed:

| Instruction File | Source | Applied When |
| --- | --- | --- |
| `copilot-instructions.md` | `.github/copilot-instructions.md` | Always (every request) |
| `React Component Standards` | `.github/instructions/react.instructions.md` | Working on `**/*.jsx` |
| `Express API Standards` | `.github/instructions/express.instructions.md` | Working on `**/*.js` |
| `Testing Standards` | `.github/instructions/testing.instructions.md` | Working on `*.test.js`, `*.cy.js` |
| `CSS Module Standards` | `.github/instructions/css.instructions.md` | Working on `**/*.module.css` |

1.  Verify each file appears with its name from the `name` frontmatter field.

### Exercise 2.6 - Test Pattern-Based Activation

Test that the right instructions activate based on the file you are working on:

**Test 1 - React instructions:**

1.  Open `copilot-agent-and-mcp/frontend/src/components/BookList.jsx` in the editor.
2.  In the Chat view, ask:

> "Refactor the BookList component to extract the reading list dropdown into a separate component called ReadingListDropdown."

1.  Check the **References** section - you should see `react.instructions.md` listed. If not ask copilot if it did pick it up.
2.  Verify the generated code uses `useAppSelector`/`useAppDispatch` (not raw Redux hooks), CSS Modules, and functional component patterns.

**Test 2 - Express instructions:**

1.  Open `copilot-agent-and-mcp/backend/routes/books.js` in the editor.
2.  Ask:

> "Add a GET endpoint to search books by title with a query parameter."

1.  Check **References** - you should see `express.instructions.md` listed. If not ask copilot if it did pick it up.
2.  Verify the generated code follows the factory function pattern, uses `req.query`, and returns proper status codes.

> **Tip:** If an instruction file does not appear in References, check that the `applyTo` glob pattern matches the file path relative to the workspace root. Use `/instructions` to confirm the file is registered.

### Exercise 2.7 - Extract an Instruction from a Conversation

You can also extract instructions from an ongoing chat. This is useful when you correct Copilot mid-conversation and want to capture the correction permanently.

1.  Open a new chat and ask:

> "Create a new Express route for book reviews in `backend/routes/reviews.js`."

1.  If Copilot generates code that uses `module.exports = function(app) { ... }` (older Express pattern) instead of the project's factory function pattern, correct it:

> "No - this project uses a factory function pattern: `module.exports = function createReviewsRouter(deps) { ... }` that receives a `deps` object. Fix the code."

1.  After Copilot corrects itself, extract the convention as a permanent instruction:

> "Extract an instruction from this conversation about the Express route factory pattern."

Copilot will generate a new `.instructions.md` file capturing the pattern. Review and accept it.

Verify with `/instructions` - confirm the newly generated instruction appears in the list alongside your previous instruction files.

### Exercise 2.8 - Understand `/create-instruction` vs `/init`

| Command | Purpose | Creates |
| --- | --- | --- |
| `/create-instruction` | Generate a targeted, file-specific instruction | A single `.instructions.md` file with a focused `applyTo` pattern |
| `/init` | Bootstrap comprehensive workspace-wide instructions | A `copilot-instructions.md` file covering the entire project |

Try `/init` if you want to see what Copilot would generate for the entire workspace (it analyzes project structure, dependencies, and patterns). It will either create or update `copilot-instructions.md`.

> **Note:** If you already have a `copilot-instructions.md` file, `/init` will offer to update it. Review carefully before accepting - it may overwrite your Exercise 1.2 additions.

---

## Part 3 - Organize and Verify Instructions (5 min)

**Objective:** Review your complete instruction file structure, verify everything is loaded correctly, use Diagnostics for troubleshooting, and understand how instructions flow into the agents you will build in the next lab.

### Exercise 3.1 - Review Your Instruction File Structure

At this point you should have the following files:

```
copilot-agent-and-mcp/
  .github/
    copilot-instructions.md              ← Always-on (Part 1)
    instructions/
      react.instructions.md             ← applyTo: **/*.jsx (Part 2)
      express.instructions.md           ← applyTo: **/*.js (Part 2)
      testing.instructions.md           ← applyTo: **/*.test.js, *.cy.js (Part 2)
      css.instructions.md               ← applyTo: **/*.module.css (Part 2)
```

### Exercise 3.2 - Troubleshoot with Diagnostics

If any instruction file is missing from the `/instructions` list:

1.  Right-click in the Chat view and select **Diagnostics**.
2.  Review the **Custom Instructions** section.
3.  Check for:
    *   File path errors (wrong directory)
    *   YAML frontmatter syntax errors (missing `---` delimiters, bad indentation)
    *   `applyTo` glob patterns that don't match any files
    *   Settings that disable instruction discovery

**Common issues and fixes:**

| Issue | Symptom | Fix |
| --- | --- | --- |
| Wrong folder | File not listed in `/instructions` | Move to `.github/instructions/` |
| Missing `applyTo` | File listed but never auto-applied | Add `applyTo` pattern to frontmatter |
| Bad glob pattern | File listed but not applied to expected files | Ensure pattern is relative to workspace root (e.g., `**/*.jsx` or `frontend/**/*.jsx`) |
| YAML error | File not listed or shows error | Fix frontmatter: ensure `---` delimiters, proper quoting |
| Setting disabled | Entire category missing | Check `chat.instructionsFilesLocations` in Settings |

### Exercise 3.3 - Configure Custom Instruction Locations (Optional)

By default, VS Code searches `.github/instructions/` for instruction files. You can add or remove search locations:

1.  Open **Settings** (`Ctrl+,`) and search for `chat.instructionsFilesLocations`.
2.  You should see the default locations:

```
"chat.instructionsFilesLocations": {
    ".github/instructions": true,
    ".claude/rules": true,
    "~/.copilot/instructions": true,
    "~/.claude/rules": true
}
```

1.  You can add custom paths (e.g., `"docs/conventions": true`) or disable user-level instructions by setting them to `false`.

### Exercise 3.4 - Understand How Instructions Feed into Agents

The instructions you created in this lab are automatically available to the custom agents you will build in the [Custom Agents lab](01-custom-agents-exercise.md). Here is how they connect:

```
┌─────────────────────────────────────────────────────────────┐
│               Instruction Files (this lab)                  │
│                                                             │
│  copilot-instructions.md   →   Applied to ALL agents        │
│  react.instructions.md     →   Applied when agent edits JSX │
│  express.instructions.md   →   Applied when agent edits JS  │
│  testing.instructions.md   →   Applied when agent writes    │
│                                 test files                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Custom Agents (next lab)                      │
│                                                             │
│  Planner       →  reads code, gets express/react rules      │
│  Implementer   →  edits code, gets matching instructions    │
│  Reviewer      →  reviews code, gets all relevant rules     │
│  Test Writer   →  writes tests, gets testing instructions   │
└─────────────────────────────────────────────────────────────┘
```

Custom agents add **tool restrictions**, **model preferences**, and **persona-specific behavior** on top of the instructions you defined here. The instructions ensure consistent conventions regardless of which agent is active.

---

## Bonus Challenges

### Challenge 1 - Security-Focused Instructions (10 min)

Create a security instruction file that applies to all JavaScript files and enforces OWASP best practices:

1.  Type `/create-instruction` in the Chat view.
2.  When prompted for a location, choose `.github/instructions` and enter `security` as the file name.
3.  Enter this description:

> "Use Context7 to fetch the latest OWASP security guidelines first. Then create a concise instruction file (under 40 lines in the body) and save it as `.github/instructions/security.instructions.md`. In the YAML frontmatter, include `name: 'Security Standards'`, a one-line `description`, and `applyTo: '**/*.{js,jsx}'` as a plain string - not an array. Conventions to enforce: validate all route parameters, query strings, and request body fields before processing - use allowlists and reject unexpected input with 400 status, never use `eval()`, `Function()`, `setTimeout(string)`, or any dynamic code execution, never hardcode secrets or API keys in source code - use environment variables, prevent SQL/NoSQL injection with parameterized queries, sanitize all user input before rendering to prevent XSS - never use `dangerouslySetInnerHTML` with unsanitized data, never use wildcard `*` for CORS `Access-Control-Allow-Origin` in production - configure CORS to allow only known frontend origins, apply rate limiting on authentication endpoints (`/api/auth/login`, `/api/auth/register`), never expose stack traces or internal error details in API responses. Do not add deployment, CI/CD, or logging sections."

1.  Review the generated file against this checklist:

| Field | What to look for | If missing |
| --- | --- | --- |
| `name` | Something like "Security Standards" | Add `name: 'Security Standards'` |
| `applyTo` | Must be `'**/*.{js,jsx}'` as a **plain string** (not an array) | Replace with `applyTo: '**/*.{js,jsx}'` |
| Body | Mentions input validation with allowlists | Add the rule |
| Body | Mentions no `eval()` / `Function()` / dynamic code execution | Add the rule |
| Body | Mentions environment variables for secrets | Add the rule |
| Body | Mentions XSS prevention and `dangerouslySetInnerHTML` | Add the rule |
| Body | Mentions CORS - no wildcard in production | Add the rule |
| Body | Mentions rate limiting on auth endpoints | Add the rule |
| Length | Under ~40 lines - no deployment, CI/CD, or logging sections | Remove extra sections |

1.  Accept the file.
2.  Test by asking Copilot to create a login endpoint - verify it includes input validation and doesn't leak error details.

**Expected output reference:**

```
---
name: 'Security Standards'
description: 'OWASP-aligned security conventions for all JavaScript and JSX files'
applyTo: '**/*.{js,jsx}'
---

# Security Standards

## Input Validation
- Validate all route parameters, query strings, and request body fields before processing
- Use allowlists for expected values; reject unexpected input with 400 status
- Never trust client-side validation alone - always validate server-side

## Forbidden Patterns
- Never use `eval()`, `Function()`, `setTimeout(string)`, or any dynamic code execution
- Never hardcode secrets, API keys, or credentials in source code - use environment variables
- Never expose stack traces or internal error details in API responses

## Injection Prevention
- Use parameterized queries for any database operations
- Sanitize user input before inserting into HTML or database queries
- Escape special characters in user-provided data used in file paths or shell commands

## XSS Prevention
- Sanitize all user input before rendering in the browser
- Use React's built-in JSX escaping - never use `dangerouslySetInnerHTML` with unsanitized data
- Validate and sanitize URL parameters before using in redirects

## CORS & Rate Limiting
- Never use wildcard `*` for CORS `Access-Control-Allow-Origin` in production
- Configure CORS to allow only known frontend origins
- Apply rate limiting on authentication endpoints (`/api/auth/login`, `/api/auth/register`)
```

### Challenge 2 - Documentation Instructions (5 min)

Create an instruction file that governs how Copilot writes documentation:

1.  Type `/create-instruction` in the Chat view.
2.  When prompted for a location, choose `.github/instructions` and enter `docs` as the file name.
3.  Enter this description:

> "Create a concise instruction file (under 20 lines in the body) and save it as `.github/instructions/docs.instructions.md`. In the YAML frontmatter, include `name: 'Documentation Standards'`, a one-line `description`, and `applyTo: '**/*.md'` as a plain string - not an array. Conventions to enforce: use sentence-case for headings (e.g., 'Getting started' not 'Getting Started'), include a 'Prerequisites' section for any how-to or setup guide, use fenced code blocks with a language identifier (e.g., `javascript,` bash), always specify the shell for terminal commands (e.g., \`\`\`bash), maximum line length of 120 characters for readability, start with a brief one-line summary of what the document covers, use numbered lists for sequential steps and bullet lists for unordered items. Do not add template, changelog, or versioning sections."

1.  Review the generated file against this checklist:

| Field | What to look for | If missing |
| --- | --- | --- |
| `name` | Something like "Documentation Standards" | Add `name: 'Documentation Standards'` |
| `applyTo` | Must be `'**/*.md'` as a **plain string** (not an array) | Replace with `applyTo: '**/*.md'` |
| Body | Mentions sentence-case for headings | Add the rule |
| Body | Mentions Prerequisites section for guides | Add the rule |
| Body | Mentions fenced code blocks with language identifiers | Add the rule |
| Body | Mentions 120-character line length | Add the rule |
| Length | Under ~20 lines - no template, changelog, or versioning sections | Remove extra sections |

1.  Accept the file.

**Expected output reference:**

```
---
name: 'Documentation Standards'
description: 'Conventions for writing consistent Markdown documentation'
applyTo: '**/*.md'
---

# Documentation Standards

## Formatting
- Use sentence-case for headings (e.g., "Getting started" not "Getting Started")
- Maximum line length of 120 characters for readability
- Use fenced code blocks with a language identifier (e.g., ```javascript, ```bash)
- Always specify the shell for terminal commands (e.g., ```bash)

## Structure
- Include a "Prerequisites" section for any how-to or setup guide
- Start with a brief one-line summary of what the document covers
- Use numbered lists for sequential steps, bullet lists for unordered items
```

---

## Key Takeaways

| Concept | Key Learning |
| --- | --- |
| `**copilot-instructions.md**` | Always-on, project-wide instructions - the foundation for every chat request |
| `**.instructions.md**` **files** | Targeted instructions with `applyTo` patterns - right rules for the right files |
| `**/create-instruction**` | AI-generated instruction files from natural language or conversation context |
| `**/instructions**` | Quick verification of which instruction files are loaded and active |
| **Priority order** | Personal > Repository > Organization - user preferences always win |
| **Diagnostics** | Right-click Chat > Diagnostics to troubleshoot missing or broken instructions |
| **Foundation for agents** | Instructions define conventions; agents (next lab) define personas and tool access |

## What's Next

With your instruction files in place, proceed to the [Custom Agents lab](01-custom-agents-exercise.md) where you will:

*   Create agents that inherit these instructions automatically
*   Add tool restrictions to enforce read-only vs. read-write access
*   Build handoff workflows between specialized agents
*   Use subagent orchestration patterns for complex development tasks

## Reference

*   [VS Code Custom Instructions Documentation](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
*   [Create Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
*   [Agent Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
*   [Community Contributed Instructions](https://github.com/github/awesome-copilot)