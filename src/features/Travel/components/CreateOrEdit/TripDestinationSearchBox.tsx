import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
// @ts-ignore
import { GOOGLE_MAPS_API_KEY as ENV_GOOGLE_KEY } from "@env";
import { DestinationDto, TripDestinationDto } from "../../types/TravelDto";

// Google Maps API Key
const DEFAULT_GOOGLE_KEY =
  ENV_GOOGLE_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  "AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao";

// Google Maps Endpoints (New & Legacy)
const GOOGLE_NEW_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const GOOGLE_NEW_SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_NEW_DETAILS_BASE_URL = "https://places.googleapis.com/v1/places";
const GOOGLE_LEGACY_AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const GOOGLE_LEGACY_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

export interface DestinationSearchResultItem {
  id: string;
  placeId: string;
  name: string;
  secondaryText?: string;
  fullAddress: string;
  types?: string[];
  source: "google_new" | "google_text" | "google_legacy";
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  country?: string;
}

export interface TripDestinationSearchBoxRef {
  focus: () => void;
  clear: () => void;
}

export interface TripDestinationSearchBoxProps {
  onSelect: (destination: TripDestinationDto) => void;
  placeholder?: string;
  disabled?: boolean;
}

const generateSessionToken = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getPlaceTypeIcon = (types?: string[]): keyof typeof Icon.glyphMap => {
  if (!types || types.length === 0) return "place";
  const typeStr = types.join(" ").toLowerCase();

  if (
    typeStr.includes("country") ||
    typeStr.includes("administrative_area_level_1") ||
    typeStr.includes("region")
  ) {
    return "flag";
  }
  if (
    typeStr.includes("locality") ||
    typeStr.includes("city") ||
    typeStr.includes("town") ||
    typeStr.includes("administrative_area")
  ) {
    return "location-city";
  }
  if (typeStr.includes("airport") || typeStr.includes("flight")) {
    return "flight";
  }
  if (
    typeStr.includes("island") ||
    typeStr.includes("beach") ||
    typeStr.includes("natural_feature") ||
    typeStr.includes("park")
  ) {
    return "terrain";
  }

  return "place";
};

export const TripDestinationSearchBox = React.forwardRef<
  TripDestinationSearchBoxRef,
  TripDestinationSearchBoxProps
>(({
  onSelect,
  placeholder = "Search place, city, or country",
  disabled = false,
}, ref) => {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  React.useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    clear: () => {
      handleClear();
    },
  }));

  const [query, setQuery] = useState<string>("");
  const [predictions, setPredictions] = useState<DestinationSearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSelectingId, setIsSelectingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const sessionTokenRef = useRef<string>(generateSessionToken());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeApiKey = DEFAULT_GOOGLE_KEY;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // 1. Google Places API (New) Autocomplete
  const searchGooglePlacesNew = async (
    searchText: string,
    signal: AbortSignal
  ): Promise<DestinationSearchResultItem[]> => {
    if (!activeApiKey) return [];
    try {
      const bodyPayload = {
        input: searchText,
        sessionToken: sessionTokenRef.current,
      };

      const res = await fetch(GOOGLE_NEW_AUTOCOMPLETE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": activeApiKey,
          "X-Goog-FieldMask": "suggestions.placePrediction",
        },
        body: JSON.stringify(bodyPayload),
        signal,
      });

      if (res.ok) {
        const data = await res.json();
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
    return [];
  };

  // 2. Google Places API (New) Text Search - provides immediate coordinates and rich details
  const searchGooglePlacesText = async (
    searchText: string,
    signal: AbortSignal
  ): Promise<DestinationSearchResultItem[]> => {
    if (!activeApiKey) return [];
    try {
      const bodyPayload = {
        textQuery: searchText,
        pageSize: 10,
      };

      const res = await fetch(GOOGLE_NEW_SEARCH_TEXT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": activeApiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents,places.types",
        },
        body: JSON.stringify(bodyPayload),
        signal,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.places && data.places.length > 0) {
          return data.places.map((p: any) => {
            let country = "";
            if (Array.isArray(p.addressComponents)) {
              p.addressComponents.forEach((c: any) => {
                if (c.types?.includes("country")) {
                  country = c.longText || c.shortText || "";
                }
              });
            }

            const name =
              p.displayName?.text || p.formattedAddress?.split(",")[0] || "Location";
            const secondary = p.formattedAddress?.split(",").slice(1).join(",").trim() || "";

            return {
              id: p.id || Math.random().toString(),
              placeId: p.id,
              name,
              secondaryText: secondary,
              fullAddress: p.formattedAddress || name,
              types: p.types || [],
              source: "google_text" as const,
              coordinates: p.location
                ? {
                  latitude: p.location.latitude,
                  longitude: p.location.longitude,
                }
                : undefined,
              country,
            };
          });
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
    }
    return [];
  };

  // 3. Legacy Google Places Autocomplete fallback
  const searchGooglePlacesLegacy = async (
    searchText: string,
    signal: AbortSignal
  ): Promise<DestinationSearchResultItem[]> => {
    if (!activeApiKey) return [];
    try {
      const url = `${GOOGLE_LEGACY_AUTOCOMPLETE_URL}?input=${encodeURIComponent(
        searchText
      )}&key=${activeApiKey}&sessiontoken=${sessionTokenRef.current}&language=en`;

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
            source: "google_legacy" as const,
          }));
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
    }
    return [];
  };

  // Autocomplete search using Google Maps API (Max 10 results)
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

      try {
        // Step 1: Run Google Places Autocomplete (New) and Google Places Text Search (New) in parallel
        // Autocomplete provides fast prefix predictions (up to 5)
        // Text Search with pageSize: 10 provides full matches and direct coordinates (up to 10)
        const [autocompleteResults, textResults] = await Promise.all([
          searchGooglePlacesNew(clean, controller.signal).catch(() => [] as DestinationSearchResultItem[]),
          searchGooglePlacesText(clean, controller.signal).catch(() => [] as DestinationSearchResultItem[]),
        ]);

        const combined: DestinationSearchResultItem[] = [];
        const seenIds = new Set<string>();
        const seenNames = new Set<string>();

        // Add Autocomplete results first, augmenting with coordinates from Text Search if matched
        for (const item of autocompleteResults) {
          const key = item.placeId || item.id;
          const nameKey = item.name.toLowerCase().trim();
          if (!seenIds.has(key) && !seenNames.has(nameKey)) {
            seenIds.add(key);
            seenNames.add(nameKey);
            const matchingText = textResults.find(
              (t) => (t.placeId && t.placeId === item.placeId) || t.name.toLowerCase().trim() === nameKey
            );
            combined.push(matchingText ? { ...item, ...matchingText } : item);
          }
        }

        // Add remaining Text Search results up to 10
        for (const item of textResults) {
          const key = item.placeId || item.id;
          const nameKey = item.name.toLowerCase().trim();
          if (!seenIds.has(key) && !seenNames.has(nameKey)) {
            seenIds.add(key);
            seenNames.add(nameKey);
            combined.push(item);
          }
          if (combined.length >= 10) break;
        }

        if (combined.length > 0) {
          setPredictions(combined.slice(0, 10));
          setIsExpanded(true);
          setIsLoading(false);
          return;
        }

        // Step 2: Try Legacy Google Places Autocomplete fallback (up to 10)
        const legacyResults = await searchGooglePlacesLegacy(clean, controller.signal);
        if (legacyResults.length > 0) {
          setPredictions(legacyResults.slice(0, 10));
          setIsExpanded(true);
          setIsLoading(false);
          return;
        }

        setPredictions([]);
        setIsExpanded(true);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeApiKey]
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
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

  // Convert selected Google Maps result to TripDestinationDto
  const handleSelectPrediction = async (item: DestinationSearchResultItem) => {
    setIsSelectingId(item.id);

    try {
      // 1. If coordinates already resolved from Google Places Text Search
      if (
        item.coordinates &&
        typeof item.coordinates.latitude === "number" &&
        typeof item.coordinates.longitude === "number"
      ) {
        const destinationDto: TripDestinationDto = {
          destination: item.name,
          destinationData: {
            id: item.placeId,
            city: item.name,
            country: item.country || item.secondaryText?.split(",").pop()?.trim() || "",
            coordinates: {
              latitude: item.coordinates.latitude,
              longitude: item.coordinates.longitude,
            },
          } as DestinationDto,
        };

        setQuery("");
        setPredictions([]);
        setIsExpanded(false);
        sessionTokenRef.current = generateSessionToken();
        onSelect(destinationDto);
        inputRef.current?.focus();
        return;
      }

      // 2. Fetch details from Google Places API (New) Details
      if (activeApiKey) {
        try {
          const newDetailsUrl = `${GOOGLE_NEW_DETAILS_BASE_URL}/${encodeURIComponent(
            item.placeId
          )}`;
          const newResponse = await fetch(newDetailsUrl, {
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": activeApiKey,
              "X-Goog-FieldMask": "id,displayName,formattedAddress,location,addressComponents",
              sessionToken: sessionTokenRef.current,
            },
          });

          if (newResponse.ok) {
            const data = await newResponse.json();
            if (data.location && typeof data.location.latitude === "number") {
              let country = "";
              let city = data.displayName?.text || item.name;

              if (Array.isArray(data.addressComponents)) {
                data.addressComponents.forEach((c: any) => {
                  if (c.types?.includes("country")) {
                    country = c.longText || c.shortText || "";
                  }
                  if (c.types?.includes("locality")) {
                    city = c.longText || c.shortText || city;
                  }
                });
              }

              const destinationDto: TripDestinationDto = {
                destination: data.displayName?.text || item.name,
                destinationData: {
                  id: data.id || item.placeId,
                  city: city,
                  country: country || item.secondaryText?.split(",").pop()?.trim() || "",
                  coordinates: {
                    latitude: data.location.latitude,
                    longitude: data.location.longitude,
                  },
                } as DestinationDto,
              };

              setQuery("");
              setPredictions([]);
              setIsExpanded(false);
              sessionTokenRef.current = generateSessionToken();
              onSelect(destinationDto);
              inputRef.current?.focus();
              return;
            }
          }
        } catch {
          // Fall through
        }
      }

      // 3. Fetch details from Legacy Google Places Details
      if (activeApiKey) {
        try {
          const detailsUrl = `${GOOGLE_LEGACY_DETAILS_URL}?place_id=${encodeURIComponent(
            item.placeId
          )}&fields=place_id,name,formatted_address,geometry,address_components&key=${activeApiKey}&sessiontoken=${sessionTokenRef.current}`;

          const response = await fetch(detailsUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.status === "OK" && data.result?.geometry?.location) {
              const res = data.result;
              let country = "";
              let city = res.name || item.name;

              if (Array.isArray(res.address_components)) {
                res.address_components.forEach((c: any) => {
                  if (c.types?.includes("country")) {
                    country = c.long_name || c.short_name || "";
                  }
                  if (c.types?.includes("locality")) {
                    city = c.long_name || c.short_name || city;
                  }
                });
              }

              const destinationDto: TripDestinationDto = {
                destination: res.name || item.name,
                destinationData: {
                  id: res.place_id || item.placeId,
                  city: city,
                  country: country || item.secondaryText?.split(",").pop()?.trim() || "",
                  coordinates: {
                    latitude: res.geometry.location.lat,
                    longitude: res.geometry.location.lng,
                  },
                } as DestinationDto,
              };

              setQuery("");
              setPredictions([]);
              setIsExpanded(false);
              sessionTokenRef.current = generateSessionToken();
              onSelect(destinationDto);
              inputRef.current?.focus();
              return;
            }
          }
        } catch {
          // Fall through
        }
      }

      // 4. Default fallback with placeId
      const fallbackDestination: TripDestinationDto = {
        destination: item.name,
        destinationData: {
          id: item.placeId,
          city: item.name,
          country: item.secondaryText?.split(",").pop()?.trim() || "",
          coordinates: { latitude: 0, longitude: 0 },
        } as DestinationDto,
      };
      setQuery("");
      setPredictions([]);
      setIsExpanded(false);
      sessionTokenRef.current = generateSessionToken();
      onSelect(fallbackDestination);
      inputRef.current?.focus();
    } catch (err) {
      console.warn("[TripDestinationSearchBox] Selection resolution error:", err);
    } finally {
      setIsSelectingId(null);
    }
  };

  const handleClear = () => {
    setQuery("");
    setPredictions([]);
    setIsExpanded(false);
    setIsLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    sessionTokenRef.current = generateSessionToken();
    inputRef.current?.focus();
  };

  return (
    <View className="w-full relative z-30" style={{ zIndex: 100 }}>
      {/* Search Bar Input */}
      <View className="flex-row items-center h-19 px-3.5 bg-white rounded-2xl border-2 border-primary/20 ">
        <Icon name="search" size={20} color={colors.primary} style={{ marginRight: 8 }} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={handleQueryChange}
          placeholder={placeholder}
          placeholderTextColor="#98A2B3"
          onFocus={() => {
            if (predictions.length > 0 || query.trim().length >= 2) {
              setIsExpanded(true);
            }
          }}
          editable={!disabled}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => performSearch(query)}
          className="flex-1 text-lg py-0 text-gray-900 font-semibold"
          style={{ color: "#101828" }}
        />
        {isLoading && (
          <ActivityIndicator size="small" color={colors.primary} className="mr-2" />
        )}
        {query.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            activeOpacity={0.7}
            className="p-1"
            accessibilityRole="button"
            accessibilityLabel="Clear search input"
          >
            <View className="w-5 h-5 rounded-full bg-gray-200 items-center justify-center">
              <Icon name="close" size={13} color="#475467" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Results List Rendered Below the SearchBox */}
      {isExpanded && query.trim().length >= 2 && (
        <View
          className="absolute top-20 left-0 right-0 bg-white rounded-2xl "
          style={{ elevation: 12, zIndex: 999 }}
        >
          {predictions.length > 0 ? (
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={true}
            >
              {predictions.map((item, index) => {
                const isSelected = isSelectingId === item.id;
                const iconName = getPlaceTypeIcon(item.types);

                return (
                  <React.Fragment key={`${item.source}-${item.id}`}>
                    {index > 0 && <View className="h-[1px] bg-gray-100 ml-[44px]" />}
                    <TouchableOpacity
                      onPress={() => handleSelectPrediction(item)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Select destination ${item.name}`}
                      className="py-3 px-3"
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-8 h-8 rounded-xl items-center justify-center mr-2.5"
                          style={{ backgroundColor: `${colors.primary}10` }}
                        >
                          <Icon name={iconName} size={16} color={colors.primary} />
                        </View>

                        <View className="flex-1 mr-2">
                          <Text
                            className="text-[18px] font-semibold text-gray-900 leading-4"
                          >
                            {item.name}
                          </Text>
                          <Text className="text-sm text-gray-500 leading-5 mt-1 " >
                            {item.secondaryText || item.fullAddress}
                          </Text>
                        </View>

                        {isSelected ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Icon name="add" size={20} color={colors.primary} style={{ marginRight: 6 }} />
                        )}
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </ScrollView>
          ) : isLoading ? (
            <View className="items-center justify-center py-6">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-base text-gray-500 mt-2 font-medium">Searching Google Maps...</Text>
            </View>
          ) : (
            <View className="items-center justify-center py-6 px-4">
              <Icon name="location-off" size={24} color="#98A2B3" style={{ marginBottom: 4 }} />
              <Text className="text-sm font-semibold text-gray-700 mb-0.5">No destinations found</Text>
              <Text className="text-xs text-gray-500 text-center">
                Try searching with a city or country name
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

export default TripDestinationSearchBox;
