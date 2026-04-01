import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
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
// import DraggableActivityItem from "../components/DraggableActivityItem";
import DraggableActivityItem from "./DraggableActivityItem";
import SlideModal from "../../../../../components/molecules/SlideModal";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useDeleteSectionMutation } from "../../../hooks/useSection";
import { useUpdateActivitySortOrderMutation, useUpdateActivityMutation } from "../../../hooks/useActivity";
import { UpdateSortVariables } from "../../../types/ActivityDto";

import {
  Travel,
  ItinerarySection,
  ItineraryActivity,
} from "../../../types/TravelDto";
import { MenuStyle } from "../../../../../styles/common";

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

  useEffect(() => {
    setSections(
      travelSections?.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
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
    // const newActivities = [...activities];
    // const [movedActivity] = newActivities.splice(fromIndex, 1);
    // newActivities.splice(toIndex, 0, movedActivity);
    // setActivities(newActivities);
    // setIsDragging(false);
    // setDragIndex(null);
    setHoverState(null);
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
    <ScrollView
      ref={scrollViewRef}
      onScroll={(e) => {
        scrollOffset.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      style={styles.formContainer}
      showsVerticalScrollIndicator={false}
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
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Activities</Text>

        {sections &&
          sections.length > 0 &&
          sections
            .find((section) => section.isDefaultSection == true)
            ?.itineraryActivity?.map((activity, index) => (
              <TouchableOpacity
                key={activity.id}
                // onPress={() => handleActivityPress(activity)}
                onPress={() =>
                  handleSectionActivityPress(activity, activity.sectionId || 0)
                }
                activeOpacity={0.7}
                style={{
                  zIndex: isDragging && dragIndex === index ? 9999 : 1,
                  elevation: isDragging && dragIndex === index ? 10 : 1,
                }}
              >
                <ActivityCard
                  title={activity.title}
                  description={""}
                  location={""}
                  index={index}
                  onDragStart={handleActivityDragStart}
                  onDragEnd={handleActivityDragEnd}
                  isDragging={isDragging}
                  dragIndex={dragIndex}
                  listLength={
                    sections.find((section) => section.isDefaultSection == true)
                      ?.itineraryActivity?.length || 0
                  }
                />
              </TouchableOpacity>
            ))}

        <TouchableOpacity
          onPress={() => {
            setModalVisible(true);
            const defaultSection = sections.find(
              (section) => section.isDefaultSection == true,
            );
            setCurrentSectionId(defaultSection?.id || null);
          }}
          style={{
            backgroundColor: "#eee",
            padding: 10,
            borderRadius: 8,
            height: 60,
            alignItems: "center",
            alignContent: "center",
          }}
        >
          <Text>
            <Icon name="add" size={22} color={"#475467"} />
            Add Activity
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sections</Text>
        {sections && sections.length > 0 ? (
          sections
            .filter((section) => section.isDefaultSection == false)
            .map((section) => (
              <View
                key={section.id}
                style={[
                  styles.sectionCard,
                  {
                    zIndex: sectionDragState?.sectionId === section.id ? 999 : 1,
                    elevation: sectionDragState?.sectionId === section.id ? 10 : 1,
                  },
                ]}
              >
                <View style={styles.dragHandleIcon}>
                  <Icon name="drag-handle" size={24} color={"#DDD"} />
                </View>
                <View style={styles.sectionHeader}>
                  <TouchableOpacity
                    style={styles.sectionToggle}
                    onPress={() => toggleSectionCollapse(section.id || 0)}
                  >
                    <View style={styles.sectionContent}>
                      <Text
                        numberOfLines={section.isCollapsed ? 1 : 10}
                        ellipsizeMode="tail"
                        style={styles.sectionTitle}
                      >
                        {section.id}.  
                        {section.title}
                      </Text>

                      {section.description && (
                        <Text
                          numberOfLines={section.isCollapsed ? 2 : 10}
                          ellipsizeMode="tail"
                          style={styles.sectionDesc}
                        >
                          {section.description}
                        </Text>
                      )}

                      <View style={{ flex: 1, flexDirection: "row" }}>
                        <Text style={styles.sectionToggleIcon}>
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
                          <Text style={styles.sectionActivityCount}>
                            {section.itineraryActivity.length} Activi
                            {section.itineraryActivity.length !== 1
                              ? "ties"
                              : "ty"}
                          </Text>
                        ) : (
                          <Text style={styles.sectionActivityCount}>
                            No Activity yet
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                <View>
                  {!section.isCollapsed && (
                      <View 
                        style={[
                          styles.sectionActivities,
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
                                <View style={styles.dropIndicator} />
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
                                <View style={styles.dropIndicator} />
                              )}
                          </TouchableOpacity>
                        )) : (
                          // Render invisible or subtle drop zone for empty sections
                          <View style={{ height: 60, width: "100%", justifyContent: "center", alignItems: "center", borderStyle: "dashed", borderWidth: 1, borderColor: "#ddd", borderRadius: 8 }}>
                             <Text style={{ color: "#aaa" }}>Drop activities here</Text>

                             {hoverState?.sectionId === section.id && (
                               <View style={[styles.dropIndicator, { position: "absolute", top: "50%", width: "100%" }]} />
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
                    style={{
                      backgroundColor: "#eee",
                      padding: 10,
                      borderRadius: 8,
                      height: 60,
                      alignItems: "center",
                      alignContent: "center",
                    }}
                  >
                    <Text>
                      <Icon name="add" size={20} color={"#475467"} />
                      Add Activity
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.sectionMenuButton}
                  onPress={() => handleSectionMenuPress(section)}
                >
                  <Icon name="more-vert" size={20} color={"#475467"} />
                </TouchableOpacity>
              </View>
            ))
        ) : (
          <Text style={styles.emptyText}>No sections added yet.</Text>
        )}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity
              style={styles.sectionToggle}
              onPress={() => {
                setSectionModalVisible(true);
              }}
            >
              <View style={styles.sectionContent}>
                <Text>Add Section</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* 
      <FloatingAddButton
        onPress={() => {
          setMenuVisible(true);
        }}
      /> */}

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
          debugger;
          setEditSectionModalVisible(false);
          setEditingSection(null);
        }}
        // onSave={handleEditSection}
        itinerarySection={selectedSection || null}
      />

      {/* Main Menu Modal */}
      <SlideModal visible={menuVisible} onClose={() => setMenuVisible(false)}>
        <View style={styles.overlay}>
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
              style={[MenuStyle.menuItem]}
              activeOpacity={0.7}
              onPress={handleMenuAddSection}
            >
              <Icon name="grading" size={24} color={"#183B7A"} />
              <Text style={[MenuStyle.menuItemText]}>Add Section</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={MenuStyle.menuItem}
              activeOpacity={0.7}
              onPress={handleSectionMenuAddActivity}
            >
              <Icon name="new-label" size={24} color={"#183B7A"} />
              <Text style={MenuStyle.menuItemText}>Add Activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SlideModal>

      {/* Section Menu Modal */}
      <SlideModal
        visible={sectionMenuVisible}
        onClose={() => setSectionMenuVisible(false)}
      >
        <View style={styles.overlay}>
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
              style={[MenuStyle.menuItem]}
              activeOpacity={0.7}
              onPress={() =>
                handleSectionMenuEditSection(selectedSection?.id || 0)
              }
            >
              <Icon name="segment" size={24} color={"#183B7A"} />
              <Text style={[MenuStyle.menuItemText]}>Edit Section</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={MenuStyle.menuItem}
              activeOpacity={0.7}
              onPress={handleSectionMenuAddActivity}
            >
              <Icon name="new-label" size={24} color={"#183B7A"} />
              <Text style={MenuStyle.menuItemText}>Add Activity</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={MenuStyle.menuItem}
              activeOpacity={0.7}
              onPress={() => handleSectionMenuDelete(selectedSection?.id || 0)}
              disabled={isPending}
            >
              <Icon name="delete-outline" size={24} color={"#c93030"} />
              <Text style={[MenuStyle.menuItemText, { color: "#c93030" }]}>
                Delete Section
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SlideModal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  dragHandleIcon: {
    //   flex: 1,
    //   backgroundColor: "#F6F8FC",
    //   verticalAlign: "middle",
    position: "absolute",
    top: 10,
    left: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#183B7A",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshIndicator: {
    marginRight: 10,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: "#183B7A",
    fontWeight: "bold",
  },
  formContainer: {
    flex: 1,
    padding: 10,
    width: "100%",
    paddingBottom: 50,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: "#183B7A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  activitiesContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    flex: 1,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 0.4,
  },
  sectionHeader: {
    marginHorizontal: 18,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#183B7A",
    marginBottom: 6,
  },
  sectionDesc: {
    marginBottom: 0,
    fontSize: 12,
    color: "#6c757d",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  sectionMenuButton: {
    padding: 8,
    position: "absolute",
    right: 0,
    top: 12,
  },
  sectionMenuIcon: {
    fontSize: 20,
    color: "#183B7A",
    fontWeight: "bold",
  },
  sectionActivities: {
    marginTop: 12,
    zIndex: 0,
  },
  sectionActivityCard: {
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  sectionActivityTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#183B7A",
    marginBottom: 4,
  },
  sectionActivityDescription: {
    fontSize: 12,
    color: "#666",
  },
  sectionToggle: {
    paddingHorizontal: 8,
    flex: 1,
    flexDirection: "row",
  },
  sectionToggleIcon: {
    paddingTop: 5,
    // position: "absolute",
  },
  sectionActivityCount: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
  },
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuContainer: {
    backgroundColor: "white",
    width: "100%",
    height: "100%",
    paddingTop: 100,
    paddingHorizontal: 20,
  },

  overlay: {
    flex: 1,
    backgroundColor: "#fff",
  },
  dropIndicator: {
    height: 2,
    backgroundColor: "#183B7A",
    borderRadius: 2,
    marginVertical: 4,
    width: "80%",
    alignSelf: "center",
  },
});

export default EditTravelItinerary;
