# Lab 07 - Coding Agent: Autonomous PR Workflow

> **Mode:** GitHub.com  
> **Duration:** 50 min  
> **Prerequisite:** [Lab 00](00-prerequisites.md)

---

## Objective

Use the GitHub Copilot Coding Agent to implement features by assigning GitHub Issues. The agent works asynchronously - it analyzes the repo, generates code, and opens a draft PR.

Each exercise teaches a different aspect of the Coding Agent workflow:

| Exercise | Skill | What You Learn |
| --- | --- | --- |
| 1 | **Prompt-to-PR lifecycle + iteration** | Walk through the full Coding Agent pipeline: submit prompt in Cloud mode → agent creates PR → monitor Actions → review PR → refine via PR comments |
| 2 | **Multi-issue coordination** | Decompose a complex feature into linked issues - the agent reads all linked issues via GitHub MCP and coordinates a full-stack PR |
| 3 | **Copilot-assisted issue management** | Use Copilot Agent Mode (Local) in VS Code to create issues from natural language, batch-create multiple issues, build sub-issue trees, and update existing issues |

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

### Step 2: Create Issues Using Copilot Chat

Instead of manually filling out issue forms, use **Copilot Chat** on GitHub.com to create all three issues from natural language prompts.

1. Go to [Copilot Chat](https://github.com/copilot) on **GitHub.com**
2. Submit the following prompt to create the frontend issue:

```
In <your-username>/<your-repo>, create an issue titled "Add Book Reviews UI" with this description: Add a book reviews UI - a "Reviews" section on each book card with a form for submitting new reviews (1-5 star rating and review text), a scrollable list of existing reviews, and the average rating displayed.
```

3. Review the draft that Copilot generates - check the title and body
4. Click **Create** to publish the issue

> **Your issue number:** #____

### Step 3: Create the Backend Issue via Copilot Chat

Continue in the same Copilot Chat session:

```
In <your-username>/<your-repo>, create an issue titled "Add Book Reviews Backend API" with this description: Add a backend API for book reviews - endpoints for submitting a review, retrieving reviews for a book, and getting a book's average rating.
```

Review the draft and click **Create**.

> **Your issue number:** #____

### Step 4: Create the Main Feature Issue and Assign to Copilot

In the same Copilot Chat session, replace `#__` with the issue numbers from Steps 2 and 3:

```
In <your-username>/<your-repo>, create an issue titled "Implement Book Review System" with this description: Implement a book review system that lets users review books and see others' reviews. This feature consists of two parts: frontend implementation (Issue #_) and backend implementation (Issue #_). Assign this issue to Copilot.
```

Review the draft and click **Create**.

> **Tip:** By including "Assign this issue to Copilot" in your prompt, Copilot automatically sets itself as the assignee - no need to manually select it from the sidebar.

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

## Exercise 3: Copilot-Assisted Issue Management

> **Purpose:** Learn how to use GitHub Copilot in VS Code Agent Mode to rapidly create, batch-create, decompose, and update issues using natural language. These skills accelerate planning workflows and pair naturally with the Coding Agent - issues you create can be assigned to Copilot for autonomous implementation.
>
> **Mode:** All steps in this exercise use **Copilot Chat in VS Code** with **Agent Mode (Local)**. Copilot uses the GitHub tools (via the GitHub Pull Request extension) to create and manage issues directly from your editor.
>
> **Pre-requisite:** Install the **GitHub Pull Request and Issues** extension in VS Code if not already installed.
>
> **Reference:** [Using GitHub Copilot to create or update issues](https://docs.github.com/en/copilot/how-tos/use-copilot-for-common-tasks/use-copilot-to-create-or-update-issues)

### Step 1: Create an Issue from a Screenshot

Copilot Agent Mode accepts images alongside text prompts.

1.  Open **Copilot Chat** in VS Code and ensure you are in **Agent** mode (Local)
2.  Take a screenshot of a UI bug or area of the app you want to improve (or use any sample screenshot)
3.  Paste or drag the image into the chat prompt box and add context:

```
In <your-username>/<your-repo>, create a GitHub issue because this UI element needs improvement.
```

4.  When Copilot asks to confirm the GitHub tool calls, approve them
5.  Review the issue that Copilot creates - check the title, body, and labels in the confirmation

### Step 2: Create Multiple Issues at Once

Copilot can create several issues from a single prompt.

1.  In Copilot Chat (Agent Mode), submit:

```
In <your-username>/<your-repo>, create 3 GitHub issues:
1) Add pagination to the book list so only 10 books display per page
2) Add a search bar to filter books by title or author
3) Add a dark mode toggle to the header
```

2.  Approve each GitHub tool call as Copilot creates the issues
3.  Verify the issues appear in the **Issues** tab on GitHub.com

### Step 3: Create an Epic with Sub-Issues

Copilot can decompose a feature into a parent issue and sub-issues.

1.  In Copilot Chat (Agent Mode), submit:

```
In <your-username>/<your-repo>, create a GitHub issue titled "User Profile Feature" as an epic. Then create sub-issues for: profile page layout, edit profile form, profile avatar upload, and user activity feed. Link them as sub-issues of the epic.
```

2.  Approve the GitHub tool calls as Copilot creates the parent issue and sub-issues
3.  You can refine with follow-up prompts:
    - `Add another sub-issue for profile privacy settings to the epic`
    - `Update the epic description to include an overview of all sub-issues`
4.  Verify the issue tree on GitHub.com - the parent issue should list sub-issues
5.  Assign to Copilot to review and view progress end-to-end.

### Step 4: Update an Existing Issue

Copilot can update issues that already exist in your repository.

1.  Pick an existing issue number from your repository (e.g., one created in Exercise 2)
2.  In Copilot Chat (Agent Mode), submit:

```
In <your-username>/<your-repo>, update GitHub issue #<number> to add acceptance criteria and steps to reproduce. Also add the label "enhancement".
```

3.  Approve the tool calls and verify the updated issue on GitHub.com

### Step 5: Add Sub-Issues to an Existing Parent

Connect new issues to existing parent issues.

1.  In Copilot Chat (Agent Mode), submit:

```
In <your-username>/<your-repo>, create a sub-issue for GitHub issue #<parent-number> to add unit tests for the feature.
```

2.  Approve the tool calls and verify the sub-issue is linked on GitHub.com

### Step 6 (Optional): Assign a Created Issue to Copilot

Any issue you create can be immediately assigned to the Coding Agent.

1.  In Copilot Chat (Agent Mode), submit:

```
In <your-username>/<your-repo>, create a GitHub issue to add an "About" page with project description and contributor list. Assign it to Copilot.
```

2.  Approve the tool calls - the Coding Agent picks up the issue and starts working autonomously
3.  Verify the 👀 reaction appears on the issue on GitHub.com
4.  Check the **Actions** tab for the triggered workflow

### Validation

*   Issue created from an image/screenshot via Agent Mode in VS Code
*   Multiple issues created in a single prompt
*   Epic with sub-issues generated and linked
*   Existing issue updated via Agent Mode with new content and labels
*   Sub-issue linked to an existing parent issue
*   (Optional) Issue assigned to Copilot and Coding Agent triggered

---

## Troubleshooting

| Issue | Fix |
| --- | --- |
| No 👀 reaction | Verify Copilot Coding Agent is enabled in repo settings |
| Workflow doesn't trigger | Check `.github/workflows/copilot-setup-steps.yml` exists |
| PR has errors | Add a PR comment describing the issue - agent will iterate |
| Agent takes too long | Check Actions tab for errors in the setup step |
| Copilot Chat can't find repo | Use `owner/repo` format in your prompt |
| Issue draft missing fields | Add more detail to your prompt or edit the draft manually |
| Sub-issues not linking | Ensure the parent issue number is correct and already published |