---
name: add-filter-dimension
description: Add a new filter dimension (price, size, bedrooms, bathrooms, or similar) end to end across the domain, API and UI. Use whenever a filter needs to be added or an existing one changed, so no layer is left out of sync.
---

# Add a filter dimension

A dimension is only done when all six steps are complete. Partial work leaves the UI
offering a filter the backend ignores, which is worse than not having it.

Work in this order — tests before implementation in the domain layer.

## 1. Domain type

Add the field to the filter schema in `src/domain`. Range dimensions get a
`{ min, max }` with a refinement asserting `min <= max`. Discrete dimensions get an
array; an empty array means "no constraint", never "match nothing".

## 2. Filter predicate

A pure function taking the dimension's selection and a property, returning boolean.
Range bounds are inclusive. Compose it into the main filter with AND across dimensions.

## 3. Facet computation

The dimension's counts are computed against the dataset filtered by **all other
dimensions, excluding this one**. If you filter by everything including this dimension,
options disappear as soon as one is selected — that's the bug this step exists to avoid.

Return every option the dataset contains, including those with a count of zero.

## 4. Query parameter

Extend the Zod query schema in `src/api`. Multi-value dimensions parse from a
comma-separated string. Unknown params are rejected, not ignored.

## 5. UI control

Add the control to the filter panel. It writes to **pending** state, not applied.
Options with a zero count render unavailable but still focusable — `aria-disabled`,
not the `disabled` attribute. See frontend.md; a `disabled` input is skipped by
keyboard navigation and ignored by screen readers.

## 6. Tests

At minimum, for this dimension:

- the predicate at both bounds and just outside them
- an empty selection returns everything
- facet counts are unaffected by this dimension's own selection
- facet counts do respond to the other dimensions
- one API test asserting an invalid value for this param is rejected

Then run `npm run typecheck && npm test`.