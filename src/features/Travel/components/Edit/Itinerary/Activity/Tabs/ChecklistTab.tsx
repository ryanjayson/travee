import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useAuth } from "../../../../../../Auth/hooks/AuthContext";
import { useConfirm } from "../../../../../../../context/ConfirmContext";
import { useTravelContext } from "../../../../../../../context/TravelContext";
import {
  useChecklistItems,
  useChecklistItemsByActivity,
  useDeleteChecklistItemMutation,
  useToggleChecklistItemMutation,
} from "../../../../../hooks/useChecklist";
import { ChecklistItem, ItineraryActivity } from "../../../../../types/TravelDto";

export interface ChecklistTabProps {
  activityId?: string;
  travelId?: string;
  itineraryActivity?: ItineraryActivity | null;
  isScrollable?: boolean;
}

export default function ChecklistTab({
  activityId,
  travelId: propTravelId,
  itineraryActivity,
  isScrollable = false,
}: ChecklistTabProps) {
  const { openChecklistModal } = useTravelContext();
  const { confirm } = useConfirm();
  const { userToken } = useAuth();

  const effectiveTravelId = propTravelId || itineraryActivity?.travelId || "";
  const effectiveActivityId = activityId || itineraryActivity?.id || "";

  const deleteChecklistItem = useDeleteChecklistItemMutation();
  const toggleChecklistItem = useToggleChecklistItemMutation();

  const {
    data: allItems,
    refetch: refetchTravelItems,
    isLoading: isTravelLoading,
  } = useChecklistItems(effectiveTravelId);

  const {
    data: activityItems,
    refetch: refetchActivityItems,
    isLoading: isActivityLoading,
  } = useChecklistItemsByActivity(effectiveTravelId ? "" : effectiveActivityId);

  const activityChecklistItems = useMemo(() => {
    if (effectiveTravelId && allItems) {
      return allItems.filter((i) => i.activityId === effectiveActivityId);
    }
    return activityItems || [];
  }, [effectiveTravelId, allItems, activityItems, effectiveActivityId]);

  const targetActivity = useMemo<ItineraryActivity | null>(() => {
    if (itineraryActivity) return itineraryActivity;
    if (effectiveActivityId) {
      return {
        id: effectiveActivityId,
        travelId: effectiveTravelId,
      } as ItineraryActivity;
    }
    return null;
  }, [itineraryActivity, effectiveActivityId, effectiveTravelId]);

  const refetch = async () => {
    if (effectiveTravelId) {
      await refetchTravelItems();
    } else {
      await refetchActivityItems();
    }
  };

  const handleToggleChecklistItem = async (item: ChecklistItem) => {
    await toggleChecklistItem.mutateAsync({
      id: item.id!,
      isDone: !item.isDone,
      userId: userToken || "user",
      travelId: item.travelId || effectiveTravelId,
      activityId: item.activityId || effectiveActivityId,
    });
    await refetch();
  };

  const handleDeleteChecklistItem = async (item: ChecklistItem) => {
    const isConfirmed = await confirm({
      title: "Remove Item",
      message: `Remove "${item.title}"?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      type: "danger",
    });

    if (isConfirmed) {
      await deleteChecklistItem.mutateAsync({
        id: item.id!,
        travelId: item.travelId || effectiveTravelId,
        activityId: item.activityId || effectiveActivityId,
      });
      await refetch();
    }
  };

  const handleAddItem = () => {
    if (targetActivity) {
      openChecklistModal(null, [targetActivity], effectiveTravelId);
    }
  };

  const handleEditItem = (item: ChecklistItem) => {
    if (targetActivity) {
      openChecklistModal(item, [targetActivity], effectiveTravelId);
    }
  };

  const isLoading = effectiveTravelId ? isTravelLoading : isActivityLoading;

  if (isLoading && (!activityChecklistItems || activityChecklistItems.length === 0)) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator size="small" color="#263F69" />
      </View>
    );
  }

  const renderContent = () => (
    <View className="flex-1 pb-6 pt-2 px-5">

      {activityChecklistItems.length > 0 ? (
        <View className="bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
          {activityChecklistItems.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-200"
            >
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityLabel={
                  item.isDone
                    ? `Mark ${item.title} as incomplete`
                    : `Mark ${item.title} as complete`
                }
                accessibilityState={{ checked: item.isDone }}
                onPress={() => handleToggleChecklistItem(item)}
                className={`w-6 h-6 rounded-full border-2 items-center justify-center shrink-0 ${item.isDone ? "bg-[#263F69] border-[#263F69]" : "border-[#263F69]"
                  }`}
              >
                {item.isDone && <Icon name="check" size={14} color="#FFF" />}
              </TouchableOpacity>
              <View className="flex-1">
                <Text
                  className={`text-lg ${item.isDone ? "line-through text-gray-400" : "text-gray-800 font-medium"
                    }`}
                >
                  {item.title}
                </Text>
                {item.description ? (
                  <Text className="text-base text-gray-400 mt-0.5">{item.description}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Edit checklist item"
                onPress={() => handleEditItem(item)}
                className="p-1 mr-1"
              >
                <Icon name="edit" size={20} color="#263F69" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Remove checklist item"
                onPress={() => handleDeleteChecklistItem(item)}
                className="p-1"
              >
                <Icon name="delete-outline" size={20} color="#c93030" />
              </TouchableOpacity>
            </View>
          ))}
          <View
            className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-200"
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add To-Do item"
              onPress={handleAddItem}
              className="flex-row items-center gap-1"
            >
              <Icon name="add" size={24} color="#263F69" />
              <Text className="text-lg font-medium text-accent underline">Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="items-center justify-center py-10">
          <Icon name="playlist-add-check" size={44} color="#D1D5DB" />
          <Text className="text-base font-medium text-gray-400 mt-2">No to-do items yet</Text>
          <Text className="text-sm text-gray-400 text-center mt-1">
            Tap &quot;Add To-Do item&quot; above to add tasks to this activity.
          </Text>
        </View>
      )}
    </View>
  );

  if (isScrollable) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    );
  }

  return renderContent();
}
