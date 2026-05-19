import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, FlatList, Text, View} from 'react-native';
import { Travel } from '../../../features/Travel/types/TravelDto';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// let CARD_WIDTH = SCREEN_WIDTH * 0.8;

interface UpcomingTripsProps {
  upcomingTrips: Travel[];
  isLoading: boolean;
}

const UpcomingTrips = ({ upcomingTrips, isLoading }: UpcomingTripsProps) => {
  const [cardWidth, setCardWidth] = useState(upcomingTrips.length && upcomingTrips.length === 1 ? SCREEN_WIDTH - 40 : SCREEN_WIDTH * 0.8);
  
  const formatDate = (v?: Date | string) =>
    v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  const getDuration = (s?: Date | string, e?: Date | string) => {
    if (!s || !e) return '';
    const diff = new Date(e).getTime() - new Date(s).getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return `${days} Day${days > 1 ? 's' : ''}`;
  };

  return (
    <View className="mb-6 pt-[28px]">
      <View className="flex-row items-center justify-between px-6 mb-3 ">
        <Text className="text-2xl font-bold text-gray-800">Upcoming Trips</Text>
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
            <View
              style={{ width: cardWidth }}
              className="bg-white rounded-2xl p-4 shadow-sm elevation-3 border border-gray-100"
            >
              {/* Index badge */}
              {/* <View className="absolute top-3.5 right-4">
                <Text className="text-[11px] text-gray-300 font-semibold">#{index + 1}</Text>
              </View> */}

              {/* Title + destination */}
              <View className="mb-3 pr-8">
                <Text className="text-lg font-bold text-[#263F69] mb-1" numberOfLines={1}>
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
                    <Text className="text-[12px] text-[#263F69] font-semibold">
                      {getDuration(item.startOrDepartureDate, item.endOrReturnDate)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
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
