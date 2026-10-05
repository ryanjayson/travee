import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { TravelProvider, useTravelContext } from "../context/TravelContext";
import { Text } from "react-native";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import TravelCatalog from "../features/Travel/screens/TravelCatalog";
import { ExploreScreen } from "../screens/MapScreen";
import HomeScreen from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import CreateTravelModal from "../features/Travel/components/CreateOrEdit/Modal";
import TravelModals from "../features/Travel/components/TravelModals";
import type { RootStackParamList } from "./navigation.types";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';
import { AnimatedPressable } from "../components/animations";

const { width: WIDTH } = Dimensions.get('window');
// const TAB_WIDTH = WIDTH * 0.7;


export type RootTabsParamList = {
  Home: undefined;
  Trips: undefined;
  Maps: undefined;
  AddFab: {
    key?: string;
    color?: string;
    icon?: string;
    name?: string;
    label?: string;
  };
  // Profile: undefined;
  // Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabsParamList>();

function iconForRoute(routeName: keyof RootTabsParamList, focused: boolean) {
  switch (routeName) {
    case "Home":
      return focused ? "home" : "home-outline";
    case "AddFab":
      return focused ? "add-outline" : "add-outline";
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
  return <HomeScreen />;
};

// Tab screens can be used directly or wrapped if needed. We mount TravelCatalog directly.

function RootTabsComponent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [visibleCreateTravelModal, setVisibleCreateTravelModal] = React.useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <View style={{ flex: 1, height: "100%" }}>
        <Tab.Navigator
          id="RootTabs"
          initialRouteName="Home"

          screenOptions={({ route }): BottomTabNavigationOptions => ({
            headerTitleAlign: "left",
            headerShadowVisible: false,
            tabBarShowLabel: true,

            tabBarActiveTintColor: '#0EA5E9',
            tabBarInactiveTintColor: '#98A2B3',
            tabBarIconStyle: {
              top: -2,
              padding: 0,
              margin: 0,
            },
            tabBarIcon: ({ color, focused }) => {
              const iconName = iconForRoute(route.name, focused);
              const isAddTab = route.name === "AddFab";

              return (
                <View className="flex-1 justify-center items-center -top-1 "
                >
                  <Ionicons
                    name={iconName as any}
                    size={isAddTab ? 34 : 28}
                    color={focused ? "#0EA5E9" : color}
                    style={{
                      backgroundColor: isAddTab ? '#0EA5E9' : 'transparent',
                      width: isAddTab ? 70 : 28,
                      height: isAddTab ? 70 : 28,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: isAddTab ? 35 : 15,
                      padding: isAddTab ? 18 : 0,
                      color: isAddTab ? '#fff' : '#0EA5E9',
                    }}
                  />
                  {!isAddTab && (
                    <Text
                      className={`text-xs font-bold ${
                        focused ? 'text-primary' : 'text-gray-400'
                      }`}
                    >
                      {route.name}
                    </Text>
                  )}
                </View>
              );
            },

            tabBarStyle: {
              position: 'absolute',
              marginLeft: "50%",
              transform: [{ translateX: -125 }],
              bottom: insets.bottom + 10,
              width: 250,
              height: 78,
              borderRadius: 39,
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
            name="AddFab"
            component={HomeTabScreen}
            options={{ headerShown: false }}
            listeners={{
              tabPress: (e) => {
                (e as any).preventDefault?.();
                setVisibleCreateTravelModal(true);
              },
            }}
          />
          <Tab.Screen
            name="Trips"
            component={TravelCatalog}
          // options={{
          //   headerRight: () => (
          //     <TouchableOpacity
          //       onPress={() => setVisibleCreateTravelModal(true)}
          //       style={{ marginRight: 16 }}
          //     >
          //       <Ionicons name="add" size={32} color="#0EA5E9" />
          //     </TouchableOpacity>
          //   ),
          // }}
          />
          {/* <Tab.Screen
            name="Maps"
            component={ExploreScreen}
            options={{ headerShown: false }}
          /> */}
        </Tab.Navigator>

        {/* Floating Add Button on the right side */}
        {/* <AnimatedPressable
          onPress={() => setVisibleCreateTravelModal(true)}
          accessibilityLabel="Add a trip"
          className="bg-[#0EA5E9]"
          scaleTo={0.90}
          style={{
            position: 'absolute',
            bottom: insets.bottom + 20,
            left: WIDTH - 110,
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: '#0EA5E9',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={40} color="#ffffff" />
        </AnimatedPressable> */}

        <CreateTravelModal
          showModal={visibleCreateTravelModal}
          setShowModal={setVisibleCreateTravelModal}
          onCreated={(createdId) => {
            if (createdId) {
              navigation.navigate("TravelDetail", { travelId: createdId });
            }
          }}
        />
        <TravelModals />
      </View>

    </>

  );
}

export function RootTabs() {
  return (
    <TravelProvider>
      <RootTabsComponent />
    </TravelProvider>
  );
}
