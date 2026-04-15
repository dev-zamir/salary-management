class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :full_name, null: false, limit: 200
      t.string :job_title, null: false, limit: 100
      t.string :country,   null: false, limit: 100
      # Salary stored as integer cents to avoid floating-point rounding.
      # bigint accommodates any realistic salary in any currency.
      t.bigint :salary_cents, null: false
      # ISO 4217 three-letter currency code (e.g. "USD", "INR", "EUR").
      t.string :currency, null: false, limit: 3, default: "USD"
      t.string :email, limit: 255
      t.date   :hired_on, null: false

      t.timestamps
    end

    # Non-negative salary enforced at the DB level.
    add_check_constraint :employees,
                         "salary_cents >= 0",
                         name: "salary_cents_non_negative"

    # Currency must be exactly 3 uppercase letters (ISO 4217 shape).
    add_check_constraint :employees,
                         "currency ~ '^[A-Z]{3}$'",
                         name: "currency_iso_4217_shape"

    # Indexes to support the salary insights queries:
    #   - by_country:      MIN/MAX/AVG GROUP BY country
    #   - by_job_title:    AVG GROUP BY country, job_title (filtered by country)
    #   - job_title alone: cross-country title filter on the employee list
    add_index :employees, :country
    add_index :employees, %i[country job_title]
    add_index :employees, :job_title

    # Email is optional, but must be unique when present.
    add_index :employees,
              :email,
              unique: true,
              where: "email IS NOT NULL",
              name: "index_employees_on_email_when_present"
  end
end
