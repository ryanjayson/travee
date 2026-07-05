import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, FlatList, Text, View, TouchableOpacity } from 'react-native';
import { Travel } from '../../../features/Travel/types/TravelDto';
import { tripIcons } from '../../TripIcon';
import { TripType } from '../../../types/enums';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// let CARD_WIDTH = SCREEN_WIDTH * 0.8;

interface UpcomingTripsProps {
  upcomingTrips: Travel[];
  isLoading: boolean;
  onPressTrip?: (trip: Travel) => void;
}

const UpcomingTrips = ({ upcomingTrips, isLoading, onPressTrip }: UpcomingTripsProps) => {
  const [cardWidth, setCardWidth] = useState(upcomingTrips.length && upcomingTrips.length === 1 ? SCREEN_WIDTH - 40 : SCREEN_WIDTH * 0.8);
  
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
      return `In ${diffDays} days`;
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
    return baseColor + '50'; // 8.2% opacity tint for a very light background color
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
    <View className="mb-6 pt-sm">
      <View className="flex-row items-center justify-between px-6 mb-3 ">
        <Text className="text-xl font-semibold text-secondary">Upcoming Trips</Text>
        {upcomingTrips.length > 0 && (
          <Text className="text-sm text-[#263F69] font-semibold">
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
          snapToInterval={cardWidth + 16}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => onPressTrip?.(item)}
              className="rounded-3xl p-5 shadow-sm elevation-3 border bg-white"
              style={{ borderColor: getBgColor(item.type), width: cardWidth }}
              accessibilityRole="button"
              accessibilityLabel={`View trip ${item.title}`}
            >
              {/* Index badge */}
              {/* <View className="absolute top-3.5 right-4">
                <Text className="text-[11px] text-gray-300 font-semibold">#{index + 1}</Text>
              </View> */}

              {/* Title + destination */}
              <View className="mb-3 pr-8">
                <Text className="text-xl font-semibold mb-1 text-primary" 
                  // style={{ color: getTextColor(item.type) }}
                  numberOfLines={1}>
                  {item.title}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="location-outline" size={18} color="#9ca3af" />
                  <Text className="text-base text-tertiary font-medium" numberOfLines={1}>
                    {item.destination || 'Destination TBD'} 
                  </Text>
                </View>
              </View>

              <View className="mb-3"
              // style={{ borderColor: getTextColor(item.type) }}
               />

              {/* Date + duration */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
                  <Text className="text-[13px] font-semibold text-gray-500">
                    {item.startOrDepartureDate ? formatDate(item.startOrDepartureDate) : 'Date TBD'}
                  </Text>
                </View>
                {getDaysUntil(item.startOrDepartureDate) ? (
                  <View className="bg-blue-50 px-2.5 py-0.5 rounded-full">
                    <Text className="text-[12px] text-[#263F69] font-semibold">
                      {getDaysUntil(item.startOrDepartureDate)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View className="mx-5 h-[130px] align-middle justify-center rounded-2xl p-6 items-center border-2 border-dashed border-gray-300">
          <Ionicons name="briefcase-outline" size={32} color="#d1d5db" />
          <Text className="text-base text-gray-800 font-medium mt-2">No upcoming trips</Text>
          <Text className="text-sm text-gray-400 text-center">
            Start planning your next adventure!
          </Text>
        </View>
      )}
    </View>
  );
};

export default UpcomingTrips;
