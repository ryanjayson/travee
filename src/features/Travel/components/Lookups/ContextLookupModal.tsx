import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useRef, useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useTheme } from "react-native-paper";
import ActivityIcon from "../../../../components/ActivityIcon";
import { ActivityType } from "../../../../types/enums";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";

interface ContextOption {
  id: string;
  label: string;
  type: "group" | "activity";
  activityType?: ActivityType;
}

interface ContextLookupModalProps {
  visible: boolean;
  onClose: () => void;
  options: ContextOption[];
  selectedOptionId?: string;
  onSelect: (option: ContextOption) => void;
  isLoading?: boolean;
}

const { height: screenHeight } = Dimensions.get("window");

const ContextLookupModal = ({
  visible,
  onClose,
  options = [],
  selectedOptionId,
  onSelect,
  isLoading = false,
}: ContextLookupModalProps) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalHeight] = useState(screenHeight * 0.78);
  const { keyboardVisible } = useKeyboardVisible();

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);

  // Slide up transition on opening
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

  // Main sheet responder to capture downward drags only when at top scroll limit
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (keyboardVisible) return false;
        const { dx, dy } = gestureState;
        // Verify downward swipe and ensure vertical dominance to not block other gestures
        if (isAtTop.current && dy > 8 && Math.abs(dy) > Math.abs(dx)) {
          return true;
        }
        return false;
      },
      onPanResponderGrant: (evt, gestureState) => {
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
        if (currentDy > 120 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            setSearchQuery("");
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
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Handle bar pan responder
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
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            setSearchQuery("");
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

  const handleCancel = () => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      setSearchQuery("");
    });
  };

  const handleSelect = (option: ContextOption) => {
    onSelect(option);
    handleCancel();
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Animated.View
          className="flex-1 justify-end"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: backdropOpacity,
          }}
        >
          <Animated.View
            {...sheetPanResponder.panHandlers}
            className="rounded-t-[30px] bg-white overflow-hidden"
            style={[
              { height: keyboardVisible ? "100%" : modalHeight },
              {
                paddingTop: keyboardVisible ? 24 : 0,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 24,
                transform: [{ translateY }],
              },
            ]}
          >
            <StatusBar style="dark" />

            {/* Drag Handle Area */}
            {!keyboardVisible && (
              <View
                {...dragPanResponder.panHandlers}
                className="w-full items-center py-4 bg-white rounded-t-[30px]"
              >
                <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </View>
            )}

            {/* Header */}
            <View
              {...(!keyboardVisible && dragPanResponder.panHandlers)}
              className="flex-row justify-between items-center px-6 pb-5 border-b border-gray-200"
              style={{ paddingTop: keyboardVisible ? 0 : 4 }}
            >
              <View className="flex-1 gap-1">
                  <Text
                    className="text-2xl font-semibold  text-primary"
                  >
                    To-do Category
                  </Text>
                  <Text
                    className="text-base  text-tertiary"
                  >
                    Where does this to-do item belong?
                  </Text>
                </View>
              <TouchableOpacity onPress={handleCancel}>
                  <Icon name="clear" size={24} color={"#999"} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="px-6 py-4 border-b border-gray-200">
              <View className="flex-row items-center bg-[#F5F6FA] rounded-2xl px-3 h-12">
                <Icon name="search" size={22} color="#999" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-base text-[#101828] py-0"
                  placeholder="Search groups or activities..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                    }}
                    style={{ padding: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search text"
                  >
                    <Icon name="close" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Scrollable list */}
            <View className="flex-1">
              <ScrollView
                onScroll={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  isAtTop.current = y <= 0;
                }}
                scrollEventThrottle={16}
                keyboardShouldPersistTaps="handled"
              >
                {isLoading ? (
                  <View className="p-10 items-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : filteredOptions.length === 0 ? (
                  <View className="p-10 items-center">
                    <Text className="text-tertiary text-base">No category or activity found.</Text>
                  </View>
                ) : (
                  filteredOptions.map((option) => (
                    <TouchableOpacity
                      key={`${option.type}-${option.id}`}
                      className="p-5 border-b border-gray-100 flex-row items-center gap-4 active:bg-gray-50"
                      onPress={() => handleSelect(option)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${option.type} ${option.label}`}
                    >
                      {option.type === "group" ? (
                        <Icon name="folder" size={28} color="#263F69" />
                      ) : (
                        <ActivityIcon
                          type={(option.activityType ?? ActivityType.none) as ActivityType}
                          size={28}
                          color="#263F69"
                          showIconOnly
                        />
                      )}
                      <View className="flex-1">
                        <Text className="text-lg text-secondary font-medium">
                          {option.label}
                        </Text>
                        <Text className="text-base text-tertiary capitalize">
                          {option.type}
                        </Text>
                      </View>
                      {selectedOptionId === option.id && (
                        <Icon name="check" size={24} color={colors.primary} style={{ marginLeft: "auto" }} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ContextLookupModal;
export type { ContextOption };
