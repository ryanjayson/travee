import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
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
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import WebView from "react-native-webview";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { MaterialIcons as Icon, Ionicons } from "@expo/vector-icons";
import { Paths, File, Directory } from "expo-file-system";
import CountryOutline, { DoneActivity, ActivityPoint } from "../ShareOverlay/CountryOutline";
import Svg, { Line, Circle } from "react-native-svg";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";
import { Divider } from "react-native-paper";

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
  dateRange?: string;
  doneActivities?: DoneActivity[];
  inline?: boolean;
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
  small: { type: 24, image: 32, icon: 16 },
  medium: { type: 32, image: 50, icon: 24 },
  large: { type: 42, image: 100, icon: 32 },
};

const MAP_STYLE_URLS: Record<MapStyle, string> = {
  normal: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  hybrid: "mapbox://styles/mapbox/satellite-streets-v12",
};

const ACTIVITY_EMOJI: Record<number, string> = {
  1: "✈", 2: "⬆", 3: "⬇", 4: "🚕",
  5: "☕", 6: "🍽", 7: "🚶", 8: "📷",
  9: "🛍", 10: "🧳", 11: "🚲", 12: "🛏",
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
  dateRange,
  doneActivities: doneActivitiesProp,
  inline = false,
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
  const [textDragging, setTextDragging] = useState(false);
  const [darkOverlay, setDarkOverlay] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [editableTitle, setEditableTitle] = useState(title);
  const [showDestination, setShowDestination] = useState(true);
  const [showDateRange, setShowDateRange] = useState(true);
  const [titleFontSize, setTitleFontSize] = useState(28);
  const [titleLineHeight, setTitleLineHeight] = useState(34);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  useEffect(() => { setEditableTitle(title); }, [title]);
  const textDragOpacity = useRef(new Animated.Value(1)).current;
  const textDragScale = useRef(new Animated.Value(1)).current;
  const viewShotRef = useRef<ViewShot>(null);
  const webViewRef = useRef<WebView>(null);
  const captureResolveRef = useRef<((uri: string) => void) | null>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const mapOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = mapOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  // ─── Image background state (must be before handlers that use it) ───────
  const [imageUri, setImageUri] = useState<string | null>(null);

  // ─── Independent pan/pinch for outline and image ────────────────────────
  const [activeLayer, setActiveLayer] = useState<"outline" | "image">("outline");
  const activeLayerRef = useRef(activeLayer);
  activeLayerRef.current = activeLayer;

  // ─── Move-pin mode: freeze everything except pins/images ─────────────────
  const [movePinMode, setMovePinMode] = useState(false);
  const movePinModeRef = useRef(false);
  movePinModeRef.current = movePinMode;

  const [mapMoving, setMapMoving] = useState(false);

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

  // ─── Draggable pins ────────────────────────────────────────────────────
  const PIN_HIT_RADIUS = 22;
  const [activityPoints, setActivityPoints] = useState<ActivityPoint[]>([]);
  const [pinOffsets, setPinOffsets] = useState<{dx: number; dy: number}[]>([]);
  const pinOffsetsRef = useRef<{dx: number; dy: number}[]>([]);
  pinOffsetsRef.current = pinOffsets;
  const pinAnchorRef = useRef<{dx: number; dy: number}>({dx: 0, dy: 0});
  const activePinIdxRef = useRef<number | null>(null);
  const [dragLine, setDragLine] = useState<{from: {x: number; y: number}; to: {x: number; y: number}} | null>(null);
  const [imgDragLine, setImgDragLine] = useState<{from: {x: number; y: number}; to: {x: number; y: number}} | null>(null);

  // Animated values per pin for smooth drag + spring-on-release
  const pinAnimValues = useRef<{x: Animated.Value; y: Animated.Value}[]>([]);

  // "Committed" offsets — only updated on release (avoids re-rendering SVG on every drag frame)
  const [committedOffsets, setCommittedOffsets] = useState<{dx: number; dy: number}[]>([]);

  // Preserve pin offsets + Animated values when activity points change
  useEffect(() => {
    setPinOffsets(prev => {
      if (prev.length === 0) return activityPoints.map(() => ({dx: 0, dy: 0}));
      return activityPoints.map((_, i) => prev[i] || {dx: 0, dy: 0});
    });
    setCommittedOffsets(prev => {
      if (prev.length === 0) return activityPoints.map(() => ({dx: 0, dy: 0}));
      return activityPoints.map((_, i) => prev[i] || {dx: 0, dy: 0});
    });
    pinAnimValues.current = activityPoints.map(
      (_, i) => pinAnimValues.current[i] || {x: new Animated.Value(0), y: new Animated.Value(0)},
    );
  }, [activityPoints]);

  const hiddenActivityIndices = useMemo(
    () =>
      committedOffsets.reduce((acc, o, i) => {
        if (o.dx !== 0 || o.dy !== 0) acc.push(i);
        return acc;
      }, [] as number[]),
    [committedOffsets],
  );

  const pinTargetsPan = useMemo(
    () =>
      activityPoints.map((pt, idx) => {
        return PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            activePinIdxRef.current = idx;
            const anim = pinAnimValues.current[idx];
            const x = (anim?.x as any)._value ?? 0;
            const y = (anim?.y as any)._value ?? 0;
            pinAnchorRef.current = {dx: x, dy: y};
          },
          onPanResponderMove: (_, gs) => {
            const a = pinAnchorRef.current;
            const x = a.dx + gs.dx;
            const y = a.dy + gs.dy;
            const anim = pinAnimValues.current[idx];
            if (anim) {
              anim.x.setValue(x);
              anim.y.setValue(y);
            }
            setPinOffsets(prev => {
              const next = [...prev];
              next[idx] = {dx: x, dy: y};
              return next;
            });
            setDragLine({
              from: {x: pt.x, y: pt.y},
              to: {x: pt.x + x, y: pt.y + y},
            });
          },
          onPanResponderRelease: (_, gs) => {
            const a = pinAnchorRef.current;
            const targetX = a.dx + gs.dx;
            const targetY = a.dy + gs.dy;
            const anim = pinAnimValues.current[idx];
            if (anim) {
              Animated.spring(anim.x, { toValue: targetX, useNativeDriver: true, friction: 7 }).start();
              Animated.spring(anim.y, { toValue: targetY, useNativeDriver: true, friction: 7 }).start();
            }
            setPinOffsets(prev => {
              const next = [...prev];
              next[idx] = {dx: targetX, dy: targetY};
              return next;
            });
            setCommittedOffsets(prev => {
              const next = [...prev];
              next[idx] = {dx: targetX, dy: targetY};
              return next;
            });
            activePinIdxRef.current = null;
            setDragLine(null);
          },
        });
      }),
    [activityPoints],
  );

  // ─── Draggable trip info block ──────────────────────────────────────────
  const textTranslateX = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(0)).current;
  const textPosRef = useRef({ x: 0, y: 0 });

  const textPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !movePinModeRef.current,
      onMoveShouldSetPanResponder: () => !movePinModeRef.current,
      onPanResponderGrant: () => {
        setTextDragging(true);
        Animated.parallel([
          Animated.spring(textDragOpacity, { toValue: 0.5, useNativeDriver: true }),
          Animated.spring(textDragScale, { toValue: 0.97, useNativeDriver: true }),
        ]).start();
        textPosRef.current = { x: (textTranslateX as any)._value ?? 0, y: (textTranslateY as any)._value ?? 0 };
      },
      onPanResponderMove: (_, gs) => {
        textTranslateX.setValue(textPosRef.current.x + gs.dx);
        textTranslateY.setValue(textPosRef.current.y + gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        setTextDragging(false);
        Animated.parallel([
          Animated.spring(textDragOpacity, { toValue: 1, useNativeDriver: true }),
          Animated.spring(textDragScale, { toValue: 1, useNativeDriver: true }),
        ]).start();
        textPosRef.current = { x: textPosRef.current.x + gs.dx, y: textPosRef.current.y + gs.dy };
      },
    })
  ).current;

  // ─── Top activity emoji chips ────────────────────────────────────────────
  const topActivityTypes = useMemo(() => {
    const source = doneActivitiesProp || [];
    if (!source.length) return [];
    const counts: Record<number, number> = {};
    source.forEach((a) => {
      const t = a.type ?? 0;
      if (t === 0) return;
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([typeStr]) => parseInt(typeStr, 10));
  }, [doneActivitiesProp]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        if (movePinModeRef.current && activeLayerRef.current === "outline") return false;
        return activePinIdxRef.current === null;
      },
      onMoveShouldSetPanResponder: () => {
        if (movePinModeRef.current && activeLayerRef.current === "outline") return false;
        return activePinIdxRef.current === null;
      },
      onPanResponderGrant: () => {
        if (activePinIdxRef.current !== null) return;
        if (movePinModeRef.current && activeLayerRef.current === "outline") return;
        const layer = activeLayerRef.current;
        if (layer === "outline") {
          posRef.current = { x: (translateX as any)._value ?? 0, y: (translateY as any)._value ?? 0 };
        } else {
          imgPosRef.current = { x: (imgTranslateX as any)._value ?? 0, y: (imgTranslateY as any)._value ?? 0 };
        }
        setImgDragLine(null);
      },
      onPanResponderMove: (_, gs) => {
        if (activePinIdxRef.current !== null) return;
        if (movePinModeRef.current && activeLayerRef.current === "outline") return;
        const layer = activeLayerRef.current;
        if (layer === "outline") {
          translateX.setValue(posRef.current.x + gs.dx);
          translateY.setValue(posRef.current.y + gs.dy);
        } else {
          imgTranslateX.setValue(imgPosRef.current.x + gs.dx);
          imgTranslateY.setValue(imgPosRef.current.y + gs.dy);
          const cx = Dimensions.get("window").width / 2;
          const cy = Dimensions.get("window").height * 0.35;
          const ox = imgPosRef.current.x + gs.dx;
          const oy = imgPosRef.current.y + gs.dy;
          setImgDragLine({
            from: { x: cx, y: cy },
            to: { x: cx + ox, y: cy + oy },
          });
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (activePinIdxRef.current !== null) return;
        if (movePinModeRef.current && activeLayerRef.current === "outline") return;
        const layer = activeLayerRef.current;
        if (layer === "outline") {
          posRef.current = { x: posRef.current.x + gs.dx, y: posRef.current.y + gs.dy };
        } else {
          imgPosRef.current = { x: imgPosRef.current.x + gs.dx, y: imgPosRef.current.y + gs.dy };
        }
        setImgDragLine(null);
      },
    })
  ).current;

  const handlePinchMove = useCallback((evt: any) => {
    if (activePinIdxRef.current !== null) return;
    if (movePinModeRef.current) return;
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
    if (activePinIdxRef.current !== null) return;
    lastDist.current = null;
    imgLastDist.current = null;
  }, []);

  const handleResetLayer = useCallback(() => {
    setImageUri(null);
    setDragLine(null);
    setImgDragLine(null);
    setPinOffsets(prev => prev.map(() => ({dx: 0, dy: 0})));
    setCommittedOffsets(prev => prev.map(() => ({dx: 0, dy: 0})));
    pinAnimValues.current.forEach(anim => {
      Animated.spring(anim.x, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
      Animated.spring(anim.y, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
    });
    Animated.spring(textTranslateX, { toValue: 0, useNativeDriver: true }).start();
    Animated.spring(textTranslateY, { toValue: 0, useNativeDriver: true }).start(() => {
      textPosRef.current = { x: 0, y: 0 };
    });

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

  const buildStaticMapUrl = useCallback(() => {
    const allMarkers = markers || [];
    const center = coordinates ? `${coordinates.longitude},${coordinates.latitude},${zoom || 6}` : "";
    const pinSizeCode = pinSize === "small" ? "s" : pinSize === "medium" ? "m" : "l";
    const mapStyle = mapType === "normal" ? "streets-v12" : mapType === "satellite" ? "satellite-v9" : "satellite-streets-v12";

    let pins = "";
    if (allMarkers.length > 0) {
      pins = allMarkers
        .filter((m) => !m.id || visibleIds.has(m.id))
        .map((m) => `pin-${pinSizeCode}+dc3545(${m.longitude},${m.latitude})`)
        .join(",") + "/";
    }

    let path = "";
    const sorted = [...allMarkers].filter((m) => m.sortOrder).sort((a, b) =>
      (a.sortOrder || "").localeCompare(b.sortOrder || "")
    );
    if (sorted.length > 1) {
      const coords = sorted.map((a) => `${a.longitude},${a.latitude}`).join(";");
      path = `/path-3+dc3545-0.5(${coords})`;
    }

    const centerPart = center ? `${center}/` : "auto/";
    return `https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/static/${pins}${path}/${centerPart}600x400@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;
  }, [markers, pinSize, mapType, visibleIds, coordinates, zoom]);

  const captureMapImage = useCallback(async (): Promise<string | null> => {
    try {
      if (displayMode === "overlay") {
        const capOpts: any = { format: "png", quality: 1.0 };
        if (imageUri) {
          const { width, height } = Dimensions.get("window");
          capOpts.width = Math.round(width * 2);
          capOpts.height = Math.round(height * 2);
        }
        const uri = await (viewShotRef.current as any)?.capture?.(capOpts);
        return uri || null;
      }

      // Map mode: inject JS into WebView to capture the Mapbox GL canvas
      const canvasUri = await new Promise<string | null>((resolve) => {
        captureResolveRef.current = resolve;
        const tripTitle = JSON.stringify(editableTitle ?? "");
        const tripDest = JSON.stringify(showDestination ? (destination ?? "") : "");
        const tripDate = JSON.stringify(showDateRange ? (dateRange ?? "") : "");
        const tripTypes = JSON.stringify(topActivityTypes);
        const tripFontSize = titleFontSize;
        const tripLineHeight = titleLineHeight;
        const tripAlign = JSON.stringify(textAlign);
        const textX = (textTranslateX as any)._value ?? 0;
        const textY = (textTranslateY as any)._value ?? 0;
        webViewRef.current?.injectJavaScript(
          `window.__captureMap__ && window.__captureMap__(${tripTitle}, ${tripDest}, ${tripDate}, ${tripTypes}, ${textX}, ${textY}, ${tripFontSize}, ${tripAlign}, ${tripLineHeight})`
        );
        setTimeout(() => {
          if (captureResolveRef.current) {
            captureResolveRef.current = null;
            resolve(null);
          }
        }, 8000);
      });
      if (canvasUri) return canvasUri;

      // Fallback: static Mapbox API (server-rendered map with pins)
      const staticUrl = buildStaticMapUrl();
      if (staticUrl) {
        const imgFile = await File.downloadFileAsync(staticUrl, Paths.cache);
        return imgFile.uri;
      }
    } catch (e) {
      console.error("[MapViewer] capture failed:", e);
    }
    return null;
  }, [displayMode, buildStaticMapUrl, editableTitle, showDestination, showDateRange, destination, dateRange, topActivityTypes, titleFontSize, titleLineHeight, textAlign, imageUri, textTranslateX, textTranslateY]);

  const handleCaptureAndShare = useCallback(async () => {
    setIsCapturing(true);
    try {
      const uri = await captureMapImage();
      if (!uri) {
        Alert.alert("Unable to capture", "Could not generate map image. Try switching to overlay view.");
        return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: `Share ${title}` });
      } else {
        Alert.alert("Sharing not available", "Your device does not support sharing.");
      }
    } catch (e) {
      console.error("[MapViewer] capture error:", e);
      Alert.alert("Error", "Failed to capture image.");
    } finally {
      setIsCapturing(false);
    }
  }, [title, captureMapImage]);

  const handleCaptureAndSave = useCallback(async () => {
    setSaveLoading(true);
    try {
      const uri = await captureMapImage();
      if (!uri) {
        Alert.alert("Unable to save", "Could not generate map image. Try switching to overlay view.");
        return;
      }
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow access to save photos to your gallery.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Saved!", "PNG saved to your photo library.");
    } catch (e) {
      console.error("[MapViewer] save error:", e);
      Alert.alert("Error", "Failed to save image.");
    } finally {
      setSaveLoading(false);
    }
  }, [captureMapImage]);

  const handleCloseSettings = useCallback(() => {
    if (!editableTitle.trim()) setEditableTitle(title);
    setSettingsExpanded(false);
  }, [editableTitle, title]);

  const handleMessage = useCallback(async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      if (msg.type === "markerPositions") {
        if (msg.positions) {
          console.log("[MapViewer] received marker positions:", msg.positions.length);
          setActivityPoints(msg.positions);
        }
        if (msg.error) {
          console.warn("[MapViewer] markerPositions error:", msg.error);
        }
        return;
      }

      if (msg.type === "_mapReady") {
        setMapReady(true);
        return;
      }

      if (msg.type === "mapMoveStart") {
        setMapMoving(true);
        return;
      }

      if (msg.type === "mapMoveEnd") {
        setMapMoving(false);
        if (movePinModeRef.current) {
          requestMarkerPositionsRef.current();
        }
        return;
      }

      if (msg.type !== "__map_capture__" || !captureResolveRef.current) return;

      const resolve = captureResolveRef.current;
      captureResolveRef.current = null;

      if (!msg.data) {
        resolve("");
        return;
      }

      const base64 = msg.data.split(",")[1];
      if (!base64) {
        resolve("");
        return;
      }

      try {
        const captureFile = new File(Paths.cache, "map_capture_" + Date.now() + ".png");
        await captureFile.write(base64, { encoding: "base64" });
        resolve(captureFile.uri);
      } catch {
        resolve("");
      }
    } catch (e) {
      console.error("[MapViewer] message error:", e);
    }
  }, []);

  useEffect(() => {
    return () => {
      captureResolveRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapReady) {
      Animated.timing(mapOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      mapOpacity.setValue(0);
    }
  }, [mapReady, mapOpacity]);

  useEffect(() => {
    Animated.timing(panelAnim, {
      toValue: settingsExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [settingsExpanded, panelAnim]);

  // Request marker pixel positions from WebView when move-pin mode activates in map view
  const requestMarkerPositions = useCallback(() => {
    if (!webViewRef.current || displayMode !== "map") return;
    const mapViewMarkers = markers || [];
    const js = `
      (function() {
        try {
          var data = ${JSON.stringify(mapViewMarkers)};
          var coords = ${JSON.stringify(coordinates)};
          var items = data.length > 0 ? data : (coords ? [{latitude: coords.latitude, longitude: coords.longitude, title: ''}] : []);
          var positions = items.map(function(m) {
            var pixel = map.project([m.longitude, m.latitude]);
            var imgUrl = (m.images && m.images.length > 0) ? m.images[0].url : null;
            return { x: pixel.x, y: pixel.y, type: m.type, title: m.title || '', imageUrl: imgUrl };
          });
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'markerPositions', positions: positions}));
        } catch(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'markerPositions', error: e.message}));
        }
      })();
      true;
    `;
    webViewRef.current.injectJavaScript(js);
  }, [markers, coordinates, displayMode]);

  const requestMarkerPositionsRef = useRef(requestMarkerPositions);
  requestMarkerPositionsRef.current = requestMarkerPositions;

  useEffect(() => {
    if (movePinMode && displayMode === "map") {
      if (webViewLoaded && mapReady) {
        const timer = setTimeout(() => requestMarkerPositions(), 400);
        return () => clearTimeout(timer);
      }
    } else if (!movePinMode) {
      setDragLine(null);
    }
  }, [movePinMode, displayMode, webViewLoaded, mapReady, requestMarkerPositions]);

  // Reset mapReady when leaving map mode (WebView gets unmounted)
  useEffect(() => {
    if (displayMode !== "map") {
      setMapReady(false);
    }
  }, [displayMode]);

  // Stable content-based keys — only change when actual data changes
  const settingsKey = JSON.stringify({ pinMode, pinSize, mapType, showLabels, displayMode, countryName, zoom, darkOverlay });
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
          imageUrl: m.images?.[0]?.url,
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
    setWebViewLoaded(false);
    setMapReady(false);

    const filtered = markers?.filter((m) => !m.id || visibleIds.has(m.id));
    buildHtml(filtered, { pinMode, pinSize, mapType, showLabels, displayMode, countryName, darkOverlay }, coordinates, zoom)
      .then((uri) => {
        setHtmlUri(uri);
        setRenderKey((k) => k + 1);
      });
  }, [settingsKey, visibleIds, coordKey, markersKey, visible, displayMode]);

  const panelHeight = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 700],
  });

  const panelOpacity = panelAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const activeSettingsCount = (showLabels ? 1 : 0) + (darkOverlay ? 1 : 0) + (displayMode === "overlay" ? 1 : 0);

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
            <Text className={`text-xs font-semibold ${value === opt ? "text-[#263F69]" : "text-gray-500"}`}>
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const mainContent = (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {!inline && (
        <TouchableOpacity onPress={onClose} className="absolute top-[40px] left-5 z-50 w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Icon name="close" size={32} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Move Pin toggle (available in both map and overlay modes) */}
      {!inline && (
        <View className="absolute top-[40px] right-5 z-50 items-end gap-2">
          <View className="flex-row items-center rounded-md p-1.5 gap-1.5" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <Text className="text-white text-[10px] font-semibold">Move Pin</Text>
            <Switch
              value={movePinMode}
              onValueChange={setMovePinMode}
              trackColor={{ false: "rgba(255,255,255,0.25)", true: "rgba(255,255,255,0.6)" }}
              thumbColor={movePinMode ? "#ffffff" : "rgba(255,255,255,0.4)"}
            />
          </View>
        </View>
      )}

      {/* Layer selector (outside ViewShot so it's excluded from capture) — overlay only */}
      {!inline && displayMode === "overlay" && (
        <View className="absolute top-[105px] right-5 z-50">
          <View className="flex-row rounded-md p-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity
              onPress={() => setActiveLayer("outline")}
              className={`px-3 py-1.5 rounded-md ${activeLayer === "outline" ? "bg-white/30" : ""}`}
              accessibilityRole="button"
            >
              <Text className={`text-xs font-semibold ${activeLayer === "outline" ? "text-white" : "text-white/60"}`}>Outline</Text>
            </TouchableOpacity>
            <TouchableOpacity
                disabled={!imageUri}
                onPress={() => setActiveLayer("image")}
                className={`px-3 py-1.5 rounded-md ${activeLayer === "image" ? "bg-white/30" : ""} ${!imageUri ? "opacity-30" : ""}`}
                accessibilityRole="button"
              >
                <Text className={`text-xs font-semibold ${activeLayer === "image" ? "text-white" : "text-white/60"}`}>Image</Text>
              </TouchableOpacity>
          </View>
        </View>
      )}

        {/* @ts-ignore */}
        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }} style={{ flex: 1 }} className="flex-1">

          {displayMode === "map" ? (
            <>
              {darkOverlay && (
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.50)"]}
                  locations={[2, 0.5, 1]}
                  className="absolute inset-0 z-10"
                  pointerEvents="none"
                />
              )}
              {htmlUri && (
                <View className="flex-1 relative bg-primary">
                  {/* Black Page + Spinner Loader */}
                  <Animated.View 
                    style={{ opacity: loaderOpacity }}
                    className="absolute inset-0 items-center justify-center bg-primary"
                    pointerEvents="none"
                  >
                    <ActivityIndicator size="large" color="#ffffff" />
                  </Animated.View>

                  <Animated.View style={{ flex: 1, opacity: mapOpacity }}>
                    <WebView
                      key={renderKey}
                      ref={webViewRef}
                      source={{ uri: htmlUri }}
                      javaScriptEnabled
                      domStorageEnabled
                      allowFileAccess
                      allowFileAccessFromFileURLs
                      allowUniversalAccessFromFileURLs
                      mixedContentMode="always"
                      originWhitelist={["*"]}
                      scrollEnabled={false}
                      style={{ flex: 1, backgroundColor: "transparent" }}
                      onLoad={() => setWebViewLoaded(true)}
                      onMessage={handleMessage}
                    />
                  </Animated.View>
                </View>
              )}

              {/* Dim + freeze overlay when move-pin mode is active — claims touch responder to block WebView */}
              {movePinMode && (
                <View
                  className="absolute inset-0 z-20 bg-black/50"
                  onStartShouldSetResponder={() => true}
                  onResponderMove={() => {}}
                  onResponderRelease={() => {}}
                  onResponderTerminationRequest={() => false}
                />
              )}

              {/* Pin targets + drag line (map view, on top of dim overlay) */}
              {activityPoints.length > 0 && (
                <View className="absolute inset-0 z-30" pointerEvents={movePinMode ? "box-none" : "none"}>
                  {/* Connection lines for moved pins */}
                  <Svg
                    width={Dimensions.get("window").width}
                    height={Dimensions.get("window").height}
                    className="absolute top-0 left-0 z-10"
                    pointerEvents="none"
                    style={{ opacity: mapMoving ? 0 : 1 }}
                  >
                    {/* Persistent lines for previously moved pins */}
                    {activityPoints.map((pt, idx) => {
                      const offset = pinOffsets[idx];
                      if (!offset || (offset.dx === 0 && offset.dy === 0)) return null;
                      return (
                        <Line
                          key={`moved-${idx}`}
                          x1={pt.x}
                          y1={pt.y}
                          x2={pt.x + offset.dx}
                          y2={pt.y + offset.dy}
                          stroke="rgba(220,53,69,0.5)"
                          strokeWidth={2}
                          strokeDasharray="5,4"
                          strokeLinecap="round"
                        />
                      );
                    })}

                    {/* Active drag line (red) */}
                    {dragLine && (
                      <>
                        <Line
                          x1={dragLine.from.x}
                          y1={dragLine.from.y}
                          x2={dragLine.to.x}
                          y2={dragLine.to.y}
                          stroke="rgba(220,53,69,0.85)"
                          strokeWidth={3}
                          strokeDasharray="7,5"
                          strokeLinecap="round"
                        />
                        <Circle
                          cx={dragLine.from.x}
                          cy={dragLine.from.y}
                          r={7}
                          fill="rgba(220,53,69,0.8)"
                        />
                      </>
                    )}
                  </Svg>
                  {/* Pin touch targets + visible pins */}
                  {activityPoints.length > 0 && (
                  <View className="absolute inset-0 z-20" pointerEvents="box-none">
                    {activityPoints.map((pt, idx) => {
                      const anim = pinAnimValues.current[idx];
                      const offset = committedOffsets[idx];
                      if (!movePinMode && (!offset || (offset.dx === 0 && offset.dy === 0))) return null;
                      return (
                        <Animated.View
                          key={idx}
                          className="absolute"
                          style={{
                            left: pt.x - PIN_HIT_RADIUS,
                            top: pt.y - PIN_HIT_RADIUS,
                            width: PIN_HIT_RADIUS * 2,
                            height: PIN_HIT_RADIUS * 2,
                            transform: [
                              { translateX: anim?.x ?? 0 },
                              { translateY: anim?.y ?? 0 },
                            ],
                          }}
                          {...(pinTargetsPan[idx]?.panHandlers ?? {})}
                        >
                          <View className="flex-1 items-center justify-center">
                            {(() => {
                              const useImage = pt.imageUrl && pinMode === "image";
                              const size = useImage ? PIN_SIZE_MAP[pinSize].image : PIN_SIZE_MAP[pinSize].type;
                              const iconSize = Math.max(12, Math.round(size * 0.6));
                              return useImage ? (
                                <Image
                                  source={{ uri: pt.imageUrl }}
                                  className="rounded-full"
                                  style={{ width: size, height: size, borderWidth: 2, borderColor: '#fff' }}
                                />
                              ) : (
                                <View
                                  className="rounded-full bg-[#dc3545] items-center justify-center"
                                  style={{
                                    width: size,
                                    height: size,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 4,
                                    elevation: 5,
                                  }}
                                >
                                  <Text className="text-white leading-5 font-bold" style={{ fontSize: iconSize }}>
                                    {ACTIVITY_EMOJI[pt.type ?? 0] ?? "\u25CF"}
                                  </Text>
                                </View>
                              );
                            })()}
                          </View>
                        </Animated.View>
                      );
                    })}
                  </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <View className="flex-1 bg-[#0C2A5A]">
              {/* Touch surface with pan/pinch */}
              <View
                className="flex-1"
                onTouchMove={handlePinchMove}
                onTouchEnd={handlePinchEnd}
                {...panResponder.panHandlers}
              >
                {/* Image layer (back) */}
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

                {/* Dark overlay over image (middle) */}
                {darkOverlay && (
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.50)"]}
                    locations={[0, 0.5, 1]}
                    className="absolute inset-0"
                    pointerEvents="none"
                  />
                )}

                {/* Image drag displacement line */}
                {imgDragLine && (
                  <Svg
                    width={Dimensions.get("window").width}
                    height={Dimensions.get("window").height * 0.7}
                    className="absolute top-0 left-0 z-10"
                    pointerEvents="none"
                  >
                    <Line
                      x1={imgDragLine.from.x}
                      y1={imgDragLine.from.y}
                      x2={imgDragLine.to.x}
                      y2={imgDragLine.to.y}
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth={2}
                      strokeDasharray="6,4"
                      strokeLinecap="round"
                    />
                  </Svg>
                )}

                {/* Outline layer (non-interactive) */}
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
                    destinationTitle={title}
                    onActivityPoints={setActivityPoints}
                    hiddenActivityIndices={hiddenActivityIndices}
                  />
                </Animated.View>

                {/* Pin targets + drag line layer (same transform, interactive) */}
                <Animated.View
                  className="absolute inset-0"
                  style={{
                    transform: [{ translateX }, { translateY }, { scale }],
                  }}
                  pointerEvents="box-none"
                >
                  {/* Connection lines for moved pins */}
                  <Svg
                    width={Dimensions.get("window").width}
                    height={Dimensions.get("window").height * 0.7}
                    className="absolute top-0 left-0 z-10"
                    pointerEvents="none"
                  >
                    {/* Persistent lines for previously moved pins */}
                    {activityPoints.map((pt, idx) => {
                      const offset = pinOffsets[idx];
                      if (!offset || (offset.dx === 0 && offset.dy === 0)) return null;
                      return (
                        <Line
                          key={`moved-${idx}`}
                          x1={pt.x}
                          y1={pt.y}
                          x2={pt.x + offset.dx}
                          y2={pt.y + offset.dy}
                          stroke="rgba(220,53,69,0.5)"
                          strokeWidth={2}
                          strokeDasharray="5,4"
                          strokeLinecap="round"
                        />
                      );
                    })}

                    {/* Active drag line (red) */}
                    {dragLine && (
                      <>
                        <Line
                          x1={dragLine.from.x}
                          y1={dragLine.from.y}
                          x2={dragLine.to.x}
                          y2={dragLine.to.y}
                          stroke="rgba(220,53,69,0.85)"
                          strokeWidth={3}
                          strokeDasharray="7,5"
                          strokeLinecap="round"
                        />
                        <Circle
                          cx={dragLine.from.x}
                          cy={dragLine.from.y}
                          r={7}
                          fill="rgba(220,53,69,0.8)"
                        />
                      </>
                    )}
                  </Svg>

                  {/* Pin touch targets + visible pins */}
                  {activityPoints.length > 0 && (
                    <View className="absolute inset-0 z-20" pointerEvents="box-none">
                      {activityPoints.map((pt, idx) => {
                        const anim = pinAnimValues.current[idx];
                        const offset = committedOffsets[idx];
                        if (!movePinMode && (!offset || (offset.dx === 0 && offset.dy === 0))) return null;
                        return (
                          <Animated.View
                            key={idx}
                            className="absolute"
                            style={{
                              left: pt.x - PIN_HIT_RADIUS,
                              top: pt.y - PIN_HIT_RADIUS,
                              width: PIN_HIT_RADIUS * 2,
                              height: PIN_HIT_RADIUS * 2,
                              transform: [
                                { translateX: anim?.x ?? 0 },
                                { translateY: anim?.y ?? 0 },
                              ],
                            }}
                            {...(pinTargetsPan[idx]?.panHandlers ?? {})}
                          >
                            <View className="flex-1 items-center justify-center">
                              {(() => {
                                const useImage = pt.imageUrl && pinMode === "image";
                                const size = useImage ? PIN_SIZE_MAP[pinSize].image : PIN_SIZE_MAP[pinSize].type;
                                const iconSize = Math.max(12, Math.round(size * 0.6));
                                return useImage ? (
                                  <Image
                                    source={{ uri: pt.imageUrl }}
                                    className="rounded-full"
                                    style={{ width: size, height: size, borderWidth: 2, borderColor: '#fff' }}
                                  />
                                ) : (
                                  <View
                                    className="rounded-full bg-[#dc3545] items-center justify-center"
                                    style={{
                                      width: size,
                                      height: size,
                                      shadowColor: '#000',
                                      shadowOffset: { width: 0, height: 2 },
                                      shadowOpacity: 0.4,
                                      shadowRadius: 4,
                                      elevation: 5,
                                    }}
                                  >
                                    <Text className="text-white leading-5 font-bold" style={{ fontSize: iconSize }}>
                                      {ACTIVITY_EMOJI[pt.type ?? 0] ?? "\u25CF"}
                                    </Text>
                                  </View>
                                );
                              })()}
                            </View>
                          </Animated.View>
                        );
                      })}
                    </View>
                  )}
                </Animated.View>

                {/* Dim overlay when move-pin mode is active (on top of everything) */}
                {movePinMode && (
                  <View className="absolute inset-0 bg-black/50" pointerEvents="none" />
                )}
              </View>

              <View className="absolute bottom-0 left-0 right-0 h-24 bg-black/30" />
            </View>
          )}

          {/* ─── Draggable trip info block ───────────────────────────────────── */}
          {!inline && (
            <Animated.View
              className="absolute bottom-0 left-0 right-0 px-6 pb-28 z-30"
              style={{
                transform: [{ translateX: textTranslateX }, { translateY: textTranslateY }, { scale: textDragScale }],
                opacity: textDragOpacity,
              }}
              {...textPanResponder.panHandlers}
              pointerEvents="box-none"
            >
              <View style={{ alignItems: textAlign === "left" ? "flex-start" : textAlign === "center" ? "center" : "flex-end" }}>
              <View className="flex-row items-center mb-2.5" style={{ justifyContent: textAlign === "left" ? "flex-start" : textAlign === "center" ? "center" : "flex-end" }}>
                <Ionicons name="airplane" size={14} color="rgba(255,255,255,0.65)" />
                <Text className="text-white text-[18px] font-bold ml-1.5 tracking-[2px]" style={{ textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>TRAVIE</Text>
              </View>
               <Text className="text-white font-extrabold mb-1.5" style={{ fontSize: titleFontSize, lineHeight: titleLineHeight, textAlign, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 6 }}>{editableTitle}</Text>
              {showDestination && destination ? <Text className="text-white text-[16px] font-medium mb-1" style={{ textAlign, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>{destination}</Text> : null}
              {topActivityTypes.length > 0 && (
                <View className="flex-row items-center gap-2 mt-2.5 mb-1" style={{ justifyContent: textAlign === "left" ? "flex-start" : textAlign === "center" ? "center" : "flex-end" }}>
                  {topActivityTypes.map((type, i) => (
                    <View key={i} className="w-8 h-8 rounded-full bg-white/18 border border-white/35 justify-center items-center">
                      <Text className="text-[16px] leading-5">{ACTIVITY_EMOJI[type] ?? "●"}</Text>
                    </View>
                  ))}
                </View>
              )}
              {showDateRange && dateRange ? <Text className="text-white text-[13px] font-normal mt-1.5" style={{ textAlign, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>{dateRange}</Text> : null}
              </View>
            </Animated.View>
          )}
        </ViewShot>

        {/* ─── Vertical icon bar (bottom-right) ──────────────────────────── */}
        {!inline && !settingsExpanded && (
        <View className="absolute bottom-8 right-2 z-40 flex-col gap-4">
          <TouchableOpacity
            onPress={handleCaptureAndShare}
            disabled={isCapturing}
            className="w-14 h-14 rounded-full items-center justify-center shadow-lg ml-2"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            accessibilityRole="button"
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="share-social-outline" size={20} color="#FFF" />
            )}
            <Text className="text-white/50 text-[8px]">Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCaptureAndSave}
            disabled={saveLoading}
            className="w-14 h-14 rounded-full items-center justify-center shadow-lg ml-2"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            accessibilityRole="button"
          >
            {saveLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#FFF" />
            )}
            <Text className="text-white/50 text-[8px]">Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={displayMode === "map"}
            className="w-14 h-14 rounded-full items-center justify-center shadow-lg ml-2"
            style={{ backgroundColor: displayMode === "map" ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.5)' }}
            accessibilityRole="button"
          >
            <Ionicons name={(imageUri ? "image" : "image-outline") as any} size={20} color={displayMode === "map" ? "rgba(255,255,255,0.35)" : imageUri ? "#7EC8F8" : "#FFF"} />
            <Text className="text-white/50 text-[8px]">Upload</Text>
          </TouchableOpacity>

          <View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} className="h-px w-3/5 mx-auto" />
          <TouchableOpacity
            onPress={handleResetLayer}
            className="w-14 h-14 rounded-full items-center justify-center shadow-lg ml-2"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            accessibilityRole="button"
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text className="text-white/50 text-[8px]">Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSettingsExpanded(true)}
            className="w-18 h-18 rounded-full items-center justify-center shadow-lg"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            accessibilityRole="button"
          >
            <Icon name="settings" size={24} color="#FFF" />
            <Text className="text-white/50 text-[8px]">Settings</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Floating bottom toolbar */}
        {!inline && settingsExpanded && (
        <View className="absolute bottom-5 left-5 right-5 items-center z-40" pointerEvents="box-none">
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
                  <Text className="text-base font-semibold text-gray-800 uppercase tracking-wide">Settings</Text>
                  <TouchableOpacity onPress={handleCloseSettings} accessibilityRole="button">
                    <Icon name="close" size={28} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Trip Title input */}
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 font-medium mb-1.5">Trip Title</Text>
                  <TextInput
                    value={editableTitle}
                    onChangeText={setEditableTitle}
                    className="border border-gray-200 rounded-xl p-4 text-sm text-gray-800 h-[64px]"
                    placeholder="Trip name"

                  />
                  {editableTitle.length === 0 && (
                    <Text className="text-red-500 text-xs mt-1">Title is required</Text>
                  )}
                </View>

                {/* Title Font Size & Line Height */}
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 font-medium mb-1.5">Title Font Size &amp; Line Height</Text>
                  <View className="flex-row items-center gap-3">
                    <TextInput
                      value={String(titleFontSize)}
                      onChangeText={(text) => {
                        if (text === "") return;
                        const num = parseInt(text, 10);
                        if (!isNaN(num)) setTitleFontSize(Math.max(1, Math.min(72, num)));
                      }}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 w-20"
                      placeholder="28"
                    />
                    <Text className="text-sm text-gray-400">Size</Text>
                    <TextInput
                      value={String(titleLineHeight)}
                      onChangeText={(text) => {
                        if (text === "") return;
                        const num = parseInt(text, 10);
                        if (!isNaN(num)) setTitleLineHeight(Math.max(1, Math.min(120, num)));
                      }}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 w-20"
                      placeholder="34"
                    />
                    <Text className="text-sm text-gray-400">Height</Text>
                  </View>
                </View>

                {/* Justify */}
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 font-medium mb-1.5">Justify</Text>
                  <SegmentedControl options={["left", "center", "right"] as ("left" | "center" | "right")[]} value={textAlign} onChange={(v) => setTextAlign(v as "left" | "center" | "right")} />
                </View>
                <Divider />

                {/* Show Destination toggle */}
                <View className="flex-row items-center justify-between py-2 border-t border-gray-100">
                  <Text className="text-sm text-gray-700">Show Destination</Text>
                  <Switch
                    value={showDestination}
                    onValueChange={setShowDestination}
                    trackColor={{ false: "#E0E0E0", true: "#263F69" }}
                    thumbColor="#FFF"
                  />
                </View>

                {/* Show Date Range toggle */}
                <View className="flex-row items-center justify-between py-2">
                  <Text className="text-sm text-gray-700">Trip Date</Text>
                  <Switch
                    value={showDateRange}
                    onValueChange={setShowDateRange}
                    trackColor={{ false: "#E0E0E0", true: "#263F69" }}
                    thumbColor="#FFF"
                  />
                </View>

                {/* Filter Activities button */}
                <TouchableOpacity
                  onPress={() => setShowActivityList(true)}
                  className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-3"
                  accessibilityRole="button"
                >
                  <View className="flex-row items-center gap-2">
                    <Icon name="visibility" size={20} color="#263F69" />
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
                      trackColor={{ false: "#E0E0E0", true: "#263F69" }}
                      thumbColor="#FFF"
                    />
                  </View>
                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-sm text-gray-700">Dark Overlay</Text>
                    <Switch
                      value={darkOverlay}
                      onValueChange={setDarkOverlay}
                      trackColor={{ false: "#E0E0E0", true: "#263F69" }}
                      thumbColor="#FFF"
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
        </View>
        )}

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
                <Icon name="check-box" size={20} color="#263F69" />
                <Text className="text-sm font-medium text-[#263F69]">Select All</Text>
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
                      color={checked ? "#263F69" : "#ccc"}
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
    );

  if (inline) {
    return mainContent;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {mainContent}
    </Modal>
  );
};

async function buildHtml(
  markers: MapMarker[] | undefined,
  opts: { pinMode: PinMode; pinSize: PinSize; mapType: MapStyle; showLabels: boolean; displayMode: DisplayMode; countryName?: string; darkOverlay: boolean },
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
            return img;
          })
        )) as Array<{ url: string }>;
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
  opts: { pinMode: PinMode; pinSize: PinSize; mapType: MapStyle; showLabels: boolean; displayMode: DisplayMode; countryName?: string; darkOverlay: boolean },
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
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; }
    #map { width: 100%; height: 100vh; }
    #dark-overlay { position:absolute;top:0;left:0;right:0;bottom:0;z-index:10;pointer-events:none;background:linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.50) 80%); }
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
  ${opts.darkOverlay ? '<div id="dark-overlay"></div>' : ''}
  <script>
    (function() {
      var origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, attrs) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
          attrs = Object.assign({}, attrs || {}, { preserveDrawingBuffer: true });
        }
        return origGetContext.call(this, type, attrs);
      };
    })();

    function getEmojiForType(type) {
      var e = ['','\u2708','\u2B06','\u2B07','\uD83D\uDE95','\u2615','\uD83C\uDF7D','\uD83D\uDEB6','\uD83D\uDCF7','\uD83D\uDCCD','\uD83E\uDEB3','\uD83D\uDEB2','\uD83D\uDECF'];
      return e[Number(type)] || '\u25CF';
    }
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
    map.on('movestart', function() { try { window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapMoveStart'})); } catch(e) {} });
    map.on('moveend', function() { try { window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapMoveEnd'})); } catch(e) {} });
    map.on('dragstart', function() { try { window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapMoveStart'})); } catch(e) {} });
    map.on('dragend', function() { try { window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapMoveEnd'})); } catch(e) {} });
    map.on('zoomstart', function() { try { window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapMoveStart'})); } catch(e) {} });
    map.on('zoomend', function() { try { window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapMoveEnd'})); } catch(e) {} });
 
    const renderedMarkers = ${JSON.stringify(markers || [])};
    const showLabels = ${opts.showLabels};

    map.on('load', function() {

      if (renderedMarkers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        renderedMarkers.forEach(m => {
          const wrapper = document.createElement('div');
          wrapper.className = 'marker-wrapper';
          wrapper.setAttribute('data-emoji', getEmojiForType(m.type));

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
        new mapboxgl.Marker({ color: '#263F69' })
          .setLngLat([${coordinates?.longitude || 0}, ${coordinates?.latitude || 0}])
          .addTo(map);
        map.setCenter([${coordinates?.longitude || 0}, ${coordinates?.latitude || 0}]);
        map.setZoom(${zoom || 14});
      }

      // Notify RN when map is fully loaded with markers
      setTimeout(function() {
        try { window.ReactNativeWebView.postMessage(JSON.stringify({type:'_mapReady'})); } catch(e) {}
      }, 600);
    });

    window.__captureMap__ = function(title, destination, dateRange, topTypes, textX, textY, titleFontSize, textAlign, titleLineHeight) {
      titleFontSize = Number(titleFontSize) || 28;
      titleLineHeight = Number(titleLineHeight) || 34;
      textAlign = textAlign || 'left';
      var overlayId = '__capture_trip_info__';
      function removeOverlay() {
        var el = document.getElementById(overlayId);
        if (el) el.remove();
      }
      function escapeHtml(str) {
        return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }
      function buildOverlay() {
        removeOverlay();
        var wrap = document.createElement('div');
        wrap.id = overlayId;
        wrap.style.cssText = 'position:absolute;bottom:0;left:0;right:0;z-index:9999;pointer-events:none;opacity:0;';
        var tx = Number(textX) || 0;
        var ty = Number(textY) || 0;
        if (tx !== 0 || ty !== 0) {
          wrap.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
        }
        var w = window.innerWidth;
        var inner = '<div style="padding:120px 24px 112px 24px;text-align:' + textAlign + ';font-family:-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;">';
        inner += '<div style="display:flex;flex-direction:row;align-items:center;margin-bottom:10px;justify-content:' + (textAlign === 'left' ? 'flex-start' : textAlign === 'center' ? 'center' : 'flex-end') + ';">';
        inner += '<span style="color:rgba(255,255,255,0.65);font-size:11px;font-weight:700;letter-spacing:2px;text-shadow:0 1px 3px rgba(0,0,0,0.6);">\u2708 TRAVIE</span></div>';
        if (title) {
          inner += '<div style="color:#fff;font-size:' + titleFontSize + 'px;font-weight:800;line-height:' + titleLineHeight + 'px;margin-bottom:6px;text-shadow:1px 2px 6px rgba(0,0,0,0.7);max-width:' + (w - 48) + 'px;word-wrap:break-word;overflow-wrap:break-word;">' + escapeHtml(title) + '</div>';
        }
        if (destination) {
          inner += '<div style="color:rgba(255,255,255,0.65);font-size:15px;font-weight:500;margin-bottom:4px;text-shadow:0 1px 4px rgba(0,0,0,0.6);">' + escapeHtml(destination) + '</div>';
        }
        if (topTypes && topTypes.length) {
          inner += '<div style="display:flex;flex-direction:row;gap:8px;margin-top:10px;margin-bottom:4px;justify-content:' + (textAlign === 'left' ? 'flex-start' : textAlign === 'center' ? 'center' : 'flex-end') + ';">';
          var ACTIVITY_EMOJI = ['','\u2708','\u2B06','\u2B07','\uD83D\uDE95','\u2615','\uD83C\uDF7D','\uD83D\uDEB6','\uD83D\uDCF7','\uD83D\uDCCD','\uD83E\uDEB3','\uD83D\uDEB2','\uD83D\uDECF'];
          for (var i = 0; i < topTypes.length; i++) {
            inner += '<div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:20px;">' + (ACTIVITY_EMOJI[topTypes[i]] || '\u25CF') + '</div>';
          }
          inner += '</div>';
        }
        if (dateRange) {
          inner += '<div style="color:rgba(255,255,255,0.45);font-size:13px;font-weight:400;margin-top:6px;text-shadow:0 1px 3px rgba(0,0,0,0.6);">' + escapeHtml(dateRange) + '</div>';
        }
        inner += '</div>';
        wrap.innerHTML = inner;
        document.body.appendChild(wrap);
      }
      function doCapture() {
        if (typeof html2canvas !== 'undefined') {
          buildOverlay();
          var overlay = document.getElementById(overlayId);
          if (overlay) overlay.style.opacity = '1';
          var capPromise = html2canvas(document.body, { useCORS: true, allowTaint: true, backgroundColor: null, logging: false, width: window.innerWidth, height: window.innerHeight, windowWidth: window.innerWidth, windowHeight: window.innerHeight });
          if (overlay) overlay.style.opacity = '0';
          capPromise
          .then(function(canvas) {
            var dataUrl = canvas.toDataURL('image/png');
            removeOverlay();
            window.ReactNativeWebView.postMessage(JSON.stringify({type: '__map_capture__', data: dataUrl}));
          })
          .catch(function() {
            removeOverlay();
            fallbackCapture();
          });
        } else {
          fallbackCapture();
        }
      }
      function fallbackCapture() {
        var mapCanvas = document.querySelector('.mapboxgl-canvas');
        if (!mapCanvas) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: '__map_capture__', data: ''}));
          return;
        }
        var dpr = window.devicePixelRatio || 1;
        var w = window.innerWidth;
        var h = window.innerHeight;
        var comp = document.createElement('canvas');
        comp.width = Math.round(w * dpr);
        comp.height = Math.round(h * dpr);
        var ctx = comp.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.drawImage(mapCanvas, 0, 0, w, h);
        var markers = document.querySelectorAll('.marker-wrapper');
        var imgLoads = [];
        markers.forEach(function(m) {
          var r = m.getBoundingClientRect();
          var cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width / 2;
          var isImg = m.querySelector('.image-marker');
          if (isImg) {
            var url = (window.getComputedStyle(isImg).backgroundImage || '').replace(/^url\(["']?|["']?\)$/g, '');
            if (url) {
              var p = new Promise(function(res) {
                var img = new Image();
                img.onload = function() {
                  ctx.save();
                  ctx.beginPath(); ctx.arc(cx, cy, rad - 1, 0, 2 * Math.PI); ctx.closePath(); ctx.clip();
                  ctx.drawImage(img, r.left, r.top, r.width, r.height);
                  ctx.restore();
                  ctx.beginPath(); ctx.arc(cx, cy, rad - 1, 0, 2 * Math.PI);
                  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
                  res();
                };
                img.onerror = function() { res(); };
                img.src = url;
              });
              imgLoads.push(p);
            }
          } else {
            var emoji = m.getAttribute('data-emoji') || '\u25CF';
            ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 2 * Math.PI);
            ctx.fillStyle = '#dc3545'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold ' + Math.round(rad * 0.75) + 'px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(emoji, cx, cy + 0.5);
          }
          var lbl = m.querySelector('.marker-label');
          if (lbl) {
            var lr = lbl.getBoundingClientRect();
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            roundRect(ctx, lr.left, lr.top, lr.width, lr.height, 6);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.font = '600 12px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(lbl.textContent, lr.left + lr.width / 2, lr.top + lr.height / 2);
          }
        });
        Promise.all(imgLoads).then(function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: '__map_capture__', data: comp.toDataURL('image/png')}));
        });
      }
      function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }
      if (map.loaded && !map.loaded()) {
        map.once('idle', doCapture);
      } else {
        doCapture();
      }
    };
  </script>
</body>
</html>`;
}

export default MapViewer;
