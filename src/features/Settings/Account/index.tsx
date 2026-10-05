import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { TRAVELER_TYPES } from "../../../components/OnboardingModal";
import { useKeyboardVisible } from "../../../hooks/useKeyboardVisible";
import { useToast } from "../../../context/ToastContext";
import { UserProfileDto } from "../../../types/UserProfileDto";
import { SettingsBottomSheet } from "../components/SettingsBottomSheet";
import {
  CountryPickerModal,
  CountryPickerModalProps,
} from "./CountryPickerModal";

export { CountryPickerModal, CountryPickerModalProps };

export const COUNTRIES = [
  "Philippines", "Japan", "South Korea", "Thailand", "Vietnam", "Singapore",
  "Malaysia", "Indonesia", "Taiwan", "Hong Kong", "Australia", "New Zealand",
  "United States", "Canada", "United Kingdom", "France", "Germany", "Italy",
  "Spain", "Switzerland", "Netherlands", "United Arab Emirates", "Saudi Arabia",
  "Qatar", "India", "Maldives", "China", "Brazil", "Mexico", "South Africa",
  "Norway", "Sweden", "Iceland", "Greece", "Portugal", "Austria", "Turkey",
  "Egypt", "Morocco", "Cambodia",
];

export const getNicknameValidationError = (
  nickname?: string
): string | null => {
  const value = nickname ?? "";
  if (!value || value.trim().length === 0) {
    return "Nickname cannot be empty";
  }
  if (value.includes(" ") || /\s/.test(value)) {
    return "Spaces are not accepted";
  }
  if (value.length < 3) {
    return "Nickname must be at least 3 characters";
  }
  if (value.length > 20) {
    return "Nickname cannot exceed 20 characters";
  }
  return null;
};

export interface AccountSettingsProps {
  form: UserProfileDto;
  setForm: React.Dispatch<React.SetStateAction<UserProfileDto>>;
  saveProfile?: (data: UserProfileDto, options?: any) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  form,
  setForm,
}) => {
  const { colors } = useTheme();
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const nicknameError = getNicknameValidationError(form.nickname);
  const currentLength = form.nickname?.length || 0;

  return (
    <View className="p-2 gap-3">
      {/* Nickname Field */}
      <View className="mb-4">
        <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">
          Nickname
        </Text>
        <View className="relative justify-center">
          <TextInput
            mode="outlined"
            placeholder="Nickname"
            value={form.nickname}
            onChangeText={(v) => setForm((f) => ({ ...f, nickname: v }))}
            error={Boolean(nicknameError)}
            outlineColor="#E0E0E0"
            activeOutlineColor={nicknameError ? colors.error : colors.primary}
            theme={{
              colors: {
                onSurfaceVariant: "#9CA3AF",
                error: colors.error,
              },
            }}
            outlineStyle={{
              borderWidth: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
            }}
            style={{
              marginTop: 6,
              height: 56,
            }}
          />
        </View>

        <View className="flex-row justify-between items-center mt-1 px-1">
          {nicknameError ? (
            <Text
              style={{ color: colors.error }}
              className="text-xs flex-1 mr-2"
            >
              {nicknameError}
            </Text>
          ) : (
            <View className="flex-1" />
          )}
          <Text
            style={{ color: currentLength > 20 ? colors.error : "#9CA3AF" }}
            className="text-xs"
          >
            {currentLength}/20
          </Text>
        </View>
      </View>

      {/* Country Field */}
      <View className="mb-2">
        <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">
          Country
        </Text>
        <TouchableOpacity
          onPress={() => setShowCountryPicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Select default country"
          activeOpacity={0.7}
        >
          <View pointerEvents="none">
            <TextInput
              mode="outlined"
              placeholder="Select country"
              value={form.defaultCountry || "Not set"}
              editable={false}
              outlineColor="#E0E0E0"
              activeOutlineColor={colors.primary}
              theme={{
                colors: {
                  onSurfaceVariant: "#9CA3AF",
                },
              }}
              outlineStyle={{
                borderWidth: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
              }}
              style={{
                marginTop: 6,
                height: 56,
              }}
              left={<TextInput.Icon icon="earth" color="#6B7280" />}
              right={<TextInput.Icon icon="chevron-down" color="#9CA3AF" />}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Travel Style Selector */}
      <View className="gap-1.5 mt-2">
        <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">
          Travel Style
        </Text>

        <View className="flex-row flex-wrap gap-3 pt-1">
          {TRAVELER_TYPES.map((type) => {
            const selectedStyles = (form.travelStyle || "")
              .split(",")
              .filter(Boolean);
            const isSelected = selectedStyles.includes(type.id);

            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => {
                  const newStyles = isSelected
                    ? selectedStyles.filter((id) => id !== type.id)
                    : [...selectedStyles, type.id];
                  setForm((f) => ({
                    ...f,
                    travelStyle: newStyles.join(","),
                  }));
                }}
                className={`flex-row items-center px-3.5 py-2 rounded-full border ${
                  isSelected
                    ? "border-accent bg-[#EFF6FF]"
                    : "border-[#E5E7EB] bg-white opacity-60"
                }`}
                accessibilityRole="button"
                accessibilityLabel={type.label}
                activeOpacity={0.7}
              >
                <Text className="text-md mr-1">{type.emoji}</Text>
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? "text-accent" : "text-[#475467]"
                  }`}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <CountryPickerModal
        visible={showCountryPicker}
        title="Select Country"
        options={COUNTRIES}
        selected={form.defaultCountry ?? "Philippines"}
        onSelect={(v) => setForm((f) => ({ ...f, defaultCountry: v }))}
        onClose={() => setShowCountryPicker(false)}
      />
    </View>
  );
};

export interface AccountBottomSheetProps extends AccountSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountBottomSheet: React.FC<AccountBottomSheetProps> = ({
  visible,
  onClose,
  form,
  setForm,
  saveProfile,
}) => {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { keyboardVisible } = useKeyboardVisible();

  const handleUpdate = () => {
    const nicknameError = getNicknameValidationError(form.nickname);
    if (nicknameError) {
      showToast({
        type: "error",
        message: nicknameError,
      });
      return;
    }

    if (saveProfile) {
      saveProfile(form, {
        onSuccess: () => {
          showToast({
            type: "success",
            message: "Profile updated successfully",
          });
        },
        onError: (err: any) => {
          showToast({
            type: "error",
            message: err?.message || "Failed to update profile",
          });
        },
      });
    } else {
      showToast({
        type: "success",
        message: "Profile updated successfully",
      });
    }
    onClose();
  };

  const nicknameError = getNicknameValidationError(form.nickname);

  const headerRightAction = (
    <TouchableOpacity
      onPress={handleUpdate}
      disabled={Boolean(nicknameError)}
      style={{ opacity: nicknameError ? 0.4 : 1 }}
      accessibilityRole="button"
      accessibilityLabel="Update profile"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-1">
        <Ionicons name="checkmark" size={22} color={colors.primary} />
        <Text
          className="text-md font-medium"
          style={{ color: colors.primary }}
        >
          Update
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SettingsBottomSheet
      visible={visible}
      onClose={onClose}
      title="Profile"
      headerRight={headerRightAction}
      accessibilityLabel="Close profile settings"
      backgroundColor="#F9FAFB"
      bounces={false}
      keyboardAvoiding={true}
      keyboardVisible={keyboardVisible}
      maxHeightRatio={0.65}
    >
      <AccountSettings
        form={form}
        setForm={setForm}
        saveProfile={saveProfile}
      />
    </SettingsBottomSheet>
  );
};

export default AccountSettings;
