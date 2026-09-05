import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useRef, useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";
import { Button, Checkbox, useTheme } from "react-native-paper";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ApplicableField {
  id: string;
  label: string;
  description: string;
  iconName: string;
  category: string;
}

export const APPLICABLE_PLAN_FIELDS: ApplicableField[] = [
  {
    id: "location",
    label: "Location / Address",
    description: "Pinpoint venue on map or add physical address",
    iconName: "place",
    category: "General",
  },
  {
    id: "website",
    label: "Website / URL",
    description: "Official website, booking link, or info guide",
    iconName: "language",
    category: "Details",
  },
  {
    id: "bookingReference",
    label: "Booking Reference",
    description: "Reservation number, voucher, or confirmation code",
    iconName: "confirmation-number",
    category: "Details",
  },
  {
    id: "contactName",
    label: "Contact Details",
    description: "Organizer name, phone number, or email address",
    iconName: "contact-phone",
    category: "Details",
  },
  {
    id: "contactNumber",
    label: "Contact Number",
    description: "Organizer phone number",
    iconName: "contact-phone",
    category: "Details",
  }, {
    id: "contactEmail",
    label: "Contact Email",
    description: "Organizer email address",
    iconName: "contact-mail",
    category: "Details",
  },
  {
    id: "priority",
    label: "Priority",
    description: "Mark plan urgency (High, Medium, or Low)",
    iconName: "flag",
    category: "General",
  },

];

interface AddFieldModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFieldIds: string[];
  onApply: (selectedIds: string[]) => void;
}

const { height: screenHeight } = Dimensions.get("window");

const AddFieldModal = ({
  visible,
  onClose,
  selectedFieldIds,
  onApply,
}: AddFieldModalProps) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelected, setTempSelected] = useState<string[]>(selectedFieldIds);
  const [modalHeight] = useState(screenHeight * 0.85);
  const { keyboardVisible } = useKeyboardVisible();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);

  // Sync selected state when modal opens
  useEffect(() => {
    if (visible) {
      setTempSelected(selectedFieldIds);
      setSearchQuery("");
      isAtTop.current = true;
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, selectedFieldIds]);

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (keyboardVisible) return false;
        const { dx, dy } = gestureState;
        if (isAtTop.current && dy > 8 && Math.abs(dy) > Math.abs(dx)) {
          return true;
        }
        return false;
      },
      onPanResponderGrant: (evt, gestureState) => {
        dragStartDy.current = gestureState.dy;
      },
      onPanResponderMove: (_, gestureState) => {
        const currentDy = gestureState.dy - dragStartDy.current;
        if (currentDy > 0) {
          translateY.setValue(currentDy);
        } else {
          translateY.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentDy = gestureState.dy - dragStartDy.current;
        if (currentDy > 120 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        dragStartDy.current = gestureState.dy;
      },
      onPanResponderMove: (_, gestureState) => {
        const currentDy = gestureState.dy - dragStartDy.current;
        if (currentDy > 0) {
          translateY.setValue(currentDy);
        } else {
          translateY.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentDy = gestureState.dy - dragStartDy.current;
        if (currentDy > 120 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleCancel = () => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleToggle = (fieldId: string) => {
    setTempSelected((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleApply = () => {
    onApply(tempSelected);
    handleCancel();
  };

  const filteredFields = APPLICABLE_PLAN_FIELDS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Animated.View
          className="flex-1 justify-end"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: backdropOpacity,
          }}
        >
          <Animated.View
            {...sheetPanResponder.panHandlers}
            className="rounded-t-[30px] bg-white overflow-hidden"
            style={[
              { height: keyboardVisible ? "100%" : modalHeight },
              {
                paddingTop: keyboardVisible ? insets.top + 10 : 0,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 24,
                transform: [{ translateY }],
              },
            ]}
          >
            <StatusBar style="dark" />

            {/* Drag Handle */}
            {!keyboardVisible && (
              <View
                {...dragPanResponder.panHandlers}
                className="w-full items-center py-3 bg-white rounded-t-[30px]"
              >
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>
            )}

            {/* Header */}
            <View
              {...(!keyboardVisible && dragPanResponder.panHandlers)}
              className="flex-row justify-between items-center px-6 pb-4 border-b border-gray-200"
              style={{ paddingTop: keyboardVisible ? 0 : 2 }}
            >
              <View className="flex-1 gap-1">
                <Text
                  className="text-2xl font-bold"
                  style={{ color: colors.primary || "#263F69" }}
                >
                  Add Field
                </Text>
                <Text className="text-sm text-gray-500">
                  Select applicable fields to include in your plan
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancel}
                accessibilityRole="button"
                accessibilityLabel="Close add field modal"
                className="p-1"
              >
                <Icon name="clear" size={24} color="#999" />
              </TouchableOpacity>
            </View>


            {/* Scrollable list of fields */}
            <View className="flex-1">
              <ScrollView
                onScroll={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  isAtTop.current = y <= 0;
                }}
                scrollEventThrottle={16}
                keyboardShouldPersistTaps="handled"
              >
                {filteredFields.map((item) => {
                  const isChecked = tempSelected.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      className="px-6 py-3.5 border-b border-gray-100 flex-row items-center gap-4 active:bg-gray-50"
                      onPress={() => handleToggle(item.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.label}, ${isChecked ? "checked" : "unchecked"}`}
                    >
                      {/* Icon badge */}
                      <View
                        style={[
                          styles.fieldIconBadge,
                          {
                            backgroundColor: isChecked
                              ? `${colors.primary || "#263F69"}14`
                              : "#F2F4F7",
                            borderColor: isChecked
                              ? `${colors.primary || "#263F69"}30`
                              : "#E4E7EC",
                          },
                        ]}
                      >
                        <Icon
                          name={item.iconName as any}
                          size={22}
                          color={isChecked ? (colors.primary || "#263F69") : "#667085"}
                        />
                      </View>

                      {/* Label & Description */}
                      <View className="flex-1">
                        <Text
                          className="text-lg font-semibold"
                          style={{
                            color: isChecked ? "#101828" : "#344054",
                          }}
                        >
                          {item.label}
                        </Text>
                        <Text
                          className="text-sm text-gray-500 mt-0.5"
                          numberOfLines={1}
                        >
                          {item.description}
                        </Text>
                      </View>

                      {/* Checkbox */}
                      <View pointerEvents="none">
                        <Checkbox.Android
                          status={isChecked ? "checked" : "unchecked"}
                          color={colors.primary || "#263F69"}
                          uncheckedColor="#D0D5DD"
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Bottom Action Footer */}
            <View
              className="px-6 py-4 border-t border-gray-100 bg-white"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <Button
                mode="contained"
                onPress={handleApply}
                style={{ borderRadius: 16 }}
                contentStyle={{ height: 48 }}
                buttonColor={colors.primary || "#263F69"}
              >
                Apply ({tempSelected.length} selected)
              </Button>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fieldIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AddFieldModal;
