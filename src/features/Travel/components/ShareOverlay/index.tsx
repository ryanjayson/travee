import React, { useRef, useState, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CountryOutline, { DoneActivity } from './CountryOutline';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.7;

interface ShareOverlayProps {
  visible: boolean;
  onClose: () => void;
  tripTitle: string;
  destination: string;
  countryName: string;
  dateRange?: string;
  /** Done activities to render as pins on the country outline */
  doneActivities?: DoneActivity[];
}

const ShareOverlay: React.FC<ShareOverlayProps> = ({
  visible,
  onClose,
  tripTitle,
  destination,
  countryName,
  dateRange,
  doneActivities = [],
}) => {
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transparentCapture, setTransparentCapture] = useState(false);
  const [backgroundImageUri, setBackgroundImageUri] = useState<string | null>(null);

  const pickImage = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
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
      console.error('[ShareOverlay] pickImage error:', e);
    }
  }, []);

  // ─── Position state (JS-thread Animated — no worklets needed) ───────────
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Track raw values so PanResponder can accumulate them
  const posRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  // ─── Separate animated position for the trip info text block ─────────────
  const textTranslateX = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(0)).current;
  const textPosRef = useRef({ x: 0, y: 0 });

  // ─── Top 3 activity types by count (for icon chips below destination) ────
  const topActivityTypes = (() => {
    if (!doneActivities.length) return [];
    const counts: Record<number, number> = {};
    doneActivities.forEach(a => {
      const t = a.type ?? 0;
      if (t === 0) return;
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([typeStr]) => parseInt(typeStr, 10));
  })();

  const ACTIVITY_EMOJI: Record<number, string> = {
    1: '✈', 2: '⬆', 3: '⬇', 4: '🚕',
    5: '☕', 6: '🍽', 7: '🚶', 8: '📷',
    9: '🛍', 10: '🧳', 11: '🚲', 12: '🛏',
  };

  // ─── PanResponder for the country outline (drag + pinch) ─────────────────
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
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(posRef.current.x + gestureState.dx);
        translateY.setValue(posRef.current.y + gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        posRef.current = {
          x: posRef.current.x + gestureState.dx,
          y: posRef.current.y + gestureState.dy,
        };
      },
    })
  ).current;

  // ─── PanResponder for the trip info text block ────────────────────────────
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
      onPanResponderMove: (_, gestureState) => {
        textTranslateX.setValue(textPosRef.current.x + gestureState.dx);
        textTranslateY.setValue(textPosRef.current.y + gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        textPosRef.current = {
          x: textPosRef.current.x + gestureState.dx,
          y: textPosRef.current.y + gestureState.dy,
        };
      },
    })
  ).current;

  // ─── Pinch-to-scale via two-finger distance ───────────────────────────────
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

  // ─── Reset: springs both the map outline AND the info text back to origin ─
  const handleReset = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateX,     { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY,     { toValue: 0, useNativeDriver: true }),
      Animated.spring(scale,          { toValue: 1, useNativeDriver: true }),
      Animated.spring(textTranslateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(textTranslateY, { toValue: 0, useNativeDriver: true }),
    ]).start(() => {
      posRef.current     = { x: 0, y: 0 };
      textPosRef.current = { x: 0, y: 0 };
      scaleRef.current   = 1;
    });
  }, []);

  // ─── Share / capture ─────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!viewShotRef.current) return;
    setIsSharing(true);
    try {
      // @ts-ignore
      const uri = await viewShotRef.current.capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${tripTitle}`,
        });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support sharing.');
      }
    } catch (e) {
      console.error('[ShareOverlay] capture error:', e);
      Alert.alert('Error', 'Failed to capture or share image. Please try again.');
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
        Alert.alert('Permission required', 'Please allow access to save photos to your gallery.');
        return;
      }
      // Switch to transparent background, wait one frame for re-render, then capture
      setTransparentCapture(true);
      await new Promise<void>(resolve => setTimeout(resolve, 80));
      // @ts-ignore
      const uri = await viewShotRef.current.capture();
      setTransparentCapture(false);
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved!', 'Transparent PNG saved to your photo library.');
    } catch (e) {
      setTransparentCapture(false);
      console.error('[ShareOverlay] save error:', e);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View className="flex-1 bg-[#06071a] items-center">

        {/* ─── Top bar ───────────────────────────────────────────────────── */}
        <View 
          className="w-full flex-row items-center justify-between px-4 pb-2"
          style={{ paddingTop: insets.top + 8 }}
        >
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-white/10 justify-center items-center"
            accessibilityRole="button"
            accessibilityLabel="Close share overlay"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="text-white text-[17px] font-bold tracking-[0.3px]">Share Trip</Text>

          <View className="flex-row gap-2">
            {/* Photo picker */}
            <TouchableOpacity
              onPress={pickImage}
              className="w-10 h-10 rounded-full bg-white/10 justify-center items-center"
              accessibilityRole="button"
              accessibilityLabel="Add background photo"
              activeOpacity={0.7}
            >
              <Ionicons name={backgroundImageUri ? 'image' : 'image-outline'} size={22} color={backgroundImageUri ? '#7EC8F8' : '#fff'} />
            </TouchableOpacity>

            {/* Save to gallery */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className={`w-10 h-10 rounded-full bg-white/10 justify-center items-center ${isSaving ? 'opacity-50' : ''}`}
              accessibilityRole="button"
              accessibilityLabel="Save to photo gallery"
              activeOpacity={0.7}
            >
              {isSaving
                ? <ActivityIndicator size={18} color="#fff" />
                : <Ionicons name="download-outline" size={22} color="#fff" />}
            </TouchableOpacity>

            {/* Reset position */}
            <TouchableOpacity
              onPress={handleReset}
              className="w-10 h-10 rounded-full bg-white/10 justify-center items-center"
              accessibilityRole="button"
              accessibilityLabel="Reset position and scale"
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-white/35 text-[12px] tracking-[0.5px] mb-3.5">Drag · Pinch to resize</Text>

        {/* ─── Capturable share card ─────────────────────────────────────── */}
        {/* @ts-ignore */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1.0 }}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          className={`overflow-hidden bg-[#0C2A5A] ${transparentCapture ? 'bg-transparent' : ''}`}
        >
          {/* ── Layer 1: user photo (only when not doing transparent capture) ── */}
          {backgroundImageUri && !transparentCapture ? (
            <Image
              source={{ uri: backgroundImageUri }}
              className="absolute inset-0"
              resizeMode="cover"
            />
          ) : null}

          {/* ── Layer 2: dark colour base ── */}
          {!transparentCapture && (
            <View 
              className={`absolute inset-0 bg-[#0C2A5A] ${backgroundImageUri ? 'bg-transparent' : ''}`} 
            />
          )}

          {/* ── Layer 3: gradient darkening ── */}
          {!transparentCapture && (
            <>
              <View className="absolute top-0 left-0 right-0 bg-[#263F69]/25" />
              <View 
                className="absolute bottom-0 left-0 right-0 bg-black/40"
                style={{ height: CANVAS_HEIGHT }} 
              />
            </>
          )}

          {/* Draggable + scalable country outline */}
          <Animated.View
            className="absolute top-0 left-0"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: [
                { translateX },
                { translateY },
                { scale },
              ],
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            {...panResponder.panHandlers}
          >
            <CountryOutline
              countryName={countryName}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              strokeColor="#ffffff"
              strokeWidth={2}
              doneActivities={doneActivities}
            />
          </Animated.View>

          {/* ── Draggable trip info block ── */}
          <Animated.View
            className="absolute bottom-0 left-0 right-0 p-6"
            style={{
              transform: [
                { translateX: textTranslateX },
                { translateY: textTranslateY },
              ],
            }}
            {...textPanResponder.panHandlers}
          >
            <View className="flex-row items-center mb-2.5">
              <Ionicons name="airplane" size={14} color="rgba(255,255,255,0.65)" />
              <Text className="text-white/65 text-[11px] font-bold ml-1.5 tracking-[2px]">TRAVELLED</Text>
            </View>
            <Text className="text-white text-[28px] font-extrabold leading-[34px] mb-1.5" numberOfLines={2}>{tripTitle}</Text>
            <Text className="text-white/65 text-[15px] font-medium mb-1">{destination}</Text>

            {/* Top 3 activity type emoji chips */}
            {topActivityTypes.length > 0 && (
              <View className="flex-row items-center gap-2 mt-2.5 mb-1">
                {topActivityTypes.map((type, i) => (
                  <View key={i} className="w-8 h-8 rounded-full bg-white/18 border border-white/35 justify-center items-center">
                    <Text className="text-[16px] leading-5">
                      {ACTIVITY_EMOJI[type] ?? '●'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {dateRange ? <Text className="text-white/45 text-[13px] font-normal mt-1.5">{dateRange}</Text> : null}
          </Animated.View>
        </ViewShot>

        {/* ─── Share button ──────────────────────────────────────────────── */}
        <View 
          className="w-full px-6 pt-[18px] items-center"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            className={`flex-row items-center bg-[#263F69] py-[15px] px-12 rounded-[32px] shadow-lg elevation-10 ${isSharing ? 'opacity-70' : ''}`}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Share this trip card"
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

export default ShareOverlay;
