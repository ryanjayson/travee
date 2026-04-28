import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Itinerary from "../../../components/itinerary";
import { travelService } from "../../../services/travelService";
import { ActivitySection } from "../../../dtos/ItineraryDto";
import { Travel } from "../../Travel/types/TravelDto";
import { TravelStatus } from "../../../types/enums";

interface TravelDetailPageProps {
  travelData: Travel;
  onBack: () => void;
}

type TabType = "detail" | "itinerary" | "checklist" | "members" | "settings";

const TravelDetailTab = ({ travelData }: { travelData: Travel }) => {
  return (
    <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        <Text className="text-lg font-bold text-primary mb-3">Travel Information</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/10 elevation-1">
          <View className="flex-row justify-between py-2 border-b border-[#F0F0F0]">
            <Text className="text-sm text-[#666] font-medium">Destination:</Text>
            <Text className="text-sm text-primary font-bold">{travelData.destination}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-[#F0F0F0]">
            <Text className="text-sm text-[#666] font-medium">Start Date:</Text>
            {/* <Text className="text-sm text-primary font-bold">{travelData.startOrDepartureDate}</Text> */}
          </View>
          <View className="flex-row justify-between py-2 border-b border-[#F0F0F0]">
            <Text className="text-sm text-[#666] font-medium">End Date:</Text>
            {/* <Text className="text-sm text-primary font-bold">{travelData.endOrReturnDate}</Text> */}
          </View>
          <View className="flex-row justify-between py-2 border-b border-[#F0F0F0]">
            <Text className="text-sm text-[#666] font-medium">Budget:</Text>
            <Text className="text-sm text-primary font-bold">{travelData.budget}</Text>
          </View>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-bold text-primary mb-3">Notes</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/10 elevation-1">
          <Text className="text-sm text-[#666] leading-5">
            {travelData.notes || "No notes added yet."}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const TravelDetail = ({ travelData, onBack }: TravelDetailPageProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("detail");
  const [itineraryData, setItineraryData] = useState<ActivitySection[]>([]);
  const [loading, setLoading] = useState(true);

  const getEffectiveStatus = (travel: Travel): TravelStatus => {
    if (travel.status === TravelStatus.Completed || 
        travel.status === TravelStatus.Archieved || 
        travel.status === TravelStatus.Cancelled) {
      return travel.status || TravelStatus.Draft;
    }
    if (!travel.startOrDepartureDate || !travel.endOrReturnDate) return TravelStatus.Draft;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOrReturnDate = new Date(travel.endOrReturnDate);
    endOrReturnDate.setHours(0, 0, 0, 0);
    if (endOrReturnDate < today) return TravelStatus.Completed;

    const startOrDepartureDate = new Date(travel.startOrDepartureDate);
    startOrDepartureDate.setHours(0, 0, 0, 0);
    return startOrDepartureDate > today ? TravelStatus.Upcoming : TravelStatus.Ongoing;
  };

  const getStatusLabelText = (status: TravelStatus) => {
    switch (status) {
      case TravelStatus.Draft: return "Draft";
      case TravelStatus.Ongoing: return "Ongoing";
      case TravelStatus.Upcoming: return "Upcoming";
      case TravelStatus.Completed: return "Completed";
      case TravelStatus.Archieved: return "Archived";
      case TravelStatus.Cancelled: return "Cancelled";
      default: return "Unknown";
    }
  };

  const getStatusLabelStyling = (status: TravelStatus) => {
    if (status === TravelStatus.Ongoing || status === TravelStatus.Upcoming || status === TravelStatus.Completed) 
      return "bg-[#E8F5E8] text-[#2E7D32]";
    if (status === TravelStatus.Cancelled || status === TravelStatus.Archieved) return "bg-[#FFEBEE] text-[#D32F2F]";
    return "bg-[#E0E0E0] text-[#666]";
  };

  const effectiveStatus = getEffectiveStatus(travelData);
  const styling = getStatusLabelStyling(effectiveStatus);
  const bgStyle = styling.split(' ')[0];
  const textStyle = styling.split(' ')[1];

  useEffect(() => {
    const fetchItinerary = async () => {
      setLoading(true);
      try {
        const data = await travelService.getTravelItinerary(travelData.id!);
        setItineraryData(data);
      } catch (error) {
        console.error("Error fetching itinerary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [travelData.id]);

  const refreshItinerary = async () => {
    setLoading(true);
    try {
      // Refresh logic mapping
    } catch (error) {
      console.error("Error refreshing itinerary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "itinerary") {
      refreshItinerary();
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0C4C8A" />
          <Text className="mt-2.5 text-[#666]">Loading itinerary...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case "detail":
        return <TravelDetailTab travelData={travelData} />;
      case "itinerary":
        return (
          <Itinerary
            travelData={travelData}
            onSave={() => {}}
            onBack={() => {}}
            initialSections={itineraryData}
            initialActivities={itineraryData}
            onRefresh={refreshItinerary}
          />
        );
      case "checklist":
        return <View></View>;
      case "members":
        return <View></View>;
      case "settings":
        return <View></View>;
      default:
        return <TravelDetailTab travelData={travelData} />;
    }
  };

  return (
    <View className="flex-1 bg-[#F6F8FC]">
      <View className="flex-row justify-between items-center px-5 pt-5 pb-5 bg-white border-b border-[#E0E0E0]">
        <TouchableOpacity onPress={onBack} className="p-2.5">
          <Text className="text-primary text-base">← Back</Text>
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-primary" numberOfLines={1}>{travelData.destination}</Text>
          <View className={`px-2 py-0.5 rounded-full mt-1 ${bgStyle}`}>
            <Text className={`text-[10px] font-bold ${textStyle}`}>
              {getStatusLabelText(effectiveStatus)}
            </Text>
          </View>
        </View>
        <TouchableOpacity className="p-2.5">
          <Text className="text-primary text-xl">⋮</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row bg-white border-b border-[#E0E0E0]">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(["itinerary", "checklist", "members", "settings"] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`py-4 px-5 items-center justify-center ${activeTab === tab ? "border-b-2 border-primary" : ""}`}
              onPress={() => handleTabPress(tab)}
            >
              <Text className={`text-sm ${activeTab === tab ? "text-primary font-bold" : "text-[#666] font-medium capitalize"}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="flex-1">
        {renderTabContent()}
      </View>
    </View>
  );
};

export default TravelDetail;
