import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useItineraryNotesByActivity } from "../../../../hooks/useNote";
import { ItineraryNote } from "../../../../types/TravelDto";

// ─── Relative time helper ─────────────────────────────────────────────────────
function relativeTime(date?: Date | string): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ─── Single note card ─────────────────────────────────────────────────────────
interface NoteCardProps {
  item: ItineraryNote;
  onPress: (item: ItineraryNote) => void;
}

const NoteCard = ({ item, onPress }: NoteCardProps) => (
  <TouchableOpacity
    className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 shadow-sm active:bg-gray-50"
    onPress={() => onPress(item)}
    accessibilityRole="button"
    accessibilityLabel={`Edit note: ${item.title}`}
  >
    <View className="flex-row justify-between items-start">
      <View className="flex-1 pr-2">
        <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
          {item.title}
        </Text>
        {item.content ? (
          <Text className="text-sm text-gray-500 mt-1 leading-5" numberOfLines={3}>
            {item.content}
          </Text>
        ) : (
          <Text className="text-sm text-gray-300 italic mt-1">No content</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginTop: 2 }} />
    </View>

    <View className="flex-row items-center mt-3 pt-2.5 border-t border-gray-100">
      <Ionicons name="time-outline" size={12} color="#9CA3AF" />
      <Text className="text-xs text-gray-400 ml-1">{relativeTime(item.createdAt)}</Text>
    </View>
  </TouchableOpacity>
);

// ─── Main tab ─────────────────────────────────────────────────────────────────
interface NotesTabProps {
  activityId: string;
  onEditNote: (note: ItineraryNote) => void;
}

const NotesTab = ({ activityId, onEditNote }: NotesTabProps) => {
  const { data: notes, isLoading, isError, refetch } = useItineraryNotesByActivity(activityId);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator size="small" color="#263F69" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center py-10 px-6">
        <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
        <Text className="text-red-500 text-sm mt-2 text-center">Failed to load notes.</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 px-5 py-2 bg-red-50 rounded-full"
          accessibilityRole="button"
        >
          <Text className="text-red-500 text-sm font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-10 px-6">
        <View className="w-16 h-16 rounded-full bg-yellow-50 justify-center items-center mb-3">
          <Ionicons name="document-text-outline" size={32} color="#FCD34D" />
        </View>
        <Text className="text-base font-semibold text-gray-600">No notes yet</Text>
        <Text className="text-sm text-gray-400 mt-1 text-center">
          Tap the + button to add your first note.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 16, paddingBottom: 100 }}>
      {notes.map((item) => (
        <NoteCard key={item.id} item={item} onPress={onEditNote} />
      ))}
    </View>
  );
};

export default NotesTab;
