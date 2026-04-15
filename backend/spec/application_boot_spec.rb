require 'rails_helper'

# Smoke spec: confirms Rails boots in the test environment, the test DB
# is reachable, and the core testing gems (Shoulda Matchers, FactoryBot)
# are wired in correctly. This is deliberately minimal — it's a canary,
# not a real test.
RSpec.describe 'application boot' do
  it 'runs in the test environment' do
    expect(Rails.env).to eq('test')
  end

  it 'connects to the test database' do
    expect(ActiveRecord::Base.connection).to be_active
    expect(ActiveRecord::Base.connection.current_database).to eq('emp_salary_backend_test')
  end
end
