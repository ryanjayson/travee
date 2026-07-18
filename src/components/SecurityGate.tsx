import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Alert,
  SafeAreaView,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { database } from "../db";
import {
  isPinEnabled,
  isBiometricsEnabled,
  getPin,
  clearPin,
  authenticateWithBiometrics,
  isBiometricsSupported,
} from "../services/local/securityService";

interface SecurityGateProps {
  children: React.ReactNode;
}

export function SecurityGate({ children }: SecurityGateProps) {
  const { colors } = useTheme();
  const [isLocked, setIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [pinValue, setPinValue] = useState("");
  const [correctPin, setCorrectPin] = useState<string | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const appState = useRef(AppState.currentState);
  const lastBackgroundTime = useRef<number>(0);
  const GRACE_PERIOD_MS = 10000; // 10 seconds grace period

  // Load security settings
  const loadSecuritySettings = async () => {
    try {
      const pinActive = await isPinEnabled();
      if (pinActive) {
        const stored = await getPin();
        setCorrectPin(stored);
        setIsLocked(true);

        const bioActive = await isBiometricsEnabled();
        setBiometricsEnabled(bioActive);

        const { hasHardware, isEnrolled } = await isBiometricsSupported();
        setHasBiometrics(hasHardware && isEnrolled);

        if (bioActive && hasHardware && isEnrolled) {
          // Trigger biometric prompt on mount
          setTimeout(() => {
            handleBiometrics();
          }, 300);
        }
      } else {
        setIsLocked(false);
      }
    } catch (err) {
      console.error("Failed to load security settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSecuritySettings();

    // App state listener to auto-lock when backgrounded
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      const pinActive = await isPinEnabled();

      if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        lastBackgroundTime.current = Date.now();
        if (pinActive) {
          setIsLocked(true);
          setPinValue("");
          setErrorMessage("");
        }
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground
        if (!pinActive) {
          setIsLocked(false);
          appState.current = nextAppState;
          return;
        }

        const timeInBackground = Date.now() - lastBackgroundTime.current;
        if (timeInBackground <= GRACE_PERIOD_MS) {
          setIsLocked(false);
        } else {
          // Re-load PIN just in case it was changed
          const stored = await getPin();
          setCorrectPin(stored);
          setIsLocked(true);
          setPinValue("");
          setErrorMessage("");

          const bioActive = await isBiometricsEnabled();
          const { hasHardware, isEnrolled } = await isBiometricsSupported();
          if (bioActive && hasHardware && isEnrolled) {
            setTimeout(() => {
              handleBiometrics();
            }, 300);
          }
        }
        lastBackgroundTime.current = 0;
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleBiometrics = async () => {
    try {
      const success = await authenticateWithBiometrics("Verify your biometrics to unlock");
      if (success) {
        setIsLocked(false);
        setPinValue("");
        setErrorMessage("");
      }
    } catch (err) {
      console.error("Biometrics failed:", err);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pinValue.length >= 4) return;
    setErrorMessage("");

    const newVal = pinValue + num;
    setPinValue(newVal);

    if (newVal.length === 4) {
      if (newVal === correctPin) {
        setIsLocked(false);
        setPinValue("");
      } else {
        Vibration.vibrate(200);
        setErrorMessage("Incorrect PIN code");
        setPinValue("");
      }
    }
  };

  const handleBackspace = () => {
    if (pinValue.length > 0) {
      setPinValue(pinValue.slice(0, -1));
      setErrorMessage("");
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      "Reset Application",
      "Forgot your PIN? Resetting the app will permanently delete all your local travel plans, profile info, and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete watermelon database entries
              await database.write(async () => {
                await database.unsafeResetDatabase();
              });
              // Clear AsyncStorage
              await AsyncStorage.clear();
              // Clear secure storage PIN configurations
              await clearPin();

              setIsLocked(false);
              setPinValue("");
              setErrorMessage("");
              
              Alert.alert("App Reset Successful", "The app has been completely reset.");
            } catch (err) {
              console.error("Failed to reset application:", err);
              Alert.alert("Error", "Failed to reset application data.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: "#111827" }} />;
  }

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#111827" }]}>
      <View style={styles.content}>
        {/* Header/Logo */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}1A` }]}>
            <Ionicons name="lock-closed" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>App Locked</Text>
          <Text style={styles.subtitle}>Enter your 4-digit PIN to continue</Text>
        </View>

        {/* PIN Indicators */}
        <View style={styles.pinIndicatorContainer}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pinValue.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.pinIndicatorDot,
                  {
                    backgroundColor: isFilled ? colors.primary : "transparent",
                    borderColor: colors.primary,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Error message */}
        <View style={styles.errorContainer}>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {/* Row 1 */}
          <View style={styles.keypadRow}>
            {["1", "2", "3"].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleKeyPress(num)}
                style={styles.keypadButton}
                accessibilityRole="button"
                accessibilityLabel={`Digit ${num}`}
              >
                <Text style={styles.keypadButtonText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 2 */}
          <View style={styles.keypadRow}>
            {["4", "5", "6"].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleKeyPress(num)}
                style={styles.keypadButton}
                accessibilityRole="button"
                accessibilityLabel={`Digit ${num}`}
              >
                <Text style={styles.keypadButtonText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 3 */}
          <View style={styles.keypadRow}>
            {["7", "8", "9"].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleKeyPress(num)}
                style={styles.keypadButton}
                accessibilityRole="button"
                accessibilityLabel={`Digit ${num}`}
              >
                <Text style={styles.keypadButtonText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 4 */}
          <View style={styles.keypadRow}>
            {/* Biometric trigger */}
            {hasBiometrics && biometricsEnabled ? (
              <TouchableOpacity
                onPress={handleBiometrics}
                style={styles.keypadButton}
                accessibilityRole="button"
                accessibilityLabel="Authenticate with biometrics"
              >
                <Ionicons name="finger-print" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.keypadButtonPlaceholder} />
            )}

            {/* Zero */}
            <TouchableOpacity
              onPress={() => handleKeyPress("0")}
              style={styles.keypadButton}
              accessibilityRole="button"
              accessibilityLabel="Digit 0"
            >
              <Text style={styles.keypadButtonText}>0</Text>
            </TouchableOpacity>

            {/* Backspace */}
            <TouchableOpacity
              onPress={handleBackspace}
              style={styles.keypadButton}
              accessibilityRole="button"
              accessibilityLabel="Backspace"
            >
              <Ionicons name="backspace-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleResetApp}
            accessibilityRole="button"
            accessibilityLabel="Forgot PIN"
          >
            <Text style={styles.forgotText}>Forgot PIN? Reset App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  pinIndicatorContainer: {
    flexDirection: "row",
    gap: 24,
    marginVertical: 20,
  },
  pinIndicatorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorContainer: {
    height: 24,
    justifyContent: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  keypad: {
    width: "100%",
    maxHeight: 320,
    gap: 16,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  keypadButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  keypadButtonText: {
    fontSize: 26,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  keypadButtonPlaceholder: {
    width: 68,
    height: 68,
  },
  footer: {
    marginTop: 20,
  },
  forgotText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
