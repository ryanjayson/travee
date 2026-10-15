import React, { useState, useRef, useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
  StyleSheet,
} from "react-native";
import EditSection from "./index";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { ItinerarySection } from "../../../../types/TravelDto";
import { useDeleteSectionMutation } from "../../../../hooks/useSection";
import { useConfirm } from "../../../../../../context/ConfirmContext";
import { useTheme } from "react-native-paper";

interface SectionModalProps {
  visible: boolean;
  onClose: () => void;
  itinerarySection: ItinerarySection | null;
  travelId?: string;
  onSaveSuccess?: (section: ItinerarySection) => void;
}

const { height: screenHeight } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Modal for editing or creating a section using bottomsheet UX
const SectionModal = ({
  visible,
  onClose,
  itinerarySection,
  travelId,
  onSaveSuccess,
}: SectionModalProps) => {
  const { colors } = useTheme();
  const [currentSection, setCurrentSection] =
    useState<ItinerarySection | null>(itinerarySection);
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);

  const isKeyboardVisibleRef = useRef(false);
  useEffect(() => {
    isKeyboardVisibleRef.current = isKeyboardVisible;
  }, [isKeyboardVisible]);

  const { mutate: deleteSectionMutation, isPending: isDeleting } =
    useDeleteSectionMutation();
  const { confirm } = useConfirm();

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
      setCurrentSection(itinerarySection);
      setIsSaving(false);
      isAtTop.current = true;
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, itinerarySection, translateY]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Smooth slide-down dismiss animation handler
  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    setIsSaving(false);
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

  const handleDeleteSection = async () => {
    if (currentSection?.travelId && currentSection?.id) {
      const isConfirmed = await confirm({
        title: "Delete Section",
        message:
          "Are you sure you want to delete this section? All associated activities will " +
          "also be permanently deleted. This action is irreversible.",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger",
      });

      if (isConfirmed) {
        deleteSectionMutation({
          sectionId: currentSection.id!,
        });
        handleDismiss();
      }
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
            accessibilityLabel="Dismiss section modal"
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
                : 550,
              paddingTop: isKeyboardVisible
                ? 42
                : 0,
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
              "flex-row justify-between items-center px-5 pb-4 " +
              "border-b border-gray-200 bg-white"
            }
          >
            {/* Close button beside the title on the left side */}
            <View className="flex-row items-center justify-between w-full gap-2px-2 py-2">

              <Text className="text-2xl text-gray-700 font-medium">
                {currentSection?.id && currentSection?.id !== ""
                  ? "Edit Section"
                  : "Add Section"}
              </Text>
              {/* Actions on the right side */}
              <View className="flex-row items-center gap-6">
                {currentSection?.id && (
                  <TouchableOpacity
                    onPress={handleDeleteSection}
                    disabled={isDeleting || isSaving}
                    accessibilityRole="button"
                    accessibilityLabel="Delete section"
                    className="flex flex-row items-center gap-1"
                  >
                    <Icon name="delete-outline" size={24} color="#c93030" />
                    <Text className="text-sm text-red-700 font-medium">
                      Delete
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleDismiss}
                  disabled={isSaving || isDeleting}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                >
                  <Icon name="close" size={26} color="#999" />
                </TouchableOpacity>
              </View>
            </View>


          </View>

          {/* Form Content */}
          <View className="flex-1">
            <EditSection
              itinerarySection={currentSection}
              travelId={travelId}
              onClose={handleDismiss}
              onSaveSuccess={onSaveSuccess}
              onScroll={(e) => {
                const y = e.nativeEvent.contentOffset.y;
                isAtTop.current = y <= 0;
              }}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SectionModal;
