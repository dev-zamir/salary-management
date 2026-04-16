module Api
  module Insights
    class SalaryController < ApplicationController
      # GET /api/insights/by_country
      #
      # Returns salary statistics grouped by country:
      #   min, max, avg salary_cents, employee count, and currency.
      #
      # Each country's employees share a single currency (by convention in
      # the seed data), so aggregating salary_cents within a country is
      # meaningful. Cross-country comparisons are left to the consumer
      # (currencies differ — see ADR-009).
      def by_country
        stats = Employee
          .group(:country, :currency)
          .select(
            "country",
            "currency",
            "COUNT(*)        AS employee_count",
            "MIN(salary_cents) AS min_salary_cents",
            "MAX(salary_cents) AS max_salary_cents",
            "AVG(salary_cents) AS avg_salary_cents"
          )
          .order("country ASC")

        render json: {
          data: stats.map { |row|
            salary_stats_json(row).merge(country: row.country)
          }
        }
      end

      # GET /api/insights/by_job_title?country=United+States
      #
      # Returns average salary and count grouped by job title within a
      # single country. Requires a country parameter — aggregating job
      # title salaries across currencies is meaningless (ADR-009).
      def by_job_title
        unless params[:country].present?
          return render json: { error: "country parameter is required" }, status: :bad_request
        end

        stats = Employee
          .where(country: params[:country])
          .group(:job_title, :currency)
          .select(
            "job_title",
            "currency",
            "COUNT(*)        AS employee_count",
            "MIN(salary_cents) AS min_salary_cents",
            "MAX(salary_cents) AS max_salary_cents",
            "AVG(salary_cents) AS avg_salary_cents"
          )
          .order("avg_salary_cents DESC")

        render json: {
          data: stats.map { |row|
            salary_stats_json(row).merge(job_title: row.job_title)
          }
        }
      end

      private

      def salary_stats_json(row)
        avg_cents = row.avg_salary_cents.to_f

        {
          currency:         row.currency,
          employee_count:   row.employee_count,
          min_salary_cents: row.min_salary_cents,
          max_salary_cents: row.max_salary_cents,
          avg_salary_cents: avg_cents.round.to_i,
          min_salary:       (row.min_salary_cents / 100.0).round(2),
          max_salary:       (row.max_salary_cents / 100.0).round(2),
          avg_salary:       (avg_cents / 100.0).round(2),
        }
      end
    end
  end
end
