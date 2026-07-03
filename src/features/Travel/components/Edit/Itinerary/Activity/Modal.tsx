import React, { useState, useRef, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text, TouchableOpacity,
  Modal,
  Animated, Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  PanResponder
} from "react-native";
import EditActivity from "../Activity";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useKeyboardVisible } from "../../../../../../hooks/useKeyboardVisible";
import { ItineraryActivity } from "../../../../types/TravelDto";
import * as ImagePicker from "expo-image-picker";
import { parseExtractedText } from "../../../../utils/ocrParser";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConfirm } from "../../../../../../context/ConfirmContext";
import { useTheme } from "react-native-paper";
import { ActivityType } from "../../../../../../types/enums";
import SectionLookupModal from "../../../Lookups/SectionLookupModal";
import ActivityTypeLookupModal from "../../../Lookups/ActivityTypeLookupModal";

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  // onSave: (title: string, description: string) => void;
  itineraryActivity: ItineraryActivity | null;
  itinerarySectionId?: string;
  travelId?: string;
}

const { height: screenHeight } = Dimensions.get("window");

const ActivityModal = ({
  visible,
  onClose,
  itineraryActivity,
  itinerarySectionId,
  travelId,
}: ActivityModalProps) => {
  const [currentActivity, setCurrentActivity] = useState<ItineraryActivity | null>(itineraryActivity);

  useEffect(() => {
    if (visible) {
      setCurrentActivity(itineraryActivity);
      setIsSaving(false);
      setError(null);
      setExtractedData(null);
      setIsOcrPending(false);
    }
  }, [visible, itineraryActivity]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<ItineraryActivity> | null>(null);
  const [isOcrPending, setIsOcrPending] = useState(false);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const childModalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChildModalToggle = (isOpen: boolean) => {
    if (childModalTimeoutRef.current) {
      clearTimeout(childModalTimeoutRef.current);
      childModalTimeoutRef.current = null;
    }

    if (isOpen) {
      setIsChildModalOpen(true);
    } else {
      childModalTimeoutRef.current = setTimeout(() => {
        setIsChildModalOpen(false);
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (childModalTimeoutRef.current) {
        clearTimeout(childModalTimeoutRef.current);
      }
    };
  }, []);

  // Hoisted lookup modal states & handlers
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showPrimaryTypeModal, setShowPrimaryTypeModal] = useState(false);

  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(undefined);
  const [onSelectSectionCallback, setOnSelectSectionCallback] = useState<((id?: string) => void) | null>(null);

  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType | undefined>(undefined);
  const [onSelectActivityTypeCallback, setOnSelectActivityTypeCallback] = useState<((type: ActivityType) => void) | null>(null);

  const handleOpenSectionModal = (sectionsList: any[], currentId?: string, onSelect?: (id?: string) => void) => {
    setSections(sectionsList);
    setSelectedSectionId(currentId);
    setOnSelectSectionCallback(() => onSelect || null);
    setShowSectionModal(true);
  };

  const handleOpenPrimaryTypeModal = (currentType?: ActivityType, onSelect?: (type: ActivityType) => void) => {
    setSelectedActivityType(currentType);
    setOnSelectActivityTypeCallback(() => onSelect || null);
    setShowPrimaryTypeModal(true);
  };

  useEffect(() => {
    const isAnyChildOpen = showSectionModal || showPrimaryTypeModal;
    handleChildModalToggle(isAnyChildOpen);
  }, [showSectionModal, showPrimaryTypeModal]);

  const { confirm } = useConfirm();
  const { colors } = useTheme();
  const { keyboardVisible } = useKeyboardVisible();
  const insets = useSafeAreaInsets();

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
        if (keyboardVisible || isChildModalOpen) return false;
        const { dx, dy } = gestureState;
        // Verify downward swipe and ensure vertical dominance to not block other gestures
        if (isAtTop.current && dy > 8 && Math.abs(dy) > Math.abs(dx)) {
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
      }
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



  const handleTextExtraction = async () => {
    // 1. PRIVACY CONFIRMATION (Explicitly verifying that ML Kit runs 100% on-device offline)
    const isConfirmed = await confirm({
      title: "Secure Local Scan",
      message: "Travee values your privacy. Text extraction from documents, screenshots, and receipts is performed 100% locally and offline on your device using Google ML Kit. We do not upload your personal documents to any external server.\n\nWould you like to select a booking screenshot or receipt to extract details?",
      confirmText: "Select Image",
      cancelText: "Cancel",
      type: "default",
    });

    if (!isConfirmed) return;

    try {
      // 2. Request library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access the camera roll is required to select booking documents.");
        return;
      }

      // 3. Launch Image Picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Enable cropping to isolate relevant text blocks and maximize accuracy
        quality: 0.8,        // Optimize size to improve on-device memory and processing efficiency
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const imageUri = result.assets[0].uri;
      setIsOcrPending(true);

      // 4. Perform offline ML Kit Text Recognition
      let recognizedText = "";
      try {
        const TextRecognition = require("@react-native-ml-kit/text-recognition").default;
        const ocrResult = await TextRecognition.recognize(imageUri);
        recognizedText = ocrResult.text || "";
      } catch (ocrError) {
        console.error("Local ML Kit OCR failed:", ocrError);
        throw new Error("Local on-device OCR native modules not fully linked in the active application binary. Please compile with native ML Kit libraries using 'npx expo run:android' to enable text extraction.");
      }

      setIsOcrPending(false);

      if (!recognizedText.trim()) {
        alert("No clear text could be extracted from this image. Please ensure the booking screenshot is sharp and legible.");
        return;
      }

      // 5. Run local heuristic parsing to auto-populate fields
      const parsedFields = parseExtractedText(recognizedText);

      // 6. Populate form fields dynamically
      setExtractedData(parsedFields);
      alert("Successfully scanned booking receipt! Available details have been populated.");
    } catch (err: any) {
      setIsOcrPending(false);
      console.error("OCR Scan failed:", err);
      alert(err.message || "Failed to scan document. Please try again.");
    }
  };

  // const panResponder = PanResponder.create({
  //   onStartShouldSetPanResponder: () => true,
  //   onMoveShouldSetPanResponder: () => true,
  //   onPanResponderGrant: () => {
  //     pan.setOffset({
  //       x: (pan.x as any)._value,
  //       y: (pan.y as any)._value,
  //     });
  //   },
  //   onPanResponderMove: (evt, gestureState) => {
  //     // Only respond to vertical movement
  //     if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
  //       // Calculate new height based on drag distance
  //       const dragDistance = gestureState.dy;
  //       const newHeight = modalHeight - dragDistance;
  //       const clampedHeight = Math.max(
  //         screenHeight * 0.4,
  //         Math.min(screenHeight * 0.8, newHeight)
  //       );
  //       setModalHeight(clampedHeight);
  //     }
  //   },
  //   onPanResponderRelease: (evt, gestureState) => {
  //     pan.flattenOffset();

  //     // Snap to predefined heights
  //     const currentHeight = modalHeight;
  //     let targetHeight;

  //     if (currentHeight < screenHeight * 0.6) {
  //       targetHeight = screenHeight * 0.4; // Snap to small
  //     } else if (currentHeight < screenHeight * 0.75) {
  //       targetHeight = screenHeight * 0.6; // Snap to medium
  //     } else {
  //       targetHeight = screenHeight * 0.8; // Snap to large
  //     }

  //     setModalHeight(targetHeight);

  //     Animated.spring(pan, {
  //       toValue: { x: 0, y: 0 },
  //       useNativeDriver: false,
  //     }).start();
  //   },
  // });

  const handleCancel = () => {
    Keyboard.dismiss();
    setError(null);
    setIsSaving(false);
    setExtractedData(null);

    // Smoothly slide down first, then dismiss
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Interpolate backdrop opacity based on translateY position for smooth fading
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="none"
        onRequestClose={() => {
          if (isChildModalOpen) return;
          handleCancel();
        }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined} 
          style={{ flex: 1 }}
        >
          <Animated.View 
            className="flex-1 justify-end" 
            style={{ 
              backgroundColor: "rgba(0,0,0,0.5)",
              opacity: backdropOpacity 
            }}
          >
            <Animated.View
              {...sheetPanResponder.panHandlers}
              className="rounded-t-[30px] bg-white"
              style={[
                { height: "100%"},
                {
                  paddingTop: insets.top + 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -8 },
                  shadowOpacity: 0.12,
                  shadowRadius: 16,
                  elevation: 24,
                  transform: [{ translateY }],
                }
              ]}
            >
              <StatusBar style="dark" />
              
              {/* Drag Handle Area */}
              {/* <View 
                {...dragPanResponder.panHandlers}
                className="w-full items-center py-4 bg-white rounded-t-[30px]"
              >
                <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </View> */}

              <View className="flex-row justify-between items-center px-5 pb-5 border-b border-gray-200" style={{ paddingTop: keyboardVisible ? 0 : 4 }}>
                  <View className="flex-row items-center gap-2">
                      <Text className="text-2xl text-gray-700 font-medium">
                          {currentActivity?.id ? "Edit Activity" : "Add Activity"}
                      </Text>
                  </View>
                  <View className="flex-row items-center gap-4">
                      {/* TODO: for future release, ability to scan booking receipt or ticket image and auto-populate fields */}
                      {/* {isOcrPending ? ( 
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <TouchableOpacity 
                          onPress={handleTextExtraction} 
                          disabled={isSaving}
                          accessibilityRole="button"
                          accessibilityLabel="Extract details from booking receipt or ticket image"
                        >
                            <Icon name="camera-alt" size={24} color={colors.primary} />
                        </TouchableOpacity>
                      )} */}
                      <TouchableOpacity 
                        onPress={handleCancel} 
                        disabled={isSaving}
                        accessibilityRole="button"
                        accessibilityLabel="Close modal"
                      >
                          <Icon name="clear" size={24} color={"#999"} />
                      </TouchableOpacity>
                  </View>
              </View>
 
              <View className="flex-1">
                <EditActivity
                  itinerarySectionId={itinerarySectionId}
                  itineraryActivity={extractedData ? { ...currentActivity, ...extractedData } as any : currentActivity}
                  travelId={travelId}
                  onClose={onClose}
                  onSaveSuccess={(saved) => {
                    setCurrentActivity(saved);
                  }}
                  onOpenSectionModal={handleOpenSectionModal}
                  onOpenPrimaryTypeModal={handleOpenPrimaryTypeModal}
                  onScroll={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    isAtTop.current = y <= 0;
                  }}
                />
              </View>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <SectionLookupModal
        visible={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        sections={sections}
        selectedSectionId={selectedSectionId}
        onSelect={(sectionId) => {
          if (onSelectSectionCallback) {
            onSelectSectionCallback(sectionId);
          }
          setShowSectionModal(false);
        }}
      />

      <ActivityTypeLookupModal
        visible={showPrimaryTypeModal}
        onClose={() => setShowPrimaryTypeModal(false)}
        selectedType={selectedActivityType}
        onSelect={(type) => {
          if (onSelectActivityTypeCallback) {
            onSelectActivityTypeCallback(type);
          }
          setShowPrimaryTypeModal(false);
        }}
      />
    </>
  );
};

export default ActivityModal;