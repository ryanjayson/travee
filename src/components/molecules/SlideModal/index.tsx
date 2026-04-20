import React, { useRef, useEffect, PropsWithChildren } from "react";
import {
  Modal,
  Animated,
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface SlideModalProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  direction?: "right" | "bottom";
  height?: string | number;
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
        duration: 300,
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
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, !isRight && styles.bottomBackdrop]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        
        <Animated.View
          style={[
            styles.modalContainer,
            isRight ? styles.rightContainer : styles.bottomContainer,
            { height: height },
            transformStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomBackdrop: {
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  rightContainer: {
    flex: 1,
  },
  bottomContainer: {
    width: "100%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    // Add shadow for bottom sheet look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
});
