# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Read more: https://github.com/cyu/rack-cors

# Allowed origins are read from the CORS_ALLOWED_ORIGINS environment variable
# as a comma-separated list, e.g. "http://localhost:5173,https://app.example.com".
# If unset, no origins are allowed — the API will reject cross-origin requests
# outright rather than silently allowing everything.
allowed_origins = ENV.fetch("CORS_ALLOWED_ORIGINS", "")
                     .split(",")
                     .map(&:strip)
                     .reject(&:empty?)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose:  ["Total-Count", "Page", "Per-Page"]
  end
end
