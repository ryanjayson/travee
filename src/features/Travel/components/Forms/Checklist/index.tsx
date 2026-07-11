import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput, useTheme, Checkbox } from "react-native-paper";
import TouchButton from "../../../../../components/atoms/TouchButton";
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
  const [keepAdding, setKeepAdding] = useState(true);
  const titleInputRef = useRef<any>(null);

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
    if (!checklistItem?.id && keepAdding) {
      setTitle("");
      setDescription("");
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    } else {
      onClose();
    }
  };

  return (
    <View className="flex-1 bg-white rounded-t-[20px] overflow-hidden">
      <ScrollView
        className="flex-1 p-[15px] bg-gray-100"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Title */}
        <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase">Title</Text>
          <TextInput
            ref={titleInputRef}
            mode="outlined"
            className="h-7xl!"
            placeholder="e.g. Pack Passport"
            value={title}
            onChangeText={setTitle}
            outlineColor="#E0E0E0"
            activeOutlineColor="#263F69"
            theme={{ colors: { onSurfaceVariant: "#888" } }}
            outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
            style={{ marginTop: 6 }}
            contentStyle={{ backgroundColor: "transparent" }}
          />
        </View>

        {/* Optional Description */}
        <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase">Description</Text>
          <TextInput
            mode="outlined"
            placeholder="Add a description"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            outlineColor="#E0E0E0"
            activeOutlineColor="#263F69"
            theme={{ colors: { onSurfaceVariant: "#888" } }}
            outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
            style={{ marginTop: 6, height: 120 }}
            textAlignVertical="top"
            contentStyle={{ backgroundColor: "transparent" }}
          />
        </View>

        {/* Group / Activity Selector Header */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold tracking-wider uppercase text-secondary">
              Item assignment
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onOpenNewGroupModal}
              className="flex-row items-center gap-1 bg-[#263F69]/10 px-3 py-1.5 rounded-3xl"
            >
              <Icon name="create-new-folder" size={24} color="#263F69" />
              <Text className="text-base text-[#263F69] font-medium">Create Category</Text>
            </TouchableOpacity>
          </View>

          {/* Selector Input */}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onOpenContextModal}
            className="flex-row items-center border border-[#E0E0E0] rounded-[16px] bg-white px-4 py-3 gap-3 mt-2"
            style={{ height: 64 }}
          >
            {selectedContext?.type === "group" ? (
              <Icon name="folder" size={20} color="#263F69" />
            ) : selectedContext?.type === "activity" ? (
              <ActivityIcon
                type={(selectedContext.activityType ?? ActivityType.none) as ActivityType}
                size={24}
                color="#263F69"
                showIconOnly
              />
            ) : (
              <Icon name="layers" size={24} color="#BDBDBD" />
            )}
            <Text className={`flex-1 text-base ${selectedContext ? "text-gray-800 font-medium" : "text-tertiary"}`}>
              {selectedContext ? selectedContext.label : "Assign to group or activity"}
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

        {/* Checkbox: Add another item */}
        {!checklistItem?.id && (
          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityLabel="Keep adding checklist items"
            onPress={() => setKeepAdding(!keepAdding)}
            className="flex-row items-center gap-2 mb-0"
          >
            <Checkbox.Android
              status={keepAdding ? "checked" : "unchecked"}
              onPress={() => setKeepAdding(!keepAdding)}
              color="#263F69"
            />
            <Text className="text-base font-medium text-gray-700">
              Add another item after saved
            </Text>
          </TouchableOpacity>
        )}

         <View className="mb-5"></View>
      </ScrollView>

      {/* Save/Submit Button (Fixed Bottom) */}
      <View className="px-5 py-4 bg-gray-100">
        <TouchButton
          buttonText={saveItemMutation.isPending
            ? "Saving..."
            : checklistItem?.id
            ? "Save Changes"
            : "Add Checklist Item"}
          onPress={handleSaveItem}
          disabled={!title.trim() || saveItemMutation.isPending}
          className="h-[64px] p-6"
        />
      </View> 
    </View>
  );
};

export default EditChecklistItem;
