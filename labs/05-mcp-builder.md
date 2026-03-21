# Lab 04 - Build an MCP Server with the MCP Builder Skill

> **Mode:** VS Code (Agent Mode)  
> **Duration:** 45-60 min  
> **Prerequisite:** [Lab 00](00-prerequisites.md)

---

## Objective

Build a fully functional MCP server from scratch using GitHub Copilot in Agent Mode with the Anthropic MCP Builder skill. The server exposes a Book Database built entirely by prompting Copilot into the `book-database-mcp-server/` folder.

> **Note:** If `book-database-mcp-server/` already exists in your workspace, delete it first. This lab rebuilds it from scratch.

| Exercise | Skill | What You Learn |
| --- | --- | --- |
| 1 | **Skill installation** | Install and verify an Agent Skill in VS Code - understand how skills extend Copilot's capabilities |
| 2 | **AI-scaffolded project** | Prompt Copilot with the MCP Builder skill to scaffold a TypeScript project with proper structure, config, and dependencies |
| 3 | **Tool implementation** | Prompt Copilot to implement MCP tools with Zod validation, annotations, and error handling - learn MCP tool design patterns |
| 4 | **MCP testing** | Test the server with MCP Inspector - verify tools work before wiring to an AI client |
| 5 | **VS Code integration** | Wire the server into VS Code and test it from Copilot Chat - the full loop from build to use |

---

## Exercise 1: Install the MCP Builder Skill

> **Purpose:** Install the Anthropic MCP Builder skill so Copilot knows how to scaffold production-quality MCP servers. Without this skill, Copilot generates generic code - with it, Copilot follows MCP best practices (tool naming, Zod schemas, annotations, error handling).

### Option A: Use the `/create-skill` Shortcut (Recommended)

1.  Open GitHub Copilot Chat in VS Code
2.  Type `/create-skill` and submit this prompt:

```
Install the Anthropic MCP Builder skill from https://github.com/anthropics/skills/tree/main/skills/mcp-builder

Download the SKILL.md and all files in the reference/ folder (mcp_best_practices.md, node_mcp_server.md, python_mcp_server.md, evaluation.md) from that repository. Save them as a project skill under .github/skills/mcp-builder/ in this workspace.
```

1.  Copilot generates the `SKILL.md` and reference docs
2.  Review the generated files and confirm they were saved to `.github/skills/mcp-builder/`

### Option B: Manual Download (Alternative)

If `/create-skill` is unavailable, download the files manually:

```
mkdir -p .github/skills/mcp-builder/reference

curl -L -o .github/skills/mcp-builder/SKILL.md \
  https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-builder/SKILL.md

curl -L -o .github/skills/mcp-builder/reference/mcp_best_practices.md \
  https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-builder/reference/mcp_best_practices.md

curl -L -o .github/skills/mcp-builder/reference/node_mcp_server.md \
  https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-builder/reference/node_mcp_server.md

curl -L -o .github/skills/mcp-builder/reference/python_mcp_server.md \
  https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-builder/reference/python_mcp_server.md

curl -L -o .github/skills/mcp-builder/reference/evaluation.md \
  https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-builder/reference/evaluation.md
```

**PowerShell:** Replace `mkdir -p` with `New-Item -ItemType Directory -Force -Path` and `curl -L -o` with `Invoke-WebRequest -Uri <URL> -OutFile <PATH>`.

### Step 2: Verify the Skill is Loaded

1.  Open Command Palette: `Ctrl+Shift+P` → **Chat: Open Chat Customizations**
2.  Under **Skills**, confirm `mcp-builder` appears
3.  Ask Copilot:

```
Do you have the MCP Builder skill loaded? Summarize the four phases of building an MCP server.
```

**Expected:** Copilot mentions **(1) Deep Research & Planning → (2) Implementation → (3) Review & Test → (4) Create Evaluations**.

### Validation

*   `.github/skills/mcp-builder/SKILL.md` exists
*   4 reference files in `.github/skills/mcp-builder/reference/`
*   Skill appears in Chat Customizations
*   Copilot confirms the 4-phase workflow

---

## Exercise 2: Scaffold the Project

> **Purpose:** Use the MCP Builder skill to scaffold a TypeScript MCP server project from a single prompt. Compare the generated structure against the skill's recommendations - learn what a well-structured MCP project looks like.

### Step 1: Understand the Data

The data files are in `copilot-mcp/src/data/`. Open both:

| File | Contents |
| --- | --- |
| `books.json` | ISBN, title, author |
| `books-details.json` | ISBN, summary, date, author |

### Step 2: Prompt Copilot to Scaffold

In Agent Mode:

```
Using the MCP Builder skill, create a new TypeScript MCP server project in a folder called book-database-mcp-server/. The server should be called book-database-mcp-server and will serve a local book catalog from two JSON data files. Use stdio transport. Follow the recommended project structure from the skill's TypeScript guide.

The data files to use are:
- data/books.json - contains ISBN, title, author
- data/books-details.json - contains ISBN, summary, date, author

Copy both files into the new project under src/data/.
```

### Step 3: Verify the Generated Structure

```
book-database-mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   └── data/
│       ├── books.json
│       └── books-details.json
```

### Step 4: Verify Config

Open `package.json` and `tsconfig.json`. Confirm:

*   `"type": "module"` in package.json
*   `@modelcontextprotocol/sdk` and `zod` in dependencies
*   `"strict": true` in tsconfig.json
*   `outDir` → `./dist`, `rootDir` → `./src`
*   `"build": "tsc"` script defined

### Step 5: Install and Build

```
cd book-database-mcp-server
npm install
npm run build
```

Fix any compilation errors before moving on.

### Validation

*   Project scaffolded with correct structure
*   Config files match MCP Builder recommendations
*   `npm run build` succeeds with zero errors

---

## Exercise 3: Implement the Tools

> **Purpose:** Prompt Copilot to implement four MCP tools following MCP Builder best practices - Zod `.strict()` schemas, `server.registerTool()` (modern API), tool annotations, and actionable error messages. This is where the skill's value shows: the generated code follows patterns you'd miss without it.

### Step 1: Prompt for Tool Implementation

```
Using the MCP Builder skill best practices, implement four tools in the book-database MCP server: get_book_by_isbn, get_book_by_title, get_books_by_titles, and get_books_by_isbn_list. Use server.registerTool() (the modern API). Each tool should have Zod input schemas with .strict(), proper title, description, inputSchema, and annotations (all are read-only, non-destructive, idempotent). Return formatted text responses. Handle not-found cases with clear error messages.
```

### Step 2: Review the Implementation

Check these quality criteria:

| Criteria | Expected |
| --- | --- |
| API | Uses `server.registerTool()` (NOT deprecated `server.tool()`) |
| Annotations | `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true` |
| Zod schemas | Uses `.strict()` to reject extra fields |
| Descriptions | Zod fields have `.describe()` for discoverability |
| ISBN validation | Enforces exactly 10 characters |
| Error messages | Clear and actionable for not-found cases |
| Types | No `any` - uses proper types or `unknown` |

### Step 3: Build and Fix

```
npm run build
```

Iterate with Copilot until the build succeeds with zero errors.

### Step 4: Run the Server

```
node dist/index.js
```

**Expected on stderr:**

```
Book database MCP Server running on stdio
```

Press `Ctrl+C` to stop (server hangs waiting for stdin - that's expected).

### Step 5: Validate the Transport Handshake

Send a raw MCP `initialize` request:

```
cd .\book-database-mcp-server\   

echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}' | node dist/index.js
```

Verify the response includes `"name": "book-database-mcp-server"` and a `capabilities` object listing `tools`.

### Validation

*   4 tools implemented with `server.registerTool()`
*   Zod schemas use `.strict()` and `.describe()`
*   Annotations present on all tools
*   `npm run build` succeeds
*   Server starts and responds to initialize request

---

## Exercise 4: Test with MCP Inspector

> **Purpose:** Use MCP Inspector to interactively test each tool before wiring the server into VS Code. This catches bugs early - always verify tools work standalone before connecting them to an AI client.

### Step 1: Launch the Inspector

```
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a browser UI showing all registered tools.

### Step 2: Run Test Cases

| # | Tool | Input | Expected |
| --- | --- | --- | --- |
| 1 | `get_book_by_isbn` | `{ "isbn": "0451524935" }` | Details for "1984" by George Orwell |
| 2 | `get_book_by_title` | `{ "title": "The Hobbit" }` | ISBN `0547928227`, author J.R.R. Tolkien |
| 3 | `get_books_by_titles` | `{ "titles": ["1984", "Brave New World"] }` | Two book entries |
| 4 | `get_books_by_isbn_list` | `{ "isbn_list": ["0451524935", "0547928227"] }` | Details for 1984 and The Hobbit |
| 5 | `get_book_by_isbn` | `{ "isbn": "0000000000" }` | Not-found error message |
| 6 | `get_book_by_isbn` | `{ "isbn": "short" }` | Zod validation error (not 10 chars) |

### Validation

*   All 4 tools visible in Inspector
*   Valid inputs return correct data
*   Invalid ISBN returns validation error
*   Not-found ISBN returns actionable error message

---

## Exercise 5: Wire Up to VS Code

> **Purpose:** Connect your server to VS Code and test it from Copilot Chat. This completes the loop: you built an MCP server from scratch and can now use it as a data source for AI-assisted development - the same setup Lab 05 will use.

### Step 1: Configure MCP

Create or update `.vscode/mcp.json` in the **workspace root**:

```
{
  "servers": {
    "book-database": {
      "type": "stdio",
      "command": "node",
      "args": ["book-database-mcp-server/dist/index.js"]
    }
  }
}
```

### Step 2: Start the MCP Server

1.  Open Command Palette: `Ctrl+Shift+P`
2.  Run: **MCP: Start MCP server**
3.  Select **book-database**

### Step 3: Test from Copilot Chat

In Agent Mode:

```
Use the book-database MCP server to find details about the book "1984".
```

**Expected:** Copilot calls `get_book_by_isbn` or `get_book_by_title` and returns the book information.

Follow up:

```
Now get the summaries for The Hobbit and Pride and Prejudice.
```

### Validation

*   `.vscode/mcp.json` configured
*   MCP server starts from VS Code
*   Copilot calls MCP tools and returns book data

---

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `npm run build` fails with import errors | Ensure `"type": "module"` in package.json and `"module": "Node16"` in tsconfig.json |
| MCP Inspector won't connect | Run `npm run build` first - `dist/index.js` must exist |
| Tools not appearing in Copilot | Restart VS Code after updating `.vscode/mcp.json` |
| `Cannot find module './data/books.json'` | Ensure JSON files are in `src/data/` and use `resolveJsonModule` in tsconfig |
| Copilot uses `server.tool()` | Re-prompt: "Use `server.registerTool()` - the modern API, not deprecated `server.tool()`" |
