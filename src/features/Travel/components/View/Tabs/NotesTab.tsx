import React from "react";
import { View, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";
import { TravelPlan, ItineraryNote } from "../../../../Travel/types/TravelDto";
import { useItineraryNotes } from "../../../hooks/useNote";

interface NotesTabProps {
  travelPlan: TravelPlan;
  onEditNote?: (note: ItineraryNote) => void;
}

const NotesTab = ({ travelPlan, onEditNote }: NotesTabProps) => {
  const { colors } = useTheme();
  const { data: notes, isLoading } = useItineraryNotes(travelPlan.travel.id || "");

  if (isLoading) {
    return (
      <View className="items-center justify-center py-10">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const sortedNotes = notes
    ? [...notes].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    : [];

  if (sortedNotes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center h-[300px] px-8">
        <Icon name="note-add" size={52} color="#D1D5DB" />
        <Text className="text-sm text-gray-400 tracking-wider leading-5 mt-3 text-center">
          No notes yet. Tap + to add your first note.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-4 py-2 gap-3">
      {sortedNotes.map((note) => (
        <TouchableOpacity
          key={note.id}
          activeOpacity={0.8}
          accessibilityRole="button"
          onPress={() => onEditNote?.(note)}
          className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden"
        >
          {/* Images preview strip */}
          {note.images && note.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-gray-50">
              {note.images.map((uri, idx) => (
                <Image
                  key={`${note.id}-img-${idx}`}
                  source={{ uri }}
                  style={{ width: 120, height: 90, marginRight: 2 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          <View className="p-4">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="text-base font-bold text-[#1A1A1A]" numberOfLines={1}>
                  {note.title}
                </Text>
                {note.content ? (
                  <Text className="text-sm text-gray-500 mt-1 leading-5" numberOfLines={3}>
                    {note.content}
                  </Text>
                ) : null}
              </View>
              <Icon name="chevron-right" size={22} color="#BDBDBD" />
            </View>

            <View className="flex-row items-center justify-between mt-3">
              <View className="flex-row items-center gap-1">
                <Icon name="schedule" size={13} color={colors.onSurfaceVariant} />
                <Text className="text-xs text-gray-400">
                  {note.createdAt
                    ? new Date(note.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      }) + " " + new Date(note.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </Text>
              </View>
              {note.images && note.images.length > 0 && (
                <View className="flex-row items-center gap-1">
                  <Icon name="photo" size={13} color={colors.onSurfaceVariant} />
                  <Text className="text-xs text-gray-400">{note.images.length}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default NotesTab;
