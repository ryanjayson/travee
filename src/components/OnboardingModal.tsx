import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  Animated,
  Switch,
  Vibration,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserProfile, useSaveProfile } from "../hooks/useUserProfile";
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

// Traveler type options with emojis
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

const COUNTRIES = [
  "Philippines", "United States", "United Kingdom", "Australia",
  "Canada", "Japan", "South Korea", "Singapore", "Germany",
  "France", "Italy", "Spain", "Thailand", "Malaysia", "Indonesia",
  "Vietnam", "China", "India", "Brazil", "Mexico",
];

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

const OnboardingModal = ({ visible, onClose }: OnboardingModalProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: profile } = useUserProfile();
  const { mutate: saveProfile } = useSaveProfile();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);

  // Form State
  const [nickname, setNickname] = useState("");

  const nicknameError = (() => {
    if (!nickname) return null;
    if (nickname.includes(" ")) {
      return "Spaces are not allowed";
    }
    if (nickname.length > 20) {
      return "Nickname cannot exceed 20 characters";
    }
    return null;
  })();
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

  // Animations for welcome logo
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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

  // Staggered animations for travel style cards
  const styleCardAnims = useRef(
    TRAVELER_TYPES.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (visible && step === 3) {
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

  // Animations for step transition (applies to titles/texts)
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(20)).current;

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

  // Check biometric support on visibility
  useEffect(() => {
    if (visible) {
      const checkBiometrics = async () => {
        const { hasHardware, isEnrolled } = await isBiometricsSupported();
        setHasBiometricsSupport(hasHardware && isEnrolled);
      };
      checkBiometrics();
    }
  }, [visible]);

  // PIN validation handler
  const handlePinTextChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "");
    setPinCode(numericText);

    if (numericText.length === 4) {
      if (pinStage === "enter") {
        setTempConfirmPin(numericText);
        setPinCode("");
        setPinStage("confirm");
        setTimeout(() => {
          pinInputRef.current?.focus();
        }, 100);
      } else if (pinStage === "confirm") {
        if (numericText === tempConfirmPin) {
          setPinStage("done");
          setPinError("");
        } else {
          Vibration.vibrate(200);
          setPinCode("");
          setTempConfirmPin("");
          setPinStage("enter");
          setPinError("PINs do not match. Please try again.");
          setTimeout(() => {
            pinInputRef.current?.focus();
          }, 100);
        }
      }
    }
  };

  const handleBiometricsToggle = async (val: boolean) => {
    if (val) {
      const success = await authenticateWithBiometrics("Verify your biometrics configuration");
      if (success) {
        setBiometricsEnabledState(true);
      } else {
        setBiometricsEnabledState(false);
        Alert.alert("Authentication Failed", "Could not enroll biometrics.");
      }
    } else {
      setBiometricsEnabledState(false);
    }
  };

  // Auto-close Step 8 with countdown
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
  }, [visible, step]);

  // Step 2 toggle selection
  const toggleTravelerType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleNext = () => {
    if (step < 8) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  const handleFinish = async () => {
    // Save security configurations
    if (pinEnabled && pinStage === "done" && tempConfirmPin) {
      await setPin(tempConfirmPin);
      await savePinEnabled(true);
      await saveBiometricsEnabled(biometricsEnabled);
    } else {
      await clearPin();
    }

    // Save profile details to database
    saveProfile({
      ...(profile ?? {}),
      nickname: nickname || undefined,
      username: nickname || undefined,
      defaultCountry: selectedCountry,
      travelStyle: selectedTypes.join(","),
      notificationsEnabled,
      notifyDaysBeforeTrip,
      notifyHoursBeforeActivity,
    });

    // Seed demo travel and notification data if requested
    if (createDemoData) {
      try {
        await seedDemoTravelData();
        await seedTestNotifications();
      } catch (err) {
        console.error("Failed to seed demo travel or notification data:", err);
      }
    }

    // Reset state and close modal
    onClose();
    // Wait a brief moment before resetting step back to 1
    setTimeout(() => {
      setStep(1);
      setNickname("");
      setSelectedTypes([]);
      setSearchQuery("");
      setSelectedCountry("Philippines");
      setNotificationsEnabled(true);
      setNotifyDaysBeforeTrip(3);
      setNotifyHoursBeforeActivity(2);
      setPinEnabledState(false);
      setBiometricsEnabledState(false);
      setPinCode("");
      setTempConfirmPin("");
      setPinStage("enter");
      setPinError("");
      setCreateDemoData(true);
    }, 500);
  };

  // Filter countries for step 3 search
  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={[styles.safeArea, step === 1 && { backgroundColor: "#111827" }]}>
        {/* Progress Header */}
        <View style={[styles.header, 
          {marginTop: insets.top + 0 }
        ]}>
          {step > 1 && step <= 7 ? (
            <>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
              <View style={styles.progressContainer}>
                {[2, 3, 4, 5, 6, 7].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor:
                          step === s
                            ? colors.primary
                            : step > s
                            ? `${colors.primary}80`
                            : "#E5E7EB",
                      },
                    ]}
                  />
                ))}
              </View>
              <View style={{ width: 24 }} />
              {/* <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close onboarding"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity> */}
            </>
          ) : (
            <>
              <View style={{ flex: 1 }} />
              {step === 1 && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close onboarding"
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Form Body */}
        <View style={styles.container}>
          {step === 1 && (
            <View style={styles.welcomeContainer}>
              <Animated.Image
                source={require("../../assets/icon.png")}
                style={[
                  styles.welcomeImage,
                  {
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                  }
                ]}
                resizeMode="contain"
              />
              <Animated.View style={{
                opacity: textFadeAnim,
                transform: [{ translateY: textSlideAnim }],
                alignItems: "center"
              }}>
                <Text style={[styles.welcomeTitle, { color: "#FFFFFF" }]}>
                  travelled
                </Text>
                <Text style={[styles.welcomeSubtitle, { color: "#9CA3AF" }]}>
                  Your ultimate companion for planning and organizing trips, keeping track of checklists, and building detailed itineraries.
                </Text>
              </Animated.View>
            </View>
          )}

          {step === 2 && (
            <Animated.View style={[styles.stepContent, { opacity: textFadeAnim, transform: [{ translateY: textSlideAnim }] }]}>
              <Text style={[styles.title, { color: colors.primary }]}>
                Choose your nickname
              </Text>
              <Text style={styles.subtitle}>
                What should we call you? Pick a unique nickname to get started.
              </Text>

              <View style={[
                styles.inputContainer,
                nicknameError ? { borderColor: colors.error } : null
              ]}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={styles.input}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="nickname"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={[styles.charCount, nickname.length > 20 && { color: colors.error }]}>
                  {nickname.length}/20
                </Text>
              </View>
              {nicknameError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {nicknameError}
                </Text>
              ) : null}
            </Animated.View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Animated.View style={{ opacity: textFadeAnim, transform: [{ translateY: textSlideAnim }] }}>
                <Text style={[styles.title, { color: colors.primary }]}>
                  What's your travel style?
                </Text>
                <Text style={styles.subtitle}>
                  Select all that apply. We'll use this to suggest ideas.
                </Text>
              </Animated.View>

              <ScrollView
                contentContainerStyle={styles.gridContainer}
                showsVerticalScrollIndicator={false}
              >
                {TRAVELER_TYPES.map((type, index) => {
                  const isSelected = selectedTypes.includes(type.id);
                  const cardAnim = styleCardAnims[index];
                  
                  return (
                    <Animated.View
                      key={type.id}
                      style={{
                        width: "48%",
                        aspectRatio: 1.1,
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
                        onPress={() => toggleTravelerType(type.id)}
                        style={[
                          styles.gridItem,
                          { width: "100%", height: "100%", aspectRatio: undefined },
                          isSelected && {
                            borderColor: colors.primary,
                            backgroundColor: `${colors.primary}0D`,
                          },
                        ]}
                        accessibilityRole="button"
                        activeOpacity={0.7}
                      >
                        <Text style={styles.itemEmoji}>{type.emoji}</Text>
                        <Text
                          style={[
                            styles.itemLabel,
                            isSelected && {
                              color: colors.primary,
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          {type.label}
                        </Text>
                        {isSelected && (
                          <View
                            style={[
                              styles.checkmarkBadge,
                              { backgroundColor: colors.primary },
                            ]}
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
          )}

          {step === 4 && (
            <Animated.View style={[styles.stepContent, { opacity: textFadeAnim, transform: [{ translateY: textSlideAnim }] }]}>
              <Text style={[styles.title, { color: colors.primary }]}>
                Where are you from?
              </Text>
              <Text style={styles.subtitle}>
                Select your primary home country.
              </Text>

              {/* Country Selection UI */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search countries..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {filteredCountries.map((c) => {
                  const isSelected = selectedCountry === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setSelectedCountry(c)}
                      style={[
                        styles.listItem,
                        isSelected && { backgroundColor: `${colors.primary}0D` },
                      ]}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          isSelected && { color: colors.primary, fontWeight: "bold" },
                        ]}
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
          )}

          {step === 5 && (
            <Animated.View style={[styles.stepContent, { opacity: textFadeAnim, transform: [{ translateY: textSlideAnim }] }]}>
              <Text style={[styles.title, { color: colors.primary }]}>
                Turn on notifications
              </Text>
              <Text style={styles.subtitle}>
                Never miss an update. Customize when you want to get notified about your upcoming trips and activities.
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Enable notifications switch container */}
                <View style={styles.notificationToggleContainer}>
                  <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={styles.notificationToggleTitle}>Enable Push Notifications</Text>
                    <Text style={styles.notificationToggleSubtitle}>
                      Get reminders on your device for trip planning.
                    </Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
                    thumbColor={notificationsEnabled ? colors.primary : "#F3F4F6"}
                  />
                </View>

                {/* Sub-settings */}
                <View style={[styles.settingsContainer, !notificationsEnabled && { opacity: 0.5 }]} pointerEvents={notificationsEnabled ? "auto" : "none"}>
                  <Text style={styles.sectionHeader}>Notification Settings</Text>

                  {/* Trip start notification configuration */}
                  <View style={styles.settingRow}>
                    <View style={{ flex: 1, marginRight: 16 }}>
                      <Text style={styles.settingLabel}>Before trip starts</Text>
                      <Text style={styles.settingSubtext}>How many days in advance should we notify you?</Text>
                    </View>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        onPress={() => setNotifyDaysBeforeTrip(prev => Math.max(1, prev - 1))}
                        style={styles.stepperButton}
                        disabled={!notificationsEnabled || notifyDaysBeforeTrip <= 1}
                        accessibilityRole="button"
                        accessibilityLabel="Decrease days"
                      >
                        <Ionicons name="remove" size={18} color={!notificationsEnabled || notifyDaysBeforeTrip <= 1 ? "#9CA3AF" : colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>
                        {notifyDaysBeforeTrip} {notifyDaysBeforeTrip === 1 ? "day" : "days"}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setNotifyDaysBeforeTrip(prev => Math.min(30, prev + 1))}
                        style={styles.stepperButton}
                        disabled={!notificationsEnabled || notifyDaysBeforeTrip >= 30}
                        accessibilityRole="button"
                        accessibilityLabel="Increase days"
                      >
                        <Ionicons name="add" size={18} color={!notificationsEnabled || notifyDaysBeforeTrip >= 30 ? "#9CA3AF" : colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Activity start notification configuration */}
                  <View style={styles.settingRow}>
                    <View style={{ flex: 1, marginRight: 16 }}>
                      <Text style={styles.settingLabel}>Before activity starts</Text>
                      <Text style={styles.settingSubtext}>How many hours in advance should we notify you?</Text>
                    </View>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        onPress={() => setNotifyHoursBeforeActivity(prev => Math.max(1, prev - 1))}
                        style={styles.stepperButton}
                        disabled={!notificationsEnabled || notifyHoursBeforeActivity <= 1}
                        accessibilityRole="button"
                        accessibilityLabel="Decrease hours"
                      >
                        <Ionicons name="remove" size={18} color={!notificationsEnabled || notifyHoursBeforeActivity <= 1 ? "#9CA3AF" : colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>
                        {notifyHoursBeforeActivity} {notifyHoursBeforeActivity === 1 ? "hour" : "hours"}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setNotifyHoursBeforeActivity(prev => Math.min(24, prev + 1))}
                        style={styles.stepperButton}
                        disabled={!notificationsEnabled || notifyHoursBeforeActivity >= 24}
                        accessibilityRole="button"
                        accessibilityLabel="Increase hours"
                      >
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          )}

          {step === 6 && (
            <Animated.View style={[styles.stepContent, { opacity: textFadeAnim, transform: [{ translateY: textSlideAnim }] }]}>
              <Text style={[styles.title, { color: colors.primary }]}>
                Secure your travel plan
              </Text>
              <Text style={styles.subtitle}>
                Enable app locking to keep your travel itineraries and personal details private.
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* PIN Code Switch */}
                <View style={styles.notificationToggleContainer}>
                  <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={styles.notificationToggleTitle}>Enable PIN Lock</Text>
                    <Text style={styles.notificationToggleSubtitle}>
                      Require a 4-digit code to open the app.
                    </Text>
                  </View>
                  <Switch
                    value={pinEnabled}
                    onValueChange={(val) => {
                      setPinEnabledState(val);
                      if (!val) {
                        setPinCode("");
                        setPinStage("enter");
                        setTempConfirmPin("");
                        setPinError("");
                      }
                    }}
                    trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
                    thumbColor={pinEnabled ? colors.primary : "#F3F4F6"}
                  />
                </View>

                {/* Inline PIN Input (if enabled) */}
                {pinEnabled && (
                  <View style={[styles.settingsContainer, { marginBottom: 20 }]}>
                    <Text style={styles.sectionHeader}>
                      {pinStage === "enter"
                        ? "Create PIN code"
                        : pinStage === "confirm"
                        ? "Confirm PIN code"
                        : "PIN Code Saved"}
                    </Text>

                    <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>
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
                        style={{ alignItems: "center", marginVertical: 12 }}
                        accessibilityRole="button"
                        accessibilityLabel="Enter PIN Code"
                      >
                        <View style={{ flexDirection: "row", gap: 16 }}>
                          {[0, 1, 2, 3].map((idx) => {
                            const isFilled = pinCode.length > idx;
                            return (
                              <View
                                key={idx}
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 12,
                                  borderWidth: 2,
                                  borderColor: isFilled ? colors.primary : "#D1D5DB",
                                  backgroundColor: isFilled ? `${colors.primary}10` : "#FFFFFF",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {isFilled && (
                                  <View
                                    style={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: 6,
                                      backgroundColor: colors.primary,
                                    }}
                                  />
                                )}
                              </View>
                            );
                          })}
                        </View>
                        <TextInput
                          ref={pinInputRef}
                          value={pinCode}
                          onChangeText={handlePinTextChange}
                          keyboardType="number-pad"
                          maxLength={4}
                          style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
                          caretHidden
                        />
                      </TouchableOpacity>
                    )}

                    {pinStage === "done" && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8 }}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        <Text style={{ color: "#10B981", fontWeight: "600" }}>PIN setup complete</Text>
                      </View>
                    )}

                    {pinError ? (
                      <Text style={{ color: colors.error, fontSize: 13, textAlign: "center", marginTop: 8, fontWeight: "500" }}>
                        {pinError}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Finger Scanner Switch (only shown if PIN enabled and hardware supported) */}
                {pinEnabled && hasBiometricsSupport && (
                  <View style={styles.notificationToggleContainer}>
                    <View style={{ flex: 1, marginRight: 16 }}>
                      <Text style={styles.notificationToggleTitle}>Use Finger Scanner</Text>
                      <Text style={styles.notificationToggleSubtitle}>
                        Unlock using fingerprint authentication.
                      </Text>
                    </View>
                    <Switch
                      value={biometricsEnabled}
                      onValueChange={handleBiometricsToggle}
                      disabled={pinStage !== "done"}
                      trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
                      thumbColor={biometricsEnabled ? colors.primary : "#F3F4F6"}
                    />
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          )}

          {step === 7 && (
            <Animated.View style={[styles.stepContent, { opacity: textFadeAnim, transform: [{ translateY: textSlideAnim }] }]}>
              <Text style={[styles.title, { color: colors.primary }]}>
                Demo Travel Plan
              </Text>
              <Text style={styles.subtitle}>
                Would you like to import simulated travel data to explore Travelled's features?
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <TouchableOpacity
                  onPress={() => setCreateDemoData(!createDemoData)}
                  style={[
                    styles.checkboxContainer,
                    createDemoData && { borderColor: colors.primary, backgroundColor: `${colors.primary}08` }
                  ]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ checked: createDemoData }}
                >
                  <View style={[
                    styles.checkbox,
                    { borderColor: colors.primary },
                    createDemoData && { backgroundColor: colors.primary }
                  ]}>
                    {createDemoData && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Yes, create demo travel data</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          )}

          {step === 8 && (
            <Animated.View
              style={[
                styles.stepContent,
                styles.successContainer,
                {
                  opacity: textFadeAnim,
                  transform: [{ translateY: textSlideAnim }],
                }
              ]}
            >
              <View style={[styles.successIconContainer, { backgroundColor: `${colors.primary}1A` }]}>
                <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
              </View>
              <Text style={[styles.successTitle, { color: colors.primary }]}>
                You're all set!
              </Text>
              <Text style={styles.successSubtitle}>
                Welcome to Travelled! Prepare to start planning your perfect trips.
              </Text>

              <Text style={styles.countdownText}>
                Entering the dashboard in <Text style={{ color: colors.primary, fontWeight: "bold" }}>{countdown}</Text> seconds...
              </Text>
            </Animated.View>
          )}
        </View>

         {/* Sticky Action Footer - safe inset padding */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {step <= 7 ? (
            <TouchableOpacity
              onPress={handleNext}
              disabled={
                (step === 2 && (!nickname.trim() || !!nicknameError)) ||
                (step === 6 && pinEnabled && pinStage !== "done")
              }
              style={[
                styles.primaryButton,
                { backgroundColor: step === 1 ? "#FFFFFF" : colors.primary },
                ((step === 2 && (!nickname.trim() || !!nicknameError)) || (step === 6 && pinEnabled && pinStage !== "done")) && { opacity: 0.5 },
              ]}
              accessibilityRole="button"
            >
              <Text style={[
                styles.primaryButtonText,
                { color: step === 1 ? "#111827" : colors.onPrimary }
              ]}>
                {step === 1 ? "Get Started" : step === 7 ? "Start the Adventure!" : "Next"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 56,
  },
  backButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  stepContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  atSymbol: {
    fontSize: 18,
    color: "#9CA3AF",
    marginRight: 4,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    height: "100%",
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 24,
  },
  gridItem: {
    width: "48%",
    aspectRatio: 1.1,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#EAECF0",
    borderRadius: 20,
    padding: 16,
    justifyContent: "center",
    position: "relative",
  },
  itemEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475467",
  },
  checkmarkBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  listItemText: {
    fontSize: 15,
    color: "#374151",
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  countdownText: {
    fontSize: 10,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#EAECF0",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  welcomeImage: {
    width: 140,
    height: 140,
    borderRadius: 32,
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#EAECF0",
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: "500",
  },
  charCount: {
    fontSize: 12,
    color: "#98A2B3",
    marginLeft: 8,
  },
  notificationToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#EAECF0",
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
  },
  notificationToggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  notificationToggleSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  settingsContainer: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#EAECF0",
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  settingSubtext: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    padding: 4,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    paddingHorizontal: 12,
    minWidth: 70,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
});

export default OnboardingModal;
