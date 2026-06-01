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
import { ChecklistItem, ItineraryActivity } from "../../../types/TravelDto";
import EditChecklistItem from "./index";
import { useMemo } from "react";
import { useChecklistGroups } from "../../../hooks/useChecklist";
import { ActivityType } from "../../../../../types/enums";
import ContextLookupModal, { ContextOption } from "../../Lookups/ContextLookupModal";

interface ChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  checklistItem: ChecklistItem | null;
  activities?: ItineraryActivity[];
  travelId: string;
  onOpenNewGroupModal?: () => void;
}

const { height: screenHeight } = Dimensions.get("window");

const ChecklistModal = ({
  visible,
  onClose,
  checklistItem,
  activities,
  travelId,
  onOpenNewGroupModal,
}: ChecklistModalProps) => {
  const [modalHeight] = useState(screenHeight * 0.75);
  const { keyboardVisible } = useKeyboardVisible();
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

  // Sibling lookup states & hooks
  const { data: groups = [], isLoading: groupsLoading } = useChecklistGroups(travelId);
  const [selectedContext, setSelectedContext] = useState<ContextOption | null>(null);
  const [showContextModal, setShowContextModal] = useState(false);

  const contextOptions = useMemo<ContextOption[]>(() => {
    const groupOpts: ContextOption[] = groups.map((g) => ({
      id: g.id!,
      label: g.title,
      type: "group",
    }));
    const activityOpts: ContextOption[] = (activities || [])
      .filter((a) => !!a.id && !!a.title)
      .map((a) => ({
        id: a.id!,
        label: a.title!,
        type: "activity",
        activityType: (a.type ?? ActivityType.none) as ActivityType,
      }));
    return [...groupOpts, ...activityOpts];
  }, [groups, activities]);

  // Synchronise edits
  useEffect(() => {
    if (checklistItem) {
      if (checklistItem.checklistGroupId) {
        const matchingGroup = groups.find((g) => g.id === checklistItem.checklistGroupId);
        if (matchingGroup) {
          setSelectedContext({
            id: matchingGroup.id!,
            label: matchingGroup.title,
            type: "group",
          });
        }
      } else if (checklistItem.activityId) {
        const matchingActivity = (activities || []).find((a) => a.id === checklistItem.activityId);
        if (matchingActivity) {
          setSelectedContext({
            id: matchingActivity.id!,
            label: matchingActivity.title || "Activity",
            type: "activity",
            activityType: (matchingActivity.type ?? ActivityType.none) as ActivityType,
          });
        }
      }
    } else {
      setSelectedContext(null);
    }
  }, [checklistItem, groups, activities]);

  // Support auto-selecting a newly created group
  const prevGroupsLength = useRef(groups.length);
  useEffect(() => {
    if (groups.length > prevGroupsLength.current) {
      const latestGroup = groups[groups.length - 1];
      if (latestGroup && latestGroup.id) {
        setSelectedContext({
          id: latestGroup.id,
          label: latestGroup.title,
          type: "group",
        });
      }
    }
    prevGroupsLength.current = groups.length;
  }, [groups]);

  // Toggle child modal listener when showContextModal changes
  useEffect(() => {
    handleChildModalToggle(showContextModal);
  }, [showContextModal]);


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
                    {checklistItem?.id ? "Edit Item" : "Add Item"}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCancel}>
                  <Icon name="clear" size={36} color={"#333"} />
                </TouchableOpacity>
              </View>

              <View className="flex-1">
                <EditChecklistItem
                  travelId={travelId}
                  checklistItem={checklistItem}
                  activities={activities}
                  onClose={onClose}
                  onOpenNewGroupModal={onOpenNewGroupModal}
                  selectedContext={selectedContext}
                  onSelectContext={setSelectedContext}
                  onOpenContextModal={() => setShowContextModal(true)}
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

      <ContextLookupModal
        visible={showContextModal}
        onClose={() => setShowContextModal(false)}
        options={contextOptions}
        selectedOptionId={selectedContext?.id}
        isLoading={groupsLoading}
        onSelect={(option) => {
          setSelectedContext(option);
          setShowContextModal(false);
        }}
      />
    </>
  );
};

export default ChecklistModal;
