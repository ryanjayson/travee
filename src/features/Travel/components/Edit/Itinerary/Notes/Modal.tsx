import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import EditActivity from "../Activity";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useKeyboardVisible } from "../../../../../../hooks/useKeyboardVisible";
import { ItineraryActivity } from "../../../../types/TravelDto";

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  // onSave: (title: string, description: string) => void;
  itineraryActivity: ItineraryActivity | null;
  itinerarySectionId?: string;
}

const { height: screenHeight } = Dimensions.get("window");

const ActivityModal = ({
  visible,
  onClose,
  itineraryActivity,
  itinerarySectionId,
}: ActivityModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const [modalHeight, setModalHeight] = useState(screenHeight * 0.6);
  const isSavingRef = useRef(false);
  const keyboardVisible = useKeyboardVisible();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      pan.setOffset({
        x: (pan.x as any)._value,
        y: (pan.y as any)._value,
      });
    },
    onPanResponderMove: (evt, gestureState) => {
      // Only respond to vertical movement
      if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
        // Calculate new height based on drag distance
        const dragDistance = gestureState.dy;
        const newHeight = modalHeight - dragDistance;
        const clampedHeight = Math.max(
          screenHeight * 0.4,
          Math.min(screenHeight * 0.8, newHeight)
        );
        setModalHeight(clampedHeight);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      pan.flattenOffset();

      // Snap to predefined heights
      const currentHeight = modalHeight;
      let targetHeight;

      if (currentHeight < screenHeight * 0.6) {
        targetHeight = screenHeight * 0.4; // Snap to small
      } else if (currentHeight < screenHeight * 0.75) {
        targetHeight = screenHeight * 0.6; // Snap to medium
      } else {
        targetHeight = screenHeight * 0.8; // Snap to large
      }

      setModalHeight(targetHeight);

      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
    },
  });

  const handleCancel = () => {
    Keyboard.dismiss();
    setError(null);
    setIsSaving(false);
    isSavingRef.current = false;
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined} 
        style={{ flex: 1, paddingBottom: 10}}
      >
        <View style={styles.overlay}>
          <Animated.View
            className="rounded-t-[30px] bg-white"
            style={[
              { height: modalHeight },
              {
                paddingTop:  keyboardVisible ? 40 : 10,
              }
            ]}
          >
            <StatusBar barStyle={"dark-content"} />
            {/* <View style={styles.handleContainer}>
              <Animated.View {...panResponder.panHandlers}>
                <View style={styles.handleBar} />
              </Animated.View>
            </View> */}

              <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
                  <Text className="tracking-wider uppercase text-base text-gray-500 font-medium">
                  {itineraryActivity?.id ? "Edit Activity" : "Add Activity"}
                  </Text>
                  <TouchableOpacity onPress={handleCancel} disabled={isSaving}>
                    <Icon name="clear" size={36} color={"#333"} />
                  </TouchableOpacity>
                </View>

            <View className="flex-1">
              <EditActivity
                itinerarySectionId={itinerarySectionId}
                itineraryActivity={itineraryActivity}
                onClose={onClose}
              />
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ActivityModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  handleBar: {
    width: 30,
    height: 4,
    backgroundColor: "#999",
    borderRadius: 2,
  },
  handleHint: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 16,
    color: "#183B7A",
  },
  cancelText: {
    color: "#183B7A",
    fontSize: 16,
  },
  disabledText: {
    color: "#999",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#183B7A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F6F8FC",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#183B7A",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonTextDisabled: {
    color: "#999",
  },
  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  savingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
