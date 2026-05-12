import "react-native-gesture-handler";
import "./global.css";
import * as React from "react";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { theme } from "./src/theme/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./src/features/Auth/hooks/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTripStatusCheck } from "./src/hooks/useTripStatusCheck";

const queryClient = new QueryClient();

/**
 * Mounts inside QueryClientProvider so useTripStatusCheck can access
 * useQueryClient() for cache invalidation after status mutations.
 */
function TripStatusGuard() {
  useTripStatusCheck();
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <StatusBar style="auto" />
              <TripStatusGuard />
              <AppNavigator />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

