import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";

type TouchButtonProps = {
  buttonText: string;
  disabled?: boolean;
  customStyle?: ViewStyle;
  onPress: () => void;
};

const TouchButton: React.FC<TouchButtonProps> = ({
  buttonText,
  customStyle,
  disabled,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      style={[
        styles.button,
        customStyle,
        disabled && styles.buttonDisabled, // Apply dimmed style
      ]}
      accessibilityState={{ disabled: disabled }}
    >
      <Text style={styles.text}>{buttonText}</Text>
    </TouchableOpacity>
  );
};

export default TouchButton;

const styles = StyleSheet.create({
  button: {
    padding: 16,
    alignItems: "center",
    borderRadius: 30,
    backgroundColor: "#0C4C8A",
  },
  text: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
