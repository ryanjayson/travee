import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  CreateTravelPlanScreen,
  EditTravelPlanScreen,
} from "../navigation/TabScreens";
import { RootTabs } from "./RootTabs";
import type { RootStackParamList } from "./navigation.types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={RootTabs}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CreateTravelPlan"
        component={CreateTravelPlanScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="EditTravelPlan"
        component={EditTravelPlanScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
