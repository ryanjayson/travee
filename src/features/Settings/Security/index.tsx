import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, Vibration, View } from "react-native";
import { Switch, useTheme } from "react-native-paper";
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
import { SettingsBottomSheet } from "../components/SettingsBottomSheet";
import { PinModal } from "./PinModal";

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
      <View className="bg-white rounded-2xl p-4 gap-3 border border-[#F3F4F6]">
        <Text className="text-xl font-semibold text-secondary/80">
          Security Settings
        </Text>

        {/* PIN Lock Toggle */}
        <View className="flex-row justify-between items-center py-2">
          <View className="flex-1 mr-4">
            <Text className="text-base font-semibold text-tertiary">
              PIN Code Lock
            </Text>
            <Text className="text-sm text-tertiary/75">
              Require passcode to unlock app
            </Text>
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
              <Text className="text-sm font-semibold text-[#374151]">
                Change PIN Code
              </Text>
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
                <Text className="text-base font-semibold text-tertiary">
                  Biometric Lock
                </Text>
                <Text className="text-sm text-[#6B7280]">
                  Unlock using fingerprint or Face ID
                </Text>
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
      <PinModal
        visible={showSetupModal}
        title={pinStage === "enter" ? "Create PIN Code" : "Confirm PIN Code"}
        description={
          pinStage === "enter"
            ? "Enter a 4-digit security PIN"
            : "Re-enter your 4-digit PIN to confirm"
        }
        pinLength={pinCode.length}
        error={pinError}
        onDigitPress={handleSetupPinPress}
        onBackspace={() => setPinCode((p) => p.slice(0, -1))}
        onClose={() => {
          setShowSetupModal(false);
          setPinCode("");
          setTempConfirmPin("");
        }}
      />

      {/* PIN Verification Modal */}
      <PinModal
        visible={showVerifyModal}
        title="Verify PIN Code"
        description="Enter your current 4-digit PIN to disable security lock"
        pinLength={pinCode.length}
        error={pinError}
        onDigitPress={handleVerifyPinPress}
        onBackspace={() => setPinCode((p) => p.slice(0, -1))}
        onClose={() => {
          setShowVerifyModal(false);
          setPinCode("");
        }}
      />
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
  return (
    <SettingsBottomSheet
      visible={visible}
      onClose={onClose}
      title="Security Settings"
      accessibilityLabel="Close security settings"
      backgroundColor="#F9FAFB"
      bounces={false}
    >
      <SecuritySettings />
    </SettingsBottomSheet>
  );
};

export default SecuritySettings;
