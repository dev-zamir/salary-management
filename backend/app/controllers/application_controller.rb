class ApplicationController < ActionController::API
  # Order matters: rescue_from is matched last-defined-first, so the
  # generic StandardError handler must come first (lowest priority),
  # with specific exceptions defined after (higher priority).
  rescue_from StandardError do |e|
    Rails.logger.error("Unhandled error: #{e.class} — #{e.message}")
    Rails.logger.error(e.backtrace&.first(10)&.join("\n"))

    if Rails.env.local?
      render json: { error: e.message, class: e.class.name }, status: :internal_server_error
    else
      render json: { error: "Internal server error" }, status: :internal_server_error
    end
  end

  rescue_from ActiveRecord::RecordNotFound do |e|
    render json: { error: e.message }, status: :not_found
  end

  rescue_from ActionController::ParameterMissing do |e|
    render json: { error: e.message }, status: :bad_request
  end
end
