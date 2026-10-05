import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface CountryPickerModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}

export const CountryPickerModal: React.FC<CountryPickerModalProps> = ({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      translateY.setValue(SCREEN_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleDismiss();
      return true;
    });
    return () => sub.remove();
  }, [visible]);

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

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

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
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: backdropOpacity,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Close backdrop"
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />

        <Animated.View
          className="bg-white rounded-t-[30px] shadow-lg overflow-hidden flex-1"
          style={{
            transform: [{ translateY }],
            marginTop: 80,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          {/* Drag Handle */}
          <View
            {...dragPanResponder.panHandlers}
            className="w-full items-center py-4 rounded-t-[30px]"
          >
            <View className="w-10 h-1 bg-gray-200 rounded-full" />
          </View>

          {/* Header */}
          <View
            className={[
              "flex-row justify-between items-center px-5 pb-4",
              "border-b border-[#F3F4F6] mb-4",
            ].join(" ")}
          >
            <Text className="text-xl font-semibold text-[#111827]">{title}</Text>
            <TouchableOpacity
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel="Close country picker"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View className="px-5 mb-4">
            <View
              className={[
                "flex-row items-center bg-[#F9FAFB] border",
                "border-[#E5E7EB] rounded-2xl px-4 h-12",
              ].join(" ")}
            >
              <Ionicons
                name="search"
                size={20}
                color="#9CA3AF"
                style={{ marginRight: 8 }}
              />
              <RNTextInput
                style={{ flex: 1, fontSize: 14, color: "#111827", padding: 0 }}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search countries..."
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={true}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selected === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    className={`flex-row justify-between items-center px-5 py-3.5 ${
                      isSelected ? "bg-[#EFF6FF]" : ""
                    }`}
                    onPress={() => {
                      onSelect(opt);
                      handleDismiss();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${opt}`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-base ${
                        isSelected
                          ? "text-primary font-semibold"
                          : "text-[#374151]"
                      }`}
                    >
                      {opt}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#0EA5E9" />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View className="items-center justify-center py-8">
                <Text className="text-gray-400 text-sm">
                  No countries match your search
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default CountryPickerModal;
