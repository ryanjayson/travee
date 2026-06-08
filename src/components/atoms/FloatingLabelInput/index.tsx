import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Animated, StyleProp, TextStyle, KeyboardTypeOptions } from "react-native";
import { TextInput } from "react-native-paper";

export interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onBlur?: (e: any) => void;
  onFocus?: () => void;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  placeholder?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  contentStyle?: StyleProp<TextStyle>;
  multiline?: boolean;
  numberOfLines?: number;
}

export default function FloatingLabelInput({
  label,
  value,
  onChangeText,
  onBlur,
  onFocus,
  keyboardType = "default",
  editable = true,
  placeholder,
  right,
  onPress,
  contentStyle,
  multiline,
  numberOfLines,
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [labelWidth, setLabelWidth] = useState(0);
  const anim = useRef(new Animated.Value(value !== "" ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: (isFocused || value !== "") ? 1 : 0,
      damping: 28,
      stiffness: 450,
      useNativeDriver: true,
    }).start();
  }, [isFocused, value]);

  const animatedLabelStyle = {
    position: "absolute" as const,
    left: 16,
    color: '#98A2B3',
    top: 20,
    fontSize: 16,
    zIndex: 10,
    fontWeight: "400" as const,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -labelWidth * 0.125], // Compensates center-scaling shift: (1 - 0.75) * (width / 2) = 0.125 * width
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.75],
        }),
      },
    ] as any,
  };

  return (
    <View className="relative flex-1">
      <Animated.Text
        style={animatedLabelStyle}
        pointerEvents="none"
        onLayout={(e) => {
          setLabelWidth(e.nativeEvent.layout.width);
        }}
      >
        {label}
      </Animated.Text>
      <TextInput
        mode="outlined"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        outlineColor="#E0E0E0"
        activeOutlineColor="#263F69"
        theme={{ colors: { onSurfaceVariant: '#98A2B3' } }}
        outlineStyle={{ borderWidth: 1, backgroundColor: "#FFF", borderRadius: 16 }}
        style={multiline ? undefined : { height: 64 }}
        contentStyle={[{ backgroundColor: "transparent", paddingTop: multiline ? 8 : 16 }, contentStyle]}
        right={right}
      />
      {onPress && (
        <TouchableOpacity
          onPress={onPress}
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: right ? 50 : 0, zIndex: 20 }}
          accessibilityRole="button"
          accessibilityLabel={`Open selector for ${label}`}
        />
      )}
    </View>
  );
}
