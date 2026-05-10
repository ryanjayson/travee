import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text, TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";
import { ItineraryActivity, ItineraryNote } from "../../../types/TravelDto";
import EditNote from "./index";

interface NoteModalProps {
  visible: boolean;
  onClose: () => void;
  itineraryNote: ItineraryNote | null;
  activities?: ItineraryActivity[];
}
const { height: screenHeight } = Dimensions.get("window");

const NoteModal = ({ visible, onClose, itineraryNote, activities }: NoteModalProps) => {
  const [modalHeight, setModalHeight] = useState(screenHeight * 0.75);
  const keyboardVisible = useKeyboardVisible();

  const handleCancel = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined}
        style={{ flex: 1 }}
      >
          <View className="flex-1 bg-black/50 justify-end">
            <Animated.View
              className="rounded-t-[30px] bg-white"
              style={[
                { height: modalHeight },
                {
                  paddingTop:  keyboardVisible ? 180 : 5,
                }
              ]}
            >
              <StatusBar barStyle={"dark-content"} />
              <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
                  <View className="flex-row items-center gap-2">
                      <Text className="text-2xl text-gray-700 font-medium">
                            {itineraryNote?.id ? "Edit Note" : "Add Note"}
                      </Text>
                  </View>
                  <TouchableOpacity onPress={handleCancel} disabled={false}>
                      <Icon name="clear" size={36} color={"#333"} />
                  </TouchableOpacity>
              </View>
  
              <View className="flex-1">
                  <EditNote
                  itineraryNote={itineraryNote}
                  activities={activities}
                  onClose={onClose}
                />
              </View>
            </Animated.View>
          </View>
      </KeyboardAvoidingView>
    </Modal>
  )
};

export default NoteModal;
