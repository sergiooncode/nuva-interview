---
paths:
  - "src/web/**/*.tsx"
  - "src/web/**/*.ts"
---

# Frontend

Renders results and collects filter state. It never filters — the backend owns that,
even though the dataset is small enough to filter client-side.

## Filter state

Two states, not one:

- **pending** — what the user has staged in the panel
- **applied** — what was last sent to the backend

Apply commits pending to applied and fetches. Reset clears both. The results list
reflects applied state only, so it never changes as the user is still choosing.

Apply is disabled when pending equals applied.

## Facet rendering

An option with a zero count renders unavailable but stays reachable: `aria-disabled`
with the input still focusable, not the `disabled` attribute. A `disabled` input is
skipped by keyboard navigation and ignored by screen readers, so "1 dormitorio —
unavailable" becomes invisible to exactly the users who most need to be told. Style it
muted and ignore clicks in the handler.

## Conventions

- `useState` is sufficient. No state management library.
- Fetch on the Apply handler, not in a `useEffect` watching filter state.
- Derive display values during render; don't mirror server data into local state.
- Format money at the render boundary — the domain hands you integer cents.
