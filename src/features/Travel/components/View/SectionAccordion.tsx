import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Animated, LayoutAnimation, Dimensions, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import Accordion from "../../../../components/Accordion";
import ActivityItemCard from "./Activity/Card";
import DraggableSectionContainer from "../Edit/Itinerary/DraggableSectionContainer";
import { ItineraryActivity, ItinerarySection } from "../../../Travel/types/TravelDto";
import { ActivityType } from "../../../../types/enums";
import { useLexicographicSort } from "../../../../hooks/useLexicographicSort";
import { updateActivitySortOrderLocally, updateSectionSortOrderLocally } from "../../../../services/local/travelService";
import { useToast } from "../../../../context/ToastContext";
import ActivityIcon from "../../../../components/ActivityIcon";

interface SectionAccordionProps {
  iterarysections?: ItinerarySection[];
  plainMode?: boolean;
  scrollEnabled?: boolean;
  onScrollY?: (y: number) => void;
  viewMode?: "plain" | "narrow" | "expanded";
}

const slowSpringAnimation = {
  duration: 1000,
  create: {
    type: LayoutAnimation.Types.spring,
    property: LayoutAnimation.Properties.opacity,
    springDamping: 0.2,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.2,
  },
  delete: {
    type: LayoutAnimation.Types.spring,
    property: LayoutAnimation.Properties.opacity,
    springDamping: 0.2,
  },
};

const sortActivities = (activities?: ItineraryActivity[]) => {
  if (!activities) return [];
  return [...activities].sort((a, b) =>
    (a.sortOrder || "").localeCompare(b.sortOrder || "")
  );
};

interface DraggableSectionItemProps {
  key?: string;
  section: ItinerarySection;
  mapIndex: number;
  subSectionsLength: number;
  masterDragState: { isDragging: boolean; dragIndex: number | null };
  masterHoverState: { index: number } | null;
  sections: ItinerarySection[];
  onMasterDragStart: (index: number) => void;
  onMasterDragMove: (currentIndex: number, dy: number, moveY: number) => void;
  onMasterDragEnd: (fromIndex: number, toIndex: number) => void;
  sectionDragState: { sectionId: string; isDragging: boolean; dragIndex: number | null } | null;
  masterSectionRefs: React.MutableRefObject<Record<string, any>>;
  masterSectionBounds: React.MutableRefObject<Record<string, { pageY: number; height: number }>>;
  renderActivityCards: (section: ItinerarySection, activities: ItineraryActivity[]) => React.ReactNode;
  sectionRefs: React.MutableRefObject<Record<string, any>>;
  viewMode?: "plain" | "narrow" | "expanded";
}

const DraggableSectionItem = ({
  section,
  mapIndex,
  subSectionsLength,
  masterDragState,
  masterHoverState,
  sections,
  onMasterDragStart,
  onMasterDragMove,
  onMasterDragEnd,
  sectionDragState,
  masterSectionRefs,
  masterSectionBounds,
  renderActivityCards,
  sectionRefs,
  viewMode,
}: DraggableSectionItemProps) => {
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const lastTargetShift = useRef(0);

  useEffect(() => {
    if (!masterDragState.isDragging || masterDragState.dragIndex === null) {
      shiftAnim.setValue(0);
      lastTargetShift.current = 0;
      return;
    }

    const dragIndex = masterDragState.dragIndex;
    const hoverIndex = masterHoverState?.index ?? dragIndex;
    let targetShift = 0;

    if (dragIndex !== mapIndex) {
      const subSections = sections.filter(s => s.isDefaultSection === false);
      const draggedSection = subSections[dragIndex];
      const draggedHeight = draggedSection
        ? (masterSectionBounds.current[draggedSection.id || ""]?.height ?? 180)
        : 180;

      if (dragIndex < hoverIndex) {
        if (mapIndex > dragIndex && mapIndex <= hoverIndex) {
          targetShift = -draggedHeight;
        }
      } else if (dragIndex > hoverIndex) {
        if (mapIndex >= hoverIndex && mapIndex < dragIndex) {
          targetShift = draggedHeight;
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
  }, [masterDragState.isDragging, masterDragState.dragIndex, masterHoverState?.index, mapIndex, sections]);

  const isThisSectionDragging = masterDragState.isDragging && masterDragState.dragIndex === mapIndex;

  const dragIndex = masterDragState.dragIndex;
  const hoverIndex = masterHoverState?.index ?? dragIndex;
  const subSections = sections.filter(s => s.isDefaultSection === false);
  const draggedSection = dragIndex !== null && dragIndex !== undefined ? subSections[dragIndex] : null;
  const draggedHeight = draggedSection
    ? (masterSectionBounds.current[draggedSection.id || ""]?.height ?? 180)
    : 180;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: shiftAnim }],
        flex: 1,
        zIndex: isThisSectionDragging ? 9999 : 1,
        // elevation: isThisSectionDragging ? 10 : 1,
      }}
    >
      <DraggableSectionContainer
        key={section.id}
        index={mapIndex}
        listLength={subSectionsLength}
        onDragStart={onMasterDragStart}
        onDragMove={onMasterDragMove}
        onDragEnd={onMasterDragEnd}
        isChildActive={sectionDragState?.sectionId === section.id}
        disableOpacity={true}
        dragIndex={dragIndex}
        hoverIndex={hoverIndex}
        draggedHeight={draggedHeight}
        isDragging={masterDragState.isDragging}
      >
        {(panHandlers, isSectionActive) => (
          <View
            className="relative flex-1 py-2"
            collapsable={false}
            ref={(ref) => {
              if (ref && section.id) masterSectionRefs.current[section.id] = ref;
            }}
          >
            {masterHoverState?.index === mapIndex && (masterDragState.dragIndex ?? -1) > mapIndex && (
              <View className="absolute -top-[10px] left-[22px] right-[12px] flex-row items-center z-50">
                <View className="w-2.5 h-2.5 rounded-full bg-[#183B7A] border-2 border-white shadow-sm z-50" />
                <View className="flex-1 h-[2px] bg-[#183B7A] rounded-full z-40 " />
              </View>
            )}

            {masterHoverState?.index === mapIndex && (masterDragState.dragIndex ?? -1) < mapIndex && (
              <View className="absolute -bottom-[10px] left-[22px] right-[12px] flex-row items-center z-50">
                <View className="w-2.5 h-2.5 rounded-full bg-[#183B7A] border-2 border-white shadow-sm z-50" />
                <View className="flex-1 h-[2px] bg-[#183B7A] rounded-full z-40 " />
              </View>
            )}

            {/* <View
              className="absolute left-3 top-xl z-50 flex-row items-center justify-center w-[30px] h-[30px]"
              {...panHandlers}
            >
              <Ionicons name="menu" size={22} color={isSectionActive ? "#183B7A" : "#999"} />
            </View> */}

            <Accordion
              title={
                <Text style={{ marginLeft: 30 }} className=" text-lg font-semibold text-[#333] underline">
                  {section.startDate && (
                    <Text className="text-[#999]">
                      {`${new Date(section.startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })} `}
                    </Text>
                  )}
                  {section.title}
                </Text>
              }
              headerStyle={{ backgroundColor: "#FFF", paddingStart: 14 }}
              containerStyle={
                isSectionActive
                  ? {
                      borderColor: "#D0D5DD",
                      borderWidth: 1.5,
                      elevation: 10,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 10 },
                      shadowOpacity: 0.15,
                      shadowRadius: 15,
                      backgroundColor: "#FFFFFF",
                    }
                  : undefined
              }
            >
              
              {section.description && section.description.trim() !== "" && (
                <View className="bg-white flex-1 p-2 z-100">
                  <Text className="text-sm text-[#555] leading-5 p-2 pt-0">
                  {section.description}
                </Text>
                </View>
              )}

              <View
                style={{ backgroundColor: "#FFF", paddingBottom: 20, paddingEnd: 5}}
                collapsable={false}
                ref={(ref) => {
                  if (ref && section.id) sectionRefs.current[section.id] = ref;
                }}
              >
            
            
              <View className={`absolute h-full w-1px  border-l border-dashed border-[#ccc] ${viewMode === "narrow" ? "left-[28px]" : "left-4xl"}`}></View>

                {section.itineraryActivity && section.itineraryActivity.length > 0 ? (
                  renderActivityCards(section, section.itineraryActivity)
                ) : (
                    <Text className="text-sm text-[#555] leading-5 p-2 text-center">
                      No activities found
                    </Text>
                  )}
              </View>
            </Accordion>
          </View>
        )}
      </DraggableSectionContainer>
    </Animated.View>
  );
};

const SectionAccordion = ({
  iterarysections,
  plainMode,
  scrollEnabled = false,
  onScrollY,
  viewMode,
}: SectionAccordionProps) => {
  const { generateSortOrder } = useLexicographicSort();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // --- Local mutable sections state ---
  const [sections, setSections] = useState<ItinerarySection[]>([]);

  useEffect(() => {
    if (!iterarysections) return;
    setSections(
      [...iterarysections]
        .sort((a, b) => {
          if (a.isDefaultSection && !b.isDefaultSection) return -1;
          if (!a.isDefaultSection && b.isDefaultSection) return 1;
          return (a.sortOrder || "").localeCompare(b.sortOrder || "");
        })
        .map((section) => ({
          ...section,
          itineraryActivity: sortActivities(section.itineraryActivity),
        }))
    );
  }, [iterarysections]);

  // --- Drag state ---
  const [sectionDragState, setSectionDragState] = useState<{
    sectionId: string;
    isDragging: boolean;
    dragIndex: number | null;
    draggedHeight?: number;
  } | null>(null);
  const [hoverState, setHoverState] = useState<{ sectionId: string | null; index: number } | null>(null);

  // --- Master Section Drag State ---
  const [masterDragState, setMasterDragState] = useState<{
    isDragging: boolean;
    dragIndex: number | null;
  }>({ isDragging: false, dragIndex: null });
  const [masterHoverState, setMasterHoverState] = useState<{ index: number } | null>(null);

  // --- Refs ---
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const initialScrollY = useRef(0);
  const dragMoveY = useRef(0);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const sectionRefs = useRef<Record<string, any>>({});
  const sectionBounds = useRef<Record<string, { pageY: number; height: number }>>({});

  const masterSectionRefs = useRef<Record<string, any>>({});
  const masterSectionBounds = useRef<Record<string, { pageY: number; height: number }>>({});

  const sectionsRef = useRef(sections);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  const sectionDragStateRef = useRef(sectionDragState);
  useEffect(() => { sectionDragStateRef.current = sectionDragState; }, [sectionDragState]);

  const masterDragStateRef = useRef(masterDragState);
  useEffect(() => { masterDragStateRef.current = masterDragState; }, [masterDragState]);

  const masterHoverStateRef = useRef(masterHoverState);
  useEffect(() => { masterHoverStateRef.current = masterHoverState; }, [masterHoverState]);

  // --- Master Section Drag handlers ---
  const handleMasterSectionDragStart = (index: number) => {
    initialScrollY.current = scrollOffset.current;
    Object.entries(masterSectionRefs.current).forEach(([idStr, ref]) => {
      if (ref && ref.measure) {
        ref.measure((_x: number, _y: number, _width: number, height: number, _pageX: number, pageY: number) => {
          masterSectionBounds.current[idStr] = { pageY, height };
        });
      }
    });
    setMasterDragState({ isDragging: true, dragIndex: index });
  };

  const computeMasterSectionIntersection = (moveY: number) => {
    let targetIndex = masterDragStateRef.current.dragIndex ?? 0;
    const scrollDelta = scrollOffset.current - initialScrollY.current;

    const subSections = sectionsRef.current.filter(s => s.isDefaultSection === false);

    let foundIntersection = false;
    for (let i = 0; i < subSections.length; i++) {
      const sec = subSections[i];
      const bounds = masterSectionBounds.current[sec.id || ""];
      if (bounds) {
        // Expand bounding hitboxes slightly (+/- 20px padding) to eliminate coordinate gaps/dead-zones
        const shiftedTop = bounds.pageY - scrollDelta - 20;
        const shiftedBottom = shiftedTop + bounds.height + 40;

        if (moveY >= shiftedTop && moveY <= shiftedBottom) {
          targetIndex = i;
          foundIntersection = true;
          break;
        }
      }
    }

    if (foundIntersection) {
      setMasterHoverState((prev) => {
        if (prev?.index === targetIndex) return prev;
        return { index: targetIndex };
      });
    }
  };

  const handleMasterSectionDragMove = (currentIndex: number, dy: number, moveY?: number) => {
    if (moveY) {
      dragMoveY.current = moveY;
      const { height: screenHeight } = Dimensions.get("window");
      const topBoundary = 150;
      const bottomBoundary = screenHeight - 150;

      if (moveY < topBoundary || moveY > bottomBoundary) {
        if (!autoScrollInterval.current) {
          autoScrollInterval.current = setInterval(() => {
            const y = dragMoveY.current;
            const scrollSpeed = 15;
            let increment = 0;

            if (y < topBoundary) {
              increment = -scrollSpeed;
            } else if (y > bottomBoundary) {
              increment = scrollSpeed;
            } else {
              if (autoScrollInterval.current) {
                clearInterval(autoScrollInterval.current);
                autoScrollInterval.current = null;
              }
              return;
            }

            const newScrollY = Math.max(0, scrollOffset.current + increment);
            scrollViewRef.current?.scrollTo({ y: newScrollY, animated: false });
            scrollOffset.current = newScrollY;

            computeMasterSectionIntersection(y);
          }, 16);
        }
      } else {
        if (autoScrollInterval.current) {
          clearInterval(autoScrollInterval.current);
          autoScrollInterval.current = null;
        }
      }

      computeMasterSectionIntersection(moveY);
    }
  };

  const handleMasterSectionDragEnd = (fromIndex: number, _toIndex: number) => {
    const finalToIndex = _toIndex !== undefined && _toIndex !== null ? _toIndex : (masterHoverStateRef.current?.index ?? fromIndex);

    setMasterDragState({ isDragging: false, dragIndex: null });
    setMasterHoverState(null);
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }

    if (fromIndex === finalToIndex) {
      // Unchanged position! Skip save and toast.
      return;
    }

    if (sections) {
      // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const defaultSections = sections.filter(s => s.isDefaultSection === true);
      const subSections = sections.filter(s => s.isDefaultSection === false);

      const [moved] = subSections.splice(fromIndex, 1);
      subSections.splice(finalToIndex, 0, moved);

      const prevSortOrder = subSections[finalToIndex - 1]?.sortOrder;
      const nextSortOrder = subSections[finalToIndex + 1]?.sortOrder;

      const newSortOrder = generateSortOrder(prevSortOrder, nextSortOrder);
      moved.sortOrder = newSortOrder;

      setSections([...defaultSections, ...subSections]);

      if (moved.id) {
        updateSectionSortOrderLocally(moved.id, newSortOrder).then(() => {
          queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
          showToast({
            type: "success",
            message: "Section order updated successfully!",
          });
        });
      }
    }
  };

  // --- Drag handlers ---
  const handleSectionActivityDragStart = (sectionId: string, index: number, height: number) => {
    initialScrollY.current = scrollOffset.current;
    Object.entries(sectionRefs.current).forEach(([idStr, ref]) => {
      if (ref && ref.measure) {
        ref.measure((_x: number, _y: number, _width: number, height: number, _pageX: number, pageY: number) => {
          sectionBounds.current[idStr] = { pageY, height };
        });
      }
    });
    setSectionDragState({ sectionId, isDragging: true, dragIndex: index, draggedHeight: height });
  };

  const computeIntersection = (moveY: number) => {
    let targetSectionId = sectionDragStateRef.current?.sectionId || null;
    let targetIndex = 0;
    const scrollDelta = scrollOffset.current - initialScrollY.current;

    let foundIntersection = false;
    for (const [idStr, bounds] of Object.entries(sectionBounds.current) as [string, { pageY: number; height: number }][]) {
      const id = idStr;
      const shiftedTop = bounds.pageY - scrollDelta;
      const shiftedBottom = shiftedTop + bounds.height;

      if (moveY >= shiftedTop - 40 && moveY <= shiftedBottom + 40) {
        targetSectionId = id;
        const relY = moveY - shiftedTop;
        const newTargetIndex = Math.max(0, Math.floor(relY / 110));

        const targetSection = sectionsRef.current?.find(s => s.id === id);
        const targetLen = targetSection?.itineraryActivity?.length || 0;
        targetIndex = Math.max(0, Math.min(newTargetIndex, targetLen));
        foundIntersection = true;
        break;
      }
    }

    if (foundIntersection) {
      setHoverState(prev => {
        if (prev?.sectionId === targetSectionId && prev?.index === targetIndex) return prev;
        return { sectionId: targetSectionId, index: targetIndex };
      });
    }
  };

  const handleDragMove = (
    _currentIndex: number,
    _dy: number,
    _listLength: number,
    moveY?: number,
  ) => {

    if (moveY) {
      dragMoveY.current = moveY;
      const { height: screenHeight } = Dimensions.get("window");
      const topBoundary = 150;
      const bottomBoundary = screenHeight - 150;

      if (moveY < topBoundary || moveY > bottomBoundary) {
        if (!autoScrollInterval.current) {
          autoScrollInterval.current = setInterval(() => {
            const y = dragMoveY.current;
            const scrollSpeed = 15;
            let increment = 0;

            if (y < topBoundary) {
              increment = -scrollSpeed;
            } else if (y > bottomBoundary) {
              increment = scrollSpeed;
            } else {
              if (autoScrollInterval.current) {
                clearInterval(autoScrollInterval.current);
                autoScrollInterval.current = null;
              }
              return;
            }

            const newScrollY = Math.max(0, scrollOffset.current + increment);
            scrollViewRef.current?.scrollTo({ y: newScrollY, animated: false });
            scrollOffset.current = newScrollY;

            computeIntersection(y);
          }, 16);
        }
      } else {
        if (autoScrollInterval.current) {
          clearInterval(autoScrollInterval.current);
          autoScrollInterval.current = null;
        }
      }

      computeIntersection(moveY);
    }
  };

  const handleSectionActivityDragEnd = (
    sourceSectionId: string,
    activity: ItineraryActivity,
    fromIndex: number,
    _toIndex: number,
  ) => {

    const targetSectionId = hoverState?.sectionId ?? sourceSectionId;
    const toIndex = hoverState?.index ?? fromIndex;

    if (targetSectionId === sourceSectionId && toIndex === fromIndex) {
      // Position did not change! Just reset drag state and do not save or show toast
      // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSectionDragState(null);
      setHoverState(null);
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
        autoScrollInterval.current = null;
      }
      return;
    }

    // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSections((prevSections) => {
      let movedActivity: ItineraryActivity | null = null;
      // 1. Remove from source section
      const afterRemoval = prevSections.map((section) => {
        if (section.id === sourceSectionId && section.itineraryActivity) {
          const newActivities = [...section.itineraryActivity];
          movedActivity = newActivities.splice(fromIndex, 1)[0];
          return { ...section, itineraryActivity: newActivities };
        }
        return section;
      });

      // 2. Insert into target section
      if (movedActivity) {
        const updatedActivity = { ...movedActivity, sectionId: targetSectionId };

        const finalSections = afterRemoval.map((section) => {
          if (section.id === targetSectionId) {
            const newActivities = [...(section.itineraryActivity || [])];
            const safeToIndex = Math.min(toIndex, newActivities.length);

            newActivities.splice(safeToIndex, 0, updatedActivity);

            const previousNeighbor = newActivities[safeToIndex - 1] ?? null;
            const nextNeighbor = newActivities[safeToIndex + 1] ?? null;

            const newSortOrder = generateSortOrder(
              previousNeighbor?.sortOrder,
              nextNeighbor?.sortOrder
            );

            updatedActivity.sortOrder = newSortOrder;

            if (updatedActivity.id) {
              updateActivitySortOrderLocally(
                updatedActivity.id,
                newSortOrder,
                targetSectionId !== sourceSectionId ? targetSectionId : undefined
              ).then(() => {
                queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
                showToast({
                  type: "success",
                  message: "Activity order updated!",
                });
              });
            }

            return { ...section, itineraryActivity: newActivities };
          }
          return section;
        });

        return finalSections;
      }

      return afterRemoval;
    });

    setSectionDragState(null);
    setHoverState(null);
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  // --- Render helpers ---
  const renderActivityCards = (
    section: ItinerarySection,
    activities: ItineraryActivity[],
  ) => {
    return activities.map((eventActivity, index, array) => {
      const isFirstEvent = index === 0;
      const isLastEvent = array.length - 1 === index;

      return (
        <View
          key={eventActivity.id || index}
          className="relative"
          style={{
            zIndex:
              sectionDragState?.sectionId === section.id &&
              sectionDragState?.dragIndex === index
                ? 9999
                : 1,
            elevation:
              sectionDragState?.sectionId === section.id &&
              sectionDragState?.dragIndex === index
                ? 10
                : 1,
          }}
        >
          {/* Hover indicator above */}
          {hoverState?.index === index &&
            hoverState?.sectionId === section.id &&
            (sectionDragState?.sectionId !== section.id ||
              (sectionDragState?.dragIndex !== index &&
                (sectionDragState?.dragIndex ?? -1) > index)) && (
              <View className="absolute -top-[5px] left-[28px] right-[16px] flex-row items-center z-50">
                <View className="w-2.5 h-2.5 rounded-full bg-[#183B7A] border-2 border-white shadow-sm z-50" />
                <View className="flex-1 h-[2px] bg-[#183B7A] rounded-full z-40 -ml-[1px]" />
              </View>
            )}

          <ActivityItemCard
            itineraryActivity={eventActivity}
            isFirstItem={isFirstEvent}
            isLastItem={isLastEvent}
            plainMode={plainMode}
            viewMode={viewMode}
            index={index}
            listLength={array.length}
            onDragStart={(idx: number, h: number) =>
              handleSectionActivityDragStart(section.id || "", idx, h)
            }
            onDragEnd={(fromIdx: number, _toIdx: number) =>
              handleSectionActivityDragEnd(
                section.id || "",
                eventActivity,
                fromIdx,
                0,
              )
            }
            onDragMove={(currentIndex, dy, moveY) =>
              handleDragMove(
                currentIndex,
                dy,
                array.length,
                moveY
              )
            }
            isDragging={!!sectionDragState?.isDragging}
            dragIndex={
              sectionDragState?.sectionId != undefined &&
              sectionDragState?.sectionId === section.id
                ? sectionDragState.dragIndex
                : null
            }
            dragSectionId={sectionDragState?.sectionId}
            hoverSectionId={hoverState?.sectionId}
            hoverIndex={hoverState?.index}
            draggedHeight={sectionDragState?.draggedHeight}
          />

          {/* Hover indicator below */}
          {hoverState?.index === index &&
            hoverState?.sectionId === section.id &&
            sectionDragState?.sectionId === section.id &&
            sectionDragState?.dragIndex !== index &&
            (sectionDragState?.dragIndex ?? -1) < index && (
              <View className="absolute -bottom-[5px] left-[28px] right-[16px] flex-row items-center z-50">
                <View className="w-2.5 h-2.5 rounded-full bg-[#183B7A] border-2 border-white shadow-sm z-50" />
                <View className="flex-1 h-[2px] bg-[#183B7A] rounded-full z-40 -ml-[1px]" />
              </View>
            )}
        </View>
      );
    });
  };

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        ref={scrollViewRef}
        onScroll={(e) => {
          scrollOffset.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        className="flex-1"
        scrollEnabled={!sectionDragState?.isDragging && !masterDragState.isDragging}
      >
        <View className="flex-1 p-3">
          {sections &&
            sections.map((section, index) => {
              const isDefaultSection = section.isDefaultSection;
              if (isDefaultSection) {
                return (
                  <View
                    key={section.id}
                    collapsable={false}
                    ref={(ref) => {
                      if (ref && section.id) sectionRefs.current[section.id] = ref;
                    }}
                  >
                    {section.itineraryActivity &&
                      renderActivityCards(section, section.itineraryActivity)}
                    <View className={`absolute top-5xl h-full w-1px ${viewMode === 'narrow' ? 'left-[29px]' : 'left-4xl'} z-0 border-l border-dashed border-[#ccc]`}></View>
           
                  </View>
                );
              } else if (plainMode) {
                return (
                  <View key={section.id} className="mb-2">
                    <View className="flex-row items-center gap-2 py-3">
                      <Ionicons name="chevron-forward" size={18} color="#000000" />
                      {section.startDate ? (
                        <Text>
                          {section.title}
                        </Text>
                      ) : (
                        <Text>{section.title}</Text>
                      )}
                    </View>
                    
                    {section.itineraryActivity && section.itineraryActivity.length > 0 ? (
                      section.itineraryActivity.map(
                        (eventActivity, index, array) => {
                          return (
                            <View key={index} className="ml-8 p-1 flex-row gap-x-3 items-center">
                              <Ionicons name="location" size={18} color="#dc3545" />
                              <Text>{eventActivity.title}</Text>
                            </View>
                          );
                        }
                      )) : (
                        <Text className="text-sm text-[#555] leading-5 p-1 opacity-50 ml-8 ">
                          No activities found
                        </Text>
                      )}
                  </View>
                );
              } else {
                const subSections = sections.filter(s => s.isDefaultSection === false);
                const mapIndex = subSections.findIndex(s => s.id === section.id);
                const subSectionsLength = subSections.length;
                return (
                  <View>
                    <View className={`absolute top-5xl h-full w-1px  z-0 border-l border-dashed border-[#ccc] ${viewMode === "narrow" ? "left-[29px]" : "left-[33px]"}`}></View>

                  <DraggableSectionItem
                    key={section.id}
                    section={section}
                    mapIndex={mapIndex}
                    subSectionsLength={subSectionsLength}
                    masterDragState={masterDragState}
                    masterHoverState={masterHoverState}
                    sections={sections}
                    onMasterDragStart={handleMasterSectionDragStart}
                    onMasterDragMove={handleMasterSectionDragMove}
                    onMasterDragEnd={handleMasterSectionDragEnd}
                    sectionDragState={sectionDragState}
                    masterSectionRefs={masterSectionRefs}
                    masterSectionBounds={masterSectionBounds}
                    renderActivityCards={renderActivityCards}
                    sectionRefs={sectionRefs}
                    viewMode={viewMode}
                  />
                  </View>
                );
              }
            })}


            <View className="flex-1 p-2 ml-xl mt-xl  bg-red-200 w-4xl h-4xl rounded-full">
              <ActivityIcon
                  type={ActivityType.borderCrossing}
                  size={20}
                  showIconOnly={true}
                />
            </View>
           
        </View>
      </ScrollView>
    </View>
  );
};

export default SectionAccordion;
