import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Dimensions, FlatList, Image, RefreshControl, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAllActivitiesWithDestination } from '../features/Travel/hooks/useActivity';
import { useTravels } from '../features/Travel/hooks/useTravel';
import { Travel } from '../features/Travel/types/TravelDto';
import { ActivityType, TravelStatus } from '../types/enums';
import Hero from '../components/Home/Hero/index';
import UpcomingTrips from '../components/Home/UpcomingTrips';
import { useTravelContext } from "../context/TravelContext";

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { data: travels, isLoading, isError, error, refetch } = useTravels();
  const { data: allActivities } = useAllActivitiesWithDestination();
  const { selectTravelPlan } = useTravelContext();
  const [currentOngoingTrip, setCurrentOngoingTrip] = useState<Travel | null>(null);

  useEffect(() => {
    if (!travels) return;
    const trip = travels?.find(t => t.status === TravelStatus.Ongoing) ?? null;
    setCurrentOngoingTrip(trip);
    const tripDetails = {
        id: trip?.id,
        title: trip?.title,
      };

      if (trip) {
        selectTravelPlan(tripDetails);
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
        const typeName = ActivityType[type];
        return { type, typeName: typeName ? typeName.charAt(0).toUpperCase() + typeName.slice(1) : 'Unknown', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getIconForActivityType = (type?: number) => {
    const map: Record<number, string> = {
      1: 'airplane', 2: 'log-in', 3: 'log-out', 4: 'car',
      5: 'cafe', 6: 'restaurant', 7: 'walk', 8: 'camera',
      9: 'cart', 10: 'briefcase', 11: 'bicycle', 12: 'bed',
    };
    return (map[type ?? 0] ?? 'location') as any;
  };

  // const getOngoingTrip = (): Travel | null => {
  //   if (!travels) return null;
  //   const today = new Date(); today.setHours(0, 0, 0, 0);
  //   // return travels.find(t => {
  //   //   // if (t.isArchived || [TravelStatus.Cancelled, TravelStatus.Archieved, TravelStatus.Completed].includes(t.status as TravelStatus)) return false;
  //   //   // if (t.startOrDepartureDate && t.endOrReturnDate) {
  //   //   //   const s = new Date(t.startOrDepartureDate);
  //   //   //   s.setHours(0, 0, 0, 0);
  //   //   //   const e = new Date(t.endOrReturnDate);
  //   //   //   e.setHours(0, 0, 0, 0);
  //   //   //   return s <= today && today <= e;
  //   //   // }

  //   //   // Fallback to status if dates are missing
  //   // return t.status === TravelStatus.Ongoing;
  //   // }) ?? null;

  //   const trip = travels.find(t => t.status === TravelStatus.Ongoing) ?? null;
  //   // const tripDetails = {
  //   //     id: trip.id,
  //   //     title: trip.title,
  //   //   };

  //   //   if (trip) {
  //   //     selectTravelPlan(tripDetails);
  //   //   }

  //   return trip;
  // };

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

  const formatDate = (v?: Date | string) =>
    v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  const getDuration = (s?: Date | string, e?: Date | string) => {
    if (!s || !e) return '';
    const days = Math.ceil(Math.abs(new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1;
    return `${days} Day${days > 1 ? 's' : ''}`;
  };

  const handleRefresh = async () => {
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
            colors={["#0C4C8A"]}
            tintColor="#0C4C8A"
          />
        }>

        <Hero ongoingTrip={currentOngoingTrip} />

        <View
          className="bg-gray-100 "
          style={{ marginTop: currentOngoingTrip ? 0 :-50, borderTopLeftRadius: currentOngoingTrip ? 0 : 30, borderTopRightRadius: currentOngoingTrip ? 0 : 30 }}
        >
          <UpcomingTrips upcomingTrips={upcomingTrips} isLoading={isLoading} />

          <View className="flex-row px-5 mb-6 gap-[15px]">
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm elevation-2 border border-gray-100">
              <View className="flex-row items-center mb-2">
                <View className="bg-[#E8F5E8] p-2 rounded-lg mr-2.5">
                  <Ionicons name="airplane" size={18} color="#2E7D32" />
                </View>
                <Text className="text-sm text-gray-500 font-medium">Total Trips</Text>
              </View>
              <View className="flex-row items-baseline gap-1.5">
                <Text className="text-2xl font-extrabold text-gray-900">{tripStats.completed}</Text>
                <Text className="text-[12px] text-gray-500 font-medium">Done</Text>
                <Text className="text-2xl font-extrabold text-gray-900 ml-1">{tripStats.upcoming}</Text>
                <Text className="text-[12px] text-gray-500 font-medium">Upcoming</Text>
              </View>
            </View>

            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm elevation-2 border border-gray-100">
              <View className="flex-row items-center mb-2">
                <View className="bg-[#E3F2FD] p-2 rounded-lg mr-2.5">
                  <Ionicons name="heart" size={18} color="#0C4C8A" />
                </View>
                <Text className="text-sm text-gray-500 font-medium">Favorite</Text>
              </View>
              <Text className="text-xl font-extrabold text-gray-900" numberOfLines={1}>{favoriteActivityName}</Text>
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
                      <Ionicons name={getIconForActivityType(stat.type)} size={22} color="#0C4C8A" />
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
