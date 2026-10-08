import React, { useCallback, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';

import { Travel } from '../../../features/Travel/types/TravelDto';
import DestinationsBottomSheet from '../../../features/Travel/components/DestinationsBottomSheet';
import { tripIcons } from '../../TripIcon';
import { TripType } from '../../../types/enums';
import { FadeInView, StaggerItem } from '../../animations';
import { useTravelContext } from '../../../context/TravelContext';

// ============================================================================
// Types
// ============================================================================

export interface UpcomingTripsProps {
  upcomingTrips: Travel[];
  isLoading: boolean;
  onPressTrip?: (trip: Travel) => void;
  onAddTripPress?: () => void;
}

interface DestinationInfo {
  label: string;
  isMultiple: boolean;
}

interface UpcomingTripCardProps {
  trip: Travel;
  index: number;
  onPress?: (trip: Travel) => void;
  onOpenDestinations: (trip: Travel) => void;
  onAddActivity: (tripId: string) => void;
}

interface EmptyUpcomingTripsProps {
  onAddTripPress?: () => void;
  outlineColor: string;
  primaryColor: string;
}

// ============================================================================
// Pure Helpers
// ============================================================================

const formatDate = (dateValue?: Date | string): string => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDaysUntil = (dateValue?: Date | string): string => {
  if (!dateValue) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(dateValue);
  startDate.setHours(0, 0, 0, 0);

  const diffTime = startDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1) return `Starts in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
};

const getTripBgColor = (type?: TripType): string => {
  if (type == null || type === TripType.none) {
    return '#f9fafb';
  }
  const found = tripIcons.find((icon) => icon.tripType === type);
  const baseColor = found ? found.color : '#9E9E9E';
  return `${baseColor}40`;
};

const getTripDestinationInfo = (item: Travel): DestinationInfo => {
  const destinations =
    item.tripDestinations && item.tripDestinations.length > 0
      ? item.tripDestinations
        .map((d: { destination?: string }) => d.destination)
        .filter(Boolean)
      : item.destination
        ? item.destination
          .split(' | ')
          .map((s: string) => s.trim())
          .filter(Boolean)
        : [];

  const isMultiple = destinations.length > 1;
  if (isMultiple) {
    return {
      label: `${destinations.length} destinations`,
      isMultiple: true,
    };
  }

  const country = item.destinationData?.country;
  if (destinations.length === 1) {
    const singleDest = destinations[0] as string;
    const label =
      country && country !== singleDest
        ? `${singleDest}, ${country}`
        : singleDest;
    return { label, isMultiple: false };
  }

  if (item.destination) {
    const label =
      country && country !== item.destination
        ? `${item.destination}, ${country}`
        : item.destination;
    return { label, isMultiple: false };
  }

  return { label: 'Destination TBD', isMultiple: false };
};

// ============================================================================
// Subcomponents
// ============================================================================

const UpcomingTripCard: React.FC<UpcomingTripCardProps> = ({
  trip,
  index,
  onPress,
  onOpenDestinations,
  onAddActivity,
}) => {
  const destinationInfo = getTripDestinationInfo(trip);
  const daysUntil = getDaysUntil(trip.startOrDepartureDate);
  const cardBgColor = trip.type ? getTripBgColor(trip.type) : '#0EA5E940';
  const buttonBgColor = getTripBgColor(trip.type);

  return (
    <StaggerItem index={index}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress?.(trip)}
        className="w-full rounded-4xl overflow-hidden bg-white"
        style={{ backgroundColor: cardBgColor }}
        accessibilityRole="button"
        accessibilityLabel={`View trip ${trip.title}`}
      >
        <View className="p-5 flex-1 justify-between gap-0.5">
          {/* Title + destination */}
          <View className="pr-8">
            {daysUntil ? (
              <View className="opacity-80 flex-row">
                <Text className="text-[10px] text-secondary bg-white/40 px-2 rounded-full">
                  {daysUntil}
                </Text>
              </View>
            ) : null}

            <Text
              className="text-2xl font-semibold text-secondary"
              numberOfLines={1}
            >
              {trip.title}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`View destinations for ${trip.title}`}
              onPress={(e) => {
                e?.stopPropagation?.();
                onOpenDestinations(trip);
              }}
              className="flex-row items-center gap-1 mb-2 opacity-70 w-1/2"
            >
              <Ionicons
                name="location-outline"
                size={14}
                color="#344054"
                style={{ opacity: 0.6 }}
              />
              <Text
                className="text-lg font-semibold text-secondary/60 max-w-50"
                numberOfLines={1}
              >
                {destinationInfo.label}
              </Text>
              {destinationInfo.isMultiple && (
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color="#344054"
                  style={{ opacity: 0.6 }}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name="calendar-outline"
                size={16}
                color="#344054"
                style={{ opacity: 0.6 }}
              />
              <Text className="text-base font-semibold text-secondary/60">
                {trip.startOrDepartureDate
                  ? formatDate(trip.startOrDepartureDate)
                  : 'Date TBD'}
              </Text>
            </View>
          </View>

          {/* Plans count */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name="bulb"
                size={16}
                color="#344054"
                style={{ opacity: 0.6 }}
              />
              <Text className="text-base font-semibold text-secondary/60">
                100 Plans
              </Text>
            </View>
          </View>

          {/* Quick add activity button */}
          <View className="flex-row justify-end">
            <View className="absolute bottom-0">
              <TouchableOpacity
                className="items-center justify-center w-5xl h-5xl rounded-full opacity-70"
                style={{ backgroundColor: buttonBgColor }}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onAddActivity(trip.id);
                }}
                accessibilityRole="button"
                accessibilityLabel="Add Activity"
              >
                <Ionicons name="add" size={24} color="#344054" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </StaggerItem>
  );
};

const EmptyUpcomingTrips: React.FC<EmptyUpcomingTripsProps> = ({
  onAddTripPress,
  outlineColor,
  primaryColor,
}) => (
  <View className="w-full px-4">
    <TouchableOpacity
      onPress={onAddTripPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Plan your first trip"
      className={[
        'w-full justify-center rounded-3xl p-6 items-center',
        'border-2 border-dashed border-gray-300 bg-white/50',
      ].join(' ')}
    >
      <FadeInView
        type="up"
        delay={50}
        duration={350}
        className="w-full items-center"
      >
        <View className="items-center">
          <Ionicons
            name="briefcase-outline"
            size={42}
            color={outlineColor}
          />
          <Text className="text-xl font-semibold text-secondary text-center mt-3 mb-1">
            No upcoming trips
          </Text>
          <Text className="text-sm font-normal text-tertiary/70 text-center px-4 leading-5">
            You haven't planned any trips yet. Create one to get started.
          </Text>
        </View>
      </FadeInView>
      <View className="flex-row items-center bg-primary/10 px-4 py-2 rounded-full gap-2 mt-4">
        <Ionicons name="add" size={16} color={primaryColor} />
        <Text
          className="font-medium text-base text-primary"
          style={{ color: primaryColor }}
        >
          Plan Your First Trip
        </Text>
      </View>
    </TouchableOpacity>
  </View>
);

// ============================================================================
// Main Component
// ============================================================================

const UpcomingTrips: React.FC<UpcomingTripsProps> = ({
  upcomingTrips,
  isLoading,
  onPressTrip,
  onAddTripPress,
}) => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { openActivityTypeModal } = useTravelContext();

  const [selectedDestinationsTrip, setSelectedDestinationsTrip] =
    useState<Travel | null>(null);
  const [showDestinationsSheet, setShowDestinationsSheet] = useState(false);

  const displayedTrips = useMemo(
    () => upcomingTrips.slice(0, 3),
    [upcomingTrips]
  );

  const handleGoToUpcomingCatalog = useCallback(() => {
    navigation.navigate('Trips', { initialTab: 'upcoming' });
  }, [navigation]);

  const handleOpenDestinations = useCallback((trip: Travel) => {
    setSelectedDestinationsTrip(trip);
    setShowDestinationsSheet(true);
  }, []);

  const handleCloseDestinationsSheet = useCallback(() => {
    setShowDestinationsSheet(false);
    setSelectedDestinationsTrip(null);
  }, []);

  const handleAddActivity = useCallback(
    (tripId: string) => {
      openActivityTypeModal(undefined, tripId);
    },
    [openActivityTypeModal]
  );

  const primaryColor = colors.primary || '#0EA5E9';
  const outlineColor = colors.outline || '#d1d5db';

  return (
    <View className="w-full mb-6 px-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 mb-4">
        <Text className="text-xl font-semibold text-secondary">
          Upcoming Trips
        </Text>
        {upcomingTrips.length > 0 && (
          <TouchableOpacity
            className="flex-row items-center gap-1"
            accessibilityRole="button"
            accessibilityLabel={`View all ${upcomingTrips.length} upcoming trips in catalog`}
            onPress={handleGoToUpcomingCatalog}
            activeOpacity={0.7}
          >
            <Text className="text-secondary/70 font-medium">
              {upcomingTrips.length} Trip{upcomingTrips.length > 1 ? 's' : ''}
              <Ionicons
                name="chevron-forward"
                size={14}
                color="#999"
                style={{ opacity: 0.5 }}
              />
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="w-full px-4 py-8 items-center justify-center">
          <Text className="text-gray-400 text-sm">
            Loading upcoming trips...
          </Text>
        </View>
      ) : upcomingTrips.length > 0 ? (
        <View className="flex-1 w-full px-4 gap-4">
          {displayedTrips.map((item, index) => (
            <UpcomingTripCard
              key={String(item.id)}
              trip={item}
              index={index}
              onPress={onPressTrip}
              onOpenDestinations={handleOpenDestinations}
              onAddActivity={handleAddActivity}
            />
          ))}

          {upcomingTrips.length > 3 && (
            <TouchableOpacity
              onPress={handleGoToUpcomingCatalog}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Show more upcoming trips in catalog"
              className={[
                'w-full py-1 px-4 rounded-2xl ',
                'items-center justify-center mt-0.5',
              ].join(' ')}
            >
              <View className="flex-row items-center gap-1.5">
                <Text
                  className="font-semibold text-sm text-primary"
                  style={{ color: primaryColor }}
                >
                  Show more upcoming trips
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={primaryColor}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <EmptyUpcomingTrips
          onAddTripPress={onAddTripPress}
          outlineColor={outlineColor}
          primaryColor={primaryColor}
        />
      )}

      {/* Destinations Bottom Sheet */}
      <DestinationsBottomSheet
        visible={showDestinationsSheet}
        travel={selectedDestinationsTrip}
        onClose={handleCloseDestinationsSheet}
      />
    </View>
  );
};

export default UpcomingTrips;
