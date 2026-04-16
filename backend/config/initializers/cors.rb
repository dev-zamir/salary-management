# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Read more: https://github.com/cyu/rack-cors

# Allowed origins are read from the CORS_ALLOWED_ORIGINS environment variable
# as a comma-separated list, e.g. "http://localhost:5173,https://app.example.com".
# If unset, the CORS middleware is not loaded — all cross-origin requests are
# rejected by default (no middleware = no Access-Control-Allow-Origin header).
allowed_origins = ENV.fetch("CORS_ALLOWED_ORIGINS", "")
                     .split(",")
                     .map(&:strip)
                     .reject(&:empty?)

if allowed_origins.empty?
  Rails.logger.warn("CORS_ALLOWED_ORIGINS not set — CORS middleware disabled")
else
  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins(*allowed_origins)

      resource "*",
        headers: :any,
        methods: [:get, :post, :put, :patch, :delete, :options, :head]
    end
  end
end
