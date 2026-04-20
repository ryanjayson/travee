import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import SectionAccordion from "./SectionAccordion";
import { TravelPlan } from "../../../Travel/types/TravelDto";
import StatusTag from "../../../../components/StatusTag";
import Tabs from "../../../../components/Tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import MapViewer from "../MapViewer";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";

interface ViewTravelProps {
  travelPlan: TravelPlan;
  onClose: () => void;
}

const ViewTravel = ({ travelPlan, onClose }: ViewTravelProps) => {
  const [showActivityViewModal, setShowActivityViewModal] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [showDestinationOnlyMap, setShowDestinationOnlyMap] = useState<boolean>(true);

  const TabItinerary = () => (
    <View>
      {travelPlan.itinerarySection ? (
        <SectionAccordion iterarysections={travelPlan.itinerarySection} />
      ) : (
        <Text>No itinerary Added</Text>
      )}
    </View>
  );

  const TabChecklistContent = () => (
    <View>
      {travelPlan.itinerarySection ? (
        <SectionAccordion iterarysections={travelPlan.itinerarySection} />
      ) : (
        <Text className="text-sm text-[#555] leading-5">No Checklist item added.</Text>
      )}
    </View>
  );

  const TabNotesContent = () => (
    <View>
      {travelPlan.itinerarySection ? (
        <SectionAccordion iterarysections={travelPlan.itinerarySection} />
      ) : (
        <Text className="text-sm text-[#555] leading-5">No note added.</Text>
      )}
    </View>
  );

  const TabDetailsContent = () => (
    <View>
      <View>
        <Text className="text-sm text-[#555] leading-5">20 - Total Activity </Text>
      </View>
      <View>
        <Text className="text-sm text-[#555] leading-5">10 - Paticipants</Text>
      </View>
      <View>
        <Text className="text-sm text-[#555] leading-5">$1000 - Running Expenses</Text>
      </View>
    </View>
  );

  const getAllMarkers = () => {
    const markers: Array<{ latitude: number; longitude: number; title: string , type?: number}> = [];
    if (travelPlan.travel.destinationData?.coordinates) {
      markers.push({
        latitude: travelPlan.travel.destinationData.coordinates.latitude,
        longitude: travelPlan.travel.destinationData.coordinates.longitude,
        title: travelPlan.travel.destination || "Trip Destination",
      });
    }

    !showDestinationOnlyMap && travelPlan.itinerarySection?.forEach((section) => {
      section.itineraryActivity?.forEach((activity) => {
        if (activity.destinationData?.coordinates && activity.destinationData.coordinates.latitude !== 0 && activity.destinationData.coordinates.longitude !== 0) {
          markers.push({
            latitude: activity.destinationData.coordinates.latitude,
            longitude: activity.destinationData.coordinates.longitude,
            title: activity.title || "Activity",
            type: activity.type,
          });
        }
      });
    });

    console.log(markers);
    return markers;
  };

  const Toolbar = () => (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          setShowDestinationOnlyMap(false)
          setShowMapModal(true)}}
        className="bg-black/80 w-8 h-8 rounded-full absolute right-[60px] top-5 z-10 items-center justify-center"
      >
        <Animated.View>
          <Icon name="map" size={20} color={"#FFF"} />
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        className="bg-black/80 w-8 h-8 rounded-full absolute right-5 top-5 z-10 items-center justify-center"
      >
        <Animated.View>
          <Icon name="group" size={20} color={"#FFF"} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );

  const HeaderSection = () => (
    <View>
      <View className="flex-1">
        <Toolbar />
        <View className="flex-1 bg-white pt-2.5 px-2.5">
          {travelPlan.travel.destinationData?.coordinates ? (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => {
                setShowDestinationOnlyMap(true)
                setShowMapModal(true)}}
              className="w-full"
            >
              <Image
                source={{
                  uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+0C4C8A(${travelPlan.travel.destinationData.coordinates.longitude},${travelPlan.travel.destinationData.coordinates.latitude})/${travelPlan.travel.destinationData.coordinates.longitude},${travelPlan.travel.destinationData.coordinates.latitude},10,0/600x300?access_token=${MAPBOX_ACCESS_TOKEN}`,
                }}
                className="w-full h-[200px] rounded-xl"
                style={{ resizeMode: "cover" }}
              />
            </TouchableOpacity>
          ) : (
            <Image
              source={require("../../../../assets/images/japan.jpg")}
              className="w-full h-[200px] rounded-xl"
              style={{ resizeMode: "cover" }}
            />
          )}
        </View>
      </View>

      <View className="flex-[2] bg-white">
        <View className="p-4 pb-2">
          <View className="flex-row justify-between items-start">
            <Text className="text-2xl font-bold text-[#183B7A] mb-2 flex-1 mr-4">
              {travelPlan?.travel.title}
            </Text>
            <StatusTag type={2} status={travelPlan.travel.status!} />
          </View>
          <View className="flex-row items-center flex-wrap">
            <TouchableOpacity 
              className="flex-row items-center my-1 mr-2"
              onPress={() => travelPlan.travel.destinationData?.coordinates && setShowMapModal(true)}
            >
              <Icon name="location-pin" size={16} color={"red"} />
              <Text className="text-[#183B7A] font-medium ml-1">
                {travelPlan.travel.destination}
              </Text>
            </TouchableOpacity>
            <View className="flex-row items-center my-1">
              <Text className="text-sm text-[#666] px-2 mx-2 border-l border-[#DDD]">
                {travelPlan.travel?.startOrDepartureDate
                  ? new Date(travelPlan.travel.startOrDepartureDate).toLocaleDateString("en-US", { month: "2-digit", year: "numeric" })
                  : ""}
                {travelPlan.travel?.startOrDepartureDate && travelPlan.travel?.endOrReturnDate
                  ? ` (${Math.ceil((new Date(travelPlan.travel.endOrReturnDate).getTime() - new Date(travelPlan.travel.startOrDepartureDate).getTime()) / (1000 * 60 * 60 * 24))} days)`
                  : ""}
              </Text>
            </View>
          </View>

          <View className="mt-2.5">
            <Text className="text-base text-[#666] leading-6">
              {travelPlan.travel.description || null}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const tabData = [
    { id: "itinerary", title: "Itinerary", content: <TabItinerary /> },
    { id: "notes", title: "Notes", content: <TabNotesContent /> },
    {
      id: "checklist",
      title: "Checklist",
      content: <TabChecklistContent />,
    },
    {
      id: "details",
      title: "Details",
      content: <TabDetailsContent />,
    },
  ];

  const handleViewModeActivity = (id: number) => {
    setShowActivityViewModal(true);
  };

  return (
    <ScrollView className="flex-1 bg-[#F9F9F9]" showsVerticalScrollIndicator={false}>
      <HeaderSection />
      <View>
        <Tabs tabs={tabData} initialActiveTabId="itinerary" />
      </View>

      {setShowMapModal && (
        <MapViewer
          visible={showMapModal}
          onClose={() => setShowMapModal(false)}
          markers={getAllMarkers()}
          title={travelPlan.travel.title || "Trip Map"}
          zoom={showDestinationOnlyMap ? 6 : null}
        />
      )}
    </ScrollView>
  );
};

export default ViewTravel;
