module Api
  module V1
    module Insights
      class SalaryController < ApplicationController
        AGGREGATION_SELECT = [
          "currency",
          "COUNT(*)          AS employee_count",
          "MIN(salary_cents) AS min_salary_cents",
          "MAX(salary_cents) AS max_salary_cents",
          "AVG(salary_cents) AS avg_salary_cents",
        ].freeze

        # GET /api/v1/insights/by_country
        #
        # Salary stats grouped by country. Each country's employees share
        # a single currency (by seed convention), so within-country
        # aggregation is meaningful. Cross-country comparisons are left
        # to the consumer (currencies differ — see ADR-009).
        def by_country
          stats = Employee
            .group(:country, :currency)
            .select("country", *AGGREGATION_SELECT)
            .order("country ASC")

          render json: { data: ::SalaryStatsPresenter.many(stats, merge_key: :country) }
        end

        # GET /api/v1/insights/by_job_title?country=X
        #
        # Salary stats by job title within a single country. Requires
        # the country parameter — aggregating across currencies is
        # meaningless (ADR-009).
        def by_job_title
          country = params.require(:country)

          stats = Employee
            .by_country(country)
            .group(:job_title, :currency)
            .select("job_title", *AGGREGATION_SELECT)
            .order("avg_salary_cents DESC")

          render json: { data: ::SalaryStatsPresenter.many(stats, merge_key: :job_title) }
        end
      end
    end
  end
end
