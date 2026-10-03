import { Alert, Clipboard, Platform, ToastAndroid } from "react-native";
import { DestinationDto } from "../../../../../types/TravelDto";

/**
 * Parses a location from a stringified JSON, object, or string.
 */
export const parseLocObject = (loc?: any): DestinationDto | null => {
  if (!loc) return null;
  if (typeof loc === "object" && (loc.name || loc.address || loc.city)) {
    return loc as DestinationDto;
  }
  if (typeof loc === "string" && loc.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(loc);
      if (parsed && typeof parsed === "object") {
        return parsed as DestinationDto;
      }
    } catch {
      // Fallback on parse failure
    }
  }
  return null;
};

/**
 * Extracts a concise display title for a location.
 */
export const getLocationTitle = (loc?: any): string => {
  if (!loc) return "";
  const obj = parseLocObject(loc);
  if (obj) {
    return obj.name || obj.city || obj.address || "";
  }
  if (typeof loc === "string") {
    const commaIndex = loc.indexOf(",");
    if (commaIndex > 0) {
      return loc.substring(0, commaIndex).trim();
    }
    return loc.trim();
  }
  return "";
};

/**
 * Extracts a formatted address or region string for a location.
 */
export const getLocationAddress = (loc?: any): string => {
  if (!loc) return "";
  const obj = parseLocObject(loc);
  if (obj) {
    if (
      obj.address &&
      (!obj.name || obj.address.toLowerCase() !== obj.name.toLowerCase())
    ) {
      return obj.address;
    }
    const regionParts = [
      obj.city && obj.name && obj.city.toLowerCase() !== obj.name.toLowerCase()
        ? obj.city
        : !obj.name
          ? obj.city
          : null,
      obj.regionOrState,
      obj.country,
    ].filter(Boolean);
    if (regionParts.length > 0) {
      return regionParts.join(", ");
    }
    return obj.address || "";
  }
  if (typeof loc === "string") {
    const commaIndex = loc.indexOf(",");
    if (commaIndex > 0) {
      return loc.substring(commaIndex + 1).trim();
    }
    return "";
  }
  return "";
};

/**
 * Formats a numeric or string price with currency prefix.
 */
export const formatPrice = (price?: string | number | null): string | null => {
  if (!price && price !== 0) return null;
  const str = String(price).trim();
  if (!str) return null;
  if (str.startsWith("₱") || str.startsWith("$")) return str;
  const num = Number(str);
  return !isNaN(num) ? `₱${num.toLocaleString()}` : str;
};

/**
 * Cross-platform clipboard helper with Android Toast / iOS Alert feedback.
 */
export const copyToClipboard = (text: string, label: string): void => {
  if (!text) return;
  Clipboard.setString(text);
  if (Platform.OS === "android") {
    ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
  } else {
    Alert.alert("Copied", `${label} copied to clipboard`);
  }
};

/**
 * Determines whether a detail data object has meaningful non-metadata properties.
 */
export const hasActivityData = (data: any): boolean => {
  if (!data || typeof data !== "object") return false;

  const ignoredKeys = new Set([
    "id",
    "activityId",
    "activity_id",
    "createdAt",
    "created_at",
    "updatedAt",
    "updated_at",
    "_status",
    "_changed",
    "isOffline",
  ]);

  for (const [key, value] of Object.entries(data)) {
    if (ignoredKeys.has(key)) continue;

    if (value !== null && value !== undefined) {
      if (typeof value === "string" && value.trim() !== "") {
        return true;
      }
      if (typeof value === "number" || typeof value === "boolean") {
        return true;
      }
      if (value instanceof Date) {
        return true;
      }
      if (typeof value === "object") {
        if (Array.isArray(value) && value.length > 0) {
          return true;
        }
        if (!Array.isArray(value) && Object.keys(value).length > 0) {
          const subValues = Object.values(value);
          const hasValidSub = subValues.some(
            (v) => v !== null && v !== undefined && String(v).trim() !== ""
          );
          if (hasValidSub) return true;
        }
      }
    }
  }

  return false;
};
