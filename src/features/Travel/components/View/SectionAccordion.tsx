import { MaterialIcons as Icon, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Easing, LayoutAnimation, Modal, PanResponder, Pressable, RefreshControl, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";
import Svg, { Line } from "react-native-svg";
import Accordion from "../../../../components/Accordion";
import { FadeInView } from "../../../../components/animations";
import { useToast } from "../../../../context/ToastContext";
import { useTravelContext } from "../../../../context/TravelContext";
import { useLexicographicSort } from "../../../../hooks/useLexicographicSort";
import { updateActivitySortOrderLocally, updateSectionSortOrderLocally } from "../../../../services/local/travelService";
import { ItineraryActivity, ItinerarySection, TravelPlan } from "../../../Travel/types/TravelDto";
import { useTravelPlan } from "../../hooks/useTravel";
import { useTripSetting, useUpdateTripSetting } from "../../hooks/useTripSetting";
import DraggableSectionContainer from "../Edit/Itinerary/DraggableSectionContainer";
import SectionModal from "../Edit/Itinerary/Section/Modal";
import ActivityItemCard from "./Activity/Card";
import ViewActivityModal from "./Activity/Modal";

interface SectionAccordionProps {
  travelPlan: TravelPlan;
}

// Tactile spring layout animation configuration
const springConfig = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.8,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

// Icons and labels configuration for each view mode
const viewModeConfig = {
  plain: {
    icon: "view-headline" as const,
    label: "Plain list view",
  },
  narrow: {
    icon: "format-list-bulleted" as const,
    label: "Compact view",
  },
  expanded: {
    icon: "view-list" as const,
    label: "Detailed view",
  },
};

const toViewMode = (itineraryView?: string): "plain" | "narrow" | "expanded" => {
  switch (itineraryView) {
    case "plain":
      return "plain";
    case "compact":
      return "narrow";
    case "detailed":
    default:
      return "expanded";
  }
};

const toItineraryView = (viewMode: "plain" | "narrow" | "expanded"): "plain" | "compact" | "detailed" => {
  switch (viewMode) {
    case "plain":
      return "plain";
    case "narrow":
      return "compact";
    case "expanded":
    default:
      return "detailed";
  }
};

const isValidStartDate = (dateVal: any): boolean => {
  if (dateVal === null || dateVal === undefined || dateVal === "") return false;
  if (typeof dateVal === "number" && dateVal <= 0) return false;
  const d = new Date(dateVal);
  return !isNaN(d.getTime());
};


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
  allowItemReordering?: boolean;
  onPressMore: (section: ItinerarySection) => void;
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
  allowItemReordering = true,
  onPressMore,
}: DraggableSectionItemProps) => {
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const lastTargetShift = useRef(0);
  const { openActivityModal } = useTravelContext();
  const { colors } = useTheme();

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

  const isThisItemDragging = sectionDragState?.sectionId === section.id;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: shiftAnim }],
        flex: 1,
        zIndex: isThisSectionDragging || isThisItemDragging ? 99999 : 1,
        elevation: isThisSectionDragging || isThisItemDragging ? 10 : 1,
        overflow: "visible",
      }}
    >
      <DraggableSectionContainer
        key={section.id}
        index={mapIndex}
        listLength={subSectionsLength}
        onDragStart={allowItemReordering ? onMasterDragStart : undefined}
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

            <Accordion
              viewMode={viewMode}
              onPressMore={() => onPressMore(section)}
              title={({ expanded }) => (
                <View className="flex-row align-middle items-center ">
                  {allowItemReordering && !isValidStartDate(section.startDate) && (
                    <View
                      className="absolute top-0 z-50 -ml-md flex-row items-center justify-center w-2xl"
                      {...panHandlers}
                    >
                      <MaterialIcons name="drag-handle" size={24} color={isSectionActive ? "#183B7A" : "#999"} />
                    </View>
                  )}
                  <View className="flex-row ">
                    {expanded ? (
                      <View className={`${viewMode === 'narrow' ? 'left-[45px]' : 'left-[51px]'}`}>
                        <View className={`absolute -top-xl bg-[#ccc] w-[5px] h-[5px] rounded-full`} />
                        <View className={`absolute -top-sm bg-[#ccc] w-[5px] h-[5px] rounded-full`} />
                      </View>
                    ) : null}

                    <Text style={{ marginLeft: allowItemReordering && !isValidStartDate(section.startDate) ? 16 : 0 }} className="flex-row items-center text-xl font-bold  text-white bg-accent/90 rounded-xs px-2 ">
                      {section?.title}
                      {isValidStartDate(section.startDate) ? (
                        <Text className="text-white/70 font-semibold text-sm">
                          {` ${new Date(section.startDate).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' })} `}
                        </Text>
                      ) : null}
                    </Text>

                    {expanded ? (
                      <>
                        <View className={`absolute -bottom-sm bg-[#ccc] w-[5px] h-[5px] rounded-full ${viewMode === 'narrow' ? 'left-[45px]' : 'left-[51px]'}`} />
                        <View className={`absolute -bottom-xl bg-[#ccc] w-[5px] h-[5px] rounded-full ${viewMode === 'narrow' ? 'left-[45px]' : 'left-[51px]'}`} />
                      </>
                    ) : null}
                  </View>
                </View>
              )}
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

              <View
                style={{ backgroundColor: "#FFF", paddingBottom: 20, paddingEnd: 5, }}
                // className={` ${viewMode === "narrow" ? "px-4" : ""}`}
                collapsable={false}
                ref={(ref) => {
                  if (ref && section.id) sectionRefs.current[section.id] = ref;
                }}
              >
                {section.description && section.description.trim() !== "" && (
                  <View className="bg-white flex-1 px-3 z-0 ">
                    <View className={`absolute h-full w-md pb-lg ${viewMode === 'narrow' ? 'left-[59px]' : 'left-[65px] '} z-0`}>
                      <Svg height={'200%'}
                        width="5"
                      >
                        <Line
                          x1="2.5"
                          y1="2.5"
                          x2="2.5"
                          y2="100%"
                          stroke="#ccc"
                          strokeWidth="5"
                          strokeDasharray="0, 10"
                          strokeLinecap="round"
                        />
                      </Svg>
                    </View>
                    <Text className="text-base text-tertiary px-2 ml-7xl pb-1">
                      {section.description}
                    </Text>
                  </View>
                )}
                {section.itineraryActivity && section.itineraryActivity.length > 0 ? (
                  <>
                    {renderActivityCards(section, section.itineraryActivity)}
                  </>
                ) : (
                  <>
                    <View className=" flex-1 items-center justify-center my-8 ml-7xl">
                      <Text className="text-lg text-tertiary/50 text-center">
                        No activities yet.
                      </Text>
                      <View className="text-center tracking-wide flex-row align-center gap-1">

                        <Text className="text-md text-tertiary/50 text-base">
                          {allowItemReordering ? "Drag and drop here or tap " : "Add now by tapping"}
                        </Text>
                        <TouchableOpacity
                          onPress={() => openActivityModal(null, section.id || undefined, section.travelId)}
                          accessibilityRole="button"
                          activeOpacity={0.7}
                          className="flex-row items-center"
                        >
                          <Icon name="add" size={16} color={"#263F69"} />
                          <Text
                            className="font-medium text-base underline text-accent"
                          >
                            Add activity
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}

                {viewMode !== 'plain' && (
                  <View className={`absolute h-full w-md pb-lg ${viewMode === 'narrow' ? 'left-[59px]' : 'left-[65px] '} z-0`}>
                    <Svg height={'130%'}
                      width="5"
                    >
                      <Line
                        x1="2.5"
                        y1="2.5"
                        x2="2.5"
                        y2="100%"
                        stroke="#ccc"
                        strokeWidth="5"
                        strokeDasharray="0, 10"
                        strokeLinecap="round"
                      />
                    </Svg>
                  </View>
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
  travelPlan,
}: SectionAccordionProps) => {
  const { generateSortOrder } = useLexicographicSort();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const { openActivityModal } = useTravelContext();
  const [isAddSectionVisible, setIsAddSectionVisible] = useState(false);
  const [selectedViewActivity, setSelectedViewActivity] = useState<{ id: string; travelId?: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const iterarysections = travelPlan.itinerarySection;
  const travelId = travelPlan.travel.id || "";
  const { data: dbSetting } = useTripSetting(travelId);
  const updateSettingMutation = useUpdateTripSetting();
  const { refetch } = useTravelPlan(travelId);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Combine fetched settings, travel payload settings, and defaults
  const currentSetting = dbSetting || travelPlan.travel.tripSetting || travelPlan.tripSetting;

  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { height: screenHeight } = Dimensions.get("window");
  const settingsTranslateY = useRef(new Animated.Value(screenHeight)).current;

  // Slide up transition on opening settings sheet
  useEffect(() => {
    if (isSettingsExpanded) {
      settingsTranslateY.setValue(screenHeight);
      Animated.spring(settingsTranslateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [isSettingsExpanded, screenHeight]);

  // Handle bar pan responder for Settings Form Sheet dragging
  const settingsDragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          settingsTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          Animated.timing(settingsTranslateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setIsSettingsExpanded(false);
          });
        } else {
          Animated.spring(settingsTranslateY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const settingsBackdropOpacity = settingsTranslateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const [viewMode, setViewMode] = useState<"plain" | "narrow" | "expanded">("expanded");
  const [allowItemReordering, setAllowItemReordering] = useState(true);
  const [editingSection, setEditingSection] = useState<ItinerarySection | null>(null);

  const handleEditSection = (section: ItinerarySection) => {
    setEditingSection(section);
  };

  // Reactively synchronize local states when database settings update
  useEffect(() => {
    if (currentSetting) {
      setViewMode(toViewMode(currentSetting.itineraryView));
      setAllowItemReordering(currentSetting.allowItemReordering);
    }
  }, [currentSetting]);

  const toggleSettings = () => {
    if (isSettingsExpanded) {
      collapseSettings();
    } else {
      setIsSettingsExpanded(true);
    }
  };

  const collapseSettings = () => {
    if (isSettingsExpanded) {
      Animated.timing(settingsTranslateY, {
        toValue: screenHeight,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setIsSettingsExpanded(false);
      });
    }
  };

  const handleModeChange = (mode: "plain" | "narrow" | "expanded") => {
    LayoutAnimation.configureNext(springConfig);
    setViewMode(mode);

    const itineraryView = toItineraryView(mode);
    updateSettingMutation.mutate({
      id: currentSetting?.id,
      travelId,
      currency: currentSetting?.currency || "PHP",
      timezone: currentSetting?.timezone || "Asia/Manila",
      itineraryView,
      allowItemReordering,
    });
    // setTimeout(collapseSettings, 300);
  };

  const handleReorderToggle = (value: boolean) => {
    setAllowItemReordering(value);

    const itineraryView = toItineraryView(viewMode);
    updateSettingMutation.mutate({
      id: currentSetting?.id,
      travelId,
      currency: currentSetting?.currency || "PHP",
      timezone: currentSetting?.timezone || "Asia/Manila",
      itineraryView,
      allowItemReordering: value,
    });
    setTimeout(collapseSettings, 300);
  };

  // --- Local mutable sections state ---
  const [sections, setSections] = useState<ItinerarySection[]>([]);

  useEffect(() => {
    if (!iterarysections) return;

    // Skip updating if background query refetch returns stale sort orders
    let isStale = false;
    for (const [id, targetSort] of Object.entries(pendingSortUpdates.current)) {
      const foundActivity = iterarysections
        .flatMap((s) => s.itineraryActivity || [])
        .find((a) => a.id === id);
      const foundSection = iterarysections.find((s) => s.id === id);

      const currentSort = foundActivity?.sortOrder ?? foundSection?.sortOrder;
      if (currentSort !== targetSort) {
        isStale = true;
        break;
      } else {
        // Successfully synced with DB, remove from pending
        delete pendingSortUpdates.current[id];
      }
    }

    if (isStale) {
      return;
    }

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
  const pendingSortUpdates = useRef<Record<string, string>>({});

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
        pendingSortUpdates.current[moved.id] = newSortOrder;
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

    // Determine current card height dynamically based on viewMode
    const currentCardHeight = viewMode === "narrow" ? 75 : (viewMode === "expanded" ? 165 : 110);

    let foundIntersection = false;
    for (const [idStr, bounds] of Object.entries(sectionBounds.current) as [string, { pageY: number; height: number }][]) {
      const id = idStr;
      const shiftedTop = bounds.pageY - scrollDelta;
      const shiftedBottom = shiftedTop + bounds.height;

      if (moveY >= shiftedTop - 40 && moveY <= shiftedBottom + 40) {
        targetSectionId = id;
        const relY = moveY - shiftedTop;

        const targetSection = sectionsRef.current?.find(s => s.id === id);
        const targetLen = targetSection?.itineraryActivity?.length || 0;

        const dragIndex = sectionDragStateRef.current?.dragIndex ?? 0;
        const isDraggingThisSection = sectionDragStateRef.current?.sectionId === id;

        let newTargetIndex = 0;
        if (isDraggingThisSection) {
          // Dragging within the same section:
          // Check midpoint of each card.
          // Dragging DOWN relative to card i: swap to i when relY >= midpoint of i.
          // Dragging UP relative to card i: swap to i when relY <= midpoint of i.
          newTargetIndex = dragIndex;
          for (let i = 0; i < targetLen; i++) {
            const midpoint = i * currentCardHeight + currentCardHeight / 2;
            if (i > dragIndex) {
              if (relY >= midpoint) {
                newTargetIndex = i;
              }
            } else if (i < dragIndex) {
              if (relY <= midpoint) {
                newTargetIndex = i;
                break;
              }
            }
          }
        } else {
          // Dragging across sections:
          newTargetIndex = Math.max(0, Math.floor(relY / currentCardHeight));
        }

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
    toIndexArg: number,
    targetSectionIdArg?: string | null,
  ) => {

    const targetSectionId = targetSectionIdArg ?? hoverState?.sectionId ?? sourceSectionId;
    const toIndex = toIndexArg ?? hoverState?.index ?? fromIndex;

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
              pendingSortUpdates.current[updatedActivity.id] = newSortOrder;
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

      // Only show the date text for the first activity of that day in this section
      let showDateText = false;
      if (eventActivity.startDate) {
        const currentDateString = new Date(eventActivity.startDate).toDateString();
        const hasDateAppearedBefore = array.slice(0, index).some((act) =>
          act.startDate && new Date(act.startDate).toDateString() === currentDateString
        );
        showDateText = !hasDateAppearedBefore;
      }

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
            plainMode={viewMode === "plain"}
            viewMode={viewMode}
            showDateText={showDateText}
            index={index}
            listLength={array.length}
            onDragStart={allowItemReordering ? (idx: number, h: number) =>
              handleSectionActivityDragStart(section.id || "", idx, h) : undefined
            }
            onDragEnd={allowItemReordering ? (fromIdx: number, toIdx: number, targetSecId?: string | null) =>
              handleSectionActivityDragEnd(
                section.id || "",
                eventActivity,
                fromIdx,
                toIdx,
                targetSecId
              ) : undefined
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
            dragIndex={sectionDragState?.dragIndex}
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

  const hasAtleastOneActivityDate = useMemo(() => {
    return sections.some((section) =>
      section.itineraryActivity?.some((activity) => activity.startDate)
    );
  }, [sections]);


  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        ref={scrollViewRef}
        onScroll={(e) => {
          scrollOffset.current = e.nativeEvent.contentOffset.y;
          const atTop = e.nativeEvent.contentOffset.y <= 5;
          if (atTop !== isAtTop) {
            setIsAtTop(atTop);
          }
          if (e.nativeEvent.contentOffset.y > 5) {
            collapseSettings();
          }
        }}
        onTouchStart={() => {
          collapseSettings();
        }}
        scrollEventThrottle={16}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        scrollEnabled={!sectionDragState?.isDragging && !masterDragState.isDragging && !isSettingsExpanded}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#263F69"]}
            tintColor="#263F69"
          />
        }
      >

        {sections.length === 0 || (sections.length === 1 && sections[0].isDefaultSection && sections[0].itineraryActivity.length === 0) ? (
          <View className="flex-1 items-center justify-center py-8 gap-1">
            <Icon name="add" size={46} color={"#D1D5DB"} />

            <Text className="text-2xl text-tertiary/50 text-center">
              No planned activities yet.
            </Text>
            <View className="text-center tracking-wide flex-row align-center gap-1 ">
              <TouchableOpacity
                onPress={() => openActivityModal(null, undefined, travelId)}
                accessibilityRole="button"
                activeOpacity={0.7}
                className="flex-row items-center"
              >
                <Icon name="add" size={16} color={"#263F69"} />
                <Text
                  className="font-medium text-base underline text-accent"
                >
                  Add activity
                </Text>
              </TouchableOpacity>
              <Text className="text-base text-tertiary">
                now, or
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddSectionVisible(true)}
                accessibilityRole="button"
                activeOpacity={0.7}
                className="flex-row items-center"
              >
                {/* <Icon name="add" size={16} color={colors.primary} /> */}
                <Text
                  className="font-medium text-base underline  text-accent"
                >
                  Create section
                </Text>
              </TouchableOpacity>
              <Text className="text-base text-tertiary">
                to organize itinerary.
              </Text>
            </View>

          </View>
        ) : (
          <View className={`flex-1 p-3 ${!hasAtleastOneActivityDate && sections.filter((section) => !section.isDefaultSection).length === 0 ? "-ml-4xl" : ""}`}>
            {viewMode !== 'plain' && (
              <View className={`flex-1 z-10 p-2 absolute rounded-full ${viewMode === "narrow" ? " ml-[58px]" : " ml-7xl"}`}>
                <Icon name="circle" size={18} color="#F97066" />
              </View>
            )}
            {sections.map((section, index) => {
              const isDefaultSection = section.isDefaultSection;
              if (isDefaultSection) {
                return (
                  <View
                    key={section.id}
                    collapsable={false}
                    ref={(ref) => {
                      if (ref && section.id) sectionRefs.current[section.id] = ref;
                    }}
                    style={{
                      zIndex: sectionDragState?.sectionId === section.id ? 99999 : 1,
                      elevation: sectionDragState?.sectionId === section.id ? 10 : 1,
                      overflow: "visible",
                      paddingTop: 10
                    }}
                  >
                    {section.itineraryActivity &&
                      renderActivityCards(section, section.itineraryActivity)}
                    {viewMode !== 'plain' && (
                      <View className={`absolute top-2 h-full w-md pb-lg ${viewMode === 'narrow' ? 'left-[60px]' : 'left-[66px] '} z-0`}>
                        <Svg height={viewMode === 'narrow' ? '103%' : '100%'} >
                          <Line
                            x1="2.5"
                            y1="2.5"
                            x2="2.5"
                            y2="100%"
                            stroke="#ccc"
                            strokeWidth="5"
                            strokeDasharray="0, 10"
                            strokeLinecap="round"
                          />
                        </Svg>
                      </View>
                    )}
                  </View>
                );
              } else if (viewMode === "plain") {
                return (
                  <FadeInView
                    type="right" delay={50} duration={250}
                    key={section.id}
                    className="mb-4">
                    <View className="flex-row items-center pb-3">
                      <Text className="text-base font-bold text-secondary">
                        {section.title}
                      </Text>
                    </View>

                    {section.itineraryActivity && section.itineraryActivity.length > 0 ? (
                      section.itineraryActivity.map(
                        (eventActivity, index, array) => {
                          return (
                            <TouchableOpacity
                              key={eventActivity.id || index}
                              activeOpacity={0.7}
                              accessibilityRole="button"
                              accessibilityLabel={`View activity ${eventActivity.title}`}
                              onPress={() => {
                                if (eventActivity.id) {
                                  setSelectedViewActivity({ id: eventActivity.id, travelId: section.travelId });
                                }
                              }}
                              className="ml-5 py-2 flex-row gap-x-3 items-center"
                            >
                              {/* <Ionicons name="location-outline" size={16} color="#dc3545" /> */}
                              <Ionicons name="chevron-forward" size={16} color="#344054" />
                              <Text className="text-lg text-secondary/80">{eventActivity.title}</Text>
                            </TouchableOpacity>
                          );
                        }
                      )) : (
                      <Text className="text-base text-tertiary leading-5 p-1 opacity-50 ml-12 tracking-wide">
                        No activity
                      </Text>
                    )}
                  </FadeInView>
                );
              } else {
                const subSections = sections.filter(s => s.isDefaultSection === false);
                const mapIndex = subSections.findIndex(s => s.id === section.id);
                const subSectionsLength = subSections.length;
                return (
                  <View key={section.id}
                    style={{ marginTop: index === 0 ? 24 : 0 }}>
                    <View className={`absolute top-9px h-full w-md  py-lg z-0 ${viewMode === "narrow" ? "left-[60px]" : "left-[66px]"}`}>
                      <View className={`absolute -top-xl bg-[#ccc] w-[5px] h-[5px] rounded-full`} />
                      <View className={`absolute -top-sm bg-[#ccc] w-[5px] h-[5px] rounded-full`} />
                    </View>
                    <FadeInView
                      type="right" delay={50} duration={250}>

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
                        allowItemReordering={allowItemReordering}
                        onPressMore={handleEditSection}
                      />

                      {/* //TODO: Hide this feat for now */}
                      {false && index === sections.length - 1 && (
                        <TouchableOpacity
                          // onPress={() => {
                          //   setModalVisible(true);
                          //   const defaultSection = sections.find(
                          //     (section) => section.isDefaultSection == true,
                          //   );
                          //   setCurrentSectionId(defaultSection?.id || null);
                          // }}

                          className="flex-row"
                        >
                          <Icon name="add" size={16} color={"#263F69"} />
                          <Text className="font-medium text-base text-primary underline">
                            Add section
                          </Text>
                        </TouchableOpacity>
                      )}

                    </FadeInView>

                    <View style={{ marginBottom: viewMode === "narrow" && subSectionsLength > 0 && index === subSectionsLength ? 16 : 0 }}>
                      <View className={`absolute top-9px h-full w-md  py-lg z-1 ${viewMode === "narrow" ? "left-[60px]" : "left-[66px]"}`}>
                        <View className={`absolute -top-xl bg-[#ccc] w-[5px] h-[5px] rounded-full`} />
                        <View className={`absolute -top-sm bg-[#ccc] w-[5px] h-[5px] rounded-full`} />
                      </View>
                    </View>
                  </View>
                );
              }
            })}

            {viewMode !== 'plain' && (
              <View className={`flex-1 z-10 px-2  w-4xl h-4xl rounded-full ${viewMode === "narrow" ? " ml-[46px]" : " ml-[50px] mt-[28px]"}`}>
                <View className={`${viewMode === 'narrow' ? 'hidden' : 'left-9px'}`}>
                  <View className={`absolute -top-xl bg-[#ccc] w-[5px] h-[5px] rounded-full `} />
                  <View className={`absolute -top-sm bg-[#ccc] w-[5px] h-[5px] rounded-full `} />
                </View>
                <Ionicons name="flag" size={20} color="#F97066" />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Settings Accordion Header */}
      <Animated.View
        pointerEvents="auto"
        style={{
          zIndex: 999999,
          position: "absolute",
          top: -60,
          right: 10,
        }}
      >
        <TouchableOpacity
          onPress={toggleSettings}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open Display Settings"
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="settings" size={28} color={"#263F69"} />
        </TouchableOpacity>
      </Animated.View>

      {/* Settings Accordion Body */}
      {/* Settings Bottom Form Sheet */}
      <Modal
        visible={isSettingsExpanded}
        transparent={true}
        animationType="none"
        onRequestClose={collapseSettings}
      >
        {/* Animated Backdrop cover */}
        <Animated.View
          className="flex-1 justify-end"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: settingsBackdropOpacity
          }}
        >
          {/* Backdrop Dismiss Overlay */}
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={collapseSettings}
          />

          {/* Bottom Sheet Container */}
          <Animated.View
            className="w-full px-6 pb-8"
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 16,
              transform: [{ translateY: settingsTranslateY }]
            }}
          >
            {/* Drag Handle Area */}
            <View
              {...settingsDragPanResponder.panHandlers}
              className="w-full items-center py-4 rounded-t-[28px]"
              style={{ backgroundColor: colors.surface }}
            >
              <View
                style={{
                  width: 42,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: colors.outline
                }}
              />
            </View>

            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-2xl font-bold text-accent"
              >
                Itinerary settings
              </Text>
              <TouchableOpacity
                onPress={() => alert(true)}
                accessibilityRole="button"
                accessibilityLabel="Show status explanation"
              >
                <Icon name="info" size={20} color={"#999"} />
              </TouchableOpacity>
            </View>

            {/* View Mode Selection Row */}
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-lg font-semibold" style={{ color: colors.onSurface }}>View style</Text>
                <Text className="text-base text-tertiary">Choose layout style for activities</Text>
              </View>
              <View
                className="flex-row rounded-full p-1 border"
                style={{
                  backgroundColor: colors.outlineVariant,
                  borderColor: colors.outline,
                }}
              >
                {(["plain", "narrow", "expanded"] as const).map((mode) => {
                  const isActive = viewMode === mode;
                  const config = viewModeConfig[mode];
                  return (
                    <TouchableOpacity
                      key={mode}
                      accessibilityRole="button"
                      accessibilityLabel={config.label}
                      accessibilityState={{ selected: isActive }}
                      onPress={() => handleModeChange(mode)}
                      style={{
                        backgroundColor: isActive ? colors.primary : "transparent",
                        width: 30,
                        height: 30,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        marginHorizontal: 3
                      }}
                    >
                      <MaterialIcons
                        name={config.icon}
                        size={20}
                        color={isActive ? colors.onPrimary : colors.onSurfaceVariant}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Divider */}
            <View className="h-1px mb-4" style={{ backgroundColor: colors.outlineVariant }} />

            {/* Reordering Permission Row */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="pr-8 flex-1">
                <Text className="text-lg font-semibold" style={{ color: colors.onSurface }}>Allow Drag & Drop reordering</Text>
                <Text className="text-base text-tertiary">Allow reordering of Sections and Activities that don't have dates</Text>
              </View>
              <Switch
                value={allowItemReordering}
                onValueChange={handleReorderToggle}
                trackColor={{ false: colors.outline, true: `${colors.primary}80` }}
                thumbColor={allowItemReordering ? colors.primary : colors.outlineVariant}
                ios_backgroundColor={colors.outline}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Create Section Modal */}
      <SectionModal
        visible={isAddSectionVisible}
        onClose={() => setIsAddSectionVisible(false)}
        itinerarySection={null}
        travelId={travelId}
      />

      {/* Edit Section Modal */}
      <SectionModal
        visible={editingSection !== null}
        onClose={() => setEditingSection(null)}
        itinerarySection={editingSection}
        travelId={travelId}
      />

      {/* View Activity Modal */}
      {selectedViewActivity && (
        <ViewActivityModal
          id={selectedViewActivity.id}
          travelId={selectedViewActivity.travelId}
          showModal={!!selectedViewActivity}
          setShowModal={(val) => {
            if (typeof val === "function") {
              setSelectedViewActivity((prev) => (val(!!prev) ? prev : null));
            } else if (!val) {
              setSelectedViewActivity(null);
            }
          }}
        />
      )}
    </View>
  );
};

export default SectionAccordion;
