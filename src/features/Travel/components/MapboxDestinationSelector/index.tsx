import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";

const MAPBOX_SEARCHBOX_URL = "https://api.mapbox.com/search/searchbox/v1/forward";

export interface MapboxPlace {
  id: string;
  name: string;
  fullName: string;
  country?: string;
  countryCode?: string;
  type: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface MapboxDestinationSelectorProps {
  onClose: () => void;
  onSelect: (place: MapboxPlace) => void;
  initialValue?: string;
}

const FILTER_OPTIONS = [
  { id: "country", label: "Country", icon: "flag" },
  { id: "region", label: "Region", icon: "map" },
  { id: "place", label: "City", icon: "location-city" },
  { id: "poi", label: "Places", icon: "place" },
] as const;

type FilterType = typeof FILTER_OPTIONS[number]["id"];

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "united states": "US",
  "united kingdom": "GB",
  "japan": "JP",
  "france": "FR",
  "germany": "DE",
  "italy": "IT",
  "canada": "CA",
  "australia": "AU",
  "china": "CN",
  "south korea": "KR",
  "philippines": "PH",
  "spain": "ES",
  "mexico": "MX",
  "brazil": "BR",
  "india": "IN",
  "singapore": "SG",
  "thailand": "TH",
  "malaysia": "MY",
  "vietnam": "VN",
  "indonesia": "ID",
  "taiwan": "TW",
  "hong kong": "HK",
  "new zealand": "NZ",
  "switzerland": "CH",
  "netherlands": "NL",
  "belgium": "BE",
  "sweden": "SE",
  "norway": "NO",
  "denmark": "DK",
  "finland": "FI",
  "russia": "RU",
  "turkey": "TR",
  "united arab emirates": "AE",
  "saudi arabia": "SA",
  "south africa": "ZA",
  "egypt": "EG",
  "morocco": "MA",
  "greece": "GR",
  "portugal": "PT",
  "austria": "AT",
  "ireland": "IE",
};

const getFlagEmoji = (countryCode?: string) => {
  if (!countryCode) return "📍";
  const cleanCode = countryCode.split("-")[0].trim().toUpperCase();
  if (cleanCode.length !== 2) return "📍";

  const codePoints = cleanCode
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return "📍";
  }
};

const getGroupTitle = (type: string) => {
  const t = type.toLowerCase();
  if (t === "country") return "Countries";
  if (t === "region" || t === "state" || t === "province") return "States & Regions";
  if (t === "place" || t === "locality" || t === "city" || t === "district") return "Cities";
  return "Other Locations";
};

const MapboxDestinationSelector = ({
  onClose,
  onSelect,
  initialValue = "",
}: MapboxDestinationSelectorProps) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState(initialValue);
  const [activeFilter, setActiveFilter] = useState<FilterType | null>("country");
  const [results, setResults] = useState<MapboxPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPlaces = useCallback(async (text: string, filter: FilterType | null = null) => {
    if (text.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const encodedQuery = encodeURIComponent(text);
      let url = `${MAPBOX_SEARCHBOX_URL}?q=${encodedQuery}&access_token=${MAPBOX_ACCESS_TOKEN}&limit=10&language=en&proximity=114.17,22.31`;
      if (filter) {
        url += `&types=${filter}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const places: MapboxPlace[] = data.features.map((feature: any) => {
          const props = feature.properties || {};
          const geom = feature.geometry || {};

          let countryName;
          if (Array.isArray(feature.context)) {
            countryName = feature.context.find((c: any) => c.id?.startsWith("country"))?.text;
          } else if (props.context && props.context.country) {
            countryName = props.context.country.name;
          }

          let countryCode;
          if (props.context && props.context.country) {
            countryCode = props.context.country.country_code;
          } else if (Array.isArray(feature.context)) {
            const countryItem = feature.context.find((c: any) => c.id?.startsWith("country"));
            countryCode = countryItem?.properties?.country_code || countryItem?.short_code;
          }

          const isCountry = (feature.place_type && feature.place_type.includes("country")) || props.feature_type === "country";

          // Fallback dictionary for flags
          if (!countryCode && countryName) {
            countryCode = COUNTRY_NAME_TO_CODE[countryName.toLowerCase()];
          }
          if (!countryCode && props.name && isCountry) {
            countryCode = COUNTRY_NAME_TO_CODE[props.name.toLowerCase()];
          }

          return {
            id: props.mapbox_id || feature.id || Math.random().toString(),
            name: props.name || feature.text || "Unknown Place",
            fullName: props.full_address || props.place_formatted || feature.place_name || props.name || feature.text || "",
            country: countryName || (isCountry ? (props.name || feature.text) : undefined),
            countryCode: countryCode,
            type: props.feature_type || (feature.place_type ? feature.place_type[0] : "place"),
            coordinates: {
              longitude: geom.coordinates ? geom.coordinates[0] : (feature.center ? feature.center[0] : 0),
              latitude: geom.coordinates ? geom.coordinates[1] : (feature.center ? feature.center[1] : 0),
            },
          };
        });
        setResults(places);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error("Mapbox geocoding error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTextChange = (text: string) => {
    setQuery(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchPlaces(text, activeFilter);
    }, 350);
  };

  const handleFilterSelect = (filterId: FilterType) => {
    const newFilter = activeFilter === filterId ? null : filterId;
    setActiveFilter(newFilter);
    if (query.length >= 2) {
      searchPlaces(query, newFilter);
    }
  };

  const getGroupedSections = () => {
    const sectionsMap: Record<string, MapboxPlace[]> = {
      "Countries": [],
      "States & Regions": [],
      "Cities": [],
      "Other Locations": [],
    };

    results.forEach((place) => {
      const title = getGroupTitle(place.type);
      sectionsMap[title].push(place);
    });

    const orderedTitles = ["Countries", "States & Regions", "Cities", "Other Locations"];
    return orderedTitles
      .map((title) => ({
        title,
        data: sectionsMap[title],
      }))
      .filter((section) => section.data.length > 0);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "country": return "Country";
      case "region": return "Region";
      case "place": return "City";
      case "locality": return "Locality";
      default: return "Place";
    }
  };

  const renderItem = ({ item }: { item: MapboxPlace }) => {
    const flag = getFlagEmoji(item.countryCode);
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          onSelect(item);
          onClose();
        }}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={`Select ${item.name}, ${item.fullName || ""}`}
      >
        <View style={styles.flagContainer}>
          <Text style={styles.flagText}>{flag}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.fullName && item.fullName !== item.name ? (
            <Text style={styles.itemAddress} numberOfLines={2}>
              {item.fullName}
            </Text>
          ) : null}
        </View>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {item.type.replace(/_/g, " ")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderEmptyState = () => {
    if (query.trim().length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyStateContainer}
          keyboardShouldPersistTaps="always"
        >
          <Icon name="explore" size={64} color="#C6D4E2" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyStateTitle}>Find your next destination</Text>
          <Text style={styles.emptyStateSubtitle}>
            Type a country, city, or region to start planning your itinerary.
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
          <Text style={styles.emptyStateTitle}>No locations found</Text>
          <Text style={styles.emptyStateSubtitle}>
            We couldn't find any results for "{query}". Try a different spelling or search term.
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
      {/* Header */}
      <View style={styles.headerBorderContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-back" size={24} color={"#263F69"} />
          </TouchableOpacity>

          <View style={styles.searchInputContainer}>
            <Icon name="search" size={22} color="#999" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                activeFilter ? `Search a ${getTypeLabel(activeFilter)}` : "Search your next destination"
              }
              placeholderTextColor="#999"
              value={query}
              onChangeText={handleTextChange}
              onFocus={() => {
                if (results.length > 0) setShowResults(true);
              }}
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
                  setShowResults(false);
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

        {/* Filter Toggle */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always">
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => handleFilterSelect(filter.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${filter.label}`}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: isActive ? colors.primary : "#EAECF0",
                      backgroundColor: isActive ? `${colors.primary}15` : "#FFFFFF",
                    },
                  ]}
                >
                  <Icon
                    name={filter.icon as any}
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
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1 }}>
        {isLoading && results.length === 0 ? (
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : query.trim().length === 0 || results.length === 0 ? (
          renderEmptyState()
        ) : (
          <SectionList
            sections={getGroupedSections()}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              isLoading ? (
                <View style={{ paddingVertical: 12, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

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
    paddingBottom: 12,
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
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
    backgroundColor: "#FFFFFF",
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  flagText: {
    fontSize: 20,
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
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#EAECF0",
  },
  badgeText: {
    fontSize: 10,
    color: "#667085",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  sectionHeaderContainer: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EAECF0",
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475467",
    letterSpacing: 1,
    textTransform: "uppercase",
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

export default MapboxDestinationSelector;
