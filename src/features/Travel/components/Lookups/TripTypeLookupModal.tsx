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
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { TripType } from "../../../../types/enums";
import TripIcon from "../../../../components/TripIcon";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TripTypeLookupModalProps {
  visible: boolean;
  onClose: () => void;
  selectedType?: TripType;
  onSelect: (type: TripType) => void;
}

const { height: screenHeight } = Dimensions.get("window");

const TripTypeLookupModal = ({
  visible,
  onClose,
  selectedType,
  onSelect,
}: TripTypeLookupModalProps) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const { keyboardVisible } = useKeyboardVisible();
  const insets = useSafeAreaInsets();

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

  const handleSelect = (type: TripType) => {
    onSelect(type);
    handleCancel();
  };

  const types = Object.keys(TripType)
    .filter((key) => isNaN(Number(key)))
    .map((key) => {
      const typeValue = TripType[key as keyof typeof TripType];
      const displayName = key.replace(/([A-Z])/g, " $1").trim();
      return { key, typeValue, displayName };
    });

  const filteredTypes = types.filter((t) =>
    t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) && t.typeValue !== TripType.none
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
            className="bg-white overflow-hidden"
            style={[
              { height: "100%" },
              {
                paddingTop: insets.top + 10,
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

            {/* Header */}
            <View
              {...(!keyboardVisible && dragPanResponder.panHandlers)}
              className="flex-row justify-between items-center px-6 pb-5 border-b border-gray-200"
            >
              <View className="flex-1 ">
                <Text
                  className="text-2xl font-bold"
                >
                  Trip Type
                </Text>
                <Text
                  className="text-md  text-[#999]"
                >
                 What kind of trip is this?
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancel} accessibilityRole="button" accessibilityLabel="Close selection modal">
                <Icon name="clear" size={24} color={"#999"} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="px-6 py-4 border-b border-gray-200">
              <TextInput
                mode="outlined"
                placeholder="Search trip type"
                value={searchQuery}
                onChangeText={setSearchQuery}
                right={
                  searchQuery ? (
                    <TextInput.Icon
                      icon="close"
                      onPress={() => setSearchQuery("")}
                      color={colors.onSurfaceVariant}
                    />
                  ) : null
                }
                theme={{ colors: { onSurfaceVariant: '#888' } }}
                outlineColor="#E0E0E0"
                activeOutlineColor="#263F69"
                outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                style={{ backgroundColor: colors.surface, borderRadius: 20 }}
              />
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
                {filteredTypes.map(({ key, typeValue, displayName }) => (
                  <TouchableOpacity
                    key={key}
                    className="p-5 border-b border-gray-100 flex-row items-center gap-4 active:bg-gray-50"
                    onPress={() => handleSelect(typeValue)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select trip type ${displayName}`}
                  >
                    <TripIcon type={typeValue} size={28} showIconOnly />
                    <Text className="text-lg text-gray-800 font-medium flex-1 capitalize">
                      {displayName}
                    </Text>
                    {selectedType === typeValue && (
                      <Icon name="check" size={24} color={colors.primary} style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default TripTypeLookupModal;
