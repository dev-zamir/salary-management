#!/usr/bin/env bash
# Render build hook — installs gems, runs migrations, and seeds the DB
# on the first deploy. Idempotent: migrations skip already-applied ones,
# and the seed script truncates+reloads so it can safely re-run.

set -o errexit

bundle install
bundle exec rails db:migrate
bundle exec rails db:seed
