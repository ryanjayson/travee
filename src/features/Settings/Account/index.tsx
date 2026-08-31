import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TRAVELER_TYPES } from "../../../components/OnboardingModal";
import { useKeyboardVisible } from "../../../hooks/useKeyboardVisible";
import { useToast } from "../../../context/ToastContext";
import { UserProfileDto } from "../../../types/UserProfileDto";

const COUNTRIES = [
  "Philippines", "Japan", "South Korea", "Thailand", "Vietnam", "Singapore",
  "Malaysia", "Indonesia", "Taiwan", "Hong Kong", "Australia", "New Zealand",
  "United States", "Canada", "United Kingdom", "France", "Germany", "Italy",
  "Spain", "Switzerland", "Netherlands", "United Arab Emirates", "Saudi Arabia",
  "Qatar", "India", "Maldives", "China", "Brazil", "Mexico", "South Africa",
  "Norway", "Sweden", "Iceland", "Greece", "Portugal", "Austria", "Turkey",
  "Egypt", "Morocco", "Cambodia",
];

const screenHeight = Dimensions.get("window").height;

interface CountryPickerModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}

const CountryPickerModal = ({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: CountryPickerModalProps) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
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

  const dragPanResponder = useRef(
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

  const filteredOptions = options.filter(opt =>
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
          className="bg-white rounded-t-[30px] shadow-lg overflow-hidden flex-1"
          style={{
            transform: [{ translateY }],
            marginTop: 80,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          {/* Drag Handle Area */}
          <View
            {...dragPanResponder.panHandlers}
            className="w-full items-center py-4 rounded-t-[30px]"
          >
            <View className="w-10 h-1 bg-gray-200 rounded-full" />
          </View>

          <View className="flex-row justify-between items-center px-5 pb-4 border-b border-[#F3F4F6] mb-4">
            <Text className="text-xl font-semibold text-[#111827]">{title}</Text>
            <TouchableOpacity onPress={handleDismiss} accessibilityRole="button" accessibilityLabel="Close country picker">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
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
                    accessibilityLabel={`Select ${opt}`}
                    activeOpacity={0.7}
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

export const getNicknameValidationError = (nickname?: string): string | null => {
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
    <View className="p-2 gap-3 will-change-variable">

      {/* Nickname */}
      <View className="mb-4">
        <Text className="text-xs font-semibold tracking-wider uppercase text-[#374151]">Nickname</Text>
        <View className="relative justify-center">
          <TextInput
            mode="outlined"
            placeholder="Nickname"
            value={form.nickname}
            onChangeText={(v) => setForm(f => ({ ...f, nickname: v }))}
            error={Boolean(nicknameError)}
            outlineColor="#E0E0E0"
            activeOutlineColor={nicknameError ? colors.error : colors.primary}
            theme={{
              colors: {
                onSurfaceVariant: '#9CA3AF',
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
            <Text style={{ color: colors.error }} className="text-xs flex-1 mr-2">
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

      {/* Country */}
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

      {/* Travel Style */}
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
                accessibilityLabel={type.label}
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

      <CountryPickerModal
        visible={showCountryPicker}
        title="Select Country"
        options={COUNTRIES}
        selected={form.defaultCountry ?? "Philippines"}
        onSelect={(v) => setForm(f => ({ ...f, defaultCountry: v }))}
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
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { keyboardVisible } = useKeyboardVisible();
  const translateY = useRef(new Animated.Value(screenHeight)).current;

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
    handleDismiss();
  };

  const dragPanResponder = useRef(
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined}
        style={{ flex: 1 }}
      >
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
            className="bg-white rounded-t-[30px] shadow-lg overflow-hidden "
            style={[
              { height: keyboardVisible ? "100%" : screenHeight * 0.60 },
              {
                paddingTop: keyboardVisible ? insets.top + 10 : 0,
                paddingBottom: keyboardVisible ? 0 : Math.max(insets.bottom, 20),
                transform: [{ translateY }],
              },
            ]}
          >
            {/* Drag Handle Area */}
            {!keyboardVisible && (
              <View
                {...dragPanResponder.panHandlers}
                className="w-full items-center pt-3 pb-2 bg-white rounded-t-[30px]"
              >
                <View className="w-10 h-1 bg-gray-200 rounded-full" />
              </View>
            )}

            {/* Header */}
            <View
              {...(!keyboardVisible && dragPanResponder.panHandlers)}
              className="flex-row justify-between items-center px-5 pb-4 bg-white border-b border-gray-200"
              style={{ paddingTop: keyboardVisible ? 4 : 8 }}
            >
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={handleDismiss}
                  accessibilityRole="button"
                  accessibilityLabel="Close profile settings"
                >
                  <Ionicons name="chevron-back" size={26} color="#999" />
                </TouchableOpacity>
                <Text className="text-2xl text-gray-700 font-medium">
                  Profile
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleUpdate}
                disabled={Boolean(getNicknameValidationError(form.nickname))}
                style={{ opacity: getNicknameValidationError(form.nickname) ? 0.4 : 1 }}
                accessibilityRole="button"
                accessibilityLabel="Update profile"
              >
                <View className="flex-row items-center gap-1">
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                  <Text className="text-md font-medium" style={{ color: colors.primary }}>
                    Update
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Scrollable Body */}
            <ScrollView
              className="p-4 bg-gray-50"
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              <AccountSettings form={form} setForm={setForm} saveProfile={saveProfile} />
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AccountSettings;
