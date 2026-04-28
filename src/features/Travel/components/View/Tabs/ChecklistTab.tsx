import React from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { TravelPlan, ItineraryActivity } from "../../../../Travel/types/TravelDto";
import { useChecklistGroups, useChecklistItems, useToggleChecklistItemMutation } from "../../../hooks/useChecklist";
import ActivityIcon from "../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../types/enums";
import { useAuth } from "../../../../Auth/hooks/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";

interface ChecklistTabProps {
  travelPlan: TravelPlan;
  activities?: ItineraryActivity[];
}

const ChecklistTab = ({ travelPlan, activities }: ChecklistTabProps) => {
  const { colors } = useTheme();
  const { userToken } = useAuth();
  const travelId = travelPlan.travel.id || "";

  const { data: groups = [], isLoading: groupsLoading } = useChecklistGroups(travelId);
  const { data: items = [], isLoading: itemsLoading } = useChecklistItems(travelId);
  const toggleMutation = useToggleChecklistItemMutation();

  const allActivities =
    activities ??
    (travelPlan.itinerarySection?.flatMap((s) => s.itineraryActivity || []) || []);

  const handleToggle = async (item: any) => {
    if (!item.id) return;
    await toggleMutation.mutateAsync({
      id: item.id,
      isDone: !item.isDone,
      userId: userToken || "user",
      travelId,
    });
  };

  if (groupsLoading || itemsLoading) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const totalDone = items.filter((i) => i.isDone).length;

  const renderItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      accessibilityRole="checkbox"
      onPress={() => handleToggle(item)}
      className="flex-row items-start gap-3 py-3 px-4 "
    >
      <View
        className={`items-center justify-center mt-0.5 flex-shrink-0`}
      >
        {item.isDone ? (<Icon name="check-box" size={20} color="#0C4C8A" />) : (<Icon name="check-box-outline-blank" size={20} color="#777" />)}
        

      </View>
      <View className="flex-1">
        <Text
          className={`text-base ${
            item.isDone ? "line-through text-gray-400" : "text-[#1A1A1A] font-medium"
          }`}
        >
          {item.title}
        </Text>
        {item.description ? (
          <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const ungroupedItems = items.filter((i) => !i.checklistGroupId && !i.activityId);

  if (items.length === 0 && groups.length === 0) {
    return (
      <View className="flex-1 items-center justify-center h-[300px] px-8">
        <Icon name="playlist-add-check" size={52} color="#D1D5DB" />
        <Text className="text-sm text-gray-400 mt-3 text-center">
          No checklist items yet.{"\n"}Edit the plan to add items.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-4 py-2">
      {/* Summary header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-base font-bold text-[#183B7A]">Checklist</Text>
        <Text className="text-sm text-gray-500 font-medium">
          {totalDone}/{items.length} done
        </Text>
      </View>

      {/* Progress bar */}
      {items.length > 0 && (
        <View className="bg-gray-200 h-2 rounded-full mb-5 overflow-hidden">
          <View
            className="bg-[#0C4C8A] h-2 rounded-full"
            style={{ width: `${Math.round((totalDone / items.length) * 100)}%` }}
          />
        </View>
      )}

      {/* Grouped items */}
      {groups.map((group) => {
        const groupItems = items.filter((i) => i.checklistGroupId === group.id);
        const doneCt = groupItems.filter((i) => i.isDone).length;
        if (groupItems.length === 0) return null;
        return (
          <View key={group.id} className="bg-white rounded-[20px] border border-gray-100 shadow-sm mb-4 overflow-hidden">
            <View className="flex-row items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <Icon name="folder" size={18} color="#0C4C8A" />
              <Text className="text-sm font-bold text-[#0C4C8A] flex-1 uppercase tracking-wider">
                {group.title}
              </Text>
              <Text className="text-xs text-gray-400">{doneCt}/{groupItems.length}</Text>
            </View>
            {group.description ? (
              <Text className="text-xs text-gray-500 px-4 pt-2">{group.description}</Text>
            ) : null}
            {groupItems.map(renderItem)}
          </View>
        );
      })}

      {/* Activity-linked items */}
      {allActivities.map((activity) => {
        const activityItems = items.filter((i) => i.activityId === activity.id);
        if (activityItems.length === 0) return null;
        const doneCt = activityItems.filter((i) => i.isDone).length;
        return (
          <View key={`activity-${activity.id}`} className="bg-white rounded-[20px] border border-gray-100 shadow-sm mb-4 overflow-hidden">
            <View className="flex-row items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <ActivityIcon
                type={(activity.type ?? ActivityType.none) as ActivityType}
                size={18}
                color="#444"
              />
              <Text className="text-sm font-bold text-gray-600 flex-1">{activity.title}</Text>
              <Text className="text-xs text-gray-400">{doneCt}/{activityItems.length}</Text>
            </View>
            {activityItems.map(renderItem)}
          </View>
        );
      })}

      {/* Ungrouped / General */}
      {ungroupedItems.length > 0 && (
        <View className="bg-white rounded-[20px] border border-gray-100 shadow-sm mb-4 overflow-hidden">
          <View className="flex-row items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <Icon name="list" size={18} color="#888" />
            <Text className="text-sm font-bold text-gray-500 flex-1 uppercase tracking-wider">General</Text>
            <Text className="text-xs text-gray-400">
              {ungroupedItems.filter((i) => i.isDone).length}/{ungroupedItems.length}
            </Text>
          </View>
          {ungroupedItems.map(renderItem)}
        </View>
      )}
    </View>
  );
};

export default ChecklistTab;
