import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useRef, useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
} from "react-native";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ItineraryActivity, ItineraryNote } from "../../../types/TravelDto";
import EditNote from "./index";
import ActivityLookupModal from "../../Lookups/ActivityLookupModal";

interface NoteModalProps {
  visible: boolean;
  onClose: () => void;
  itineraryNote: ItineraryNote | null;
  activities?: ItineraryActivity[];
  travelId?: string;
}

const { height: screenHeight } = Dimensions.get("window");

const NoteModal = ({ 
  visible, 
  onClose, 
  itineraryNote, 
  activities,
  travelId,
}: NoteModalProps) => {
  const [modalHeight, setModalHeight] = useState(screenHeight * 0.75);
  const { keyboardVisible } = useKeyboardVisible();
  const insets = useSafeAreaInsets();
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

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | undefined>(undefined);
  const [onSelectActivityCallback, setOnSelectActivityCallback] = useState<((id?: string) => void) | null>(null);

  const handleOpenActivityModal = (currentId: string | undefined, onSelect: (id?: string) => void) => {
    setSelectedActivityId(currentId);
    setOnSelectActivityCallback(() => onSelect || null);
    setShowActivityModal(true);
  };

  useEffect(() => {
    handleChildModalToggle(showActivityModal);
  }, [showActivityModal]);


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

  // Interpolate backdrop opacity based on translateY position for smooth fading
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <>
      <Modal 
        visible={visible} 
        transparent 
        animationType="none"
        onRequestClose={() => {
          if (isChildModalOpen) return;
          handleCancel();
        }}
      >
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
                { height: keyboardVisible ? "100%" : modalHeight },
                {
                  paddingTop: keyboardVisible ? insets.top + 10 : 0,
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
              className="flex-row justify-between items-center px-5 pb-5 border-b border-gray-200" style={{ paddingTop: keyboardVisible ? 0 : 4 }}>
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl text-gray-700 font-medium">
                    {itineraryNote?.id ? "Edit Note" : "Add Note"}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCancel}>
                  <Icon name="clear" size={24} color={"#999"} />
                </TouchableOpacity>
              </View>

              <View className="flex-1">
                 <EditNote
                  itineraryNote={itineraryNote}
                  activities={activities}
                  travelId={travelId}
                  onClose={onClose}
                  onOpenActivityModal={handleOpenActivityModal}
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

      <ActivityLookupModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        activities={activities}
        selectedActivityId={selectedActivityId}
        onSelect={(activityId) => {
          if (onSelectActivityCallback) {
            onSelectActivityCallback(activityId);
          }
          setShowActivityModal(false);
        }}
      />
    </>
  );
};

export default NoteModal;
