import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Switch,
  TextInput as RNTextInput,
  PanResponder,
  Animated,
  Dimensions,
  Vibration,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { TextInput, useTheme, Button } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserProfile, useSaveProfile } from "../hooks/useUserProfile";
import { UserProfileDto, AccountType } from "../types/UserProfileDto";
import { AccountBottomSheet } from "../features/Settings/Account";
import { DatabaseBackup, DatabaseBottomSheet } from "../features/Settings/Database";
import { NotificationSettings, NotificationBottomSheet } from "../features/Settings/Notifications";
import { DeveloperActions } from "../features/Settings/DeveloperActions";
import { SecuritySettings, SecurityBottomSheet } from "../features/Settings/Security";
import { TermsBottomSheet } from "../features/Settings/About/Terms";
import { PrivacyBottomSheet } from "../features/Settings/About/Privacy";
import { TRAVELER_TYPES } from "../components/OnboardingModal";
import { useQueryClient } from "@tanstack/react-query";
import { isAnalyticsOptedOut, setAnalyticsOptOut } from "../services/analytics/posthogService";
import { FadeInView } from "../components/animations";
import { useToast } from "../context/ToastContext";
import { LinearGradient } from 'expo-linear-gradient';

// Common currencies with flag emoji
const CURRENCIES = [
  { code: "PHP", label: "₱ Philippine Peso" },
  { code: "USD", label: "$ US Dollar" },
  { code: "EUR", label: "€ Euro" },
  { code: "GBP", label: "£ British Pound" },
  { code: "JPY", label: "¥ Japanese Yen" },
  { code: "AUD", label: "A$ Australian Dollar" },
  { code: "CAD", label: "C$ Canadian Dollar" },
  { code: "SGD", label: "S$ Singapore Dollar" },
  { code: "HKD", label: "HK$ Hong Kong Dollar" },
  { code: "KRW", label: "₩ Korean Won" },
];

const COUNTRIES = [
  "Philippines", "United States", "United Kingdom", "Australia",
  "Canada", "Japan", "South Korea", "Singapore", "Germany",
  "France", "Italy", "Spain", "Thailand", "Malaysia", "Indonesia",
  "Vietnam", "China", "India", "Brazil", "Mexico",
];

const AccountTypeBadge = ({ type }: { type: AccountType }) => {
  const isPremium = type === AccountType.Premium;
  return (
    <View className={`flex-row items-center gap-1 px-3 py-1 rounded-full ${isPremium ? 'bg-[#FEF3C7]' : 'bg-[#F3F4F6]'}`}>
      <Ionicons
        name={isPremium ? "star" : "person"}
        size={12}
        color={isPremium ? "#F59E0B" : "#6B7280"}
      />
      <Text className={`text-xs font-semibold ${isPremium ? 'text-[#D97706]' : 'text-[#6B7280]'}`}>
        {isPremium ? "Premium" : "Free"}
      </Text>
    </View>
  );
};

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");


interface AboutBottomSheetProps {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

const AboutBottomSheet: React.FC<AboutBottomSheetProps> = ({
  visible,
  title,
  content,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const dragPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
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
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <Animated.View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: backdropOpacity,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />

        <Animated.View
          className="bg-white rounded-t-[30px] shadow-lg overflow-hidden"
          style={{
            transform: [{ translateY }],
            maxHeight: screenHeight * 0.85,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
        >
          {/* Drag Handle Area */}
          <View
            {...dragPanResponder.panHandlers}
            className="w-full items-center pt-3 pb-2 bg-white rounded-t-[30px]"
          >
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-5 pt-2 pb-4 bg-white border-b border-gray-200">
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleDismiss}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Ionicons name="chevron-back" size={26} color="#999" />
              </TouchableOpacity>
              <Text className="text-2xl text-gray-700 font-medium">
                {title}
              </Text>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            className="p-6"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
          >
            <Text className="text-base leading-6 text-tertiary font-normal whitespace-pre-wrap">
              {content}
            </Text>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

interface ProfileScreenProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileScreen({ visible, onClose }: ProfileScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const slideAnim = React.useRef(new Animated.Value(-screenWidth)).current;

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
        toValue: -screenWidth,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -screenWidth,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const { showToast } = useToast();
  const { data: profile, isLoading } = useUserProfile();
  const { mutate: saveProfile, isPending: isSaving } = useSaveProfile();
  const queryClient = useQueryClient();

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
  const [activeSettingsModal, setActiveSettingsModal] = useState<"account" | "notifications" | "security" | "database" | "terms" | "privacy" | null>(null);

  // Privacy / Analytics opt-out state
  const [isAnalyticsOptedOutState, setIsAnalyticsOptedOutState] = useState<boolean>(isAnalyticsOptedOut());

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

  const handleSave = () => {
    saveProfile(form, {
      onSuccess: () => {
        showToast({
          type: "success",
          message: "Profile saved successfully",
        });
      },
      onError: (err: any) => {
        showToast({
          type: "error",
          message: err?.message || "Failed to save profile",
        });
      },
    });
  };

  const handleRateAndFeedback = () => {
    Alert.alert(
      "Rate & Feedback",
      "Thank you for using Travee! Would you like to rate the app on the store or send us your feedback?",
      [
        {
          text: "Send Feedback",
          onPress: () => {
            setAboutModalTitle("Send Feedback");
            setAboutModalContent("Please send your suggestions, bug reports, and ideas to support@travee.example.com. We appreciate your input!");
            setShowAboutModal(true);
          }
        },
        {
          text: "Rate App",
          onPress: () => {
            Alert.alert("Success", "Thank you for your rating!");
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

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
        onError: () => {
          setIsUploadingAvatar(false);
          showToast({
            type: "error",
            message: "Failed to update avatar.",
          });
        },
      });
    }
  };

  const selectedCurrencyLabel = CURRENCIES.find(c => c.code === form.defaultCurrency)?.label ?? form.defaultCurrency;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="dark-content" />

      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Animated Container - Full Height, slides from left to right */}

        <Animated.View
          style={{
            width: screenWidth,
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
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
          />
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Header */}

              <View className="flex-row items-center justify-between px-5 py-3.5">
                <TouchableOpacity onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close profile">
                  <Ionicons name="close" size={28} color="#374151" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-[#111827] flex-1 text-center">Profile</Text>
                {isSaving ? (
                  <View className="flex-row items-center gap-1.5 min-w-[28px] justify-end">
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text className="text-xs font-medium text-gray-500">Saving..</Text>
                  </View>
                ) : (
                  <View className="w-7" />
                )}
              </View>

              <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>

                {/* Avatar & Badge */}
                <FadeInView type="zoom" delay={100} duration={350} className="items-center py-5 gap-2.5">
                  <TouchableOpacity
                    onPress={handlePickAvatar}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Change avatar"
                    className="relative"
                  >
                    <View className="w-34 h-34 rounded-full bg-primary justify-center items-center overflow-hidden border border-white shadow">
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
                    <View className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full border border-white shadow">
                      {isUploadingAvatar ? (
                        <ActivityIndicator size="small" color="#fff" style={{ width: 14, height: 14 }} />
                      ) : (
                        <Ionicons name="camera" size={14} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <AccountTypeBadge type={form.accountType ?? AccountType.Free} />
                </FadeInView>

                {/* Account Type Card */}
                <FadeInView type="up" delay={150} duration={400}>
                  <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6] will-change-variable">
                    <Text className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Account Type</Text>
                    <View className="flex-row gap-2.5">
                      <TouchableOpacity
                        onPress={() => setForm(f => ({ ...f, accountType: AccountType.Free }))}
                        className={`flex-1 items-center p-3.5 rounded-xl border-2 bg-[#F9FAFB] gap-1 ${form.accountType === AccountType.Free ? 'border-primary bg-[#EFF6FF]' : 'border-[#E5E7EB]'}`}
                        accessibilityRole="button"
                      >
                        <Ionicons name="person" size={20} color={form.accountType === AccountType.Free ? "#0EA5E9" : "#9CA3AF"} />
                        <Text className={`text-base font-bold ${form.accountType === AccountType.Free ? 'text-primary' : 'text-[#9CA3AF]'}`}>Free</Text>
                        <Text className="text-sm text-[#9CA3AF]">Basic features</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setForm(f => ({ ...f, accountType: AccountType.Premium }))}
                        className={`flex-1 items-center p-3.5 rounded-xl border-2 bg-[#F9FAFB] gap-1 ${form.accountType === AccountType.Premium ? 'border-[#F59E0B] bg-[#FFFBEB]' : 'border-[#E5E7EB]'}`}
                        accessibilityRole="button"
                      >
                        <Ionicons name="star" size={20} color={form.accountType === AccountType.Premium ? "#F59E0B" : "#9CA3AF"} />
                        <Text className={`text-base font-bold ${form.accountType === AccountType.Premium ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>Premium</Text>
                        <Text className="text-sm text-[#9CA3AF]">All features</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </FadeInView>

                {/* Settings Section */}
                <FadeInView type="up" delay={200} duration={400}>
                  <View className="bg-white rounded-2xl p-4 gap-3 shadow-sm elevation-2 border border-[#F3F4F6] will-change-variable">
                    <Text className="text-xl font-semibold text-secondary">Settings</Text>

                    {/* Profile */}
                    <TouchableOpacity
                      onPress={() => setActiveSettingsModal("account")}
                      className="flex-row justify-between items-center py-2"
                      accessibilityRole="button"
                      accessibilityLabel="Profile"
                      activeOpacity={0.7}
                    >
                      <Text className="text-base font-semibold text-tertiary">Profile</Text>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View className="h-[1px] bg-[#E5E7EB]" />

                    {/* Notifications */}
                    <TouchableOpacity
                      onPress={() => setActiveSettingsModal("notifications")}
                      className="flex-row justify-between items-center py-2"
                      accessibilityRole="button"
                      accessibilityLabel="Notifications"
                      activeOpacity={0.7}
                    >
                      <Text className="text-base font-semibold text-tertiary">Notification</Text>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View className="h-[1px] bg-[#E5E7EB]" />

                    {/* Security PIN Lock */}
                    <TouchableOpacity
                      onPress={() => setActiveSettingsModal("security")}
                      className="flex-row justify-between items-center py-2"
                      accessibilityRole="button"
                      accessibilityLabel="Security PIN Lock"
                      activeOpacity={0.7}
                    >
                      <Text className="text-base font-semibold text-tertiary">Security PIN Lock</Text>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View className="h-[1px] bg-[#E5E7EB]" />

                    {/* Database */}
                    <TouchableOpacity
                      onPress={() => setActiveSettingsModal("database")}
                      className="flex-row justify-between items-center py-2"
                      accessibilityRole="button"
                      accessibilityLabel="Database"
                      activeOpacity={0.7}
                    >
                      <Text className="text-base font-semibold text-tertiary">Database</Text>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </FadeInView>

                {/* Privacy & Analytics Section */}
                <FadeInView type="up" delay={150} duration={400}>
                  <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6] will-change-variable">
                    <Text className="text-xl font-semibold text-secondary">Privacy & Analytics</Text>
                    <View className="flex-row justify-between items-center py-2">
                      <View className="flex-1 pr-4">
                        <Text className="text-base font-semibold text-tertiary">Share Usage Analytics</Text>
                        <Text className="text-xs text-gray-500 mt-0.5">Help improve Travee by sharing usage metrics and crash diagnostics</Text>
                      </View>
                      <Switch
                        value={!isAnalyticsOptedOutState}
                        onValueChange={handleToggleAnalytics}
                        trackColor={{ false: "#D1D5DB", true: colors.primary }}
                        thumbColor="#FFFFFF"
                        accessibilityRole="switch"
                        accessibilityLabel="Share Usage Analytics"
                      />
                    </View>
                  </View>
                </FadeInView>

                {/* About Section */}
                <View className="bg-white rounded-2xl p-4 gap-3 shadow-sm elevation-2 border border-[#F3F4F6] will-change-variable">
                  <Text className="text-xl font-semibold text-secondary">About</Text>

                  <View className="flex-row justify-between items-center py-2">
                    <Text className="text-base font-semibold text-tertiary">App Version</Text>
                    <Text className="text-sm text-gray-500 font-medium">
                      {Application.nativeApplicationVersion || Constants.expoConfig?.version || "1.0.0"} (Build {Application.nativeBuildVersion || (Constants.expoConfig?.android as any)?.versionCode || "1"})
                    </Text>
                  </View>

                  <View className="h-[1px] bg-[#E5E7EB]" />
                  <TouchableOpacity
                    onPress={() => setActiveSettingsModal("privacy")}
                    className="flex-row justify-between items-center py-2"
                    accessibilityRole="button"
                    accessibilityLabel="Privacy Policy"
                  >
                    <Text className="text-base font-semibold text-tertiary">Privacy Policy</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  <View className="h-[1px] bg-[#E5E7EB]" />
                  <TouchableOpacity
                    onPress={() => setActiveSettingsModal("terms")}
                    className="flex-row justify-between items-center py-2"
                    accessibilityRole="button"
                    accessibilityLabel="Terms and Conditions"
                  >
                    <Text className="text-base font-semibold text-tertiary">Terms and Conditions</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  <View className="h-[1px] bg-[#E5E7EB]" />
                  <TouchableOpacity
                    onPress={handleRateAndFeedback}
                    className="flex-row justify-between items-center py-2"
                    accessibilityRole="button"
                    accessibilityLabel="Rate and Feedback"
                  >
                    <Text className="text-base font-semibold text-tertiary">Rate and Feedback</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
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

              {/* About Section Bottom Sheet */}
              <AboutBottomSheet
                visible={showAboutModal}
                title={aboutModalTitle}
                content={aboutModalContent}
                onClose={() => setShowAboutModal(false)}
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

            </View>
          )}
        </Animated.View>

        {/* Semi-transparent backdrop click to close */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleClose}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
        />
      </View>
    </Modal>
  );
}


