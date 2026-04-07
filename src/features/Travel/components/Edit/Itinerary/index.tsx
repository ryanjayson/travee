import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import SectionModal from "./Section/Modal";
import ActivityModal from "./Activity/Modal";
import AddActivityModal from "../../Edit/Itinerary/AddActivityModal";
import ActivityCard from "../Itinerary/ActivityCard";
import FloatingAddButton from "../Itinerary/FloatingAddButton";
import DraggableActivityItem from "./DraggableActivityItem";
import DraggableSectionContainer from "./DraggableSectionContainer";
import SlideModal from "../../../../../components/molecules/SlideModal";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useDeleteSectionMutation, useUpdateSectionSortOrderMutation, UpdateSectionSortVariables } from "../../../hooks/useSection";
import { useUpdateActivitySortOrderMutation, useUpdateActivityMutation } from "../../../hooks/useActivity";
import { UpdateSortVariables } from "../../../types/ActivityDto";

import {
  Travel,
  ItinerarySection,
  ItineraryActivity,
} from "../../../types/TravelDto";


interface EditTravelItineraryProps {
  travelSections: ItinerarySection[] | null;
  onSave: (itineraryData: any) => void;
  onBack: () => void;
  onRefresh?: () => void;
}

const EditTravelItinerary = ({
  travelSections,
  onSave,
  onBack,
  onRefresh,
}: EditTravelItineraryProps) => {
  const [selectedSection, setSelectedSection] =
    useState<ItinerarySection | null>(null);
  const [sections, setSections] = useState<ItinerarySection[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [sectionDragState, setSectionDragState] = useState<{
    sectionId: number;
    isDragging: boolean;
    dragIndex: number | null;
  } | null>(null);
  const [sectionMenuVisible, setSectionMenuVisible] = useState(false);
  const [currentSectionForMenu, setCurrentSectionForMenu] =
    useState<ItinerarySection | null>(null);
  const [editSectionModalVisible, setEditSectionModalVisible] = useState(false);
  const [editingSection, setEditingSection] = useState<ItinerarySection | null>(
    null,
  );
  const [editActivityModalVisible, setEditActivityModalVisible] =
    useState(false);
  const [editingActivity, setEditingActivity] =
    useState<ItineraryActivity | null>(null);
  const [editingActivityType, setEditingActivityType] = useState<
    "general" | "section" | null
  >(null);
  const [editingActivitySectionId, setEditingActivitySectionId] = useState<
    number | null
  >(null);
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<number>>(
    new Set(),
  );
  const [hoverState, setHoverState] = useState<{ sectionId: number | null, index: number } | null>(null);

  const [masterDragState, setMasterDragState] = useState<{ isDragging: boolean, dragIndex: number | null }>({ isDragging: false, dragIndex: null });
  const [masterHoverState, setMasterHoverState] = useState<{ index: number } | null>(null);
  const sectionRefs = useRef<Record<number, any>>({});
  const sectionBounds = useRef<Record<number, { pageY: number, height: number }>>({});
  
  // Auto-scrolling Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const initialScrollY = useRef(0);
  const dragMoveY = useRef(0);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);

  const sectionsRef = useRef(sections);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  const sectionDragStateRef = useRef(sectionDragState);
  useEffect(() => { sectionDragStateRef.current = sectionDragState; }, [sectionDragState]);

  const [refreshing, setRefreshing] = useState(false);
  const { mutate: deleteSectionMutation, isPending } =
    useDeleteSectionMutation();
  const { mutate: updateActivityMutation } = useUpdateActivityMutation();

  const {
    mutate: updateActivitySortMutation,
    isPending: isPendingActivitySort,
  } = useUpdateActivitySortOrderMutation();
  
  const {
    mutate: updateSectionSortOrderMutation,
  } = useUpdateSectionSortOrderMutation();

  useEffect(() => {
    setSections(
      travelSections?.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        sortOrder: section.sortOrder,
        isDefaultSection: section.isDefaultSection,
        itineraryActivity: (section.itineraryActivity ?? []).map(
          (activity) => ({
            ...activity,
          }),
        ),
        isCollapsed: expandedSectionIds.has(section.id || 0)
          ? true
          : section.isCollapsed,
      })) ?? [],
    );
  }, [travelSections]);

  useEffect(() => {
    if (!isPending) {
      setSectionMenuVisible(false);
    }
  }, [isPending]);

  // const handleRefresh = async () => {
  //   setRefreshing(true);
  //   try {
  //     // Call the parent's refresh function if available
  //     if (travelData?.id) {
  //       // Use ActivityService to get activities
  //       const generalActivities = await activityService.getActivitiesByTripId(
  //         travelData.id
  //       );

  //       // Update general activities
  //       setActivities(
  //         generalActivities.map((ItineraryActivity) => ({
  //           ...activity,
  //           location: activity.location || "",
  //         }))
  //       );

  //       // Update sections with their activities
  //       const updatedSections = await Promise.all(
  //         sections.map(async (section) => {
  //           try {
  //             const sectionActivities =
  //               await activityService.getActivitiesBySectionId(section.id);
  //             return {
  //               ...section,
  //               activities: sectionActivities.map((activity) => ({
  //                 ...activity,
  //                 location: activity.location || "",
  //               })),
  //             };
  //           } catch (error) {
  //             console.warn(
  //               `Failed to fetch activities for section ${section.id}:`,
  //               error
  //             );
  //             return section;
  //           }
  //         })
  //       );
  //       setSections(updatedSections);
  //     }

  //     // Call parent's onRefresh callback if provided
  //     if (onRefresh) {
  //       onRefresh();
  //     }
  //   } catch (error) {
  //     console.error("Error refreshing itinerary:", error);
  //   } finally {
  //     setRefreshing(false);
  //   }
  // };

  const toggleSectionCollapse = (sectionId: number) => {
    setSections(
      sections &&
        sections.map((section) =>
          section.id === sectionId
            ? { ...section, isCollapsed: !section.isCollapsed }
            : section,
        ),
    );

    setExpandedSectionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleActivityPress = (activity: ItineraryActivity) => {
    setEditingActivity(activity);
    setEditingActivityType("general");
    setEditingActivitySectionId(null);
    setEditActivityModalVisible(true);
  };

  const handleSectionActivityPress = (
    activity: ItineraryActivity,
    sectionId: number,
  ) => {
    setEditingActivity(activity);
    setEditingActivityType("section");
    setCurrentSectionId(sectionId);
    setEditActivityModalVisible(true);
  };

  const handleActivityDragStart = (index: number) => {
    setIsDragging(true);
    setDragIndex(index);
  };

  const handleActivityDragEnd = (fromIndex: number, toIndex: number) => {
    setHoverState(null);
  };

  const handleMasterSectionDragStart = (index: number) => {
    setMasterDragState({ isDragging: true, dragIndex: index });
  };

  const handleMasterSectionDragMove = (currentIndex: number, dy: number, moveY: number) => {
    // Basic mathematical estimation: assume sections average around 200px block heights.
    // The exact visual math isn't perfectly mapped internally due to variable map sizes, but it smoothly approximates for generic reordering!
    const offset = Math.round(dy / 150);
    const subSectionsLength = sections?.filter(s => s.isDefaultSection === false).length || 0;
    const newIndex = Math.max(0, Math.min(currentIndex + offset, subSectionsLength - 1));
    setMasterHoverState({ index: newIndex });
  };

  const handleMasterSectionDragEnd = (fromIndex: number, toIndex: number) => {
    setMasterDragState({ isDragging: false, dragIndex: null });
    setMasterHoverState(null);

    if (fromIndex !== toIndex && sections) {
      const defaultSections = sections.filter(s => s.isDefaultSection === true);
      const subSections = sections.filter(s => s.isDefaultSection === false);
      
      const [moved] = subSections.splice(fromIndex, 1);
      subSections.splice(toIndex, 0, moved);
      
      setSections([...defaultSections, ...subSections]);

      const prevSortOrder = subSections[toIndex - 1]?.sortOrder;
      const nextSortOrder = subSections[toIndex + 1]?.sortOrder;
      if (moved.id) {
        updateSectionSortOrderMutation({
          id: moved.id,
          prevSortOrder,
          nextSortOrder,
        });
      }
    }
  };

  const handleSectionActivityDragStart = (sectionId: number, index: number) => {
    // Measure all visible sections
    initialScrollY.current = scrollOffset.current;
    Object.entries(sectionRefs.current).forEach(([idStr, ref]) => {
      if (ref && ref.measure) {
        ref.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          sectionBounds.current[Number(idStr)] = { pageY, height };
        });
      }
    });
    setSectionDragState({ sectionId, isDragging: true, dragIndex: index });
  };

  const handleSectionActivityDragEnd = (
    sourceSectionId: number,
    activity: ItineraryActivity,
    fromIndex: number,
    _: number,
  ) => {

debugger;

    const targetSectionId =  hoverState?.sectionId ?? sourceSectionId;
    const toIndex = hoverState?.index ?? fromIndex;

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

            if (updatedActivity.id) {
              const updateSort: UpdateSortVariables = {
                id: updatedActivity.id,
                prevSortOrder: previousNeighbor && previousNeighbor.sortOrder,
                nextSortOrder: nextNeighbor && nextNeighbor.sortOrder,
              };
              updateActivitySortMutation(updateSort);

              if (targetSectionId !== sourceSectionId) {
                updateActivityMutation(updatedActivity);
              }
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

  const handleMenuAddActivity = () => {
    setCurrentSectionId(null);
    setModalVisible(true);
    setMenuVisible(false);
  };
  const handleMenuAddSection = () => {
    debugger;
    setCurrentSectionId(0);
    setSectionModalVisible(true);
    setMenuVisible(false);
  };

  const handleSectionMenuPress = (section: ItinerarySection) => {
    setCurrentSectionForMenu(section);
    setSelectedSection(section);
    setSectionMenuVisible(true);
  };

  const handleSectionMenuAddActivity = () => {
    debugger;

    if (currentSectionForMenu) {
      setCurrentSectionId(currentSectionForMenu.id ?? 0);
    } else {
      setCurrentSectionId(
        travelSections?.find((section) => section.isDefaultSection)?.id || 0,
      );
    }
    setModalVisible(true);
    setSectionMenuVisible(false);
  };

  const handleSectionMenuEditSection = (sectionId: number) => {
    if (currentSectionForMenu) {
      setEditingSection(currentSectionForMenu);
      setEditSectionModalVisible(true);
      setSelectedSection(
        (travelSections &&
          travelSections.find(
            (section: ItinerarySection) => section.id == sectionId,
          )) ||
          null,
      );
    }
    setSectionMenuVisible(false);
  };

  const handleSectionMenuDelete = (sectionId: number) => {
    if (sectionId > 0) {
      deleteSectionMutation({ sectionId });
    }
  };

  const computeIntersection = (moveY: number) => {
    let targetSectionId = sectionDragStateRef.current?.sectionId || null;
    let targetIndex = 0;
    
    const scrollDelta = scrollOffset.current - initialScrollY.current;

    let foundIntersection = false;
    for (const [idStr, bounds] of Object.entries(sectionBounds.current) as [string, { pageY: number, height: number }][]) {
      const id = Number(idStr);
      const shiftedTop = bounds.pageY - scrollDelta;
      const shiftedBottom = shiftedTop + bounds.height;

      if (moveY >= shiftedTop - 40 && moveY <= shiftedBottom + 40) {
        targetSectionId = id;
        const relY = moveY - shiftedTop;
        const newTargetIndex = Math.max(0, Math.round(relY / 70));
        
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
    currentIndex: number,
    dy: number,
    listLength: number,
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

  return (
    <View className="flex-1">
     <ScrollView
      ref={scrollViewRef}
      onScroll={(e) => {
        scrollOffset.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      className="flex-1 p-2.5 w-full pb-12"
      showsVerticalScrollIndicator={false}
      // keyboardShouldPersistTaps="always"
      scrollEnabled={!isDragging && !sectionDragState?.isDragging}
      // refreshControl={
      //   <RefreshControl
      //     refreshing={refreshing}
      //     // onRefresh={handleRefresh}
      //     colors={["#183B7A"]}
      //     tintColor="#183B7A"
      //   />
      // }
    >
      <View className="mb-5">
        <Text
        className="tracking-widest text-gray-400 mb-2 text-base"
        >Activities</Text>

        {sections && sections.length > 0 && sections.filter(section => section.isDefaultSection == true).map((section) => (
          <View
            key={section.id}
            style={[
              {
                zIndex: sectionDragState?.sectionId === section.id ? 999 : 1,
                elevation: sectionDragState?.sectionId === section.id ? 10 : 1,
                paddingBottom: (!section.itineraryActivity || section.itineraryActivity.length === 0) ? 20 : 0
              }
            ]}
            ref={(ref) => {
              if (ref && section.id) sectionRefs.current[section.id] = ref;
            }}
          >
            {section.itineraryActivity && section.itineraryActivity.length > 0 ? section.itineraryActivity.map((activity, index) => (
              <TouchableOpacity
                key={activity.id}
                onPress={() => handleSectionActivityPress(activity, section.id || 0)}
                activeOpacity={1}
                style={{
                  zIndex:
                    sectionDragState?.dragIndex === index &&
                    sectionDragState?.sectionId === section.id
                      ? 9999
                      : 1,
                  elevation:
                    sectionDragState?.dragIndex === index &&
                    sectionDragState?.sectionId === section.id
                      ? 10
                      : 1,
                }}
              >
                {hoverState?.index === index &&
                  hoverState?.sectionId === section.id &&
                  (sectionDragState?.sectionId !== section.id ||
                    (sectionDragState?.dragIndex !== index &&
                      (sectionDragState?.dragIndex ?? -1) > index)) && (
                    <View className="h-[2px] bg-[#183B7A] rounded-sm my-1 w-4/5 self-center" />
                  )}

                <DraggableActivityItem
                  title={activity.title}
                  description={""}
                  location={""}
                  index={index}
                  listLength={section.itineraryActivity?.length || 0}
                  onDragMove={(currentIndex, dy, moveY) =>
                    handleDragMove(
                      currentIndex,
                      dy,
                      section.itineraryActivity?.length || 0,
                      moveY
                    )
                  }
                  onDragStart={(idx: number) =>
                    handleSectionActivityDragStart(
                      section.id || 0,
                      idx,
                    )
                  }
                  onDragEnd={(fromIdx: number, _: number) =>
                    handleSectionActivityDragEnd(
                      section.id || 0,
                      activity,
                      fromIdx,
                      0,
                    )
                  }
                  isDragging={
                    sectionDragState?.sectionId != undefined &&
                    sectionDragState?.sectionId === section.id &&
                    sectionDragState?.isDragging
                  }
                  dragIndex={
                    sectionDragState?.sectionId != undefined &&
                    sectionDragState?.sectionId === section.id
                      ? sectionDragState.dragIndex
                      : null
                  }
                />
                
                {hoverState?.index === index &&
                  hoverState?.sectionId === section.id &&
                  sectionDragState?.sectionId === section.id &&
                  sectionDragState?.dragIndex !== index &&
                  (sectionDragState?.dragIndex ?? -1) < index && (
                    <View className="h-[2px] bg-[#183B7A] rounded-sm my-1 w-4/5 self-center" />
                  )}
              </TouchableOpacity>
            )) : (
              <View style={{ height: 60, width: "100%", justifyContent: "center", alignItems: "center", borderStyle: "dashed", borderWidth: 1, borderColor: "#ddd", borderRadius: 8 }}>
                 <Text style={{ color: "#aaa" }}>Drop activities here</Text>
                 {hoverState?.sectionId === section.id && (
                   <View className="h-[2px] bg-[#183B7A] rounded-sm my-1 w-full self-center absolute top-1/2" />
                 )}
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          onPress={() => {
            setModalVisible(true);
            const defaultSection = sections.find(
              (section) => section.isDefaultSection == true,
            );
            setCurrentSectionId(defaultSection?.id || null);
          }}
         
          className="mt-2 bg-primary-light p-2 rounded-3xl h-[50px] flex items-center justify-center flex-row text-right mx-4"
        >
            <Icon name="add" size={22} color={"#475467"} />
            <Text className="tracking-wider flex items-center text-gray-800">
            Add Activity
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mb-5">
        <Text className="tracking-widest text-gray-400 mb-2 text-base">Sections</Text>
        {sections && sections.length > 0 ? (
          sections
            .filter((section) => section.isDefaultSection == false)
            .map((section, mapIndex) => (
              <DraggableSectionContainer
                key={section.id}
                index={mapIndex}
                listLength={sections.filter(s => s.isDefaultSection === false).length}
                onDragStart={handleMasterSectionDragStart}
                onDragMove={handleMasterSectionDragMove}
                onDragEnd={handleMasterSectionDragEnd}
              >
                {(panHandlers, isSectionActive) => (
                  <>
                  <View
                    className="bg-white rounded-lg p-2.5 border border-[#DDD] flex-1 mb-4"
                    style={[
                      {
                        zIndex: sectionDragState?.sectionId === section.id ? 999 : 1,
                        elevation: sectionDragState?.sectionId === section.id ? 10 : 1,
                      },
                    ]}
                  >
                    {masterHoverState?.index === mapIndex && (masterDragState.dragIndex ?? -1) > mapIndex && (
                      <View className="h-[2px] bg-[#183B7A] rounded-sm my-1 w-4/5 self-center mb-[15px]" />
                    )}

                    <View className="absolute top-[10px] left-[6px]" {...panHandlers}>
                      <Icon name="drag-handle" size={24} color={isSectionActive ? "#183B7A" : "#DDD"} />
                    </View>
                <View className="mx-[18px]">
                  <TouchableOpacity
                    className="px-2 flex-1 flex-row"
                    onPress={() => toggleSectionCollapse(section.id || 0)}
                  >
                    <View className="flex-1">
                      <Text
                        numberOfLines={section.isCollapsed ? 1 : 10}
                        ellipsizeMode="tail"
                        className="text-lg font-bold text-[#183B7A] mb-1.5"
                      >
                        {section.title}
                      </Text>

                      {section.description && (
                        <Text
                          numberOfLines={section.isCollapsed ? 2 : 10}
                          ellipsizeMode="tail"
                          className="mb-0 text-xs text-[#6c757d]"
                        >
                          {section.description}
                        </Text>
                      )}

                      <View style={{ flex: 1, flexDirection: "row" }}>
                        <Text className="pt-1" >
                          {section.isCollapsed ? (
                            <Icon
                              name="keyboard-arrow-down"
                              size={20}
                              color={"#ddd"}
                            />
                          ) : (
                            <Icon
                              name="keyboard-arrow-up"
                              size={20}
                              color={"#ddd"}
                            />
                          )}
                        </Text>
                        {section.itineraryActivity &&
                        section.itineraryActivity.length > 0 ? (
                          <Text className="text-xs text-[#888] mt-1.5">
                            {section.itineraryActivity.length} Activi
                            {section.itineraryActivity.length !== 1
                              ? "ties"
                              : "ty"}
                          </Text>
                        ) : (
                          <Text className="text-xs text-[#888] mt-1.5">
                            No activity yet
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                <View>
                  {!section.isCollapsed && (
                      <View 
                        className="mt-3 z-0"
                        style={[
                          {
                            zIndex: sectionDragState?.sectionId === section.id ? 999 : 1,
                            elevation: sectionDragState?.sectionId === section.id ? 10 : 1,
                            paddingBottom: (!section.itineraryActivity || section.itineraryActivity.length === 0) ? 20 : 0
                          }
                        ]}
                        ref={(ref) => {
                          if (ref && section.id) sectionRefs.current[section.id] = ref;
                        }}
                      >
                        {section.itineraryActivity && section.itineraryActivity.length > 0 ? section.itineraryActivity.map((activity, index) => (
                          <TouchableOpacity
                            key={activity.id}
                            onPress={() =>
                              handleSectionActivityPress(
                                activity,
                                section.id || 0,
                              )
                            }
                            activeOpacity={0.7}
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
                            {hoverState?.index === index &&
                              hoverState?.sectionId === section.id &&
                              (sectionDragState?.sectionId !== section.id ||
                                (sectionDragState?.dragIndex !== index &&
                                 (sectionDragState?.dragIndex ?? -1) > index)) && (
                                <View className="h-[2px] bg-[#183B7A] rounded-sm my-1 w-4/5 self-center" />
                              )}

                            <DraggableActivityItem
                              id={activity.id}
                              title={activity.title}
                              description={activity.description}
                              location={""}
                              index={index}
                              listLength={section.itineraryActivity.length}
                              onDragMove={(currentIndex, dy, moveY) =>
                                handleDragMove(
                                  currentIndex,
                                  dy,
                                  section.itineraryActivity?.length || 0,
                                  moveY
                                )
                              }
                              onDragStart={(idx: number) =>
                                handleSectionActivityDragStart(
                                  section.id || 0,
                                  idx,
                                )
                              }
                              onDragEnd={(fromIdx: number, toIdx: number) =>
                                handleSectionActivityDragEnd(
                                  section.id || 0,
                                  activity,
                                  fromIdx,
                                  toIdx,
                                )
                              }
                              isDragging={
                                sectionDragState?.sectionId != undefined &&
                                sectionDragState?.sectionId === section.id &&
                                sectionDragState?.isDragging
                              }
                              dragIndex={
                                sectionDragState?.sectionId != undefined &&
                                sectionDragState?.sectionId === section.id
                                  ? sectionDragState.dragIndex
                                  : null
                              }
                            />
                            
                            {hoverState?.index === index &&
                              hoverState?.sectionId === section.id &&
                              sectionDragState?.sectionId === section.id &&
                              sectionDragState?.dragIndex !== index &&
                              (sectionDragState?.dragIndex ?? -1) < index && (
                                <View className="h-[2px] bg-[#183B7A] rounded-sm my-1 w-4/5 self-center" />
                              )}
                          </TouchableOpacity>
                        )) : (
                          // Render invisible or subtle drop zone for empty sections
                          <View style={{ height: 60, width: "100%", justifyContent: "center", alignItems: "center", borderStyle: "dashed", borderWidth: 1, borderColor: "#ddd", borderRadius: 8 }}>
                             <Text style={{ color: "#aaa" }}>Drop activities here</Text>

                             {hoverState?.sectionId === section.id && (
                               <View className="h-[2px] bg-[#183B7A] rounded-sm my-1 w-full self-center absolute top-1/2" />
                             )}
                          </View>
                        )}
                      </View>
                    )}
                </View>

                {!section.isCollapsed && (
                  <TouchableOpacity
                    onPress={() => {
                      if (!section.id) return;
                      setModalVisible(true);
                      setCurrentSectionId(section.id);
                    }}
                    className="mt-2 h-[44px] flex items-center justify-center flex-row"
                  >
                     <Icon name="add" size={24} color={"#475467"} 
                       className="opacity-50"/>
                    <Text className="tracking-wider flex items-center text-gray-800">
                      Add Activity
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  className="p-2 absolute right-0 top-3"
                  onPress={() => handleSectionMenuPress(section)}
                >
                  <Icon name="more-vert" size={20} color={"#475467"} 
                  className="opacity-50" />
                </TouchableOpacity>
              </View>
              {masterHoverState?.index === mapIndex && (masterDragState.dragIndex ?? -1) < mapIndex && (
                <View className="h-[2px] bg-[#183B7A] rounded-sm my-1 w-4/5 self-center mt-[15px]" />
              )}
              </>
              )}
            </DraggableSectionContainer>
            ))
        ) : (
          <Text className="text-[#888] italic text-center p-5">No sections added yet.</Text>
        )}
          <View className="mb-5">
            <TouchableOpacity
              onPress={() => {
                setSectionModalVisible(true);
              }}
              className="mt-2 p-2 rounded-full h-[50px] flex items-center justify-center flex-row mx-4"
            >
              <Icon name="add" size={24} color={"#475467"} 
                className="opacity-50"/>
              <Text className="tracking-wider flex items-center ">
                Add New Section
              </Text>
            </TouchableOpacity>
        </View>
      </View>           

      <ActivityModal //ADD
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setCurrentSectionId(null);
        }}
        itinerarySectionId={currentSectionId || undefined}
        itineraryActivity={null}
      />

      <ActivityModal //EDIT
        visible={editActivityModalVisible}
        onClose={() => {
          debugger;
          setEditActivityModalVisible(false);
          setEditingActivity(null);
          // setEditingActivityType(null);
          // setEditingActivitySectionId(null);
        }}
        itinerarySectionId={currentSectionId || undefined}
        itineraryActivity={editingActivity}
      />

      <SectionModal //ADD
        visible={sectionModalVisible}
        onClose={() => setSectionModalVisible(false)}
        itinerarySection={null}
      />

      <SectionModal //EDIT
        visible={editSectionModalVisible}
        onClose={() => {
          setEditSectionModalVisible(false);
          setEditingSection(null);
        }}
        // onSave={handleEditSection}
        itinerarySection={selectedSection || null}
      />

      {/* Main Menu Modal */}
      {/* TODO move this to component */}
      <SlideModal visible={menuVisible} onClose={() => setMenuVisible(false)}>
        <View className="flex-1 bg-white">
          <View
            style={{
              padding: 6,
              borderBottomWidth: 1,
              borderColor: "#eee",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={{ paddingRight: 6 }}
              onPress={() => setSectionMenuVisible(false)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="keyboard-arrow-left" size={36} color={"#EEE"} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, color: "#333", fontWeight: "600" }}>
              Itinerary Menu
            </Text>
          </View>

          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-5 border-b border-[#F0F0F0]"
              activeOpacity={0.7}
              onPress={handleMenuAddSection}
            >
              <Icon name="grading" size={24} color={"#183B7A"} />
              <Text className="flex-1 ml-3 text-base text-[#183B7A] font-medium">Add Section</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-5 border-b border-[#F0F0F0]"
              activeOpacity={0.7}
              onPress={handleSectionMenuAddActivity}
            >
              <Icon name="new-label" size={24} color={"#183B7A"} />
              <Text className="flex-1 ml-3 text-base text-[#183B7A] font-medium">Add Activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SlideModal>

      {/* Section Menu Modal */}
      {/* TODO move this to component */}
      <SlideModal
        visible={sectionMenuVisible}
        onClose={() => setSectionMenuVisible(false)}
      >
        <View className="flex-1 bg-white">
          <View
            style={{
              padding: 6,
              borderBottomWidth: 1,
              borderColor: "#eee",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={{ paddingRight: 6 }}
              onPress={() => setSectionMenuVisible(false)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="keyboard-arrow-left" size={36} color={"#333"} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, color: "#333", fontWeight: "600" }}>
              Itinerary Menu
            </Text>
          </View>

          <View style={{ paddingVertical: 8 }}>
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-5 border-b border-[#F0F0F0]"
              activeOpacity={0.7}
              onPress={() =>
                handleSectionMenuEditSection(selectedSection?.id || 0)
              }
            >
              <Icon name="segment" size={24} color={"#183B7A"} />
              <Text className="flex-1 ml-3 text-base text-[#183B7A] font-medium">Edit Section</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-5 border-b border-[#F0F0F0]"
              activeOpacity={0.7}
              onPress={handleSectionMenuAddActivity}
            >
              <Icon name="new-label" size={24} color={"#183B7A"} />
              <Text className="flex-1 ml-3 text-base text-[#183B7A] font-medium">Add Activity</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-5 border-b border-[#F0F0F0]"
              activeOpacity={0.7}
              onPress={() => handleSectionMenuDelete(selectedSection?.id || 0)}
              disabled={isPending}
            >
              <Icon name="delete-outline" size={24} color={"#c93030"} />
              <Text className="flex-1 ml-3 text-base text-[#c93030] font-medium">
                Delete Section
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SlideModal>
    </ScrollView>

      <FloatingAddButton
        onAddSection={handleMenuAddSection}
        onAddActivity={handleMenuAddActivity}
      />
    </View>
   
  );
};

export default EditTravelItinerary;
