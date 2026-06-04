import React, { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialIcons";
import StatusBadge from "../../../components/StatusBadge";
import Tabs from "../../../components/Tabs/index";
import { useTravelContext } from "../../../context/TravelContext";
import { TravelStatus, TripType } from "../../../types/enums";
import TripIcon from "../../../components/TripIcon";
import ViewTravelModal from "../components/View/Modal";
import { useTravels } from "../hooks/useTravel";
import { Travel } from "../types/TravelDto";
import TravelDetailPage from "./TravelDetail";

const TravelCatalog = () => {
  const { data: travels, isLoading, isError, error, refetch } = useTravels();
  const [showTravelViewModal, setShowTravelViewModal] = useState<boolean>(false);
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
  const [showTravelDetail, setShowTravelDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { selectedTravelPlan, selectTravelPlan } = useTravelContext();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getEffectiveStatus = (travel: Travel): TravelStatus => {
    if (travel.status === TravelStatus.Completed || 
        travel.status === TravelStatus.Archieved || 
        travel.status === TravelStatus.Cancelled) {
      return travel.status || TravelStatus.Draft;
    }

    if (!travel.startOrDepartureDate) {
      return TravelStatus.Draft;
    }
    return travel.status;
  };

  const getTravelsByStatus = (status: TravelStatus) => {
    if (status === TravelStatus.Archieved) {
      return travels?.filter(t => t.isArchived || t.status === TravelStatus.Archieved) || [];
    }
    return travels?.filter(t => !t.isArchived && t.status !== TravelStatus.Archieved && t.status === status) || [];
  };

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

  const renderTravelCard = (travel: Travel) => {
    const effectiveStatus = getEffectiveStatus(travel);

    const formatDate = (dateValue: Date | string | undefined) => {
      if (!dateValue) return "";
      const date = new Date(dateValue);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDuration = (start: Date | string | undefined, end: Date | string | undefined) => {
      if (!start || !end) return "";
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
    };

    const duration = getDuration(travel.startOrDepartureDate, travel.endOrReturnDate);
    const dateRange = travel.startOrDepartureDate && travel.endOrReturnDate 
      ? `${formatDate(travel.startOrDepartureDate)} - ${formatDate(travel.endOrReturnDate)}`
      : travel.startOrDepartureDate ? formatDate(travel.startOrDepartureDate) : "Dates not set";

    return (
      <View key={travel.id} className="bg-white rounded-xl mb-2 shadow-sm shadow-black/10 elevation-1 mx-4 overflow-hidden">
        <TouchableOpacity onPress={() => handleViewModeTravel(travel)}>
          <View className="p-4 border border-[#E0E0E0] rounded-xl">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                {travel.type != null && travel.type !== TripType.none && (
                  <TripIcon type={travel.type} size={20} showIconOnly={true} />
                )}
                <View className="flex-1">
                  <Text className="text-lg font-medium text-primary">{travel.title}</Text>
                  <Text className="text-sm  text-[#666]">{travel.destination}</Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between mt-2">
                <StatusBadge status={effectiveStatus} />
              </View>
            </View>
            <View className="flex-row items-center mt-1">
              <Text className="text-xs font-medium text-[#999]">
                {duration ? `${duration} | ` : ""}{dateRange}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContentForStatus = (status: TravelStatus, emptyIcon: string, emptyTitle: string, emptySubtitle: string) => {
    const data = getTravelsByStatus(status);
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#263F69"]}
            tintColor="#263F69"
          />
        }
      >
        {data && data.length === 1 && data[0].status === TravelStatus.Ongoing ?(
          <View key={data[0].id} className="rounded-xl mb-2 bg-success-50 shadow-sm shadow-black/10 elevation-1 mx-4 overflow-hidden">
            <TouchableOpacity onPress={() => handleViewModeTravel(data[0])}>
              <View className="p-4 border border-success-500 rounded-xl">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-medium text-primary">{data[0].title}</Text>
                    <Text className="text-sm  text-[#666]">{data[0].destination}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) :
        data && data.length > 0 ? (
          data.map(renderTravelCard)
        ) : (
          <View className="flex-1 justify-center items-center py-[60px]">
            <Text className="text-5xl mb-4">{emptyIcon}</Text>
            <Text className="text-xl font-bold text-primary mb-2">
              {emptyTitle}
            </Text>
            <Text className="text-base text-[#666] text-center px-10">
              {emptySubtitle}
            </Text>
          </View>
        )}
        
      </ScrollView>
    );
  };

  const renderCalendarView = () => {
    const ongoingTrips = getTravelsByStatus(TravelStatus.Ongoing);
    const upcomingTrips = getTravelsByStatus(TravelStatus.Upcoming);
    const activeTrips = [...ongoingTrips, ...upcomingTrips];

    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center py-3 px-5 border-b border-gray-100 gap-4">
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-[#263F69]" />
            <Text className="text-xs text-[#666]">Ongoing</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-[#2E7D32]" />
            <Text className="text-xs text-[#666]">Upcoming</Text>
          </View>
        </View>

        <Calendar
          style={{ flex: 1 }}
          enableSwipeMonths={true}
          theme={{
            todayTextColor: '#263F69',
            arrowColor: '#263F69',
            'stylesheet.calendar.main': {
              monthView: {
                flex: 1,
              },
              week: {
                marginTop: 0,
                marginBottom: 0,
                flexDirection: 'row',
                justifyContent: 'space-around',
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
                flex: 1,
              },
            },
          }}
          renderArrow={(direction: string) => (
            <Icon
              name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
              size={32}
              color="#263F69"
            />
          )}
          dayComponent={({ date, state }: any) => {
            const dayStr = date.dateString;
            const tripsOnDay = activeTrips.filter((trip) => {
              if (!trip.startOrDepartureDate) return false;
              const startStr = new Date(trip.startOrDepartureDate).toISOString().split('T')[0];
              const endStr = trip.endOrReturnDate
                ? new Date(trip.endOrReturnDate).toISOString().split('T')[0]
                : startStr;
              return dayStr >= startStr && dayStr <= endStr;
            });

            return (
              <View style={{ borderRadius: 6, margin: 4, backgroundColor: "#f2f4f7", height: 80, flex: 1, width: '90%', padding: 4, paddingTop: 4 }}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: state === 'today' ? 'bold' : 'normal',
                    color: state === 'disabled' ? '#d9e1e8' : state === 'today' ? '#263F69' : '#2d4150',
                    marginBottom: 2,
                  }}
                >
                  {date.day} 
                </Text>
                <View style={{ gap: 2 }}>
                  {tripsOnDay.map((trip) => {
                    const status = getEffectiveStatus(trip);
                    const color = status === TravelStatus.Ongoing ? '#263F69' : '#2E7D32';
                    const startStr = new Date(trip.startOrDepartureDate!).toISOString().split('T')[0];
                    const endStr = new Date(trip.endOrReturnDate!).toISOString().split('T')[0];
                    const isStart = dayStr === startStr;
                    const isEnd = dayStr === endStr;

                    return (
                      <TouchableOpacity
                        key={trip.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          selectTravelPlan(trip);
                          setShowTravelDetail(true);
                        }}
                        style={{
                          backgroundColor: color,
                          paddingVertical: 2,
                          paddingHorizontal: 4,
                          borderRadius: 3,
                          opacity: state === 'disabled' || !isStart && !isEnd ? 0.75 : 1,
                        }}
                      >
                        <Text
                          style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {trip.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          }}
        />
      </View>
    );
  };

  const listTabsData = [
    {
      id: "ongoing",
      title: `Ongoing (${getTravelsByStatus(TravelStatus.Ongoing).length})`,
      content: renderContentForStatus(TravelStatus.Ongoing, "🌍", "No Ongoing Travels", "Your active travels will appear here!"),
    },
    {
      id: "upcoming",
      title: `Upcoming (${getTravelsByStatus(TravelStatus.Upcoming).length})`,
      content: renderContentForStatus(TravelStatus.Upcoming, "✈️", "No Upcoming Travels", "Start planning your next adventure!"),
    },
    {
      id: "draft",
      title: `Draft (${getTravelsByStatus(TravelStatus.Draft).length})`,
      content: renderContentForStatus(TravelStatus.Draft, "📝", "No Drafts", "Your saved drafts will appear here"),
    },
    {
      id: "completed",
      title: `Completed (${getTravelsByStatus(TravelStatus.Completed).length})`,
      content: renderContentForStatus(TravelStatus.Completed, "📸", "No Completed Travels", "Your travel memories will appear here"),
    },
    {
      id: "archived",
      title: `Archived (${getTravelsByStatus(TravelStatus.Archieved).length})`,
      content: renderContentForStatus(TravelStatus.Archieved, "📦", "No Archived Travels", "Your archived travels will appear here"),
    },
    {
      id: "cancelled",
      title: `Cancelled (${getTravelsByStatus(TravelStatus.Cancelled).length})`,
      content: renderContentForStatus(TravelStatus.Cancelled, "❌", "No Cancelled Travels", "Your cancelled travels will appear here"),
    },
  ];

  const renderListView = () => (
    <View>
      <Tabs tabs={listTabsData} type="default" hasActionTripStatus={getTravelsByStatus(TravelStatus.Ongoing).length > 0}/>
    </View>
  );

  const viewTabsData = [
    {
      id: "list",
      title: "List",
      content: renderListView(),
    },
    {
      id: "calendar",
      title: "Calendar",
      content: renderCalendarView(),
    },
  ];

  if (showTravelDetail && selectedTravel) {
    return (
      <TravelDetailPage
        travelData={selectedTravel}
        onBack={handleBackFromTravelDetail}
      />
    );
  }

  return (
    <View className="flex-1 pb-10">
      <StatusBar barStyle={"dark-content"} />

      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={'#263F69'} />
            <Text className="mt-2.5 text-[#666]">Loading your travel plans...</Text>
          </View>
        ) : isError ? (
          <View className="flex-1 justify-center items-center py-[60px]">
            <Text className="text-5xl mb-4">⚠️</Text>
            <Text className="text-xl font-bold text-primary mb-2">Something went wrong</Text>
            <Text className="text-red-500 m-2.5">{error?.message}</Text>
            <TouchableOpacity className="bg-primary px-5 py-2.5 rounded-lg mt-2" onPress={() => refetch()}>
              <Text className="text-white text-base font-medium">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Tabs tabs={viewTabsData} />
        )}
      </View>

      <ViewTravelModal
        travelId={selectedTravelPlan?.id || ""}
        showModal={showTravelViewModal}
        setShowModal={setShowTravelViewModal}
      />
    </View>
  );
};

export default TravelCatalog;
 