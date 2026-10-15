import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Formik } from "formik";
import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  PanResponder,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import * as Yup from "yup";
import { useSaveChecklistGroupMutation } from "../../../hooks/useChecklist";
import TouchButton from "../../../../../components/atoms/TouchButton";

interface ChecklistGroupModalProps {
  visible: boolean;
  onClose: () => void;
  travelId: string;
}

const { height: screenHeight } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GroupSchema = Yup.object().shape({
  title: Yup.string().required("Group title is required"),
});

const ChecklistGroupModal = ({
  visible,
  onClose,
  travelId,
}: ChecklistGroupModalProps) => {
  const saveGroupMutation = useSaveChecklistGroupMutation();
  const isSaving = saveGroupMutation.isPending;
  const { colors } = useTheme();

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);

  const isKeyboardVisibleRef = useRef(false);
  useEffect(() => {
    isKeyboardVisibleRef.current = isKeyboardVisible;
  }, [isKeyboardVisible]);

  // Keyboard height and visibility tracking
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Slide up transition on opening
  useEffect(() => {
    if (visible) {
      isAtTop.current = true;
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Smooth slide-down dismiss animation handler
  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onCloseRef.current();
    });
  }, [translateY]);

  // Main sheet responder capturing downward drags anywhere on the modal
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        if (isKeyboardVisibleRef.current) return false;
        const { dx, dy } = gestureState;
        if (isAtTop.current && dy > 8 && Math.abs(dy) > Math.abs(dx)) {
          return true;
        }
        return false;
      },
      onPanResponderGrant: (_, gestureState) => {
        translateY.stopAnimation();
        Keyboard.dismiss();
        dragStartDy.current = gestureState.dy;
      },
      onPanResponderMove: (_, gestureState) => {
        const currentDy = gestureState.dy - dragStartDy.current;
        if (currentDy > 0) {
          translateY.setValue(currentDy);
        } else {
          translateY.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentDy = gestureState.dy - dragStartDy.current;
        if (currentDy > 80 || gestureState.vy > 0.4) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Handle bar pan responder for direct downward drag on top handle
  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        Keyboard.dismiss();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.4) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleFormSubmit = async (
    values: { title: string; description: string },
    { resetForm }: any
  ) => {
    try {
      await saveGroupMutation.mutateAsync({
        travelId,
        title: values.title,
        description: values.description || undefined,
        sortOrder: String(Date.now()),
        userId: "current-user",
        isOffline: true,
      });
      resetForm();
      handleDismiss();
    } catch (error) {
      console.error("Save Checklist Group Error:", error);
    }
  };

  // Interpolate backdrop opacity based on translateY position
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "flex-end" }}
        pointerEvents="box-none"
      >
        {/* Full-screen backdrop overlay to prevent background interaction */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: "rgba(0,0,0,0.8)",
              opacity: backdropOpacity,
            },
          ]}
          pointerEvents="auto"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleDismiss}
            style={StyleSheet.absoluteFillObject}
            accessibilityRole="button"
            accessibilityLabel="Dismiss checklist group modal"
          />
        </Animated.View>

        {/* Bottom Sheet Container */}
        <Animated.View
          {...sheetPanResponder.panHandlers}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation?.()}
          pointerEvents="auto"
          style={[
            {
              transform: [{ translateY }],
              marginBottom: Platform.OS === "android" ? keyboardHeight : 0,
              maxHeight: isKeyboardVisible
                ? screenHeight - keyboardHeight
                : screenHeight * 0.82,
              height: isKeyboardVisible
                ? screenHeight - keyboardHeight
                : 480,
              paddingTop: isKeyboardVisible ? 42 : 0,
            },
          ]}
          className="w-full bg-white rounded-t-[30px] overflow-hidden shadow-2xl"
        >
          <StatusBar style="dark" />

          {/* Top Drag Handle Bar */}
          {!isKeyboardVisible && (
            <View
              {...dragPanResponder.panHandlers}
              className="w-full items-center pt-3 pb-2 bg-white"
            >
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>
          )}

          {/* Header Row */}
          <View
            className={
              "flex-row justify-between items-center px-5 " +
              "border-b border-gray-200 bg-white"
            }
          >
            {/* Close button beside the title on the left side */}
            <View className="flex-row w-full justify-between items-center gap-2 py-5 pt-2">

              <Text className="text-2xl text-gray-700 font-medium">
                Custom Checklist
              </Text>
              <TouchableOpacity
                onPress={handleDismiss}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Icon name="close" size={26} color="#999" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Form Body */}
          <Formik
            initialValues={{ title: "", description: "" }}
            validationSchema={GroupSchema}
            onSubmit={handleFormSubmit}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View className="flex-1">
                <ScrollView
                  className="flex-1 p-[15px] bg-gray-100"
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onScroll={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    isAtTop.current = y <= 0;
                  }}
                  scrollEventThrottle={16}
                >
                  <View className="mb-5">
                    <Text className="text-xs font-semibold tracking-wider uppercase">
                      Title <Text className="text-red-500 text-lg">*</Text>
                    </Text>
                    <TextInput
                      mode="outlined"
                      className="h-7xl"
                      placeholder="e.g. Packing list"
                      value={values.title}
                      onChangeText={handleChange("title")}
                      onBlur={handleBlur("title")}
                      error={touched.title && Boolean(errors.title)}
                      outlineColor="#E0E0E0"
                      activeOutlineColor="#263F69"
                      theme={{ colors: { onSurfaceVariant: "#888" } }}
                      outlineStyle={{
                        borderWidth: 1,
                        backgroundColor: "#FFFFFF",
                        borderRadius: 16,
                      }}
                      style={{ marginTop: 6 }}
                      contentStyle={{ backgroundColor: "transparent" }}
                    />
                    {touched.title && errors.title && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">
                        {errors.title}
                      </Text>
                    )}
                  </View>

                  <View className="">
                    <Text className="text-xs font-semibold tracking-wider uppercase">
                      Description
                    </Text>
                    <TextInput
                      mode="outlined"
                      placeholder="e.g. Items needed before departure"
                      value={values.description}
                      onChangeText={handleChange("description")}
                      onBlur={handleBlur("description")}
                      multiline
                      numberOfLines={4}
                      outlineColor="#E0E0E0"
                      activeOutlineColor="#263F69"
                      theme={{ colors: { onSurfaceVariant: "#888" } }}
                      outlineStyle={{
                        borderWidth: 1,
                        backgroundColor: "#FFFFFF",
                        borderRadius: 16,
                      }}
                      style={{ marginTop: 6, height: 120 }}
                      textAlignVertical="top"
                      contentStyle={{ backgroundColor: "transparent" }}
                    />
                  </View>
                </ScrollView>

                {/* Save Button (Fixed Bottom) */}
                <View className="px-5 pb-8 bg-gray-100">
                  <TouchButton
                    buttonText={isSaving ? "Saving..." : "Create Checklist"}
                    onPress={() => handleSubmit()}
                    disabled={!values.title.trim() || isSaving}
                    className="h-7xl p-6"
                  />
                </View>
              </View>
            )}
          </Formik>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ChecklistGroupModal;
