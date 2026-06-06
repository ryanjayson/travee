import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TravelCatalog from "../features/Travel/screens/TravelCatalog";

const Stack = createNativeStackNavigator();

export const TripStack = () => (
  <Stack.Navigator id="OldTravelStack">
    <Stack.Screen name="Catalog" component={TravelCatalog} />
  </Stack.Navigator>
);
