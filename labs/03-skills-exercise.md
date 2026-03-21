# Lab: Agent Skills in VS Code - Build Reusable AI Capabilities

> \[!NOTE\]  
> This lab uses the **Agent Skills** feature in VS Code to create portable, reusable capabilities that GitHub Copilot loads on demand. You will build skills for the **Book Favorites** app (`copilot-agent-and-mcp/`).
> 
> **Prerequisite:** Complete the [Custom Agents lab](custom-agents-exercise.md) first. Part 2 of this lab adds a skill that works alongside the agents you created there.

## Overview

Agent Skills are folders of instructions, scripts, and resources that Copilot can load when relevant. Unlike custom instructions (which define coding guidelines), skills enable **specialized capabilities and workflows** - including scripts, examples, and templates. Skills follow an [open standard](https://agentskills.io/) that works across VS Code, Copilot CLI, and the Copilot coding agent.

### Agent Skills vs Custom Instructions vs Custom Agents

|   | Agent Skills | Custom Instructions | Custom Agents |
| --- | --- | --- | --- |
| **Purpose** | Teach specialized capabilities and workflows | Define coding standards and guidelines | Configure AI personas with tool restrictions |
| **Portability** | VS Code, Copilot CLI, Copilot coding agent | VS Code and GitHub.com only | VS Code only |
| **Content** | Instructions, scripts, examples, and resources | Instructions only | Instructions + tool/model config |
| **Scope** | Task-specific, loaded on-demand | Always applied (or via glob patterns) | Switched manually or via handoffs |
| **Standard** | Open standard (agentskills.io) | VS Code-specific | VS Code-specific |

### What You Will Learn

**Total Time: ~30 minutes**

| Part | Topic | Description | Time&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |
| --- | --- | --- | --- |
| Pre | [Prerequisites](#prerequisites) | VS Code, Copilot subscription, repo cloned, app running, Custom Agents lab completed | - |
| 1 | [Your First Skill: Data Seeder](#part-1---your-first-skill-data-seeder-15-min) | Create a skill with a utility script that generates realistic seed data for `backend/data/` JSON files | 15 min |
| 2 | [Generate a Skill with `/create-skill`](#part-2--generate-a-skill-with-create-skill-test-fixture-generator-15-min) | Use `/create-skill` to generate a test fixture skill that chains from Part 1's seeded data | 15 min |
| | | **Total** | **30&nbsp;min** |

### Prerequisites

| Requirement | Details |
| --- | --- |
| **VS Code** | Insiders or latest Stable with GitHub Copilot extension (Agent Mode enabled) |
| **GitHub Copilot** | Copilot Pro, Pro+, Business, or Enterprise subscription |
| **Workspace** | This repository cloned locally |
| **App running** | `npm install && npm start` in `copilot-agent-and-mcp/` - backend on :4000, frontend on :5173 |
| **Custom Agents lab** | Completed - you should have Planner, Implementer, Reviewer, and Feature Builder agents |

### How Copilot Uses Skills

Skills load content progressively to keep context efficient:

```
1. Discovery       →  Copilot reads name + description from YAML frontmatter
2. Instructions    →  Copilot loads the SKILL.md body when the skill matches your task
3. Resource access →  Copilot reads scripts, templates, or examples only when referenced
```

This means you can install many skills without bloating context - only what is relevant loads.

---

## Part 1 - Your First Skill: Data Seeder (15 min)

**Objective:** Create a skill that generates realistic seed data for the Book Favorites app's JSON data files. The skill includes a `SKILL.md`, a companion `scenarios.md` reference file, and a `seed-data.js` utility script - demonstrating the progressive disclosure pattern recommended by [skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). You will learn the `SKILL.md` format, directory structure, automatic discovery, and how a utility script saves tokens by executing rather than generating code.

> **How this chains from earlier labs:**
>
> | Layer | What you built | How this skill uses it |
> | --- | --- | --- |
> | **Instructions (Lab 00)** | `testing.instructions.md` - Jest in `backend/tests/`, Cypress in `frontend/cypress/e2e/`, supertest, `data-testid` | Fixture templates follow these exact conventions |
> | **Agents (Lab 01)** | TDD pipeline (Challenge 3) - Planner → Test Writer → Implementer → Reviewer | This skill gives the Test Writer agent structured fixture templates to work from |
> | **Hooks (Lab 02)** | Auto-format hook | Generated test files are auto-formatted by the PostToolUse hook |
> | **Part 1 (this lab)** | Data Seeder skill - generates `books.json` and `users.json` | This skill generates tests that validate the seeded data via API endpoints |

### Exercise 1.1 – Register the Skill Location and Create the Directory

> **Best practice: Progressive disclosure.** The `SKILL.md` body stays under 500 lines and acts as an overview. Detailed scenario definitions live in a separate `scenarios.md` file that Copilot reads only when needed. The `seed-data.js` script executes without loading its source into context, saving tokens. References are one level deep - never nested. See [best practices: progressive disclosure](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#progressive-disclosure-patterns).

3.  In the Chat view, click the **gear icon** (⚙) at the top.
4.  Select **Skills** from the menu.
5.  Select **Create new skill**.
6.  Choose `.github/skills` as the folder and enter `seeding-test-data` as the skill name.

This creates the skill directory with a starter `SKILL.md`. Your structure should look like:

```
.github/skills/
└── seeding-test-data/
    ├── SKILL.md
    ├── scenarios.md          ← you will create this
    └── scripts/
        └── seed-data.js      ← you will create this
```

8.  Replace the generated `SKILL.md` content with the following:


````
---
name: seeding-test-data
description: >
  Generates realistic seed data for the Book Favorites app JSON data files
  in backend/data/ (books.json, users.json). Supports configurable volume
  (small, medium, large) and scenarios (empty, typical, edge-cases, stress-test).
  Use when setting up test data, resetting the database, preparing demo
  environments, or when the user mentions seeding, test data, or sample data.
argument-hint: Specify volume and scenario (e.g., "medium typical" or "small edge-cases")
---

# Seeding Test Data

## Quick start

Run the utility script to generate seed data:

```bash
node .github/skills/seeding-test-data/scripts/seed-data.js --volume medium --scenario typical
```

This creates `backend/data/books.json` and `backend/data/users.json` with realistic sample records.

## Workflow

Copy this checklist and track progress:

```
Seed Data Progress:
- [ ] Step 1: Back up existing data files
- [ ] Step 2: Choose volume and scenario
- [ ] Step 3: Run seed script
- [ ] Step 4: Validate output
- [ ] Step 5: Verify app loads correctly
```

**Step 1: Back up existing data files**

Create backups before overwriting:

```bash
cp backend/data/books.json backend/data/books.backup.json
cp backend/data/users.json backend/data/users.backup.json
```

**Step 2: Choose volume and scenario**

| Volume | Books | Users | Use case |
| --- | --- | --- | --- |
| `small` | 5 | 3 | Unit tests, quick debugging |
| `medium` | 25 | 10 | Feature development, demos |
| `large` | 100 | 50 | Performance testing, pagination |

For scenario definitions (empty, typical, edge-cases, stress-test), see [scenarios.md](scenarios.md).

**Step 3: Run seed script**

```bash
node .github/skills/seeding-test-data/scripts/seed-data.js --volume <size> --scenario <name>
```

The script writes directly to `backend/data/books.json` and `backend/data/users.json` using `JSON.stringify(data, null, 2)` formatting.

**Step 4: Validate output**

After seeding, verify the data:

```bash
node -e "const b=require('./backend/data/books.json'); const u=require('./backend/data/users.json'); console.log('Books:', b.length, '| Users:', u.length); console.log('Sample book:', JSON.stringify(b[0], null, 2))"
```

If validation fails, check the error message, adjust the scenario, and re-run Step 3.

**Step 5: Verify app loads correctly**

Restart the backend server and check:

```bash
curl http://localhost:4000/api/books | node -e "process.stdin.on('data',d=>console.log('Response OK:', JSON.parse(d).length, 'books'))"
```

## Data Schemas

### books.json

Each book must include these fields:

```json
{
  "id": "unique-string",
  "title": "string",
  "author": "string",
  "isbn": "string (13 digits)",
  "year": "number (1900-2025)",
  "description": "string (1-2 sentences)"
}
```

### users.json

Each user must include these fields:

```json
{
  "id": "unique-string",
  "username": "string (lowercase, no spaces)",
  "email": "string (valid format)",
  "password": "string (bcrypt hash)",
  "favorites": ["array of book IDs"]
}
```

## Reference Files

- **Scenario definitions**: See [scenarios.md](scenarios.md) for detailed descriptions of each scenario, including edge-case field values and stress-test patterns
- **Utility script**: Run `scripts/seed-data.js` to generate data (do not read the script - execute it)
````

3.  Create the companion file `.github/skills/seeding-test-data/scenarios.md`:

````
# Seed Data Scenarios

## empty

Resets data files to empty arrays. Use for testing empty-state UI and error handling.

```json
// books.json
[]

// users.json
[]
```

## typical

Realistic data with a mix of genres, authors, and user activity. Books have varied years (1950-2024). Users have 0-5 favorites each. Use for feature development and demos.

## edge-cases

Tests boundary conditions and unusual input:

- **Books**: Titles with special characters (`O'Reilly`, `C++`, `"Quoted"`), very long titles (200+ chars), single-character titles, year at boundaries (1900, 2025), empty descriptions, ISBNs with leading zeros
- **Users**: Usernames at max length (30 chars), email with subdomains (`user@sub.domain.com`), users with 0 favorites, users with all books as favorites, duplicate-looking usernames (`john` vs `john1`)
- **Referential integrity**: Some `favorites` entries reference non-existent book IDs (tests error handling)

## stress-test

High-volume data for performance testing:

- 100+ books with randomized fields
- 50+ users with randomized favorites (up to 20 each)
- Tests pagination, search performance, and memory usage
- Includes duplicate authors and books with identical titles (different IDs)
````

4.  Create the utility script `.github/skills/seeding-test-data/scripts/seed-data.js`:

```javascript
#!/usr/bin/env node
// generated-by-copilot: seed data generator for Book Favorites app
// Usage: node seed-data.js --volume <small|medium|large> --scenario <empty|typical|edge-cases|stress-test>

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const args = process.argv.slice(2);
const volumeIdx = args.indexOf('--volume');
const scenarioIdx = args.indexOf('--scenario');
const volume = volumeIdx !== -1 ? args[volumeIdx + 1] : 'medium';
const scenario = scenarioIdx !== -1 ? args[scenarioIdx + 1] : 'typical';

const VOLUMES = { small: { books: 5, users: 3 }, medium: { books: 25, users: 10 }, large: { books: 100, users: 50 } };
const counts = VOLUMES[volume] || VOLUMES.medium;

// generated-by-copilot: sample data pools
const AUTHORS = ['Harper Lee', 'George Orwell', 'Jane Austen', 'F. Scott Fitzgerald', 'J.R.R. Tolkien', 'Agatha Christie', 'Mark Twain', 'Virginia Woolf', 'Ernest Hemingway', 'Toni Morrison'];
const TITLES = ['The Great Adventure', 'Silent Echoes', 'Midnight Garden', 'The Last Chapter', 'Burning Bridges', 'Ocean\'s Edge', 'Starlight Path', 'Forgotten Realms', 'The Iron Gate', 'Whispered Secrets'];
const EDGE_TITLES = ["O'Reilly's Guide to C++", '"Quoted Title"', 'A', 'x'.repeat(200), '日本語タイトル', '<script>alert(1)</script>'];

function generateId() { return crypto.randomBytes(8).toString('hex'); }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomItem(arr) { return arr[randomInt(0, arr.length - 1)]; }
function generateIsbn() { return String(randomInt(1000000000000, 9999999999999)); }

function generateBooks(count, useEdgeCases) {
  const books = [];
  const titlePool = useEdgeCases ? [...TITLES, ...EDGE_TITLES] : TITLES;
  for (let i = 0; i < count; i++) {
    books.push({
      id: generateId(),
      title: useEdgeCases && i < EDGE_TITLES.length ? EDGE_TITLES[i] : `${randomItem(titlePool)} ${i + 1}`,
      author: randomItem(AUTHORS),
      isbn: generateIsbn(),
      year: useEdgeCases ? (i === 0 ? 1900 : i === 1 ? 2025 : randomInt(1950, 2024)) : randomInt(1950, 2024),
      description: `A compelling story by a renowned author. Volume ${i + 1}.`,
    });
  }
  return books;
}

function generateUsers(count, bookIds, useEdgeCases) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const maxFavs = useEdgeCases ? bookIds.length : Math.min(5, bookIds.length);
    const numFavs = randomInt(0, maxFavs);
    const shuffled = [...bookIds].sort(() => Math.random() - 0.5);
    const favorites = shuffled.slice(0, numFavs);
    // generated-by-copilot: add a broken reference for edge-case testing
    if (useEdgeCases && i === 0) favorites.push('nonexistent-book-id');
    users.push({
      id: generateId(),
      username: useEdgeCases && i === 0 ? 'a'.repeat(30) : `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      password: '$2b$10$placeholder.hash.for.seed.data.only',
      favorites,
    });
  }
  return users;
}

// generated-by-copilot: resolve data directory relative to workspace root
// Try cwd first, then fall back to locating copilot-agent-and-mcp relative to script location
let dataDir = path.resolve(process.cwd(), 'backend/data');
if (!fs.existsSync(dataDir)) {
  // generated-by-copilot: script lives at <root>/.github/skills/seeding-test-data/scripts/seed-data.js
  const rootDir = path.resolve(__dirname, '..', '..', '..', '..');
  dataDir = path.resolve(rootDir, 'copilot-agent-and-mcp', 'backend', 'data');
}
if (!fs.existsSync(dataDir)) { console.error(`Error: ${dataDir} not found. Run from the workspace root or copilot-agent-and-mcp/ directory.`); process.exit(1); }

let books, users;
if (scenario === 'empty') {
  books = [];
  users = [];
} else {
  const useEdge = scenario === 'edge-cases';
  books = generateBooks(counts.books, useEdge);
  users = generateUsers(counts.users, books.map((b) => b.id), useEdge);
}

fs.writeFileSync(path.join(dataDir, 'books.json'), JSON.stringify(books, null, 2));
fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2));
console.log(`Seeded ${books.length} books and ${users.length} users (${volume}/${scenario}) into ${dataDir}`);
```

### Exercise 1.2 – Test Automatic Discovery

1.  Open the Chat view and switch to **Agent** mode (default Copilot).
2.  Ask a question that should trigger the skill:

> "I need to set up test data for the Book Favorites app. Generate a medium set of realistic books and users so I can test the reading list feature."

**Verify:**

*   Copilot discovers and loads the `seeding-test-data` skill automatically based on the description match ("test data", "seed", `backend/data/`)
*   Copilot follows the workflow steps from the skill: back up existing files, choose volume/scenario, run the seed script, validate output
*   The seed script runs directly (`node .github/skills/.../seed-data.js`) rather than Copilot generating equivalent code - this is the **utility script pattern** from best practices (more reliable, saves tokens)
*   Generated data matches the schemas defined in the skill (books have `id`, `title`, `author`, `isbn`, `year`, `description`)

> **Try with the Database Migrator agent:** Switch to the **Database Migrator** agent (Lab 01) and ask: "Seed the database with edge-case test data, then validate all books have the required fields." The skill loads alongside the agent's migration-focused instructions.

### Exercise 1.3 – Invoke as a Slash Command

You can also invoke skills explicitly using `/` slash commands:

1.  In the Chat input, type `/` and look for `seeding-test-data` in the list.
2.  Select it and add context:

```
/seeding-test-data small edge-cases
```

**Verify:**

*   The skill appears in the `/` menu with its description
*   The `argument-hint` text ("Specify volume and scenario...") appears in the input field when selected
*   Copilot follows the seeding workflow from the skill

### Exercise 1.4 – Understand Frontmatter Controls

Skills have two frontmatter properties that control visibility:

| Setting | `/` menu | Auto-loaded by model | Use case |
| --- | --- | --- | --- |
| Default (both omitted) | Yes | Yes | General-purpose skills |
| `user-invocable: false` | No | Yes | Background knowledge the model loads when relevant |
| `disable-model-invocation: true` | Yes | No | Skills you only want to run on demand |
| Both set | No | No | Effectively disabled |

Try modifying your skill's frontmatter to experiment:

1.  Add `user-invocable: false` to the SKILL.md frontmatter. Save and type `/` in Chat - the skill should no longer appear in the menu.
2.  Remove that line and add `disable-model-invocation: true` instead. Now the skill only loads when you explicitly type `/seeding-test-data`.
3.  **Revert both changes** so the skill is back to default behavior before moving to Part 2.

---

## Part 2 – Generate a Skill with /create-skill: Test Fixture Generator (15 min)

**Objective:** Use `/create-skill` to generate a test fixture skill that chains from the Data Seeder (Part 1) and follows the conventions from `testing.instructions.md` ([Lab 00, Exercise 2.3](00-custom-instructions-exercise.md#exercise-23---generate-testing-instructions)). Instead of manually writing all the files, you will let Copilot generate the `SKILL.md`, a test templates reference file, and a fixture generation script - all from a single detailed prompt.

### Exercise 2.1 – Generate the Test Fixture Generator Skill

1.  Open the Chat view (any agent mode) and type:

```
/create-skill
```

2.  Copilot will ask you to describe the skill. Enter this prompt:

> "Create a skill called generating-test-fixtures in `.github/skills/generating-test-fixtures/` for the Book Favorites app. Follow these requirements exactly:
>
> **SKILL.md** (under 200 lines in body):
> - name: `generating-test-fixtures` (gerund form, lowercase with hyphens)
> - description: Write in third person. Mention that it generates Jest backend test fixtures and Cypress E2E test scaffolds for the Book Favorites app. Include trigger terms: test fixtures, test scaffolding, generate tests, backend tests, E2E tests, supertest, cypress. Mention it works with the seeding-test-data skill and the testing.instructions.md conventions.
> - argument-hint: 'Describe what to test (e.g., "books API CRUD endpoints" or "login flow E2E")'
> - The body should include:
>   1. A Quick Start section showing a one-liner to invoke the skill
>   2. A Workflow section with a checklist (Step 1: Identify endpoints/flows to test, Step 2: Choose fixture type - backend Jest or frontend Cypress, Step 3: Generate fixtures using templates, Step 4: Run tests to verify, Step 5: Review coverage)
>   3. A Project Conventions section listing: backend Jest tests go in `backend/tests/` with `.test.js` extension using supertest for HTTP testing, run with `npm run test:backend`, structure as describe block per route and it block per scenario, always test both success and error cases (400, 401, 404). Frontend Cypress E2E tests go in `frontend/cypress/e2e/` with `.cy.js` extension, run with `npm run build:frontend && npm run test:frontend`, use `cy.get('[data-testid="..."]')` for element selection. Always start test descriptions with 'should'. Always start comments with 'generated-by-copilot: '.
>   4. References to `./templates.md` for detailed test templates and `./scripts/generate-fixtures.js` for automated fixture generation. Keep references one level deep.
>
> **templates.md** companion file:
> - A Jest/supertest template for GET, POST, PUT, DELETE endpoints with describe/it blocks, proper status code assertions, auth token handling, and error case tests (400 missing fields, 401 no token, 404 not found)
> - A Cypress E2E template for login flow, viewing books list, and adding to favorites with `cy.get('[data-testid="..."]')` selectors
> - Each template should have comments starting with 'generated-by-copilot: '
>
> **scripts/generate-fixtures.js** utility script:
> - Takes `--type` (backend or e2e) and `--resource` (e.g., books, favorites) as arguments
> - Reads existing data from `backend/data/{resource}.json` to generate realistic test assertions (uses actual IDs and titles from the seeded data)
> - Outputs a test file to the correct directory (`backend/tests/{resource}.test.js` or `frontend/cypress/e2e/{resource}.cy.js`)
> - Uses `JSON.stringify` for readable output
> - All comments start with 'generated-by-copilot: '
> - Handles errors explicitly (file not found, invalid JSON) with descriptive messages - do not punt error handling to the caller
>
> Do NOT add performance testing, snapshot testing, or CI/CD sections. Keep it focused on fixture generation."

3.  Review the generated output against this checklist:

| What to check | What to look for | If missing or wrong |
| --- | --- | --- |
| **Location** | Files in `.github/skills/generating-test-fixtures/` | Move the generated files to the correct path |
| **SKILL.md `name`** | `generating-test-fixtures` (must match directory name) | Fix to match |
| **SKILL.md `description`** | Third person, mentions Jest, Cypress, supertest, `testing.instructions.md` | Add specifics |
| **SKILL.md body** | References `./templates.md` and `./scripts/generate-fixtures.js` (one level deep) | Add relative path links |
| **SKILL.md body** | Under 200 lines, no performance/snapshot/CI sections | Remove extra sections |
| **SKILL.md body** | Workflow with a copyable checklist | Add if missing |
| **templates.md** | Jest template with describe/it, supertest, status codes, auth | Add missing templates |
| **templates.md** | Cypress template with `cy.get('[data-testid="..."]')` | Add if missing |
| **generate-fixtures.js** | Reads from `backend/data/`, generates test files, handles errors explicitly | Fix error handling |
| **Comments** | All code comments start with `"generated-by-copilot: "` | Add the prefix |

4.  Accept the generated files. Make any corrections identified during review.

### Exercise 2.2 – Test the Fixture Generator

1.  First, ensure you have seeded data from Part 1. If not, run:

```bash
node .github/skills/seeding-test-data/scripts/seed-data.js --volume small --scenario typical
```

2.  Open a new Chat and ask a question that should trigger the skill:

> "Generate Jest test fixtures for the books API endpoints in the Book Favorites app. Include tests for GET /api/books, GET /api/books/:id, and error cases."

**Verify:**

*   The `generating-test-fixtures` skill loads automatically
*   Copilot follows the workflow from the skill (identify endpoints, choose type, generate, run, review)
*   Generated tests follow `testing.instructions.md` conventions - supertest, describe/it blocks, "should" descriptions
*   Tests reference actual data from the seeded `books.json` (realistic IDs and titles, not placeholder values)
*   Comments start with `"generated-by-copilot: "`

3.  Run the generated tests to verify they work:

```bash
npm run test:backend
```

### Exercise 2.3 – Test with the Seeded Data Chain

This exercise demonstrates the **Part 1 → Part 2 chain**: seed data, then generate tests against it.

1.  Seed fresh edge-case data:

```bash
node .github/skills/seeding-test-data/scripts/seed-data.js --volume small --scenario edge-cases
```

2.  Generate test fixtures that validate the edge cases:

```
/generating-test-fixtures Generate backend tests that verify edge-case book data: special characters in titles, boundary years (1900, 2025), and very long title strings.
```

**Verify:**

*   The generate-fixtures script uses actual edge-case data from `books.json` (special characters, boundary values)
*   Tests assert specific edge-case values, not generic placeholders
*   Both skills work together: Part 1 creates the data, Part 2 creates tests that validate it

3.  Try generating Cypress E2E fixtures:

```
/generating-test-fixtures Generate Cypress E2E tests for the login flow and viewing the books list.
```

**Verify:**

*   E2E test file is created in `frontend/cypress/e2e/`
*   Uses `cy.get('[data-testid="..."]')` selectors (not CSS classes)
*   Tests follow the Cypress conventions from `testing.instructions.md`

> **Tip:** You can also extract a skill from a conversation. After a multi-turn debugging session, ask: "Create a skill from how we just debugged that" - Copilot captures the procedure as a reusable skill.

---

## Summary

| What You Built | Type | Location |
| --- | --- | --- |
| Data Seeder | Skill (manual) | `.github/skills/seeding-test-data/` |
| Test Fixture Generator | Skill (AI-generated via `/create-skill`) | `.github/skills/generating-test-fixtures/` |

### Key Takeaways

*   **Skills are folders** with a `SKILL.md` and optional resources (scripts, templates, examples)
*   **Automatic discovery**: Copilot matches skills by `description` - write specific, third-person descriptions with trigger terms
*   **Slash commands**: Every skill is also a `/` command for explicit invocation
*   **Progressive loading**: Only the relevant skill body and resources load into context - keep SKILL.md under 500 lines
*   **Utility scripts**: Pre-made scripts are more reliable and token-efficient than generating code each time
*   **Custom locations**: Use `chat.agentSkillsLocations` to organize skills alongside agents or share across projects
*   **AI generation**: Use `/create-skill` to bootstrap skills from a detailed natural language prompt
*   **Skill chaining**: Skills can build on each other - Part 1 seeds data, Part 2 generates tests against it
*   **Complement agents**: Skills provide reusable knowledge; agents provide personas and tool restrictions - use both together
*   **Portability**: Skills work across VS Code, Copilot CLI, and the Copilot coding agent

### Next Steps

*   Browse community skills at [github/awesome-copilot](https://github.com/github/awesome-copilot) and [anthropics/skills](https://github.com/anthropics/skills)
*   Try setting `user-invocable: false` to create background-knowledge skills that load automatically
*   Review [skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) for advanced patterns
*   Visit [agentskills.io](https://agentskills.io/) for the full Agent Skills specification
