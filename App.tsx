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
import ErrorBoundary from "./src/components/ErrorBoundary";
import { logError, ErrorCategory, ErrorSeverity } from "./src/services/errorLogger";
import { ToastProvider } from "./src/context/ToastContext";
import { ConfirmProvider } from "./src/context/ConfirmContext";

// ─── Global unhandled JS error capture ───────────────────────────────────────
// Catches promise rejections and unhandled JS errors that escape React boundaries.
const originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
  logError(error, {
    category: ErrorCategory.Unknown,
    severity: isFatal ? ErrorSeverity.Critical : ErrorSeverity.High,
    errorCode: isFatal ? "ERR_FATAL_JS" : "ERR_UNHANDLED_JS",
    action: "global_error_handler",
    contextData: { isFatal: !!isFatal },
  });
  originalHandler(error, isFatal);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry once on failure; a second auto-retry on mobile usually just
      // stalls the UI further on a poor connection.
      retry: 1,
      // Treat cached data as fresh for 30 s to avoid unnecessary refetches
      // when navigating between screens rapidly.
      staleTime: 30 * 1000,
    },
    mutations: {
      // Mutations (create/update/delete) should never auto-retry —
      // retrying a write blindly can cause duplicate records.
      retry: 0,
    },
  },
});

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
              <ToastProvider>
                <ConfirmProvider>
                  <StatusBar style="auto" />
                  <TripStatusGuard />
                  <ErrorBoundary screen="AppRoot">
                    <AppNavigator />
                  </ErrorBoundary>
                </ConfirmProvider>
              </ToastProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

