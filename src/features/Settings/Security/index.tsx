import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { Switch, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "../../../context/ToastContext";
import {
  authenticateWithBiometrics,
  clearPin,
  getPin,
  isBiometricsEnabled,
  isBiometricsSupported,
  isPinEnabled,
  setBiometricsEnabled as saveBiometricsEnabled,
  setPinEnabled as savePinEnabled,
  setPin,
} from "../../../services/local/securityService";

export const SecuritySettings: React.FC = () => {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [tempConfirmPin, setTempConfirmPin] = useState("");
  const [pinStage, setPinStage] = useState<"enter" | "confirm">("enter");
  const [pinError, setPinError] = useState("");
  const [correctPin, setCorrectPin] = useState<string | null>(null);

  useEffect(() => {
    const loadSecurity = async () => {
      const pinActive = await isPinEnabled();
      setPinEnabled(pinActive);
      const bioActive = await isBiometricsEnabled();
      setBiometricsEnabled(bioActive);
      const { hasHardware, isEnrolled } = await isBiometricsSupported();
      setBiometricsSupported(hasHardware && isEnrolled);
      const storedPin = await getPin();
      setCorrectPin(storedPin);
    };
    loadSecurity();
  }, []);

  const handlePinToggle = async (value: boolean) => {
    if (value) {
      setPinStage("enter");
      setPinCode("");
      setTempConfirmPin("");
      setPinError("");
      setShowSetupModal(true);
    } else {
      setPinCode("");
      setPinError("");
      const stored = await getPin();
      setCorrectPin(stored);
      setShowVerifyModal(true);
    }
  };

  const handleBiometricsToggle = async (value: boolean) => {
    if (value) {
      const success = await authenticateWithBiometrics(
        "Confirm fingerprint to enable biometric lock"
      );
      if (success) {
        await saveBiometricsEnabled(true);
        setBiometricsEnabled(true);
        showToast({
          type: "success",
          message: "Biometric lock enabled",
        });
      } else {
        await saveBiometricsEnabled(false);
        setBiometricsEnabled(false);
        showToast({
          type: "error",
          message: "Biometric verification failed",
        });
      }
    } else {
      await saveBiometricsEnabled(false);
      setBiometricsEnabled(false);
      showToast({
        type: "success",
        message: "Biometric lock disabled",
      });
    }
  };

  const handleSetupPinPress = async (num: string) => {
    if (pinCode.length >= 4) return;
    const newVal = pinCode + num;
    setPinCode(newVal);
    setPinError("");

    if (newVal.length === 4) {
      if (pinStage === "enter") {
        setTempConfirmPin(newVal);
        setPinCode("");
        setPinStage("confirm");
      } else if (pinStage === "confirm") {
        if (newVal === tempConfirmPin) {
          await setPin(newVal);
          await savePinEnabled(true);
          setCorrectPin(newVal);
          setPinEnabled(true);
          setShowSetupModal(false);
          setPinCode("");
          showToast({
            type: "success",
            message: "PIN code saved successfully",
          });
        } else {
          Vibration.vibrate(200);
          setPinCode("");
          setPinStage("enter");
          setPinError("PINs do not match. Try again.");
        }
      }
    }
  };

  const handleVerifyPinPress = async (num: string) => {
    if (pinCode.length >= 4) return;
    const newVal = pinCode + num;
    setPinCode(newVal);
    setPinError("");

    if (newVal.length === 4) {
      if (newVal === correctPin) {
        await clearPin();
        setPinEnabled(false);
        setBiometricsEnabled(false);
        setShowVerifyModal(false);
        setPinCode("");
        showToast({
          type: "success",
          message: "PIN lock disabled",
        });
      } else {
        Vibration.vibrate(200);
        setPinCode("");
        setPinError("Incorrect PIN code");
      }
    }
  };

  return (
    <>
      <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6] will-change-variable">
        <Text className="text-xl font-semibold text-secondary/80">Security Settings</Text>

        {/* PIN Lock Toggle */}
        <View className="flex-row justify-between items-center py-2">
          <View className="flex-1 mr-4">
            <Text className="text-base font-semibold text-tertiary">PIN Code Lock</Text>
            <Text className="text-sm text-tertiary/75">Require passcode to unlock app</Text>
          </View>
          <Switch
            value={pinEnabled}
            onValueChange={handlePinToggle}
            trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
            thumbColor={pinEnabled ? colors.primary : "#F3F4F6"}
            accessibilityRole="switch"
            accessibilityLabel="Toggle PIN code lock"
          />
        </View>

        {/* Change PIN Button (if enabled) */}
        {pinEnabled && (
          <>
            <View className="h-[1px] bg-[#E5E7EB]" />
            <TouchableOpacity
              onPress={() => {
                setPinStage("enter");
                setPinCode("");
                setTempConfirmPin("");
                setPinError("");
                setShowSetupModal(true);
              }}
              className="flex-row justify-between items-center py-2"
              accessibilityRole="button"
              accessibilityLabel="Change PIN"
              activeOpacity={0.7}
            >
              <Text className="text-sm font-semibold text-[#374151]">Change PIN Code</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </>
        )}

        {/* Biometrics Toggle (if supported and PIN enabled) */}
        {pinEnabled && biometricsSupported && (
          <>
            <View className="h-[1px] bg-[#E5E7EB]" />
            <View className="flex-row justify-between items-center py-2">
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold text-tertiary">Biometric Lock</Text>
                <Text className="text-sm text-[#6B7280]">Unlock using fingerprint or Face ID</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={handleBiometricsToggle}
                trackColor={{ false: "#D1D5DB", true: colors.primary + "80" }}
                thumbColor={biometricsEnabled ? colors.primary : "#F3F4F6"}
                accessibilityRole="switch"
                accessibilityLabel="Toggle biometric lock"
              />
            </View>
          </>
        )}
      </View>

      {/* PIN Setup Modal */}
      <Modal visible={showSetupModal} transparent animationType="slide" onRequestClose={() => setShowSetupModal(false)}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              width: "100%",
              maxWidth: 360,
              padding: 24,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>
                {pinStage === "enter" ? "Create PIN Code" : "Confirm PIN Code"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowSetupModal(false);
                  setPinCode("");
                  setTempConfirmPin("");
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancel setup"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              {pinStage === "enter"
                ? "Enter a 4-digit security PIN"
                : "Re-enter your 4-digit PIN to confirm"}
            </Text>

            {/* PIN Indicators */}
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pinCode.length > index;
                return (
                  <View
                    key={index}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: colors.primary,
                      backgroundColor: isFilled ? colors.primary : "transparent",
                    }}
                  />
                );
              })}
            </View>

            {pinError ? (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 13,
                  fontWeight: "600",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                {pinError}
              </Text>
            ) : null}

            {/* Keypad */}
            <View style={{ width: "100%", gap: 12 }}>
              {[
                ["1", "2", "3"],
                ["4", "5", "6"],
                ["7", "8", "9"],
              ].map((row, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 16,
                  }}
                >
                  {row.map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => handleSetupPinPress(num)}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Digit ${num}`}
                    >
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: "bold",
                          color: "#1F2937",
                        }}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
                <View style={{ width: 64, height: 64 }} />
                <TouchableOpacity
                  onPress={() => handleSetupPinPress("0")}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Digit 0"
                >
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: "#1F2937",
                    }}
                  >
                    0
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPinCode((p) => p.slice(0, -1))}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Backspace"
                >
                  <Ionicons name="backspace-outline" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* PIN Verification Modal */}
      <Modal visible={showVerifyModal} transparent animationType="slide" onRequestClose={() => setShowVerifyModal(false)}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              width: "100%",
              maxWidth: 360,
              padding: 24,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>
                Verify PIN Code
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowVerifyModal(false);
                  setPinCode("");
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancel verification"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Enter your current 4-digit PIN to disable security lock
            </Text>

            {/* PIN Indicators */}
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pinCode.length > index;
                return (
                  <View
                    key={index}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: colors.primary,
                      backgroundColor: isFilled ? colors.primary : "transparent",
                    }}
                  />
                );
              })}
            </View>

            {pinError ? (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 13,
                  fontWeight: "600",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                {pinError}
              </Text>
            ) : null}

            {/* Keypad */}
            <View style={{ width: "100%", gap: 12 }}>
              {[
                ["1", "2", "3"],
                ["4", "5", "6"],
                ["7", "8", "9"],
              ].map((row, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 16,
                  }}
                >
                  {row.map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => handleVerifyPinPress(num)}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Digit ${num}`}
                    >
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: "bold",
                          color: "#1F2937",
                        }}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
                <View style={{ width: 64, height: 64 }} />
                <TouchableOpacity
                  onPress={() => handleVerifyPinPress("0")}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Digit 0"
                >
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: "#1F2937",
                    }}
                  >
                    0
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPinCode((p) => p.slice(0, -1))}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Backspace"
                >
                  <Ionicons name="backspace-outline" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

export interface SecurityBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const SecurityBottomSheet: React.FC<SecurityBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height;
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, screenHeight]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <Animated.View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: backdropOpacity,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />

        <Animated.View
          className="bg-[#F9FAFB] rounded-t-[30px] shadow-lg overflow-hidden"
          style={{
            transform: [{ translateY }],
            maxHeight: screenHeight * 0.85,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
        >
          {/* Drag Handle Area */}
          <View
            {...dragPanResponder.panHandlers}
            className="w-full items-center pt-3 pb-2 bg-white rounded-t-[30px]"
          >
            <View className="w-10 h-1 bg-gray-200 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-5 pt-2 pb-4 bg-white border-b border-gray-200">
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleDismiss}
                accessibilityRole="button"
                accessibilityLabel="Close security settings"
              >
                <Ionicons name="chevron-back" size={26} color="#999" />
              </TouchableOpacity>
              <Text className="text-2xl text-gray-700 font-medium">
                Security Settings
              </Text>
            </View>
          </View>

          {/* Scrollable Body */}
          <ScrollView
            className="p-4"
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            <SecuritySettings />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default SecuritySettings;
