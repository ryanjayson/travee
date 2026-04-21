import React, { useMemo } from "react";
import {
  View,
  Text,
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
      <View className="flex-1 bg-white justify-start">
        <Animated.View 
          className="bg-white rounded-t-xl overflow-hidden" 
          style={{ height: modalHeight }}
        >
          <View className="p-1.5 flex-row items-center border-b border-gray-100">
            <TouchableOpacity
              className="pr-3.5 p-0.5"
              onPress={handleCancel}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="keyboard-arrow-left" size={36} color="#777" />
            </TouchableOpacity>
 
            <Text className="text-xl font-medium">{selectedTravelPlan?.title}</Text>
          </View>
 
          <Activity id={id} onClose={handleCancel} />
        </Animated.View>
      </View>
    </Modal>
  );
};
 
export default ViewActivityModal;
