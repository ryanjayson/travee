import * as React from "react";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { RootStack } from "./RootStack";
import { trackScreen } from "../services/analytics/posthogService";

export function AppNavigator() {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = React.useRef<string | undefined>(undefined);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const currentRoute = (navigationRef.getCurrentRoute() as any);
        routeNameRef.current = currentRoute?.name;
        if (routeNameRef.current) {
          trackScreen(routeNameRef.current);
        }
      }}
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRoute = (navigationRef.getCurrentRoute() as any);
        const currentRouteName = currentRoute?.name;

        if (currentRouteName && previousRouteName !== currentRouteName) {
          trackScreen(currentRouteName);
        }
        routeNameRef.current = currentRouteName;
      }}
    >
      <RootStack />
    </NavigationContainer>
  );
}
