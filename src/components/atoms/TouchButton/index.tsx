import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";

type TouchButtonProps = {
  buttonText: string;
  disabled?: boolean;
  className?: string;
  icon?: string | any;
  onPress: () => void;
};

const TouchButton: React.FC<TouchButtonProps> = ({
  buttonText,
  className,
  icon,
  disabled,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      className={`p-4 items-center justify-center flex-row rounded-[30px] bg-primary ${disabled ? "opacity-70" : ""} ${className ?? ""}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled }}
    >
      {icon && <Icon name={icon} size={24} color="white" />}
      <Text className="text-white font-semibold text-lg tracking-wide">{buttonText}</Text>
    </TouchableOpacity>
  );
};

export default TouchButton;
