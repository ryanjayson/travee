import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  TextInput as RNTextInput,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";
import ActivityIcon from "../../../../components/ActivityIcon";
import { useConfirm } from "../../../../context/ConfirmContext";
import { useTravelContext } from "../../../../context/TravelContext";
import { ActivityType } from "../../../../types/enums";
import { useAuth } from "../../../Auth/hooks/AuthContext";
import {
  useChecklistGroups,
  useChecklistItems,
  useDeleteChecklistItemMutation,
  useSaveChecklistGroupMutation,
  useSaveChecklistItemMutation,
  useToggleChecklistItemMutation,
} from "../../hooks/useChecklist";
import { ChecklistItem, ItineraryActivity } from "../../types/TravelDto";
import ChecklistGroupModal from "./Checklist/ChecklistGroupModal";
import ChecklistModal from "./Checklist/Modal";


type ContextType = "group" | "activity" | null;

interface ContextOption {
  id: string;
  label: string;
  type: ContextType;
  activityType?: ActivityType;
}

interface TripChecklistProps {
  activities?: ItineraryActivity[];
}


const TripChecklist = ({ activities = [] }: TripChecklistProps) => {
  const { colors } = useTheme();
  const { selectedTravelPlan } = useTravelContext();
  const { userToken } = useAuth();
  const travelId = selectedTravelPlan?.id || "";

  // Queries & Mutations
  const { data: groups = [], isLoading: groupsLoading } = useChecklistGroups(travelId);
  const { data: items = [], isLoading: itemsLoading } = useChecklistItems(travelId);
  const saveGroupMutation = useSaveChecklistGroupMutation();
  const saveItemMutation = useSaveChecklistItemMutation();
  const deleteItemMutation = useDeleteChecklistItemMutation();
  const toggleItemMutation = useToggleChecklistItemMutation();

  const { confirm } = useConfirm();

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);

  const handleEditItem = (item: ChecklistItem) => {
    setSelectedItem(item);
    setShowChecklistModal(true);
  };
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedContext, setSelectedContext] = useState<ContextOption | null>(null);
  const [showContextDropdown, setShowContextDropdown] = useState(false);

  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [showDescriptionField, setShowDescriptionField] = useState(false);

  const contextOptions = useMemo<ContextOption[]>(() => {
    const groupOpts: ContextOption[] = groups.map((g) => ({
      id: g.id!,
      label: g.title,
      type: "group",
    }));
    const activityOpts: ContextOption[] = activities
      .filter((a) => !!a.id && !!a.title)
      .map((a) => ({
        id: a.id!,
        label: a.title,
        type: "activity",
        activityType: (a.type ?? ActivityType.none) as ActivityType,
      }));
    return [...groupOpts, ...activityOpts];
  }, [groups, activities]);

  const filteredContextOptions = useMemo(() => {
    if (!groupSearch.trim()) return contextOptions;
    return contextOptions.filter((o) =>
      o.label.toLowerCase().includes(groupSearch.toLowerCase())
    );
  }, [contextOptions, groupSearch]);

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;

    const sortOrder = String(Date.now());
    const payload: ChecklistItem = {
      travelId,
      title: newItemTitle.trim(),
      description: newItemDescription.trim() || undefined,
      sortOrder,
      isDone: false,
      userId: userToken || "current-user",
      activityId: selectedContext?.type === "activity" ? selectedContext.id : undefined,
      checklistGroupId: selectedContext?.type === "group" ? selectedContext.id : undefined,
      isOffline: true,
    };

    await saveItemMutation.mutateAsync(payload);
    setNewItemTitle("");
    setNewItemDescription("");
    setShowDescriptionField(false);
  };


  const handleToggle = async (item: ChecklistItem) => {
    if (!item.id) return;
    await toggleItemMutation.mutateAsync({
      id: item.id,
      isDone: !item.isDone,
      userId: userToken || "current-user",
      travelId,
    });
  };


  const handleDelete = async (item: ChecklistItem) => {
    const isConfirmed = await confirm({
      title: "Delete Item",
      message: `Remove "${item.title}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });
    if (isConfirmed) {
      deleteItemMutation.mutate({ id: item.id!, travelId });
    }
  };



  // ─── Render Items grouped by context ───────────────────────────────────────

  const ungroupedItems = items.filter((i) => !i.checklistGroupId && !i.activityId);
  const completedCount = items.filter((i) => i.isDone).length;

  const renderItem = (item: ChecklistItem) => (
    <View
      key={item.id}
      className="bg-white rounded-[16px] border border-gray-100 shadow-sm mb-2 px-4 py-3 flex-row items-start gap-3"
    >
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => handleToggle(item)}
        className={`w-6 h-6 rounded-full border-2 items-center justify-center mt-0.5 shrink-0 ${
          item.isDone ? "bg-[#263F69] border-[#263F69]" : "border-[#263F69]"
        }`}
      >
        {item.isDone && <Icon name="check" size={14} color="#FFF" />}
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => handleEditItem(item)}
        className="flex-1"
      >
        <Text
          className={`text-base font-medium ${
            item.isDone ? "line-through text-gray-400" : "text-[#1A1A1A]"
          }`}
        >
          {item.title}
        </Text>
        {item.description ? (
          <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        {item.isDone && item.checkedBy && (
          <Text className="text-[10px] text-gray-400 mt-1">
            Done by {item.checkedBy}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => handleEditItem(item)}
        className="p-1 opacity-40"
      >
        <Icon name="edit" size={18} color="#263F69" />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => handleDelete(item)}
        className="p-1 opacity-40"
      >
        <Icon name="delete-outline" size={18} color="#c93030" />
      </TouchableOpacity>
    </View>
  );

  if (groupsLoading || itemsLoading) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20 }}
    >
      <View className="">
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <View className="flex-1 mb-4">
          <Text className="text-xl font-semibold ">Trip Checklist</Text>
          <Text className="text-base font-normal text-gray-400 mb-5">
          Your trip prep, simplified. Keep track of everything you need for a smooth and stress-free journey.
          </Text>

          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-gray-500 font-medium">
              {completedCount}/{items.length} done
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowGroupModal(true)}
              className="flex-row items-center gap-1 bg-[#263F69]/10 px-3 py-1.5 rounded-full"
            >
              <Icon name="create-new-folder" size={16} color="#263F69" />
              <Text className="text-xs text-[#263F69] font-semibold">New Group</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Context Selector ────────────────────────────────────────────── */}
        <View className="mb-3">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowContextDropdown(!showContextDropdown)}
            className="flex-row items-center border border-[#E0E0E0] rounded-[16px] bg-white px-4 py-3 gap-3"
          >
            {selectedContext?.type === "group" ? (
              <Icon name="folder" size={20} color="#263F69" />
            ) : selectedContext?.type === "activity" ? (
              <ActivityIcon
                type={(selectedContext.activityType ?? ActivityType.none) as ActivityType}
                size={20}
                color="#263F69"
              />
            ) : (
              <Icon name="layers" size={20} color="#BDBDBD" />
            )}
            <Text className={`flex-1 text-base ${selectedContext ? "text-gray-800" : "text-gray-400"}`}>
              {selectedContext ? selectedContext.label : "Add to group or activity..."}
            </Text>
            {selectedContext && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => { setSelectedContext(null); setGroupSearch(""); }}
              >
                <Icon name="close" size={18} color="#666" />
              </TouchableOpacity>
            )}
            <Icon name="keyboard-arrow-down" size={22} color="#666" />
          </TouchableOpacity>

          {/* Dropdown */}
          {showContextDropdown && (
            <View className="bg-white border border-gray-200 rounded-[16px] mt-1 shadow-md overflow-hidden z-50">
              <View className="flex-row items-center border-b border-gray-100 px-3">
                <Icon name="search" size={18} color="#999" />
                <RNTextInput
                  className="flex-1 py-3 px-2 text-base text-gray-800"
                  placeholder="Search groups or activities..."
                  value={groupSearch}
                  onChangeText={setGroupSearch}
                  autoFocus
                />
              </View>
              <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                {filteredContextOptions.length === 0 ? (
                  <View className="p-4 items-center">
                    <Text className="text-gray-400 text-sm">No matches found</Text>
                  </View>
                ) : (
                  filteredContextOptions.map((option) => (
                    <TouchableOpacity
                      key={`${option.type}-${option.id}`}
                      accessibilityRole="button"
                      className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-50"
                      onPress={() => {
                        setSelectedContext(option);
                        setShowContextDropdown(false);
                        setGroupSearch("");
                      }}
                    >
                      {option.type === "group" ? (
                        <Icon name="folder" size={20} color="#263F69" />
                      ) : (
                        <ActivityIcon
                          type={(option.activityType ?? ActivityType.none) as ActivityType}
                          size={20}
                          color="#666"
                        />
                      )}
                      <View className="flex-1">
                        <Text className="text-base text-gray-800">{option.label}</Text>
                        <Text className="text-xs text-gray-400 capitalize">{option.type}</Text>
                      </View>
                      {selectedContext?.id === option.id && (
                        <Icon name="check" size={20} color="#263F69" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ─── Add Item Card ────────────────────────────────────────────────── */}
        <View className="bg-white border border-[#E0E0E0] rounded-[20px] p-4 mb-5 shadow-sm">
          <View className="flex-row items-center gap-2 mb-2">
            <Icon name="playlist-add" size={20} color="#263F69" />
            <Text className="text-xs font-semibold tracking-wider uppercase">New Item</Text>
          </View>
          <RNTextInput
            className="border border-[#E0E0E0] rounded-xl px-4 py-3 text-base text-gray-800 bg-gray-50 mb-2"
            placeholder="Item title..."
            value={newItemTitle}
            onChangeText={setNewItemTitle}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          {showDescriptionField ? (
            <RNTextInput
              className="border border-[#E0E0E0] rounded-xl px-4 py-3 text-base text-gray-800 bg-gray-50 mb-3"
              placeholder="Optional description..."
              value={newItemDescription}
              onChangeText={setNewItemDescription}
              multiline
              numberOfLines={2}
            />
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowDescriptionField(true)}
              className="mb-3"
            >
              <Text className="text-xs text-[#263F69] font-medium">+ Add description</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleAddItem}
            disabled={!newItemTitle.trim() || saveItemMutation.isPending}
            className={`flex-row items-center justify-center gap-2 py-3 rounded-xl ${
              newItemTitle.trim() ? "bg-[#263F69]" : "bg-gray-200"
            }`}
          >
            {saveItemMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Icon name="add" size={20} color={newItemTitle.trim() ? "#FFF" : "#AAA"} />
                <Text className={`font-semibold text-base ${newItemTitle.trim() ? "text-white" : "text-gray-400"}`}>
                  Add to {selectedContext ? selectedContext.label : "Checklist"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ─── Grouped Items ────────────────────────────────────────────────── */}
        {groups.map((group) => {
          const groupItems = items.filter((i) => i.checklistGroupId === group.id);
          const doneCount = groupItems.filter((i) => i.isDone).length;
          return (
            <View key={group.id} className="mb-5">
              <View className="flex-row items-center gap-2 mb-2">
                <Icon name="folder" size={18} color="#263F69" />
                <Text className="text-sm font-bold text-[#263F69] uppercase tracking-wider flex-1">
                  {group.title}
                </Text>
                <Text className="text-xs text-gray-400">{doneCount}/{groupItems.length}</Text>
              </View>
              {group.description ? (
                <Text className="text-xs text-gray-500 mb-2 ml-6">{group.description}</Text>
              ) : null}
              {groupItems.length === 0 ? (
                <View className="bg-gray-50 border border-dashed border-gray-200 rounded-[14px] p-4 items-center">
                  <Text className="text-gray-400 text-sm">No items in this group yet.</Text>
                </View>
              ) : (
                groupItems.map(renderItem)
              )}
            </View>
          );
        })}

        {/* ─── Activity-linked items ────────────────────────────────────────── */}
        {activities.map((activity) => {
          const activityItems = items.filter((i) => i.activityId === activity.id);
          if (activityItems.length === 0) return null;
          const doneCount = activityItems.filter((i) => i.isDone).length;
          return (
            <View key={`activity-${activity.id}`} className="mb-5">
              <View className="flex-row items-center gap-2 mb-2">
                <ActivityIcon
                  type={(activity.type ?? ActivityType.none) as ActivityType}
                  size={18}
                  color="#666"
                />
                <Text className="text-sm font-bold text-gray-600 flex-1">{activity.title}</Text>
                <Text className="text-xs text-gray-400">{doneCount}/{activityItems.length}</Text>
              </View>
              {activityItems.map(renderItem)}
            </View>
          );
        })}

        {/* ─── Ungrouped Items ─────────────────────────────────────────────── */}
        {ungroupedItems.length > 0 && (
          <View className="mb-5">
            <View className="flex-row items-center gap-2 mb-2">
              <Icon name="list" size={18} color="#888" />
              <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider">General</Text>
              <Text className="text-xs text-gray-400 ml-auto">
                {ungroupedItems.filter((i) => i.isDone).length}/{ungroupedItems.length}
              </Text>
            </View>
            {ungroupedItems.map(renderItem)}
          </View>
        )}

        {items.length === 0 && groups.length === 0 && (
          <View className="items-center py-12">
            <Icon name="playlist-add-check" size={52} color="#D1D5DB" />
            <Text className="text-sm text-gray-400 mt-3 text-center">
              No checklist items yet.{"\n"}Add your first item above!
            </Text>
          </View>
        )}
      </View>

      <ChecklistGroupModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        travelId={travelId}
      />

      <ChecklistModal
        visible={showChecklistModal}
        checklistItem={selectedItem}
        activities={activities}
        onClose={() => setShowChecklistModal(false)}
        travelId={travelId}
        onOpenNewGroupModal={() => setShowGroupModal(true)}
      />
    </ScrollView>
  );
};

export default TripChecklist;
