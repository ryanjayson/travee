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
import { TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserProfile, useSaveProfile } from "../hooks/useUserProfile";
import { UserProfileDto, AccountType } from "../types/UserProfileDto";
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

const { height: screenHeight } = Dimensions.get("window");

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
  const translateY = React.useRef(new Animated.Value(screenHeight)).current;

  React.useEffect(() => {
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
        className="flex-1 justify-end"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: backdropOpacity,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          style={{ flex: 1, width: "100%", justifyContent: "flex-end" }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{ width: "100%" }}
          >
            <Animated.View
              className="bg-white rounded-t-[30px] max-h-[70%] pb-7 shadow-lg"
              style={{ transform: [{ translateY }] }}
            >
              {/* Drag Handle Area */}
              <View
                {...dragPanResponder.panHandlers}
                className="w-full items-center py-4 bg-white rounded-t-[30px]"
              >
                <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </View>

              <View className="flex-row justify-between items-center px-5 pb-4 border-b border-[#F3F4F6]">
                <Text className="text-xl font-bold text-[#111827]">{title}</Text>
                <TouchableOpacity onPress={handleDismiss} accessibilityRole="button" accessibilityLabel="Close picker">
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              
              <ScrollView>
                {options.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    className={`flex-row justify-between items-center px-5 py-3.5 ${selected === opt ? 'bg-[#EFF6FF]' : ''}`}
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
          </TouchableOpacity>
        </TouchableOpacity>
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
        className="flex-1 bg-black/50 justify-end"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: backdropOpacity,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          style={{ flex: 1, width: "100%", justifyContent: "flex-end" }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{ width: "100%", height: "75%" }}
          >
            <Animated.View
              className="bg-white rounded-t-[30px] h-full pb-7 shadow-lg"
              style={{ transform: [{ translateY }] }}
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

export function ProfileScreen({ onClose }: { onClose?: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
  });

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
      });
    }
  }, [profile]);

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

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F3F4F6]" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F3F4F6]" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3.5">
        {onClose && (
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close profile">
            <Ionicons name="close" size={28} color="#374151" />
          </TouchableOpacity>
        )}
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
              <Text className={`text-sm font-bold ${form.accountType === AccountType.Free ? 'text-primary' : 'text-[#9CA3AF]'}`}>Free</Text>
              <Text className="text-[11px] text-[#9CA3AF]">Basic features</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setForm(f => ({ ...f, accountType: AccountType.Premium }))}
              className={`flex-1 items-center p-3.5 rounded-xl border-2 bg-[#F9FAFB] gap-1 ${form.accountType === AccountType.Premium ? 'border-[#F59E0B] bg-[#FFFBEB]' : 'border-[#E5E7EB]'}`}
              accessibilityRole="button"
            >
              <Ionicons name="star" size={20} color={form.accountType === AccountType.Premium ? "#F59E0B" : "#9CA3AF"} />
              <Text className={`text-sm font-bold ${form.accountType === AccountType.Premium ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>Premium</Text>
              <Text className="text-[11px] text-[#9CA3AF]">All features</Text>
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

          <View className="gap-1.5 mt-2">
            <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">Travel Style</Text>

            <View className="flex-row flex-wrap gap-2 pt-1">
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
                    className={`flex-row items-center px-3.5 py-1.5 rounded-full border ${isSelected ? 'border-primary bg-[#EFF6FF]' : 'border-[#E5E7EB] bg-white'}`}
                    accessibilityRole="button"
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm mr-1">{type.emoji}</Text>
                    <Text className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-[#475467]'}`}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6] will-change-variable">
            <Text className="text-xl font-semibold text-secondary/80">Preferences</Text>

          <View className="mb-2">
            <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">Default Country</Text>
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
                  <Text className="text-sm font-semibold text-[#374151]">Notify before trip starts</Text>
                  <Text className="text-xs text-[#6B7280]">Days in advance to notify you</Text>
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
                  <Text className="text-sm font-semibold text-[#374151]">Notify before activity starts</Text>
                  <Text className="text-xs text-[#6B7280]">Hours in advance to notify you</Text>
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
              <Text className="text-sm font-semibold text-[#374151]">PIN Code Lock</Text>
              <Text className="text-xs text-[#6B7280]">Require passcode to unlock app</Text>
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
                  <Text className="text-sm font-semibold text-[#374151]">Biometric Lock</Text>
                  <Text className="text-xs text-[#6B7280]">Unlock using fingerprint or Face ID</Text>
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
    </View>
  );
}
