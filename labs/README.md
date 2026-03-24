# Agentic DevOps with GitHub Copilot - Lab Guide

> **Slide Deck:** [GHCP\_DeepDive\_AgenticDevOps.pdf](../GHCP_DeepDive_AgenticDevOps.pdf) - covers all customization concepts, architecture diagrams, and lab overviews presented during the workshop.

This workshop teaches you to customize GitHub Copilot across its full agentic stack: custom instructions, agents, hooks, skills, plugins, MCP servers, the Coding Agent, and model-tiered PR workflows. Each lab builds on the previous one, using the **Book Favorites** app as the running project.

---

## Lab Summary

| Lab | Title | Duration | Mode | Description |
| --- | --- | --- | --- | --- |
| [00](00-custom-instructions-exercise.md) | Custom Instructions | ~45 min | VS Code | Define coding standards, naming conventions, and architecture rules in `.instructions.md` files so Copilot produces consistent, project-aligned code automatically |
| [01](01-custom-agents-exercise.md) | Custom Agents | ~65 min | VS Code | Build specialized AI personas (Planner, Implementer, Reviewer) with tool restrictions and handoffs; learn coordinator-worker and multi-perspective orchestration patterns |
| [02](02-hooks-exercise.md) | Agent Hooks | ~30 min | VS Code | Execute shell commands at agent lifecycle points - auto-format on file save, security guards before destructive operations, agent-scoped hooks via `/create-hook` |
| [03](03-skills-exercise.md) | Agent Skills | ~60 min | VS Code | Create portable, reusable capabilities (Test Fixture Generator, Data Seeder) using `/create-skill`; install community skills; learn skill composition and visibility controls |
| [04](04-plugins-exercise.md) | Agent Plugins | ~45 min | VS Code | Bundle instructions, agents, hooks, and skills from Labs 00–03 into a distributable plugin with a `plugin.json` manifest for one-click installation |
| [05](05-mcp-builder.md) | Build an MCP Server | 45–60 min | VS Code | Build a TypeScript MCP server from scratch with the MCP Builder skill - scaffold, implement tools with Zod validation, test with MCP Inspector, wire into VS Code |
| [06](06-mcp-data.md) | Exercise the MCP Server | 45–60 min | VS Code | Use the MCP server in real workflows - generate features from live data, create test fixtures from the book catalog, extend the server with new tools |
| [07](07-coding-agent.md) | Coding Agent | ~50 min | GitHub.com | Use the GitHub Copilot Coding Agent to implement features by assigning Issues - walk through the prompt-to-PR lifecycle, multi-issue coordination, and Copilot-assisted issue management |
| [08](08-capstone-greenfield.md) | Greenfield Capstone | ~60 min | VS Code | Build a Feature Flag Service from scratch using the full AI pipeline - custom instructions, MCP server, hooks, skills, and a coordinated agent pipeline to plan, implement, and security-review |
| [09](09-capstone-brownfield.md) | Brownfield Capstone | ~60 min | VS Code | Deliver a full-stack Book Quotes feature in a production sprint using everything from Labs 00–06 - MCP tools, custom instructions, agent handoffs, hooks, and reusable skills |
| [10](10-plan-generate-workflow.md) | Plan → Generate → Implement | ~45 min | VS Code | Use `/plan` and `/generate` slash commands to orchestrate a model-tiered PR workflow - a large model plans and decomposes work, a smaller model executes each task |

---

## Learning Path

```
Lab 00: Custom Instructions ──► Lab 01: Custom Agents ──► Lab 02: Hooks
                                                               │
                                            Lab 03: Skills ◄───┘
                                                 │
                                            Lab 04: Plugins
                                                 │
                              Lab 05: Build MCP Server ──► Lab 06: Exercise MCP
                                                                │
                                                           Lab 07: Coding Agent
                                                                │
                                        ┌───────────────────────┴───────────────────────┐
                                   Lab 08: Greenfield                          Lab 09: Brownfield
                                   (Feature Flag Service)                      (Book Quotes Feature)
                                        └───────────────────────┬───────────────────────┘
                                                                │
                                                  Lab 10: Plan → Generate → Implement
                                                  (Model-Tiered PR Workflows)
```

---

## Prerequisites

*   **VS Code** - Insiders or latest Stable with GitHub Copilot extension (Agent Mode enabled)
*   **GitHub Copilot** - Pro, Pro+, Business, or Enterprise subscription
*   **Node.js** - v18 or later
*   **This repository** cloned locally with `npm install` run in both `backend/` and `frontend/`

---

## Application Under Test

All labs work with the **Book Favorites** app:

*   **Backend:** Express.js REST API with JWT auth, books, and favorites routes
*   **Frontend:** React + Redux SPA with Vite, CSS Modules, and Cypress E2E tests
*   **Data:** JSON-based book catalog in `data/` and `backend/data/`