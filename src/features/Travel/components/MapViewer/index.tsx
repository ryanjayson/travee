import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StatusBar,
  Animated,
  Switch,
  FlatList,
  PanResponder,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import WebView from "react-native-webview";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Paths, File, Directory } from "expo-file-system";
import CountryOutline from "../ShareOverlay/CountryOutline";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";

interface MapMarker {
  id?: string;
  latitude: number;
  longitude: number;
  title: string;
  type?: string | number;
  sortOrder?: string;
  images?: Array<{ url: string }>;
}

type PinMode = "type" | "image";
type PinSize = "small" | "medium" | "large";
type MapStyle = "normal" | "satellite" | "hybrid";

interface MapViewerProps {
  visible: boolean;
  onClose: () => void;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  title: string;
  zoom?: number;
  markers?: MapMarker[];
  destination?: string;
  countryName?: string;
}

const IMG_DIR_NAME = "map-imgs";
const HTML_FILE_NAME = "map.html";

let imgCounter = 0;

const cacheImage = async (sourceUri: string): Promise<string | null> => {
  if (!sourceUri.startsWith("file://")) return null;
  const ext = (sourceUri.split(".").pop() || "jpg").split("?")[0].toLowerCase();
  const imgDir = new Directory(Paths.cache, IMG_DIR_NAME);
  if (!imgDir.exists) {
    imgDir.create({ intermediates: true });
  }

  const idx = imgCounter++;
  const destFile = new File(imgDir, `img_${idx}.${ext}`);
  if (destFile.exists) return destFile.uri;

  try {
    const sourceFile = new File(sourceUri);
    const base64 = await sourceFile.base64();
    destFile.write(base64, { encoding: "base64" });
    return destFile.uri;
  } catch {
    return null;
  }
};

const PIN_SIZE_MAP: Record<PinSize, { type: number; image: number; icon: number }> = {
  small: { type: 24, image: 28, icon: 16 },
  medium: { type: 32, image: 40, icon: 24 },
  large: { type: 42, image: 52, icon: 32 },
};

const MAP_STYLE_URLS: Record<MapStyle, string> = {
  normal: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  hybrid: "mapbox://styles/mapbox/satellite-streets-v12",
};

type DisplayMode = "map" | "overlay";

const MapViewer = ({
  visible,
  onClose,
  coordinates,
  title,
  zoom,
  markers,
  destination,
  countryName,
}: MapViewerProps) => {
  const [pinMode, setPinMode] = useState<PinMode>("type");
  const [pinSize, setPinSize] = useState<PinSize>("medium");
  const [mapType, setMapType] = useState<MapStyle>("normal");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("map");
  const [showLabels, setShowLabels] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [htmlUri, setHtmlUri] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [showActivityList, setShowActivityList] = useState(false);
  const panelAnim = useRef(new Animated.Value(0)).current;

  // ─── Image background state (must be before handlers that use it) ───────
  const [imageUri, setImageUri] = useState<string | null>(null);

  // ─── Independent pan/pinch for outline and image ────────────────────────
  const [activeLayer, setActiveLayer] = useState<"outline" | "image">("outline");
  const activeLayerRef = useRef(activeLayer);
  activeLayerRef.current = activeLayer;

  // Outline transforms
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const posRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const lastDist = useRef<number | null>(null);

  // Image transforms
  const imgTranslateX = useRef(new Animated.Value(0)).current;
  const imgTranslateY = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(1)).current;
  const imgPosRef = useRef({ x: 0, y: 0 });
  const imgScaleRef = useRef(1);
  const imgLastDist = useRef<number | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const layer = activeLayerRef.current;
        if (layer === "outline") {
          posRef.current = { x: (translateX as any)._value ?? 0, y: (translateY as any)._value ?? 0 };
        } else {
          imgPosRef.current = { x: (imgTranslateX as any)._value ?? 0, y: (imgTranslateY as any)._value ?? 0 };
        }
      },
      onPanResponderMove: (_, gs) => {
        const layer = activeLayerRef.current;
        if (layer === "outline") {
          translateX.setValue(posRef.current.x + gs.dx);
          translateY.setValue(posRef.current.y + gs.dy);
        } else {
          imgTranslateX.setValue(imgPosRef.current.x + gs.dx);
          imgTranslateY.setValue(imgPosRef.current.y + gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        const layer = activeLayerRef.current;
        if (layer === "outline") {
          posRef.current = { x: posRef.current.x + gs.dx, y: posRef.current.y + gs.dy };
        } else {
          imgPosRef.current = { x: imgPosRef.current.x + gs.dx, y: imgPosRef.current.y + gs.dy };
        }
      },
    })
  ).current;

  const handlePinchMove = useCallback((evt: any) => {
    const touches = evt.nativeEvent.touches;
    if (touches.length !== 2) return;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const layer = activeLayerRef.current;

    if (layer === "outline") {
      if (lastDist.current !== null) {
        const ratio = dist / lastDist.current;
        scaleRef.current = Math.max(0.3, Math.min(scaleRef.current * ratio, 5));
        scale.setValue(scaleRef.current);
      }
      lastDist.current = dist;
    } else if (imageUri) {
      if (imgLastDist.current !== null) {
        const ratio = dist / imgLastDist.current;
        imgScaleRef.current = Math.max(0.3, Math.min(imgScaleRef.current * ratio, 5));
        imgScale.setValue(imgScaleRef.current);
      }
      imgLastDist.current = dist;
    }
  }, [imageUri]);

  const handlePinchEnd = useCallback(() => {
    lastDist.current = null;
    imgLastDist.current = null;
  }, []);

  const handleResetLayer = useCallback(() => {
    const layer = activeLayerRef.current;
    if (layer === "outline") {
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start(() => {
        posRef.current = { x: 0, y: 0 };
        scaleRef.current = 1;
      });
    } else if (imageUri) {
      Animated.parallel([
        Animated.spring(imgTranslateX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(imgTranslateY, { toValue: 0, useNativeDriver: true }),
        Animated.spring(imgScale, { toValue: 1, useNativeDriver: true }),
      ]).start(() => {
        imgPosRef.current = { x: 0, y: 0 };
        imgScaleRef.current = 1;
      });
    }
  }, [imageUri]);

  const handlePickImage = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow access to your photo library.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error("[MapViewer] pickImage error:", e);
    }
  }, []);

  useEffect(() => {
    Animated.timing(panelAnim, {
      toValue: settingsExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [settingsExpanded, panelAnim]);

  // Stable content-based keys — only change when actual data changes
  const settingsKey = JSON.stringify({ pinMode, pinSize, mapType, showLabels, displayMode, countryName, zoom });
  const coordKey = coordinates ? `${coordinates.latitude},${coordinates.longitude}` : "";
  const markersKey = useMemo(
    () => markers?.map((m) => `${m.id || ""}-${m.latitude}-${m.longitude}`).join("|") || "",
    [markers],
  );

  // Outline activities for CountryOutline in overlay mode
  const outlineActivities = useMemo(
    () =>
      markers
        ?.filter(
          (m) =>
            (!m.id || visibleIds.has(m.id)) &&
            m.latitude !== 0 &&
            m.longitude !== 0,
        )
        .map((m) => ({
          lat: m.latitude,
          lng: m.longitude,
          type: typeof m.type === "number" ? m.type : undefined,
          title: m.title,
        })) || [],
    [markersKey, visibleIds],
  );

  // Initialize visibleIds: runs once on mount, then whenever marker IDs change
  useEffect(() => {
    if (!visible || !markers?.some((m) => m.id)) return;
    setVisibleIds((prev) => {
      const next = new Set(prev);
      let changed = prev.size === 0; // always populate on first run
      markers.forEach((m) => {
        if (m.id && !prev.has(m.id)) {
          next.add(m.id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [visible, markersKey]);

  // Build effect: only for map mode
  useEffect(() => {
    if (!visible || displayMode !== "map") return;
    if (visibleIds.size === 0 && markers?.some((m) => m.id)) return;
    imgCounter = 0;

    const filtered = markers?.filter((m) => !m.id || visibleIds.has(m.id));
    buildHtml(filtered, { pinMode, pinSize, mapType, showLabels, displayMode, countryName }, coordinates, zoom)
      .then((uri) => {
        setHtmlUri(uri);
        setRenderKey((k) => k + 1);
      });
  }, [settingsKey, visibleIds, coordKey, markersKey, visible, displayMode]);

  const panelHeight = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 420],
  });

  const panelOpacity = panelAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const activeSettingsCount = (showLabels ? 1 : 0) + (displayMode === "overlay" ? 1 : 0);

  const SegmentedControl = <T extends string>({
    options,
    value,
    onChange,
  }: {
    options: T[];
    value: T;
    onChange: (v: T) => void;
  }) => (
    <View className="flex-row bg-gray-100 rounded-xl p-0.5">
      {options.map((opt) => {
        const label = opt === "small" ? "S" : opt === "medium" ? "M" : opt === "large" ? "L" : opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            className={`flex-1 py-2 rounded-xl items-center ${value === opt ? "bg-white shadow-sm" : ""}`}
            accessibilityRole="button"
          >
            <Text className={`text-xs font-semibold ${value === opt ? "text-[#0C4C8A]" : "text-gray-500"}`}>
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />

        <View className="flex-1">
          <TouchableOpacity onPress={onClose} className="absolute top-[40px] left-5 z-50">
            <Icon name="close" size={32} color="#555" />
          </TouchableOpacity>

          {displayMode === "map" ? (
            htmlUri && (
              <WebView
                key={renderKey}
                source={{ uri: htmlUri }}
                javaScriptEnabled
                domStorageEnabled
                allowFileAccess
                allowFileAccessFromFileURLs
                allowUniversalAccessFromFileURLs
                mixedContentMode="always"
                originWhitelist={["*"]}
                scrollEnabled={false}
                style={{ flex: 1 }}
              />
            )
          ) : (
            <View className="flex-1 bg-[#0C2A5A]">
              {/* Top buttons */}
              <View className="absolute top-[40px] right-5 z-50 flex-row gap-2">
                {imageUri && (
                  <TouchableOpacity
                    onPress={() => { setImageUri(null); if (activeLayer === "image") setActiveLayer("outline"); }}
                    className="w-9 h-9 rounded-full bg-white/20 items-center justify-center"
                    accessibilityRole="button"
                  >
                    <Icon name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handlePickImage}
                  className="w-9 h-9 rounded-full bg-white/20 items-center justify-center"
                  accessibilityRole="button"
                >
                  <Icon name={(imageUri ? "image" : "image-outline") as any} size={20} color={imageUri ? "#7EC8F8" : "#FFF"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResetLayer}
                  className="w-9 h-9 rounded-full bg-white/20 items-center justify-center"
                  accessibilityRole="button"
                >
                  <Icon name="refresh" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Layer selector */}
              <View className="absolute top-[40px] left-5 z-50 flex-row bg-black/30 rounded-xl p-0.5">
                <TouchableOpacity
                  onPress={() => setActiveLayer("outline")}
                  className={`px-3 py-1.5 rounded-xl ${activeLayer === "outline" ? "bg-white/30" : ""}`}
                  accessibilityRole="button"
                >
                  <Text className={`text-xs font-semibold ${activeLayer === "outline" ? "text-white" : "text-white/60"}`}>Outline</Text>
                </TouchableOpacity>
                {imageUri && (
                  <TouchableOpacity
                    onPress={() => setActiveLayer("image")}
                    className={`px-3 py-1.5 rounded-xl ${activeLayer === "image" ? "bg-white/30" : ""}`}
                    accessibilityRole="button"
                  >
                    <Text className={`text-xs font-semibold ${activeLayer === "image" ? "text-white" : "text-white/60"}`}>Image</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Touch surface with pan/pinch */}
              <View
                className="flex-1"
                onTouchMove={handlePinchMove}
                onTouchEnd={handlePinchEnd}
                {...panResponder.panHandlers}
              >
                {/* Image layer (behind outline) */}
                {imageUri && (
                  <Animated.View
                    className="absolute inset-0"
                    style={{
                      transform: [
                        { translateX: imgTranslateX },
                        { translateY: imgTranslateY },
                        { scale: imgScale },
                      ],
                    }}
                    pointerEvents="none"
                  >
                    <Image
                      source={{ uri: imageUri }}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                  </Animated.View>
                )}

                {/* Outline layer */}
                <Animated.View
                  className="flex-1"
                  style={{
                    transform: [{ translateX }, { translateY }, { scale }],
                  }}
                  pointerEvents="none"
                >
                  <CountryOutline
                    countryName={countryName || ""}
                    width={Dimensions.get("window").width}
                    height={Dimensions.get("window").height * 0.7}
                    strokeColor="#ffffff"
                    strokeWidth={2}
                    doneActivities={outlineActivities}
                    pinSize={pinSize}
                    showLabels={showLabels}
                  />
                </Animated.View>
              </View>

              <View className="absolute bottom-0 left-0 right-0 h-24 bg-black/30" />
            </View>
          )}
        </View>

        {/* Floating bottom toolbar */}
        <View className="absolute bottom-5 left-5 right-5 items-center" pointerEvents="box-none">
          {settingsExpanded ? (
            <Animated.View
              className="bg-white rounded-2xl shadow-lg mx-4 overflow-hidden w-full"
              style={{
                maxHeight: panelHeight,
                opacity: panelOpacity,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <View className="px-5 pt-4 pb-3">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-base font-semibold text-gray-800">Settings</Text>
                  <TouchableOpacity onPress={() => setSettingsExpanded(false)} accessibilityRole="button">
                    <Icon name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Filter Activities button */}
                <TouchableOpacity
                  onPress={() => setShowActivityList(true)}
                  className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-3"
                  accessibilityRole="button"
                >
                  <View className="flex-row items-center gap-2">
                    <Icon name="visibility" size={20} color="#0C4C8A" />
                    <Text className="text-sm font-medium text-gray-800">Filter Activities</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-xs text-gray-500">
                      {markers?.filter((m) => m.id).length || 0} activities
                    </Text>
                    <Icon name="chevron-right" size={18} color="#999" />
                  </View>
                </TouchableOpacity>

                {/* Pin Style — one-liner */}
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 font-medium mb-1.5">Pin Style</Text>
                  <SegmentedControl options={["type", "image"] as PinMode[]} value={pinMode} onChange={(v) => setPinMode(v as PinMode)} />
                </View>

                {/* Pin Size */}
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 font-medium mb-1.5">Pin Size</Text>
                  <SegmentedControl options={["small", "medium", "large"] as PinSize[]} value={pinSize} onChange={(v) => setPinSize(v as PinSize)} />
                </View>

                {/* Map Type */}
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 font-medium mb-1.5">Map Type</Text>
                  <SegmentedControl options={["normal", "satellite", "hybrid"] as MapStyle[]} value={mapType} onChange={(v) => setMapType(v as MapStyle)} />
                </View>

                {/* View mode */}
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 font-medium mb-1.5">View</Text>
                  <SegmentedControl options={["map", "overlay"] as DisplayMode[]} value={displayMode} onChange={(v) => setDisplayMode(v as DisplayMode)} />
                </View>

                {/* Toggles */}
                <View className="border-t border-gray-100 pt-3">
                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-sm text-gray-700">Show Labels</Text>
                    <Switch
                      value={showLabels}
                      onValueChange={setShowLabels}
                      trackColor={{ false: "#E0E0E0", true: "#0C4C8A" }}
                      thumbColor="#FFF"
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
          ) : (
            <TouchableOpacity
              onPress={() => setSettingsExpanded(true)}
              className="bg-white rounded-full px-5 py-3 flex-row items-center gap-2 shadow-lg self-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 6,
              }}
              accessibilityRole="button"
            >
              <View className="w-7 h-7 rounded-full bg-[#dc3545] items-center justify-center">
                <Icon name="settings" size={16} color="#FFF" />
              </View>
              <Text className="text-sm font-medium text-gray-800">
                {pinMode === "type" ? "Type" : "Image"} · {pinSize === "small" ? "S" : pinSize === "medium" ? "M" : "L"} · {displayMode === "map" ? "Map" : "Overlay"}
              </Text>
              {activeSettingsCount > 0 && (
                <View className="bg-[#0C4C8A] rounded-full px-1.5 py-0.5 min-w-[18px] items-center">
                  <Text className="text-[10px] font-bold text-white">{activeSettingsCount}</Text>
                </View>
              )}
              <Icon name="keyboard-arrow-up" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Activity list modal */}
        <Modal
          visible={showActivityList}
          transparent
          animationType="slide"
          onRequestClose={() => setShowActivityList(false)}
        >
          <View className="flex-1 bg-white mt-20 rounded-t-[30px]">
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-800">Filter Activities</Text>
              <TouchableOpacity onPress={() => setShowActivityList(false)} accessibilityRole="button">
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Select All / Deselect All */}
            <View className="flex-row gap-4 px-5 py-3 border-b border-gray-100">
              <TouchableOpacity
                onPress={() => {
                  const ids = markers?.filter((m) => m.id).map((m) => m.id!);
                  if (ids) setVisibleIds(new Set(ids));
                }}
                className="flex-row items-center gap-1.5"
                accessibilityRole="button"
              >
                <Icon name="check-box" size={20} color="#0C4C8A" />
                <Text className="text-sm font-medium text-[#0C4C8A]">Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const ids = markers?.filter((m) => m.id).map((m) => m.id!);
                  if (ids) setVisibleIds(new Set());
                }}
                className="flex-row items-center gap-1.5"
                accessibilityRole="button"
              >
                <Icon name="check-box-outline-blank" size={20} color="#666" />
                <Text className="text-sm font-medium text-gray-500">Deselect All</Text>
              </TouchableOpacity>
              {markers && (
                <Text className="text-xs text-gray-400 self-center ml-auto">
                  {visibleIds.size}/{markers.filter((m) => m.id).length}
                </Text>
              )}
            </View>

            <FlatList
              data={markers?.filter((m) => m.id) || []}
              keyExtractor={(item) => item.id!}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => {
                const checked = item.id ? visibleIds.has(item.id) : true;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (!item.id) return;
                      setVisibleIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(item.id!)) {
                          next.delete(item.id!);
                        } else {
                          next.add(item.id!);
                        }
                        return next;
                      });
                    }}
                    className="flex-row items-center gap-3 px-5 py-4 border-b border-gray-50"
                    accessibilityRole="button"
                  >
                    <Icon
                      name={checked ? "check-box" : "check-box-outline-blank"}
                      size={22}
                      color={checked ? "#0C4C8A" : "#ccc"}
                    />
                    <View className="flex-1">
                      <Text className={`text-sm ${checked ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                        {item.title}
                      </Text>
                    </View>
                    {item.type != null && (
                      <View className="w-6 h-6 rounded-full bg-[#dc3545] items-center justify-center">
                        <Icon name="location-on" size={14} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

async function buildHtml(
  markers: MapMarker[] | undefined,
  opts: { pinMode: PinMode; pinSize: PinSize; mapType: MapStyle; showLabels: boolean; displayMode: DisplayMode; countryName?: string },
  coordinates?: { latitude: number; longitude: number },
  zoom?: number,
): Promise<string> {
  let processedMarkers = markers;

  if (opts.pinMode === "image" && markers) {
    processedMarkers = await Promise.all(
      markers.map(async (m) => {
        if (!m.images || m.images.length === 0) return m;
        const imgs = (await Promise.all(
          m.images.map(async (img) => {
            if (img.url.startsWith("file://") || img.url.startsWith("data:")) {
              const cached = await cacheImage(img.url);
              if (cached) return { ...img, url: cached };
            }
            return null;
          })
        )).filter(Boolean) as Array<{ url: string }>;
        return { ...m, images: imgs.length > 0 ? imgs : undefined };
      })
    );
  }

  const html = generateMapHtml(processedMarkers, coordinates, zoom, opts);
  const htmlFile = new File(Paths.cache, HTML_FILE_NAME);
  htmlFile.write(html);
  return htmlFile.uri;
}

function generateMapHtml(
  markers: MapMarker[] | undefined,
  coordinates: { latitude: number; longitude: number } | undefined,
  zoom: number | undefined,
  opts: { pinMode: PinMode; pinSize: PinSize; mapType: MapStyle; showLabels: boolean; displayMode: DisplayMode; countryName?: string },
): string {
  const sizes = PIN_SIZE_MAP[opts.pinSize];
  const mapStyleUrl = MAP_STYLE_URLS[opts.mapType];
  const centerLat = (markers?.[0] || coordinates)?.latitude || 0;
  const centerLng = (markers?.[0] || coordinates)?.longitude || 0;
  const hasCoords = !!coordinates;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"></script>
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; }
    #map { width: 100%; height: 100vh; }
    .marker-wrapper {
      display: flex; flex-direction: column; align-items: center;
      cursor: pointer;
    }
    .custom-marker {
      width: ${sizes.type}px; height: ${sizes.type}px; border-radius: 50%;
      background: #dc3545; display: flex;
      align-items: center; justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .custom-marker ion-icon, .custom-marker .material-icons {
      font-size: ${sizes.icon}px; color: #FFF;
    }
    .image-marker {
      width: ${sizes.image}px; height: ${sizes.image}px; border-radius: 50%;
      overflow: hidden;
      box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      border: 2px solid #fff;
      background-size: cover; background-position: center;
      background-repeat: no-repeat;
    }
    .marker-label {
      background: rgba(255,255,255,0.95);
      padding: 3px 10px; border-radius: 12px;
      font-size: 12px; font-weight: 600; color: #333;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      margin-top: 4px;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function getIconHTML(type) {
      switch(Number(type)) {
        case 1: return '<ion-icon name="airplane"></ion-icon>';
        case 2: return '<ion-icon name="bag-check"></ion-icon>';
        case 3: return '<ion-icon name="bag-remove"></ion-icon>';
        case 4: return '<i class="material-icons">local_taxi</i>';
        case 5: return '<ion-icon name="glasses"></ion-icon>';
        case 6: return '<i class="material-icons">shopping_cart</i>';
        case 7: return '<i class="material-icons">local_cafe</i>';
        case 8: return '<i class="material-icons">restaurant</i>';
        case 9: return '<ion-icon name="walk"></ion-icon>';
        case 10: return '<i class="material-icons">build</i>';
        case 11: return '<i class="material-icons">directions_car</i>';
        case 12: return '<i class="material-icons">hotel</i>';
        default: return '<ion-icon name="location-outline"></ion-icon>';
      }
    }

    mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';
    const map = new mapboxgl.Map({
      container: 'map',
      style: '${mapStyleUrl}',
      center: [${centerLng}, ${centerLat}],
      zoom: ${zoom || 6},
      attributionControl: false,
    });

    const renderedMarkers = ${JSON.stringify(markers || [])};
    const showLabels = ${opts.showLabels};

    map.on('load', function() {

      if (renderedMarkers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        renderedMarkers.forEach(m => {
          const wrapper = document.createElement('div');
          wrapper.className = 'marker-wrapper';

          const icon = document.createElement('div');
          const useImage = ${opts.pinMode === 'image'} && m.images && m.images.length > 0 && m.images[0].url;
          if (useImage) {
            icon.className = 'image-marker';
            icon.style.backgroundImage = 'url("' + m.images[0].url + '")';
          } else {
            icon.className = 'custom-marker';
            icon.innerHTML = getIconHTML(m.type);
          }
          wrapper.appendChild(icon);

          if (showLabels && m.title) {
            const label = document.createElement('div');
            label.className = 'marker-label';
            label.textContent = m.title;
            wrapper.appendChild(label);
          }

          new mapboxgl.Marker(wrapper)
            .setLngLat([m.longitude, m.latitude])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>' + m.title + '</h3>'))
            .addTo(map);
          bounds.extend([m.longitude, m.latitude]);
        });

        if (renderedMarkers.length > 1) {
          map.fitBounds(bounds, { padding: 50, linear: true });
        } else {
          map.setCenter([renderedMarkers[0].longitude, renderedMarkers[0].latitude]);
          map.setZoom(${zoom || 14});
        }
      } else if (${hasCoords}) {
        new mapboxgl.Marker({ color: '#0C4C8A' })
          .setLngLat([${coordinates?.longitude || 0}, ${coordinates?.latitude || 0}])
          .addTo(map);
        map.setCenter([${coordinates?.longitude || 0}, ${coordinates?.latitude || 0}]);
        map.setZoom(${zoom || 14});
      }
    });
  </script>
</body>
</html>`;
}

export default MapViewer;
