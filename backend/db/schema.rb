# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_15_161714) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "employees", force: :cascade do |t|
    t.string "country", limit: 100, null: false
    t.datetime "created_at", null: false
    t.string "currency", limit: 3, default: "USD", null: false
    t.string "email", limit: 255
    t.string "full_name", limit: 200, null: false
    t.date "hired_on", null: false
    t.string "job_title", limit: 100, null: false
    t.bigint "salary_cents", null: false
    t.datetime "updated_at", null: false
    t.index ["country", "job_title"], name: "index_employees_on_country_and_job_title"
    t.index ["country"], name: "index_employees_on_country"
    t.index ["email"], name: "index_employees_on_email_when_present", unique: true, where: "(email IS NOT NULL)"
    t.index ["job_title"], name: "index_employees_on_job_title"
    t.check_constraint "currency::text ~ '^[A-Z]{3}$'::text", name: "currency_iso_4217_shape"
    t.check_constraint "salary_cents >= 0", name: "salary_cents_non_negative"
  end
end
