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

interface AddTripModalProps {
  showModal?: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  tripData?: Travel;
  mode?: "create" | "edit";
}

const { height: screenHeight } = Dimensions.get("window");

const CreateTripModal = ({
  showModal = false,
  setShowModal,
  tripData,
  mode = "create",
}: AddTripModalProps) => {

  const [isSaving, setIsSaving] = useState(false);
  const [modalHeight, setModalHeight] = useState(screenHeight * 0.75);
  const { keyboardVisible, isFloating } = useKeyboardVisible();
  const [tripStatus, setTripStatus] = useState(TravelStatus.Draft);
  const insets = useSafeAreaInsets();
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
                onScroll={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  isAtTop.current = y <= 0;
                }}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateTripModal;