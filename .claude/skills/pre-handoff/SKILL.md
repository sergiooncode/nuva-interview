---
name: pre-handoff
description: Final review before presenting the work — verification, scope check, and a short record of decisions. Use when the implementation is believed complete, or when time is nearly up and the work needs to be left in a defensible state.
---

# Pre-handoff

Do these in order. Report what actually ran, not what should pass.

## 1. Verify

```
npm run typecheck && npm test && npm run lint
```

If anything fails, fix it before continuing. A green build matters more than the last
feature.

## 2. Review the diff for scope creep

Read `git diff`. Flag anything that wasn't asked for: unused abstractions, dependencies,
config, dead code, commented-out blocks, `console.log`. Remove them.

## 3. Check the test set honestly

State plainly what is and isn't covered. If the filter engine is well covered and the
UI has one smoke test, say so — that's a defensible choice. Do not claim coverage that
doesn't exist, and do not pad with tests that assert nothing.

## 4. Write the README

Short. Three sections.

**Running it** — install, dev, test. Two lines each.

**Decisions** — the three or four choices that had a real alternative, each as a compact
ADR. Four lines, no headings, no template scaffolding:

> **Filtering runs server-side.** The dataset is small enough to filter in the browser
> in a single pass. Server-side was chosen because filter logic is the part with real
> invariants — facet scoping, inclusive bounds, unit conversion — and it belongs where
> it can be tested without a DOM. The cost is a round trip per Apply, which at this
> size is imperceptible; if the dataset stayed this small permanently, client-side would
> be defensible.

The shape is: **what was decided** (bold, one sentence) → **what the alternative was** →
**why this one** → **what it costs**. The alternative and the cost are the parts that
matter; a decision with no stated trade-off reads as a preference, not a judgement.

Only write one where a competent engineer might reasonably have chosen otherwise. Skip
anything that was never in question — nobody needs an ADR for using TypeScript. Three
good ones beat eight thin ones.

Candidates worth checking against that bar: where filtering lives, how facet counts are
scoped, the money representation, one endpoint versus two, pending vs applied filter
state, what got tested and what deliberately didn't.

**What I'd do next** — what was deliberately left out and what would come first with
more time. Be specific; this is a stronger signal than pretending the work is finished.

## 5. Summarise

Two or three sentences: what works, what's tested, what's missing. No preamble.
