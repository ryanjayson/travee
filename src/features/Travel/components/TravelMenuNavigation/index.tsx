import React from "react";
import { View, TouchableOpacity } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import SlideModal from "../../../../components/molecules/SlideModal";
import { TravelMenuAction, TravelStatus } from "../../../../types/enums";
import { Divider, Text } from 'react-native-paper';
import { Travel } from "../../../Travel/types/TravelDto";

interface TravelMenuNavigationProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  onSelect: (selectedMenuAction: TravelMenuAction) => void;
  travel?: Travel;
}

const TravelMenuNavigation = ({
  showModal,
  setShowModal,
  onSelect,
  travel,
}: TravelMenuNavigationProps) => {
  const isCompleted = travel?.status === TravelStatus.Completed;
  const isCancelled = travel?.status === TravelStatus.Cancelled;
  const isArchived = travel?.isArchived || travel?.status === TravelStatus.Archieved;

  return (
    <SlideModal 
      visible={showModal} 
      onClose={() => setShowModal(false)}
      direction="bottom"
      height={326}
    >
      <View className="flex-1 pt-lg">
        
        <View className="gap-sm">
          <TouchableOpacity
            className={`flex-row items-center justify-between px-4 py-2 ${isArchived ? 'opacity-50' : ''}`}
            activeOpacity={0.7}
            disabled={isArchived}
            onPress={() => {
              onSelect(TravelMenuAction.EditTravel);
              setShowModal(false);
            }}
          >
            <View className="w-10 h-10 justify-center items-center mx-3">
              <Icon name="edit-note" size={32} color={"#00000"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-bold">Edit Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-row items-center justify-between px-4 py-2 opacity-50 ${isArchived ? 'opacity-50' : ''}`}
            activeOpacity={0.7}
            disabled={true}
            onPress={() => {
              onSelect(TravelMenuAction.Clone);
              setShowModal(false);
            }}
          >
            <View className="w-10 h-10 justify-center items-center mx-3">
              <Icon name="file-copy" size={28} color={"#00000"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-medium">Duplicate</Text>
          </TouchableOpacity>
          {isArchived ? (
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-2"
              activeOpacity={0.7}
              onPress={() => {
                onSelect(TravelMenuAction.Unarchive);
                setShowModal(false);
              }}
            >
              <View className="w-10 h-10 justify-center items-center mx-3">
                <Icon name="unarchive" size={28} color={"#00000"} />
              </View>
              <Text className="flex-1 ml-3 text-lg font-medium">Unarchive Trip</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-2"
              activeOpacity={0.7}
              onPress={() => {
                onSelect(TravelMenuAction.Archive);
                setShowModal(false);
              }}
            >
              <View className="w-10 h-10 justify-center items-center mx-3">
                <Icon name="archive" size={28} color={"#00000"} />
              </View>
              <Text className="flex-1 ml-3 text-lg font-medium">Archive</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className={`flex-row items-center justify-between px-4 py-3 ${(isCompleted || isCancelled || isArchived) ? 'opacity-50' : ''}`}
            activeOpacity={0.7}
            disabled={isCompleted || isCancelled || isArchived}
            onPress={() => {
              onSelect(TravelMenuAction.Cancel);
              setShowModal(false);
            }}
          >
            <View className="w-10 h-10 justify-center items-center mx-3">
              <Icon name="cancel" size={24} color={"#C62828"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-medium text-[#C62828]">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-2"
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.Delete);
              setShowModal(false);
            }}
          >
            <View className="w-10 justify-center items-center mx-3">
              <Icon name="delete" size={24} color={"#C62828"} />
            </View>
            <Text className="flex-1 ml-3 text-lg font-medium text-[#C62828]">Delete</Text>
          </TouchableOpacity>
         
        </View>
      </View>
    </SlideModal>
  );
};

export default TravelMenuNavigation;
