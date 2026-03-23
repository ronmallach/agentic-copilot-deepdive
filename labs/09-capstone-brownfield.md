# Lab 08 - Capstone: Production Feature Sprint

> **Mode:** VS Code (Agent Mode)
> **Duration:** 60 minutes
> **Prerequisites:** Labs 00–06 completed (instructions, agents, hooks, skills, MCP server built and running)

---

## The Mission

You are a developer at a startup that runs the **Book Favorites** app. Your product manager just dropped a high-priority feature request:

> _"Users are asking for **Book Quotes** - they want to save memorable quotes from books, share them with other users, and see the most-quoted books. This needs to ship today. Full stack: API, frontend, tests, and it has to pass security review."_

You will deliver this feature in a **60-minute production sprint** using every tool you have learned across Labs 00–06 - custom instructions, agents with handoffs, lifecycle hooks, reusable skills, and MCP-powered data. No copy-pasting boilerplate. No manual busywork. Just you orchestrating an AI-powered development pipeline.

### Why This Matters

In production teams, features don't ship by asking one question in a chat window. They ship through **coordinated workflows**: planning, architecture validation, implementation in dependency order, security review, testing, and quality gates - all while following team conventions. This lab simulates that reality.

By the end, you will have:

- A new MCP tool providing quote data to any AI workflow
- A custom instruction file governing quote-related code
- A reusable skill for scaffolding full-stack features
- A complete backend API with authentication and input validation
- A React frontend component with Redux state management
- Jest tests and security review - all orchestrated through agents

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        YOUR SPRINT PIPELINE                             │
│                                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌─────────────────┐   │
│  │ MCP Data │──>│ Planning │──>│Implementation│──>│ Security Review │   │
│  │ (quotes) │   │ (Agent)  │   │   (Agent)    │   │    (Agent)      │   │
│  └──────────┘   └──────────┘   └──────────────┘   └─────────────────┘   │
│       │              │               │                     │            │
│    Lab 05-06      Lab 01          Lab 01+02             Lab 01+02       │
│                   Lab 00          Lab 00+03             Lab 00          │
│                                                                         │
│  Instructions ──────────────────────── enforce conventions everywhere   │
│  Hooks ─────────────────────────────── auto-format + security gates     │
│  Skills ────────────────────────────── reusable scaffolding workflow    │
│  MCP Server ────────────────────────── live data, no hallucinations     │
└─────────────────────────────────────────────────────────────────────────┘
```

### What You Will Build

| Part | Focus                                                                                           | Concepts Exercised                                                  | Time       |
| ---- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------- |
| 1    | [Extend the MCP Server with Quote Data](#part-1---extend-the-mcp-server-with-quote-data-10-min) | MCP tool implementation, Zod schemas, MCP Inspector (Labs 05–06)    | 10 min     |
| 2    | [Set Up Guardrails](#part-2---set-up-guardrails-10-min)                                         | Custom instructions, global hooks, agent-scoped hooks (Labs 00, 02) | 10 min     |
| 3    | [Create a Full-Stack Scaffolding Skill](#part-3---create-a-full-stack-scaffolding-skill-10-min) | Agent skills, `/create-skill`, SKILL.md with scripts (Lab 03)       | 10 min     |
| 4    | [Agent-Orchestrated Feature Sprint](#part-4---agent-orchestrated-feature-sprint-25-min)         | Planner, Implementer, Reviewer agents, handoffs, subagents (Lab 01) | 25 min     |
| 5    | [Validate the Full Pipeline](#part-5---validate-the-full-pipeline-5-min)                        | End-to-end verification, reflection on the integrated workflow      | 5 min      |
|      |                                                                                                 | **Total**                                                           | **60 min** |

---

## Part 1 - Extend the MCP Server with Quote Data (10 min)

> **Concepts:** MCP tool implementation, Zod validation, annotations, MCP Inspector (Labs 05–06)

The MCP server you built in Lab 05 serves book metadata. Now you will add a **quotes tool** so Copilot can pull real quote data when generating the feature - no hallucinated placeholder text.

### Exercise 1.1 - Create the Quotes Data File

Create a quotes dataset in your MCP server. In Agent Mode, prompt:

> "Create a file `book-database-mcp-server/src/data/quotes.json` containing 15–20 memorable book quotes. Each quote should have: `id` (string, sequential), `isbn` (string, 10 chars, matching ISBNs from books.json), `text` (the actual quote), `page` (number), and `character` (who said it, or 'Narrator'). Include quotes from at least 5 different books that exist in books.json. Use real, well-known quotes - do not fabricate them."

**Verify:** Open the file and confirm quotes reference real ISBNs from `books.json`.

### Exercise 1.2 - Implement the Quotes Tool

Prompt Copilot to add the tool:

> "Using the MCP Builder skill, add two new tools to the book-database MCP server:
>
> 1. `get_quotes_by_isbn` - accepts an ISBN string, returns all quotes from that book with the book title and author. Use Zod `.strict()` schema, `server.registerTool()`, annotations (readOnly, non-destructive, idempotent), and formatted markdown response.
> 2. `get_random_quote` - returns a single random quote with its book context. No parameters required.
>
> Load quotes from `./data/quotes.json`. Follow the exact patterns of the existing tools. Build and fix any compilation errors."

### Exercise 1.3 - Build, Copy Data, and Test

```bash
cd book-database-mcp-server
npm run build
```

Copy the new data file to `dist/`:

**Windows PowerShell:**

```powershell
Copy-Item -Path src/data/quotes.json -Destination dist/data/quotes.json -Force
```

**Linux/macOS:**

```bash
cp src/data/quotes.json dist/data/quotes.json
```

Launch MCP Inspector and test both tools:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

| Test | Tool                 | Input                  | Expected                                        |
| ---- | -------------------- | ---------------------- | ----------------------------------------------- |
| 1    | `get_quotes_by_isbn` | An ISBN from your data | Quotes from that book with title/author context |
| 2    | `get_quotes_by_isbn` | `0000000000`           | Clear not-found error message                   |
| 3    | `get_random_quote`   | (none)                 | A random quote with book context                |

### Exercise 1.4 - Restart the MCP Server in VS Code

1. `Ctrl+Shift+P` → **MCP: Stop MCP server** → **book-database**
2. `Ctrl+Shift+P` → **MCP: Start MCP server** → **book-database**
3. Verify in Agent Mode:

> "Use the book-database MCP server to get a random quote."

**Expected:** Copilot calls `get_random_quote` and returns a real quote with book context.

### Checkpoint

You now have an MCP server that serves both book metadata AND quote data - a live, hallucination-free data source for the rest of the sprint.

---

## Part 2 - Set Up Guardrails (10 min)

> **Concepts:** Custom instructions with `applyTo` patterns, PreToolUse security hooks, PostToolUse formatting hooks (Labs 00, 02)

Before writing any feature code, you will establish the guardrails that enforce quality and security automatically throughout the sprint.

### Exercise 2.1 - Create a Quotes Feature Instruction File

This instruction file will automatically activate when Copilot works on any quotes-related file.

1. Create `.github/instructions/quotes.instructions.md`:

```markdown
---
name: 'Book Quotes Feature Standards'
description: 'Conventions specific to the book quotes feature across backend and frontend'
applyTo: '**/*quote*.*'
---

# Book Quotes Feature Standards

## API Design

- Quotes API lives at `/api/quotes` (plural noun, kebab-case)
- All quote mutations (POST, PUT, DELETE) require authentication via `authenticateToken`
- GET endpoints for listing quotes are public (no auth required)
- Quote text must be validated: minimum 10 characters, maximum 500 characters
- Page numbers must be positive integers
- Always return quotes with their parent book context (title, author)

## Data Model

- Quote fields: `id`, `bookId`, `userId`, `text`, `page`, `character`, `createdAt`
- Use `bookId` to reference the book (matches book `id` field in books.json)
- Use `userId` from the authenticated JWT token - never accept userId from the request body (mass assignment prevention)

## Frontend

- Quote components use CSS Modules with kebab-case class names
- Display quotes in blockquote elements with attribution
- Use `useAppSelector` and `useAppDispatch` from `../store/hooks` (never raw Redux hooks)

## Security

- Sanitize quote text before storage - strip HTML tags to prevent stored XSS
- Users can only edit/delete their own quotes (enforce in backend, not just frontend)
- Rate limit quote creation to prevent spam
```

2. Type `/instructions` in Chat to verify the file appears.

### Exercise 2.2 - Verify Hooks Are Active

If you completed Lab 02, you should have two global hooks already:

| Hook                        | File                          | Purpose                                              |
| --------------------------- | ----------------------------- | ---------------------------------------------------- |
| Auto-format (PostToolUse)   | `.github/hooks/format.json`   | Runs Prettier after every file edit                  |
| Security guard (PreToolUse) | `.github/hooks/security.json` | Blocks `rm -rf /`, `npm publish`, `git push --force` |

**If you don't have them**, create them now by following Lab 02, Exercises 1.2 and 1.4. These hooks will fire automatically during the implementation phase and protect against mistakes.

Verify they are registered:

1. Click the **gear icon** (⚙) in the Chat view → **Hooks**
2. Confirm **Post-Tool Use** shows at least 1 hook (format)
3. Confirm **Pre-Tool Use** shows at least 1 hook (security)

> **Why this matters for the sprint:** When the Implementer agent creates and edits files in Part 4, the format hook auto-formats every change to match `.prettierrc`. If anyone (or any agent) accidentally tries a destructive command, the security guard blocks it. These are the same production guardrails you would have in a real CI/CD pipeline - but they run locally and instantly.

### Exercise 2.3 - Create a Data Protection Hook for the Sprint

Create an agent-scoped hook that prevents the **Implementer** agent from accidentally corrupting production data files during the sprint.

1. Create `.github/hooks/scripts/quotes-data-guard.js`:

```javascript
// generated-by-copilot: Prevents Implementer from modifying raw data files during sprints
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin });
let inputData = '';

rl.on('line', (line) => {
  inputData += line;
});

rl.on('close', () => {
  try {
    const input = JSON.parse(inputData);
    const toolInput =
      typeof input.tool_input === 'string'
        ? JSON.parse(input.tool_input)
        : input.tool_input || {};

    const filePath = (toolInput.filePath || '').replace(/\\/g, '/');

    // generated-by-copilot: block direct edits to JSON data files
    if (/backend\/data\/.*\.json$/i.test(filePath) && !/test-/.test(filePath)) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason:
              `BLOCKED: Cannot directly edit production data file "${filePath}". ` +
              'Create a new data file (e.g., quotes.json) through the proper route logic, ' +
              'or use the Database Migrator agent for schema changes.',
          },
        })
      );
      process.exit(0);
    }

    process.stdout.write(JSON.stringify({ continue: true }));
    process.exit(0);
  } catch (err) {
    process.stderr.write(`Data guard error: ${err.message}\n`);
    process.exit(1);
  }
});
```

2. Open `.github/agents/Implementer.agent.md` and add the hook to its frontmatter (if not already present):

```yaml
hooks:
  PreToolUse:
    - type: command
      command: 'node .github/hooks/scripts/quotes-data-guard.js'
      timeout: 5
```

> **Ensure** `chat.useCustomAgentHooks` is `true` in VS Code settings (Lab 02, Exercise 2.1).

### Checkpoint

You now have three layers of protection:

- **Instructions** tell agents _what conventions to follow_ for quotes code
- **Global hooks** auto-format code and block destructive commands for _all_ agents
- **Agent-scoped hooks** prevent the Implementer from corrupting production data

---

## Part 3 - Create a Full-Stack Scaffolding Skill (10 min)

> **Concepts:** `/create-skill`, SKILL.md with templates, reusable workflows (Lab 03)

Instead of manually prompting Copilot for each file, you will create a **reusable skill** that knows how to scaffold a complete full-stack feature for this project. This skill can be reused for any future feature - not just quotes.

### Exercise 3.1 - Generate the Skill

In the Chat view:

```
/create-skill
```

When prompted, enter:

> "Create a skill called `scaffolding-fullstack-feature` in `.github/skills/scaffolding-fullstack-feature/`. This skill teaches Copilot how to scaffold a complete full-stack feature for the Book Favorites app. Requirements:
>
> **SKILL.md** (under 150 lines):
>
> - name: `scaffolding-fullstack-feature`
> - description: Third person. Scaffolds a complete full-stack feature for the Book Favorites Express+React app. Trigger terms: scaffold feature, new feature, full-stack feature, add feature, create resource. Mention it creates backend route, data file, Redux slice, React component, CSS module, and Jest tests.
> - argument-hint: 'Describe the feature (e.g., "book quotes where users save and share memorable quotes")'
>
> The body should include a **Scaffolding Checklist** with these exact steps:
>
> 1. **Backend data**: Create `backend/data/{resource}.json` and `backend/data/test-{resource}.json`
> 2. **Backend route**: Create `backend/routes/{resource}.js` using the factory function pattern with `deps` object
> 3. **Wire route**: Register in `backend/routes/index.js` and wire deps in `backend/server.js`
> 4. **Redux slice**: Create `frontend/src/store/{resource}Slice.js` with async thunks
> 5. **React component**: Create `frontend/src/components/{Resource}.jsx` using `useAppSelector`/`useAppDispatch`
> 6. **CSS Module**: Create `frontend/src/styles/{Resource}.module.css` with kebab-case classes
> 7. **Route**: Add route in `frontend/src/App.jsx`
> 8. **Tests**: Create `backend/tests/{resource}.test.js` with supertest
>
> Include a **templates.md** companion file with skeleton code for each file type (route factory, Redux slice, React component). All comments start with 'generated-by-copilot: '. Do not add CI/CD, deployment, or Docker sections."

### Exercise 3.2 - Review and Accept

Check the generated skill against this table:

| Check               | What to look for                                              |
| ------------------- | ------------------------------------------------------------- |
| Location            | `.github/skills/scaffolding-fullstack-feature/SKILL.md`       |
| Name matches folder | `scaffolding-fullstack-feature`                               |
| Description         | Third person, mentions Express+React, trigger terms present   |
| Checklist           | All 8 steps from the prompt                                   |
| templates.md        | Skeleton code for route factory, Redux slice, React component |
| Length              | SKILL.md under 150 lines                                      |

Accept the files. Type `/` in Chat and confirm `scaffolding-fullstack-feature` appears in the skill menu.

### Exercise 3.3 - Quick Smoke Test

Verify the skill activates on relevant prompts:

> "I want to scaffold a new full-stack feature for the Book Favorites app."

**Expected:** Copilot loads the `scaffolding-fullstack-feature` skill (check References) and responds with the checklist-based workflow rather than ad-hoc file generation.

> **Do not implement yet** - the agents will do that in Part 4.

### Checkpoint

You now have a reusable skill that any agent can load when scaffolding features. The Planner will reference it for structure, and the Implementer will follow its templates.

---

## Part 4 - Agent-Orchestrated Feature Sprint (25 min)

> **Concepts:** Planner/Implementer/Reviewer handoff chain, subagent coordination, MCP data integration, hook enforcement (Labs 01, 02, 05–06)

This is the main event. You will drive the **Planner → Implementer → Reviewer** pipeline to deliver the Book Quotes feature end-to-end, with MCP providing real data, instructions enforcing conventions, hooks formatting code and blocking unsafe operations, and the skill guiding the scaffolding workflow.

### Exercise 4.1 - Plan the Feature (Planner Agent)

1. Select the **Planner** agent from the Agents dropdown.
2. Submit this prompt:

> "Plan a Book Quotes feature for the Book Favorites app. Use the book-database MCP server to fetch 5 sample quotes with `get_quotes_by_isbn` (try ISBNs from books.json) so you understand the data shape. Then use the `scaffolding-fullstack-feature` skill checklist to structure the plan.
>
> Requirements:
>
> - Authenticated users can save quotes from books (POST), view all quotes for a book (GET), and delete their own quotes (DELETE)
> - Public endpoint to see the most-quoted books (GET /api/quotes/top-books)
> - Frontend: a Quotes component showing quotes in styled blockquotes with book attribution
> - Follow the quote conventions from the instructions (validate text length, prevent mass assignment of userId, sanitize input)
>
> Produce a full plan with implementation steps, risks, and testing strategy."

**Verify:**

- The Planner calls MCP tools to fetch real quote data (check tool calls in chat)
- The plan references the skill's 8-step checklist
- The plan mentions security rules from `quotes.instructions.md` (text validation, userId from token)
- The plan includes numbered steps, risks, and test strategy
- **No files were created or edited** (Planner is read-only)

### Exercise 4.2 - Implement the Feature (Implementer Agent)

1. Click the **"Start Implementation"** handoff button at the bottom of the Planner's response.
2. This switches to the **Implementer** agent with the plan as context.
3. If the handoff prompt needs adjustment, modify it to include:

> "Follow the plan above step by step. Use the scaffolding-fullstack-feature skill templates as starting points for each file. Pull sample data from the book-database MCP server (use `get_quotes_by_isbn`) to populate the initial test-quotes.json fixture with realistic data. Run `npm run test:backend` after backend changes."

**Watch for these integration points as the Implementer works:**

| What happens                                                         | Which system is working                        |
| -------------------------------------------------------------------- | ---------------------------------------------- |
| Agent creates `backend/routes/quotes.js` → file is auto-formatted    | **PostToolUse hook** (Lab 02) fires Prettier   |
| Agent follows factory function pattern with `deps`                   | **express.instructions.md** (Lab 00) is active |
| Agent uses `useAppDispatch` not raw `useDispatch` in React component | **react.instructions.md** (Lab 00) is active   |
| Agent sanitizes quote text, validates length                         | **quotes.instructions.md** (Part 2) is active  |
| Agent pulls real quote data for test fixtures                        | **MCP server** (Part 1) provides data          |
| Agent follows the 8-step scaffolding checklist                       | **Skill** (Part 3) guides the workflow         |
| Agent is blocked from editing `books.json` directly                  | **Agent-scoped hook** (Part 2) protects data   |

> **Tip:** If the Implementer gets stuck or produces an error, guide it. E.g.: "The route file should use the factory pattern from `express.instructions.md`. Check `backend/routes/books.js` for reference."

### Exercise 4.3 - Run Tests

After the Implementer finishes, make sure tests pass:

```bash
npm run test:backend
```

If tests fail, ask the Implementer to fix them:

> "These tests are failing: [paste error output]. Fix the issues and re-run `npm run test:backend`."

### Exercise 4.4 - Security Review (Reviewer Agent)

1. Click the **"Request Code Review"** handoff button.
2. This switches to the **Reviewer** agent. If needed, adjust the prompt:

> "Review all the code changes for the Book Quotes feature. Focus on:
>
> 1. Security: input validation, XSS prevention, mass assignment of userId, proper auth on mutation endpoints
> 2. Conventions: factory function pattern, CSS Modules with kebab-case, Redux hooks from store/hooks
> 3. Test coverage: are success and error cases (400, 401, 404) covered?
> 4. Data integrity: does quote creation properly validate text length (10–500 chars)?
>
> Produce a review report with severity ratings."

**Verify the Reviewer:**

- Produces a structured report (Summary, Findings table, Positives, Next Steps)
- Checks for OWASP concerns (XSS via quote text, mass assignment, auth bypass)
- References the conventions from your instruction files
- Gives an APPROVE or REQUEST CHANGES verdict

### Exercise 4.5 - Fix Review Findings (If Needed)

If the Reviewer found issues:

1. Click **"Fix Review Findings"** to handoff back to the Implementer.
2. Let the Implementer address Critical and High severity findings.
3. Re-run tests: `npm run test:backend`
4. Handoff back to the Reviewer for a re-review if needed.

**This is the real-world loop:** Plan → Implement → Review → Fix → Re-review → Ship.

### Exercise 4.6 - (Bonus) Multi-Perspective Review with FB Reviewer

If you built the **FB Reviewer** agent in Lab 01 Part 4B, try it for a deeper review:

1. Select **FB Reviewer** from the Agents dropdown.
2. Ask:

> "Review the Book Quotes feature implementation. Run all four review perspectives in parallel: correctness, code quality, security, and architecture."

**Compare** the multi-perspective report against the single-pass Reviewer report from Exercise 4.4. Did the parallel subagents catch issues the single reviewer missed?

### Checkpoint

The Book Quotes feature is implemented, tested, and reviewed - all orchestrated through the agent pipeline with instructions, hooks, skills, and MCP data working together.

---

## Part 5 - Validate the Full Pipeline (5 min)

> **Concepts:** End-to-end verification, integrated workflow reflection

### Exercise 5.1 - Functional Verification

1. **Start the app** (if not running):

```bash
npm start
```

2. **Test the API endpoints** with curl or in Agent Mode:

```bash
# generated-by-copilot: Test public quotes listing
curl http://localhost:4000/api/quotes

# generated-by-copilot: Login to get a token
curl -X POST http://localhost:4000/api/login -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}'

# generated-by-copilot: Create a quote (replace TOKEN with actual JWT)
curl -X POST http://localhost:4000/api/quotes -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d '{"bookId":"1","text":"It was the best of times, it was the worst of times.","page":1,"character":"Narrator"}'
```

3. **Run all tests:**

```bash
npm run test:backend
```

### Exercise 5.2 - Verify Every Layer Contributed

Walk through this checklist to confirm each system played its role:

| Layer                           | Evidence                                                                     | Where to check                                   |
| ------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| **MCP Server** (Labs 05–06)     | Real quote data used in test fixtures - no hallucinated text                 | `backend/data/test-quotes.json` or test fixtures |
| **Instructions** (Lab 00)       | Factory function pattern, CSS Modules, Redux hooks from `store/hooks`        | Generated route, component, and slice files      |
| **Quotes instruction** (Part 2) | Text validation (10–500 chars), userId from token, sanitized input           | `backend/routes/quotes.js`                       |
| **Global hooks** (Lab 02)       | All created/edited files formatted with Prettier (single quotes, semicolons) | Open any generated file                          |
| **Agent-scoped hook** (Part 2)  | Implementer blocked from editing `books.json` (if it tried)                  | Output panel → GitHub Copilot Chat Hooks         |
| **Skill** (Lab 03)              | 8-step scaffolding checklist followed in order                               | Planner's output references the skill            |
| **Planner** (Lab 01)            | Read-only plan produced - no files edited                                    | Chat history                                     |
| **Implementer** (Lab 01)        | Files created and edited, tests run                                          | Chat history + file changes                      |
| **Reviewer** (Lab 01)           | Structured security review produced                                          | Chat history                                     |
| **Handoffs** (Lab 01)           | One-click transitions between agents                                         | Handoff buttons in chat                          |

### Exercise 5.3 - Reflect on the Workflow

Consider these questions:

1. **Speed:** How long would this feature have taken without the agent pipeline? You had a plan, implementation, and security review in under 30 minutes of active work.

2. **Consistency:** Every file followed the same conventions - not because you remembered them, but because instructions enforced them automatically.

3. **Security:** The Reviewer caught security issues (or confirmed their absence) using a structured checklist - not gut feeling.

4. **Reusability:** The scaffolding skill you created works for any future feature. The next time someone asks for "user collections" or "book notes," the same pipeline applies.

5. **Data integrity:** MCP eliminated hallucinated quotes. Test fixtures contain real data. The agent-scoped hook prevented accidental data corruption.

---

## Bonus Challenges

### Challenge 1 - Feature Builder Orchestration (10 min)

Instead of manually clicking handoff buttons, use the **Feature Builder** coordinator agent (Lab 01, Part 4A) to run the entire sprint automatically:

> Select **Feature Builder** and prompt: "Add a 'Quote of the Day' feature that displays a random quote on the BookFaves homepage. Use the book-database MCP server's `get_random_quote` tool to pull real data. Run the full coordinator workflow: plan it, validate architecture, implement it, and run QA."

**Observe:** The coordinator automatically delegates to FB Planner → FB Architect → FB Implementer → FB QA with no manual handoff clicks. Compare this experience to the manual handoff chain in Part 4.

### Challenge 2 - TDD with the Rewired Pipeline (10 min)

If you completed Lab 01, Challenge 3 (TDD pipeline), use it here:

1. Select **Planner** and plan a "Quote search" endpoint (GET `/api/quotes/search?q=...`)
2. Click **"Write Failing Tests"** → Test Writer creates tests that fail
3. Click **"Make Tests Pass"** → Implementer writes code until tests pass
4. Click **"Request Code Review"** → Reviewer validates

This demonstrates TDD in an agent-orchestrated workflow - tests define the contract before code exists.

### Challenge 3 - Plugin Packaging (5 min)

If you completed Lab 04 (Plugins), package everything from this sprint into a plugin:

- The quotes instruction file
- The scaffolding skill
- The data guard hook script
- The MCP server configuration

This creates a distributable bundle that any team member can install to get the same guardrails, skills, and data sources - turning your sprint setup into a team standard.

---

## Architecture Summary

Here is everything you built and used in this sprint, showing how each lab's concepts connect:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAPSTONE: BOOK QUOTES FEATURE                       │
│                                                                             │
│  DATA LAYER (Labs 05-06)                                                    │
│  ┌─────────────────────────────────┐                                        │
│  │ book-database MCP Server        │                                        │
│  │  ├─ get_quotes_by_isbn (NEW)    │──── real data ──── no hallucinations   │
│  │  ├─ get_random_quote (NEW)      │                                        │
│  │  └─ existing book tools         │                                        │
│  └─────────────────────────────────┘                                        │
│                                                                             │
│  GUARDRAILS LAYER (Labs 00, 02)                                             │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────┐      │
│  │ Custom Instructions             │  │ Hooks                        │      │
│  │  ├─ copilot-instructions.md     │  │  ├─ format.json (PostToolUse)│      │
│  │  ├─ express.instructions.md     │  │  ├─ security.json (PreTool)  │      │
│  │  ├─ react.instructions.md       │  │  └─ data-guard (agent-scoped)│      │
│  │  ├─ quotes.instructions.md (NEW)│  └──────────────────────────────┘      │
│  │  └─ testing.instructions.md     │                                        │
│  └─────────────────────────────────┘                                        │
│                                                                             │
│  CAPABILITY LAYER (Lab 03)                                                  │
│  ┌────────────────────────────────────────┐                                 │
│  │ Skills                                  │                                │
│  │  └─ scaffolding-fullstack-feature (NEW) │                                │
│  │     ├─ SKILL.md (8-step checklist)      │                                │
│  │     └─ templates.md (skeleton code)     │                                │
│  └────────────────────────────────────────┘                                 │
│                                                                             │
│  ORCHESTRATION LAYER (Lab 01)                                               │
│  ┌──────────┐  handoff  ┌──────────────┐  handoff  ┌──────────┐            │
│  │ Planner  │ ────────> │ Implementer  │ ────────> │ Reviewer │            │
│  │ (read)   │           │ (read+write) │ <──────── │ (read)   │            │
│  └──────────┘           └──────────────┘  fix loop └──────────┘            │
│                                                                             │
│  RESULT                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ backend/routes/quotes.js          (factory pattern, auth, valid) │       │
│  │ backend/data/quotes.json          (initial data)                 │       │
│  │ backend/tests/quotes.test.js      (supertest, error cases)       │       │
│  │ frontend/src/store/quotesSlice.js (async thunks)                 │       │
│  │ frontend/src/components/Quotes.jsx(useAppSelector, CSS Modules)  │       │
│  │ frontend/src/styles/Quotes.module.css (kebab-case)               │       │
│  └──────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

| Concept                         | What This Sprint Proved                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **MCP as data source**          | Real data from MCP eliminated hallucinations in test fixtures and initial datasets                                   |
| **Instructions as conventions** | Five instruction files ensured consistent patterns across every generated file - without reminding Copilot each time |
| **Hooks as enforcement**        | Auto-formatting and security guards ran deterministically - no relying on AI "remembering" to format or validate     |
| **Skills as workflows**         | The scaffolding skill turned an ad-hoc process into a repeatable 8-step checklist any agent can follow               |
| **Agents as specialists**       | Each agent did one job well: Planner analyzed, Implementer coded, Reviewer caught issues                             |
| **Handoffs as workflow**        | One-click transitions carried context between agents - no re-explaining the feature in each chat                     |
| **Layered architecture**        | Instructions + Hooks + Skills + Agents + MCP = a production-grade AI development pipeline                            |

## What You Have Built Across All Labs

```
Lab 00  Custom Instructions ──── conventions that guide every response
Lab 01  Custom Agents ────────── specialized personas with tool restrictions
Lab 02  Agent Hooks ──────────── deterministic automation (format, security)
Lab 03  Agent Skills ─────────── reusable capabilities loaded on demand
Lab 04  Plugins ──────────────── distributable bundles for teams
Lab 05  MCP Builder ──────────── custom data servers for AI workflows
Lab 06  MCP Data ─────────────── real data integration, no hallucinations
Lab 07  Coding Agent ─────────── autonomous PR workflows on GitHub
Lab 08  Capstone (this lab) ──── everything working together in a production sprint
```

You didn't just learn features in isolation - you assembled them into a **production-ready AI development pipeline**. Every future feature you build can follow this pattern: guardrails first, data connected, agents orchestrated, quality enforced.

---

## Reference

- [Custom Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
- [Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [Agent Hooks](https://code.visualstudio.com/docs/copilot/customization/hooks)
- [Agent Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [MCP Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
- [Subagents](https://code.visualstudio.com/docs/copilot/agents/subagents)
- [awesome-copilot Community Skills](https://github.com/github/awesome-copilot)
