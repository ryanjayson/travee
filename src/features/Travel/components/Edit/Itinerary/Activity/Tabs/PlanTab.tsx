import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme, TextInput } from "react-native-paper";
import DateTime from "../DateTime";
import ActivityPlanTypeLookupModal, {
  ACTIVITY_PLAN_TYPES,
} from "../../../../Lookups/ActivityPlanTypeLookupModal";
import AddFieldModal, {
  APPLICABLE_PLAN_FIELDS,
} from "../../../../Lookups/AddFieldModal";
import { ActivityPlanType } from "../../../../../../../types/enums";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

const PRIORITIES = ["High", "Medium", "Low"];

interface PlanTabProps {
  values: any;
  handleChange?: any;
  handleBlur?: any;
  setFieldValue?: any;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
  onPressDate: () => void;
  onPressTime: () => void;
  onClearDate: () => void;
  onClearTime: () => void;
  onPressEndDate?: () => void;
  onPressEndTime?: () => void;
  onClearEndDate?: () => void;
  onClearEndTime?: () => void;
}

export default function PlanTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  noPadding = false,
  fieldRefs,
  onPressDate,
  onPressTime,
  onClearDate,
  onClearTime,
  onPressEndDate,
  onPressEndTime,
  onClearEndDate,
  onClearEndTime,
}: PlanTabProps) {
  const { colors } = useTheme();
  const [showPlanTypeModal, setShowPlanTypeModal] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [selectedPriority, setSelectedPriority] = useState<string | null>(values?.priority || null);

  const getFieldValue = (id: string) => {
    if (id === "location" && values?.destination) {
      return customFieldValues[id] !== undefined ? customFieldValues[id] : values.destination;
    }
    if (values?.[id] !== undefined) {
      return customFieldValues[id] !== undefined ? customFieldValues[id] : String(values[id]);
    }
    return customFieldValues[id] || "";
  };

  const handleCustomFieldChange = (id: string, text: string) => {
    setCustomFieldValues((prev) => ({ ...prev, [id]: text }));
    if (id === "location" && setFieldValue) {
      setFieldValue("destination", text);
    }
    if (setFieldValue) {
      setFieldValue(id, text);
    }
  };

  const selectedPlanType = ACTIVITY_PLAN_TYPES.find(
    (p) => p.type === values.planType
  );


  const handleApplyFields = (fieldIds: string[]) => {
    setSelectedFieldIds(fieldIds);
  };

  return (
    <View className={`flex-1 pt-2 ${noPadding ? "" : "px-5"}`}>
      {/* Header */}
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="event-note" size={30} color={colors.onSurface || "#000"} />
        <Text className="text-md font-bold tracking-wider uppercase">
          Plan Details
        </Text>
      </View>

      {/* Plan Type Selector Field */}
      <View
        ref={(el) => {
          if (fieldRefs) fieldRefs.current["planType"] = el;
        }}
        className="mb-5"
      >
        <Text className="text-xs font-semibold tracking-wider uppercase mb-1.5">
          Plan Type
        </Text>
        <TouchableOpacity
          onPress={() => setShowPlanTypeModal(true)}
          style={[
            styles.selectorButton,
            {
              borderColor: selectedPlanType
                ? `${selectedPlanType.color}40`
                : "#E0E0E0",
              backgroundColor: "#FFFFFF",
            },
          ]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            selectedPlanType
              ? `Plan type selected: ${selectedPlanType.label}. Tap to change.`
              : "Select plan type"
          }
        >
          <View style={styles.selectorContent}>
            {/* Color-assigned icon badge */}
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: selectedPlanType
                    ? `${selectedPlanType.color}18`
                    : "#F2F4F7",
                  borderColor: selectedPlanType
                    ? `${selectedPlanType.color}35`
                    : "#E4E7EC",
                },
              ]}
            >
              <Icon
                name={(selectedPlanType?.iconName || "category") as any}
                size={20}
                color={selectedPlanType ? selectedPlanType.color : "#98A2B3"}
              />
            </View>

            {/* Label and description */}
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.label,
                  {
                    color: selectedPlanType ? "#1D2939" : "#98A2B3",
                    fontWeight: selectedPlanType ? "600" : "400",
                  },
                ]}
              >
                {selectedPlanType ? selectedPlanType.label : "Select Plan Type"}
              </Text>
              {selectedPlanType?.subtext && (
                <Text style={styles.subtext} numberOfLines={1}>
                  {selectedPlanType.subtext}
                </Text>
              )}
            </View>

            {/* Clear Button (if selected) */}
            {selectedPlanType && (
              <TouchableOpacity
                onPress={() => setFieldValue?.("planType", null)}
                style={styles.clearButton}
                accessibilityRole="button"
                accessibilityLabel="Clear plan type selection"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={20} color="#98A2B3" />
              </TouchableOpacity>
            )}

            {/* Dropdown chevron */}
            <Icon name="keyboard-arrow-down" size={24} color="#98A2B3" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Date & Time Section */}
      <DateTime
        startDate={values.startDate}
        startTime={values.startTime}
        endDate={values.endDate}
        endTime={values.endTime}
        onPressDate={onPressDate}
        onPressTime={onPressTime}
        onClearDate={onClearDate}
        onClearTime={onClearTime}
        onPressEndDate={onPressEndDate}
        onPressEndTime={onPressEndTime}
        onClearEndDate={onClearEndDate}
        onClearEndTime={onClearEndTime}
      />

      {/* Dynamically Added Fields UI (UI Focus) */}
      {selectedFieldIds.map((fieldId) => {
        const fieldMeta = APPLICABLE_PLAN_FIELDS.find((f) => f.id === fieldId);
        if (!fieldMeta) return null;

        return (
          <View key={fieldId} className="mb-5">
            {fieldId === "location" && (
              <FloatingLabelInput
                label={fieldMeta.label}
                value={getFieldValue("location")}
                onChangeText={(text) => handleCustomFieldChange("location", text)}
                right={<TextInput.Icon icon="map-marker-outline" color="#98A2B3" />}
              />
            )}

            {fieldId === "website" && (
              <FloatingLabelInput
                label={fieldMeta.label}
                value={getFieldValue("website")}
                onChangeText={(text) => handleCustomFieldChange("website", text)}
                keyboardType="url"
                right={<TextInput.Icon icon="web" color="#98A2B3" />}
              />
            )}

            {fieldId === "budget" && (
              <FloatingLabelInput
                label={fieldMeta.label}
                value={getFieldValue("budget")}
                onChangeText={(text) => handleCustomFieldChange("budget", text)}
                keyboardType="numeric"
                right={<TextInput.Icon icon="cash" color="#98A2B3" />}
              />
            )}

            {fieldId === "bookingReference" && (
              <FloatingLabelInput
                label={fieldMeta.label}
                value={getFieldValue("bookingReference")}
                onChangeText={(text) => handleCustomFieldChange("bookingReference", text)}
                right={<TextInput.Icon icon="ticket-outline" color="#98A2B3" />}
              />
            )}

            {fieldId === "contactName" && (
              <FloatingLabelInput
                label={fieldMeta.label}
                value={getFieldValue("contactName")}
                onChangeText={(text) => handleCustomFieldChange("contactName", text)}
                right={<TextInput.Icon icon="account-outline" color="#98A2B3" />}
              />
            )}

            {fieldId === "contactNumber" && (
              <FloatingLabelInput
                label={fieldMeta.label}
                value={getFieldValue("contactNumber")}
                onChangeText={(text) => handleCustomFieldChange("contactNumber", text)}
                keyboardType="phone-pad"
                right={<TextInput.Icon icon="phone-outline" color="#98A2B3" />}
              />
            )}

            {fieldId === "contactEmail" && (
              <FloatingLabelInput
                label={fieldMeta.label}
                value={getFieldValue("contactEmail")}
                onChangeText={(text) => handleCustomFieldChange("contactEmail", text)}
                keyboardType="email-address"
                right={<TextInput.Icon icon="email-outline" color="#98A2B3" />}
              />
            )}

            {fieldId === "contact" && (
              <FloatingLabelInput
                label={fieldMeta.label}
                value={getFieldValue("contact")}
                onChangeText={(text) => handleCustomFieldChange("contact", text)}
                right={<TextInput.Icon icon="phone-outline" color="#98A2B3" />}
              />
            )}

            {fieldId === "priority" && (
              <View>
                <Text className="text-xs font-semibold tracking-wider uppercase text-gray-700 mb-1.5">
                  {fieldMeta.label}
                </Text>
                <View className="flex-row gap-2 mt-1">
                  {PRIORITIES.map((p) => {
                    const pColor =
                      p === "High"
                        ? "#EF4444"
                        : p === "Medium"
                        ? "#F59E0B"
                        : "#22C55E";
                    const isSelected = selectedPriority === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => {
                          const nextVal = isSelected ? null : p;
                          setSelectedPriority(nextVal);
                          setFieldValue?.("priority", nextVal);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Priority ${p}`}
                        style={{
                          borderRadius: 12,
                          borderWidth: 1,
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderColor: isSelected ? pColor : "#EAECF0",
                          backgroundColor: isSelected ? `${pColor}18` : "#FFF",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? "700" : "600",
                            color: pColor,
                          }}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {fieldId === "checklist" && (
              <View>
                <Text className="text-xs font-semibold tracking-wider uppercase text-gray-700 mb-1.5">
                  {fieldMeta.label}
                </Text>
                <View className="border border-dashed border-gray-300 rounded-[16px] bg-gray-50/50 p-4 items-center justify-center">
                  <Icon name="checklist" size={24} color="#98A2B3" />
                  <Text className="text-xs text-gray-500 mt-1">
                    Checklist items can be added here
                  </Text>
                </View>
              </View>
            )}

            {fieldId === "attachments" && (
              <View>
                <Text className="text-xs font-semibold tracking-wider uppercase text-gray-700 mb-1.5">
                  {fieldMeta.label}
                </Text>
                <View className="border border-dashed border-gray-300 rounded-[16px] bg-gray-50/50 p-4 items-center justify-center">
                  <Icon name="cloud-upload" size={24} color="#98A2B3" />
                  <Text className="text-xs text-gray-500 mt-1">
                    Upload files, tickets, or photos
                  </Text>
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* Button below plan detail section: Title "Add Field" / "Add or remove Field" */}
      <View className="mt-1 mb-6">
        <TouchableOpacity
          onPress={() => setShowAddFieldModal(true)}
          style={[
            styles.addFieldButton,
            {
              borderColor: colors.primary || "#263F69",
              backgroundColor: `${colors.primary || "#263F69"}08`,
            },
          ]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            selectedFieldIds.length > 0 ? "Add or remove Field" : "Add Field"
          }
        >
          <View style={styles.addFieldContent}>
            <Icon name="add" size={20} color={colors.primary || "#263F69"} />
            <Text
              style={[
                styles.addFieldLabel,
                { color: colors.primary || "#263F69" },
              ]}
            >
              {selectedFieldIds.length > 0
                ? "Add or remove Field"
                : "Add Field"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Activity Plan Type Lookup Bottom Sheet Modal */}
      <ActivityPlanTypeLookupModal
        visible={showPlanTypeModal}
        onClose={() => setShowPlanTypeModal(false)}
        selectedType={values.planType}
        onSelect={(type: ActivityPlanType) => {
          setFieldValue?.("planType", type);
        }}
      />

      {/* Add Field Bottom Sheet Modal with Checkboxes */}
      <AddFieldModal
        visible={showAddFieldModal}
        onClose={() => setShowAddFieldModal(false)}
        selectedFieldIds={selectedFieldIds}
        onApply={handleApplyFields}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
    justifyContent: "center",
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
  },
  subtext: {
    fontSize: 12,
    color: "#667085",
    marginTop: 2,
  },
  clearButton: {
    padding: 4,
  },
  addFieldButton: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addFieldContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addFieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
