# Performance Notes

Focused performance considerations for the Salary Management Tool. The
assessment specifically calls out the seed script, so that's where most of
this document lives.

---

## 1. Seed Script

### Goal
Load **10,000 employees** quickly and repeatably. The script is run
regularly by engineers, so both **wall-clock time** and **determinism**
matter.

### Approach

1. **Load name files once**
   - Read `first_names.txt` and `last_names.txt` into in-memory arrays.
   - Files are small (KB-scale), so this is negligible.

2. **Generate all rows in memory**
   - Use a seeded RNG (e.g. `Random.new(42)`) so repeated runs produce
     reproducible data — helpful for debugging and comparing across
     environments.
   - Randomize country, job title, and salary from curated pools.

3. **Bulk insert in batches**
   - Use `Employee.insert_all(batch)` with batches of ~1,000 rows.
   - Skip ActiveRecord validations and callbacks — seed data is
     synthetic, so we rely on DB constraints for correctness.

4. **Wrap in a single transaction**
   - Minimizes WAL flushes and fsync overhead.
   - All-or-nothing semantics: a failed seed leaves no partial data.

5. **Optional: truncate first**
   - Default to `TRUNCATE employees RESTART IDENTITY` before seeding, so
     the script is idempotent.
   - Guard with an environment check to prevent accidental production
     truncates.

### Anti-patterns (avoided)

- ❌ `10_000.times { Employee.create!(...) }` — per-row overhead, slow.
- ❌ One giant `INSERT` statement — high memory, no batching benefit.
- ❌ Re-reading name files inside the loop.
- ❌ Building SQL strings by hand (injection risk, no parameter binding).

### Benchmark Results

Environment: PostgreSQL 15+, local, Ruby 3.4.8, Rails 8.1.3.

| Approach                         | Wall-clock | Notes |
| -------------------------------- | ---------- | ----- |
| `insert_all` batch=1000 + txn    | ~2.07s     | **chosen approach** |

The script is idempotent — repeated runs produce the same 10,000 rows
with the same data (seeded RNG), in the same wall-clock time (~2s).

Per-batch timing is consistent at ~200ms per 1,000-row batch, indicating
that Postgres throughput is the bottleneck (not Ruby row generation).

---

## 2. Query Performance

### Index strategy

The employees table has 14 indexes covering three categories:

**Filtering (exact match):**
- `country` — country filter on the list endpoint
- `job_title` — job title filter
- `(country, job_title)` — combined filter
- `email` — partial unique index (WHERE email IS NOT NULL)

**Sorting (B-tree for ORDER BY ... LIMIT):**
- `salary_cents` — sort by salary (most common user action)
- `hired_on` — sort by hire date
- `created_at` — sort by creation date

**Composite (filter + sort in one index scan):**
- `(country, salary_cents)` — filter by country, sort by salary
- `(country, hired_on)` — filter by country, sort by hire date

**Search (GIN trigram for ILIKE acceleration):**
- `full_name gin_trgm_ops` — `ILIKE '%query%'` on names
- `email gin_trgm_ops` — `ILIKE '%query%'` on emails
- `job_title gin_trgm_ops` — `ILIKE '%query%'` on job titles
- Requires the `pg_trgm` extension (enabled in migration)

**Aggregation:**
- `(country, currency)` — `GROUP BY country, currency` in insights

### EXPLAIN verification

Verified key query patterns via `EXPLAIN`:

| Query pattern | Plan |
|---|---|
| Filter country + sort salary | Index Scan Backward (single composite index, no sort) |
| Sort by salary alone | Index Scan Backward (no sort needed) |
| ILIKE search | Seq Scan at 10k rows (Postgres optimizer decides full scan is cheaper; trigram index kicks in at larger scales) |
| GROUP BY country, currency | Seq Scan + HashAggregate at 10k rows (same reason) |

### Employee list endpoint
- Paginated via `LIMIT`/`OFFSET` — fine at 10k scale. Keyset pagination
  is only needed if we ever move to millions of rows.
- Sortable columns are **whitelisted** — this prevents arbitrary
  expressions and makes it safe to pass `sort` as a request param.
- Sort alias mapping: frontend sends `salary` (display field),
  backend maps to `salary_cents` (DB column) via `SORT_ALIASES`.
- Filter params (`country`, `job_title`) use parameterized queries
  against indexed columns.

### Insights endpoints
- Single aggregation queries — `GROUP BY country, currency` and
  `GROUP BY job_title, currency WHERE country = ?`.
- Supported by composite indexes.
- Result sets are small (O(countries) or O(countries × titles)),
  cache-friendly.

### N+1 avoidance
- Employee records are self-contained for this assessment — no joins to
  other tables — so N+1 is not a concern yet. If we add relations
  (departments, managers), use `includes` from day one.

---

## 3. Frontend Performance

- **Server-side pagination** (see ADR-005) — the browser never loads
  more than one page of employees at a time.
- **TanStack Query** (or equivalent) deduplicates requests, caches
  responses, and provides stale-while-revalidate semantics.
- **MUI DataGrid** in server mode — all heavy lifting happens on the
  backend.
- Debounce filter inputs to avoid a request per keystroke.

---

## 4. What We're Explicitly Not Optimizing

- Horizontal scaling — a single Rails process is fine at 10k rows.
- Read replicas — unnecessary for this workload.
- Caching layer (Redis / Memcached) — Postgres is fast enough here, and
  adding caching prematurely would add complexity without benefit.

These are the *right* optimizations to skip for a 10k-row internal tool,
and skipping them deliberately is itself a performance decision.
