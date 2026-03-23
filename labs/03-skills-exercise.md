# Lab 03: Agent Skills in VS Code - Build Reusable AI Capabilities

> \[!NOTE\]  
> This lab uses the **Agent Skills** feature in VS Code to create portable, reusable capabilities that GitHub Copilot loads on demand. You will build skills for the **Book Favorites** app (`copilot-agent-and-mcp/`).
>
> **Prerequisite:** Complete the [Custom Agents lab](custom-agents-exercise.md) first. This lab adds a skill that works alongside the agents you created there.

## Overview

Agent Skills are folders of instructions, scripts, and resources that Copilot can load when relevant. Unlike custom instructions (which define coding guidelines), skills enable **specialized capabilities and workflows** - including scripts, examples, and templates. Skills follow an [open standard](https://agentskills.io/) that works across VS Code, Copilot CLI, and the Copilot coding agent.

### Agent Skills vs Custom Instructions vs Custom Agents

|                 | Agent Skills                                   | Custom Instructions                    | Custom Agents                                |
| --------------- | ---------------------------------------------- | -------------------------------------- | -------------------------------------------- |
| **Purpose**     | Teach specialized capabilities and workflows   | Define coding standards and guidelines | Configure AI personas with tool restrictions |
| **Portability** | VS Code, Copilot CLI, Copilot coding agent     | VS Code and GitHub.com only            | VS Code only                                 |
| **Content**     | Instructions, scripts, examples, and resources | Instructions only                      | Instructions + tool/model config             |
| **Scope**       | Task-specific, loaded on-demand                | Always applied (or via glob patterns)  | Switched manually or via handoffs            |
| **Standard**    | Open standard (agentskills.io)                 | VS Code-specific                       | VS Code-specific                             |

### What You Will Learn

**Total Time: ~60 minutes**

| Part | Exercise | Topic                                                                                                               | Description                                                                          | Time       |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------- |
| Pre  |          | [Prerequisites](#prerequisites)                                                                                     | VS Code, Copilot subscription, repo cloned, app running, Custom Agents lab completed | \-         |
| 1    | 1.1      | [Generate the Test Fixture Skill](#exercise-11--generate-the-test-fixture-generator-skill)                          | Use `/create-skill` to generate SKILL.md, templates, and fixture script              | 10 min     |
|      | 1.2      | [Test the Fixture Generator](#exercise-12--test-the-fixture-generator)                                              | Trigger the skill, generate tests for books API, verify they pass                    | 8 min      |
|      | 1.3      | [Generate Fixtures for a Different Resource](#exercise-13--generate-fixtures-for-a-different-resource)              | Generate fixtures for favorites API and edge-case book data                          | 7 min      |
|      | 1.4      | [Understand Frontmatter Controls](#exercise-14--understand-frontmatter-controls)                                    | Experiment with `user-invocable` and `disable-model-invocation`                      | 5 min      |
| 2    | 2.1      | [Extract a Skill from a Debugging Conversation](#exercise-21--extract-a-skill-from-a-debugging-conversation-15-min) | Introduce a bug, debug with Copilot, extract the procedure as a reusable skill       | 15 min     |
|      | 2.2      | [Install Community Skills from awesome-copilot](#exercise-22--install-community-skills-from-awesome-copilot-15-min) | Install review-and-refactor, conventional-commit, and jest skills; test composition  | 15 min     |
|      |          |                                                                                                                     | **Total**                                                                            | **60 min** |

### Prerequisites

| Requirement           | Details                                                                                |
| --------------------- | -------------------------------------------------------------------------------------- |
| **VS Code**           | Insiders or latest Stable with GitHub Copilot extension (Agent Mode enabled)           |
| **GitHub Copilot**    | Copilot Pro, Pro+, Business, or Enterprise subscription                                |
| **Workspace**         | This repository cloned locally                                                         |
| **App running**       | `npm install && npm start` in root directory - backend on :4000, frontend on :5173     |
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

## Part 1 – Generate a Skill with /create-skill: Test Fixture Generator (30 min)

**Objective:** Use `/create-skill` to generate a test fixture skill that follows the conventions from `testing.instructions.md` ([Lab 00, Exercise 2.3](00-custom-instructions-exercise.md#exercise-23---generate-testing-instructions)). Instead of manually writing all the files, you will let Copilot generate the `SKILL.md`, a test templates reference file, and a fixture generation script - all from a single detailed prompt.

### Exercise 1.1 – Generate the Test Fixture Generator Skill

1.  Open the Chat view (any agent mode) and type:

```
/create-skill
```

1.  Copilot will ask you to describe the skill. Enter this prompt:

> "Create a skill called generating-test-fixtures in `.github/skills/generating-test-fixtures/` for the Book Favorites app. Follow these requirements exactly:
>
> **SKILL.md** (under 200 lines in body):
>
> - name: `generating-test-fixtures` (gerund form, lowercase with hyphens)
> - description: Write in third person. Mention that it generates Jest backend test fixtures for the Book Favorites app. Include trigger terms: test fixtures, test scaffolding, generate tests, backend tests, supertest. Mention it works with the testing.instructions.md conventions.
> - argument-hint: 'Describe what to test (e.g., "books API CRUD endpoints" or "favorites API error cases")'
> - The body should include:
>   1.  A Quick Start section showing a one-liner to invoke the skill
>   2.  A Workflow section with a checklist (Step 1: Identify endpoints to test, Step 2: Generate fixtures using templates, Step 3: Run tests to verify, Step 4: Review coverage)
>   3.  A Project Conventions section listing: backend Jest tests go in `backend/tests/` with `.test.js` extension using supertest for HTTP testing, run with `npm run test:backend`, structure as describe block per route and it block per scenario, always test both success and error cases (400, 401, 404). Always start test descriptions with 'should'. Always start comments with 'generated-by-copilot: '.
>   4.  References to `./templates.md` for detailed test templates and `./scripts/generate-fixtures.js` for automated fixture generation. Keep references one level deep.
>
> **templates.md** companion file:
>
> - A Jest/supertest template for GET, POST, PUT, DELETE endpoints with describe/it blocks, proper status code assertions, auth token handling, and error case tests (400 missing fields, 401 no token, 404 not found)
> - Each template should have comments starting with 'generated-by-copilot: '
>
> **scripts/generate-fixtures.js** utility script:
>
> - Takes `--resource` (e.g., books, favorites) as an argument
> - **Before generating tests, validates which HTTP methods are actually implemented in** `**backend/routes/{resource}.js**` (check for `router.get()`, `router.post()`, `router.put()`, `router.delete()`)
> - Only generates test cases for endpoints that actually exist in the router
> - Reads existing data from `backend/data/{resource}.json` to generate realistic test assertions (uses actual IDs and titles from the data)
> - Outputs a test file to `backend/tests/{resource}.test.js`
> - Uses `JSON.stringify` for readable output
> - All comments start with 'generated-by-copilot: '
> - Handles errors explicitly (file not found, invalid JSON, no endpoints found) with descriptive messages - do not punt error handling to the caller
>
> Do NOT add performance testing, snapshot testing, or CI/CD sections. Keep it focused on backend fixture generation."

1.  Review the generated output against this checklist:

| What to check                  | What to look for                                                                  | If missing or wrong                          |
| ------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------- |
| **Location**                   | Files in `.github/skills/generating-test-fixtures/`                               | Move the generated files to the correct path |
| **SKILL.md** `**name**`        | `generating-test-fixtures` (must match directory name)                            | Fix to match                                 |
| **SKILL.md** `**description**` | Third person, mentions Jest, supertest, `testing.instructions.md`                 | Add specifics                                |
| **SKILL.md body**              | References `./templates.md` and `./scripts/generate-fixtures.js` (one level deep) | Add relative path links                      |
| **SKILL.md body**              | Under 200 lines, no performance/snapshot/CI sections                              | Remove extra sections                        |
| **SKILL.md body**              | Workflow with a copyable checklist                                                | Add if missing                               |
| **templates.md**               | Jest template with describe/it, supertest, status codes, auth                     | Add missing templates                        |
| **generate-fixtures.js**       | Reads from `backend/data/`, generates test files, handles errors explicitly       | Fix error handling                           |
| **Comments**                   | All code comments start with `"generated-by-copilot: "`                           | Add the prefix                               |

1.  Accept the generated files. Make any corrections identified during review.

### Exercise 1.2 – Test the Fixture Generator

1.  Open a new Chat and ask a question that should trigger the skill:

> "Check backend/routes/books.js to see which endpoints are actually implemented (GET, POST, PUT, DELETE methods). Then generate Jest test fixtures only for those existing endpoints. Include tests for both success and error cases (401 no auth, 404 not found). Use realistic data from backend/data/books.json for assertions."

> **Why this wording matters:** The prompt instructs Copilot to inspect the router first (discovery step), then generate tests only for implemented methods. This ensures all generated tests will pass because they match the actual API, not an imagined contract. This is better TDD practice than generating tests for features that don't exist yet.

**Verify:**

- The `generating-test-fixtures` skill loads automatically
- Copilot inspects `backend/routes/books.js` to discover available endpoints (GET list, GET by id)
- Copilot generates tests only for endpoints that exist (not POST, PUT, DELETE which aren't implemented)
- Copilot follows the workflow from the skill (identify endpoints, generate, run, review)
- Generated tests follow `testing.instructions.md` conventions - supertest, describe/it blocks, "should" descriptions
- Tests reference actual data from `books.json` (realistic IDs and titles, not placeholder values)
- Comments start with `"generated-by-copilot: "`

1.  Run the generated tests to verify they all pass:

```
npm run test:backend
```

> **Expected outcome:** All generated tests pass because they match the actual implementation. This validates that the fixture generator respects real endpoints and doesn't create test contracts for unimplemented features.

### Best Practice: Endpoint Validation in Test Generation

When generating test fixtures with AI, always **inspect the actual router implementation first** before writing test expectations. This ensures two real-world workflows:

| Scenario                                  | Prompt Guidance                                                                                                                          | Expected Result                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Test existing features** (Exercise 1.2) | "Check backend/routes/{resource}.js to see which endpoints are actually implemented... generate tests only for those existing endpoints" | All tests pass immediately - validates that the API works as intended |
| **Plan future features** (TDD mode)       | "I want to add POST, PUT, DELETE endpoints to books. Generate test fixtures for these new methods to define the contract"                | Tests fail initially - guides implementation of new features          |

Regardless of which workflow you choose, explicit endpoint discovery prevents misalignment between tests and implementation.

### Exercise 1.3 – Generate Fixtures for a Different Resource

1.  Generate test fixtures for the favorites API:

```
/generating-test-fixtures Check backend/routes/favorites.js to see which endpoints are actually implemented (GET, POST, PUT, DELETE methods). Then generate Jest test fixtures only for those existing endpoints. Include tests for both success and error cases (401 no token, 404 not found). Use realistic data from backend/data/favorites.json for assertions.
```

**Verify:**

- Test file is created in `backend/tests/`
- Uses supertest for HTTP assertions
- Tests follow the Jest conventions from `testing.instructions.md`
- Includes both success and error case tests (401 no token, 404 not found)

1.  Generate test fixtures that validate edge-case book data:

```
/generating-test-fixtures Check backend/data/books.json to see which edge-case books exist. Then generate Jest test fixtures that verify only those edge-case books: special characters in titles, boundary years (1900, 2025), and very long title strings. Use actual data from books.json to build assertions.
```

**Verify:**

- Tests assert specific edge-case values, not generic placeholders
- The generate-fixtures script reads actual data from `books.json` to build assertions

1.  Run all tests to verify they pass:

```
npm run test:backend
```

### Exercise 1.4 – Understand Frontmatter Controls

Skills have two frontmatter properties that control visibility:

| Setting                          | `/` menu | Auto-loaded by model | Use case                                           |
| -------------------------------- | -------- | -------------------- | -------------------------------------------------- |
| Default (both omitted)           | Yes      | Yes                  | General-purpose skills                             |
| `user-invocable: false`          | No       | Yes                  | Background knowledge the model loads when relevant |
| `disable-model-invocation: true` | Yes      | No                   | Skills you only want to run on demand              |
| Both set                         | No       | No                   | Effectively disabled                               |

Try modifying your skill's frontmatter to experiment:

1.  Add `user-invocable: false` to the SKILL.md frontmatter. Save and type `/` in Chat - the skill should no longer appear in the menu.
2.  Remove that line and add `disable-model-invocation: true` instead. Now the skill only loads when you explicitly type `/generating-test-fixtures`.
3.  **Revert both changes** so the skill is back to default behavior.

> **Tip:** You can also extract a skill from a conversation. After a multi-turn debugging session, ask: "Create a skill from how we just debugged that" - Copilot captures the procedure as a reusable skill.

---

## Part 2 – Extract and Install Community Skills (30 min)

### Exercise 2.1 – Extract a Skill from a Debugging Conversation (15 min)

**Objective:** Turn a real multi-turn debugging session into a reusable skill. This demonstrates one of the most powerful Agent Skills workflows - capturing ad-hoc problem-solving as portable, repeatable knowledge.

**Scenario:** A common backend issue in this project is a route returning the wrong HTTP status code or malformed JSON. You will intentionally introduce a bug, debug it with Copilot, then extract the debugging procedure as a skill.

#### Step 1 - Introduce a deliberate bug

Open `backend/routes/books.js` and change one of the GET route handlers to return a wrong status code or break the response shape. For example, change a `res.json(books)` to `res.json({ data: books })` (wrapping the response in an extra object), or change `res.status(200)` to `res.status(201)`.

> **Important:** Remember what you changed so you can revert it later.

#### Step 2 - Trigger the failure

Run the backend tests to see the failure:

```
npm run test:backend
```

You should see at least one test fail due to the change you made (e.g., expected status 200 but got 201, or expected an array but got an object).

#### Step 3 - Debug with Copilot in a multi-turn conversation

Open a Chat session and walk through the debugging process with Copilot. Use prompts like:

1.  `"I'm getting a test failure in backend/tests/books.test.js. Here's the error: [paste the error output]. Help me find the root cause."`
2.  Let Copilot inspect the route file and the test file.
3.  Follow Copilot's suggestions to identify the mismatch between the route response and the test expectation.
4.  Apply the fix Copilot suggests (revert your deliberate change).
5.  Run `npm run test:backend` again to confirm all tests pass.

#### Step 4 - Extract the debugging procedure as a skill

Now that you have a successful debugging session in your chat history, type:

> **/create-skill** "Create a skill from how we just debugged that test failure. The skill should capture the general procedure: read the test error, compare the test expectation against the actual route handler response, identify the mismatch, fix it, and re-run tests."

#### Step 5 - Review the extracted skill

Copilot generates a `SKILL.md` (and possibly companion files) that captures the debugging workflow. Check that:

| What to check                    | What to look for                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Procedure captured**           | The skill describes a general debugging workflow, not just the specific bug you introduced       |
| **Steps are reusable**           | Steps like "read the error", "inspect the route handler", "compare with test" apply to any route |
| **References project structure** | Mentions `backend/routes/`, `backend/tests/`, `npm run test:backend`                             |
| **Not over-specific**            | Does not hard-code the exact status code or response shape you changed                           |

Accept or discard the skill.

> **Why this matters:** Extracting skills from conversations turns tribal knowledge into shared, repeatable workflows. A new team member can invoke `/debugging-backend-tests` instead of rediscovering the procedure from scratch.

---

### Exercise 2.2 – Install Community Skills from awesome-copilot (15 min)

**Objective:** Browse the [github/awesome-copilot](https://github.com/github/awesome-copilot) skills collection, pick skills that are relevant to this project, install them, and verify they work alongside your project skills.

> **Security reminder:** Always review shared skills before using them. Check the `SKILL.md` body and any scripts for unexpected or unsafe operations. VS Code's terminal tool controls provide safeguards for script execution, but reviewing skill content first is a best practice.

#### Step 1 - Choose community skills to install

The [awesome-copilot skills directory](https://github.com/github/awesome-copilot/tree/main/skills) contains hundreds of community-contributed skills. Here are three that directly complement this lab and the previous labs:

| Skill                                                                                                                 | Why it fits this project                                                                                                                                                                                                 | Complements                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| [`review-and-refactor`](https://github.com/github/awesome-copilot/tree/main/skills/review-and-refactor)               | Reads your `.github/instructions/*.md` and `copilot-instructions.md` files, then reviews and refactors code against those standards. Works with the instructions you wrote in Lab 00 and the Reviewer agent from Lab 01. | Custom Instructions (Lab 00), Reviewer Agent (Lab 01) |
| [`conventional-commit`](https://github.com/github/awesome-copilot/tree/main/skills/conventional-commit)               | Automates conventional commit messages by inspecting `git diff`. Useful after making changes throughout these labs - standardizes commit history.                                                                        | General development workflow                          |
| [`javascript-typescript-jest`](https://github.com/github/awesome-copilot/tree/main/skills/javascript-typescript-jest) | Jest best practices for JS/TS: mocking strategies, test structure patterns, async testing, and common matchers. Provides background knowledge that complements the test fixture generator you built in Part 1.           | Test Fixture Generator (Part 1)                       |

#### Step 2 - Install all three skills

Copy each skill directory into your project's `.github/skills/` folder. You can do this manually or use terminal commands:

```
# generated-by-copilot: Clone the awesome-copilot repo temporarily and copy the three skills
git clone --depth 1 --filter=blob:none --sparse https://github.com/github/awesome-copilot.git /tmp/awesome-copilot
cd /tmp/awesome-copilot
git sparse-checkout set skills/review-and-refactor skills/conventional-commit skills/javascript-typescript-jest
cp -r skills/review-and-refactor <your-project-path>/.github/skills/
cp -r skills/conventional-commit <your-project-path>/.github/skills/
cp -r skills/javascript-typescript-jest <your-project-path>/.github/skills/
cd -
rm -rf /tmp/awesome-copilot
```

> **Alternative:** You can also browse each skill on GitHub, copy the `SKILL.md` content, and create the files manually in `.github/skills/<skill-name>/SKILL.md`.

#### Step 3 - Verify the skills are discovered

Type `/` in the Chat input. You should now see **all your skills** in the menu:

- `/generating-test-fixtures` (from Part 1)
- `/debugging-backend-tests` (from Exercise 2.1, if you saved it)
- `/review-and-refactor` (community)
- `/conventional-commit` (community)
- `/javascript-typescript-jest` (community)

Type `/skills` to open the Configure Skills menu and confirm all skills are listed.

#### Step 4 - Test each community skill

**Test** `review-and-refactor`**:**

> "Review the code in backend/routes/books.js against our project's coding standards and instructions."

**Verify:** Copilot loads the `review-and-refactor` skill, reads your `.github/instructions/*.md` files, and reviews the route file against those conventions.

**Test** `conventional-commit`**:**

> "Help me commit the changes I've made during this lab."

**Verify:** Copilot runs `git diff`, analyzes the changes, and generates a properly formatted conventional commit message (e.g., `feat(skills): add test fixture generator and community skills`).

**Test** `javascript-typescript-jest`**:**

> "What Jest best practices should I follow when writing tests for an Express API with supertest?"

**Verify:** Copilot loads the `javascript-typescript-jest` skill automatically (based on the trigger terms) and provides advice that includes mocking strategies, describe/it structure, and async test patterns.

#### Step 5 - Observe skill composition

Notice how multiple skills can complement each other in a single workflow:

1.  Use `/generating-test-fixtures` to generate tests for a new resource
2.  Use `/javascript-typescript-jest` (auto-loaded as background knowledge) to improve test quality
3.  Use `/review-and-refactor` to verify the generated code follows project conventions
4.  Use `/conventional-commit` to create a clean commit for the changes

> **Key insight:** Skills are composable. You can build a library of skills where each one handles a specific concern, and Copilot loads the relevant combination based on your task.

---

## Summary

| What You Built                         | Type                                     | Location                                     |
| -------------------------------------- | ---------------------------------------- | -------------------------------------------- |
| Test Fixture Generator                 | Skill (AI-generated via `/create-skill`) | `.github/skills/generating-test-fixtures/`   |
| Backend Test Debugging                 | Skill (extracted from conversation)      | `.github/skills/debugging-backend-tests/`    |
| review-and-refactor (community)        | Community skill from awesome-copilot     | `.github/skills/review-and-refactor/`        |
| conventional-commit (community)        | Community skill from awesome-copilot     | `.github/skills/conventional-commit/`        |
| javascript-typescript-jest (community) | Community skill from awesome-copilot     | `.github/skills/javascript-typescript-jest/` |

> **Note:** This lab focuses on backend test fixture generation and community skill integration. Frontend E2E testing with Cypress has been removed from the project.

### Key Takeaways

- **Skills are folders** with a `SKILL.md` and optional resources (scripts, templates, examples)
- **Automatic discovery**: Copilot matches skills by `description` - write specific, third-person descriptions with trigger terms
- **Slash commands**: Every skill is also a `/` command for explicit invocation
- **Progressive loading**: Only the relevant skill body and resources load into context - keep SKILL.md under 500 lines
- **Utility scripts**: Pre-made scripts are more reliable and token-efficient than generating code each time
- **Custom locations**: Use `chat.agentSkillsLocations` to organize skills alongside agents or share across projects
- **AI generation**: Use `/create-skill` to bootstrap skills from a detailed natural language prompt
- **Conversation extraction**: After a multi-turn session, ask Copilot to "create a skill from how we just did that" to capture procedures as reusable skills
- **Community ecosystem**: Browse [github/awesome-copilot](https://github.com/github/awesome-copilot) for hundreds of ready-made skills - always review before installing
- **Skill composition**: Multiple skills can work together in a workflow - each handles a specific concern while Copilot loads the relevant combination
- **Complement agents**: Skills provide reusable knowledge; agents provide personas and tool restrictions - use both together
- **Portability**: Skills work across VS Code, Copilot CLI, and the Copilot coding agent

### Next Steps

- Browse more community skills at [github/awesome-copilot](https://github.com/github/awesome-copilot) and [anthropics/skills](https://github.com/anthropics/skills)
- Try setting `user-invocable: false` on `javascript-typescript-jest` to make it background-only knowledge that auto-loads without cluttering the `/` menu
- Review [skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) for advanced patterns
- Visit [agentskills.io](https://agentskills.io/) for the full Agent Skills specification
- Explore contributing your own skills back to the awesome-copilot community
