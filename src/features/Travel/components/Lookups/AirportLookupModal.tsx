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
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface Airport {
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

interface AirportLookupModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (airport: Airport) => void;
  title?: string;
  mode?: "departure" | "arrival";
}

const { height: screenHeight } = Dimensions.get("window");

const AirportLookupModal: React.FC<AirportLookupModalProps> = ({
  visible,
  onClose,
  onSelect,
  title,
  mode = "departure",
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { keyboardVisible } = useKeyboardVisible();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setResults([]);
      setIsLoading(false);
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
    if (!visible) return;

    if (searchQuery.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(
            searchQuery.trim()
          )}&locale=en&types[]=airport&types[]=city`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const data = (await response.json()) as Airport[];
          setResults(data);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error searching airports:", err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, visible]);

  // Main sheet responder to capture downward drags only when at top scroll limit
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        if (keyboardVisible) return false;
        const { dx, dy } = gestureState;
        if (isAtTop.current && dy > 8 && Math.abs(dy) > Math.abs(dx)) {
          return true;
        }
        return false;
      },
      onPanResponderGrant: (_, gestureState) => {
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

  const handleCancel = () => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleSelectAirport = (airport: Airport) => {
    Keyboard.dismiss();
    onSelect(airport);
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const displayTitle =
    title || (mode === "departure" ? "Select Departure" : "Select Arrival");

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
              { height: "100%" },
              {
                paddingTop: insets.top + 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.12,
                shadowRadius: 24,
                elevation: 24,
                transform: [{ translateY }],
              },
            ]}
          >
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row items-center px-6 pb-4 border-b border-gray-200 bg-white">
              <TouchableOpacity
                onPress={handleCancel}
                className="mr-3 p-1 rounded-full active:bg-gray-100"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Icon name="arrow-back" size={26} color="#333" />
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-800">
                  {displayTitle}
                </Text>
                <Text className="text-xs text-gray-500">
                  Search by airport name, city, or IATA code
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancel}
                className="p-1 rounded-full active:bg-gray-100"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close airport search"
              >
                <Icon name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="px-6 py-3 bg-white border-b border-gray-200">
              <TextInput
                mode="outlined"
                placeholder="Search airport or city (e.g. SIN, Tokyo, JFK)..."
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
                style={{ height: 56 }}
              />
              <View className="flex-row items-center justify-start mt-2 ml-1 gap-1">
                <Icon name="flight" size={13} color="#98A2B3" />
                <Text className="text-xs text-gray-400">
                  Search powered by <Text className="font-medium text-gray-500">Travelpayouts</Text>
                </Text>
              </View>
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
                results.map((airport) => {
                  const airportDisplayName =
                    airport.type === "city" && airport.main_airport_name
                      ? airport.main_airport_name
                      : airport.name;
                  const locationSubtitle =
                    airport.type === "city"
                      ? `${airport.name}, ${airport.country_name}`
                      : `${airport.city_name}, ${airport.country_name}`;

                  return (
                    <TouchableOpacity
                      key={airport.id || `${airport.code}-${airport.name}`}
                      onPress={() => handleSelectAirport(airport)}
                      className="p-5 border-b border-gray-100 flex-row items-center gap-4 bg-white active:bg-gray-50"
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${airportDisplayName}, ${airport.code}`}
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <Icon
                          name={mode === "departure" ? "flight-takeoff" : "flight-land"}
                          size={22}
                          color={colors.primary}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-800">
                          {airportDisplayName}{" "}
                          <Text style={{ color: colors.primary }}>({airport.code})</Text>
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {locationSubtitle}
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={20} color="#BBB" />
                    </TouchableOpacity>
                  );
                })
              ) : searchQuery.trim().length >= 2 ? (
                <View className="p-10 items-center justify-center">
                  <Icon name="flight" size={48} color="#D0D5DD" style={{ marginBottom: 12 }} />
                  <Text className="text-base font-medium text-gray-600 mb-1">
                    No airports found
                  </Text>
                  <Text className="text-sm text-gray-400 text-center">
                    No results found for "{searchQuery}". Try searching by city name or 3-letter IATA code.
                  </Text>
                </View>
              ) : (
                <View className="p-10 items-center justify-center">
                  <Icon
                    name={mode === "departure" ? "flight-takeoff" : "flight-land"}
                    size={48}
                    color="#D0D5DD"
                    style={{ marginBottom: 12 }}
                  />
                  <Text className="text-base font-medium text-gray-600 mb-1">
                    {mode === "departure" ? "Search departure airport" : "Search arrival airport"}
                  </Text>
                  <Text className="text-sm text-gray-400 text-center">
                    Type at least 2 characters to search for airports or cities worldwide.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AirportLookupModal;
