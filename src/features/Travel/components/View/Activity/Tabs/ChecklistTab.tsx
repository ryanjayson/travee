import React from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useChecklistItemsByActivity, useToggleChecklistItemMutation } from "../../../../hooks/useChecklist";
import { ChecklistItem } from "../../../../types/TravelDto";

interface ChecklistTabProps {
  activityId: string;
}

const ChecklistTab = ({ activityId }: ChecklistTabProps) => {
  const { data: checklistItems, isLoading, isError } = useChecklistItemsByActivity(activityId);
  const toggleMutation = useToggleChecklistItemMutation();

  const handleToggle = (item: ChecklistItem) => {
    toggleMutation.mutate({
      id: item.id!,
      isDone: !item.isDone,
      userId: "local-user", // Fallback or get actual user ID
      travelId: item.travelId!,
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <ActivityIndicator size="small" color="#0C4C8A" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-red-500 text-sm">Failed to load checklist items.</Text>
      </View>
    );
  }

  if (!checklistItems || checklistItems.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Ionicons name="checkbox-outline" size={48} color="#D1D5DB" />
        <Text className="text-base text-gray-500 mt-2">No checklist items yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={checklistItems}
      keyExtractor={(item) => item.id!}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          className="flex-row items-center py-3 border-b border-gray-100"
          onPress={() => handleToggle(item)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.isDone }}
        >
          <Ionicons
            name={item.isDone ? "checkbox" : "square-outline"}
            size={24}
            color={item.isDone ? "#0C4C8A" : "#9CA3AF"}
          />
          <View className="ml-3 flex-1">
            <Text className={`text-base ${item.isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
              {item.title}
            </Text>
            {item.description && (
              <Text className={`text-xs ${item.isDone ? 'text-gray-300' : 'text-gray-500'}`}>
                {item.description}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

export default ChecklistTab;
