import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTravels } from '../features/Travel/hooks/useTravel';
import { useAllActivitiesWithDestination } from '../features/Travel/hooks/useActivity';
import { Travel } from '../features/Travel/types/TravelDto';
import { TravelStatus, ActivityType } from '../types/enums';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { data: travels, isLoading } = useTravels();
  const { data: allActivities } = useAllActivitiesWithDestination();

  const getTripStats = () => {
    if (!travels) return { total: 0, completed: 0, upcoming: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let completed = 0;
    let upcoming = 0;

    travels.forEach(t => {
      if (t.status === TravelStatus.Cancelled || t.status === TravelStatus.Archieved) return;
      
      if (t.status === TravelStatus.Completed) {
        completed++;
      } else if (t.status === TravelStatus.Upcoming) {
        upcoming++;
      } else if (t.startOrDepartureDate) {
        const startDate = new Date(t.startOrDepartureDate);
        startDate.setHours(0, 0, 0, 0);
        
        let endDate = startDate;
        if (t.endOrReturnDate) {
          endDate = new Date(t.endOrReturnDate);
          endDate.setHours(0, 0, 0, 0);
        }

        if (endDate < today) {
          completed++;
        } else if (startDate >= today) {
          upcoming++;
        }
      }
    });

    return { total: travels.length, completed, upcoming };
  };

  const getTopActivityTypes = () => {
    if (!allActivities || allActivities.length === 0) return [];
    
    const counts: Record<number, number> = {};

    allActivities.forEach(activity => {
      const type = activity.type || 0;
      if (type === 0) return; // skip 'none'
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([typeStr, count]) => {
        const type = parseInt(typeStr, 10);
        const typeName = ActivityType[type];
        return {
          type,
          typeName: typeName ? typeName.charAt(0).toUpperCase() + typeName.slice(1) : "Unknown",
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const tripStats = getTripStats();
  const topActivityTypes = getTopActivityTypes();
  const favoriteActivityName = topActivityTypes.length > 0 ? topActivityTypes[0].typeName : "N/A";

  // Find the next upcoming trip
  const getIconForActivityType = (type?: number) => {
    switch (type) {
      case 1: return "airplane";
      case 2: return "log-in";
      case 3: return "log-out";
      case 4: return "car";
      case 5: return "cafe";
      case 6: return "restaurant";
      case 7: return "walk";
      case 8: return "camera";
      case 9: return "cart";
      case 10: return "briefcase";
      case 11: return "bicycle";
      case 12: return "bed";
      default: return "location";
    }
  };
  const getUpcomingTrip = () => {
    if (!travels) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTravels = travels.filter((t: Travel) => {
      // Exclude cancelled/archived/completed if status is strictly managed
      if (t.status === TravelStatus.Cancelled || t.status === TravelStatus.Archieved || t.status === TravelStatus.Completed) {
        return false;
      }
      if (!t.startOrDepartureDate) return false;
      
      const startDate = new Date(t.startOrDepartureDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate >= today;
    });

    if (upcomingTravels.length === 0) return null;

    // Sort by closest date
    upcomingTravels.sort((a: Travel, b: Travel) => {
      return new Date(a.startOrDepartureDate!).getTime() - new Date(b.startOrDepartureDate!).getTime();
    });

    return upcomingTravels[0];
  };

  const upcomingTrip = getUpcomingTrip();

  const formatDate = (dateValue: Date | string | undefined) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDuration = (start: Date | string | undefined, end: Date | string | undefined) => {
    if (!start || !end) return "";
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Hero Banner Section */}
        <View style={{ width: '100%', height: 360, position: 'relative' }}>
          <Image 
            source={require('../assets/images/home_hero.png')} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {/* Gradient Overlay for Text Readability (optional) */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)'
          }} />
          
          <View style={{
            position: 'absolute',
            bottom: 40,
            left: 20,
            right: 20,
          }}>
            <Text style={{ color: '#ffffff', fontSize: 32, fontWeight: '800', marginBottom: 4, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 }}>
              Where to next?
            </Text>
            <Text style={{ color: '#f3f4f6', fontSize: 16, fontWeight: '500', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10, marginBottom: 20 }}>
              Plan your next adventure with Travie.
            </Text>
            
            {/* Search Box */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              paddingHorizontal: 15,
              paddingVertical: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
            }}>
              <Ionicons name="search" size={20} color="#6b7280" style={{ marginRight: 10 }} />
              <TextInput 
                placeholder="Search destinations, places..."
                placeholderTextColor="#9ca3af"
                style={{ flex: 1, fontSize: 16, color: '#1f2937' }}
              />
            </View>
          </View>
        </View>
        {/* Upcoming Trip Section */}
        <View style={{ paddingHorizontal: 20, paddingTop: 30 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937' }}>Your Upcoming Trip</Text>
            {upcomingTrip && (
              <TouchableOpacity>
                <Text style={{ fontSize: 14, color: '#0C4C8A', fontWeight: '600' }}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <Text style={{ color: '#6b7280' }}>Loading your trips...</Text>
          ) : upcomingTrip ? (
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 3,
              borderWidth: 1,
              borderColor: '#f3f4f6'
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#0C4C8A', marginBottom: 4 }}>
                    {upcomingTrip.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#4b5563', fontWeight: '500' }}>
                    {upcomingTrip.destination}
                  </Text>
                </View>
                <View style={{ backgroundColor: '#E8F5E8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#2E7D32', textTransform: 'uppercase' }}>
                    Upcoming
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#6b7280' }}>
                  {getDuration(upcomingTrip.startOrDepartureDate, upcomingTrip.endOrReturnDate) 
                    ? `${getDuration(upcomingTrip.startOrDepartureDate, upcomingTrip.endOrReturnDate)} | ` 
                    : ""}
                  {upcomingTrip.startOrDepartureDate ? formatDate(upcomingTrip.startOrDepartureDate) : "Date TBD"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{
              backgroundColor: '#f3f4f6',
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderStyle: 'dashed'
            }}>
              <Text style={{ fontSize: 16, color: '#4b5563', fontWeight: '500', marginBottom: 8 }}>No upcoming trips planned</Text>
              <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center' }}>Tap the + button below to start planning your next adventure!</Text>
            </View>
          )}
        </View>

        {/* Stats Section */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 25, gap: 15 }}>
          <View style={{
            flex: 1,
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: '#f3f4f6'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ backgroundColor: '#E8F5E8', padding: 8, borderRadius: 10, marginRight: 10 }}>
                <Ionicons name="airplane" size={18} color="#2E7D32" />
              </View>
              <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '500' }}>Total Trips</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#1f2937' }}>{tripStats.completed}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500' }}>Done</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#1f2937', marginLeft: 4 }}>{tripStats.upcoming}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500' }}>Upcoming</Text>
            </View>
          </View>

          <View style={{
            flex: 1,
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: '#f3f4f6'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ backgroundColor: '#E3F2FD', padding: 8, borderRadius: 10, marginRight: 10 }}>
                <Ionicons name="heart" size={18} color="#0C4C8A" />
              </View>
              <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '500' }}>Favorite</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#1f2937' }} numberOfLines={1}>{favoriteActivityName}</Text>
          </View>
        </View>

        {/* Top Activities Section */}
        <View style={{ paddingHorizontal: 0, paddingTop: 30 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937', paddingHorizontal: 20, marginBottom: 15 }}>Your top activities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
            {topActivityTypes.length === 0 ? (
               <Text style={{ color: '#6b7280' }}>No activities logged yet.</Text>
            ) : (
               topActivityTypes.map((stat, index) => (
                 <View key={stat.type || index} style={{
                   width: 130,
                   backgroundColor: '#ffffff',
                   borderRadius: 16,
                   padding: 15,
                   shadowColor: '#000',
                   shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.05,
                   shadowRadius: 8,
                   elevation: 2,
                   borderWidth: 1,
                   borderColor: '#f3f4f6',
                   alignItems: 'center'
                 }}>
                   <View style={{ backgroundColor: '#F3F4F6', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                     <Ionicons name={getIconForActivityType(stat.type)} size={22} color="#0C4C8A" />
                   </View>
                   <Text style={{ fontSize: 20, fontWeight: '800', color: '#1f2937', marginBottom: 2 }}>{stat.count}</Text>
                   <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', textAlign: 'center' }} numberOfLines={1}>{stat.typeName}s</Text>
                 </View>
               ))
            )}
          </ScrollView>
        </View>

      </ScrollView>
    </View>
  );
};

export default HomeScreen;
