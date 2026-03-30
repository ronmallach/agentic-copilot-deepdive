---
name: React Component Standards
description: Use when writing or reviewing React JSX components. Enforces functional components, import order, props destructuring, Redux Toolkit hooks, CSS Modules, and auth token checks.
applyTo: '**/*.jsx'
---

# React Component Standards

## Functional Components Only

Use functional components with hooks. Never use class components.

## Import Order

Follow this order, separated by blank lines:

```js
import React, { useState, useEffect } from 'react';

import { someLibrary } from 'third-party';

import MyComponent from './MyComponent';

import styles from '../styles/ComponentName.module.css';
```

## Props Destructuring

Destructure props in the function signature with defaults:

```js
// ✅ Good
function BookCard({ title = 'Untitled', author = 'Unknown' }) { ... }

// ❌ Bad
function BookCard(props) { const title = props.title; ... }
```

## Redux Hooks

Use `useAppDispatch` and `useAppSelector` from `../store/hooks` — never import raw hooks from `react-redux`.

```js
// ✅ Good
import { useAppDispatch, useAppSelector } from '../store/hooks';

const dispatch = useAppDispatch();
const books = useAppSelector((state) => state.books.items);

// ❌ Bad
import { useDispatch, useSelector } from 'react-redux';
```

## State Management

- Use Redux Toolkit slices in `frontend/src/store/` for shared state (data loaded from the API, auth, favorites).
- Use `useState` only for local UI state: open/closed toggles, form field values.

## CSS Modules

Import styles from the matching module file and reference classes via the `styles` object:

```js
import styles from '../styles/ComponentName.module.css';

return <div className={styles.container}>...</div>;
```

## Auth Token Check

Always read `token` from the store and guard authenticated dispatches — redirect to login if missing:

```js
const token = useAppSelector((state) => state.user.token);

function handleAction() {
  if (!token) {
    navigate('/login');
    return;
  }
  dispatch(someAction({ token }));
}
```
