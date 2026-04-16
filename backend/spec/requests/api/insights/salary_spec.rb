require "rails_helper"

RSpec.describe "Api::Insights::Salary" do
  describe "GET /api/insights/by_country" do
    it "returns salary stats grouped by country" do
      create(:employee, country: "India", currency: "INR", salary_cents: 500_000_00)
      create(:employee, country: "India", currency: "INR", salary_cents: 1_000_000_00)
      create(:employee, country: "Germany", currency: "EUR", salary_cents: 80_000_00)

      get "/api/insights/by_country"

      expect(response).to have_http_status(:ok)
      data = response.parsed_body["data"]
      expect(data.size).to eq(2)

      india = data.find { |d| d["country"] == "India" }
      expect(india["employee_count"]).to eq(2)
      expect(india["min_salary"]).to eq(500_000.0)
      expect(india["max_salary"]).to eq(1_000_000.0)
      expect(india["avg_salary"]).to eq(750_000.0)
      expect(india["currency"]).to eq("INR")
    end

    it "returns an empty array when there are no employees" do
      get "/api/insights/by_country"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["data"]).to eq([])
    end

    it "handles a country with a single employee" do
      create(:employee, country: "Japan", currency: "JPY", salary_cents: 5_000_000_00)

      get "/api/insights/by_country"

      japan = response.parsed_body["data"].find { |d| d["country"] == "Japan" }
      expect(japan["min_salary"]).to eq(japan["max_salary"])
      expect(japan["avg_salary"]).to eq(japan["min_salary"])
      expect(japan["employee_count"]).to eq(1)
    end
  end

  describe "GET /api/insights/by_job_title" do
    it "returns salary stats by job title within a country" do
      create(:employee, country: "United States", currency: "USD", job_title: "CTO", salary_cents: 250_000_00)
      create(:employee, country: "United States", currency: "USD", job_title: "CTO", salary_cents: 300_000_00)
      create(:employee, country: "United States", currency: "USD", job_title: "QA Engineer", salary_cents: 80_000_00)
      create(:employee, country: "India", currency: "INR", job_title: "CTO", salary_cents: 5_000_000_00)

      get "/api/insights/by_job_title", params: { country: "United States" }

      expect(response).to have_http_status(:ok)
      data = response.parsed_body["data"]
      expect(data.size).to eq(2)

      cto = data.find { |d| d["job_title"] == "CTO" }
      expect(cto["employee_count"]).to eq(2)
      expect(cto["avg_salary"]).to eq(275_000.0)
      expect(cto["currency"]).to eq("USD")

      # India CTO should not be included
      expect(data.none? { |d| d["currency"] == "INR" }).to be(true)
    end

    it "returns 400 when country is missing" do
      get "/api/insights/by_job_title"

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body["error"]).to include("country")
    end

    it "returns an empty array for a country with no employees" do
      get "/api/insights/by_job_title", params: { country: "Atlantis" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["data"]).to eq([])
    end

    it "orders results by avg_salary descending" do
      create(:employee, country: "India", currency: "INR", job_title: "CTO", salary_cents: 5_000_000_00)
      create(:employee, country: "India", currency: "INR", job_title: "QA Engineer", salary_cents: 500_000_00)

      get "/api/insights/by_job_title", params: { country: "India" }

      titles = response.parsed_body["data"].map { |d| d["job_title"] }
      expect(titles).to eq(["CTO", "QA Engineer"])
    end
  end
end
