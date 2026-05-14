import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Create from ".";
import StatusBadge from "../../../../components/StatusBadge";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";
import { TravelStatus } from "../../../../types/enums";
import { Travel } from "../../types/TravelDto";

interface AddTripModalProps {
  showModal?: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  tripData?: Travel;
}

const { height: screenHeight } = Dimensions.get("window");

const CreateTripModal = ({
  showModal = false,
  setShowModal,
  tripData,
}: AddTripModalProps) => {

  const [isSaving, setIsSaving] = useState(false);
  const [modalHeight, setModalHeight] = useState(screenHeight * 0.75);
  const { keyboardVisible, isFloating } = useKeyboardVisible();
  const [tripStatus, setTripStatus] = useState(TravelStatus.Draft);

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
        <View className="flex-1 bg-black/50 justify-end" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
          <Animated.View
            className="rounded-t-[30px] bg-white"
            style={[
              { height: modalHeight },
              {
                paddingTop:  keyboardVisible && !isFloating  ? 180 : 5,
              }
            ]}
          >
            <StatusBar barStyle={"dark-content"} />
            <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
                <View className="flex-row items-center gap-2">
                    <Text className="text-2xl text-gray-700 font-medium">
                    Create next trip
                    </Text>
                    <StatusBadge status={tripStatus} />
                </View>
                <TouchableOpacity onPress={handleCancel} disabled={isSaving}>
                    <Icon name="clear" size={36} color={"#333"} />
                </TouchableOpacity>
            </View>
            <View className="flex-1">
              <Create onClose={handleCancel} onStatusChange={setTripStatus} tripData={tripData} />
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateTripModal;