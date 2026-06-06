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
import { ActivityType, getActivityTypeLabel } from "../../../../types/enums";
import ActivityIcon from "../../../../components/ActivityIcon";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVITY_TYPE_SUBTEXT: Record<string, string> = {
  accomodation: "Checkin and checkout",
  cafeRestaurant: "Food, eat, drink, snack, coffee, bar, lounge, pub",
  nature: "Beach, mountain, lake, river, waterfall, forest, jungle, cave, desert, canyon, volcano",
  shopppingAndService: "Spa, events, festivals, parties, show, tour guide, clothes store, supermarket, convenience store, atm, bank, pharmacy, gas station",
  entertainmentAndRecreation: "Park, museum, gym, cinema, stadium, zoo, concert",
  transportation: "Ride, bike, boat, bus, taxi, train, ferry",
  hikeOrCamp: "Mountain, forest, jungle, cave, desert, canyon, volcano, campground",
  motorcycleRide: "Motorbike",
  rideRental: "RV, yacht, motorbike, motorcycle, car, bike",
};


interface ActivityTypeLookupModalProps {
  visible: boolean;
  onClose: () => void;
  selectedType?: ActivityType;
  onSelect: (type: ActivityType) => void;
}

const { height: screenHeight } = Dimensions.get("window");

const ActivityTypeLookupModal = ({
  visible,
  onClose,
  selectedType,
  onSelect,
}: ActivityTypeLookupModalProps) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalHeight] = useState(screenHeight * 0.78);
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

  const handleSelect = (type: ActivityType) => {
    onSelect(type);
    handleCancel();
  };

  const types = Object.keys(ActivityType)
    .filter((key) => isNaN(Number(key)))
    .map((key) => {
      const typeValue = ActivityType[key as keyof typeof ActivityType];
      const displayName = getActivityTypeLabel(typeValue);
      return { key, typeValue, displayName };
    });

  const filteredTypes = types.filter((t) =>
    t.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const noneItem = filteredTypes.find((t) => t.key === "none");
  const commonKeys = ["flight", "cafeRestaurant", "accomodation"];
  const commonList = filteredTypes.filter((t) => commonKeys.includes(t.key));
  const otherList = filteredTypes.filter((t) => !commonKeys.includes(t.key) && t.key !== "none");

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
            // paddingTop: keyboardVisible ? insets.top + 10 : 0,
          }}
        >
          <Animated.View
            {...sheetPanResponder.panHandlers}
            className="rounded-t-[30px] bg-white overflow-hidden"
            style={[
              { height: "100%" },
              {
                paddingTop: insets.top + 20,
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
              style={{ paddingTop: keyboardVisible ? 0 : 4 }}
            >
              <View className="flex-row items-center gap-2">
                <Text 
                  className="text-2xl"
                  style={{ color: colors.primary || "#263F69" }}
                >
                  Select activity type
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancel}>
                <Icon name="clear" size={24} color={"#999"} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="px-6 py-4 border-b border-gray-200">
              <TextInput
                mode="outlined"
                placeholder="Search activity type"
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
                keyboardShouldPersistTaps="always"
              >
                {noneItem && (
                  <TouchableOpacity
                    key={noneItem.key}
                    className="p-5 border-b border-gray-100 flex-row items-center gap-4 active:bg-gray-50"
                    onPress={() => handleSelect(noneItem.typeValue)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select activity type ${noneItem.displayName}`}
                  >
                    <ActivityIcon type={noneItem.typeValue} size={24} />
                    <Text className="text-base text-gray-800 flex-1 capitalize">
                      {noneItem.displayName}
                    </Text>
                    {(selectedType === noneItem.typeValue || selectedType === undefined) && (
                      <Icon name="check" size={24} color={colors.primary} style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                )}

                {commonList.length > 0 && (
                  <View>
                    <View
                      style={{
                        backgroundColor: "#F9FAFB",
                        paddingHorizontal: 20,
                        paddingVertical: 8,
                        borderTopWidth: 1,
                        borderBottomWidth: 1,
                        borderColor: "#EAECF0",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#475467",
                          letterSpacing: 1,
                          textTransform: "uppercase",
                        }}
                      >
                        Common
                      </Text>
                    </View>
                    {commonList.map(({ key, typeValue, displayName }) => (
                      <TouchableOpacity
                        key={key}
                        className="p-5 border-b border-gray-100 flex-row items-center gap-4 active:bg-gray-50"
                        onPress={() => handleSelect(typeValue)}
                        accessibilityRole="button"
                        accessibilityLabel={`Select activity type ${displayName}`}
                      >
                        <ActivityIcon type={typeValue} size={24} />
                        <View className="flex-1">
                          <Text className="text-base text-gray-800 capitalize">
                            {displayName}
                          </Text>
                          {ACTIVITY_TYPE_SUBTEXT[key] ? (
                            <Text style={{ fontSize: 12, color: "#667085", marginTop: 0 }}>
                              {ACTIVITY_TYPE_SUBTEXT[key]}
                            </Text>
                          ) : null}
                        </View>
                        {selectedType === typeValue && (
                          <Icon name="check" size={24} color={colors.primary} style={{ marginLeft: "auto" }} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {otherList.length > 0 && (
                  <View>
                    <View
                      style={{
                        backgroundColor: "#F9FAFB",
                        paddingHorizontal: 20,
                        paddingVertical: 8,
                        borderTopWidth: 1,
                        borderBottomWidth: 1,
                        borderColor: "#EAECF0",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#475467",
                          letterSpacing: 1,
                          textTransform: "uppercase",
                        }}
                      >
                        More
                      </Text>
                    </View>
                    {otherList.map(({ key, typeValue, displayName }) => (
                      <TouchableOpacity
                        key={key}
                        className="p-5 border-b border-gray-100 flex-row items-center gap-4 active:bg-gray-50"
                        onPress={() => handleSelect(typeValue)}
                        accessibilityRole="button"
                        accessibilityLabel={`Select activity type ${displayName}`}
                      >
                        <ActivityIcon type={typeValue} size={24} />
                        <View className="flex-1">
                          <Text className="text-base text-gray-800 capitalize">
                            {displayName}
                          </Text>
                          {ACTIVITY_TYPE_SUBTEXT[key] ? (
                            <Text style={{ fontSize: 12, color: "#667085", marginTop: 0 }}>
                              {ACTIVITY_TYPE_SUBTEXT[key]}
                            </Text>
                          ) : null}
                        </View>
                        {selectedType === typeValue && (
                          <Icon name="check" size={24} color={colors.primary} style={{ marginLeft: "auto" }} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ActivityTypeLookupModal;
