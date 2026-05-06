import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import EditSection from "../Section";
import { MaterialIcons as Icon } from "@expo/vector-icons";
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
                   {itinerarySection?.id && itinerarySection?.id !== ""
                  ? "Edit Section"
                  : "Add Section"}
                    </Text>
                </View>
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
