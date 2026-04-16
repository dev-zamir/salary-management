module SalaryAggregatable
  extend ActiveSupport::Concern

  SALARY_AGGREGATION_SELECT = [
    "currency",
    "COUNT(*)          AS employee_count",
    "MIN(salary_cents) AS min_salary_cents",
    "MAX(salary_cents) AS max_salary_cents",
    "AVG(salary_cents) AS avg_salary_cents",
  ].freeze
end
