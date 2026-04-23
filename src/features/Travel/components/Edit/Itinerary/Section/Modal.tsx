import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import EditSection from "../Section";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useKeyboardVisible } from "../../../../../../hooks/useKeyboardVisible";
import { ItinerarySection } from "../../../../types/TravelDto";

interface SectionModalProps {
  visible: boolean;
  onClose: () => void;
  itinerarySection: ItinerarySection | null;
}

const { height: screenHeight } = Dimensions.get("window");

//Modal for editing a section
const SectionModal = ({
  visible,
  onClose,
  itinerarySection,
}: SectionModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
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
          Math.min(screenHeight * 0.8, newHeight),
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
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            className="rounded-t-[30px] bg-white "
            style={[
              { height: modalHeight },
              {
                paddingTop:  keyboardVisible ? 40 : 10,
              }
            ]}
          >
            <StatusBar barStyle={"light-content"} />
            {/* <View className="items-center py-2.5">
              <TouchableOpacity onPress={handleCancel} disabled={isSaving}>
                <View className="w-[30px] h-1 bg-[#999] rounded-sm" />
              </TouchableOpacity>

            </View> */}

            <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
              <Text className="tracking-wider uppercase text-base text-gray-500 font-medium">
                {itinerarySection?.id && itinerarySection?.id !== ""
                  ? "Edit Section"
                  : "Add Section"}
              </Text>
              <TouchableOpacity onPress={handleCancel} disabled={isSaving}>
                <Icon name="clear" size={36} color={"#333"} />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <EditSection
                itinerarySection={itinerarySection}
                onClose={onClose}
              />
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};



export default SectionModal;
