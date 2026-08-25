---
paths:
  - "src/domain/**/*.ts"
---

# Domain layer

Pure functions over plain data. No classes, no DI container, no repository interface.
This is a filter over an in-memory array — keep it that way.

## Money

Model money as a branded type so the convention can't be violated silently:

```ts
type Cents = number & { readonly __brand: unique symbol };
```

`monthly_rent` arrives in the CSV as euros. Convert once at the parse boundary via a
constructor that rejects non-integers, and keep `Cents` everywhere inside. Passing a
euro amount where cents are expected then fails to compile rather than under-charging
by a factor of a hundred. Format only at render.

**Brand money and nothing else.** Size in m², bedroom and bathroom counts stay plain
numbers. Branding every scalar forces generic casts through the filter and bucketing
code and catches errors the Zod schema already catches. Money earns it because the unit
conversion is silent and the failure is expensive; the others don't.

## Filter semantics

- Ranges are inclusive at both bounds. **Each bound is independently optional** — a
  min with no max, or a max with no min, are both valid and constrain one side only.
  The refinement asserts `min <= max` only when both are present. A range requiring
  both bounds is wrong: `?minSize=40` alone is a legitimate query.
- Multiple values within one dimension are OR.
- Across dimensions, AND: `(2 bedrooms OR 3 bedrooms) AND (price in range)`.
- An empty selection for a dimension means "no constraint", not "match nothing".
- There is one **canonical default filter state**: every dimension unconstrained and
  availability scoped to available only. Reset assigns that state — it doesn't need to
  know which controls exist, so a dimension added later resets for free.

## Availability

`status` is not a facet dimension — no counts are returned for it. It is a **scope**:
it filters the results and every facet count, always, and the exclude-self rule never
applies to it.

Getting this wrong in the other direction is the bug to avoid: if availability scoped
the results but not the counts, a bedroom option could read "5" and return zero rows.

## Facet counts — the pitfall

Each dimension's facet counts are computed against the dataset filtered by **all other
dimensions, excluding that one**. Bedroom counts reflect the price, size and bathroom
filters, but not the bedroom filter.

Computing every facet against the fully-filtered set is the obvious bug: options vanish
the moment the user selects one. Write the test for this before the implementation.

Return options with a count of zero rather than omitting them. The UI greys them out,
so it needs to know the option exists and is currently unavailable. Dropping them from
the response makes options disappear, which is a different and wrong interaction.

## Errors

Throw typed domain errors. Never return `null` to signal failure. Mapping to HTTP
status happens at the API edge, not here.