import "react-native-gesture-handler";
import * as React from "react";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { theme } from "./src/theme/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./src/features/Auth/hooks/AuthContext";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="auto" />
          <AppNavigator />
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
