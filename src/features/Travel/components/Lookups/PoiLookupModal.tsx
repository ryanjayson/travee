import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
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
import { MAPBOX_ACCESS_TOKEN as ENV_TOKEN } from "@env";

const MAPBOX_ACCESS_TOKEN = ENV_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || "";
const MAPBOX_SEARCHBOX_URL = "https://api.mapbox.com/search/searchbox/v1/forward";

export interface MapboxPoi {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  website?: string;
  category?: string;
  maki?: string;
}

interface PoiLookupModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (poi: MapboxPoi) => void;
  initialCategory?: "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp";
  proximity?: {
    latitude: number;
    longitude: number;
  };
}

const POI_CATEGORIES = [
  {
    id: "accommodation",
    label: "Accommodation",
    icon: "hotel",
    value: "hotel,lodging,motel,hostel,resort,bed_and_breakfast",
  },
  {
    id: "cafeRestaurant",
    label: "Cafe & Restaurant",
    icon: "restaurant",
    value: "restaurant,cafe,bar,pub,fast_food,coffee_shop",
  },
  {
    id: "nature",
    label: "Nature",
    icon: "terrain",
    value: "beach,mountain,lake,river,waterfall,forest,jungle,cave,desert,volcano",
  },
  {
    id: "shopppingAndService",
    label: "Shopping & Service",
    icon: "shopping-bag",
    value: "shopping,mall,supermarket,clothing_store,convenience_store,spa,bank,gas_station,pharmacy",
  },
  {
    id: "entertainmentAndRecreation",
    label: "Entertainment & Recreation",
    icon: "local-play",
    value: "theme_park,cinema,park,museum,stadium,zoo,concert",
  },
  {
    id: "hikeOrCamp",
    label: "Hike & Camp",
    icon: "hiking",
    value: "campground,camping,mountain,forest,jungle",
  },
] as const;

type PoiCategoryType = typeof POI_CATEGORIES[number]["id"];

const PoiLookupModal = ({
  visible,
  onClose,
  onSelect,
  initialCategory = "accommodation",
  proximity,
}: PoiLookupModalProps) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PoiCategoryType>(initialCategory);
  const [results, setResults] = useState<MapboxPoi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPois = useCallback(
    async (text: string, categoryId: PoiCategoryType) => {
      if (text.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const encodedQuery = encodeURIComponent(text);
        const categoryConfig = POI_CATEGORIES.find((c) => c.id === categoryId);
        const categoryValues = categoryConfig ? categoryConfig.value : "";

        let url = `${MAPBOX_SEARCHBOX_URL}?q=${encodedQuery}&types=poi&poi_category=${categoryValues}&access_token=${MAPBOX_ACCESS_TOKEN}&limit=10&language=en`;

        if (
          proximity &&
          typeof proximity.longitude === "number" &&
          typeof proximity.latitude === "number" &&
          (proximity.longitude !== 0 || proximity.latitude !== 0)
        ) {
          url += `&proximity=${proximity.longitude},${proximity.latitude}`;
        }

        console.log("POI SEARCH URL:", url);
        const response = await fetch(url);
        const data = await response.json();
        console.log("POI SEARCH RESPONSE:", JSON.stringify(data));

        if (data.features && data.features.length > 0) {
          const pois: MapboxPoi[] = data.features.map((feature: any) => {
            const props = feature.properties || {};
            const geom = feature.geometry || {};

            return {
              id: props.mapbox_id || feature.id || Math.random().toString(),
              name: props.name || feature.text || "Unknown Place",
              address: props.full_address || props.place_formatted || "",
              coordinates: {
                longitude: geom.coordinates ? geom.coordinates[0] : 0,
                latitude: geom.coordinates ? geom.coordinates[1] : 0,
              },
              phone: props.metadata?.phone,
              website: props.metadata?.website,
              category: props.poi_category ? props.poi_category[0] : undefined,
              maki: props.maki,
            };
          });
          setResults(pois);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Mapbox POI search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [proximity]
  );

  const handleTextChange = (text: string) => {
    setQuery(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchPois(text, activeCategory);
    }, 350);
  };

  const handleCategorySelect = (categoryId: PoiCategoryType) => {
    setActiveCategory(categoryId);
    if (query.length >= 2) {
      searchPois(query, categoryId);
    }
  };

  // Re-run search if category changes and there is a query
  useEffect(() => {
    if (query.length >= 2) {
      searchPois(query, activeCategory);
    }
  }, [activeCategory]);

  const getPoiIcon = (maki?: string, categoryId?: PoiCategoryType) => {
    if (maki) {
      if (maki === "lodging" || maki === "hotel") return "hotel";
      if (maki === "restaurant" || maki === "fast-food") return "restaurant";
      if (maki === "cafe") return "local-cafe";
      if (maki === "museum") return "museum";
      if (maki === "monument") return "account-balance";
    }

    // Fallback to active category icon
    const activeConfig = POI_CATEGORIES.find((c) => c.id === categoryId);
    return activeConfig ? activeConfig.icon : "place";
  };

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
          <Text style={styles.itemName}>{item.name}</Text>
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
          <Icon name={activeConfig?.icon || "search"} size={64} color="#C6D4E2" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyStateTitle}>Search {categoryLabel}</Text>
          <Text style={styles.emptyStateSubtitle}>
            Type a name or keyword to search for {categoryLabel.toLowerCase()} in your destination area.
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
            We couldn't find any locations matching "{query}". Try checking your spelling or using a broader term.
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

        {/* Categories Tab Row */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always">
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
      </View>

      {/* Main Content Area */}
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
                    <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}10` }]}>
                      <Icon name="add" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={[styles.itemName, { color: colors.primary }]}>
                        Add "{query.trim()}"
                      </Text>
                      <Text style={styles.itemAddress}>
                        Use this as a custom name
                      </Text>
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
                  <Icon name="search-off" size={64} color="#C6D4E2" style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyStateTitle}>No results found</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    We couldn't find any locations matching "{query}". You can still add it as a custom place above.
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

export default PoiLookupModal;
