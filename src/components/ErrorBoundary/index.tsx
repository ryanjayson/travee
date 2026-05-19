/**
 * ErrorBoundary.tsx
 *
 * Production-grade React class-based error boundary.
 * Catches render errors from any child component tree, logs them to the
 * errorLogger service, and displays a friendly fallback UI.
 *
 * Usage:
 *   <ErrorBoundary screen="HomeScreen">
 *     <HomeScreen />
 *   </ErrorBoundary>
 */

import React, { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { logger, ErrorCategory, ErrorSeverity } from "../../services/errorLogger";

interface Props {
  children: ReactNode;
  /** Screen or component name — used in the error log. */
  screen?: string;
  /** Optional custom fallback UI. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.ui(error, {
      category: ErrorCategory.UI,
      severity: ErrorSeverity.Critical,
      errorCode: "ERR_RENDER_BOUNDARY",
      screen: this.props.screen ?? "Unknown",
      action: "component_render",
      contextData: {
        componentStack: info.componentStack?.slice(0, 500) ?? null,
      },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 justify-center items-center bg-white px-6">
          <Text className="text-5xl mb-4">⚠️</Text>
          <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
            Something went wrong
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6 leading-5">
            The app encountered an unexpected error. It has been logged for our
            team to review.
          </Text>
          {__DEV__ && (
            <ScrollView className="bg-gray-100 rounded-xl p-3 mb-4 max-h-40 w-full">
              <Text className="text-xs text-red-600 font-mono">
                {this.state.errorMessage}
              </Text>
            </ScrollView>
          )}
          <TouchableOpacity
            onPress={this.handleReset}
            className="bg-[#263F69] px-8 py-3 rounded-full"
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text className="text-white font-semibold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
