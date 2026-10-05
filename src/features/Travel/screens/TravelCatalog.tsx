import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { FadeInView, StaggerItem } from '../../../components/animations';
import StatusBadge from '../../../components/StatusBadge';
import Tabs from '../../../components/Tabs/index';
import { tripIcons } from '../../../components/TripIcon';
import { TravelStatus } from '../../../types/enums';
import DestinationsBottomSheet from '../components/DestinationsBottomSheet';
import CountryOutline from '../components/ShareOverlay/CountryOutline';
import ViewTravelModal from '../components/View/Modal';
import { useTravels } from '../hooks/useTravel';
import { Travel } from '../types/TravelDto';

import {
  getEffectiveStatus,
  getNormalizedDate,
  formatDate,
  getDuration,
  getStartDateParts,
  getCountdownLabel,
  getValidDestinations,
  getDestinationLabel,
  getStatusColors,
} from '../utils/travelCatalogUtils';

// ─── Subcomponents ────────────────────────────────────────────────────────────

interface TravelCardItemProps {
  travel: Travel;
  index: number;
  onPress: (travel: Travel) => void;
  onOpenDestinations: (travel: Travel) => void;
}

const TravelCardItem: React.FC<TravelCardItemProps> = React.memo(
  ({ travel, index, onPress, onOpenDestinations }) => {
    const effectiveStatus = getEffectiveStatus(travel);
    const validDestinations = getValidDestinations(travel);
    const destinationLabel = getDestinationLabel(validDestinations, travel);

    const { day, month } = getStartDateParts(travel.startOrDepartureDate);
    const countdownLabel = getCountdownLabel(travel.startOrDepartureDate);
    const duration = getDuration(
      travel.startOrDepartureDate,
      travel.endOrReturnDate
    );

    const dateRange =
      travel.startOrDepartureDate && travel.endOrReturnDate
        ? `${formatDate(travel.startOrDepartureDate)} - ${formatDate(
          travel.endOrReturnDate
        )}`
        : travel.startOrDepartureDate
          ? formatDate(travel.startOrDepartureDate)
          : 'Travel dates not set';

    const tripIconConfig =
      travel.type != null
        ? tripIcons.find((i) => i.tripType === travel.type)
        : null;
    const assignedColor = tripIconConfig ? tripIconConfig.color : '#9E9E9E';

    return (
      <StaggerItem
        key={travel.id}
        index={index}
        className="rounded-4xl mb-4 shadow-sm elevation-2 mx-4 overflow-hidden"
        style={{ backgroundColor: assignedColor + '40' }}
      >
        <TouchableOpacity
          onPress={() => onPress(travel)}
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <View className="px-4 rounded-4xl relative overflow-hidden">
            <View className="flex-row justify-between items-start">
              <View className="flex-row items-center gap-4 flex-1 mr-2">
                {day && month && (
                  <View
                    className="flex-col gap-0 justify-center items-center border-r pr-4"
                    style={{ borderColor: assignedColor + 10 }}
                  >
                    <Text className="text-2xl font-semibold text-accent">
                      {day}
                    </Text>
                    <Text className="text-base font-medium text-tertiary">
                      {month}
                    </Text>
                    {countdownLabel ? (
                      <Text
                        className="text-[10px] font-medium text-tertiary/80 mt-2"
                      >
                        {countdownLabel}
                      </Text>
                    ) : null}
                  </View>
                )}

                <View className="flex-1 gap-y-1 py-4">
                  <Text
                    className="text-2xl text-secondary/90 leading-5 font-semibold"
                  >
                    {travel.title}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`View destinations for ${travel.title}`}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        onOpenDestinations(travel);
                      }}
                      className="flex-row items-center gap-1"
                    >
                      <Text className="text-base text-secondary/70">
                        {destinationLabel || 'No destination'}
                      </Text>
                      {validDestinations.length > 1 && (
                        <Ionicons name="chevron-down" size={14} color="#999" />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View
                    className={
                      'flex-row gap-2 mt-sm p-0 rounded-full ' +
                      'items-center justify-center'
                    }
                  >
                    <Icon
                      name="calendar-month"
                      size={18}
                      color="#344054"
                      style={{ opacity: 0.6 }}
                    />
                    <View className="flex-1">
                      <Text className="text-sm text-secondary/70">
                        {dateRange} {duration ? ` • ${duration}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {travel?.isArchived && (
                <View className="flex-row items-start justify-start">
                  <StatusBadge status={effectiveStatus} />
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </StaggerItem>
    );
  }
);

interface SingleTravellingTripCardProps {
  trip: Travel;
  onPress: (travel: Travel) => void;
}

const SingleTravellingTripCard: React.FC<SingleTravellingTripCardProps> =
  React.memo(({ trip, onPress }) => {
    const tripIconConfig =
      trip.type != null
        ? tripIcons.find((i) => i.tripType === trip.type)
        : null;
    const assignedColor = tripIconConfig ? tripIconConfig.color : '#FFFFFF';
    const destCountryName = trip.destination
      ? trip.destination.split(',').pop()?.trim() || ''
      : '';

    const endDateFormatted = trip.endOrReturnDate
      ? new Date(trip.endOrReturnDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      : '';

    return (
      <View
        key={trip.id}
        className={
          'rounded-4xl mb-2 bg-primary  ' +
          'mx-4 overflow-hidden'
        }
      >
        <TouchableOpacity
          onPress={() => onPress(trip)}
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <View className="p-8 rounded-3xl">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <Text className="text-3xl text-white font-semibold">{trip.title}</Text>
                <Text className="text-lg text-white">
                  Travelling to {trip.destination}
                </Text>
                {endDateFormatted ? (
                  <Text className="text-lg text-white">
                    Until {endDateFormatted}
                  </Text>
                ) : null}
                {trip.description ? (
                  <Text className="text-base mt-4 text-tertiary">
                    {trip.description}
                  </Text>
                ) : null}
              </View>
            </View>

            <View className="flex-row justify-between content-between items-center mb-3">
              <View className="flex-1 items-start mt-lg">
                <TouchableOpacity
                  onPress={() => onPress(trip)}
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  className="flex-row items-center gap-1 py-3 px-4 rounded-full bg-white/50"
                >
                  <Icon name="flight-takeoff" size={20} color="#263F69" />
                  <Text className="font-medium text-xl text-accent">
                    View current trip
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  });

// ─── Main TravelCatalog Component ─────────────────────────────────────────────

const TravelCatalog: React.FC = () => {
  const { data: travels, isLoading, isError, error, refetch } = useTravels();
  const [showTravelViewModal, setShowTravelViewModal] = useState<boolean>(false);
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
  const [showTravelDetail, setShowTravelDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDestinationsTravel, setSelectedDestinationsTravel] =
    useState<Travel | null>(null);
  const [showDestinationsSheet, setShowDestinationsSheet] = useState(false);

  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [activeViewTab, setActiveViewTab] = useState<string>('list');
  const [activeListTab, setActiveListTab] = useState<string>('travelling');

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveViewTab('list');
      const mappedTab =
        route.params.initialTab === 'ongoing'
          ? 'travelling'
          : route.params.initialTab;
      setActiveListTab(mappedTab);
      navigation.setParams({ initialTab: undefined });
    }
  }, [route.params?.initialTab, navigation]);

  const handleCloseDestinations = useCallback(() => {
    setShowDestinationsSheet(false);
    setSelectedDestinationsTravel(null);
  }, []);

  const handleOpenDestinations = useCallback((travel: Travel) => {
    setSelectedDestinationsTravel(travel);
    setShowDestinationsSheet(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleViewModeTravel = useCallback(
    (travel: Travel) => {
      if (travel?.id) {
        navigation.navigate('TravelDetail', { travelId: travel.id });
      }
    },
    [navigation]
  );

  useFocusEffect(
    useCallback(() => {
      refetch();

      const onBackPress = () => {
        if (showDestinationsSheet) {
          handleCloseDestinations();
          return true;
        }
        if (showTravelViewModal) {
          setShowTravelViewModal(false);
          return true;
        }
        return false;
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
      showDestinationsSheet,
      showTravelViewModal,
      handleCloseDestinations,
    ])
  );

  // Pre-index & sort trips by status with useMemo to avoid repeated sort operations
  const travelsByStatus = useMemo(() => {
    if (!travels) return new Map<TravelStatus, Travel[]>();

    const statuses = [
      TravelStatus.Travelling,
      TravelStatus.Upcoming,
      TravelStatus.Draft,
      TravelStatus.Past,
      TravelStatus.Archieved,
      TravelStatus.Cancelled,
    ];

    const sortFn = (list: Travel[], status: TravelStatus) => {
      return [...list].sort((a, b) => {
        const timeA = getNormalizedDate(a.startOrDepartureDate);
        const timeB = getNormalizedDate(b.startOrDepartureDate);

        if (timeA === 0 && timeB === 0) return 0;
        if (timeA === 0) return 1;
        if (timeB === 0) return -1;

        if (status === TravelStatus.Upcoming) {
          return timeA - timeB;
        }
        return timeB - timeA;
      });
    };

    const map = new Map<TravelStatus, Travel[]>();
    for (const status of statuses) {
      let filtered: Travel[] = [];
      if (status === TravelStatus.Archieved) {
        filtered = travels.filter(
          (t) => t.isArchived || t.status === TravelStatus.Archieved
        );
      } else {
        filtered = travels.filter(
          (t) =>
            !t.isArchived &&
            t.status !== TravelStatus.Archieved &&
            t.status === status
        );
      }
      map.set(status, sortFn(filtered, status));
    }
    return map;
  }, [travels]);

  const getTravelsByStatus = useCallback(
    (status: TravelStatus): Travel[] => {
      return travelsByStatus.get(status) ?? [];
    },
    [travelsByStatus]
  );

  const activeTrips = useMemo(() => {
    return (travels || []).filter((trip) => {
      const status = getEffectiveStatus(trip);
      return (
        status === TravelStatus.Travelling ||
        status === TravelStatus.Upcoming ||
        status === TravelStatus.Draft ||
        status === TravelStatus.Past
      );
    });
  }, [travels]);

  const renderContentForStatus = useCallback(
    (
      status: TravelStatus,
      emptyIcon: string,
      emptyTitle: string,
      emptySubtitle: string
    ) => {
      const data = getTravelsByStatus(status);
      const isSingleTravelling =
        data.length === 1 && data[0].status === TravelStatus.Travelling;

      return (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: 10,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0EA5E9']}
              tintColor="#0EA5E9"
            />
          }
        >
          {isSingleTravelling ? (
            <SingleTravellingTripCard
              trip={data[0]}
              onPress={handleViewModeTravel}
            />
          ) : data.length > 0 ? (
            data.map((travel, index) => (
              <TravelCardItem
                key={travel.id}
                travel={travel}
                index={index}
                onPress={handleViewModeTravel}
                onOpenDestinations={handleOpenDestinations}
              />
            ))
          ) : (
            <View className="flex-1 justify-center items-center w-full">
              <FadeInView type="up" delay={50} duration={350} className="w-full items-center">
                <View className="items-center">
                  {/* <Ionicons name="briefcase-outline" size={42} color={"#d1d5db"} /> */}
                  <Text className="text-5xl  text-primary/60 h-[50px]">
                    {emptyIcon}
                  </Text>
                  <Text className="text-2xl font-semibold text-secondary text-center mt-3 mb-1">
                    {emptyTitle}
                  </Text>
                  <Text className="text-md font-normal text-tertiary/70 text-center px-4 leading-5">
                    {emptySubtitle}
                  </Text>
                </View>
              </FadeInView>
            </View>

            // <View className="flex-1 justify-center items-center w-full">
            //   <Text className="text-5xl mb-4 text-primary/60 h-[50px]">
            //     {emptyIcon}
            //   </Text>
            //   <Text className="text-2xl text-tertiary mb-1">
            //     {emptyTitle}
            //   </Text>
            //   <Text className="text-base text-tertiary text-center px-10 tracking-wide">
            //     {emptySubtitle}
            //   </Text>

            //   <View className="absolute -bottom-6 right-10">
            //     <Text className="text-lg text-red-600 font-bold">
            //       Add a trip now
            //     </Text>
            //     <Text className="text-7xl mb-4 ml-4xl text-red-600 -mt-1 rotate-90">
            //       ⤳
            //     </Text>
            //   </View>
            // </View>
          )
          }
        </ScrollView >
      );
    },
    [
      getTravelsByStatus,
      handleRefresh,
      handleViewModeTravel,
      handleOpenDestinations,
      refreshing,
    ]
  );

  const renderCalendarView = useCallback(() => {
    return (
      <View className="flex-1 bg-white">
        <View
          className={
            'flex-row items-center justify-between py-3 px-8 border-b ' +
            'border-gray-100 gap-x-4 gap-y-2 flex-wrap'
          }
        >
          <View className="flex-row items-center gap-1.5">
            <View className="w-5 h-5 rounded-full bg-[#DCFAE6] border border-[#079455]" />
            <Text className="text-xs text-[#666]">Travelling</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View
              className="w-5 h-5 rounded-full bg-[#B9E6FE]/40 border border-[#0EA5E9]/40"
            />
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

        <FadeInView type="right" duration={200} delay={500}>
          <Calendar
            style={{}}
            enableSwipeMonths={true}
            theme={
              {
                monthTextColor: '#0EA5E9',
                textMonthFontWeight: '600',
                textMonthFontSize: 20,
                textSectionTitleColor: '#666666',
                todayTextColor: '#0EA5E9',
                arrowColor: '#0EA5E9',
                'stylesheet.calendar.main': {
                  monthView: {
                    flex: 1,
                  },
                  week: {
                    marginTop: 0,
                    marginBottom: 0,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    height: 88,
                  },
                },
              } as any
            }
            renderArrow={(direction: string) => (
              <View className="bg-gray-50 rounded-full w-14 h-14 items-center justify-center">
                <Icon
                  name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
                  size={28}
                  color="#0EA5E9"
                />
              </View>
            )}
            dayComponent={({ date, state }: any) => {
              const dayStr = date.dateString;
              const tripsOnDay = activeTrips.filter((trip) => {
                if (!trip.startOrDepartureDate) return false;
                const startStr = new Date(trip.startOrDepartureDate)
                  .toISOString()
                  .split('T')[0];
                const endStr = trip.endOrReturnDate
                  ? new Date(trip.endOrReturnDate).toISOString().split('T')[0]
                  : startStr;
                return dayStr >= startStr && dayStr <= endStr;
              });

              return (
                <View
                  style={{
                    borderRadius: 6,
                    margin: 1,
                    backgroundColor: '#f2f4f7',
                    height: 80,
                    flex: 1,
                    width: '96%',
                    padding: 4,
                    paddingTop: 2,
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: state === 'today' ? 'bold' : 'normal',
                      color:
                        state === 'disabled'
                          ? '#d9e1e8'
                          : state === 'today'
                            ? '#0EA5E9'
                            : '#2d4150',
                      marginBottom: 2,
                    }}
                  >
                    {date.day}
                  </Text>
                  <View style={{ gap: 1 }}>
                    {tripsOnDay.map((trip, index) => {
                      const status = getEffectiveStatus(trip);
                      const { bg: bgColor, text: textColor } =
                        getStatusColors(status);
                      const startStr = trip.startOrDepartureDate
                        ? new Date(trip.startOrDepartureDate)
                          .toISOString()
                          .split('T')[0]
                        : '';
                      const endStr = trip.endOrReturnDate
                        ? new Date(trip.endOrReturnDate)
                          .toISOString()
                          .split('T')[0]
                        : startStr;
                      const isStart = dayStr === startStr;
                      const isEnd = dayStr === endStr;

                      return (
                        <StaggerItem key={trip.id} index={index}>
                          <TouchableOpacity
                            key={trip.id}
                            activeOpacity={0.7}
                            onPress={() => handleViewModeTravel(trip)}
                            accessibilityRole="button"
                            style={{
                              backgroundColor: bgColor,
                              paddingVertical: 2,
                              paddingHorizontal: 4,
                              borderRadius: 6,
                              borderWidth:
                                status === TravelStatus.Past ? 0 : 0.5,
                              borderColor: textColor,
                              opacity:
                                state === 'disabled' || (!isStart && !isEnd)
                                  ? 0.5
                                  : 1,
                            }}
                          >
                            <Text
                              style={{
                                color: textColor,
                                fontSize: 10,
                                fontWeight: '600',
                                overflow: 'hidden',
                                flexWrap: 'wrap',
                                lineHeight: 10,
                              }}
                            >
                              {trip.title}
                            </Text>
                          </TouchableOpacity>
                        </StaggerItem>
                      );
                    })}
                  </View>
                </View>
              );
            }}
          />
        </FadeInView>
      </View>
    );
  }, [activeTrips, handleViewModeTravel]);

  const listTabsData = useMemo(
    () => [
      {
        id: 'travelling',
        title: `Travelling (${getTravelsByStatus(TravelStatus.Travelling).length})`,
        content: renderContentForStatus(
          TravelStatus.Travelling,
          '🌍',
          'No Travelling Trips',
          'Your active trips will appear here!'
        ),
      },
      {
        id: 'upcoming',
        title: `Upcoming (${getTravelsByStatus(TravelStatus.Upcoming).length})`,
        content: renderContentForStatus(
          TravelStatus.Upcoming,
          '🗺️જ✈︎',
          'No Upcoming Trips',
          'Start planning your next adventure!'
        ),
      },
      {
        id: 'draft',
        title: `Draft (${getTravelsByStatus(TravelStatus.Draft).length})`,
        content: renderContentForStatus(
          TravelStatus.Draft,
          '✎ᝰ',
          'No Drafts',
          'Your saved drafts will appear here'
        ),
      },
      {
        id: 'past',
        title: `Past (${getTravelsByStatus(TravelStatus.Past).length})`,
        content: renderContentForStatus(
          TravelStatus.Past,
          '⏱',
          'No Past Trips',
          'Your travel memories will appear here'
        ),
      },
      {
        id: 'archived',
        title: `Archived (${getTravelsByStatus(TravelStatus.Archieved).length})`,
        content: renderContentForStatus(
          TravelStatus.Archieved,
          '𓄲ꗃ',
          'No Archived Trips',
          'Your archived trips will appear here'
        ),
      },
      {
        id: 'cancelled',
        title: `Cancelled (${getTravelsByStatus(TravelStatus.Cancelled).length})`,
        content: renderContentForStatus(
          TravelStatus.Cancelled,
          '✖',
          'No Cancelled Trips',
          'Your cancelled trips will appear here'
        ),
      },
    ],
    [getTravelsByStatus, renderContentForStatus]
  );

  const renderListView = useCallback(
    () => (
      <View className="py-2 flex-1 bg-gray-100">
        <Tabs
          tabs={listTabsData}
          activeTabId={activeListTab}
          onTabChange={setActiveListTab}
          type="default"
          expanded={true}
          hasActionTripStatus={
            getTravelsByStatus(TravelStatus.Travelling).length > 0
          }
        />
      </View>
    ),
    [listTabsData, activeListTab, getTravelsByStatus]
  );

  const viewTabsData = useMemo(
    () => [
      {
        id: 'list',
        title: 'List',
        icon: 'list',
        content: renderListView(),
      },
      {
        id: 'calendar',
        title: 'Calendar',
        icon: 'calendar-month',
        content: renderCalendarView(),
      },
    ],
    [renderListView, renderCalendarView]
  );

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
      <StatusBar barStyle="dark-content" />

      <View className="flex-1 bg-white">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text className="mt-2.5 text-tertiary text-lg">
              Loading your travel plans...
            </Text>
          </View>
        ) : isError ? (
          <View className="flex-1 justify-center items-center py-[60px]">
            <Icon name="warning-amber" size={60} color="#fdd787" />
            <Text className="text-xl font-semibold mb-2">
              Something went wrong
            </Text>
            <Text className="text-red-500 m-2.5">{error?.message}</Text>
            <TouchableOpacity
              className="bg-primary px-5 py-2.5 rounded-full"
              onPress={() => refetch()}
              accessibilityRole="button"
            >
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
        travelId={selectedTravel?.id || ''}
        showModal={showTravelViewModal}
        setShowModal={setShowTravelViewModal}
      />

      <DestinationsBottomSheet
        visible={showDestinationsSheet}
        travel={selectedDestinationsTravel}
        onClose={handleCloseDestinations}
      />
    </View>
  );
};

export default TravelCatalog;
