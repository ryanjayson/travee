import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Platform,
} from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { useAuth } from "../../../Auth/hooks/AuthContext";
import { useSaveChecklistItemMutation } from "../../hooks/useChecklist";
import { ChecklistItem } from "../../types/TravelDto";
import { FadeInView } from "@/components/animations";

let activeOpenSwipeable: Swipeable | null = null;

export const closeActiveChecklistSwipeable = () => {
  if (activeOpenSwipeable) {
    activeOpenSwipeable.close();
    activeOpenSwipeable = null;
  }
};

export const ChecklistScrollContext = React.createContext<{
  scrollToRef?: (targetRef: React.RefObject<View | null> | View) => void;
}>({});

export const useChecklistScroll = () => React.useContext(ChecklistScrollContext);

export interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: (item: ChecklistItem) => void;
  onEdit?: (item: ChecklistItem) => void;
  onDelete?: (item: ChecklistItem) => void;
  isLast?: boolean;
}

export const ChecklistItemRow: React.FC<ChecklistItemRowProps> = ({
  item,
  onToggle,
  onEdit,
  onDelete,
  isLast = false,
}) => {
  const { colors } = useTheme();
  const primaryColor = colors.primary || "#263F69";
  const saveItemMutation = useSaveChecklistItemMutation();
  const { scrollToRef } = useChecklistScroll();
  const swipeableRef = useRef<Swipeable>(null);
  const isTogglingRef = useRef(false);
  const rowContainerRef = useRef<View>(null);

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description || "");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editTitleInputRef = useRef<TextInput>(null);
  const editDescInputRef = useRef<TextInput>(null);

  // Focus & blur management
  const isTitleFocusedRef = useRef(false);
  const isDescFocusedRef = useRef(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editTitleRef = useRef(editTitle);
  editTitleRef.current = editTitle;
  const editDescRef = useRef(editDescription);
  editDescRef.current = editDescription;
  const isSavingEditRef = useRef(false);

  useEffect(() => {
    if (!isEditing) {
      setEditTitle(item.title);
      setEditDescription(item.description || "");
    }
  }, [item.title, item.description, isEditing]);

  useEffect(() => {
    return () => {
      if (activeOpenSwipeable === swipeableRef.current) {
        activeOpenSwipeable = null;
      }
    };
  }, []);

  const handleStartEdit = () => {
    closeActiveChecklistSwipeable();
    swipeableRef.current?.close();
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setIsEditing(true);
    setTimeout(() => {
      editTitleInputRef.current?.focus();
      scrollToRef?.(rowContainerRef);
    }, 50);
  };

  const handleCancelEdit = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    isTitleFocusedRef.current = false;
    isDescFocusedRef.current = false;
    setIsEditing(false);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
  };

  const handleSaveEdit = async () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    const trimmedTitle = editTitleRef.current.trim();
    const trimmedDesc = editDescRef.current.trim();

    if (!trimmedTitle) {
      handleCancelEdit();
      return;
    }

    // If unchanged, just exit edit mode
    if (trimmedTitle === item.title && trimmedDesc === (item.description || "")) {
      setIsEditing(false);
      return;
    }

    if (isSavingEditRef.current) return;
    isSavingEditRef.current = true;
    setIsSavingEdit(true);

    try {
      const payload: ChecklistItem = {
        ...item,
        title: trimmedTitle,
        description: trimmedDesc || undefined,
      };
      await saveItemMutation.mutateAsync(payload);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating checklist item:", err);
    } finally {
      isSavingEditRef.current = false;
      setIsSavingEdit(false);
    }
  };

  const scheduleBlurCheck = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = setTimeout(() => {
      if (!isTitleFocusedRef.current && !isDescFocusedRef.current) {
        handleSaveEdit();
      }
    }, 150);
  };

  useEffect(() => {
    if (!isEditing) return;

    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        isTitleFocusedRef.current = false;
        isDescFocusedRef.current = false;
        handleSaveEdit();
      }
    );

    return () => {
      hideSub.remove();
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };
  }, [isEditing]);

  const handleToggleAction = (swipeable?: Swipeable) => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;
    (swipeable || swipeableRef.current)?.close();
    onToggle(item);
    setTimeout(() => {
      isTogglingRef.current = false;
    }, 400);
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragAnimatedValue: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-80, 0],
      extrapolate: "clamp",
    });

    const isDone = item.isDone;
    const actionBg = isDone ? "bg-amber-500" : "bg-emerald-600";
    const actionIcon = isDone ? "undo" : "check";
    const actionText = isDone ? "Undo" : "Done";

    return (
      <Animated.View
        style={{
          width: 80,
          transform: [{ translateX: trans }],
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            isDone
              ? `Mark ${item.title} as incomplete`
              : `Mark ${item.title} as complete`
          }
          onPress={() => handleToggleAction(swipeableRef.current || undefined)}
          activeOpacity={0.8}
          className={`flex-1 ${actionBg} items-center justify-center`}
        >
          <Icon name={actionIcon} size={24} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold mt-1">
            {actionText}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragAnimatedValue: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={{
          width: 80,
          transform: [{ translateX: trans }],
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.title}`}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete?.(item);
          }}
          activeOpacity={0.8}
          className="flex-1 bg-red-500 items-center justify-center"
        >
          <Icon name="delete-outline" size={24} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold mt-1">Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isEditing) {
    return (
      <FadeInView duration={50} delay={50}>
        <View
          ref={rowContainerRef}
          collapsable={false}
          className={`px-2 py-3 bg-gray-50 rounded-2xl`}
        >
          <View className="flex-row items-start gap-3">
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityLabel={
                item.isDone
                  ? `Mark ${item.title} as incomplete`
                  : `Mark ${item.title} as complete`
              }
              accessibilityState={{ checked: item.isDone }}
              onPress={() => onToggle(item)}
              activeOpacity={0.7}
              style={[
                { borderColor: primaryColor },
                item.isDone ? { backgroundColor: primaryColor } : undefined,
              ]}
              className="w-6 h-6 rounded-full border-2 items-center justify-center shrink-0 mt-1"
            >
              {item.isDone && <Icon name="check" size={14} color="#FFF" />}
            </TouchableOpacity>

            <View className="flex-1 pl-xs">
              <TextInput
                ref={editTitleInputRef}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="What needs to be done?"
                placeholderTextColor="#94A3B8"
                returnKeyType="done"
                onSubmitEditing={handleSaveEdit}
                onFocus={() => {
                  if (blurTimeoutRef.current) {
                    clearTimeout(blurTimeoutRef.current);
                    blurTimeoutRef.current = null;
                  }
                  isTitleFocusedRef.current = true;
                  scrollToRef?.(rowContainerRef);
                }}
                onBlur={() => {
                  isTitleFocusedRef.current = false;
                  scheduleBlurCheck();
                }}
                autoFocus
                editable={!isSavingEdit}
                className="text-lg font-medium text-gray-800 p-0 leading-relaxed"
                style={{ fontSize: 17 }}
              />
              <TextInput
                ref={editDescInputRef}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Add description"
                placeholderTextColor="#94A3B8"
                returnKeyType="done"
                onSubmitEditing={handleSaveEdit}
                onFocus={() => {
                  if (blurTimeoutRef.current) {
                    clearTimeout(blurTimeoutRef.current);
                    blurTimeoutRef.current = null;
                  }
                  isDescFocusedRef.current = true;
                  scrollToRef?.(rowContainerRef);
                }}
                onBlur={() => {
                  isDescFocusedRef.current = false;
                  scheduleBlurCheck();
                }}
                editable={!isSavingEdit}
                className="text-base text-gray-500 p-0 mt-1"
                style={{ fontSize: 14 }}
              />
            </View>

            {isSavingEdit && (
              <View className="items-center justify-center mt-1 mr-1">
                <ActivityIndicator size="small" color={primaryColor} />
              </View>
            )}
          </View>
        </View>
      </FadeInView>

    );
  }

  const rowContent = (
    <View
      ref={rowContainerRef}
      collapsable={false}
      className={`flex-row items-center gap-3 px-2 py-4 bg-white `}
    >
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityLabel={
          item.isDone
            ? `Mark ${item.title} as incomplete`
            : `Mark ${item.title} as complete`
        }
        accessibilityState={{ checked: item.isDone }}
        onPress={() => onToggle(item)}
        activeOpacity={0.7}
        style={[
          { borderColor: primaryColor },
          item.isDone ? { backgroundColor: primaryColor } : undefined,
        ]}
        className="w-6 h-6 rounded-full border-2 items-center justify-center shrink-0"
      >
        {item.isDone && <Icon name="check" size={14} color="#FFF" />}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleStartEdit}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.title}`}
        className="flex-1 align-top pl-xs"
      >
        <Text
          className={`text-lg leading-relaxed ${item.isDone
            ? "line-through text-gray-400"
            : "text-gray-800 font-medium"
            }`}
        >
          {item.title}
        </Text>
        {item.description ? (
          <Text className="text-base text-gray-400 mt-0.5">
            {item.description}
          </Text>
        ) : null}
      </TouchableOpacity>

      {onEdit && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Edit checklist item"
          onPress={handleStartEdit}
          activeOpacity={0.7}
          className="p-1 mr-1"
        >
          <Icon name="edit" size={20} color={"#98A2B3"} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (!onDelete && !onToggle) {
    return rowContent;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={40}
      rightThreshold={40}
      onSwipeableOpenStartDrag={() => {
        if (activeOpenSwipeable && activeOpenSwipeable !== swipeableRef.current) {
          activeOpenSwipeable.close();
          activeOpenSwipeable = null;
        }
      }}
      onSwipeableWillOpen={() => {
        if (activeOpenSwipeable && activeOpenSwipeable !== swipeableRef.current) {
          activeOpenSwipeable.close();
        }
        activeOpenSwipeable = swipeableRef.current;
      }}
      onSwipeableOpen={(direction, swipeable) => {
        activeOpenSwipeable = swipeableRef.current;
        if (direction === "left") {
          handleToggleAction(swipeable);
        }
      }}
      onSwipeableClose={() => {
        if (activeOpenSwipeable === swipeableRef.current) {
          activeOpenSwipeable = null;
        }
      }}
      renderLeftActions={onToggle ? renderLeftActions : undefined}
      renderRightActions={onDelete ? renderRightActions : undefined}
    >
      {rowContent}
    </Swipeable>
  );
};

export interface AddChecklistItemRowProps {
  travelId?: string;
  activityId?: string;
  checklistGroupId?: string;
  onAdd?: () => void;
  onSave?: (title: string, description?: string) => Promise<void> | void;
  label?: string;
  hasBottomBorder?: boolean;
}

export const AddChecklistItemRow: React.FC<AddChecklistItemRowProps> = ({
  travelId,
  activityId,
  checklistGroupId,
  onAdd,
  onSave,
  label = "Add",
  hasBottomBorder = false,
}) => {
  const { colors } = useTheme();
  const { userToken } = useAuth();
  const primaryColor = colors.primary || "#263F69";
  const saveItemMutation = useSaveChecklistItemMutation();
  const { scrollToRef } = useChecklistScroll();

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addContainerRef = useRef<View>(null);
  const titleInputRef = useRef<TextInput>(null);
  const descInputRef = useRef<TextInput>(null);

  // Focus & blur management
  const isTitleFocusedRef = useRef(false);
  const isDescFocusedRef = useRef(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef(title);
  titleRef.current = title;
  const descriptionRef = useRef(description);
  descriptionRef.current = description;
  const isSavingRef = useRef(false);

  const handleStartAdding = () => {
    closeActiveChecklistSwipeable();
    if (onAdd && !travelId && !onSave) {
      onAdd();
      return;
    }
    setIsAdding(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      scrollToRef?.(addContainerRef);
    }, 50);
  };

  const handleCancel = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    isTitleFocusedRef.current = false;
    isDescFocusedRef.current = false;
    setIsAdding(false);
    setTitle("");
    setDescription("");
  };

  const handleSave = async () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    const trimmedTitle = titleRef.current.trim();
    const trimmedDesc = descriptionRef.current.trim();

    if (!trimmedTitle) {
      handleCancel();
      return;
    }

    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      if (onSave) {
        await onSave(trimmedTitle, trimmedDesc || undefined);
      } else if (travelId) {
        const payload: ChecklistItem = {
          travelId,
          title: trimmedTitle,
          description: trimmedDesc || undefined,
          sortOrder: String(Date.now()),
          isDone: false,
          userId: userToken || "current-user",
          activityId: activityId || undefined,
          checklistGroupId: checklistGroupId || undefined,
          isOffline: true,
        };
        await saveItemMutation.mutateAsync(payload);
      }
      setTitle("");
      setDescription("");
      setIsAdding(false);
    } catch (err) {
      console.error("Error saving inline checklist item:", err);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const scheduleBlurCheck = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = setTimeout(() => {
      if (!isTitleFocusedRef.current && !isDescFocusedRef.current) {
        handleSave();
      }
    }, 150);
  };

  useEffect(() => {
    if (!isAdding) return;

    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        isTitleFocusedRef.current = false;
        isDescFocusedRef.current = false;
        handleSave();
      }
    );

    return () => {
      hideSub.remove();
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };
  }, [isAdding]);

  if (!isAdding) {
    return (
      <View
        ref={addContainerRef}
        collapsable={false}
        className={`flex-row items-center gap-3 px-2 py-5 bg-white ${hasBottomBorder ? "border-b border-gray-200" : ""
          }`}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${label} To-Do item`}
          onPress={handleStartAdding}
          activeOpacity={0.7}
          className="flex-row items-center gap-1 flex-1"
        >
          <View className="flex-row items-center rounded-full border border-dashed border-gray-400 gap-1 px-3 py-3" />
          <Text className="text-lg text-secondary/50 pl-md">{label}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      ref={addContainerRef}
      collapsable={false}
      className={`px-2 py-3 bg-gray-50 rounded-2xl ${hasBottomBorder ? "border-b border-gray-200" : ""
        }`}

    >
      <View className="flex-row items-start gap-3">
        {/* Dashed circle aligning with checkbox */}
        <View className="w-6 h-6 rounded-full border border-dashed border-gray-400 items-center justify-center shrink-0 mt-1" />

        {/* Input fields */}
        <View className="flex-1 pl-xs">
          <TextInput
            ref={titleInputRef}
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            placeholderTextColor="#94A3B8"
            returnKeyType="done"
            onSubmitEditing={handleSave}
            onFocus={() => {
              if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
                blurTimeoutRef.current = null;
              }
              isTitleFocusedRef.current = true;
              scrollToRef?.(addContainerRef);
            }}
            onBlur={() => {
              isTitleFocusedRef.current = false;
              scheduleBlurCheck();
            }}
            autoFocus
            editable={!isSaving}
            className="text-lg font-medium text-gray-800 p-0 leading-relaxed"
            style={{ fontSize: 17 }}
          />
          <TextInput
            ref={descInputRef}
            value={description}
            onChangeText={setDescription}
            placeholder="Add description"
            placeholderTextColor="#94A3B8"
            returnKeyType="done"
            onSubmitEditing={handleSave}
            onFocus={() => {
              if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
                blurTimeoutRef.current = null;
              }
              isDescFocusedRef.current = true;
              scrollToRef?.(addContainerRef);
            }}
            onBlur={() => {
              isDescFocusedRef.current = false;
              scheduleBlurCheck();
            }}
            editable={!isSaving}
            className="text-base text-gray-500 p-0 mt-1"
            style={{ fontSize: 14 }}
          />
        </View>

        {/* Loading indicator when saving */}
        {isSaving && (
          <View className="items-center justify-center mt-1 mr-1">
            <ActivityIndicator size="small" color={primaryColor} />
          </View>
        )}
      </View>
    </View>
  );
};

export default ChecklistItemRow;
