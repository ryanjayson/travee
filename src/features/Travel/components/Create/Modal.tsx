import React, { useState } from "react";
import { View, Modal, Animated, Dimensions } from "react-native";
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
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View className="bg-white flex-1" style={{ height: modalHeight }}>
          <Create onClose={handleCancel} />
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CreateTripModal;
