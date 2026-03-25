---
name: CSS Module Standards
description: Use when writing or reviewing CSS Module files. Enforces kebab-case naming, CSS custom properties, flat selectors, and mobile-first responsive design.
applyTo: '**/*.module.css'
---

# CSS Module Standards

## Class Naming

Use kebab-case for all class names. No camelCase or PascalCase.

```css
/* ✅ Good */
.book-card { }
.nav-header { }

/* ❌ Bad */
.bookCard { }
.NavHeader { }
```

## No `!important`

Never use `!important`. Redesign the selector specificity instead.

## CSS Custom Properties

Use CSS custom properties defined in `App.module.css` for colors and spacing — do not hardcode repeated values:

```css
/* ✅ Good */
color: var(--color-primary);
padding: var(--spacing-md);

/* ❌ Bad */
color: #007bff;
padding: 1rem;
```

## Flat Selectors

Keep selectors shallow — maximum 2 levels of nesting:

```css
/* ✅ Good */
.book-card { }
.book-card .title { }

/* ❌ Bad */
.book-card .content .meta .title { }
```

## Mobile-First Responsive Design

Write base styles for mobile, then enhance with `min-width` media queries:

```css
.book-grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .book-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```
