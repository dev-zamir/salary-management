require "rails_helper"

RSpec.describe SalaryStatsPresenter do
  # Build a struct that mimics the shape ActiveRecord returns from
  # a GROUP BY + aggregate SELECT.
  AggregateRow = Struct.new(
    :currency, :employee_count,
    :min_salary_cents, :max_salary_cents, :avg_salary_cents,
    :country, :job_title,
    keyword_init: true
  )

  describe "#as_json" do
    it "converts cents to whole currency units" do
      row = AggregateRow.new(
        currency: "USD",
        employee_count: 10,
        min_salary_cents: 50_000_00,
        max_salary_cents: 200_000_00,
        avg_salary_cents: BigDecimal("125000.50") * 100
      )

      result = described_class.new(row).as_json

      expect(result[:min_salary]).to eq(50_000.0)
      expect(result[:max_salary]).to eq(200_000.0)
      expect(result[:avg_salary]).to eq(125_000.5)
    end

    it "rounds avg_salary_cents to nearest integer" do
      row = AggregateRow.new(
        currency: "USD",
        employee_count: 3,
        min_salary_cents: 100_00,
        max_salary_cents: 300_00,
        avg_salary_cents: BigDecimal("200.3333")
      )

      result = described_class.new(row).as_json

      expect(result[:avg_salary_cents]).to eq(200)
    end

    it "rounds avg_salary to 2 decimal places" do
      row = AggregateRow.new(
        currency: "INR",
        employee_count: 3,
        min_salary_cents: 100_00,
        max_salary_cents: 300_00,
        avg_salary_cents: BigDecimal("20033.3333")
      )

      result = described_class.new(row).as_json

      expect(result[:avg_salary]).to eq(200.33)
    end

    it "preserves the currency field" do
      row = AggregateRow.new(
        currency: "JPY",
        employee_count: 1,
        min_salary_cents: 500_00,
        max_salary_cents: 500_00,
        avg_salary_cents: BigDecimal("50000")
      )

      result = described_class.new(row).as_json

      expect(result[:currency]).to eq("JPY")
      expect(result[:employee_count]).to eq(1)
    end
  end

  describe ".many" do
    it "serializes a collection and merges the specified key" do
      rows = [
        AggregateRow.new(currency: "USD", employee_count: 5, min_salary_cents: 100_00,
                         max_salary_cents: 200_00, avg_salary_cents: BigDecimal("15000"),
                         country: "United States"),
        AggregateRow.new(currency: "INR", employee_count: 3, min_salary_cents: 50_00,
                         max_salary_cents: 150_00, avg_salary_cents: BigDecimal("10000"),
                         country: "India"),
      ]

      results = described_class.many(rows, merge_key: :country)

      expect(results.size).to eq(2)
      expect(results[0][:country]).to eq("United States")
      expect(results[1][:country]).to eq("India")
    end

    it "works with job_title as merge_key" do
      rows = [
        AggregateRow.new(currency: "USD", employee_count: 2, min_salary_cents: 100_00,
                         max_salary_cents: 200_00, avg_salary_cents: BigDecimal("15000"),
                         job_title: "CTO"),
      ]

      results = described_class.many(rows, merge_key: :job_title)

      expect(results[0][:job_title]).to eq("CTO")
    end
  end
end
