import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { TravelMenuAction, TravelStatus } from "../../../../types/enums";
import { Travel } from "../../../Travel/types/TravelDto";

const { height: screenHeight } = Dimensions.get("window");

export interface TravelMenuNavigationProps {
  showModal?: boolean;
  setShowModal?: React.Dispatch<React.SetStateAction<boolean>>;
  visible?: boolean;
  onClose?: () => void;
  onSelect: (selectedMenuAction: TravelMenuAction) => void;
  travel?: Travel | null;
}

export const TravelMenuNavigation: React.FC<TravelMenuNavigationProps> = ({
  showModal,
  setShowModal,
  visible,
  onClose,
  onSelect,
  travel,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const isVisible = visible !== undefined ? visible : Boolean(showModal);
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  const isPast = travel?.status === TravelStatus.Past;
  const isCancelled = travel?.status === TravelStatus.Cancelled;
  const isArchived = travel?.isArchived || travel?.status === TravelStatus.Archieved;

  useEffect(() => {
    if (isVisible) {
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose?.();
      setShowModal?.(false);
    });
  };

  const handleAction = (action: TravelMenuAction) => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onClose?.();
      setShowModal?.(false);
      onSelect(action);
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
            onClose?.();
            setShowModal?.(false);
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

  return (
    <Modal
      visible={isVisible}
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
          accessibilityLabel="Dismiss trip options"
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
          <View className="w-full items-center pt-3 pb-2 bg-white rounded-t-[30px]">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          {/* <View className="flex-row justify-between items-center px-6 pt-2 pb-4 bg-white">
            <View className="flex-1 pr-4">
              <Text className="text-2xl font-bold text-secondary">
                Trip Options
              </Text>
              {travel?.title ? (
                <Text
                  className="text-sm text-secondary/60 mt-0.5"
                  numberOfLines={1}
                >
                  {travel.title}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close trip options"
              className="items-center justify-center p-1"
            >
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View> */}

          {/* Action Options List */}
          <View className="px-4 py-2 gap-y-1">
            <TouchableOpacity
              className={`flex-row items-center px-4 py-3 rounded-2xl ${isArchived ? "opacity-40" : "active:bg-gray-50"
                }`}
              activeOpacity={0.7}
              disabled={isArchived}
              accessibilityRole="button"
              accessibilityLabel="Edit Trip"
              onPress={() => handleAction(TravelMenuAction.EditTravel)}
            >
              <View className="w-10 h-10 justify-center items-center mr-3.5">
                <Icon name="edit-note" size={32} color="#344054" />
              </View>
              <Text className="flex-1 text-lg font-semibold text-secondary">
                Edit Trip
              </Text>
            </TouchableOpacity>

            {isArchived ? (
              <TouchableOpacity
                className="flex-row items-center px-4 py-3 rounded-2xl active:bg-gray-50"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Unarchive Trip"
                onPress={() => handleAction(TravelMenuAction.Unarchive)}
              >
                <View className="w-10 h-10 justify-center items-center mr-3.5">
                  <Icon name="unarchive" size={32} color="#344054" />
                </View>
                <Text className="flex-1 text-lg font-semibold text-secondary">
                  Unarchive Trip
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-row items-center px-4 py-3 rounded-2xl active:bg-gray-50"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Archive Trip"
                onPress={() => handleAction(TravelMenuAction.Archive)}
              >
                <View className="w-10 h-10 justify-center items-center mr-3.5">
                  <Icon name="archive" size={32} color="#344054" />
                </View>
                <Text className="flex-1 text-lg font-semibold text-secondary">
                  Archive
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className={`flex-row items-center px-4 py-3 rounded-2xl ${isPast || isCancelled || isArchived
                ? "opacity-40"
                : "active:bg-red-50"
                }`}
              activeOpacity={0.7}
              disabled={isPast || isCancelled || isArchived}
              accessibilityRole="button"
              accessibilityLabel="Cancel Trip"
              onPress={() => handleAction(TravelMenuAction.Cancel)}
            >
              <View className="w-10 h-10  justify-center items-center mr-3.5">
                <Icon name="cancel" size={32} color="#C62828" />
              </View>
              <Text className="flex-1 text-lg font-semibold text-[#C62828]">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-4 py-3 rounded-2xl active:bg-red-50"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Delete Trip"
              onPress={() => handleAction(TravelMenuAction.Delete)}
            >
              <View className="w-10 h-10 justify-center items-center mr-3.5">
                <Icon name="delete-outline" size={32} color="#C62828" />
              </View>
              <Text className="flex-1 text-lg font-semibold text-[#C62828]">
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default TravelMenuNavigation;
