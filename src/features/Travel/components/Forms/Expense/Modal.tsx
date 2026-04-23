import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import EditExpense from "./index";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";
import { ItineraryExpense } from "../../../types/TravelDto";

interface ExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  itineraryExpense: ItineraryExpense | null;
  activityId?: string;
}

const { height: screenHeight } = Dimensions.get("window");

const ExpenseModal = ({
  visible,
  onClose,
  itineraryExpense,
  activityId,
}: ExpenseModalProps) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [modalHeight, setModalHeight] = useState(screenHeight * 0.6);
  const keyboardVisible = useKeyboardVisible();

  const handleCancel = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined} 
        style={{ flex: 1 }}
      >
        <View style={styles.overlay}>
          <Animated.View
            className="rounded-t-[30px] bg-white"
            style={[
              { height: modalHeight },
              {
                paddingTop: keyboardVisible ? 40 : 10,
              }
            ]}
          >
            <StatusBar barStyle={"dark-content"} />
            <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
              <Text className="tracking-wider uppercase text-base text-gray-500 font-medium">
                {itineraryExpense?.id ? "Edit Expense" : "Add Expense"}
              </Text>
              <TouchableOpacity onPress={handleCancel}>
                <Icon name="clear" size={36} color={"#333"} />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <EditExpense
                itineraryExpense={itineraryExpense}
                activityId={activityId}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  handleBar: {
    width: 30,
    height: 4,
    backgroundColor: "#999",
    borderRadius: 2,
  },
  handleHint: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 16,
    color: "#183B7A",
  },
  cancelText: {
    color: "#183B7A",
    fontSize: 16,
  },
  disabledText: {
    color: "#999",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#183B7A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F6F8FC",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#183B7A",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonTextDisabled: {
    color: "#999",
  },
  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  savingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
