import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';

export interface AnimatedPressableProps extends TouchableOpacityProps {
  children: React.ReactNode;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  scaleTo = 0.96,
  style,
  className,
  onPress,
  onPressIn,
  onPressOut,
  accessibilityRole = 'button',
  accessibilityLabel,
  activeOpacity = 0.85,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: GestureResponderEvent) => {
    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
    onPressOut?.(e);
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      className={className}
      {...props}
    >
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedPressable;
