import React from "react";
import { Text } from "react-native";
import { SettingsBottomSheet } from "../../components/SettingsBottomSheet";

export const PRIVACY_POLICY_TEXT = `Privacy Policy

Last Updated: July 2026

Your privacy is important to us. This Privacy Policy describes how we collect, use, process, and disclose your information when you use Travee.

1. Information We Collect
We collect information you provide directly to us, such as your nickname, travel preferences, and travel plans. We store all database information locally on your device.

2. How We Use Information
We use your information to personalize your onboarding flow, manage your travel itinerary, forecast weather, and facilitate offline access to your travel plans.

3. Data Storage and Security
All your personal data, trips, and settings are stored locally on your device. We do not transmit your database to external servers unless explicitly backed up or shared by you.

4. Contact Us
If you have any questions or feedback about this Privacy Policy, please contact us at support@travee.example.com.`;

export interface PrivacyBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyBottomSheet: React.FC<PrivacyBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  return (
    <SettingsBottomSheet
      visible={visible}
      onClose={onClose}
      title="Privacy Policy"
      accessibilityLabel="Close privacy policy"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text className="text-base leading-6 text-tertiary font-normal whitespace-pre-wrap">
        {PRIVACY_POLICY_TEXT}
      </Text>
    </SettingsBottomSheet>
  );
};

export default PrivacyBottomSheet;
