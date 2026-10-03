import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  BackHandler,
  ToastAndroid,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  useFocusEffect,
  useScrollToTop,
} from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTravels } from '../features/Travel/hooks/useTravel';
import { useAllActivities } from '../features/Travel/hooks/useActivity';
import { useUserProfile } from '../hooks/useUserProfile';
import { Travel } from '../features/Travel/types/TravelDto';
import {
  TripPlanType,
  TravelStatus,
  getTripPlanTypeLabel,
} from '../types/enums';

import Hero from '../components/Home/Hero';
import UpcomingTrips from '../components/Home/UpcomingTrips';
import ViewTravelModal from '../features/Travel/components/View/Modal';
import CreateTripModal from '../features/Travel/components/CreateOrEdit/Modal';
import OnboardingModal from '../components/OnboardingModal';
import { ProfileScreen } from './ProfileScreen';
import CountryOutline from '../features/Travel/components/ShareOverlay/CountryOutline';
import { Notifications } from '../features/Notification';
import { FadeInView } from '../components/animations';

import {
  fetchLocalNotifications,
  fetchUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationLocally,
} from '../services/local/notificationService';
import {
  logger,
  ErrorSeverity,
} from '../services/errorLogger';

const NOTIFICATIONS_POLL_INTERVAL_MS = 8000;
const DOUBLE_BACK_EXIT_THRESHOLD_MS = 2000;

const GRADIENT_COLORS = [
  '#dbeaff',
  '#F2F4F7',
  '#F2F4F7',
  '#F2F4F7',
  '#F2F4F7',
  '#F2F4F7',
  '#F2F4F7',
] as const;

const EXCLUDED_UPCOMING_STATUSES = new Set<TravelStatus>([
  TravelStatus.Cancelled,
  TravelStatus.Archieved,
  TravelStatus.Past,
  TravelStatus.Travelling,
  TravelStatus.Draft,
]);

const COUNTRY_CODES: Record<string, string> = {
  Philippines: 'PH',
  'United States': 'US',
  'United Kingdom': 'GB',
  Australia: 'AU',
  Canada: 'CA',
  Japan: 'JP',
  'South Korea': 'KR',
  Singapore: 'SG',
  Germany: 'DE',
  France: 'FR',
  Italy: 'IT',
  Spain: 'ES',
  Thailand: 'TH',
  Malaysia: 'MY',
  Indonesia: 'ID',
  Vietnam: 'VN',
  China: 'CN',
  India: 'IN',
  Brazil: 'BR',
  Mexico: 'MX',
};

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollToTop(scrollViewRef);

  const [refreshing, setRefreshing] = useState(false);
  const { data: travels, isLoading, refetch } = useTravels();
  const { data: allActivities } = useAllActivities();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();

  const [showTravelViewModal, setShowTravelViewModal] = useState(false);
  const [selectedTravelForModal, setSelectedTravelForModal] =
    useState<Travel | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prefilledTripData, setPrefilledTripData] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  const lastBackPressedRef = useRef<number>(0);

  // Derived current ongoing trip (eliminates redundant state and effect)
  const currentOngoingTrip = useMemo(
    () => travels?.find((t) => t.status === TravelStatus.Travelling) ?? null,
    [travels]
  );

  const countryCode = useMemo(() => {
    if (!profile?.defaultCountry) return '';
    return COUNTRY_CODES[profile.defaultCountry] ?? '';
  }, [profile?.defaultCountry]);

  // Notifications loader with errorLogger integration
  const loadNotificationsData = useCallback(async () => {
    try {
      const count = await fetchUnreadNotificationsCount();
      setUnreadNotifications(count);
      if (showNotificationsModal) {
        const list = await fetchLocalNotifications();
        setNotificationsList(list);
      }
    } catch (err) {
      logger.db(err, {
        severity: ErrorSeverity.Low,
        screen: 'HomeScreen',
        action: 'loadNotificationsData',
      });
    }
  }, [showNotificationsModal]);

  useEffect(() => {
    loadNotificationsData();
    const interval = setInterval(
      loadNotificationsData,
      NOTIFICATIONS_POLL_INTERVAL_MS
    );
    return () => clearInterval(interval);
  }, [loadNotificationsData]);

  const handleNotificationPress = useCallback(
    async (notif: any) => {
      if (!notif?.id) return;
      if (!notif.isRead) {
        await markNotificationAsRead(notif.id);
        loadNotificationsData();
      }
    },
    [loadNotificationsData]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    loadNotificationsData();
  }, [loadNotificationsData]);

  const handleDeleteNotification = useCallback(
    async (id: string) => {
      try {
        await deleteNotificationLocally(id);
        loadNotificationsData();
      } catch (err) {
        logger.db(err, {
          severity: ErrorSeverity.Low,
          screen: 'HomeScreen',
          action: 'deleteNotification',
          contextData: { id },
        });
      }
    },
    [loadNotificationsData]
  );

  const handlePressTrip = useCallback(
    (trip: Travel) => {
      if (trip?.id) {
        navigation.navigate('TravelDetail', { travelId: trip.id });
      }
    },
    [navigation]
  );

  const handleOpenCreateTrip = useCallback((tripData?: any) => {
    setPrefilledTripData(tripData ?? null);
    setShowCreateModal(true);
  }, []);

  const handleTripCreated = useCallback((createdId: string) => {
    setSelectedTravelForModal({ id: createdId } as Travel);
    setShowTravelViewModal(true);
  }, []);

  // Hardware back press handler on Android
  useFocusEffect(
    useCallback(() => {
      refetch();
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      const onBackPress = () => {
        if (showTravelViewModal) {
          setShowTravelViewModal(false);
          setSelectedTravelForModal(null);
          return true;
        }
        if (showCreateModal) {
          setShowCreateModal(false);
          setPrefilledTripData(null);
          return true;
        }
        if (showNotificationsModal) {
          setShowNotificationsModal(false);
          return true;
        }
        if (showProfileModal) {
          setShowProfileModal(false);
          return true;
        }
        if (showOnboarding) {
          return true;
        }

        const now = Date.now();
        if (now - lastBackPressedRef.current < DOUBLE_BACK_EXIT_THRESHOLD_MS) {
          BackHandler.exitApp();
          return true;
        }

        lastBackPressedRef.current = now;
        if (Platform.OS === 'android') {
          ToastAndroid.show('Press back again to close the app', ToastAndroid.SHORT);
        }
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => {
        subscription.remove();
      };
    }, [
      refetch,
      showTravelViewModal,
      showCreateModal,
      showNotificationsModal,
      showProfileModal,
      showOnboarding,
    ])
  );

  useEffect(() => {
    if (!isProfileLoading && !profile) {
      setShowOnboarding(true);
    }
  }, [profile, isProfileLoading]);

  // Trip stats computed with useMemo for performance
  const tripStats = useMemo(() => {
    if (!travels) return { total: 0, completed: 0, upcoming: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let completed = 0;
    let upcoming = 0;

    travels.forEach((t) => {
      if (
        t.isArchived ||
        t.status === TravelStatus.Cancelled ||
        t.status === TravelStatus.Archieved
      ) {
        return;
      }
      if (t.status === TravelStatus.Past) {
        completed++;
        return;
      }
      if (t.status === TravelStatus.Upcoming) {
        upcoming++;
        return;
      }
      if (t.startOrDepartureDate) {
        const start = new Date(t.startOrDepartureDate);
        start.setHours(0, 0, 0, 0);
        const end = t.endOrReturnDate ? new Date(t.endOrReturnDate) : start;
        end.setHours(0, 0, 0, 0);
        if (end < today) completed++;
        else if (start >= today) upcoming++;
      }
    });

    return { total: travels.length, completed, upcoming };
  }, [travels]);

  const topActivityTypes = useMemo(() => {
    if (!allActivities?.length) return [];
    const counts: Record<number, number> = {};
    allActivities.forEach((a) => {
      const type = a.type || 0;
      if (type === 0) return;
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([typeStr, count]) => {
        const type = parseInt(typeStr, 10);
        const label = getTripPlanTypeLabel(type);
        return { type, typeName: label || 'Unknown', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allActivities]);

  const getIconForActivityType = useCallback((type?: number) => {
    const iconMap: Record<number, string> = {
      [TripPlanType.flight]: 'airplane',
      [TripPlanType.stay]: 'bed',
      [TripPlanType.transit]: 'bus',
      [TripPlanType.rideRental]: 'car',
      [TripPlanType.tour]: 'trail-sign',
    };
    return (iconMap[type ?? 0] ?? 'location') as any;
  }, []);

  const upcomingTrips = useMemo((): Travel[] => {
    if (!travels) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return travels
      .filter((t) => {
        if (
          t.isArchived ||
          EXCLUDED_UPCOMING_STATUSES.has(t.status as TravelStatus)
        ) {
          return false;
        }
        if (t.status === TravelStatus.Upcoming) return true;
        if (t.startOrDepartureDate) {
          const s = new Date(t.startOrDepartureDate);
          s.setHours(0, 0, 0, 0);
          return s >= today;
        }
        return true;
      })
      .sort((a, b) => {
        if (!a.startOrDepartureDate) return 1;
        if (!b.startOrDepartureDate) return -1;
        return (
          new Date(a.startOrDepartureDate).getTime() -
          new Date(b.startOrDepartureDate).getTime()
        );
      });
  }, [travels]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const scrollContentStyle = useMemo(
    () => ({ flexGrow: 1, paddingBottom: insets.bottom + 120 }),
    [insets.bottom]
  );

  return (
    <View className="flex-1 bg-[#F2F4F7]">
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={GRADIENT_COLORS as any}
        start={{ x: 0, y: 0.05 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0EA5E9']}
            tintColor="#0EA5E9"
          />
        }
      >
        <Hero
          travellingTrip={currentOngoingTrip}
          ongoingTrip={currentOngoingTrip}
          onOpenCreateTripModal={handleOpenCreateTrip}
          unreadNotifications={unreadNotifications}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          onPressTrip={handlePressTrip}
        />

        <View
          className="z-20 w-full"
          style={{
            marginTop: currentOngoingTrip ? 12 : 16,
          }}
        >
          <UpcomingTrips
            upcomingTrips={upcomingTrips}
            isLoading={isLoading}
            onPressTrip={handlePressTrip}
            onAddTripPress={() => handleOpenCreateTrip(null)}
          />

          {/* TODO: Add this section in future releases */}
          {/* <View className="justify-between mb-3 px-1">
            <FadeInView type="fade" delay={150} duration={350}>
              <Text className="px-6 text-xl font-semibold text-secondary mb-5">
                Trip Insights
              </Text>
            </FadeInView>

            <View className="flex-row px-5 mb-[15px] gap-[15px]">
              <View className="flex-1 h-[112px]">
                <FadeInView type="up" delay={200} duration={400}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Maps", { viewBy: "city" })}
                    disabled={false}
                    className={
                      "bg-white rounded-3xl border border-[#e0e0e0] p-5 " +
                      "h-full flex-row items-center justify-between"
                    }
                    accessibilityRole="button"
                    activeOpacity={0.7}
                  >
                    <View className="flex-1 justify-center mr-2">
                      <Text
                        className="text-xs font-semibold uppercase tracking-wider text-gray-400"
                      >
                        My Country {countryCode ? `[${countryCode}]` : ""}
                      </Text>
                      <Text className="text-3xl font-bold py-sm text-accent">0</Text>
                      <Text className="text-sm text-tertiary">Cities visited</Text>
                    </View>
                    {profile?.defaultCountry ? (
                      <View className="justify-center items-center absolute right-0">
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
                </FadeInView>
              </View>

              <View className="flex-1 h-[112px]">
                <FadeInView type="up" delay={250} duration={400}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Trips", { initialTab: "past" })}
                    disabled={false}
                    className="bg-white rounded-3xl border border-[#e0e0e0] p-5 h-full"
                    accessibilityRole="button"
                    activeOpacity={0.5}
                  >
                    <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Past
                    </Text>
                    <Text className="text-3xl font-bold py-sm text-accent">
                      {tripStats.completed}
                    </Text>
                    <Text className="text-sm text-tertiary">Completed trips</Text>

                    <View
                      className="w-[60px] h-[60px] justify-center items-center absolute right-0"
                    >
                      <Text className="text-5xl text-[#e0e0e0]">⏱</Text>
                    </View>
                  </TouchableOpacity>
                </FadeInView>
              </View>
            </View>

            <View className="flex-row px-5 mb-6 gap-[15px]">
              <View className="flex-1 h-[112px]">
                <FadeInView type="up" delay={300} duration={400}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Maps", { viewBy: "country" })}
                    disabled={false}
                    className="bg-white rounded-3xl border border-[#e0e0e0] p-5 h-full"
                    accessibilityRole="button"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      International
                    </Text>
                    <Text className="text-3xl font-bold py-sm text-accent">
                      {tripStats.completed}
                    </Text>
                    <Text className="text-sm text-tertiary">Countries visited</Text>

                    <View
                      className="w-[60px] h-[60px] justify-center items-center absolute right-0"
                    >
                      <Ionicons name="earth" size={28} color="#e0e0e0" />
                    </View>
                  </TouchableOpacity>
                </FadeInView>
              </View>

              <View className="flex-1 h-[112px]">
                <FadeInView type="up" delay={350} duration={400}>
                  <TouchableOpacity
                    onPress={() => {
                      setPrefilledTripData(null);
                      setShowCreateModal(true);
                    }}
                    disabled={false}
                    className={
                      "bg-gray-200 opacity-80 rounded-3xl border-2 border-[#e0e0e0] " +
                      "border-dashed p-4 h-full justify-center items-center"
                    }
                    accessibilityRole="button"
                    activeOpacity={0.5}
                  >
                    <Ionicons name="add-circle-outline" size={32} color="#263F69" />
                    <Text className="text-sm font-semibold text-accent mt-2">Add trip</Text>
                  </TouchableOpacity>
                </FadeInView>
              </View>
            </View>
          </View> */}

          {/* <View className="pb-2">
            <Text className="text-xl font-bold text-gray-800 px-5 mb-[15px]">
              Your top activities
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}
            >
              {topActivityTypes.length === 0 ? (
                <Text className="text-gray-500">No activities logged yet.</Text>
              ) : (
                topActivityTypes.map((stat, i) => (
                  <View
                    key={stat.type || i}
                    className={
                      "w-[130px] bg-white rounded-2xl p-[15px] shadow-sm elevation-2 " +
                      "border border-gray-100 items-center"
                    }
                  >
                    <View
                      className={
                        "bg-gray-100 w-11 h-11 rounded-full " +
                        "justify-center items-center mb-3"
                      }
                    >
                      <Ionicons
                        name={getIconForActivityType(stat.type)}
                        size={22}
                        color="#0EA5E9"
                      />
                    </View>
                    <Text className="text-xl font-extrabold text-gray-900 mb-0.5">
                      {stat.count}
                    </Text>
                    <Text
                      className="text-[12px] text-gray-500 font-medium text-center"
                      numberOfLines={1}
                    >
                      {stat.typeName}s
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View> */}
        </View>
      </ScrollView>

      <ViewTravelModal
        travelId={selectedTravelForModal?.id || ''}
        showModal={showTravelViewModal}
        setShowModal={setShowTravelViewModal}
      />

      <CreateTripModal
        showModal={showCreateModal}
        setShowModal={setShowCreateModal}
        tripData={prefilledTripData}
        onCreated={handleTripCreated}
      />

      {showOnboarding && (
        <OnboardingModal
          visible={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      <Notifications
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        unreadNotifications={unreadNotifications}
        notificationsList={notificationsList}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNotificationPress={handleNotificationPress}
        onDeleteNotification={handleDeleteNotification}
      />

      <ProfileScreen
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </View>
  );
};

export default HomeScreen;
