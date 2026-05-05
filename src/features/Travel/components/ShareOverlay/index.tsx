import React, { useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
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
      <View style={styles.container}>

        {/* ─── Top bar ───────────────────────────────────────────────────── */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Close share overlay"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Share Trip</Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Photo picker */}
            <TouchableOpacity
              onPress={pickImage}
              style={styles.iconBtn}
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
              style={[styles.iconBtn, isSaving && { opacity: 0.5 }]}
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
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Reset position and scale"
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.hint}>Drag · Pinch to resize</Text>

        {/* ─── Capturable share card ─────────────────────────────────────── */}
        {/* @ts-ignore */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1.0 }}
          style={[styles.card, transparentCapture && { backgroundColor: 'transparent' }]}
        >
          {/* ── Layer 1: user photo (only when not doing transparent capture) ── */}
          {backgroundImageUri && !transparentCapture ? (
            <Image
              source={{ uri: backgroundImageUri }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : null}

          {/* ── Layer 2: dark colour base ── */}
          {!transparentCapture && (
            <View style={[styles.cardBg, backgroundImageUri ? { backgroundColor: 'transparent' } : null]} />
          )}

          {/* ── Layer 3: gradient darkening ── */}
          {!transparentCapture && (
            <>
              <View style={styles.cardGradientTop} />
              <View style={styles.cardGradientBottom} />
            </>
          )}

          {/* Draggable + scalable country outline */}
          <Animated.View
            style={[
              styles.svgWrapper,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                ],
              },
            ]}
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
            style={[
              styles.cardText,
              {
                transform: [
                  { translateX: textTranslateX },
                  { translateY: textTranslateY },
                ],
              },
            ]}
            {...textPanResponder.panHandlers}
          >
            <View style={styles.logoRow}>
              <Ionicons name="airplane" size={14} color="rgba(255,255,255,0.65)" />
              <Text style={styles.logoLabel}>TRAVIE</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{tripTitle}</Text>
            <Text style={styles.cardDest}>{destination}</Text>

            {/* Top 3 activity type emoji chips */}
            {topActivityTypes.length > 0 && (
              <View style={styles.activityIconRow}>
                {topActivityTypes.map((type, i) => (
                  <View key={i} style={styles.activityIconChip}>
                    <Text style={styles.activityEmoji}>
                      {ACTIVITY_EMOJI[type] ?? '●'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {dateRange ? <Text style={styles.cardDate}>{dateRange}</Text> : null}
          </Animated.View>
        </ViewShot>

        {/* ─── Share button ──────────────────────────────────────────────── */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={[styles.shareBtn, isSharing && { opacity: 0.7 }]}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Share this trip card"
          >
            {isSharing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="share-social" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.shareBtnText}>Share</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06071a',
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  hint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  card: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#0C2A5A',
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0C2A5A',
  },
  cardGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // height: CANVAS_HEIGHT * 0.45,
    backgroundColor: 'rgba(12, 76, 138, 0.25)',
  },
  cardGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CANVAS_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  svgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  cardText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
   logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 2,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 6,
  },
  cardDest: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardDate: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '400',
    marginTop: 6,
  },
  activityIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  activityIconChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  bottomBar: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 18,
    alignItems: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C4C8A',
    paddingVertical: 15,
    paddingHorizontal: 48,
    borderRadius: 32,
    shadowColor: '#0C4C8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ShareOverlay;
