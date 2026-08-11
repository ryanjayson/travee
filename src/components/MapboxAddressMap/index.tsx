import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, StyleSheet, Platform, Modal, SafeAreaView, StatusBar } from "react-native";
import { WebView } from "react-native-webview";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN as ENV_TOKEN } from "@env";
import { FadeInView } from "../animations";

const MAPBOX_ACCESS_TOKEN = ENV_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || "";
const MAPBOX_GEOCODE_URL = "https://api.mapbox.com/search/searchbox/v1/forward";

interface MapboxAddressMapProps {
  address?: string | null;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  title?: string;
  height?: number;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  interactive?: boolean;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

const hasValidCoords = (c?: { latitude?: number | null; longitude?: number | null } | null): c is { latitude: number; longitude: number } => {
  if (!c) return false;
  const { latitude, longitude } = c;
  if (typeof latitude !== "number" || typeof longitude !== "number") return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude === 0 && longitude === 0) return false;
  return true;
};

export default function MapboxAddressMap({
  address,
  coordinates: propCoords,
  title = "Location",
  height = 200,
  zoom = 16.2,
  pitch = 40,
  bearing = 35,
  interactive = true,
  onFullScreenChange,
}: MapboxAddressMapProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    hasValidCoords(propCoords) ? propCoords : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    !hasValidCoords(propCoords) && !!address && !!address.trim()
  );
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const fullScreenWebViewRef = React.useRef<WebView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    onFullScreenChange?.(isFullScreen);
  }, [isFullScreen, onFullScreenChange]);

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    const preset = nextMode ? "dusk" : "day";
    fullScreenWebViewRef.current?.injectJavaScript(`
      if (window.map) {
        window.map.setConfigProperty('basemap', 'lightPreset', '${preset}');
      }
      true;
    `);
  };

  useEffect(() => {
    if (hasValidCoords(propCoords)) {
      setCoords(propCoords);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!address || !address.trim()) {
      setCoords(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const geocodeAddress = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = `${MAPBOX_GEOCODE_URL}?q=${encodeURIComponent(address.trim())}&access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;
        const res = await fetch(url);
        const data = await res.json();

        if (isMounted && data.features && data.features.length > 0) {
          const feature = data.features[0];
          const [lng, lat] = feature.geometry.coordinates;
          if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
            setCoords({ latitude: lat, longitude: lng });
          } else if (isMounted) {
            setError("Location coordinates not found");
          }
        } else if (isMounted) {
          setError("Location coordinates not found");
        }
      } catch (err) {
        if (isMounted) {
          console.error("MapboxAddressMap Geocoding Error:", err);
          setError("Failed to load map location");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    geocodeAddress();
    return () => {
      isMounted = false;
    };
  }, [address, propCoords]);

  const handleOpenExternalMaps = () => {
    if (coords) {
      const url = Platform.select({
        ios: `maps:0,0?q=${coords.latitude},${coords.longitude}`,
        android: `geo:0,0?q=${coords.latitude},${coords.longitude}(${encodeURIComponent(title || address || "Location")})`,
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          Linking.openURL(`https://maps.google.com/?q=${coords.latitude},${coords.longitude}`);
        });
      }
    } else if (address) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`);
    }
  };

  if (!address && !coords) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { height }]} className="bg-gray-800/40 items-center justify-center rounded-4xl my-3">
        <ActivityIndicator size="small" color="#FFFFFF" />
        <Text className="text-lg text-white/60">Loading map...</Text>
      </View>
    );
  }

  if (error || !coords) {
    return (
      <TouchableOpacity
        onPress={handleOpenExternalMaps}
        activeOpacity={0.8}
        className="bg-gray-800/40 p-4 rounded-2xl my-3 flex-row items-center gap-3 border border-white/10"
      >
        <Icon name="map" size={20} color="#FFFFFF" />
        <View className="flex-1">
          <Text className="text-xs font-semibold text-white">View on Map</Text>
          <Text className="text-xxs text-white/70" numberOfLines={1}>{address}</Text>
        </View>
        <Icon name="open-in-new" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    );
  }

  const generateHtml = (fullScreen: boolean) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { width: 100%; height: 100%; overflow: hidden; background: #111827; }
        #map { width: 100%; height: 100%; }
        .custom-marker {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #D32222;
          border: 3px solid #FFFFFF;
          box-shadow: 0 4px 14px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 10;
        }
        .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display: none !important; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';
        const lng = ${coords.longitude};
        const lat = ${coords.latitude};

        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/standard',
          center: [lng, lat],
          zoom: ${zoom},
          pitch: ${pitch},
          bearing: ${bearing},
          interactive: ${fullScreen ? 'true' : (interactive ? 'true' : 'false')},
          attributionControl: false
        });
        window.map = map;

        ${fullScreen ? "map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-left');" : ""}

        map.on('style.load', () => {
          const offset = 0.0008;

          map.setConfigProperty('basemap', 'lightPreset', '${isDarkMode ? "dusk" : "day"}');

          // Add a GeoJSON source with a polygon surrounding the location for clipping
          map.addSource('eraser', {
            'type': 'geojson',
            'data': {
              'type': 'FeatureCollection',
              'features': [
                {
                  'type': 'Feature',
                  'properties': {},
                  'geometry': {
                    'type': 'Polygon',
                    'coordinates': [
                      [
                        [lng - offset, lat + offset],
                        [lng + offset, lat + offset],
                        [lng + offset, lat - offset],
                        [lng - offset, lat - offset],
                        [lng - offset, lat + offset]
                      ]
                    ]
                  }
                }
              ]
            }
          });

          // Add the clip layer to remove 3D models and symbols inside the polygon zone
          map.addLayer({
            'id': 'eraser',
            'type': 'clip',
            'source': 'eraser',
            'layout': {
              'clip-layer-types': ['symbol', 'model']
            },
            'maxzoom': 16.5
          });

          // Add a line layer to highlight the clipped region boundary
          map.addLayer({
            'id': 'eraser-debug',
            'type': 'line',
            'source': 'eraser',
            'paint': {
              'line-color': 'rgba(211, 34, 34, 0.95)',
              'line-dasharray': [0, 4, 3],
              'line-width': 3.5
            }
          });

          // Custom pin marker
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';

          new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <>
      {/* Inline Map View */}
      <View style={[styles.container, { height }]} className="my-3 rounded-4xl overflow-hidden  shadow-lg relative">
        <WebView
          originWhitelist={["*"]}
          source={{ html: generateHtml(false) }}
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
          scrollEnabled={false}
          nestedScrollEnabled={true}
        />

        {/* Top-Right Fullscreen Trigger Button */}
        <TouchableOpacity
          onPress={() => setIsFullScreen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
          className="absolute top-2.5 right-2.5 p-2 rounded-full shadow items-center justify-center"
        >
          <Icon name="fullscreen" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Bottom-Right Directions Button */}
        <TouchableOpacity
          onPress={handleOpenExternalMaps}
          activeOpacity={0.8}
          accessibilityRole="button"
          className="absolute bottom-2.5 right-2.5 bg-black/75 px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border border-white/25 shadow"
        >
          <Icon name="directions" size={14} color="#FFFFFF" />
          <Text className="text-xxs font-bold text-white uppercase tracking-wider">Directions</Text>
        </TouchableOpacity>
      </View>

      {/* Fullscreen Map Modal */}
      <Modal
        visible={isFullScreen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsFullScreen(false)}
        style={{ flex: 1, zIndex: 99999 }}
      >
        <SafeAreaView className="flex-1 bg-gray-900">
          <StatusBar barStyle="light-content" />

          <View className="flex-1 relative">
            <WebView
              ref={fullScreenWebViewRef}
              originWhitelist={["*"]}
              source={{ html: generateHtml(true) }}
              style={{ width: "100%", height: "100%", backgroundColor: "#111827" }}
            />

            {/* Top Bar Header with Title, Theme Toggle & Close Button */}
            <View
              style={{ top: Math.max(insets.top + 8, 16) }}
              className="absolute left-4 right-4 flex-row items-center justify-between pointer-events-box-none z-10"
            >
              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.5)",
                }}
                className="px-4 py-2.5 rounded-2xl flex-1 mr-3 shadow-lg">
                <Text className="text-lg font-bold text-white" numberOfLines={1}>{title}</Text>
                {address ? <Text className="text-xxs text-white/70 mt-0.5" numberOfLines={1}>{address}</Text> : null}
              </View>

              <TouchableOpacity
                onPress={toggleTheme}
                activeOpacity={0.8}
                accessibilityRole="button"
                style={{
                  backgroundColor: "rgba(0,0,0,0.5)",
                }}
                className="p-3 rounded-full shadow mr-2"
              >
                <Icon name={!isDarkMode ? "wb-sunny" : "nights-stay"} size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsFullScreen(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                style={{
                  backgroundColor: "rgba(0,0,0,0.5)",
                }}
                className=" p-3 rounded-full shadow"
              >
                <Icon name="fullscreen-exit" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Bottom Floating Directions Button */}
            <View
              style={{ bottom: Math.max(insets.bottom + 16, 24) }}
              className="absolute right-4 z-10"
            >
              <TouchableOpacity
                onPress={handleOpenExternalMaps}
                activeOpacity={0.8}
                accessibilityRole="button"
                className="bg-red-600 px-5 py-3 rounded-full flex-row items-center gap-2 border border-white/20 shadow-xl"
              >
                <Icon name="directions" size={18} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white uppercase tracking-wider">Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#111827",
  },
});
