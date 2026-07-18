import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Create from ".";
import StatusBadge from "../../../../components/StatusBadge";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";
import { TravelStatus } from "../../../../types/enums";
import { Travel } from "../../types/TravelDto";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";

interface AddTripModalProps {
  showModal?: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  tripData?: Travel;
  mode?: "create" | "edit";
  onCreated?: (createdId: string) => void;
}

const { height: screenHeight } = Dimensions.get("window");

const CreateTripModal = ({
  showModal = false,
  setShowModal,
  tripData,
  mode = "create",
  onCreated,
}: AddTripModalProps) => {

  const [isSaving, setIsSaving] = useState(false);
  const [modalHeight, setModalHeight] = useState(screenHeight * 0.75);
  const { keyboardVisible, isFloating } = useKeyboardVisible();
  const [tripStatus, setTripStatus] = useState(TravelStatus.Draft);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [showStatusExplainModal, setShowStatusExplainModal] = useState(false);
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);

  // Slide up transition on opening
  useEffect(() => {
    if (showModal) {
      isAtTop.current = true; // Reset scroll position tracker
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [showModal]);

  // Main sheet responder to capture downward drags only when at top scroll limit
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (keyboardVisible) return false;
        const { dy } = gestureState;
        // If we are at the top and swipe down
        if (isAtTop.current && dy > 8) {
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
            setShowModal(false);
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
      }
    })
  ).current;

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
          // Slide down completely and close
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowModal(false);
          });
        } else {
          // Snap back to top
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
    // Smoothly slide down first, then dismiss
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
    });
  };

  // Interpolate backdrop opacity based on translateY position for smooth fading
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Modal visible={showModal} 
      transparent
      animationType="none" 
      onRequestClose={handleCancel}
      >
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined} 
        style={{ flex: 1 }}
      >
        <Animated.View 
          className="flex-1 justify-end" 
          style={{ 
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: backdropOpacity 
          }}
        >
          <Animated.View
            {...sheetPanResponder.panHandlers}
            className="rounded-t-[30px] bg-white"
            style={[
              { height: (mode === "edit" || keyboardVisible) ? "100%" : modalHeight},
              {
                paddingTop: (mode === "edit" || keyboardVisible) ? insets.top + 10 : 0,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 24,
                transform: [{ translateY }],
              }
            ]}
          >
            {/* Drag Handle Area */}
            {!(mode === "edit" || keyboardVisible) && (
              <View 
                {...dragPanResponder.panHandlers}
                className="w-full items-center py-4 bg-white rounded-t-4xl"
              >
                <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </View>
            )}
            <View 
              {...(!(mode === "edit" || keyboardVisible) && dragPanResponder.panHandlers)}
              className="flex-row justify-between items-center px-5 pb-5 border-b border-gray-200" 
              style={{ paddingTop: (mode === "edit" || keyboardVisible) ? 0 : 4 }}
            >
                <View className="flex-row items-center gap-2">
                    <Text className="text-2xl text-gray-700 font-medium">
                      {mode === "edit" ? "Edit Trip" : "Create next trip"}
                    </Text>
                    <StatusBadge status={tripStatus} />
                     <TouchableOpacity 
                        onPress={() => setShowStatusExplainModal(true)} 
                        disabled={isSaving}
                        accessibilityRole="button"
                        accessibilityLabel="Show status explanation"
                      >
                        <Icon name="info" size={16} color={"#999"} />
                      </TouchableOpacity>

                </View>
                <TouchableOpacity 
                  onPress={handleCancel} 
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Close edit trip modal"
                >
                    <Icon name="clear" size={24} color={"#999"} />
                </TouchableOpacity>
            </View>
            <View className="flex-1">
              <Create 
                onClose={handleCancel} 
                onStatusChange={setTripStatus} 
                tripData={tripData} 
                mode={mode}
                onCreated={onCreated}
                onScroll={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  isAtTop.current = y <= 0;
                }}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Status Explanation Modal */}
      <Modal
        visible={showStatusExplainModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusExplainModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowStatusExplainModal(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          {/* Modal Box */}
          <TouchableOpacity
            activeOpacity={1}
            style={{
              width: "100%",
              maxWidth: 340,
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Icon name="info" size={24} color={colors.primary} />
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#111827" }}>
                Trip Status Guide
              </Text>
            </View>

            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 16, lineHeight: 20 }}>
              The status of a trip is automatically determined based on your departure and arrival dates.
            </Text>

            {/* Warning / Notice Box */}
            <View style={{ 
              flexDirection: "row", 
              backgroundColor: "#FFFBEB", 
              borderRadius: 12, 
              padding: 12, 
              borderWidth: 1, 
              borderColor: "#FDE68A",
              gap: 8,
              marginBottom: 20,
              alignItems: "flex-start"
            }}>
              <Icon name="warning" size={18} color="#D97706" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "bold", color: "#B45309", marginBottom: 2 }}>
                  Scheduling Policy
                </Text>
                <Text style={{ fontSize: 12, color: "#78350F", lineHeight: 16 }}>
                  Overlapping travel dates between different trips are not supported. Each trip must have unique dates.
                </Text>
              </View>
            </View>

            {/* Status Rows */}
            <View style={{ gap: 16, marginBottom: 24 }}>
              {/* Upcoming */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ width: 80, height: 28, borderRadius: 6, backgroundColor: "#E0F2FE", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#7DD3FC" }}>
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: "#0369A1" }}>Upcoming</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 }}>
                  Start and end date is future date.
                </Text>
              </View>

              {/* Ongoing */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ width: 80, height: 28, borderRadius: 6, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#A7F3D0" }}>
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: "#047857" }}>On going</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 }}>
                  Current date is between departure/start and arrival/end date.
                </Text>
              </View>

              {/* Past */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ width: 80, height: 28, borderRadius: 6, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB" }}>
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: "#4B5563" }}>Past</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 }}>
                  Travel date already past date.
                </Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowStatusExplainModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Close guide"
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 15 }}>
                Got it
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

export default CreateTripModal;