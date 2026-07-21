import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, FlatList, Text, View, TouchableOpacity, Image } from 'react-native';
import { MAPBOX_ACCESS_TOKEN } from "@env";
import { LinearGradient } from 'expo-linear-gradient';
import { Travel } from '../../../features/Travel/types/TravelDto';
import { tripIcons } from '../../TripIcon';
import { TripType } from '../../../types/enums';
import { getDestinationZoom } from '../../../utils/mapUtils';

const getDestinationImage = (destination?: string, destinationData?: any) => {
  if (!destination) {
    return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format&fit=crop";
  }
  const dest = destination.toLowerCase().trim();
  
  if (dest.includes("japan") || dest.includes("tokyo") || dest.includes("osaka") || dest.includes("kyoto") || dest.includes("fuji")) {
    return "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("france") || dest.includes("paris")) {
    return "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("london") || dest.includes("united kingdom") || dest.includes("uk") || dest.includes("england")) {
    return "https://images.unsplash.com/photo-1513635269975-59663e0ca1ad?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("usa") || dest.includes("united states") || dest.includes("new york") || dest.includes("america")) {
    return "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("italy") || dest.includes("rome") || dest.includes("venice") || dest.includes("florence")) {
    return "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("singapore")) {
    return "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("australia") || dest.includes("sydney") || dest.includes("melbourne")) {
    return "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("bali") || dest.includes("indonesia") || dest.includes("jakarta")) {
    return "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("seoul") || dest.includes("korea")) {
    return "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("thailand") || dest.includes("bangkok") || dest.includes("phuket")) {
    return "https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("spain") || dest.includes("barcelona") || dest.includes("madrid")) {
    return "https://images.unsplash.com/photo-1583779457094-0e34c4708795?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("germany") || dest.includes("berlin") || dest.includes("munich")) {
    return "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("canada") || dest.includes("toronto") || dest.includes("vancouver")) {
    return "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("vietnam") || dest.includes("hanoi") || dest.includes("ho chi minh")) {
    return "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("switzerland") || dest.includes("swiss") || dest.includes("zurich")) {
    return "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=600&auto=format&fit=crop";
  }
  if (dest.includes("egypt") || dest.includes("cairo")) {
    return "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?q=80&w=600&auto=format&fit=crop";
  }

  if (destinationData?.coordinates?.longitude && destinationData?.coordinates?.latitude && MAPBOX_ACCESS_TOKEN) {
    const { longitude, latitude } = destinationData.coordinates;
    const zoom = getDestinationZoom(destination, destinationData);
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${longitude},${latitude},${zoom},0/400x300?access_token=${MAPBOX_ACCESS_TOKEN}`;
  }

  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format&fit=crop";
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// let CARD_WIDTH = SCREEN_WIDTH * 0.8;

interface UpcomingTripsProps {
  upcomingTrips: Travel[];
  isLoading: boolean;
  onPressTrip?: (trip: Travel) => void;
  onAddTripPress?: () => void;
}

const UpcomingTrips = ({ upcomingTrips, isLoading, onPressTrip, onAddTripPress }: UpcomingTripsProps) => {
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
    <View className="mb-6 px-1">
      <View className="flex-row items-center justify-between px-6 mb-5">
        <Text className="text-2xl font-semibold text-secondary">Upcoming Trips</Text>
        {upcomingTrips.length > 0 && (
          <Text className="text-sm text-primary font-semibold">
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
                activeOpacity={0.7}
                onPress={() => onPressTrip?.(item)}
                className="rounded-3xl shadow-sm elevation-3 overflow-hidden flex-1 bg-white"
                style={{ borderColor: getBgColor(item.type), width: cardWidth, height: 135 }}
                accessibilityRole="button"
                accessibilityLabel={`View trip ${item.title}`}
              >
                <Image
                  source={{ uri: getDestinationImage(item.destination, item.destinationData) }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.8 }}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["rgba(0, 0, 0, 0.85)", "rgba(0, 0, 0, 0.15)"]}
                  start={{ x: 0.1, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View className="p-5 flex-1 justify-between">
                  {/* Title + destination */}
                  <View className="pr-8">
                    <Text className="text-2xl font-bold mb-1 text-white shadow-sm" style={textShadow} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="location-outline" size={16} color="#e5e7eb" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 1 }} />
                      <Text className="text-lg text-gray-200 font-semibold" style={textShadow} numberOfLines={1}>
                        {item.destination || 'Destination TBD'} 
                      </Text>
                    </View>
                  </View>

                  {/* Date + duration */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="calendar-outline" size={18} color="#e5e7eb" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 1 }} />
                      <Text className="text-[13px] font-semibold text-gray-200" style={textShadow}>
                        {item.startOrDepartureDate ? formatDate(item.startOrDepartureDate) : 'Date TBD'}
                      </Text>
                    </View>
                    {getDaysUntil(item.startOrDepartureDate) ? (
                      <View className="bg-white/50 px-2.5 py-0.5 rounded-full items-center">
                        <Text className="text-[12px] text-white" >
                          {getDaysUntil(item.startOrDepartureDate)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
          )}
        />
      ) : (
        <TouchableOpacity
          onPress={onAddTripPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add a new trip"
          className="mx-5 h-[130px] align-middle justify-center rounded-2xl p-6 items-center border-2 border-dashed border-gray-300"
        >
          <Ionicons name="briefcase-outline" size={32} color="#d1d5db" />
          <Text className="text-lg text-tertiary font-medium mt-2">No upcoming trips</Text>
          <View className='flex-row gap-1'>

            <Text className="text-base text-accent/80  text-center underline font-semibold">
           Add trip
          </Text>
           <Text className="text-base text-tertiary/80 text-center ">
            and start planning your next adventure!
          </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UpcomingTrips;
