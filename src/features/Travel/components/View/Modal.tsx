import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import ViewTravel from ".";
import Icon from "react-native-vector-icons/MaterialIcons";
import TravelMenuNavigation from "../../../Travel/components/TravelMenuNavigation";
import { TravelMenuAction } from "../../../../types/enums";
import { useNavigation } from "@react-navigation/native";
import { useTravelPlan } from "../../hooks/useTravel";
import { useTravelContext } from "../../../../context/TravelContext";

interface ViewTripModalProps {
  travelId: number;
  showModal?: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const ViewTripModal = ({
  travelId,
  showModal = false,
  setShowModal,
}: ViewTripModalProps) => {
  const [showTravelNavigationModal, setShowTravelNavigationModal] =
    useState<boolean>(false);
  const navigation = useNavigation();
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
      (navigation as any).navigate("EditTravelPlan", {
        travelId: travelPlan?.travel?.id,
        //TODO: add userid
      });
    }
  };

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View
          style={{
            padding: 6,
            borderBottomWidth: 1,
            borderColor: "#eee",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{ paddingRight: 14, padding: 2 }}
            onPress={handleCancel}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="keyboard-arrow-left" size={36} color={"#000"} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "500" }}>
            {travelPlan && <Text>{selectedTravelPlan?.title}</Text>}
          </Text>
          <TouchableOpacity
            style={{
              paddingRight: 14,
              padding: 2,
              position: "absolute",
              right: 0,
            }}
            onPress={() => setShowTravelNavigationModal(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="more-vert" size={24} color={"#000"} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalContainer}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    flex: 1,
  },
});
