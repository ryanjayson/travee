import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";
import ActivityIcon from "../../../../../components/ActivityIcon";
import { TripPlanType } from "../../../../../types/enums";
import { useAuth } from "../../../../Auth/hooks/AuthContext";
import { useConfirm } from "../../../../../context/ConfirmContext";
import ChecklistItemsBottomSheet, {
  ActiveChecklistTarget,
} from "../../Checklist/ChecklistItemsBottomSheet";
import ChecklistGroupModal from "../../Forms/Checklist/ChecklistGroupModal";
import { ChecklistItem, ItineraryActivity, TravelPlan } from "../../../../Travel/types/TravelDto";
import {
  useChecklistGroups,
  useChecklistItems,
  useDeleteChecklistItemMutation,
  useToggleChecklistItemMutation,
} from "../../../hooks/useChecklist";
import { useTravelContext } from "../../../../../context/TravelContext";
import { FadeInView } from "../../../../../components/animations";

type ChecklistFilterOption = 'All' | 'General' | 'Activity' | 'Custom';

interface FilterOptionItem {
  id: ChecklistFilterOption;
  label: string;
  icon: any;
}

const FILTER_OPTIONS: FilterOptionItem[] = [
  { id: 'All', label: 'All', icon: 'grid-view' },
  { id: 'General', label: 'Trip To-do\'s', icon: 'list' },
  { id: 'Activity', label: 'Activity', icon: 'local-activity' },
  { id: 'Custom', label: 'Custom', icon: 'folder' },
];

interface ChecklistTabProps {
  travelPlan: TravelPlan;
  activities?: ItineraryActivity[];
}

const ChecklistTab = ({ travelPlan, activities }: ChecklistTabProps) => {
  const { colors } = useTheme();
  const { userToken } = useAuth();
  const { openChecklistModal } = useTravelContext();
  const travelId = travelPlan.travel.id || "";
  const scrollViewRef = useRef<ScrollView>(null);

  const { data: groups = [], isLoading: groupsLoading } = useChecklistGroups(travelId);
  const { data: items = [], isLoading: itemsLoading } = useChecklistItems(travelId);
  const toggleMutation = useToggleChecklistItemMutation();

  const [activeChecklist, setActiveChecklist] = useState<ActiveChecklistTarget | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState<ChecklistFilterOption>('All');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterButtonLayout, setFilterButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const filterButtonRef = useRef<View>(null);

  const handleOpenFilter = () => {
    if (filterButtonRef.current) {
      filterButtonRef.current.measureInWindow((x, y, width, height) => {
        setFilterButtonLayout({ x, y: y + height + 6, width, height });
        setShowFilterPanel(true);
      });
    } else {
      setShowFilterPanel(true);
    }
  };

  const allActivities =
    activities ??
    (travelPlan.itinerarySection?.flatMap((s) => s.itineraryActivity || []) || []);

  const hasActivityItems = allActivities.some((activity) =>
    items.some((i) => i.activityId === activity.id)
  );

  const ungroupedItems = items.filter((i) => !i.checklistGroupId && !i.activityId);

  const activeItems = useMemo(() => {
    if (!activeChecklist) return [];
    if (activeChecklist.type === "general") {
      return items.filter((i) => !i.checklistGroupId && !i.activityId);
    }
    if (activeChecklist.type === "group") {
      return items.filter((i) => i.checklistGroupId === activeChecklist.id);
    }
    if (activeChecklist.type === "activity") {
      return items.filter((i) => i.activityId === activeChecklist.id);
    }
    return [];
  }, [items, activeChecklist]);

  const { confirm } = useConfirm();
  const deleteChecklistItem = useDeleteChecklistItemMutation();

  const handleToggle = async (item: ChecklistItem) => {
    if (!item.id) return;
    await toggleMutation.mutateAsync({
      id: item.id,
      isDone: !item.isDone,
      userId: userToken || "user",
      travelId,
      activityId: item.activityId,
    });
  };

  const handleEditItem = (item: ChecklistItem) => {
    openChecklistModal(item, allActivities, travelId);
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
        travelId: item.travelId || travelId,
        activityId: item.activityId,
      });
    }
  };

  const handleAddItem = (activity?: ItineraryActivity, groupId?: string) => {
    if (activity) {
      openChecklistModal(null, [activity], travelId);
    } else if (groupId) {
      openChecklistModal({ checklistGroupId: groupId } as any, allActivities, travelId);
    } else {
      openChecklistModal(null, allActivities, travelId);
    }
  };

  const totalCount = items.length;
  const doneCount = items.filter((i) => i.isDone).length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const filteredItems = useMemo(() => {
    switch (selectedFilter) {
      case 'General':
        return items.filter((i) => !i.checklistGroupId && !i.activityId);
      case 'Custom':
        return items.filter((i) => !!i.checklistGroupId);
      case 'Activity':
        return items.filter((i) => !!i.activityId);
      case 'All':
      default:
        return items;
    }
  }, [items, selectedFilter]);

  const filteredDone = filteredItems.filter((i) => i.isDone).length;
  const filteredTotal = filteredItems.length;

  const generalCount = ungroupedItems.length;
  const customCount = items.filter((i) => !!i.checklistGroupId).length;
  const activityCount = items.filter((i) => !!i.activityId).length;
  const allCount = items.length;

  const getOptionCount = (optionId: ChecklistFilterOption) => {
    switch (optionId) {
      case 'General':
        return generalCount;
      case 'Custom':
        return customCount;
      case 'Activity':
        return activityCount;
      case 'All':
      default:
        return allCount;
    }
  };

  if (groupsLoading || itemsLoading) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 60,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-5">
          {/* Summary header */}
          <FadeInView
            type="up"
            delay={100}
            duration={350}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl tracking-tight font-medium  text-secondary mb-0">
                Trip checklist
              </Text>
            </View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg tracking-tight text-tertiary/60 mb-0 leading-xl">
                Track your travel essentials, custom lists, and itinerary tasks
              </Text>
            </View>

            <View className="bg-gray-200 h-6 rounded-xl mb-3 overflow-hidden justify-between flex-row items-center px-1">
              <View
                className={`bg-[#05966980] h-4  ${progressPercent === 100 ? 'rounded-full' : 'rounded-l-full'}`}
                style={{ width: `${progressPercent}%` }}
              />

              <Text className={`text-xs font-semibold px-1 z-10 absolute right-1 top-[4px] ${doneCount === totalCount ? 'text-white' : 'text-[#059669]'}`}>
                {doneCount}/{totalCount}
              </Text>
            </View>

            {/* Filter button below header */}
            <View className="flex-row justify-end mb-5">
              <View ref={filterButtonRef} collapsable={false}>
                <TouchableOpacity
                  onPress={handleOpenFilter}
                  accessibilityRole="button"
                  accessibilityLabel="Filter checklist"
                  activeOpacity={0.7}
                  className="flex-row items-center justify-center py-2xl "
                >
                  <View className="flex-row items-center gap-1.5">
                    <Text
                      className="text-base font-semibold text-accent"
                    >
                      {selectedFilter === 'All' ? 'All' : selectedFilter}
                    </Text>
                    <Icon
                      name="filter-alt"
                      size={20}
                      color={selectedFilter !== 'All' ? colors.primary : '#94A3B8'}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </FadeInView>
          {/* Ungrouped / General */}
          {(selectedFilter === 'All' || selectedFilter === 'General') && (
            <View className="mb-4">
              <View className="rounded-4xl overflow-hidden mb-1">
                <FadeInView
                  type="up"
                  delay={100}
                  duration={350}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Open General checklist"
                    onPress={() =>
                      setActiveChecklist({
                        type: "general",
                        title: "General",
                      })
                    }
                    className="flex-row items-center gap-3 px-5 bg-gray-50"
                  >
                    <View className="flex-row items-center py-xl flex-1">
                      <Text className="text-lg font-normal text-gray-600 flex-1 pr-2xl">
                        Trip To-do's
                      </Text>
                      <Text className="text-base text-gray-400 mr-1 rounded-full">
                        {ungroupedItems.filter((i) => i.isDone).length}/{ungroupedItems.length}
                      </Text>
                      <Icon name="chevron-right" size={24} color="#999" style={{ opacity: 0.6 }} />
                    </View>
                  </TouchableOpacity>
                </FadeInView>
              </View>
            </View>
          )}

          {/* Custom Group Header & Items */}
          {(selectedFilter === 'All' || selectedFilter === 'Custom') && (
            <View className="flex-row items-center justify-between mt-2xl px-4">
              <Text className="text-2xl font-semibold text-secondary">My Custom List</Text>
              <TouchableOpacity
                onPress={() => setShowGroupModal(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Create new checklist group"
                className="flex-row py-md"
              >
                <Icon name="add" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}

          {/* Grouped items */}
          <View className="rounded-4xl overflow-hidden">
            {(selectedFilter === 'All' || selectedFilter === 'Custom') &&
              groups.map((group, index) => {
                const groupItems = items.filter((i) => i.checklistGroupId === group.id);
                const doneCt = groupItems.filter((i) => i.isDone).length;
                return (
                  <FadeInView
                    key={group.id}
                    type="up"
                    delay={100}
                    duration={350}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${group.title} checklist`}
                      onPress={() =>
                        setActiveChecklist({
                          type: "group",
                          id: group.id,
                          title: group.title,
                          description: group.description,
                        })
                      }
                      className="flex-row items-center gap-3 px-5 bg-gray-50"
                    >
                      <View
                        className={`flex-row items-center py-xl flex-1 
                          ${index < groups.length - 1 ? "border-b border-gray-200" : ""
                          }`}
                      >
                        <View className="flex-1 pr-2xl">
                          <Text className="text-lg font-normal text-gray-600">
                            {group.title}
                          </Text>
                          {group.description ? (
                            <Text className="text-xs text-gray-600 pt-1">{group.description}</Text>
                          ) : null}
                        </View>
                        <Text className="text-base text-gray-400 mr-1 rounded-full">
                          {doneCt}/{groupItems.length}
                        </Text>
                        <Icon name="chevron-right" size={24} color="#999" style={{ opacity: 0.6 }} />
                      </View>
                    </TouchableOpacity>
                  </FadeInView>
                );
              })}
          </View>

          {/* Activity Header & Items */}
          {(selectedFilter === 'All' || selectedFilter === 'Activity') && hasActivityItems && (
            <View className="flex-row items-center justify-between mt-2xl px-4">
              <Text className="text-2xl font-semibold mb-2 text-secondary">Activity</Text>
            </View>
          )}

          <View className="rounded-4xl overflow-hidden">
            {/* Activity-linked items */}
            {(selectedFilter === 'All' || selectedFilter === 'Activity') &&
              allActivities.map((activity, index) => {
                const activityItems = items.filter((i) => i.activityId === activity.id);
                if (activityItems.length === 0) return null;
                const counter = index + 1;
                const doneCt = activityItems.filter((i) => i.isDone).length;
                return (
                  <FadeInView
                    key={`activity-${activity.id}`}
                    type="up"
                    delay={100}
                    duration={350}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${activity.title} checklist`}
                      onPress={() =>
                        setActiveChecklist({
                          type: "activity",
                          id: activity.id,
                          title: activity.title,
                          activityType: (activity.type ?? TripPlanType.activity) as TripPlanType,
                        })
                      }
                      className="flex-row items-center gap-3 px-5 bg-gray-50"
                    >
                      <ActivityIcon
                        type={(activity.type ?? TripPlanType.activity) as TripPlanType}
                        size={16}
                      />

                      <View
                        className={`flex-row items-center py-xl flex-1 
                          ${index < counter ? "border-b border-gray-200" : ""
                          }`}
                      >
                        <Text className="text-lg font-normal text-gray-600 flex-1 pr-2xl">
                          {activity.title}
                        </Text>
                        <Text className="text-base text-gray-400 mr-1 rounded-full">
                          {doneCt}/{activityItems.length}
                        </Text>
                        <Icon name="chevron-right" size={24} color="#999" style={{ opacity: 0.6 }} />
                      </View>
                    </TouchableOpacity>
                  </FadeInView>
                );
              })}
          </View>

          {/* Empty state when current filter has no items */}
          {/* {filteredTotal === 0 && (
            <FadeInView type="up" delay={50} duration={300} className="py-12 items-center justify-center">
              <Text className="text-base font-semibold text-gray-700 text-center mb-1">
                No {selectedFilter} Items
              </Text> 
              <Text className="text-sm text-gray-400 text-center px-8">
                {selectedFilter === 'General'
                  ? 'There are no ungrouped to-do items in this checklist.'
                  : selectedFilter === 'Custom'
                    ? 'There are no items in custom checklist groups.'
                    : selectedFilter === 'Activity'
                      ? 'There are no checklist items linked to activities.'
                      : 'No checklist items found.'}
              </Text>
            </FadeInView>
          )}  */}
        </View>
      </ScrollView>

      {/* Floating Filter Panel */}
      <Modal
        visible={showFilterPanel}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterPanel(false)}
      >
        <TouchableOpacity
          className="absolute inset-0"
          activeOpacity={1}
          onPress={() => setShowFilterPanel(false)}
          accessibilityRole="button"
          accessibilityLabel="Close filter panel"
        >
          <View className="flex-1">
            <TouchableOpacity
              activeOpacity={1}
              className="absolute w-[215px] rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
              style={{
                backgroundColor: colors.surface,
                top: filterButtonLayout ? filterButtonLayout.y : 180,
                right: filterButtonLayout
                  ? Math.max(16, Dimensions.get('window').width - (filterButtonLayout.x + filterButtonLayout.width))
                  : 24,
              }}
            >
              <View className="py-1">
                {FILTER_OPTIONS.map((option, index) => {
                  const isSelected = selectedFilter === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      accessibilityRole="button"
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedFilter(option.id);
                        setShowFilterPanel(false);
                      }}
                      className={`flex-row items-center py-2.5 px-3 ${index < FILTER_OPTIONS.length - 1 ? 'border-b border-[#F1F5F9]' : ''
                        }`}
                      style={isSelected ? { backgroundColor: colors.primary + '12' } : undefined}
                    >
                      <View className="flex-row items-center justify-between flex-1">
                        <View className="flex-row items-center gap-3">
                          <View
                            style={{
                              // backgroundColor: isSelected ? colors.primary + '20' : '#F1F5F9',
                            }}
                            className="w-8 h-8 items-center justify-center"
                          >
                            <Icon
                              name={option.icon}
                              size={18}
                              color={isSelected ? colors.primary : '#64748B'}
                            />
                          </View>
                          <View className="flex-row items-center gap-2">
                            <Text
                              style={{
                                color: isSelected ? colors.primary : '#1E293B',
                                fontWeight: isSelected ? '700' : '500',
                              }}
                              className="text-base"
                            >
                              {option.label}
                            </Text>
                            <Text
                              style={{
                                color: isSelected ? colors.primary : '#94A3B8',
                              }}
                              className="text-base font-normal"
                            >
                              ({getOptionCount(option.id)})
                            </Text>
                          </View>
                        </View>
                        {isSelected && (
                          <Icon name="check" size={18} color={colors.primary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full Height Checklist Items BottomSheet */}
      <ChecklistItemsBottomSheet
        visible={!!activeChecklist}
        activeChecklist={activeChecklist}
        items={activeItems}
        travelId={travelId}
        onClose={() => setActiveChecklist(null)}
        onToggle={handleToggle}
        onDelete={handleDeleteChecklistItem}
      />

      {/* Create New Checklist Group Modal */}
      <ChecklistGroupModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        travelId={travelId}
      />
    </>
  );
};

export default ChecklistTab;
