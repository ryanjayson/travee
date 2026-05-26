import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { ExpenseCategory } from "../../../../types/enums";
import ExpenseCategoryIcon from "../Forms/Expense/ExpenseCategoryIcon";

interface ExpenseCategoryLookupModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory?: ExpenseCategory;
  onSelect: (category: ExpenseCategory) => void;
}

const ExpenseCategoryLookupModal = ({
  visible,
  onClose,
  selectedCategory,
  onSelect,
}: ExpenseCategoryLookupModalProps) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelect = (category: ExpenseCategory) => {
    onSelect(category);
    setSearchQuery(""); // reset search
    onClose();
  };

  const handleClose = () => {
    setSearchQuery(""); // reset search
    onClose();
  };

  const categories = Object.keys(ExpenseCategory)
    .filter((key) => isNaN(Number(key)) && key !== "None")
    .map((key) => {
      const categoryValue = ExpenseCategory[key as keyof typeof ExpenseCategory];
      const displayName = key.replace(/([A-Z])/g, " $1").trim();
      return { key, categoryValue, displayName };
    });

  const filteredCategories = categories.filter((cat) =>
    cat.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View className="bg-white rounded-t-[30px] max-h-[78%] min-h-[78%] w-full overflow-hidden">
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <Text 
              className="text-xl font-medium"
              style={{ color: colors.primary }}
            >
              Select Category
            </Text>
            <TouchableOpacity 
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close category selection modal"
            >
              <Icon name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View className="px-6 py-4 border-b border-gray-200">
            <TextInput
              mode="outlined"
              placeholder="Search category"
              value={searchQuery}
              onChangeText={setSearchQuery}
              right={
                searchQuery ? (
                  <TextInput.Icon
                    icon="close"
                    onPress={() => setSearchQuery("")}
                    color={colors.onSurfaceVariant}
                  />
                ) : null
              }
              activeOutlineColor={colors.primary}
              outlineColor={colors.outlineVariant}
              style={{ backgroundColor: colors.surface }}
            />
          </View>

          <ScrollView>
            {filteredCategories.map(({ key, categoryValue, displayName }) => (
              <TouchableOpacity
                key={key}
                className="p-4 border-b border-gray-100 flex-row items-center gap-4"
                onPress={() => handleSelect(categoryValue)}
                accessibilityRole="button"
                accessibilityLabel={`Select category ${displayName}`}
              >
                <ExpenseCategoryIcon category={categoryValue} size={24} color={colors.primary} />
                <Text className="text-base text-gray-800 flex-1">
                  {displayName}
                </Text>
                {selectedCategory === categoryValue && (
                  <Icon name="check" size={24} color={colors.primary} style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ExpenseCategoryLookupModal;
