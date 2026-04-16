module EmployeeLoadable
  extend ActiveSupport::Concern

  private

  def set_employee
    @employee = Employee.find(params[:id])
  end

  def employee_params
    params.expect(employee: [:full_name, :job_title, :country, :salary_cents, :currency, :email, :hired_on])
  end
end
