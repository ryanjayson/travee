import { MaterialIcons as Icon, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  View,
} from "react-native";
import ActivityIcon, { activityIcons } from "../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../types/enums";
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

  const getActivityTypeDetails = (type: any) => {
    if (type == null) return { text: "None", color: "#9E9E9E" };
    const iconConfig = activityIcons.find((i) => i.activityType === type);
    const color = iconConfig?.color ?? "#9E9E9E";
    const typeName = ActivityType[type];
    const text = typeName 
      ? String(typeName).replace(/([A-Z])/g, ' $1').trim()
      : "None";
    return { text, color };
  };

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
              <View className="absolute h-1/2 w-1px top-1/2 left-[27px] z-0 border-l border-dashed border-gray-300"></View>
            ) : (
              <View className="absolute h-full w-1px left-[27px] z-0 border-l border-dashed border-[#ccc]">
              </View>
            )}
          </View>
        ) : (
          <View className="w-1.5 items-center h-full absolute">

            {isFirstItem && isLastItem ? (
              <>
              </>
            ) : (
              <View className="absolute h-1/2 w-1px left-[27px] top-0 z-0 border-l border-dashed border-[#ccc]">
              </View>
            )}
          </View>
        )}
        <View className="z-10 items-center justify-center bg-gray-100 border-3 border-gray-100 rounded-full">
          <ActivityIcon
            type={itineraryEventActivity.type!}
            size={20}
          />
        </View>

        <TouchableOpacity
          onPress={() => handleViewModeActivity(itineraryEventActivity.id!)}
          className={`w-[100px] border border-solid border-[#e0e0e0] rounded-xl  p-2.5 grow ml-3 my-4 ${itineraryEventActivity.isDone ? 'opacity-50 border border-success-700 bg-success-25' : 'bg-white'}`}
        >
          <View className={`flex-row items-center  ${itineraryEventActivity.startDate ? 'gap-2' : ''}`}>
            <View className="">
              <Text className="text-xs font-semibold text-[#606060] ">
                  {itineraryEventActivity.startDate && new Date(itineraryEventActivity.startDate).toLocaleTimeString([], { hour: '2-digit', minute:   '2-digit' })}
              </Text>
            </View>

            {itineraryEventActivity.type !== undefined && itineraryEventActivity.type !== null && (
              <View 
                style={{ backgroundColor: getActivityTypeDetails(itineraryEventActivity.type).color + '20' }} 
                className="items-end rounded-xs px-2 py-0.5"
              >
                <Text 
                  style={{ color: getActivityTypeDetails(itineraryEventActivity.type).color }} 
                  className="text-[10px] tracking-wider uppercase font-extrabold"
                >
                  {getActivityTypeDetails(itineraryEventActivity.type).text}
                </Text>
              </View>
            )}
          </View>


          <View className="flex-row justify-between items-start mb-3 gap-x-2">
            {/* {itineraryEventActivity && itineraryEventActivity.images && itineraryEventActivity.images.length > 0 && (
              <View className="flex-1 ">
                <View className="my-1 rounded-md">
                  <Image
                    src={itineraryEventActivity.images[0].url}
                    className="rounded-md w-[100px] h-[100px]"
                    style={{ resizeMode: "cover" }}
                  />
                  <View 
                    className="absolute inset-0 rounded-md w-[100px] h-[100px]"
                    style={{ backgroundColor: "rgba(0,0,0,0.20)"}}
                  />
                </View>
              </View>
            )} */}

              <View className="flex-2">
                <View className="flex-row justify-between items-start mb-1 gap-x-2">
                  <Text className="text-lg font-semibold text-[#333] leading-5 flex-1 wrap-break-word" numberOfLines={itineraryEventActivity.isDone ? 1 : 0}>
                      {itineraryEventActivity.title}
                  </Text>
                </View>
                {!itineraryEventActivity.isDone && itineraryEventActivity && itineraryEventActivity.destination && itineraryEventActivity.destinationData?.coordinates && (
                  <TouchableOpacity 
                    className="flex-row w-2/4 items-center text-ellipsis opacity-80 bg-gray-100 rounded-sm p-1 pr-4"
                    onPress={() => setShowMapModal(true)}
                  >
                    <Icon name="location-pin" size={12} color={"#B42318"} />
                    <Text className="text-xs"
                    ellipsizeMode="tail"
                    numberOfLines={1}>
                      {itineraryEventActivity.destination}
                    </Text>
                  </TouchableOpacity>
                )} 

                {!itineraryEventActivity.isDone && itineraryEventActivity.description && (
                  <Text className="text-md text-[#555] leading-5 mb-1.5 mt-1" 
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {itineraryEventActivity.description} 
                  </Text>
                )}
             </View>
          </View>
          
          {/* <View className="flex-row justify-between items-center border-t border-gray-200 pt-1.5">
            <View className="flex-row items-center mt-1 flex-wrap gap-5">
              <View className="flex-row items-center gap-1">
                    <Icon name="payments" size={24} color={"#888"} />
                    <Text className="text-base font-medium text-[#999] ">
                      {itineraryEventActivity.expensesCount}
                    </Text>
                  </View>
                <View className="flex-row items-center gap-1">
                      <Icon name="checklist" size={24} color={"#888"} />
                    <Text className="text-base font-medium text-[#999] ">
                      {itineraryEventActivity.checklistCount}
                    </Text>
                  </View>
                <View className="flex-row items-center gap-1">  
                        <Icon name="comment" size={24} color={"#888"} />

                    <Text className="text-base font-medium text-[#999] ">
                      {itineraryEventActivity.notesCount}
                    </Text>
                  </View>
              </View>
          </View> */}
      
        </TouchableOpacity>
          <View className="absolute right-4 bottom-4">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleToggleDone}
                className="flex-row items-center gap-1.5"
              >
                <Text className="text-[10px] text-[#999] font-medium uppercase tracking-tight">
                  {itineraryEventActivity.isDone ? "" : "Mark as done"}
                </Text>
                
                  {itineraryEventActivity.isDone ? 
                      (<Icon name="check" size={24} color="#0c6134" />)
                      : (<Icon name="check-box-outline-blank" size={24} color="#888" />)}
              </TouchableOpacity>
            </View>

            {!isLastItem && (
                   <TouchableHighlight 
      underlayColor={"#263F69"}
          className="absolute -bottom-3 left-[15px] border border-gray-300 bg-gray-200 px-0.5 rounded-md"
          onPress={() => setShowMapModal(true)}
        >
          <Icon name="add" size={20} color={"#999"}/>
        </TouchableHighlight>
            )}
 
      </View>

      <ViewActivityModal
        id={itineraryEventActivity.id!}
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
