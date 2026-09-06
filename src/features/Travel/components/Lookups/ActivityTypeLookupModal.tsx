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
import { ActivityType, getActivityTypeLabel } from "../../../../types/enums";
import ActivityIcon from "../../../../components/ActivityIcon";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FadeInView } from "../../../../components/animations";

const ACTIVITY_TYPE_SUBTEXT: Record<string, string> = {
  flight: "Flights, layovers, and airport transits",
  stay: "Hotels, resorts, Airbnbs, and stays",
  cafeRestaurant: "Dining, cafes, bars, and local spots",
  transit: "Trains, buses, taxis, and transit",
  rideRental: "Car, scooter, and vehicle rentals",
  sightseeing: "Landmarks, tours, and attraction visits",
  shopppingAndService: "Shopping, spas, markets, and essentials",
  entertainmentAndRecreation: "Museums, shows, sports, and nightlife",
  nature: "Beaches, lakes, parks, and natural spots",
  walk: "City strolls, walking tours, and exploration",
  hikeOrCamp: "Hiking trails, trekking, and camping",
  preparation: "Packing, checklists, and pre-trip tasks",
  tour: "Local tours, guided tours, and excursions",
  plan: "Sightseeing, activities, attractions, etc.",
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
    .filter((key) => key !== "walk")
    .map((key) => {
      const typeValue = ActivityType[key as keyof typeof ActivityType];
      const displayName = getActivityTypeLabel(typeValue);
      return { key, typeValue, displayName };
    });


  // const noneItem = filteredTypes.find((t) => t.key === "none");
  // const commonKeys = ["flight", "cafeRestaurant", "stay"];
  // const commonList = filteredTypes.filter((t) => commonKeys.includes(t.key));
  // const otherList = filteredTypes.filter((t) => !commonKeys.includes(t.key) && t.key !== "none");

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
            backgroundColor: "#344054",
            opacity: backdropOpacity,
            // paddingTop: keyboardVisible ? insets.top + 10 : 0,
          }}
        >
          <Animated.View
            {...sheetPanResponder.panHandlers}
            className="rounded-t-[30px] overflow-hidden"
            style={[
              { height: "100%" },
              {
                paddingTop: insets.top + 30,
                // shadowColor: "#000",
                // shadowOffset: { width: 0, height: -8 },
                // shadowOpacity: 0.12,
                // shadowRadius: 16,
                // elevation: 24,
                transform: [{ translateY }],
              },
            ]}
          >
            <StatusBar style="dark" />

            {/* Header */}
            <View
              {...(!keyboardVisible && dragPanResponder.panHandlers)}
              className="flex-row justify-between items-center px-7 pb-5 "
              style={{ paddingTop: keyboardVisible ? 0 : 4 }}
            >
              <View className="flex-col items-start gap-1">
                <Text
                  className="text-4xl  text-primary "
                >
                  Activity type
                </Text>
                <Text
                  className="text-base  text-white opacity-60"
                >
                  Select type of activity
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancel}>
                <Icon name="clear" size={28} color={"#fff"} opacity={0.6} />
              </TouchableOpacity>
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
                <FadeInView type="up" delay={50} duration={350}>
                  {types.map(({ key, typeValue, displayName }) => (
                    <TouchableOpacity
                      key={key}
                      className="p-6 flex-row items-center gap-4 active:bg-gray-100 mb-2"
                      onPress={() => handleSelect(typeValue)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select activity type ${displayName}`}
                    >
                      <ActivityIcon type={typeValue} size={24} />
                      <View className="flex-1 ">
                        <Text className="text-2xl text-white capitalize font-medium tracking-wide">
                          {displayName}
                        </Text>
                        {ACTIVITY_TYPE_SUBTEXT[key] ? (
                          <Text style={{ fontSize: 14, color: "#fff", marginTop: 0, opacity: 0.6, letterSpacing: 0.2 }}>
                            {ACTIVITY_TYPE_SUBTEXT[key]}
                          </Text>
                        ) : null}

                      </View>

                      <Icon name="chevron-right" size={28} color={"#fff"} opacity={0.2} />

                    </TouchableOpacity>
                  ))}
                </FadeInView>
              </ScrollView>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ActivityTypeLookupModal;
