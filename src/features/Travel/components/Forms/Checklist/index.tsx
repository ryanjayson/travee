import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  TextInput as RNTextInput,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import ActivityIcon from "../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../types/enums";
import { useAuth } from "../../../../Auth/hooks/AuthContext";
import {
  useChecklistGroups,
  useSaveChecklistItemMutation,
} from "../../../hooks/useChecklist";
import { ChecklistItem, ItineraryActivity } from "../../../types/TravelDto";

type ContextType = "group" | "activity" | null;

interface ContextOption {
  id: string;
  label: string;
  type: ContextType;
  activityType?: ActivityType;
}

interface EditChecklistItemProps {
  travelId: string;
  checklistItem: ChecklistItem | null;
  activities?: ItineraryActivity[];
  onClose: () => void;
  onScroll?: (event: any) => void;
  onOpenNewGroupModal?: () => void;
}

const EditChecklistItem = ({
  travelId,
  checklistItem,
  activities = [],
  onClose,
  onScroll,
  onOpenNewGroupModal,
}: EditChecklistItemProps) => {
  const { colors } = useTheme();
  const { userToken } = useAuth();

  // Queries & Mutations
  const { data: groups = [], isLoading: groupsLoading } = useChecklistGroups(travelId);
  const saveItemMutation = useSaveChecklistItemMutation();

  // Form State
  const [title, setTitle] = useState(checklistItem?.title || "");
  const [description, setDescription] = useState(checklistItem?.description || "");
  const [selectedContext, setSelectedContext] = useState<ContextOption | null>(null);
  const [showContextDropdown, setShowContextDropdown] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");

  // Load existing selection if editing
  useEffect(() => {
    if (checklistItem) {
      setTitle(checklistItem.title);
      setDescription(checklistItem.description || "");
      if (checklistItem.checklistGroupId) {
        const matchingGroup = groups.find((g) => g.id === checklistItem.checklistGroupId);
        if (matchingGroup) {
          setSelectedContext({
            id: matchingGroup.id!,
            label: matchingGroup.title,
            type: "group",
          });
        }
      } else if (checklistItem.activityId) {
        const matchingActivity = activities.find((a) => a.id === checklistItem.activityId);
        if (matchingActivity) {
          setSelectedContext({
            id: matchingActivity.id!,
            label: matchingActivity.title || "Activity",
            type: "activity",
            activityType: (matchingActivity.type ?? ActivityType.none) as ActivityType,
          });
        }
      }
    }
  }, [checklistItem, groups, activities]);

  // Support auto-selecting a newly created group!
  // If groups length increases and the user clicked "New GroupTask", we can auto-select the latest group
  const prevGroupsLength = useRef(groups.length);
  useEffect(() => {
    if (groups.length > prevGroupsLength.current) {
      // Find the group with the highest createdAt/id or last item in the list
      const latestGroup = groups[groups.length - 1];
      if (latestGroup && latestGroup.id) {
        setSelectedContext({
          id: latestGroup.id,
          label: latestGroup.title,
          type: "group",
        });
      }
    }
    prevGroupsLength.current = groups.length;
  }, [groups]);

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
        label: a.title!,
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

  const handleSaveItem = async () => {
    if (!title.trim()) return;

    const payload: ChecklistItem = {
      id: checklistItem?.id || undefined,
      travelId,
      title: title.trim(),
      description: description.trim() || undefined,
      sortOrder: checklistItem?.sortOrder || String(Date.now()),
      isDone: checklistItem?.isDone || false,
      userId: userToken || "current-user",
      activityId: selectedContext?.type === "activity" ? selectedContext.id : undefined,
      checklistGroupId: selectedContext?.type === "group" ? selectedContext.id : undefined,
      isOffline: true,
    };

    await saveItemMutation.mutateAsync(payload);
    onClose();
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <Text className="text-xs font-semibold tracking-wider uppercase mb-4 text-gray-500">
          Item Details
        </Text>

        {/* Title */}
        <View className="mb-4">
          <TextInput
            mode="outlined"
            label="Item Title"
            placeholder="e.g. Pack passport, Buy travel insurance..."
            value={title}
            onChangeText={setTitle}
            outlineColor="#E0E0E0"
            activeOutlineColor={colors.primary}
            theme={{ colors: { onSurfaceVariant: "#888" } }}
            outlineStyle={{ borderWidth: 1, borderRadius: 16 }}
            style={{ height: 60 }}
            left={<TextInput.Icon icon="playlist-check" />}
          />
        </View>

        {/* Optional Description */}
        <View className="mb-4">
          <TextInput
            mode="outlined"
            label="Description (Optional)"
            placeholder="e.g. Located in red drawer, Needed before day 3..."
            value={description}
            onChangeText={setDescription}
            outlineColor="#E0E0E0"
            activeOutlineColor={colors.primary}
            theme={{ colors: { onSurfaceVariant: "#888" } }}
            outlineStyle={{ borderWidth: 1, borderRadius: 16 }}
            style={{ minHeight: 80 }}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Group / Activity Selector Header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-semibold tracking-wider uppercase text-gray-500">
            Categorise Task
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onOpenNewGroupModal}
            className="flex-row items-center gap-1 bg-[#263F69]/10 px-3 py-1.5 rounded-full"
          >
            <Icon name="create-new-folder" size={14} color="#263F69" />
            <Text className="text-xs text-[#263F69] font-bold">New GroupTask</Text>
          </TouchableOpacity>
        </View>

        {/* Selector Input */}
        <View className="mb-6 relative z-50">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowContextDropdown(!showContextDropdown)}
            className="flex-row items-center border border-[#E0E0E0] rounded-[16px] bg-white px-4 py-3 gap-3"
            style={{ height: 60 }}
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
            <Text className={`flex-1 text-base ${selectedContext ? "text-gray-800 font-medium" : "text-gray-400"}`}>
              {selectedContext ? selectedContext.label : "Assign to group or activity..."}
            </Text>
            {selectedContext && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setSelectedContext(null);
                  setGroupSearch("");
                }}
              >
                <Icon name="close" size={18} color="#666" />
              </TouchableOpacity>
            )}
            <Icon name="keyboard-arrow-down" size={22} color="#666" />
          </TouchableOpacity>

          {/* Context Dropdown List */}
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
              <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                {groupsLoading ? (
                  <View className="p-4 items-center">
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : filteredContextOptions.length === 0 ? (
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
                        <Text className="text-base text-gray-800 font-medium">{option.label}</Text>
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

        {/* Save/Submit Button */}
        <TouchableOpacity
          onPress={handleSaveItem}
          disabled={!title.trim() || saveItemMutation.isPending}
          style={{
            backgroundColor: colors.primary,
            opacity: title.trim() && !saveItemMutation.isPending ? 1 : 0.6,
          }}
          className="flex-row items-center justify-center p-4 rounded-[16px] shadow-sm mb-6"
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <View className="flex-row items-center gap-2">
            {saveItemMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Icon name="check" size={20} color={colors.onPrimary} />
            )}
            <Text className="text-white text-base font-semibold" style={{ color: colors.onPrimary }}>
              {saveItemMutation.isPending
                ? "Saving..."
                : checklistItem?.id
                ? "Save Changes"
                : "Add Checklist Item"}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default EditChecklistItem;
