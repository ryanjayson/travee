import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialIcons";
import StatusBadge from "../../../components/StatusBadge";
import Tabs from "../../../components/Tabs/index";
import { TravelStatus, TripType } from "../../../types/enums";
import ViewTravelModal from "../components/View/Modal";
import { useTravels } from "../hooks/useTravel";
import { Travel } from "../types/TravelDto";
import TripIcon, { tripIcons } from "../../../components/TripIcon";
import CountryOutline from "../components/ShareOverlay/CountryOutline";

const TravelCatalog = () => {
  const { data: travels, isLoading, isError, error, refetch } = useTravels();
  const [showTravelViewModal, setShowTravelViewModal] = useState<boolean>(false);
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
  const [showTravelDetail, setShowTravelDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [activeViewTab, setActiveViewTab] = useState<string>("list");
  const [activeListTab, setActiveListTab] = useState<string>("ongoing");

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveViewTab("list");
      setActiveListTab(route.params.initialTab);
      navigation.setParams({ initialTab: undefined });
    }
  }, [route.params?.initialTab]);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getEffectiveStatus = (travel: Travel): TravelStatus => {
    if (travel.status === TravelStatus.Past || 
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
    let filtered: Travel[] = [];
    if (status === TravelStatus.Archieved) {
      filtered = travels?.filter(t => t.isArchived || t.status === TravelStatus.Archieved) || [];
    } else {
      filtered = travels?.filter(t => !t.isArchived && t.status !== TravelStatus.Archieved && t.status === status) || [];
    }
    return [...filtered].sort((a, b) => {
      const getNormalizedDate = (dateVal: any) => {
        if (!dateVal) return 0;
        let d: Date;
        if (dateVal instanceof Date) {
          d = dateVal;
        } else {
          const str = String(dateVal);
          const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (match) {
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            const day = parseInt(match[3], 10);
            return new Date(year, month, day).getTime();
          }
          d = new Date(dateVal);
        }
        if (!d || isNaN(d.getTime())) return 0;
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      };
      const timeA = getNormalizedDate(a.startOrDepartureDate);
      const timeB = getNormalizedDate(b.startOrDepartureDate);

      // Keep items without dates at the bottom
      if (timeA === 0 && timeB === 0) return 0;
      if (timeA === 0) return 1;
      if (timeB === 0) return -1;

      // Sort Upcoming ascending (closest trip first), all others descending
      if (status === TravelStatus.Upcoming) {
        return timeA - timeB;
      }
      return timeB - timeA;
    });
  };

  const handleViewModeTravel = (travel: Travel) => {
    if (travel && travel.id) {
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

    const getCountryName = (dest?: string) => {
      if (!dest) return "";
      const parts = dest.split(",");
      return parts[parts.length - 1].trim();
    };
    const destinationCountry = getCountryName(travel.destination);

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

    const tripIconConfig = travel.type != null ? tripIcons.find((i) => i.tripType === travel.type) : null;
    const assignedColor = tripIconConfig ? tripIconConfig.color : "#9E9E9E";

    return (
      <View 
        key={travel.id} 
        className="bg-white rounded-xl mb-2 shadow-sm mx-4 overflow-hidden "
      >
        <TouchableOpacity onPress={() => handleViewModeTravel(travel)}>
          <View className="p-4 border border-[#E0E0E0] rounded-xl relative overflow-hidden">
          
            <View className="flex-row justify-between items-start ">
              <View className="flex-row items-center gap-7 flex-1 mr-2">
                  {destinationCountry ? (
                    <View className="w-[60px] h-[60px] justify-center items-center pl-lg ">
                      <CountryOutline
                        countryName={destinationCountry}
                        width={120}
                        height={120}
                        strokeColor="#263F69"
                        strokeWidth={0.5}
                        fillColor={assignedColor + '50'}
                        hideShadows={true}
                      />
                    </View>
                  ) : null}

                <View className="flex-1 gap-y-1">
                  <Text className="text-xl leading-5 font-medium ">{travel.title}</Text>
                  <Text className="text-base  text-[#999]">{travel.destination || ""}</Text>
            
                  <View 
                    style={{ backgroundColor: assignedColor + '10' }}
                    className="flex-row gap-2 mt-sm p-0 px-2 rounded-full items-center"
                  >
                    {travel.type != null && travel.type !== TripType.none && (
                    <TripIcon type={travel.type} size={18} showIconOnly={true} />
                    )}
                    <Text className="text-sm text-[#999]">
                      {dateRange}  {duration ? `| ${duration}` : ""}
                    </Text>
                  </View>
                 
                </View>
              </View>
             { travel && travel.isArchived &&(
                  <View className="flex-row items-start justify-start">
                    <StatusBadge status={effectiveStatus} />
                  </View>
             )}
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
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10, flexGrow: 1}}
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
          <View key={data[0].id} className="rounded-[44px] mb-2 bg-white shadow-sm shadow-black/10 elevation-xl mx-4 overflow-hidden">
            <TouchableOpacity onPress={() => handleViewModeTravel(data[0])}>
              <View className="p-10 border border-success-500/50 rounded-[44px]">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-3xl font-medium">{data[0].title}</Text>
                    <Text className="text-lg  text-secondary">Travelling to {data[0].destination}</Text>
                    <Text className="text-lg  text-secondary">Until {data[0].endOrReturnDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    <Text className="text-base  mt-4 text-tertiary">{data[0].description}</Text>
                  </View>
                </View>

                <View className=" flex-row justify-between content-between items-center mb-3">
                  <View className="flex-1 items-start mt-lg">
                    <TouchableOpacity
                      onPress={() =>handleViewModeTravel(data[0])}
                      accessibilityRole="button"
                      activeOpacity={0.7}
                      className="flex-row items-center gap-1 py-3 px-4 rounded-full bg-gray-100/50"
                    >
                      <Icon name="map" size={20} color={"#344054"} />
                      <Text className="font-medium text-xl  text-secondary">View trip</Text>
                    </TouchableOpacity>
                  </View>

                  {data[0].destination ? (() => {
                    const tripIconConfig = data[0].type != null ? tripIcons.find((i) => i.tripType === data[0].type) : null;
                    const assignedColor = tripIconConfig ? tripIconConfig.color : "#FFFFFF";
                    const destCountryName = data[0].destination.split(",").pop()?.trim() || "";
                    return (
                      <View className="absolute right-0 opacity-50">
                        <CountryOutline
                          countryName={destCountryName}
                          width={180}
                          height={180}
                          strokeColor="#FFFFFF"
                          strokeWidth={1}
                          fillColor={assignedColor + '50'}
                          hideShadows={true}
                          showCountryTitle={true}
                        />
                      </View>
                    );
                  })() : null}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) :
        data && data.length > 0 ? (
          data.map(renderTravelCard)
        ) : (
          <View className="flex-1 justify-center items-center w-full">
            <Text className="text-5xl mb-4 text-primary/60 h-[50px]">{emptyIcon}</Text>
            <Text className="text-2xl text-tertiary mb-1">
              {emptyTitle}
            </Text>
            <Text className="text-base text-tertiary text-center px-10 tracking-wide">
              {emptySubtitle}
            </Text>

            <View className="absolute -bottom-5 right-18">
              <Text className="text-lg text-red-600 font-medium ">
              Add a trip now
              </Text>
              <Text className="text-7xl mb-4 ml-5xl text-red-600 -mt-6">⤵︎</Text>
            </View>
          </View>
        )}
        
      </ScrollView>
    );
  };

  const renderCalendarView = () => {
    const activeTrips = (travels || []).filter((trip) => {
      const status = getEffectiveStatus(trip);
      return (
        status === TravelStatus.Ongoing ||
        status === TravelStatus.Upcoming ||
        status === TravelStatus.Draft ||
        status === TravelStatus.Past
      );
    });

    const getStatusColors = (status: TravelStatus) => {
      switch (status) {
        case TravelStatus.Ongoing:
          return { bg: "#DCFAE6", text: "#079455", label: "Ongoing" };
        case TravelStatus.Upcoming:
          return { bg: "rgba(185, 230, 254, 0.4)", text: "#263F69", label: "Upcoming" };
        case TravelStatus.Draft:
          return { bg: "#E0E0E0", text: "#666666", label: "Draft" };
        case TravelStatus.Past:
          return { bg: "#fab00f", text: "#FFFFFF", label: "Past" };
        default:
          return { bg: "#E0E0E0", text: "#666666", label: "Unknown" };
      }
    };

    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between py-3 px-8 border-b border-gray-100 gap-x-4 gap-y-2 flex-wrap">
          <View className="flex-row items-center gap-1.5">
            <View className="w-5 h-5 rounded-full bg-[#DCFAE6] border border-[#079455]" />
            <Text className="text-xs text-[#666]">Ongoing</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-5 h-5 rounded-full bg-[#B9E6FE]/40 border border-[#263F69]/40" />
            <Text className="text-xs text-[#666]">Upcoming</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-5 h-5 rounded-full bg-[#E0E0E0] border border-[#666666]" />
            <Text className="text-xs text-[#666]">Draft</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-5 h-5 rounded-full bg-[#fab00f]" />
            <Text className="text-xs text-[#666]">Past</Text>
          </View>
        </View>

        <Calendar
          style={{}}
          enableSwipeMonths={true}
          theme={{
            monthTextColor: '#263F69',
            textMonthFontWeight: '600',
            textMonthFontSize: 16,
            textSectionTitleColor: '#666666',
            todayTextColor: '#263F69',
            arrowColor: '#263F69',
            "stylesheet.calendar.main": {
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
                height: 88,
              },
            },
          }}
          renderArrow={(direction: string) => (
            <View className="bg-gray-50 rounded-full w-14 h-14 items-center justify-center">
              <Icon
                name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
                size={28}
                color="#263F69"
              />
            </View>
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
                    const { bg: bgColor, text: textColor } = getStatusColors(status);
                    const startStr = new Date(trip.startOrDepartureDate!).toISOString().split('T')[0];
                    const endStr = new Date(trip.endOrReturnDate!).toISOString().split('T')[0];
                    const isStart = dayStr === startStr;
                    const isEnd = dayStr === endStr;

                    return (
                      <TouchableOpacity
                        key={trip.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          handleViewModeTravel(trip);
                        }}
                        style={{
                          backgroundColor: bgColor,
                          paddingVertical: 2,
                          paddingHorizontal: 4,
                          borderRadius: 3,
                          borderWidth: status === TravelStatus.Past ? 0 : 0.5,
                          borderColor: textColor,
                          opacity: state === 'disabled' || !isStart && !isEnd ? 0.50 : 1,
                        }}
                      >
                        <Text
                          style={{ color: textColor, fontSize: 10, fontWeight: '600' }}
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
      content: renderContentForStatus(TravelStatus.Ongoing, "🌍", "No Ongoing Trip", "Your active trips will appear here!"),
    },
    {
      id: "upcoming",
      title: `Upcoming (${getTravelsByStatus(TravelStatus.Upcoming).length})`,
      content: renderContentForStatus(TravelStatus.Upcoming, "🗺️⁀જ✈︎", "No Upcoming Trips", "Start planning your next adventure!"),
    },
    {
      id: "draft",
      title: `Draft (${getTravelsByStatus(TravelStatus.Draft).length})`,
      content: renderContentForStatus(TravelStatus.Draft, "✎ᝰ", "No Drafts", "Your saved drafts will appear here"),
    },
    {
      id: "past",
      title: `Past (${getTravelsByStatus(TravelStatus.Past).length})`,
      content: renderContentForStatus(TravelStatus.Past, "⏱", "No Past Trips", "Your travel memories will appear here"),
    },
    {
      id: "archived",
      title: `Archived (${getTravelsByStatus(TravelStatus.Archieved).length})`,
      content: renderContentForStatus(TravelStatus.Archieved, "𓄲ꗃ", "No Archived Trips", "Your archived trips will appear here"),
    },
    {
      id: "cancelled",
      title: `Cancelled (${getTravelsByStatus(TravelStatus.Cancelled).length})`,
      content: renderContentForStatus(TravelStatus.Cancelled, "✖", "No Cancelled Trips", "Your cancelled trips will appear here"),
    },
  ];

  const renderListView = () => (
    <View className="py-2 flex-1 bg-gray-100">
      <Tabs 
        tabs={listTabsData} 
        activeTabId={activeListTab} 
        onTabChange={setActiveListTab} 
        type="default" 
        expanded={true} 
        hasActionTripStatus={getTravelsByStatus(TravelStatus.Ongoing).length > 0}
      />
    </View>
  );

  const viewTabsData = [
    {
      id: "list",
      title: "List",
      icon: "list",
      content: renderListView(),
    },
    {
      id: "calendar",
      title: "Calendar",
      icon: "calendar-month",
      content: renderCalendarView(),
    },
  ];

  if (showTravelDetail && selectedTravel) {
    return (
      // <TravelDetailPage
      //   travelData={selectedTravel}
      //   onBack={handleBackFromTravelDetail}
      // />
      <></>
    );
  }

  return (
    <View className="flex-1">
      <StatusBar barStyle={"dark-content"} />

      <View className="flex-1 bg-white">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={'#263F69'} />
            <Text className="mt-2.5 text-tertiary text-lg">Loading your travel plans...</Text>
          </View>
        ) : isError ? (
          <View className="flex-1 justify-center items-center py-[60px]">
             <Icon
              name="warning-amber"
              size={60}
              color="#fdd787"
            />
            <Text className="text-xl font-semibold mb-2">Something went wrong</Text>
            <Text className="text-red-500 m-2.5">{error?.message}</Text>
            <TouchableOpacity className="bg-primary px-5 py-2.5 rounded-full " onPress={() => refetch()}>
              <Text className="text-white text-base">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
            <Tabs 
              tabs={viewTabsData} 
              activeTabId={activeViewTab} 
              onTabChange={setActiveViewTab} 
              expanded={true} 
              wrapperStyle="pb-2 w-full"
            />
        )}
      </View>

      <ViewTravelModal
        travelId={selectedTravel?.id || ""}
        showModal={showTravelViewModal}
        setShowModal={setShowTravelViewModal}
      />
    </View>
  );
};

export default TravelCatalog;
 