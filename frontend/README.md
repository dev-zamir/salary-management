# Frontend — React SPA

React single-page application for the salary management tool.

## Tech Stack

- React 19 + TypeScript (strict mode)
- Vite 8 (dev server + build)
- MUI (Material UI) 9 + MUI X DataGrid
- TanStack Query (server state management)
- React Router (client-side routing)
- Axios (HTTP client)
- Vitest + React Testing Library (tests)

## Setup

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev    # http://localhost:5173
```

The frontend expects the Rails API running at `http://localhost:3000/api`.
Override via the `VITE_API_BASE_URL` environment variable if needed.

## Scripts

| Command              | Description                     |
|----------------------|---------------------------------|
| `npm run dev`        | Start Vite dev server           |
| `npm run build`      | TypeScript check + production build |
| `npm test`           | Run Vitest test suite           |
| `npm run test:watch` | Run Vitest in watch mode        |
| `npm run lint`       | ESLint                          |
| `npm run preview`    | Preview production build        |

## Pages

### Employees (`/employees`)
- MUI DataGrid with server-side pagination, sorting, and search
- Numbered page navigation with jump-to-page
- Per-page preference persisted in localStorage
- Add, edit, and delete employees via form dialogs
- Salary displayed with currency prefix and locale formatting

### Salary Insights (`/insights`)
- Summary cards: total employees, countries, avg headcount
- Salary by country table: min/max/avg per country
- Salary by job title: breakdown within a selected country
- Click a country row or use the dropdown to drill down

## Project Structure

```
src/
├── api/              # Axios API functions
├── components/       # Reusable components (form dialog, layout)
├── hooks/            # TanStack Query hooks
├── pages/            # Route-level page components
├── test/             # Test setup and helpers
├── types/            # TypeScript interfaces
├── constants.ts      # Shared reference data (countries, job titles)
├── theme.ts          # MUI theme configuration
├── App.tsx           # Route definitions
└── main.tsx          # Entry point (providers)
```

## Running Tests

```bash
npm test
```

Current: **17 tests, all passing, ~5s**

Tests cover:
- EmployeeFormDialog: rendering, pre-filling, submit, cancel, validation errors
- AppLayout: navigation, routing, redirect
- Constants: data integrity (countries, currencies, job titles)
