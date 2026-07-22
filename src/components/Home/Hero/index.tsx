import { MaterialIcons as Icon, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Text, TouchableOpacity, View, SafeAreaView, ScrollView } from 'react-native';
import { useTravelContext } from "../../../context/TravelContext";

import ViewTravelModal from "../../../features/Travel/components/View/Modal";
import ItineraryTab from "../../../features/Travel/components/View/Tabs/ItineraryTab";
import { useTravelPlan } from '../../../features/Travel/hooks/useTravel';
import { Travel } from '../../../features/Travel/types/TravelDto';
import { ProfileScreen } from '../../../screens/ProfileScreen';
import { useUserProfile } from '../../../hooks/useUserProfile';

export const fetchWeatherInfo = async (destination?: string, coords?: { latitude?: number; longitude?: number }) => {
  if (!destination && (!coords || coords.latitude === undefined || coords.longitude === undefined)) {
    return null;
  }
  try {
    let lat = coords?.latitude;
    let lon = coords?.longitude;

    if ((lat === undefined || lon === undefined) && destination) {
      // Geocode using Nominatim
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'TraveeApp/1.0'
          }
        }
      );
      const geoData = await geoRes.json();
      if (geoData && geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lon = parseFloat(geoData[0].lon);
      }
    }

    if (lat !== undefined && lon !== undefined) {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      const weatherData = await weatherRes.json();
      if (weatherData && weatherData.current_weather) {
        return {
          temp: Math.round(weatherData.current_weather.temperature),
          code: weatherData.current_weather.weathercode,
        };
      }
    }
  } catch (err) {
    console.warn("Failed to fetch weather forecast:", err);
  }
  return null;
};

interface HeroProps {
  ongoingTrip: Travel | null;
  onOpenCreateTripModal?: (tripData: any) => void;
  unreadNotifications?: number;
  onOpenNotifications?: () => void;
}

const Hero = ({ ongoingTrip, onOpenCreateTripModal, unreadNotifications = 0, onOpenNotifications }: HeroProps) => {
  const navigation = useNavigation<any>();
  const { openExpenseModal, openNoteModal, openActivityModal } = useTravelContext();
  const { data: profile } = useUserProfile();
  const [showTravelViewModal, setShowTravelViewModal] = useState<boolean>(false);
  const [showItineraryTab, setShowItineraryTab] = useState<boolean>(false);

  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [plainMode, setPlainMode] = useState<boolean>(false);
  
  const adjustedRef = useRef(false);
  const [titleIsLong, setTitleIsLong] = useState(false);

  const words = ['country', 'city', 'destination', 'place', 'province', 'region'];
  const [currentWord, setCurrentWord] = useState(words[0]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentWord((prev) => {
          const nextIndex = (words.indexOf(prev) + 1) % words.length;
          return words[nextIndex];
        });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const {
    data: travelPlan,
  } = useTravelPlan(ongoingTrip?.id);

  const formatDate = (v?: Date | string) =>
    v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  const getDuration = (s?: Date | string, e?: Date | string) => {
    if (!s || !e) return '';
    const diff = new Date(e).getTime() - new Date(s).getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return `${days} Day${days > 1 ? 's' : ''}`;
  };

  const [weather, setWeather] = useState<{ temp?: number; code?: number; loading: boolean }>({
    loading: false
  });

  useEffect(() => {
    let active = true;
    const loadWeather = async () => {
      if (!ongoingTrip) return;
      setWeather(prev => ({ ...prev, loading: true }));
      const result = await fetchWeatherInfo(ongoingTrip.destination, ongoingTrip.destinationData?.coordinates);
      if (active) {
        if (result) {
          setWeather({
            temp: result.temp,
            code: result.code,
            loading: false
          });
        } else {
          setWeather({ loading: false });
        }
      }
    };
    
    loadWeather();
    return () => {
      active = false;
    };
  }, [ongoingTrip?.destination, ongoingTrip?.destinationData?.coordinates]);

  const getWeatherIcon = (code?: number) => {
    if (code === undefined) return "sunny";
    if (code === 0) return "sunny";
    if (code >= 1 && code <= 3) return "partly-sunny";
    if (code === 45 || code === 48) return "cloudy";
    if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) return "rainy";
    if (code >= 71 && code <= 77) return "snow";
    if (code >= 95 && code <= 99) return "thunderstorm";
    return "sunny";
  };

  const getWeatherDescription = (code?: number) => {
    if (code === undefined) return "Sunny";
    if (code === 0) return "Clear";
    if (code >= 1 && code <= 3) return "Partly Cloudy";
    if (code === 45 || code === 48) return "Foggy";
    if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) return "Rainy";
    if (code >= 71 && code <= 77) return "Snowy";
    if (code >= 95 && code <= 99) return "Thunderstorm";
    return "Clear";
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) {
      return "Good morning";
    } else if (hours < 17) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  };

  return (
    <View className=''>
      <View className="w-full h-[350px] relative"
        style={{ borderBottomLeftRadius: ongoingTrip ? 30 : 0, borderBottomRightRadius: ongoingTrip ? 30 : 0 }}
      >
        <Image
          source={require('../../../assets/images/home_hero.png')}
          className="w-full h-full "
          resizeMode="cover"
          style={{ borderBottomLeftRadius: ongoingTrip ? 30 : 0, borderBottomRightRadius: ongoingTrip ? 30 : 0, backgroundColor: "#F2F4F7" }}
        />
        <View 
          className="absolute inset-0 bg-[#0EA5E9]" 
          style={{ borderBottomLeftRadius: ongoingTrip ? 30 : 0, borderBottomRightRadius: ongoingTrip ? 30 : 0 }}
        />

        {/* Appbar: Good morning message + Profile icon */}
        <View className="absolute top-[52px] left-5 right-5 flex-row justify-between items-center" style={{ zIndex: 10 }}>
         <View className="flex-row items-center gap-2">
           <TouchableOpacity
            className="w-12 h-12 rounded-full bg-white items-center justify-center overflow-hidden shadow-lg elevation-5"
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person-outline" size={24} color="#888" />
            )}
          </TouchableOpacity>

         <View className='flex-col'>
           <Text className="text-white text-xl font-semibold">
            {getGreeting()}, {profile?.nickname || "traveller"} 👋
          </Text> 
          <Text className="text-white text-sm ">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
         </View>
         </View>
          <TouchableOpacity
            onPress={onOpenNotifications}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            className="relative p-1"
          >
            <Ionicons name="notifications" size={28} color="#263F69" />
            {unreadNotifications > 0 && (
              <View className="absolute -top-2 -right-1 bg-[#D92D20] min-w-2xl h-2xl rounded-full items-center justify-center px-1 ">
                <Text className="text-white text-[10px] font-bold">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View className="absolute left-5 right-5" style={{ top: 100 }}>
          {ongoingTrip ? (
            <View className="py-2 mt-2 px-1">
              <View className="flex-row items-center gap-2">
                <Animated.View 
                  style={{ opacity: pulseAnim }}
                  className="w-2 h-2 rounded-full bg-green-400"
                />
                <Text className="text-green-300 text-[10px] font-bold tracking-widest uppercase">Ongoing</Text>
              </View>
              <Text
                className="text-white font-semibold mb-3 tracking-normal"
                style={{ fontSize: titleIsLong ? 40 : 46, lineHeight: titleIsLong ? 42 : 48 }}
                numberOfLines={3}
                onTextLayout={(e) => {
                  if (e.nativeEvent.lines.length > 1 && !adjustedRef.current) {
                    adjustedRef.current = true;
                    setTitleIsLong(true);
                  }
                }}
              >
                {ongoingTrip.title}
              </Text>

              <View className="flex-row items-center gap-1.5 mb-6">
                <Ionicons name="location-outline" size={20} color="rgba(255,255,255,0.65)" />
                <Text className="text-white text-xl " numberOfLines={1}>
                  {ongoingTrip.destination}
                </Text>
              </View>

              {/* <View className="flex-row items-center gap-1.5 mb-1">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.65)" />
                  <Text className="text-white text-base">
                    {formatDate(ongoingTrip.startOrDepartureDate)}
                    <Ionicons name="chevron-forward-outline" size={14} color="rgba(255,255,255,0.4)" style={{paddingRight: 10, paddingLeft: 10}} />
                    {ongoingTrip.endOrReturnDate ? `${formatDate(ongoingTrip.endOrReturnDate)}` : ''}
                  </Text>
                    {getDuration(ongoingTrip.startOrDepartureDate, ongoingTrip.endOrReturnDate) ? (
                  <View className="bg-white/15 px-3 py-0 rounded-full">
                    <Text className="text-white text-base">
                      {getDuration(ongoingTrip.startOrDepartureDate, ongoingTrip.endOrReturnDate)}
                    </Text>
                  </View>
                ) : null}
                </View>
              </View> */}

              <View className="flex-row items-center gap-4 mb-1 px-2">

                <View className="flex-1 items-start mb-1">
                  <Text className="text-white text-[10px] uppercase">
                    Weather Forecast
                  </Text>
                  {weather.loading ? (
                    <>
                      <Ionicons name="cloud-outline" size={28} color="rgba(255,255,255,0.65)" />
                      <Text className="text-white text-sm">--</Text>
                      <Text className="text-white text-[10px] uppercase">Loading...</Text>
                    </>
                  ) : weather.temp !== undefined ? (
                    <>
                    <View className="flex-row items-center">
                      <Ionicons 
                        name={getWeatherIcon(weather.code) as any} 
                        size={28} 
                        color="rgba(255,255,255,0.85)" 
                      />
                      <Text className="text-white text-3xl font-semibold ml-2">
                        {weather.temp}°
                      </Text>
                       <Text className="text-white text-sm font-semibold">
                        C
                      </Text>
                    </View>
                     <Text className="text-white text-[10px] uppercase">
                        {getWeatherDescription(weather.code)}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sunny-outline" size={28} color="rgba(255,255,255,0.65)" />
                      <Text className="text-white text-sm">N/A</Text>
                      <Text className="text-white text-[10px] uppercase">Unavailable</Text>
                    </>
                  )}
                </View>

                  <View className="flex-1 items-center mb-1">
                  <Text className="text-white text-[10px] uppercase">
                    Planned 
                  </Text>
                  {weather.loading ? (
                    <>
                      <Ionicons name="walk-outline" size={28} color="rgba(255,255,255,0.65)" />
                      <Text className="text-white text-sm">--</Text>
                      <Text className="text-white text-[10px] uppercase">Loading...</Text>
                    </>
                  ) : weather.temp !== undefined ? (
                    <>
                    <View className="flex-row items-center">
                      <Ionicons name="walk-outline" size={28} color="rgba(255,255,255,0.65)" />
                      <Text className="text-white text-2xl font-semibold">
                        14 
                      </Text>
                    </View>
                     <Text className="text-white text-[10px] uppercase">
                        activities 
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sunny-outline" size={28} color="rgba(255,255,255,0.65)" />
                      <Text className="text-white text-sm">N/A</Text>
                      <Text className="text-white text-[10px] uppercase">Unavailable</Text>
                    </>
                  )}
                </View>


                <View className="flex-1 items-center mb-1">
                  <Text className="text-white text-[10px] uppercase">
                    Checklist 
                  </Text>
                  {weather.loading ? (
                    <>
                      <Ionicons name="list-outline" size={28} color="rgba(255,255,255,0.65)" />
                      <Text className="text-white text-sm">--</Text>
                      <Text className="text-white text-[10px] uppercase">Loading...</Text>
                    </>
                  ) : weather.temp !== undefined ? (
                    <>
                    <View className="flex-row items-center">
                      <Ionicons name="list-outline" size={28} color="rgba(255,255,255,0.65)" />
                      <Text className="text-white text-2xl font-semibold">
                        100 
                      </Text>
                    </View>
                     <Text className="text-white text-[10px] uppercase">
                        items 
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sunny-outline" size={28} color="rgba(255,255,255,0.65)" />
                      <Text className="text-white text-sm">N/A</Text>
                      <Text className="text-white text-[10px] uppercase">Unavailable</Text>
                    </>
                  )}
                </View>



              

              </View>           
            </View>
          ) : (
            <View>
              <Text
                className="text-white text-[36px] font-extrabold mt-3xl"
              >
                Where to go next?
              </Text>
              <Text
                className="text-gray-200 text-lg font-medium mb-3"
              >
                Plan your next trip with Travelled
              </Text>

              <TouchableOpacity 
                onPress={() => onOpenCreateTripModal && onOpenCreateTripModal(null)}
                className="flex-row items-center bg-white rounded-4xl p-5 shadow-lg elevation-5"
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Create a new trip"
              >
                <Ionicons name="search" size={20} color="#6b7280" style={{ marginRight: 10 }} />
                <Text className="text-lg text-secondary/60 font-semibold">Search a </Text>
                <Animated.Text 
                  style={{ opacity: fadeAnim, color: "#6b7280", fontWeight: "600", fontSize: 16, lineHeight: 18 }} 
                >
                  {currentWord}
                </Animated.Text>
              </TouchableOpacity>
            </View> 
          )}
        </View>


        {travelPlan && (
          <>
            <ViewTravelModal
              travelId={ongoingTrip?.id || ""}
              showModal={showTravelViewModal}
              setShowModal={setShowTravelViewModal}
            />

            <Modal
            visible={showItineraryTab} 
            transparent={false} 
            animationType="none"
            onRequestClose={() => setShowItineraryTab(false)}>
              <View className="flex-row justify-between items-center px-5 py-2 border-b border-gray-200 pt-14">
                  <View className="flex-col flex-1 ">
                      <Text className="text-sm text-gray-400 font-medium">
                        {travelPlan.travel.title}
                      </Text>
                      <Text className="text-2xl text-gray-700 font-medium">
                        Itinerary
                      </Text>
                  </View>
                    {/* <TouchableOpacity onPress={() => setPlainMode(p => !p)} >
                      <Icon name={plainMode ? "format-list-bulleted" : "list"} size={32} color={plainMode ? "#263F69" : "#333"} />
                  </TouchableOpacity> */}
                  <TouchableOpacity onPress={() => setShowItineraryTab(false)} >
                      <Icon name="clear" size={36} color={"#333"} />
                  </TouchableOpacity>
              </View>
            
              <View className="flex-1">
                <ItineraryTab
                    travelPlan={travelPlan}
                    plainMode={plainMode}
                    />
              </View>
            </Modal>
          </>
        )}


        <ProfileScreen
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      </View>

      {ongoingTrip && (
      <View className="m-xl py-xl flex-1 bg-white rounded-4xl border border-gray-200">

        <Text className="text-xs uppercase font-semibold px-xl text-secondary ">Quick Actions</Text>
        <View className="flex-row items-center justify-between py-3 z-40 px-4xl">

        <View className="items-center">
          <TouchableOpacity 
            // style={{ borderCurve: 'continuous' }}
            className='items-center justify-center w-7xl h-7xl rounded-full border bg-gray-modern-50 border-gray-100' 
            onPress={() => setShowTravelViewModal(true)}
          >
            <Ionicons name="briefcase" size={24} color="#263F69" />
          </TouchableOpacity>
          <Text className="text-sm font-medium text-secondary mt-1">View Trip</Text>
        </View>

        <View className="items-center">
          <TouchableOpacity 
            className='items-center justify-center w-7xl h-7xl rounded-full border  bg-gray-modern-50 border-gray-100' 
            onPress={() => {
              openActivityModal(null, undefined, ongoingTrip?.id);
            }}
            accessibilityRole="button"
            accessibilityLabel="Add Activity"
          >
            <Ionicons name="walk" size={28} color="#263F69" />
          </TouchableOpacity>
          <Text className="text-sm font-medium text-secondary mt-1">Add Activity</Text>
        </View>
       
        {/* <View className="items-center">
          <TouchableOpacity 
            className='items-center justify-center w-6xl h-6xl rounded-full  border-2 border-gray-300' 
            onPress={() => {
              openExpenseModal(
                null,
                undefined,
                travelPlan?.itinerarySection?.flatMap(s => s.itineraryActivity || []) || [],
                ongoingTrip?.id
              );
            }}
            accessibilityRole="button"
            accessibilityLabel="Add Expense"
          >
            <Ionicons name="cash" size={24} color="#263F69" />
          </TouchableOpacity>
          <Text className="text-primary text-xs mt-2">Add Expense</Text>
        </View>

        <View className="items-center">
          <TouchableOpacity 
            className='items-center justify-center w-6xl h-6xl rounded-full  border-2 border-gray-300' 
            onPress={() => {
              openNoteModal(
                null,
                travelPlan?.itinerarySection?.flatMap(s => s.itineraryActivity || []) || [],
                ongoingTrip?.id
              );
            }}
            accessibilityRole="button"
            accessibilityLabel="Add Note"
          >
            <Ionicons name="document-text-outline" size={24} color="#263F69" />
          </TouchableOpacity>
          <Text className="text-primary text-xs mt-2">Add Note</Text>
        </View> */}
        
        <View className="items-center">
          <TouchableOpacity 
            className='items-center justify-center w-7xl h-7xl rounded-full border  bg-gray-modern-50 border-gray-100' 
            onPress={() => setShowItineraryTab(true)}
          >
            <Ionicons name="list" size={24} color="#263F69" />
          </TouchableOpacity>
          <Text className="text-sm font-medium text-secondary mt-1">Itinerary</Text>

        </View>

        {/* <TouchableOpacity className='items-center opacity-50' disabled={true} >
          <Ionicons name="map-outline" size={24} color="#000" />
          <Text className="text-primary text-xs">Map</Text>
        </TouchableOpacity> */}
      </View>

      </View>
      )}



    </View>
  )};

export default Hero;
