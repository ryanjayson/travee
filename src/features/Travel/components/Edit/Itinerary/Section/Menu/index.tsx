import React from "react";
import { View, TouchableOpacity } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import SlideModal from "../../../../../../../components/molecules/SlideModal";
import { Text } from 'react-native-paper';

interface SectionMenuProps {
  visible: boolean;
  onClose: () => void;
  onEditSection: () => void;
  onAddActivity: () => void;
  onDeleteSection: () => void;
}

const SectionMenu = ({
  visible,
  onClose,
  onEditSection,
  onAddActivity,
  onDeleteSection,
}: SectionMenuProps) => {
  return (
    <SlideModal 
      visible={visible} 
      onClose={onClose}
      direction="bottom"
      height={280}
    >
      <View className="flex-1 pt-lg">
        <View className="gap-xl">
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3"
            activeOpacity={0.7}
            onPress={() => {
              onEditSection();
              onClose();
            }}
          >
            <View className="w-10 h-10 justify-center items-center mr-3">
              <Icon name="segment" size={32} color={"#183B7A"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-bold">Edit Section</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3"
            activeOpacity={0.7}
            onPress={() => {
              onAddActivity();
              onClose();
            }}
          >
            <View className="w-10 h-10 justify-center items-center mr-3">
              <Icon name="new-label" size={28} color={"#183B7A"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-medium">Add Activity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3"
            activeOpacity={0.7}
            onPress={() => {
              onDeleteSection();
              onClose();
            }}
          >
            <View className="w-10 h-10 justify-center items-center mr-3">
              <Icon name="delete-outline" size={28} color={"#C62828"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-medium text-[#C62828]">Delete Section</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SlideModal>
  );
};

export default SectionMenu;
