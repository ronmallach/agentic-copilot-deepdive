# Lab: Agent Hooks in VS Code - Automate Workflows with Lifecycle Events

> \[!NOTE\]  
> This lab uses the **Agent Hooks** feature (Preview) in VS Code to execute custom shell commands at key lifecycle points during agent sessions. You will build hooks for the **Book Favorites** app (`copilot-agent-and-mcp/`).
> 
> **Prerequisite:** Complete the [Custom Agents lab](custom-agents-exercise.md) first. This lab builds on the agents you created there (Planner, Implementer, Reviewer, Feature Builder, and the FB worker agents).

## Overview

Hooks provide **deterministic, code-driven automation** that runs at specific points in an agent's lifecycle. Unlike instructions that guide behavior, hooks **execute your code** with guaranteed outcomes. Use hooks to enforce security policies, automate code quality, create audit trails, inject context, and control approvals.

### What You Will Learn

**Total Time: ~30 minutes**

| Part | Topic | Description | Time&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |
| --- | --- | --- | --- |
| Pre | [Prerequisites](#prerequisites) | VS Code, Copilot subscription, Node.js v18+, repo cloned, app running, Custom Agents lab completed | - |
| 1 | [Global Hooks: Format and Security](#part-1---global-hooks-format-and-security-15-min) | Create `PostToolUse` auto-format and `PreToolUse` security guard hooks that apply to all agents | 15 min |
| 2 | [Agent-Scoped Hooks](#part-2---agent-scoped-hooks-15-min) | Use `/create-hook` to generate hooks scoped to specific agents via the `hooks` frontmatter property | 15 min |
| | | **Total** | **30&nbsp;min** |

### Prerequisites

| Requirement | Details |
| --- | --- |
| **VS Code** | Insiders or latest Stable with GitHub Copilot extension (Agent Mode enabled) |
| **GitHub Copilot** | Copilot Pro, Pro+, Business, or Enterprise subscription |
| **Workspace** | This repository cloned locally |
| **Node.js** | v18 or later (for running hook scripts) |
| **App running** | `npm install && npm start` in `copilot-agent-and-mcp/` - backend on :4000, frontend on :5173 |
| **Custom Agents lab** | Completed - you should have Planner, Implementer, Reviewer, Feature Builder, and FB worker agents |

### Hook Lifecycle Quick Reference

| Event | When It Fires | Common Use Cases |
| --- | --- | --- |
| `SessionStart` | First prompt of a new session | Initialize resources, inject project context |
| `UserPromptSubmit` | User submits a prompt | Audit requests, inject system context |
| `PreToolUse` | Before agent invokes any tool | Block dangerous ops, require approval, modify input |
| `PostToolUse` | After tool completes successfully | Run formatters, log results, trigger follow-ups |
| `PreCompact` | Before context is compacted | Export context, save state |
| `SubagentStart` | Subagent is spawned | Track subagent usage, init resources |
| `SubagentStop` | Subagent completes | Aggregate results, cleanup |
| `Stop` | Agent session ends | Generate reports, cleanup, send notifications |

---

## Part 1 - Global Hooks: Format and Security (15 min)

**Objective:** Create two global hooks that apply to all agents: a `PostToolUse` hook that auto-formats code after every edit, and a `PreToolUse` hook that blocks dangerous terminal commands.

### Exercise 1.1 - Create the Hooks Folder and Install Prettier

Create the hooks directory using the **gear icon** in the Chat view:

*   Click the **gear icon** (⚙) at the top of the Chat panel
*   Select **Hooks** from the menu
*   This creates the `.github/hooks/` directory if it doesn't exist

Install Prettier from the `copilot-agent-and-mcp/` directory:

```
npm install --save-dev prettier
```

1.  Create a Prettier config named `.prettierrc` in the **workspace root** (i.e., the `src/` folder, **not** inside `copilot-agent-and-mcp/`):

```
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Exercise 1.2 - Create the Auto-Format Hook

1.  Click the **gear icon** (⚙) in the Chat view, select **Hooks**.
2.  From the lifecycle event dropdown, select **Post-Tool Use** ("Executed after a tool completes execution successfully").
3.  This creates a new hook file - name it `format.json`:

> **Note:** Hook input (including the file path) is delivered via **stdin as JSON**, not as an environment variable. That's why we use a Node.js script (`format-on-save.js`) to parse the input and extract the `filePath` from the tool's input. This approach works reliably across all platforms (Windows, macOS, Linux).

First, create the script `.github/hooks/scripts/format-on-save.js`:

```javascript
// generated-by-copilot: PostToolUse hook script to auto-format files with Prettier
// Reads the tool input from stdin (JSON) and runs Prettier on the edited file.
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
    if (!filePath) {
      // generated-by-copilot: no file path in tool input, skip formatting
      process.exit(0);
    }

    // generated-by-copilot: only format known file types
    const formattable = /\.(js|ts|jsx|tsx|json|css|html|md|yaml|yml)$/i;
    if (!formattable.test(filePath)) {
      process.exit(0);
    }

    execSync(`npx prettier --write "${filePath}"`, { stdio: 'inherit' });
  } catch (err) {
    // generated-by-copilot: non-blocking - log but don't fail the agent
    process.stderr.write(`Format hook error: ${err.message}\n`);
    process.exit(0);
  }
});
```

Then create the hook config `format.json`:

```
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

### Exercise 1.3 - Test with the Implementer Agent

> **Why the Implementer?** We're using the Implementer agent here simply to trigger a file edit, but `format.json` is a **global hook** (it lives in `.github/hooks/`), so it fires for **every** agent, not just the Implementer. You'll create an agent-scoped version of this hook in Exercise 2.2.

1.  Select the **Implementer** agent (from the Custom Agents lab).
2.  Ask it to create a deliberately messy file:

> "Create a new file called `backend/test-format.js` with a function that uses inconsistent formatting: mixed tabs and spaces, double quotes in some places and single quotes in others, and missing semicolons."

1.  After the agent creates the file, check whether Prettier ran automatically.

**Verify:**

*   In the Chat panel output, look for **"Updated test-format.js, received a warning"**. This confirms the PostToolUse hook fired and Prettier reformatted the file.
*   Open the **Output** panel (`Ctrl+Shift+U`), then select **GitHub Copilot Chat Hooks** from the dropdown in the top-right corner. You should see output similar to:

```
[PostToolUse] Executing 1 hook(s)
[PostToolUse] Running: {"command":"node .github/hooks/scripts/format-on-save.js", ...}
[PostToolUse] Input: {"hook_event_name":"PostToolUse","tool_name":"replace_string_in_file", ...}
[PostToolUse] Completed (Success) in 2474ms
[PostToolUse] Output: copilot-agent-and-mcp/backend/test-format.js 54ms
```

> **Tip:** The `Completed (Success)` status and the Prettier output line (e.g., `test-format.js 54ms`) confirm the hook ran and formatted the file. A `[HookExecutor] Hook command returned non-JSON output` warning is normal - it just means the script returned text instead of JSON, which is fine for PostToolUse hooks.

*   Open `backend/test-format.js` and confirm it is formatted according to `.prettierrc` (single quotes, semicolons, 2-space indentation).
*   The hook runs regardless of which agent is active (it's global).

1.  Clean up: `rm backend/test-format.js`

### Exercise 1.4 - Create the Security Guard Hook

**Objective:** Create a `PreToolUse` hook that **blocks dangerous terminal commands before they execute**. This is fundamentally different from the format hook in Exercises 1.1-1.3:

|   | Format hook (Ex 1.2) | Security guard (Ex 1.4) |
| --- | --- | --- |
| **Event** | `PostToolUse` - runs _after_ a tool completes | `PreToolUse` - runs _before_ a tool executes |
| **Can block actions?** | No - the edit already happened | Yes - returns `permissionDecision: "deny"` to stop it |
| **Purpose** | Code quality (auto-format) | Security enforcement (block destructive commands) |
| **Output format** | Plain text (non-JSON is fine) | Must return structured JSON with permission decisions |

Create `.github/hooks/scripts/security-guard.js`:

```javascript
// generated-by-copilot: security guard hook script
// This PreToolUse hook intercepts terminal commands before they execute.
// It checks the command against dangerous patterns and blocks matches.
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

    // generated-by-copilot: only check terminal/command execution tools
    const terminalTools = ['run_in_terminal', 'terminal', 'bash', 'shell'];
    if (!terminalTools.some((t) => toolName.toLowerCase().includes(t))) {
      process.stdout.write(JSON.stringify({ continue: true }));
      process.exit(0);
    }

    const command = toolInput.command || toolInput.cmd || toolInput.input || '';

    // generated-by-copilot: define blocked patterns
    const blockedPatterns = [
      /rm\s+-rf\s+\//i,
      /rm\s+-rf\s+\*/i,
      /DROP\s+TABLE/i,
      /DROP\s+DATABASE/i,
      /format\s+[a-z]:/i,
      /npm\s+publish/i,
      /git\s+push\s+.*--force/i,
      /curl\s+.*\|\s*(bash|sh)/i,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(command)) {
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: `BLOCKED: Command matches dangerous pattern "${pattern.source}". Command: "${command}"`,
            },
          })
        );
        process.exit(0);
      }
    }

    // generated-by-copilot: command is safe
    process.stdout.write(JSON.stringify({ continue: true }));
    process.exit(0);
  } catch (err) {
    process.stderr.write(`Security guard error: ${err.message}\n`);
    process.exit(1);
  }
});
```

Create the hook config `.github/hooks/security.json`:

```
{
  "hooks": {
    "PreToolUse": [
      {
        "type": "command",
        "command": "node .github/hooks/scripts/security-guard.js",
        "timeout": 10
      }
    ]
  }
}
```

### Exercise 1.5 - Test the Security Guard

> **Safety note:** Never test with actually destructive commands like `rm -rf /`. Use commands that match the blocked patterns but are **harmless if the hook fails** - such as `npm publish` (requires auth) or `git push --force` (requires a remote).

> **Important:** Use the default **Copilot** agent (Agent Mode) for this test - **not** the Implementer. The Implementer agent's `tools` list does not include terminal tools, so it cannot run commands and the PreToolUse hook would never fire.

1.  Switch to the default **Copilot** agent (select "Agent" from the mode dropdown at the top of the Chat panel).
2.  Try a blocked command:

> "Run this command in the terminal: npm publish"

**Expected:** The hook blocks the command (matches the `npm\s+publish` pattern).

1.  Try another blocked pattern:

> "Run this command in the terminal: git push origin main --force"

**Expected:** The hook blocks this too (matches the `git\s+push\s+.*--force` pattern).

1.  Try a safe command:

> "Run `npm run test:backend` in the terminal"

**Expected:** The command runs normally.

**Verify:**

*   Dangerous commands are blocked before execution
*   The agent receives a clear reason why the command was blocked
*   Safe commands execute without interference
*   Open the **Output** panel (`Ctrl+Shift+U`) and select **GitHub Copilot Chat Hooks**. For a **blocked** command you should see:

```
[PreToolUse] Executing 1 hook(s)
[PreToolUse] Running: {"command":"node .github/hooks/scripts/security-guard.js", ...}
[PreToolUse] Completed (Success) in 150ms
[PreToolUse] Output: {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOCKED: Command matches dangerous pattern ..."}}
```

For a **safe** command (e.g., `npm run test:backend`):

```
[PreToolUse] Executing 1 hook(s)
[PreToolUse] Completed (Success) in 120ms
[PreToolUse] Output: {"continue":true}
```

> **Tip: Disabling hooks between exercises.** To temporarily disable a global hook without deleting it, rename the file - e.g., `format.json` → `format.json.disabled`. VS Code only loads `.json` files from `.github/hooks/`. Rename it back when you need it again.

---

## Part 2 - Agent-Scoped Hooks (15 min)

**Objective:** Add hooks directly to custom agent files using the `hooks` frontmatter property. These hooks only run when that specific agent is active - other agents are unaffected. You will enhance agents from the Custom Agents lab.

> **Reference:** [Agent with scoped hooks](https://code.visualstudio.com/docs/copilot/customization/custom-agents#_examples).

### Exercise 2.1 - Enable Agent-Scoped Hooks

Open VS Code settings (`Ctrl+,`) and enable below. This can also be done from Settings > Chat: Use Custom Agent Hooks.

```
{
  "chat.useCustomAgentHooks": true
}
```

### Exercise 2.2 - Generate and Wire a PreToolUse Hook for the FB Implementer

The **FB Implementer** worker (from Part 4A of the Custom Agents lab) is invoked by the Feature Builder coordinator. It should only modify source code, not production data. Use `/create-hook` to generate the hook **and** wire it directly into the agent - all in one step.

1.  Open the Chat view and type:

```
/create-hook
```

1.  When prompted, use this prompt - it tells `/create-hook` to create an **agent-scoped** hook (not a global one):

> "I need an agent-scoped hook, NOT a global hook. Create a PreToolUse hook that is scoped to the FB Implementer agent at `.github/agents/feature-builder/FB-Implementer.agent.md`. Add the `hooks` property directly in the agent's YAML frontmatter. The hook should block file edit tools from modifying any files in the backend/data/ directory. If a file path contains backend/data/, return permissionDecision deny with a message saying to use the Database Migrator agent instead. Allow all other file edits. Place the hook script in `.github/hooks/scripts/`. Do NOT create a global `.json` config file in `.github/hooks/`. Important: In the hook script, `tool_input` may arrive as a JSON string but use `typeof` to check and `JSON.parse()` it if needed before extracting `filePath`. Also normalize Windows backslashes to forward slashes (using `replace(/\\\\/g, '/')`) before matching against `backend/data/`."

Review what `/create-hook` generates. Verify:

*   A `.js` script is created in `.github/hooks/scripts/` (e.g., `fb-implementer-data-guard.js`)
*   The FB Implementer's `.agent.md` frontmatter has a `hooks` section referencing the script
*   There is **no** `.json` config file in `.github/hooks/` (which would make it global)
*   The script checks the file path against `backend/data/` and returns `permissionDecision: "deny"` for matches

Accept the changes. The resulting frontmatter should look similar to:

```
---
description: Execute implementation tasks following validated plans.
name: FB Implementer
tools: ['edit/editFiles', 'read/terminalLastCommand', 'search', 'search/codebase']
user-invocable: false
model: ['Claude Haiku 4.5 (copilot)', 'Gemini 3 Flash (Preview) (copilot)']
hooks:
  PreToolUse:
    - type: command
      command: "node .github/hooks/scripts/fb-implementer-data-guard.js"
      timeout: 5
---
```

> **If** `/create-hook` **also created a global** `'.json'` **config:** then delete it  as  `.json` file in `.github/hooks/` would make the hook fire for ALL agents, defeating the agent-scoped intent.

### Exercise 2.3 - Test the Agent-Scoped Data Protection Hook

> **Prerequisite:** Ensure the FB Implementer agent has `user-invocable: true` in its frontmatter (`.github/agents/feature-builder/FB-Implementer.agent.md`) so you can select it directly from the agent dropdown.

1.  Select the **FB Implementer** agent directly from the agent dropdown.
2.  Ask it to edit a protected data file:

> "Add a new book to backend/data/books.json with title 'Test Book'."

The hook should block the edit, with a message like:

> "FB Implementer cannot modify backend/data/ files. Please use the Database Migrator agent for schema changes and data modifications."

Now switch to the default **Copilot** agent (Agent Mode) and try the same prompt. It should **not** be blocked, confirming the hook is agent-scoped.

**Verify:**

*   The FB Implementer's data protection hook blocks edits to `backend/data/`
*   The block message directs users to the **Database Migrator** agent
*   Other agents (e.g., default Copilot) are **NOT** blocked from `backend/data/` - the hook is agent-scoped
*   Check the **GitHub Copilot Chat Hooks** output channel for execution logs

> **Clean up:** After testing, disable the agent-scoped hook by removing the `hooks` section from the FB Implementer's frontmatter (`.github/agents/feature-builder/FB-Implementer.agent.md`). You can also set `user-invocable` back to `false` if desired.

### Exercise 2.4 - Compare Global vs Agent-Scoped Hooks

| Aspect | Global hooks (`.github/hooks/`) | Agent-scoped hooks (`hooks` in frontmatter) |
| --- | --- | --- |
| **Scope** | Run for all agents | Run only when the specific agent is active |
| **Location** | Separate `.json` files in `.github/hooks/` | `hooks` property in the agent's `.agent.md` frontmatter |
| **Use case** | Organization-wide policies (security, audit) | Agent-specific behavior (protect data on FB Implementer) |
| **Setting required** | None | `chat.useCustomAgentHooks: true` |

### Exercise 2.5 - Explore the Hooks UI

1.  Click the **gear icon** (⚙) at the top of the Chat panel, select **Hooks**.
2.  The UI shows a list of **lifecycle events** with a count indicator next to each (e.g., "Pre-Tool Use (1)") showing how many hooks are registered for that event. 
3.  Click on a lifecycle event to see the hooks registered under it and their configuration.

> **Note:** The Hooks UI shows which events have hooks registered and lets you create new ones. It does **not** provide toggle switches to enable/disable individual hooks. To disable a global hook, rename its `.json` file (e.g., `security.json` → `security.json.disabled`). To disable an agent-scoped hook, remove the `hooks` section from the agent's frontmatter.

### Exercise 2.6 - Understand How Instructions, Agents, and Hooks Feed into Skills

The three layers you have built across the previous labs - instructions, agents, and hooks - form the foundation for the agent skills you will create in the [Skills lab](03-skills-exercise.md). Here is how they connect:

```
┌─────────────────────────────────────────────────────────────┐
│               Custom Instructions (Lab 00)                  │
│                                                             │
│  copilot-instructions.md   →   Project-wide conventions     │
│  react.instructions.md     →   Component patterns           │
│  express.instructions.md   →   API route conventions        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Custom Agents (Lab 01)                        │
│                                                             │
│  Planner, Implementer, Reviewer, Feature Builder            │
│  → Personas with tool restrictions and handoffs             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Agent Hooks (this lab)                        │
│                                                             │
│  PostToolUse  →  auto-format after edits                    │
│  PreToolUse   →  block dangerous commands, protect data     │
│  → Deterministic automation around agent actions            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Agent Skills (next lab)                       │
│                                                             │
│  SKILL.md files teach specialized, reusable capabilities:   │
│  • API scaffolding skill   →  uses express instructions     │
│  • Migration validator     →  works with Database Migrator  │
│  • Skills load on-demand   →  hooks still enforce policies  │
│                                                             │
│  Skills are portable: VS Code, Copilot CLI, coding agent    │
└─────────────────────────────────────────────────────────────┘
```

Instructions define **what rules to follow**; agents define **who follows them with which tools**; hooks add **deterministic automation**; skills teach **reusable capabilities** that work across all three layers.

---

## Troubleshooting

| Issue | Solution |
| --- | --- |
| Hook not executing | Verify the file is in `.github/hooks/` with a `.json` extension and `type` is `"command"` |
| Permission denied | Run `chmod +x script.sh` on Unix; check PowerShell execution policy on Windows |
| Timeout errors | Increase the `timeout` value in the hook config (default is 30 seconds) |
| JSON parse errors | Ensure your hook script outputs valid JSON to stdout - use `JSON.stringify()` |
| Hook runs for wrong tools | Check the `tool_name` filtering in your script |
| Agent-scoped hooks not running | Set `chat.useCustomAgentHooks` to `true` in VS Code settings |
| Can't find hook logs | Open Output panel, select **GitHub Copilot Chat Hooks** channel |

---

## Key Takeaways

| Concept | Key Learning |
| --- | --- |
| **Deterministic automation** | Hooks execute code with guaranteed outcomes - unlike instructions that only guide behavior |
| **Global hooks** | `.github/hooks/` files apply to all agents - use for org-wide security and formatting |
| **Agent-scoped hooks** | `hooks` in `.agent.md` frontmatter runs only for that agent - use for agent-specific quality gates |
| **PreToolUse** | Block or modify tool calls before execution - the primary security enforcement point |
| **PostToolUse** | Run quality checks after edits - formatters, linters, tests |
| **Three permission decisions** | `deny` (block), `ask` (prompt user), or allow (continue) |
| **Security** | Review all hook scripts - they run with VS Code's permissions |

## Reference

*   [VS Code Agent Hooks Documentation](https://code.visualstudio.com/docs/copilot/customization/hooks)
*   [Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
*   [Agent Tools](https://code.visualstudio.com/docs/copilot/agents/agent-tools)
*   [Copilot Security Best Practices](https://code.visualstudio.com/docs/copilot/security)