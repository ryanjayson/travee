import React from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { useTravelContext } from "../../../../../../context/TravelContext";
import { useChecklistItemsByActivity, useToggleChecklistItemMutation } from "../../../../hooks/useChecklist";
import { ChecklistItem, ItineraryActivity } from "../../../../types/TravelDto";

interface ChecklistTabProps {
  activityId: string;
  itineraryActivity?: ItineraryActivity | null;
}

const ChecklistTab = ({ activityId, itineraryActivity }: ChecklistTabProps) => {
  const { colors } = useTheme();
  const { openChecklistModal } = useTravelContext();
  const { data: checklistItems, isLoading, isError } = useChecklistItemsByActivity(activityId);
  const toggleMutation = useToggleChecklistItemMutation();

  const handleAddItem = () => {
    if (!itineraryActivity) return;
    openChecklistModal(
      {
        activityId: itineraryActivity.id,
        travelId: itineraryActivity.travelId,
        isDone: false,
      } as ChecklistItem,
      [itineraryActivity],
      itineraryActivity.travelId
    );
  };

  const handleToggle = (item: ChecklistItem) => {
    toggleMutation.mutate({
      id: item.id!,
      isDone: !item.isDone,
      userId: "local-user", // Fallback or get actual user ID
      travelId: item.travelId!,
      activityId: item.activityId,
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <ActivityIndicator size="small" color="#263F69" />
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
       <View className="flex-1 items-center justify-center h-[300px] px-8 gap-1">
         {/* <Icon name="playlist-add-check" size={46} color="#D1D5DB" /> */}
        <Ionicons name="checkbox-outline" size={38} color="#D1D5DB" />

          <Text className="text-2xl text-tertiary/50 text-center">
            No added to-do's yet.
          </Text>
          <View className="text-center tracking-wide flex-row align-center gap-2 ">
          <TouchableOpacity
              onPress={handleAddItem}
              accessibilityRole="button"
              activeOpacity={0.7}
              className="flex-row items-center"
            >
              {/* <Icon name="add" size={16} color={colors.primary} /> */}
              <Text 
                className="font-medium text-base underline text-accent"
              >
                Add item
              </Text>
            </TouchableOpacity> 
             <Text className="text-base text-tertiary">
                    now to this activity
              </Text>
          </View>
        </View>
    );
  }

  return (
    <FlatList
      data={checklistItems}
      keyExtractor={(item) => item.id!}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Add To-Do item"
          onPress={handleAddItem}
          className="flex-row items-center gap-1 p-0 self-end"
        >
          <Ionicons name="add" size={20} color="#263F69" />
          <Text className="text-lg font-semibold text-primary underline">Add</Text>
        </TouchableOpacity>
      }
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
            color={item.isDone ? "#263F69" : "#9CA3AF"}
          />
          <View className="ml-3 flex-1">
            <Text className={`text-lg font-semibold ${item.isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
              {item.title}
            </Text>
            {item.description && (
              <Text className={`text-base ${item.isDone ? 'text-gray-300' : 'text-gray-500'}`}>
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
