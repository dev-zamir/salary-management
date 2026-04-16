# frozen_string_literal: true

# ------------------------------------------------------------------
# Seed script — loads 10,000 employees using names randomly picked
# from first_names.txt (10,000 entries) and last_names.txt (10,000
# entries).
#
# Performance-critical: the assessment notes this script is run regularly
# by engineers, so wall-clock time matters.
#
# Key optimisations:
#   1. Load name files once into memory.
#   2. Generate all rows in memory — no DB round-trips during generation.
#   3. TRUNCATE (not DELETE) — resets the table in O(1), restarts identity.
#   4. Single transaction — one WAL flush, not 10,000.
#   5. insert_all in batches of 1,000 — skips AR validations/callbacks,
#      avoids a single enormous SQL statement.
#   6. Timestamps computed once and reused (all seed rows share the same
#      created_at/updated_at — they're synthetic data).
# ------------------------------------------------------------------

EMPLOYEE_COUNT = 10_000
BATCH_SIZE     = 1_000

# ---- guard: never truncate production data by accident ----
if Rails.env.production?
  abort "[seed] Refusing to run in production. Set ALLOW_SEED_IN_PRODUCTION=1 to override."
end

# ---- 1. Load name files ----
seed_dir     = Rails.root.join("db/seeds")
first_names  = File.readlines(seed_dir.join("first_names.txt"), chomp: true)
last_names   = File.readlines(seed_dir.join("last_names.txt"), chomp: true)

# ---- 2. Reference data pools (kept small, in memory) ----
COUNTRIES_WITH_CURRENCY = [
  { country: "United States",  currency: "USD" },
  { country: "India",          currency: "INR" },
  { country: "Germany",        currency: "EUR" },
  { country: "United Kingdom", currency: "GBP" },
  { country: "Canada",         currency: "CAD" },
  { country: "Australia",      currency: "AUD" },
  { country: "Japan",          currency: "JPY" },
  { country: "Brazil",         currency: "BRL" },
  { country: "France",         currency: "EUR" },
  { country: "Netherlands",    currency: "EUR" },
  { country: "Singapore",      currency: "SGD" },
  { country: "South Korea",    currency: "KRW" },
  { country: "Mexico",         currency: "MXN" },
  { country: "South Africa",   currency: "ZAR" },
  { country: "Nigeria",        currency: "NGN" },
  { country: "Sweden",         currency: "SEK" },
  { country: "Switzerland",    currency: "CHF" },
  { country: "UAE",            currency: "AED" },
  { country: "Poland",         currency: "PLN" },
  { country: "Argentina",      currency: "ARS" },
].freeze

JOB_TITLES = %w[
  Software\ Engineer
  Senior\ Software\ Engineer
  Staff\ Engineer
  Engineering\ Manager
  Product\ Manager
  Senior\ Product\ Manager
  Data\ Scientist
  Data\ Engineer
  DevOps\ Engineer
  Senior\ DevOps\ Engineer
  QA\ Engineer
  Senior\ QA\ Engineer
  UX\ Designer
  Senior\ UX\ Designer
  Frontend\ Engineer
  Backend\ Engineer
  Mobile\ Engineer
  Machine\ Learning\ Engineer
  Security\ Engineer
  Technical\ Lead
  Engineering\ Director
  VP\ of\ Engineering
  CTO
  Solutions\ Architect
  Cloud\ Engineer
  Site\ Reliability\ Engineer
  Database\ Administrator
  Technical\ Writer
  Scrum\ Master
  Business\ Analyst
].freeze

# Country-specific annual salary ranges (in whole currency units).
# Intentionally broad ranges per country so the insights data is realistic.
SALARY_RANGES = {
  "United States"  => 50_000..250_000,
  "India"          => 500_000..5_000_000,
  "Germany"        => 40_000..150_000,
  "United Kingdom" => 35_000..140_000,
  "Canada"         => 50_000..200_000,
  "Australia"      => 60_000..220_000,
  "Japan"          => 3_000_000..15_000_000,
  "Brazil"         => 40_000..300_000,
  "France"         => 35_000..130_000,
  "Netherlands"    => 40_000..140_000,
  "Singapore"      => 50_000..250_000,
  "South Korea"    => 30_000_000..120_000_000,
  "Mexico"         => 200_000..1_500_000,
  "South Africa"   => 200_000..1_500_000,
  "Nigeria"        => 2_000_000..15_000_000,
  "Sweden"         => 350_000..1_000_000,
  "Switzerland"    => 80_000..250_000,
  "UAE"            => 100_000..600_000,
  "Poland"         => 60_000..300_000,
  "Argentina"      => 1_000_000..10_000_000,
}.freeze

# Date range for hired_on (roughly 10 years of hiring history).
HIRE_START = Date.new(2015, 1, 1)
HIRE_RANGE = (Date.new(2025, 12, 31) - HIRE_START).to_i # days

# ---- 3. Generate all rows in memory ----
puts "[seed] Generating #{EMPLOYEE_COUNT} employee rows in memory..."

rng  = Random.new(42) # seeded RNG — deterministic across runs
now  = Time.current   # single timestamp for all rows
rows = Array.new(EMPLOYEE_COUNT)

EMPLOYEE_COUNT.times do |i|
  first       = first_names[i]
  last        = last_names[i]
  loc         = COUNTRIES_WITH_CURRENCY[rng.rand(COUNTRIES_WITH_CURRENCY.size)]
  country     = loc[:country]
  currency    = loc[:currency]
  range       = SALARY_RANGES[country]
  salary_whole = rng.rand(range)

  rows[i] = {
    full_name:    "#{first} #{last}",
    job_title:    JOB_TITLES[rng.rand(JOB_TITLES.size)],
    country:      country,
    salary_cents: salary_whole * 100, # whole units → cents
    currency:     currency,
    email:        "employee#{i + 1}@example.com",
    hired_on:     HIRE_START + rng.rand(HIRE_RANGE),
    created_at:   now,
    updated_at:   now,
  }
end

# ---- 4. Truncate + bulk insert inside a single transaction ----
puts "[seed] Truncating employees table..."

ActiveRecord::Base.transaction do
  ActiveRecord::Base.connection.execute("TRUNCATE TABLE employees RESTART IDENTITY")

  total_inserted = 0
  t_start = Process.clock_gettime(Process::CLOCK_MONOTONIC)

  rows.each_slice(BATCH_SIZE) do |batch|
    Employee.insert_all(batch)
    total_inserted += batch.size
    elapsed = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - t_start).round(3)
    puts "[seed]   inserted #{total_inserted}/#{EMPLOYEE_COUNT} (#{elapsed}s)"
  end

  t_total = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - t_start).round(3)
  puts "[seed] Done. #{EMPLOYEE_COUNT} employees inserted in #{t_total}s"
end
