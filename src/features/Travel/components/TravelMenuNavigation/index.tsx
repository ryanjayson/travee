import React from "react";
import { View, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import SlideModal from "../../../../components/molecules/SlideModal";
import { TravelMenuAction } from "../../../../types/enums";
import { Divider, Text } from 'react-native-paper';

interface TravelMenuNavigationProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  onSelect: (selectedMenuAction: TravelMenuAction) => void;
}

const TravelMenuNavigation = ({
  showModal,
  setShowModal,
  onSelect,
}: TravelMenuNavigationProps) => {
  return (
    <SlideModal 
      visible={showModal} 
      onClose={() => setShowModal(false)}
      direction="bottom"
      height="300"
    >
      <View className="flex-1">
        {/* Drag Handle Indicator */}
        <View className="w-10 h-[4px] bg-[#E0E0E0] rounded-[2.5px] self-center mt-1 mb-[15px]" />

        <View className="gap-3">
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-2"
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.EditTravel);
              setShowModal(false);
            }}
          >
            <View className="w-10 h-10 justify-center items-center mr-3">
              <Icon name="edit-note" size={24} color={"#183B7A"} />
            </View>
            <Text className="flex-1 ml-3 text-base font-medium">Edit Trip</Text>
          </TouchableOpacity>
          <Divider/>
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-2 "
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.Clone);
              setShowModal(false);
            }}
          >
            <View className="w-10 h-10 justify-center items-center mr-3">
              <Icon name="file-copy" size={24} color={"#183B7A"} />
            </View>
            <Text className="flex-1 ml-3 text-base font-medium">Duplicate Trip</Text>
          </TouchableOpacity>
          <Divider/>
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-2 "
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.Archive);
              setShowModal(false);
            }}
          >
            <View className="w-10 h-10 justify-center items-center mr-3">
              <Icon name="archive" size={24} color={"#183B7A"} />
            </View>
            <Text className="flex-1 ml-3 text-base  font-medium">Archive</Text>
          </TouchableOpacity>
          <Divider/>
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 "
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.Print);
              setShowModal(false);
            }}
          >
            <View className="w-10 justify-center items-center mr-3">
              <Icon name="print" size={24} color={"#183B7A"} />
            </View>
            <Text className="flex-1 ml-3 text-base font-medium">Generate PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SlideModal>
  );
};

export default TravelMenuNavigation;
