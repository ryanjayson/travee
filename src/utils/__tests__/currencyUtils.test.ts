import {
  getCurrencyForCountry,
  fetchExchangeRate,
  formatExchangeRate,
} from "../currencyUtils";

describe("currencyUtils", () => {
  describe("getCurrencyForCountry", () => {
    it("resolves currency by exact country name", () => {
      expect(getCurrencyForCountry("Japan")).toBe("JPY");
      expect(getCurrencyForCountry("United States")).toBe("USD");
      expect(getCurrencyForCountry("Philippines")).toBe("PHP");
      expect(getCurrencyForCountry("Australia")).toBe("AUD");
      expect(getCurrencyForCountry("United Kingdom")).toBe("GBP");
      expect(getCurrencyForCountry("France")).toBe("EUR");
    });

    it("resolves currency from destination strings with city and country", () => {
      expect(getCurrencyForCountry("Tokyo, Japan")).toBe("JPY");
      expect(getCurrencyForCountry("Paris, France")).toBe("EUR");
    });

    it("returns undefined for empty or invalid input", () => {
      expect(getCurrencyForCountry("")).toBeUndefined();
      expect(getCurrencyForCountry(undefined)).toBeUndefined();
      expect(getCurrencyForCountry("NonexistentPlaceXYZ")).toBeUndefined();
    });
  });

  describe("formatExchangeRate", () => {
    it("formats large rates as integers with commas", () => {
      expect(formatExchangeRate(25420)).toBe("25,420");
      expect(formatExchangeRate(153.24)).toBe("153");
    });

    it("formats medium rates with 1 decimal", () => {
      expect(formatExchangeRate(58.14)).toBe("58.1");
      expect(formatExchangeRate(12.34)).toBe("12.3");
    });

    it("formats small rates with 2 decimals", () => {
      expect(formatExchangeRate(1.543)).toBe("1.54");
      expect(formatExchangeRate(0.921)).toBe("0.92");
    });

    it("returns -- for invalid or 0 numbers", () => {
      expect(formatExchangeRate(0)).toBe("--");
      expect(formatExchangeRate(NaN)).toBe("--");
    });
  });

  describe("fetchExchangeRate", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("returns null if currencies are identical", async () => {
      const rate = await fetchExchangeRate("USD", "USD");
      expect(rate).toBeNull();
    });

    it("returns null if base or target is empty", async () => {
      expect(await fetchExchangeRate("", "USD")).toBeNull();
      expect(await fetchExchangeRate("USD", "")).toBeNull();
    });

    it("fetches rate successfully when primary API succeeds", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rates: { JPY: 153.5 } }),
      } as any);

      const rate = await fetchExchangeRate("USD", "JPY");
      expect(rate).toBe(153.5);
    });

    it("returns null gracefully if both primary and fallback APIs fail", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network Error"));

      const rate = await fetchExchangeRate("USD", "JPY");
      expect(rate).toBeNull();
    });
  });
});
