import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
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

  // Sync selected state and trigger slide-up spring animation on open
  useEffect(() => {
    if (visible) {
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
  }, [visible, selectedFieldIds]);

  const handleDismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [onClose, translateY]);

  const handleToggle = (id: string) => {
    setTempSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    onApply(tempSelected);
    handleDismiss();
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
        style={[
          styles.backdropContainer,
          { opacity: backdropOpacity },
        ]}
      >
        {/* Backdrop tap to close */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Dismiss add field bottom sheet"
        />

        {/* Bottom Sheet Card */}
        <Animated.View
          style={[
            styles.sheetCard,
            {
              transform: [{ translateY }],
              backgroundColor: colors.surface || "#FFFFFF",
              maxHeight: screenHeight * 0.78,
            },
          ]}
        >
          {/* Drag Handle Bar */}
          <View {...dragPanResponder.panHandlers} style={styles.dragHandleContainer}>
            <View
              style={[
                styles.dragHandleBar,
                { backgroundColor: colors.outlineVariant || "#D0D5DD" },
              ]}
            />
          </View>

          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: colors.outlineVariant || "#F2F4F7" },
            ]}
          >
            <View style={styles.headerTitleContainer}>
              <Text
                style={[
                  styles.title,
                  { color: colors.primary || "#263F69" },
                ]}
              >
                Add Field
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.onSurfaceVariant || "#667085" },
                ]}
              >
                Select applicable fields to include in your plan
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel="Close add field modal"
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Icon
                name="clear"
                size={24}
                color={colors.onSurfaceVariant || "#98A2B3"}
              />
            </TouchableOpacity>
          </View>

          {/* Scrollable list of fields */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
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
                  style={[
                    styles.itemRow,
                    {
                      borderBottomColor: colors.outlineVariant || "#F2F4F7",
                      backgroundColor: isChecked
                        ? `${colors.primary || "#263F69"}0A`
                        : "transparent",
                    },
                  ]}
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
                          ? `${colors.primary || "#263F69"}18`
                          : colors.surfaceVariant || "#F2F4F7",
                        borderColor: isChecked
                          ? `${colors.primary || "#263F69"}35`
                          : colors.outlineVariant || "#E4E7EC",
                      },
                    ]}
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
                  <View style={styles.itemTextContainer}>
                    <Text
                      style={[
                        styles.itemLabel,
                        {
                          color: colors.onSurface || "#101828",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.itemDescription,
                        { color: colors.onSurfaceVariant || "#667085" },
                      ]}
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
            style={[
              styles.footerContainer,
              {
                backgroundColor: colors.surface || "#FFFFFF",
                borderTopColor: colors.outlineVariant || "#F0F0F0",
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <Button
              mode="contained"
              onPress={handleApply}
              style={styles.applyButton}
              contentStyle={styles.applyButtonContent}
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

const styles = StyleSheet.create({
  backdropContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetCard: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    overflow: "hidden",
  },
  dragHandleContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  dragHandleBar: {
    width: 40,
    height: 4.5,
    borderRadius: 9999,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitleContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 12,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  itemRow: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  fieldIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTextContainer: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  applyButton: {
    borderRadius: 16,
  },
  applyButtonContent: {
    height: 48,
  },
});

export default AddFieldModal;
