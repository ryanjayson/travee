import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";

const MAPBOX_GEOCODING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

export interface MapboxPlace {
  id: string;
  name: string;
  fullName: string;
  country?: string;
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

const MapboxDestinationSelector = ({
  onClose,
  onSelect,
  initialValue = "",
}: MapboxDestinationSelectorProps) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<MapboxPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPlaces = useCallback(async (text: string) => {
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const encodedQuery = encodeURIComponent(text);
      const url = `${MAPBOX_GEOCODING_URL}/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=12&language=en`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const places: MapboxPlace[] = data.features.map((feature: any) => {
          const contextCountry = feature.context?.find(
            (c: any) => c.id?.startsWith("country")
          );

          return {
            id: feature.id,
            name: feature.text,
            fullName: feature.place_name,
            country: contextCountry?.text || (feature.place_type?.includes("country") ? feature.text : undefined),
            type: feature.place_type?.[0] || "place",
            coordinates: {
              longitude: feature.center[0],
              latitude: feature.center[1],
            },
          };
        });
        setResults(places);
      } else {
        setResults([]);
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
      searchPlaces(text);
    }, 350);
  };

  const handleSelect = (place: MapboxPlace) => {
    debugger;
    Keyboard.dismiss();
    onSelect(place);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "country":
        return "flag";
      case "region":
        return "map";
      case "place":
        return "location-city";
      case "locality":
        return "place";
      default:
        return "place";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "country":
        return "Country";
      case "region":
        return "Region";
      case "place":
        return "City";
      case "locality":
        return "Locality";
      default:
        return "Place";
    }
  };

  const renderItem = ({ item }: { item: MapboxPlace }) => (
    <TouchableOpacity
      className="flex-row items-center px-5 py-3.5 border-b border-gray-100"
      onPress={() => handleSelect(item)}
      activeOpacity={0.6}
    >
      <View className="w-10 h-10 rounded-full bg-[#EEF2F9] items-center justify-center mr-3">
        <Icon name={getTypeIcon(item.type)} size={20} color="#183B7A" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">{item.name}</Text>
        <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
          {item.fullName}
        </Text>
      </View>
      <View className="px-2 py-1 rounded-full bg-gray-100">
        <Text className="text-xs text-gray-500">{getTypeLabel(item.type)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-3 pt-3 pb-2 border-b border-gray-200 bg-white">
        <TouchableOpacity
          onPress={onClose}
          className="p-1.5 mr-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={24} color="#183B7A" />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center bg-[#F5F6FA] rounded-xl px-3 h-12">
          <Icon name="search" size={22} color="#999" />
          <TextInput
            className="flex-1 text-base text-gray-900 ml-2"
            placeholder="Search city or country..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={handleTextChange}
            autoFocus
            returnKeyType="search"
            autoCapitalize="words"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setResults([]); }}>
              <Icon name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {isLoading && (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color="#183B7A" />
          <Text className="text-sm text-gray-400 mt-2">Searching...</Text>
        </View>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Empty state */}
      {!isLoading && query.length >= 2 && results.length === 0 && (
        <View className="flex-1 items-center justify-center px-10">
          <Icon name="search-off" size={48} color="#DDD" />
          <Text className="text-base text-gray-400 mt-3 text-center">
            No places found for "{query}"
          </Text>
          <Text className="text-sm text-gray-300 mt-1 text-center">
            Try searching for a city or country name
          </Text>
        </View>
      )}

      {/* Initial hint */}
      {!isLoading && query.length < 2 && results.length === 0 && (
        <View className="flex-1 items-center justify-center px-10">
          <Icon name="travel-explore" size={56} color="#DDD" />
          <Text className="text-base text-gray-400 mt-4 text-center">
            Search for a destination
          </Text>
          <Text className="text-sm text-gray-300 mt-1 text-center">
            Type at least 2 characters to search
          </Text>
        </View>
      )}
    </View>
  );
};

export default MapboxDestinationSelector;
