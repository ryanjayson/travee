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
  TextInput,
} from "react-native";
import { useTheme } from "react-native-paper";
import { ActivityPlanType } from "../../../../types/enums";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface PlanTypeItem {
  type: ActivityPlanType;
  key: string;
  label: string;
  subtext: string;
  iconName: string;
  color: string;
}

export const ACTIVITY_PLAN_TYPES: PlanTypeItem[] = [
  {
    type: ActivityPlanType.preparation,
    key: "preparation",
    label: "Preparation",
    subtext: "Packing, checklists, and pre-trip tasks",
    iconName: "build",
    color: "#607D8B",
  },
  {
    type: ActivityPlanType.restaurant,
    key: "restaurant",
    label: "Restaurant",
    subtext: "Dining, meals, and food spots",
    iconName: "restaurant",
    color: "#e03e3e",
  },
  {
    type: ActivityPlanType.cafeOrBar,
    key: "cafeOrBar",
    label: "Cafe / Bar",
    subtext: "Coffee, drinks, snacks, cafes, lounges, and bars",
    iconName: "local-cafe",
    color: "#ea580c",
  },
  {
    type: ActivityPlanType.sightseeing,
    key: "sightseeing",
    label: "Sightseeing",
    subtext: "Landmarks, attractions, and photo spots",
    iconName: "photo-camera",
    color: "#f0a505",
  },
  {
    type: ActivityPlanType.shoppingOrService,
    key: "shoppingOrService",
    label: "Shopping & Service",
    subtext: "Markets, stores, spas, banks, and essentials",
    iconName: "shopping-bag",
    color: "#db2777",
  },
  {
    type: ActivityPlanType.entertainmentOrRecreation,
    key: "entertainmentOrRecreation",
    label: "Entertainment & Recreation",
    subtext: "Museums, parks, shows, cinema, and sports",
    iconName: "local-play",
    color: "#0891b2",
  },
  {
    type: ActivityPlanType.nature,
    key: "nature",
    label: "Nature",
    subtext: "Beaches, lakes, parks, and natural wonders",
    iconName: "terrain",
    color: "#165135",
  },
  {
    type: ActivityPlanType.walk,
    key: "walk",
    label: "Walk",
    subtext: "City strolls, walking tours, and exploration",
    iconName: "directions-walk",
    color: "#8BC34A",
  },
  {
    type: ActivityPlanType.hikeOrCamp,
    key: "hikeOrCamp",
    label: "Hike / Camp",
    subtext: "Hiking trails, trekking, and camping",
    iconName: "hiking",
    color: "#429862",
  },
  {
    type: ActivityPlanType.rest,
    key: "rest",
    label: "Rest",
    subtext: "Relaxation, downtime, and rest",
    iconName: "hotel",
    color: "#9E9E9E",
  },
  {
    type: ActivityPlanType.motorcycleRide,
    key: "motorcycleRide",
    label: "Motorcycle Ride",
    subtext: "Motorbike trips and scenic rides",
    iconName: "motorcycle",
    color: "#156994",
  },
  {
    type: ActivityPlanType.meetup,
    key: "meetup",
    label: "Meetup",
    subtext: "Gatherings, meetups, and socializing",
    iconName: "people",
    color: "#26A69A",
  },
];

interface ActivityPlanTypeLookupModalProps {
  visible: boolean;
  onClose: () => void;
  selectedType?: ActivityPlanType | null;
  onSelect: (type: ActivityPlanType) => void;
}

const { height: screenHeight } = Dimensions.get("window");

const ActivityPlanTypeLookupModal = ({
  visible,
  onClose,
  selectedType,
  onSelect,
}: ActivityPlanTypeLookupModalProps) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalHeight] = useState(screenHeight * 0.85);
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
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Header drag pan responder
  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
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
            tension: 65,
            friction: 11,
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
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      setSearchQuery("");
    });
  };

  const handleSelect = (type: ActivityPlanType) => {
    onSelect(type);
    handleCancel();
  };

  const filteredTypes = ACTIVITY_PLAN_TYPES.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(query) ||
      item.subtext.toLowerCase().includes(query)
    );
  });

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
      statusBarTranslucent
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
                paddingTop: keyboardVisible ? insets.top + 10 : 0,
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

            {/* Drag Handle */}
            {!keyboardVisible && (
              <View
                {...dragPanResponder.panHandlers}
                className="w-full items-center py-3 bg-white rounded-t-[30px]"
              >
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>
            )}

            {/* Header */}
            <View
              {...(!keyboardVisible && dragPanResponder.panHandlers)}
              className="flex-row justify-between items-center px-6 pb-4 border-b border-gray-200"
              style={{ paddingTop: keyboardVisible ? 0 : 2 }}
            >
              <View className="flex-1 gap-1">
                <Text
                  className="text-2xl font-bold"
                  style={{ color: colors.primary || "#263F69" }}
                >
                  Plan Type
                </Text>
                <Text className="text-sm text-gray-500">
                  Select type of plan
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancel}
                accessibilityRole="button"
                accessibilityLabel="Close plan type modal"
                className="p-1"
              >
                <Icon name="clear" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="px-6 py-3 border-b border-gray-100">
              <View className="flex-row items-center bg-[#F5F6FA] rounded-2xl px-3 h-12">
                <Icon name="search" size={22} color="#999" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-base text-[#101828] py-0"
                  placeholder="Search plan type"
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
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
                {filteredTypes.map((item) => {
                  const isSelected = selectedType === item.type;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      className="px-6 py-3.5 border-b border-gray-100 flex-row items-center gap-4 active:bg-gray-50"
                      onPress={() => handleSelect(item.type)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select plan type ${item.label}`}
                    >
                      {/* Color-assigned icon badge */}
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: `${item.color}18`,
                          borderColor: `${item.color}35`,
                          borderWidth: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name={item.iconName as any} size={22} color={item.color} />
                      </View>

                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900">
                          {item.label}
                        </Text>
                        {item.subtext ? (
                          <Text
                            className="text-xs text-gray-500 mt-0.5"
                            numberOfLines={1}
                          >
                            {item.subtext}
                          </Text>
                        ) : null}
                      </View>

                      {isSelected ? (
                        <Icon name="check" size={24} color={colors.primary || "#263F69"} />
                      ) : (
                        <Icon name="chevron-right" size={22} color="#D0D5DD" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ActivityPlanTypeLookupModal;
