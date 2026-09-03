# Yaya House

A filterable catalogue of rental units. 50 apartments parsed from CSV at startup,
filtered server-side by bedrooms and price, rendered as a card grid.

![The catalogue: 37 available rentals, the availability switch and the Filtros button](screenshots/catalogue.png)

## Running it

Against the CSV, no database required:

```
npm install
npm run dev          # API on :3000, web on :5173 — open http://localhost:5173
```

Or the whole stack in containers — Postgres, migrations, the CSV load, then the two
services, each waiting on the previous one's health rather than on a sleep:

```
make up              # web on :8080, api on :3000
make smoke           # health, ready, a search, and the web origin
make down
```

```
make ci              # lint, typecheck, test, build — the same jobs a pipeline runs
make test-integration# the SQL adapter checked against the in-memory one, live
make help            # every target
```

## Layout

```
apps/api                  Fastify transport and the composition root
apps/web                  React UI, served by nginx in production
packages/domain           filters, facets, money, and the repository port
packages/application      use cases; talks to ports, never to adapters
packages/infrastructure   CSV and Postgres adapters, config, migrations
packages/contracts        the wire shape, shared by api and web
```

The arrows between those boxes are enforced by `no-restricted-imports` in
`eslint.config.js` rather than by convention. The web app may import `@yaya/contracts` and
nothing else, so a server internal cannot drift onto the wire by being convenient to
import. The domain imports no workspace package at all. Application code depends on the
port in `@yaya/domain`, never on an adapter. Crossing a layer fails the build.

**The store is a choice, not a fact.** `FilterState` is a query specification rather than a
predicate over an array, so the same filter is evaluated either by a pass over memory or
as SQL, behind one `PropertyRepository` port. Both adapters ship:
`packages/infrastructure/src/search-equivalence.test.ts` puts eleven filter shapes through
both and asserts identical results *and* identical facet counts, which is what keeps the
in-memory implementation honest as the oracle for the SQL one rather than leaving it as
dead code.

## Decisions

**Filtering runs server-side.** The dataset is 50 rows and would filter in the browser in
a single pass. Server-side was chosen because the filter logic is the part with real
invariants — facet scoping, inclusive bounds, euro-to-cent conversion — and it belongs
where it can be tested without a DOM. The cost is a round trip per Apply, imperceptible
at this size; if the catalogue were guaranteed to stay this small, client-side would be
defensible.

**Each dimension's facet counts exclude that dimension's own selection.** The obvious
implementation counts against the fully-filtered set, which is one line shorter. It was
rejected because options then vanish the moment a user selects one — pick "2 bedrooms"
and every other bedroom count reads zero, so the filter can only ever be narrowed. The
cost is a second pass over the array per dimension, and a `computeFacets` that is
harder to read than a one-liner; `facets.test.ts` exists mostly to hold this in place.

**Availability is a scope, not a facet.** It could have been a third dimension with its
own counts. It isn't, because it must constrain the results *and every facet count*
identically — if it scoped only the results, a bedroom option could read "5" and return
nothing. So `except` never lifts it, and it returns no counts of its own. The cost is
an asymmetry: one control in the toolbar behaves unlike the ones in the modal, which is
also why it applies immediately rather than waiting for Apply.

**Money is a branded `Cents` type; nothing else is branded.** Plain numbers throughout
would be simpler and the Zod schema already rejects malformed input. Money earns the
brand because the euro/cent conversion is silent and the failure is expensive — passing
euros where cents are expected undercharges by 100× and no test would necessarily catch
it. Sizes and room counts stay plain numbers: branding them would force casts through
the bucketing code to catch errors the schema already catches. The cost is one cast,
confined to `money.ts`.

**Prices cross the wire in euros, results come back in cents.** Consistent units either
way would be tidier. Euros won for the query string because `?minPrice=800` is a URL a
human can read and edit, and `api.md` documents that form; cents won for the response
because that is the domain representation and the frontend formats at render. The cost
is a genuine asymmetry in the contract, so `?minPrice=1180.50` is a 400 rather than
silently rounding.

## What's tested

Depth is concentrated rather than spread, per `testing.md`. 51 tests:

- **Facet engine — thoroughly** (16). Exclude-self on both dimensions, zero-count
  options retained, counts responding to the *other* dimension, the availability scope
  applied to counts, bucket edges. Written before the implementation, and the
  implementation was then broken on purpose seven times to confirm each test fails —
  removing exclude-self, dropping zero-count options, ignoring the scope, taking bucket
  spans from the filtered set, and two parser mutations.
- **Filter predicates** (16). Both bounds inclusive, one cent either side of each,
  one-sided ranges, empty selection as no constraint, OR within a dimension, AND across.
- **CSV parser** (7). One fixture with three valid and three malformed rows, asserting
  row numbers, reasons, and the two traps in this data: a studio's `0` bedrooms
  surviving a truthiness check, and `"false"` not being read as truthy.
- **API** (9). Happy path parsed through the response schema, both dimensions together,
  unknown param, non-integer euros, inverted range.
- **Frontend** (3). One test that applying a filter changes the rendered list, plus the
  scope switch and the blocked incoherent range.

Not tested: Tailwind classes, type definitions, third-party behaviour, and the
`Detalles y alquilar` button, which has no destination yet.

## What I'd do next

1. **The dual-handle price slider.** The histogram and buckets are already computed and
   rendered; the control is two number inputs. The slider was deferred to get the
   two-filter interaction visible on the API first.
2. **The remaining dimensions** — bathrooms, size, neighborhood, brand. The domain is
   shaped for it: add a field to `FilterStateSchema`, a predicate, an `except` branch,
   a query param, a control. `.claude/skills/add-filter-dimension` documents the six steps.
3. **Per-property imagery.** Every card renders the same photograph from
   `public/property.jpg` because the CSV has no image column; cards fall back to a
   gradient if it is absent. That placeholder is also a watermarked stock comp, so it
   needs replacing with licensed art before this goes anywhere public.
4. **Restore filter state from the URL.** The query encoding already supports it —
   `?bedrooms=2,3&minPrice=800` is a complete filter specification — but the frontend
   does not read it on load, so links are not yet shareable.
5. **Re-export the icons at 2× or as SVG.** The three card icons and the wordmark are
   1× PNGs (24–29 px) and are soft on retina; PNGs also can't take colour from the
   design tokens. Their layout is settled — each sits in an identical box and scales to
   fit, so the differing aspect ratios no longer read as three different sizes — but no
   amount of CSS makes a 1× asset sharp.

## Beyond the prototype

Those five are the product roadmap. This section is the other axis: what changes if this
stops being a catalogue and becomes the catalogue inside an operational platform.

The pressure would not come from row count — a few thousand units fit in memory with room
to spare — but from process complexity: contracts, payments, incidents and the integrations
around them. These are the decisions I expect to revisit, and what each one currently buys.

| Decision | Prototype | In production | Trade-off |
|---|---|---|---|
| Catalogue storage | In-memory array, parsed from CSV at startup | PostgreSQL behind a query boundary | `FilterState` is already a query specification, so only the evaluator changes. The array version stays on as the differential-test oracle for the SQL one. |
| Facet computation | One pass per dimension | Conditional aggregation in a single pass; a search index once text relevance matters | Exclude-self is `post_filter` + `aggs` — a solved problem to adopt rather than reimplement. |
| Request handling | The route calls the domain directly | An application layer | Only once there is orchestration, authorization or a transaction to hold. A service layer that merely forwards is a cost with no buyer. |
| Wire shape | The domain object *is* the wire object | An explicit projection | Convenient now; the day the model gains an internal field, it is public by default. Exposure should be opt-in. |
| `status` | A column on the row | Derived from the contract timeline | Availability is a projection of contract state, not a property of the flat — which turns it from a boolean into a date-range query. The largest modelling change here. |
| Adding a dimension | Six coordinated edits, documented as a procedure | A dimension registry | Six edits with no compiler assistance is how a filter ships half-wired: a control the backend ignores. |
| Filtering location | Server-side | Unchanged | One honest answer to "what matches these filters", and the only place authorization can live. |
| Domain style | Pure functions over plain data | Unchanged | A predicate that has to compile to SQL cannot live on an instance. |

**What I would not build yet, and what would change my mind.**

- **Microservices** — when deployment cadence or team boundaries actually diverge, not when
  the diagram gets crowded. A modular monolith with lint-enforced import boundaries buys
  most of the benefit at none of the cost.
- **Event sourcing or CQRS** — the read and write models are the same shape today. Revisit
  when auditability makes the event log the source of truth, which contracts likely will.
- **A repository interface** — one implementation is a guess about the second. The seam
  belongs where there are two evaluators to check against each other, not before.
- **Caching** — the whole catalogue is already resident. Revisit above a p95 of ~200 ms.

**Where AI belongs, and where it doesn't.** Natural-language search is the first thing I
would add, and it is not RAG — it is constrained extraction. A model turns free text into a
candidate `FilterState`, `FilterStateSchema` validates it, and the existing deterministic
engine runs unchanged. The guardrail did not need designing: the schema already is one, and
a malformed extraction is a parse failure rather than a wrong answer, falling back to
keyword search.

It does not belong on facet counts, price filtering or availability. Those are exact, cheap
and must be auditable — a hallucinated count of "5" that returns three rows is precisely the
bug the exclude-self rule exists to prevent. The rule I would hold to: **AI proposes,
deterministic code disposes.** A model may produce a query, a draft or a classification,
always into a validated structure; it never sits where a wrong answer is indistinguishable
from a right one.
