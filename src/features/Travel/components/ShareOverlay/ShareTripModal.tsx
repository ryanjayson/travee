import React, { useRef, useState, useCallback, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  PanResponder,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CountryOutline, { DoneActivity } from "./CountryOutline";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CANVAS_WIDTH = SCREEN_WIDTH;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.7;

const PIN_COLORS = ["#dc3545", "#263F69", "#2ECC71", "#F39C12", "#9B59B6", "#1ABC9C", "#E74C3C", "#34495E"];
const PIN_SIZE_LABELS = { small: "S", medium: "M", large: "L" } as const;
const STATIC_SIZE_MAP = { small: "s", medium: "m", large: "l" } as const;

interface ActivityPin {
  id?: string;
  title: string;
  type?: number;
  latitude: number;
  longitude: number;
  sortOrder?: string;
}

interface ShareTripModalProps {
  visible: boolean;
  onClose: () => void;
  tripTitle: string;
  destination: string;
  countryName: string;
  dateRange?: string;
  activities?: ActivityPin[];
  doneActivities?: DoneActivity[];
}

const ShareTripModal: React.FC<ShareTripModalProps> = ({
  visible,
  onClose,
  tripTitle,
  destination,
  countryName,
  dateRange,
  activities = [],
  doneActivities = [],
}) => {
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transparentCapture, setTransparentCapture] = useState(false);
  const [backgroundImageUri, setBackgroundImageUri] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"map" | "outline">("outline");
  const [pinColor, setPinColor] = useState(PIN_COLORS[0]);
  const [pinSize, setPinSize] = useState<"small" | "medium" | "large">("medium");
  const [showPinSettings, setShowPinSettings] = useState(false);

  const pickImage = useCallback(async () => {
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
        setBackgroundImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error("[ShareTripModal] pickImage error:", e);
    }
  }, []);

  // ─── Position state ──────────────────────────────────────────────────────
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const posRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  const textTranslateX = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(0)).current;
  const textPosRef = useRef({ x: 0, y: 0 });

  const topActivityTypes = useMemo(() => {
    if (!doneActivities.length) return [];
    const counts: Record<number, number> = {};
    doneActivities.forEach((a) => {
      const t = a.type ?? 0;
      if (t === 0) return;
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([typeStr]) => parseInt(typeStr, 10));
  }, [doneActivities]);

  const ACTIVITY_EMOJI: Record<number, string> = {
    1: "✈", 2: "⬆", 3: "⬇", 4: "🚕",
    5: "☕", 6: "🍽", 7: "🚶", 8: "📷",
    9: "🛍", 10: "🧳", 11: "🚲", 12: "🛏",
  };

  // ─── Mapbox static map URL for Map View ─────────────────────────────────
  const staticMapUrl = useMemo(() => {
    if (mapType !== "map" || activities.length === 0) return null;

    const pinSizeCode = STATIC_SIZE_MAP[pinSize];
    const colorHex = pinColor.replace("#", "");

    const pins = activities
      .map((a) => `pin-${pinSizeCode}+${colorHex}(${a.longitude},${a.latitude})`)
      .join(",");

    let path = "";
    if (activities.length > 1) {
      const sorted = [...activities].filter((a) => a.sortOrder).sort((a, b) =>
        (a.sortOrder || "").localeCompare(b.sortOrder || "")
      );
      if (sorted.length > 1) {
        const coords = sorted.map((a) => `${a.longitude},${a.latitude}`).join(";");
        path = `/path-3+${colorHex}-0.5(${coords})`;
      }
    }

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pins}${path}/auto/600x400@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;
  }, [mapType, activities, pinColor, pinSize]);

  // ─── PanResponder (same as ShareOverlay) ─────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        posRef.current = {
          x: (translateX as any)._value ?? 0,
          y: (translateY as any)._value ?? 0,
        };
      },
      onPanResponderMove: (_, gs) => {
        translateX.setValue(posRef.current.x + gs.dx);
        translateY.setValue(posRef.current.y + gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        posRef.current = {
          x: posRef.current.x + gs.dx,
          y: posRef.current.y + gs.dy,
        };
      },
    })
  ).current;

  const textPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        textPosRef.current = {
          x: (textTranslateX as any)._value ?? 0,
          y: (textTranslateY as any)._value ?? 0,
        };
      },
      onPanResponderMove: (_, gs) => {
        textTranslateX.setValue(textPosRef.current.x + gs.dx);
        textTranslateY.setValue(textPosRef.current.y + gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        textPosRef.current = {
          x: textPosRef.current.x + gs.dx,
          y: textPosRef.current.y + gs.dy,
        };
      },
    })
  ).current;

  const lastDist = useRef<number | null>(null);

  const handleTouchMove = useCallback((evt: any) => {
    const touches = evt.nativeEvent.touches;
    if (touches.length === 2) {
      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastDist.current !== null) {
        const ratio = dist / lastDist.current;
        const newScale = Math.max(0.3, Math.min(scaleRef.current * ratio, 5));
        scaleRef.current = newScale;
        scale.setValue(newScale);
      }
      lastDist.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastDist.current = null;
  }, []);

  const handleReset = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(textTranslateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(textTranslateY, { toValue: 0, useNativeDriver: true }),
    ]).start(() => {
      posRef.current = { x: 0, y: 0 };
      textPosRef.current = { x: 0, y: 0 };
      scaleRef.current = 1;
    });
  }, []);

  const handleShare = useCallback(async () => {
    if (!viewShotRef.current) return;
    setIsSharing(true);
    try {
      // @ts-ignore
      const uri = await viewShotRef.current.capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: `Share ${tripTitle}` });
      } else {
        Alert.alert("Sharing not available", "Your device does not support sharing.");
      }
    } catch (e) {
      console.error("[ShareTripModal] capture error:", e);
      Alert.alert("Error", "Failed to capture or share image.");
    } finally {
      setIsSharing(false);
    }
  }, [tripTitle]);

  const handleSave = useCallback(async () => {
    if (!viewShotRef.current) return;
    setIsSaving(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow access to save photos to your gallery.");
        return;
      }
      setTransparentCapture(true);
      await new Promise<void>((r) => setTimeout(r, 80));
      // @ts-ignore
      const uri = await viewShotRef.current.capture();
      setTransparentCapture(false);
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Saved!", "Transparent PNG saved to your photo library.");
    } catch (e) {
      setTransparentCapture(false);
      console.error("[ShareTripModal] save error:", e);
      Alert.alert("Error", "Failed to save image.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View className="flex-1 bg-[#06071a] items-center">
        {/* ─── Top bar ──────────────────────────────────────────────────── */}
        <View className="w-full flex-row items-center justify-between px-4 pb-2" style={{ paddingTop: insets.top + 8 }}>
          <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-full bg-white/10 justify-center items-center" accessibilityRole="button" activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-[17px] font-bold tracking-[0.3px]">Share Trip</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={pickImage} className="w-10 h-10 rounded-full bg-white/10 justify-center items-center" accessibilityRole="button" activeOpacity={0.7}>
              <Ionicons name={backgroundImageUri ? "image" : "image-outline"} size={22} color={backgroundImageUri ? "#7EC8F8" : "#fff"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={isSaving} className={`w-10 h-10 rounded-full bg-white/10 justify-center items-center ${isSaving ? "opacity-50" : ""}`} accessibilityRole="button" activeOpacity={0.7}>
              {isSaving ? <ActivityIndicator size={18} color="#fff" /> : <Ionicons name="download-outline" size={22} color="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset} className="w-10 h-10 rounded-full bg-white/10 justify-center items-center" accessibilityRole="button" activeOpacity={0.7}>
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Map type controls ──────────────────────────────────────────── */}
        <View className="flex-row items-center gap-2 mb-3 px-4 w-full">
          <View className="flex-row bg-white/10 rounded-xl p-0.5 flex-1">
            <TouchableOpacity
              onPress={() => setMapType("map")}
              className={`flex-1 py-2 rounded-xl items-center ${mapType === "map" ? "bg-white/20" : ""}`}
              accessibilityRole="button"
            >
              <Text className={`text-xs font-semibold ${mapType === "map" ? "text-white" : "text-white/50"}`}>Map View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMapType("outline")}
              className={`flex-1 py-2 rounded-xl items-center ${mapType === "outline" ? "bg-white/20" : ""}`}
              accessibilityRole="button"
            >
              <Text className={`text-xs font-semibold ${mapType === "outline" ? "text-white" : "text-white/50"}`}>Outline</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setShowPinSettings((p) => !p)}
            className={`w-9 h-9 rounded-full items-center justify-center ${showPinSettings ? "bg-white/20" : "bg-white/10"}`}
            accessibilityRole="button"
          >
            <Ionicons name="color-palette-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ─── Pin settings panel ─────────────────────────────────────────── */}
        {showPinSettings && (
          <View className="w-full px-4 mb-3">
            <View className="bg-white/10 rounded-xl px-4 py-3">
              <Text className="text-white/60 text-[11px] font-semibold tracking-wider mb-2">PIN COLOR</Text>
              <View className="flex-row gap-2.5 mb-3">
                {PIN_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setPinColor(c)}
                    className={`w-7 h-7 rounded-full items-center justify-center ${pinColor === c ? "ring-2 ring-white" : ""}`}
                    style={{ backgroundColor: c }}
                    accessibilityRole="button"
                  >
                    {pinColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
              <Text className="text-white/60 text-[11px] font-semibold tracking-wider mb-2">PIN SIZE</Text>
              <View className="flex-row bg-white/10 rounded-lg p-0.5">
                {(Object.keys(PIN_SIZE_LABELS) as Array<keyof typeof PIN_SIZE_LABELS>).map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setPinSize(size)}
                    className={`flex-1 py-2 rounded-lg items-center ${pinSize === size ? "bg-white/20" : ""}`}
                    accessibilityRole="button"
                  >
                    <Text className={`text-xs font-semibold ${pinSize === size ? "text-white" : "text-white/50"}`}>{PIN_SIZE_LABELS[size]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        <Text className="text-white/35 text-[12px] tracking-[0.5px] mb-3.5">Drag · Pinch to resize</Text>

        {/* ─── Capturable share card ────────────────────────────────────── */}
        {/* @ts-ignore */}
        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} className={`overflow-hidden bg-[#0C2A5A] ${transparentCapture ? "bg-transparent" : ""}`}>
          {backgroundImageUri && !transparentCapture ? (
            <Image source={{ uri: backgroundImageUri }} className="absolute inset-0" resizeMode="cover" />
          ) : null}

          {!transparentCapture && <View className={`absolute inset-0 bg-[#0C2A5A] ${backgroundImageUri ? "bg-transparent" : ""}`} />}

          {!transparentCapture && (
            <>
              <View className="absolute top-0 left-0 right-0 bg-[#263F69]/25" />
              <View className="absolute bottom-0 left-0 right-0 bg-black/40" style={{ height: CANVAS_HEIGHT }} />
            </>
          )}

          {/* ── Draggable content ── */}
          <Animated.View
            className="absolute top-0 left-0"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: [{ translateX }, { translateY }, { scale }] }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            {...panResponder.panHandlers}
          >
            {mapType === "outline" ? (
              <CountryOutline
                countryName={countryName}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                strokeColor="#ffffff"
                strokeWidth={2}
                doneActivities={doneActivities.map((a) => ({ ...a, type: a.type }))}
              />
            ) : staticMapUrl ? (
              <Image source={{ uri: staticMapUrl }} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-white/40 text-sm">No activities with locations</Text>
              </View>
            )}
          </Animated.View>

          {/* ── Draggable trip info block ── */}
          <Animated.View
            className="absolute bottom-0 left-0 right-0 p-6"
            style={{ transform: [{ translateX: textTranslateX }, { translateY: textTranslateY }] }}
            {...textPanResponder.panHandlers}
          >
            <View className="flex-row items-center mb-2.5">
              <Ionicons name="airplane" size={14} color="rgba(255,255,255,0.65)" />
              <Text className="text-white/65 text-[11px] font-bold ml-1.5 tracking-[2px]">TRAVELLED</Text>
            </View>
            <Text className="text-white text-[28px] font-extrabold leading-[34px] mb-1.5" numberOfLines={2}>{tripTitle}</Text>
            <Text className="text-white/65 text-[15px] font-medium mb-1">{destination}</Text>
            {topActivityTypes.length > 0 && (
              <View className="flex-row items-center gap-2 mt-2.5 mb-1">
                {topActivityTypes.map((type, i) => (
                  <View key={i} className="w-8 h-8 rounded-full bg-white/18 border border-white/35 justify-center items-center">
                    <Text className="text-[16px] leading-5">{ACTIVITY_EMOJI[type] ?? "●"}</Text>
                  </View>
                ))}
              </View>
            )}
            {dateRange ? <Text className="text-white/45 text-[13px] font-normal mt-1.5">{dateRange}</Text> : null}
          </Animated.View>
        </ViewShot>

        {/* ─── Share button ───────────────────────────────────────────────── */}
        <View className="w-full px-6 pt-[18px] items-center" style={{ paddingBottom: insets.bottom + 16 }}>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            className={`flex-row items-center bg-[#263F69] py-[15px] px-12 rounded-[32px] shadow-lg elevation-10 ${isSharing ? "opacity-70" : ""}`}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {isSharing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="share-social" size={20} color="#fff" className="mr-2" />
                <Text className="text-white text-base font-bold tracking-[0.5px]">Share</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ShareTripModal;
