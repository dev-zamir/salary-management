require 'rails_helper'

RSpec.describe Employee do
  describe 'factory' do
    it 'builds a valid employee' do
      expect(build(:employee)).to be_valid
    end

    it 'persists successfully' do
      expect { create(:employee) }.to change(described_class, :count).by(1)
    end
  end

  describe 'validations' do
    subject { build(:employee) }

    it { is_expected.to validate_presence_of(:full_name) }
    it { is_expected.to validate_length_of(:full_name).is_at_most(200) }

    it { is_expected.to validate_presence_of(:job_title) }
    it { is_expected.to validate_length_of(:job_title).is_at_most(100) }

    it { is_expected.to validate_presence_of(:country) }
    it { is_expected.to validate_length_of(:country).is_at_most(100) }

    it { is_expected.to validate_presence_of(:hired_on) }

    it { is_expected.to validate_presence_of(:salary_cents) }

    it 'rejects a negative salary_cents' do
      employee = build(:employee, salary_cents: -1)
      expect(employee).not_to be_valid
      expect(employee.errors[:salary_cents]).to be_present
    end

    it 'accepts a zero salary_cents' do
      expect(build(:employee, salary_cents: 0)).to be_valid
    end

    it { is_expected.to validate_presence_of(:currency) }

    it 'rejects a currency that is not 3 uppercase letters' do
      %w[usd USDD US1 US].each do |bad|
        expect(build(:employee, currency: bad)).not_to be_valid
      end
    end

    it 'accepts a valid 3-letter uppercase currency' do
      expect(build(:employee, currency: "INR")).to be_valid
    end

    it 'allows a blank email' do
      expect(build(:employee, email: nil)).to be_valid
      expect(build(:employee, email: "")).to be_valid
    end

    it 'rejects a malformed email' do
      expect(build(:employee, email: "not-an-email")).not_to be_valid
    end

    it 'enforces email uniqueness when present (case insensitive)' do
      create(:employee, email: "hr@example.com")
      duplicate = build(:employee, email: "HR@example.com")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to be_present
    end

    it 'allows multiple employees with a nil email' do
      create(:employee, email: nil)
      expect(build(:employee, email: nil)).to be_valid
    end
  end

  describe '#salary' do
    it 'converts salary_cents to a BigDecimal in whole currency units' do
      employee = build(:employee, salary_cents: 12_345_678)
      expect(employee.salary).to eq(BigDecimal("123456.78"))
    end

    it 'returns a BigDecimal instance' do
      expect(build(:employee).salary).to be_a(BigDecimal)
    end

    it 'returns nil when salary_cents is nil' do
      expect(Employee.new(salary_cents: nil).salary).to be_nil
    end

    it 'handles zero correctly' do
      expect(build(:employee, salary_cents: 0).salary).to eq(BigDecimal("0"))
    end
  end
end
