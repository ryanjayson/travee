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
import { Ionicons, MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { TravelStatus } from "../../../../types/enums";
import StatusBadge from "../../../../components/StatusBadge";

const { height: screenHeight } = Dimensions.get("window");

export interface TripStatusBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const TripStatusBottomSheet: React.FC<TripStatusBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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

  const statuses = [
    {
      status: TravelStatus.Draft,
      description: "Dates are not set yet. Trip remains in draft mode.",
    },
    {
      status: TravelStatus.Upcoming,
      description: "Start and end dates are in the future.",
    },
    {
      status: TravelStatus.Travelling,
      description: "Current date is between departure/start and arrival/end date.",
    },
    {
      status: TravelStatus.Past,
      description: "Travel dates have already passed.",
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View
        {...dragPanResponder.panHandlers}
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
          accessibilityLabel="Dismiss status guide"
        />

        <Animated.View
          className="bg-white rounded-t-[30px] shadow-2xl overflow-hidden"
          style={{
            transform: [{ translateY }],
            maxHeight: screenHeight * 0.85,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
        >
          {/* Drag Handle Area */}
          <View className="w-full items-center pt-3 pb-2 bg-white rounded-t-[30px]">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-2 pb-3 bg-white">
            <View className="flex-1 pr-4">
              <Text className="text-2xl font-bold text-secondary">
                Trip Status Guide
              </Text>
              <Text className="text-sm text-secondary/60 mt-0.5">
                How your trip status is determined
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close trip status guide"
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12 }}
          >
            <Text className="text-sm text-gray-500 mb-4 leading-5">
              The status of a trip is automatically updated based on your selected departure and return dates.
            </Text>

            {/* Policy Notice Box */}
            <View className="flex-row bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-5 items-start">
              <Icon name="schedule" size={20} color="#D97706" style={{ marginTop: 2, marginRight: 10 }} />
              <View className="flex-1">
                <Text className="text-sm font-bold text-amber-900 mb-1">
                  Scheduling Policy
                </Text>
                <Text className="text-xs text-amber-800 leading-4">
                  Overlapping travel dates between different trips are not supported. Each trip must have unique dates.
                </Text>
              </View>
            </View>

            {/* Status Cards */}
            <View className="gap-2.5 mb-6">
              {statuses.map((item) => (
                <View
                  key={item.status}
                  className="flex-row items-center bg-[#F8FAFC] rounded-2xl p-3.5 border border-gray-100"
                >
                  <View className="w-24 mr-3 items-start justify-center">
                    <StatusBadge
                      status={item.status}
                      containerClassName="px-2.5 py-1"
                      textClassName="text-[10px]"
                    />
                  </View>
                  <Text className="flex-1 text-xs text-gray-700 leading-4">
                    {item.description}
                  </Text>
                </View>
              ))}
            </View>

            {/* Got it Button */}
            <TouchableOpacity
              onPress={handleDismiss}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Dismiss trip status guide"
              className="w-full py-3.5 rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <View className="flex-row items-center">
                <Text className="text-white font-semibold text-base">
                  Got it
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default TripStatusBottomSheet;
