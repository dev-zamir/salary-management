module Api
  class EmployeesController < ApplicationController
    SORTABLE_COLUMNS = %w[id full_name job_title country salary_cents currency hired_on created_at].freeze
    SORT_DIRECTIONS  = %w[asc desc].freeze
    DEFAULT_PER_PAGE = 25
    MAX_PER_PAGE     = 100

    def index
      employees = Employee.all

      # ---- Filtering ----
      employees = employees.where(country: params[:country])     if params[:country].present?
      employees = employees.where(job_title: params[:job_title]) if params[:job_title].present?

      if params[:search].present?
        search_term = "%#{Employee.sanitize_sql_like(params[:search])}%"
        employees = employees.where(
          "full_name ILIKE :q OR email ILIKE :q OR job_title ILIKE :q",
          q: search_term
        )
      end

      # ---- Total count (after filters, before pagination) ----
      total = employees.count

      # ---- Sorting ----
      sort_col = SORTABLE_COLUMNS.include?(params[:sort]) ? params[:sort] : "id"
      sort_dir = SORT_DIRECTIONS.include?(params[:direction]) ? params[:direction] : "asc"
      employees = employees.order(sort_col => sort_dir)

      # ---- Pagination ----
      page     = [params.fetch(:page, 1).to_i, 1].max
      per_page = params.fetch(:per_page, DEFAULT_PER_PAGE).to_i.clamp(1, MAX_PER_PAGE)
      employees = employees.offset((page - 1) * per_page).limit(per_page)

      render json: {
        data: employees.map { |e| employee_json(e) },
        meta: { total: total, page: page, per_page: per_page }
      }
    end

    def show
      employee = Employee.find(params[:id])
      render json: { data: employee_json(employee) }
    end

    def create
      employee = Employee.new(employee_params)

      if employee.save
        render json: { data: employee_json(employee) }, status: :created
      else
        render json: { errors: employee.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      employee = Employee.find(params[:id])

      if employee.update(employee_params)
        render json: { data: employee_json(employee) }
      else
        render json: { errors: employee.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      employee = Employee.find(params[:id])
      employee.destroy!
      head :no_content
    end

    private

    def employee_params
      params.expect(employee: [:full_name, :job_title, :country, :salary_cents, :currency, :email, :hired_on])
    end

    def employee_json(employee)
      {
        id:           employee.id,
        full_name:    employee.full_name,
        job_title:    employee.job_title,
        country:      employee.country,
        salary_cents: employee.salary_cents,
        salary:       employee.salary&.to_f,
        currency:     employee.currency,
        email:        employee.email,
        hired_on:     employee.hired_on,
        created_at:   employee.created_at,
        updated_at:   employee.updated_at
      }
    end
  end
end
