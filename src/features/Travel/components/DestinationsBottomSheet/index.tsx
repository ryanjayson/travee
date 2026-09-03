import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Travel, TripDestinationDto } from "../../types/TravelDto";

const { height: screenHeight } = Dimensions.get("window");

export interface DestinationsBottomSheetProps {
  visible: boolean;
  travel: Travel | null;
  onClose: () => void;
}

export const DestinationsBottomSheet: React.FC<DestinationsBottomSheetProps> = ({
  visible,
  travel,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
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

  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
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

  const getDestinationsList = (): TripDestinationDto[] => {
    if (!travel) return [];
    if (travel.tripDestinations && travel.tripDestinations.length > 0) {
      return travel.tripDestinations.filter((d) => Boolean(d.destination));
    }
    if (travel.destination) {
      const parts = travel.destination
        .split(" | ")
        .map((s) => s.trim())
        .filter(Boolean);
      return parts.map((p, idx) => ({
        id: `dest-${idx}`,
        destination: p,
        destinationData: travel.destinationData,
      }));
    }
    return [];
  };

  const destinations = getDestinationsList();

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
          accessibilityLabel="Dismiss destinations sheet"
        />

        <Animated.View
          className="bg-white rounded-t-[30px] shadow-2xl overflow-hidden"
          style={{
            transform: [{ translateY }],
            maxHeight: screenHeight * 0.75,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
        >
          {/* Drag Handle Area */}
          <View
            {...dragPanResponder.panHandlers}
            className="w-full items-center pt-3 pb-2 bg-white rounded-t-[30px]"
          >
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-2 pb-4 bg-white border-b border-gray-100">
            <View className="flex-1 pr-4">
              <Text className="text-2xl font-bold text-secondary">
                Destinations
              </Text>
              <Text
                className="text-sm text-secondary/60 mt-0.5"
                numberOfLines={1}
              >
                {travel?.title} • {destinations.length} destination
                {destinations.length > 1 ? "s" : ""}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close destinations sheet"
              className="items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* List of Destinations */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
          >
            {destinations.length === 0 ? (
              <View className="py-8 items-center justify-center">
                <Ionicons name="location-outline" size={40} color="#9CA3AF" />
                <Text className="text-secondary/60 text-sm mt-2">
                  No destinations specified
                </Text>
              </View>
            ) : (
              destinations.map((destItem, index) => {
                const isLast = index === destinations.length - 1;
                const country = destItem.destinationData?.country;

                return (
                  <View
                    key={destItem.id || `dest-${index}`}
                    className="flex-row items-start px-6 py-2"
                  >
                    {/* Route Timeline Icon */}
                    {/* <View className="items-center mr-3.5 pt-1">
                      <View className="w-7 h-7 rounded-full bg-sky-50 items-center justify-center border border-sky-200">
                        <Ionicons name="location" size={14} color="#0EA5E9" />
                      </View>
                      {!isLast && (
                        <View className="w-0.5 flex-1 min-h-[32px] bg-gray-200 my-1" />
                      )}
                    </View> */}

                    {/* Destination Card */}
                    <View className="flex-1 bg-[#F8FAFC] rounded-2xl p-4 border border-gray-100">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-[11px] uppercase tracking-wider font-bold text-[#0EA5E9]">
                          Stop {index + 1}
                        </Text>
                      </View>
                      <Text className="text-lg font-semibold text-secondary">
                        {destItem.destination}
                      </Text>
                      {country && country !== destItem.destination && (
                        <View className="flex-row items-center gap-1.5 mt-1">
                          <Ionicons
                            name="globe-outline"
                            size={13}
                            color="#64748B"
                          />
                          <Text className="text-xs text-secondary/70">
                            {country}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default DestinationsBottomSheet;
