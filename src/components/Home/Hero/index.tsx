import { MaterialIcons as Icon, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTravelContext } from "../../../context/TravelContext";
import CreateTripModal from '../../../features/Travel/components/CreateOrEdit/Modal';
import MapboxDestinationSelector, { MapboxPlace } from '../../../features/Travel/components/MapboxDestinationSelector';
import ViewTravelModal from "../../../features/Travel/components/View/Modal";
import ItineraryTab from "../../../features/Travel/components/View/Tabs/ItineraryTab";
import { useTravelPlan } from '../../../features/Travel/hooks/useTravel';
import { Travel } from '../../../features/Travel/types/TravelDto';
import { ProfileScreen } from '../../../screens/ProfileScreen';

interface HeroProps {
  ongoingTrip: Travel | null;
}

const Hero = ({ ongoingTrip }: HeroProps) => {
  const navigation = useNavigation<any>();
  const { selectedTravelPlan, openExpenseModal, openNoteModal, openActivityModal } = useTravelContext();
  const [showTravelViewModal, setShowTravelViewModal] = useState<boolean>(false);
  const [showItineraryTab, setShowItineraryTab] = useState<boolean>(false);
  const [showMapSelector, setShowMapSelector] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [prefilledTripData, setPrefilledTripData] = useState<any>(null);
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

  return (
    <View className=''>
      <View className="w-full h-[300px] relative"
        style={{ borderBottomLeftRadius: ongoingTrip ? 30 : 0, borderBottomRightRadius: ongoingTrip ? 30 : 0 }}
      >
        <Image
          source={require('../../../assets/images/home_hero.png')}
          className="w-full h-full "
          resizeMode="cover"
          style={{ borderBottomLeftRadius: ongoingTrip ? 30 : 0, borderBottomRightRadius: ongoingTrip ? 30 : 0, backgroundColor: "#F2F4F7" }}
        />
        <View 
          className="absolute inset-0 "
          style={{ backgroundColor: "rgba(0,0,0,0.60)", borderBottomLeftRadius: ongoingTrip ? 30 : 0, borderBottomRightRadius: ongoingTrip ? 30 : 0 }}
        />

        {/* Profile icon — always visible top-right */}
        <TouchableOpacity
          className="absolute top-[52px] right-5 w-14 h-14 rounded-full bg-white/20 items-center justify-center"
          onPress={() => setShowProfileModal(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Ionicons name="person-outline" size={24} color="#fff" />
        </TouchableOpacity>

        <View className="absolute left-5 right-5" style={{ top: ongoingTrip ? 70 : 80 }}>
            <Text className="tracking-wider text-white text-sm mb-1">Good morning, Travieler</Text>
          {ongoingTrip ? (
            <View className="py-2 px-1">
              <View className="flex-row items-center gap-2">
                <Animated.View 
                  style={{ opacity: pulseAnim }}
                  className="w-2 h-2 rounded-full bg-green-400"
                />
                <Text className="text-green-300 text-[10px] font-bold tracking-widest uppercase">Ongoing</Text>
              </View>
              <Text
                className="text-white font-bold mb-1"
                style={{ fontSize: titleIsLong ? 24 : 36 }}
                numberOfLines={2}
                onTextLayout={(e) => {
                  if (e.nativeEvent.lines.length > 1 && !adjustedRef.current) {
                    adjustedRef.current = true;
                    setTitleIsLong(true);
                  }
                }}
              >
                {ongoingTrip.title}
              </Text>

              <View className="flex-row items-center gap-1.5 mb-3">
                <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.65)" />
                <Text className="text-white text-md font-medium" numberOfLines={1}>
                  {ongoingTrip.destination}
                </Text>
              </View>

              <View className="flex-row items-center gap-1.5 mb-1">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.65)" />
                  <Text className="text-white text-sm">
                    {formatDate(ongoingTrip.startOrDepartureDate)}
                    <Ionicons name="arrow-forward-outline" size={10} color="rgba(255,255,255,0.4)" style={{paddingRight: 10, paddingLeft: 10}} />
                    {ongoingTrip.endOrReturnDate ? `${formatDate(ongoingTrip.endOrReturnDate)}` : ''}
                  </Text>
                    {getDuration(ongoingTrip.startOrDepartureDate, ongoingTrip.endOrReturnDate) ? (
                  <View className="bg-white/15 px-3 py-1 rounded-full">
                    <Text className="text-white text-xs">
                      {getDuration(ongoingTrip.startOrDepartureDate, ongoingTrip.endOrReturnDate)}
                    </Text>
                  </View>
                ) : null}
                </View>
              
              </View>

              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons name="walk-outline" size={14} color="rgba(255,255,255,0.65)" />
                <Text className="text-white text-sm">
                12 Planned activities 
                </Text>
              </View>

              <View className="flex-row items-center gap-1.5 mb-4">
                <Ionicons name="list-outline" size={16} color="rgba(255,255,255,0.65)" />
                <Text className="text-white text-sm " >
                Show Checklist stats
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <Text
                className="text-white text-4xl font-extrabold mb-2"
              >
                Where to go next?
              </Text>
              <Text
                className="text-gray-100 text-m font-medium mb-5"
              >
                Plan your next adventure with Travie.
              </Text>

              <TouchableOpacity 
                onPress={() => setShowMapSelector(true)}
                className="flex-row items-center bg-white rounded-3xl px-4 py-3 shadow-lg elevation-5"
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={20} color="#6b7280" style={{ marginRight: 10 }} />
                <Text className="text-base text-gray-400">Search a </Text>
                <Animated.Text 
                  style={{ opacity: fadeAnim }} 
                  className="flex-1 text-base text-gray-400"
                >
                  {currentWord}...
                </Animated.Text>
              </TouchableOpacity>
            </View> 
          )}
        </View>


        {travelPlan && (
          <>
            <ViewTravelModal
              travelId={selectedTravelPlan?.id || ""}
              showModal={showTravelViewModal}
              setShowModal={setShowTravelViewModal}
            />

            <Modal
            visible={showItineraryTab} 
            transparent={false} 
            animationType="none"
            onRequestClose={() => setShowItineraryTab(false)}>
              <View className="flex-row justify-between items-center p-5 border-b border-gray-200 pt-12">
                  <View className="flex-col flex-1 ">
                      <Text className="text-sm text-gray-400 font-medium">
                        {travelPlan.travel.title}
                      </Text>
                      <Text className="text-2xl text-gray-700 font-medium">
                        Itinerary
                      </Text>
                  </View>
                    <TouchableOpacity onPress={() => setPlainMode(p => !p)} >
                      <Icon name={plainMode ? "format-list-bulleted" : "list"} size={32} color={plainMode ? "#263F69" : "#333"} />
                  </TouchableOpacity>
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

        <Modal
          visible={showMapSelector}
          animationType="slide"
          transparent
          onRequestClose={() => setShowMapSelector(false)}
        >
          <View className="bg-white flex-1">
            <MapboxDestinationSelector
              onClose={() => setShowMapSelector(false)}
              onSelect={(place: MapboxPlace) => {
                setPrefilledTripData({
                  destination: place.fullName,
                  destinationData: {
                    id: place.id,
                    coordinates: {
                      longitude: place.coordinates.longitude,
                      latitude: place.coordinates.latitude,
                    },
                  },
                });
                setShowMapSelector(false);
                setShowCreateModal(true);
              }}
            />
          </View>
        </Modal>

        <CreateTripModal
          showModal={showCreateModal}
          setShowModal={setShowCreateModal}
          tripData={prefilledTripData}
        />

        <Modal
          visible={showProfileModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowProfileModal(false)}
        >
          <ProfileScreen onClose={() => setShowProfileModal(false)} />
        </Modal>
      </View>

      {ongoingTrip && (
      <View className="m-xl flex-1 bg-white rounded-xl">

        <Text className="text-sm font-medium px-lg pt-lg">Quick Actions</Text>
        <View className="flex-row items-center justify-between py-3 z-40 px-4xl">

        <View className="items-center">
          <TouchableOpacity className='items-center justify-center w-7xl h-7xl rounded-3xl border bg-gray-100 border-gray-200' onPress={() => setShowTravelViewModal(true)}>
            <Ionicons name="briefcase" size={24} color="#263F69" />
          </TouchableOpacity>
          <Text className="text-sm font-medium text-primary mt-1">View Trip</Text>
        </View>

        <View className="items-center">
          <TouchableOpacity 
            className='items-center justify-center w-7xl h-7xl rounded-3xl border border-gray-200 bg-gray-100' 
            onPress={() => {
              openActivityModal(null, undefined);
            }}
            accessibilityRole="button"
            accessibilityLabel="Add Activity"
          >
            <Ionicons name="walk" size={28} color="#263F69" />
          </TouchableOpacity>
          <Text className="text-sm font-medium text-primary mt-1">Add Activity</Text>
        </View>
       
        {/* <View className="items-center">
          <TouchableOpacity 
            className='items-center justify-center w-6xl h-6xl rounded-full  border-2 border-gray-300' 
            onPress={() => {
              openExpenseModal(
                null,
                undefined,
                travelPlan?.itinerarySection?.flatMap(s => s.itineraryActivity || []) || []
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
                travelPlan?.itinerarySection?.flatMap(s => s.itineraryActivity || []) || []
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
          <TouchableOpacity className='items-center justify-center w-7xl h-7xl rounded-3xl border border-gray-200 bg-gray-100' onPress={() => setShowItineraryTab(true)}>
          <Ionicons name="list" size={24} color="#263F69" />
        </TouchableOpacity>
          <Text className="text-sm font-medium text-primary mt-1">Itinerary</Text>

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
