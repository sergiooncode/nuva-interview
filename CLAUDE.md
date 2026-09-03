# CLAUDE.md

Property listing app: a filterable catalogue of rental units.
Backend owns all filtering logic. The frontend collects filter state and renders results;
it never filters.

Source data is a CSV. Treat it as untrusted input: parse once at startup into validated
domain objects. A malformed row is rejected, not fatal — collect the rejects with their
row number and reason, serve the valid rows, and surface the reject count. Nothing is
dropped silently, but one bad row can't blank the page.

## Stack

- TypeScript, strict mode. Backend: Fastify. Frontend: Vite + React + Tailwind.
- Validation: Zod. Schemas are the source of truth; derive types with `z.infer`,
  never hand-write a type alongside its schema.
- Tests: Vitest. Store: PostgreSQL via `pg` and hand-written SQL — no ORM, because the
  facet aggregation is the interesting query and it should stay legible.
- npm workspaces. Nothing is shared by reaching across a directory.

## Layout

The map is in the [README](README.md#layout), because it is documentation for whoever
reads the repo rather than an instruction to an agent.

What matters here is that the layering is **enforced, not described**:
`no-restricted-imports` in `eslint.config.js` is the authority. The web app may import
`@yaya/contracts` only, the domain imports no workspace package at all, and application
code may not reach for an adapter. An import that crosses a layer fails the build — so
don't work around the rule, move the code.

## Commands

```
npm run dev          both apps against the CSV
npm test             all tests (the Postgres suite skips without TEST_DATABASE_URL)
npm run typecheck    tsc --noEmit across workspaces
npm run lint

make ci              lint, typecheck, test and build — the same jobs a pipeline runs
make up              postgres + migrate + seed + api + web, ordered by health
make smoke           check the running stack answers on every endpoint that matters
```

A `Stop` hook runs `typecheck && test` at the end of every turn, so a broken build
surfaces without being asked for. Don't predict what a command would print — run it.

Lint and `tsconfig` enforce type discipline: `any`, non-null assertions and barrel-file
imports all fail the build. Don't work around them; fix the code.

Not lint-enforced, so observe it: named exports only, no default exports (except config
files that require them).

## Order of work

**Get a working vertical slice on screen before deepening anything.** The first
milestone is: a real apartment rendered in the browser, from CSV through the endpoint to
the grid, with one filter dimension working end to end. Everything else — the remaining
dimensions, the histogram, exhaustive tests — comes after that slice is visibly working.

This overrides the instinct to build the domain layer completely first. A deep domain
layer behind a blank page is a failed deliverable; a thin path that works is not.

Within the slice, build enforcement before the logic that depends on it: the Zod schema
and the branded `Cents` type before the functions that consume them. A constraint
expressed as a type holds for the rest of the session; one expressed in this file is
only advisory.

`src/domain/` carries its own rules covering money, filter semantics and facets.
Read them before writing anything in that directory.

## Working agreement

- One coherent change at a time, then run the tests. If a change would touch more than
  ~150 lines before anything is verified, split it.
- Never edit a test to make it pass. A failing test means the code is wrong until argued
  otherwise; if the test really is wrong, say why before touching it.
- Commit when a change is coherent and green: after the domain layer passes, after the
  endpoint works, after the UI renders. Short imperative subject, no body, no
  attribution trailers. Never commit red — if the tests fail, fix or revert first.
  These commits are rollback points, so they must each stand alone.
- Ask rather than invent business rules. Where a rule isn't stated in these files and
  the choice would be baked into the domain layer, ask — that's expensive to unpick later.
- No unrequested scope: no caching, no logging framework, no state management library,
  no new dependencies. Everything needed is already installed. Propose in one sentence
  and wait.
- Don't create an abstraction for a single implementation.
- Comments explain why, never what. If a comment restates the code, rename instead.
- Prefer making a mistake unrepresentable over documenting it. If a rule in this file
  could be a type, a schema refinement or a lint rule, build that instead and delete
  the rule.