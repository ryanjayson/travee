import React, { useMemo, useState, useRef } from "react";
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
import { StatusBar } from "expo-status-bar";
import { useTravelContext } from "../../../../../context/TravelContext";
import { useItineraryActivity } from "../../../hooks/useActivity";
import ActivityModal from "../../Edit/Itinerary/Activity/Modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";
import { activityIcons } from "../../../../../components/ActivityIcon";

// AnimatedIcon removed to prevent TypeError on setNativeProps

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

  const yOffset = insets.top + 60; // Estimated parent modal header offset
  const parentHeight = screenHeight - yOffset;

  const SNAP_90 = parentHeight * 0.1;
  const SNAP_35 = parentHeight * 0.65;

  const translateY = useRef(new Animated.Value(SNAP_35)).current;

  const activityColor = activityIcons.find((icon) => icon.name === itineraryActivity?.type)?.color || "#9E9E9E";

  const animatedBgColor = translateY.interpolate({
    inputRange: [SNAP_90, SNAP_35],
    outputRange: ["rgba(0, 0, 0, 0.55)", "transparent"],
    extrapolate: "clamp",
  });

  const overlayOpacity = translateY.interpolate({
    inputRange: [SNAP_90, SNAP_35],
    outputRange: [0.55, 0],
    extrapolate: "clamp",
  });

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={handleCancel}
    >
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: activityColor, justifyContent: "flex-start" }}>

        <Animated.View 
          style={{ 
            height: modalHeight, 
            backgroundColor: animatedBgColor,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            overflow: "hidden",
            paddingTop: insets.top,
          }}
        >
          {/* Header View using activity background color, showing only back and edit icons */}
          <View style={{ 
            height: 52, 
            width: "100%", 
            backgroundColor: activityColor,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 8,
            position: "relative",
          }}>
            <TouchableOpacity
              onPress={handleCancel}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              style={{ padding: 4 }}
            >
              <View className="p-2 rounded-full bg-white/10">
                <Icon name="chevron-left" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowEditActivityModal(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit activity"
              style={{ padding: 8, marginRight: 8 }}
            >
              <Icon name="edit" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#000000",
                opacity: overlayOpacity,
              }}
            />
          </View>

          <Activity id={id} onClose={handleCancel} translateY={translateY} />
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
