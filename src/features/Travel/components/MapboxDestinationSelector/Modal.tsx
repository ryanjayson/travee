import React from "react";
import { Modal } from "react-native";
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
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
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
