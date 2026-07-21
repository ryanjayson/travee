import React, { useRef, useCallback } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export type AnimationType = 'up' | 'down' | 'left' | 'right' | 'fade' | 'zoom';

export interface FadeInViewProps {
  children: React.ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  type = 'up',
  delay = 0,
  duration = 400,
  style,
  className,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }).start();
    }, [anim, delay, duration])
  );

  const opacity = anim;

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: type === 'up' ? [20, 0] : type === 'down' ? [-20, 0] : [0, 0],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: type === 'left' ? [20, 0] : type === 'right' ? [-20, 0] : [0, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: type === 'zoom' ? [0.92, 1] : [1, 1],
  });

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
        style,
      ]}
      className={className}
    >
      {children}
    </Animated.View>
  );
};

export default FadeInView;
