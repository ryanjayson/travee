import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

const PIN_ENABLED_KEY = "security_pin_enabled";
const BIOMETRICS_ENABLED_KEY = "security_biometrics_enabled";
const USER_PIN_KEY = "security_user_pin";

/** Checks if the user has enabled PIN lock protection. */
export const isPinEnabled = async (): Promise<boolean> => {
  const val = await SecureStore.getItemAsync(PIN_ENABLED_KEY);
  return val === "true";
};

/** Checks if the user has enabled Biometric (Fingerprint/Face ID) lock protection. */
export const isBiometricsEnabled = async (): Promise<boolean> => {
  const val = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
  return val === "true";
};

/** Enables or disables the PIN lock setting. */
export const setPinEnabled = async (enabled: boolean): Promise<void> => {
  await SecureStore.setItemAsync(PIN_ENABLED_KEY, enabled ? "true" : "false");
};

/** Enables or disables the biometric lock setting. */
export const setBiometricsEnabled = async (enabled: boolean): Promise<void> => {
  await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, enabled ? "true" : "false");
};

/** Gets the securely stored user PIN. */
export const getPin = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(USER_PIN_KEY);
};

/** Saves the user's 4-digit PIN securely. */
export const setPin = async (pin: string): Promise<void> => {
  await SecureStore.setItemAsync(USER_PIN_KEY, pin);
};

/** Completely clears all security settings (useful for app reset or disabling lock). */
export const clearPin = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(USER_PIN_KEY);
  await SecureStore.deleteItemAsync(PIN_ENABLED_KEY);
  await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
};

/** Helper to check device biometric capabilities and enrollment. */
export const isBiometricsSupported = async (): Promise<{ hasHardware: boolean; isEnrolled: boolean }> => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return { hasHardware, isEnrolled };
};

/** Launches the native biometric prompt (Fingerprint / Face ID). */
export const authenticateWithBiometrics = async (promptMessage = "Unlock Travelled"): Promise<boolean> => {
  const { hasHardware, isEnrolled } = await isBiometricsSupported();
  if (!hasHardware || !isEnrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: "Use PIN",
    disableDeviceFallback: true, // We handle passcode entry manually using our custom UI
  });
  return result.success;
};
