import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

const PRIORITIES = ["High", "Medium", "Low"];

interface PreparationTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  formatDateTime: (val: any) => string;
  onOpenDatePicker: () => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

export default function PreparationTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  formatDateTime,
  onOpenDatePicker,
  noPadding = false,
  fieldRefs,
}: PreparationTabProps) {
  const { colors } = useTheme();
  const currentPriority = values.preparationDetails?.priority || null;

  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="checklist" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Preparation Details
        </Text>
      </View>

      {/* Task Label */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["preparationDetails.taskLabel"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Task / Label"
          value={values.preparationDetails?.taskLabel || ""}
          onChangeText={handleChange("preparationDetails.taskLabel")}
          onBlur={handleBlur("preparationDetails.taskLabel")}
        />
      </View>

      {/* Deadline */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["preparationDetails.deadlineDateTime"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Deadline"
          value={values.preparationDetails?.deadlineDateTime ? formatDateTime(values.preparationDetails.deadlineDateTime) : ""}
          editable={false}
          onPress={onOpenDatePicker}
          right={
            values.preparationDetails?.deadlineDateTime ? (
              <TextInput.Icon
                icon="close"
                color="#999"
                onPress={() => setFieldValue("preparationDetails.deadlineDateTime", null)}
              />
            ) : (
              <TextInput.Icon icon="calendar" color="#999" />
            )
          }
        />
      </View>

      {/* Priority tags */}
      <View className="mb-5">
        <Text className="text-xs font-bold tracking-wider uppercase mb-2">Priority</Text>
        <View className="flex-row gap-2">
          {PRIORITIES.map((p) => {
            const isActive = currentPriority === p;
            const priorityColor = p === "High" ? "#EF4444" : p === "Medium" ? "#F59E0B" : "#22C55E";
            return (
              <TouchableOpacity
                key={p}
                accessibilityRole="button"
                onPress={() => setFieldValue("preparationDetails.priority", isActive ? null : p)}
                style={{
                  borderRadius: 9999,
                  borderWidth: 1,
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  borderColor: isActive ? priorityColor : "#EAECF0",
                  backgroundColor: isActive ? `${priorityColor}15` : "#FFF",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: isActive ? "700" : "500", color: isActive ? priorityColor : "#475467" }}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Notes */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["preparationDetails.notes"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Notes"
          value={values.preparationDetails?.notes || ""}
          onChangeText={handleChange("preparationDetails.notes")}
          onBlur={handleBlur("preparationDetails.notes")}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );
}
