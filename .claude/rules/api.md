---
paths:
  - "src/api/**/*.ts"
---

# API layer

A thin transport shell: parse and validate query params with Zod → call the domain → serialise the result. No business logic in route handlers.

## Resources

One resource: GET /api/properties. It is a search endpoint, not a REST collection — the query string is a filter specification and the response carries results plus facets together.

Do not derive resources from domain models. There is no /facets, no /neighborhoods, no /buildings, and no per-entity endpoint. A second endpoint would let the results and the available filters disagree, which is the failure this design exists to prevent.

## Query encoding

Flat and URL-friendly. Every bound is independently optional — `?minSize=40` with no `maxSize` is valid:

```
?bedrooms=2,3&bathrooms=1&minPrice=800&maxPrice=1600&minSize=40
```

Comma-separated for multi-value dimensions. Reject unknown params rather than ignoring them — a typo'd filter name should fail loudly, not silently return unfiltered results.

This encoding makes shareable links *possible*, but the frontend only actually restores state from the URL if that gets built. Don't claim it in the README unless it's wired.

## Response shape

One endpoint returns both the filtered results and the facet counts for every dimension.
Two round trips would let the list and the available filters disagree.

## Errors

Map domain errors to HTTP status in one place at the edge. Invalid query params are 400 with a body naming the offending field. Never leak a stack trace.