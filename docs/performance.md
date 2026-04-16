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

### Employee list endpoint
- Paginated via `LIMIT`/`OFFSET` — fine at 10k scale. Keyset pagination
  is only needed if we ever move to millions of rows.
- Sortable columns are **whitelisted** — this prevents arbitrary
  expressions and makes it safe to pass `sort` as a request param.
- Filter params (`country`, `job_title`) use parameterized queries
  against indexed columns.

### Insights endpoints
- Single aggregation queries — `GROUP BY country` and
  `GROUP BY country, job_title`.
- Supported by indexes:
  - `CREATE INDEX ON employees (country);`
  - `CREATE INDEX ON employees (country, job_title);`
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
