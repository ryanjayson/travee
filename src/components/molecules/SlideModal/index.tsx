import React, { useRef, useEffect, PropsWithChildren } from "react";
import {
  Modal,
  Animated,
  View,
  Text,
  Button,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

interface SlideModalProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
}

export default function SlideModal({
  visible,
  onClose,
  children,
}: SlideModalProps) {
  const slideAnim = useRef(new Animated.Value(width)).current; // start off-screen (right)

  useEffect(() => {
    if (visible) {
      // slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      // slide out
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateX: slideAnim }] },
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
    backgroundColor: "rgba(0,0,0,0.4)", // semi-transparent backdrop
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
});
