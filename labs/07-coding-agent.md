# Lab 02 - Coding Agent: Autonomous PR Workflow

> **Mode:** GitHub.com  
> **Duration:** 35 min  
> **Prerequisite:** [Lab 00](00-prerequisites.md)

---

## Objective

Use the GitHub Copilot Coding Agent to implement features by assigning GitHub Issues. The agent works asynchronously - it analyzes the repo, generates code, and opens a draft PR.

Each exercise teaches a different aspect of the Coding Agent workflow:

| Exercise | Skill | What You Learn |
| --- | --- | --- |
| 1 | **Prompt-to-PR lifecycle + iteration** | Walk through the full Coding Agent pipeline: submit prompt in Cloud mode → agent creates PR → monitor Actions → review PR → refine via PR comments |
| 2 | **Multi-issue coordination** | Decompose a complex feature into linked issues - the agent reads all linked issues via GitHub MCP and coordinates a full-stack PR |

> All exercises run entirely on **GitHub.com**. No local sync needed.

---

## How It Works

```
Issue assigned    →  GitHub App     →  Actions workflow  →  Ephemeral runner
to @copilot          receives event    triggered            provisioned
                                                                 │
PR merged         ←  Changes        ←  Agent codes        ←  Setup runs
(by human)           requested?         + opens PR            (copilot-setup-steps.yml)
                     (loop back)
```

The agent reads `.github/copilot-instructions.md` for project conventions and `.github/workflows/copilot-setup-steps.yml` for environment setup.

---

## Pre-requisite: Push Your Code to GitHub

Before starting the exercises, ensure your local repository is pushed to GitHub so the Coding Agent can access it.

**Option A: Using terminal commands**

1.  Open a terminal in your project root
2.  Initialize and push to GitHub:

```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

**Option B: Using Copilot Chat prompts**

1.  Open **Copilot Chat** in VS Code
2.  Submit the following prompt:

```
Create a .gitignore file with node_modules and other commonly irrelevant files and folders. Initialize a git repository, stage all files, and commit with message "Initial commit". Add a remote origin pointing to https://github.com/<your-username>/<your-repo>.git and push the main branch.
```

---

1.  Verify on **GitHub.com** that your repository contains:
    *   `.github/copilot-instructions.md`
    *   `.github/workflows/copilot-setup-steps.yml`
    *   The `backend/` and `frontend/` directories with application code

> If your repo is already on GitHub, ensure all recent local changes are pushed before proceeding.

---

## Exercise 1: Prompt-to-PR Lifecycle + Iteration - Clear All Favorites

> **Purpose:** Walk through the complete Coding Agent pipeline end-to-end. You'll submit a prompt using Agent Mode
> (Cloud) in VS Code, which directly creates a PR - no issue is created. You'll then monitor the Actions workflow,
> review the generated PR, and refine the output by commenting on the PR - learning every step of the autonomous
> workflow including the feedback loop.

### Step 1: Create the PR via Agent Mode (Cloud)

1.  Install the GitHub Pull Request extension and open **Copilot Chat** in VS Code.
2.  Use **Agent** setting and switch to **Cloud** from Local mode.
3.  Submit the following prompt:

```
Add a "Clear All Favorites" button that lets users remove all books from their favorites list at once, with a confirmation dialog before clearing. Assign the Pull Request and its Review to Copilot.
```

3.  When Agent Mode asks for confirmation, approve the GitHub tool calls.
4.  The agent will directly create a PR (no issue gets created).

### Step 2: Monitor the Workflow

1.  Open the **Actions** tab in your repository on **GitHub.com**
2.  Find the triggered workflow run
3.  Click into it and observe:

| Log Section | What's Happening |
| --- | --- |
| Runner provisioning | Fresh Ubuntu environment spinning up |
| Checkout | Repository being cloned |
| copilot-setup-steps | Your custom setup running (`npm install`, etc.) |
| Agent activity | Copilot reading code, planning, writing changes |

**Expected wait:** ~5-7 minutes for PR creation.

### Step 3: Review the PR

1.  When the PR appears, open it
2.  Check:
    *   **PR body** - Copilot's explanation of changes
    *   **PR timeline** - Logged actions and reasoning
    *   **Files changed** - Backend route + frontend component changes
3.  Review code quality and test coverage

### Step 4: Verify via PR

1.  In the PR **Files changed** tab, confirm:
    *   Backend: new route or updated `favorites.js` with a clear-all endpoint
    *   Frontend: "Clear All" button added to `Favorites.jsx`
    *   Tests: at least one new test case in the backend tests
2.  Check the **Actions** tab - CI should pass (backend tests + frontend build)

### Step 5: Iterate via PR Comment

This is the key step - after reviewing the PR, add a comment requesting a specific change:

```
Add a toast notification that briefly confirms "All favorites cleared" after the user confirms and the operation succeeds.
```

**Expected:** Copilot reads the comment, updates the code, and pushes a new commit to the same PR.

### Step 5a: Assign Copilot as PR Reviewer

1.  In the PR sidebar, click **Reviewers** → search for and select **Copilot**
2.  Copilot will automatically review the PR and leave comments on code quality, potential issues, and suggestions
3.  Wait for the review to appear (~2-3 minutes)
4.  Once Copilot starts the work, click the **View Session** button to view the real-time coding session.

### Step 6: Verify the Iteration

1.  Wait for the new commit to appear (~3-5 minutes)
2.  Review the diff - confirm toast notification logic was added
3.  Check the PR timeline - note how the agent references your comment
4.  Check **Actions** tab - CI should still pass after the iteration

### Validation

*   PR created directly via Agent Mode (Cloud) in VS Code
*   PR created with working implementation
*   PR timeline shows agent reasoning
*   CI passes on the PR (check Actions)
*   Code changes cover backend, frontend, and tests
*   PR comment triggered a new commit from Copilot
*   New commit addresses the feedback (toast notification added)
*   Copilot assigned as PR reviewer and review feedback received
*   PR timeline shows agent reading and responding to your comment

---

## Exercise 2: Multi-Issue Coordination - Book Reviews

> **Purpose:** Decompose a complex feature into separate frontend and backend issues, then link them to a main issue. The Coding Agent reads all linked issues via the GitHub MCP server and coordinates a single PR covering the full stack. This teaches issue decomposition - the pattern for real-world agent-driven development.

Start this exercise, then move to Lab 03 while the agent works (~10 min). Return to review the PR.

### Step 1: Verify MCP Configuration

Before creating issues, confirm the Coding Agent has access to the GitHub MCP server so it can read linked issues.

1.  Go to your repository on **GitHub.com**
2.  Navigate to **Settings** → **Copilot** → **Coding agent**
3.  Check the **MCP servers** section. If no servers are configured, add:

```
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "tools": []
    }
  }
}
```

1.  Note the tools exposed by the configured MCP server - these allow the agent to read issues, PRs, and repository content

> The GitHub MCP server gives the Coding Agent access to issue details, linked references, and repo metadata. Without it, the agent cannot read the linked sub-issues.

### How to Create an Issue on GitHub.com

1.  Go to your repository on **GitHub.com**
2.  Click the **Issues** tab at the top of the repository
3.  Click the **New issue** button (green button, top right)
4.  Enter the **Title** and **Description** (provided below for each issue)
5.  Click **Submit new issue**
6.  Note the issue number assigned (shown as `#N` in the issue URL and title)

### Step 2: Create the Frontend Issue

> **Do not** assign this issue to Copilot. It will be linked from the main issue in Step 4.

**Title:** `Add Book Reviews UI`

**Description:**
```
Add a book reviews UI - a "Reviews" section on each book card with a form for submitting new reviews (1-5 star rating and review text), a scrollable list of existing reviews, and the average rating displayed.
```

> **Your issue number:** #____

### Step 3: Create the Backend Issue

> **Do not** assign this issue to Copilot. It will be linked from the main issue in Step 4.

**Title:** `Add Book Reviews Backend API`

**Description:**
```
Add a backend API for book reviews - endpoints for submitting a review, retrieving reviews for a book, and getting a book's average rating.
```

> **Your issue number:** #____

### Step 4: Create the Main Feature Issue

In the **Description** below, replace `#__` with the issue numbers you noted in Steps 2 and 3.

**Title:** `Implement Book Review System`

**Description:**
```
Implement a book review system that lets users review books and see others' reviews. This feature consists of two parts: frontend implementation (Issue #_) and backend implementation (Issue #_).
```

**Assign** this issue to **Copilot** in the issue sidebar, click **Assignees** → search for, select **Copilot** and **Create** the issue.

### Step 5: Verify and Move On

1.  Verify the 👀 reaction appears on the main issue (confirms Copilot picked it up)
2.  **Move to next Lab** - return in ~10 minutes to review the PR

### Step 6: Review the PR and Validate MCP Usage (after moving on)

1.  Open the PR
2.  In the **Copilot Coding Agent timeline**, verify MCP tool calls:
    *   Look for entries showing the agent calling MCP tools (e.g., `get_issue`, `issue_read`)
    *   Confirm the agent read **both** linked issues (frontend `#4` and backend `#5`)
    *   Verify the agent understood the full feature scope from the linked issue content
3.  In **Files changed**, check:
    *   Frontend: review form component, star rating, review list
    *   Backend: API endpoints (`POST /api/books/{id}/reviews`, `GET /api/books/{id}/reviews`)
    *   Tests: backend test coverage following existing patterns
4.  Check **Actions** tab - CI should pass

### Validation

*   MCP server configured in repo settings (Settings → Copilot → Coding agent)
*   3 linked issues created with proper `#` references
*   Agent timeline shows MCP tool calls to read linked issues
*   Frontend + backend implemented in single PR
*   CI passes on the PR
*   PR covers all requirements from both sub-issues

---

## Troubleshooting

| Issue | Fix |
| --- | --- |
| No 👀 reaction | Verify Copilot Coding Agent is enabled in repo settings |
| Workflow doesn't trigger | Check `.github/workflows/copilot-setup-steps.yml` exists |
| PR has errors | Add a PR comment describing the issue - agent will iterate |
| Agent takes too long | Check Actions tab for errors in the setup step |