#!/usr/bin/env bash
# Render build hook — installs gems, runs migrations, and seeds the DB
# on the first deploy only.
#
# We intentionally skip seeding if the employees table already has rows,
# so that subsequent deploys don't wipe data modified through the UI.
# To force a re-seed (e.g. staging refresh), set ALLOW_SEED_IN_PRODUCTION=1
# in the Render dashboard.

set -o errexit

bundle install
bundle exec rails db:migrate

EMPLOYEE_COUNT=$(bundle exec rails runner "puts Employee.count" 2>/dev/null || echo "0")

if [ "$EMPLOYEE_COUNT" = "0" ] || [ "$ALLOW_SEED_IN_PRODUCTION" = "1" ]; then
  echo "Seeding database (current count: $EMPLOYEE_COUNT)..."
  ALLOW_SEED_IN_PRODUCTION=1 bundle exec rails db:seed
else
  echo "Skipping seed — employees table already has $EMPLOYEE_COUNT rows."
fi
