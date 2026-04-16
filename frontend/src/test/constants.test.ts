import { describe, it, expect } from "vitest";
import { COUNTRIES_WITH_CURRENCY, CURRENCY_BY_COUNTRY, JOB_TITLES } from "../constants";

describe("constants", () => {
  it("has 20 countries", () => {
    expect(COUNTRIES_WITH_CURRENCY).toHaveLength(20);
  });

  it("every country has a 3-letter currency code", () => {
    COUNTRIES_WITH_CURRENCY.forEach((entry) => {
      expect(entry.currency).toMatch(/^[A-Z]{3}$/);
    });
  });

  it("CURRENCY_BY_COUNTRY maps every country to its currency", () => {
    COUNTRIES_WITH_CURRENCY.forEach((entry) => {
      expect(CURRENCY_BY_COUNTRY[entry.country]).toBe(entry.currency);
    });
  });

  it("has no duplicate countries", () => {
    const countries = COUNTRIES_WITH_CURRENCY.map((c) => c.country);
    expect(new Set(countries).size).toBe(countries.length);
  });

  it("has 30 job titles", () => {
    expect(JOB_TITLES).toHaveLength(30);
  });

  it("has no duplicate job titles", () => {
    expect(new Set(JOB_TITLES).size).toBe(JOB_TITLES.length);
  });
});
