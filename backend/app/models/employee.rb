class Employee < ApplicationRecord
  CURRENCY_FORMAT = /\A[A-Z]{3}\z/

  validates :full_name, presence: true, length: { maximum: 200 }
  validates :job_title, presence: true, length: { maximum: 100 }
  validates :country,   presence: true, length: { maximum: 100 }
  validates :hired_on,  presence: true

  validates :salary_cents,
            presence: true,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  validates :currency,
            presence: true,
            format: { with: CURRENCY_FORMAT, message: "must be a 3-letter ISO 4217 code" }

  validates :email,
            length: { maximum: 255 },
            format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true },
            uniqueness: { case_sensitive: false, allow_blank: true }

  # ---- Scopes ----

  scope :by_country,   ->(country) { where(country: country) if country.present? }
  scope :by_job_title, ->(title)   { where(job_title: title) if title.present? }

  scope :search, ->(term) {
    if term.present?
      sanitized = "%#{sanitize_sql_like(term.to_s[0, 255])}%"
      where("full_name ILIKE :q OR email ILIKE :q OR job_title ILIKE :q", q: sanitized)
    end
  }

  # Returns the salary as a BigDecimal in whole currency units (e.g. dollars
  # rather than cents). Kept deliberately small — we don't round or format;
  # presentation concerns live at the serializer/UI boundary.
  def salary
    return nil if salary_cents.nil?

    BigDecimal(salary_cents) / 100
  end
end
