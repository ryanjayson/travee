import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Dimensions, RefreshControl, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAllActivities } from '../features/Travel/hooks/useActivity';
import { useTravels } from '../features/Travel/hooks/useTravel';
import { Travel } from '../features/Travel/types/TravelDto';
import { ActivityType, TravelStatus, getActivityTypeLabel } from '../types/enums';
import Hero from '../components/Home/Hero/index';
import UpcomingTrips from '../components/Home/UpcomingTrips';
import ViewTravelModal from '../features/Travel/components/View/Modal';
import CreateTripModal from '../features/Travel/components/CreateOrEdit/Modal';
import OnboardingModal from '../components/OnboardingModal';
import { useUserProfile } from '../hooks/useUserProfile';
import CountryOutline from '../features/Travel/components/ShareOverlay/CountryOutline';
import { NotificationsModal } from '../components/NotificationsModal';
import { 
  fetchLocalNotifications, 
  fetchUnreadNotificationsCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../services/local/notificationService';

const COUNTRY_CODES: Record<string, string> = {
  "Philippines": "PH",
  "United States": "US",
  "United Kingdom": "GB",
  "Australia": "AU",
  "Canada": "CA",
  "Japan": "JP",
  "South Korea": "KR",
  "Singapore": "SG",
  "Germany": "DE",
  "France": "FR",
  "Italy": "IT",
  "Spain": "ES",
  "Thailand": "TH",
  "Malaysia": "MY",
  "Indonesia": "ID",
  "Vietnam": "VN",
  "China": "CN",
  "India": "IN",
  "Brazil": "BR",
  "Mexico": "MX",
};

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const { data: travels, isLoading, isError, error, refetch } = useTravels();
  const { data: allActivities } = useAllActivities();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const countryCode = profile?.defaultCountry ? (COUNTRY_CODES[profile.defaultCountry] || "") : "";
  const [currentOngoingTrip, setCurrentOngoingTrip] = useState<Travel | null>(null);
  const [showTravelViewModal, setShowTravelViewModal] = useState<boolean>(false);
  const [selectedTravelForModal, setSelectedTravelForModal] = useState<Travel | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [prefilledTripData, setPrefilledTripData] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  const loadNotificationsData = async () => {
    try {
      const count = await fetchUnreadNotificationsCount();
      setUnreadNotifications(count);
      if (showNotificationsModal) {
        const list = await fetchLocalNotifications();
        setNotificationsList(list);
      }
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    loadNotificationsData();
    const interval = setInterval(loadNotificationsData, 8000);
    return () => clearInterval(interval);
  }, [showNotificationsModal]);

  const handleNotificationPress = async (notif: any) => {
    if (!notif.id) return;
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
      loadNotificationsData();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    loadNotificationsData();
  };

  const handlePressTrip = (trip: Travel) => {
    if (trip && trip.id) {
      setSelectedTravelForModal(trip);
      setShowTravelViewModal(true);
    }
  };

  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const completedTripIds = travels?.filter(t => t.status === TravelStatus.Past).map(t => t.id) || [];
  // const activitiesFromCompletedTrips = allActivities?.filter(a => a.travelId && completedTripIds.includes(a.travelId)) || [];
  
  const activityCountsByDay: Record<string, number> = {};
  allActivities && allActivities.forEach(a => {
    if (a.createdAt) {
      const dateStr = new Date(a.createdAt).toISOString().split('T')[0];
      activityCountsByDay[dateStr] = (activityCountsByDay[dateStr] || 0) + 1;
    }
  });

  useEffect(() => {
    if (!travels) return;
    const trip = travels?.find(t => t.status === TravelStatus.Ongoing) ?? null;
    setCurrentOngoingTrip(trip);
  }, [travels]);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  useEffect(() => {
    if (!isProfileLoading && !profile) {
      setShowOnboarding(true);
    }
  }, [profile, isProfileLoading]);

  const getTripStats = () => {
    if (!travels) return { total: 0, completed: 0, upcoming: 0 };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let completed = 0, upcoming = 0;
    travels.forEach(t => {
      if (t.isArchived || t.status === TravelStatus.Cancelled || t.status === TravelStatus.Archieved) return;
      if (t.status === TravelStatus.Past) { completed++; return; }
      if (t.status === TravelStatus.Upcoming)  { upcoming++;  return; }
      if (t.startOrDepartureDate) {
        const start = new Date(t.startOrDepartureDate); start.setHours(0, 0, 0, 0);
        const end   = t.endOrReturnDate ? new Date(t.endOrReturnDate) : start;
        end.setHours(0, 0, 0, 0);
        if (end < today) completed++;
        else if (start >= today) upcoming++;
      }
    });
    return { total: travels.length, completed, upcoming };
  };

  const getTopActivityTypes = () => {
    if (!allActivities?.length) return [];
    const counts: Record<number, number> = {};
    allActivities.forEach(a => {
      const type = a.type || 0;
      if (type === 0) return;
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([typeStr, count]) => {
        const type = parseInt(typeStr, 10);
        const label = getActivityTypeLabel(type);
        return { type, typeName: label || 'Unknown', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getIconForActivityType = (type?: number) => {
    const map: Record<number, string> = {
      [ActivityType.flight]: 'airplane',
      [ActivityType.accomodation]: 'bed',
      [ActivityType.cafeRestaurant]: 'restaurant',
      [ActivityType.nature]: 'leaf',
      [ActivityType.shopppingAndService]: 'cart',
      [ActivityType.entertainmentAndRecreation]: 'film',
      // [ActivityType.transportation]: 'bus',
      [ActivityType.walk]: 'walk',
      [ActivityType.sightseeing]: 'camera',
      [ActivityType.preparation]: 'construct',
      // [ActivityType.rest]: 'bed',
      [ActivityType.hikeOrCamp]: 'compass',
      // [ActivityType.motorcycleRide]: 'bicycle',
      // [ActivityType.meetup]: 'people',
      // [ActivityType.rideRental]: 'car',
    };
    return (map[type ?? 0] ?? 'location') as any;
  };

  const getAllUpcomingTrips = (): Travel[] => {
    if (!travels) return [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return travels
      .filter(t => {
        if (t.isArchived || [TravelStatus.Cancelled, TravelStatus.Archieved, TravelStatus.Past, TravelStatus.Ongoing].includes(t.status as TravelStatus)) return false;
        if (!t.startOrDepartureDate) return false;
        const s = new Date(t.startOrDepartureDate); s.setHours(0, 0, 0, 0);
        return s > today;
      })
      .sort((a, b) => new Date(a.startOrDepartureDate!).getTime() - new Date(b.startOrDepartureDate!).getTime());
  };

  const tripStats = getTripStats();
  const topActivityTypes = getTopActivityTypes();
  const favoriteActivityName = topActivityTypes[0]?.typeName ?? 'N/A';
  const upcomingTrips = getAllUpcomingTrips();

  const handleRefresh = async () => {
    debugger;
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-red-100">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }} 
        className="bg-gray-100"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#0EA5E9"]}
            tintColor="#0EA5E9"
          />
        }>

        <Hero
          ongoingTrip={currentOngoingTrip}
          onOpenCreateTripModal={(tripData) => {
            setPrefilledTripData(tripData);
            setShowCreateModal(true);
          }}
          unreadNotifications={unreadNotifications}
          onOpenNotifications={() => setShowNotificationsModal(true)}
        />

        <View
          className="bg-gray-100 "
          style={{ 
            marginTop: currentOngoingTrip ? 0 : -50 , 
            borderTopLeftRadius: currentOngoingTrip ? 0 : 30, 
            borderTopRightRadius: currentOngoingTrip ? 0 : 30,
            paddingTop: currentOngoingTrip ? 0 : 30,
          }}
        >
          <UpcomingTrips
            upcomingTrips={upcomingTrips}
            isLoading={isLoading}
            onPressTrip={handlePressTrip}
            onAddTripPress={() => {
              setPrefilledTripData(null);
              setShowCreateModal(true);
            }}
          />

          <View className="justify-between mb-3 px-1">
            <Text className="px-6 text-xl font-semibold text-secondary mb-5">Trip Insights</Text>
              
            <View className="flex-row px-5 mb-[15px] gap-[15px]">

              <View className="flex-1 h-[112px]">
                <TouchableOpacity
                  onPress={() => navigation.navigate("Maps", { viewBy: "city" })}
                  disabled={false}
                  className="bg-white rounded-3xl border border-[#e0e0e0] p-5 h-full flex-row items-center justify-between"
                  accessibilityRole="button"
                  activeOpacity={0.7}
                >
                  <View className="flex-1 justify-center mr-2">
                    <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 ">My Country {countryCode ? `[${countryCode}]` : ""}</Text>
                    <Text className="text-3xl font-bold py-sm text-accent">0</Text>
                    <Text className="text-sm text-tertiary">Cities visited</Text>
                  </View>
                  {profile?.defaultCountry ? (
                    <View className="justify-center items-center absolute right-0 ">
                      <CountryOutline
                        countryName={profile.defaultCountry}
                        width={80}
                        height={120}
                        strokeColor="#263F69"
                        strokeWidth={0.5}
                        fillColor="rgba(59, 130, 246, 0.1)"
                        hideShadows={true}
                      />
                    </View>
                  ) : null}
                </TouchableOpacity>
              </View>

              <View className="flex-1 h-[112px]">
                <TouchableOpacity
                  onPress={() => navigation.navigate("Trips", { initialTab: "past" })}
                  disabled={false}
                  className="bg-white rounded-3xl border border-[#e0e0e0] p-5 h-full"
                  accessibilityRole="button"
                  activeOpacity={0.5}
                >
                  <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 ">Past</Text>
                  <Text className="text-3xl font-bold py-sm text-accent">{tripStats.completed}</Text>
                  <Text className="text-sm text-tertiary">Completed trips</Text>

                  <View className="w-[60px] h-[60px] justify-center items-center absolute right-0">
                    <Text className="text-5xl text-[#e0e0e0]">⏱</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row px-5 mb-6 gap-[15px] ">
              <View className="flex-1 h-[112px]">
                <TouchableOpacity
                  onPress={() => navigation.navigate("Maps", { viewBy: "country" })}
                  disabled={false}
                  className="bg-white rounded-3xl border border-[#e0e0e0] p-5 h-full"
                  accessibilityRole="button"
                  activeOpacity={0.7}
                >
                  <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 ">International</Text>
                  <Text className="text-3xl font-bold py-sm text-accent">{tripStats.completed}</Text>
                  <Text className="text-sm text-tertiary">Countries visited</Text>

                  <View className="w-[60px] h-[60px] justify-center items-center absolute right-0">
                    <Ionicons name="earth" size={28} color="#e0e0e0" />
                  </View>
                </TouchableOpacity>
              </View>

              <View className="flex-1 h-[112px]">
                <TouchableOpacity
                  onPress={() => {
                    setPrefilledTripData(null);
                    setShowCreateModal(true);
                  }}
                  disabled={false}
                  className="bg-gray-200 opacity-80 rounded-3xl border-2 border-[#e0e0e0] border-dashed p-4 h-full justify-center items-center"
                  accessibilityRole="button"
                  activeOpacity={0.5}
                >
                  <Ionicons name="add-circle-outline" size={32} color="#263F69" />
                  <Text className="text-sm font-semibold text-accent mt-2">Add trip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* <View className="pb-2">
            <Text className="text-xl font-bold text-gray-800 px-5 mb-[15px]">Your top activities</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
              {topActivityTypes.length === 0 ? (
                <Text className="text-gray-500">No activities logged yet.</Text>
              ) : (
                topActivityTypes.map((stat, i) => (
                  <View key={stat.type || i} className="w-[130px] bg-white rounded-2xl p-[15px] shadow-sm elevation-2 border border-gray-100 items-center">
                    <View className="bg-gray-100 w-11 h-11 rounded-full justify-center items-center mb-3">
                      <Ionicons name={getIconForActivityType(stat.type)} size={22} color="#0EA5E9" />
                    </View>
                    <Text className="text-xl font-extrabold text-gray-900 mb-0.5">{stat.count}</Text>
                    <Text className="text-[12px] text-gray-500 font-medium text-center" numberOfLines={1}>{stat.typeName}s</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View> */}

        </View>
      </ScrollView>

      <ViewTravelModal
        travelId={selectedTravelForModal?.id || ""}
        showModal={showTravelViewModal}
        setShowModal={setShowTravelViewModal}
      />

      <CreateTripModal
        showModal={showCreateModal}
        setShowModal={setShowCreateModal}
        tripData={prefilledTripData}
        onCreated={(createdId) => {
          setSelectedTravelForModal({ id: createdId } as any);
          setShowTravelViewModal(true);
        }}
      />

      {showOnboarding && (
        <OnboardingModal
          visible={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        unreadNotifications={unreadNotifications}
        notificationsList={notificationsList}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNotificationPress={handleNotificationPress}
      />
    </View>
  );
};

export default HomeScreen;
