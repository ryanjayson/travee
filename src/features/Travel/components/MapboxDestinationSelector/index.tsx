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
} from "react-native";
import WebView from "react-native-webview";
import { MaterialIcons as Icon } from "@expo/vector-icons";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";

const MAPBOX_GEOCODING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";
const MAPBOX_SEARCHBOX_URL = "https://api.mapbox.com/search/searchbox/v1/forward";

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

const FILTER_OPTIONS = [
  { id: 'country', label: 'Country', icon: 'flag' },
  { id: 'region', label: 'Region', icon: 'map' },
  { id: 'place', label: 'City', icon: 'location-city' },
  { id: 'poi', label: 'POI', icon: 'place' },
] as const;
type FilterType = typeof FILTER_OPTIONS[number]['id'];

const MapboxDestinationSelector = ({
  onClose,
  onSelect,
  initialValue = "",
}: MapboxDestinationSelectorProps) => {
  const [query, setQuery] = useState(initialValue);
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [results, setResults] = useState<MapboxPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedPin, setSelectedPin] = useState<{
    latitude: number;
    longitude: number;
    name: string;
    fullName: string;
  } | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webViewRef = useRef<WebView>(null);

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
      console.log(url);

      const response = await fetch(url);
      const data = await response.json();
      console.log(data.features);

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

          const isCountry = (feature.place_type && feature.place_type.includes("country")) || props.feature_type === "country";

          return {
            id: props.mapbox_id || feature.id || Math.random().toString(),   
            name: props.name || feature.text || "Unknown Place",
            fullName: props.full_address || props.place_formatted || feature.place_name || props.name || feature.text || "",
            country: countryName || (isCountry ? (props.name || feature.text) : undefined),
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

  const handleSearchSelect = (place: MapboxPlace) => {
    Keyboard.dismiss();
    setShowResults(false);
    setQuery(place.name);
    setSelectedPin({
      latitude: place.coordinates.latitude,
      longitude: place.coordinates.longitude,
      name: place.name,
      fullName: place.fullName,
    });

    // Fly the map to the selected location
    webViewRef.current?.injectJavaScript(`
      flyToLocation(${place.coordinates.longitude}, ${place.coordinates.latitude}, "${place.name.replace(/"/g, '\\"')}");
      true;
    `);
  };

  const handleConfirmSelection = () => {
    if (selectedPin) {
      onSelect({
        id: `pin-${selectedPin.latitude}-${selectedPin.longitude}`,
        name: selectedPin.name,
        fullName: selectedPin.fullName,
        type: "place",
        coordinates: {
          latitude: selectedPin.latitude,
          longitude: selectedPin.longitude,
        },
      });
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "pinDragged" || data.type === "mapClicked") {
        setSelectedPin({
          latitude: data.latitude,
          longitude: data.longitude,
          name: data.name || "Dropped Pin",
          fullName: data.fullName || `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`,
        });
        setQuery(data.name || "Dropped Pin");
      }
    } catch (e) {
      // ignore parse errors
    }
  };

  // Reverse geocode a coordinate to get place name
  const reverseGeocodeJS = `
    async function reverseGeocode(lng, lat) {
      try {
        const res = await fetch(
          'https://api.mapbox.com/geocoding/v5/mapbox.places/' + lng + ',' + lat + '.json?access_token=' + mapboxToken + '&limit=1&language=en'
        );
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          return {
            name: data.features[0].text,
            fullName: data.features[0].place_name
          };
        }
        return { name: 'Dropped Pin', fullName: lat.toFixed(4) + ', ' + lng.toFixed(4) };
      } catch(e) {
        return { name: 'Dropped Pin', fullName: lat.toFixed(4) + ', ' + lng.toFixed(4) };
      }
    }
  `;

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow: hidden; }
        #map { width: 100%; height: 100vh; }
        .pin-instruction {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.7);
          color: #fff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-family: -apple-system, sans-serif;
          pointer-events: none;
          z-index: 10;
          white-space: nowrap;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="pin-instruction" id="instruction">Tap the map or drag the pin</div>
      <script>
        const mapboxToken = '${MAPBOX_ACCESS_TOKEN}';
        mapboxgl.accessToken = mapboxToken;

        ${reverseGeocodeJS}

        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [121.0, 14.5],
          zoom: 5,
          attributionControl: false,
        });

        let marker = null;

        function createOrMoveMarker(lng, lat) {
          if (marker) {
            marker.setLngLat([lng, lat]);
          } else {
            marker = new mapboxgl.Marker({
              color: '#0C4C8A',
              draggable: true,
            })
              .setLngLat([lng, lat])
              .addTo(map);

            marker.on('dragend', async function() {
              const lngLat = marker.getLngLat();
              const place = await reverseGeocode(lngLat.lng, lngLat.lat);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'pinDragged',
                latitude: lngLat.lat,
                longitude: lngLat.lng,
                name: place.name,
                fullName: place.fullName,
              }));
            });
          }
          // Hide instruction after first interaction
          document.getElementById('instruction').style.display = 'none';
        }

        // Tap on map to drop/move pin
        map.on('click', async function(e) {
          const { lng, lat } = e.lngLat;
          createOrMoveMarker(lng, lat);
          const place = await reverseGeocode(lng, lat);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapClicked',
            latitude: lat,
            longitude: lng,
            name: place.name,
            fullName: place.fullName,
          }));
        });

        // Called from React Native when a search result is selected
        function flyToLocation(lng, lat, name) {
          map.flyTo({ center: [lng, lat], zoom: 13, duration: 1500 });
          createOrMoveMarker(lng, lat);
        }
      </script>
    </body>
    </html>
  `;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "country": return "flag";
      case "region": return "map";
      case "place": return "location-city";
      case "locality": return "place";
      default: return "place";
    }
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

  const renderItem = ({ item }: { item: MapboxPlace }) => (
    <TouchableOpacity
      className="flex-row items-center px-5 py-3 border-b border-gray-100"
      onPress={() => handleSearchSelect(item)}
      activeOpacity={0.6}
    >
      <View className="w-9 h-9 rounded-full bg-[#EEF2F9] items-center justify-center mr-3">
        <Icon name={getTypeIcon(item.type)} size={18} color="#183B7A" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900">{item.name}</Text>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {item.fullName}
        </Text>
      </View>
      <View className="px-2 py-0.5 rounded-full bg-gray-100">
        <Text className="text-[10px] text-gray-500">{getTypeLabel(item.type)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white pt-[40px]">
      {/* Header */}
      <View className="bg-white z-20 pb-3 border-b border-gray-200">
        <View className="flex-row items-center px-3 pt-3">
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
              placeholder={activeFilter ? `Search ${getTypeLabel(activeFilter)}...` : "Search place to visit..."}
              placeholderTextColor="#999"
              value={query}
              onChangeText={handleTextChange}
              onFocus={() => { if (results.length > 0) setShowResults(true); }}
              returnKeyType="search"
              autoCapitalize="words"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(""); setResults([]); setShowResults(false); }}>
                <Icon name="close" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Toggle */}
        <View className="flex-row items-center px-4 mt-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => handleFilterSelect(filter.id)}
                  activeOpacity={0.7}
                  className={`flex-row items-center px-3 py-1.5 mr-2 rounded-full border ${
                    isActive ? "bg-[#EEF2F9] border-[#0C4C8A]" : "bg-white border-gray-200"
                  }`}
                >
                  <Icon
                    name={filter.icon as any}
                    size={16}
                    color={isActive ? "#0C4C8A" : "#666"}
                  />
                  <Text
                    className={`ml-1.5 text-xs font-medium ${
                      isActive ? "text-[#0C4C8A]" : "text-gray-600"
                    }`}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Map */}
      <View className="flex-1">
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          style={{ flex: 1 }}
        />
      </View>

      {/* Search Results Overlay */}
      {showResults && results.length > 0 && (
        <View className="absolute top-[105px] left-0 right-0 bg-white z-30 max-h-[350px] rounded-b-xl"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 }}
        >
          {isLoading && (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#183B7A" />
            </View>
          )}
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Selected Pin Info + Confirm Button */}
      {selectedPin && (
        <View className="absolute bottom-0 left-0 right-0 bg-white px-4 pt-3 pb-6 rounded-t-2xl z-20"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 10 }}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-[#EEF2F9] items-center justify-center mr-3">
              <Icon name="location-on" size={22} color="#0C4C8A" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">{selectedPin.name}</Text>
              <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>{selectedPin.fullName}</Text>
            </View>
          </View>
          <TouchableOpacity
            className="bg-[#0C4C8A] rounded-[30px] py-4 items-center"
            activeOpacity={0.7}
            onPress={handleConfirmSelection}
            accessibilityRole="button"
          >
            <Text className="text-white font-semibold text-base">Select this location</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default MapboxDestinationSelector;
