import React, { useState, useRef } from "react";
import {
  View,
  Text, TouchableOpacity,
  Modal,
  Animated, Dimensions, StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import EditActivity from "../Activity";
import { MaterialIcons as Icon } from "@expo/vector-icons";
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

  // const panResponder = PanResponder.create({
  //   onStartShouldSetPanResponder: () => true,
  //   onMoveShouldSetPanResponder: () => true,
  //   onPanResponderGrant: () => {
  //     pan.setOffset({
  //       x: (pan.x as any)._value,
  //       y: (pan.y as any)._value,
  //     });
  //   },
  //   onPanResponderMove: (evt, gestureState) => {
  //     // Only respond to vertical movement
  //     if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
  //       // Calculate new height based on drag distance
  //       const dragDistance = gestureState.dy;
  //       const newHeight = modalHeight - dragDistance;
  //       const clampedHeight = Math.max(
  //         screenHeight * 0.4,
  //         Math.min(screenHeight * 0.8, newHeight)
  //       );
  //       setModalHeight(clampedHeight);
  //     }
  //   },
  //   onPanResponderRelease: (evt, gestureState) => {
  //     pan.flattenOffset();

  //     // Snap to predefined heights
  //     const currentHeight = modalHeight;
  //     let targetHeight;

  //     if (currentHeight < screenHeight * 0.6) {
  //       targetHeight = screenHeight * 0.4; // Snap to small
  //     } else if (currentHeight < screenHeight * 0.75) {
  //       targetHeight = screenHeight * 0.6; // Snap to medium
  //     } else {
  //       targetHeight = screenHeight * 0.8; // Snap to large
  //     }

  //     setModalHeight(targetHeight);

  //     Animated.spring(pan, {
  //       toValue: { x: 0, y: 0 },
  //       useNativeDriver: false,
  //     }).start();
  //   },
  // });

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
        <View className="flex-1 bg-black/50 justify-end" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
           <Animated.View
            className="rounded-t-[30px] bg-white"
            style={[
              { height: modalHeight },
              {
                paddingTop:  keyboardVisible ? 30 : 5,
              }
            ]}
          >
            <StatusBar barStyle={"dark-content"} />
            <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
                <View className="flex-row items-center gap-2">
                    <Text className="text-2xl text-gray-700 font-medium">
                        {itineraryActivity?.id ? "Edit Activity" : "Add Activity"}
                    </Text>
                </View>
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