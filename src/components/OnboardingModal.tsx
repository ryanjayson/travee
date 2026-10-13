import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Switch,
  Vibration,
  Alert,
  BackHandler,
  Keyboard,
  Dimensions,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserProfile, useSaveProfile } from "../hooks/useUserProfile";
import { TERMS_AND_CONDITIONS_TEXT } from "../features/Settings/About/Terms";
import { PRIVACY_POLICY_TEXT } from "../features/Settings/About/Privacy";
import { setAnalyticsOptOut } from "../services/analytics/posthogService";
import { seedTestNotifications } from "../services/local/notificationService";
import { seedDemoTravelData } from "../services/local/travelService";
import {
  isBiometricsSupported,
  authenticateWithBiometrics,
  setPin,
  setPinEnabled as savePinEnabled,
  setBiometricsEnabled as saveBiometricsEnabled,
  clearPin,
} from "../services/local/securityService";
import { logger } from "../services/errorLogger";

// --- Constants & Pure Helpers ---------------------------------------------

export const TRAVELER_TYPES = [
  { id: "solo", label: "Solo Traveler", emoji: "🚶" },
  { id: "backpacker", label: "Backpacker", emoji: "🎒" },
  { id: "business", label: "Business Traveler", emoji: "💼" },
  { id: "couple", label: "Couple", emoji: "👩‍❤️‍👨" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
  { id: "luxury", label: "Luxury Traveler", emoji: "💎" },
  { id: "adventure", label: "Adventure Seeker", emoji: "🧭" },
  { id: "foodie", label: "Foodie", emoji: "🍕" },
];

export const COUNTRIES = [
  "Australia",
  "Canada",
  "Ireland",
  "New Zealand",
  "Philippines",
  "Singapore",
  "United Kingdom",
  "United States",
];

export const validateNickname = (name: string): string | null => {
  if (!name) return null;
  if (name.includes(" ")) {
    return "Spaces are not allowed";
  }
  if (name.length < 5) {
    return "Nickname must be at least 5 characters";
  }
  if (name.length > 20) {
    return "Nickname cannot exceed 20 characters";
  }
  return null;
};

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

// --- Subcomponents --------------------------------------------------------

interface HeaderProps {
  step: OnboardingStep;
  topInset: number;
  colors: any;
  onBack: () => void;
  onClose: () => void;
}

const OnboardingHeader: React.FC<HeaderProps> = ({
  step,
  topInset,
  colors,
  onBack,
  onClose,
}) => {
  if (step > 1 && step <= 7) {
    return (
      <View
        className="flex-row items-center justify-between px-5 h-14"
        style={{ marginTop: topInset }}
      >
        <TouchableOpacity
          onPress={onBack}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-row gap-1.5">
          {[2, 3, 4, 5, 6, 7].map((s) => (
            <View
              key={s}
              className="w-4 h-1 rounded-sm"
              style={{
                backgroundColor:
                  step === s
                    ? colors.primary
                    : step > s
                      ? `${colors.primary}80`
                      : "#E5E7EB",
              }}
            />
          ))}
        </View>
        <View className="w-6" />
      </View>
    );
  }

  return (
    <View
      className="flex-row items-center justify-between px-5 h-14"
      style={{ marginTop: topInset }}
    >
      <View className="flex-1" />
      {step === 1 && (
        <TouchableOpacity
          onPress={onClose}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Close onboarding"
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

interface WelcomeStepProps {
  opacityAnim: Animated.Value;
  scaleAnim: Animated.Value;
  textFadeAnim: Animated.Value;
  textSlideAnim: Animated.Value;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({
  opacityAnim,
  scaleAnim,
  textFadeAnim,
  textSlideAnim,
}) => (
  <View className="flex-1 items-center justify-center px-4 pt-10">
    <Animated.Image
      source={require("../../assets/icon.png")}
      className="w-32 h-32 rounded-4xl mb-7"
      style={{
        width: 128,
        height: 128,
        borderRadius: 32,
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }}
      resizeMode="contain"
    />
    <Animated.View
      className="items-center"
      style={{
        opacity: textFadeAnim,
        transform: [{ translateY: textSlideAnim }],
      }}
    >
      <Text className="text-3xl font-bold text-center text-white mb-3">
        travelled
      </Text>
      <Text className="text-[15px] text-gray-400 text-center leading-[22px] px-3">
        Your ultimate companion for planning and organizing trips, keeping
        track of checklists, and building detailed itineraries.
      </Text>
    </Animated.View>
  </View>
);

interface TermsStepProps {
  termsAccepted: boolean;
  colors: any;
  textFadeAnim: Animated.Value;
  textSlideAnim: Animated.Value;
  onToggleTerms: () => void;
}

const TermsStep: React.FC<TermsStepProps> = ({
  termsAccepted,
  colors,
  textFadeAnim,
  textSlideAnim,
  onToggleTerms,
}) => (
  <Animated.View
    className="flex-1"
    style={{
      opacity: textFadeAnim,
      transform: [{ translateY: textSlideAnim }],
    }}
  >
    <Text
      className="text-3xl font-bold mb-2"
      style={{ color: colors.primary }}
    >
      Terms and Conditions
    </Text>
    <Text className="text-base text-gray-500 leading-5 mb-4">
      Please review and accept our terms of service to continue using Travee.
    </Text>

    {/* Highlights Summary Badges */}
    <View className="flex-row gap-2 mb-3">
      <View className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 items-center">
        <Ionicons name="document-text-outline" size={20} color={colors.primary} />
        <Text className="text-[11px] font-semibold text-gray-700 text-center mt-1">
          Personal Use
        </Text>
      </View>
      <View className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 items-center">
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        <Text className="text-[11px] font-semibold text-gray-700 text-center mt-1">
          Data Ownership
        </Text>
      </View>
      <View className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 items-center">
        <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
        <Text className="text-[11px] font-semibold text-gray-700 text-center mt-1">
          Service Rules
        </Text>
      </View>
    </View>

    {/* Scrollable Terms Content */}
    <View className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-3">
      <ScrollView
        showsVerticalScrollIndicator={true}
        className="flex-1"
      >
        <Text className="text-xs text-gray-600 leading-5 whitespace-pre-wrap">
          {TERMS_AND_CONDITIONS_TEXT}
        </Text>
      </ScrollView>
    </View>

    {/* Checkbox row */}
    <TouchableOpacity
      onPress={onToggleTerms}
      className={
        "flex-row items-center p-3.5 border-[1.5px] " +
        "border-gray-200 rounded-2xl bg-gray-50 mb-1"
      }
      style={
        termsAccepted
          ? {
            borderColor: colors.primary,
            backgroundColor: `${colors.primary}08`,
          }
          : null
      }
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: termsAccepted }}
      accessibilityLabel="I have read and agree to the Terms and Conditions"
    >
      <View
        className="w-[22px] h-[22px] rounded-md border-2 items-center justify-center mr-3"
        style={[
          { borderColor: termsAccepted ? colors.primary : "#9CA3AF" },
          termsAccepted && { backgroundColor: colors.primary },
        ]}
      >
        {termsAccepted && (
          <Ionicons name="checkmark" size={16} color="#fff" />
        )}
      </View>
      <Text className="text-[14px] font-semibold text-gray-700 flex-1">
        I have read and agree to the Terms and Conditions
      </Text>
    </TouchableOpacity>
    {!termsAccepted && (
      <Text className="text-xs text-gray-400 ml-1 mb-1">
        You must accept the terms and conditions to proceed.
      </Text>
    )}
  </Animated.View>
);

interface PrivacyStepProps {
  privacyAccepted: boolean;
  shareAnalytics: boolean;
  colors: any;
  textFadeAnim: Animated.Value;
  textSlideAnim: Animated.Value;
  onTogglePrivacy: () => void;
  onToggleAnalytics: (val: boolean) => void;
}

const PrivacyStep: React.FC<PrivacyStepProps> = ({
  privacyAccepted,
  shareAnalytics,
  colors,
  textFadeAnim,
  textSlideAnim,
  onTogglePrivacy,
  onToggleAnalytics,
}) => (
  <Animated.View
    className="flex-1"
    style={{
      opacity: textFadeAnim,
      transform: [{ translateY: textSlideAnim }],
    }}
  >
    <Text
      className="text-3xl font-bold mb-2"
      style={{ color: colors.primary }}
    >
      Privacy & Analytics
    </Text>
    <Text className="text-base text-gray-500 leading-5 mb-4">
      Your privacy matters to us. Learn how Travee protects your information and manage your analytics preferences.
    </Text>

    {/* Privacy Highlights */}
    <View className="flex-row gap-2 mb-3">
      <View className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 items-center">
        <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
        <Text className="text-[11px] font-semibold text-gray-700 text-center mt-1">
          100% On-Device
        </Text>
      </View>
      <View className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 items-center">
        <Ionicons name="eye-off-outline" size={20} color={colors.primary} />
        <Text className="text-[11px] font-semibold text-gray-700 text-center mt-1">
          Zero Tracking
        </Text>
      </View>
      <View className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 items-center">
        <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
        <Text className="text-[11px] font-semibold text-gray-700 text-center mt-1">
          No Data Selling
        </Text>
      </View>
    </View>

    {/* Scrollable Privacy Policy Content */}
    <View className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-3">
      <ScrollView
        showsVerticalScrollIndicator={true}
        className="flex-1"
      >
        <Text className="text-xs text-gray-600 leading-5 whitespace-pre-wrap">
          {PRIVACY_POLICY_TEXT}
        </Text>
      </ScrollView>
    </View>

    {/* Checkbox 1: Privacy Policy Acceptance - True by default */}
    <TouchableOpacity
      onPress={onTogglePrivacy}
      className={
        "flex-row items-center p-3.5 border-[1.5px] " +
        "border-gray-200 rounded-2xl bg-gray-50 mb-2"
      }
      style={
        privacyAccepted
          ? {
            borderColor: colors.primary,
            backgroundColor: `${colors.primary}08`,
          }
          : null
      }
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: privacyAccepted }}
      accessibilityLabel="I have read and agree to the Privacy Policy"
    >
      <View
        className="w-[22px] h-[22px] rounded-md border-2 items-center justify-center mr-3"
        style={[
          { borderColor: privacyAccepted ? colors.primary : "#9CA3AF" },
          privacyAccepted && { backgroundColor: colors.primary },
        ]}
      >
        {privacyAccepted && (
          <Ionicons name="checkmark" size={16} color="#fff" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-gray-700">
          I have read and agree to the Privacy Policy
        </Text>
        <Text className="text-[12px] leading-5 text-gray-400 mt-0.5">
          Pre-selected for a streamlined onboarding experience
        </Text>
      </View>
    </TouchableOpacity>

    {/* Setting 2: Share Usage Analytics - True by default */}
    <View
      className={
        "flex-row items-center justify-between p-3.5 border-[1.5px] " +
        "border-gray-200 rounded-2xl bg-gray-50 mb-1"
      }
      style={
        shareAnalytics
          ? {
            borderColor: colors.primary,
            backgroundColor: `${colors.primary}08`,
          }
          : null
      }
    >
      <View className="flex-1 mr-3">
        <Text className="text-[14px] font-semibold text-gray-900">
          Share Usage Analytics
        </Text>
        <Text className="text-[12px] text-gray-500 mt-0.5 leading-5">
          Help improve Travee by sharing anonymous usage metrics and crash diagnostics.
        </Text>
      </View>
      <Switch
        value={shareAnalytics}
        onValueChange={onToggleAnalytics}
        trackColor={{ false: "#D1D5DB", true: `${colors.primary}80` }}
        thumbColor={shareAnalytics ? colors.primary : "#F3F4F6"}
        accessibilityRole="switch"
        accessibilityLabel="Share Usage Analytics"
      />
    </View>

    {!privacyAccepted && (
      <Text className="text-xs text-gray-400 ml-1 mb-1">
        You must accept the privacy policy to proceed.
      </Text>
    )}
  </Animated.View>
);

interface NicknameStepProps {
  nickname: string;
  nicknameError: string | null;
  colors: any;
  textFadeAnim: Animated.Value;
  textSlideAnim: Animated.Value;
  onChangeNickname: (val: string) => void;
  onSubmitEditing: () => void;
}

const NicknameStep: React.FC<NicknameStepProps> = ({
  nickname,
  nicknameError,
  colors,
  textFadeAnim,
  textSlideAnim,
  onChangeNickname,
  onSubmitEditing,
}) => (
  <Animated.View
    className="flex-1"
    style={{
      opacity: textFadeAnim,
      transform: [{ translateY: textSlideAnim }],
    }}
  >
    <Text
      className="text-3xl font-bold mb-2"
      style={{ color: colors.primary }}
    >
      Choose your nickname
    </Text>
    <Text className="text-base text-gray-500 leading-5 mb-7">
      What should we call you? Pick a unique nickname to get started.
    </Text>

    <View
      className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 h-16"
      style={nicknameError ? { borderColor: colors.error } : null}
    >
      <Text className="text-lg text-gray-400 mr-1 font-semibold">@</Text>
      <TextInput
        className="flex-1 text-base text-gray-900 h-full"
        value={nickname}
        onChangeText={onChangeNickname}
        placeholder="nickname"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        onSubmitEditing={onSubmitEditing}
      />
      <Text
        className="text-xs text-gray-400 ml-2"
        style={nickname.length > 20 ? { color: colors.error } : null}
      >
        {nickname.length}/20
      </Text>
    </View>
    {nicknameError ? (
      <Text
        className="text-xs mt-2 ml-1 font-medium"
        style={{ color: colors.error }}
      >
        {nicknameError}
      </Text>
    ) : null}
  </Animated.View>
);

interface TravelStyleStepProps {
  selectedTypes: string[];
  styleCardAnims: Animated.Value[];
  colors: any;
  textFadeAnim: Animated.Value;
  textSlideAnim: Animated.Value;
  onToggleType: (id: string) => void;
}

const TravelStyleStep: React.FC<TravelStyleStepProps> = ({
  selectedTypes,
  styleCardAnims,
  colors,
  textFadeAnim,
  textSlideAnim,
  onToggleType,
}) => (
  <View className="flex-1">
    <Animated.View
      style={{
        opacity: textFadeAnim,
        transform: [{ translateY: textSlideAnim }],
      }}
    >
      <Text
        className="text-3xl font-bold mb-2"
        style={{ color: colors.primary }}
      >
        What's your travel style?
      </Text>
      <Text className="text-base text-gray-500 leading-5 mb-7">
        Select all that apply. We'll use this to suggest ideas.
      </Text>
    </Animated.View>

    <ScrollView
      contentContainerClassName="flex-row flex-wrap justify-between gap-3 pb-6"
      showsVerticalScrollIndicator={false}
    >
      {TRAVELER_TYPES.map((type, index) => {
        const isSelected = selectedTypes.includes(type.id);
        const cardAnim = styleCardAnims[index];

        return (
          <Animated.View
            key={type.id}
            className="w-[48%] aspect-[1.1]"
            style={{
              opacity: cardAnim,
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              onPress={() => onToggleType(type.id)}
              className={
                "w-full h-full bg-gray-50 border-2 border-gray-200 " +
                "rounded-[20px] p-4 justify-center relative"
              }
              style={
                isSelected
                  ? {
                    borderColor: colors.primary,
                    backgroundColor: `${colors.primary}0D`,
                  }
                  : null
              }
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <Text className="text-[28px] mb-2">{type.emoji}</Text>
              <Text
                className="text-[13px] font-semibold text-gray-600"
                style={
                  isSelected
                    ? { color: colors.primary, fontWeight: "bold" }
                    : null
                }
              >
                {type.label}
              </Text>
              {isSelected && (
                <View
                  className={
                    "absolute top-3 right-3 w-[18px] h-[18px] " +
                    "rounded-full items-center justify-center"
                  }
                  style={{ backgroundColor: colors.primary }}
                >
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </ScrollView>
  </View>
);

interface CountryStepProps {
  searchQuery: string;
  selectedCountry: string;
  filteredCountries: string[];
  colors: any;
  textFadeAnim: Animated.Value;
  textSlideAnim: Animated.Value;
  onChangeSearchQuery: (val: string) => void;
  onSelectCountry: (val: string) => void;
}

const CountryStep: React.FC<CountryStepProps> = ({
  searchQuery,
  selectedCountry,
  filteredCountries,
  colors,
  textFadeAnim,
  textSlideAnim,
  onChangeSearchQuery,
  onSelectCountry,
}) => (
  <Animated.View
    className="flex-1"
    style={{
      opacity: textFadeAnim,
      transform: [{ translateY: textSlideAnim }],
    }}
  >
    <Text
      className="text-3xl font-bold mb-2"
      style={{ color: colors.primary }}
    >
      Where are you from?
    </Text>
    <Text className="text-base text-gray-500 leading-5 mb-7">
      Select your primary home country.
    </Text>

    <View
      className={
        "flex-row items-center bg-gray-50 border border-gray-200 " +
        "rounded-2xl px-4  mb-4 h-16"
      }
    >
      <Ionicons
        name="search"
        size={20}
        color="#9CA3AF"
        style={{ marginRight: 8 }}
      />
      <TextInput
        className="flex-1 text-base text-gray-900"
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
        placeholder="Search countries"
        placeholderTextColor="#9CA3AF"
      />
    </View>

    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {filteredCountries.map((c) => {
        const isSelected = selectedCountry === c;
        return (
          <TouchableOpacity
            key={c}
            onPress={() => onSelectCountry(c)}
            className="flex-row items-center justify-between py-3.5 px-4 rounded-xl mb-1"
            style={
              isSelected ? { backgroundColor: `${colors.primary}0D` } : null
            }
            accessibilityRole="button"
          >
            <Text
              className="text-[15px] text-gray-700"
              style={
                isSelected
                  ? { color: colors.primary, fontWeight: "bold" }
                  : null
              }
            >
              {c}
            </Text>
            {isSelected && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </Animated.View>
);

/*
// --- Commented out: Notification & Security steps (to be added in next release) ---

interface NotificationStepProps {
  notificationsEnabled: boolean;
  notifyDaysBeforeTrip: number;
  notifyHoursBeforeActivity: number;
  colors: any;
  textFadeAnim: Animated.Value;
  textSlideAnim: Animated.Value;
  onToggleNotifications: (val: boolean) => void;
  onChangeDays: (delta: number) => void;
  onChangeHours: (delta: number) => void;
}

const NotificationStep: React.FC<NotificationStepProps> = ({
  notificationsEnabled,
  notifyDaysBeforeTrip,
  notifyHoursBeforeActivity,
  colors,
  textFadeAnim,
  textSlideAnim,
  onToggleNotifications,
  onChangeDays,
  onChangeHours,
}) => (
  <Animated.View
    className="flex-1"
    style={{
      opacity: textFadeAnim,
      transform: [{ translateY: textSlideAnim }],
    }}
  >
    <Text
      className="text-2xl font-bold mb-2"
      style={{ color: colors.primary }}
    >
      Turn on notifications
    </Text>
    <Text className="text-sm text-gray-500 leading-5 mb-7">
      Never miss an update. Customize when you want to get notified about your
      upcoming trips and activities.
    </Text>

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-5"
    >
      <View
        className={
          "flex-row items-center mb-6 p-4 border-[1.5px] " +
          "border-gray-200 rounded-2xl bg-gray-50"
        }
      >
        <View className="flex-1 mr-4">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            Enable Push Notifications
          </Text>
          <Text className="text-xs text-gray-500">
            Get reminders on your device for trip planning.
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={onToggleNotifications}
          trackColor={{ false: "#D1D5DB", true: `${colors.primary}80` }}
          thumbColor={notificationsEnabled ? colors.primary : "#F3F4F6"}
        />
      </View>

      <View
        className="bg-gray-50 border-[1.5px] border-gray-200 rounded-2xl p-4"
        style={!notificationsEnabled ? { opacity: 0.5 } : null}
        pointerEvents={notificationsEnabled ? "auto" : "none"}
      >
        <Text
          className={
            "text-xs font-bold text-gray-400 uppercase tracking-widest mb-4"
          }
        >
          Notification Settings
        </Text>

        <View className="flex-row items-center justify-between py-2">
          <View className="flex-1 mr-4">
            <Text className="text-[15px] font-semibold text-gray-700 mb-1">
              Before trip starts
            </Text>
            <Text className="text-xs text-gray-500 leading-4">
              How many days in advance should we notify you?
            </Text>
          </View>
          <View
            className={
              "flex-row items-center bg-white border border-gray-200 " +
              "rounded-[20px] p-1"
            }
          >
            <TouchableOpacity
              onPress={() => onChangeDays(-1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-gray-100"
              disabled={!notificationsEnabled || notifyDaysBeforeTrip <= 1}
              accessibilityRole="button"
              accessibilityLabel="Decrease days"
            >
              <Ionicons
                name="remove"
                size={18}
                color={
                  !notificationsEnabled || notifyDaysBeforeTrip <= 1
                    ? "#9CA3AF"
                    : colors.primary
                }
              />
            </TouchableOpacity>
            <Text className="text-sm font-semibold text-gray-900 px-3 min-w-[70px] text-center">
              {notifyDaysBeforeTrip}{" "}
              {notifyDaysBeforeTrip === 1 ? "day" : "days"}
            </Text>
            <TouchableOpacity
              onPress={() => onChangeDays(1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-gray-100"
              disabled={!notificationsEnabled || notifyDaysBeforeTrip >= 30}
              accessibilityRole="button"
              accessibilityLabel="Increase days"
            >
              <Ionicons
                name="add"
                size={18}
                color={
                  !notificationsEnabled || notifyDaysBeforeTrip >= 30
                    ? "#9CA3AF"
                    : colors.primary
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-[1px] bg-gray-200 my-4" />

        <View className="flex-row items-center justify-between py-2">
          <View className="flex-1 mr-4">
            <Text className="text-[15px] font-semibold text-gray-700 mb-1">
              Before activity starts
            </Text>
            <Text className="text-xs text-gray-500 leading-4">
              How many hours in advance should we notify you?
            </Text>
          </View>
          <View
            className={
              "flex-row items-center bg-white border border-gray-200 " +
              "rounded-[20px] p-1"
            }
          >
            <TouchableOpacity
              onPress={() => onChangeHours(-1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-gray-100"
              disabled={!notificationsEnabled || notifyHoursBeforeActivity <= 1}
              accessibilityRole="button"
              accessibilityLabel="Decrease hours"
            >
              <Ionicons
                name="remove"
                size={18}
                color={
                  !notificationsEnabled || notifyHoursBeforeActivity <= 1
                    ? "#9CA3AF"
                    : colors.primary
                }
              />
            </TouchableOpacity>
            <Text className="text-sm font-semibold text-gray-900 px-3 min-w-[70px] text-center">
              {notifyHoursBeforeActivity}{" "}
              {notifyHoursBeforeActivity === 1 ? "hour" : "hours"}
            </Text>
            <TouchableOpacity
              onPress={() => onChangeHours(1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-gray-100"
              disabled={
                !notificationsEnabled || notifyHoursBeforeActivity >= 24
              }
              accessibilityRole="button"
              accessibilityLabel="Increase hours"
            >
              <Ionicons
                name="add"
                size={18}
                color={
                  !notificationsEnabled || notifyHoursBeforeActivity >= 24
                    ? "#9CA3AF"
                    : colors.primary
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  </Animated.View>
);

interface SecurityStepProps {
  pinEnabled: boolean;
  pinCode: string;
  pinStage: "enter" | "confirm" | "done";
  pinError: string;
  pinInputRef: React.RefObject<TextInput | null>;
  hasBiometricsSupport: boolean;
  biometricsEnabled: boolean;
  colors: any;
  textFadeAnim: Animated.Value;
  textSlideAnim: Animated.Value;
  onTogglePin: (val: boolean) => void;
  onPinChange: (text: string) => void;
  onToggleBiometrics: (val: boolean) => void;
}

const SecurityStep: React.FC<SecurityStepProps> = ({
  pinEnabled,
  pinCode,
  pinStage,
  pinError,
  pinInputRef,
  hasBiometricsSupport,
  biometricsEnabled,
  colors,
  textFadeAnim,
  textSlideAnim,
  onTogglePin,
  onPinChange,
  onToggleBiometrics,
}) => (
  <Animated.View
    className="flex-1"
    style={{
      opacity: textFadeAnim,
      transform: [{ translateY: textSlideAnim }],
    }}
  >
    <Text
      className="text-2xl font-bold mb-2"
      style={{ color: colors.primary }}
    >
      Secure your travel plan
    </Text>
    <Text className="text-sm text-gray-500 leading-5 mb-7">
      Enable app locking to keep your travel itineraries and personal details
      private.
    </Text>

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-5"
    >
      <View
        className={
          "flex-row items-center mb-6 p-4 border-[1.5px] " +
          "border-gray-200 rounded-2xl bg-gray-50"
        }
      >
        <View className="flex-1 mr-4">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            Enable PIN Lock
          </Text>
          <Text className="text-xs text-gray-500">
            Require a 4-digit code to open the app.
          </Text>
        </View>
        <Switch
          value={pinEnabled}
          onValueChange={onTogglePin}
          trackColor={{ false: "#D1D5DB", true: `${colors.primary}80` }}
          thumbColor={pinEnabled ? colors.primary : "#F3F4F6"}
        />
      </View>

      {pinEnabled && (
        <View className="bg-gray-50 border-[1.5px] border-gray-200 rounded-2xl p-4 mb-5">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            {pinStage === "enter"
              ? "Create PIN code"
              : pinStage === "confirm"
                ? "Confirm PIN code"
                : "PIN Code Saved"}
          </Text>

          <Text className="text-sm text-gray-600 mb-3">
            {pinStage === "enter"
              ? "Type a 4-digit passcode:"
              : pinStage === "confirm"
                ? "Type the passcode again to confirm:"
                : "Passcode successfully verified and setup."}
          </Text>

          {pinStage !== "done" && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => pinInputRef.current?.focus()}
              className="items-center my-3"
              accessibilityRole="button"
              accessibilityLabel="Enter PIN Code"
            >
              <View className="flex-row gap-4">
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = pinCode.length > idx;
                  return (
                    <View
                      key={idx}
                      className="w-12 h-12 rounded-xl border-2 items-center justify-center"
                      style={{
                        borderColor: isFilled ? colors.primary : "#D1D5DB",
                        backgroundColor: isFilled
                          ? `${colors.primary}10`
                          : "#FFFFFF",
                      }}
                    >
                      {isFilled && (
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors.primary }}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
              <TextInput
                ref={pinInputRef}
                value={pinCode}
                onChangeText={onPinChange}
                keyboardType="number-pad"
                maxLength={4}
                style={{
                  position: "absolute",
                  width: 0,
                  height: 0,
                  opacity: 0,
                }}
                caretHidden
              />
            </TouchableOpacity>
          )}

          {pinStage === "done" && (
            <View className="flex-row items-center gap-2 my-2">
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text className="text-emerald-500 font-semibold">
                PIN setup complete
              </Text>
            </View>
          )}

          {pinError ? (
            <Text
              className="text-xs text-center mt-2 font-medium"
              style={{ color: colors.error }}
            >
              {pinError}
            </Text>
          ) : null}
        </View>
      )}

      {pinEnabled && hasBiometricsSupport && (
        <View
          className={
            "flex-row items-center mb-6 p-4 border-[1.5px] " +
            "border-gray-200 rounded-2xl bg-gray-50"
          }
        >
          <View className="flex-1 mr-4">
            <Text className="text-base font-semibold text-gray-900 mb-1">
              Use Finger Scanner
            </Text>
            <Text className="text-xs text-gray-500">
              Unlock using fingerprint authentication.
            </Text>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={onToggleBiometrics}
            disabled={pinStage !== "done"}
            trackColor={{ false: "#D1D5DB", true: `${colors.primary}80` }}
            thumbColor={biometricsEnabled ? colors.primary : "#F3F4F6"}
          />
        </View>
      )}
    </ScrollView>
  </Animated.View>
);
*/

interface DemoDataStepProps {
  createDemoData: boolean;
  colors: any;
  textFadeAnim: Animated.Value;
  textSlideAnim: Animated.Value;
  onToggleDemoData: () => void;
}

const DemoDataStep: React.FC<DemoDataStepProps> = ({
  createDemoData,
  colors,
  textFadeAnim,
  textSlideAnim,
  onToggleDemoData,
}) => (
  <Animated.View
    className="flex-1"
    style={{
      opacity: textFadeAnim,
      transform: [{ translateY: textSlideAnim }],
    }}
  >
    <Text
      className="text-3xl font-bold mb-2"
      style={{ color: colors.primary }}
    >
      Demo Travel Plan
    </Text>
    <Text className="text-base text-gray-500 leading-6 mb-7">
      Would you like to import simulated travel data to explore Travelled's
      features?
    </Text>

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-5"
    >
      <TouchableOpacity
        onPress={onToggleDemoData}
        className={
          "flex-row items-center mb-3 p-4 border-[1.5px] " +
          "border-gray-200 rounded-2xl bg-gray-50"
        }
        style={
          createDemoData
            ? {
              borderColor: colors.primary,
              backgroundColor: `${colors.primary}08`,
            }
            : null
        }
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: createDemoData }}
      >
        <View
          className="w-[22px] h-[22px] rounded-md border-2 items-center justify-center mr-3"
          style={[
            { borderColor: colors.primary },
            createDemoData && { backgroundColor: colors.primary },
          ]}
        >
          {createDemoData && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
        <Text className="text-[15px] font-semibold text-gray-700">
          Yes, create demo travel data
        </Text>
      </TouchableOpacity>
    </ScrollView>
  </Animated.View>
);

const CONFETTI_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
  "#FBBF24",
];

interface Particle {
  id: number;
  startX: number;
  width: number;
  height: number;
  color: string;
  isCircle: boolean;
  swayDistance: number;
  rotation: number;
  duration: number;
  delay: number;
}

const generateParticles = (count = 35): Particle[] => {
  const { width } = Dimensions.get("window");
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: Math.random() * width,
    width: Math.floor(Math.random() * 6) + 6,
    height: Math.floor(Math.random() * 8) + 8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    isCircle: i % 4 === 0,
    swayDistance: (Math.random() - 0.5) * 60,
    rotation: Math.floor(Math.random() * 720) - 360,
    duration: Math.floor(Math.random() * 1000) + 2200,
    delay: Math.floor(Math.random() * 800),
  }));
};

const ConfettiBackground: React.FC = () => {
  const { height } = Dimensions.get("window");
  const particles = useRef(generateParticles(35)).current;
  const animValues = useRef(
    particles.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = animValues.map((anim, index) => {
      const p = particles[index];
      return Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: p.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();

    return () => {
      animValues.forEach((anim) => anim.stopAnimation());
    };
  }, [animValues, particles]);

  return (
    <View
      className="absolute inset-0 overflow-hidden"
      pointerEvents="none"
    >
      {particles.map((p, index) => {
        const anim = animValues[index];
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-30, height + 40],
        });
        const translateX = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, p.swayDistance, 0],
        });
        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", `${p.rotation}deg`],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.1, 0.85, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={p.id}
            style={{
              position: "absolute",
              left: p.startX,
              top: 0,
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              borderRadius: p.isCircle ? p.width / 2 : 2,
              opacity,
              transform: [
                { translateY },
                { translateX },
                { rotate },
              ],
            }}
          />
        );
      })}
    </View>
  );
};

interface SuccessStepProps {
  countdown: number;
  colors: any;
  textFadeAnim: Animated.Value;
  textSlideAnim: Animated.Value;
}

const SuccessStep: React.FC<SuccessStepProps> = ({
  countdown,
  colors,
  textFadeAnim,
  textSlideAnim,
}) => (
  <View className="flex-1 items-center justify-center relative">
    <ConfettiBackground />
    <Animated.View
      className="items-center justify-center pt-10"
      style={{
        opacity: textFadeAnim,
        transform: [{ translateY: textSlideAnim }],
      }}
    >
      <View
        className="w-[120px] h-[120px] rounded-full items-center justify-center mb-6"
        style={{ backgroundColor: `${colors.primary}1A` }}
      >
        <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
      </View>
      <Text
        className="text-4xl font-bold text-center mb-2"
        style={{ color: colors.primary }}
      >
        You're all set!
      </Text>
      <Text className="text-base text-gray-500 text-center leading-5 px-4 mb-8">
        Welcome to Travelled! Prepare to start planning your perfect trips.
      </Text>
      <Text className="text-base text-gray-400 text-center mt-5xl leading-5">
        Entering the dashboard in {countdown} seconds
      </Text>
    </Animated.View>
  </View>
);

interface FooterProps {
  step: OnboardingStep;
  bottomInset: number;
  disabled: boolean;
  colors: any;
  onNext: () => void;
}

const OnboardingFooter: React.FC<FooterProps> = ({
  step,
  bottomInset,
  disabled,
  colors,
  onNext,
}) => {
  if (step > 7) return null;

  const buttonLabel =
    step === 1 ? "Get Started" : step === 7 ? "Start the Adventure!" : "Next";

  return (
    <View
      className="px-6 pt-3"
      style={{ paddingBottom: Math.max(bottomInset, 16) }}
    >
      <TouchableOpacity
        onPress={onNext}
        disabled={disabled}
        className="h-[52px] rounded-[26px] items-center justify-center shadow-sm elevation-2"
        style={[
          { backgroundColor: step === 1 ? "#FFFFFF" : colors.primary },
          disabled && { opacity: 0.5 },
        ]}
        accessibilityRole="button"
      >
        <Text
          className="text-xl font-bold"
          style={{ color: step === 1 ? "#111827" : colors.onPrimary }}
        >
          {buttonLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Main Component --------------------------------------------------------

const OnboardingModal = ({ visible, onClose }: OnboardingModalProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: profile } = useUserProfile();
  const { mutate: saveProfile } = useSaveProfile();

  const [step, setStep] = useState<OnboardingStep>(1);

  // Legal Acceptance & Analytics State
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [shareAnalytics, setShareAnalytics] = useState(true);

  // Form State
  const [nickname, setNickname] = useState("");
  const nicknameError = validateNickname(nickname);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("Philippines");

  // Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifyDaysBeforeTrip, setNotifyDaysBeforeTrip] = useState(3);
  const [notifyHoursBeforeActivity, setNotifyHoursBeforeActivity] = useState(2);

  // Security State
  const [pinEnabled, setPinEnabledState] = useState(false);
  const [biometricsEnabled, setBiometricsEnabledState] = useState(false);
  const [hasBiometricsSupport, setHasBiometricsSupport] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [tempConfirmPin, setTempConfirmPin] = useState("");
  const [pinStage, setPinStage] = useState<"enter" | "confirm" | "done">("enter");
  const [pinError, setPinError] = useState("");
  const pinInputRef = useRef<TextInput>(null);

  const [createDemoData, setCreateDemoData] = useState(true);
  const [countdown, setCountdown] = useState(5);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(20)).current;
  const styleCardAnims = useRef(
    TRAVELER_TYPES.map(() => new Animated.Value(0))
  ).current;

  // Step 1 welcome animation
  useEffect(() => {
    if (visible && step === 1) {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, step]);

  // Step 5 traveler types stagger animation
  useEffect(() => {
    if (visible && step === 5) {
      styleCardAnims.forEach((anim) => anim.setValue(0));
      const animations = styleCardAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        })
      );
      Animated.stagger(50, animations).start();
    }
  }, [visible, step]);

  // Step title/content transition animation
  useEffect(() => {
    if (visible) {
      textFadeAnim.setValue(0);
      textSlideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, step]);

  const handleNext = useCallback(() => {
    if (step < 8) {
      setStep((prev) => (prev + 1) as OnboardingStep);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as OnboardingStep);
    }
  }, [step]);

  const handleFinish = useCallback(async () => {
    // Disable PIN & biometrics in local security storage for this release
    await clearPin();
    await savePinEnabled(false);
    await saveBiometricsEnabled(false);

    // Persist analytics preference (shareAnalytics: true -> optOut: false)
    try {
      await setAnalyticsOptOut(!shareAnalytics);
    } catch (err) {
      logger.service(err, {
        screen: "OnboardingModal",
        action: "setAnalyticsOptOut",
      });
    }

    // Set notificationsEnabled config to false in profile backend
    saveProfile({
      ...(profile ?? {}),
      nickname: nickname || undefined,
      username: nickname || undefined,
      defaultCountry: selectedCountry,
      travelStyle: selectedTypes.join(","),
      notificationsEnabled: false,
      notifyDaysBeforeTrip: 3,
      notifyHoursBeforeActivity: 2,
    });

    if (createDemoData) {
      try {
        await seedDemoTravelData();
        // seedTestNotifications omitted while notifications are disabled
      } catch (err) {
        logger.service(err, {
          screen: "OnboardingModal",
          action: "seedDemoData",
        });
      }
    }

    onClose();

    setTimeout(() => {
      setStep(1);
      setTermsAccepted(false);
      setPrivacyAccepted(true);
      setShareAnalytics(true);
      setNickname("");
      setSelectedTypes([]);
      setSearchQuery("");
      setSelectedCountry("Philippines");
      setCreateDemoData(true);
    }, 500);
  }, [
    saveProfile,
    profile,
    nickname,
    selectedCountry,
    selectedTypes,
    createDemoData,
    onClose,
  ]);

  // Step 8 auto-finish countdown
  useEffect(() => {
    if (visible && step === 8) {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [visible, step, handleFinish]);

  // Android hardware back button handler
  useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      if (step > 1 && step <= 7) {
        handleBack();
        return true;
      }
      if (step === 1) {
        onClose();
        return true;
      }
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [visible, step, handleBack, onClose]);

  const toggleTravelerType = useCallback((typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  }, []);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isNextDisabled =
    (step === 2 && !termsAccepted) ||
    (step === 3 && !privacyAccepted) ||
    (step === 4 && (!nickname.trim() || !!nicknameError));

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView
        className="flex-1 bg-white"
        style={step === 1 ? { backgroundColor: "#111827" } : null}
      >
        <OnboardingHeader
          step={step}
          topInset={insets.top}
          colors={colors}
          onBack={handleBack}
          onClose={onClose}
        />

        <View className="flex-1 px-6 pt-4">
          {step === 1 && (
            <WelcomeStep
              scaleAnim={scaleAnim}
              opacityAnim={opacityAnim}
              textFadeAnim={textFadeAnim}
              textSlideAnim={textSlideAnim}
            />
          )}

          {step === 2 && (
            <TermsStep
              termsAccepted={termsAccepted}
              colors={colors}
              textFadeAnim={textFadeAnim}
              textSlideAnim={textSlideAnim}
              onToggleTerms={() => setTermsAccepted((prev) => !prev)}
            />
          )}

          {step === 3 && (
            <PrivacyStep
              privacyAccepted={privacyAccepted}
              shareAnalytics={shareAnalytics}
              colors={colors}
              textFadeAnim={textFadeAnim}
              textSlideAnim={textSlideAnim}
              onTogglePrivacy={() => setPrivacyAccepted((prev) => !prev)}
              onToggleAnalytics={setShareAnalytics}
            />
          )}

          {step === 4 && (
            <NicknameStep
              nickname={nickname}
              nicknameError={nicknameError}
              colors={colors}
              textFadeAnim={textFadeAnim}
              textSlideAnim={textSlideAnim}
              onChangeNickname={setNickname}
              onSubmitEditing={() => {
                if (nickname.trim() && !nicknameError) {
                  Keyboard.dismiss();
                  handleNext();
                }
              }}
            />
          )}

          {step === 5 && (
            <TravelStyleStep
              selectedTypes={selectedTypes}
              styleCardAnims={styleCardAnims}
              colors={colors}
              textFadeAnim={textFadeAnim}
              textSlideAnim={textSlideAnim}
              onToggleType={toggleTravelerType}
            />
          )}

          {step === 6 && (
            <CountryStep
              searchQuery={searchQuery}
              selectedCountry={selectedCountry}
              filteredCountries={filteredCountries}
              colors={colors}
              textFadeAnim={textFadeAnim}
              textSlideAnim={textSlideAnim}
              onChangeSearchQuery={setSearchQuery}
              onSelectCountry={setSelectedCountry}
            />
          )}

          {step === 7 && (
            <DemoDataStep
              createDemoData={createDemoData}
              colors={colors}
              textFadeAnim={textFadeAnim}
              textSlideAnim={textSlideAnim}
              onToggleDemoData={() => setCreateDemoData(!createDemoData)}
            />
          )}

          {step === 8 && (
            <SuccessStep
              countdown={countdown}
              colors={colors}
              textFadeAnim={textFadeAnim}
              textSlideAnim={textSlideAnim}
            />
          )}
        </View>

        <OnboardingFooter
          step={step}
          bottomInset={insets.bottom}
          disabled={isNextDisabled}
          colors={colors}
          onNext={handleNext}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default OnboardingModal;
