import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Switch, useTheme } from "react-native-paper";
import { useToast } from "../../../context/ToastContext";
import { UserProfileDto } from "../../../types/UserProfileDto";
import { SettingsBottomSheet } from "../components/SettingsBottomSheet";

export interface NotificationSettingsProps {
  form: UserProfileDto;
  setForm: React.Dispatch<React.SetStateAction<UserProfileDto>>;
  saveProfile?: (data: UserProfileDto, options?: any) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  form,
  setForm,
  saveProfile,
}) => {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const handleToggleNotifications = (enabled: boolean) => {
    const updated = { ...form, notificationsEnabled: enabled };
    setForm(updated);
    if (saveProfile) {
      saveProfile(updated, {
        onSuccess: () => {
          showToast({
            type: "success",
            message: enabled ? "Notifications enabled" : "Notifications disabled",
          });
        },
      });
    }
  };

  const handleUpdateDaysBeforeTrip = (newDays: number) => {
    const clamped = Math.max(1, Math.min(30, newDays));
    const updated = { ...form, notifyDaysBeforeTrip: clamped };
    setForm(updated);
    if (saveProfile) {
      saveProfile(updated, {
        onSuccess: () => {
          showToast({
            type: "success",
            message: "Trip reminder updated",
          });
        },
      });
    }
  };

  const handleUpdateHoursBeforeActivity = (newHours: number) => {
    const clamped = Math.max(1, Math.min(24, newHours));
    const updated = { ...form, notifyHoursBeforeActivity: clamped };
    setForm(updated);
    if (saveProfile) {
      saveProfile(updated, {
        onSuccess: () => {
          showToast({
            type: "success",
            message: "Activity reminder updated",
          });
        },
      });
    }
  };

  const currentDays = form.notifyDaysBeforeTrip ?? 3;
  const currentHours = form.notifyHoursBeforeActivity ?? 2;
  const isEnabled = form.notificationsEnabled ?? true;

  return (
    <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6]">
      {/* Main Switch Header */}
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-xl font-semibold text-secondary/80">
          Notification Settings
        </Text>
        <Switch
          value={isEnabled}
          onValueChange={handleToggleNotifications}
          trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
          thumbColor={isEnabled ? colors.primary : "#F3F4F6"}
          accessibilityRole="switch"
          accessibilityLabel="Toggle notifications"
        />
      </View>

      <View className="gap-4 mt-2">
        {/* Trip starts reminder stepper */}
        <View
          className="flex-row justify-between items-center"
          style={{ opacity: isEnabled ? 1 : 0.5 }}
        >
          <View className="flex-1 mr-4">
            <Text className="text-lg font-semibold text-tertiary">
              Notify before trip starts
            </Text>
            <Text className="text-sm text-tertiary/75">
              Days in advance to notify you
            </Text>
          </View>

          <View className="flex-row items-center border border-[#E5E7EB] rounded-full p-1 bg-white">
            <TouchableOpacity
              onPress={() => handleUpdateDaysBeforeTrip(currentDays - 1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
              accessibilityRole="button"
              accessibilityLabel="Decrease days before trip"
              activeOpacity={0.7}
              disabled={!isEnabled}
            >
              <Ionicons name="remove" size={16} color={colors.primary} />
            </TouchableOpacity>

            <Text className="text-sm font-semibold text-[#111827] px-3 min-w-[60px] text-center">
              {currentDays} {currentDays === 1 ? "day" : "days"}
            </Text>

            <TouchableOpacity
              onPress={() => handleUpdateDaysBeforeTrip(currentDays + 1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
              accessibilityRole="button"
              accessibilityLabel="Increase days before trip"
              activeOpacity={0.7}
              disabled={!isEnabled}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-[1px] bg-[#E5E7EB]" />

        {/* Activity starts reminder stepper */}
        <View
          className="flex-row justify-between items-center"
          style={{ opacity: isEnabled ? 1 : 0.5 }}
        >
          <View className="flex-1 mr-4">
            <Text className="text-base font-semibold text-tertiary">
              Notify before activity starts
            </Text>
            <Text className="text-sm text-tertiary/75">
              Hours in advance to notify you
            </Text>
          </View>

          <View className="flex-row items-center border border-[#E5E7EB] rounded-full p-1 bg-white">
            <TouchableOpacity
              onPress={() => handleUpdateHoursBeforeActivity(currentHours - 1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
              accessibilityRole="button"
              accessibilityLabel="Decrease hours before activity"
              activeOpacity={0.7}
              disabled={!isEnabled}
            >
              <Ionicons name="remove" size={16} color={colors.primary} />
            </TouchableOpacity>

            <Text className="text-sm font-semibold text-[#111827] px-3 min-w-[60px] text-center">
              {currentHours} {currentHours === 1 ? "hour" : "hours"}
            </Text>

            <TouchableOpacity
              onPress={() => handleUpdateHoursBeforeActivity(currentHours + 1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
              accessibilityRole="button"
              accessibilityLabel="Increase hours before activity"
              activeOpacity={0.7}
              disabled={!isEnabled}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export interface NotificationBottomSheetProps extends NotificationSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationBottomSheet: React.FC<NotificationBottomSheetProps> = ({
  visible,
  onClose,
  form,
  setForm,
  saveProfile,
}) => {
  return (
    <SettingsBottomSheet
      visible={visible}
      onClose={onClose}
      title="Notification Settings"
      accessibilityLabel="Close notification settings"
      backgroundColor="#F9FAFB"
      bounces={false}
    >
      <NotificationSettings
        form={form}
        setForm={setForm}
        saveProfile={saveProfile}
      />
    </SettingsBottomSheet>
  );
};

export default NotificationSettings;
