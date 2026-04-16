# Backend — Rails API

Rails 8 API-only application serving the salary management tool.

## Tech Stack

- Ruby 3.4.8 / Rails 8.1.3
- PostgreSQL 15+
- RSpec + FactoryBot + Shoulda Matchers

## Setup

```bash
# Install dependencies
bundle install

# Copy environment file and adjust as needed
cp .env.example .env

# Create and migrate databases
bin/rails db:setup

# Seed 10,000 employees (~2s)
bin/rails db:seed
```

## Environment Variables

Configured via `.env` (loaded by `dotenv-rails` in dev/test). See
`.env.example` for all required variables:

| Variable               | Description                          | Default              |
|------------------------|--------------------------------------|----------------------|
| `DB_USERNAME`          | PostgreSQL username                  | —                    |
| `DB_PASSWORD`          | PostgreSQL password                  | —                    |
| `DB_HOST`              | PostgreSQL host                      | —                    |
| `DB_PORT`              | PostgreSQL port                      | —                    |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins      | —                    |

## Running the Server

```bash
bin/rails s    # http://localhost:3000
```

## API Endpoints

### Employees

| Method | Path                    | Description            |
|--------|-------------------------|------------------------|
| GET    | `/api/employees`        | List (paginated/sorted/filtered) |
| GET    | `/api/employees/:id`    | Show                   |
| POST   | `/api/employees`        | Create                 |
| PATCH  | `/api/employees/:id`    | Update                 |
| DELETE | `/api/employees/:id`    | Delete                 |

**Index query params:** `page`, `per_page` (max 100), `sort`, `direction`,
`country`, `job_title`, `search`

### Salary Insights

| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/api/insights/by_country`    | Min/max/avg salary per country       |
| GET    | `/api/insights/by_job_title`  | Avg salary per job title in a country |

`by_job_title` requires `?country=` parameter.

## Running Tests

```bash
bundle exec rspec              # full suite
bundle exec rspec spec/models  # model specs only
bundle exec rspec spec/requests # request specs only
```

Current: **48 examples, 0 failures, ~0.5s**

## Seed Script

```bash
bin/rails db:seed
```

- Loads 10,000 employees from `db/seeds/first_names.txt` and
  `db/seeds/last_names.txt`
- Uses `insert_all` in batches of 1,000 inside a single transaction
- Idempotent: truncates the table before inserting
- Deterministic: seeded RNG produces the same data every run
- Performance: ~2s on local PostgreSQL

## Database Schema

Primary table: `employees`

| Column         | Type      | Constraints                     |
|----------------|-----------|---------------------------------|
| `full_name`    | string    | NOT NULL, max 200               |
| `job_title`    | string    | NOT NULL, max 100               |
| `country`      | string    | NOT NULL, max 100               |
| `salary_cents` | bigint    | NOT NULL, CHECK >= 0            |
| `currency`     | string(3) | NOT NULL, default "USD", CHECK ISO 4217 |
| `email`        | string    | optional, unique when present   |
| `hired_on`     | date      | NOT NULL                        |

Indexes: `country`, `(country, job_title)`, `job_title`, `email` (partial unique)
