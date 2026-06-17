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

  const formattedStartDate = selectedTravelPlan?.startOrDepartureDate ? selectedTravelPlan.startOrDepartureDate.toLocaleString("en-US", { month: "short", day: "2-digit" }) : "";
  const formattedEndDate = selectedTravelPlan?.endOrReturnDate ? selectedTravelPlan.endOrReturnDate.toLocaleString("en-US", { month: "short", day: "2-digit" }) : "";

  // Opacity of the white header elements (1 at SNAP_90, 0 at SNAP_35)
  const whiteOpacity = translateY.interpolate({
    inputRange: [SNAP_90, SNAP_35],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Opacity of the dark header elements (0 at SNAP_90, 1 at SNAP_35)
  const darkOpacity = translateY.interpolate({
    inputRange: [SNAP_90, SNAP_35],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const animatedBgColor = translateY.interpolate({
    inputRange: [SNAP_90, SNAP_35],
    outputRange: ["rgba(0, 0, 0, 0.55)", "#FFFFFF"],
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
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: "#FFFFFF", justifyContent: "flex-start" }}>

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
          <View style={{ 
            height: 52, width: "100%", position: "relative" }}>
            {/* White overlay header when expanded (SNAP_90) */}
            <Animated.View 
              style={{ 
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                padding: 6,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "transparent",
                // backgroundColor: animatedBgColor,
                opacity: whiteOpacity,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={handleCancel}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  style={{ paddingRight: 14, padding: 2 }}
                >
                  <Icon name="chevron-left" size={36} color="#FFFFFF" />
                </TouchableOpacity>
     

              <View className="flex flex-col">
                <Text 
                  style={{ 
                    fontSize: 16,
                    fontWeight: "500",
                    color: "#FFFFFF",
                  }}
                >
                  {selectedTravelPlan?.title}
                </Text>
                    <Text 
                  style={{ 
                    fontSize: 12,
                    color: "#FFFFFF",
                  }}
                >
                  {formattedStartDate} - {formattedEndDate}
                </Text>
              </View>

              </View>

              <TouchableOpacity
                onPress={() => setShowEditActivityModal(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Edit activity"
                style={{ padding: 8, marginRight: 8 }}
              >
                <Icon name="edit" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>

            {/* Dark text / white bg header when collapsed (SNAP_35) */}
            <Animated.View 
              style={{ 
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                padding: 6,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "#f3f4f6",
                // backgroundColor: animatedBgColor,
                opacity: darkOpacity,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={handleCancel}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  style={{ paddingRight: 14, padding: 2 }}
                >
                  <Icon name="chevron-left" size={36} color="#777777" />
                </TouchableOpacity>
     
              <View className="flex flex-col">
                <Text 
                  style={{ 
                    fontSize: 16,
                    fontWeight: "500",
                    color: "#000000",
                  }}
                >
                  {selectedTravelPlan?.title}
                </Text>
                    <Text 
                  style={{ 
                    fontSize: 12,
                    color: "#000000",
                  }}
                >
                  {formattedStartDate} - {formattedEndDate}
                </Text>
              </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowEditActivityModal(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Edit activity"
                style={{ padding: 8, marginRight: 8 }}
              >
                <Icon name="edit" size={24} color="#777777" />
              </TouchableOpacity>
            </Animated.View>
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
