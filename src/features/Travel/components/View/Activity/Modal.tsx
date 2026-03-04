import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import Activity from ".";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTravelContext } from "../../../../../context/TravelContext";

interface ViewActivityModalProps {
  id: number;
  showModal?: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const { height: screenHeight } = Dimensions.get("window");

const ViewActivityModal = ({
  id,
  showModal = false,
  setShowModal,
}: ViewActivityModalProps) => {
  const modalHeight = useMemo(() => screenHeight * 0.8, []);
  const { selectedTravelPlan } = useTravelContext();

  const handleCancel = () => setShowModal(false);

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, { height: modalHeight }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCancel}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="keyboard-arrow-left" size={36} color="#777" />
            </TouchableOpacity>

            <Text style={styles.title}>{selectedTravelPlan?.title}</Text>
          </View>

          <Activity id={id} onClose={handleCancel} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#FFF",
    justifyContent: "flex-start",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  header: {
    padding: 6,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  backButton: {
    paddingRight: 14,
    padding: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "500",
  },
});

export default ViewActivityModal;
