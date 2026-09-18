import { parseAirport } from "./airportUtils";

// Comprehensive coordinates lookup for top major international and regional airports
export const AIRPORT_COORDINATES_MAP: Record<string, { lat: number; lon: number; name: string }> = {
  // Philippines
  MNL: { lat: 14.5086, lon: 121.0194, name: "Ninoy Aquino International Airport" },
  CEB: { lat: 10.3075, lon: 123.9794, name: "Mactan-Cebu International Airport" },
  DVO: { lat: 7.1253, lon: 125.6456, name: "Francisco Bangoy International Airport" },
  CRK: { lat: 15.186, lon: 120.5597, name: "Clark International Airport" },
  ILO: { lat: 10.7764, lon: 122.4934, name: "Iloilo International Airport" },
  KLO: { lat: 11.6792, lon: 122.3756, name: "Kalibo International Airport" },
  MPH: { lat: 11.9247, lon: 121.9547, name: "Godofredo P. Ramos Airport (Caticlan)" },
  PPS: { lat: 9.742, lon: 118.7594, name: "Puerto Princesa International Airport" },
  TAG: { lat: 9.5647, lon: 123.7686, name: "Bohol-Panglao International Airport" },
  GES: { lat: 6.058, lon: 125.0961, name: "General Santos International Airport" },
  BCD: { lat: 10.7764, lon: 122.9904, name: "Bacolod-Silay Airport" },
  ZAM: { lat: 6.9225, lon: 122.0594, name: "Zamboanga International Airport" },
  LGP: { lat: 13.1572, lon: 123.7347, name: "Legazpi Airport" },
  CGY: { lat: 8.6128, lon: 124.4564, name: "Laguindingan Airport" },

  // Southeast Asia
  SIN: { lat: 1.3644, lon: 103.9915, name: "Singapore Changi Airport" },
  KUL: { lat: 2.7456, lon: 101.7072, name: "Kuala Lumpur International Airport" },
  BKK: { lat: 13.69, lon: 100.7501, name: "Suvarnabhumi Airport (Bangkok)" },
  DMK: { lat: 13.9126, lon: 100.6067, name: "Don Mueang International Airport" },
  HKT: { lat: 8.1132, lon: 98.3169, name: "Phuket International Airport" },
  CNX: { lat: 18.7668, lon: 98.9626, name: "Chiang Mai International Airport" },
  USM: { lat: 9.5478, lon: 100.0622, name: "Samui Airport" },
  CGK: { lat: -6.1256, lon: 106.6559, name: "Soekarno-Hatta International Airport" },
  DPS: { lat: -8.7482, lon: 115.1672, name: "Ngurah Rai International Airport (Bali)" },
  SUB: { lat: -7.3798, lon: 112.7874, name: "Juanda International Airport" },
  SGN: { lat: 10.8188, lon: 106.6519, name: "Tan Son Nhat International Airport" },
  HAN: { lat: 21.2212, lon: 105.8072, name: "Noi Bai International Airport" },
  DAD: { lat: 16.0439, lon: 108.1994, name: "Da Nang International Airport" },
  PNH: { lat: 11.5466, lon: 104.8441, name: "Phnom Penh International Airport" },
  REP: { lat: 13.4078, lon: 103.8128, name: "Siem Reap International Airport" },
  RGN: { lat: 16.9073, lon: 96.1332, name: "Yangon International Airport" },
  BWN: { lat: 4.9442, lon: 114.9284, name: "Brunei International Airport" },
  VTE: { lat: 17.9883, lon: 102.5633, name: "Wattay International Airport" },

  // East Asia
  HKG: { lat: 22.308, lon: 113.9185, name: "Hong Kong International Airport" },
  TPE: { lat: 25.0797, lon: 121.2342, name: "Taoyuan International Airport (Taipei)" },
  TSA: { lat: 25.0697, lon: 121.5525, name: "Taipei Songshan Airport" },
  KHH: { lat: 22.5714, lon: 120.35, name: "Kaohsiung International Airport" },
  NRT: { lat: 35.7647, lon: 140.3864, name: "Narita International Airport" },
  HND: { lat: 35.5494, lon: 139.7798, name: "Haneda Airport (Tokyo)" },
  KIX: { lat: 34.4347, lon: 135.2441, name: "Kansai International Airport (Osaka)" },
  ITM: { lat: 34.7855, lon: 135.438, name: "Itami Airport (Osaka)" },
  FUK: { lat: 33.5859, lon: 130.4507, name: "Fukuoka Airport" },
  CTS: { lat: 42.7752, lon: 141.6923, name: "New Chitose Airport (Sapporo)" },
  OKA: { lat: 26.1958, lon: 127.6459, name: "Naha Airport (Okinawa)" },
  NGO: { lat: 34.8584, lon: 136.8054, name: "Chubu Centrair International Airport" },
  ICN: { lat: 37.4602, lon: 126.4407, name: "Incheon International Airport (Seoul)" },
  GMP: { lat: 37.5583, lon: 126.7906, name: "Gimpo International Airport" },
  PUS: { lat: 35.1795, lon: 128.9382, name: "Gimhae International Airport (Busan)" },
  CJU: { lat: 33.5113, lon: 126.493, name: "Jeju International Airport" },
  PEK: { lat: 40.0799, lon: 116.6031, name: "Beijing Capital International Airport" },
  PKX: { lat: 39.5098, lon: 116.4105, name: "Beijing Daxing International Airport" },
  PVG: { lat: 31.1443, lon: 121.8083, name: "Shanghai Pudong International Airport" },
  SHA: { lat: 31.1979, lon: 121.3363, name: "Shanghai Hongqiao International Airport" },
  CAN: { lat: 23.3924, lon: 113.2988, name: "Guangzhou Baiyun International Airport" },
  SZX: { lat: 22.6393, lon: 113.8107, name: "Shenzhen Bao'an International Airport" },
  CTU: { lat: 30.5785, lon: 103.9471, name: "Chengdu Shuangliu International Airport" },
  MFM: { lat: 22.1496, lon: 113.5916, name: "Macau International Airport" },

  // Australia & New Zealand
  SYD: { lat: -33.9461, lon: 151.1772, name: "Sydney Kingsford Smith Airport" },
  MEL: { lat: -37.6733, lon: 144.8433, name: "Melbourne Airport" },
  BNE: { lat: -27.3842, lon: 153.1175, name: "Brisbane Airport" },
  PER: { lat: -31.9403, lon: 115.9668, name: "Perth Airport" },
  ADL: { lat: -34.945, lon: 138.5306, name: "Adelaide Airport" },
  AKL: { lat: -37.0082, lon: 174.785, name: "Auckland Airport" },
  CHC: { lat: -43.4864, lon: 172.5369, name: "Christchurch International Airport" },
  WLG: { lat: -41.3276, lon: 174.8076, name: "Wellington International Airport" },

  // Middle East & South Asia
  DXB: { lat: 25.2532, lon: 55.3657, name: "Dubai International Airport" },
  AUH: { lat: 24.433, lon: 54.6511, name: "Abu Dhabi International Airport" },
  DOH: { lat: 25.2731, lon: 51.6081, name: "Hamad International Airport (Doha)" },
  IST: { lat: 41.2753, lon: 28.7519, name: "Istanbul Airport" },
  SAW: { lat: 40.8986, lon: 29.3092, name: "Istanbul Sabiha Gokcen Airport" },
  RUH: { lat: 24.9576, lon: 46.6988, name: "King Khalid International Airport (Riyadh)" },
  JED: { lat: 21.6796, lon: 39.1565, name: "King Abdulaziz International Airport (Jeddah)" },
  DEL: { lat: 28.5562, lon: 77.10, name: "Indira Gandhi International Airport (Delhi)" },
  BOM: { lat: 19.0896, lon: 72.8656, name: "Chhatrapati Shivaji Maharaj International Airport (Mumbai)" },
  BLR: { lat: 13.1986, lon: 77.7066, name: "Kempegowda International Airport (Bengaluru)" },
  MAA: { lat: 12.9941, lon: 80.1709, name: "Chennai International Airport" },
  CMB: { lat: 7.1808, lon: 79.8841, name: "Bandaranaike International Airport (Colombo)" },
  MLE: { lat: 4.1918, lon: 73.5291, name: "Velana International Airport (Maldives)" },

  // Europe
  LHR: { lat: 51.47, lon: -0.4543, name: "London Heathrow Airport" },
  LGW: { lat: 51.1537, lon: -0.1821, name: "London Gatwick Airport" },
  STN: { lat: 51.886, lon: 0.2389, name: "London Stansted Airport" },
  LTN: { lat: 51.8747, lon: -0.3683, name: "London Luton Airport" },
  MAN: { lat: 53.3537, lon: -2.275, name: "Manchester Airport" },
  EDI: { lat: 55.95, lon: -3.3725, name: "Edinburgh Airport" },
  CDG: { lat: 49.0097, lon: 2.5479, name: "Paris Charles de Gaulle Airport" },
  ORY: { lat: 48.7262, lon: 2.3652, name: "Paris Orly Airport" },
  AMS: { lat: 52.3105, lon: 4.7683, name: "Amsterdam Airport Schiphol" },
  FRA: { lat: 50.0379, lon: 8.5622, name: "Frankfurt Airport" },
  MUC: { lat: 48.3537, lon: 11.775, name: "Munich Airport" },
  BER: { lat: 52.3667, lon: 13.5033, name: "Berlin Brandenburg Airport" },
  ZRH: { lat: 47.4582, lon: 8.5555, name: "Zurich Airport" },
  GVA: { lat: 46.237, lon: 6.1092, name: "Geneva Airport" },
  VIE: { lat: 48.1103, lon: 16.5697, name: "Vienna International Airport" },
  BRU: { lat: 50.901, lon: 4.4844, name: "Brussels Airport" },
  MAD: { lat: 40.4839, lon: -3.568, name: "Adolfo Suarez Madrid-Barajas Airport" },
  BCN: { lat: 41.2974, lon: 2.0833, name: "Josep Tarradellas Barcelona-El Prat Airport" },
  FCO: { lat: 41.8003, lon: 12.2389, name: "Leonardo da Vinci-Fiumicino Airport (Rome)" },
  MXP: { lat: 45.6301, lon: 8.7255, name: "Milan Malpensa Airport" },
  ATH: { lat: 37.9364, lon: 23.9484, name: "Athens International Airport" },
  DUB: { lat: 53.4264, lon: -6.2499, name: "Dublin Airport" },
  CPH: { lat: 55.618, lon: 12.6508, name: "Copenhagen Airport" },
  ARN: { lat: 59.6498, lon: 17.9186, name: "Stockholm Arlanda Airport" },
  OSL: { lat: 60.1975, lon: 11.1004, name: "Oslo Airport" },
  HEL: { lat: 60.3172, lon: 24.9633, name: "Helsinki-Vantaa Airport" },
  LIS: { lat: 38.7742, lon: -9.1342, name: "Humberto Delgado Airport (Lisbon)" },
  PRG: { lat: 50.1008, lon: 14.26, name: "Vaclav Havel Airport Prague" },
  BUD: { lat: 47.4369, lon: 19.2556, name: "Budapest Ferenc Liszt International Airport" },
  WAW: { lat: 52.1672, lon: 20.9679, name: "Warsaw Chopin Airport" },

  // North America
  JFK: { lat: 40.6413, lon: -73.7781, name: "John F. Kennedy International Airport (New York)" },
  EWR: { lat: 40.6895, lon: -74.1745, name: "Newark Liberty International Airport" },
  LGA: { lat: 40.7769, lon: -73.874, name: "LaGuardia Airport (New York)" },
  LAX: { lat: 33.9416, lon: -118.4085, name: "Los Angeles International Airport" },
  SFO: { lat: 37.6213, lon: -122.379, name: "San Francisco International Airport" },
  ORD: { lat: 41.9742, lon: -87.9073, name: "O'Hare International Airport (Chicago)" },
  DFW: { lat: 32.8998, lon: -97.0403, name: "Dallas/Fort Worth International Airport" },
  ATL: { lat: 33.6407, lon: -84.4277, name: "Hartsfield-Jackson Atlanta International Airport" },
  MIA: { lat: 25.7959, lon: -80.287, name: "Miami International Airport" },
  SEA: { lat: 47.4502, lon: -122.3088, name: "Seattle-Tacoma International Airport" },
  BOS: { lat: 42.3656, lon: -71.0096, name: "Logan International Airport (Boston)" },
  IAD: { lat: 38.9531, lon: -77.4565, name: "Washington Dulles International Airport" },
  DCA: { lat: 38.8512, lon: -77.0402, name: "Ronald Reagan Washington National Airport" },
  DEN: { lat: 39.8561, lon: -104.6737, name: "Denver International Airport" },
  LAS: { lat: 36.084, lon: -115.1537, name: "Harry Reid International Airport (Las Vegas)" },
  MCO: { lat: 28.4312, lon: -81.3081, name: "Orlando International Airport" },
  PHX: { lat: 33.4352, lon: -112.0101, name: "Phoenix Sky Harbor International Airport" },
  IAH: { lat: 29.9902, lon: -95.3368, name: "George Bush Intercontinental Airport (Houston)" },
  MSP: { lat: 44.8848, lon: -93.2223, name: "Minneapolis-Saint Paul International Airport" },
  DTW: { lat: 42.2162, lon: -83.3554, name: "Detroit Metropolitan Airport" },
  PHL: { lat: 39.8729, lon: -75.2437, name: "Philadelphia International Airport" },
  CLT: { lat: 35.2144, lon: -80.9473, name: "Charlotte Douglas International Airport" },
  SAN: { lat: 32.7338, lon: -117.1933, name: "San Diego International Airport" },
  HNL: { lat: 21.3187, lon: -157.9225, name: "Daniel K. Inouye International Airport (Honolulu)" },
  OGG: { lat: 20.8986, lon: -156.4305, name: "Kahului Airport (Maui)" },
  YVR: { lat: 49.1967, lon: -123.1815, name: "Vancouver International Airport" },
  YYZ: { lat: 43.6777, lon: -79.6248, name: "Toronto Pearson International Airport" },
  YUL: { lat: 45.4657, lon: -73.7455, name: "Montreal-Pierre Elliott Trudeau International Airport" },
  YYC: { lat: 51.1215, lon: -114.0076, name: "Calgary International Airport" },
  MEX: { lat: 19.4361, lon: -99.0719, name: "Mexico City International Airport" },
  CUN: { lat: 21.0365, lon: -86.877, name: "Cancun International Airport" },
  GDL: { lat: 20.5218, lon: -103.3112, name: "Guadalajara International Airport" },

  // South America & Africa
  GRU: { lat: -23.4356, lon: -46.4731, name: "Sao Paulo/Guarulhos International Airport" },
  GIG: { lat: -22.8134, lon: -43.2494, name: "Rio de Janeiro/Galeao International Airport" },
  EZE: { lat: -34.8222, lon: -58.5358, name: "Ministro Pistarini International Airport (Buenos Aires)" },
  SCL: { lat: -33.393, lon: -70.7858, name: "Arturo Merino Benitez International Airport (Santiago)" },
  BOG: { lat: 4.7016, lon: -74.1469, name: "El Dorado International Airport (Bogota)" },
  LIM: { lat: -12.0219, lon: -77.1143, name: "Jorge Chavez International Airport (Lima)" },
  JNB: { lat: -26.1367, lon: 28.2411, name: "O. R. Tambo International Airport (Johannesburg)" },
  CPT: { lat: -33.9715, lon: 18.6021, name: "Cape Town International Airport" },
  CAI: { lat: 30.1219, lon: 31.4056, name: "Cairo International Airport" },
  NBO: { lat: -1.3192, lon: 36.9278, name: "Jomo Kenyatta International Airport (Nairobi)" },
};

// Dynamic in-memory cache for resolved airport coordinates
const airportCache = new Map<string, { lat: number; lon: number; name: string }>();

/**
 * Synchronous lookup for airport coordinates by 3-letter IATA code.
 */
export const getAirportCoordinates = (
  codeOrString: string | null | undefined
): { latitude: number; longitude: number; name?: string } | null => {
  if (!codeOrString) return null;
  const parsed = parseAirport(codeOrString);
  const code = (parsed.code || codeOrString).trim().toUpperCase();

  if (AIRPORT_COORDINATES_MAP[code]) {
    const data = AIRPORT_COORDINATES_MAP[code];
    return { latitude: data.lat, longitude: data.lon, name: data.name };
  }

  if (airportCache.has(code)) {
    const data = airportCache.get(code)!;
    return { latitude: data.lat, longitude: data.lon, name: data.name };
  }

  return null;
};

/**
 * Asynchronous lookup for airport coordinates with remote TravelPayouts fallback.
 */
export const fetchAirportCoordinates = async (
  codeOrString: string | null | undefined
): Promise<{ latitude: number; longitude: number; name?: string } | null> => {
  if (!codeOrString) return null;
  const parsed = parseAirport(codeOrString);
  const code = (parsed.code || codeOrString).trim().toUpperCase();

  // Check sync first
  const syncResult = getAirportCoordinates(code);
  if (syncResult) return syncResult;

  try {
    const response = await fetch(
      `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(
        code
      )}&locale=en&types[]=airport`
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const match =
          data.find((item: any) => item.code && item.code.toUpperCase() === code) || data[0];
        if (match?.coordinates?.lat && match?.coordinates?.lon) {
          const resolved = {
            lat: match.coordinates.lat,
            lon: match.coordinates.lon,
            name: match.name || parsed.name || code,
          };
          airportCache.set(code, resolved);
          return {
            latitude: resolved.lat,
            longitude: resolved.lon,
            name: resolved.name,
          };
        }
      }
    }
  } catch (err) {
    // Silently fail fallback
  }

  return null;
};
