# Lab 06 - Exercise the Book Database MCP Server

> **Mode:** VS Code (Agent Mode)  
> **Duration:** 45-60 min  
> **Prerequisite:** [Lab 05 - Build an MCP Server](05-mcp-builder.md) (MCP server built and wired into VS Code)

---

## Objective

Put the book-database MCP server you built in Lab 05 to work. Use it as a live data source from Copilot Chat to generate application features, produce test fixtures, and extend the server with a new tool. This lab teaches you how MCP servers become practical building blocks in AI-assisted development workflows.

> **Note:** The book-database MCP server must be built, configured in `.vscode/mcp.json`, and running before starting this lab. If it isn't, complete [Lab 05](05-mcp-builder.md) first.

| Exercise | Focus | What You Learn |
| --- | --- | --- |
| 1 | **Feature generation** | Use MCP data to generate a real feature for the BookFaves app - see MCP as a live data source for code generation |
| 2 | **Test data generation** | Generate test fixtures and test cases from real MCP data - learn how MCP servers eliminate hand-written mock data |
| 3 | **Extend the server** | Add a new tool to the MCP server, rebuild, and test - the full add-tool iteration cycle |

---

## Prerequisites

| Requirement | Details |
| --- | --- |
| **Lab 05 complete** | `book-database-mcp-server/` built and `npm run build` succeeds |
| **MCP server configured** | `.vscode/mcp.json` includes the `book-database` server entry |
| **MCP server running** | Start via Command Palette: `Ctrl+Shift+P` → **MCP: Start MCP server** → **book-database** |
| **BookFaves app running** | `cd copilot-agent-and-mcp && npm install && npm start` (backend on :4000, frontend on :5173) |

### Quick Check

Before starting, verify the MCP server is working. In Agent Mode, ask:

```
Use the book-database MCP server to look up the book with ISBN 0451524935.
```

**Expected:** Copilot calls `get_book_by_isbn` and returns details for "1984" by George Orwell. If this fails, revisit Lab 05 Exercise 5.

---

## Exercise 1: Generate a Feature Using MCP Data

> **Purpose:** Use the MCP server as a live data source while Copilot generates a real feature for the BookFaves app. This demonstrates the key value of MCP: the AI pulls real data at code-generation time instead of hallucinating placeholder values.

### Step 1: Understand the Current App

The BookFaves app (`copilot-agent-and-mcp/`) has:
- **Backend:** Express.js API with routes for books, favorites, reading lists, and auth
- **Frontend:** React app with components for BookList, Favorites, ReadingList, etc.
- **Data:** Local JSON files for books and users

The backend books data (`copilot-agent-and-mcp/backend/data/books.json`) uses a different schema than the MCP server's catalog. Your task is to enrich the app with data from the MCP server's catalog.

### Step 2: Generate a Book Recommendations Endpoint

Ask Copilot to generate a new backend endpoint that serves curated book recommendations, using real data from the MCP server to populate the initial dataset:

```
I want to add a "Staff Picks" feature to the BookFaves app. Using the book-database MCP tools, look up these classic novels and get their full details: "1984", "The Great Gatsby", "Pride and Prejudice", "The Hobbit", and "To Kill a Mockingbird". Then create a new file copilot-agent-and-mcp/backend/routes/staffPicks.js that serves a GET /staff-picks endpoint returning these books as curated recommendations. Include the title, author, ISBN, summary, and publication date from the MCP data. Follow the same coding patterns used in the existing route files (books.js, favorites.js).
```

### Step 3: Verify the Generated Code

Check the generated route file:

| Criteria | Expected |
| --- | --- |
| File location | `copilot-agent-and-mcp/backend/routes/staffPicks.js` |
| Data accuracy | Titles, authors, ISBNs, summaries match the MCP server's catalog (not hallucinated) |
| Code patterns | Uses `createSuccessResponse` / `createErrorResponse` from `../utils/apiUtils` |
| Comment prefix | Comments begin with `generated-by-copilot:` |

### Step 4: Wire the Route

Ask Copilot to register the new route:

```
Register the staffPicks route in copilot-agent-and-mcp/backend/routes/index.js at the path /staff-picks. Follow the same pattern used for the other routes.
```

### Step 5: Restart the Backend Server

Node.js/Express loads routes at startup, so the running server process doesn't know about the new `staffPicks.js` file. Restart the backend to pick up the changes:

1. In the terminal running `npm start`, press `Ctrl+C` to stop the server
2. Restart:

```
cd copilot-agent-and-mcp
npm start
```

### Step 6: Test the Endpoint

```
curl http://localhost:4000/api/v1/staff-picks
```

**Expected:** JSON response with 5 books, each containing accurate details pulled from the MCP catalog.

### Step 7: Run Backend Tests

```
cd copilot-agent-and-mcp
npm run test:backend
```

Confirm existing tests still pass — the new route should not break anything.

### Validation

- New route file created with real MCP data (not placeholder text)
- Route registered in `index.js`
- `GET /api/v1/staff-picks` returns correct book data
- Existing backend tests still pass

---

## Exercise 2: Test Data Generation from MCP

> **Purpose:** Use the MCP server to generate realistic test fixtures and test cases based on real catalog data. This eliminates hand-written mock data and ensures tests use accurate, consistent values.

### Step 1: Generate Test Fixtures

```
Using the book-database MCP tools, look up these 5 books by ISBN: 0451524935, 0743273565, 0547928227, 0141439518, 0446310789. Then generate a JSON fixture file at copilot-agent-and-mcp/backend/tests/fixtures/staff-picks.json containing these books in the same format as the staff picks endpoint response. Use the real data from the MCP server — do not make up any values.
```

### Step 2: Generate a Test File

```
Using the test fixture you just created and following the testing patterns in copilot-agent-and-mcp/backend/tests/, generate a Jest test file at copilot-agent-and-mcp/backend/tests/staffPicks.test.js that tests the GET /api/v1/staff-picks endpoint. Include tests for: (1) returns 200 status, (2) response contains the expected number of books, (3) each book has title, author, isbn, summary, and date fields. Follow the same patterns used by the existing test files.
```

### Step 3: Run the Tests

```
cd copilot-agent-and-mcp
npm run test:backend
```

### Step 4: Verify Data Accuracy

Ask Copilot to cross-check:

```
Use the book-database MCP tools to look up ISBN 0743273565. Compare the returned title and author against what's in copilot-agent-and-mcp/backend/tests/fixtures/staff-picks.json. Do they match exactly?
```

**Expected:** Copilot confirms the fixture data matches the MCP server's catalog exactly.

### Validation

- Test fixture file created with real MCP data
- Test file follows existing project patterns
- Tests pass when run with `npm run test:backend`
- Fixture data matches MCP server catalog exactly

---

## Exercise 3: Extend the MCP Server with a New Tool

> **Purpose:** Add a new tool to the MCP server, rebuild, and test it — completing the full development cycle. This teaches the iteration loop: implement → build → test with Inspector → test from Copilot Chat.

### Step 1: Design the Tool

You will add a `get_books_by_author` tool that searches the catalog by author name (case-insensitive partial match).

### Step 2: Prompt Copilot to Implement

```
Add a new tool called get_books_by_author to the book-database MCP server. It should accept an author name string and return all books whose author field contains that string (case-insensitive partial match). Follow the same patterns as the existing tools: use server.registerTool(), Zod schema with .strict() and .describe(), annotations (readOnly, non-destructive, idempotent), and formatted markdown response. Add the schema to schemas/book-schemas.ts, the service function to services/book-service.ts, and register the tool in tools/book-tools.ts.
```

### Step 3: Build and Fix

```
cd book-database-mcp-server
npm run build
```

Iterate with Copilot until compilation succeeds with zero errors.

### Step 4: Test with MCP Inspector

```
npx @modelcontextprotocol/inspector node dist/index.js
```

Test these cases in the Inspector:

| # | Input | Expected |
| --- | --- | --- |
| 1 | `{ "author": "Tolkien" }` | The Hobbit and The Lord of the Rings |
| 2 | `{ "author": "dostoevsky" }` | Crime and Punishment and The Brothers Karamazov |
| 3 | `{ "author": "DICKENS" }` | Great Expectations, A Tale of Two Cities, David Copperfield |
| 4 | `{ "author": "zzzzz" }` | Not-found message |

### Step 5: Restart the MCP Server in VS Code

1. Open Command Palette: `Ctrl+Shift+P`
2. Run: **MCP: Stop MCP server** → **book-database**
3. Run: **MCP: Start MCP server** → **book-database**

### Step 6: Test from Copilot Chat

```
Use the book-database MCP server to find all books by Ernest Hemingway.
```

**Expected:** Copilot calls `get_books_by_author` with `{ "author": "Hemingway" }` and returns The Sun Also Rises and The Old Man and the Sea.

Follow up with a multi-tool query that uses the new tool:

```
Using the book-database tools, find all books by Charles Dickens. Then look up the full details for each one using their ISBNs. Which Dickens novel was published first?
```

**Expected:** Copilot uses `get_books_by_author` to find the titles, then `get_books_by_isbn_list` to get full details with dates, then answers the chronological question.

### Validation

- New `get_books_by_author` tool implemented following existing patterns
- `npm run build` succeeds
- All five tools visible in MCP Inspector
- Valid author searches return correct results
- Case-insensitive matching works
- Not-found returns clear message
- Tool works from Copilot Chat in VS Code

---

## Troubleshooting

| Issue | Fix |
| --- | --- |
| MCP server not responding | Restart: `Ctrl+Shift+P` → **MCP: Stop MCP server**, then **MCP: Start MCP server** |
| Copilot doesn't use MCP tools | Start your prompt with "Use the book-database MCP server to..." |
| New tool not appearing | Run `npm run build` in `book-database-mcp-server/`, then restart the MCP server in VS Code |
| Test fixture data is wrong | Re-generate fixtures — always pull from MCP, never edit manually |
| Backend tests fail after changes | Run `npm run test:backend` and check for import/route registration issues |
| `get_books_by_author` matches too broadly | Ensure the service function filters on the `author` field only, not all fields |

---

## Summary

In this lab you exercised the MCP server across three practical scenarios:

| Exercise | What You Did | Key Takeaway |
| --- | --- | --- |
| 1 | Generated a feature with real MCP data | MCP eliminates hallucinated placeholder data in code generation |
| 2 | Generated test fixtures from MCP | Real data from MCP servers produces reliable, accurate test suites |
| 3 | Extended the server with a new tool | The full cycle: implement → build → test → integrate |
