import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";

const { height: screenHeight } = Dimensions.get("window");

export interface DestinationDetailsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  placeTitle?: string;
  destinationAddress?: string;
  destData?: any;
  coordinates?: { latitude?: number; longitude?: number } | null;
  activityColor?: string;
  onOpenSearch?: () => void;
}

export const DestinationDetailsBottomSheet: React.FC<DestinationDetailsBottomSheetProps> = ({
  visible,
  onClose,
  placeTitle,
  destinationAddress,
  destData,
  coordinates,
  activityColor: propActivityColor,
  onOpenSearch,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const activityColor = propActivityColor || colors.primary || "#263F69";

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);

  useEffect(() => {
    if (visible) {
      isAtTop.current = true;
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Drag handle bar pan responder for immediate drag-to-dismiss on handle and header
  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.25) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: (_, gestureState) => {
        if (gestureState && (gestureState.dy > 50 || gestureState.vy > 0.25)) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Sheet pan responder to capture downward drags when scrolled to top
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return isAtTop.current && dy > 4 && Math.abs(dy) > Math.abs(dx);
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return isAtTop.current && dy > 4 && Math.abs(dy) > Math.abs(dx);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (_, gestureState) => {
        dragStartDy.current = gestureState.dy;
      },
      onPanResponderMove: (_, gestureState) => {
        const currentDy = gestureState.dy - dragStartDy.current;
        if (currentDy > 0) {
          translateY.setValue(currentDy);
        } else {
          translateY.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentDy = gestureState.dy - dragStartDy.current;
        if (currentDy > 50 || gestureState.dy > 50 || gestureState.vy > 0.25) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: (_, gestureState) => {
        const currentDy = gestureState ? gestureState.dy - dragStartDy.current : 0;
        if (currentDy > 50 || (gestureState && gestureState.dy > 50)) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const lat = coordinates?.latitude ?? destData?.coordinates?.latitude ?? destData?.latitude;
  const lng = coordinates?.longitude ?? destData?.coordinates?.longitude ?? destData?.longitude;
  const hasCoordinates =
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng);

  const hasContent = Boolean(
    placeTitle || destinationAddress || hasCoordinates || destData
  );

  const handleOpenInMap = () => {
    if (hasCoordinates) {
      const latLng = `${lat},${lng}`;
      const label = encodeURIComponent(placeTitle || destinationAddress || "Location");
      const url = Platform.select({
        ios: `maps:0,0?q=${label}@${latLng}`,
        android: `geo:0,0?q=${latLng}(${label})`,
        default: `https://www.google.com/maps/search/?api=1&query=${latLng}`,
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latLng}`);
        });
      }
    } else if (destinationAddress) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationAddress)}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.45)",
          opacity: backdropOpacity,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Dismiss destination details sheet"
        />

        <Animated.View
          {...sheetPanResponder.panHandlers}
          className="bg-white rounded-t-[30px] shadow-2xl overflow-hidden"
          style={{
            transform: [{ translateY }],
            maxHeight: screenHeight * 0.85,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
        >
          {/* Drag Handle & Header Area */}
          <View
            {...dragPanResponder.panHandlers}
            className="w-full bg-white rounded-t-[30px]"
          >
            <View className="w-full items-center pt-3 pb-2">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            <View className="flex-row justify-between items-center px-6 pt-1 pb-4 border-b border-gray-100">
              <View className="flex-1 pr-4">
                <Text className="text-2xl font-bold text-secondary">
                  Destination Details
                </Text>
                <Text
                  className="text-sm text-secondary/60 mt-0.5"
                  numberOfLines={1}
                >
                  {placeTitle || destinationAddress || "Location Information"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleDismiss}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close destination details sheet"
                className="items-center justify-center p-1"
              >
                <Ionicons name="close" size={22} color="#999" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body Content */}
          <ScrollView
            bounces={false}
            overScrollMode="never"
            scrollEventThrottle={16}
            onScroll={(e) => {
              const offsetY = e.nativeEvent.contentOffset.y;
              isAtTop.current = offsetY <= 2;
            }}
            onScrollEndDrag={(e) => {
              const offsetY = e.nativeEvent.contentOffset.y;
              const velocityY = e.nativeEvent.velocity?.y ?? 0;
              if (offsetY <= 0 && velocityY < -0.2) {
                handleDismiss();
              }
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 18 }}
          >
            {hasContent ? (
              <Animated.View
                {...sheetPanResponder.panHandlers}
              >
                {/* Place & Address Card */}
                <View className="bg-[#F8FAFC] rounded-2xl p-4 border border-gray-100 mb-3">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <View className="flex-row items-center gap-1.5">
                      <Icon name="place" size={16} color={activityColor} />
                      <Text
                        className="text-[11px] uppercase tracking-wider font-bold"
                        style={{ color: activityColor }}
                      >
                        Location
                      </Text>
                    </View>
                  </View>

                  {Boolean(placeTitle) && (
                    <Text className="text-xl font-bold text-secondary mb-1">
                      {placeTitle}
                    </Text>
                  )}

                  {Boolean(
                    destinationAddress &&
                    destinationAddress.trim().toLowerCase() !==
                    (placeTitle || "").trim().toLowerCase()
                  ) && (
                      <View className="flex-row items-start mt-1 gap-1.5">
                        <Icon
                          name="location-on"
                          size={16}
                          color="#64748B"
                          style={{ marginTop: 2 }}
                        />
                        <Text className="text-sm font-medium text-secondary/70 flex-1 leading-5">
                          {destinationAddress}
                        </Text>
                      </View>
                    )}

                  {/* Destination Badges (City, State, Country) */}
                  {(destData?.city || destData?.regionOrState || destData?.country) && (
                    <View className="flex-row flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-gray-200/60">
                      {Boolean(destData?.city) && (
                        <View className="bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 flex-row items-center">
                          <Icon name="apartment" size={13} color="#155EEF" />
                          <Text className="text-xs font-medium text-blue-700 ml-1">
                            {destData.city}
                          </Text>
                        </View>
                      )}
                      {Boolean(destData?.regionOrState) && (
                        <View className="bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 flex-row items-center">
                          <Icon name="map" size={13} color="#7A5AF8" />
                          <Text className="text-xs font-medium text-purple-700 ml-1">
                            {destData.regionOrState}
                          </Text>
                        </View>
                      )}
                      {Boolean(destData?.country) && (
                        <View className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex-row items-center">
                          <Icon name="public" size={13} color="#039855" />
                          <Text className="text-xs font-medium text-emerald-700 ml-1">
                            {destData.country}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Coordinates Card */}
                {hasCoordinates && (
                  <View className="bg-[#F8FAFC] rounded-2xl p-4 border border-gray-100 mb-3">
                    <View className="flex-row items-center gap-1.5 mb-2">
                      <Icon name="my-location" size={15} color="#64748B" />
                      <Text className="text-[11px] uppercase tracking-wider font-bold text-secondary/60">
                        Coordinates
                      </Text>
                    </View>
                    <View className="bg-white p-3 rounded-xl border border-gray-200/60 flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-[10px] text-gray-400 uppercase">
                          Latitude
                        </Text>
                        <Text className="text-xs font-semibold text-gray-800 font-mono mt-0.5">
                          {typeof lat === "number" ? lat.toFixed(6) : "—"}
                        </Text>
                      </View>
                      <View className="h-6 w-[1px] bg-gray-200 mx-2" />
                      <View className="flex-1">
                        <Text className="text-[10px] text-gray-400 uppercase">
                          Longitude
                        </Text>
                        <Text className="text-xs font-semibold text-gray-800 font-mono mt-0.5">
                          {typeof lng === "number" ? lng.toFixed(6) : "—"}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="mt-2 gap-2">
                  {(hasCoordinates || destinationAddress) && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Open destination in external map app"
                      onPress={handleOpenInMap}
                      className="flex-row items-center justify-center gap-2 p-3.5 rounded-2xl bg-white border border-gray-200"
                    >
                      <Icon name="directions" size={18} color={activityColor} />
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: activityColor }}
                      >
                        Open in Maps
                      </Text>
                    </TouchableOpacity>
                  )}

                  {onOpenSearch && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Change destination location"
                      onPress={() => {
                        handleDismiss();
                        setTimeout(() => {
                          onOpenSearch();
                        }, 220);
                      }}
                      className="flex-row items-center justify-center gap-2 p-3 rounded-2xl"
                    >
                      <Icon name="edit-location" size={18} color="#64748B" />
                      <Text className="text-sm font-medium text-secondary/70">
                        Change Location
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            ) : (
              <View className="py-8 items-center justify-center">
                <Icon name="location-off" size={44} color="#9CA3AF" />
                <Text className="text-secondary/70 text-base font-semibold mt-3">
                  No Destination Details
                </Text>
                <Text className="text-secondary/50 text-xs mt-1 text-center px-4 leading-4">
                  No location or coordinates have been selected for this activity yet.
                </Text>
                {onOpenSearch && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Search destination location"
                    onPress={() => {
                      handleDismiss();
                      setTimeout(() => {
                        onOpenSearch();
                      }, 220);
                    }}
                    className="mt-5 px-5 py-3 rounded-full flex-row items-center gap-2"
                    style={{ backgroundColor: activityColor }}
                  >
                    <Icon name="search" size={16} color="#ffffff" />
                    <Text className="text-white text-sm font-semibold">
                      Search Location
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default DestinationDetailsBottomSheet;
