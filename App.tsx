import "react-native-gesture-handler";
import "./global.css";
import * as React from "react";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { theme } from "./src/theme/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./src/features/Auth/hooks/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="auto" />
            <AppNavigator />
          </GestureHandlerRootView>
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
