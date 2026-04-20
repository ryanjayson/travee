import React from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity } from "react-native";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TripChecklistProps {
  checklistItems: ChecklistItem[];
  setChecklistItems: (items: ChecklistItem[]) => void;
  newItemText: string;
  setNewItemText: (text: string) => void;
}

const TripChecklist = ({
  checklistItems,
  setChecklistItems,
  newItemText,
  setNewItemText,
}: TripChecklistProps) => {
  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false,
      };
      setChecklistItems([...checklistItems, newItem]);
      setNewItemText("");
    }
  };

  const toggleItem = (id: string) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const deleteItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const totalCount = checklistItems.length;

  return (
    <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-[#183B7A] mb-3">Checklist</Text>
          <Text className="text-sm text-[#666] font-medium">
            {completedCount}/{totalCount} completed
          </Text>
        </View>

        <View className="flex-row mb-4">
          <TextInput
            className="flex-1 bg-white rounded-lg px-[15px] py-3 text-base border border-[#E0E0E0] mr-2.5"
            placeholder="Add new checklist item..."
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={addItem}
          />
          <TouchableOpacity className="bg-[#183B7A] rounded-lg w-11 h-11 justify-center items-center" onPress={addItem}>
            <Text className="text-white text-xl font-bold">+</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-xl shadow-sm shadow-black/10 elevation-3">
          {checklistItems.length > 0 ? (
            checklistItems.map((item) => (
              <View key={item.id} className="flex-row items-center py-3 px-4 border-b border-[#F0F0F0]">
                <TouchableOpacity
                  className={`w-5 h-5 rounded border-2 border-[#183B7A] mr-3 justify-center items-center ${item.completed ? 'bg-[#183B7A]' : ''}`}
                  onPress={() => toggleItem(item.id)}
                >
                  {item.completed && <Text className="text-white text-xs font-bold">✓</Text>}
                </TouchableOpacity>
                <Text
                  className={`flex-1 text-base text-[#183B7A] ${item.completed ? 'line-through text-[#999]' : ''}`}
                >
                  {item.text}
                </Text>
                <TouchableOpacity
                  className="p-2"
                  onPress={() => deleteItem(item.id)}
                >
                  <Text className="text-[#FF3B30] text-lg font-bold">×</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View className="p-10 items-center">
              <Text className="text-[#888] italic text-center mb-4">No checklist items yet.</Text>
              <Text className="text-[#999] text-sm text-center mt-2">
                Add items to keep track of your trip preparations!
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default TripChecklist;
