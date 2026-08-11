import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export interface ActivityCardDisplayFieldProps {
  label: string;
  value?: string | number | null;
  icon?: string;
  onPress?: () => void;
  isLink?: boolean;
  isCopy?: boolean;
  isCopyable?: boolean;
  isPhone?: boolean;
  isContactNumber?: boolean;
  isCall?: boolean;
  isEmail?: boolean;
  onCopy?: () => void;
  showBorder?: boolean;
  borderColor?: string;
  iconLinkColor?: string;
  iconActionColor?: string;
  numberOfLines?: number;
}

export const ActivityCardDisplayField: React.FC<ActivityCardDisplayFieldProps> = ({
  label,
  value,
  icon,
  onPress,
  isLink,
  isCopy,
  isCopyable,
  isPhone,
  isContactNumber,
  isCall,
  isEmail,
  onCopy,
  showBorder,
  borderColor,
  iconLinkColor,
  iconActionColor,
  numberOfLines,
}) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;

  const strValue = String(value).trim();
  const actionColor = iconActionColor || iconLinkColor || "#FFFFFF";

  const handleCopyAction = () => {
    if (onCopy) {
      onCopy();
    } else {
      Clipboard.setString(strValue);
      if (Platform.OS === "android") {
        ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
      } else {
        Alert.alert("Copied", `${label} copied to clipboard`);
      }
    }
  };

  const handleLinkAction = () => {
    const formattedUrl = strValue.startsWith("http://") || strValue.startsWith("https://")
      ? strValue
      : `https://${strValue}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  };

  const handlePhoneAction = () => {
    Linking.openURL(`tel:${strValue}`).catch((err) => console.error("Failed to make call", err));
  };

  const handleEmailAction = () => {
    Linking.openURL(`mailto:${strValue}`).catch((err) => console.error("Failed to send email", err));
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (isCopy || isCopyable || onCopy) {
      handleCopyAction();
    } else if (isLink) {
      handleLinkAction();
    } else if (isPhone || isContactNumber || isCall) {
      handlePhoneAction();
    } else if (isEmail) {
      handleEmailAction();
    }
  };

  // Icon to render beside text value
  let actionIconName: keyof typeof Icon.glyphMap | null = null;
  if (isCopy || isCopyable || onCopy) {
    actionIconName = "content-copy";
  } else if (isLink) {
    actionIconName = "open-in-new";
  } else if (isPhone || isContactNumber || isCall) {
    actionIconName = "phone";
  } else if (isEmail) {
    actionIconName = "email";
  }

  const isInteractive = Boolean(
    onPress ||
    isCopy ||
    isCopyable ||
    onCopy ||
    isLink ||
    isPhone ||
    isContactNumber ||
    isCall ||
    isEmail
  );

  const borderClass = showBorder
    ? borderColor
      ? `border-b ${borderColor}`
      : "border-b border-white/20"
    : "";

  const isUnderlined = Boolean(isLink || isPhone || isContactNumber || isCall || isEmail);

  return (
    <View className="flex-row items-start mb-3 gap-6">
      {icon ? (
        <View className="border p-3 rounded-full border-white/30" style={{ alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon as any} size={24} color="#fffefe" />
        </View>
      ) : null}
      <View className={`flex-1 ${borderClass} ${showBorder ? "pb-3" : ""}`}>
        <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">
          {label}
        </Text>
        {isInteractive ? (
          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.7}
            accessibilityRole="button"
            className="flex-row items-center gap-1.5 pr-xl"
          >
            <Text
              className="text-lg font-medium"
              numberOfLines={isLink ? 1 : numberOfLines}
              style={{
                color: "#ffffff",
                textDecorationLine: isUnderlined ? "underline" : "none",
                opacity: 0.8,
              }}
            >
              {value}
            </Text>
            {actionIconName && (
              <Icon
                name={actionIconName}
                size={16}
                color={actionColor}
                style={{ opacity: 0.6 }}
              />
            )}
          </TouchableOpacity>
        ) : (
          <Text
            className="text-lg font-semibold text-white opacity-60"
            numberOfLines={numberOfLines}
          >
            {value}
          </Text>
        )}
      </View>
    </View>
  );
};
