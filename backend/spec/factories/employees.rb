FactoryBot.define do
  factory :employee do
    sequence(:full_name)  { |n| "Employee #{n}" }
    job_title             { "Software Engineer" }
    country               { "United States" }
    salary_cents          { 100_000_00 } # $100,000.00
    currency              { "USD" }
    # Email is optional on the model; generate a unique one by default so
    # tests that don't care about email still pass the uniqueness index.
    sequence(:email)      { |n| "employee#{n}@example.com" }
    hired_on              { Date.new(2024, 1, 1) }
  end
end
