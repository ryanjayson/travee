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
import TripStatusBottomSheet from "./TripStatusBottomSheet";

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
            className="bg-gray-100 "
            style={[
              { height: "100%" },
              {
                // paddingTop: (mode === "edit" || keyboardVisible) ? insets.top + 0 : 0,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 24,
                transform: [{ translateY }],
              }
            ]}
          >
            <View
              className="flex-row justify-between items-center px-5 pb-5 "
              style={{ paddingTop: insets.top + 20 }}
            >
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={handleCancel}
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Close edit trip modal"
                  className="bg-secondary/20 rounded-full p-2"
                >
                  <Icon name="chevron-left" size={24} color={"#999"} />
                </TouchableOpacity>
                <Text className="text-3xl text-secondary font-medium">
                  {mode === "edit" ? "Edit Trip" : "Plan next trip"}
                </Text>
                <StatusBadge status={tripStatus} />
              </View>

              <TouchableOpacity
                onPress={() => setShowStatusExplainModal(true)}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Show status explanation"
                className="p-2"
              >
                <Icon name="info-outline" size={22} color={"#999"} />
              </TouchableOpacity>
            </View>
            <View className="flex-1">
              <Create
                onClose={handleCancel}
                onStatusChange={setTripStatus}
                tripData={tripData}
                mode={mode}
                onCreated={onCreated}
                hideSubmitButton={keyboardVisible}
                onScroll={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  isAtTop.current = y <= 0;
                }}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Status Explanation Bottom Sheet */}
      <TripStatusBottomSheet
        visible={showStatusExplainModal}
        onClose={() => setShowStatusExplainModal(false)}
      />
    </Modal>
  );
};

export default CreateTripModal;