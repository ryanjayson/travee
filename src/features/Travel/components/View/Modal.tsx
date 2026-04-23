import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import ViewTravel from ".";
import Icon from "react-native-vector-icons/MaterialIcons";
import TravelMenuNavigation from "../../../Travel/components/TravelMenuNavigation";
import { TravelMenuAction } from "../../../../types/enums";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../../navigation/navigation.types";
import { useTravelPlan } from "../../hooks/useTravel";
import { useTravelContext } from "../../../../context/TravelContext";

interface ViewTripModalProps {
  travelId: string;
  showModal?: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

//Modal for the Travel View page
//ViewTravel is the actual component

const ViewTripModal = ({
  travelId,
  showModal = false,
  setShowModal,
}: ViewTripModalProps) => {
  const [showTravelNavigationModal, setShowTravelNavigationModal] =
    useState<boolean>(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedTravelPlan, clearTravelPlan } = useTravelContext();

  const {
    data: travelPlan,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching, // Good for showing a silent background loader
  } = useTravelPlan(travelId); // Pass the required ID

  useEffect(() => {
    console.log("SELECTED", travelPlan);
  }, [travelId]);

  const handleCancel = () => {
    clearTravelPlan();
    setShowModal(false);
  };

  const handleSelectNavigationMenu = (menuAction: TravelMenuAction) => {
    if (menuAction === TravelMenuAction.EditTravel) {
      const id = travelPlan?.travel?.id;
      if (id != null) {
        navigation.navigate("EditTravelPlan", { travelId: id });
      }
    }
  };

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View className="flex-1 bg-white justify-end pt-10">
        <View className="p-1.5 border-b border-[#eee] flex-row items-center">
          <TouchableOpacity
            className="pr-3.5 p-0.5"
            onPress={handleCancel}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="keyboard-arrow-left" size={36} color={"#000"} />
          </TouchableOpacity>
          <Text className="text-xl font-medium">
            {travelPlan && <Text>{selectedTravelPlan?.title}</Text>}
          </Text>
          <TouchableOpacity
            className="pr-3.5 p-0.5 absolute right-0"
            onPress={() => setShowTravelNavigationModal(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="more-vert" size={24} color={"#000"} />
          </TouchableOpacity>
        </View>
        <View className="bg-white flex-1">
          {travelPlan && (
            <ViewTravel travelPlan={travelPlan} onClose={handleCancel} />
          )}
        </View>
      </View>

      <TravelMenuNavigation
        showModal={showTravelNavigationModal}
        setShowModal={setShowTravelNavigationModal}
        onSelect={handleSelectNavigationMenu}
      />
    </Modal>
  );
};

export default ViewTripModal;
