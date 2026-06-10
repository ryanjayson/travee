import React, { useState, useEffect } from "react";
import { Modal, Keyboard, Platform } from "react-native";
import MapboxDestinationSelector, { MapboxPlace } from "./index";

interface MapboxDestinationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: MapboxPlace) => void;
  initialValue?: string;
}

const MapboxDestinationSelectorModal = ({
  visible,
  onClose,
  onSelect,
  initialValue = "",
}: MapboxDestinationSelectorModalProps) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow",
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide",
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleRequestClose = () => {
    if (isKeyboardVisible) {
      Keyboard.dismiss();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleRequestClose}
    >
      <MapboxDestinationSelector
        onClose={onClose}
        onSelect={onSelect}
        initialValue={initialValue}
      />
    </Modal>
  );
};

export default MapboxDestinationSelectorModal;
