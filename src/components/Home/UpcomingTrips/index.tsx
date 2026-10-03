import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Dimensions, FlatList, Text, View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Travel } from '../../../features/Travel/types/TravelDto';
import DestinationsBottomSheet from '../../../features/Travel/components/DestinationsBottomSheet';
import { tripIcons } from '../../TripIcon';
import { TripType } from '../../../types/enums';
import { FadeInView, StaggerItem } from '../../animations';
import { useTravelContext } from '../../../context/TravelContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
interface UpcomingTripsProps {
  upcomingTrips: Travel[];
  isLoading: boolean;
  onPressTrip?: (trip: Travel) => void;
  onAddTripPress?: () => void;
}

const UpcomingTrips = ({ upcomingTrips, isLoading, onPressTrip, onAddTripPress }: UpcomingTripsProps) => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { openActivityTypeModal } = useTravelContext();
  const [selectedDestinationsTrip, setSelectedDestinationsTrip] = useState<Travel | null>(null);
  const [showDestinationsSheet, setShowDestinationsSheet] = useState(false);

  const displayedTrips = upcomingTrips.slice(0, 3);

  const handleGoToUpcomingCatalog = () => {
    navigation.navigate("Trips", { initialTab: "upcoming" });
  };

  const cardWidth = upcomingTrips.length === 1 ? SCREEN_WIDTH - 40 : SCREEN_WIDTH * 0.8;

  const textShadow = {
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  };

  const formatDate = (v?: Date | string) =>
    v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  const getDaysUntil = (s?: Date | string) => {
    if (!s) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(s);
    startDate.setHours(0, 0, 0, 0);
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays > 1) {
      return `Starts in ${diffDays} days`;
    } else {
      return `${Math.abs(diffDays)} days ago`;
    }
  };

  const getBgColor = (type?: TripType) => {
    if (type == null || type === TripType.none) {
      return '#f9fafb';
    }
    const found = tripIcons.find((i) => i.tripType === type);
    const baseColor = found ? found.color : '#9E9E9E';
    return baseColor + '40'; // 8.2% opacity tint for a very light background color
  };

  const getTextColor = (type?: TripType) => {
    if (type == null || type === TripType.none) {
      return '#f9fafb';
    }
    const found = tripIcons.find((i) => i.tripType === type);
    const baseColor = found ? found.color : '#9E9E9E';
    return baseColor;
  };

  return (
    <View className="w-full mb-6 px-1 ">
      <View className="flex-row items-center justify-between px-6 mb-4">
        <Text className="text-xl font-semibold text-secondary">Upcoming Trips</Text>
        {upcomingTrips.length > 0 && (
          <TouchableOpacity
            className="flex-row items-center gap-1"
            accessibilityRole="button"
            accessibilityLabel={`View all ${upcomingTrips.length} upcoming trips in catalog`}
            onPress={handleGoToUpcomingCatalog}
          >
            <Text className='text-secondary/70 font-medium'>
              {upcomingTrips.length} Trip{upcomingTrips.length > 1 ? 's' : ''}
              <Ionicons name="chevron-forward" size={14} color="#999" style={{ opacity: 0.5 }} />
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="w-full px-4 py-8 items-center justify-center">
          <Text className="text-gray-400 text-sm">Loading upcoming trips...</Text>
        </View>
      ) : upcomingTrips.length > 0 ? (
        <View className=" flex-1 w-full px-4 gap-4">
          {displayedTrips.map((item, index) => {
            const validDestinations = (item.tripDestinations && item.tripDestinations.length > 0)
              ? item.tripDestinations.map((d: any) => d.destination).filter(Boolean)
              : (item.destination ? item.destination.split(" | ").map((s: string) => s.trim()).filter(Boolean) : []);

            const isMultiple = validDestinations.length > 1;

            const destinationLabel = isMultiple
              ? `${validDestinations.length} destinations`
              : validDestinations.length === 1
                ? (item.destinationData?.country === validDestinations[0]
                  ? validDestinations[0]
                  : item.destinationData?.country
                    ? `${validDestinations[0]}, ${item.destinationData?.country}`
                    : validDestinations[0])
                : (item.destinationData?.country === item.destination
                  ? item.destination
                  : item.destination ? `${item.destination}, ${item.destinationData?.country}` : 'Destination TBD');

            return (
              <StaggerItem key={String(item.id)} index={index}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onPressTrip?.(item)}
                  className="w-full rounded-4xl overflow-hidden bg-white"
                  style={{ backgroundColor: item.type ? getBgColor(item.type) : '#0EA5E940', }}
                  accessibilityRole="button"
                  accessibilityLabel={`View trip ${item.title}`}
                >
                  {/* <Image
                    source={{ uri: getDestinationImage(item.destination, item.destinationData) }}
                    style={{ position: "absolute", right: 20, bottom: 20, borderRadius: 12 }}
                    resizeMode="cover"
                    width={140}
                    height={80}
                  /> */}
                  {/* <LinearGradient
                    colors={["rgba(0, 0, 0, 0.85)", "rgba(0, 0, 0, 0.15)"]}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  /> */}
                  <View className="p-5 flex-1 justify-between gap-0.5">
                    {/* Title + destination */}
                    <View className="pr-8">
                      {getDaysUntil(item.startOrDepartureDate) ? (
                        <View className="opacity-80 flex-row">
                          <Text className="text-[12px] text-secondary bg-white/50 px-2.5 rounded-full" >
                            {getDaysUntil(item.startOrDepartureDate)}
                          </Text>
                        </View>
                      ) : null}

                      <Text className="text-2xl font-bold text-secondary " numberOfLines={1}>
                        {item.title}
                      </Text>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`View destinations for ${item.title}`}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setSelectedDestinationsTrip(item);
                          setShowDestinationsSheet(true);
                        }}
                        className="flex-row items-center gap-1 mb-2 opacity-70 w-1/2">
                        <Ionicons name="location-outline" size={14} color="#344054" style={{ opacity: 0.6 }} />
                        <Text className="text-lg font-semibold text-secondary/60 max-w-50" numberOfLines={1}>
                          {destinationLabel}
                        </Text>
                        {isMultiple && (
                          <Ionicons name="chevron-down" size={14} color="#344054" style={{ opacity: 0.6 }} />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Date + duration */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons name="calendar-outline" size={16} color="#344054" style={{ opacity: 0.6 }} />
                        <Text className="text-base font-semibold text-secondary/60" >
                          {item.startOrDepartureDate ? formatDate(item.startOrDepartureDate) : 'Date TBD'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons name="bulb" size={16} color="#344054" style={{ opacity: 0.6 }} />
                        <Text className="text-base font-semibold text-secondary/60" >
                          100 Plans
                        </Text>
                      </View>

                    </View>

                    <View className='flex-row justify-end'>
                      <View className="absolute bottom-0">
                        <TouchableOpacity
                          className='items-center justify-center w-5xl h-5xl rounded-full'
                          style={{
                            backgroundColor: getBgColor(item.type),
                            opacity: 0.7,
                          }}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            openActivityTypeModal(undefined, item.id);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Add Activity"
                        >
                          <Ionicons name="add" style={{ opacity: 1 }} size={24} color={"#344054"} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </StaggerItem>
            );
          })}

          {upcomingTrips.length > 3 && (
            <TouchableOpacity
              onPress={handleGoToUpcomingCatalog}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Show more upcoming trips in catalog"
              style={[
                styles.showMoreButton,
                // {
                //   borderColor: colors.outlineVariant || '#EAECF0',
                // },
              ]}
            >
              <View style={styles.showMoreContent}>
                <Text style={[styles.showMoreLabel, { color: colors.primary || "#0EA5E9" }]}>
                  Show more upcoming trips
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.primary || "#0EA5E9"}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="w-full px-4">
          <TouchableOpacity
            onPress={onAddTripPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Plan your first trip"
            className="w-full justify-center rounded-3xl p-6 items-center border-2 border-dashed border-gray-300 bg-white/50"
          >
            <FadeInView type="up" delay={50} duration={350} className="w-full items-center">
              <View className="items-center">
                <Ionicons name="briefcase-outline" size={42} color={colors.outline || "#d1d5db"} />

                <Text className="text-xl font-semibold text-secondary text-center mt-3 mb-1">
                  No upcoming trips
                </Text>
                <Text className="text-sm font-normal text-tertiary/70 text-center px-4 leading-5">
                  You haven't planned any trips yet. Create one to get started.
                </Text>
              </View>
            </FadeInView>
            <View className="flex-row items-center bg-primary/10 px-4 py-2 rounded-full gap-2 mt-4">
              <Ionicons name="add" size={16} color={colors.primary || "#0EA5E9"} />
              <Text
                className="font-medium text-base text-primary"
                style={{ color: colors.primary }}
              >
                Plan Your First Trip
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <DestinationsBottomSheet
        visible={showDestinationsSheet}
        travel={selectedDestinationsTrip}
        onClose={() => {
          setShowDestinationsSheet(false);
          setSelectedDestinationsTrip(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  showMoreButton: {
    width: '100%',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  showMoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  showMoreLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
});

export default UpcomingTrips;
