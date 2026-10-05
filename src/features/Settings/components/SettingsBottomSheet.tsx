import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface SettingsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  backgroundColor?: string;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bounces?: boolean;
  keyboardAvoiding?: boolean;
  keyboardVisible?: boolean;
  accessibilityLabel?: string;
  maxHeightRatio?: number;
}

export const SettingsBottomSheet: React.FC<SettingsBottomSheetProps> = ({
  visible,
  onClose,
  title,
  headerRight,
  children,
  backgroundColor = "#FFFFFF",
  scrollable = true,
  contentContainerStyle,
  bounces = true,
  keyboardAvoiding = false,
  keyboardVisible = false,
  accessibilityLabel,
  maxHeightRatio = 0.85,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Handle slide-up animation on open
  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Android hardware back button support
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleDismiss();
        return true;
      }
    );
    return () => subscription.remove();
  }, [visible]);

  // Drag down pan responder
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
          handleDismiss();
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
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const sheetHeightStyle = keyboardVisible
    ? { height: "100%" as const }
    : { maxHeight: SCREEN_HEIGHT * maxHeightRatio };

  const sheetPadding = {
    paddingTop: keyboardVisible ? insets.top + 10 : 0,
    paddingBottom: keyboardVisible ? 0 : Math.max(insets.bottom, 20),
  };

  const sheetContent = (
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
        accessibilityRole="button"
        accessibilityLabel="Dismiss sheet backdrop"
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
      />

      <Animated.View
        className="rounded-t-[30px] shadow-lg overflow-hidden"
        style={[
          {
            backgroundColor,
            transform: [{ translateY }],
          },
          sheetHeightStyle,
          sheetPadding,
        ]}
      >
        {/* Drag Handle Bar */}
        {!keyboardVisible && (
          <View
            {...dragPanResponder.panHandlers}
            className="w-full items-center pt-3 pb-2 rounded-t-[30px]"
            style={{ backgroundColor }}
          >
            <View className="w-10 h-1 bg-gray-200 rounded-full" />
          </View>
        )}

        {/* Header Bar */}
        <View
          {...(!keyboardVisible ? dragPanResponder.panHandlers : {})}
          className="flex-row justify-between items-center px-5 pt-2 pb-4 border-b border-gray-200"
          style={{ backgroundColor }}
        >
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <TouchableOpacity
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel || `Close ${title}`}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={26} color="#999" />
            </TouchableOpacity>
            <Text
              className="text-2xl text-gray-700 font-medium"
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
          {headerRight && <View>{headerRight}</View>}
        </View>

        {/* Content Body */}
        {scrollable ? (
          <ScrollView
            className="p-4"
            contentContainerStyle={contentContainerStyle ?? { paddingBottom: 30 }}
            showsVerticalScrollIndicator={true}
            bounces={bounces}
          >
            {children}
          </ScrollView>
        ) : (
          <View className="flex-1 p-4">{children}</View>
        )}
      </Animated.View>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : keyboardVisible
                ? "padding"
                : undefined
          }
          style={{ flex: 1 }}
        >
          {sheetContent}
        </KeyboardAvoidingView>
      ) : (
        sheetContent
      )}
    </Modal>
  );
};

export default SettingsBottomSheet;
