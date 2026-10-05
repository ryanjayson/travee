import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Switch, TextInput, useTheme } from "react-native-paper";
import {
  checkAndRunScheduledBackup,
  exportBackupLocally,
  restoreBackupFromFile,
  uploadBackupToGoogleDrive,
} from "../../../services/local/backupService";
import {
  logger,
  ErrorCategory,
  ErrorSeverity,
} from "../../../services/errorLogger";
import { useToast } from "../../../context/ToastContext";
import {
  BackupFrequency,
  BackupLocation,
  UserProfileDto,
} from "../../../types/UserProfileDto";
import { SettingsBottomSheet } from "../components/SettingsBottomSheet";
import { PickerModal, PickerModalProps } from "./PickerModal";

export { PickerModal, PickerModalProps };

export interface DatabaseBackupProps {
  form: UserProfileDto;
  setForm: React.Dispatch<React.SetStateAction<UserProfileDto>>;
  saveProfile: (data: UserProfileDto, options?: any) => void;
  profile?: UserProfileDto | null;
}

export const DatabaseBackup: React.FC<DatabaseBackupProps> = ({
  form,
  setForm,
  saveProfile,
  profile,
}) => {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);
  const [googleDriveEmailInput, setGoogleDriveEmailInput] = useState("");

  useEffect(() => {
    if (profile) {
      checkAndRunScheduledBackup(profile);
    }
  }, [profile]);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const location = form.backupLocation || "local";
      let result: { success: boolean; message?: string };
      if (location === "google_drive") {
        result = await uploadBackupToGoogleDrive(
          form.googleDriveAccount || undefined
        );
      } else {
        result = await exportBackupLocally();
      }

      if (result.success) {
        const now = Date.now();
        const updatedForm = { ...form, lastBackedUpAt: now };
        setForm(updatedForm);
        saveProfile(updatedForm);
        showToast({
          type: "success",
          message: result.message || "Database backup completed successfully!",
        });
      } else {
        showToast({
          type: "error",
          message: result.message || "Failed to create database backup.",
        });
      }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      logger.db(errorObj, {
        severity: ErrorSeverity.High,
        action: "manualBackup",
      });
      showToast({
        type: "error",
        message: errorObj.message || "An error occurred during database backup.",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreDatabase = async () => {
    Alert.alert(
      "Restore Database",
      "Restoring a backup file will replace your current database records. " +
        "Are you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore Backup",
          style: "destructive",
          onPress: async () => {
            setIsRestoring(true);
            try {
              const res = await restoreBackupFromFile();
              if (res.success) {
                queryClient.invalidateQueries();
                showToast({
                  type: "success",
                  message: res.message || "Database restored successfully!",
                });
              } else if (res.message !== "Backup selection cancelled.") {
                showToast({
                  type: "error",
                  message: res.message || "Failed to restore database.",
                });
              }
            } catch (err: unknown) {
              const errorObj =
                err instanceof Error ? err : new Error(String(err));
              logger.db(errorObj, {
                severity: ErrorSeverity.Critical,
                action: "restoreDatabase",
              });
              showToast({
                type: "error",
                message: errorObj.message || "Failed to restore database.",
              });
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6]">
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-row items-center gap-2">
            <Ionicons
              name="cloud-upload-outline"
              size={22}
              color={colors.primary}
            />
            <Text className="text-xl font-semibold text-secondary/80">
              Database Backup
            </Text>
            <View
              className={[
                "flex-row items-center gap-1 px-2 py-0.5",
                "bg-[#DCFCE7] rounded-full border border-[#86EFAC]",
              ].join(" ")}
            >
              <Ionicons name="lock-closed" size={10} color="#15803D" />
              <Text className="text-[10px] font-bold text-[#15803D]">
                AES-256 Encrypted
              </Text>
            </View>
          </View>
          <Switch
            value={form.backupAutoEnabled ?? true}
            onValueChange={(v) => {
              const updated = { ...form, backupAutoEnabled: v };
              setForm(updated);
              saveProfile(updated, {
                onSuccess: () => {
                  showToast({
                    type: "success",
                    message: v
                      ? "Automatic backup enabled"
                      : "Automatic backup disabled",
                  });
                },
              });
            }}
            trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
            thumbColor={form.backupAutoEnabled ? colors.primary : "#F3F4F6"}
            accessibilityRole="switch"
            accessibilityLabel="Toggle automatic database backup"
          />
        </View>

        {/* Backup Frequency */}
        <View className="mb-2">
          <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">
            Backup Frequency
          </Text>
          <TouchableOpacity
            onPress={() => setShowFrequencyPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Select backup frequency"
            activeOpacity={0.7}
            className="mt-1"
          >
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                placeholder="Backup Frequency"
                value={
                  form.backupFrequency === "weekly"
                    ? "Weekly"
                    : form.backupFrequency === "quarterly"
                      ? "Quarterly"
                      : "Monthly (Default)"
                }
                editable={false}
                outlineColor="#E0E0E0"
                activeOutlineColor={colors.primary}
                outlineStyle={{
                  borderWidth: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                }}
                style={{ height: 52 }}
                left={<TextInput.Icon icon="calendar-sync" color="#6B7280" />}
                right={<TextInput.Icon icon="chevron-down" color="#9CA3AF" />}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Backup Location */}
        <View className="mb-2">
          <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">
            Backup Storage Location
          </Text>
          <TouchableOpacity
            onPress={() => setShowLocationPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Select backup storage location"
            activeOpacity={0.7}
            className="mt-1"
          >
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                placeholder="Storage Location"
                value={
                  form.backupLocation === "google_drive"
                    ? "Google Drive"
                    : "Local Storage"
                }
                editable={false}
                outlineColor="#E0E0E0"
                activeOutlineColor={colors.primary}
                outlineStyle={{
                  borderWidth: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                }}
                style={{ height: 52 }}
                left={
                  <TextInput.Icon
                    icon={
                      form.backupLocation === "google_drive"
                        ? "google-drive"
                        : "folder-outline"
                    }
                    color="#6B7280"
                  />
                }
                right={<TextInput.Icon icon="chevron-down" color="#9CA3AF" />}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Google Drive Account Status */}
        {form.backupLocation === "google_drive" && (
          <View
            className={[
              "p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0]",
              "flex-row justify-between items-center",
            ].join(" ")}
          >
            <View className="flex-1 mr-2">
              <Text className="text-xs font-bold text-[#166534] uppercase tracking-wider">
                Google Drive Account
              </Text>
              <Text
                className="text-sm font-semibold text-[#15803D] mt-0.5"
                numberOfLines={1}
              >
                {form.googleDriveAccount || "user@gmail.com"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setGoogleDriveEmailInput(
                  form.googleDriveAccount || "user@gmail.com"
                );
                setShowGoogleDriveModal(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Manage Google Drive Account"
              className="bg-[#166534] px-3 py-1.5 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-white text-xs font-semibold">Manage</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Last Backed Up Metadata */}
        <View className="flex-row justify-between items-center py-1.5">
          <Text className="text-sm font-medium text-tertiary">
            Last Backed Up
          </Text>
          <Text className="text-sm font-semibold text-[#374151]">
            {form.lastBackedUpAt
              ? new Date(form.lastBackedUpAt).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "Never"}
          </Text>
        </View>

        <View className="h-[1px] bg-[#E5E7EB] my-1" />

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-1">
          <TouchableOpacity
            onPress={handleManualBackup}
            disabled={isBackingUp}
            accessibilityRole="button"
            accessibilityLabel="Backup Now"
            style={{ backgroundColor: colors.primary }}
            className="flex-1 py-3 rounded-xl items-center justify-center flex-row gap-2"
            activeOpacity={0.7}
          >
            {isBackingUp ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                <Text className="text-white font-bold text-sm">Backup Now</Text>
              </>
            )}
          </TouchableOpacity>

          <Button
            mode="outlined"
            onPress={handleRestoreDatabase}
            loading={isRestoring}
            disabled={isRestoring}
            textColor={colors.primary}
            style={{ borderColor: colors.primary, borderRadius: 12 }}
            contentStyle={{ height: 44 }}
          >
            Restore
          </Button>
        </View>
      </View>

      {/* Frequency Picker */}
      <PickerModal
        visible={showFrequencyPicker}
        title="Select Backup Frequency"
        options={["Weekly", "Monthly", "Quarterly"]}
        selected={
          form.backupFrequency === "weekly"
            ? "Weekly"
            : form.backupFrequency === "quarterly"
              ? "Quarterly"
              : "Monthly"
        }
        onSelect={(val) => {
          const freq: BackupFrequency =
            val === "Weekly"
              ? "weekly"
              : val === "Quarterly"
                ? "quarterly"
                : "monthly";
          const updated = { ...form, backupFrequency: freq };
          setForm(updated);
          saveProfile(updated, {
            onSuccess: () => {
              showToast({
                type: "success",
                message: `Backup frequency set to ${val}`,
              });
            },
          });
        }}
        onClose={() => setShowFrequencyPicker(false)}
      />

      {/* Location Picker */}
      <PickerModal
        visible={showLocationPicker}
        title="Select Storage Location"
        options={["Local Storage", "Google Drive"]}
        selected={
          form.backupLocation === "google_drive"
            ? "Google Drive"
            : "Local Storage"
        }
        onSelect={(val) => {
          const loc: BackupLocation =
            val === "Google Drive" ? "google_drive" : "local";
          const updated = { ...form, backupLocation: loc };
          setForm(updated);
          saveProfile(updated, {
            onSuccess: () => {
              showToast({
                type: "success",
                message: `Backup location set to ${val}`,
              });
            },
          });
        }}
        onClose={() => setShowLocationPicker(false)}
      />

      {/* Google Drive Account Modal */}
      <Modal
        visible={showGoogleDriveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoogleDriveModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md gap-4 shadow-xl">
            <View className="flex-row items-center gap-2 border-b border-[#F3F4F6] pb-3">
              <Ionicons name="logo-google" size={24} color="#0EA5E9" />
              <Text className="text-lg font-bold text-[#111827]">
                Google Drive Backup
              </Text>
            </View>

            <Text className="text-sm text-[#4B5563]">
              Enter your Google email address to link Google Drive for automatic
              database backups.
            </Text>

            <RNTextInput
              className={[
                "border border-[#E5E7EB] rounded-xl px-4 py-3",
                "text-base text-[#111827] bg-[#F9FAFB]",
              ].join(" ")}
              placeholder="e.g. user@gmail.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={googleDriveEmailInput}
              onChangeText={setGoogleDriveEmailInput}
            />

            <View className="flex-row justify-end gap-3 pt-2">
              <TouchableOpacity
                onPress={() => setShowGoogleDriveModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel Google Drive setup"
                className="px-4 py-2 rounded-xl bg-gray-100"
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const email = googleDriveEmailInput.trim() || "user@gmail.com";
                  const updated = { ...form, googleDriveAccount: email };
                  setForm(updated);
                  saveProfile(updated, {
                    onSuccess: () => {
                      showToast({
                        type: "success",
                        message: `Google Drive account set to ${email}`,
                      });
                    },
                  });
                  setShowGoogleDriveModal(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Save Google Drive account"
                style={{ backgroundColor: colors.primary }}
                className="px-5 py-2 rounded-xl"
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-white">
                  Save Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export interface DatabaseBottomSheetProps extends DatabaseBackupProps {
  visible: boolean;
  onClose: () => void;
}

export const DatabaseBottomSheet: React.FC<DatabaseBottomSheetProps> = ({
  visible,
  onClose,
  form,
  setForm,
  saveProfile,
  profile,
}) => {
  return (
    <SettingsBottomSheet
      visible={visible}
      onClose={onClose}
      title="Database Backup"
      accessibilityLabel="Close database backup"
      backgroundColor="#F9FAFB"
      bounces={false}
    >
      <DatabaseBackup
        form={form}
        setForm={setForm}
        saveProfile={saveProfile}
        profile={profile}
      />
    </SettingsBottomSheet>
  );
};

export default DatabaseBackup;
