import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

import { TripsScreen } from "../screens/TripsScreen";
import { ExploreScreen } from "../screens/ExploreScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

export type RootTabsParamList = {
  Trips: undefined;
  Explore: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabsParamList>();

function iconForRoute(routeName: keyof RootTabsParamList, focused: boolean) {
  switch (routeName) {
    case "Trips":
      return focused ? "map" : "map-outline";
    case "Explore":
      return focused ? "compass" : "compass-outline";
    case "Profile":
      return focused ? "person" : "person-outline";
    case "Settings":
      return focused ? "settings" : "settings-outline";
  }
}

export function RootTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Trips"
      screenOptions={({ route }): BottomTabNavigationOptions => ({
        headerTitleAlign: "center",
        tabBarLabelPosition: "below-icon",
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={iconForRoute(route.name, focused)}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
