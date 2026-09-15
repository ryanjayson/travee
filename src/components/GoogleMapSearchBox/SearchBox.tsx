import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
  KeyboardEvent,
  TouchableWithoutFeedback,
  useWindowDimensions,
  LayoutAnimation,
  Dimensions,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// @ts-ignore
import { GOOGLE_MAPS_API_KEY as ENV_GOOGLE_KEY, MAPBOX_ACCESS_TOKEN as ENV_MAPBOX_TOKEN } from "@env";
import { getValidMapboxCountryCode } from "../../utils/countryUtils";
import {
  GooglePlaceLocation,
  GoogleMapSearchBoxProps,
  SearchPredictionItem,
} from "./types";
import { StaggerItem } from "../animations";

// Default Fallback Keys & Endpoints
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

// Google Places API (New) endpoints
const GOOGLE_NEW_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const GOOGLE_NEW_DETAILS_BASE_URL = "https://places.googleapis.com/v1/places";

// Legacy Google Places endpoints (fallback)
const GOOGLE_LEGACY_AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const GOOGLE_LEGACY_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

// Mapbox & OSM fallback endpoints
const MAPBOX_SEARCHBOX_URL = "https://api.mapbox.com/search/searchbox/v1/forward";
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT = "Travee-App/1.0 (contact@travee.app)";

// Generate session token to group autocomplete queries with place details call
const generateSessionToken = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Determine best icon based on Google / Mapbox place types
const getPlaceTypeIcon = (types?: string[]): keyof typeof Icon.glyphMap => {
  if (!types || types.length === 0) return "place";
  const typeStr = types.join(" ").toLowerCase();

  if (
    typeStr.includes("restaurant") ||
    typeStr.includes("food") ||
    typeStr.includes("cafe") ||
    typeStr.includes("bakery") ||
    typeStr.includes("bar")
  ) {
    return "restaurant";
  }
  if (
    typeStr.includes("lodging") ||
    typeStr.includes("hotel") ||
    typeStr.includes("motel") ||
    typeStr.includes("hostel") ||
    typeStr.includes("resort")
  ) {
    return "hotel";
  }
  if (typeStr.includes("airport") || typeStr.includes("flight")) {
    return "flight";
  }
  if (
    typeStr.includes("transit") ||
    typeStr.includes("station") ||
    typeStr.includes("subway") ||
    typeStr.includes("bus") ||
    typeStr.includes("train")
  ) {
    return "directions-transit";
  }
  if (
    typeStr.includes("shopping") ||
    typeStr.includes("store") ||
    typeStr.includes("mall") ||
    typeStr.includes("market")
  ) {
    return "shopping-bag";
  }
  if (
    typeStr.includes("tourist") ||
    typeStr.includes("attraction") ||
    typeStr.includes("museum") ||
    typeStr.includes("monument") ||
    typeStr.includes("point_of_interest")
  ) {
    return "local-see";
  }
  if (
    typeStr.includes("park") ||
    typeStr.includes("natural") ||
    typeStr.includes("camp") ||
    typeStr.includes("beach") ||
    typeStr.includes("mountain")
  ) {
    return "terrain";
  }
  if (typeStr.includes("hospital") || typeStr.includes("pharmacy") || typeStr.includes("health")) {
    return "local-hospital";
  }

  return "place";
};

export interface DestinationBadgeItem {
  id: string;
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  country?: string;
}

const normalizeDestinations = (
  destinations?: any[],
  fallbackDestination?: string
): DestinationBadgeItem[] => {
  const result: DestinationBadgeItem[] = [];
  const seenNames = new Set<string>();

  const addUnique = (name: string, coords?: { latitude: number; longitude: number }, country?: string, rawId?: string) => {
    const cleanName = name?.trim();
    if (!cleanName) return;
    const lower = cleanName.toLowerCase();
    if (seenNames.has(lower)) return;
    seenNames.add(lower);
    result.push({
      id: rawId || `dest-${seenNames.size}-${lower}`,
      name: cleanName,
      coordinates: coords && (coords.latitude !== 0 || coords.longitude !== 0) ? coords : undefined,
      country,
    });
  };

  if (Array.isArray(destinations) && destinations.length > 0) {
    destinations.forEach((d, idx) => {
      if (!d) return;
      if (typeof d === "string") {
        d.split("|").forEach((part) => addUnique(part, undefined, undefined, `dest-str-${idx}-${part.trim()}`));
      } else if (typeof d === "object") {
        const destName = d.destination || d.name || d.destinationData?.city || d.destinationData?.country || "";
        const coords = d.destinationData?.coordinates || d.coordinates || (
          typeof d.latitude === "number" && typeof d.longitude === "number"
            ? { latitude: d.latitude, longitude: d.longitude }
            : undefined
        );
        const countryCode = d.destinationData?.country || d.country;
        addUnique(destName, coords, countryCode, d.id || `dest-obj-${idx}`);
      }
    });
  }

  if (result.length === 0 && fallbackDestination) {
    fallbackDestination.split("|").forEach((part, idx) => {
      addUnique(part, undefined, undefined, `dest-fallback-${idx}`);
    });
  }

  return result;
};

export const GoogleMapSearchBox: React.FC<GoogleMapSearchBoxProps> = ({
  onSelect,
  onClose,
  onManualEntry,
  title,
  description,
  descriptionText,
  destination,
  destinations,
  placeholder = "Search here",
  initialValue = "",
  onClear,
  apiKey,
  country,
  proximity,
  types,
  maxResultsHeight = 320,
  bottomOffset = 0,
  mode = "bottomsheet",
  showBackdrop = true,
  autoFocus = false,
  disabled = false,
  hideOnSelect = true,
  containerStyle,
  searchBarContainerStyle,
  inputStyle,
  testID = "google-map-search-box",
  panResponder,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  // Active destinations state for badge filtering
  const [activeDestinations, setActiveDestinations] = useState<DestinationBadgeItem[]>(() =>
    normalizeDestinations(destinations, destination)
  );
  const activeDestinationsRef = useRef<DestinationBadgeItem[]>(activeDestinations);
  activeDestinationsRef.current = activeDestinations;

  // Track if user explicitly cleared or removed destinations
  const userClearedDestinationsRef = useRef<boolean>(false);
  const prevDestinationsKeyRef = useRef<string>(
    normalizeDestinations(destinations, destination)
      .map((d) => d.name.toLowerCase())
      .sort()
      .join("|")
  );

  // Sync activeDestinations if destinations prop changes
  useEffect(() => {
    const normalized = normalizeDestinations(destinations, destination);
    const newKey = normalized.map((d) => d.name.toLowerCase()).sort().join("|");

    // If destination prop key changed from what we originally received (e.g., completely new destination prop passed)
    if (newKey !== prevDestinationsKeyRef.current) {
      prevDestinationsKeyRef.current = newKey;
      userClearedDestinationsRef.current = false;
      setActiveDestinations(normalized);
      activeDestinationsRef.current = normalized;
      return;
    }

    // If the props represent the same destinations, but user cleared them:
    // DO NOT re-add default destination!
    if (userClearedDestinationsRef.current) {
      return;
    }
  }, [destinations, destination]);

  const [query, setQuery] = useState<string>(initialValue);
  const [predictions, setPredictions] = useState<SearchPredictionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSelectingId, setIsSelectingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [selectedSpot, setSelectedSpot] = useState<GooglePlaceLocation | null>(null);
  const [hasStartedTyping, setHasStartedTyping] = useState<boolean>(false);
  const isTyping = hasStartedTyping || query.length > 0;

  const { height: currentWindowHeight } = useWindowDimensions();
  const initialWindowHeightRef = useRef<number>(0);

  useEffect(() => {
    if (initialWindowHeightRef.current === 0 && currentWindowHeight > 0) {
      initialWindowHeightRef.current = currentWindowHeight;
    }
  }, [currentWindowHeight]);

  const sessionTokenRef = useRef<string>(generateSessionToken());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeApiKey = apiKey || DEFAULT_GOOGLE_KEY;

  const hasAutoFocusedRef = useRef<boolean>(false);

  // Trigger autoFocus only once on mount, never on subsequent re-renders
  useEffect(() => {
    if (autoFocus && !hasAutoFocusedRef.current) {
      hasAutoFocusedRef.current = true;
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen to keyboard height and visibility
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      if (Platform.OS === "ios") {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setIsKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === "ios") {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Update query when initialValue changes externally
  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  // Clean up debounce timer and abort controller on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Mapbox & Nominatim Fallback search in case Google API fails or has quota limit
  const fetchFallbackPredictions = async (
    searchText: string,
    signal: AbortSignal,
    customProximity?: { latitude: number; longitude: number } | null,
    customCountry?: string | null
  ): Promise<SearchPredictionItem[]> => {
    const targetCountry = customCountry === null ? undefined : (customCountry || country);
    const targetProximity = customProximity === null ? undefined : (customProximity || proximity);
    const validCountry = targetCountry ? getValidMapboxCountryCode(targetCountry) : undefined;

    // 1. Try Mapbox SearchBox API
    if (MAPBOX_ACCESS_TOKEN) {
      try {
        let mbUrl = `${MAPBOX_SEARCHBOX_URL}?q=${encodeURIComponent(
          searchText
        )}&access_token=${MAPBOX_ACCESS_TOKEN}&limit=6&language=en`;
        if (validCountry) mbUrl += `&country=${encodeURIComponent(validCountry)}`;
        if (targetProximity && (targetProximity.latitude !== 0 || targetProximity.longitude !== 0)) {
          mbUrl += `&proximity=${targetProximity.longitude},${targetProximity.latitude}`;
        }

        const res = await fetch(mbUrl, { signal });
        if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            return data.features.map((f: any) => {
              const props = f.properties || {};
              const geom = f.geometry || {};
              const lng = Array.isArray(geom.coordinates)
                ? geom.coordinates[0]
                : props.coordinates?.longitude ?? 0;
              const lat = Array.isArray(geom.coordinates)
                ? geom.coordinates[1]
                : props.coordinates?.latitude ?? 0;

              return {
                id: props.mapbox_id || f.id || Math.random().toString(),
                placeId: props.mapbox_id || f.id,
                name: props.name || f.text || props.full_address?.split(",")[0] || "Location",
                secondaryText: props.place_formatted || props.full_address,
                fullAddress: props.full_address || props.place_formatted || props.name || "",
                types: props.poi_category || (props.feature_type ? [props.feature_type] : []),
                source: "mapbox" as const,
                coordinates: { latitude: lat, longitude: lng },
              };
            });
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") throw err;
        console.warn("[GoogleMapSearchBox] Mapbox fallback error:", err);
      }
    }

    // 2. Try Nominatim (OSM) Fallback
    try {
      let osmUrl = `${NOMINATIM_SEARCH_URL}?q=${encodeURIComponent(
        searchText
      )}&format=json&addressdetails=1&limit=6&accept-language=en`;
      if (validCountry) osmUrl += `&countrycodes=${encodeURIComponent(validCountry)}`;
      if (targetProximity && (targetProximity.latitude !== 0 || targetProximity.longitude !== 0)) {
        const delta = 1.5;
        osmUrl += `&viewbox=${targetProximity.longitude - delta},${targetProximity.latitude + delta},${targetProximity.longitude + delta
          },${targetProximity.latitude - delta}&bounded=0`;
      }

      const res = await fetch(osmUrl, {
        headers: { "User-Agent": NOMINATIM_USER_AGENT, Accept: "application/json" },
        signal,
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any) => {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const name = item.name || item.display_name.split(",")[0];
            const secondary = item.display_name.split(",").slice(1).join(",").trim();

            return {
              id: String(item.place_id),
              placeId: String(item.place_id),
              name,
              secondaryText: secondary || item.display_name,
              fullAddress: item.display_name,
              types: [item.type, item.class].filter(Boolean),
              source: "osm" as const,
              coordinates: { latitude: lat, longitude: lng },
            };
          });
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
      console.warn("[GoogleMapSearchBox] OSM fallback error:", err);
    }

    return [];
  };

  // Helper to query single search context (Google New -> Google Legacy -> Fallback)
  const searchSingleScope = async (
    searchText: string,
    targetProximity?: { latitude: number; longitude: number } | null,
    targetCountry?: string | null,
    signal?: AbortSignal
  ): Promise<SearchPredictionItem[]> => {
    const effCountry = targetCountry === null ? undefined : (targetCountry || country);
    const effProx = targetProximity === null ? undefined : (targetProximity || proximity);

    // 1. Try Google Places API (New)
    if (activeApiKey && signal) {
      try {
        const bodyPayload: any = {
          input: searchText,
          sessionToken: sessionTokenRef.current,
        };
        if (effCountry) {
          bodyPayload.includedRegionCodes = [effCountry.toUpperCase()];
        }
        if (effProx && (effProx.latitude !== 0 || effProx.longitude !== 0)) {
          bodyPayload.locationBias = {
            circle: {
              center: {
                latitude: effProx.latitude,
                longitude: effProx.longitude,
              },
              radius: 50000.0,
            },
          };
        }

        const newRes = await fetch(GOOGLE_NEW_AUTOCOMPLETE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": activeApiKey,
            "X-Goog-FieldMask": "suggestions.placePrediction",
          },
          body: JSON.stringify(bodyPayload),
          signal,
        });

        if (newRes.ok) {
          const data = await newRes.json();
          if (data.suggestions && data.suggestions.length > 0) {
            return data.suggestions
              .filter((s: any) => s.placePrediction)
              .map((s: any) => {
                const p = s.placePrediction;
                const name =
                  p.structuredFormat?.mainText?.text ||
                  p.text?.text?.split(",")[0] ||
                  "Location";
                const secondary =
                  p.structuredFormat?.secondaryText?.text ||
                  p.text?.text?.split(",").slice(1).join(",").trim() ||
                  "";
                return {
                  id: p.placeId || Math.random().toString(),
                  placeId: p.placeId,
                  name,
                  secondaryText: secondary,
                  fullAddress: p.text?.text || name,
                  types: p.types || [],
                  source: "google_new" as const,
                };
              });
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") throw err;
      }
    }

    // 2. Try Legacy Google Places Autocomplete API
    if (activeApiKey && signal) {
      try {
        let url = `${GOOGLE_LEGACY_AUTOCOMPLETE_URL}?input=${encodeURIComponent(
          searchText
        )}&key=${activeApiKey}&sessiontoken=${sessionTokenRef.current}&language=en`;
        if (effCountry) url += `&components=country:${encodeURIComponent(effCountry.toLowerCase())}`;
        if (effProx && (effProx.latitude !== 0 || effProx.longitude !== 0)) {
          url += `&location=${effProx.latitude},${effProx.longitude}&radius=50000`;
        }
        if (types) url += `&types=${encodeURIComponent(types)}`;

        const response = await fetch(url, { signal });
        if (response.ok) {
          const data = await response.json();
          if (data.status === "OK" && data.predictions) {
            return data.predictions.map((p: any) => ({
              id: p.place_id,
              placeId: p.place_id,
              name: p.structured_formatting?.main_text || p.description.split(",")[0],
              secondaryText: p.structured_formatting?.secondary_text,
              fullAddress: p.description,
              types: p.types,
              source: "google" as const,
            }));
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") throw err;
      }
    }

    // 3. Fallback to Mapbox & OpenStreetMap
    if (signal) {
      return await fetchFallbackPredictions(searchText, signal, targetProximity, targetCountry);
    }
    return [];
  };

  // Google Places Autocomplete with Active Destination Filtering
  const performSearch = useCallback(
    async (searchText: string) => {
      const clean = searchText.trim();
      if (clean.length < 2) {
        setPredictions([]);
        setIsLoading(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);

      const currentActiveDests = activeDestinationsRef.current;

      try {
        // Case A: Multiple active destinations -> Parallel searches scoped/biased to each active destination
        if (currentActiveDests.length > 1) {
          const searches = currentActiveDests.map((dest) => {
            const queryWithDest = dest.coordinates ? clean : `${clean} ${dest.name}`;
            return searchSingleScope(
              queryWithDest,
              dest.coordinates || null,
              dest.country || null,
              controller.signal
            ).catch((err) => {
              if (err?.name === "AbortError") throw err;
              return [] as SearchPredictionItem[];
            });
          });

          const resultsArray = await Promise.all(searches);

          // Interleave and deduplicate results across all active destinations
          const seenIds = new Set<string>();
          const combined: SearchPredictionItem[] = [];
          const maxPerList = Math.max(...resultsArray.map((r) => r.length), 0);

          for (let i = 0; i < maxPerList; i++) {
            for (let j = 0; j < resultsArray.length; j++) {
              const item = resultsArray[j][i];
              if (item) {
                const key = item.placeId || item.id || item.fullAddress;
                if (!seenIds.has(key)) {
                  seenIds.add(key);
                  combined.push(item);
                }
              }
            }
          }

          setPredictions(combined);
          setIsExpanded(true);
          return;
        }

        // Case B: Exactly 1 active destination -> Search biased specifically to that destination
        if (currentActiveDests.length === 1) {
          const singleDest = currentActiveDests[0];
          const queryWithDest = singleDest.coordinates ? clean : `${clean} ${singleDest.name}`;
          const results = await searchSingleScope(
            queryWithDest,
            singleDest.coordinates || null,
            singleDest.country || country || null,
            controller.signal
          );
          setPredictions(results);
          setIsExpanded(true);
          return;
        }

        // Case C: No active destinations (badges cleared or none provided) -> Global/unbiased search anywhere, remove proximity and country bias
        const globalResults = await searchSingleScope(clean, null, null, controller.signal);
        setPredictions(globalResults);
        setIsExpanded(true);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeApiKey, country, proximity, types]
  );

  // Handle removing an active destination badge
  const handleRemoveDestination = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveDestinations((prev) => {
      const next = prev.filter((d) => d.id !== id);
      activeDestinationsRef.current = next;
      if (next.length === 0) {
        userClearedDestinationsRef.current = true;
      }
      // Re-trigger search immediately with the remaining active destinations (or global if 0)
      if (query.trim().length >= 2) {
        setTimeout(() => {
          performSearch(query);
        }, 50);
      }
      return next;
    });

    // If keyboard is currently open, keep the text input focused so the keyboard stays visible
    if (isKeyboardVisible) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  // Handle clearing all active destination badges
  const handleClearAllDestinations = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    userClearedDestinationsRef.current = true;
    activeDestinationsRef.current = [];
    setActiveDestinations([]);
    // Re-trigger search immediately anywhere worldwide
    if (query.trim().length >= 2) {
      setTimeout(() => {
        performSearch(query);
      }, 50);
    }

    if (isKeyboardVisible) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  // Debounce user keystrokes
  const handleQueryChange = (text: string) => {
    setHasStartedTyping(text.length > 0);
    setQuery(text);
    setSelectedSpot(null);
    setIsExpanded(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (text.trim().length < 2) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      performSearch(text);
    }, 320);
  };

  // Fetch place details upon selecting a prediction
  const handleSelectPrediction = async (item: SearchPredictionItem) => {
    setIsSelectingId(item.id);

    try {
      // 1. If prediction already has coordinates (Mapbox or OSM fallback)
      if (
        item.coordinates &&
        typeof item.coordinates.latitude === "number" &&
        typeof item.coordinates.longitude === "number"
      ) {
        const selectedLocation: GooglePlaceLocation = {
          placeId: item.placeId,
          name: item.name,
          address: item.fullAddress,
          coordinates: item.coordinates,
          types: item.types,
          secondaryText: item.secondaryText,
          raw: item,
        };

        setQuery(item.name);
        setSelectedSpot(selectedLocation);
        setPredictions([]);
        setIsExpanded(false);
        setHasStartedTyping(false);
        inputRef.current?.blur();
        Keyboard.dismiss();
        sessionTokenRef.current = generateSessionToken();
        onSelect(selectedLocation);
        return;
      }

      // 2. Google Places API (New) Details Request
      if (activeApiKey && (item.source === "google_new" || item.source === "google")) {
        try {
          const newDetailsUrl = `${GOOGLE_NEW_DETAILS_BASE_URL}/${encodeURIComponent(
            item.placeId
          )}`;
          const newResponse = await fetch(newDetailsUrl, {
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": activeApiKey,
              "X-Goog-FieldMask": "id,displayName,formattedAddress,location,types",
              "sessionToken": sessionTokenRef.current,
            },
          });

          if (newResponse.ok) {
            const data = await newResponse.json();
            if (data.location && typeof data.location.latitude === "number") {
              const selectedLocation: GooglePlaceLocation = {
                placeId: data.id || item.placeId,
                name: data.displayName?.text || item.name,
                address: data.formattedAddress || item.fullAddress,
                coordinates: {
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                },
                types: data.types || item.types,
                secondaryText: item.secondaryText,
                raw: data,
              };

              setQuery(selectedLocation.name);
              setSelectedSpot(selectedLocation);
              setPredictions([]);
              setIsExpanded(false);
              inputRef.current?.blur();
              Keyboard.dismiss();
              sessionTokenRef.current = generateSessionToken();
              onSelect(selectedLocation);
              return;
            }
          }
        } catch {
          // Fall through to legacy details or fallback
        }
      }

      // 3. Legacy Google Places Details Request
      if (activeApiKey) {
        const detailsUrl = `${GOOGLE_LEGACY_DETAILS_URL}?place_id=${encodeURIComponent(
          item.placeId
        )}&fields=place_id,name,formatted_address,geometry,types,address_components&key=${activeApiKey}&sessiontoken=${sessionTokenRef.current
          }`;

        const response = await fetch(detailsUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "OK" && data.result?.geometry?.location) {
            const res = data.result;
            const selectedLocation: GooglePlaceLocation = {
              placeId: res.place_id || item.placeId,
              name: res.name || item.name,
              address: res.formatted_address || item.fullAddress,
              coordinates: {
                latitude: res.geometry.location.lat,
                longitude: res.geometry.location.lng,
              },
              types: res.types || item.types,
              secondaryText: item.secondaryText,
              raw: res,
            };

            setQuery(res.name || item.name);
            setSelectedSpot(selectedLocation);
            setPredictions([]);
            setIsExpanded(false);
            inputRef.current?.blur();
            Keyboard.dismiss();
            sessionTokenRef.current = generateSessionToken();
            onSelect(selectedLocation);
            return;
          }
        }
      }

      // 4. Fallback geocode if Google Details API failed or is not available
      const fallbackResults = await fetchFallbackPredictions(
        item.fullAddress || item.name,
        new AbortController().signal
      );
      if (fallbackResults.length > 0 && fallbackResults[0].coordinates) {
        const topFallback = fallbackResults[0];
        const selectedLocation: GooglePlaceLocation = {
          placeId: item.placeId,
          name: item.name,
          address: item.fullAddress,
          coordinates: topFallback.coordinates!,
          types: item.types,
          secondaryText: item.secondaryText,
          raw: item,
        };
        setQuery(item.name);
        setSelectedSpot(selectedLocation);
        setPredictions([]);
        setIsExpanded(false);
        inputRef.current?.blur();
        Keyboard.dismiss();
        sessionTokenRef.current = generateSessionToken();
        onSelect(selectedLocation);
        return;
      }

      // Fallback with empty coordinates if completely unresolvable
      const fallbackLocation: GooglePlaceLocation = {
        placeId: item.placeId,
        name: item.name,
        address: item.fullAddress,
        coordinates: { latitude: 0, longitude: 0 },
        types: item.types,
        secondaryText: item.secondaryText,
        raw: item,
      };
      setQuery(item.name);
      setSelectedSpot(fallbackLocation);
      setPredictions([]);
      setIsExpanded(false);
      inputRef.current?.blur();
      Keyboard.dismiss();
      sessionTokenRef.current = generateSessionToken();
      onSelect(fallbackLocation);
    } catch (err) {
      console.warn("[GoogleMapSearchBox] Selection resolution error:", err);
    } finally {
      setIsSelectingId(null);
    }
  };

  const handleClear = () => {
    setHasStartedTyping(false);
    setQuery("");
    setPredictions([]);
    setSelectedSpot(null);
    setIsExpanded(false);
    setIsLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    sessionTokenRef.current = generateSessionToken();
    onClear?.();
    inputRef.current?.focus();
  };

  const handleDismissResults = () => {
    setIsExpanded(false);
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  // Check if window/container was already resized by Android OS (adjustResize)
  const screenHeight = Dimensions.get("screen").height;
  const isWindowShrunk =
    isKeyboardVisible &&
    Platform.OS === "android" &&
    (screenHeight - currentWindowHeight > 120 ||
      (initialWindowHeightRef.current > 0 &&
        currentWindowHeight < initialWindowHeightRef.current - 80));

  const bottomPosition = (() => {
    if (!isKeyboardVisible) {
      return Math.max(insets.bottom, 12) + bottomOffset;
    }
    if (Platform.OS === "android" && isWindowShrunk) {
      return 0;
    }
    return keyboardHeight;
  })();

  // BottomSheet View Mode (Default modern bottom sheet)
  if (mode === "bottomsheet") {
    return (
      <View
        testID={testID}
        className="bg-white rounded-t-[30px] overflow-hidden shadow-2xl w-full will-change-variable"
        style={[
          {
            paddingBottom: isKeyboardVisible ? 8 : Math.max(insets.bottom, 16),
          },
          containerStyle,
        ]}
      >
        {/* Top Drag Handle Bar */}
        <View
          {...(panResponder?.panHandlers)}
          className="w-full items-center pt-3 pb-3 bg-white"
        >
          <View className="w-10 h-1 bg-gray-300 rounded-full" />
        </View>

        {/* Header Row */}
        <View className="flex-row items-center justify-between px-5 pt-1 pb-2 bg-white">
          <View
            {...(panResponder?.panHandlers)}
            className="flex-1 mr-3"
          >
            <Text className="text-2xl font-semibold text-accent" numberOfLines={1}>
              {title || "Search Spot or Location"}
            </Text>
            {description || descriptionText ? (
              <Text className="text-md text-tertiary" numberOfLines={2}>
                {description || descriptionText}
              </Text>
            ) : activeDestinations.length == 0 ? (
              < Text className="text-md text-tertiary" numberOfLines={1}>
                Search anywhere
              </Text>
            ) : null}
          </View>

          <View className="flex-row items-center gap-2">
            {onManualEntry && (
              <TouchableOpacity
                onPress={onManualEntry}
                activeOpacity={0.7}
                className="py-1.5 px-3 rounded-full bg-gray-100"
                accessibilityRole="button"
                accessibilityLabel="Enter plan manually without search"
              >
                <View className="flex-row items-center">
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                    Manual
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {onClose && (
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Close bottom sheet"
              >
                <Icon name="close" size={18} color="#667085" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Clearable Active Destination Badges */}
        {
          activeDestinations.length > 0 ? (
            <View
              {...(panResponder?.panHandlers)}
              className="px-5 pb-4 "
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={{ alignItems: "center", gap: 4 }}
              >
                <Text className="text-md text-tertiary py-1">
                  Search near
                </Text>
                {activeDestinations.map((dest) => (
                  <View
                    key={dest.id}
                    className="flex-row items-center pl-2.5 pr-1.5 py-1 rounded-full border border-gray-200"
                  >
                    <Icon name="place" size={13} color={"#263F69"} style={{ marginRight: 4, opacity: 0.6 }} />
                    <Text
                      className="text-xs font-semibold mr-1 text-accent"
                      numberOfLines={1}
                    >
                      {dest.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveDestination(dest.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${dest.name} filter`}
                      className="w-4 h-4 rounded-full items-center justify-center bg-gray-200"
                    >
                      <Icon name="close" size={10} color="#475467" />
                    </TouchableOpacity>
                  </View>
                ))}
                {activeDestinations.length > 1 && (
                  <TouchableOpacity
                    onPress={handleClearAllDestinations}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Clear all destination filters"
                    className="px-2.5 py-1 ml-1"
                  >
                    <Text className="text-xs text-gray-500 font-medium underline">Clear all</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          ) : userClearedDestinationsRef.current ? (
            <View className="px-5 pb-3">
              {/* <View className="flex-row items-center">
              <View className="flex-row items-center px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50">
                <Icon name="public" size={13} color="#667085" style={{ marginRight: 4 }} />
                <Text className="text-xs text-secondary/70 font-medium">
                  Worldwide (no proximity filter)
                </Text>
              </View>
            </View> */}
            </View>
          ) : null
        }

        {/* Selected Spot Preview Card (When spot is picked, shown above search box) */}
        {
          selectedSpot && (
            <View className="px-4 mb-3">
              <View
                className="rounded-2xl p-3.5 border border-gray-200 bg-gray-50"
                style={{ borderColor: `${colors.primary}30` }}
              >
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <Icon name="place" size={22} color={colors.primary} />
                  </View>

                  <View className="flex-1">
                    <Text
                      className="text-[15px] font-bold text-gray-900"
                      numberOfLines={1}
                    >
                      {selectedSpot.name}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                      {selectedSpot.address}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => onSelect(selectedSpot)}
                  activeOpacity={0.8}
                  className="rounded-xl py-3 items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm this spot for plan"
                >
                  <View className="flex-row items-center">
                    <Icon name="check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text className="text-white text-sm font-bold">Select This Spot</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )
        }

        {/* Predictions / Results Section (Expands ABOVE the search box) */}
        {
          ((isTyping || predictions.length > 0) && !selectedSpot) && (
            <View
              style={{
                minHeight: isTyping ? 200 : undefined,
                maxHeight: maxResultsHeight,
              }}
              className="px-4 mb-2"
            >
              {predictions.length > 0 ? (
                <FlatList
                  {...(panResponder?.panHandlers)}
                  data={predictions}
                  keyExtractor={(item) => `${item.source}-${item.id}`}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ minHeight: isTyping ? 200 : undefined }}
                  renderItem={({ item, index }) => {
                    const isSelected = isSelectingId === item.id;
                    const iconName = getPlaceTypeIcon(item.types);

                    return (
                      <TouchableOpacity
                        onPress={() => handleSelectPrediction(item)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Select location ${item.name}`}
                        className="py-3 px-2 rounded-xl"
                      >
                        <StaggerItem index={index}>

                          <View className="flex-row items-center">
                            <View
                              className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                              style={{ backgroundColor: `${colors.primary}12` }}
                            >
                              <Icon name={iconName} size={18} color={colors.primary} />
                            </View>

                            <View className="flex-1 mr-2">
                              <Text
                                className="text-[15px] font-bold text-gray-900 leading-5"
                              >
                                {item.name}
                              </Text>
                              <Text className="text-sm text-tertiary leading-4 mt-0.5" >
                                {item.secondaryText || item.fullAddress}
                              </Text>
                            </View>

                            {isSelected ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Icon name="chevron-right" size={18} color="#98A2B3" />
                            )}
                          </View>
                        </StaggerItem>

                      </TouchableOpacity>
                    );
                  }}
                  ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-100 ml-[48px]" />}
                />
              ) : isLoading ? (
                <View className="items-center justify-center py-8" style={{ minHeight: 200 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text className="text-xs text-gray-500 mt-2 font-medium">Searching locations...</Text>
                </View>
              ) : query.trim().length >= 2 ? (
                <View
                  {...(panResponder?.panHandlers || {})}
                  className="items-center justify-center py-6 px-4"
                  style={{ minHeight: 200 }}
                >
                  <Icon name="location-off" size={26} color="#98A2B3" style={{ marginBottom: 4 }} />
                  <Text className="text-sm font-semibold text-gray-700 mb-0.5">No locations found</Text>
                  <Text className="text-xs text-gray-500 text-center">
                    Try searching with a different name or spelling
                  </Text>
                </View>
              ) : (
                <View
                  {...(panResponder?.panHandlers || {})}
                  className="items-center justify-center py-6 px-4"
                  style={{ minHeight: 200 }}
                >
                  <Icon name="search" size={24} color="#D0D5DD" style={{ marginBottom: 4 }} />
                  <Text className="text-xs text-gray-400">Type at least 2 characters to search</Text>
                </View>
              )}
            </View>
          )
        }

        {/* Search Bar Input (Attached at bottom of sheet / top of keyboard) */}
        <View
          {...(panResponder?.panHandlers)}
          className="px-4 mb-2xl">
          <View
            className="flex-row items-center h-[64px] px-3.5 bg-gray-100 rounded-full border border-gray-200"
            style={searchBarContainerStyle}
          >
            <Icon name="search" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={handleQueryChange}
              placeholder={placeholder}
              placeholderTextColor="#98A2B3"
              onFocus={() => {
                if (predictions.length > 0) setIsExpanded(true);
              }}
              editable={!disabled}
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => performSearch(query)}
              className="flex-1 text-[18px] py-0 text-secondary font-semibold"
              style={[{ color: colors.onSurface || "#101828" }, inputStyle]}
            />
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                className="mr-2"
              />
            )}
            {query.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                activeOpacity={0.7}
                className="p-1"
                accessibilityRole="button"
                accessibilityLabel="Clear search input"
              >
                <View className="w-5 h-5 rounded-full bg-gray-300 items-center justify-center">
                  <Icon name="close" size={13} color="#475467" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View >
    );
  }

  // Fallback / Absolute Floating Mode
  return (
    <View
      testID={testID}
      className={`z-[100] will-change-variable ${mode === "absolute" ? "absolute left-0 right-0" : ""}`}
      style={[
        {
          paddingHorizontal: isKeyboardVisible ? 12 : 16,
          bottom: mode === "absolute" ? bottomPosition : undefined,
        },
        containerStyle,
      ]}
    >
      {/* Selected Spot Preview Card */}
      {selectedSpot && (
        <View className="mb-2 bg-white rounded-2xl border border-gray-200 p-3.5 shadow-md">
          <View className="flex-row items-center mb-2.5">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center mr-2.5"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Icon name="place" size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                {selectedSpot.name}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                {selectedSpot.address}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => onSelect(selectedSpot)}
            activeOpacity={0.8}
            className="rounded-xl py-2.5 items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            accessibilityRole="button"
            accessibilityLabel="Confirm this spot for plan"
          >
            <View className="flex-row items-center">
              <Icon name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text className="text-white text-xs font-bold">Select This Spot</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Destination Badges in Floating Mode */}
      {activeDestinations.length > 0 && !selectedSpot ? (
        <View className="mb-2 px-1">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ alignItems: "center", gap: 6 }}
          >
            {activeDestinations.map((dest) => (
              <View
                key={dest.id}
                className="flex-row items-center pl-2.5 pr-1.5 py-1 rounded-full bg-white border border-gray-200 shadow-sm"
              >
                <Icon name="place" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text
                  className="text-xs font-semibold mr-1"
                  style={{ color: colors.primary }}
                  numberOfLines={1}
                >
                  {dest.name}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveDestination(dest.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${dest.name} filter`}
                  className="w-4 h-4 rounded-full items-center justify-center bg-gray-200"
                >
                  <Icon name="close" size={10} color="#475467" />
                </TouchableOpacity>
              </View>
            ))}
            {activeDestinations.length > 1 && (
              <TouchableOpacity
                onPress={handleClearAllDestinations}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Clear all destination filters"
                className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 ml-1"
              >
                <Text className="text-xs text-gray-500 font-medium">Clear all</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      ) : userClearedDestinationsRef.current && !selectedSpot ? (
        <View className="mb-2 px-1 flex-row items-center">
          <View className="flex-row items-center px-2.5 py-1 rounded-full bg-white border border-gray-200 shadow-sm">
            <Icon name="public" size={13} color="#667085" style={{ marginRight: 4 }} />
            <Text className="text-xs text-secondary/70 font-medium">
              Worldwide (no proximity filter)
            </Text>
          </View>
        </View>
      ) : null}

      {/* Predictions List (Expands ABOVE search box) */}
      {(((isTyping && isExpanded && !selectedSpot) || (predictions.length > 0 && isExpanded))) && (
        <View
          className="mb-2 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
          style={{
            minHeight: isTyping ? 200 : undefined,
            maxHeight: maxResultsHeight,
          }}
        >
          {predictions.length > 0 ? (
            <FlatList
              data={predictions}
              keyExtractor={(item) => `${item.source}-${item.id}`}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ minHeight: isTyping ? 200 : undefined }}
              renderItem={({ item }) => {
                const isSelected = isSelectingId === item.id;
                const iconName = getPlaceTypeIcon(item.types);

                return (
                  <TouchableOpacity
                    onPress={() => handleSelectPrediction(item)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Select location ${item.name}`}
                    className="py-3 px-3"
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-8 h-8 rounded-xl items-center justify-center mr-2.5"
                        style={{ backgroundColor: `${colors.primary}12` }}
                      >
                        <Icon name={iconName} size={16} color={colors.primary} />
                      </View>
                      <View className="flex-1 mr-2">
                        <Text
                          className="text-sm font-semibold text-gray-900 leading-4"
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text className="text-xs text-gray-500 leading-4 mt-0.5" numberOfLines={1}>
                          {item.secondaryText || item.fullAddress}
                        </Text>
                      </View>
                      {isSelected ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Icon name="chevron-right" size={16} color="#98A2B3" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-100 ml-[44px]" />}
            />
          ) : isLoading ? (
            <View className="items-center justify-center py-8" style={{ minHeight: 200 }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-xs text-gray-500 mt-2 font-medium">Searching locations...</Text>
            </View>
          ) : query.trim().length >= 2 ? (
            <View className="items-center justify-center py-6 px-4" style={{ minHeight: 200 }}>
              <Icon name="location-off" size={26} color="#98A2B3" style={{ marginBottom: 4 }} />
              <Text className="text-sm font-semibold text-gray-700 mb-0.5">No locations found</Text>
              <Text className="text-xs text-gray-500 text-center">
                Try searching with a different name or spelling
              </Text>
            </View>
          ) : (
            <View className="items-center justify-center py-6 px-4" style={{ minHeight: 200 }}>
              <Icon name="search" size={24} color="#D0D5DD" style={{ marginBottom: 4 }} />
              <Text className="text-xs text-gray-400">Type at least 2 characters to search</Text>
            </View>
          )}
        </View>
      )}

      {/* Search Bar Input */}
      <View
        className="flex-row items-center h-[56px] px-3.5 bg-white rounded-full border border-gray-200 shadow-md elevation-5"
        style={searchBarContainerStyle}
      >
        <Icon name="search" size={20} color={colors.primary} style={{ marginRight: 8 }} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={handleQueryChange}
          placeholder={placeholder}
          placeholderTextColor="#98A2B3"
          onFocus={() => {
            if (predictions.length > 0) setIsExpanded(true);
          }}
          editable={!disabled}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => performSearch(query)}
          className="flex-1 text-[15px] py-0 text-gray-900"
          style={[{ color: colors.onSurface || "#101828" }, inputStyle]}
        />
        {isLoading && (
          <ActivityIndicator size="small" color={colors.primary} className="mr-2" />
        )}
        {query.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Clear search input"
            className="p-1"
          >
            <View className="w-5 h-5 rounded-full bg-gray-300 items-center justify-center">
              <Icon name="close" size={13} color="#475467" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default GoogleMapSearchBox;
