import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  Keyboard,
  FlatList,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getValidMapboxCountryCode } from "../../../../utils/countryUtils";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "Travee-App/1.0 (contact@travee.app)";

export interface PinnedLocation {
  address: string;
  name?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  placeId?: string;
}

export interface OsmMapPinModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: PinnedLocation) => void;
  title?: string;
  initialValue?: string;
  initialCoordinates?: {
    latitude: number;
    longitude: number;
  };
  destination?: string;
  destinationCoordinates?: {
    latitude: number;
    longitude: number;
  };
  country?: string;
}

interface NominatimSearchResult {
  place_id: number;
  osm_id: number;
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
  };
}

const buildLeafletHtml = (
  initialLat: number,
  initialLng: number,
  initialZoom: number = 14,
  pinColor: string = "#E53935"
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #f0f2f5; }
    .custom-pin {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .pin-icon {
      width: 38px;
      height: 38px;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
      animation: pinBounce 0.35s ease-out;
    }
    @keyframes pinBounce {
      0% { transform: translateY(-20px) scale(0.8); opacity: 0; }
      60% { transform: translateY(4px) scale(1.05); opacity: 1; }
      100% { transform: translateY(0) scale(1); }
    }
    .leaflet-control-attribution {
      font-size: 9px !important;
      background: rgba(255, 255, 255, 0.8) !important;
      padding: 2px 6px !important;
      margin-bottom: 30px !important;
      margin-right: 10px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([${initialLat}, ${initialLng}], ${initialZoom});

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    var pinSvg = '<svg class="pin-icon" viewBox="0 0 384 512" fill="${pinColor}">' +
      '<path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/>' +
      '</svg>';

    var customIcon = L.divIcon({
      html: '<div class="custom-pin">' + pinSvg + '</div>',
      className: '',
      iconSize: [38, 48],
      iconAnchor: [19, 48],
      popupAnchor: [0, -48]
    });

    var marker = L.marker([${initialLat}, ${initialLng}], {
      icon: customIcon,
      draggable: true,
      autoPan: true
    }).addTo(map);

    function notifyPosition(lat, lng) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'pin_moved',
          lat: lat,
          lng: lng
        }));
      }
    }

    marker.on('dragend', function(e) {
      var pos = e.target.getLatLng();
      notifyPosition(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      notifyPosition(e.latlng.lat, e.latlng.lng);
    });

    window.flyToLocation = function(lat, lng, zoom) {
      map.flyTo([lat, lng], zoom || 15, { animate: true, duration: 1 });
      marker.setLatLng([lat, lng]);
    };

    window.setPinLocation = function(lat, lng) {
      marker.setLatLng([lat, lng]);
    };

    window.zoomIn = function() { map.zoomIn(); };
    window.zoomOut = function() { map.zoomOut(); };
  </script>
</body>
</html>
`;

const OsmMapPinModal = ({
  visible,
  onClose,
  onSelect,
  title = "Pin Location",
  initialValue = "",
  initialCoordinates,
  destination = "",
  destinationCoordinates,
  country = "",
}: OsmMapPinModalProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  // Default coordinate determination
  const defaultCoords = initialCoordinates || destinationCoordinates || {
    latitude: 35.6762,
    longitude: 139.6503, // Default fallback
  };

  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number }>(defaultCoords);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string>(initialValue || "Selected Pin Location");
  const [selectedAddress, setSelectedAddress] = useState<string>(initialValue || "");
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<NominatimSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  const debounceSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortSearchControllerRef = useRef<AbortController | null>(null);
  const abortReverseControllerRef = useRef<AbortController | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (visible) {
      const activeCoords = initialCoordinates || destinationCoordinates || {
        latitude: 35.6762,
        longitude: 139.6503,
      };
      setCurrentCoords(activeCoords);
      setSelectedPlaceName(initialValue || destination || "Selected Pin Location");
      setSelectedAddress(initialValue || "");
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);

      // If no initial coordinates were passed but destination coordinates exist, fly to destination
      if (!initialCoordinates && destinationCoordinates) {
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(
            `window.flyToLocation(${destinationCoordinates.latitude}, ${destinationCoordinates.longitude}, 14); true;`
          );
        }, 500);
        reverseGeocode(destinationCoordinates.latitude, destinationCoordinates.longitude);
      } else if (!initialCoordinates && !destinationCoordinates && destination) {
        geocodeDestination(destination);
      } else {
        // Reverse geocode starting coordinates to show nice address
        reverseGeocode(activeCoords.latitude, activeCoords.longitude);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialValue, initialCoordinates, destinationCoordinates, destination]);

  // Geocode destination name on load if no explicit coords
  const geocodeDestination = async (queryText: string) => {
    try {
      setIsGeocoding(true);
      let url = `${NOMINATIM_SEARCH_URL}?q=${encodeURIComponent(queryText)}&format=json&addressdetails=1&limit=1&accept-language=en`;
      const countryCode = getValidMapboxCountryCode(country || queryText);
      if (countryCode) {
        url += `&countrycodes=${encodeURIComponent(countryCode)}`;
      }
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (response.ok) {
        const data: NominatimSearchResult[] = await response.json();
        if (data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const coords = { latitude: lat, longitude: lng };
          setCurrentCoords(coords);
          setSelectedPlaceName(item.name || item.display_name.split(",")[0]);
          setSelectedAddress(item.display_name);

          // Fly map to new coordinates
          setTimeout(() => {
            webViewRef.current?.injectJavaScript(`window.flyToLocation(${lat}, ${lng}, 13); true;`);
          }, 600);
        }
      }
    } catch (e) {
      console.warn("[OsmMapPinModal] Destination geocode error:", e);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Reverse geocoding: Lat/Lng -> Address Name
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (abortReverseControllerRef.current) {
      abortReverseControllerRef.current.abort();
    }
    abortReverseControllerRef.current = new AbortController();

    setIsGeocoding(true);
    try {
      const url = `${NOMINATIM_REVERSE_URL}?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`;
      const response = await fetch(url, {
        signal: abortReverseControllerRef.current.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Reverse geocoding failed");

      const data = await response.json();
      if (data) {
        const addr = data.address || {};
        const poiName =
          data.name ||
          addr.road ||
          addr.building ||
          addr.amenity ||
          addr.suburb ||
          addr.city ||
          data.display_name?.split(",")[0] ||
          "Pinned Location";

        setSelectedPlaceName(poiName);
        setSelectedAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.warn("[OsmMapPinModal] Reverse geocode error:", error);
      setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Forward search for place/address
  const searchPlaces = useCallback(
    async (text: string) => {
      if (text.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      if (abortSearchControllerRef.current) {
        abortSearchControllerRef.current.abort();
      }
      abortSearchControllerRef.current = new AbortController();

      setIsSearching(true);
      try {
        let url = `${NOMINATIM_SEARCH_URL}?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=5&accept-language=en`;
        const validCountryCode = getValidMapboxCountryCode(country || destination);
        if (validCountryCode) {
          url += `&countrycodes=${encodeURIComponent(validCountryCode)}`;
        }

        const targetCoords = destinationCoordinates || currentCoords;
        if (targetCoords && (targetCoords.latitude !== 0 || targetCoords.longitude !== 0)) {
          const delta = 1.0;
          url += `&viewbox=${targetCoords.longitude - delta},${targetCoords.latitude + delta},${targetCoords.longitude + delta},${targetCoords.latitude - delta}&bounded=0`;
        }

        const response = await fetch(url, {
          signal: abortSearchControllerRef.current.signal,
          headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        });

        if (!response.ok) throw new Error("Search failed");

        const data: NominatimSearchResult[] = await response.json();
        setSearchResults(data);
        setShowSearchResults(data.length > 0);
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        console.warn("[OsmMapPinModal] Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [country]
  );

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    if (debounceSearchTimer.current) clearTimeout(debounceSearchTimer.current);
    debounceSearchTimer.current = setTimeout(() => {
      searchPlaces(text);
    }, 400);
  };

  const handleSelectSearchResult = (item: NominatimSearchResult) => {
    Keyboard.dismiss();
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const coords = { latitude: lat, longitude: lng };

    setCurrentCoords(coords);
    setSelectedPlaceName(item.name || item.display_name.split(",")[0]);
    setSelectedAddress(item.display_name);
    setSearchQuery(item.name || item.display_name.split(",")[0]);
    setShowSearchResults(false);

    // Fly map in WebView
    webViewRef.current?.injectJavaScript(`window.flyToLocation(${lat}, ${lng}, 16); true;`);
  };

  // Handle messages from Leaflet WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "pin_moved") {
        const coords = { latitude: data.lat, longitude: data.lng };
        setCurrentCoords(coords);
        reverseGeocode(data.lat, data.lng);
      }
    } catch (e) {
      console.warn("[OsmMapPinModal] WebView message parse error:", e);
    }
  };

  // Quick action: Center on destination
  const handleCenterOnDestination = () => {
    if (destinationCoordinates) {
      const { latitude, longitude } = destinationCoordinates;
      setCurrentCoords(destinationCoordinates);
      webViewRef.current?.injectJavaScript(`window.flyToLocation(${latitude}, ${longitude}, 14); true;`);
      reverseGeocode(latitude, longitude);
    } else if (destination) {
      geocodeDestination(destination);
    }
  };

  // Quick action: Center on current pin
  const handleCenterOnPin = () => {
    webViewRef.current?.injectJavaScript(
      `window.flyToLocation(${currentCoords.latitude}, ${currentCoords.longitude}, 16); true;`
    );
  };

  const handleConfirm = () => {
    onSelect({
      address: selectedAddress || selectedPlaceName || `${currentCoords.latitude.toFixed(5)}, ${currentCoords.longitude.toFixed(5)}`,
      name: selectedPlaceName,
      coordinates: currentCoords,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.container, { paddingTop: insets.top || (Platform.OS === "android" ? 36 : 48) }]}
      >
        {/* ── Header Bar ── */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close map pin modal"
            >
              <Icon name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>

            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <Icon name="search" size={20} color="#888" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search place, landmark, or address..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearchTextChange}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
                returnKeyType="search"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 4 }} />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  style={{ padding: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search text"
                >
                  <Icon name="close" size={18} color="#888" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Subheader info bar */}
          <View style={styles.subHeaderRow}>
            <View style={styles.attributionBadge}>
              <Icon name="public" size={12} color="#667085" style={{ marginRight: 4 }} />
              <Text style={styles.attributionText}>OpenStreetMap</Text>
            </View>

            {Boolean(destination || destinationCoordinates) && (
              <TouchableOpacity
                onPress={handleCenterOnDestination}
                style={[styles.destinationChip, { borderColor: `${colors.primary}30` }]}
                accessibilityRole="button"
                accessibilityLabel={`Fly to trip destination ${destination || ""}`}
              >
                <Icon name="flight-takeoff" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.destinationChipText, { color: colors.primary }]} numberOfLines={1}>
                  Trip: {destination || "Destination"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Main Map Viewport ── */}
        <View style={styles.mapWrapper}>
          <WebView
            ref={webViewRef}
            source={{
              html: buildLeafletHtml(
                defaultCoords.latitude,
                defaultCoords.longitude,
                14,
                colors.primary || "#E53935"
              ),
            }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading Map...</Text>
              </View>
            )}
            onMessage={handleWebViewMessage}
          />

          {/* ── Search Results Dropdown Overlay ── */}
          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => String(item.place_id)}
                keyboardShouldPersistTaps="always"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => handleSelectSearchResult(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select search result ${item.display_name}`}
                  >
                    <View style={[styles.resultIconBox, { backgroundColor: `${colors.primary}12` }]}>
                      <Icon name="place" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.resultTextBox}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {item.name || item.display_name.split(",")[0]}
                      </Text>
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {item.display_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* ── Floating Map Action Buttons ── */}
          <View style={styles.floatingControlsContainer}>
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => webViewRef.current?.injectJavaScript("window.zoomIn(); true;")}
              accessibilityRole="button"
              accessibilityLabel="Zoom in map"
            >
              <Icon name="add" size={22} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => webViewRef.current?.injectJavaScript("window.zoomOut(); true;")}
              accessibilityRole="button"
              accessibilityLabel="Zoom out map"
            >
              <Icon name="remove" size={22} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.floatingButton, { marginTop: 8 }]}
              onPress={handleCenterOnPin}
              accessibilityRole="button"
              accessibilityLabel="Center map on pin"
            >
              <Icon name="my-location" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Bottom Details Card ── */}
        <View style={[styles.bottomCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.bottomCardHeader}>
            <View style={[styles.pinIconBadge, { backgroundColor: `${colors.primary}15` }]}>
              <Icon name="pin-drop" size={24} color={colors.primary} />
            </View>
            <View style={styles.locationDetailsBox}>
              <View style={styles.locationTitleRow}>
                <Text style={styles.locationTitle} numberOfLines={1}>
                  {selectedPlaceName}
                </Text>
                {isGeocoding && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />
                )}
              </View>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {selectedAddress || `${currentCoords.latitude.toFixed(5)}, ${currentCoords.longitude.toFixed(5)}`}
              </Text>
            </View>
          </View>

          {/* Coordinates Chip */}
          <View style={styles.coordChipRow}>
            <View style={styles.coordChip}>
              <Icon name="explore" size={12} color="#667085" style={{ marginRight: 4 }} />
              <Text style={styles.coordChipText}>
                {currentCoords.latitude.toFixed(5)}°, {currentCoords.longitude.toFixed(5)}°
              </Text>
            </View>
            <Text style={styles.hintText}>Tap or drag pin to adjust</Text>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Confirm pinned location"
          >
            <Icon name="check" size={20} color={colors.onPrimary || "#FFF"} style={{ marginRight: 6 }} />
            <Text style={[styles.confirmButtonText, { color: colors.onPrimary || "#FFF" }]}>
              Confirm Location
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
    paddingBottom: 8,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  headerButton: {
    padding: 8,
    marginRight: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F4F7",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#101828",
    paddingVertical: 0,
  },
  subHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  attributionBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  attributionText: {
    fontSize: 11,
    color: "#98A2B3",
  },
  destinationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: "60%",
  },
  destinationChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
    backgroundColor: "#E5E9EE",

    paddingBottom: 30,

  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
  },
  searchResultsContainer: {
    position: "absolute",
    top: 8,
    left: 12,
    right: 12,
    maxHeight: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  resultIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  resultTextBox: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#101828",
  },
  resultSubtitle: {
    fontSize: 11,
    color: "#667085",
    marginTop: 1,
  },
  floatingControlsContainer: {
    position: "absolute",
    right: 14,
    bottom: 50,
    alignItems: "center",
    zIndex: 10,
  },
  floatingButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },
  bottomCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    marginTop: -20,
  },
  bottomCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pinIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  locationDetailsBox: {
    flex: 1,
  },
  locationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#101828",
    flexShrink: 1,
  },
  locationAddress: {
    fontSize: 12,
    color: "#475467",
    marginTop: 2,
    lineHeight: 16,
  },
  coordChipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 14,
  },
  coordChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F4F7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coordChipText: {
    fontSize: 11,
    color: "#475467",
    fontWeight: "500",
  },
  hintText: {
    fontSize: 11,
    color: "#98A2B3",
    fontStyle: "italic",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default OsmMapPinModal;
