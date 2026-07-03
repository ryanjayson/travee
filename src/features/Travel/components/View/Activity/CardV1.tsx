import { MaterialIcons as Icon, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ActivityIcon from "../../../../../components/ActivityIcon";
import { useUpdateActivityMutation } from "../../../hooks/useActivity";
import { useConfirm } from "../../../../../context/ConfirmContext";
import { ItineraryActivity } from "../../../types/TravelDto";
import MapViewer from "../../MapViewer";
import ViewActivityModal from "./Modal";

interface ItineraryActivityProps {
  itineraryActivity: ItineraryActivity;
  isFirstItem?: boolean;
  isLastItem?: boolean;
  plainMode?: boolean;
}

const ActivityItemCard = ({
  itineraryActivity,
  isFirstItem,
  isLastItem,
  plainMode,
}: ItineraryActivityProps) => {
  const [itineraryEventActivity, setItineraryEventActivity] =
    useState<ItineraryActivity>(itineraryActivity);
  const { confirm } = useConfirm();

  const [showActivityViewModal, setShowActivityViewModal] =
    useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const updateMutation = useUpdateActivityMutation();

  React.useEffect(() => {
    setItineraryEventActivity(itineraryActivity);
  }, [itineraryActivity]);

  const handleToggleDone = async () => {
    const nextStatus = !itineraryEventActivity.isDone;
    const isConfirmed = await confirm({
      title: "Confirmation",
      message: `Are you sure you want to mark this activity as ${nextStatus ? 'done' : 'undone'}?`,
      confirmText: "Yes",
      cancelText: "Cancel",
      type: "default",
    });

    if (isConfirmed) {
      try {
        const updatedPayload = {
          ...itineraryEventActivity,
          isDone: nextStatus,
          isOffline: true,
        };
        
        await updateMutation.mutateAsync(updatedPayload);
        setItineraryEventActivity(updatedPayload);
      } catch (err) {
        console.error("Failed to update activity status:", err);
      }
    }
  };

  const handleViewModeActivity = (id: string) => {
    console.log("ID", id);
    setShowActivityViewModal(true);
  };

  if (plainMode) {
    return (
      <View className="flex-row items-center px-1 py-1">
        <View className="z-10 items-center justify-center mr-3">
          <Ionicons name="location" size={20} color="#dc3545" />
        </View>
        <Text className="text-base text-[#333] flex-1" numberOfLines={1}>
          {itineraryEventActivity.title}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View>
      <View className={`px-2 flex-row justify-between items-center relative`}>
        {!isLastItem ? (
          <View className="w-1.5 items-center h-full absolute">
            {isFirstItem ? (
              <View className="absolute h-1/2 w-1px top-1/2 left-[18.5px] z-0 border-l border-dashed border-gray-300"></View>
            ) : (
              <View className="absolute h-full w-1px left-[18.5px] z-0 border-l border-dashed border-[#ccc]"></View>
            )}
          </View>
        ) : (
          <View className="w-1.5 items-center h-full absolute">
            {isFirstItem && isLastItem ? (
              <></>
            ) : (
              <View className="absolute h-1/2 w-1px left-[18.5px] top-0 z-0 border-l border-dashed border-[#ccc]"></View>
            )}
          </View>
        )}
        <View className="z-10 items-center justify-center ">
          <ActivityIcon
            type={itineraryEventActivity.type!}
            size={24}
          />
        </View>

        <TouchableOpacity
          onPress={() => handleViewModeActivity(itineraryEventActivity.id!)}
          className={`w-[100px] border border-solid border-[#e0e0e0] rounded-xl bg-white p-2.5 grow ml-3 my-1 ${itineraryEventActivity.isDone ? 'opacity-50' : ''}`}
        >
          <View className="flex-row justify-between items-start gap-x-2 p-0!">
          {!itineraryEventActivity.startDate ? (
              <View className="justify-between items-start mb-1 gap-x-2">
                  <Text className="text-lg font-normal text-[#333] leading-5 flex-1 wrap-break-word">
                      {itineraryEventActivity.title}
                  </Text>
              </View>
          ) : (
              <Text className="text-xs font-semibold text-[#606060] flex-1 wrap-break-word">
                {itineraryEventActivity.startDate && new Date(itineraryEventActivity.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
          )}
            <View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleToggleDone}
                className="flex-row items-center gap-1.5"
              >
                <Text className="text-[10px] text-[#888] font-medium uppercase tracking-tight">
                  {itineraryEventActivity.isDone ? "Done" : "Mark as done"}
                </Text>
                  {itineraryEventActivity.isDone ? 
                      (<Icon name="check" size={20} color="#263F69" />)
                      : (<Icon name="check-box-outline-blank" size={20} color="#777" />)}

              
              </TouchableOpacity>
            </View>
          </View>

          {itineraryEventActivity.startDate && (
              <View className="flex-row justify-between items-start mb-1 gap-x-2">
                  <Text className="text-lg font-normal text-[#333] leading-5 flex-1 wrap-break-word">
                      {itineraryEventActivity.title}
                  </Text>
              </View>
          )}

          {/* <Image
              source={require("../../../../../assets/images/japan.jpg")}
              className="w-full h-[120px] rounded-xl my-2"
              style={{ resizeMode: "cover" }}
            /> */}

          {itineraryEventActivity && itineraryEventActivity.images && itineraryEventActivity.images.length > 0 && (
            <View className="my-1 p-2">
              <Image
                src={itineraryEventActivity.images[0].url}
                className="h-[120px] w-full rounded-md"
                style={{ resizeMode: "cover" }}
              />
            </View>
          )}

          {itineraryEventActivity && itineraryEventActivity.destination && itineraryEventActivity.destinationData?.coordinates && (
            <TouchableOpacity 
              className="flex-row items-center my-1 mr-2 w-full text-ellipsis"
              onPress={() => setShowMapModal(true)}
            >
                <Text className="text-xs opacity-70 bg-gray-100 rounded-sm p-1 pb-2"
              ellipsizeMode="tail"
              numberOfLines={1}>
              <Icon name="location-pin" size={16} color={"#555"} />
                {itineraryEventActivity.destination}
              </Text>
            </TouchableOpacity>
          )} 
 

            <Text className="text-sm text-[#555] leading-5 mb-1.5 mt-1" 
              numberOfLines={2}
              ellipsizeMode="tail">
              {itineraryEventActivity.description} 
            </Text>

          <View className="flex-row items-center mt-1 flex-wrap">
            {itineraryEventActivity.notesCount !== undefined && itineraryEventActivity.notesCount > 0 && (
              <View className="flex-row items-center mr-3">
                <Text className="text-xs font-medium text-[#888]">
                  {itineraryEventActivity.notesCount} {itineraryEventActivity.notesCount === 1 ? 'Note' : 'Notes'}
                </Text>
              </View>
            )}
            {itineraryEventActivity.expensesCount !== undefined && itineraryEventActivity.expensesCount > 0 && (
              <View className="flex-row items-center mr-3">
                <Text className="text-xs font-medium text-[#888]">
                  {itineraryEventActivity.expensesCount} {itineraryEventActivity.expensesCount === 1 ? 'Expense' : 'Expenses'}
                </Text>
              </View>
            )}
            {itineraryEventActivity.checklistCount !== undefined && itineraryEventActivity.checklistCount > 0 && (
              <View className="flex-row items-center">
                  <Text className="text-xs font-medium text-[#888]">
                  {itineraryEventActivity.checklistCount} {itineraryEventActivity.checklistCount === 1 ? 'Task' : 'Tasks'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ViewActivityModal
        id={itineraryEventActivity.id!}
        travelId={itineraryEventActivity.travelId}
        showModal={showActivityViewModal}
        setShowModal={setShowActivityViewModal}
      />

      {itineraryEventActivity.destinationData?.coordinates && (
        <MapViewer
          visible={showMapModal}
          onClose={() => setShowMapModal(false)}
          coordinates={itineraryEventActivity.destinationData.coordinates}
          title={itineraryEventActivity.destination || "Location"}
          zoom={12}
        />
      )}
    </Animated.View>
  );
};

export default ActivityItemCard;
