import React from 'react';
import { View, Text, ScrollView, FlatList, Image, TouchableOpacity, StatusBar, TextInput, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTravels } from '../features/Travel/hooks/useTravel';
import { useAllActivitiesWithDestination } from '../features/Travel/hooks/useActivity';
import { Travel } from '../features/Travel/types/TravelDto';
import { TravelStatus, ActivityType } from '../types/enums';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.8;

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { data: travels, isLoading } = useTravels();
  const { data: allActivities } = useAllActivitiesWithDestination();

  // ─── Stats ───────────────────────────────────────────────────────────────
  const getTripStats = () => {
    if (!travels) return { total: 0, completed: 0, upcoming: 0 };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let completed = 0, upcoming = 0;
    travels.forEach(t => {
      if (t.status === TravelStatus.Cancelled || t.status === TravelStatus.Archieved) return;
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

  // ─── Top activity types ───────────────────────────────────────────────────
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

  // ─── Ongoing trip: status Ongoing OR dates straddle today ─────────────────
  const getOngoingTrip = (): Travel | null => {
    if (!travels) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return travels.find(t => {
      if ([TravelStatus.Cancelled, TravelStatus.Archieved, TravelStatus.Completed].includes(t.status as TravelStatus)) return false;
      if (t.status === TravelStatus.Ongoing) return true;
      if (t.startOrDepartureDate && t.endOrReturnDate) {
        const s = new Date(t.startOrDepartureDate); s.setHours(0, 0, 0, 0);
        const e = new Date(t.endOrReturnDate);       e.setHours(0, 0, 0, 0);
        return s <= today && today <= e;
      }
      return false;
    }) ?? null;
  };

  // ─── All upcoming trips sorted by start date ──────────────────────────────
  const getAllUpcomingTrips = (): Travel[] => {
    if (!travels) return [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return travels
      .filter(t => {
        if ([TravelStatus.Cancelled, TravelStatus.Archieved, TravelStatus.Completed, TravelStatus.Ongoing].includes(t.status as TravelStatus)) return false;
        if (!t.startOrDepartureDate) return false;
        const s = new Date(t.startOrDepartureDate); s.setHours(0, 0, 0, 0);
        return s > today;
      })
      .sort((a, b) => new Date(a.startOrDepartureDate!).getTime() - new Date(b.startOrDepartureDate!).getTime());
  };

  // ─── Derived data ─────────────────────────────────────────────────────────
  const tripStats          = getTripStats();
  const topActivityTypes   = getTopActivityTypes();
  const favoriteActivityName = topActivityTypes[0]?.typeName ?? 'N/A';
  const ongoingTrip        = getOngoingTrip();
  const upcomingTrips      = getAllUpcomingTrips();

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatDate = (v?: Date | string) =>
    v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  const getDuration = (s?: Date | string, e?: Date | string) => {
    if (!s || !e) return '';
    const days = Math.ceil(Math.abs(new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1;
    return `${days} Day${days > 1 ? 's' : ''}`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Hero Banner ─────────────────────────────────────────────── */}
        <View className="w-full h-[360px] relative">
          <Image
            source={require('../assets/images/home_hero.png')}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/50" />

          <View className="absolute left-5 right-5" style={{ top: 130 }}>
            <Text
              className="text-white text-[32px] font-extrabold mb-1"
              style={{ textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 }}
            >
              Where to next?
            </Text>
            <Text
              className="text-gray-100 text-base font-medium mb-5"
              style={{ textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 }}
            >
              Plan your next adventure with Travie.
            </Text>

            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-lg elevation-5">
              <Ionicons name="search" size={20} color="#6b7280" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Search destinations, places..."
                placeholderTextColor="#9ca3af"
                className="flex-1 text-base text-gray-800"
              />
            </View>
          </View>
        </View>

        {/* ── Content sheet sliding over hero ─────────────────────────── */}
        <View
          className="bg-gray-100 pt-7"
          style={{ marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
        >

          {/* ── Ongoing Trip ────────────────────────────────────────────── */}
          <View className="px-5 mb-6">
           
            {isLoading ? (
              <Text className="text-gray-500 text-sm">Loading...</Text>
            ) : ongoingTrip ? (
              <View
                className="rounded-2xl overflow-hidden elevation-6"
                style={{ backgroundColor: '#0C4C8A', shadowColor: '#0C4C8A', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}
              >
                {/* Decorative circles */}
                <View className="absolute" style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)', top: -40, right: -30 }} />
                <View className="absolute" style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: 20 }} />

                <View className="p-5">
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-green-400" />
                    <Text className="text-green-300 text-[10px] font-bold tracking-widest uppercase">Ongoing</Text>
                  </View>

                  <Text className="text-white text-2xl font-extrabold mb-1" numberOfLines={1}>
                    {ongoingTrip.title}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mb-4">
                    <Ionicons name="location" size={13} color="rgba(255,255,255,0.65)" />
                    <Text className="text-white/65 text-sm font-medium" numberOfLines={1}>
                      {ongoingTrip.destination}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="calendar" size={13} color="rgba(255,255,255,0.65)" />
                      <Text className="text-white/65 text-[13px]">
                        {formatDate(ongoingTrip.startOrDepartureDate)}
                        {ongoingTrip.endOrReturnDate ? ` → ${formatDate(ongoingTrip.endOrReturnDate)}` : ''}
                      </Text>
                    </View>
                    {getDuration(ongoingTrip.startOrDepartureDate, ongoingTrip.endOrReturnDate) ? (
                      <View className="bg-white/15 px-3 py-1 rounded-full">
                        <Text className="text-white text-[12px] font-semibold">
                          {getDuration(ongoingTrip.startOrDepartureDate, ongoingTrip.endOrReturnDate)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ) : (
              <View className="bg-white rounded-2xl px-4 py-5 items-center border border-dashed border-gray-200">
                <Ionicons name="navigate-circle-outline" size={32} color="#d1d5db" />
                <Text className="text-gray-400 text-sm font-medium mt-2">No ongoing trip</Text>
              </View>
            )}
          </View>

          {/* ── Upcoming Trips Carousel ──────────────────────────────────── */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-5 mb-3">
              <Text className="text-xl font-bold text-gray-800">Upcoming Trips</Text>
              {upcomingTrips.length > 0 && (
                <Text className="text-sm text-[#0C4C8A] font-semibold">
                  {upcomingTrips.length} trip{upcomingTrips.length > 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {isLoading ? (
              <Text className="text-gray-500 text-sm px-5">Loading...</Text>
            ) : upcomingTrips.length > 0 ? (
              <FlatList
                data={upcomingTrips}
                keyExtractor={item => String(item.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + 16}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                renderItem={({ item, index }) => (
                  <View
                    style={{ width: CARD_WIDTH }}
                    className="bg-white rounded-2xl p-4 shadow-sm elevation-3 border border-gray-100"
                  >
                    {/* Index badge */}
                    <View className="absolute top-3.5 right-4">
                      <Text className="text-[11px] text-gray-300 font-semibold">#{index + 1}</Text>
                    </View>

                    {/* Title + destination */}
                    <View className="mb-3 pr-8">
                      <Text className="text-lg font-bold text-[#0C4C8A] mb-1" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="location-outline" size={13} color="#9ca3af" />
                        <Text className="text-sm text-gray-400 font-medium" numberOfLines={1}>
                          {item.destination || 'Destination TBD'}
                        </Text>
                      </View>
                    </View>

                    <View className="border-t border-gray-100 mb-3" />

                    {/* Date + duration */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                        <Text className="text-[13px] font-semibold text-gray-500">
                          {item.startOrDepartureDate ? formatDate(item.startOrDepartureDate) : 'Date TBD'}
                        </Text>
                      </View>
                      {getDuration(item.startOrDepartureDate, item.endOrReturnDate) ? (
                        <View className="bg-blue-50 px-2.5 py-0.5 rounded-full">
                          <Text className="text-[12px] text-[#0C4C8A] font-semibold">
                            {getDuration(item.startOrDepartureDate, item.endOrReturnDate)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                )}
              />
            ) : (
              <View className="mx-5 bg-white rounded-2xl p-6 items-center border border-dashed border-gray-200">
                <Ionicons name="map-outline" size={32} color="#d1d5db" />
                <Text className="text-base text-gray-500 font-medium mt-2 mb-1">No upcoming trips planned</Text>
                <Text className="text-sm text-gray-400 text-center">
                  Tap the + button below to start planning your next adventure!
                </Text>
              </View>
            )}
          </View>

          {/* ── Stats ───────────────────────────────────────────────────── */}
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

          {/* ── Top Activities ───────────────────────────────────────────── */}
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
