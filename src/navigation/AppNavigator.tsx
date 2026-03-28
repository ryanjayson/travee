import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { RootStack } from "./RootStack";

export function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}
