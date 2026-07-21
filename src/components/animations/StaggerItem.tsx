import React, { useRef, useCallback } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export interface StaggerItemProps {
  children: React.ReactNode;
  index: number;
  staggerMs?: number;
  durationMs?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  index,
  staggerMs = 60,
  durationMs = 350,
  style,
  className,
}) => {
  const delay = Math.min(index * staggerMs, 500);
  const anim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: durationMs,
        delay,
        useNativeDriver: true,
      }).start();
    }, [anim, delay, durationMs])
  );

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  return (
    <Animated.View
      style={[
        {
          opacity: anim,
          transform: [{ translateY }],
        },
        style,
      ]}
      className={className}
    >
      {children}
    </Animated.View>
  );
};

export default StaggerItem;
