import { MaterialIcons as Icon } from "@expo/vector-icons";
import { NavigationContext } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState, useRef } from "react";
import { Modal, Text, TouchableOpacity, View, Animated } from "react-native";
import ViewTravel from ".";
import { useConfirm } from "../../../../context/ConfirmContext";
import { useTravelContext } from "../../../../context/TravelContext";
import { TravelPlanDetail } from "../../../../types/context/travel";
import type { RootStackParamList } from "../../../../navigation/navigation.types";
import { TravelMenuAction } from "../../../../types/enums";
import TravelMenuNavigation from "../../../Travel/components/TravelMenuNavigation";
import { useArchiveTravel, useCancelTravel, useDeleteTravel, useTravelPlan, useUnarchiveTravel } from "../../hooks/useTravel";

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
  const { confirm } = useConfirm();
  const [showTravelNavigationModal, setShowTravelNavigationModal] =
    useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [scrollYVal, setScrollYVal] = useState<number>(0);
  const [isFabOpen, setIsFabOpen] = useState<boolean>(false);

  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const progress = Math.min(Math.max(scrollYVal / 150, 0), 1);
  const headerBg = `rgba(255, 255, 255, ${progress})`;
  const headerBorder = `rgba(0, 0, 0, ${progress * 0.08})`;

  const r = Math.round(255 - (255 - 137) * progress);
  const g = Math.round(255 - (255 - 147) * progress);
  const b = Math.round(255 - (255 - 158) * progress);
  const baseColor = `rgb(${r}, ${g}, ${b})`;
  const iconColor = baseColor;

  const titleOpacity = Math.min(Math.max((scrollYVal - 40) / 60, 0), 1);

  // Dynamic animations for the close/down icon
  const closeOpacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const downOpacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const iconRotation = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // useContext never throws — returns null if outside NavigationContainer
  const navContext = useContext(NavigationContext);
  const navigation = navContext as NativeStackNavigationProp<RootStackParamList> | null;
  const { clearTravelPlan, selectedTravelPlan, selectTravelPlan } = useTravelContext();
  const {
    data: travelPlan,
    refetch,
  } = useTravelPlan(travelId);

  useEffect(() => {
    if (travelPlan?.travel?.id) {
      const current = travelPlan.travel;
      if (
        selectedTravelPlan?.id !== current.id ||
        selectedTravelPlan?.title !== current.title ||
        selectedTravelPlan?.destination !== current.destination ||
        selectedTravelPlan?.startOrDepartureDate !== current.startOrDepartureDate ||
        selectedTravelPlan?.endOrReturnDate !== current.endOrReturnDate ||
        selectedTravelPlan?.status !== current.status ||
        selectedTravelPlan?.budget !== current.budget ||
        selectedTravelPlan?.notes !== current.notes ||
        selectedTravelPlan?.isOffline !== current.isOffline ||
        selectedTravelPlan?.isArchived !== current.isArchived ||
        selectedTravelPlan?.type !== current.type
      ) {
        selectTravelPlan(current as TravelPlanDetail);
      }
    }
  }, [travelPlan?.travel, selectedTravelPlan]);

  useEffect(() => {
    console.log("SELECTED", travelPlan);
  }, [travelId]);

  const { mutate: deleteTravel } = useDeleteTravel();
  const { mutate: cancelTravel } = useCancelTravel();
  const { mutate: archiveTravel } = useArchiveTravel();
  const { mutate: unarchiveTravel } = useUnarchiveTravel();

  const handleCancel = () => {
    setExpanded(false);
    setScrollYVal(0);
    setShowModal(false);
  };

  const handleSelectNavigationMenu = async (menuAction: TravelMenuAction) => {
    const id = travelPlan?.travel?.id;

    if (menuAction === TravelMenuAction.EditTravel) {
      if (id != null && navigation) {
        navigation.navigate("EditTravelPlan", { travelId: id });
      }
    } else if (menuAction === TravelMenuAction.Cancel) {
      const isConfirmed = await confirm({
        title: "Cancel Trip",
        message: "Are you sure you want to cancel this trip? This will mark it as cancelled.",
        confirmText: "Cancel Trip",
        cancelText: "No",
        type: "danger",
      });
      if (isConfirmed && id != null) {
        cancelTravel(String(id), {
          onSuccess: () => setShowModal(false),
        });
      }
    } else if (menuAction === TravelMenuAction.Delete) {
      const isConfirmed = await confirm({
        title: "Delete Trip",
        message: "Are you sure you want to permanently delete this trip? This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger",
      });
      if (isConfirmed && id != null) {
        deleteTravel(String(id), {
          onSuccess: () => {
            clearTravelPlan();
            setShowModal(false);
          },
        });
      }
    } else if (menuAction === TravelMenuAction.Archive) {
      const isConfirmed = await confirm({
        title: "Archive Trip",
        message: "Are you sure you want to archive this trip? It will be moved to the archive.",
        confirmText: "Archive",
        cancelText: "Cancel",
        type: "warning",
      });
      if (isConfirmed && id != null) {
        archiveTravel(String(id), {
          onSuccess: () => setShowModal(false),
        });
      }
    } else if (menuAction === TravelMenuAction.Unarchive) {
      const isConfirmed = await confirm({
        title: "Unarchive Trip",
        message: "Are you sure you want to unarchive this trip?",
        confirmText: "Unarchive",
        cancelText: "Cancel",
        type: "default",
      });
      if (isConfirmed && id != null) {
        unarchiveTravel(String(id), {
          onSuccess: () => setShowModal(false),
        });
      }
    }
  };

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => {
        if (isFabOpen) {
          setIsFabOpen(false);
        } else {
          handleCancel();
        }
      }}
    >
      <StatusBar style="dark" />
      <View className="flex-1 bg-white justify-end">
        <View 
          className="p-1.5 flex-row items-center z-10 pt-10"
          style={{
            backgroundColor: headerBg,
            borderBottomWidth: 1,
            borderBottomColor: headerBorder,
          }}
        >

      <TouchableOpacity
            className="pr-3.5 p-0.5 left-2"
            onPress={handleCancel}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close travel plan details"
            disabled={expanded}
          >
            <Animated.View 
              style={{ 
                // transform: [{ rotate: iconRotation }], 
                width: 32, 
                height: 32, 
                justifyContent: 'center', 
                alignItems: 'center',
                opacity: closeOpacity,
              }}
            >
              <Animated.View style={{ position: 'absolute' }}>
                <Icon name="close" size={32} color={iconColor} />
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
    
          <View style={{ opacity: titleOpacity }}>
            <Text className="text-xl font-medium  min-w-[68%] w-[68%]" ellipsizeMode="tail" numberOfLines={1}>
              {travelPlan && `${travelPlan.travel.title}`}
            </Text>
          </View>
          <TouchableOpacity
            className="pr-3.5 p-0.5 absolute right-0 pt-10"
            onPress={() => setShowTravelNavigationModal(true)}  
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <Animated.View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
              <Animated.View style={{ position: 'absolute', opacity: closeOpacity }}>
                <Icon name="more-horiz" size={28} color={iconColor} />
              </Animated.View>
              <Animated.View style={{ position: 'absolute', opacity: downOpacity }}>
                <Icon name="more-horiz" size={28} color="#000000" />
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
          {/* Hide the Share/Map modal button completely when at full height */}
          {!expanded && (
            <TouchableOpacity
              className="pr-3.5 p-0.5 absolute right-[50px] pt-10"
              onPress={() => setShowMapModal(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="share" size={24} color={iconColor} />
            </TouchableOpacity>
          )}
          {/* <TouchableOpacity
            className="pr-3.5 p-0.5 absolute right-[135px] pt-10"
            onPress={() => setShowMapModal(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="map" size={28} color={iconColor} />
          </TouchableOpacity> */}
        </View>
        <View className="bg-white flex-1 mt-[-82px] ">
          {travelPlan && (
            <ViewTravel 
              travelPlan={travelPlan} 
              onClose={handleCancel} 
              expanded={expanded} 
              onExpandedChange={setExpanded}
              onScrollY={setScrollYVal}
              showMap={showMapModal}
              setShowMap={setShowMapModal}
              showShare={showShareModal}
              setShowShare={setShowShareModal}
              onRefresh={refetch}
              fabOpen={isFabOpen}
              setFabOpen={setIsFabOpen}
            />
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
