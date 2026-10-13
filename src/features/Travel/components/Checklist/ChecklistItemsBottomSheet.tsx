import React, { useEffect, useRef, useMemo, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ActivityIcon from "../../../../components/ActivityIcon";
import { TripPlanType } from "../../../../types/enums";
import { ChecklistItem } from "../../types/TravelDto";
import ChecklistItemRow, {
  AddChecklistItemRow,
  ChecklistScrollContext,
  closeActiveChecklistSwipeable,
} from "./ChecklistItemRow";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";

const { height: screenHeight } = Dimensions.get("window");

export interface ActiveChecklistTarget {
  type: "general" | "group" | "activity";
  id?: string;
  title: string;
  description?: string;
  activityType?: TripPlanType;
}

export interface ChecklistItemsBottomSheetProps {
  visible: boolean;
  activeChecklist: ActiveChecklistTarget | null;
  items: ChecklistItem[];
  travelId: string;
  onClose: () => void;
  onToggle: (item: ChecklistItem) => void;
  onDelete: (item: ChecklistItem) => void;
}

interface TargetIconProps {
  type?: "general" | "group" | "activity";
  activityType?: TripPlanType;
  primaryColor: string;
}

const ChecklistTargetIcon: React.FC<TargetIconProps> = ({
  type,
  activityType,
  primaryColor,
}) => {
  if (type === "activity") {
    return (
      <ActivityIcon
        type={activityType || TripPlanType.activity}
        size={28}
        showIconOnly
      />
    );
  }

  if (type === "group") {
    return (
      <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
        <Icon name="folder" size={20} color={primaryColor} />
      </View>
    );
  }

  return (
    <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
      <Icon name="playlist-add-check" size={20} color={primaryColor} />
    </View>
  );
};

export const ChecklistItemsBottomSheet: React.FC<ChecklistItemsBottomSheetProps> = ({
  visible,
  activeChecklist,
  items,
  travelId,
  onClose,
  onToggle,
  onDelete,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const primaryColor = colors.primary || "#263F69";
  const { keyboardVisible, keyboardHeight } = useKeyboardVisible();

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const activeTargetRef = useRef<any>(null);

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
  }, [visible, translateY]);

  const handleDismiss = useCallback(() => {
    closeActiveChecklistSwipeable();
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [onClose, translateY]);

  const scrollToRef = useCallback((target: any) => {
    if (!target) return;
    activeTargetRef.current = target;
    const targetNode = target.current || target;
    const scrollNode = scrollViewRef.current;
    if (!targetNode || !scrollNode) return;

    const performScroll = () => {
      if (typeof targetNode.measureLayout === "function") {
        targetNode.measureLayout(
          scrollNode,
          (_x: number, y: number) => {
            scrollNode.scrollTo({
              y: Math.max(0, y - 60),
              animated: true,
            });
          },
          () => { }
        );
      }
    };

    setTimeout(performScroll, 50);
    setTimeout(performScroll, 200);
  }, []);

  const scrollContextValue = useMemo(() => ({ scrollToRef }), [scrollToRef]);

  useEffect(() => {
    if (keyboardVisible && activeTargetRef.current) {
      scrollToRef(activeTargetRef.current);
    }
  }, [keyboardVisible, keyboardHeight, scrollToRef]);

  const totalCount = items.length;
  const doneCount = useMemo(
    () => items.filter((item) => item.isDone).length,
    [items]
  );
  const progressPercent = totalCount > 0
    ? Math.round((doneCount / totalCount) * 100)
    : 0;

  if (!activeChecklist && !visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <GestureHandlerRootView
        className="flex-1 bg-white"
        style={{ flex: 1, backgroundColor: "#ffffff" }}
      >
        <Animated.View
          className="flex-1 bg-white overflow-hidden"
          style={{
            transform: [{ translateY }],
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          {/* Header */}
          <View
            className="w-full bg-white px-5"
            style={{ paddingTop: Math.max(insets.top + 8, 16) }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close checklist bottomsheet"
              onPress={handleDismiss}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Icon name="chevron-left" size={28} color="#64748B" />
            </TouchableOpacity>

            <View className="flex-row items-center justify-between mt-6">
              <View className="flex-row items-start gap-3 flex-1 mr-3">
                {activeChecklist?.type === 'activity' && (
                  <ChecklistTargetIcon
                    type={activeChecklist?.type}
                    activityType={activeChecklist?.activityType}
                    primaryColor={primaryColor}
                  />
                )}

                <View className="flex-1">
                  <Text className="text-3xl font-bold text-secondary leading-4">
                    {activeChecklist?.title || "Checklist"}
                  </Text>
                  {activeChecklist?.description ? (
                    <Text
                      className="text-base text-gray-500 leading-5 mt-1"
                    >
                      {activeChecklist.description}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                <View className="px-2.5 py-1">
                  <Text className="text-base font-semibold text-tertiary">
                    {doneCount}/{totalCount}
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress bar */}
            {totalCount > 0 && (
              <View className="h-1.5 bg-gray-100 w-full rounded-full overflow-hidden mt-3">
                <View
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
            )}
          </View>

          {/* List Content */}
          <ChecklistScrollContext.Provider value={scrollContextValue}>
            <ScrollView
              ref={scrollViewRef}
              className="flex-1"
              contentContainerStyle={{
                paddingTop: 16,
                paddingBottom: keyboardVisible ? keyboardHeight + 80 : 40,
                paddingHorizontal: 16,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={closeActiveChecklistSwipeable}
            >
              <View className="overflow-hidden">
                {items.map((item, index) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    isLast={index === items.length - 1}
                  />
                ))}
                <AddChecklistItemRow
                  travelId={travelId}
                  checklistGroupId={
                    activeChecklist?.type === "group"
                      ? activeChecklist.id
                      : undefined
                  }
                  activityId={
                    activeChecklist?.type === "activity"
                      ? activeChecklist.id
                      : undefined
                  }
                  hasBottomBorder={false}
                />
              </View>
            </ScrollView>
          </ChecklistScrollContext.Provider>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default ChecklistItemsBottomSheet;
