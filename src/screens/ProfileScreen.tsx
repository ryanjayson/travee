import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserProfile, useSaveProfile } from "../hooks/useUserProfile";
import { UserProfileDto, AccountType } from "../types/UserProfileDto";

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
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View className="flex-1 bg-black/50 justify-end">
      <View className="bg-white rounded-t-3xl max-h-[70%] pb-7">
        <View className="flex-row justify-between items-center p-5 border-b border-[#F3F4F6]">
          <Text className="text-base font-bold text-[#111827]">{title}</Text>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close picker">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              className={`flex-row justify-between items-center px-5 py-3.5 ${selected === opt ? 'bg-[#EFF6FF]' : ''}`}
              onPress={() => { onSelect(opt); onClose(); }}
              accessibilityRole="button"
            >
              <Text className={`text-base ${selected === opt ? 'text-[#263F69] font-semibold' : 'text-[#374151]'}`}>
                {opt}
              </Text>
              {selected === opt && <Ionicons name="checkmark" size={18} color="#263F69" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export function ProfileScreen({ onClose }: { onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useUserProfile();
  const { mutate: saveProfile, isPending: isSaving } = useSaveProfile();

  const [form, setForm] = useState<UserProfileDto>({
    username: "",
    displayName: "",
    email: "",
    defaultCurrency: "PHP",
    defaultCountry: "Philippines",
    accountType: AccountType.Free,
  });

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username ?? "",
        displayName: profile.displayName ?? "",
        email: profile.email ?? "",
        defaultCurrency: profile.defaultCurrency ?? "PHP",
        defaultCountry: profile.defaultCountry ?? "Philippines",
        accountType: profile.accountType ?? AccountType.Free,
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

  const selectedCurrencyLabel = CURRENCIES.find(c => c.code === form.defaultCurrency)?.label ?? form.defaultCurrency;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F3F4F6]" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#263F69" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F3F4F6]" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3.5 bg-white border-b border-[#E5E7EB]">
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
          className="bg-[#263F69] px-4 py-1.5 rounded-full min-w-[60px] items-center"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-xs font-semibold">{saved ? "Saved ✓" : "Save"}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>

        {/* Avatar & Badge */}
        <View className="items-center py-5 gap-2.5">
          <View className="w-24 h-24 rounded-full bg-[#263F69] justify-center items-center shadow-lg elevation-6">
            <Ionicons name="person" size={48} color="#fff" />
          </View>
          <AccountTypeBadge type={form.accountType ?? AccountType.Free} />
        </View>

        {/* Account Type Card */}
        <View className="bg-white rounded-2xl p-4 gap-3 shadow-sm elevation-2 border border-[#F3F4F6]">
          <Text className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Account Type</Text>
          <View className="flex-row gap-2.5">
            <TouchableOpacity
              onPress={() => setForm(f => ({ ...f, accountType: AccountType.Free }))}
              className={`flex-1 items-center p-3.5 rounded-xl border-2 bg-[#F9FAFB] gap-1 ${form.accountType === AccountType.Free ? 'border-[#263F69] bg-[#EFF6FF]' : 'border-[#E5E7EB]'}`}
              accessibilityRole="button"
            >
              <Ionicons name="person" size={20} color={form.accountType === AccountType.Free ? "#263F69" : "#9CA3AF"} />
              <Text className={`text-sm font-bold ${form.accountType === AccountType.Free ? 'text-[#263F69]' : 'text-[#9CA3AF]'}`}>Free</Text>
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
        <View className="bg-white rounded-2xl p-4 gap-3 shadow-sm elevation-2 border border-[#F3F4F6]">
          <Text className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Profile Info</Text>

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-[#374151]">Username</Text>
            <View className="flex-row items-center bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] pr-3">
              <Ionicons name="at" size={18} color="#6B7280" style={{ paddingHorizontal: 12, paddingVertical: 10 }} />
              <TextInput
                className="flex-1 text-base text-[#111827] py-2.5"
                value={form.username}
                onChangeText={(v) => setForm(f => ({ ...f, username: v }))}
                placeholder="e.g. travieler_123"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-[#374151]">Display Name</Text>
            <View className="flex-row items-center bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] pr-3">
              <Ionicons name="person-outline" size={18} color="#6B7280" style={{ paddingHorizontal: 12, paddingVertical: 10 }} />
              <TextInput
                className="flex-1 text-base text-[#111827] py-2.5"
                value={form.displayName}
                onChangeText={(v) => setForm(f => ({ ...f, displayName: v }))}
                placeholder="Your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-[#374151]">Email</Text>
            <View className="flex-row items-center bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] pr-3">
              <Ionicons name="mail-outline" size={18} color="#6B7280" style={{ paddingHorizontal: 12, paddingVertical: 10 }} />
              <TextInput
                className="flex-1 text-base text-[#111827] py-2.5"
                value={form.email}
                onChangeText={(v) => setForm(f => ({ ...f, email: v }))}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View className="bg-white rounded-2xl p-4 gap-3 shadow-sm elevation-2 border border-[#F3F4F6]">
          <Text className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Preferences</Text>

          <TouchableOpacity
            className="flex-row items-center justify-between py-1"
            onPress={() => setShowCurrencyPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Select default currency"
          >
            <View className="flex-row items-center gap-1">
              <Ionicons name="cash-outline" size={18} color="#6B7280" style={{ paddingHorizontal: 12, paddingVertical: 10 }} />
              <View>
                <Text className="text-sm font-semibold text-[#374151]">Default Currency</Text>
                <Text className="text-sm text-[#263F69] font-medium mt-0.5">{selectedCurrencyLabel}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="h-[1px] bg-[#F3F4F6]" />

          <TouchableOpacity
            className="flex-row items-center justify-between py-1"
            onPress={() => setShowCountryPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Select default country"
          >
            <View className="flex-row items-center gap-1">
              <Ionicons name="earth-outline" size={18} color="#6B7280" style={{ paddingHorizontal: 12, paddingVertical: 10 }} />
              <View>
                <Text className="text-sm font-semibold text-[#374151]">Default Country</Text>
                <Text className="text-sm text-[#263F69] font-medium mt-0.5">{form.defaultCountry || "Not set"}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
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

      <PickerModal
        visible={showCountryPicker}
        title="Select Country"
        options={COUNTRIES}
        selected={form.defaultCountry ?? "Philippines"}
        onSelect={(v) => setForm(f => ({ ...f, defaultCountry: v }))}
        onClose={() => setShowCountryPicker(false)}
      />
    </View>
  );
}
