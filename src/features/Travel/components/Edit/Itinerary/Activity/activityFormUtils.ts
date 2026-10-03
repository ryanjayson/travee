import { DestinationDto } from "../../../../types/TravelDto";
import { GooglePlaceLocation } from "../../../GoogleMapSearchBox";
import { PinnedLocation } from "../../../Lookups/OsmMapPinModal";

export const NATURE_SUBTYPES = [
  "Beach",
  "Mountain",
  "Lake",
  "River",
  "Waterfall",
  "Forest",
  "Jungle",
  "Cave",
  "Desert",
  "Canyon",
  "Volcano",
];

const GENERIC_CUISINE_TERMS = [
  "restaurant",
  "cafe",
  "bar",
  "pub",
  "food",
  "establishment",
  "eating_room",
  "bakery",
  "fast_food",
  "coffee_shop",
  "bistro",
];

export const getCuisineFromCategories = (
  categories: string[]
): string | undefined => {
  if (!categories || !Array.isArray(categories)) return undefined;
  const cuisine = categories.find(
    (c) => !GENERIC_CUISINE_TERMS.includes(c.toLowerCase())
  );
  if (cuisine) {
    return cuisine
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return undefined;
};

export const matchNatureSubtype = (poi: any): string | null => {
  const categories = [
    poi.category,
    ...(poi.poiCategories || []),
    poi.maki,
  ].filter(Boolean) as string[];

  for (const cat of categories) {
    const matched = NATURE_SUBTYPES.find((sub) =>
      cat.toLowerCase().includes(sub.toLowerCase())
    );
    if (matched) return matched;
  }
  return null;
};

export const matchShoppingSubtype = (poi: any): string | null => {
  const categories = [
    poi.category,
    ...(poi.poiCategories || []),
    poi.maki,
  ].filter(Boolean) as string[];

  for (const cat of categories) {
    const norm = cat.toLowerCase();
    if (norm.includes("mall") || norm.includes("shopping_mall")) return "Mall";
    if (norm.includes("market")) return "Market";
    if (norm.includes("clothing") || norm.includes("clothes")) {
      return "Clothes Store";
    }
    if (norm.includes("supermarket") || norm.includes("grocery")) {
      return "Supermarket";
    }
    if (norm.includes("convenience")) return "Convenience Store";
    if (norm.includes("spa") || norm.includes("beauty")) return "Spa";
    if (norm.includes("atm")) return "ATM";
    if (norm.includes("bank")) return "Bank";
    if (norm.includes("pharmacy") || norm.includes("drugstore")) {
      return "Pharmacy";
    }
    if (norm.includes("gas") || norm.includes("petrol")) return "Gas Station";
  }
  return null;
};

export const matchEntertainmentSubtype = (poi: any): string | null => {
  const categories = [
    poi.category,
    ...(poi.poiCategories || []),
    poi.maki,
  ].filter(Boolean) as string[];

  for (const cat of categories) {
    const norm = cat.toLowerCase();
    if (norm.includes("theme_park")) return "Theme Park";
    if (norm.includes("cinema") || norm.includes("theater")) return "Cinema";
    if (norm.includes("park")) return "Park";
    if (norm.includes("museum")) return "Museum";
    if (
      norm.includes("gym") ||
      norm.includes("fitness") ||
      norm.includes("sports_club")
    ) {
      return "Gym";
    }
    if (norm.includes("stadium") || norm.includes("arena")) return "Stadium";
    if (norm.includes("zoo") || norm.includes("aquarium")) return "Zoo";
    if (norm.includes("concert") || norm.includes("music_venue")) {
      return "Concert";
    }
  }
  return null;
};

export const buildDestinationDtoFromGooglePlace = (
  location: GooglePlaceLocation
): DestinationDto => {
  const name = location.name || location.address || "";
  const address = location.address || name;
  let city = "";
  let regionOrState = "";
  let country = "";

  const raw = location.raw;

  if (raw && Array.isArray(raw.addressComponents)) {
    raw.addressComponents.forEach((c: any) => {
      const types = c.types || [];
      const isLocality =
        types.includes("locality") ||
        types.includes("postal_town") ||
        (!city && types.includes("sublocality"));

      if (isLocality) {
        city = c.longText || c.shortText || city;
      }
      if (types.includes("administrative_area_level_1")) {
        regionOrState = c.longText || c.shortText || regionOrState;
      }
      if (types.includes("country")) {
        country = c.longText || c.shortText || country;
      }
    });
  } else if (raw && Array.isArray(raw.address_components)) {
    raw.address_components.forEach((c: any) => {
      const types = c.types || [];
      const isLocality =
        types.includes("locality") ||
        types.includes("postal_town") ||
        (!city && types.includes("sublocality"));

      if (isLocality) {
        city = c.long_name || c.short_name || city;
      }
      if (types.includes("administrative_area_level_1")) {
        regionOrState = c.long_name || c.short_name || regionOrState;
      }
      if (types.includes("country")) {
        country = c.long_name || c.short_name || country;
      }
    });
  } else if (raw?.properties) {
    city =
      raw.properties.city ||
      raw.properties.town ||
      raw.properties.village ||
      "";
    regionOrState = raw.properties.state || "";
    country = raw.properties.country || "";
  } else if (raw && Array.isArray(raw.context)) {
    raw.context.forEach((c: any) => {
      if (c.id?.startsWith("country")) country = c.text || country;
      else if (c.id?.startsWith("region")) regionOrState = c.text || regionOrState;
      else if (c.id?.startsWith("place")) city = c.text || city;
    });
  }

  if (!city && location.secondaryText) {
    const parts = location.secondaryText
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      city = parts[0];
      if (!country) country = parts[parts.length - 1];
    } else if (parts.length === 1) {
      city = parts[0];
    }
  } else if (!city && location.address) {
    const parts = location.address
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);
    if (parts.length >= 3) {
      city = parts[parts.length - 3] || parts[parts.length - 2];
      if (!country) country = parts[parts.length - 1];
    } else if (parts.length === 2) {
      city = parts[0];
      if (!country) country = parts[1];
    }
  }

  if (!country && location.address) {
    const parts = location.address
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      country = parts[parts.length - 1];
    }
  }

  return {
    id: location.placeId || "",
    name,
    city: city || name,
    regionOrState: regionOrState || undefined,
    country: country || undefined,
    address: address || undefined,
    placeId: location.placeId || undefined,
    coordinates: {
      latitude: location.coordinates?.latitude || 0,
      longitude: location.coordinates?.longitude || 0,
    },
  };
};

export const buildDestinationDtoFromPinnedLocation = (
  location: PinnedLocation
): DestinationDto => {
  const name = location.name || location.address || "";
  const address = location.address || name;
  let city = "";
  let regionOrState = "";
  let country = "";

  if (location.address) {
    const parts = location.address
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);
    if (parts.length >= 3) {
      city = parts[parts.length - 3] || parts[parts.length - 2];
      regionOrState = parts[parts.length - 2];
      country = parts[parts.length - 1];
    } else if (parts.length === 2) {
      city = parts[0];
      country = parts[1];
    } else if (parts.length === 1) {
      city = parts[0];
    }
  }

  return {
    id: (location as any).id || location.placeId || "",
    name,
    city: city || name,
    regionOrState: regionOrState || undefined,
    country: country || undefined,
    address: address || undefined,
    placeId: location.placeId || undefined,
    coordinates: {
      latitude: location.coordinates?.latitude || 0,
      longitude: location.coordinates?.longitude || 0,
    },
  };
};

export const toLocalDateStr = (dInput: any): string | null => {
  if (!dInput) return null;
  const d = new Date(dInput);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const toLocalTimeStr = (dInput: any): string => {
  if (!dInput) return "";
  const d = new Date(dInput);
  if (isNaN(d.getTime())) return "";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const formatFlightDateTime = (dateVal: any): string => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime()) || d.getTime() <= 0) return "";
  return d.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const resolveInitialLocation = (
  destLocation: any,
  detailLocation: any,
  fallbackCoords?: { latitude: number; longitude: number }
): DestinationDto | null => {
  if (destLocation && typeof destLocation === "object" && destLocation.name) {
    return destLocation as DestinationDto;
  }
  if (detailLocation && typeof detailLocation === "object") {
    return detailLocation as DestinationDto;
  }
  if (typeof detailLocation === "string" && detailLocation.trim()) {
    try {
      const parsed = JSON.parse(detailLocation);
      if (parsed && typeof parsed === "object" && parsed.name) {
        return parsed as DestinationDto;
      }
    } catch {}
    return {
      id: "",
      name: detailLocation,
      city: detailLocation,
      coordinates: fallbackCoords || { latitude: 0, longitude: 0 },
    } as DestinationDto;
  }
  return (destLocation as DestinationDto) || null;
};

export const getInitialStartDate = (
  activity: any,
  currentSection: any
): string | null => {
  if (activity?.startDate) {
    return toLocalDateStr(activity.startDate);
  }
  if (activity?.accomodationDetails?.checkinDateTime) {
    return toLocalDateStr(activity.accomodationDetails.checkinDateTime);
  }
  if (activity?.transportationDetails?.departureDateTime) {
    return toLocalDateStr(activity.transportationDetails.departureDateTime);
  }
  if (activity?.rideRentalDetails?.rentalStartDateTime) {
    return toLocalDateStr(activity.rideRentalDetails.rentalStartDateTime);
  }
  return currentSection?.startDate
    ? toLocalDateStr(currentSection.startDate)
    : null;
};

export const getInitialStartTime = (
  activity: any,
  currentSection: any
): string => {
  const check = (dt: any) =>
    dt && String(dt).includes("T") ? toLocalTimeStr(dt) : null;
  const fromActivity =
    check(activity?.startDate) ||
    check(activity?.accomodationDetails?.checkinDateTime) ||
    check(activity?.transportationDetails?.departureDateTime) ||
    check(activity?.rideRentalDetails?.rentalStartDateTime);
  if (fromActivity) return fromActivity;
  if (currentSection?.startDate) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  return "";
};

export const getInitialEndDate = (activity: any): string | null => {
  if (activity?.endDate) {
    return toLocalDateStr(activity.endDate);
  }
  if (activity?.accomodationDetails?.checkoutDateTime) {
    return toLocalDateStr(activity.accomodationDetails.checkoutDateTime);
  }
  if (activity?.transportationDetails?.arrivalDateTime) {
    return toLocalDateStr(activity.transportationDetails.arrivalDateTime);
  }
  if (activity?.rideRentalDetails?.rentalEndDateTime) {
    return toLocalDateStr(activity.rideRentalDetails.rentalEndDateTime);
  }
  return null;
};

export const getInitialEndTime = (activity: any): string => {
  const check = (dt: any) =>
    dt && String(dt).includes("T") ? toLocalTimeStr(dt) : null;
  const fromActivity =
    check(activity?.endDate) ||
    check(activity?.accomodationDetails?.checkoutDateTime) ||
    check(activity?.transportationDetails?.arrivalDateTime) ||
    check(activity?.rideRentalDetails?.rentalEndDateTime);
  return fromActivity || "09:00";
};

