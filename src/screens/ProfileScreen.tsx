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
import { TextInput, useTheme, Button } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserProfile, useSaveProfile } from "../hooks/useUserProfile";
import { UserProfileDto, AccountType, BackupFrequency, BackupLocation } from "../types/UserProfileDto";
import {
  exportBackupLocally,
  uploadBackupToGoogleDrive,
  restoreBackupFromFile,
  checkAndRunScheduledBackup,
} from "../services/local/backupService";
import OnboardingModal, { TRAVELER_TYPES } from "../components/OnboardingModal";
import { database } from "../db";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import {
  isPinEnabled,
  isBiometricsEnabled,
  setPinEnabled as savePinEnabled,
  setBiometricsEnabled as saveBiometricsEnabled,
  getPin,
  setPin,
  clearPin,
  isBiometricsSupported,
  authenticateWithBiometrics,
} from "../services/local/securityService";
import { isAnalyticsOptedOut, setAnalyticsOptOut } from "../services/analytics/posthogService";
import { saveNotificationLocally, seedTestNotifications } from "../services/local/notificationService";

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

const PickerModal = ({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
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
            maxHeight: screenHeight * 0.7,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          {/* Drag Handle Area */}
          <View
            {...dragPanResponder.panHandlers}
            className="w-full items-center py-3 bg-white rounded-t-[30px]"
          >
            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </View>

          <View className="flex-row justify-between items-center px-5 pb-3 border-b border-[#F3F4F6]">
            <Text className="text-xl font-bold text-[#111827]">{title}</Text>
            <TouchableOpacity onPress={handleDismiss} accessibilityRole="button" accessibilityLabel="Close picker">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                className={`flex-row justify-between items-center px-5 py-4 ${selected === opt ? 'bg-[#EFF6FF]' : ''}`}
                onPress={() => { onSelect(opt); handleDismiss(); }}
                accessibilityRole="button"
              >
                <Text className={`text-base ${selected === opt ? 'text-primary font-semibold' : 'text-[#374151]'}`}>
                  {opt}
                </Text>
                {selected === opt && <Ionicons name="checkmark" size={18} color="#0EA5E9" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const CountryPickerModal = ({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const translateY = React.useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
    } else {
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

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            height: screenHeight * 0.75,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
              {/* Drag Handle Area */}
              <View
                {...dragPanResponder.panHandlers}
                className="w-full items-center py-4 bg-white rounded-t-[30px]"
              >
                <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </View>

              <View className="flex-row justify-between items-center px-5 pb-4 border-b border-[#F3F4F6] mb-4">
                <Text className="text-xl font-semibold text-[#111827]">{title}</Text>
              
              </View>
              
              <View className="px-5 mb-4">
                <View className="flex-row items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-4 h-12">
                  <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                  <RNTextInput
                    style={{ flex: 1, fontSize: 14, color: "#111827", padding: 0 }}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search countries..."
                    placeholderTextColor="#9CA3AF"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")} accessibilityRole="button" accessibilityLabel="Clear search">
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <ScrollView className="flex-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
                    const isSelected = selected === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        className={`flex-row justify-between items-center px-5 py-3.5 ${isSelected ? 'bg-[#EFF6FF]' : ''}`}
                        onPress={() => {
                          onSelect(opt);
                          handleDismiss();
                        }}
                        accessibilityRole="button"
                      >
                        <Text className={`text-base ${isSelected ? 'text-primary font-semibold' : 'text-[#374151]'}`}>
                          {opt}
                        </Text>
                        {isSelected && <Ionicons name="checkmark" size={18} color="#0EA5E9" />}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View className="items-center justify-center py-8">
                    <Text className="text-gray-400 text-sm">No countries match your search</Text>
                  </View>
                )}
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

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [aboutModalTitle, setAboutModalTitle] = useState<string>("");
  const [aboutModalContent, setAboutModalContent] = useState<string>("");

  // Backup settings state
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);
  const [googleDriveEmailInput, setGoogleDriveEmailInput] = useState("");

  // Security settings state
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [tempConfirmPin, setTempConfirmPin] = useState("");
  const [pinStage, setPinStage] = useState<"enter" | "confirm">("enter");
  const [pinError, setPinError] = useState("");
  const [correctPin, setCorrectPin] = useState<string | null>(null);

  // Privacy / Analytics opt-out state
  const [isAnalyticsOptedOutState, setIsAnalyticsOptedOutState] = useState<boolean>(isAnalyticsOptedOut());

  useEffect(() => {
    setIsAnalyticsOptedOutState(isAnalyticsOptedOut());
  }, [visible]);

  const handleToggleAnalytics = async (value: boolean) => {
    const newOptOut = !value;
    setIsAnalyticsOptedOutState(newOptOut);
    await setAnalyticsOptOut(newOptOut);
  };

  useEffect(() => {
    const loadSecurity = async () => {
      const pinActive = await isPinEnabled();
      setPinEnabled(pinActive);
      const bioActive = await isBiometricsEnabled();
      setBiometricsEnabled(bioActive);
      const { hasHardware, isEnrolled } = await isBiometricsSupported();
      setBiometricsSupported(hasHardware && isEnrolled);
      const storedPin = await getPin();
      setCorrectPin(storedPin);
    };
    loadSecurity();
  }, []);

  const handlePinToggle = async (value: boolean) => {
    if (value) {
      setPinStage("enter");
      setPinCode("");
      setTempConfirmPin("");
      setPinError("");
      setShowSetupModal(true);
    } else {
      setPinCode("");
      setPinError("");
      const stored = await getPin();
      setCorrectPin(stored);
      setShowVerifyModal(true);
    }
  };

  const handleBiometricsToggle = async (value: boolean) => {
    if (value) {
      const success = await authenticateWithBiometrics("Confirm fingerprint to enable biometric lock");
      if (success) {
        await saveBiometricsEnabled(true);
        setBiometricsEnabled(true);
      } else {
        await saveBiometricsEnabled(false);
        setBiometricsEnabled(false);
        Alert.alert("Authentication Failed", "Biometric verification failed.");
      }
    } else {
      await saveBiometricsEnabled(false);
      setBiometricsEnabled(false);
    }
  };

  const handleSetupPinPress = async (num: string) => {
    if (pinCode.length >= 4) return;
    const newVal = pinCode + num;
    setPinCode(newVal);
    setPinError("");

    if (newVal.length === 4) {
      if (pinStage === "enter") {
        setTempConfirmPin(newVal);
        setPinCode("");
        setPinStage("confirm");
      } else if (pinStage === "confirm") {
        if (newVal === tempConfirmPin) {
          await setPin(newVal);
          await savePinEnabled(true);
          setCorrectPin(newVal);
          setPinEnabled(true);
          setShowSetupModal(false);
          setPinCode("");
        } else {
          Vibration.vibrate(200);
          setPinCode("");
          setPinStage("enter");
          setPinError("PINs do not match. Try again.");
        }
      }
    }
  };

  const handleVerifyPinPress = async (num: string) => {
    if (pinCode.length >= 4) return;
    const newVal = pinCode + num;
    setPinCode(newVal);
    setPinError("");

    if (newVal.length === 4) {
      if (newVal === correctPin) {
        await clearPin();
        setPinEnabled(false);
        setBiometricsEnabled(false);
        setShowVerifyModal(false);
        setPinCode("");
      } else {
        Vibration.vibrate(200);
        setPinCode("");
        setPinError("Incorrect PIN code");
      }
    }
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
      checkAndRunScheduledBackup(profile);
    }
  }, [profile]);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const location = form.backupLocation || "local";
      let result: { success: boolean; message?: string };
      if (location === "google_drive") {
        result = await uploadBackupToGoogleDrive(form.googleDriveAccount || undefined);
      } else {
        result = await exportBackupLocally();
      }

      if (result.success) {
        const now = Date.now();
        const updatedForm = { ...form, lastBackedUpAt: now };
        setForm(updatedForm);
        saveProfile(updatedForm);
        Alert.alert("Backup Complete", result.message || "Database backup completed successfully!");
      } else {
        Alert.alert("Backup Failed", result.message || "Failed to create database backup.");
      }
    } catch (err: any) {
      Alert.alert("Backup Error", err?.message || "An error occurred during database backup.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreDatabase = async () => {
    Alert.alert(
      "Restore Database",
      "Restoring a backup file will replace your current database records. Are you sure you want to proceed?",
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
                Alert.alert("Restore Successful", res.message);
              } else if (res.message !== "Backup selection cancelled.") {
                Alert.alert("Restore Failed", res.message);
              }
            } catch (err: any) {
              Alert.alert("Restore Error", err?.message || "Failed to restore database.");
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = () => {
    saveProfile(form, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "Delete All Data",
      "Are you sure you want to delete all database entries, user profiles, and reset the application?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            try {
              // Reset WatermelonDB
              await database.write(async () => {
                await database.unsafeResetDatabase();
              });
              // Clear AsyncStorage
              await AsyncStorage.clear();
              // Clear React Query cache
              queryClient.clear();
              
              Alert.alert("Success", "All application data has been successfully deleted.");
              
              if (onClose) {
                onClose();
              }
            } catch (error) {
              console.error("Failed to delete all data:", error);
              Alert.alert("Error", "Failed to delete all application data.");
            }
          }
        }
      ]
    );
  };

  const handleSeedNotifications = async () => {
    try {
      await seedTestNotifications();
      Alert.alert("Success", "Sample notifications seeded successfully! Check the notifications panel on Home.");
    } catch (error) {
      console.error("Failed to seed notifications:", error);
      Alert.alert("Error", "Failed to seed sample notifications.");
    }
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
    if (!result.canceled) {
      setForm(f => ({ ...f, avatarUrl: result.assets[0].uri }));
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
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Header */}
              <View className="flex-row items-center justify-between px-5 py-3.5 ">
                <TouchableOpacity onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close profile">
                  <Ionicons name="close" size={28} color="#374151" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-[#111827] flex-1 text-center">Profile</Text>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Save profile"
                  className="bg-primary px-4 py-1.5 rounded-full min-w-[60px] items-center"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text className="text-white text-xs font-semibold">{saved ? "Saved" : "Save"}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>

        {/* Avatar & Badge */}
        <View className="items-center py-5 gap-2.5">
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
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <AccountTypeBadge type={form.accountType ?? AccountType.Free} />
        </View>

        {/* Account Type Card */}
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

        {/* Profile Info */}
        <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6] will-change-variable">
            <Text className="text-xl font-semibold text-secondary/80">Profile Info</Text>

          <View className="mb-4">
            <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">Nickname</Text>
            <View className="relative justify-center">
              <TextInput
                mode="outlined"
                placeholder="Nickname"
                value={form.nickname}
                onChangeText={(v) => setForm(f => ({ ...f, nickname: v }))}
                outlineColor="#E0E0E0"
                activeOutlineColor={colors.primary}
                theme={{
                  colors: {
                    onSurfaceVariant: '#9CA3AF', 
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
                left={<TextInput.Icon icon="account" color="#6B7280" />}
              />
            </View>
          </View>


          <View className="mb-2">
            <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">Country</Text>
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
                      onSurfaceVariant: '#9CA3AF', 
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

          <View className="gap-1.5 mt-2">
            <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">Travel Style</Text>

            <View className="flex-row flex-wrap gap-3 pt-1">
              {TRAVELER_TYPES.map((type) => {
                const selectedStyles = (form.travelStyle || "").split(",").filter(Boolean);
                const isSelected = selectedStyles.includes(type.id);
                return (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => {
                      const newStyles = isSelected
                        ? selectedStyles.filter(id => id !== type.id)
                        : [...selectedStyles, type.id];
                      setForm(f => ({ ...f, travelStyle: newStyles.join(",") }));
                    }}
                    className={`flex-row items-center px-3.5 py-2 rounded-full border ${isSelected ? 'border-accent bg-[#EFF6FF]' : 'border-[#E5E7EB] bg-white opacity-60'}`}
                    accessibilityRole="button"
                    activeOpacity={0.7}
                  >
                    <Text className="text-md mr-1">{type.emoji}</Text>
                    <Text className={`text-xs font-semibold ${isSelected ? 'text-accent' : 'text-[#475467]'}`}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6] will-change-variable">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xl font-semibold text-secondary/80">Notification Settings</Text>

            <Switch
              value={form.notificationsEnabled}
              onValueChange={(v) => setForm(f => ({ ...f, notificationsEnabled: v }))}
              trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
              thumbColor={form.notificationsEnabled ? colors.primary : "#F3F4F6"}
            />
          </View>

          {form.notificationsEnabled && (
            <View className="gap-4 mt-2">
              {/* Trip starts setting */}
              <View className="flex-row justify-between items-center">
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-semibold text-tertiary">Notify before trip starts</Text>
                  <Text className="text-sm text-tertiary/75">Days in advance to notify you</Text>
                </View>
                <View className="flex-row items-center border border-[#E5E7EB] rounded-full p-1 bg-white">
                  <TouchableOpacity
                    onPress={() => setForm(f => ({ ...f, notifyDaysBeforeTrip: Math.max(1, (f.notifyDaysBeforeTrip ?? 3) - 1) }))}
                    className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
                    accessibilityRole="button"
                    accessibilityLabel="Decrease days"
                  >
                    <Ionicons name="remove" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <Text className="text-sm font-semibold text-[#111827] px-3 min-w-[60px] text-center">
                    {form.notifyDaysBeforeTrip ?? 3} {(form.notifyDaysBeforeTrip ?? 3) === 1 ? "day" : "days"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setForm(f => ({ ...f, notifyDaysBeforeTrip: Math.min(30, (f.notifyDaysBeforeTrip ?? 3) + 1) }))}
                    className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
                    accessibilityRole="button"
                    accessibilityLabel="Increase days"
                  >
                    <Ionicons name="add" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="h-[1px] bg-[#E5E7EB]" />

              {/* Activity starts setting */}
              <View className="flex-row justify-between items-center">
                <View className="flex-1 mr-4">
                  <Text className="text-base font-semibold text-tertiary">Notify before activity starts</Text>
                  <Text className="text-sm text-tertiary/75">Hours in advance to notify you</Text>
                </View>
                <View className="flex-row items-center border border-[#E5E7EB] rounded-full p-1 bg-white">
                  <TouchableOpacity
                    onPress={() => setForm(f => ({ ...f, notifyHoursBeforeActivity: Math.max(1, (f.notifyHoursBeforeActivity ?? 2) - 1) }))}
                    className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
                    accessibilityRole="button"
                    accessibilityLabel="Decrease hours"
                  >
                    <Ionicons name="remove" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <Text className="text-sm font-semibold text-[#111827] px-3 min-w-[60px] text-center">
                    {form.notifyHoursBeforeActivity ?? 2} {(form.notifyHoursBeforeActivity ?? 2) === 1 ? "hour" : "hours"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setForm(f => ({ ...f, notifyHoursBeforeActivity: Math.min(24, (f.notifyHoursBeforeActivity ?? 2) + 1) }))}
                    className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
                    accessibilityRole="button"
                    accessibilityLabel="Increase hours"
                  >
                    <Ionicons name="add" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Security Settings */}
        <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6] will-change-variable">
          <Text className="text-xl font-semibold text-secondary/80">Security Settings</Text>

          {/* PIN Lock Toggle */}
          <View className="flex-row justify-between items-center py-2">
            <View className="flex-1 mr-4">
              <Text className="text-base font-semibold text-tertiary">PIN Code Lock</Text>
              <Text className="text-sm text-tertiary/75">Require passcode to unlock app</Text>
            </View>
            <Switch
              value={pinEnabled}
              onValueChange={handlePinToggle}
              trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
              thumbColor={pinEnabled ? colors.primary : "#F3F4F6"}
            />
          </View>

          {/* Change PIN Button (if enabled) */}
          {pinEnabled && (
            <>
              <View className="h-[1px] bg-[#E5E7EB]" />
              <TouchableOpacity
                onPress={() => {
                  setPinStage("enter");
                  setPinCode("");
                  setTempConfirmPin("");
                  setPinError("");
                  setShowSetupModal(true);
                }}
                className="flex-row justify-between items-center py-2"
                accessibilityRole="button"
                accessibilityLabel="Change PIN"
              >
                <Text className="text-sm font-semibold text-[#374151]">Change PIN Code</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </>
          )}

          {/* Biometrics Toggle (if supported and PIN enabled) */}
          {pinEnabled && biometricsSupported && (
            <>
              <View className="h-[1px] bg-[#E5E7EB]" />
              <View className="flex-row justify-between items-center py-2">
                <View className="flex-1 mr-4">
                  <Text className="text-base font-semibold text-tertiary">Biometric Lock</Text>
                  <Text className="text-sm text-[#6B7280]">Unlock using fingerprint or Face ID</Text>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={handleBiometricsToggle}
                  trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
                  thumbColor={biometricsEnabled ? colors.primary : "#F3F4F6"}
                />
              </View>
            </>
          )}
        </View>

        {/* Database Backup & Restore */}
        <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6] will-change-variable">
          <View className="flex-row justify-between items-center mb-1">
            <View className="flex-row items-center gap-2">
              <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
              <Text className="text-xl font-semibold text-secondary/80">Database Backup</Text>
              <View className="flex-row items-center gap-1 px-2 py-0.5 bg-[#DCFCE7] rounded-full border border-[#86EFAC]">
                <Ionicons name="lock-closed" size={10} color="#15803D" />
                <Text className="text-[10px] font-bold text-[#15803D]">AES-256 Encrypted</Text>
              </View>
            </View>
            <Switch
              value={form.backupAutoEnabled ?? true}
              onValueChange={(v) => setForm(f => ({ ...f, backupAutoEnabled: v }))}
              trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
              thumbColor={form.backupAutoEnabled ? colors.primary : "#F3F4F6"}
            />
          </View>

          {/* Backup Frequency */}
          <View className="mb-2">
            <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">Backup Frequency</Text>
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
                    form.backupFrequency === "weekly" ? "Weekly" :
                    form.backupFrequency === "quarterly" ? "Quarterly" : "Monthly (Default)"
                  }
                  editable={false}
                  outlineColor="#E0E0E0"
                  activeOutlineColor={colors.primary}
                  outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                  style={{ height: 52 }}
                  left={<TextInput.Icon icon="calendar-sync" color="#6B7280" />}
                  right={<TextInput.Icon icon="chevron-down" color="#9CA3AF" />}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Backup Location */}
          <View className="mb-2">
            <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">Backup Storage Location</Text>
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
                  value={form.backupLocation === "google_drive" ? "Google Drive" : "Local Storage"}
                  editable={false}
                  outlineColor="#E0E0E0"
                  activeOutlineColor={colors.primary}
                  outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                  style={{ height: 52 }}
                  left={<TextInput.Icon icon={form.backupLocation === "google_drive" ? "google-drive" : "folder-outline"} color="#6B7280" />}
                  right={<TextInput.Icon icon="chevron-down" color="#9CA3AF" />}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Google Drive Account Status */}
          {form.backupLocation === "google_drive" && (
            <View className="p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] flex-row justify-between items-center">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-[#166534] uppercase tracking-wider">Google Drive Account</Text>
                <Text className="text-sm font-semibold text-[#15803D] mt-0.5" numberOfLines={1}>
                  {form.googleDriveAccount || "user@gmail.com"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setGoogleDriveEmailInput(form.googleDriveAccount || "user@gmail.com");
                  setShowGoogleDriveModal(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Manage Google Drive Account"
                className="bg-[#166534] px-3 py-1.5 rounded-lg"
              >
                <Text className="text-white text-xs font-semibold">Manage</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Last Backed Up Metadata */}
          <View className="flex-row justify-between items-center py-1.5">
            <Text className="text-sm font-medium text-tertiary">Last Backed Up</Text>
            <Text className="text-sm font-semibold text-[#374151]">
              {form.lastBackedUpAt
                ? new Date(form.lastBackedUpAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
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

        {/* Privacy & Analytics Section */}
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

        {/* About Section */}
        <View className="bg-white rounded-2xl p-4 gap-3 shadow-sm elevation-2 border border-[#F3F4F6] will-change-variable">
          <Text className="text-xl font-semibold text-secondary">About</Text>
          
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-base font-semibold text-tertiary">App Version</Text>
            <Text className="text-sm text-gray-500 font-medium">1.0.0 (Build 1)</Text>
          </View>
          
          <View className="h-[1px] bg-[#E5E7EB]" />
          <TouchableOpacity
            onPress={() => {
              setAboutModalTitle("Privacy Policy");
              setAboutModalContent(PRIVACY_POLICY_TEXT);
              setShowAboutModal(true);
            }}
            className="flex-row justify-between items-center py-2"
            accessibilityRole="button"
            accessibilityLabel="Privacy Policy"
          >
            <Text className="text-base font-semibold text-tertiary">Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <View className="h-[1px] bg-[#E5E7EB]" />
          <TouchableOpacity
            onPress={() => {
              setAboutModalTitle("Terms and Conditions");
              setAboutModalContent(TERMS_AND_CONDITIONS_TEXT);
              setShowAboutModal(true);
            }}
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

        {/* Temporary Onboarding Button */}
        <View className="bg-white rounded-2xl p-4 gap-3 shadow-sm elevation-2 border border-[#F3F4F6]">
          <Text className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Developer Actions</Text>
          <TouchableOpacity
            onPress={() => setShowOnboarding(true)}
            className="bg-primary py-3.5 rounded-xl items-center"
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text className="text-white font-bold text-base">Launch Onboarding Flow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSeedNotifications}
            className="bg-accent py-3.5 rounded-xl items-center mt-2"
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text className="text-white font-bold text-base">Seed Sample Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteAllData}
            className="bg-[#D92D20] py-3.5 rounded-xl items-center mt-2"
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text className="text-white font-bold text-base">Delete All Data</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <PickerModal
        visible={showCurrencyPicker}
        title="Select Currency"
        options={CURRENCIES.map(c => c.code)}
        selected={form.defaultCurrency ?? "PHP"}
        onSelect={(v) => setForm(f => ({ ...f, defaultCurrency: v }))}
        onClose={() => setShowCurrencyPicker(false)}
      />

      <CountryPickerModal
        visible={showCountryPicker}
        title="Select Country"
        options={COUNTRIES}
        selected={form.defaultCountry ?? "Philippines"}
        onSelect={(v) => setForm(f => ({ ...f, defaultCountry: v }))}
        onClose={() => setShowCountryPicker(false)}
      />

      {showOnboarding && (
        <OnboardingModal
          visible={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* PIN Setup Modal */}
      <Modal visible={showSetupModal} transparent animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, width: "100%", maxWidth: 360, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>
                {pinStage === "enter" ? "Create PIN Code" : "Confirm PIN Code"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowSetupModal(false);
                  setPinCode("");
                  setTempConfirmPin("");
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancel setup"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 24 }}>
              {pinStage === "enter"
                ? "Enter a 4-digit security PIN"
                : "Re-enter your 4-digit PIN to confirm"}
            </Text>

            {/* PIN Indicators */}
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pinCode.length > index;
                return (
                  <View
                    key={index}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: colors.primary,
                      backgroundColor: isFilled ? colors.primary : "transparent",
                    }}
                  />
                );
              })}
            </View>

            {pinError ? (
              <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "600", marginBottom: 16, textAlign: "center" }}>{pinError}</Text>
            ) : null}

            {/* Keypad */}
            <View style={{ width: "100%", gap: 12 }}>
              {[
                ["1", "2", "3"],
                ["4", "5", "6"],
                ["7", "8", "9"],
              ].map((row, idx) => (
                <View key={idx} style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
                  {row.map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => handleSetupPinPress(num)}
                      style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
                      accessibilityRole="button"
                      accessibilityLabel={`Digit ${num}`}
                    >
                      <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1F2937" }}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
                <View style={{ width: 64, height: 64 }} />
                <TouchableOpacity
                  onPress={() => handleSetupPinPress("0")}
                  style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
                  accessibilityRole="button"
                  accessibilityLabel="Digit 0"
                >
                  <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1F2937" }}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPinCode(p => p.slice(0, -1))}
                  style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
                  accessibilityRole="button"
                  accessibilityLabel="Backspace"
                >
                  <Ionicons name="backspace-outline" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* PIN Verification Modal */}
      <Modal visible={showVerifyModal} transparent animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, width: "100%", maxWidth: 360, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>Verify PIN Code</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowVerifyModal(false);
                  setPinCode("");
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancel verification"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 24 }}>
              Enter your current 4-digit PIN to disable security lock
            </Text>

            {/* PIN Indicators */}
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pinCode.length > index;
                return (
                  <View
                    key={index}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: colors.primary,
                      backgroundColor: isFilled ? colors.primary : "transparent",
                    }}
                  />
                );
              })}
            </View>

            {pinError ? (
              <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "600", marginBottom: 16, textAlign: "center" }}>{pinError}</Text>
            ) : null}

            {/* Keypad */}
            <View style={{ width: "100%", gap: 12 }}>
              {[
                ["1", "2", "3"],
                ["4", "5", "6"],
                ["7", "8", "9"],
              ].map((row, idx) => (
                <View key={idx} style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
                  {row.map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => handleVerifyPinPress(num)}
                      style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
                      accessibilityRole="button"
                      accessibilityLabel={`Digit ${num}`}
                    >
                      <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1F2937" }}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
                <View style={{ width: 64, height: 64 }} />
                <TouchableOpacity
                  onPress={() => handleVerifyPinPress("0")}
                  style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
                  accessibilityRole="button"
                  accessibilityLabel="Digit 0"
                >
                  <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1F2937" }}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPinCode(p => p.slice(0, -1))}
                  style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
                  accessibilityRole="button"
                  accessibilityLabel="Backspace"
                >
                  <Ionicons name="backspace-outline" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* About Section Info Modal */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View className="bg-white rounded-t-[32px] w-full max-h-[85%] border-t border-gray-100 shadow-xl overflow-hidden">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-5 border-b border-gray-100">
              <Text className="text-xl font-bold text-[#111827]">{aboutModalTitle}</Text>
              <TouchableOpacity
                onPress={() => setShowAboutModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
                className="p-1 rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              className="p-6" 
              contentContainerStyle={{ paddingBottom: 60 }}
              showsVerticalScrollIndicator={true}
            >
              <Text className="text-base leading-6 text-tertiary font-normal whitespace-pre-wrap">
                {aboutModalContent}
              </Text>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      <PickerModal
        visible={showFrequencyPicker}
        title="Select Backup Frequency"
        options={["Weekly", "Monthly", "Quarterly"]}
        selected={
          form.backupFrequency === "weekly" ? "Weekly" :
          form.backupFrequency === "quarterly" ? "Quarterly" : "Monthly"
        }
        onSelect={(val) => {
          const freq: BackupFrequency = val === "Weekly" ? "weekly" : val === "Quarterly" ? "quarterly" : "monthly";
          setForm(f => ({ ...f, backupFrequency: freq }));
        }}
        onClose={() => setShowFrequencyPicker(false)}
      />

      <PickerModal
        visible={showLocationPicker}
        title="Select Storage Location"
        options={["Local Storage", "Google Drive"]}
        selected={form.backupLocation === "google_drive" ? "Google Drive" : "Local Storage"}
        onSelect={(val) => {
          const loc: BackupLocation = val === "Google Drive" ? "google_drive" : "local";
          setForm(f => ({ ...f, backupLocation: loc }));
        }}
        onClose={() => setShowLocationPicker(false)}
      />

      {/* Google Drive Account Modal */}
      <Modal visible={showGoogleDriveModal} transparent animationType="fade" onRequestClose={() => setShowGoogleDriveModal(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md gap-4 shadow-xl">
            <View className="flex-row items-center gap-2 border-b border-[#F3F4F6] pb-3">
              <Ionicons name="logo-google" size={24} color="#0EA5E9" />
              <Text className="text-lg font-bold text-[#111827]">Google Drive Backup</Text>
            </View>

            <Text className="text-sm text-[#4B5563]">
              Enter your Google email address to link Google Drive for automatic database backups.
            </Text>

            <RNTextInput
              className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-base text-[#111827] bg-[#F9FAFB]"
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
              >
                <Text className="text-sm font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const email = googleDriveEmailInput.trim() || "user@gmail.com";
                  setForm(f => ({ ...f, googleDriveAccount: email }));
                  setShowGoogleDriveModal(false);
                  Alert.alert("Google Drive Connected", `Account set to: ${email}`);
                }}
                accessibilityRole="button"
                accessibilityLabel="Save Google Drive account"
                style={{ backgroundColor: colors.primary }}
                className="px-5 py-2 rounded-xl"
              >
                <Text className="text-sm font-semibold text-white">Save Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

const PRIVACY_POLICY_TEXT = `Privacy Policy

Last Updated: July 2026

Your privacy is important to us. This Privacy Policy describes how we collect, use, process, and disclose your information when you use Travee.

1. Information We Collect
We collect information you provide directly to us, such as your nickname, travel preferences, and travel plans. We store all database information locally on your device.

2. How We Use Information
We use your information to personalize your onboarding flow, manage your travel itinerary, forecast weather, and facilitate offline access to your travel plans.

3. Data Storage and Security
All your personal data, trips, and settings are stored locally on your device. We do not transmit your database to external servers unless explicitly backed up or shared by you.

4. Contact Us
If you have any questions or feedback about this Privacy Policy, please contact us at support@travee.example.com.`;

const TERMS_AND_CONDITIONS_TEXT = `Terms and Conditions

Last Updated: July 2026

Welcome to Travee! By accessing or using our mobile application, you agree to comply with and be bound by these Terms and Conditions.

1. Account Registration
To use certain features of the application, you may create a profile. You are responsible for maintaining the confidentiality of your credentials and data.

2. Use of Services
You agree to use Travee for personal, non-commercial travel planning purposes only. You must not use the application for any illegal or unauthorized activities.

3. Intellectual Property
All content, features, designs, and functionality of Travee are the exclusive property of the application developers and protected by copyright, trademark, and other laws.

4. Limitation of Liability
Travee is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages resulting from your use of the application.

5. Changes to Terms
We reserve the right to modify these Terms and Conditions at any time. Your continued use of the application following updates constitutes your acceptance of the new terms.`;
