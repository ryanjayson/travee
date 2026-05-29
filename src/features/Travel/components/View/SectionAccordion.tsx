import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Animated, LayoutAnimation, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import Accordion from "../../../../components/Accordion";
import ActivityItemCard from "./Activity/Card";
import { ItineraryActivity, ItinerarySection } from "../../../Travel/types/TravelDto";
import { ActivityType } from "../../../../types/enums";
import { useLexicographicSort } from "../../../../hooks/useLexicographicSort";
import { updateActivitySortOrderLocally } from "../../../../services/local/travelService";
import { useToast } from "../../../../context/ToastContext";

interface SectionAccordionProps {
  iterarysections?: ItinerarySection[];
  plainMode?: boolean;
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

const SectionAccordion = ({ iterarysections, plainMode }: SectionAccordionProps) => {
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
  } | null>(null);
  const [hoverState, setHoverState] = useState<{ sectionId: string | null; index: number } | null>(null);

  // --- Refs ---
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const initialScrollY = useRef(0);
  const dragMoveY = useRef(0);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const sectionRefs = useRef<Record<string, any>>({});
  const sectionBounds = useRef<Record<string, { pageY: number; height: number }>>({});

  const sectionsRef = useRef(sections);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  const sectionDragStateRef = useRef(sectionDragState);
  useEffect(() => { sectionDragStateRef.current = sectionDragState; }, [sectionDragState]);

  // --- Drag handlers ---
  const handleSectionActivityDragStart = (sectionId: string, index: number) => {
    initialScrollY.current = scrollOffset.current;
    Object.entries(sectionRefs.current).forEach(([idStr, ref]) => {
      if (ref && ref.measure) {
        ref.measure((_x: number, _y: number, _width: number, height: number, _pageX: number, pageY: number) => {
          sectionBounds.current[idStr] = { pageY, height };
        });
      }
    });
    setSectionDragState({ sectionId, isDragging: true, dragIndex: index });
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
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSectionDragState(null);
      setHoverState(null);
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
        autoScrollInterval.current = null;
      }
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
              <View className="absolute -top-[5px] left-[30px] right-[16px] flex-row items-center z-50">
                <View className="w-2.5 h-2.5 rounded-full bg-[#183B7A] border-2 border-white shadow-sm z-50" />
                <View className="flex-1 h-[2px] bg-[#183B7A] rounded-full z-40 -ml-[1px]" />
              </View>
            )}

          <ActivityItemCard
            itineraryActivity={eventActivity}
            isFirstItem={isFirstEvent}
            isLastItem={isLastEvent}
            plainMode={plainMode}
            index={index}
            listLength={array.length}
            onDragStart={(idx: number) =>
              handleSectionActivityDragStart(section.id || "", idx)
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
          />

          {/* Hover indicator below */}
          {hoverState?.index === index &&
            hoverState?.sectionId === section.id &&
            sectionDragState?.sectionId === section.id &&
            sectionDragState?.dragIndex !== index &&
            (sectionDragState?.dragIndex ?? -1) < index && (
              <View className="absolute -bottom-[5px] left-[30px] right-[16px] flex-row items-center z-50">
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
        scrollEnabled={!sectionDragState?.isDragging}
      >
        <View className="flex-1 p-2.5">
          {sections &&
            sections.map((section) => {
              const isDefaultSection = section.isDefaultSection;
              if (isDefaultSection) {
                return (
                  <View
                    key={section.id}
                    ref={(ref) => {
                      if (ref && section.id) sectionRefs.current[section.id] = ref;
                    }}
                  >
                    {section.itineraryActivity &&
                      renderActivityCards(section, section.itineraryActivity)}
                  </View>
                );
              } else if (plainMode) {
                return (
                  <View key={section.id} className="mb-2">
                    <View className="flex-row items-center gap-2 py-2">
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
                return (
                  <Accordion
                    key={section.id}
                    title={
                      section.startDate ? (
                        <Text>
                          <Text className="text-[#999] ">
                            {`${new Date(section.startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })} `}
                          </Text>
                          {section.title}
                        </Text>
                      ) : (
                        section.title
                      )
                    }
                    headerStyle={{ backgroundColor: "#FFF" }}
                  >
                    <View
                      style={{ backgroundColor: "#FFF" }}
                      ref={(ref) => {
                        if (ref && section.id) sectionRefs.current[section.id] = ref;
                      }}
                    >
                      {section.description && section.description.trim() !== "" && (
                        <Text className="text-sm text-[#555] leading-5 p-2 pt-0">
                          {section.description}
                        </Text>
                      )}
                      {section.itineraryActivity && section.itineraryActivity.length > 0 ? (
                        renderActivityCards(section, section.itineraryActivity)
                      ) : (
                          <Text className="text-sm text-[#555] leading-5 p-2 text-center">
                            No activities found
                          </Text>
                        )}
                    </View>
                  </Accordion>
                );
              }
            })}
        </View>
      </ScrollView>
    </View>
  );
};

export default SectionAccordion;
