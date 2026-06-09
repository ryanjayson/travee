import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Dimensions, RefreshControl, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAllActivities } from '../features/Travel/hooks/useActivity';
import { useTravels } from '../features/Travel/hooks/useTravel';
import { Travel } from '../features/Travel/types/TravelDto';
import { ActivityType, TravelStatus, getActivityTypeLabel } from '../types/enums';
import Hero from '../components/Home/Hero/index';
import UpcomingTrips from '../components/Home/UpcomingTrips';
import { useTravelContext } from "../context/TravelContext";
import { TravelPlanDetail } from '../types/context/travel';

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { data: travels, isLoading, isError, error, refetch } = useTravels();
  const { data: allActivities } = useAllActivities();
  const { selectTravelPlan } = useTravelContext();
  const [currentOngoingTrip, setCurrentOngoingTrip] = useState<Travel | null>(null);

  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const completedTripIds = travels?.filter(t => t.status === TravelStatus.Completed).map(t => t.id) || [];
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

    if (trip && trip.id) {
      selectTravelPlan(trip as TravelPlanDetail);
    }
  }, [travels]);

  const getTripStats = () => {
    if (!travels) return { total: 0, completed: 0, upcoming: 0 };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let completed = 0, upcoming = 0;
    travels.forEach(t => {
      if (t.isArchived || t.status === TravelStatus.Cancelled || t.status === TravelStatus.Archieved) return;
      if (t.status === TravelStatus.Completed) { completed++; return; }
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
      [ActivityType.transportation]: 'bus',
      [ActivityType.walk]: 'walk',
      [ActivityType.sightseeing]: 'camera',
      [ActivityType.preparation]: 'construct',
      [ActivityType.rest]: 'bed',
      [ActivityType.hikeOrCamp]: 'compass',
      [ActivityType.motorcycleRide]: 'bicycle',
      [ActivityType.meetup]: 'people',
      [ActivityType.rideRental]: 'car',
    };
    return (map[type ?? 0] ?? 'location') as any;
  };

  const getAllUpcomingTrips = (): Travel[] => {
    if (!travels) return [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return travels
      .filter(t => {
        if (t.isArchived || [TravelStatus.Cancelled, TravelStatus.Archieved, TravelStatus.Completed, TravelStatus.Ongoing].includes(t.status as TravelStatus)) return false;
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
    <View className="flex-1 bg-gray-100">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }} 
        className="bg-gray-100"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#263F69"]}
            tintColor="#263F69"
          />
        }>

        <Hero ongoingTrip={currentOngoingTrip} />

        <View
          className="bg-gray-100 "
          style={{ marginTop: currentOngoingTrip ? 0 :-50, borderTopLeftRadius: currentOngoingTrip ? 0 : 30, borderTopRightRadius: currentOngoingTrip ? 0 : 30 }}
        >
          <UpcomingTrips upcomingTrips={upcomingTrips} isLoading={isLoading} />

          <View className="justify-between mb-3">
              <Text className=" px-6 text-xl font-bold text-gray-800">Travel Insights</Text>
          <View className="flex-row px-5 mb-6 gap-[15px]">
          <View className="flex-1 bg-[#E8F5E8] rounded-2xl p-4 shadow-sm elevation-2 border border-gray-300">
              <View className="flex-row items-center">
                <View className="p-2 rounded-lg mr-2.5">
                  <Ionicons name="airplane" size={34} color="#2E7D32" />
                </View>
              </View>
              <View className="flex-row items-baseline gap-1.5">
                <Text className="text-2xl font-extrabold text-gray-900">{tripStats.completed}</Text>
                <Text className="text-[12px] text-gray-500 font-medium">Done</Text>
              </View>
              <View className="flex-row items-baseline gap-1.5">
                <Text className="text-2xl font-extrabold text-gray-900">{tripStats.upcoming}</Text>
                <Text className="text-[12px] text-gray-500 font-medium">Upcoming</Text>
              </View>
              <View className="flex-row items-baseline mb-2">
                    <Text className="text-sm text-gray-500 font-medium">Trips Stat</Text>
              </View>
            </View>

       
            {/* Activity Heatmap (2/3) */}
            <View className="flex-2 bg-white rounded-2xl p-4 shadow-sm elevation-0 border border-gray-100">
              <View className="absolute top-[15px] left-2 ">
                  <Text className="text-xs font-bold text-gray-600 mr-2">{currentYear}</Text>
              </View>
              <View className="justify-between mr-2 absolute left-lg top-[30px] gap-y-1">
                  <Text className="text-xs text-gray-400">M</Text>
                  <Text className="text-xs text-gray-400">T</Text>
                  <Text className="text-xs text-gray-400">W</Text>
                  <Text className="text-xs text-gray-400">T</Text>
                  <Text className="text-xs text-gray-400">F</Text>
                  <Text className="text-xs text-gray-400">S</Text>
                  <Text className="text-xs text-gray-400">S</Text>
                </View>

              <View className="pl-4">
        
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View className="flex-row mb-1 ml-2 items-center ">
                    <View className="flex-row justify-between" style={{ width: 424 }}>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                        <Text key={i} className="text-[10px] text-gray-400">{month}</Text>
                      ))}
                    </View>
                  </View>
                  
                  <View className="flex-row">
                    <View className="flex-row gap-0.5">
                      {Array.from({ length: 52 }).map((_, colIndex) => (
                        <View key={colIndex} className="gap-0.5">
                          {Array.from({ length: 7 }).map((_, rowIndex) => {
                            const cellDate = new Date(startDate);
                            cellDate.setDate(cellDate.getDate() + (colIndex * 7 + rowIndex));
                            const dateStr = cellDate.toISOString().split('T')[0];
                            const count = activityCountsByDay[dateStr] || 0;
                            
                            let level = 0;
                            if (count > 0) level = 1;
                            if (count > 2) level = 2;
                            if (count > 4) level = 3;
                            if (count > 6) level = 4;

                            const colors = [
                              'bg-gray-100',      // 0
                              'bg-brand-100',     // 1
                              'bg-brand-300',     // 2
                              'bg-brand-500',     // 3
                              'bg-brand-primary'  // 4
                            ];
                            return (
                              <View 
                                key={rowIndex} 
                                className={`w-[15px] h-[15px] rounded-sm ${colors[level]}`}
                              />
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </ScrollView>
              </View>
      
            </View>
          </View>
          </View>

          <View className="pb-2">
            <Text className="text-xl font-bold text-gray-800 px-5 mb-[15px]">Your top activities</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
              {topActivityTypes.length === 0 ? (
                <Text className="text-gray-500">No activities logged yet.</Text>
              ) : (
                topActivityTypes.map((stat, i) => (
                  <View key={stat.type || i} className="w-[130px] bg-white rounded-2xl p-[15px] shadow-sm elevation-2 border border-gray-100 items-center">
                    <View className="bg-gray-100 w-11 h-11 rounded-full justify-center items-center mb-3">
                      <Ionicons name={getIconForActivityType(stat.type)} size={22} color="#263F69" />
                    </View>
                    <Text className="text-xl font-extrabold text-gray-900 mb-0.5">{stat.count}</Text>
                    <Text className="text-[12px] text-gray-500 font-medium text-center" numberOfLines={1}>{stat.typeName}s</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
