module Api
  module V1
    class EmployeesController < ApplicationController
      include EmployeeLoadable

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
          render json: { errors: employee.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @employee.update(employee_params)
          render json: { data: ::EmployeeSerializer.new(@employee).as_json }
        else
          render json: { errors: @employee.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        if @employee.destroy
          head :no_content
        else
          render json: { errors: @employee.errors.full_messages }, status: :unprocessable_content
        end
      end
    end
  end
end
