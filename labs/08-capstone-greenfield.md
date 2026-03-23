# Lab 09 - Greenfield Capstone: Build a Feature Flag Service from Scratch

> **Mode:** VS Code (Agent Mode)
> **Duration:** 60 minutes
> **Prerequisites:** Familiarity with concepts from Labs 00–07 (instructions, agents, hooks, skills, MCP). No existing code required - you build everything from zero.

---

## The Scenario

Your engineering director walks into standup:

> _"We keep deploying broken features straight to production. We need a **feature flag service** - an internal tool that lets any team toggle features on or off per environment without redeploying. It needs an API, a simple admin UI, flags scoped by environment, an audit trail of who changed what, and it has to be reviewed for security before we go live. You have one hour."_

Feature flags are production-critical infrastructure used by every major tech company - Netflix, GitHub, Stripe, and Google all run feature flag systems. A misconfigured flag can take down production. A missing audit trail means nobody knows who turned on a half-baked feature at 3 AM.

You will build this **from an empty folder** using the full AI-powered development pipeline: custom instructions to enforce conventions, an MCP server to provide flag schema data, hooks to guard against mistakes, a skill to define the scaffolding workflow, and a coordinated agent pipeline to plan, implement, and security-review the entire service.

### What Makes This Production-Grade

| Production Concern     | How This Lab Addresses It                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Consistency**        | Custom instructions enforce naming, error handling, and auth patterns on every generated file                  |
| **Security**           | PreToolUse hooks block destructive commands; Reviewer agent checks OWASP concerns; auth required for mutations |
| **Data integrity**     | Agent-scoped hooks prevent accidental data corruption; MCP provides canonical flag schemas                     |
| **Auditability**       | Every flag change records who, what, and when - enforced by instructions, verified by review                   |
| **Repeatable process** | The scaffolding skill and agent pipeline can be reused for any future microservice                             |

### What You Will Build

All work happens inside a **`feature-flag-service/`** folder that you create in the workspace root and `cd` into. This keeps the capstone isolated from the existing Book Favorites app and simulates starting a brand-new project. All paths in this lab are relative to that folder.

```
feature-flag-service/                  ← NEW folder — cd into this before starting
├── .github/
│   ├── copilot-instructions.md        ← Project-wide conventions (Lab 00)
│   ├── instructions/
│   │   ├── api.instructions.md        ← REST API standards (Lab 00)
│   │   ├── testing.instructions.md    ← Test conventions (Lab 00)
│   │   └── security.instructions.md   ← Security rules (Lab 00)
│   ├── agents/
│   │   ├── Planner.agent.md           ← Read-only planning (Lab 01)
│   │   ├── Implementer.agent.md       ← Code generation (Lab 01)
│   │   └── Reviewer.agent.md          ← Security review (Lab 01)
│   ├── hooks/
│   │   ├── format.json                ← Auto-format after edits (Lab 02)
│   │   ├── safety.json                ← Block destructive commands (Lab 02)
│   │   └── scripts/
│   │       ├── format-on-save.js
│   │       └── safety-guard.js
│   └── skills/
│       └── scaffolding-microservice/
│           ├── SKILL.md               ← Reusable scaffolding workflow (Lab 03)
│           └── templates.md
├── flag-schema-mcp-server/            ← MCP server for flag schemas (Labs 05-06)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       └── data/
│           └── flag-schemas.json
├── backend/                           ← Express.js API
│   ├── server.js
│   ├── routes/
│   │   ├── flags.js
│   │   ├── audit.js
│   │   └── auth.js
│   ├── data/
│   │   ├── flags.json
│   │   ├── audit-log.json
│   │   └── users.json
│   └── tests/
│       └── flags.test.js
└── frontend/                          ← Simple admin dashboard
    └── src/
        ├── App.jsx
        └── components/
            └── FlagDashboard.jsx
```

### Lab Structure

| Part | Focus                                                                                            | Concepts Exercised                                                                                | Time       |
| ---- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------- |
| 1    | [Bootstrap the Project with Conventions](#part-1--bootstrap-the-project-with-conventions-10-min) | Custom instructions, `/create-instruction`, always-on + file-based patterns (Lab 00)              | 10 min     |
| 2    | [Build a Flag Schema MCP Server](#part-2--build-a-flag-schema-mcp-server-10-min)                 | MCP scaffolding, Zod schemas, `server.registerTool()`, MCP Inspector (Labs 05–06)                 | 10 min     |
| 3    | [Create Agents, Hooks, and Skills](#part-3--create-agents-hooks-and-skills-15-min)               | Agent personas + handoffs, PreToolUse/PostToolUse hooks, reusable skills (Labs 01–03)             | 15 min     |
| 4    | [The Sprint: Plan, Implement, Review](#part-4--the-sprint-plan-implement-review-20-min)          | Full agent pipeline with MCP data, hooks firing, instructions enforcing, skill guiding (All labs) | 20 min     |
| 5    | [Validate and Ship](#part-5--validate-and-ship-5-min)                                            | End-to-end verification, production readiness check                                               | 5 min      |
|      |                                                                                                  | **Total**                                                                                         | **60 min** |

---

## Part 1 - Bootstrap the Project with Conventions (10 min)

> **Concepts:** Always-on instructions, file-based instructions with `applyTo`, `/create-instruction` (Lab 00)

You are starting from nothing. Before a single line of application code is written, you will define the conventions that every agent, every hook, and every prompt will follow. This is how production teams work - standards first, code second.

### Exercise 1.1 - Create the Project Structure

In Agent Mode:

> "Create the directory structure: `.github/instructions/`, `.github/agents/`, `.github/hooks/scripts/`, `.github/skills/`, `backend/routes/`, `backend/data/`, `backend/tests/`, and `frontend/src/components/`. Also create a `package.json` with name `feature-flag-service`, private: true, and scripts for `start`, `test:backend` (using jest with `--forceExit`), and `install:all`. Dependencies should include express, cors, jsonwebtoken, body-parser, uuid. Dev dependencies: jest, supertest, prettier."

Verify the folders exist and `package.json` looks correct.

### Exercise 1.2 - Write the Always-On Instructions

Create `.github/copilot-instructions.md`:

```markdown
You are an AI programming assistant.
When asked for your name, you must respond with "GitHub Copilot".

## Comment Prefix

Always start comments in the code with ``.

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
```

### Exercise 1.3 - Generate File-Based Instructions

Use `/create-instruction` to generate targeted instruction files. Create these three:

**1) API instructions** - in Chat:

```
/create-instruction
```

> "Create a concise instruction file (under 40 lines) at `.github/instructions/api.instructions.md`. Name: 'Feature Flag API Standards'. applyTo: `'**/*.js'` (plain string, not array). Conventions: route files export a factory function receiving `deps` object, register routers in a central `routes/index.js`, use `authenticateToken` middleware for protected endpoints, return `{ error: 'message' }` for errors with correct HTTP status codes (200, 201, 400, 401, 404, 409, 500), flag names must be unique and kebab-case, always validate request body fields before processing, every mutation must append to the audit log. Do not add logging, deployment, or CI/CD sections."

**2) Testing instructions:**

```
/create-instruction
```

> "Create a concise instruction file (under 25 lines) at `.github/instructions/testing.instructions.md`. Name: 'Testing Standards'. applyTo: `'**/*.test.js'` (plain string). Conventions: Jest tests in `backend/tests/` with `.test.js` extension, use supertest for HTTP testing, describe block per route, it block per scenario, always test success and error cases (400, 401, 404, 409), test descriptions start with 'should', comments start with ''. Do not add CI/CD or coverage sections."

**3) Security instructions:**

```
/create-instruction
```

> "Create a concise instruction file (under 30 lines) at `.github/instructions/security.instructions.md`. Name: 'Security Standards'. applyTo: `'**/*.{js,jsx}'` (plain string). Conventions: validate all inputs with allowlists, never use eval() or dynamic code execution, never hardcode secrets, use environment variables for JWT secret with a fallback for development only, sanitize flag names to allow only lowercase letters/numbers/hyphens, return generic error messages to clients, enforce ownership - users can only modify flags they created unless they are admin role. Do not add deployment or logging sections."

### Exercise 1.4 - Verify Instructions

Type `/instructions` in Chat. Confirm you see:

| File                         | Applied When    |
| ---------------------------- | --------------- |
| `copilot-instructions.md`    | Always          |
| `Feature Flag API Standards` | `**/*.js`       |
| `Testing Standards`          | `**/*.test.js`  |
| `Security Standards`         | `**/*.{js,jsx}` |

### Checkpoint

You have a project skeleton with zero application code but a complete set of conventions. Every agent interaction from here forward inherits these rules automatically.

---

## Part 2 - Build a Flag Schema MCP Server (10 min)

> **Concepts:** MCP project scaffolding, Zod `.strict()` schemas, `server.registerTool()`, annotations, MCP Inspector (Labs 05–06)

Instead of letting Copilot hallucinate flag schemas, you will build a small MCP server that serves canonical flag configurations. This ensures every agent that generates flag-related code uses the same field names, types, and validation rules.

### Exercise 2.1 - Create the Schema Data

Create `flag-schema-mcp-server/src/data/flag-schemas.json`:

```json
{
  "flagSchema": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier, auto-generated"
    },
    "name": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "Unique kebab-case flag name"
    },
    "description": {
      "type": "string",
      "maxLength": 200,
      "description": "Human-readable purpose of the flag"
    },
    "enabled": {
      "type": "boolean",
      "default": false,
      "description": "Whether the flag is active"
    },
    "environment": {
      "type": "string",
      "enum": ["development", "staging", "production"],
      "description": "Target environment"
    },
    "createdBy": { "type": "string", "description": "Username of the creator" },
    "updatedBy": {
      "type": "string",
      "description": "Username of last modifier"
    },
    "createdAt": {
      "type": "string",
      "format": "ISO 8601",
      "description": "Creation timestamp"
    },
    "updatedAt": {
      "type": "string",
      "format": "ISO 8601",
      "description": "Last update timestamp"
    }
  },
  "auditLogSchema": {
    "id": { "type": "string", "format": "uuid" },
    "userId": { "type": "string" },
    "action": {
      "type": "string",
      "enum": ["created", "updated", "deleted", "toggled"]
    },
    "flagName": { "type": "string" },
    "changes": { "type": "object", "description": "Before/after values" },
    "timestamp": { "type": "string", "format": "ISO 8601" }
  },
  "sampleFlags": [
    {
      "name": "dark-mode",
      "description": "Enable dark mode UI",
      "environment": "production",
      "enabled": true
    },
    {
      "name": "new-checkout-flow",
      "description": "Redesigned checkout experience",
      "environment": "staging",
      "enabled": false
    },
    {
      "name": "beta-search",
      "description": "AI-powered search results",
      "environment": "development",
      "enabled": true
    },
    {
      "name": "rate-limit-v2",
      "description": "Upgraded rate limiting algorithm",
      "environment": "production",
      "enabled": false
    },
    {
      "name": "user-analytics-dashboard",
      "description": "Real-time user analytics panel",
      "environment": "staging",
      "enabled": true
    }
  ]
}
```

### Exercise 2.2 - Scaffold and Implement the MCP Server

Download [MCP-Builder skill](https://github.com/anthropics/skills/tree/main/skills/mcp-builder) to `.github/skills/`. In Agent Mode, prompt:

> "Using the MCP Builder skill (confirm if available), scaffold a TypeScript MCP server in `flag-schema-mcp-server/`. Name it `flag-schema-mcp-server`, use stdio transport. Then implement three tools:
>
> 1. `get_flag_schema` - no parameters, returns the flag field definitions from `flag-schemas.json` so any agent knows exactly what fields a flag has, their types, and validation rules
> 2. `get_audit_log_schema` - no parameters, returns the audit log schema
> 3. `get_sample_flags` - no parameters, returns the sample flag configurations for use in seed data and test fixtures
>
> Use `server.registerTool()`, Zod `.strict()` schemas, annotations (readOnly, non-destructive, idempotent), and formatted markdown responses. Load data from `flag-schema-mcp-server/src/data/flag-schemas.json`."

### Exercise 2.3 - Build and Test

```bash
cd flag-schema-mcp-server
npm install
npm run build
```

Copy data to `dist/` (if not already there):

**Windows PowerShell:**

```powershell
Copy-Item -Path src/data -Destination dist/data -Recurse -Force
```

**Linux/macOS:**

```bash
cp -r src/data dist/
```

Test with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

| Test | Tool                   | Expected                                                            |
| ---- | ---------------------- | ------------------------------------------------------------------- |
| 1    | `get_flag_schema`      | Returns all flag field definitions with types, formats, constraints |
| 2    | `get_audit_log_schema` | Returns audit log field definitions                                 |
| 3    | `get_sample_flags`     | Returns 5 sample flags with names, descriptions, environments       |

### Exercise 2.4 - Wire into VS Code

Add to your workspace `.vscode/mcp.json` (create if it doesn't exist, or add alongside existing servers):

```json
{
  "servers": {
    "flag-schema": {
      "type": "stdio",
      "command": "node",
      "args": ["flag-schema-mcp-server/dist/index.js"]
    }
  }
}
```

Start it: `Ctrl+Shift+P` → **MCP: Start MCP server** → **flag-schema**

Verify in Agent Mode:

> "Use the flag-schema MCP server to get the flag schema."

**Expected:** Copilot returns the flag field definitions.

### Checkpoint

You now have a canonical schema server. When agents generate flag-related routes, models, or tests, they can query the MCP server for exact field names and validation rules instead of guessing.

---

## Part 3 - Create Agents, Hooks, and Skills (15 min)

> **Concepts:** Agent personas with tool restrictions and handoffs (Lab 01), PreToolUse/PostToolUse hooks (Lab 02), reusable skills (Lab 03)

### Exercise 3.1 - Create the Agent Pipeline

> **Note:** Using prompt `/create-agent create all 3 agents shown in Part3, Ex3.1` should create all three agents in one go. If it doesn't, create them one by one with the manual approach shown below.

Create three agents in `.github/agents/`. These mirror the Planner → Implementer → Reviewer chain from Lab 01, but are scoped to this project.

**Planner** - Create `.github/agents/Planner.agent.md`:

```markdown
---
description: Analyze requirements and produce implementation plans for the feature flag service.
name: Planner
tools: ['search', 'search/codebase', 'search/usages']
model: ['Claude Sonnet 4', 'GPT-4o']
handoffs:
  - label: Start Implementation
    agent: Implementer
    prompt: Implement the plan above step by step. Follow the scaffolding-microservice skill checklist. Pull schema data from the flag-schema MCP server. Run tests after backend changes.
    send: false
---

# Planning Instructions

You are a senior backend architect. Produce detailed implementation plans without editing files.

## Rules

1. **NEVER edit, create, or delete files.** You are read-only.
2. Start by understanding existing code and conventions (read `copilot-instructions.md`).
3. Produce numbered steps with acceptance criteria and complexity ratings (Low/Medium/High).
4. Call out security risks, data integrity concerns, and edge cases.
5. Reference the flag schema from the MCP server for exact field definitions.
6. Include an "Implementation Order" section - backend data → routes → wiring → frontend → tests.

## Output Format

1. **Goal** - one-line summary
2. **Schema Reference** - flag and audit log fields (pulled from MCP)
3. **Steps** - numbered implementation steps
4. **Security Considerations** - auth, validation, audit logging
5. **Testing Strategy** - what to test, expected status codes
```

**Implementer** - Create `.github/agents/Implementer.agent.md`:

```markdown
---
description: Implement features for the feature flag service - edits files and runs tests.
name: Implementer
tools:
  [
    'edit/editFiles',
    'edit/createFiles',
    'read/terminalLastCommand',
    'search',
    'search/codebase',
  ]
handoffs:
  - label: Request Security Review
    agent: Reviewer
    prompt: Review the feature flag service changes for security vulnerabilities, proper auth enforcement, audit logging, and input validation.
    send: false
---

# Implementation Instructions

You are a senior backend developer building a feature flag service.

## Rules

1. Follow the plan step by step. Do not add unrequested features.
2. Always start comments with ""
3. **Dependency order**: data files → utility functions → routes → route wiring → frontend → tests
4. Create files before referencing them in imports.
5. Use the factory function pattern for all routes (`module.exports = function createXRouter(deps) { ... }`).
6. Every flag mutation (create, update, delete, toggle) MUST append to the audit log.
7. Validate all inputs - flag names must match `^[a-z0-9-]+$`, descriptions max 200 chars.
8. Run `npm run test:backend` after backend changes.

## Conventions

- Routes: `backend/routes/{resource}.js`
- Data: `backend/data/{resource}.json`
- Tests: `backend/tests/{resource}.test.js`
- Auth middleware: `authenticateToken` from `deps`
```

**Reviewer** - Create `.github/agents/Reviewer.agent.md`:

```markdown
---
description: Security-focused code review for the feature flag service.
name: Reviewer
tools: ['search', 'search/codebase', 'search/usages']
handoffs:
  - label: Fix Review Findings
    agent: Implementer
    prompt: Fix all Critical and High severity findings from the review above. Run tests after each fix.
    send: false
---

# Security Review Instructions

You are a senior security engineer reviewing a feature flag service. Do not edit any files.

## Review Checklist

1. **Authentication** - All mutation endpoints require `authenticateToken`. Public reads (flag evaluation) must NOT require auth.
2. **Authorization** - Users can only modify their own flags (unless admin). Check for IDOR vulnerabilities.
3. **Input validation** - Flag names validated against `^[a-z0-9-]+$`. Descriptions capped at 200 chars. Environment must be from allowed enum.
4. **Audit trail** - Every flag change recorded with userId, action, flagName, before/after diff, timestamp.
5. **Mass assignment** - userId/createdBy must come from JWT token, never from request body.
6. **Error handling** - No stack traces in responses. Generic error messages. Correct HTTP status codes.
7. **Data integrity** - Flag names must be unique per environment. Concurrent modification considered.

## Output Format

- **Verdict**: APPROVE or REQUEST CHANGES
- **Findings**: Table with Severity (Critical/High/Medium/Low), File, Issue, Fix
- **Positives**: What was done well
- **Next Steps**: If APPROVE, state "Ready to ship." If REQUEST CHANGES, suggest clicking "Fix Review Findings."
```

### Exercise 3.2 - Create Global Hooks

> **Note:** Using prompt `/create-hook create hooks shown in Part3, Ex3.2` should create all hooks in one go. If it doesn't, create them one by one with the manual approach shown below.

**PostToolUse auto-format hook:**

Create `.github/hooks/scripts/format-on-save.js`:

```javascript
// PostToolUse hook to auto-format files with Prettier
const { execSync } = require('child_process');
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
    const filePath = toolInput.filePath;
    if (!filePath) process.exit(0);

    const formattable = /\.(js|ts|jsx|tsx|json|css|html|md|yaml|yml)$/i;
    if (!formattable.test(filePath)) process.exit(0);

    execSync(`npx prettier --write "${filePath}"`, { stdio: 'inherit' });
  } catch (err) {
    process.stderr.write(`Format hook error: ${err.message}\n`);
    process.exit(0);
  }
});
```

Create `.github/hooks/format.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "type": "command",
        "command": "node .github/hooks/scripts/format-on-save.js",
        "timeout": 15
      }
    ]
  }
}
```

**PreToolUse safety guard hook:**

Create `.github/hooks/scripts/safety-guard.js`:

```javascript
// PreToolUse hook to block destructive terminal commands
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin });
let inputData = '';

rl.on('line', (line) => {
  inputData += line;
});

rl.on('close', () => {
  try {
    const input = JSON.parse(inputData);
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};

    const terminalTools = ['run_in_terminal', 'terminal', 'bash', 'shell'];
    if (!terminalTools.some((t) => toolName.toLowerCase().includes(t))) {
      process.stdout.write(JSON.stringify({ continue: true }));
      process.exit(0);
    }

    const command = toolInput.command || toolInput.cmd || toolInput.input || '';
    const blockedPatterns = [
      /rm\s+-rf\s+\//i,
      /rm\s+-rf\s+\*/i,
      /DROP\s+(TABLE|DATABASE)/i,
      /npm\s+publish/i,
      /git\s+push\s+.*--force/i,
      /curl\s+.*\|\s*(bash|sh)/i,
      /format\s+[a-z]:/i,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(command)) {
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: `BLOCKED: "${command}" matches dangerous pattern "${pattern.source}".`,
            },
          })
        );
        process.exit(0);
      }
    }

    process.stdout.write(JSON.stringify({ continue: true }));
    process.exit(0);
  } catch (err) {
    process.stderr.write(`Safety guard error: ${err.message}\n`);
    process.exit(1);
  }
});
```

Create `.github/hooks/safety.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "type": "command",
        "command": "node .github/hooks/scripts/safety-guard.js",
        "timeout": 10
      }
    ]
  }
}
```

### Exercise 3.3 - Create a Microservice Scaffolding Skill

In the Chat view:

```
/create-skill
```

> "Create a skill called `scaffolding-microservice` in `.github/skills/scaffolding-microservice/`. This skill teaches Copilot how to scaffold a complete Express.js microservice with JSON file storage.
>
> **SKILL.md** (under 120 lines):
>
> - name: `scaffolding-microservice`
> - description: Third person. Scaffolds an Express.js microservice with JSON file storage, JWT auth, and audit logging. Trigger terms: scaffold service, new microservice, create API, build service, add resource.
> - argument-hint: 'Describe the service (e.g., "feature flag service with CRUD operations and audit trail")'
>
> Include a **Scaffolding Checklist**:
>
> 1. Create `backend/data/{resource}.json` with initial data
> 2. Create `backend/routes/{resource}.js` using factory function pattern with `deps` object
> 3. Create `backend/routes/index.js` to compose all routers
> 4. Create `backend/server.js` with Express setup, CORS, JWT middleware, deps wiring
> 5. Wire all routes and start the server
> 6. Create `backend/tests/{resource}.test.js` with supertest
> 7. Run tests to verify
>
> Include a **templates.md** companion file with skeleton code for: server.js setup, factory function route, and Jest test file. All comments start with ''. Do not add Docker, CI/CD, or deployment sections."

**Validate the generated files:**

1. Confirm both files exist:
   - `.github/skills/scaffolding-microservice/SKILL.md`
   - `.github/skills/scaffolding-microservice/templates.md`

2. Open `SKILL.md` and verify:
   - The frontmatter contains `name: scaffolding-microservice` and an `argument-hint`
   - The 7-step **Scaffolding Checklist** is present (data → routes → index → server → wire → tests → run)
   - No Docker, CI/CD, or deployment sections appear

3. Open `templates.md` and verify:
   - It includes skeleton code for `server.js`, a factory function route, and a Jest test file
   - All code comments start with ``
   - The route template uses the factory function pattern with a `deps` object

4. Type `/` in Chat and confirm `scaffolding-microservice` appears in the skill list

5. In Agent Mode, prompt:

> "Validate the scaffolding-microservice skill. Read `.github/skills/scaffolding-microservice/SKILL.md` and `.github/skills/scaffolding-microservice/templates.md`. Confirm:
>
> 1. SKILL.md has frontmatter with `name: scaffolding-microservice` and an `argument-hint`
> 2. SKILL.md contains a 7-step Scaffolding Checklist covering: data files, route handlers, route index, server, wiring, tests, and running tests
> 3. templates.md has skeleton code for server.js, a factory function route, a route index, and a Jest test file
> 4. All code comments in templates.md start with ``
> 5. The route template uses the factory function pattern receiving a `deps` object
> 6. No Docker, CI/CD, or deployment sections in either file
>
> Report PASS or FAIL for each check."

### Exercise 3.4 - Verify Everything Is Wired

Quick checklist before the sprint or prompt `Validate Ex 3.4` in Agent Mode:

| Layer        | Check                                      | How to verify                         |
| ------------ | ------------------------------------------ | ------------------------------------- |
| Instructions | 4 instruction files loaded                 | Type `/instructions`                  |
| Agents       | Planner, Implementer, Reviewer in dropdown | Open Agents dropdown                  |
| Hooks        | Format + Safety registered                 | Gear icon → Hooks                     |
| Skill        | `scaffolding-microservice` available       | Type `/` in Chat                      |
| MCP          | `flag-schema` server running               | Ask Copilot to call `get_flag_schema` |

### Checkpoint

You have a complete development environment with zero application code: conventions, agents, hooks, a skill, and an MCP data source - all configured and ready. The next step is using them.

---

## Part 4 - The Sprint: Plan, Implement, Review (20 min)

> **Concepts:** Planner → Implementer → Reviewer handoff chain with MCP data, hook enforcement, instruction compliance, skill-guided scaffolding (Labs 00–03, 05–06)

This is the core of the lab. You will orchestrate the full agent pipeline to build the feature flag service from scratch.

### Exercise 4.1 - Plan the Service (Planner Agent)

1. Select **Planner** from the Agents dropdown.
2. Submit:

> "Plan the feature flag service. Use the flag-schema MCP server to get the exact flag schema and audit log schema - use those field definitions in your plan, do not make up field names. Use the `scaffolding-microservice` skill checklist to structure the implementation order.
>
> The service needs:
>
> 1. `POST /api/flags` - create a new flag (auth required, validate inputs, check name uniqueness per environment, log to audit)
> 2. `GET /api/flags` - list all flags, filterable by `?environment=production` (public, no auth)
> 3. `GET /api/flags/:name` - get a single flag by name (public)
> 4. `PUT /api/flags/:name` - update a flag (auth, ownership check, audit log)
> 5. `DELETE /api/flags/:name` - delete a flag (auth, ownership check, audit log)
> 6. `POST /api/flags/:name/toggle` - toggle enabled/disabled (auth, audit log with before/after)
> 7. `GET /api/audit-log` - view audit trail (auth required)
> 8. `POST /api/auth/login` - login with username/password, return JWT
>
> Include security considerations, testing strategy, and risks."

**What to watch for:**

- The Planner calls the MCP `get_flag_schema` tool to get exact field definitions (check tool calls)
- The plan references the skill's scaffolding checklist for implementation order
- Security considerations mention audit logging, ownership checks, mass assignment prevention
- **No files are created** - the Planner is read-only

### Exercise 4.2 - Implement the Service (Implementer Agent)

1. Click the **"Start Implementation"** handoff button.
2. The Implementer receives the plan as context. If needed, refine the prompt:

> "Implement the plan above step by step. Use the flag-schema MCP server to get the sample flags for seeding `backend/data/flags.json`. Use the `scaffolding-microservice` skill templates as starting points and use the skill checklist. Pull schema data from the flag-schema MCP server. Run tests as `npm run test:backend` after backend changes."

**Watch these integration points as the Implementer works:**

| Observable Event                                                                        | System at Work                                   |
| --------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Implementer creates `server.js` → file is auto-formatted with single quotes, semicolons | **PostToolUse hook** (Lab 02) fires Prettier     |
| Route uses factory function + `deps` object                                             | **api.instructions.md** (Lab 00) enforced        |
| Flag names validated with regex, descriptions capped at 200 chars                       | **security.instructions.md** (Lab 00) enforced   |
| `userId` from JWT token, not request body                                               | **copilot-instructions.md** mass assignment rule |
| MCP called for sample flag data to seed `flags.json`                                    | **MCP server** (Lab 05–06) provides real data    |
| Files created in scaffolding checklist order                                            | **Skill** (Lab 03) guides the workflow           |

> **Tip:** If the Implementer stalls or produces an error, nudge it: "Check the factory function pattern in the api.instructions.md. Also verify the route is registered in routes/index.js."

### Exercise 4.3 - Run Tests

After the Implementer finishes:

```bash
npm install
npm run test:backend
```

If tests fail, paste the error output and ask the Implementer to fix them. Do not move to the review until tests pass.

### Exercise 4.4 - Security Review (Reviewer Agent)

1. Click **"Request Security Review"** handoff.
2. If needed, refine:

> "Review the entire feature flag service for security. Focus on:
>
> 1. Auth enforcement on all mutation endpoints (create, update, delete, toggle)
> 2. Public read access for flag evaluation (GET endpoints must NOT require auth)
> 3. Mass assignment - userId must come from JWT, never from request body
> 4. Flag name validation (kebab-case regex)
> 5. Audit trail completeness - every mutation logged with before/after diff
> 6. Unique flag name per environment constraint
> 7. No stack traces in error responses"

**Expected:** A structured review report with findings table, severity ratings, and an APPROVE or REQUEST CHANGES verdict.

### Exercise 4.5 - Fix and Re-Review (If Needed)

If the Reviewer found issues:

1. Click **"Fix Review Findings"** to handoff back to the Implementer.
2. Let it fix Critical and High findings.
3. Re-run tests: `npm run test:backend`
4. If needed, handoff back to the Reviewer for a second pass.

**This is the production loop:** Plan → Implement → Review → Fix → Review → Ship.

### Checkpoint

The feature flag service is built, tested, and security-reviewed - entirely through the agent pipeline. Every file followed the same conventions. Every mutation has an audit trail. The MCP server provided canonical schemas.

---

## Part 5 - Validate and Ship (5 min)

### Exercise 5.1 - Smoke Test the API

Start the service:

```bash
node backend/server.js
```

Test the endpoints:

```bash
# List all flags (public, no auth)
Invoke-RestMethod -Uri "http://localhost:3500/api/flags" -Method Get

# Filter by environment
Invoke-RestMethod -Uri "http://localhost:3500/api/flags?environment=production" -Method Get

# Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3500/api/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"admin","password":"password"}'

# Extract token from login response
$token = $loginResponse.token

# Create a flag (using extracted token)
Invoke-RestMethod -Uri "http://localhost:3500/api/flags" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body '{"name":"new-homepage","description":"Redesigned homepage","environment":"staging"}'

# Toggle a flag
Invoke-RestMethod -Uri "http://localhost:3500/api/flags/new-homepage/toggle" -Method Post -Headers @{Authorization="Bearer $token"}

# View audit trail
Invoke-RestMethod -Uri "http://localhost:3500/api/audit-log" -Method Get -Headers @{Authorization="Bearer $token"}
```

### Exercise 5.2 - Verify Every Layer Contributed

| Layer                              | Evidence                                                                      | Where to Check                                  |
| ---------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------- |
| **MCP Server** (Labs 05–06)        | Flag schema fields match MCP definitions; sample flags seeded from MCP data   | `backend/data/flags.json`, Planner's tool calls |
| **Instructions** (Lab 00)          | Factory function pattern, kebab-case endpoints, `{ error: 'message' }` format | All route files                                 |
| **Security instructions** (Lab 00) | Input validation regex, no hardcoded secrets, ownership checks                | `backend/routes/flags.js`                       |
| **Global hooks** (Lab 02)          | All files formatted consistently (check single quotes, semicolons)            | Open any generated `.js` file                   |
| **Safety hook** (Lab 02)           | Destructive commands would be blocked (try asking an agent to run `rm -rf /`) | Output panel → Copilot Chat Hooks               |
| **Skill** (Lab 03)                 | Implementation followed the 7-step scaffolding checklist                      | Planner's output, file creation order           |
| **Planner** (Lab 01)               | Read-only plan with schema references - no files edited                       | Chat history                                    |
| **Implementer** (Lab 01)           | All files created, tests written and passing                                  | File system + test output                       |
| **Reviewer** (Lab 01)              | Structured security review with severity-rated findings                       | Chat history                                    |
| **Handoffs** (Lab 01)              | One-click transitions: Planner → Implementer → Reviewer                       | Handoff buttons in chat                         |

### Exercise 5.3 - Reflect on What You Built

You just built a production-grade microservice from an empty folder in under an hour:

- **8 API endpoints** with authentication, authorization, input validation, and audit logging
- **Security reviewed** against OWASP-aligned checklist by a specialized agent
- **Consistently formatted** by automatic hooks - not manual effort
- **Schema-accurate** because MCP served canonical definitions - no hallucinated field names
- **Repeatable** - the scaffolding skill, agents, and hooks work for any future service

Compare this to the traditional approach:

- Manually creating every file and remembering conventions across them
- Forgetting input validation on one endpoint while adding it to others
- Running Prettier manually (or not at all)
- Reviewing your own code for security issues you might be blind to
- Copying and pasting boilerplate with subtle inconsistencies

The AI pipeline doesn't just save time - it **raises the quality floor** so that every service you build meets the same baseline.

---

## Bonus Challenges

### Challenge 1 - Coordinator Orchestration (10 min)

Build a **Feature Builder** coordinator agent (Lab 01, Part 4A) that automates the entire pipeline without manual handoff clicks:

1. Create worker agents (FB Planner, FB Architect, FB Implementer, FB QA) in a `.github/agents/feature-builder/` subfolder.
2. Register the folder in `chat.agentFilesLocations`.
3. Use the coordinator to add a new endpoint: `GET /api/flags/:name/history` that returns the audit log entries for a specific flag.

**Observe:** The coordinator runs all phases automatically - no button clicks needed.

### Challenge 2 - Multi-Perspective Security Audit (10 min)

Create an **FB Reviewer** (Lab 01, Part 4B) that runs parallel subagent reviews:

- **Auth reviewer**: Checks every endpoint for proper authentication/authorization
- **Input validation reviewer**: Checks all request parsing for injection and bypass vectors
- **Audit trail reviewer**: Verifies every mutation is logged with complete before/after data
- **API design reviewer**: Checks REST conventions, status codes, error format consistency

Compare the multi-perspective findings to the single-pass Reviewer from Exercise 4.4.

### Challenge 3 - Test the Hooks Under Fire (5 min)

1. Ask any agent: _"Run `rm -rf /` in the terminal."_ → Verify the safety hook blocks it.
2. Ask the Implementer to create a file with wildly inconsistent formatting → Verify the format hook cleans it up.
3. Try: _"Run `npm publish` in the terminal."_ → Verify it is blocked.

### Challenge 4 - Package as a Plugin (10 min)

If you completed Lab 04, package the entire setup into a distributable plugin:

1. Create a `plugin.json` manifest bundling:
   - The 3 instruction files
   - The 3 agents
   - The 2 hooks with their scripts
   - The scaffolding skill
   - The MCP server configuration
2. This plugin becomes a "Microservice Starter Kit" - any team member who installs it gets the full pipeline for building new services.

### Challenge 5 - Coding Agent PR (15 min)

If you completed Lab 07 and your code is on GitHub:

1. Create a GitHub Issue: _"Add rate limiting to POST /api/flags - max 10 flag creations per minute per user"_
2. Assign the issue to `@copilot`
3. Monitor the Actions workflow as the Coding Agent reads your `copilot-instructions.md`, implements the feature, and opens a draft PR
4. Review the PR - does it follow the conventions from your instruction files?

---

## Architecture Summary

```
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                    GREENFIELD: FEATURE FLAG SERVICE                          │
  │                    Built from scratch in 60 minutes                          │
  │                                                                              │
  │  CONVENTIONS (Lab 00)          GUARDRAILS (Lab 02)         DATA (Labs 05-06) │
  │  ┌──────────────────────┐      ┌────────────────────┐      ┌──────────────┐  │
  │  │ copilot-instructions │      │ format.json        │      │ flag-schema  │  │
  │  │ api.instructions     │      │  └─ auto-format    │      │ MCP Server   │  │
  │  │ testing.instructions │      │ safety.json        │      │  ├─ schema   │  │
  │  │ security.instructions│      │  └─ block rm -rf   │      │  ├─ audit    │  │
  │  └──────────────────────┘      └────────────────────┘      │  └─ samples  │  │
  │                                                            └──────────────┘  │
  │  CAPABILITY (Lab 03)           ORCHESTRATION (Lab 01)                        │
  │  ┌─────────────────────┐      ┌───────┐ → ┌─────────────┐ → ┌──────────┐     │
  │  │ scaffolding-        │      │Planner│   │Implementer  │   │Reviewer  │     │
  │  │ microservice        │      │(read) │   │(read+write) │   │(read)    │     │
  │  │  ├─ SKILL.md        │      └───────┘   └─────────────┘   └──────────┘     │
  │  │  └─ templates.md    │        handoff →   handoff →   ← fix loop           │
  │  └─────────────────────┘                                                     │
  │                                                                              │
  │  RESULT                                                                      │
  │  ┌────────────────────────────────────────────────────────────────────┐      │
  │  │ 8 API endpoints │ JWT auth │ audit logging │ input validation      │      │
  │  │ Jest tests      │ auto-formatted │ security reviewed │ from zero   │      │
  │  └────────────────────────────────────────────────────────────────────┘      │
  └──────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

| Concept                               | What This Lab Proved                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Greenfield is where this shines**   | Starting from zero - no boilerplate, no forgetting conventions, no inconsistencies between files                                 |
| **Conventions before code**           | Instructions set the rules before a single line was written - every agent automatically complied                                 |
| **MCP as single source of truth**     | Schema MCP ensured flag fields, types, and validation rules were consistent across routes, tests, and data                       |
| **Hooks as safety nets**              | Formatting and command blocking ran deterministically - no relying on the AI to "remember"                                       |
| **Skills as institutional knowledge** | The scaffolding checklist turned tribal knowledge ("how we build services here") into a portable workflow                        |
| **Agents as specialists**             | Planner analyzed without editing, Implementer built without skipping steps, Reviewer caught what others missed                   |
| **The pipeline compounds**            | Each layer amplifies the others - instructions guide agents, hooks enforce quality, MCP provides data, skills structure the work |

---

## Reference

- [Custom Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
- [Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [Agent Hooks](https://code.visualstudio.com/docs/copilot/customization/hooks)
- [Agent Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [MCP Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
- [Subagents](https://code.visualstudio.com/docs/copilot/agents/subagents)
- [Agent Plugins](https://code.visualstudio.com/docs/copilot/customization/agent-plugins)
