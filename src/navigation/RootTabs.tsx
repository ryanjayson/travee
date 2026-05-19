import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { TravelProvider } from "../context/TravelContext";
import { Text } from "react-native";

import TravelCatalog from "../features/Travel/screens/TravelCatalog";
import { ExploreScreen } from "../screens/MapScreen";
import HomeScreen from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import CreateTravelModal from "../features/Travel/components/CreateOrEdit/Modal";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';

const { width: WIDTH } = Dimensions.get('window');
// const TAB_WIDTH = WIDTH * 0.7;


export type RootTabsParamList = {
  Home: undefined;
  Trips: undefined;
  Maps: undefined;
  AddFab: undefined;
  // Profile: undefined;
  // Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabsParamList>();

function iconForRoute(routeName: keyof RootTabsParamList, focused: boolean) {
  switch (routeName) {
    case "Home":
      return focused ? "home" : "home-outline";
    case "Trips":
      return focused ? "briefcase" : "briefcase-outline";
    case "Maps":
      return focused ? "compass" : "compass-outline";
    // case "Profile":
    //   return focused ? "person" : "person-outline";
    // case "Settings":
    //   return focused ? "settings" : "settings-outline";
  }
}

const HomeTabScreen = () => {
  return (
    <TravelProvider>
      <HomeScreen />
    </TravelProvider>
  );
};

const TravelTab = () => {
  return (
    <TravelProvider>
      <TravelCatalog />
    </TravelProvider>
  );
};

export function RootTabs() { 
  const [visibleCreateTravelModal, setVisibleCreateTravelModal] = React.useState(false);
const insets = useSafeAreaInsets();

  return (
    <>
    <View style={{flex: 1, height: "100%"}}>
   <Tab.Navigator 
        id="RootTabs"
        initialRouteName="Home"
      
        screenOptions={({ route }): BottomTabNavigationOptions => ({
        headerTitleAlign: "left",
        headerShadowVisible: false,
        tabBarShowLabel: true,
        
        tabBarActiveTintColor: '#263F69',
        tabBarInactiveTintColor: '#98A2B3',
        tabBarIcon: ({ color, focused }) => {
          const iconName = iconForRoute(route.name, focused);
          return (
            <View className="flex-1 justify-center items-center">
            <Ionicons
              name={iconName}
              size={24}
              color={focused ? "#263F69" : color}
            />
            <Text className={`text-xs font-bold  ${focused ? 'text-primary' : 'text-gray-400'}`}>{route.name}</Text>
            </View>
          );
        },

      tabBarStyle: {
        position: 'absolute',
        marginLeft: WIDTH - 220 - 140,
        bottom: insets.bottom + 5,
        width: 220,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        borderTopWidth: 0,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      },
        })}
      >
        <Tab.Screen name="Home" component={HomeTabScreen} options={{ headerShown: false }} />  
        <Tab.Screen 
          name="Trips" 
          component={TravelTab} 
          options={{
            headerRight: () => (
              <TouchableOpacity 
                onPress={() => setVisibleCreateTravelModal(true)}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="add" size={32} color="#263F69" />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen name="Maps" component={ExploreScreen} options={{ headerShown: false }} />  
      </Tab.Navigator>

      {/* Floating Add Button on the right side */}
      <TouchableOpacity 
        onPress={() => setVisibleCreateTravelModal(true)}
        className="bg-button-primary"
        style={{
          position: 'absolute',
          bottom: insets.bottom + 5,
          left: WIDTH - 130,
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: '#263F69',
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={40} color="#ffffff" />
      </TouchableOpacity>

      <CreateTravelModal
        showModal={visibleCreateTravelModal}
        setShowModal={setVisibleCreateTravelModal}
      />
    </View>      
 
    </>

  );
}
