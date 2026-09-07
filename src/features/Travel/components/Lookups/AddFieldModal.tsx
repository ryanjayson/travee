import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Checkbox, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";

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
    label: "Contact Name",
    description: "Organizer or point of contact person",
    iconName: "person",
    category: "Details",
  },
  {
    id: "contactNumber",
    label: "Contact Number",
    description: "Organizer phone or mobile number",
    iconName: "phone",
    category: "Details",
  },
  {
    id: "contactEmail",
    label: "Contact Email",
    description: "Organizer email address",
    iconName: "email",
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
  const insets = useSafeAreaInsets();
  const [tempSelected, setTempSelected] = useState<string[]>(selectedFieldIds);

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);

  const isClosingRef = useRef(false);

  // Sync selected state and trigger slide-up spring animation only on modal open
  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setTempSelected(selectedFieldIds);
      isAtTop.current = true;
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      isClosingRef.current = false;
      onClose();
    });
  }, [onClose, translateY]);

  const handleToggle = (id: string) => {
    setTempSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      isClosingRef.current = false;
      onApply(tempSelected);
      onClose();
    });
  };

  // Drag down gesture responder
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
        if (currentDy > 100 || gestureState.vy > 0.5) {
          if (isClosingRef.current) return;
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            isClosingRef.current = false;
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Background fade opacity interpolated from sheet position
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
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <Animated.View
        {...dragPanResponder.panHandlers}
        className="flex-1 justify-end"
        style={{ opacity: backdropOpacity, backgroundColor: "rgba(0,0,0,0.5)", }}
      >
        {/* Backdrop tap to close */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          className="absolute inset-0"
          accessibilityRole="button"
          accessibilityLabel="Dismiss add field bottom sheet"
        />

        {/* Bottom Sheet Card */}
        <Animated.View
          className="w-full rounded-t-[28px] overflow-hidden shadow-2xl"
          style={[
            {
              transform: [{ translateY }],
              backgroundColor: colors.surface || "#FFFFFF",
              maxHeight: screenHeight * 0.78,
            },
          ]}
        >
          {/* Drag Handle Bar */}
          <View className="w-full items-center pt-2.5 pb-1.5">
            <View
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: colors.outlineVariant || "#D0D5DD" }}
            />
          </View>

          {/* Header */}
          <View
            className="px-6 pt-1 pb-3.5 border-b flex-row justify-between items-start"
            style={{ borderBottomColor: colors.outlineVariant || "#F2F4F7" }}
          >
            <View className="flex-1">
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={handleDismiss}
                  accessibilityRole="button"
                  accessibilityLabel="Close add field modal"
                  className="mr-1"
                  activeOpacity={0.7}
                >
                  <Icon
                    name="chevron-left"
                    size={28}
                    color={"#999"}
                  />
                </TouchableOpacity>
                <Text className="text-2xl font-semibold text-accent">
                  Add Field
                </Text>
              </View>

              <Text className="text-tertiary text-base mt-1">
                Select applicable fields to include in your plan
              </Text>
            </View>
          </View>

          {/* Scrollable list of fields */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
            onScroll={(e) => {
              isAtTop.current = e.nativeEvent.contentOffset.y <= 0;
            }}
            scrollEventThrottle={16}
          >
            {APPLICABLE_PLAN_FIELDS.map((item) => {
              const isChecked = tempSelected.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  className="px-6 py-3.5 border-b flex-row items-center gap-4"
                  style={{
                    borderBottomColor: colors.outlineVariant || "#F2F4F7",
                    backgroundColor: isChecked
                      ? `${colors.primary || "#263F69"}0A`
                      : "transparent",
                  }}
                  onPress={() => handleToggle(item.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.label}, ${isChecked ? "checked" : "unchecked"}`}
                >
                  {/* Icon badge */}
                  <View
                    className="w-[42px] h-[42px] rounded-full border items-center justify-center"
                    style={{
                      backgroundColor: isChecked
                        ? `${colors.primary || "#263F69"}18`
                        : colors.surfaceVariant || "#F2F4F7",
                      borderColor: isChecked
                        ? `${colors.primary || "#263F69"}35`
                        : colors.outlineVariant || "#E4E7EC",
                    }}
                  >
                    <Icon
                      name={item.iconName as any}
                      size={22}
                      color={
                        isChecked
                          ? colors.primary || "#263F69"
                          : colors.onSurfaceVariant || "#667085"
                      }
                    />
                  </View>

                  {/* Label & Description */}
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold"
                      style={{
                        color: colors.onSurface || "#101828",
                      }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      className="text-[13px] mt-0.5"
                      style={{ color: colors.onSurfaceVariant || "#667085" }}
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
                      uncheckedColor={colors.outlineVariant || "#D0D5DD"}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sticky Bottom Action Footer */}
          <View
            className="px-6 pt-3 border-t"
            style={{
              backgroundColor: colors.surface || "#FFFFFF",
              borderTopColor: colors.outlineVariant || "#F0F0F0",
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
            <Button
              mode="contained"
              onPress={handleApply}
              className="rounded-2xl"
              contentStyle={{ height: 48 }}
              buttonColor={colors.primary || "#263F69"}
              textColor={colors.onPrimary || "#FFFFFF"}
            >
              Apply ({tempSelected.length} selected)
            </Button>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default AddFieldModal;
