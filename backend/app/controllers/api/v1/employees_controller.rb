module Api
  module V1
    class EmployeesController < ApplicationController
      before_action :set_employee, only: [:show, :update, :destroy]

      def index
        query = EmployeeQuery.new(params)
        employees = query.results

        render json: {
          data: ::EmployeeSerializer.many(employees),
          meta: { total: query.total, page: query.page, per_page: query.per_page }
        }
      end

      def show
        render json: { data: ::EmployeeSerializer.new(@employee).as_json }
      end

      def create
        employee = Employee.new(employee_params)

        if employee.save
          render json: { data: ::EmployeeSerializer.new(employee).as_json }, status: :created
        else
          render json: { errors: employee.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @employee.update(employee_params)
          render json: { data: ::EmployeeSerializer.new(@employee).as_json }
        else
          render json: { errors: @employee.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @employee.destroy!
        head :no_content
      end

      private

      def set_employee
        @employee = Employee.find(params[:id])
      end

      def employee_params
        params.expect(employee: [:full_name, :job_title, :country, :salary_cents, :currency, :email, :hired_on])
      end
    end
  end
end
