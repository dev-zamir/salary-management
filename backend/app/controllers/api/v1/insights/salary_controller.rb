module Api
  module V1
    module Insights
      class SalaryController < ApplicationController
        include SalaryAggregatable

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
