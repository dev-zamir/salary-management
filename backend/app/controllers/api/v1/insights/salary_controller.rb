module Api
  module V1
    module Insights
      class SalaryController < ApplicationController
        SALARY_AGGREGATION_SELECT = [
          "currency",
          "COUNT(*)          AS employee_count",
          "MIN(salary_cents) AS min_salary_cents",
          "MAX(salary_cents) AS max_salary_cents",
          "AVG(salary_cents) AS avg_salary_cents",
        ].freeze

        # GET /api/v1/insights/by_country
        def by_country
          stats = Employee
            .group(:country, :currency)
            .select("country", *SALARY_AGGREGATION_SELECT)
            .order("country ASC")

          render json: { data: ::SalaryStatsPresenter.many(stats, merge_key: :country) }
        end

        # GET /api/v1/insights/by_job_title?country=X
        def by_job_title
          country = params.require(:country)

          stats = Employee
            .by_country(country)
            .group(:job_title, :currency)
            .select("job_title", *SALARY_AGGREGATION_SELECT)
            .order("avg_salary_cents DESC")

          render json: { data: ::SalaryStatsPresenter.many(stats, merge_key: :job_title) }
        end
      end
    end
  end
end
