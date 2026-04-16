class SalaryStatsPresenter
  def initialize(row)
    @row = row
  end

  def as_json
    avg_cents = @row.avg_salary_cents.to_f

    {
      currency:         @row.currency,
      employee_count:   @row.employee_count,
      min_salary_cents: @row.min_salary_cents,
      max_salary_cents: @row.max_salary_cents,
      avg_salary_cents: avg_cents.round.to_i,
      min_salary:       (@row.min_salary_cents / 100.0).round(2),
      max_salary:       (@row.max_salary_cents / 100.0).round(2),
      avg_salary:       (avg_cents / 100.0).round(2),
    }
  end

  def self.many(rows, merge_key:)
    rows.map { |row| new(row).as_json.merge(merge_key => row.public_send(merge_key)) }
  end
end
