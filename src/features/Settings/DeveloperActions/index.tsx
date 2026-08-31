import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { database } from "../../../db";
import { seedTestNotifications } from "../../../services/local/notificationService";
import OnboardingModal from "../../../components/OnboardingModal";

export interface DeveloperActionsProps {
  onCloseParentModal?: () => void;
}

export const DeveloperActions: React.FC<DeveloperActionsProps> = ({ onCloseParentModal }) => {
  const queryClient = useQueryClient();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSeedNotifications = async () => {
    try {
      await seedTestNotifications();
      Alert.alert(
        "Success",
        "Sample notifications seeded successfully! Check the notifications panel on Home."
      );
    } catch (error) {
      console.error("Failed to seed notifications:", error);
      Alert.alert("Error", "Failed to seed sample notifications.");
    }
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

              if (onCloseParentModal) {
                onCloseParentModal();
              }
            } catch (error) {
              console.error("Failed to delete all data:", error);
              Alert.alert("Error", "Failed to delete all application data.");
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <View className="bg-white rounded-2xl p-4 gap-3 shadow-sm elevation-2 border border-[#F3F4F6]">
        <Text className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">
          Developer Actions
        </Text>

        <TouchableOpacity
          onPress={() => setShowOnboarding(true)}
          className="bg-primary py-3.5 rounded-xl items-center"
          accessibilityRole="button"
          accessibilityLabel="Launch Onboarding Flow"
          activeOpacity={0.7}
        >
          <Text className="text-white font-bold text-base">Launch Onboarding Flow</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSeedNotifications}
          className="bg-accent py-3.5 rounded-xl items-center mt-2"
          accessibilityRole="button"
          accessibilityLabel="Seed Sample Notifications"
          activeOpacity={0.7}
        >
          <Text className="text-white font-bold text-base">Seed Sample Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAllData}
          className="bg-[#D92D20] py-3.5 rounded-xl items-center mt-2"
          accessibilityRole="button"
          accessibilityLabel="Delete All Data"
          activeOpacity={0.7}
        >
          <Text className="text-white font-bold text-base">Delete All Data</Text>
        </TouchableOpacity>
      </View>

      {showOnboarding && (
        <OnboardingModal
          visible={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
};

export default DeveloperActions;
