# Lab: Agent Plugins in VS Code - Bundle and Share AI Customizations

> [!NOTE]  
> This lab uses the **Agent Plugins** feature (Preview) in VS Code to package the customizations you built across Labs 00-03 into a single distributable plugin. You will bundle instructions, agents, hooks, and skills for the **Book Favorites** app (`copilot-agent-and-mcp/`).
> 
> **Prerequisite:** Complete [Lab 00 (Custom Instructions)](00-custom-instructions-exercise.md), [Lab 01 (Custom Agents)](01-custom-agents-exercise.md), [Lab 02 (Hooks)](02-hooks-exercise.md), and [Lab 03 (Skills)](03-skills-exercise.md) first. This lab packages the artifacts you created there into a plugin.

## Overview

Agent plugins are **prepackaged bundles** of chat customizations that you can discover and install from plugin marketplaces. A single plugin can include any combination of [custom instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions), [agent skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills), [custom agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents), [hooks](https://code.visualstudio.com/docs/copilot/customization/hooks), and [MCP servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).

In previous labs you created these customizations by hand inside `.github/`. Plugins solve the **distribution** problem: how do you share those customizations with teammates, across projects, or with the community? Instead of copying files manually, you package them into a plugin with a `plugin.json` manifest, and anyone can install them with one click.

### How Labs 00-03 Flow into This Plugin

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      What You Built (Labs 00-03)                        │
│                                                                         │
│  Lab 00: Instructions     Lab 01: Agents        Lab 02: Hooks           │
│  ├─ copilot-instructions  ├─ Planner            ├─ auto-format hook     │
│  ├─ react.instructions    ├─ Implementer        └─ security guard hook  │
│  ├─ express.instructions  ├─ Reviewer                                   │
│  ├─ testing.instructions  └─ Database Migrator  Lab 03: Skills          │
│  ├─ css.instructions                            ├─ seeding-test-data    │
│  └─ security.instructions                       └─ generating-test-     │
│                                                      fixtures           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   bookfaves-qa-plugin (this lab)                        │
│                                                                         │
│  plugin.json                                                            │
│  ├─ skills/     → Data Seeder + Test Fixture Generator (Lab 03)         │
│  ├─ agents/     → QA Reviewer agent (new, built on Lab 01 patterns)     │
│  └─ hooks/      → Post-test logger hook (new, built on Lab 02 patterns) │
└─────────────────────────────────────────────────────────────────────────┘
```

### What Plugins Can Bundle

| Customization Type | Example from earlier labs | Plugin equivalent |
| --- | --- | --- |
| **Skills** | `.github/skills/seeding-test-data/` (Lab 03) | `skills/test-runner/SKILL.md` |
| **Agents** | `.github/agents/Reviewer.agent.md` (Lab 01) | `agents/qa-reviewer.agent.md` |
| **Hooks** | `.github/hooks/security.json` (Lab 02) | `hooks/post-test-logger.json` |
| **MCP Servers** | MCP server config | MCP config in plugin |
| **Slash Commands** | Prompt files | Prompt files in plugin |

### What You Will Learn

**Total Time: ~35 minutes**

| Part | Topic | Description | Time&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |
| --- | --- | --- | --- |
| Pre | [Prerequisites](#prerequisites) | VS Code, Copilot subscription, Labs 00-03 completed, app running | - |
| 1 | [Build a QA Plugin End-to-End](#part-1---build-a-qa-plugin-end-to-end-30-min) | Create `plugin.json`, bundle a skill + agent + hook, install and test locally | 30 min |
| 2 | [Configure Plugin Marketplaces](#part-2---configure-plugin-marketplaces-5-min) | Add custom marketplaces for team-wide or community plugin distribution | 5 min |
| | | **Total** | **35&nbsp;min** |

### Prerequisites

| Requirement | Details |
| --- | --- |
| **VS Code** | Insiders or latest Stable with GitHub Copilot extension (Agent Mode enabled) |
| **GitHub Copilot** | Copilot Pro, Pro+, Business, or Enterprise subscription |
| **Workspace** | This repository cloned locally |
| **App running** | `npm install && npm start` in `copilot-agent-and-mcp/` - backend on :4000, frontend on :5173 |
| **Labs 00-03** | Completed - you should have instruction files, agents (Planner, Implementer, Reviewer), hooks (format, security), and skills (Data Seeder, Test Fixture Generator) |

---

## Part 1 - Build a QA Plugin End-to-End (30 min)

**Objective:** Enable agent plugins, explore the default marketplace, then build a complete plugin from scratch. The plugin - `bookfaves-qa-plugin` - bundles a test-runner skill, a QA reviewer agent, and a post-test logging hook into a single distributable package. Each component builds on patterns you learned in Labs 00-03.

> **Why a plugin instead of `.github/` files?** The customizations you created in Labs 00-03 live inside the repo's `.github/` folder - they only work when that repo is open. A plugin makes the same capabilities **installable, shareable, and toggleable** - any developer who installs the plugin gets the skill, agent, and hook automatically, regardless of which repo they have open.

### Exercise 1.1 - Enable Agent Plugins and Explore the Marketplace

Agent plugins are in Preview and must be enabled before you can build or install them.

1.  Open **Settings** (`Ctrl+,`).
2.  Search for `chat.plugins.enabled`.
3.  Check the box to enable it.

Alternatively, add this to your `settings.json`:

```json
{
  "chat.plugins.enabled": true
}
```

Now explore what the community has published:

4.  Open the **Extensions view** (`Ctrl+Shift+X`).
5.  In the search field, enter `@agentPlugins` to filter for agent plugins.

    Alternatively, select the **More Actions** (three dots `···`) icon in the Extensions sidebar header, choose **Views** > **Agent Plugins**.

6.  Browse the list of available plugins from the default marketplaces.

> **Default marketplaces:** VS Code discovers plugins from the [copilot-plugins](https://github.com/github/copilot-plugins) and [awesome-copilot](https://github.com/github/awesome-copilot/) repositories by default.

7.  Select any plugin from the list to read its description and see what it bundles (skills, agents, hooks, etc.).
8.  Optionally, click **Install** on a plugin that interests you to see how installed plugins appear.

You can also manage installed plugins from the Chat view:

*   Click the **gear icon** (⚙) at the top of the Chat panel and select **Plugins**.
*   Installed plugins appear in the **Agent Plugins - Installed** view in the Extensions sidebar, where you can **enable**, **disable**, or **uninstall** them.

> **Security note:** Plugins can include hooks and MCP servers that **run code on your machine**. Always review the plugin contents and publisher before installing, especially for plugins from community marketplaces.

**Verify:**

*   `chat.plugins.enabled` is checked in settings
*   The `@agentPlugins` search returns a list of plugins from the default marketplaces
*   The **gear icon** menu in Chat includes a **Plugins** option

### Exercise 1.2 - Create the Plugin Directory and Metadata

Build your own plugin. Create a `bookfaves-qa-plugin/` folder at the workspace root with this target structure:

```
bookfaves-qa-plugin/
  plugin.json                        # Plugin metadata
  skills/
    test-runner/
      SKILL.md                       # Testing skill instructions
      scripts/
        run-tests.sh                 # Bash helper (Linux/macOS)
        run-tests.ps1                # PowerShell helper (Windows)
  agents/
    qa-reviewer.agent.md             # QA review agent (read-only)
  hooks/
    post-test-logger.json            # PostToolUse hook config
    scripts/
      log-test-results.js            # Hook script for logging
```

> **Compare with Labs 00-03:** In Lab 01, agents lived in `.github/agents/`. In Lab 02, hooks lived in `.github/hooks/`. In Lab 03, skills lived in `.github/skills/`. In a plugin, they all live under a single `bookfaves-qa-plugin/` root with the same subfolder conventions.

1.  Create the plugin root folder:

```bash
mkdir bookfaves-qa-plugin
```

2.  Create the `plugin.json` metadata file in `bookfaves-qa-plugin/`:

```json
{
  "name": "bookfaves-qa",
  "displayName": "Book Favorites QA Suite",
  "description": "Quality assurance plugin for the Book Favorites app. Bundles a test runner skill (Jest + Cypress), a QA reviewer agent, and a post-test logging hook.",
  "version": "1.0.0",
  "publisher": "bookfaves-team",
  "categories": ["testing", "quality"],
  "keywords": ["testing", "jest", "cypress", "code-review", "qa"]
}
```

> **About `plugin.json`:** This is the manifest that identifies the plugin to VS Code. The `name` field is the unique identifier, `displayName` is what users see in the plugin browser, and `description` helps users decide whether to install it.

### Exercise 1.3 - Add the Test Runner Skill

Create a test runner skill that teaches Copilot how to run and interpret tests for the Book Favorites app. This skill follows the same conventions you learned in [Lab 03](03-skills-exercise.md) - a `SKILL.md` with supporting scripts - and enforces the testing conventions from `testing.instructions.md` ([Lab 00, Exercise 2.3](00-custom-instructions-exercise.md#exercise-23---generate-testing-instructions)).

#### Step 1 - Register the plugin's skill location

1.  Open **Settings** (`Ctrl+,`) and search for `chat.agentSkillsLocations`.
2.  Click **Add Item** and enter `bookfaves-qa-plugin/skills`.
3.  Save the setting.

> **Why this step?** Just like in Lab 03 where you registered `.github/skills`, VS Code needs to know where to find the plugin's skills.

#### Step 2 - Create the skill using the gear icon

1.  In the Chat view, click the **gear icon** (⚙) > **Skills** > **Create new skill**.
2.  Choose `bookfaves-qa-plugin/skills` as the location.
3.  Enter `test-runner` as the skill folder name.
4.  Replace the generated `SKILL.md` content with:

```markdown
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
```

#### Step 3 - Add supporting scripts

Create `bookfaves-qa-plugin/skills/test-runner/scripts/run-tests.sh`:

```bash
#!/bin/bash
# generated-by-copilot: run all test suites sequentially
set -e

echo "=== Running Backend Tests ==="
cd copilot-agent-and-mcp
npm run test:backend

echo ""
echo "=== Running Frontend E2E Tests ==="
npm run build:frontend && npm run test:frontend

echo ""
echo "=== All Tests Complete ==="
```

Create `bookfaves-qa-plugin/skills/test-runner/scripts/run-tests.ps1`:

```powershell
# generated-by-copilot: run all test suites sequentially (Windows)
$ErrorActionPreference = "Stop"

Write-Host "=== Running Backend Tests ==="
Push-Location copilot-agent-and-mcp
npm run test:backend

Write-Host ""
Write-Host "=== Running Frontend E2E Tests ==="
npm run build:frontend; npm run test:frontend
Pop-Location

Write-Host ""
Write-Host "=== All Tests Complete ==="
```

### Exercise 1.4 - Add the QA Reviewer Agent

Create an agent that reviews test coverage and quality without modifying files. This follows the same `.agent.md` format from [Lab 01](01-custom-agents-exercise.md) and enforces the same read-only tool restrictions you used for the Planner and Reviewer agents.

1.  Create the `bookfaves-qa-plugin/agents/` directory.
2.  Create `bookfaves-qa-plugin/agents/qa-reviewer.agent.md`:

```markdown
---
description: Review test coverage and quality for the Book Favorites app. Analyzes test files, identifies gaps, and suggests improvements without modifying code.
name: QA Reviewer
tools: ['search', 'search/codebase', 'search/usages']
---

# QA Review Instructions

You are a senior QA engineer specializing in test quality. You review test suites for coverage, reliability, and best practices.

Don't make any code edits, just review and report findings.

## Rules

1. Always start comments with "generated-by-copilot: "
2. **NEVER edit, create, or delete files.** You are read-only.
3. Focus on the `copilot-agent-and-mcp/` directory for all analysis.
4. Backend tests are in `backend/tests/` (Jest).
5. Frontend E2E tests are in `cypress/e2e/` (Cypress).

## Review Checklist

1. **Coverage gaps** - routes/components without corresponding tests
2. **Edge cases** - missing boundary conditions, error paths, empty states
3. **Test isolation** - tests that depend on shared state or execution order
4. **Assertion quality** - generic assertions (`toBeTruthy()`) vs. specific ones
5. **Mock usage** - over-mocking that hides real bugs
6. **Naming** - test descriptions that clearly explain what is being tested
7. **DRY** - duplicated setup that should use `beforeEach` / helpers

## Output Format

- **Summary** - overall test health score (A/B/C/D/F) and one-line assessment
- **Coverage Map** - table showing each route/component and whether it has tests
- **Findings** - table with columns: Priority (P0-P3), File, Issue, Suggestion
- **Quick Wins** - top 3 easiest improvements with the highest impact
```

> **Compare with Lab 01:** This agent uses the same read-only pattern as the Planner and Reviewer agents - `tools` restricted to search operations, explicit "NEVER edit" rule in the body.

### Exercise 1.5 - Add the Post-Test Logger Hook

Create a hook that logs test execution results after test-related terminal commands. This follows the same `PostToolUse` hook pattern from [Lab 02, Exercise 1.2](02-hooks-exercise.md#exercise-12---create-the-auto-format-hook) - a `.json` config pointing to a Node.js script.

1.  Create the `bookfaves-qa-plugin/hooks/scripts/` directory.
2.  Create `bookfaves-qa-plugin/hooks/post-test-logger.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "type": "command",
        "command": "node bookfaves-qa-plugin/hooks/scripts/log-test-results.js",
        "timeout": 10
      }
    ]
  }
}
```

3.  Create `bookfaves-qa-plugin/hooks/scripts/log-test-results.js`:

```javascript
// generated-by-copilot: PostToolUse hook to log test execution results
// Only fires for terminal tool calls that contain test commands.
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
    const toolInput =
      typeof input.tool_input === 'string'
        ? JSON.parse(input.tool_input)
        : input.tool_input || {};

    // generated-by-copilot: only log for terminal commands that look like test runs
    const terminalTools = ['run_in_terminal', 'terminal', 'bash', 'shell'];
    if (!terminalTools.some((t) => toolName.toLowerCase().includes(t))) {
      process.exit(0);
    }

    const command = toolInput.command || toolInput.cmd || toolInput.input || '';
    const testPatterns = [/npm\s+run\s+test/i, /jest/i, /cypress/i, /vitest/i];

    if (!testPatterns.some((p) => p.test(command))) {
      process.exit(0);
    }

    // generated-by-copilot: log test execution with timestamp
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Test executed: ${command}\n`;
    process.stderr.write(logEntry);
  } catch (err) {
    // generated-by-copilot: non-blocking - log but don't fail the agent
    process.stderr.write(`Test log hook error: ${err.message}\n`);
    process.exit(0);
  }
});
```

> **Compare with Lab 02:** This hook follows the same pattern as the auto-format hook (Exercise 1.2) - reads stdin JSON, checks `tool_name`, and processes only relevant tool calls. The difference: this one filters for test commands instead of file edits.

### Exercise 1.6 - Verify the Plugin Structure

Confirm your plugin has the complete structure:

```
bookfaves-qa-plugin/
├── plugin.json                        # Plugin metadata
├── skills/
│   └── test-runner/
│       ├── SKILL.md                   # Testing skill instructions
│       └── scripts/
│           ├── run-tests.sh           # Bash helper (Linux/macOS)
│           └── run-tests.ps1          # PowerShell helper (Windows)
├── agents/
│   └── qa-reviewer.agent.md           # QA review agent (read-only)
└── hooks/
    ├── post-test-logger.json          # PostToolUse hook config
    └── scripts/
        └── log-test-results.js        # Hook script for logging
```

Run a quick check from the workspace root:

```powershell
Get-ChildItem -Recurse bookfaves-qa-plugin | Select-Object FullName
```

**Verify:**

*   `plugin.json` exists with valid JSON and includes `name`, `displayName`, and `description`
*   `skills/test-runner/SKILL.md` has valid YAML frontmatter with `name`, `description`, and `argument-hint`
*   `agents/qa-reviewer.agent.md` has valid YAML frontmatter with `name`, `description`, and `tools`
*   `hooks/post-test-logger.json` has a valid `hooks.PostToolUse` array

### Exercise 1.7 - Install and Test the Plugin Locally

Register your plugin as a local plugin so VS Code loads its customizations.

1.  Open **Settings** (`Ctrl+,`).
2.  Search for `chat.plugins.paths`.
3.  Click **Add Item**:
    *   **Key:** the absolute path to your `bookfaves-qa-plugin/` directory (e.g., `C:/Users/yourname/Desktop/WS-GHCP/WS-AgenticDevOpsCopilotDeepDive/src/bookfaves-qa-plugin`)
    *   **Value:** `true` (to enable it)

> **Note:** Use forward slashes in the path even on Windows. Adjust the path to match your actual workspace location.

Now verify each component of your plugin is active:

**Test the skill:**

1.  Open the Chat view.
2.  Type `/test-runner` and press Enter.
3.  Ask: "Run the backend tests for the Book Favorites app."
4.  Copilot should use the skill instructions and run `npm run test:backend` from the correct directory.

**Test the agent:**

1.  In the Chat view, check the **Agents** dropdown.
2.  The **QA Reviewer** agent should appear in the list (provided by the plugin).
3.  Select it and ask: "Review the test coverage for the Book Favorites app."
4.  The agent should analyze test files without modifying any code.

**Test the hook:**

1.  Use the default **Copilot** agent (Agent Mode).
2.  Ask: "Run `npm run test:backend` in the copilot-agent-and-mcp directory."
3.  Open the **Output** panel (`Ctrl+Shift+U`) and select **GitHub Copilot Chat Hooks**.
4.  Look for the `[PostToolUse]` log entry from the test logging hook.

**Verify:**

*   The `/test-runner` skill is available and loaded from the plugin
*   The **QA Reviewer** agent appears in the agents dropdown
*   The post-test hook fires when test commands are executed
*   All three components came from the plugin - not from `.github/` files

### Exercise 1.8 - Disable and Re-enable the Plugin

1.  Go to **Settings** > `chat.plugins.paths`.
2.  Change the value for your `bookfaves-qa-plugin` path from `true` to `false`.
3.  Verify: the **QA Reviewer** agent disappears from the dropdown, the `/test-runner` skill is no longer available, and the hook no longer fires.
4.  Change the value back to `true` and confirm everything reappears.

> **Tip:** This is how you toggle plugins on and off without uninstalling them - useful for debugging conflicts between plugin and local customizations.

### Exercise 1.9 - Review How All Four Layers Work Together

With the plugin installed alongside your Labs 00-03 customizations, you now have all four layers active simultaneously:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 1: Instructions (Lab 00)        Always-on conventions            │
│  copilot-instructions.md, react/express/testing/css/security            │
│  → Applied to ALL agents (both .github/ and plugin agents)             │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 2: Agents (Lab 01 + plugin)     Personas + tool restrictions     │
│  .github/agents/: Planner, Implementer, Reviewer, Feature Builder      │
│  plugin agents/: QA Reviewer (read-only test analysis)                  │
│  → Instructions auto-apply based on file patterns                      │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 3: Hooks (Lab 02 + plugin)      Deterministic automation         │
│  .github/hooks/: auto-format, security guard                            │
│  plugin hooks/: post-test logger                                        │
│  → All hooks fire regardless of source (global scope)                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 4: Skills (Lab 03 + plugin)     On-demand capabilities           │
│  .github/skills/: Data Seeder, Test Fixture Generator                   │
│  plugin skills/: test-runner                                            │
│  → Loaded when task matches description                                │
└─────────────────────────────────────────────────────────────────────────┘
```

**Test the full stack:**

1.  Select the **QA Reviewer** agent (from the plugin).
2.  Ask: "Review the test coverage for the Book Favorites app."
3.  Observe:
    *   The QA Reviewer agent is loaded from the plugin
    *   The `testing.instructions.md` conventions (Lab 00) are applied because the agent reads `.test.js` files
    *   The security guard hook (Lab 02) is still active in the background
    *   The post-test logger hook (plugin) fires if test commands are executed
    *   All four layers coexist without conflicts

---

## Part 2 - Configure Plugin Marketplaces (5 min)

**Objective:** Learn how to add custom plugin marketplaces beyond the defaults, including private team repositories.

### Exercise 2.1 - Add a Custom Marketplace

Plugin marketplaces are Git repositories that contain plugin definitions. You can reference them in several formats:

| Format | Example |
| --- | --- |
| **Shorthand** | `owner/repo` (public GitHub repos) |
| **HTTPS** | `https://github.com/owner/repo.git` |
| **SSH** | `git@github.com:owner/repo.git` |
| **Local** | `file:///path/to/marketplace` |

1.  Open **Settings** (`Ctrl+,`).
2.  Search for `chat.plugins.marketplaces`.
3.  Click **Add Item** and enter a marketplace reference.

```json
{
  "chat.plugins.marketplaces": [
    "github/copilot-plugins",
    "github/awesome-copilot"
  ]
}
```

> **Private repositories:** If a public lookup fails, VS Code falls back to cloning the repository directly. Private repos work as long as your Git credentials have access.

4.  After adding a marketplace, browse the **Extensions view** with `@agentPlugins` to see plugins from the new marketplace.

### Exercise 2.2 - Understand Plugin vs Local Customization Precedence

Plugins work **alongside** your locally defined customizations. When both exist:

| Aspect | Local (`.github/`) | Plugin |
| --- | --- | --- |
| **Discovery** | Automatic from `.github/` folders | Requires `chat.plugins.paths` or marketplace install |
| **Toggle** | Rename files to disable | Set path value to `false` |
| **Scope** | This workspace only | Any workspace where plugin is installed |
| **Sharing** | Copy files manually or commit to repo | Install from marketplace with one click |
| **Conflicts** | N/A | Both sources appear in menus; user picks which to use |

> **Key insight:** The customizations in `.github/` (Labs 00-03) are **workspace-scoped** - they only work when this repo is open. The plugin you built here is **portable** - install it in any workspace and the QA Reviewer, test-runner skill, and post-test logger are available immediately.

---

## Troubleshooting

| Issue | Solution |
| --- | --- |
| Plugin UI not visible | Verify `chat.plugins.enabled` is `true` in settings |
| `@agentPlugins` returns nothing | Check your network connection; VS Code needs to reach GitHub to list marketplace plugins |
| Local plugin not loading | Verify the path in `chat.plugins.paths` is correct, uses forward slashes, and the value is `true` |
| Plugin agent not in dropdown | Reload VS Code (`Ctrl+Shift+P` > **Developer: Reload Window**) after changing plugin settings |
| Plugin hook not firing | Check that the hook script path in the `.json` config is correct relative to the workspace root |
| Conflict with local customizations | Disable the plugin (`chat.plugins.paths` → `false`) to verify; plugin and local customizations should coexist |
| `plugin.json` errors | Validate the JSON syntax; ensure `name` and `displayName` fields are present |

---

## Key Takeaways

| Concept | Key Learning |
| --- | --- |
| **Plugins = distribution** | Plugins solve how to share agents, skills, hooks, and MCP servers as a single installable package |
| **`plugin.json`** | The manifest that identifies the plugin with metadata (name, description, version, publisher) |
| **Bundled customizations** | A plugin can contain any combination of skills, agents, hooks, MCP servers, and slash commands |
| **All four layers coexist** | Instructions (Lab 00) + agents (Lab 01) + hooks (Lab 02) + skills (Lab 03) + plugins all work together |
| **Marketplaces** | Git repositories that host plugin definitions; configurable via `chat.plugins.marketplaces` |
| **Local plugins** | Register plugins from disk via `chat.plugins.paths` for development and testing |
| **Enable/disable** | Toggle plugins on/off without uninstalling by setting path value to `true`/`false` |
| **Security** | Always review plugin contents before installing - hooks and MCP servers run code on your machine |

## What's Next

With all five lab exercises complete, you have built a full customization stack for GitHub Copilot:

| Lab | Layer | What you built |
| --- | --- | --- |
| **00** | Instructions | Coding conventions that Copilot follows automatically |
| **01** | Agents | Specialized AI personas with tool restrictions and handoffs |
| **02** | Hooks | Deterministic automation around agent actions |
| **03** | Skills | Reusable, on-demand capabilities with scripts and templates |
| **04** | Plugins | Distributable package that bundles skills, agents, and hooks |

## Reference

*   [VS Code Agent Plugins Documentation](https://code.visualstudio.com/docs/copilot/customization/agent-plugins)
*   [Customize AI for Your Project Guide](https://code.visualstudio.com/docs/copilot/guides/customize-copilot-guide)
*   [Agent Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
*   [Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
*   [Hooks](https://code.visualstudio.com/docs/copilot/customization/hooks)
*   [MCP Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
