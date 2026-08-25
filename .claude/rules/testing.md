---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/__fixtures__/**"
---

# Testing

This is a timeboxed build. Depth is concentrated, not spread: the facet engine is tested
thoroughly and everything else gets one test that would catch a real break.

For the facet engine, write the test before the implementation — and once it passes,
break the implementation on purpose to watch it fail. A test that has never failed is
not yet evidence.

## Coverage priorities

1. **The facet engine** — thoroughly. Exclude-self behaviour, zero-count options
   retained, counts responding to other dimensions. This is the part with real
   invariants and the part an interviewer will look at.
2. **Filter predicates** — boundaries inclusive at both ends, one-sided ranges, empty
   selection means no constraint, OR within a dimension and AND across.
3. **CSV parser** — one fixture mixing valid and malformed rows: assert the valid ones
   parse, the bad one is rejected with its row number and reason, and the reject count
   is right. One fixture, not six.
4. **API** — one `.inject()` happy path, one rejected unknown param.
5. **Frontend** — one test that applying a filter changes the rendered list.

Not tested: getters, type definitions, Tailwind classes, third-party behaviour.

If time is short, cut from the bottom. Never cut item 1.

## Rules

- Never mock the domain layer. It's pure and fast — use real fixture data.
- Mock only at genuine I/O boundaries, of which this app has almost none.
- Test names state behaviour: `"excludes properties above the max price"`,
  not `"filterProperties works"`.
- One behaviour per test. Several `expect`s are fine if they verify one behaviour.
- Fixtures live in `src/domain/__fixtures__/` — a small hand-written set with
  known values, so expected counts are obvious to a reader without running anything.