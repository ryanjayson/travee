export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "afghanistan": "AF",
  "albania": "AL",
  "algeria": "DZ",
  "andorra": "AD",
  "angola": "AO",
  "argentina": "AR",
  "armenia": "AM",
  "australia": "AU",
  "austria": "AT",
  "azerbaijan": "AZ",
  "bahamas": "BS",
  "bahrain": "BH",
  "bangladesh": "BD",
  "barbados": "BB",
  "belarus": "BY",
  "belgium": "BE",
  "belize": "BZ",
  "benin": "BJ",
  "bhutan": "BT",
  "bolivia": "BO",
  "bosnia and herzegovina": "BA",
  "botswana": "BW",
  "brazil": "BR",
  "brunei": "BN",
  "bulgaria": "BG",
  "cambodia": "KH",
  "cameroon": "CM",
  "canada": "CA",
  "chile": "CL",
  "china": "CN",
  "colombia": "CO",
  "costa rica": "CR",
  "croatia": "HR",
  "cuba": "CU",
  "cyprus": "CY",
  "czech republic": "CZ",
  "czechia": "CZ",
  "denmark": "DK",
  "dominican republic": "DO",
  "ecuador": "EC",
  "egypt": "EG",
  "el salvador": "SV",
  "estonia": "EE",
  "ethiopia": "ET",
  "fiji": "FJ",
  "finland": "FI",
  "france": "FR",
  "georgia": "GE",
  "germany": "DE",
  "ghana": "GH",
  "greece": "GR",
  "guatemala": "GT",
  "honduras": "HN",
  "hong kong": "HK",
  "hungary": "HU",
  "iceland": "IS",
  "india": "IN",
  "indonesia": "ID",
  "iran": "IR",
  "iraq": "IQ",
  "ireland": "IE",
  "israel": "IL",
  "italy": "IT",
  "jamaica": "JM",
  "japan": "JP",
  "jordan": "JO",
  "kazakhstan": "KZ",
  "kenya": "KE",
  "kuwait": "KW",
  "laos": "LA",
  "latvia": "LV",
  "lebanon": "LB",
  "lithuania": "LT",
  "luxembourg": "LU",
  "macau": "MO",
  "malaysia": "MY",
  "maldives": "MV",
  "malta": "MT",
  "mexico": "MX",
  "moldova": "MD",
  "monaco": "MC",
  "mongolia": "MN",
  "montenegro": "ME",
  "morocco": "MA",
  "myanmar": "MM",
  "nepal": "NP",
  "netherlands": "NL",
  "new zealand": "NZ",
  "nicaragua": "NI",
  "nigeria": "NG",
  "north korea": "KP",
  "north macedonia": "MK",
  "norway": "NO",
  "oman": "OM",
  "pakistan": "PK",
  "panama": "PA",
  "papua new guinea": "PG",
  "paraguay": "PY",
  "peru": "PE",
  "philippines": "PH",
  "poland": "PL",
  "portugal": "PT",
  "qatar": "QA",
  "romania": "RO",
  "russia": "RU",
  "rwanda": "RW",
  "saudi arabia": "SA",
  "serbia": "RS",
  "singapore": "SG",
  "slovakia": "SK",
  "slovenia": "SI",
  "south africa": "ZA",
  "south korea": "KR",
  "korea": "KR",
  "spain": "ES",
  "sri lanka": "LK",
  "sweden": "SE",
  "switzerland": "CH",
  "taiwan": "TW",
  "tanzania": "TZ",
  "thailand": "TH",
  "tunisia": "TN",
  "turkey": "TR",
  "turkiye": "TR",
  "uganda": "UG",
  "ukraine": "UA",
  "united arab emirates": "AE",
  "uae": "AE",
  "united kingdom": "GB",
  "uk": "GB",
  "great britain": "GB",
  "united states": "US",
  "united states of america": "US",
  "usa": "US",
  "uruguay": "UY",
  "uzbekistan": "UZ",
  "venezuela": "VE",
  "vietnam": "VN",
  "zambia": "ZM",
  "zimbabwe": "ZW",
};

/**
 * Validates and converts a country name or code string into a valid Mapbox ISO 3166-1 alpha-2 country code.
 * Returns undefined if no valid ISO country code can be matched.
 */
export const getValidMapboxCountryCode = (input?: string): string | undefined => {
  if (!input || typeof input !== "string") return undefined;

  const trimmed = input.trim();
  if (!trimmed) return undefined;

  // 1. Direct 2-letter uppercase ISO check or short-code check (e.g. "PH", "US", "us-ca")
  const codeCandidate = trimmed.split("-")[0].trim().toUpperCase();
  if (codeCandidate.length === 2 && /^[A-Z]{2}$/.test(codeCandidate)) {
    return codeCandidate.toLowerCase();
  }

  // 2. Lookup by exact country name
  const lowerName = trimmed.toLowerCase();
  if (COUNTRY_NAME_TO_CODE[lowerName]) {
    return COUNTRY_NAME_TO_CODE[lowerName].toLowerCase();
  }

  // 3. Partial match (e.g., if string contains "philippines" or "japan")
  for (const [name, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    if (lowerName.includes(name) || name.includes(lowerName)) {
      return code.toLowerCase();
    }
  }

  return undefined;
};
