require "rails_helper"

RSpec.describe EmployeeQuery do
  describe "#results" do
    it "returns all employees when no params are given" do
      create_list(:employee, 3)

      query = described_class.new({})
      results = query.results

      expect(results.size).to eq(3)
      expect(query.total).to eq(3)
    end

    describe "filtering" do
      it "filters by country" do
        create(:employee, country: "India")
        create(:employee, country: "Germany")

        results = described_class.new(country: "India").results

        expect(results.size).to eq(1)
        expect(results.first.country).to eq("India")
      end

      it "filters by job_title" do
        create(:employee, job_title: "CTO")
        create(:employee, job_title: "QA Engineer")

        results = described_class.new(job_title: "CTO").results

        expect(results.size).to eq(1)
        expect(results.first.job_title).to eq("CTO")
      end

      it "filters by country and job_title together" do
        create(:employee, country: "India", job_title: "CTO")
        create(:employee, country: "India", job_title: "QA Engineer")
        create(:employee, country: "Germany", job_title: "CTO")

        results = described_class.new(country: "India", job_title: "CTO").results

        expect(results.size).to eq(1)
      end

      it "searches across full_name, email, and job_title (case insensitive)" do
        create(:employee, full_name: "John Smith", email: "john@example.com")
        create(:employee, full_name: "Jane Doe", email: "jane@example.com")

        results = described_class.new(search: "JOHN").results

        expect(results.size).to eq(1)
        expect(results.first.full_name).to eq("John Smith")
      end

      it "ignores blank filter values" do
        create_list(:employee, 2)

        results = described_class.new(country: "", job_title: "", search: "").results

        expect(results.size).to eq(2)
      end
    end

    describe "sorting" do
      it "sorts by a whitelisted column" do
        create(:employee, full_name: "Charlie")
        create(:employee, full_name: "Alice")

        results = described_class.new(sort: "full_name", direction: "asc").results

        expect(results.map(&:full_name)).to eq(%w[Alice Charlie])
      end

      it "maps the salary alias to salary_cents" do
        create(:employee, salary_cents: 200_000_00)
        create(:employee, salary_cents: 100_000_00)

        results = described_class.new(sort: "salary", direction: "desc").results

        expect(results.map(&:salary_cents)).to eq([200_000_00, 100_000_00])
      end

      it "falls back to id for non-whitelisted sort columns" do
        e1 = create(:employee)
        e2 = create(:employee)

        results = described_class.new(sort: "DROP TABLE employees", direction: "asc").results

        expect(results.map(&:id)).to eq([e1.id, e2.id])
      end

      it "falls back to asc for invalid direction" do
        create(:employee, full_name: "B")
        create(:employee, full_name: "A")

        results = described_class.new(sort: "full_name", direction: "DROP").results

        expect(results.map(&:full_name)).to eq(%w[A B])
      end
    end

    describe "pagination" do
      before { create_list(:employee, 5) }

      it "paginates with page and per_page" do
        query = described_class.new(page: 2, per_page: 2)
        results = query.results

        expect(results.size).to eq(2)
        expect(query.page).to eq(2)
        expect(query.per_page).to eq(2)
        expect(query.total).to eq(5)
      end

      it "clamps page to minimum of 1" do
        query = described_class.new(page: -5, per_page: 2)
        query.results

        expect(query.page).to eq(1)
      end

      it "clamps per_page to MAX_PER_PAGE" do
        query = described_class.new(per_page: 999)
        query.results

        expect(query.per_page).to eq(described_class::MAX_PER_PAGE)
      end

      it "clamps per_page to minimum of 1" do
        query = described_class.new(per_page: 0)
        query.results

        expect(query.per_page).to eq(1)
      end

      it "defaults to page 1 and 25 per page" do
        query = described_class.new({})
        query.results

        expect(query.page).to eq(1)
        expect(query.per_page).to eq(25)
      end
    end
  end
end
