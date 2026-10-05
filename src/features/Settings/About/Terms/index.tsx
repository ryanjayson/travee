import React from "react";
import { Text } from "react-native";
import { SettingsBottomSheet } from "../../components/SettingsBottomSheet";

export const TERMS_AND_CONDITIONS_TEXT = `Terms and Conditions

Last Updated: July 2026

Welcome to Travee! By accessing or using our mobile application, you agree to comply with and be bound by these Terms and Conditions.

1. Account Registration
To use certain features of the application, you may create a profile. You are responsible for maintaining the confidentiality of your credentials and data.

2. Use of Services
You agree to use Travee for personal, non-commercial travel planning purposes only. You must not use the application for any illegal or unauthorized activities.

3. Intellectual Property
All content, features, designs, and functionality of Travee are the exclusive property of the application developers and protected by copyright, trademark, and other laws.

4. Limitation of Liability
Travee is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages resulting from your use of the application.

5. Changes to Terms
We reserve the right to modify these Terms and Conditions at any time. Your continued use of the application following updates constitutes your acceptance of the new terms.`;

export interface TermsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsBottomSheet: React.FC<TermsBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  return (
    <SettingsBottomSheet
      visible={visible}
      onClose={onClose}
      title="Terms and Conditions"
      accessibilityLabel="Close terms and conditions"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text className="text-base leading-6 text-tertiary font-normal whitespace-pre-wrap">
        {TERMS_AND_CONDITIONS_TEXT}
      </Text>
    </SettingsBottomSheet>
  );
};

export default TermsBottomSheet;
