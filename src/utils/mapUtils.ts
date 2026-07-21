import { DestinationDto } from "../features/Travel/types/TravelDto";

const COMMON_COUNTRIES = new Set([
  "united states", "us", "usa", "united kingdom", "uk", "great britain", "gb",
  "japan", "philippines", "australia", "canada", "france", "germany", "italy",
  "spain", "south korea", "korea", "china", "singapore", "thailand", "indonesia",
  "malaysia", "vietnam", "taiwan", "hong kong", "india", "brazil", "mexico",
  "new zealand", "switzerland", "netherlands", "belgium", "sweden", "norway",
  "denmark", "finland", "russia", "turkey", "united arab emirates", "uae",
  "saudi arabia", "south africa", "egypt", "morocco", "greece", "portugal",
  "austria", "ireland"
]);

/**
 * Returns dynamic zoom level based on destination granularity:
 * - Country: zoom 5 (zoomed out to show whole country)
 * - State / Region: zoom 10.5 (shows state/province)
 * - City / Place / POI: zoom 13.5 (zoomed in close to city view)
 */
export const getDestinationZoom = (
  destination?: string,
  destinationData?: DestinationDto | null,
  fallbackZoom = 13.5
): number => {

  if (!destination && !destinationData) return fallbackZoom;

  const destStr = (destination || "").trim().toLowerCase();
  const countryStr = (destinationData?.country || "").trim().toLowerCase();

  // Explicit city -> Zoom in close to city (13.5)
  if (destinationData?.city) {
    return 13.5;
  }

  // Region / state distinct from country -> Zoom 10.5
  if (destinationData?.regionOrState && destinationData.regionOrState.trim().toLowerCase() !== countryStr) {
    return 10.5;
  }

  // If destination name matches country name -> Zoom out (5)
  if (destStr && countryStr) {
    if (destStr === countryStr) {
      return 5;
    } else {
      return 13.5; // City or place in country -> Zoom in close
    }
  }

  // Known country -> Zoom out (5)
  if (destStr && COMMON_COUNTRIES.has(destStr)) {
    return 5;
  }

  // Non-country destination (e.g. city or specific location) -> Zoom in close (13.5)
  return fallbackZoom;
};
