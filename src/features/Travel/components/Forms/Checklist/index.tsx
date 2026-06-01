import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
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
  useSaveChecklistItemMutation,
} from "../../../hooks/useChecklist";
import { ChecklistItem, ItineraryActivity } from "../../../types/TravelDto";
import { ContextOption } from "../../Lookups/ContextLookupModal";

interface EditChecklistItemProps {
  travelId: string;
  checklistItem: ChecklistItem | null;
  activities?: ItineraryActivity[];
  onClose: () => void;
  onScroll?: (event: any) => void;
  onOpenNewGroupModal?: () => void;
  selectedContext: ContextOption | null;
  onSelectContext: (context: ContextOption | null) => void;
  onOpenContextModal: () => void;
}

const EditChecklistItem = ({
  travelId,
  checklistItem,
  activities = [],
  onClose,
  onScroll,
  onOpenNewGroupModal,
  selectedContext,
  onSelectContext,
  onOpenContextModal,
}: EditChecklistItemProps) => {
  const { colors } = useTheme();
  const { userToken } = useAuth();
  const saveItemMutation = useSaveChecklistItemMutation();

  // Form State
  const [title, setTitle] = useState(checklistItem?.title || "");
  const [description, setDescription] = useState(checklistItem?.description || "");

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
            onPress={onOpenContextModal}
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
                  onSelectContext(null);
                }}
              >
                <Icon name="close" size={18} color="#666" />
              </TouchableOpacity>
            )}
            <Icon name="keyboard-arrow-down" size={22} color="#666" />
          </TouchableOpacity>
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
