import React, { useState } from "react";
import { View, Modal, Animated, Dimensions, KeyboardAvoidingView, Platform } from "react-native";
import Create from ".";

interface AddTripModalProps {
  showModal?: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const { height: screenHeight } = Dimensions.get("window");

const CreateTripModal = ({
  showModal = false,
  setShowModal,
}: AddTripModalProps) => {
  const [modalHeight] = useState(screenHeight);

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1, paddingTop: 40, paddingBottom: 10 }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View className="bg-white flex-1">
            <Create onClose={handleCancel} />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateTripModal;
