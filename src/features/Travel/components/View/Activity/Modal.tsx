import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import Activity from ".";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTravelContext } from "../../../../../context/TravelContext";
import { useItineraryActivity } from "../../../hooks/useActivity";
import ActivityModal from "../../Edit/Itinerary/Activity/Modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";

interface ViewActivityModalProps {
  id: string;
  showModal?: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const { height: screenHeight } = Dimensions.get("window");

const ViewActivityModal = ({
  id,
  showModal = false,
  setShowModal,
}: ViewActivityModalProps) => {
  const insets = useSafeAreaInsets();
  const modalHeight = useMemo(() => screenHeight, []);
  const { selectedTravelPlan } = useTravelContext();
  const { keyboardVisible, isFloating } = useKeyboardVisible();
  
  // Fetch activity data here to pass to Edit Modal
  const { data: itineraryActivity } = useItineraryActivity(id);
  
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);

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
          style={{ 
            height: modalHeight, 
            paddingTop: insets.top
          }}
        >
          <View className="p-1.5 flex-row items-center justify-between border-b border-gray-100">
            <View className="flex-row items-center">
              <TouchableOpacity
                className="pr-3.5 p-0.5"
                onPress={handleCancel}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="chevron-left" size={36} color="#777" />
              </TouchableOpacity>
   
              <Text className="text-xl font-medium">{selectedTravelPlan?.title}</Text>
            </View>

            {/* Edit button on the right */}
            <TouchableOpacity
              className="p-2 mr-2"
              onPress={() => setShowEditActivityModal(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit activity"
            >
              <Icon name="edit" size={24} color="#777" />
            </TouchableOpacity>
          </View>

          <Activity id={id} onClose={handleCancel} />
        </Animated.View>
      </View>

      {/* Edit Activity Modal */}
      {itineraryActivity && (
        <ActivityModal
          visible={showEditActivityModal}
          itineraryActivity={itineraryActivity}
          onClose={() => setShowEditActivityModal(false)}
        />
      )}
    </Modal>
  );
};
 
export default ViewActivityModal;
