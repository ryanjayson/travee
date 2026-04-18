Button & Interaction Rules
When generating or refactoring buttons, the AI must adhere to the following hierarchy:

1. Primary Component Choice
Use TouchableOpacity for all custom-styled buttons, cards, or list items that require unique layouts.

Use React Native Paper's Button for standard actions (Submit, Cancel, Save) where consistent MD3 (Material Design 3) styling is preferred.

2. Styling & Theming
Never hardcode colors. Always consume the theme from React Native Paper's useTheme hook.

Structure: Wrap button content in a View if complex layouts (icons + multiple text lines) are needed.

3. Implementation Template
When creating a button, use this pattern:

import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

// Rule: Use TouchableOpacity for custom layouts
const CustomActionButton = ({ onPress, label }) => {
  const { colors } = useTheme(); // Rule: Always use paper theme colors

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.button, { backgroundColor: colors.primary }]}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.onPrimary }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
  },
});

4. Accessibility
Every TouchableOpacity must include accessibilityRole="button".

Provide a clear accessibilityLabel if the button contains only an icon.