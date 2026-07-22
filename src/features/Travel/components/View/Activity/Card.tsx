import { MaterialIcons as Icon, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View
} from "react-native";
import ActivityIcon, { activityIcons } from "../../../../../components/ActivityIcon";
import { FadeInView } from "../../../../../components/animations";
import { useConfirm } from "../../../../../context/ConfirmContext";
import { useToast } from "../../../../../context/ToastContext";
import { useTravelContext } from "../../../../../context/TravelContext";
import { getActivityTypeLabel } from "../../../../../types/enums";
import { useUpdateActivityMutation } from "../../../hooks/useActivity";
import { ChecklistItem, ItineraryActivity, ItineraryExpense, ItineraryNote } from "../../../types/TravelDto";
import MapViewer from "../../MapViewer";
import ViewActivityModal from "./Modal";

interface ItineraryActivityProps {
  itineraryActivity: ItineraryActivity;
  isFirstItem?: boolean;
  isLastItem?: boolean;
  plainMode?: boolean;
  viewMode?: "plain" | "narrow" | "expanded";
  showDateText?: boolean;
  // Drag-to-reorder props
  index?: number;
  listLength?: number;
  onDragStart?: (index: number, height: number) => void;
  onDragEnd?: (fromIndex: number, toIndex: number, targetSectionId?: string | null) => void;
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
  showDateText = true,
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
  const [prevItineraryActivity, setPrevItineraryActivity] = useState<ItineraryActivity>(itineraryActivity);
  const [itineraryEventActivity, setItineraryEventActivity] =
    useState<ItineraryActivity>(itineraryActivity);

  if (itineraryActivity !== prevItineraryActivity) {
    setPrevItineraryActivity(itineraryActivity);
    setItineraryEventActivity(itineraryActivity);
  }
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const [showActivityViewModal, setShowActivityViewModal] =
    useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const {
    openExpenseModal,
    openNoteModal,
    openChecklistModal,
    openActivityModal,
  } = useTravelContext();
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

  if (isDragActive && !parentIsDragging) {
    pan.setValue({ x: 0, y: 0 });
    setIsDragActive(false);
    isDragActiveRef.current = false;
  }

  if (!parentIsDragging && lastTargetShift.current !== 0) {
    shiftAnim.setValue(0);
    lastTargetShift.current = 0;
  }

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

        // Smoothly scale down immediately on release
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(0.25, 1, 0.5, 1),
          useNativeDriver: false,
        }).start();

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
            duration: 800,
            easing: Easing.bezier(0.25, 1, 0.5, 1),
            useNativeDriver: false,
          }).start(() => {
            // Trigger the reorder, state update will clear parentIsDragging and trigger cleanup
            dragPropsRef.current.onDragEnd?.(
              currentIndex, 
              latestHoverIndex !== null && latestHoverIndex !== undefined ? latestHoverIndex : currentIndex,
              latestHoverSectionId
            );
          });
        } else {
          // Cancelled / released at same spot! Smoothly glide back to original slot using ease-in-out timing
          Animated.timing(pan, {
            toValue: { x: 0, y: 0 },
            duration: 800,
            easing: Easing.bezier(0.25, 1, 0.5, 1),
            useNativeDriver: false,
          }).start(() => {
            dragPropsRef.current.onDragEnd?.(currentIndex, currentIndex, latestDragSectionId);
          });
        }
      },
      onPanResponderTerminate: () => {
        if (dragTimer.current) {
          clearTimeout(dragTimer.current);
          dragTimer.current = null;
        }
        const { index: currentIndex, dragSectionId: latestDragSectionId } = dragPropsRef.current;
        // Smoothly scale down immediately on termination
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(0.25, 1, 0.5, 1),
          useNativeDriver: false,
        }).start();
        // Smoothly glide back to original slot on termination using ease-in-out timing
        Animated.timing(pan, {
          toValue: { x: 0, y: 0 },
          duration: 800,
          easing: Easing.bezier(0.25, 1, 0.5, 1),
          useNativeDriver: false,
        }).start(() => {
          dragPropsRef.current.onDragEnd?.(currentIndex, currentIndex, latestDragSectionId);
        });
      },
    })
  ).current;

  const handleLongPress = () => {
    if (!onDragStart || !onDragEnd) return;
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

  const animatedCardStyle = {
    transform: [
      { translateY: shiftAnim },
      ...(dragEnabled ? pan.getTranslateTransform() : []),
      ...(dragEnabled ? [{ scale: scaleAnim }] : []),
    ] as any,
    zIndex: isDragActive ? 9999 : 1,
    elevation: isDragActive ? 10 : 1,
  };

  const getActivityTypeDetails = (type: any) => {
    if (type == null) return { text: "None", color: "#9E9E9E" };
    const iconConfig = activityIcons.find((i) => i.activityType === type);
    const color = iconConfig?.color ?? "#9E9E9E";
    const text = type != null ? getActivityTypeLabel(type) : "None";
    return { text, color };
  };



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
    setShowActivityViewModal(true);
  };

  if (plainMode) {
    return (
      <View className="flex-row items-center px-3 py-1">
        <View className="z-10 items-center justify-center mr-3">
          <Ionicons name="pin" size={18} color="#dc3545" />
        </View>
        <Text className="text-base text-secondary flex-1" numberOfLines={1}>
          {itineraryEventActivity.title}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        animatedCardStyle,
        viewMode === 'expanded' ? { paddingBottom: 16 } : undefined
      ]}
      {...(dragEnabled ? panResponder.panHandlers : {})}
      onLayout={(e) => {
        const { height } = e.nativeEvent.layout;
        if (height && height > 0) {
          setCardHeight(height);
        }
      }}
    >

    {showDateText && itineraryEventActivity.startDate ? (
      <Text className="text-sm font-bold absolute px-2 left-1">
        {new Date(itineraryEventActivity.startDate).toLocaleDateString([], { day: 'numeric', month: 'short' })}
      </Text>
    ) : null}

      <View className={`px-2 flex-row justify-between items-center relative  pl-6xl   `}>
        {!isDragActive && (
          <>
            {/* {isLastItem ? (
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
            )} */}

                  {/* <View className={`absolute h-1/2 w-1px top-1/2 ${viewMode === 'narrow' ? 'left-[29px]' : 'left-4xl'} z-0 border-l border-dashed border-gray-300`}></View> */}

            <Text className="text-xs font-medium text-gray-400 absolute left-xl text-right">
              {(() => {
                if (!itineraryEventActivity.startDate) return null;
                const d = new Date(itineraryEventActivity.startDate);
                let hours = d.getHours();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // Map '0' to '12'
                const hoursStr = hours < 10 ? '0' + hours : hours.toString();
                const minutes = d.getMinutes();
                const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
                return `${hoursStr}:${minutesStr}\n${ampm}`;
              })()}
            </Text>

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
              className="z-999 items-center justify-center bg-gray-200 border-3 border-gray-100 rounded-full "
            >
              <ActivityIcon
                type={itineraryEventActivity.type!}
                size={viewMode === 'narrow' ? 16 : 20}
                isViewModeNarrow={viewMode === 'narrow'}
              />
            </TouchableOpacity>
         
          </>
        )}

        {(!isDragActive && !parentIsDragging && isLastItem) && viewMode === 'expanded' && (
        <TouchableHighlight 
          underlayColor={"none"}
          className={`absolute h-6xl w-6xl bottom-[-30px] left-[12px] z-9999 `} //TODO: apply to last item for now, later show this to cards between
          onPress={() => openActivityModal(null, itineraryActivity.sectionId || undefined)}
          onShowUnderlay={() => setIsAddPressed(true)}
          onHideUnderlay={() => setIsAddPressed(false)}
          accessibilityRole="button"
            accessibilityLabel="Add activity"
          >
            <View
                className={`${isAddPressed ? 'bg-[#183B7A] rounded-md' : ' rounded-md bg-white '} border-gray-300  left-[37px] absolute m-2 mt-2xl border px-1px z-9999`}
            >
            <Icon name="add" size={20} color={`${isAddPressed ? '#263F69' : '#999'}`}/>
            </View>
          </TouchableHighlight>
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
           className={`flex-1 grow ml-3 `}
          >
             <FadeInView type="right" delay={100} duration={350}
             className={`border border-solid border-[#e0e0e0] rounded-xl ${
              itineraryEventActivity.isDone
                ? "opacity-50 border border-success-700 bg-success-25"
                : "bg-white"
            } 
            ${
              isNarrow ? "my-2 p-2" : (viewMode === 'expanded' ? "mt-4 mb-0 p-2.5" : "my-4 p-2.5")
            }  ${isDragActive ? "opacity-100 shadow-2xl" : ""}` }>
            <View className={`flex-row items-center  ${itineraryEventActivity.startDate ? 'gap-2' : ''}`}>
            {itineraryEventActivity.type !== undefined && itineraryEventActivity.type !== null && (
                  <View 
                    style={{ backgroundColor: getActivityTypeDetails(itineraryEventActivity.type).color + '10' }} 
                    className="items-end rounded-xs px-2 py-0.5"
                  >
                    <Text 
                      style={{ color: getActivityTypeDetails(itineraryEventActivity.type).color }} 
                      className="text-[8px] tracking-wider uppercase font-extrabold"
                    >
                      {getActivityTypeDetails(itineraryEventActivity.type).text}
                    </Text>
                  </View>
                )}
                {/* {itineraryEventActivity.startDate ? (
                  <View className="flex-row gap-1">
                    <Text className="text-xs font-bold text-[#000] ">
                        {itineraryEventActivity.startDate && new Date(itineraryEventActivity.startDate).toLocaleDateString([], { weekday: 'long' })}
                    </Text> 
                    <Text className="text-xs font-bold text-[#000] ">
                        {itineraryEventActivity.startDate && new Date(itineraryEventActivity.startDate).toLocaleDateString([], { day: 'numeric', month: 'short' })} |
                    </Text>
                    <Text className="text-xs font-semibold text-[#606060] ">
                        {itineraryEventActivity.startDate && new Date(itineraryEventActivity.startDate).toLocaleTimeString([], { hour: '2-digit', minute:   '2-digit' })}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xs font-semibold text-tertiary/50 ">
                    Date not set
                  </Text>
                )} */}
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
                    <Text className={`text-lg font-medium mt-1 text-secondary leading-5 flex-1 wrap-break-word ${isNarrow ? 'pr-3xl' : ''}`} numberOfLines={isNarrow || itineraryEventActivity.isDone ? 1 : 0}>
                        {itineraryEventActivity.title}
                    </Text>
                  </View>
                  {!isNarrow && !itineraryEventActivity.isDone && itineraryEventActivity && itineraryEventActivity.destination && itineraryEventActivity.destinationData?.coordinates && (
                    <View 
                      className="flex-row items-center text-ellipsis rounded-sm w-[80%] -mt-xxs"
                    >
                      <Icon name="location-pin" size={14} color={"#B42318"} />
                      <Text className="text-base text-tertiary "
                      ellipsizeMode="tail"
                      numberOfLines={1}>
                        {itineraryEventActivity.destination}
                      </Text>
                    </View>
                  )} 

                  {!isNarrow && !itineraryEventActivity.isDone && itineraryEventActivity.description && (
                    <Text className="text-sm text-tertiary  mt-2 
                    mb-4" 
                      numberOfLines={2}
                      ellipsizeMode="tail">
                      {itineraryEventActivity.description} 
                    </Text>
                  )}
              </View>
            </View>
            
            
            {!isNarrow && (
              <View className="flex-row justify-between items-center  border-gray-200 pt-1.5 ">
                <View className="flex-row items-center mt-1 flex-wrap gap-5 hidden">
                  <TouchableOpacity
                    onPress={() => {
                      openExpenseModal(
                        {
                          activityId: itineraryEventActivity.id!,
                          travelId: itineraryEventActivity.travelId,
                          title: "",
                          amount: 0,
                          dateTime: new Date(),
                        } as ItineraryExpense,
                        itineraryEventActivity.id!,
                        [itineraryEventActivity]
                      );
                    }}
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
                    onPress={() => {
                      openChecklistModal(
                        {
                          activityId: itineraryEventActivity.id!,
                          travelId: itineraryEventActivity.travelId,
                          title: "",
                          isDone: false,
                          sortOrder: "0",
                        } as ChecklistItem,
                        [itineraryEventActivity],
                        itineraryEventActivity.travelId!
                      );
                    }}
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
                    onPress={() => {
                      openNoteModal(
                        {
                          activityId: itineraryEventActivity.id!,
                          travelId: itineraryEventActivity.travelId,
                          title: "",
                        } as ItineraryNote,
                        [itineraryEventActivity]
                      );
                    }}
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

            <View className={`absolute right-2  ${isNarrow ? "top-[50%]" : "bottom-2"}`}>
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
                      : (<Icon name="check-box-outline-blank" size={24} color="#D0D5DD" />)}
              </TouchableOpacity>
          </View>
        </FadeInView>
          </TouchableOpacity>
       
      </View>

     {isAddPressed && (
        <View className="w-[80%] rounded-full left-7xl absolute bottom-[2px]">
          <View className="flex-1 h-xxs bg-[#183B7A] rounded-full z-40" />
          <View className="w-2.5 h-2.5 rounded-full bg-[#183B7A] border-2 border-white shadow-sm z-50 absolute right-0 -bottom-1" />
        </View>
      )}
      
      <ViewActivityModal
        id={itineraryEventActivity.id!}
        travelId={itineraryEventActivity.travelId}
        showModal={showActivityViewModal}
        setShowModal={setShowActivityViewModal}
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
    </Animated.View>
  );
};

export default ActivityItemCard;
