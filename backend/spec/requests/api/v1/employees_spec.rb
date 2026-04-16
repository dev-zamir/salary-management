require "rails_helper"

RSpec.describe "Api::V1::Employees" do
  let(:valid_attrs) do
    {
      full_name: "Jane Doe",
      job_title: "Software Engineer",
      country: "United States",
      salary_cents: 150_000_00,
      currency: "USD",
      email: "jane@example.com",
      hired_on: "2023-06-15"
    }
  end

  # ---------- INDEX ----------

  describe "GET /api/v1/employees" do
    it "returns a paginated list of employees" do
      create_list(:employee, 3)

      get "/api/v1/employees"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["data"].size).to eq(3)
      expect(body["meta"]).to include("total" => 3, "page" => 1, "per_page" => 25)
    end

    it "paginates correctly" do
      create_list(:employee, 5)

      get "/api/v1/employees", params: { page: 2, per_page: 2 }

      body = response.parsed_body
      expect(body["data"].size).to eq(2)
      expect(body["meta"]).to include("total" => 5, "page" => 2, "per_page" => 2)
    end

    it "clamps per_page to MAX_PER_PAGE" do
      get "/api/v1/employees", params: { per_page: 999 }

      body = response.parsed_body
      expect(body["meta"]["per_page"]).to eq(100)
    end

    it "sorts by the requested column" do
      create(:employee, full_name: "Charlie")
      create(:employee, full_name: "Alice")
      create(:employee, full_name: "Bob")

      get "/api/v1/employees", params: { sort: "full_name", direction: "asc" }

      names = response.parsed_body["data"].map { |e| e["full_name"] }
      expect(names).to eq(%w[Alice Bob Charlie])
    end

    it "ignores non-whitelisted sort columns" do
      get "/api/v1/employees", params: { sort: "email; DROP TABLE employees", direction: "asc" }

      expect(response).to have_http_status(:ok)
    end

    it "filters by country" do
      create(:employee, country: "India")
      create(:employee, country: "Germany")

      get "/api/v1/employees", params: { country: "India" }

      body = response.parsed_body
      expect(body["data"].size).to eq(1)
      expect(body["data"][0]["country"]).to eq("India")
      expect(body["meta"]["total"]).to eq(1)
    end

    it "filters by job_title" do
      create(:employee, job_title: "CTO")
      create(:employee, job_title: "QA Engineer")

      get "/api/v1/employees", params: { job_title: "CTO" }

      body = response.parsed_body
      expect(body["data"].size).to eq(1)
      expect(body["data"][0]["job_title"]).to eq("CTO")
    end

    it "searches by full_name, email, or job_title" do
      create(:employee, full_name: "John Smith", email: "john@example.com")
      create(:employee, full_name: "Jane Doe", email: "jane@example.com")

      get "/api/v1/employees", params: { search: "john" }

      body = response.parsed_body
      expect(body["data"].size).to eq(1)
      expect(body["data"][0]["full_name"]).to eq("John Smith")
    end

    it "returns salary as a float in whole currency units" do
      create(:employee, salary_cents: 123_456_78)

      get "/api/v1/employees"

      expect(response.parsed_body["data"][0]["salary"]).to eq(123_456.78)
    end
  end

  # ---------- SHOW ----------

  describe "GET /api/v1/employees/:id" do
    it "returns the employee" do
      employee = create(:employee, full_name: "Test User")

      get "/api/v1/employees/#{employee.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["data"]["full_name"]).to eq("Test User")
    end

    it "returns 404 for a non-existent employee" do
      get "/api/v1/employees/0"

      expect(response).to have_http_status(:not_found)
    end
  end

  # ---------- CREATE ----------

  describe "POST /api/v1/employees" do
    it "creates an employee with valid params" do
      expect {
        post "/api/v1/employees", params: { employee: valid_attrs }
      }.to change(Employee, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["data"]["full_name"]).to eq("Jane Doe")
    end

    it "returns validation errors for invalid params" do
      post "/api/v1/employees", params: { employee: { full_name: "" } }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["errors"]).to be_present
    end
  end

  # ---------- UPDATE ----------

  describe "PATCH /api/v1/employees/:id" do
    it "updates the employee" do
      employee = create(:employee)

      patch "/api/v1/employees/#{employee.id}", params: { employee: { full_name: "Updated Name" } }

      expect(response).to have_http_status(:ok)
      expect(employee.reload.full_name).to eq("Updated Name")
    end

    it "returns validation errors for invalid updates" do
      employee = create(:employee)

      patch "/api/v1/employees/#{employee.id}", params: { employee: { full_name: "" } }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  # ---------- DESTROY ----------

  describe "DELETE /api/v1/employees/:id" do
    it "deletes the employee" do
      employee = create(:employee)

      expect {
        delete "/api/v1/employees/#{employee.id}"
      }.to change(Employee, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
