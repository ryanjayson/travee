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
} from "react-native";
import { WebView } from "react-native-webview";
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
  const [showResults, setShowResults] = useState(false);
  const [selectedPin, setSelectedPin] = useState<{
    latitude: number;
    longitude: number;
    name: string;
    fullName: string;
  } | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webViewRef = useRef<WebView>(null);

  const searchPlaces = useCallback(async (text: string) => {
    if (text.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const encodedQuery = encodeURIComponent(text);
      const url = `${MAPBOX_GEOCODING_URL}/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=8&language=en`;

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
      searchPlaces(text);
    }, 350);
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
      <View className="flex-row items-center px-3 pt-3 pb-2 border-b border-gray-200 bg-white z-20">
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
        <View className="absolute top-[60px] left-0 right-0 bg-white z-30 max-h-[300px] rounded-b-xl"
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
