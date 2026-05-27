import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";
import ActivityIcon from "../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../types/enums";
import { useAuth } from "../../../../Auth/hooks/AuthContext";
import { ItineraryActivity, TravelPlan } from "../../../../Travel/types/TravelDto";
import { useChecklistGroups, useChecklistItems, useToggleChecklistItemMutation } from "../../../hooks/useChecklist";

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
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

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
      className="flex-row items-start gap-3 py-3 px-4 border-b border-gray-100 "
    >
      <View
        className={`items-center justify-center mt-0.5 shrink-0`}
      >
        {item.isDone ? (<Icon name="check-box" size={20} color="#263F69" />) : (<Icon name="check-box-outline-blank" size={20} color="#777" />)}
      </View>
      <View className="flex-1">
        <Text
          className={`text-base  ${
            item.isDone ? "line-through text-gray-400" : "text-[#1A1A1A] font-medium"
          }`}
        >
          {item.title}
        </Text>
        {item.description ? (
          <Text className="text-xs text-gray-400 leading-5 mt-0.5" numberOfLines={2}>
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
    <View className="px-4 py-5">
      {/* Summary header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold tracking-wider uppercase mb-1">Trip checklist</Text>
        <Text className="text-sm text-gray-500 font-medium">
          {totalDone}/{items.length} Done
        </Text>
      </View>

      {/* Progress bar */}
      {items.length > 0 && (
        <View className="bg-gray-200 h-4 rounded-xl mb-5 overflow-hidden flex-row">
          <View
            className="bg-[#263F69] h-4 rounded-full"
            style={{ width: `${Math.round((totalDone / items.length) * 100)}%` }}
          />
        </View>
      )}

      {/* Grouped items */}
      {groups.map((group) => {
        const groupItems = items.filter((i) => i.checklistGroupId === group.id);
        const doneCt = groupItems.filter((i) => i.isDone).length;
        if (groupItems.length === 0) return null;
        const isCollapsed = collapsedSections[group.id || ""] || false;
        return (
          <View key={group.id} className="bg-white rounded-2xl border border-[#e0e0e0] mb-4 overflow-hidden">
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              onPress={() => toggleSectionCollapse(group.id || "")}
              className={`flex-row items-center gap-3  px-4 py-6 bg-gray-50 ${!isCollapsed ? "border-b border-[#e0e0e0]" : ""}`}
            >
              <Icon name="folder" size={24} color="#263F69" />
              <View className="flex-1">
                <Text className="text-md font-bold text-[#263F69] uppercase tracking-wider">
                  {group.title}
                </Text>
                {group.description ? (
                  <Text className="text-xs text-gray-600 pt-1">{group.description}</Text>
                ) : null}
              </View>
              <Text className="text-base text-gray-400 mr-1 bg-gray-200 px-2 border border-gray-200 rounded-full">{doneCt}/{groupItems.length}</Text>
              <Icon 
                name={isCollapsed ? "keyboard-arrow-down" : "keyboard-arrow-up"} 
                size={24} 
                color="#777" 
              />
            </TouchableOpacity>
            {!isCollapsed && (
              <>
                {groupItems.map(renderItem)}
              </>
            )}
          </View>
        );
      })}

      {/* Activity-linked items */}
      {allActivities.map((activity) => {
        const activityItems = items.filter((i) => i.activityId === activity.id);
        if (activityItems.length === 0) return null;
        const doneCt = activityItems.filter((i) => i.isDone).length;
        const isCollapsed = collapsedSections[`activity-${activity.id}`] || false;
        return (
          <View key={`activity-${activity.id}`} className="bg-white rounded-2xl border border-[#e0e0e0] mb-4 overflow-hidden">
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              onPress={() => toggleSectionCollapse(`activity-${activity.id}`)}
               className={`flex-row items-center gap-3  px-4 py-6 bg-gray-50 ${!isCollapsed ? "border-b border-[#e0e0e0]" : ""}`}
            >
              <ActivityIcon
                type={(activity.type ?? ActivityType.none) as ActivityType}
                size={24}
              />
              <Text className="text-md font-bold text-gray-600 flex-1">{activity.title}</Text>
              <Text className="text-base text-gray-400 mr-1 bg-gray-200 px-2 border border-gray-200 rounded-full">{doneCt}/{activityItems.length}</Text>
              <Icon 
                name={isCollapsed ? "keyboard-arrow-down" : "keyboard-arrow-up"} 
                size={24} 
                color="#777" 
              />
            </TouchableOpacity>
            {!isCollapsed && activityItems.map(renderItem)}
          </View>
        );
      })}

      {/* Ungrouped / General */}
      {ungroupedItems.length > 0 && (() => {
        const isCollapsed = collapsedSections["general"] || false;
        return (
          <View className="bg-white rounded-2xl border border-[#e0e0e0] mb-4 overflow-hidden">
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              onPress={() => toggleSectionCollapse("general")}
               className={`flex-row items-center gap-3 px-4 py-6 bg-gray-50 ${!isCollapsed ? "border-b border-[#e0e0e0]" : ""}`}
            >
              <Icon name="list" size={24} color="#888" />
              <Text className="text-md font-bold text-gray-500 flex-1 uppercase tracking-wider">General</Text>
              <Text className="text-base text-gray-400 mr-1 bg-gray-200 px-2 border border-gray-200 rounded-full">
                {ungroupedItems.filter((i) => i.isDone).length}/{ungroupedItems.length}
              </Text>
              <Icon 
                name={isCollapsed ? "keyboard-arrow-down" : "keyboard-arrow-up"} 
                size={24} 
                color="#777" 
              />
            </TouchableOpacity>
            {!isCollapsed && ungroupedItems.map(renderItem)}
          </View>
        );
      })()}
    </View>
  );
};

export default ChecklistTab;
