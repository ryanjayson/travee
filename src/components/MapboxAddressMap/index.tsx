import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, StyleSheet, Platform, Modal, SafeAreaView, StatusBar } from "react-native";
import { WebView } from "react-native-webview";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN as ENV_TOKEN } from "@env";

const MAPBOX_ACCESS_TOKEN = ENV_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || "";
const MAPBOX_GEOCODE_URL = "https://api.mapbox.com/search/searchbox/v1/forward";

export interface MapboxAddressMapProps {
  address?: string | null;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  pickupAddress?: string | null;
  pickupCoordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  dropoffAddress?: string | null;
  dropoffCoordinates?: {
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

const fetchCoordsForAddress = async (addrStr: string): Promise<{ latitude: number; longitude: number } | null> => {
  if (!addrStr || !addrStr.trim()) return null;
  try {
    const url = `${MAPBOX_GEOCODE_URL}?q=${encodeURIComponent(addrStr.trim())}&access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  } catch (err) {
    console.warn("MapboxAddressMap Geocoding Error:", err);
  }
  return null;
};

export default function MapboxAddressMap({
  address,
  coordinates: propCoords,
  pickupAddress,
  pickupCoordinates: propPickupCoords,
  dropoffAddress,
  dropoffCoordinates: propDropoffCoords,
  title = "Location",
  height = 200,
  zoom = 16.2,
  pitch = 40,
  bearing = 35,
  interactive = true,
  onFullScreenChange,
}: MapboxAddressMapProps) {
  const isRouteMode = Boolean(pickupAddress || propPickupCoords || dropoffAddress || propDropoffCoords);

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    hasValidCoords(propCoords) ? propCoords : null
  );
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(
    hasValidCoords(propPickupCoords) ? propPickupCoords : null
  );
  const [dropoffCoords, setDropoffCoords] = useState<{ latitude: number; longitude: number } | null>(
    hasValidCoords(propDropoffCoords) ? propDropoffCoords : null
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
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
    let isMounted = true;

    const resolveLocations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isRouteMode) {
          // Route Mode: resolve pickup and/or dropoff
          let resolvedPickup = hasValidCoords(propPickupCoords) ? propPickupCoords : null;
          if (!resolvedPickup && pickupAddress) {
            resolvedPickup = await fetchCoordsForAddress(pickupAddress);
          }

          let resolvedDropoff = hasValidCoords(propDropoffCoords) ? propDropoffCoords : null;
          if (!resolvedDropoff && dropoffAddress) {
            resolvedDropoff = await fetchCoordsForAddress(dropoffAddress);
          }

          if (isMounted) {
            setPickupCoords(resolvedPickup);
            setDropoffCoords(resolvedDropoff);

            if (!resolvedPickup && !resolvedDropoff) {
              // Fallback to general address if route endpoints failed
              if (hasValidCoords(propCoords)) {
                setCoords(propCoords);
              } else if (address) {
                const single = await fetchCoordsForAddress(address);
                setCoords(single);
                if (!single) setError("Location coordinates not found");
              } else {
                setError("Location coordinates not found");
              }
            }
          }
        } else {
          // Single Location Mode
          if (hasValidCoords(propCoords)) {
            if (isMounted) setCoords(propCoords);
          } else if (address && address.trim()) {
            const single = await fetchCoordsForAddress(address);
            if (isMounted) {
              setCoords(single);
              if (!single) setError("Location coordinates not found");
            }
          } else if (isMounted) {
            setCoords(null);
          }
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

    resolveLocations();

    return () => {
      isMounted = false;
    };
  }, [
    isRouteMode,
    address,
    propCoords,
    pickupAddress,
    propPickupCoords,
    dropoffAddress,
    propDropoffCoords,
  ]);

  const handleOpenExternalMaps = () => {
    if (isRouteMode && (pickupCoords || pickupAddress) && (dropoffCoords || dropoffAddress)) {
      const originParam = pickupCoords ? `${pickupCoords.latitude},${pickupCoords.longitude}` : pickupAddress || "";
      const destParam = dropoffCoords ? `${dropoffCoords.latitude},${dropoffCoords.longitude}` : dropoffAddress || "";
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originParam)}&destination=${encodeURIComponent(destParam)}`;
      Linking.openURL(url).catch((err) => console.error("Failed to open directions", err));
      return;
    }

    const activeCoord = pickupCoords || dropoffCoords || coords;
    const activeAddress = pickupAddress || dropoffAddress || address;

    if (activeCoord) {
      const url = Platform.select({
        ios: `maps:0,0?q=${activeCoord.latitude},${activeCoord.longitude}`,
        android: `geo:0,0?q=${activeCoord.latitude},${activeCoord.longitude}(${encodeURIComponent(title || activeAddress || "Location")})`,
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          Linking.openURL(`https://maps.google.com/?q=${activeCoord.latitude},${activeCoord.longitude}`);
        });
      }
    } else if (activeAddress) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(activeAddress)}`);
    }
  };

  const hasAnyCoords = Boolean(coords || pickupCoords || dropoffCoords);

  if (!address && !pickupAddress && !dropoffAddress && !hasAnyCoords) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { height }]} className="bg-gray-800/40 items-center justify-center rounded-4xl my-3">
        <ActivityIndicator size="small" color="#FFFFFF" />
        <Text className="text-sm text-white/60 mt-2">Loading map & route...</Text>
      </View>
    );
  }

  if (error || !hasAnyCoords) {
    return (
      <TouchableOpacity
        onPress={handleOpenExternalMaps}
        activeOpacity={0.8}
        className="bg-gray-800/40 p-4 rounded-2xl my-3 flex-row items-center gap-3 border border-white/10"
      >
        <Icon name="map" size={20} color="#FFFFFF" />
        <View className="flex-1">
          <Text className="text-xs font-semibold text-white">View on Map</Text>
          <Text className="text-xxs text-white/70" numberOfLines={1}>
            {pickupAddress && dropoffAddress ? `${pickupAddress} → ${dropoffAddress}` : address || pickupAddress || dropoffAddress}
          </Text>
        </View>
        <Icon name="open-in-new" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    );
  }

  const hasBothRoutePoints = Boolean(pickupCoords && dropoffCoords);

  const generateHtml = (fullScreen: boolean) => {
    if (hasBothRoutePoints && pickupCoords && dropoffCoords) {
      // ── Two Pin Route HTML ──
      const pLng = pickupCoords.longitude;
      const pLat = pickupCoords.latitude;
      const dLng = dropoffCoords.longitude;
      const dLat = dropoffCoords.latitude;
      const centerLng = (pLng + dLng) / 2;
      const centerLat = (pLat + dLat) / 2;

      return `
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
            .marker-pickup {
              width: 34px;
              height: 34px;
              border-radius: 50%;
              background: #059669;
              border: 3px solid #FFFFFF;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 13px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .marker-dropoff {
              width: 34px;
              height: 34px;
              border-radius: 50%;
              background: #DC2626;
              border: 3px solid #FFFFFF;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 13px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display: none !important; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';
            const map = new mapboxgl.Map({
              container: 'map',
              style: 'mapbox://styles/mapbox/standard',
              center: [${centerLng}, ${centerLat}],
              zoom: 12,
              pitch: ${pitch},
              bearing: 0,
              interactive: ${fullScreen ? 'true' : (interactive ? 'true' : 'false')},
              attributionControl: false
            });
            window.map = map;

            ${fullScreen ? "map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-left');" : ""}

            map.on('style.load', () => {
              map.setConfigProperty('basemap', 'lightPreset', '${isDarkMode ? "dusk" : "day"}');

              // Pickup Marker (Green)
              const elPickup = document.createElement('div');
              elPickup.className = 'marker-pickup';
              elPickup.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
              new mapboxgl.Marker(elPickup)
                .setLngLat([${pLng}, ${pLat}])
                .addTo(map);

              // Dropoff Marker (Red)
              const elDropoff = document.createElement('div');
              elDropoff.className = 'marker-dropoff';
              elDropoff.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>';
              new mapboxgl.Marker(elDropoff)
                .setLngLat([${dLng}, ${dLat}])
                .addTo(map);

              // Fetch driving directions from Mapbox Directions API
              const directionsUrl = 'https://api.mapbox.com/directions/v5/mapbox/driving/${pLng},${pLat};${dLng},${dLat}?geometries=geojson&overview=full&access_token=' + mapboxgl.accessToken;
              fetch(directionsUrl)
                .then(function(res) { return res.json(); })
                .then(function(data) {
                  if (data.routes && data.routes.length > 0) {
                    var routeGeo = {
                      'type': 'Feature',
                      'properties': {},
                      'geometry': data.routes[0].geometry
                    };
                    map.addSource('route', { 'type': 'geojson', 'data': routeGeo });
                    map.addLayer({
                      'id': 'route-casing',
                      'type': 'line',
                      'source': 'route',
                      'layout': { 'line-join': 'round', 'line-cap': 'round' },
                      'paint': { 'line-color': '#0F172A', 'line-width': 7 }
                    });
                    map.addLayer({
                      'id': 'route-line',
                      'type': 'line',
                      'source': 'route',
                      'layout': { 'line-join': 'round', 'line-cap': 'round' },
                      'paint': { 'line-color': '#00D2FF', 'line-width': 4.5 }
                    });
                  } else {
                    drawFallback();
                  }
                })
                .catch(function(e) {
                  drawFallback();
                });

              function drawFallback() {
                var directLine = {
                  'type': 'Feature',
                  'properties': {},
                  'geometry': {
                    'type': 'LineString',
                    'coordinates': [[${pLng}, ${pLat}], [${dLng}, ${dLat}]]
                  }
                };
                map.addSource('fallback-route', { 'type': 'geojson', 'data': directLine });
                map.addLayer({
                  'id': 'fallback-route-line',
                  'type': 'line',
                  'source': 'fallback-route',
                  'layout': { 'line-join': 'round', 'line-cap': 'round' },
                  'paint': {
                    'line-color': '#38BDF8',
                    'line-width': 4,
                    'line-dasharray': [2, 2]
                  }
                });
              }

              // Fit bounds to enclose both pins
              var bounds = new mapboxgl.LngLatBounds();
              bounds.extend([${pLng}, ${pLat}]);
              bounds.extend([${dLng}, ${dLat}]);
              map.fitBounds(bounds, { padding: 45, maxZoom: 15.5 });
            });
          </script>
        </body>
        </html>
      `;
    }

    // ── Single Pin Mode (Existing 3D Eraser) ──
    const target = pickupCoords || dropoffCoords || coords!;
    const lng = target.longitude;
    const lat = target.latitude;

    return `
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
          const lng = ${lng};
          const lat = ${lat};

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

            map.addLayer({
              'id': 'eraser',
              'type': 'clip',
              'source': 'eraser',
              'layout': {
                'clip-layer-types': ['symbol', 'model']
              },
              'maxzoom': 16.5
            });

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
  };

  return (
    <>
      {/* Inline Map View */}
      <View style={[styles.container, { height }]} className="my-3 rounded-4xl overflow-hidden shadow-lg relative">
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
                className="px-4 py-2.5 rounded-2xl flex-1 mr-3 shadow-lg"
              >
                <Text className="text-lg font-bold text-white" numberOfLines={1}>{title}</Text>
                {pickupAddress && dropoffAddress ? (
                  <Text className="text-xxs text-white/70 mt-0.5" numberOfLines={1}>
                    {pickupAddress} → {dropoffAddress}
                  </Text>
                ) : (
                  (address || pickupAddress || dropoffAddress) ? (
                    <Text className="text-xxs text-white/70 mt-0.5" numberOfLines={1}>
                      {address || pickupAddress || dropoffAddress}
                    </Text>
                  ) : null
                )}
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
                className="p-3 rounded-full shadow"
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
