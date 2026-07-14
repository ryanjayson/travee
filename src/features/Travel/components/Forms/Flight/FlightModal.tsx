import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
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
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Airport {
  id: string;
  code: string;
  name: string;
  city_name: string;
  country_name: string;
  coordinates: {
    lon: number;
    lat: number;
  };
  type?: "airport" | "city";
  main_airport_name?: string;
}

interface FlightModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: (flightData: {
    departureAirport: Airport;
    arrivalAirport: Airport;
    departureDate: Date;
  }) => void;
}

const { height: screenHeight } = Dimensions.get("window");

export default function FlightModal({ visible, onClose, onConfirm }: FlightModalProps) {
  const { colors } = useTheme();
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState<Date>(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeSearch, setActiveSearch] = useState<"departure" | "arrival" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { keyboardVisible } = useKeyboardVisible();
  const insets = useSafeAreaInsets();
  const [modalHeight] = useState(screenHeight);

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setDepartureAirport(null);
      setArrivalAirport(null);
      setDepartureDate(new Date());
      setActiveSearch(null);
      setSearchQuery("");
      setResults([]);

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

  // Debounced search fetching
  useEffect(() => {
    if (!activeSearch || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(
            searchQuery
          )}&locale=en&types[]=airport&types[]=city`
        );
        if (response.ok) {
          const data = (await response.json()) as Airport[];
          setResults(data);
        }
      } catch (err) {
        console.error("Error searching airports:", err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, activeSearch]);

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

  // Handle bar responder
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
    });
  };

  const handleSelectAirport = (airport: Airport) => {
    if (activeSearch === "departure") {
      setDepartureAirport(airport);
    } else if (activeSearch === "arrival") {
      setArrivalAirport(airport);
    }
    setActiveSearch(null);
    setSearchQuery("");
    setResults([]);
    Keyboard.dismiss();
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleAddFlight = () => {
    if (departureAirport && arrivalAirport && onConfirm) {
      onConfirm({
        departureAirport,
        arrivalAirport,
        departureDate,
      });
      handleCancel();
    }
  };

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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              { height: modalHeight },
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

            {activeSearch ? (
              // Search View
              <View className="flex-1 bg-gray-50">
                <View className="flex-row items-center px-6 pb-4 border-b border-gray-200 bg-white">
                  <TouchableOpacity
                    onPress={() => {
                      setActiveSearch(null);
                      setSearchQuery("");
                      setResults([]);
                    }}
                    className="mr-3"
                    accessibilityRole="button"
                    accessibilityLabel="Go back to flight details"
                  >
                    <Icon name="arrow-back" size={26} color="#333" />
                  </TouchableOpacity>
                  <Text className="text-xl font-bold text-gray-800 flex-1">
                    Select {activeSearch === "departure" ? "Departure" : "Arrival"}
                  </Text>
                </View>

                {/* Search Input */}
                <View className="px-6 py-4 bg-white border-b border-gray-200">
                  <TextInput
                    mode="outlined"
                    placeholder="Search by Airport Name or IATA Code..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                    right={
                      searchQuery ? (
                        <TextInput.Icon
                          icon="close"
                          onPress={() => setSearchQuery("")}
                          color="#888"
                        />
                      ) : null
                    }
                    outlineColor="#E0E0E0"
                    activeOutlineColor={colors.primary}
                    outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                    style={{ height: 60 }}
                  />
                </View>

                {/* Results List */}
                <ScrollView 
                  className="flex-1" 
                  keyboardShouldPersistTaps="always"
                  onScroll={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    isAtTop.current = y <= 0;
                  }}
                  scrollEventThrottle={16}
                >
                  {isLoading ? (
                    <View>
                      {[1, 2, 3, 4, 5].map((key) => (
                        <View
                          key={key}
                          className="p-5 border-b border-gray-100 flex-row items-center gap-4 bg-white"
                        >
                          <View className="w-10 h-10 rounded-full bg-gray-200" />
                          <View className="flex-1 gap-2">
                            <View className="h-5 w-[70%] bg-gray-200 rounded" />
                            <View className="h-4 w-[50%] bg-gray-100 rounded" />
                          </View>
                          <Icon name="chevron-right" size={20} color="#E5E7EB" />
                        </View>
                      ))}
                    </View>
                  ) : results.length > 0 ? (
                    results.map((airport) => (
                      <TouchableOpacity
                        key={airport.id || airport.code}
                        onPress={() => handleSelectAirport(airport)}
                        className="p-5 border-b border-gray-100 flex-row items-center gap-4 bg-white active:bg-gray-50"
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${airport.name} in ${airport.city_name}`}
                      >
                        <View className="w-10 h-10 rounded-full bg-[#E2E9F1] items-center justify-center">
                          <Icon name="flight-takeoff" size={22} color={colors.primary} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-gray-800">
                            {airport.type === "city" && airport.main_airport_name
                              ? airport.main_airport_name
                              : airport.name}{" "}
                            ({airport.code})
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {airport.type === "city" ? airport.name : airport.city_name}, {airport.country_name}
                          </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#BBB" />
                      </TouchableOpacity>
                    ))
                  ) : searchQuery.trim().length >= 2 ? (
                    <View className="p-10 items-center justify-center">
                      <Text className="text-gray-500">No airports found for "{searchQuery}"</Text>
                    </View>
                  ) : (
                    <View className="p-10 items-center justify-center">
                      <Text className="text-gray-400 text-center">
                        Type at least 2 characters to search for airports worldwide.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            ) : (
              // Main Details Form View
              <View className="flex-1 bg-white">
                {/* Header */}
                <View className="flex-row justify-between items-center px-6 pb-5 border-b border-gray-200">
                  <Text 
                    className="text-2xl font-bold"
                    style={{ color: colors.primary || "#263F69" }}
                  >
                    Flight Details
                  </Text>
                  <TouchableOpacity 
                    onPress={handleCancel}
                    accessibilityRole="button"
                    accessibilityLabel="Close Flight Details Modal"
                  >
                    <Icon name="clear" size={24} color="#999" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  className="flex-1 p-6" 
                  keyboardShouldPersistTaps="always"
                  onScroll={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    isAtTop.current = y <= 0;
                  }}
                  scrollEventThrottle={16}
                >
                  {/* Departure Field */}
                  <View className="mb-5">
                    <Text className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">
                      Departure Airport
                    </Text>
                    <TouchableOpacity
                      onPress={() => setActiveSearch("departure")}
                      className="border rounded-2xl border-gray-200 bg-white p-5 flex-row items-center gap-3 active:bg-gray-50"
                      accessibilityRole="button"
                      accessibilityLabel="Choose departure airport"
                    >
                      <Icon
                        name="flight-takeoff"
                        size={24}
                        color={departureAirport ? colors.primary : "#B3B3B3"}
                      />
                      <Text
                        className={`text-base flex-1 font-medium ${
                          departureAirport ? "text-gray-800" : "text-gray-400"
                        }`}
                      >
                        {departureAirport
                          ? `${
                              departureAirport.type === "city" && departureAirport.main_airport_name
                                ? departureAirport.main_airport_name
                                : departureAirport.name
                            } (${departureAirport.code})`
                          : "Select Departure Airport..."}
                      </Text>
                      <Icon name="search" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Arrival Field */}
                  <View className="mb-5">
                    <Text className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">
                      Arrival Airport
                    </Text>
                    <TouchableOpacity
                      onPress={() => setActiveSearch("arrival")}
                      className="border rounded-2xl border-gray-200 bg-white p-5 flex-row items-center gap-3 active:bg-gray-50"
                      accessibilityRole="button"
                      accessibilityLabel="Choose arrival airport"
                    >
                      <Icon
                        name="flight-land"
                        size={24}
                        color={arrivalAirport ? colors.primary : "#B3B3B3"}
                      />
                      <Text
                        className={`text-base flex-1 font-medium ${
                          arrivalAirport ? "text-gray-800" : "text-gray-400"
                        }`}
                      >
                        {arrivalAirport
                          ? `${
                              arrivalAirport.type === "city" && arrivalAirport.main_airport_name
                                ? arrivalAirport.main_airport_name
                                : arrivalAirport.name
                            } (${arrivalAirport.code})`
                          : "Select Arrival Airport..."}
                      </Text>
                      <Icon name="search" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Departure Date/Time */}
                  <View className="mb-8">
                    <Text className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">
                      Departure Date & Time
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      className="border rounded-2xl border-gray-200 bg-white p-5 flex-row items-center gap-3 active:bg-gray-50"
                      accessibilityRole="button"
                      accessibilityLabel="Choose departure date and time"
                    >
                      <Icon name="event" size={24} color={colors.primary} />
                      <Text className="text-base flex-1 text-gray-800 font-medium">
                        {formatDateTime(departureDate)}
                      </Text>
                      <Icon name="calendar-today" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Confirm Button */}
                  <TouchableOpacity
                    onPress={handleAddFlight}
                    disabled={!departureAirport || !arrivalAirport}
                    style={[
                      {
                        borderRadius: 30,
                        padding: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                      },
                      departureAirport && arrivalAirport
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: "#D0D5DD" },
                    ]}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm flight details and add to form"
                  >
                    <Icon name="done" size={24} color="#FFF" />
                    <Text className="text-white font-semibold text-lg">Add Flight</Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* Date Picker */}
                <DateTimePickerModal
                  isVisible={showDatePicker}
                  mode="datetime"
                  date={departureDate}
                  onConfirm={(date) => {
                    setDepartureDate(date);
                    setShowDatePicker(false);
                  }}
                  onCancel={() => setShowDatePicker(false)}
                />
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
