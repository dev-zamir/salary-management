class AddPerformanceIndexesToEmployees < ActiveRecord::Migration[8.1]
  def change
    # ---- Trigram extension for ILIKE search acceleration ----
    # The employees#index search does:
    #   WHERE full_name ILIKE '%q%' OR email ILIKE '%q%' OR job_title ILIKE '%q%'
    # Without pg_trgm, this is a full table scan on every keystroke.
    enable_extension "pg_trgm"

    add_index :employees, :full_name,
              using: :gin,
              opclass: { full_name: :gin_trgm_ops },
              name: "index_employees_on_full_name_trgm"

    add_index :employees, :email,
              using: :gin,
              opclass: { email: :gin_trgm_ops },
              name: "index_employees_on_email_trgm"

    # job_title already has a B-tree index for exact match filtering;
    # add a trigram index for ILIKE search.
    add_index :employees, :job_title,
              using: :gin,
              opclass: { job_title: :gin_trgm_ops },
              name: "index_employees_on_job_title_trgm"

    # ---- Sort indexes ----
    # The employees#index endpoint allows sorting by any whitelisted
    # column. Without indexes on commonly sorted columns, Postgres
    # must sort the full result set for each paginated request.
    add_index :employees, :salary_cents
    add_index :employees, :hired_on
    add_index :employees, :created_at

    # ---- Composite indexes for filter + sort ----
    # Common pattern: filter by country, sort by salary (or hire date).
    # The existing index on country helps with filtering but Postgres
    # still needs a separate sort pass. A composite index lets it
    # do both in one index scan.
    add_index :employees, [:country, :salary_cents]
    add_index :employees, [:country, :hired_on]

    # ---- Aggregation index ----
    # The insights/by_country endpoint does:
    #   GROUP BY country, currency
    # The existing single-column country index doesn't cover the
    # grouping on currency, forcing a sequential scan + hash aggregate.
    add_index :employees, [:country, :currency]
  end
end
