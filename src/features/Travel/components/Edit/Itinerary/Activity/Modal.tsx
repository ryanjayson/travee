import { MaterialIcons as Icon } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated, Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Text, TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConfirm } from "../../../../../../context/ConfirmContext";
import { useToast } from "../../../../../../context/ToastContext";
import { useKeyboardVisible } from "../../../../../../hooks/useKeyboardVisible";
import { ActivityType } from "../../../../../../types/enums";
import { useDeleteActivityMutation, useItineraryActivity } from "../../../../hooks/useActivity";
import { useTravelPlan } from "../../../../hooks/useTravel";
import { ItineraryActivity } from "../../../../types/TravelDto";
import { parseExtractedText } from "../../../../utils/ocrParser";
import ActivityTypeLookupModal from "../../../Lookups/ActivityTypeLookupModal";
import SectionLookupModal from "../../../Lookups/SectionLookupModal";
import EditActivity from "../Activity";

import { useTravelContext } from "../../../../../../context/TravelContext";

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
  itineraryActivity: propItineraryActivity,
  itinerarySectionId,
  travelId,
}: ActivityModalProps) => {
  const [currentActivity, setCurrentActivity] = useState<ItineraryActivity | null>(propItineraryActivity);

  const activeId = currentActivity?.id || propItineraryActivity?.id || "";
  const { data: fetchedDbActivity, refetch: refetchActivity } = useItineraryActivity(visible ? activeId : "");

  const { data: travelPlan } = useTravelPlan(travelId || "");

  const dbActivity = useMemo(() => {
    if (!travelPlan?.itinerarySection || !currentActivity?.id) return null;
    return travelPlan.itinerarySection
      .flatMap((s) => s.itineraryActivity || [])
      .find((a) => a.id === currentActivity.id) || null;
  }, [travelPlan, currentActivity?.id]);

  const latestActivity = fetchedDbActivity || dbActivity || currentActivity || propItineraryActivity;

  useEffect(() => {
    if (visible) {
      setCurrentActivity(propItineraryActivity);
      if (propItineraryActivity?.id) {
        refetchActivity();
      }
      setIsSaving(false);
      setError(null);
      setExtractedData(null);
      setIsOcrPending(false);
    }
  }, [visible, propItineraryActivity, refetchActivity]);

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
  const { showToast } = useToast();
  const { setActiveTripViewTab } = useTravelContext();
  const { mutate: deleteActivityMutation, isPending: isDeleting } = useDeleteActivityMutation();

  const handleDeleteActivity = async () => {
    if (latestActivity?.id) {
      const isConfirmed = await confirm({
        title: "Delete Activity",
        message: "Are you sure you want to delete this activity?",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger",
      });

      if (isConfirmed) {
        try {
          deleteActivityMutation(
            {
              activityId: latestActivity.id,
              sectionId: latestActivity.sectionId || itinerarySectionId || "",
              travelId: travelId,
            },
            {
              onSuccess: () => {
                showToast({ type: "success", message: "Activity deleted successfully" });
                setActiveTripViewTab("itinerary");
                handleCancel();
              },
              onError: () => {
                showToast({ type: "error", message: "Failed to delete activity" });
              },
            }
          );
        } catch (err) {
          showToast({ type: "error", message: "Failed to delete activity" });
        }
      }
    }
  };

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
      message: "Travelled values your privacy. Text extraction from documents, screenshots, and receipts is performed 100% locally and offline on your device using Google ML Kit. We do not upload your personal documents to any external server.\n\nWould you like to select a booking screenshot or receipt to extract details?",
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
                { height: "100%" },
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
                    {latestActivity?.id ? "Edit Activity" : "Add Activity"}
                  </Text>
                </View>

                <View className="flex-row items-center gap-8">
                  {latestActivity?.id && (
                    <View className="flex-row items-center gap-5">
                      <TouchableOpacity
                        onPress={handleDeleteActivity}
                        disabled={isSaving || isDeleting}
                        accessibilityRole="button"
                        accessibilityLabel="Delete activity"
                      >
                        <Icon name="delete-outline" size={24} color="#c93030" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setCurrentActivity(null);
                          setExtractedData(null);
                        }}
                        disabled={isSaving}
                        accessibilityRole="button"
                        accessibilityLabel="Switch to add activity"
                      >
                        <Icon name="add" size={26} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
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
                  itineraryActivity={extractedData ? { ...latestActivity, ...extractedData } as any : latestActivity}
                  travelId={travelId}
                  onClose={onClose}
                  onSaveSuccess={(saved) => {
                    setCurrentActivity(saved);
                  }}
                  onSwitchToAddMode={() => {
                    setCurrentActivity(null);
                    setExtractedData(null);
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