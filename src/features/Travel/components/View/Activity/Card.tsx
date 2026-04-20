import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import ViewActivityModal from "./Modal";
import ActivityIcon from "../../../../../components/ActivityIcon";
import TextLimiter from "../../../../../components/atoms/TextLimiter";
import { ItineraryActivity } from "../../../types/TravelDto";
import { Typography } from "../../../../../styles/common";
import Icon from "react-native-vector-icons/MaterialIcons";
import MapViewer from "../../MapViewer";

interface ItineraryActivityProps {
  itineraryActivity: ItineraryActivity;
  isFirstItem?: boolean;
  isLastItem?: boolean;
}

const ActivityItemCard = ({
  itineraryActivity,
  isFirstItem,
  isLastItem,
}: ItineraryActivityProps) => {
  const [itineraryEventActivity, setItineraryEventActivity] =
    useState<ItineraryActivity>(itineraryActivity);

  const [showActivityViewModal, setShowActivityViewModal] =
    useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);

  const handleViewModeActivity = (id: number) => {
    console.log(id);
    setShowActivityViewModal(true);
  };

  return (
    <Animated.View>
      <View className="px-2 flex-row justify-between items-center relative">
        {!isLastItem ? (
          <View className="w-1.5 items-center h-full absolute">
            {isFirstItem ? (
              <View className="absolute h-1/2 w-[1px] top-1/2 left-5 z-0 border-l border-dashed border-gray-300"></View>
            ) : (
              <View className="absolute h-full w-[1px] left-5 z-0 border-l border-dashed border-[#ccc]"></View>
            )}
          </View>
        ) : (
          <View className="w-1.5 items-center h-full absolute">
            {isFirstItem && isLastItem ? (
              <></>
            ) : (
              <View className="absolute h-1/2 w-[1px] left-5 top-0 z-0 border-l border-dashed border-[#ccc]"></View>
            )}
          </View>
        )}
        <View className="z-10 items-center justify-center ">
          <ActivityIcon
            type={itineraryEventActivity.type!}
            size={24}
            color="#dc3545"
          />
        </View>

        <TouchableOpacity
          onPress={() => handleViewModeActivity(itineraryEventActivity.id!)}
          className="w-[100px] border border-solid border-[#e0e0e0] rounded-xl bg-white p-2.5 flex-grow ml-3 my-1"
        >
          <View className="flex-row justify-between items-start mb-1 gap-x-2">
            <Text className="text-base font-semibold text-[#333] leading-5 flex-1 break-words">
              {itineraryEventActivity.title}
            </Text>
            <View>
              <Text className="text-xs text-[#555] text-right">
                {itineraryEventActivity.startDate?.toDateString()} 11:00AM
              </Text>
            </View>
          </View>

          {itineraryEventActivity && itineraryEventActivity.images && (
            <View className="my-1">
              <Image
                src={itineraryEventActivity.images[0].url}
                className="h-[120px] w-full rounded"
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

          <Text style={Typography.small}>
            {itineraryEventActivity.commentsCount} Comments |{" "}
            {itineraryEventActivity.notesCount} Notes
          </Text>
        </TouchableOpacity>
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
        />
      )}
    </Animated.View>
  );
};

export default ActivityItemCard;
