class EmployeeSerializer
  def initialize(employee)
    @employee = employee
  end

  def as_json
    {
      id:           @employee.id,
      full_name:    @employee.full_name,
      job_title:    @employee.job_title,
      country:      @employee.country,
      salary_cents: @employee.salary_cents,
      salary:       @employee.salary&.to_f,
      currency:     @employee.currency,
      email:        @employee.email,
      hired_on:     @employee.hired_on,
      created_at:   @employee.created_at,
      updated_at:   @employee.updated_at
    }
  end

  def self.many(employees)
    employees.map { |e| new(e).as_json }
  end
end
