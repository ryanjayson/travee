import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { MapboxPoi } from "./PoiLookupModal";
import { getValidMapboxCountryCode } from "../../../../utils/countryUtils";

// ─── Nominatim API ────────────────────────────────────────────────────────────
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Travee-App/1.0 (contact@travee.app)";

// ─── Category definitions ─────────────────────────────────────────────────────
const POI_CATEGORIES = [
  {
    id: "accommodation",
    label: "Accommodation",
    icon: "hotel",
    amenity: "hotel,hostel,motel,guest_house",
  },
  {
    id: "cafeRestaurant",
    label: "Cafe or Restaurant",
    icon: "restaurant",
    amenity: "restaurant,cafe,bar,pub,fast_food,food_court",
  },
  {
    id: "nature",
    label: "Nature",
    icon: "terrain",
    amenity: "",
    freeText: true,
  },
  {
    id: "shopppingAndService",
    label: "Shopping",
    icon: "shopping-bag",
    amenity: "marketplace,pharmacy,bank",
    shop: "mall,supermarket,clothes,convenience",
  },
  {
    id: "entertainmentAndRecreation",
    label: "Entertainment",
    icon: "local-play",
    amenity: "theatre,cinema,zoo,theme_park,museum,nightclub",
  },
  {
    id: "hikeOrCamp",
    label: "Hike or Camp",
    icon: "hiking",
    amenity: "camp_site",
    leisure: "nature_reserve,park",
  },
] as const;

type PoiCategoryType = (typeof POI_CATEGORIES)[number]["id"];

// ─── Props ────────────────────────────────────────────────────────────────────
interface OsmPoiLookupModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (poi: MapboxPoi) => void;
  initialCategory?: PoiCategoryType;
  proximity?: {
    latitude: number;
    longitude: number;
  };
  country?: string;
}

// ─── Nominatim result shape ───────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  osm_id: number;
  osm_type: string;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
    country_code?: string;
  };
  extratags?: {
    phone?: string;
    website?: string;
    cuisine?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildNominatimUrl(
  query: string,
  proximity?: { latitude: number; longitude: number },
  country?: string
): string {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    extratags: "1",
    limit: "10",
    "accept-language": "en",
  });

  // Use the same country-name → ISO-2 mapping used by the Mapbox modal
  const countryCode = getValidMapboxCountryCode(country);
  if (countryCode) {
    params.set("countrycodes", countryCode);
  }

  if (proximity && (proximity.latitude !== 0 || proximity.longitude !== 0)) {
    const delta = 0.5;
    params.set(
      "viewbox",
      `${proximity.longitude - delta},${proximity.latitude + delta},${proximity.longitude + delta},${proximity.latitude - delta}`
    );
    params.set("bounded", "0");
  }

  return `${NOMINATIM_URL}?${params.toString()}`;
}

function toMapboxPoi(result: NominatimResult): MapboxPoi {
  const addr = result.address;
  const parts: string[] = [];
  if (addr?.road) parts.push(addr.road);
  if (addr?.suburb) parts.push(addr.suburb);
  if (addr?.city) parts.push(addr.city);
  if (addr?.state) parts.push(addr.state);
  if (addr?.country) parts.push(addr.country);
  const address = parts.join(", ") || result.display_name;

  return {
    id: `osm-${result.osm_type}-${result.osm_id}`,
    name: result.name || result.display_name.split(",")[0].trim(),
    address,
    coordinates: {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    },
    phone: result.extratags?.phone,
    website: result.extratags?.website,
    category: result.type,
    maki: result.class,
    poiCategories: [result.type],
  };
}

function getPoiIcon(osmClass?: string, categoryId?: PoiCategoryType): string {
  if (osmClass) {
    if (osmClass === "hotel" || osmClass === "hostel" || osmClass === "motel") return "hotel";
    if (osmClass === "restaurant" || osmClass === "fast_food") return "restaurant";
    if (osmClass === "cafe") return "local-cafe";
    if (osmClass === "museum") return "museum";
    if (osmClass === "bar" || osmClass === "pub") return "local-bar";
    if (osmClass === "cinema") return "movie";
    if (osmClass === "theatre") return "theater-comedy";
  }
  const cat = POI_CATEGORIES.find((c) => c.id === categoryId);
  return cat ? (cat.icon as string) : "place";
}

// ─── Component ────────────────────────────────────────────────────────────────
const OsmPoiLookupModal = ({
  visible,
  onClose,
  onSelect,
  initialCategory = "accommodation",
  proximity,
  country,
}: OsmPoiLookupModalProps) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PoiCategoryType>(initialCategory);
  const [results, setResults] = useState<MapboxPoi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setQuery("");
      setResults([]);
      setActiveCategory(initialCategory);
    }
  }, [visible, initialCategory]);

  const searchPois = useCallback(
    async (text: string, categoryId: PoiCategoryType) => {
      if (text.trim().length < 2) {
        setResults([]);
        return;
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      try {
        const url = buildNominatimUrl(text, proximity, country);
        console.log("OSM Nominatim URL:", url);

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Nominatim error: ${response.status}`);
        }

        const data: NominatimResult[] = await response.json();
        console.log("OSM Nominatim results:", data.length);

        const pois = data.filter((r) => r.name).map(toMapboxPoi);
        setResults(pois);
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        console.error("OSM Nominatim search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [proximity, country]
  );

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      searchPois(text, activeCategory);
    }, 400);
  };

  const handleCategorySelect = (categoryId: PoiCategoryType) => {
    setActiveCategory(categoryId);
    if (query.length >= 2) searchPois(query, categoryId);
  };

  useEffect(() => {
    if (query.length >= 2) searchPois(query, activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const renderItem = ({ item }: { item: MapboxPoi }) => {
    const iconName = getPoiIcon(item.maki, activeCategory);
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          onSelect(item);
          onClose();
        }}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={`Select ${item.name}, ${item.address || ""}`}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}10` }]}>
          <Icon name={iconName as any} size={22} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.address ? (
            <Text style={styles.itemAddress} numberOfLines={2}>
              {item.address}
            </Text>
          ) : null}
        </View>
        <Icon name="chevron-right" size={20} color="#CCC" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (query.trim().length === 0) {
      const activeConfig = POI_CATEGORIES.find((c) => c.id === activeCategory);
      const categoryLabel = activeConfig ? activeConfig.label : "places";
      return (
        <ScrollView
          contentContainerStyle={styles.emptyStateContainer}
          keyboardShouldPersistTaps="always"
        >
          <Icon
            name={(activeConfig?.icon as any) || "search"}
            size={64}
            color="#C6D4E2"
            style={{ marginBottom: 16 }}
          />
          <Text style={styles.emptyStateTitle}>Search {categoryLabel}</Text>
          <Text style={styles.emptyStateSubtitle}>
            Type a name or keyword to search for {categoryLabel.toLowerCase()} in your destination
            area.
          </Text>
        </ScrollView>
      );
    }

    if (!isLoading && results.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyStateContainer}
          keyboardShouldPersistTaps="always"
        >
          <Icon name="search-off" size={64} color="#C6D4E2" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyStateTitle}>No results found</Text>
          <Text style={styles.emptyStateSubtitle}>
            We couldn't find any locations matching "{query}". Try checking your spelling or using a
            broader term.
          </Text>
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardContainer}
    >
      {/* ── Header ── */}
      <View style={styles.headerBorderContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.searchInputContainer}>
            <Icon name="search" size={22} color="#999" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${POI_CATEGORIES.find((c) => c.id === activeCategory)?.label}...`}
              placeholderTextColor="#999"
              value={query}
              onChangeText={handleTextChange}
              returnKeyType="search"
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus={true}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery("");
                  setResults([]);
                }}
                style={{ padding: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search text"
              >
                <Icon name="close" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Category chips ── */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {POI_CATEGORIES.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => handleCategorySelect(category.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${category.label}`}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: isActive ? colors.primary : "#EAECF0",
                      backgroundColor: isActive ? `${colors.primary}15` : "#FFFFFF",
                    },
                  ]}
                >
                  <Icon
                    name={category.icon as any}
                    size={16}
                    color={isActive ? colors.primary : "#666"}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isActive ? colors.primary : "#475467",
                        fontWeight: isActive ? "600" : "500",
                      },
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── OSM attribution ── */}
        <View style={styles.attributionRow}>
          <Icon name="public" size={11} color="#98A2B3" style={{ marginRight: 4 }} />
          <Text style={styles.attributionText}>Powered by OpenStreetMap contributors</Text>
        </View>
      </View>

      {/* ── Main content ── */}
      <View style={{ flex: 1 }}>
        {isLoading && results.length === 0 ? (
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : query.trim().length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View>
                {query.trim().length > 0 && (
                  <TouchableOpacity
                    style={styles.itemContainer}
                    onPress={() => {
                      onSelect({
                        id: `custom-${Date.now()}`,
                        name: query.trim(),
                        address: "",
                        coordinates: { latitude: 0, longitude: 0 },
                      });
                      onClose();
                    }}
                    activeOpacity={0.6}
                    accessibilityRole="button"
                    accessibilityLabel={`Add custom place "${query.trim()}"`}
                  >
                    <View
                      style={[styles.iconContainer, { backgroundColor: `${colors.primary}10` }]}
                    >
                      <Icon name="add" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={[styles.itemName, { color: colors.primary }]}>
                        Add "{query.trim()}"
                      </Text>
                      <Text style={styles.itemAddress}>Use this as a custom name</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#CCC" />
                  </TouchableOpacity>
                )}
                {isLoading && (
                  <View style={{ paddingVertical: 12, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyStateContainer}>
                  <Icon
                    name="search-off"
                    size={64}
                    color="#C6D4E2"
                    style={{ marginBottom: 16 }}
                  />
                  <Text style={styles.emptyStateTitle}>No results found</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    We couldn't find any locations matching "{query}". You can still add it as a
                    custom place above.
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles (mirrors PoiLookupModal exactly) ──────────────────────────────────
const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? 40 : 50,
  },
  headerBorderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
    backgroundColor: "#FFFFFF",
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#101828",
    paddingVertical: 0,
  },
  filterRow: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  filterChipText: {
    marginLeft: 6,
    fontSize: 12,
  },
  attributionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  attributionText: {
    fontSize: 10,
    color: "#98A2B3",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
    backgroundColor: "#FFFFFF",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#101828",
  },
  itemAddress: {
    fontSize: 12,
    color: "#667085",
    marginTop: 2,
  },
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#101828",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#667085",
    textAlign: "center",
    lineHeight: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default OsmPoiLookupModal;
