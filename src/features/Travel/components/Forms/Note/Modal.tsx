import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import EditNote from "./index";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";
import { ItineraryNote, ItineraryActivity } from "../../../types/TravelDto";

interface NoteModalProps {
  visible: boolean;
  onClose: () => void;
  itineraryNote: ItineraryNote | null;
  activities?: ItineraryActivity[];
}

const { height: screenHeight } = Dimensions.get("window");

const NoteModal = ({ visible, onClose, itineraryNote, activities }: NoteModalProps) => {
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
        <View style={styles.overlay}>
          <Animated.View
            className="rounded-t-[30px] bg-white"
            style={{ height: screenHeight * 0.85, paddingTop: keyboardVisible ? 40 : 10 }}
          >
            <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
              <Text className="tracking-wider uppercase text-base text-gray-500 font-medium">
                {itineraryNote?.id ? "Edit Note" : "Add Note"}
              </Text>
              <TouchableOpacity accessibilityRole="button" onPress={handleCancel}>
                <Icon name="clear" size={36} color="#333" />
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
  );
};

export default NoteModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
});
