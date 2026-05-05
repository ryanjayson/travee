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
      height={346}
    >
      <View className="flex-1">
        <View className="gap-4">
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3"
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.EditTravel);
              setShowModal(false);
            }}
          >
            <View className="w-10 h-10 justify-center items-center mr-3">
              <Icon name="edit-note" size={32} color={"#183B7A"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-bold">Edit Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3 "
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.Clone);
              setShowModal(false);
            }}
          >
            <View className="w-10 h-10 justify-center items-center mr-3">
              <Icon name="file-copy" size={28} color={"#183B7A"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-medium">Duplicate Trip</Text>
          </TouchableOpacity>
             <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3 "
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.Archive);
              setShowModal(false);
            }}
          >
            <View className="w-10 h-10 justify-center items-center mr-3">
              <Icon name="archive" size={28} color={"#183B7A"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-medium">Archive Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3 "
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.Cancel);
              setShowModal(false);
            }}
          >
            <View className="w-10 h-10 justify-center items-center mr-3">
              <Icon name="cancel" size={24} color={"#C62828"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-medium text-[#C62828]">Cancel Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3"
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.Delete);
              setShowModal(false);
            }}
          >
            <View className="w-10 justify-center items-center mr-3">
              <Icon name="delete" size={24} color={"#C62828"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-medium text-[#C62828]">Delete Trip</Text>
          </TouchableOpacity>
         
        </View>
      </View>
    </SlideModal>
  );
};

export default TravelMenuNavigation;
