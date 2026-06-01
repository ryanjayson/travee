import { MaterialIcons as Icon, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  PanResponder,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  View,
  Easing,
} from "react-native";
import ActivityIcon, { activityIcons } from "../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../types/enums";
import { useUpdateActivityMutation } from "../../../hooks/useActivity";
import { useConfirm } from "../../../../../context/ConfirmContext";
import { useToast } from "../../../../../context/ToastContext";
import { ItineraryActivity, ItineraryExpense, ItineraryNote, ChecklistItem } from "../../../types/TravelDto";
import MapViewer from "../../MapViewer";
import ViewActivityModal from "./Modal";
import ActivityModal from "../../Edit/Itinerary/Activity/Modal";
import ExpenseModal from "../../Forms/Expense/Modal";
import NoteModal from "../../Forms/Note/Modal";
import ChecklistModal from "../../Forms/Checklist/Modal";
import ChecklistGroupModal from "../../Forms/Checklist/ChecklistGroupModal";

interface ItineraryActivityProps {
  itineraryActivity: ItineraryActivity;
  isFirstItem?: boolean;
  isLastItem?: boolean;
  plainMode?: boolean;
  viewMode?: "plain" | "narrow" | "expanded";
  // Drag-to-reorder props
  index?: number;
  listLength?: number;
  onDragStart?: (index: number, height: number) => void;
  onDragEnd?: (fromIndex: number, toIndex: number) => void;
  onDragMove?: (index: number, dy: number, moveY?: number) => void;
  isDragging?: boolean;
  dragIndex?: number | null;
  dragSectionId?: string | null;
  hoverSectionId?: string | null;
  hoverIndex?: number | null;
  draggedHeight?: number | null;
}

const ActivityItemCard = ({
  itineraryActivity,
  isFirstItem,
  isLastItem,
  plainMode,
  viewMode,
  index = 0,
  listLength = 0,
  onDragStart,
  onDragEnd,
  onDragMove,
  isDragging: parentIsDragging,
  dragIndex,
  dragSectionId,
  hoverSectionId,
  hoverIndex,
  draggedHeight,
}: ItineraryActivityProps) => {
  const isNarrow = viewMode === "narrow";
  const [itineraryEventActivity, setItineraryEventActivity] =
    useState<ItineraryActivity>(itineraryActivity);
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const [showActivityViewModal, setShowActivityViewModal] =
    useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [showChecklistModal, setShowChecklistModal] = useState<boolean>(false);
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [isAddPressed, setIsAddPressed] = useState<boolean>(false);
  const updateMutation = useUpdateActivityMutation();

  // --- Drag-to-reorder ---
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragActive, setIsDragActive] = useState(false);
  const isDragActiveRef = useRef(false);
  const dragTimer = useRef<NodeJS.Timeout | null>(null);
  const panResponderClaimed = useRef(false);

  const setDragActiveState = (val: boolean) => {
    setIsDragActive(val);
    isDragActiveRef.current = val;
  };

  const dragPropsRef = useRef({ index, listLength, onDragMove, onDragEnd, dragSectionId, hoverSectionId, hoverIndex });
  useEffect(() => {
    dragPropsRef.current = { index, listLength, onDragMove, onDragEnd, dragSectionId, hoverSectionId, hoverIndex };
  }, [index, listLength, onDragMove, onDragEnd, dragSectionId, hoverSectionId, hoverIndex]);

  const dragEnabled = !!onDragStart && !!onDragEnd && !itineraryEventActivity.startDate;
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const lastTargetShift = useRef(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [cardHeight, setCardHeight] = useState(110);

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isDragActive ? 1.04 : 1,
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [isDragActive]);

  useEffect(() => {
    if (!dragSectionId) {
      shiftAnim.setValue(0);
      lastTargetShift.current = 0;
      return;
    }

    let targetShift = 0;
    const isThisCardDragging = dragEnabled && isDragActive;
    const activeDraggedHeight = draggedHeight ?? cardHeight;

    if (!isThisCardDragging && dragIndex !== null && dragIndex !== undefined) {
      const thisSectionId = itineraryActivity.sectionId || "";
      const activeHoverSectionId = hoverSectionId || dragSectionId;
      const activeHoverIndex = hoverIndex !== null && hoverIndex !== undefined ? hoverIndex : dragIndex;

      if (dragSectionId === thisSectionId) {
        // Dragged card is in this section
        if (activeHoverSectionId === dragSectionId) {
          if (dragIndex < activeHoverIndex) {
            if (index > dragIndex && index <= activeHoverIndex) {
              targetShift = -activeDraggedHeight;
            }
          } else if (dragIndex > activeHoverIndex) {
            if (index >= activeHoverIndex && index < dragIndex) {
              targetShift = activeDraggedHeight;
            }
          }
        } else {
          // Dragged card has moved out of this section
          if (index > dragIndex) {
            targetShift = -activeDraggedHeight;
          }
        }
      } else if (activeHoverSectionId === thisSectionId) {
        // Dragged card is from a different section, and this section is hovered
        if (index >= activeHoverIndex) {
          targetShift = activeDraggedHeight;
        }
      }
    }

    if (lastTargetShift.current === targetShift) {
      return;
    }
    lastTargetShift.current = targetShift;

    Animated.timing(shiftAnim, {
      toValue: targetShift,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [dragSectionId, hoverSectionId, hoverIndex, dragIndex, index, isDragActive, dragEnabled, itineraryActivity.sectionId, draggedHeight, cardHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        // Only claim if drag is already active (hold timer fired)
        return isDragActiveRef.current && (Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2);
      },
      onPanResponderTerminationRequest: () => !isDragActiveRef.current,
      onPanResponderGrant: () => {
        pan.setValue({ x: 0, y: 0 });
        panResponderClaimed.current = true; // Mark as claimed by PanResponder!
      },
      onPanResponderMove: (e, gestureState) => {
        if (!isDragActiveRef.current) return;
        if (dragPropsRef.current.onDragMove) {
          dragPropsRef.current.onDragMove(
            dragPropsRef.current.index,
            gestureState.dy,
            gestureState.moveY
          );
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(e, gestureState);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (dragTimer.current) {
          clearTimeout(dragTimer.current);
          dragTimer.current = null;
        }
        if (!isDragActiveRef.current) {
          setDragActiveState(false);
          return;
        }

        const { 
          index: currentIndex, 
          dragSectionId: latestDragSectionId, 
          hoverSectionId: latestHoverSectionId, 
          hoverIndex: latestHoverIndex 
        } = dragPropsRef.current;
        
        const isTargetDifferent = 
          latestDragSectionId !== null && 
          latestDragSectionId !== undefined &&
          latestHoverSectionId !== null && 
          latestHoverSectionId !== undefined &&
          (latestDragSectionId !== latestHoverSectionId || (latestHoverIndex !== null && latestHoverIndex !== undefined && latestHoverIndex !== currentIndex));

        // Lock coordinates explicitly at final gesture positions to prevent the React Native first-frame reset bug
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        if (isTargetDifferent) {
          const activeDraggedHeight = draggedHeight ?? cardHeight;
          let targetY = 0;
          
          if (latestDragSectionId === latestHoverSectionId) {
            const targetIndex = latestHoverIndex !== null && latestHoverIndex !== undefined ? latestHoverIndex : currentIndex;
            targetY = (targetIndex - currentIndex) * activeDraggedHeight;
          } else {
            targetY = gestureState.dy;
          }

          // Smoothly glide the active card first into its target index slot position before resetting drag state
          Animated.timing(pan, {
            toValue: { x: 0, y: targetY },
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
            // Complete transition: reset coordinates and active status synchronously in the same batch as parent list update
            pan.setValue({ x: 0, y: 0 });
            setDragActiveState(false);
            dragPropsRef.current.onDragEnd?.(currentIndex, latestHoverIndex !== null && latestHoverIndex !== undefined ? latestHoverIndex : currentIndex);
          });
        } else {
          // Cancelled / released at same spot! Smoothly glide back to original slot using ease-in-out timing
          Animated.timing(pan, {
            toValue: { x: 0, y: 0 },
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            setDragActiveState(false);
            dragPropsRef.current.onDragEnd?.(currentIndex, currentIndex);
          });
        }
      },
      onPanResponderTerminate: () => {
        if (dragTimer.current) {
          clearTimeout(dragTimer.current);
          dragTimer.current = null;
        }
        const { index: currentIndex } = dragPropsRef.current;
        // Smoothly glide back to original slot on termination using ease-in-out timing
        Animated.timing(pan, {
          toValue: { x: 0, y: 0 },
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start(() => {
          pan.setValue({ x: 0, y: 0 });
          setDragActiveState(false);
          dragPropsRef.current.onDragEnd?.(currentIndex, currentIndex);
        });
      },
    })
  ).current;

  const handleLongPress = () => {
    if (itineraryEventActivity.startDate) {
      showToast({
        type: "info",
        message: "Activities with date and time set cannot be moved.",
      });
      return;
    }
    if (!dragEnabled) return;
    panResponderClaimed.current = false; // Reset to false on new press session!
    setDragActiveState(true);
    onDragStart?.(index, cardHeight);
  };

  const dragAnimatedStyle = {
    transform: [
      { translateY: shiftAnim },
      ...pan.getTranslateTransform(),
      { scale: scaleAnim },
    ] as any,
    zIndex: isDragActive ? 9999 : 1,
    elevation: isDragActive ? 10 : 1,
    // shadowOpacity: isDragActive ? 0.25 : 0,
  };

  const getActivityTypeDetails = (type: any) => {
    if (type == null) return { text: "None", color: "#9E9E9E" };
    const iconConfig = activityIcons.find((i) => i.activityType === type);
    const color = iconConfig?.color ?? "#9E9E9E";
    const typeName = ActivityType[type];
    const text = typeName 
      ? String(typeName).replace(/([A-Z])/g, ' $1').trim()
      : "None";
    return { text, color };
  };

  React.useEffect(() => {
    setItineraryEventActivity(itineraryActivity);
  }, [itineraryActivity]);

  const handleToggleDone = async () => {
    const nextStatus = !itineraryEventActivity.isDone;
    const isConfirmed = await confirm({
      title: "Confirmation",
      message: `Are you sure you want to mark this activity as ${nextStatus ? 'done' : 'undone'}?`,
      confirmText: "Yes",
      cancelText: "Cancel",
      type: "default",
    });

    if (isConfirmed) {
      try {
        const updatedPayload = {
          ...itineraryEventActivity,
          isDone: nextStatus,
          isOffline: true,
        };
        
        await updateMutation.mutateAsync(updatedPayload);
        setItineraryEventActivity(updatedPayload);
      } catch (err) {
        console.error("Failed to update activity status:", err);
      }
    }
  };

  const handleViewModeActivity = (id: string) => {
    console.log("ID", id);
    setShowActivityViewModal(true);
  };

  if (plainMode) {
    return (
      <View className="flex-row items-center px-1 py-1">
        <View className="z-10 items-center justify-center mr-3">
          <Ionicons name="location" size={20} color="#dc3545" />
        </View>
        <Text className="text-base text-[#333] flex-1" numberOfLines={1}>
          {itineraryEventActivity.title}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={dragEnabled ? dragAnimatedStyle : undefined}
      {...(dragEnabled ? panResponder.panHandlers : {})}
      onLayout={(e) => {
        const { height } = e.nativeEvent.layout;
        if (height && height > 0) {
          setCardHeight(height);
        }
      }}
    >

    {(!isLastItem && !isDragActive && !parentIsDragging) && viewMode === 'expanded' && (
        <TouchableHighlight 
          underlayColor={"#263F69"}
          className={`absolute -bottom-4 left-2xl border border-gray-300 bg-gray-200 px-1px rounded-md z-100`}
          onPress={() => setShowActivityModal(true)}
          onShowUnderlay={() => setIsAddPressed(true)}
          onHideUnderlay={() => setIsAddPressed(false)}
        >
          <Icon name="add" size={20} color={"#999"}/>
        </TouchableHighlight>
      )}

      <View className={`px-2 flex-row justify-between items-center relative `}>
        {!isDragActive && (
          <>
            {!isLastItem ? (
              <View className="w-1.5 items-center h-full absolute">
                {isFirstItem ? (
                  <View className={`absolute h-1/2 w-1px top-1/2 ${viewMode === 'narrow' ? 'left-[29px]' : 'left-4xl'} z-0 border-l border-dashed border-gray-300`}></View>
                ) : (
                  <View className={`absolute h-full w-1px ${viewMode === 'narrow' ? 'left-[29px]' : 'left-4xl'} z-0 border-l border-dashed border-[#ccc]`}>
                  </View>
                )}
              </View>
            ) : (
              <View className="w-1.5 items-center h-full absolute">
                {isFirstItem && isLastItem ? (
                  <>
                  </>
                ) : (
                  <View className={`absolute h-1/2 w-1px ${viewMode === 'narrow' ? 'left-[29px]' : 'left-4xl'} top-0 z-0 border-l border-dashed border-[#ccc]`}>
                  </View>
                )}
              </View>
            )}
            <TouchableOpacity
              // activeOpacity={0.7}
              onLongPress={handleLongPress}
              delayLongPress={150}
              onPressOut={() => {
                if (!panResponderClaimed.current) {
                  pan.setValue({ x: 0, y: 0 });
                  setDragActiveState(false);
                  dragPropsRef.current.onDragEnd?.(dragPropsRef.current.index, dragPropsRef.current.index);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Drag activity"
              className="z-10 items-center justify-center bg-gray-100 border-3 border-gray-100 rounded-full "
            >
              <ActivityIcon
                type={itineraryEventActivity.type!}
                size={viewMode === 'narrow' ? 15 : 24}
              />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          onPress={() => handleViewModeActivity(itineraryEventActivity.id!)}
          onLongPress={handleLongPress}
          delayLongPress={150}
          onPressOut={() => {
            if (!panResponderClaimed.current) {
              pan.setValue({ x: 0, y: 0 });
              setDragActiveState(false);
              dragPropsRef.current.onDragEnd?.(dragPropsRef.current.index, dragPropsRef.current.index);
            }
          }}
          accessibilityRole="button"
          className={`w-[100px] border border-solid border-[#e0e0e0] rounded-xl grow ml-3 ${
            isNarrow ? "my-2 p-2" : "my-4 p-2.5"
          } ${
            itineraryEventActivity.isDone
              ? "opacity-50 border border-success-700 bg-success-25"
              : "bg-white"
          } ${isDragActive ? "opacity-100 shadow-2xl" : ""}`}
        >
          <View className={`flex-row items-center  ${itineraryEventActivity.startDate ? 'gap-2' : ''}`}>
            <View className="">
              <Text className="text-xs font-semibold text-[#606060] ">
                  {itineraryEventActivity.startDate && new Date(itineraryEventActivity.startDate).toLocaleTimeString([], { hour: '2-digit', minute:   '2-digit' })}
              </Text>
            </View>

            {itineraryEventActivity.type !== undefined && itineraryEventActivity.type !== null && (
              <View 
                style={{ backgroundColor: getActivityTypeDetails(itineraryEventActivity.type).color + '20' }} 
                className="items-end rounded-xs px-2 py-0.5"
              >
                <Text 
                  style={{ color: getActivityTypeDetails(itineraryEventActivity.type).color }} 
                  className="text-[10px] tracking-wider uppercase font-extrabold"
                >
                  {getActivityTypeDetails(itineraryEventActivity.type).text}
                </Text>
              </View>
            )}
          </View>


          <View className="flex-row justify-between items-start mb-3 gap-x-2">
            {/* {itineraryEventActivity && itineraryEventActivity.images && itineraryEventActivity.images.length > 0 && (
              <View className="flex-1 ">
                <View className="my-1 rounded-md">
                  <Image
                    src={itineraryEventActivity.images[0].url}
                    className="rounded-md w-[100px] h-[100px]"
                    style={{ resizeMode: "cover" }}
                  />
                  <View 
                    className="absolute inset-0 rounded-md w-[100px] h-[100px]"
                    style={{ backgroundColor: "rgba(0,0,0,0.20)"}}
                  />
                </View>
              </View>
            )} */}

              <View className="flex-2">
                <View className="flex-row justify-between items-start mb-1 gap-x-2">
                  <Text className={`text-lg font-semibold text-[#333] leading-5 flex-1 wrap-break-word ${isNarrow ? 'pr-3xl' : ''}`} numberOfLines={isNarrow || itineraryEventActivity.isDone ? 1 : 0}>
                      {itineraryEventActivity.title}
                  </Text>
                </View>
                {!isNarrow && !itineraryEventActivity.isDone && itineraryEventActivity && itineraryEventActivity.destination && itineraryEventActivity.destinationData?.coordinates && (
                  <TouchableOpacity 
                    className="flex-row w-3/4 items-center text-ellipsis opacity-80 bg-gray-100 rounded-sm p-1 pr-4"
                    onPress={() => setShowMapModal(true)}
                  >
                    <Icon name="location-pin" size={12} color={"#B42318"} />
                    <Text className="text-xs"
                    ellipsizeMode="tail"
                    numberOfLines={1}>
                      {itineraryEventActivity.destination}
                    </Text>
                  </TouchableOpacity>
                )} 

                {!isNarrow && !itineraryEventActivity.isDone && itineraryEventActivity.description && (
                  <Text className="text-md text-[#555] leading-5 mb-1.5 mt-1" 
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {itineraryEventActivity.description} 
                  </Text>
                )}
             </View>
          </View>
          
          {!isNarrow && (
            <View className="flex-row justify-between items-center border-t border-gray-200 pt-1.5">
              <View className="flex-row items-center mt-1 flex-wrap gap-5">
                <TouchableOpacity
                  onPress={() => setShowExpenseModal(true)}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel={`Add Expense to ${itineraryEventActivity.title}`}
                  className="flex-row items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100"
                >
                  <Icon name="payments" size={18} color={"#263F69"} />
                  <Text className="text-xs font-semibold text-[#263F69]">
                    {itineraryEventActivity.expensesCount || "+"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowChecklistModal(true)}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel={`Add Checklist item to ${itineraryEventActivity.title}`}
                  className="flex-row items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100"
                >
                  <Icon name="checklist" size={18} color={"#263F69"} />
                  <Text className="text-xs font-semibold text-[#263F69]">
                    {itineraryEventActivity.checklistCount || "+"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowNoteModal(true)}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel={`Add Note to ${itineraryEventActivity.title}`}
                  className="flex-row items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100"
                >
                  <Icon name="comment" size={18} color={"#263F69"} />
                  <Text className="text-xs font-semibold text-[#263F69]">
                    {itineraryEventActivity.notesCount || "+"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
          <View className={`absolute right-4 ${isNarrow ? "top-[34%]" : "bottom-7"}`}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleToggleDone}
                className="flex-row items-center gap-1.5"
              >
                {!isNarrow && (
                  <Text className="text-[10px] text-[#999] font-medium uppercase tracking-tight">
                    {itineraryEventActivity.isDone ? "" : "Mark as done"}
                  </Text>
                )}
                
                  {itineraryEventActivity.isDone ? 
                      (<Icon name="check" size={24} color="#0c6134" />)
                      : (<Icon name="check-box-outline-blank" size={24} color="#888" />)}
              </TouchableOpacity>
            </View>
         
 
      </View>

     {isAddPressed && (
        <View className="w-[85%] rounded-full left-5xl absolute -bottom-1">
          <View className="flex-1 h-[2px] bg-[#183B7A] rounded-full z-40" />
          <View className="w-2.5 h-2.5 rounded-full bg-[#183B7A] border-2 border-white shadow-sm z-50 absolute right-0 -bottom-1" />
        </View>
      )}
      
      <ViewActivityModal
        id={itineraryEventActivity.id!}
        showModal={showActivityViewModal}
        setShowModal={setShowActivityViewModal}
      />

      <ActivityModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        itineraryActivity={null}
        itinerarySectionId={itineraryActivity.sectionId || undefined}
      />

      {itineraryEventActivity.destinationData?.coordinates && (
        <MapViewer
          visible={showMapModal}
          onClose={() => setShowMapModal(false)}
          coordinates={itineraryEventActivity.destinationData.coordinates}
          title={itineraryEventActivity.destination || "Location"}
          zoom={12}
        />
      )}

      {/* Expense Modal (pre-populated with this activity context) */}
      <ExpenseModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        itineraryExpense={{
          activityId: itineraryEventActivity.id!,
          travelId: itineraryEventActivity.travelId,
          title: "",
          amount: 0,
          dateTime: new Date(),
        } as ItineraryExpense}
        activityId={itineraryEventActivity.id!}
        activities={[itineraryEventActivity]}
      />

      {/* Note Modal (pre-populated with this activity context) */}
      <NoteModal
        visible={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        itineraryNote={{
          activityId: itineraryEventActivity.id!,
          travelId: itineraryEventActivity.travelId,
          title: "",
        } as ItineraryNote}
        activities={[itineraryEventActivity]}
      />

      {/* Checklist Modal (pre-populated with this activity context) */}
      <ChecklistModal
        visible={showChecklistModal}
        onClose={() => setShowChecklistModal(false)}
        checklistItem={{
          activityId: itineraryEventActivity.id!,
          travelId: itineraryEventActivity.travelId,
          title: "",
          isDone: false,
          sortOrder: "0",
        } as ChecklistItem}
        activities={[itineraryEventActivity]}
        travelId={itineraryEventActivity.travelId!}
        onOpenNewGroupModal={() => setShowGroupModal(true)}
      />

      {/* Sibling Checklist Group creation sheet */}
      <ChecklistGroupModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        travelId={itineraryEventActivity.travelId!}
      />
    </Animated.View>
  );
};

export default ActivityItemCard;
