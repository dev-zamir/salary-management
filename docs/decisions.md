# Design Decisions

Lightweight ADR-style notes capturing the key decisions made while building
this solution, the alternatives considered, and the reasoning. These are
deliberately short — the goal is to show *how* decisions were made, not to
produce formal documentation.

---

## ADR-001: Rails + React + PostgreSQL over Python/FastAPI

**Status:** Accepted

**Context**
The JD lists Python / Go / Java as preferred backend languages. The
assessment explicitly allows "any other framework of your choice."

**Decision**
Use **Ruby on Rails (API mode) + React + PostgreSQL**.

**Alternatives considered**
- **FastAPI + SQLAlchemy + React** — directly aligned with the JD; modern
  Python-native stack.
- **Django REST Framework + React** — batteries-included Python equivalent
  to Rails.

**Reasoning**
- Rails' conventions let me spend assessment time on *design, testing, and
  product thinking* instead of scaffolding boilerplate.
- The problem (CRUD + aggregation over a single table) is ActiveRecord's
  sweet spot.
- Owning the choice and explaining it in the README is itself a signal of
  thoughtful engineering — the assessment rewards trade-off explanation.

**Trade-offs**
- Reviewers on a Python/DevOps role may prefer to see Python. Mitigated by
  being explicit about the choice here and in the README.

---

## ADR-002: PostgreSQL over SQLite

**Status:** Accepted

**Context**
The assessment allows "any relational database of your choice, like SQLite."

**Decision**
Use **PostgreSQL 15+**.

**Reasoning**
- Realistic concurrency semantics (MVCC, row-level locking) vs SQLite's
  writer lock.
- Better aggregation and query planner for the insights endpoints.
- Closer to what a real HR tool would run on in production.
- First-class support on Render's free tier (the chosen deploy target).

**Trade-offs**
- Slightly more setup friction than SQLite — developers need a local
  Postgres server. Documented in the backend README.

---

## ADR-003: API-only Rails (no Hotwire / server-rendered views)

**Status:** Accepted

**Context**
Rails can be used full-stack (Hotwire/Turbo) or as a JSON API backing a
separate SPA.

**Decision**
Use **Rails in API-only mode** with a separate React SPA.

**Reasoning**
- The assessment explicitly asks for a React or Next.js UI.
- Clean separation of concerns — backend and frontend can be developed,
  tested, and deployed independently.
- Mirrors how the tool would realistically be built in production.

**Trade-offs**
- More moving parts than Hotwire. Worth it for the explicit SPA requirement.

---

## ADR-004: MUI (Material UI) for the component library

**Status:** Accepted

**Context**
We need a component library for forms, dialogs, layout, and — critically —
a data grid capable of handling the employee list.

**Alternatives considered**
- **shadcn/ui + TanStack Table + Tailwind** — modern, owns component code,
  great signal of engineering taste. Rejected because it adds setup time
  and the assessment rewards shipping a polished end-to-end product.
- **Chakra UI** — clean API but weaker data-table story.
- **Ant Design** — excellent tables but heavy and visually opinionated.

**Decision**
Use **MUI** with its `DataGrid` component for the employee list.

**Reasoning**
- `DataGrid` provides pagination, sorting, filtering, and column controls
  out of the box — directly aligned with what an HR manager needs.
- Batteries-included forms/dialogs/toasts keep the frontend focused on
  product behaviour rather than primitive composition.
- Well-documented, stable, and familiar to most reviewers.

**Trade-offs**
- Larger bundle size than a headless approach. Acceptable for an internal
  HR tool.
- Material look is generic. Acceptable — this is an admin tool, not a
  marketing site.

---

## ADR-005: Server-side pagination and sorting

**Status:** Accepted

**Context**
The employee table holds 10,000 rows. MUI's `DataGrid` supports both
client-side and server-side modes.

**Decision**
Use **server-side pagination and sorting** (and filtering) from day one.

**Reasoning**
- Loading 10k rows into the browser is wasteful and will only get worse as
  the dataset grows. Server-side mode is the production-correct default.
- Forces the backend to expose a well-designed paginated list endpoint,
  which is itself good engineering signal.
- The aggregation/insights endpoints stay small because they're computed
  in SQL, not derived on the client.

**Trade-offs**
- Slightly more backend work (pagination meta, sort whitelisting, filter
  params). This is the correct place for that complexity to live.

**Implementation notes**
- Start with `LIMIT`/`OFFSET` pagination for simplicity. Move to keyset
  pagination only if it becomes necessary (unlikely at 10k rows).
- Whitelist sortable columns on the backend to prevent SQL injection via
  sort params.

---

## ADR-006: Bulk insert for the seed script

**Status:** Accepted

**Context**
The assessment explicitly states: *"Assume that engineers run this script
regularly, and performance of the script matters."*

**Decision**
Use **`Employee.insert_all` in batches of ~1,000 rows inside a single
transaction**, with names generated in memory from preloaded first/last
name files.

**Reasoning**
- Per-row `Employee.create` is orders of magnitude slower due to
  per-statement overhead, validation, and callbacks.
- `insert_all` skips callbacks and validations, which is the right
  trade-off for seed data (we control the inputs).
- Batching keeps memory usage bounded and avoids single massive statements.
- A single transaction minimizes WAL flush overhead.

**Trade-offs**
- `insert_all` skips ActiveRecord validations. We rely on DB-level
  constraints (NOT NULL, CHECK, unique indexes) to enforce correctness.
- Callbacks don't run — acceptable because seed data is synthetic.

Benchmark numbers: see [`performance.md`](performance.md).

---

## ADR-007: Aggregation in the database, not the application

**Status:** Accepted

**Context**
Salary insights (min/max/avg per country, avg by job title in a country)
could be computed in Ruby after fetching rows, or in SQL via aggregates.

**Decision**
Compute aggregations **in PostgreSQL** using `GROUP BY` + `MIN`/`MAX`/`AVG`.

**Reasoning**
- Postgres is dramatically faster at this than Ruby, and the query planner
  can use indexes on `country` and `(country, job_title)`.
- Keeps the payload small — the API returns aggregated rows, not the full
  dataset.
- Scales naturally as the dataset grows.

---

## ADR-008: Single git repository for backend and frontend

**Status:** Accepted

**Context**
The solution has two independent applications — a Rails API and a React
SPA. These could live in one repository (siblings under a shared root) or
in two separate repositories.

**Decision**
Use a **single git repository** with `backend/` and `frontend/` as
sibling directories under the root.

**Alternatives considered**
- **Two separate repositories** — one for the Rails API, one for the
  React SPA. Each with its own README, issues, and release history.

**Reasoning**
- **The assessment is graded as one submission.** Reviewers clone once,
  read one top-level README, and run one set of commands to see the
  whole solution. Splitting the repo adds friction for no benefit here.
- **One commit history tells one story.** The brief explicitly asks
  that commit history show the evolution of the solution. A single
  repo gives a linear, interleaved narrative across both apps; two
  repos force reviewers to mentally merge two histories.
- **Shared artifacts live naturally at the root** — the main README,
  `docs/` (architecture, ADRs, performance notes, AI prompts), and
  the `render.yaml` deployment blueprint. In a split-repo setup these
  would either be duplicated or arbitrarily assigned to one side.
- **Small scope.** One Rails app + one React app + one database. The
  overhead of tooling a monorepo (workspaces, shared build config, CI
  matrices) is near zero at this size — we're not using any of it.

**Important clarification**
This is **not** a "monorepo" in the Nx / Turborepo / pnpm-workspaces
sense. There is no shared build tooling, no cross-package dependencies,
and no workspace configuration. The two applications are completely
self-contained: `cd backend && bundle install` and `cd frontend && npm
install` each work independently, and neither app needs to know the
other exists at the tooling level.

The *only* things the two apps share are git history and the root
`docs/` directory.

**Trade-offs**
- If the two apps later needed independent release cadences, access
  controls, or different CI pipelines, splitting would become
  attractive. None of that applies in this assessment context.
- A split-repo structure would be more appropriate if multiple teams
  owned each side, or if the frontend were consumed by multiple
  backends. Neither is the case here.

---

## ADR-009: Money representation and currency scope

**Status:** Accepted

**Context**
The assessment requires a `salary` field on employees. It does not
specify a unit, a currency, or whether salaries should be comparable
across countries. Three design questions fall out of that:

1. How do we store money?
2. Do we track currency at all?
3. What do cross-country insights actually mean?

**Decision**

1. **Store salary as `salary_cents` (bigint, non-negative).** Whole-unit
   integers avoid floating-point rounding errors. `BigDecimal` is
   available via an `Employee#salary` helper for any code that needs
   whole-currency-unit values.
2. **Track currency as an ISO 4217 code** on each employee row
   (`currency`, 3-char, default `"USD"`, CHECK `^[A-Z]{3}$`).
3. **Within-country insights are first-class; cross-country comparisons
   are out of scope.** The API will expose min/max/avg salary *within* a
   country (where every row shares a currency, so the numbers are
   meaningful) and avg salary by job title *within* a country. We will
   not expose a "global average salary" or any metric that aggregates
   across currencies.

**Alternatives considered**

- **`salary` as a float or decimal, no currency column.** Simpler, but
  dishonest — averaging salaries from India and the United States as
  raw numbers produces a number with no real-world meaning. It also
  invites floating-point bugs that we'd rather not debug.
- **`salary` as a Postgres `numeric` in whole units.** Fine, but
  integer cents is the industry-standard money representation for
  exactly this reason and plays nicely with bulk-insert tooling.
- **Full multi-currency support with FX conversion.** Would need an
  exchange-rate table, a rate-as-of date, and a conversion service.
  Out of scope for a 10k-row HR tool.

**Reasoning**

- Integer cents + `BigDecimal` helper is the cheapest way to be correct
  about money. The extra column and the check constraint cost nothing.
- Tracking currency without converting between them is honest: the
  schema can represent the real world, and the insights endpoints
  simply refuse to answer questions that don't have meaningful answers.
- Reviewers looking at the schema will ask "why didn't you just use a
  float?" and "how do you average across countries?" — this ADR
  pre-answers both.

**Trade-offs**

- The HR manager loses a (misleading) "company-wide average salary"
  number. In exchange, every number the UI shows is one the user can
  trust.
- Future work (FX conversion, historical rate tables, salary bands in
  a canonical currency) is explicitly deferred.

---

## ADR-010: API versioning under /api/v1/

**Status:** Accepted

**Context**
The API initially lived at `/api/employees` with no version prefix.
As the application matures, breaking changes to the API contract
(response shape, field names, pagination semantics) would affect all
consumers simultaneously.

**Decision**
Namespace all API routes under `/api/v1/`. Controllers live in
`Api::V1::` module, directory structure mirrors the namespace
(`app/controllers/api/v1/`).

**Reasoning**
- **Forward compatibility**: when a breaking change is needed, a `v2`
  namespace can be introduced without removing `v1` endpoints.
  Existing consumers keep working until they're ready to migrate.
- **Industry standard**: versioned API paths are the most common
  pattern for JSON APIs and the one reviewers will expect.
- **Low cost**: one extra directory level and one extra namespace —
  trivial overhead for meaningful long-term flexibility.

**Alternatives considered**
- **Header-based versioning** (`Accept: application/vnd.api.v1+json`):
  more "correct" by REST purists, but harder to test in a browser,
  harder to route in Rails, and not worth the complexity here.
- **No versioning**: simpler, but paints us into a corner if the API
  contract ever needs to change.

**Trade-offs**
- URLs are slightly longer (`/api/v1/employees` vs `/api/employees`).
- If we never ship a v2, the `/v1/` prefix is cosmetic. That's fine —
  it signals intent and costs nothing.
