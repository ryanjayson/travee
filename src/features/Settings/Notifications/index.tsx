import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Switch, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserProfileDto } from "../../../types/UserProfileDto";

export interface NotificationSettingsProps {
  form: UserProfileDto;
  setForm: React.Dispatch<React.SetStateAction<UserProfileDto>>;
  saveProfile?: (data: UserProfileDto, options?: any) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  form,
  setForm,
  saveProfile,
}) => {
  const { colors } = useTheme();

  const handleToggleNotifications = (enabled: boolean) => {
    const updated = { ...form, notificationsEnabled: enabled };
    setForm(updated);
    if (saveProfile) {
      saveProfile(updated);
    }
  };

  const handleUpdateDaysBeforeTrip = (newDays: number) => {
    const clamped = Math.max(1, Math.min(30, newDays));
    const updated = { ...form, notifyDaysBeforeTrip: clamped };
    setForm(updated);
    if (saveProfile) {
      saveProfile(updated);
    }
  };

  const handleUpdateHoursBeforeActivity = (newHours: number) => {
    const clamped = Math.max(1, Math.min(24, newHours));
    const updated = { ...form, notifyHoursBeforeActivity: clamped };
    setForm(updated);
    if (saveProfile) {
      saveProfile(updated);
    }
  };

  const currentDays = form.notifyDaysBeforeTrip ?? 3;
  const currentHours = form.notifyHoursBeforeActivity ?? 2;

  return (
    <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6] will-change-variable">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-xl font-semibold text-secondary/80">Notification Settings</Text>

        <Switch
          value={form.notificationsEnabled}
          onValueChange={handleToggleNotifications}
          trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
          thumbColor={form.notificationsEnabled ? colors.primary : "#F3F4F6"}
          accessibilityRole="switch"
          accessibilityLabel="Toggle notifications"
        />
      </View>

      <View className="gap-4 mt-2">
        {/* Trip starts setting */}
        <View className="flex-row justify-between items-center"
          style={{ opacity: form.notificationsEnabled ? 1 : 0.5 }}>
          <View className="flex-1 mr-4">
            <Text className="text-lg font-semibold text-tertiary">Notify before trip starts</Text>
            <Text className="text-sm text-tertiary/75">Days in advance to notify you</Text>
          </View>
          <View className="flex-row items-center border border-[#E5E7EB] rounded-full p-1 bg-white">
            <TouchableOpacity
              onPress={() => handleUpdateDaysBeforeTrip(currentDays - 1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
              accessibilityRole="button"
              accessibilityLabel="Decrease days"
              activeOpacity={0.7}
              disabled={!form.notificationsEnabled}
            >
              <Ionicons name="remove" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text className="text-sm font-semibold text-[#111827] px-3 min-w-[60px] text-center">
              {currentDays} {currentDays === 1 ? "day" : "days"}
            </Text>
            <TouchableOpacity
              onPress={() => handleUpdateDaysBeforeTrip(currentDays + 1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
              accessibilityRole="button"
              accessibilityLabel="Increase days"
              activeOpacity={0.7}
              disabled={!form.notificationsEnabled}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-[1px] bg-[#E5E7EB]" />

        {/* Activity starts setting */}
        <View className="flex-row justify-between items-center"
          style={{ opacity: form.notificationsEnabled ? 1 : 0.5 }}>
          <View className="flex-1 mr-4">
            <Text className="text-base font-semibold text-tertiary">Notify before activity starts</Text>
            <Text className="text-sm text-tertiary/75">Hours in advance to notify you</Text>
          </View>
          <View className="flex-row items-center border border-[#E5E7EB] rounded-full p-1 bg-white">
            <TouchableOpacity
              onPress={() => handleUpdateHoursBeforeActivity(currentHours - 1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
              accessibilityRole="button"
              accessibilityLabel="Decrease hours"
              activeOpacity={0.7}
              disabled={!form.notificationsEnabled}
            >
              <Ionicons name="remove" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text className="text-sm font-semibold text-[#111827] px-3 min-w-[60px] text-center">
              {currentHours} {currentHours === 1 ? "hour" : "hours"}
            </Text>
            <TouchableOpacity
              onPress={() => handleUpdateHoursBeforeActivity(currentHours + 1)}
              className="w-8 h-8 rounded-full items-center justify-center bg-[#F3F4F6]"
              accessibilityRole="button"
              accessibilityLabel="Increase hours"
              activeOpacity={0.7}
              disabled={!form.notificationsEnabled}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export interface NotificationBottomSheetProps extends NotificationSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationBottomSheet: React.FC<NotificationBottomSheetProps> = ({
  visible,
  onClose,
  form,
  setForm,
  saveProfile,
}) => {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height;
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
  }, [visible, screenHeight]);

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
          className="bg-[#F9FAFB] rounded-t-[30px] shadow-lg overflow-hidden"
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
            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-2 pb-4 bg-white border-b border-gray-200">
            <Text className="text-xl font-bold text-[#111827]">Notification Settings</Text>
            <TouchableOpacity
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel="Close notification settings"
            >
              <Ionicons name="close" size={26} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Body */}
          <ScrollView
            className="p-4"
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            <NotificationSettings form={form} setForm={setForm} saveProfile={saveProfile} />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default NotificationSettings;
