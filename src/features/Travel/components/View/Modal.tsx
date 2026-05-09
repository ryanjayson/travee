import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Alert } from "react-native";
import ViewTravel from ".";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import TravelMenuNavigation from "../../../Travel/components/TravelMenuNavigation";
import { TravelMenuAction } from "../../../../types/enums";
import { NavigationContext } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../../navigation/navigation.types";
import { useTravelPlan, useDeleteTravel, useCancelTravel, useArchiveTravel, useUnarchiveTravel } from "../../hooks/useTravel";
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

  // useContext never throws — returns null if outside NavigationContainer
  const navContext = useContext(NavigationContext);
  const navigation = navContext as NativeStackNavigationProp<RootStackParamList> | null;
  const { selectedTravelPlan, clearTravelPlan } = useTravelContext();
  const {
    data: travelPlan,
  } = useTravelPlan(travelId);

  useEffect(() => {
    console.log("SELECTED", travelPlan);
  }, [travelId]);

  const { mutate: deleteTravel } = useDeleteTravel();
  const { mutate: cancelTravel } = useCancelTravel();
  const { mutate: archiveTravel } = useArchiveTravel();
  const { mutate: unarchiveTravel } = useUnarchiveTravel();

  const handleCancel = () => {
    setShowModal(false);
  };

  const handleSelectNavigationMenu = (menuAction: TravelMenuAction) => {
    const id = travelPlan?.travel?.id;

    if (menuAction === TravelMenuAction.EditTravel) {
      if (id != null && navigation) {
        navigation.navigate("EditTravelPlan", { travelId: id });
      }
    } else if (menuAction === TravelMenuAction.Cancel) {
      Alert.alert(
        "Cancel Trip",
        "Are you sure you want to cancel this trip? This will mark it as cancelled.",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Cancel Trip",
            style: "destructive",
            onPress: () => {
              if (id != null) {
                cancelTravel(String(id), {
                  onSuccess: () => setShowModal(false),
                  onError: () => Alert.alert("Error", "Failed to cancel trip. Please try again."),
                });
              }
            },
          },
        ]
      );
    } else if (menuAction === TravelMenuAction.Delete) {
      Alert.alert(
        "Delete Trip",
        "Are you sure you want to permanently delete this trip? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              if (id != null) {
                deleteTravel(String(id), {
                  onSuccess: () => {
                    clearTravelPlan();
                    setShowModal(false);
                  },
                  onError: () => Alert.alert("Error", "Failed to delete trip. Please try again."),
                });
              }
            },
          },
        ]
      );
    } else if (menuAction === TravelMenuAction.Archive) {
      Alert.alert(
        "Archive Trip",
        "Are you sure you want to archive this trip? It will be moved to the archive but its status will be retained.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Archive",
            style: "default",
            onPress: () => {
              if (id != null) {
                archiveTravel(String(id), {
                  onSuccess: () => setShowModal(false),
                  onError: () => Alert.alert("Error", "Failed to archive trip. Please try again."),
                });
              }
            },
          },
        ]
      );
    } else if (menuAction === TravelMenuAction.Unarchive) {
      Alert.alert(
        "Unarchive Trip",
        "Are you sure you want to unarchive this trip?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unarchive",
            style: "default",
            onPress: () => {
              if (id != null) {
                unarchiveTravel(String(id), {
                  onSuccess: () => setShowModal(false),
                  onError: () => Alert.alert("Error", "Failed to unarchive trip. Please try again."),
                });
              }
            },
          },
        ]
      );
    }
  };

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="none"
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
            <Icon name="close" size={32} color={"#89939E"} />
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
             <Icon name="more-horiz" size={28} color={"#89939E"} />
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
        travel={travelPlan?.travel}
      />
    </Modal>
  );
};

export default ViewTripModal;
