import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TERMS_AND_CONDITIONS_TEXT = `Terms and Conditions

Last Updated: July 2026

Welcome to Travee! By accessing or using our mobile application, you agree to comply with and be bound by these Terms and Conditions.

1. Account Registration
To use certain features of the application, you may create a profile. You are responsible for maintaining the confidentiality of your credentials and data.

2. Use of Services
You agree to use Travee for personal, non-commercial travel planning purposes only. You must not use the application for any illegal or unauthorized activities.

3. Intellectual Property
All content, features, designs, and functionality of Travee are the exclusive property of the application developers and protected by copyright, trademark, and other laws.

4. Limitation of Liability
Travee is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages resulting from your use of the application.

5. Changes to Terms
We reserve the right to modify these Terms and Conditions at any time. Your continued use of the application following updates constitutes your acceptance of the new terms.`;

export interface TermsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsBottomSheet: React.FC<TermsBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height;
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, screenHeight]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <Animated.View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: backdropOpacity,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />

        <Animated.View
          className="bg-white rounded-t-[30px] shadow-lg overflow-hidden"
          style={{
            transform: [{ translateY }],
            maxHeight: screenHeight * 0.85,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
        >
          {/* Drag Handle Area */}
          <View
            {...dragPanResponder.panHandlers}
            className="w-full items-center pt-3 pb-2 bg-white rounded-t-[30px]"
          >
            <View className="w-10 h-1 bg-gray-200 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-5 pt-2 pb-4 bg-white border-b border-gray-200">
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleDismiss}
                accessibilityRole="button"
                accessibilityLabel="Close terms and conditions"
              >
                <Ionicons name="chevron-back" size={26} color="#999" />
              </TouchableOpacity>
              <Text className="text-2xl text-gray-700 font-medium">
                Terms and Conditions
              </Text>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            className="p-6"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
          >
            <Text className="text-base leading-6 text-tertiary font-normal whitespace-pre-wrap">
              {TERMS_AND_CONDITIONS_TEXT}
            </Text>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default TermsBottomSheet;
