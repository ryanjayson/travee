import React, { useRef, useEffect, PropsWithChildren } from "react";
import {
  Modal,
  Animated,
  View,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface SlideModalProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  direction?: "right" | "bottom";
  height?: number | `${number}%` | "auto";
}

export default function SlideModal({
  visible,
  onClose,
  children,
  direction = "right",
  height = "100%",
}: SlideModalProps) {
  const isRight = direction === "right";
  const initialValue = isRight ? screenWidth : screenHeight;
  const slideAnim = useRef(new Animated.Value(initialValue)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: initialValue,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialValue]);

  const transformStyle = isRight
    ? { transform: [{ translateX: slideAnim }] }
    : { transform: [{ translateY: slideAnim }] };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className={`flex-1 bg-black/40 ${!isRight ? "justify-end" : ""}`}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0" />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            { height: height },
            transformStyle,
          ]}
          className={`bg-white overflow-hidden ${
            isRight
              ? "flex-1"
              : "w-full rounded-t-[30px] pt-2.5 shadow-xl elevation-20"
          }`}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
