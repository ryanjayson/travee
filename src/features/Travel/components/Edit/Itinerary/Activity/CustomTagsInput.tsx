import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput as RNTextInput,
} from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";

interface CustomTagsInputProps {
  tags?: string[] | null;
  onChangeTags: (tags: string[]) => void;
  placeholder?: string;
}

const CustomTagsInput: React.FC<CustomTagsInputProps> = ({
  tags,
  onChangeTags,
  placeholder = "Add tags (e.g. food, sightseeing)...",
}) => {
  const { colors } = useTheme();
  const [tagInput, setTagInput] = useState("");

  const currentTags = Array.isArray(tags) ? tags : [];

  const handleAddTag = () => {
    const raw = tagInput.trim();
    if (!raw) return;

    // Support comma-separated tags or single tag
    const parts = raw
      .split(",")
      .map((p) => p.trim().replace(/^#+/, ""))
      .filter(Boolean);

    if (parts.length === 0) return;

    const newTags = [...currentTags];
    parts.forEach((p) => {
      if (!newTags.some((existing) => existing.toLowerCase() === p.toLowerCase())) {
        newTags.push(p);
      }
    });

    onChangeTags(newTags);
    setTagInput("");
  };

  const handleRemoveTag = (indexToRemove: number) => {
    const updated = currentTags.filter((_, idx) => idx !== indexToRemove);
    onChangeTags(updated);
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.outlineVariant || "#E0E0E0",
          backgroundColor: colors.surface || "#FFFFFF",
        },
      ]}
    >
      {/* Existing Tag Chips */}
      {currentTags.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-2.5">
          {currentTags.map((tag, index) => (
            <View
              key={`${tag}-${index}`}
              style={[
                styles.tagChip,
                { backgroundColor: colors.surfaceVariant || "#F2F4F7" },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: colors.onSurfaceVariant || "#344054" },
                ]}
              >
                #{tag}
              </Text>
              <TouchableOpacity
                onPress={() => handleRemoveTag(index)}
                accessibilityRole="button"
                accessibilityLabel={`Remove tag ${tag}`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Icon
                  name="close"
                  size={14}
                  color={colors.onSurfaceVariant || "#98A2B3"}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Input Row */}
      <View className="flex-row items-center">
        <Icon
          name="label-outline"
          size={20}
          color={colors.onSurfaceVariant || "#98A2B3"}
          style={styles.inputIcon}
        />
        <RNTextInput
          placeholder={placeholder}
          placeholderTextColor={colors.onSurfaceVariant || "#98A2B3"}
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={handleAddTag}
          returnKeyType="done"
          blurOnSubmit={false}
          style={[
            styles.textInput,
            { color: colors.onSurface || "#1D2939" },
          ]}
        />
        {tagInput.trim().length > 0 && (
          <TouchableOpacity
            onPress={handleAddTag}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Add custom tag"
            activeOpacity={0.7}
          >
            <View style={styles.addButtonContent}>
              <Text style={[styles.addButtonLabel, { color: colors.onPrimary }]}>
                Add
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
    marginRight: 4,
  },
  closeButton: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonLabel: {
    fontWeight: "600",
    fontSize: 13,
  },
});

export default CustomTagsInput;
