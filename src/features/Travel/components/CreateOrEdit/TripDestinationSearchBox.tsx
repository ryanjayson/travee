import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
  LayoutAnimation,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
// @ts-ignore
import { GOOGLE_MAPS_API_KEY as ENV_GOOGLE_KEY, MAPBOX_ACCESS_TOKEN as ENV_MAPBOX_TOKEN } from "@env";
import { DestinationDto, TripDestinationDto } from "../../types/TravelDto";
import { StaggerItem } from "../../../../components/animations";

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

export interface DestinationSearchResultItem {
  id: string;
  placeId: string;
  name: string;
  secondaryText?: string;
  fullAddress: string;
  types?: string[];
  source: "google_new" | "google" | "mapbox" | "osm";
  coordinates?: {
    latitude: number;
    longitude: number;
  };
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
  if (
    typeStr.includes("airport") ||
    typeStr.includes("flight")
  ) {
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

export const TripDestinationSearchBox: React.FC<TripDestinationSearchBoxProps> = ({
  onSelect,
  placeholder = "Search place, city, or country",
  disabled = false,
}) => {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

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

  // Mapbox and OSM Fallback Search
  const fetchFallbackPredictions = async (
    searchText: string,
    signal: AbortSignal
  ): Promise<DestinationSearchResultItem[]> => {
    // 1. Try Mapbox SearchBox API
    if (MAPBOX_ACCESS_TOKEN) {
      try {
        const mbUrl = `${MAPBOX_SEARCHBOX_URL}?q=${encodeURIComponent(
          searchText
        )}&access_token=${MAPBOX_ACCESS_TOKEN}&types=country,region,place,locality&limit=6&language=en`;

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
                types: props.feature_type ? [props.feature_type] : ["geocode"],
                source: "mapbox" as const,
                coordinates: { latitude: lat, longitude: lng },
              };
            });
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") throw err;
      }
    }

    // 2. Try Nominatim (OSM) Fallback
    try {
      const osmUrl = `${NOMINATIM_SEARCH_URL}?q=${encodeURIComponent(
        searchText
      )}&format=json&addressdetails=1&limit=6&accept-language=en`;

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
    }

    return [];
  };

  // Autocomplete search implementation
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

      // --- 1. Try Google Places API (New) ---
      if (activeApiKey) {
        try {
          const bodyPayload: any = {
            input: clean,
            sessionToken: sessionTokenRef.current,
            includedPrimaryTypes: ["locality", "country", "administrative_area_level_1", "administrative_area_level_2"],
          };

          const newRes = await fetch(GOOGLE_NEW_AUTOCOMPLETE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": activeApiKey,
              "X-Goog-FieldMask": "suggestions.placePrediction",
            },
            body: JSON.stringify(bodyPayload),
            signal: controller.signal,
          });

          if (newRes.ok) {
            const data = await newRes.json();
            if (data.suggestions && data.suggestions.length > 0) {
              const parsed: DestinationSearchResultItem[] = data.suggestions
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
              setPredictions(parsed);
              setIsExpanded(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (err: any) {
          if (err?.name === "AbortError") return;
        }
      }

      // --- 2. Try Legacy Google Places Autocomplete API (type: (regions) or geocode) ---
      if (activeApiKey) {
        try {
          const url = `${GOOGLE_LEGACY_AUTOCOMPLETE_URL}?input=${encodeURIComponent(
            clean
          )}&key=${activeApiKey}&sessiontoken=${sessionTokenRef.current}&types=(regions)&language=en`;

          const response = await fetch(url, { signal: controller.signal });
          if (response.ok) {
            const data = await response.json();
            if (data.status === "OK" && data.predictions) {
              const parsed: DestinationSearchResultItem[] = data.predictions.map((p: any) => ({
                id: p.place_id,
                placeId: p.place_id,
                name: p.structured_formatting?.main_text || p.description.split(",")[0],
                secondaryText: p.structured_formatting?.secondary_text,
                fullAddress: p.description,
                types: p.types,
                source: "google" as const,
              }));
              setPredictions(parsed);
              setIsExpanded(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (err: any) {
          if (err?.name === "AbortError") return;
        }
      }

      // --- 3. Fallback to Mapbox & OSM ---
      try {
        const fallbackResults = await fetchFallbackPredictions(clean, controller.signal);
        setPredictions(fallbackResults);
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

  // Convert resolved details to TripDestinationDto
  const handleSelectPrediction = async (item: DestinationSearchResultItem) => {
    setIsSelectingId(item.id);

    try {
      // 1. If coordinates already available
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
            country: item.secondaryText?.split(",").pop()?.trim() || "",
            coordinates: {
              latitude: item.coordinates.latitude,
              longitude: item.coordinates.longitude,
            },
          } as DestinationDto,
        };

        setQuery("");
        setPredictions([]);
        setIsExpanded(false);
        inputRef.current?.blur();
        Keyboard.dismiss();
        sessionTokenRef.current = generateSessionToken();
        onSelect(destinationDto);
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
              "X-Goog-FieldMask": "id,displayName,formattedAddress,location,addressComponents",
              "sessionToken": sessionTokenRef.current,
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
              inputRef.current?.blur();
              Keyboard.dismiss();
              sessionTokenRef.current = generateSessionToken();
              onSelect(destinationDto);
              return;
            }
          }
        } catch {
          // Fall through
        }
      }

      // 3. Legacy Google Places Details Request
      if (activeApiKey) {
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
            inputRef.current?.blur();
            Keyboard.dismiss();
            sessionTokenRef.current = generateSessionToken();
            onSelect(destinationDto);
            return;
          }
        }
      }

      // 4. Fallback geocode
      const fallbackResults = await fetchFallbackPredictions(
        item.fullAddress || item.name,
        new AbortController().signal
      );
      if (fallbackResults.length > 0 && fallbackResults[0].coordinates) {
        const topFallback = fallbackResults[0];
        const destinationDto: TripDestinationDto = {
          destination: item.name,
          destinationData: {
            id: item.placeId,
            city: item.name,
            country: item.secondaryText?.split(",").pop()?.trim() || "",
            coordinates: topFallback.coordinates!,
          } as DestinationDto,
        };
        setQuery("");
        setPredictions([]);
        setIsExpanded(false);
        inputRef.current?.blur();
        Keyboard.dismiss();
        sessionTokenRef.current = generateSessionToken();
        onSelect(destinationDto);
        return;
      }

      // Basic fallback without coords
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
      inputRef.current?.blur();
      Keyboard.dismiss();
      sessionTokenRef.current = generateSessionToken();
      onSelect(fallbackDestination);
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
    <View className="w-full relative z-30">
      {/* Search Bar Input */}
      <View className="flex-row items-center h-14 px-3.5 bg-white rounded-2xl border border-gray-200 shadow-xs">
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
          className="flex-1 text-[15px] py-0 text-gray-900"
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
        <View className="mt-2 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden max-h-72">
          {predictions.length > 0 ? (
            <FlatList
              data={predictions}
              keyExtractor={(item) => `${item.source}-${item.id}`}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              renderItem={({ item, index }) => {
                const isSelected = isSelectingId === item.id;
                const iconName = getPlaceTypeIcon(item.types);

                return (
                  <TouchableOpacity
                    onPress={() => handleSelectPrediction(item)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Select destination ${item.name}`}
                    className="py-3 px-3"
                  >
                    <StaggerItem index={index}>
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
                          <Icon name="add" size={18} color={colors.primary} />
                        )}
                      </View>
                    </StaggerItem>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-100 ml-[44px]" />}
            />
          ) : isLoading ? (
            <View className="items-center justify-center py-6">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-xs text-gray-500 mt-2 font-medium">Searching destinations...</Text>
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
};

export default TripDestinationSearchBox;
