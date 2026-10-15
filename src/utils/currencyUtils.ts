import { getValidMapboxCountryCode } from "./countryUtils";
import { fetchWithTimeout } from "./fetchWithTimeout";

// ISO 3166-1 alpha-2 country code to ISO 4217 currency code mapping
export const COUNTRY_CODE_TO_CURRENCY: Record<string, string> = {
  AU: "AUD",
  CA: "CAD",
  IE: "EUR",
  NZ: "NZD",
  PH: "PHP",
  SG: "SGD",
  GB: "GBP",
  US: "USD",
  JP: "JPY",
  KR: "KRW",
  TH: "THB",
  VN: "VND",
  ID: "IDR",
  MY: "MYR",
  HK: "HKD",
  TW: "TWD",
  CN: "CNY",
  IN: "INR",
  CH: "CHF",
  AE: "AED",
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  PT: "EUR",
  GR: "EUR",
  AT: "EUR",
  BE: "EUR",
  FI: "EUR",
  CY: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  LU: "EUR",
  MT: "EUR",
  SK: "EUR",
  SI: "EUR",
  NO: "NOK",
  SE: "SEK",
  DK: "DKK",
  IS: "ISK",
  CZ: "CZK",
  PL: "PLN",
  HU: "HUF",
  RO: "RON",
  BG: "BGN",
  HR: "EUR",
  TR: "TRY",
  ZA: "ZAR",
  EG: "EGP",
  MX: "MXN",
  BR: "BRL",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  PE: "PEN",
  IL: "ILS",
  SA: "SAR",
  QA: "QAR",
  KW: "KWD",
  RU: "RUB",
  UA: "UAH",
};

/**
 * Resolves a currency code from a country name, country code, or destination string.
 */
export const getCurrencyForCountry = (
  countryOrDestination?: string
): string | undefined => {
  if (!countryOrDestination || typeof countryOrDestination !== "string") {
    return undefined;
  }
  const isoCode = getValidMapboxCountryCode(countryOrDestination);
  if (isoCode) {
    const upper = isoCode.toUpperCase();
    if (COUNTRY_CODE_TO_CURRENCY[upper]) {
      return COUNTRY_CODE_TO_CURRENCY[upper];
    }
  }
  return undefined;
};

/**
 * Fetches the real-time exchange rate from baseCurrency to targetCurrency.
 * Uses free public APIs with timeout and graceful fallback.
 * Returns null if network fails or currencies are invalid.
 */
export const fetchExchangeRate = async (
  baseCurrency: string,
  targetCurrency: string
): Promise<number | null> => {
  const base = baseCurrency.trim().toUpperCase();
  const target = targetCurrency.trim().toUpperCase();

  if (!base || !target || base === target) {
    return null;
  }

  // Primary API: open.er-api.com
  try {
    const res = await fetchWithTimeout(
      `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
      {},
      5000
    );
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.[target];
      if (typeof rate === "number" && !isNaN(rate) && rate > 0) {
        return rate;
      }
    }
  } catch {
    // Primary failed, proceed to fallback
  }

  // Fallback API: Frankfurter
  try {
    const res = await fetchWithTimeout(
      `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(
        base
      )}&symbols=${encodeURIComponent(target)}`,
      {},
      5000
    );
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.[target];
      if (typeof rate === "number" && !isNaN(rate) && rate > 0) {
        return rate;
      }
    }
  } catch {
    // Fallback failed
  }

  return null;
};

/**
 * Formats a currency exchange rate nicely for UI display.
 */
export const formatExchangeRate = (rate: number): string => {
  if (!rate || isNaN(rate)) return "--";
  if (rate >= 1000) return Math.round(rate).toLocaleString();
  if (rate >= 100) return rate.toFixed(0);
  if (rate >= 10) return rate.toFixed(1);
  if (rate >= 1) return rate.toFixed(2);
  if (rate >= 0.01) return rate.toFixed(2);
  return rate.toPrecision(2);
};
