import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
} from "react-native";
import TouchButton from "../../../../../components/atoms/TouchButton";
import { ItineraryActivity } from "../../../types/TravelDto";
import Tabs from "../../../../../components/Tabs";
import { Typography } from "../../../../../styles/common";
import { useItineraryActivity } from "../../../hooks/useActivity";
import DetailsTab from "./Tabs/DetailsTab";
import ExpensesTab from "./Tabs/ExpensesTab";
import NotesTab from "./Tabs/NotesTab";

interface ViewTripActivityProps {
  id: string;
  onClose: () => void;
}

const ViewItineraryActivity = ({ id, onClose }: ViewTripActivityProps) => {
  const {
    data: itineraryActivity,
    isLoading,
    isError,
    error,
    refetch,
  } = useItineraryActivity(id);

  useEffect(() => {
    console.log("ID", id);
    console.log("SELECTED", itineraryActivity);
  }, [itineraryActivity]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-2 text-gray-600">Loading activity details...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-600 text-sm mb-4 text-center">
            Error: {error?.message || "Failed to load activity."}
          </Text>
          <TouchButton buttonText="Retry" onPress={() => refetch()} />
        </View>
      );
    }

    return <Tabs tabs={tabData} initialActiveTabId="details" />;
  };

  const tabData = [
    { id: "details", title: "Details", content: <DetailsTab itineraryActivity={itineraryActivity} /> },
    { id: "expenses", title: "Expenses", content: <ExpensesTab /> },
    { id: "notes", title: "Notes", content: <NotesTab /> },
  ];

  return (
    <View className="flex-1 bg-white">
      {itineraryActivity && itineraryActivity.images && itineraryActivity.images.length > 0 && (
        <View className="my-1">
          <Image
            source={{ uri: itineraryActivity.images[0].url }}
            className="w-full h-[200px]"
            resizeMode="cover"
          />
        </View>
      )}
      <View className="p-4 bg-white">
        <Text style={Typography.h2}>{itineraryActivity?.title}</Text>
        <Text className="my-2 text-gray-700 leading-5">
          {itineraryActivity?.description}
        </Text>
        {itineraryActivity?.primaryType && (
          <Text className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {itineraryActivity?.primaryType}
          </Text>
        )}
      </View>
      <View className="pt-2 flex-1 bg-white">
        {renderContent()}
      </View>
    </View>
  );
};

export default ViewItineraryActivity;
