class EmployeeQuery
  SORTABLE_COLUMNS = %w[id full_name job_title country salary_cents currency hired_on created_at].freeze
  SORT_ALIASES     = { "salary" => "salary_cents" }.freeze
  SORT_DIRECTIONS  = %w[asc desc].freeze
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE     = 100

  attr_reader :total, :page, :per_page

  def initialize(params)
    @params = params
  end

  def results
    scope = Employee
      .by_country(@params[:country])
      .by_job_title(@params[:job_title])
      .search(@params[:search])

    @total = scope.count

    scope = sort(scope)
    paginate(scope)
  end

  private

  def sort(scope)
    sort_param = SORT_ALIASES.fetch(@params[:sort].to_s, @params[:sort])
    col = SORTABLE_COLUMNS.include?(sort_param) ? sort_param : "id"
    dir = SORT_DIRECTIONS.include?(@params[:direction]) ? @params[:direction] : "asc"
    scope.order(col => dir)
  end

  def paginate(scope)
    @page     = [@params.fetch(:page, 1).to_i, 1].max
    @per_page = @params.fetch(:per_page, DEFAULT_PER_PAGE).to_i.clamp(1, MAX_PER_PAGE)
    scope.offset((@page - 1) * @per_page).limit(@per_page)
  end
end
