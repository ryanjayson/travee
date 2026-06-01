import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Formik } from "formik";
import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import * as Yup from "yup";
import { useSaveChecklistGroupMutation } from "../../../hooks/useChecklist";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";

interface ChecklistGroupModalProps {
  visible: boolean;
  onClose: () => void;
  travelId: string;
}

const { height: screenHeight } = Dimensions.get("window");

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
  const { keyboardVisible } = useKeyboardVisible();
  const [modalHeight] = useState(screenHeight * 0.55);

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);

  // Slide up transition on opening
  useEffect(() => {
    if (visible) {
      isAtTop.current = true; // Reset scroll position tracker
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Main sheet responder to capture downward drags only when at top scroll limit
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (keyboardVisible) return false;
        const { dy } = gestureState;
        // If we are at the top and swipe down
        if (isAtTop.current && dy > 8) {
          return true;
        }
        return false;
      },
      onPanResponderGrant: (evt, gestureState) => {
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
        if (currentDy > 120 || gestureState.vy > 0.5) {
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
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Handle bar pan responder
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
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
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

  const handleCancel = () => {
    Keyboard.dismiss();
    // Smoothly slide down first, then dismiss
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleFormSubmit = async (values: { title: string; description: string }, { resetForm }: any) => {
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
      handleCancel();
    } catch (error) {
      console.error("Save Checklist Group Error:", error);
    }
  };

  // Interpolate backdrop opacity based on translateY position for smooth fading
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Animated.View
          className="flex-1 justify-end"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: backdropOpacity,
          }}
        >
          <Animated.View
            {...sheetPanResponder.panHandlers}
            className="rounded-t-[30px] bg-white overflow-hidden"
            style={[
              { height: keyboardVisible ? "100%" : modalHeight },
              {
                paddingTop: keyboardVisible ? 24 : 0,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 24,
                transform: [{ translateY }],
              },
            ]}
          >
            <StatusBar style="dark" />

            {/* Drag Handle Area */}
            {!keyboardVisible && (
              <View
                {...dragPanResponder.panHandlers}
                className="w-full items-center py-4 bg-white rounded-t-[30px]"
              >
                <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </View>
            )}

            <View
              {...(!keyboardVisible && dragPanResponder.panHandlers)}
              className="flex-row justify-between items-center px-5 pb-5 border-b border-gray-200"
              style={{ paddingTop: keyboardVisible ? 0 : 4 }}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl text-gray-700 font-medium">
                  New Checklist Group
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancel}>
                <Icon name="clear" size={36} color={"#333"} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Body */}
            <Formik
              initialValues={{ title: "", description: "" }}
              validationSchema={GroupSchema}
              onSubmit={handleFormSubmit}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <ScrollView
                  className="flex-1 p-5"
                  contentContainerStyle={{ paddingBottom: 40 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onScroll={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    isAtTop.current = y <= 0;
                  }}
                  scrollEventThrottle={16}
                >
                  <Text className="text-xs font-semibold tracking-wider uppercase mb-4 text-gray-500">
                    Group Details
                  </Text>

                  <View className="mb-4">
                    <TextInput
                      mode="outlined"
                      label="Group Title"
                      placeholder="e.g. Documents, Clothing, Electronics..."
                      value={values.title}
                      onChangeText={handleChange("title")}
                      onBlur={handleBlur("title")}
                      error={touched.title && Boolean(errors.title)}
                      outlineColor="#E0E0E0"
                      activeOutlineColor={colors.primary}
                      theme={{ colors: { onSurfaceVariant: "#888" } }}
                      outlineStyle={{ borderWidth: 1, borderRadius: 16 }}
                      style={{ height: 60 }}
                      left={<TextInput.Icon icon="folder-outline" />}
                    />
                    {touched.title && errors.title && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">{errors.title}</Text>
                    )}
                  </View>

                  <View className="mb-6">
                    <TextInput
                      mode="outlined"
                      label="Description (Optional)"
                      placeholder="e.g. Items needed before departure"
                      value={values.description}
                      onChangeText={handleChange("description")}
                      onBlur={handleBlur("description")}
                      multiline
                      numberOfLines={3}
                      outlineColor="#E0E0E0"
                      activeOutlineColor={colors.primary}
                      theme={{ colors: { onSurfaceVariant: "#888" } }}
                      outlineStyle={{ borderWidth: 1, borderRadius: 16 }}
                      style={{ minHeight: 90 }}
                      textAlignVertical="top"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => handleSubmit()}
                    disabled={!values.title.trim() || isSaving}
                    style={{
                      backgroundColor: colors.primary,
                      opacity: values.title.trim() && !isSaving ? 1 : 0.6,
                    }}
                    className="flex-row items-center justify-center p-4 rounded-[16px] shadow-sm mb-6"
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    <View className="flex-row items-center gap-2">
                      {isSaving ? (
                        <Animated.View style={{ transform: [{ rotate: "0deg" }] }}>
                          <Icon name="sync" size={20} color={colors.onPrimary} />
                        </Animated.View>
                      ) : (
                        <Icon name="check" size={20} color={colors.onPrimary} />
                      )}
                      <Text className="text-white text-base font-semibold" style={{ color: colors.onPrimary }}>
                        {isSaving ? "Saving..." : "Create Group"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </Formik>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ChecklistGroupModal;
