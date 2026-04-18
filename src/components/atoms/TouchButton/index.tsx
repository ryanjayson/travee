import React from "react";
import { TouchableOpacity, Text } from "react-native";

type TouchButtonProps = {
  buttonText: string;
  disabled?: boolean;
  className?: string;
  onPress: () => void;
};

const TouchButton: React.FC<TouchButtonProps> = ({
  buttonText,
  className,
  disabled,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      className={`p-4 items-center rounded-[30px] bg-[#0C4C8A] ${disabled ? "opacity-50" : ""} ${className ?? ""}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled }}
    >
      <Text className="text-white font-semibold text-base">{buttonText}</Text>
    </TouchableOpacity>
  );
};

export default TouchButton;
