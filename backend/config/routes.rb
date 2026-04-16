Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resources :employees, only: [:index, :show, :create, :update, :destroy]

    namespace :insights do
      get "by_country",   to: "salary#by_country"
      get "by_job_title", to: "salary#by_job_title"
    end
  end
end
