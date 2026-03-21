# Lab: Custom Agents in VS Code - Build Specialized AI Personas

> \[NOTE\]   
> This lab uses the **Custom Agents** feature in VS Code to create specialized AI personas tailored to specific development tasks. You will build agents for the **Book Favorites** app (`copilot-agent-and-mcp/`).

## Overview

Custom agents enable you to configure GitHub Copilot to adopt different personas - each with its own behavior, available tools, and instructions. Instead of manually selecting tools and crafting prompts every time, you define an `.agent.md` file once and switch to that persona instantly from the Agents dropdown.

### What You Will Learn

**Total Time: ~65 minutes**

| Part | Topic | Description | Time&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |
| --- | --- | --- | --- |
| 1 | [Your First Custom Agent: The Planner](#part-1---your-first-custom-agent-the-planner-10-min) | Create a read-only planning agent using the `.agent.md` format with tool restrictions | 10 min |
| 2 | [An Implementation Agent with Handoffs](#part-2---an-implementation-agent-with-handoffs-15-min) | Build Implementer and Reviewer agents; connect all three with one-click handoffs | 15 min |
| 3 | [Generate an Agent with AI](#part-3---generate-an-agent-with-ai-10-min) | Use `/create-agent` to generate a Database Migrator agent from a natural language description | 10 min |
| 4 | [Orchestration Patterns with Subagents](#part-4---orchestration-patterns-with-subagents-25-min) | Learn coordinator-worker and multi-perspective subagent orchestration patterns | 25 min |
| 4A | [Coordinator and Worker Pattern](#part-4a---coordinator-and-worker-pattern-15-min) | Build a Feature Builder coordinator that delegates to specialized worker subagents | 15 min |
| 4B | [Multi-perspective Code Review](#part-4b---multi-perspective-code-review-10-min) | Run parallel review subagents (correctness, quality, security, architecture) and synthesize findings | 10 min |
| 5 | [Visibility and Organization](#part-5---visibility-and-organization-5-min) | View, hide, and debug custom agents using the Agents dropdown and diagnostics tools | 5 min |
| | | **Total Lab Time** | **65 min** |

### Prerequisites

| Requirement | Details |
| --- | --- |
| **VS Code** | Insiders or latest Stable with GitHub Copilot extension (Agent Mode enabled) |
| **GitHub Copilot** | Copilot Pro, Pro+, Business, or Enterprise subscription |
| **Workspace** | This repository cloned locally |
| **App running** | `npm install && npm start` in `copilot-agent-and-mcp/` - backend on :4000, frontend on :5173 |

### Time Estimate

45 - 60 minutes

---

## What You Will Build

By the end of this lab, you will have four connected agents:

```
  ┌──────────┐        ┌──────────────┐        ┌──────────┐
  │ Planner  │ ─────> │ Implementer  │ ─────> │ Reviewer │
  │ (read)   │        │ (read+write) │        │ (read)   │
  └──────────┘        └──────┬───────┘        └──────────┘
                             │
                      ┌──────▼───────┐
                      │ Test Writer  │
                      │ (subagent)   │
                      └──────────────┘
```

Each arrow is a **handoff** - a one-click button that switches you to the next agent with context carried over.

---

## Part 1 - Your First Custom Agent: The Planner (10 min)

**Objective:** Create a read-only planning agent that analyzes the codebase and generates implementation plans without modifying any files. You will learn the `.agent.md` format and see how tool restrictions enforce behavior.

### Exercise 1.1 - Create a Planning Agent

1.  In the Chat view, click the **gear icon** (⚙) at the top.
2.  Select **Custom Agents**.
3.  Select **Create new custom agent**.
4.  Choose `.github/agents` as the location.
5.  Enter `Planner` as the file name.
6.  Replace the generated content with:

```
---
description: Analyze the codebase and generate implementation plans without modifying files.
name: Planner
tools: ['web/fetch', 'search', 'search/codebase', 'search/usages']
model: ['Claude Sonnet 4', 'GPT-4o']
---

# Planning instructions

You are a senior software architect. Your job is to analyze codebases and produce detailed implementation plans.

Don't make any code edits, just generate a plan.

## Rules

1. **NEVER edit, create, or delete files.** You are read-only.
2. Always start by understanding the existing project structure and conventions.
3. Produce plans as numbered step-by-step lists with clear acceptance criteria.
4. Call out risks, dependencies, and trade-offs for each step.
5. Estimate complexity as Low / Medium / High for each task.
6. Reference specific files and line numbers when discussing existing code.
7. **Specify implementation dependencies**: Always include a "Implementation Order" section that lists which files must be created before others can reference them.
8. **Account for build constraints**: Plans must ensure incremental changes don't break builds at any step.

## Output Format

The plan consists of a Markdown document with the following sections:

1. **Goal** - a brief description of what the plan achieves
2. **Context** - summary of relevant existing code you discovered
3. **Steps** - a detailed list of implementation steps
4. **Risks** - potential issues or blockers
5. **Testing** - a list of tests that need to be implemented to verify the feature
6. **Implementation Order** - dependency graph showing which components must be implemented before others
```

### Exercise 1.2 - Test the Planning Agent

1.  Open the Chat view in VS Code.
2.  From the **Agents** dropdown at the top, select **Planner**.
3.  Notice the placeholder description in the chat input field.
4.  Enter this prompt:

> "Analyze the Book Favorites app in copilot-agent-and-mcp/. I want to add a book rating feature where authenticated users can rate books 1-5 stars. Create an implementation plan covering backend API, frontend UI, and tests."

**Verify:**

*   Copilot reads files but does NOT create or edit any files
*   The plan references specific files like `frontend/src/`
*   The plan includes numbered steps, risks, and testing guidance
*   The tools used are limited to read-only operations (check the tool calls in the chat)

### Exercise 1.3 - Verify Tool Restrictions

Try a follow-up prompt that asks the agent to make changes:

> "Go ahead and implement step 1 of the plan - create the ratings endpoint."

**Expected behavior:** The agent should either refuse (because write tools aren't available) or explain that it can only plan, not implement.

---

## Part 2 - An Implementation Agent with Handoffs (15 min)

**Objective:** Create two more agents (Implementer and Reviewer) and connect all three with handoffs so you can transition between them with one click.

```
┌──────────┐  Start Implementation  ┌──────────────┐  Request Code Review  ┌──────────┐
│ Planner  │ ─────────────────────> │ Implementer  │ ─────────────────────>│ Reviewer │
│          │                        │              │                       │          │
│ (read)   │                        │ (read+write) │ <─────────────────────│ (read)   │
└──────────┘                        └──────────────┘  Fix Review Findings  └──────────┘
  Tools:                              Tools:                                Tools:
  search, codebase,                   editFiles, terminal,                  search, codebase,
  web/fetch, usages                   search, codebase                      usages, web/fetch
```

### Exercise 2.1 - Update the Planner with a Handoff

1.  Click the **gear icon** (⚙) > **Custom Agents**.
2.  Select **Planner** from the list to open it for editing.
3.  Update the frontmatter to add a handoff:

```
---
description: Analyze the codebase and generate implementation plans without modifying files.
name: Planner
tools: ['web/fetch', 'search', 'search/codebase', 'search/usages']
model: ['Claude Sonnet 4', 'GPT-4o']
handoffs:
  - label: Start Implementation
    agent: Implementer
    prompt: Implement the plan outlined above. Follow each step carefully and run tests after each change.
    send: false
---
<earlier content unchanged>
```

### Exercise 2.2 - Create the Implementation Agent

1.  Click the **gear icon** (⚙) > **Custom Agents** > **Create new custom agent**.
2.  Choose `.github/agents`, enter `Implementer` as the file name.
3.  Replace the content with:

```
---
description: Implement features based on a plan - edits files, runs tests, and commits.
name: Implementer
tools: ['edit/editFiles', 'edit/createFiles', 'read/terminalLastCommand', 'search', 'search/codebase']
handoffs:
  - label: Request Code Review
    agent: Reviewer
    prompt: Review the changes I just implemented. Check for security issues, code quality, and test coverage.
    send: false
---

# Implementation instructions

You are a senior full-stack developer. You implement features based on plans provided to you.

## Rules

1. Follow the plan step by step. Do not skip steps or add unrequested features.
2. **CREATE FILES BEFORE REFERENCING THEM**: Never update imports or references to files that don't exist yet.
3. After each file change, verify the change compiles / parses correctly.
4. **DEPENDENCY ORDER**: Implement in this order:
   - Backend data structures and utilities first
   - Backend routes and API endpoints  
   - Frontend state management (Redux slices)
   - Frontend components (create files, then add imports)
   - Integration and routing updates last
5. Always start comments in the code with "generated-by-copilot: "
6. Run backend tests with `npm run test:backend` after backend changes.
7. Run E2E tests with `npm run build:frontend && npm run test:frontend` after frontend changes.
8. **ROLLBACK ON FAILURE**: If tests fail due to missing files, revert the breaking changes before proceeding.

## Conventions

- Backend routes go in `backend/routes/index.js`
- Data files are in `backend/data/`
- Frontend components use React with Redux Toolkit
- Authentication uses JWT via `authenticateToken` middleware
```

### Exercise 2.3 - Create the Code Review Agent

1.  Click the **gear icon** (⚙) > **Custom Agents** > **Create new custom agent**.
2.  Choose `.github/agents`, enter `Reviewer` as the file name.
3.  Replace the content with:

```
---
description: Review code changes for security, quality, and best practices.
name: Reviewer
tools: ['search', 'search/codebase', 'search/usages', 'web/fetch']
handoffs:
  - label: "Fix Review Findings"
    agent: Implementer
    prompt: |
      Fix the issues identified in the code review above.
      Address all Critical and High severity findings first.
      Run tests after each fix to ensure nothing is broken.
    send: false
---

# Code review instructions

You are a senior security-focused code reviewer. You review code for security vulnerabilities, code quality issues, and adherence to best practices.

Don't make any code edits, just review and report findings.

## Review Checklist

For every review, check:

1. **Security** - OWASP Top 10 vulnerabilities (injection, broken auth, mass assignment, etc.)
2. **Input Validation** - All user inputs validated and sanitized
3. **Authorization** - Proper access control on all endpoints
4. **Error Handling** - No stack traces leaked to users, proper error responses
5. **Performance** - No N+1 queries, unbounded results, or memory leaks
6. **Testing** - Adequate test coverage for new code
7. **Build Integrity** - Verify all imports reference existing files
8. **Incremental Compatibility** - Check that changes don't break existing functionality
9. **Test Stability** - Confirm tests pass after each logical grouping of changes

## Output Format

Produce a review report with:

- **Summary** - one-line overall assessment (APPROVE / REQUEST CHANGES)
- **Findings** - table with columns: Severity (Critical/High/Medium/Low), File, Line, Issue, Suggestion
- **Positives** - things done well
- **Next step** - if APPROVE, state "Review complete. No issues found. You can start a new chat or switch agents from the dropdown." If REQUEST CHANGES, suggest clicking "Fix Review Findings"
```

### Exercise 2.4 - Test the Handoff Workflow

1.  Select the **Planner** agent from the dropdown.
2.  Ask it to plan a feature:

> "Plan adding a 'reading list' feature where users can mark books as 'want to read', 'currently reading', or 'finished'. Include backend API and frontend UI."

1.  After the plan is generated, look for the **"Start Implementation"** button at the bottom of the response.
2.  Click the button - you should switch to the **Implementer** agent with the prompt pre-filled.
3.  Let the Implementer work through the plan.
4.  After implementation, look for the **"Request Code Review"** button.
5.  Click it to switch to the **Reviewer** agent.

**Verify:**

*   The Planner produces a plan without editing files
*   The "Start Implementation" handoff button appears after the plan
*   Clicking the handoff switches to the Implementer agent
*   The Implementer has access to write tools and can modify files
*   The "Request Code Review" handoff button appears after implementation
*   The Reviewer checks for security issues and produces a structured report
*   If the Reviewer finds issues (REQUEST CHANGES), the **"Fix Review Findings"** handoff button appears
*   Clicking it switches back to the Implementer with the findings as context

---

## Part 3 - Generate an Agent with AI (10 min)

**Objective:** Use the `/create-agent` command to generate a custom agent from a natural language description, then refine the output.

### Exercise 3.1 - Use /create-agent

1.  Open the Chat view and enter below command.

```
/create-agent
```

1.  Copilot will ask you to describe the agent. Enter:

> "Create a database migration agent for the Book Favorites app. It should analyze JSON data files in backend/data/ (books.json and users.json), propose schema migration steps, create backup copies before any changes, and validate data integrity after migration. It should always ask for confirmation before destructive operations. Use only these tools: editFiles, terminalLastCommand, search, codebase. Add a handoff to the reviewer agent after migration is complete."

Copilot generates a `.agent.md` file and opens it. **Do not accept it yet** - review it first.

Check the generated file against this checklist:

| Field | What to look for | If missing |
| --- | --- | --- |
| `name` | Something like "Database Migrator" | Add`name: Database Migrator` |
| `description` | Mentions JSON data files and migration | Add a clear one-liner |
| `tools` | Should list specific tools, not allow all | Replace with`['editFiles', 'terminalLastCommand', 'search', 'codebase']` |
| Body instructions | Mentions`backend/data/books.json` and `users.json` | Add the file paths |
| Body instructions | Says to create backups before changes | Add a backup rule |
| Body instructions | Says to ask before destructive operations | Add a confirmation rule |

1.  Accept the file if it looks reasonable - you will refine it in the next exercise.

### Exercise 3.2 - Refine the Generated Agent

The AI-generated agent is a starting point. Select your new migration agent, and make these specific edits:

**Lock down the tools** - if the `tools` list is missing or says `'*'`, replace it with:

**Add a handoff** - add this to the frontmatter so the Reviewer can check the migration:

**Add 'Data Files' references** - ensure the body instructions include:

Save the file. In addition to the generated code, your final agent should look like this:

```
---
description: Plan and execute data schema changes for the Book Favorites app JSON data files.
name: Database Migrator
tools: ['edit/editFiles', 'read/terminalLastCommand', 'search', 'search/codebase']
handoffs:
  - label: "Review Migration"
    agent: Reviewer
    prompt: Review the data migration changes. Verify backup files were created and data integrity is preserved.
    send: false
---

# Data Migration instructions

You are a cautious data migration specialist. You help plan and execute schema changes to JSON data files.

## Rules

1. Always start comments in the code with "generated-by-copilot: "
2. **Always create a backup** before modifying any data file.
3. **Ask "Should I proceed?"** before any destructive operation and wait for the user to reply yes/no. Do NOT use commands like "EXECUTE" or "ABORT".
4. Validate JSON integrity after every change.
5. Show a before/after diff so the user can verify the migration.

## Data Files

- Books: `backend/data/books.json`
- Users: `backend/data/users.json`
- Always create a backup copy (e.g., `books.backup.json`) before modifying any data file.

## Workflow

1. Read the current data file and summarize its schema.
2. Propose the migration steps and ask "Should I proceed?"
3. Create a backup copy of the file.
4. Apply the migration.
5. Validate the result (valid JSON, expected field count, no data loss).
6. Only after validation passes, tell the user: "Migration complete. Click the **Review Migration** button below to have the Reviewer verify the changes."

**Note:** The "Review Migration" button appears after every response. Only suggest clicking it after step 5 (validation) passes.
```

### Exercise 3.3 - Test the Migration Agent

1.  Select your new migration agent **Database Migrator** from the **Agents** dropdown.
2.  Enter this prompt:

> "I want to add a 'genre' field to every book in books.json. Propose a migration plan, create a backup, add the field with a default value of 'Fiction', and validate the result."

**Verify:**

*   The agent reads `backend/data/books.json` first
*   It creates a backup file before making changes
*   It asks "Should I proceed?" and waits for your reply (not "type EXECUTE")
*   It adds the `genre` field to each book
*   It validates the result (correct JSON, all books have the field)
*   After validation passes, it suggests clicking the **"Review Migration"** handoff button

> **Note:** The "Review Migration" button appears after every agent response because handoffs are always visible. The agent should only _suggest_ clicking it after the migration is fully validated.

---

## Part 4 - Orchestration Patterns with Subagents (25 min)

**Objective:** Learn advanced subagent orchestration patterns from the [VS Code Subagents documentation](https://code.visualstudio.com/docs/copilot/agents/subagents#_orchestration-patterns): the **Coordinator and Worker** pattern for complex development workflows, and **Multi-perspective code review** for comprehensive quality analysis.

> **What is a subagent?** A subagent is an independent AI agent that performs focused work (research, analysis, code changes) and reports results back to the calling agent. The calling agent decides when context isolation helps, spawns a subagent with only the relevant subtask, and receives a summary back. Subagents appear as collapsible tool calls in the chat.

> **What makes an agent a subagent?** Any custom agent file can act as a subagent. It becomes one when a coordinator agent lists it in its `agents` property and includes the `agent` tool. The coordinator can then spawn workers mid-conversation to handle sub-tasks autonomously.

### Exercise 4.0 - Configure a Custom Agent File Location (2 min)

Parts 1-3 placed all agents in `.github/agents/`. To keep Part 4 agents separate, you will register a **subfolder** as an additional agent file location using the [`chat.agentFilesLocations`](https://code.visualstudio.com/docs/copilot/customization/custom-agents#_custom-agent-file-locations) (**Chat: Agent Files Locations**) setting. VS Code discovers `.agent.md` files from all configured locations, so agents in the subfolder work alongside the ones from Parts 1-3.

> **Reference:** [Custom agent file locations](https://code.visualstudio.com/docs/copilot/customization/custom-agents#_custom-agent-file-locations)

1.  Open **Settings** (`Ctrl+,`) and search for `chat.agentFilesLocations`.
2.  Click **Add Item** and enter:
3.  Save the setting. Your workspace `.vscode/settings.json` should now include:
4.  Create the folder: right-click `.github/agents/` in the Explorer and select **New Folder**, name it `feature-builder`.

> **Why a separate folder?** This keeps the coordinator and worker agents organized together, separate from the handoff agents in Parts 1-3. It also demonstrates how teams can maintain multiple agent folders for different workflows. The `FB` prefix on agent names provides an additional safeguard against naming conflicts.

All Part 4 agents will be created in this new `.github/agents/feature-builder/` folder:

```
.github/agents/
├── Planner.agent.md              ← Part 1 (handoff chain)
├── Implementer.agent.md          ← Part 2 (handoff chain)
├── Reviewer.agent.md             ← Part 2 (handoff chain)
└── feature-builder/              ← Part 4 (registered via chat.agentFilesLocations)
    ├── Feature-Builder.agent.md  ← 4A coordinator
    ├── FB-Planner.agent.md       ← 4A worker
    ├── FB-Architect.agent.md     ← 4A worker
    ├── FB-Implementer.agent.md   ← 4A worker
    ├── FB-QA.agent.md            ← 4A worker
    └── FB-Reviewer.agent.md      ← 4B coordinator
```

### Part 4A - Coordinator and Worker Pattern (15 min)

**Pattern Overview:** A coordinator agent manages the overall task and delegates subtasks to specialized worker subagents. Each worker has its own tailored set of tools and permissions. Planning and review workers need only read-only access, while the implementer needs edit capabilities. This keeps each agent focused on what it does best.

> **Reference:** [Coordinator and Worker pattern](https://code.visualstudio.com/docs/copilot/agents/subagents#_coordinator-and-worker-pattern)

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Feature Builder (Coordinator)                     │
│  tools: ['agent', 'read', 'search']                                  │
│  agents: ['FB Planner', 'FB Architect', 'FB Implementer', 'FB QA']   │
│                                                                      │
│  Workflow:                                                           │
│  1. FB Planner ──► 2. FB Architect ──► 3. FB Implementer ──► 4. FB QA│
│     └── feedback loop ──┘                    └── fix loop ──┘        │
│                                                                      │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────┐ ┌───────────┐    │
│  │ FB Planner │ │ FB Architect │ │ FB Implementer │ │ FB QA     │    │
│  │ (read)     │ │ (read)       │ │ (read+write)   │ │ (read)    │    │
│  │            │ │              │ │                │ │           │    │
│  └────────────┘ └──────────────┘ └────────────────┘ └───────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

#### Exercise 4A.1 - Create the Coordinator Agent

1.  Click the **gear icon** (⚙) > **Custom Agents** > **Create new custom agent**.
2.  Choose `.github/agents/feature-builder` as the location, enter `Feature-Builder` as the file name.
3.  Replace the content with:

```
---
description: Coordinate complex feature development using specialized worker agents.
name: Feature Builder
tools: ['agent', 'read', 'search']
agents: ['FB Planner', 'FB Architect', 'FB Implementer', 'FB QA']
---

# Feature Development Coordinator

You are a senior engineering manager who coordinates complex feature development by delegating to specialized worker agents.

## Coordination Workflow

For each feature request, orchestrate this workflow:

1. **Planning Phase**: Use the FB Planner agent to break down the feature into tasks and technical requirements.
2. **Architecture Review**: Use the FB Architect agent to validate the plan against codebase patterns and identify reusable components.
3. **Iterate**: If the architect identifies reusable patterns or issues, send feedback to the FB Planner to update the plan.
4. **Implementation Phase**: Use the FB Implementer agent to write the code for each validated task.
5. **Quality Assurance**: Use the FB QA agent to verify the implementation meets requirements and passes tests.
6. **Fix Loop**: If FB QA finds issues, use the FB Implementer agent again to apply fixes.

Iterate between planning and architecture, and between review and implementation, until each phase converges.

## Rules

- Summarize what each worker agent accomplished before moving to the next phase
- Highlight any blockers or decisions that need user input
- Show the current status in the development pipeline clearly
- Never skip phases - each worker adds value to the final result
```

#### Exercise 4A.2 - Create the Worker Agents

Create four specialized worker agents in `.github/agents/feature-builder/`. Workers set `user-invocable: false` so they don't appear in the agents dropdown - they are only accessible as subagents through the coordinator. The **FB** prefix keeps them clearly separated from the handoff agents created in Parts 1-2.

**1\. FB Planner Worker** - Click ⚙ > **Custom Agents** > **Create new custom agent**, choose `.github/agents/feature-builder`, enter `FB-Planner`:

```
---
description: Break down feature requests into implementation tasks with technical requirements.
name: FB Planner
tools: ['read', 'search']
user-invocable: false
---

# Feature Planning Instructions

You are a technical lead who breaks down feature requests into detailed implementation tasks.

## Rules

1. Read existing code to understand current architecture before planning.
2. Create numbered implementation steps with clear acceptance criteria.
3. Specify APIs, data structures, and UI components needed.
4. Identify prerequisite tasks and external dependencies.
5. Flag potential complexity or integration challenges.
6. Incorporate feedback from the Plan Architect on reusable patterns.

## Output Format

- **Overview**: Feature summary and value proposition
- **Technical Requirements**: APIs, models, components needed
- **Implementation Tasks**: Numbered steps with acceptance criteria and complexity (Low/Medium/High)
- **Dependencies**: What must be completed first
- **Risks**: Potential blockers or complexity concerns
```

**2\. FB Architect Worker** - Create new custom agent in `.github/agents/feature-builder`, name `FB-Architect`:

```
---
description: Validate plans against codebase patterns and identify reusable components.
name: FB Architect
tools: ['read', 'search', 'search/codebase']
user-invocable: false
---

# Architecture Validation Instructions

You are a senior architect who ensures plans align with existing codebase patterns.

## Validation Checklist

1. **Reusability**: Can existing components, utilities, or patterns handle this?
2. **Consistency**: Does this follow established conventions (routes in `backend/routes/`, data in `backend/data/`, etc.)?
3. **Anti-Patterns**: Flag any steps that duplicate existing functionality.
4. **Maintainability**: Will this create technical debt?
5. **Security**: Any architectural security implications?

Provide specific feedback with file references so the FB Planner can update the plan.
```

**3\. FB Implementer Worker** - Create new custom agent in `.github/agents/feature-builder`, name `FB-Implementer`:

> **Tip:** Worker agents can pick a faster or more cost-effective model since they have a narrower focus. Here we specify lighter models as preferences.

```
---
description: Execute implementation tasks following validated plans.
name: FB Implementer
tools: ['edit/editFiles', 'read/terminalLastCommand', 'search', 'search/codebase']
user-invocable: false
model: ['Claude Haiku 4.5 (copilot)', 'Gemini 3 Flash (Preview) (copilot)']
---

# Implementation Instructions

You are a senior developer who executes validated implementation plans.

## Rules

1. Always start comments with "generated-by-copilot: "
2. Follow the plan step-by-step - don't skip or add unrequested features.
3. Create files in correct dependency order (models before controllers, backend before frontend).
4. Run tests after each logical group of changes.
5. Use the exact patterns identified by the FB Architect.

## Commands

- Backend tests: `npm run test:backend`
- E2E tests: `npm run build:frontend && npm run test:frontend`

Report any blocking issues back to the coordinator.
```

**4\. FB QA Worker** - Create new custom agent in `.github/agents/feature-builder`, name `FB-QA`:

```
---
description: Quality assurance testing and validation of implemented features.
name: FB QA
tools: ['read/terminalLastCommand', 'read', 'search']
user-invocable: false
---

# Quality Assurance Instructions

You are a senior QA engineer who validates implemented features.

## QA Process

1. **Functional Testing**: Run test suites and verify features work as specified.
2. **Integration Testing**: Check for regressions across the application.
3. **Code Review**: Verify implementation follows the plan and conventions.
4. **Security Spot-Check**: Basic input validation and auth checks.

## Commands

- Backend tests: `npm run test:backend`
- E2E tests: `npm run build:frontend && npm run test:frontend`

## Report Format

- **Status**: PASS / FAIL with summary
- **Test Results**: What passed and what failed
- **Issues Found**: Specific bugs or problems with file references
- **Recommendations**: Fixes needed before approval
```

#### Exercise 4A.3 - Test Coordinator Orchestration

1.  Select the **Feature Builder** agent from the dropdown.
2.  Enter this prompt:

> "Add a GET /api/books/stats endpoint that returns the total number of books and the number of favorited books. Use the full coordinator workflow: plan it, validate the architecture, implement it, and run QA."

**Verify:**

*   The Feature Builder coordinates between all four worker agents
*   The FB Planner produces a task breakdown
*   The FB Architect validates the plan against existing code
*   The FB Implementer writes the code
*   The FB QA worker runs tests and validates the result
*   If FB QA finds issues, the coordinator sends the FB Implementer back to fix them
*   Worker agents do **not** appear in the agents dropdown (they have `user-invocable: false`)

> **Key difference from handoffs:** With handoffs (Parts 1-3), you manually click a button to switch between agents in separate chat turns. With the Coordinator and Worker pattern, the coordinator agent **automatically** delegates to workers within a single conversation - no manual switching needed.

---

### Part 4B - Multi-perspective Code Review (10 min)

**Pattern Overview:** Code review benefits from multiple perspectives. A single pass often misses problems that become obvious through a different lens. This pattern uses subagents to run each review perspective **in parallel**, then synthesizes the findings. Each subagent approaches the code fresh, without being anchored by what other perspectives found.

> **Reference:** [Multi-perspective code review](https://code.visualstudio.com/docs/copilot/agents/subagents#_multiperspective-code-review)

```
┌──────────────────────────────────────────────────────────────┐
│                  FB Reviewer (Coordinator)                   │
│  tools: ['agent', 'read', 'search']                          │
│                                                              │
│  Runs in parallel:                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ Correctness  │ │ Code Quality │ │ Security     │          │
│  │ Reviewer     │ │ Reviewer     │ │ Reviewer     │          │
│  │ (subagent)   │ │ (subagent)   │ │ (subagent)   │          │
│  └──────────────┘ └──────────────┘ └──────────────┘          │
│  ┌──────────────┐                                            │
│  │ Architecture │    ──► Synthesize into prioritized report  │
│  │ Reviewer     │                                            │
│  │ (subagent)   │                                            │
│  └──────────────┘                                            │
└──────────────────────────────────────────────────────────────┘
```

> **Lightweight approach:** In this pattern, the coordinator shapes each subagent's focus area through its prompt. No additional agent files are needed - the subagents are anonymous and disposable. For more control, each perspective could be its own custom agent with specialized tool access (e.g., a security reviewer with a security-focused MCP server).

#### Exercise 4B.1 - Create the Multi-perspective Reviewer

1.  Click the **gear icon** (⚙) > **Custom Agents** > **Create new custom agent**.
2.  Choose `.github/agents/feature-builder`, enter `FB-Reviewer` as the file name.
3.  Replace the content with:

```
---
description: Comprehensive code review through multiple specialized perspectives run in parallel.
name: FB Reviewer
tools: ['agent', 'read', 'search', 'search/codebase']
---

# Multi-perspective Code Review

You review code through multiple perspectives simultaneously. Run each perspective as a parallel subagent so findings are independent and unbiased.

## Review Process

When asked to review code, run these subagents in parallel:

- **Correctness reviewer**: Logic errors, edge cases, type issues, off-by-one errors, null handling.
- **Code quality reviewer**: Readability, naming conventions, code duplication, maintainability.
- **Security reviewer**: Input validation, injection risks, data exposure, authentication/authorization gaps.
- **Architecture reviewer**: Codebase patterns, design consistency, structural alignment with existing conventions.

## Synthesis

After all subagents complete, synthesize findings into a prioritized summary:

1. **Consolidate**: Group similar issues found by multiple reviewers.
2. **Prioritize**: Rank as Critical / High / Medium / Low based on impact.
3. **Acknowledge positives**: Note what the code does well.
4. **Action items**: Provide specific, actionable fix recommendations.

## Output Format

- **Executive Summary**: One-line overall assessment (APPROVE / REQUEST CHANGES)
- **Critical Issues**: Must fix before merging (table with Severity, File, Line, Issue, Suggestion)
- **Improvements**: Nice-to-have enhancements
- **Positive Highlights**: Things done well
- **Next Steps**: Recommended actions
```

#### Exercise 4B.2 - Test Multi-perspective Review

> **Prerequisite:** Complete Exercise 4A.3 first so you have a `/api/books/stats` endpoint to review.

1.  Switch to the **FB Reviewer** agent and ask:

> "Review the /api/books/stats endpoint code that was just implemented. Run all review perspectives in parallel."

**Verify:**

*   The FB Reviewer spawns "multiple subagent" perspectives **in parallel** (you'll see multiple collapsible subagent tool calls)
*   Each subagent focuses only on its area (security finds auth issues, quality finds naming issues, etc.)
*   The findings are independent - one perspective doesn't influence another
*   The final report synthesizes and prioritizes findings across all perspectives
*   Both problems and positive aspects are highlighted

#### Exercise 4B.3 - Compare Single vs Multi-perspective Review

1.  Use the original **Reviewer** agent (from Part 2) to review the same code:

> "Review the code changes that were just implemented."

1.  Compare the results side by side:

| Aspect | Single Reviewer (Part 2) | FB Reviewer (Part 4B) |
| --- | --- | --- |
| **Perspectives** | One pass, general feedback | Four parallel specialized passes |
| **Bias** | Later findings influenced by earlier ones | Each perspective is independent |
| **Depth** | Broader but shallower | Deeper in each focus area |
| **Agent files needed** | 1 agent file | 1 agent file (lightweight approach) |
| **Best for** | Quick reviews, small changes | Critical features, security-sensitive code |

**Verify:**

*   The multi-perspective approach catches issues the single reviewer missed
*   Different perspectives provide complementary, non-overlapping insights

---

## Part 5 - Visibility and Organization (5 min)

**Objective:** Learn how to view, hide, and debug custom agents using the VS Code UI and diagnostics tools.

### Exercise 5.1 - View All Custom Agents

1.  Open the **Agents** dropdown in the Chat view.
2.  Verify that user-invocable agents appear: **Planner**, **Implementer**, **Reviewer**, **Database Migrator**, **Feature Builder**, **FB Reviewer**.
3.  Verify that worker-only agents do **not** appear: FB Planner, FB Architect, FB Implementer, FB QA.
4.  Select **Configure Custom Agents** to see the full list with source locations. Notice Part 4 agents show `.github/agents/feature-builder/` as their source.

### Exercise 5.2 - Understand user-invocable vs disable-model-invocation

Two frontmatter properties control agent visibility:

| Property | Default | Effect |
| --- | --- | --- |
| `user-invocable` | `true` | Controls whether agent appears in the Agents dropdown |
| `disable-model-invocation` | `false` | Prevents other agents from invoking it as a subagent |

Common combinations:

*   **User-facing agent**: `user-invocable: true` (default) - appears in dropdown, can be used as subagent
*   **Worker-only agent**: `user-invocable: false` - hidden from dropdown, only accessible as subagent
*   **User-only agent**: `disable-model-invocation: true` - in dropdown but cannot be auto-invoked by other agents

> **Note:** Explicitly listing an agent in the `agents` array overrides `disable-model-invocation: true`. This lets you create agents protected from general subagent use but still accessible to specific coordinators.

### Exercise 5.3 - Review the Complete Agent Map

At this point you have agents organized into three patterns:

**Handoff Chain (Parts 1-3):** User manually switches between agents via buttons

```
                         Handoff                                     Handoff
  ┌──────────┐    "Start Implementation"   ┌──────────────┐   "Request Code Review"    ┌──────────┐
  │ Planner  │ ──────────────────────────> │ Implementer  │ ──────────────────────────>│ Reviewer │
  │ (read)   │                             │ (read+write) │ <──────────────────────────│ (read)   │
  └──────────┘                             └──────────────┘    "Fix Review Findings"   └──────────┘
```

**Coordinator & Workers (Part 4A):** Coordinator auto-delegates to workers (see [Part 4A diagram](#part-4a---coordinator-and-worker-pattern-15-min))

```
  ┌───────────────────────────────────────────────────────────────┐
  │                 Feature Builder (Coordinator)                 │
  │                                                               │
  │  ┌────────────┐ ┌──────────────┐ ┌───────────────┐ ┌────────┐ │
  │  │ FB Planner │ │ FB Architect │ │FB Implementer │ │ FB QA  │ │
  │  │  (read)    │ │   (read)     │ │   (write)     │ │ (read) │ │
  │  └────────────┘ └──────────────┘ └───────────────┘ └────────┘ │
  └───────────────────────────────────────────────────────────────┘
```

**Multi-perspective Reviewer (Part 4B):** Spawns anonymous parallel subagents (see [Part 4B diagram](#part-4b---multi-perspective-code-review-10-min))

```
  ┌───────────────────────────────────────────────────────────────┐
  │                    FB Reviewer                                │
  │                                                               │
  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
  │  │Correctness │ │  Quality   │ │  Security  │ │Architecture│  │
  │  │ (subagent) │ │ (subagent) │ │ (subagent) │ │ (subagent) │  │
  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
  └───────────────────────────────────────────────────────────────┘
```

### Exercise 5.4 - Use Chat Customization Diagnostics

1.  Right-click in the Chat view and select **Diagnostics**.
2.  Review the loaded custom agents, their source files, and any configuration errors.
3.  Check that all agents are listed with their correct tool configurations and `user-invocable` settings.

### Exercise 5.5 - Understand How Agents Feed into Hooks

The agents you created in this lab become the foundation for the lifecycle hooks you will build in the [Hooks lab](02-hooks-exercise.md). Here is how they connect:

```
┌─────────────────────────────────────────────────────────────┐
│               Custom Agents (this lab)                      │
│                                                             │
│  Planner        →  read-only planning, no file edits        │
│  Implementer    →  edits files, runs tests                  │
│  Reviewer       →  reviews code, produces reports           │
│  Feature Builder → coordinates workers automatically        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Agent Hooks (next lab)                        │
│                                                             │
│  PreToolUse     →  block dangerous commands before they run │
│  PostToolUse    →  auto-format code after agent edits       │
│  SessionStart   →  inject context when an agent starts      │
│  Stop           →  generate reports when agent finishes     │
│                                                             │
│  Hooks can be scoped to specific agents:                    │
│  • Implementer gets auto-format and security hooks          │
│  • Feature Builder gets audit and reporting hooks           │
│  • Planner needs no hooks (read-only, no risk)              │
└─────────────────────────────────────────────────────────────┘
```

Custom agents define **who does what with which tools**; hooks add **deterministic automation around agent actions** - formatting, security gates, audit trails, and context injection that run as code, not AI.

---

## Bonus Challenges

**Objective:** Apply what you learned to build more advanced agents covering API design, multi-model fallback, and a full 4-agent development pipeline.

### Challenge 1 - API Design Agent (15 min)

Create an agent that specializes in REST API design. It analyzes existing endpoints, suggests improvements following REST best practices, produces OpenAPI/Swagger-compatible documentation, and hands off to the Implementer for execution.

#### Step 1 - Create the Agent File

1.  Click the **gear icon** (⚙) > **Custom Agents** > **Create new custom agent**.
2.  Choose `.github/agents`, enter `Api-Designer` as the file name.
3.  Replace the content with:

```
---
description: Analyze REST API endpoints, suggest improvements, and produce OpenAPI documentation.
name: API Designer
tools: ['search', 'search/codebase', 'search/usages', 'web/fetch']
model: ['Claude Sonnet 4', 'GPT-4o']
handoffs:
  - label: Implement API Changes
    agent: implementer
    prompt: Implement the API improvements and OpenAPI spec outlined above. Follow REST best practices.
    send: false
---

# REST API Design instructions

You are a senior API architect specializing in RESTful API design. You analyze existing APIs and produce actionable improvement plans with OpenAPI documentation.

Don't make any code edits, just analyze and document.

## Analysis Framework

For every API review, evaluate against these REST best practices:

1. **Resource naming** - Use plural nouns (`/books` not `/getBooks`), kebab-case for multi-word resources
2. **HTTP methods** - Correct verb usage (GET for reads, POST for creates, PUT/PATCH for updates, DELETE for removes)
3. **Status codes** - Appropriate HTTP status codes (201 Created, 204 No Content, 400 Bad Request, 404 Not Found, etc.)
4. **Pagination** - All list endpoints should support `?page=&limit=` with metadata (total, pages)
5. **Filtering & sorting** - Support query parameters for filtering (`?author=`) and sorting (`?sort=title`)
6. **Error responses** - Consistent error format with `{ error: { code, message, details } }`
7. **Versioning** - URL path (`/api/v1/`) or header-based versioning strategy
8. **HATEOAS** - Include links to related resources in responses
9. **Rate limiting** - Include `X-RateLimit-*` headers
10. **Authentication** - Proper use of Authorization header, no secrets in URLs

## Output Format

Produce two deliverables:

### 1. API Improvement Report

| Current | Issue | Recommendation | Priority |
| --- | --- | --- | --- |
| `GET /api/books` | No pagination | Add `?page=&limit=` with total count | High |

### 2. OpenAPI 3.0 Specification

Generate a valid OpenAPI 3.0 YAML spec covering all endpoints, including:
- `info`, `servers`, `paths`, `components/schemas`
- Request/response examples
- Authentication scheme (`bearerAuth`)
- Error response schemas
```

#### Step 2 - Test the API Design Agent

1.  Select the **API Designer** agent from the dropdown.
2.  Enter this prompt:

> "Analyze all the REST API endpoints in copilot-agent-and-mcp/backend/routes/index.js. Evaluate them against REST best practices and produce an improvement report and a complete OpenAPI 3.0 spec."

**Verify:**

*   The agent reads `backend/routes/index.js` but does NOT modify any files
*   The improvement report identifies real issues (e.g., no pagination on `/api/books`, no input validation)
*   A valid OpenAPI 3.0 YAML spec is generated with paths, schemas, and examples
*   The "Implement API Changes" handoff button appears after the analysis

#### Step 3 - Test the Handoff

1.  Click the **"Implement API Changes"** button.
2.  Confirm you switch to the **Implementer** agent with the improvement context carried over.
3.  The Implementer should begin implementing the API changes based on the API Designer's report.

#### Step 4 - Extend with a Specific Feature Request

> "Design a new set of endpoints for a book reviews feature following RESTful conventions. Include: create a review, get reviews for a book, update a review, delete a review. Show the OpenAPI spec for just these new endpoints."

**Expected:** The agent produces endpoints like `POST /api/books/{id}/reviews`, `GET /api/books/{id}/reviews`, etc., with proper nesting, validation schemas, and status codes.

---

### Challenge 2 - Multi-Model Agent (5 min)

Create two agents - one concise, one detailed - with different `model` priority orders. Ask them the same question and observe how the agent instructions and model selection produce different response styles.

**How model selection works:** The `model` field accepts an ordered list (e.g., `['GPT-4o', 'Claude Sonnet 4']`). Copilot tries the first model in the list; if it's unavailable (e.g., not in your subscription), it falls back to the next one. This lets you control which model powers each agent.

**Expected outcomes:**

*   The **Quick Answer** agent (GPT-4o first) produces short, bullet-point responses under 200 words.
*   The **Detailed Answer** agent (Claude Sonnet 4 first) produces longer, well-structured responses with file references.
*   Each agent reports which model it used at the end of its response, confirming the `model` priority was respected.

#### Step 1 - Create Two Agents with Different Model Priorities

Create two agents that answer the same types of questions but prefer different models.

1.  Click the **gear icon** (⚙) > **Custom Agents** > **Create new custom agent**.
2.  Choose `.github/agents`, enter `Quick-Answer` as the file name.
3.  Replace the content with:

```
---
description: Fast answers using lighter models with premium fallback.
name: Quick Answer
tools: ['search', 'search/codebase']
model: ['GPT-4o', 'Claude Sonnet 4']
---

# Quick answer instructions

You are a fast, concise assistant. Give brief, direct answers.

## Rules

1. Keep answers under 200 words unless complexity demands more.
2. Use bullet points over paragraphs.
3. Include a one-line summary at the top of every answer.
4. At the END of every response, state which model you are.
```

1.  Now create a second agent. Click **Create new custom agent** again.
2.  Choose `.github/agents`, enter `Detailed-Answer` as the file name.
3.  Replace the content with:

```
---
description: Detailed answers that prefer premium models first.
name: Detailed Answer
tools: ['search', 'search/codebase', 'search/usages', 'web/fetch']
model: ['Claude Sonnet 4', 'GPT-4o']
---

# Detailed answer instructions

You are a thorough assistant. Provide well-sourced, detailed answers.

## Rules

1. Cite specific files and line numbers.
2. Structure answers with headings and bullet points.
3. At the END of every response, state which model you are.
```

#### Step 2 - Compare Model Behavior

Ask the **same question** to both agents and observe how the instructions shape the response:

> "What testing frameworks does this project use? List them with their config file locations."

1.  Select the **Detailed Answer** agent and send the prompt. Note the response length, structure, and which model is reported at the end.
2.  Open a **new chat**, select the **Quick Answer** agent, and send the exact same prompt.

**What to observe:**

*   **Quick Answer** should produce a short, bullet-point response (under 200 words) with a one-line summary at the top.
*   **Detailed Answer** should produce a longer response with headings, file references, and line numbers.
*   Both agents report which model they are at the end of the response - this confirms the `model` array is respected (first available model is used; if unavailable, it falls back to the next).
*   The **instructions** (not just the model) are the primary driver of response style differences.

#### Step 3 - Test Model Override via Handoff

Update the Planner agent to include a model in its handoff:

```
handoffs:
  - label: Start Implementation
    agent: implementer
    prompt: Implement the plan outlined above.
    send: false
    model: GPT-4o
```

This forces the handoff to use a specific model regardless of the target agent's `model` setting.

---

### Challenge 3 - Rewire the Pipeline for TDD (10 min)

In Part 2 you built a 3-agent chain: **Planner → Implementer → Reviewer**. Now you will rewire it into a 4-agent TDD pipeline by splicing the **Test Writer** (from Part 4) in between Planner and Implementer, and adding return-path handoffs. The key insight: **changing a pipeline is just editing** `**handoffs**` **fields** - no new agents needed.

**Before (Part 2):**

```
Planner  →  Implementer  →  Reviewer
```

**After (this challenge):**

```
Planner  →  Test Writer  →  Implementer  →  Reviewer
                                               ↓   ↓
                                     Fix Findings  Plan Next Feature
                                        ↓               ↓
                                   Implementer        Planner
```

#### Step 1 - Rewire the Handoffs

Open each agent file and update **only the** `**handoffs**` **section** in the frontmatter. The agent instructions stay the same.

**Planner** - change the handoff target from Implementer to Test Writer, and add a "Skip to Implementation" shortcut:

```
handoffs:
  - label: "Write Failing Tests"
    agent: Test Writer
    prompt: |
      Based on the plan above, write failing tests that define the expected behavior.
      Write backend Jest tests in backend/tests/ and E2E Cypress tests in frontend/cypress/e2e/.
      The tests should FAIL initially because the feature is not yet implemented.
      Run the tests to confirm they fail with meaningful error messages.
    send: false
  - label: "Skip to Implementation"
    agent: Implementer
    prompt: Implement the plan outlined above. Follow each step carefully and run tests after each change.
    send: false
```

**Test Writer** - add a handoff to the Implementer:

```
handoffs:
  - label: "Make Tests Pass"
    agent: Implementer
    prompt: |
      The failing tests above define the expected behavior.
      Implement the feature to make all tests pass.
      Do not modify the test files - only implement the production code.
    send: false
```

**Reviewer** - add a return-path handoff back to Planner so the pipeline can loop:

```
handoffs:
  - label: "Fix Review Findings"
    agent: Implementer
    prompt: |
      Fix the issues identified in the code review above.
      Address all Critical and High severity findings.
      Run tests after each fix to ensure nothing is broken.
    send: false
  - label: "Plan Next Feature"
    agent: Planner
    prompt: The previous feature is complete. What should we build next?
    send: false
```

> The Implementer's handoff to the Reviewer (`"Request Code Review"`) is already set from Part 2 - no change needed.

#### Step 2 - Test the Rewired Pipeline

1.  Select the **Planner** agent and enter:

> "Plan a book search feature for the Book Favorites app. Users should be able to search books by title and author using a query parameter. The search should be case-insensitive, support partial matches, and return paginated results."

1.  After the plan is generated, click **"Write Failing Tests"** → Test Writer creates tests that fail.
2.  Click **"Make Tests Pass"** → Implementer writes code until tests pass.
3.  Click **"Request Code Review"** → Reviewer produces a report.
4.  Based on the verdict:
    *   **APPROVE** → Click **"Plan Next Feature"** to loop back to Planner.
    *   **REQUEST CHANGES** → Click **"Fix Review Findings"** to loop back to Implementer.

**What to observe:**

*   You rewired the entire pipeline by editing only `handoffs` fields - no new agent files, no instruction changes.
*   The Test Writer slot creates a TDD workflow: tests are written before implementation code.
*   Return-path handoffs ("Fix Review Findings", "Plan Next Feature") let the pipeline loop without starting a new chat.

---

## Key Takeaways

| Concept | Key Learning |
| --- | --- |
| **Tool restrictions** | Limit tools to enforce least-privilege - planning agents don't need write access |
| **Handoffs** | Create guided workflows that transition between agents with one click |
| **Subagents** | Delegate specialized sub-tasks (like test writing) to focused agents |
| **Workspace agents** | Store in`.github/agents/` for team-wide sharing via version control |
| **AI generation** | Use`/create-agent` to bootstrap new agents from a description |
| **Security** | Review tool lists and instructions - agents should follow principle of least privilege |

## Reference

*   [VS Code Custom Agents Documentation](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
*   [Agent Tools](https://code.visualstudio.com/docs/copilot/agents/agent-tools)
*   [Subagents](https://code.visualstudio.com/docs/copilot/agents/subagents)
*   [Prompt Files](https://code.visualstudio.com/docs/copilot/customization/prompt-files)