import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Button,
} from "react-native";
import CreateTravelModal from "../components/Create/Modal";
import TravelDetailPage from "./TravelDetail";
import ViewTravelModal from "../components/View/Modal";
import { Travel } from "../types/TravelDto";
import { TravelStatus } from "../../../types/enums";
import { useTravels } from "../hooks/useTravel";
import { useTravelContext } from "../../../context/TravelContext";
import { FAB, Portal } from "react-native-paper";
import { useIsFocused } from "@react-navigation/native";

interface TravelPageProps {
  onBack?: () => void;
  onAddTravel?: () => void;
}

type TravelTabType = "upcoming" | "past";

const TravelCatalog = ({ onBack, onAddTravel }: TravelPageProps) => {
  const { data: travels, isLoading, isError, error, refetch } = useTravels();
  const [activeTab, setActiveTab] = useState<TravelTabType>("upcoming");
  const [visibleCreateTravelModal, setVisibleCreateTravelModal] = useState<boolean>(false);
  const [showTravelViewModal, setShowTravelViewModal] = useState<boolean>(false);
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
  const [showTravelDetail, setShowTravelDetail] = useState(false);
  const [upcomingTravels, setUpcomingTravels] = useState<Travel[]>([]);
  const [pastTravels, setPastTravels] = useState<Travel[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const { selectedTravelPlan, selectTravelPlan } = useTravelContext();
  const isFocused = useIsFocused();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    if (travels && travels.length > 0) {
      setUpcomingTravels(travels.filter((travel) => travel.status === TravelStatus.Upcoming));
      setPastTravels(travels.filter((travel) => travel.status === TravelStatus.Draft));
    } else {
      setUpcomingTravels([]);
      setPastTravels([]);
    }
  }, [travels]);

  const handleViewModeTravel = (travel: Travel) => {
    if (travel && travel.id) {
      const tripDetails = {
        id: travel.id,
        title: travel.title,
      };
      selectTravelPlan(tripDetails);
      setSelectedTravel(travel);
      setShowTravelViewModal(true);
    }
  };

  const handleBackFromTravelDetail = () => {
    setShowTravelDetail(false);
    setSelectedTravel(null);
    refetch();
  };

  const renderTravelCard = (travel: Travel) => (
    <View key={travel.id} className="bg-white rounded-xl mb-4 shadow-sm shadow-black/10 elevation-1">
      <TouchableOpacity onPress={() => handleViewModeTravel(travel)}>
        <View className="flex-1 bg-white"></View>
        <View className="p-2.5">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-lg font-bold text-primary">{travel.title}</Text>
              <Text className="text-lg font-bold text-primary">{travel.destination}</Text>
            </View>
            <View
              className={`px-2 py-1 rounded-xl ${
                travel.status === TravelStatus.Upcoming ? "bg-[#E8F5E8]" : "bg-[#F0F0F0]"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  travel.status === TravelStatus.Upcoming ? "text-[#2E7D32]" : "text-[#666]"
                }`}
              >
                {travel.status === TravelStatus.Draft ? "Draft" : "Past"}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center mb-4">
            <Text className="text-sm text-[#666] mr-2">3 Days | 12-20-2025</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    const isUpcoming = activeTab === "upcoming";
    const data = isUpcoming ? upcomingTravels : pastTravels;

    return (
      <ScrollView
        className="flex-1 p-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#0C4C8A"]}
            tintColor="#0C4C8A"
          />
        }
      >
        {data && data.length > 0 ? (
          data.map(renderTravelCard)
        ) : (
          <View className="flex-1 justify-center items-center py-[60px]">
            <Text className="text-5xl mb-4">{isUpcoming ? "✈️" : "📸"}</Text>
            <Text className="text-xl font-bold text-primary mb-2">
              {isUpcoming ? "No Upcoming Travel" : "No Past Travels"}
            </Text>
            <Text className="text-base text-[#666] text-center">
              {isUpcoming
                ? "Start planning your next adventure!"
                : "Your travel memories will appear here"}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  if (showTravelDetail && selectedTravel) {
    return (
      <TravelDetailPage
        travelData={selectedTravel}
        onBack={handleBackFromTravelDetail}
      />
    );
  }

  return (
    <View className="flex-1 bg-white pt-10">
      <StatusBar barStyle={"dark-content"} />

      <View className="bg-white px-5 py-4 border-b border-[#E0E0E0]">
        <Text className="text-2xl font-bold text-primary text-center">
          My Travels {travels?.length != null ? `(${travels.length})` : ""}
        </Text>
      </View>

      <View className="flex-row bg-white px-5 py-2">
        <TouchableOpacity
          className={`flex-1 py-3 items-center rounded-lg mx-1 ${
            activeTab === "upcoming" ? "bg-primary" : ""
          }`}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            className={`text-base ${
              activeTab === "upcoming" ? "text-white font-bold" : "font-medium text-[#666]"
            }`}
          >
            Upcoming ({upcomingTravels?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 items-center rounded-lg mx-1 ${
            activeTab === "past" ? "bg-primary" : ""
          }`}
          onPress={() => setActiveTab("past")}
        >
          <Text
            className={`text-base ${
              activeTab === "past" ? "text-white font-bold" : "font-medium text-[#666]"
            }`}
          >
            Past ({pastTravels?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={'#0C4C8A'} />
            <Text className="mt-2.5 text-[#666]">Loading your travel plans...</Text>
          </View>
        ) : isError ? (
          <View className="flex-1 justify-center items-center py-[60px]">
            <Text className="text-5xl mb-4">⚠️</Text>
            <Text className="text-xl font-bold text-primary mb-2">Something went wrong</Text>
            <Text className="text-red-500 m-2.5">{error?.message}</Text>
            <TouchableOpacity className="bg-primary px-5 py-2.5 rounded-lg" onPress={() => refetch()}>
              <Text className="text-white text-base font-medium">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderTabContent()
        )}
      </View>

      <CreateTravelModal
        showModal={visibleCreateTravelModal}
        setShowModal={setVisibleCreateTravelModal}
      />

      <ViewTravelModal
        travelId={selectedTravelPlan?.id || 0}
        showModal={showTravelViewModal}
        setShowModal={setShowTravelViewModal}
      />

      {isFocused && (
        <Portal>
          <FAB
            icon="plus"
            label="Create"
            color="white"
            style={{ position: 'absolute', margin: 16, right: 0, bottom: 80, backgroundColor: "#0C4C8A", borderRadius: 30 }}
            onPress={() => setVisibleCreateTravelModal(true)}
          />
        </Portal>
      )}
    </View>
  );
};

export default TravelCatalog;
