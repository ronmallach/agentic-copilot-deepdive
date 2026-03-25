---
name: 'Documentation Standards'
description: 'Use when writing or reviewing Markdown documentation files. Enforces heading case, section structure, code block formatting, line length, and list style.'
applyTo: '**/*.md'
---

## Structure

- Start every document with a single sentence summarising what it covers.
- Include a **Prerequisites** section in any how-to or setup guide, listing required tools, versions, or access before the first step.

## Headings

- Use sentence case: `## Getting started`, not `## Getting Started`.

## Code blocks

- Always use fenced code blocks with a language identifier: ` ```javascript `, ` ```bash `, ` ```json `.
- Use ` ```bash ` for all terminal/shell commands — never plain-text or untagged fences.

## Lists

- Use **numbered lists** for sequential steps.
- Use **bullet lists** for unordered items or options.

## Line length

- Keep all lines at or below 120 characters for readability.
