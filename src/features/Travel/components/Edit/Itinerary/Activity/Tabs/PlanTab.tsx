import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, LayoutAnimation } from "react-native";
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
import { FadeInView } from "../../../../../../../components/animations";

const PRIORITIES = ["High", "Medium", "Low"];

const computeActiveFieldIds = (vals: any): string[] => {
  const ids: string[] = [];
  if (vals?.destination) ids.push("location");
  if (vals?.budget) ids.push("budget");
  if (vals?.website) ids.push("website");
  if (vals?.bookingReference) ids.push("bookingReference");
  if (vals?.contactName) ids.push("contactName");
  if (vals?.contactNumber) ids.push("contactNumber");
  if (vals?.contactEmail) ids.push("contactEmail");
  if (vals?.priority) ids.push("priority");
  return ids;
};

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
  onPressLocationMap?: () => void;
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
  onPressLocationMap,
}: PlanTabProps) {
  const { colors } = useTheme();
  const [showPlanTypeModal, setShowPlanTypeModal] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(() =>
    computeActiveFieldIds(values)
  );

  // Sync selectedFieldIds whenever values change (e.g. re-initialized or updated externally)
  useEffect(() => {
    setSelectedFieldIds((prev) => {
      const activeIds = computeActiveFieldIds(values);
      const combined = Array.from(new Set([...prev, ...activeIds]));
      if (combined.length !== prev.length || combined.some((id, idx) => id !== prev[idx])) {
        return combined;
      }
      return prev;
    });
  }, [
    values?.destination,
    values?.budget,
    values?.website,
    values?.bookingReference,
    values?.contactName,
    values?.contactNumber,
    values?.contactEmail,
    values?.priority,
  ]);

  const selectedPriority = values?.priority || null;

  const getFieldValue = (id: string) => {
    if (id === "location") {
      return values?.destination !== undefined && values?.destination !== null
        ? String(values.destination)
        : "";
    }
    return values?.[id] !== undefined && values?.[id] !== null ? String(values[id]) : "";
  };

  const handleCustomFieldChange = (id: string, text: string) => {
    if (id === "location") {
      setFieldValue?.("destination", text);
    } else {
      setFieldValue?.(id, text);
    }
  };

  const selectedPlanType = ACTIVITY_PLAN_TYPES.find(
    (p) => p.type === values.planType
  );

  const handleApplyFields = (fieldIds: string[]) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    // Clear Formik values for any fields that were deselected
    selectedFieldIds.forEach((id) => {
      if (!fieldIds.includes(id)) {
        if (id === "location") {
          setFieldValue?.("destination", "");
          setFieldValue?.("destinationData", undefined);
        } else if (id === "priority") {
          setFieldValue?.("priority", null);
        } else {
          setFieldValue?.(id, "");
        }
      }
    });
    setSelectedFieldIds(fieldIds);
  };

  return (
    <View className={`flex-1 pt-2 ${noPadding ? "" : "px-5"}`}>
      {/* Header */}
      <View className="flex-row gap-2 justify-start items-center mb-5 border-l-3 border-primary pl-4">
        <Icon name="event-note" size={26} color={"#344054"} />
        <Text className="text-lg font-semibold tracking-wider uppercase text-secondary">
          Plan Details
        </Text>

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


      {/* Plan Type Selector Field */}
      <View
        ref={(el) => {
          if (fieldRefs) fieldRefs.current["planType"] = el;
        }}
        className="mb-5 mt-4"
      >
        <Text className="text-lg text-secondary/80 font-semibold mb-2">
          Type of Plan
        </Text>

        <TouchableOpacity
          onPress={() => setShowPlanTypeModal(true)}
          className="border rounded-[16px] px-4 py-3 min-h-[64px] justify-center bg-white"
          style={{
            borderColor: selectedPlanType
              ? `${selectedPlanType.color}40`
              : "#E0E0E0",
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            selectedPlanType
              ? `Plan type selected: ${selectedPlanType.label}. Tap to change.`
              : "Select plan type"
          }
        >
          <View className="flex-row items-center gap-3">
            {/* Color-assigned icon badge */}
            <View
              style={{
                borderColor: selectedPlanType
                  ? `${selectedPlanType.color}35`
                  : "#E4E7EC",
              }}
            >
              <Icon
                name={(selectedPlanType?.iconName || "lightbulb") as any}
                size={28}
                color={selectedPlanType ? selectedPlanType.color : "#98A2B3"}
              />
            </View>

            {/* Label and description */}
            <View className="flex-1 justify-center">
              <Text
                className={`text-lg ${selectedPlanType ? "text-[#1D2939] font-semibold" : "text-[#98A2B3] font-normal"}`}
              >
                {selectedPlanType ? selectedPlanType.label : "Select Plan Type"}
              </Text>
              {selectedPlanType?.subtext && (
                <Text className="text-sm text-[#667085] -mt-1" numberOfLines={1}>
                  {selectedPlanType.subtext}
                </Text>
              )}
            </View>

            {/* Clear Button (if selected) */}
            {selectedPlanType && (
              <TouchableOpacity
                onPress={() => setFieldValue?.("planType", null)}
                className="p-1"
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

      {/* Dynamically Added Fields UI (UI Focus) */}
      {selectedFieldIds.map((fieldId) => {
        const fieldMeta = APPLICABLE_PLAN_FIELDS.find((f) => f.id === fieldId);
        if (!fieldMeta) return null;

        return (
          <View key={fieldId} className="mb-5 flex-1">
            <FadeInView type="zoom" delay={200} duration={500} >

              {fieldId === "location" && (
                <FloatingLabelInput
                  label={fieldMeta.label}
                  value={getFieldValue("location")}
                  onChangeText={(text) => handleCustomFieldChange("location", text)}
                  right={
                    <TextInput.Icon
                      icon="map-marker-outline"
                      color="#98A2B3"
                      onPress={onPressLocationMap}
                    />
                  }
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
            </FadeInView>
          </View>
        );
      })}

      {/* Button below plan detail section: Title "Add Field" / "Add or remove Field" */}
      <View className="mt-1 mb-6">
        <TouchableOpacity
          onPress={() => setShowAddFieldModal(true)}
          className="border-[1.5px] border-dashed rounded-[16px] py-3.5 px-5 items-center justify-center"
          style={{
            borderColor: colors.primary + "50" || "#263F69",
            backgroundColor: `${colors.primary || "#263F69"}08`,
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            selectedFieldIds.length > 0 ? "Add or remove Field" : "Add Field"
          }
        >
          <View className="flex-row items-center justify-center gap-2">
            <Icon name="add" size={20} color={colors.primary || "#263F69"} />
            <Text
              className="text-[15px] font-semibold tracking-[0.3px]"
              style={{ color: colors.primary || "#263F69" }}
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
