import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput as RNTextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Formik } from "formik";
import * as Yup from "yup";
import TouchButton from "../../../../components/atoms/TouchButton";
import { ChecklistGroup, ChecklistItem, ItineraryActivity } from "../../types/TravelDto";
import { ActivityType } from "../../../../types/enums";
import ActivityIcon from "../../../../components/ActivityIcon";
import {
  useChecklistGroups,
  useChecklistItems,
  useSaveChecklistGroupMutation,
  useSaveChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useToggleChecklistItemMutation,
} from "../../hooks/useChecklist";
import { useTravelContext } from "../../../../context/TravelContext";
import { useAuth } from "../../../Auth/hooks/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Group Form Schema ────────────────────────────────────────────────────────

const GroupSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
});

// ─── Main Component ───────────────────────────────────────────────────────────

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

  // UI State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedContext, setSelectedContext] = useState<ContextOption | null>(null);
  const [showContextDropdown, setShowContextDropdown] = useState(false);

  // New item form state
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [showDescriptionField, setShowDescriptionField] = useState(false);

  // ─── Context Options (groups + activities interleaved) ─────────────────────

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

  // ─── Add Item ───────────────────────────────────────────────────────────────

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

  // ─── Toggle Item ────────────────────────────────────────────────────────────

  const handleToggle = async (item: ChecklistItem) => {
    if (!item.id) return;
    await toggleItemMutation.mutateAsync({
      id: item.id,
      isDone: !item.isDone,
      userId: userToken || "current-user",
      travelId,
    });
  };

  // ─── Delete Item ────────────────────────────────────────────────────────────

  const handleDelete = (item: ChecklistItem) => {
    Alert.alert("Delete Item", `Remove "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteItemMutation.mutate({ id: item.id!, travelId }),
      },
    ]);
  };

  // ─── Save Group ─────────────────────────────────────────────────────────────

  const handleSaveGroup = async (values: { title: string; description: string }) => {
    await saveGroupMutation.mutateAsync({
      travelId,
      title: values.title,
      description: values.description || undefined,
      sortOrder: String(Date.now()),
      userId: userToken || "current-user",
      isOffline: true,
    });
    setShowGroupModal(false);
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
        className={`w-6 h-6 rounded-full border-2 items-center justify-center mt-0.5 flex-shrink-0 ${
          item.isDone ? "bg-[#0C4C8A] border-[#0C4C8A]" : "border-[#0C4C8A]"
        }`}
      >
        {item.isDone && <Icon name="check" size={14} color="#FFF" />}
      </TouchableOpacity>

      <View className="flex-1">
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
      </View>

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
    >
      <View className="px-4 py-2">
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-[#183B7A]">Checklist</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-gray-500 font-medium">
              {completedCount}/{items.length} done
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowGroupModal(true)}
              className="flex-row items-center gap-1 bg-[#0C4C8A]/10 px-3 py-1.5 rounded-full"
            >
              <Icon name="create-new-folder" size={16} color="#0C4C8A" />
              <Text className="text-xs text-[#0C4C8A] font-semibold">New Group</Text>
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
              <Icon name="folder" size={20} color="#0C4C8A" />
            ) : selectedContext?.type === "activity" ? (
              <ActivityIcon
                type={(selectedContext.activityType ?? ActivityType.none) as ActivityType}
                size={20}
                color="#0C4C8A"
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
                        <Icon name="folder" size={20} color="#0C4C8A" />
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
                        <Icon name="check" size={20} color="#0C4C8A" />
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
            <Icon name="playlist-add" size={20} color="#0C4C8A" />
            <Text className="text-xs text-gray-500 font-semibold tracking-wider uppercase">New Item</Text>
          </View>
          <RNTextInput
            className="border border-[#E0E0E0] rounded-[12px] px-4 py-3 text-base text-gray-800 bg-gray-50 mb-2"
            placeholder="Item title..."
            value={newItemTitle}
            onChangeText={setNewItemTitle}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          {showDescriptionField ? (
            <RNTextInput
              className="border border-[#E0E0E0] rounded-[12px] px-4 py-3 text-base text-gray-800 bg-gray-50 mb-3"
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
              <Text className="text-xs text-[#0C4C8A] font-medium">+ Add description</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleAddItem}
            disabled={!newItemTitle.trim() || saveItemMutation.isPending}
            className={`flex-row items-center justify-center gap-2 py-3 rounded-[12px] ${
              newItemTitle.trim() ? "bg-[#0C4C8A]" : "bg-gray-200"
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
                <Icon name="folder" size={18} color="#0C4C8A" />
                <Text className="text-sm font-bold text-[#0C4C8A] uppercase tracking-wider flex-1">
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

      {/* ─── New Group Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={showGroupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-[30px] pt-2 pb-8">
              {/* Handle */}
              <View className="items-center mb-2">
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>

              {/* Header */}
              <View className="flex-row justify-between items-center px-5 py-3 border-b border-gray-100">
                <Text className="tracking-wider uppercase text-base text-gray-500 font-medium">
                  New Checklist Group
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setShowGroupModal(false)}
                >
                  <Icon name="clear" size={30} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <Formik
                initialValues={{ title: "", description: "" }}
                validationSchema={GroupSchema}
                onSubmit={handleSaveGroup}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                  <View className="px-5 pt-4">
                    <View className="mb-4">
                      <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase mb-1">
                        Group Title*
                      </Text>
                      <TextInput
                        mode="outlined"
                        placeholder="e.g. Documents, Clothing..."
                        value={values.title}
                        onChangeText={handleChange("title")}
                        onBlur={handleBlur("title")}
                        error={touched.title && Boolean(errors.title)}
                        outlineColor="#E0E0E0"
                        activeOutlineColor="#0C4C8A"
                        outlineStyle={{ borderRadius: 16 }}
                        style={{ marginTop: 4 }}
                        left={<TextInput.Icon icon="folder" />}
                      />
                      {touched.title && errors.title && (
                        <Text className="text-red-500 text-xs mt-1 ml-1">{errors.title}</Text>
                      )}
                    </View>

                    <View className="mb-6">
                      <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase mb-1">
                        Description (optional)
                      </Text>
                      <TextInput
                        mode="outlined"
                        placeholder="What kind of items go here?"
                        multiline
                        numberOfLines={3}
                        value={values.description}
                        onChangeText={handleChange("description")}
                        onBlur={handleBlur("description")}
                        outlineColor="#E0E0E0"
                        activeOutlineColor="#0C4C8A"
                        outlineStyle={{ borderRadius: 16 }}
                        style={{ marginTop: 4, minHeight: 90 }}
                        textAlignVertical="top"
                      />
                    </View>

                    <TouchButton
                      buttonText="Create Group"
                      onPress={() => handleSubmit()}
                      className="h-[56px]"
                    />
                  </View>
                )}
              </Formik>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

export default TripChecklist;
