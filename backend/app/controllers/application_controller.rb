class ApplicationController < ActionController::API
  # rescue_from handlers are matched in reverse definition order:
  # last defined = highest priority. Generic handlers go first,
  # specific ones after.

  rescue_from StandardError do |e|
    Rails.logger.error("Unhandled error: #{e.class} — #{e.message}")
    Rails.logger.error(e.backtrace&.first(10)&.join("\n"))

    render json: { error: "An unexpected error occurred" }, status: :internal_server_error
  end

  rescue_from ActiveRecord::RecordNotFound do |e|
    render json: { error: e.message }, status: :not_found
  end

  rescue_from ActionController::ParameterMissing do |e|
    render json: { error: e.message }, status: :bad_request
  end
end
