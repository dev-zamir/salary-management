# Architecture

> High-level architecture for the Salary Management Tool. This document will
> evolve alongside the implementation — the goal is to capture the *why*
> behind the structure, not to duplicate code.

## Component Overview

```
┌──────────────────────┐        HTTP / JSON        ┌────────────────────────┐
│  React SPA (Vite)    │ ────────────────────────▶ │  Rails API (API-only)  │
│  - MUI components    │                           │  - Controllers         │
│  - TanStack Query    │ ◀──────────────────────── │  - Services            │
│  - Server-side       │                           │  - ActiveRecord models │
│    pagination/sort   │                           └──────────┬─────────────┘
└──────────────────────┘                                      │
                                                              │ SQL
                                                              ▼
                                                    ┌────────────────────┐
                                                    │   PostgreSQL 15+   │
                                                    │   - employees      │
                                                    │   - indexes on     │
                                                    │     country,       │
                                                    │     job_title      │
                                                    └────────────────────┘
```

## Layers

### Frontend (`frontend/`)
- **React + Vite** SPA
- **MUI** component library (Material UI) for layout, forms, dialogs, and
  the primary data grid
- **TanStack Query** (or equivalent) for server state, caching, and request
  deduplication
- **Server-side pagination and sorting** — the grid sends `page`, `per_page`,
  `sort`, and filter params to the API; the frontend never loads all 10k
  rows at once
- Routing: React Router

### Backend (`backend/`)
- **Rails (API mode)** — no views, JSON only
- Thin controllers, business logic in service objects / query objects
- ActiveModel serializers (or `jsonapi-serializer`) for response shaping
- Pagination via `kaminari` or hand-rolled `LIMIT/OFFSET` (keyset later if
  needed)

### Database (PostgreSQL)
- Single primary table: `employees`
- Columns (initial): `id`, `full_name`, `job_title`, `country`, `salary`,
  `currency`, `email`, `hired_on`, timestamps
- Indexes:
  - `country` — supports country-level aggregations and filters
  - `(country, job_title)` — supports "avg salary by job title in a country"
  - `job_title` — supports cross-country title filtering

## Key Data Flows

### 1. Employee list (paginated, sorted, filtered)
1. User interacts with MUI DataGrid → pagination/sort/filter state updates
2. Frontend issues `GET /api/employees?page=2&per_page=50&sort=salary:desc&country=IN`
3. Rails controller delegates to a query object → parameterized SQL with
   `LIMIT`/`OFFSET` + `ORDER BY`
4. Response: `{ data: [...], meta: { total, page, per_page } }`

### 2. Salary insights
1. Frontend requests `GET /api/insights/by_country` or
   `GET /api/insights/by_job_title?country=IN`
2. Rails delegates to an insights service → single aggregation query
   (`MIN`, `MAX`, `AVG`, `COUNT`, `GROUP BY`)
3. Response is small and cache-friendly

### 3. Seeding (offline, run by engineers)
1. CLI invocation: `bin/rails db:seed` or a dedicated rake task
2. Reads `first_names.txt` and `last_names.txt` into memory
3. Generates 10,000 employee rows in memory (seeded RNG for determinism)
4. Bulk-inserts in batches using `Employee.insert_all` within a single
   transaction

## Non-Functional Considerations

- **Performance**: see [`performance.md`](performance.md)
- **Testability**: thin controllers + service objects keep unit tests fast
  and focused
- **Observability**: Rails logs + request IDs; structured logs if time
  permits
- **Security**: parameter allow-listing, input validation at the model
  boundary, CORS restricted to the frontend origin

## Out of Scope (for this assessment)

- Authentication / multi-tenant support
- Audit logging of changes
- Currency conversion for cross-country salary comparisons
- Background jobs / async processing
