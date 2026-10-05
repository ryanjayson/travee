import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  ActivityIndicator,
  Alert,
  Switch,
  Animated,
  Dimensions,
  BackHandler,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useUserProfile, useSaveProfile } from "../hooks/useUserProfile";
import { UserProfileDto, AccountType } from "../types/UserProfileDto";
import { AccountBottomSheet } from "../features/Settings/Account";
import { DatabaseBottomSheet } from "../features/Settings/Database";
import { NotificationBottomSheet } from "../features/Settings/Notifications";
import { DeveloperActions } from "../features/Settings/DeveloperActions";
import { SecurityBottomSheet } from "../features/Settings/Security";
import { TermsBottomSheet } from "../features/Settings/About/Terms";
import { PrivacyBottomSheet } from "../features/Settings/About/Privacy";
import { SettingsBottomSheet } from "../features/Settings/components/SettingsBottomSheet";
import {
  isAnalyticsOptedOut,
  setAnalyticsOptOut,
} from "../services/analytics/posthogService";
import {
  logger,
  ErrorCategory,
  ErrorSeverity,
} from "../services/errorLogger";
import { FadeInView } from "../components/animations";
import { useToast } from "../context/ToastContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface ProfileScreenProps {
  visible: boolean;
  onClose: () => void;
}

type ActiveSettingsSheet =
  | "account"
  | "notifications"
  | "security"
  | "database"
  | "terms"
  | "privacy"
  | null;

const AccountTypeBadge = ({ type }: { type: AccountType }) => {
  const isPremium = type === AccountType.Premium;
  return (
    <View
      className={`flex-row items-center gap-1 px-3 py-1 rounded-full ${
        isPremium ? "bg-[#FEF3C7]" : "bg-[#F3F4F6]"
      }`}
    >
      <Ionicons
        name={isPremium ? "star" : "person"}
        size={12}
        color={isPremium ? "#F59E0B" : "#6B7280"}
      />
      <Text
        className={`text-xs font-semibold ${
          isPremium ? "text-[#D97706]" : "text-[#6B7280]"
        }`}
      >
        {isPremium ? "Premium" : "Free"}
      </Text>
    </View>
  );
};

interface SettingsRowItemProps {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

const SettingsRowItem: React.FC<SettingsRowItemProps> = ({
  title,
  onPress,
  accessibilityLabel,
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row justify-between items-center py-2"
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel || title}
    activeOpacity={0.7}
  >
    <Text className="text-base font-semibold text-tertiary">{title}</Text>
    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
  </TouchableOpacity>
);

export function ProfileScreen({ visible, onClose }: ProfileScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  // Drawer slide animation
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 55,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Android hardware back button support
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [visible]);

  const { data: profile, isLoading } = useUserProfile();
  const { mutate: saveProfile, isPending: isSaving } = useSaveProfile();

  const [form, setForm] = useState<UserProfileDto>({
    username: "",
    nickname: "",
    travelStyle: "",
    email: "",
    avatarUrl: "",
    defaultCurrency: "PHP",
    defaultCountry: "Philippines",
    accountType: AccountType.Free,
    notificationsEnabled: true,
    notifyDaysBeforeTrip: 3,
    notifyHoursBeforeActivity: 2,
    backupFrequency: "monthly",
    backupLocation: "local",
    backupAutoEnabled: true,
    lastBackedUpAt: null,
    googleDriveAccount: null,
  });

  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [aboutModalTitle, setAboutModalTitle] = useState<string>("");
  const [aboutModalContent, setAboutModalContent] = useState<string>("");
  const [activeSettingsModal, setActiveSettingsModal] =
    useState<ActiveSettingsSheet>(null);

  // Privacy / Analytics opt-out state
  const [isAnalyticsOptedOutState, setIsAnalyticsOptedOutState] =
    useState<boolean>(isAnalyticsOptedOut());

  useEffect(() => {
    setIsAnalyticsOptedOutState(isAnalyticsOptedOut());
  }, [visible]);

  const handleToggleAnalytics = async (value: boolean) => {
    const newOptOut = !value;
    setIsAnalyticsOptedOutState(newOptOut);
    await setAnalyticsOptOut(newOptOut);
    showToast({
      type: "success",
      message: value ? "Usage analytics enabled" : "Usage analytics disabled",
    });
  };

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username ?? "",
        nickname: profile.nickname ?? "",
        travelStyle: profile.travelStyle ?? "",
        email: profile.email ?? "",
        avatarUrl: profile.avatarUrl ?? "",
        defaultCurrency: profile.defaultCurrency ?? "PHP",
        defaultCountry: profile.defaultCountry ?? "Philippines",
        accountType: profile.accountType ?? AccountType.Free,
        notificationsEnabled: profile.notificationsEnabled ?? true,
        notifyDaysBeforeTrip: profile.notifyDaysBeforeTrip ?? 3,
        notifyHoursBeforeActivity: profile.notifyHoursBeforeActivity ?? 2,
        backupFrequency: profile.backupFrequency ?? "monthly",
        backupLocation: profile.backupLocation ?? "local",
        backupAutoEnabled: profile.backupAutoEnabled ?? true,
        lastBackedUpAt: profile.lastBackedUpAt ?? null,
        googleDriveAccount: profile.googleDriveAccount ?? null,
      });
    }
  }, [profile]);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera roll permission is required to upload an avatar picture."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      const newAvatarUrl = result.assets[0].uri;
      const updatedForm = { ...form, avatarUrl: newAvatarUrl };
      setForm(updatedForm);
      setIsUploadingAvatar(true);

      saveProfile(updatedForm, {
        onSuccess: () => {
          setIsUploadingAvatar(false);
          showToast({
            type: "success",
            message: "Avatar updated successfully!",
          });
        },
        onError: (err: unknown) => {
          setIsUploadingAvatar(false);
          const errorObj = err instanceof Error ? err : new Error(String(err));
          logger.ui(errorObj, {
            severity: ErrorSeverity.Medium,
            action: "uploadAvatar",
          });
          showToast({
            type: "error",
            message: "Failed to update avatar.",
          });
        },
      });
    }
  };

  const handleRateAndFeedback = () => {
    Alert.alert(
      "Rate & Feedback",
      "Thank you for using Travee! Would you like to rate the app on the store " +
        "or send us your feedback?",
      [
        {
          text: "Send Feedback",
          onPress: () => {
            setAboutModalTitle("Send Feedback");
            setAboutModalContent(
              "Please send your suggestions, bug reports, and ideas to " +
                "support@travee.example.com. We appreciate your input!"
            );
            setShowAboutModal(true);
          },
        },
        {
          text: "Rate App",
          onPress: () => {
            Alert.alert("Success", "Thank you for your rating!");
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const appVersion =
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    "1.0.0";
  const buildVersion =
    Application.nativeBuildVersion ||
    (Constants.expoConfig?.android as any)?.versionCode ||
    "1";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="dark-content" />

      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Animated Container - Full Height, slides from left */}
        <Animated.View
          style={{
            width: SCREEN_WIDTH,
            height: "100%",
            backgroundColor: "#F3F4F6",
            transform: [{ translateX: slideAnim }],
            shadowColor: "#000",
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
            elevation: 5,
            paddingTop: insets.top,
          }}
        >
          <LinearGradient
            colors={["#dbeaff", "#F2F4F7", "#F2F4F7", "#F2F4F7", "#F2F4F7"]}
            start={{ x: 0.8, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
            }}
          />

          {isLoading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Header */}
              <View className="flex-row items-center justify-between px-5 py-3.5">
                <TouchableOpacity
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close profile"
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color="#374151" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-[#111827] flex-1 text-center">
                  Profile
                </Text>
                {isSaving ? (
                  <View className="flex-row items-center gap-1.5 min-w-[28px] justify-end">
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text className="text-xs font-medium text-gray-500">
                      Saving..
                    </Text>
                  </View>
                ) : (
                  <View className="w-7" />
                )}
              </View>

              <ScrollView
                contentContainerStyle={{ padding: 16, gap: 12 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Avatar & Badge */}
                <FadeInView
                  type="zoom"
                  delay={100}
                  duration={350}
                  className="items-center py-5 gap-2.5"
                >
                  <TouchableOpacity
                    onPress={handlePickAvatar}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Change avatar"
                    className="relative"
                  >
                    <View
                      className={[
                        "w-34 h-34 rounded-full bg-primary justify-center",
                        "items-center overflow-hidden border border-white shadow",
                      ].join(" ")}
                    >
                      {form.avatarUrl ? (
                        <Image
                          source={{ uri: form.avatarUrl }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="person" size={48} color="#fff" />
                      )}
                    </View>
                    <View
                      className={[
                        "absolute bottom-0 right-0 bg-primary p-1.5",
                        "rounded-full border border-white shadow",
                      ].join(" ")}
                    >
                      {isUploadingAvatar ? (
                        <ActivityIndicator
                          size="small"
                          color="#fff"
                          style={{ width: 14, height: 14 }}
                        />
                      ) : (
                        <Ionicons name="camera" size={14} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <AccountTypeBadge
                    type={form.accountType ?? AccountType.Free}
                  />
                </FadeInView>

                {/* Account Type Card */}
                <FadeInView type="up" delay={150} duration={400}>
                  <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6]">
                    <Text
                      className={[
                        "text-[11px] font-bold text-[#6B7280]",
                        "uppercase tracking-widest mb-1",
                      ].join(" ")}
                    >
                      Account Type
                    </Text>
                    <View className="flex-row gap-2.5">
                      <TouchableOpacity
                        onPress={() =>
                          setForm((f) => ({
                            ...f,
                            accountType: AccountType.Free,
                          }))
                        }
                        className={[
                          "flex-1 items-center p-3.5 rounded-xl border-2 bg-[#F9FAFB] gap-1",
                          form.accountType === AccountType.Free
                            ? "border-primary bg-[#EFF6FF]"
                            : "border-[#E5E7EB]",
                        ].join(" ")}
                        accessibilityRole="button"
                        accessibilityLabel="Select Free Account"
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="person"
                          size={20}
                          color={
                            form.accountType === AccountType.Free
                              ? "#0EA5E9"
                              : "#9CA3AF"
                          }
                        />
                        <Text
                          className={`text-base font-bold ${
                            form.accountType === AccountType.Free
                              ? "text-primary"
                              : "text-[#9CA3AF]"
                          }`}
                        >
                          Free
                        </Text>
                        <Text className="text-sm text-[#9CA3AF]">
                          Basic features
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          setForm((f) => ({
                            ...f,
                            accountType: AccountType.Premium,
                          }))
                        }
                        className={[
                          "flex-1 items-center p-3.5 rounded-xl border-2 bg-[#F9FAFB] gap-1",
                          form.accountType === AccountType.Premium
                            ? "border-[#F59E0B] bg-[#FFFBEB]"
                            : "border-[#E5E7EB]",
                        ].join(" ")}
                        accessibilityRole="button"
                        accessibilityLabel="Select Premium Account"
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="star"
                          size={20}
                          color={
                            form.accountType === AccountType.Premium
                              ? "#F59E0B"
                              : "#9CA3AF"
                          }
                        />
                        <Text
                          className={`text-base font-bold ${
                            form.accountType === AccountType.Premium
                              ? "text-[#D97706]"
                              : "text-[#9CA3AF]"
                          }`}
                        >
                          Premium
                        </Text>
                        <Text className="text-sm text-[#9CA3AF]">
                          All features
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </FadeInView>

                {/* Settings Section */}
                <FadeInView type="up" delay={200} duration={400}>
                  <View
                    className={[
                      "bg-white rounded-2xl p-4 gap-3 shadow-sm",
                      "elevation-2 border border-[#F3F4F6]",
                    ].join(" ")}
                  >
                    <Text className="text-xl font-semibold text-secondary">
                      Settings
                    </Text>

                    <SettingsRowItem
                      title="Profile"
                      onPress={() => setActiveSettingsModal("account")}
                      accessibilityLabel="Open profile settings"
                    />

                    <View className="h-[1px] bg-[#E5E7EB]" />

                    <SettingsRowItem
                      title="Notification"
                      onPress={() => setActiveSettingsModal("notifications")}
                      accessibilityLabel="Open notification settings"
                    />

                    <View className="h-[1px] bg-[#E5E7EB]" />

                    <SettingsRowItem
                      title="Security PIN Lock"
                      onPress={() => setActiveSettingsModal("security")}
                      accessibilityLabel="Open security PIN lock settings"
                    />

                    <View className="h-[1px] bg-[#E5E7EB]" />

                    <SettingsRowItem
                      title="Database"
                      onPress={() => setActiveSettingsModal("database")}
                      accessibilityLabel="Open database backup settings"
                    />
                  </View>
                </FadeInView>

                {/* Privacy & Analytics Section */}
                <FadeInView type="up" delay={150} duration={400}>
                  <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6]">
                    <Text className="text-xl font-semibold text-secondary">
                      Privacy & Analytics
                    </Text>
                    <View className="flex-row justify-between items-center py-2">
                      <View className="flex-1 pr-4">
                        <Text className="text-base font-semibold text-tertiary">
                          Share Usage Analytics
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          Help improve Travee by sharing usage metrics and crash
                          diagnostics
                        </Text>
                      </View>
                      <Switch
                        value={!isAnalyticsOptedOutState}
                        onValueChange={handleToggleAnalytics}
                        trackColor={{
                          false: "#D1D5DB",
                          true: colors.primary,
                        }}
                        thumbColor="#FFFFFF"
                        accessibilityRole="switch"
                        accessibilityLabel="Share Usage Analytics"
                      />
                    </View>
                  </View>
                </FadeInView>

                {/* About Section */}
                <View
                  className={[
                    "bg-white rounded-2xl p-4 gap-3 shadow-sm",
                    "elevation-2 border border-[#F3F4F6]",
                  ].join(" ")}
                >
                  <Text className="text-xl font-semibold text-secondary">
                    About
                  </Text>

                  <View className="flex-row justify-between items-center py-2">
                    <Text className="text-base font-semibold text-tertiary">
                      App Version
                    </Text>
                    <Text className="text-sm text-gray-500 font-medium">
                      {appVersion} (Build {buildVersion})
                    </Text>
                  </View>

                  <View className="h-[1px] bg-[#E5E7EB]" />

                  <SettingsRowItem
                    title="Privacy Policy"
                    onPress={() => setActiveSettingsModal("privacy")}
                    accessibilityLabel="Open privacy policy"
                  />

                  <View className="h-[1px] bg-[#E5E7EB]" />

                  <SettingsRowItem
                    title="Terms and Conditions"
                    onPress={() => setActiveSettingsModal("terms")}
                    accessibilityLabel="Open terms and conditions"
                  />

                  <View className="h-[1px] bg-[#E5E7EB]" />

                  <SettingsRowItem
                    title="Rate and Feedback"
                    onPress={handleRateAndFeedback}
                    accessibilityLabel="Rate and feedback"
                  />
                </View>

                {/* Developer Actions */}
                <DeveloperActions onCloseParentModal={onClose} />

                <View style={{ height: 40 }} />
              </ScrollView>

              {/* Account Bottom Sheet */}
              <AccountBottomSheet
                visible={activeSettingsModal === "account"}
                onClose={() => setActiveSettingsModal(null)}
                form={form}
                setForm={setForm}
                saveProfile={saveProfile}
              />

              {/* Notification Bottom Sheet */}
              <NotificationBottomSheet
                visible={activeSettingsModal === "notifications"}
                onClose={() => setActiveSettingsModal(null)}
                form={form}
                setForm={setForm}
                saveProfile={saveProfile}
              />

              {/* Security Settings Bottom Sheet */}
              <SecurityBottomSheet
                visible={activeSettingsModal === "security"}
                onClose={() => setActiveSettingsModal(null)}
              />

              {/* Database Backup Bottom Sheet */}
              <DatabaseBottomSheet
                visible={activeSettingsModal === "database"}
                onClose={() => setActiveSettingsModal(null)}
                form={form}
                setForm={setForm}
                saveProfile={saveProfile}
                profile={profile}
              />

              {/* Terms and Conditions Bottom Sheet */}
              <TermsBottomSheet
                visible={activeSettingsModal === "terms"}
                onClose={() => setActiveSettingsModal(null)}
              />

              {/* Privacy Policy Bottom Sheet */}
              <PrivacyBottomSheet
                visible={activeSettingsModal === "privacy"}
                onClose={() => setActiveSettingsModal(null)}
              />

              {/* Rate & Feedback / About Bottom Sheet */}
              <SettingsBottomSheet
                visible={showAboutModal}
                title={aboutModalTitle}
                accessibilityLabel={`Close ${aboutModalTitle}`}
                onClose={() => setShowAboutModal(false)}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                <Text className="text-base leading-6 text-tertiary font-normal whitespace-pre-wrap">
                  {aboutModalContent}
                </Text>
              </SettingsBottomSheet>
            </View>
          )}
        </Animated.View>

        {/* Semi-transparent backdrop click to close */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close profile overlay"
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
        />
      </View>
    </Modal>
  );
}

export default ProfileScreen;
