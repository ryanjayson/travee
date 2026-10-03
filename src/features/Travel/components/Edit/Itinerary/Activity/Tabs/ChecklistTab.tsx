import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useAuth } from "../../../../../../Auth/hooks/AuthContext";
import { useConfirm } from "../../../../../../../context/ConfirmContext";
import { useTravelContext } from "../../../../../../../context/TravelContext";
import { useKeyboardVisible } from "../../../../../../../hooks/useKeyboardVisible";
import {
  useChecklistItems,
  useChecklistItemsByActivity,
  useDeleteChecklistItemMutation,
  useToggleChecklistItemMutation,
} from "../../../../../hooks/useChecklist";
import ChecklistItemRow, {
  AddChecklistItemRow,
  ChecklistScrollContext,
} from "../../../../Checklist/ChecklistItemRow";
import { ChecklistItem, ItineraryActivity } from "../../../../../types/TravelDto";

export interface ChecklistTabProps {
  activityId?: string;
  travelId?: string;
  itineraryActivity?: ItineraryActivity | null;
  isScrollable?: boolean;
}

export default function ChecklistTab({
  activityId,
  travelId: propTravelId,
  itineraryActivity,
  isScrollable = false,
}: ChecklistTabProps) {
  const { openChecklistModal } = useTravelContext();
  const { confirm } = useConfirm();
  const { userToken } = useAuth();
  const { keyboardVisible, keyboardHeight } = useKeyboardVisible();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const activeTargetRef = React.useRef<any>(null);

  const scrollToRef = (target: any) => {
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
              y: Math.max(0, y - 70),
              animated: true,
            });
          },
          () => {
            if (typeof targetNode.measureInWindow === "function") {
              targetNode.measureInWindow((_x: number, y: number) => {
                if (y !== undefined) {
                  scrollNode.scrollTo({
                    y: Math.max(0, y - 70),
                    animated: true,
                  });
                }
              });
            }
          }
        );
      }
    };

    setTimeout(performScroll, 50);
    setTimeout(performScroll, 250);
  };

  React.useEffect(() => {
    if (keyboardVisible && activeTargetRef.current) {
      scrollToRef(activeTargetRef.current);
    }
  }, [keyboardVisible]);

  const effectiveTravelId = propTravelId || itineraryActivity?.travelId || "";
  const effectiveActivityId = activityId || itineraryActivity?.id || "";

  const deleteChecklistItem = useDeleteChecklistItemMutation();
  const toggleChecklistItem = useToggleChecklistItemMutation();

  const {
    data: allItems,
    refetch: refetchTravelItems,
    isLoading: isTravelLoading,
  } = useChecklistItems(effectiveTravelId);

  const {
    data: activityItems,
    refetch: refetchActivityItems,
    isLoading: isActivityLoading,
  } = useChecklistItemsByActivity(effectiveTravelId ? "" : effectiveActivityId);

  const activityChecklistItems = useMemo(() => {
    if (effectiveTravelId && allItems) {
      return allItems.filter((i) => i.activityId === effectiveActivityId);
    }
    return activityItems || [];
  }, [effectiveTravelId, allItems, activityItems, effectiveActivityId]);

  const targetActivity = useMemo<ItineraryActivity | null>(() => {
    if (itineraryActivity) return itineraryActivity;
    if (effectiveActivityId) {
      return {
        id: effectiveActivityId,
        travelId: effectiveTravelId,
      } as ItineraryActivity;
    }
    return null;
  }, [itineraryActivity, effectiveActivityId, effectiveTravelId]);

  const refetch = async () => {
    if (effectiveTravelId) {
      await refetchTravelItems();
    } else {
      await refetchActivityItems();
    }
  };

  const handleToggleChecklistItem = async (item: ChecklistItem) => {
    await toggleChecklistItem.mutateAsync({
      id: item.id!,
      isDone: !item.isDone,
      userId: userToken || "user",
      travelId: item.travelId || effectiveTravelId,
      activityId: item.activityId || effectiveActivityId,
    });
    await refetch();
  };

  const handleDeleteChecklistItem = async (item: ChecklistItem) => {
    const isConfirmed = await confirm({
      title: "Remove Item",
      message: `Remove "${item.title}"?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      type: "danger",
    });

    if (isConfirmed) {
      await deleteChecklistItem.mutateAsync({
        id: item.id!,
        travelId: item.travelId || effectiveTravelId,
        activityId: item.activityId || effectiveActivityId,
      });
      await refetch();
    }
  };

  const handleAddItem = () => {
    if (targetActivity) {
      openChecklistModal(null, [targetActivity], effectiveTravelId);
    }
  };

  const handleEditItem = (item: ChecklistItem) => {
    if (targetActivity) {
      openChecklistModal(item, [targetActivity], effectiveTravelId);
    }
  };

  const isLoading = effectiveTravelId ? isTravelLoading : isActivityLoading;

  if (isLoading && (!activityChecklistItems || activityChecklistItems.length === 0)) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator size="small" color="#263F69" />
      </View>
    );
  }

  const renderContent = () => (
    <View className="flex-1 pb-6 pt-2 px-5">
      <View className="overflow-hidden">
        {activityChecklistItems.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            onToggle={handleToggleChecklistItem}
            onEdit={handleEditItem}
            onDelete={handleDeleteChecklistItem}
          />
        ))}
        <AddChecklistItemRow
          travelId={effectiveTravelId}
          activityId={effectiveActivityId}
          hasBottomBorder
        />
      </View>
    </View>
  );

  if (isScrollable) {
    return (
      <ChecklistScrollContext.Provider value={{ scrollToRef }}>
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: keyboardVisible ? keyboardHeight + 80 : 100,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {renderContent()}
        </ScrollView>
      </ChecklistScrollContext.Provider>
    );
  }

  return (
    <ChecklistScrollContext.Provider value={{ scrollToRef }}>
      {renderContent()}
    </ChecklistScrollContext.Provider>
  );
}
