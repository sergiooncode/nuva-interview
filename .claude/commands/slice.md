---
description: Kick off the first vertical slice — CSV to rendered grid, one dimension
argument-hint: <csv-path> <first-dimension>
---

Arguments: $ARGUMENTS
The first is the CSV path, the second is the filter dimension to build first.

Read CLAUDE.md and .claude/rules/ first.

Read the CSV before writing any schema, and tell me anything odd you notice in the
data — unexpected values, mixed languages, missing cells, anything that will bite the
parser.

Then the first milestone, and nothing beyond it: **properties from that CSV rendered in
the browser.** Parse → `GET /api/properties` returning results plus facets → React grid
of cards. One filter dimension only, the one named above: checkboxes, Apply, Reset, and
zero-count options rendered unavailable but still visible.

Out of scope for now — don't build it and don't ask about it: sorting, pagination, the
other filter dimensions, the price histogram. Availability and Reset semantics are
already settled in the domain rules; don't re-ask them.

Tests on the facet engine only, written first, and once green break the implementation
on purpose to confirm the test actually fails.

Tell me when it's on screen and I'll decide what comes next.