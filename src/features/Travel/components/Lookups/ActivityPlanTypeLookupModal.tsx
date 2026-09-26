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
import { ActivityType } from "../../../../types/enums";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface PlanTypeItem {
  type: ActivityType;
  key: string;
  label: string;
  subtext: string;
  iconName: string;
  color: string;
}

export const ACTIVITY_PLAN_TYPES: PlanTypeItem[] = [


  {
    type: ActivityType.cafe,
    key: "cafe",
    label: "Cafe",
    subtext: "Coffee, drinks, snacks, cafes, lounges, and bars",
    iconName: "local-cafe",
    color: "#ea580c",
  },
  {
    type: ActivityType.restaurant,
    key: "restaurant",
    label: "Restaurant",
    subtext: "Dining, meals, and food spots",
    iconName: "restaurant",
    color: "#e03e3e",
  },
  {
    type: ActivityType.sightseeing,
    key: "sightseeing",
    label: "Sightseeing",
    subtext: "Landmarks, attractions, and photo spots",
    iconName: "photo-camera",
    color: "#f0a505",
  },
  {
    type: ActivityType.entertainment,
    key: "entertainment",
    label: "Entertainment",
    subtext: "Museums, parks, shows, cinema, and sports",
    iconName: "local-play",
    color: "#0891b2",
  },
  {
    type: ActivityType.shopping,
    key: "shopping",
    label: "Shopping",
    subtext: "Markets, stores, spas, banks, and essentials",
    iconName: "shopping-bag",
    color: "#db2777",
  },
  {
    type: ActivityType.nature,
    key: "nature",
    label: "Nature",
    subtext: "Beaches, lakes, parks, and natural wonders",
    iconName: "terrain",
    color: "#165135",
  },
  {
    type: ActivityType.hike,
    key: "hike",
    label: "Hike",
    subtext: "Hiking trails, trekking, and camping",
    iconName: "hiking",
    color: "#429862",
  },
  {
    type: ActivityType.camp,
    key: "camp",
    label: "Camp",
    subtext: "Camping, hiking trails, trekking, and camping",
    iconName: "night-shelter",
    color: "#429862",
  },
  {
    type: ActivityType.walk,
    key: "walk",
    label: "Walk",
    subtext: "City strolls, walking tours, and exploration",
    iconName: "directions-walk",
    color: "#8BC34A",
  },

  {
    type: ActivityType.rest,
    key: "rest",
    label: "Rest",
    subtext: "Relaxation, downtime, and rest",
    iconName: "hotel",
    color: "#9E9E9E",
  },
  {
    type: ActivityType.ride,
    key: "ride",
    label: "Ride",
    subtext: "Motorbike, Biking, and scenic rides",
    iconName: "directions-bike",
    color: "#156994",
  },
  {
    type: ActivityType.meetup,
    key: "meetup",
    label: "Meetup",
    subtext: "Gatherings, meetups, and socializing",
    iconName: "people",
    color: "#26A69A",
  },
  {
    type: ActivityType.preparation,
    key: "preparation",
    label: "Preparation",
    subtext: "Packing, checklists, and pre-trip tasks",
    iconName: "build",
    color: "#607D8B",
  },
];

interface ActivityPlanTypeLookupModalProps {
  visible: boolean;
  onClose: () => void;
  selectedType?: ActivityType | null;
  onSelect: (type: ActivityType) => void;
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

  const handleSelect = (type: ActivityType) => {
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
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleCancel}
            className="absolute inset-0"
            accessibilityRole="button"
            accessibilityLabel="Dismiss plan type bottom sheet"
          />

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
              className="flex-row justify-between items-center px-6 pb-4"
              style={{ paddingTop: keyboardVisible ? 0 : 2 }}
            >


              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  {/* <TouchableOpacity
                    onPress={handleCancel}
                    accessibilityRole="button"
                    accessibilityLabel="Close add field modal"
                    className="mr-1"
                    activeOpacity={0.7}
                  >
                    <Icon
                      name="chevron-left"
                      size={28}
                      color={"#999"}
                    />
                  </TouchableOpacity> */}
                  <Text className="text-2xl font-semibold text-accent">
                    Activity Type
                  </Text>
                </View>

                <Text className="text-tertiary text-base leading-4">
                  Select type best describe this Activity
                </Text>
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
                      className="px-6 py-5  flex-row items-center gap-4 active:bg-gray-50"
                      onPress={() => handleSelect(item.type)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select activity type ${item.label}`}
                    >
                      {/* Color-assigned icon badge */}
                      <View>
                        <Icon name={item.iconName as any} size={26} color={item.color} />
                      </View>

                      <View className="flex-1">
                        <Text className="text-xl font-semibold text-secondary/80">
                          {item.label}
                        </Text>
                        {item.subtext ? (
                          <Text
                            className="text-base text-tertiary mt-0.5"
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
