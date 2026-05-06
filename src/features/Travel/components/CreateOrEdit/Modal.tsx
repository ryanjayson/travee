import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";
import TripDetail from "../Forms/TripDetail";

interface AddTripModalProps {
  showModal?: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const { height: screenHeight } = Dimensions.get("window");

const CreateTripModal = ({
  showModal = false,
  setShowModal,
}: AddTripModalProps) => {

  const [isSaving, setIsSaving] = useState(false);
  const [modalHeight, setModalHeight] = useState(screenHeight * 0.75);
  const keyboardVisible = useKeyboardVisible();


  const handleCancel = () => {
       setShowModal(false);
  };

  return (
    <Modal visible={showModal} 
      transparent
      animationType="none">
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
                paddingTop:  keyboardVisible ? 180 : 5,
              }
            ]}
          >
            <StatusBar barStyle={"dark-content"} />

            <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
                  <Text className="text-2xl text-gray-700 font-medium">
                  Create next trip
                  </Text>
                  <TouchableOpacity onPress={handleCancel} disabled={isSaving}>
                    <Icon name="clear" size={36} color={"#333"} />
                  </TouchableOpacity>
                </View>

            <View className="flex-1">
                  <TripDetail mode="create" onClose={handleCancel} />
              </View>
          </Animated.View>
          </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateTripModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
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
