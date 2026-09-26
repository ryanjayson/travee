import { GOOGLE_MAPS_API_KEY as ENV_GOOGLE_KEY, MAPBOX_ACCESS_TOKEN as ENV_MAPBOX_TOKEN } from "@env";
import { getAirportCoordinates } from "./airportCoordinates";

const DEFAULT_GOOGLE_KEY =
  ENV_GOOGLE_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  "AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao";

const MAPBOX_ACCESS_TOKEN =
  ENV_MAPBOX_TOKEN ||
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.MAPBOX_ACCESS_TOKEN ||
  "";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT = "Travee-App/1.0 (contact@travee.app)";

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  name?: string;
  formattedAddress?: string;
}

const geocodeCache = new Map<string, GeocodedLocation>();

export const clearGeocodeCache = () => {
  geocodeCache.clear();
};

/**
 * Robust asynchronous geocoding utility for resolving addresses, places,
 * or station names to geographic coordinates.
 *
 * Fallback chain:
 * 1. In-memory cache
 * 2. Pre-computed airport coordinates map
 * 3. Google Geocoding API (if key available)
 * 4. Mapbox Searchbox Forward Geocoding (if token available)
 * 5. OpenStreetMap Nominatim API
 */
export const geocodeAddress = async (
  queryText: string | null | undefined,
  biasCoords?: { latitude: number; longitude: number } | null
): Promise<GeocodedLocation | null> => {
  if (!queryText) return null;
  const trimmed = queryText.trim();
  if (!trimmed) return null;

  const cacheKey = `${trimmed.toLowerCase()}_${
    biasCoords && (biasCoords.latitude !== 0 || biasCoords.longitude !== 0)
      ? `${biasCoords.latitude.toFixed(2)},${biasCoords.longitude.toFixed(2)}`
      : ""
  }`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Check airport map if code or airport name
  const airportResult = getAirportCoordinates(trimmed);
  if (airportResult) {
    const res: GeocodedLocation = {
      latitude: airportResult.latitude,
      longitude: airportResult.longitude,
      name: airportResult.name,
    };
    geocodeCache.set(cacheKey, res);
    return res;
  }

  // 2. Try Google Geocoding API
  if (DEFAULT_GOOGLE_KEY) {
    try {
      let googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        trimmed
      )}&key=${DEFAULT_GOOGLE_KEY}`;
      if (biasCoords && (biasCoords.latitude !== 0 || biasCoords.longitude !== 0)) {
        const delta = 0.5;
        googleUrl += `&bounds=${biasCoords.latitude - delta},${biasCoords.longitude - delta}|${
          biasCoords.latitude + delta
        },${biasCoords.longitude + delta}`;
      }
      const response = await fetch(googleUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
          const loc = data.results[0].geometry?.location;
          if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
            const res: GeocodedLocation = {
              latitude: loc.lat,
              longitude: loc.lng,
              name: data.results[0].formatted_address || trimmed,
              formattedAddress: data.results[0].formatted_address,
            };
            geocodeCache.set(cacheKey, res);
            return res;
          }
        }
      }
    } catch (err) {
      // Proceed to fallback
    }
  }

  // 3. Try Mapbox Searchbox Forward
  if (MAPBOX_ACCESS_TOKEN) {
    try {
      let mbUrl = `https://api.mapbox.com/search/searchbox/v1/forward?q=${encodeURIComponent(
        trimmed
      )}&access_token=${MAPBOX_ACCESS_TOKEN}&limit=1&language=en`;
      if (biasCoords && (biasCoords.latitude !== 0 || biasCoords.longitude !== 0)) {
        mbUrl += `&proximity=${biasCoords.longitude},${biasCoords.latitude}`;
      }
      const res = await fetch(mbUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const feat = data.features[0];
          const geom = feat.geometry;
          const props = feat.properties || {};
          const lng = Array.isArray(geom?.coordinates)
            ? geom.coordinates[0]
            : props?.coordinates?.longitude;
          const lat = Array.isArray(geom?.coordinates)
            ? geom.coordinates[1]
            : props?.coordinates?.latitude;
          if (
            typeof lat === "number" &&
            typeof lng === "number" &&
            !isNaN(lat) &&
            !isNaN(lng) &&
            (lat !== 0 || lng !== 0)
          ) {
            const resolved: GeocodedLocation = {
              latitude: lat,
              longitude: lng,
              name: props.name || feat.text || trimmed,
              formattedAddress: props.full_address || props.place_formatted,
            };
            geocodeCache.set(cacheKey, resolved);
            return resolved;
          }
        }
      }
    } catch (err) {
      // Proceed to fallback
    }
  }

  // 4. Fallback to OpenStreetMap Nominatim
  try {
    let osmUrl = `${NOMINATIM_SEARCH_URL}?q=${encodeURIComponent(
      trimmed
    )}&format=json&limit=1&accept-language=en`;
    if (biasCoords && (biasCoords.latitude !== 0 || biasCoords.longitude !== 0)) {
      const delta = 1.5;
      osmUrl += `&viewbox=${biasCoords.longitude - delta},${biasCoords.latitude + delta},${
        biasCoords.longitude + delta
      },${biasCoords.latitude - delta}&bounded=0`;
    }
    const response = await fetch(osmUrl, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT, Accept: "application/json" },
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
          const resolved: GeocodedLocation = {
            latitude: lat,
            longitude: lon,
            name: item.name || item.display_name?.split(",")[0] || trimmed,
            formattedAddress: item.display_name,
          };
          geocodeCache.set(cacheKey, resolved);
          return resolved;
        }
      }
    }
  } catch (err) {
    // Silently fail
  }

  return null;
};
