import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Animated, Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text, TouchableOpacity,
  View
} from "react-native";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";
import { ItineraryActivity, ItineraryExpense } from "../../../types/TravelDto";
import EditExpense from "./index";

interface ExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  itineraryExpense: ItineraryExpense | null;
  activityId?: string;
  activities?: ItineraryActivity[];
}

const { height: screenHeight } = Dimensions.get("window");

const ExpenseModal = ({
  visible,
  onClose,
  itineraryExpense,
  activityId,
  activities,
}: ExpenseModalProps) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [modalHeight, setModalHeight] = useState(screenHeight * 0.75);
  const { keyboardVisible, isFloating } = useKeyboardVisible();

  const handleCancel = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined} 
        style={{ flex: 1, paddingBottom: 10}}
      >
        <View className="flex-1 bg-black/50 justify-end">
              <Animated.View
              className="rounded-t-[30px] bg-white"
              style={[
                { height: modalHeight },
                {
                  paddingTop: keyboardVisible && !isFloating ? 180 : 5,
                }
              ]}
            >
              <StatusBar style="dark" />
              
              <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
                  <View className="flex-row items-center gap-2">
                      <Text className="text-2xl text-gray-700 font-medium">
                            {itineraryExpense?.id ? "Edit Expense" : "Add Expense"}
                      </Text>
                  </View>
                  <TouchableOpacity onPress={handleCancel} disabled={false}>
                      <Icon name="clear" size={36} color={"#333"} />
                  </TouchableOpacity>
              </View>
  
              <View className="flex-1">
                  <EditExpense
                    itineraryExpense={itineraryExpense}
                    activityId={activityId}
                    activities={activities}
                    onClose={onClose}
                  />
                </View>
            </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ExpenseModal;
