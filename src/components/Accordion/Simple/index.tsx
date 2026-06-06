import React, { useState } from "react";
import { View, Text, TouchableOpacity, LayoutAnimation, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export interface SimpleAccordionProps {
  title: string;
  children: React.ReactNode;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  defaultExpanded?: boolean;
  disabled?: boolean;
}

export const SimpleAccordion = ({
  title,
  children,
  expanded: controlledExpanded,
  onToggle,
  defaultExpanded = false,
  disabled = false,
}: SimpleAccordionProps) => {
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : localExpanded;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (onToggle) {
      onToggle(!isExpanded);
    } else {
      setLocalExpanded(!isExpanded);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
        className="flex-row justify-between items-center py-4"
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={`${title} section`}
      >
        <View className="flex-row gap-2 justify-start items-center">
          <Icon name="info-outline" size={20} color="#000" />
          <Text className="text-md font-bold tracking-wider uppercase">
            {title}
          </Text>
        </View>
               
        {!disabled && (
          <Icon name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={22} color="#263F69" />
        )}
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    overflow: "hidden", // Crucial for layout clipping during animations
  },
  content: {
    paddingTop: 16,
  },
});

export default SimpleAccordion;
