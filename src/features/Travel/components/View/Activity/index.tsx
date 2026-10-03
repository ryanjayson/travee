import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
} from "react-native";
import { FAB, Portal, Provider } from "react-native-paper";
import { activityIcons } from "../../../../../components/ActivityIcon";
import { FadeInView } from "../../../../../components/animations";
import TouchButton from "../../../../../components/atoms/TouchButton";
import Tabs from "../../../../../components/Tabs";
import { useTravelContext } from "../../../../../context/TravelContext";
import { useItineraryActivity } from "../../../hooks/useActivity";
import { useTravelPlan } from "../../../hooks/useTravel";
import ChecklistTab from "./Tabs/ChecklistTab";
import DetailsTab from "./Tabs/DetailsTab";
import ExpensesTab from "./Tabs/ExpensesTab";
import FilesTab from "./Tabs/FilesTab";
import NotesTab from "./Tabs/NotesTab";
import { MaterialIcons as Icon } from "@expo/vector-icons";

import { TripPlanType, getTripPlanTypeLabel, ActivityType, getActivityTypeLabel } from "../../../../../types/enums";
import { ACTIVITY_PLAN_TYPES } from "../../../constants/activityPlanTypes";
import { ItineraryExpense, ItineraryNote } from "../../../types/TravelDto";

interface ViewTripActivityProps {
  id: string;
  onClose?: () => void;
  translateY?: Animated.Value;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  isMidSnap?: boolean;
  isExpanded?: boolean;
  onScrollAtTopChange?: (isAtTop: boolean) => void;
}

const ViewItineraryActivity = ({
  id,
  onClose,
  translateY: _translateYProp,
  onSwipeLeft: _onSwipeLeft,
  onSwipeRight: _onSwipeRight,
  hasNext: _hasNext = false,
  hasPrev: _hasPrev = false,
  isMidSnap = false,
  isExpanded = false,
  onScrollAtTopChange,
}: ViewTripActivityProps) => {
  const {
    data: itineraryActivity,
    isLoading,
    isError,
    error,
    refetch,
  } = useItineraryActivity(id);

  const travelId = itineraryActivity?.travelId || "";
  const { data: travelPlan } = useTravelPlan(travelId);

  const sectionName = useMemo(() => {
    if (!travelPlan?.itinerarySection || !itineraryActivity?.sectionId) return null;
    const section = travelPlan.itinerarySection.find(
      (s) => s.id?.toString() === itineraryActivity.sectionId?.toString()
    );
    if (section && !section.isDefaultSection && section.title) {
      return section.title;
    }
    return null;
  }, [travelPlan?.itinerarySection, itineraryActivity?.sectionId]);

  const [fabOpen, setFabOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [showMoreButton, setShowMoreButton] = useState<boolean>(false);
  const { openExpenseModal, openNoteModal } = useTravelContext();
  const [_isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Reset states and fade in when activity ID changes
  useEffect(() => {
    setIsDescriptionExpanded(false);
    setShowMoreButton(false);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [id, fadeAnim]);

  // Handle Android back button/gesture to trigger onClose
  useEffect(() => {
    if (!onClose) return;

    const onBackPress = () => {
      onClose();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [onClose]);

  const description = itineraryActivity?.description?.trim();

  const handleOpenAddExpense = useCallback(() => {
    setFabOpen(false);
    openExpenseModal(
      {
        activityId: id,
        travelId: itineraryActivity?.travelId,
        title: "",
        amount: 0,
        dateTime: new Date(),
      } as ItineraryExpense,
      id,
      itineraryActivity ? [itineraryActivity] : []
    );
  }, [id, itineraryActivity, openExpenseModal]);

  const getActivityTypeDetails = (type: any) => {
    if (type == null) return { text: "None", color: "#9E9E9E" };
    const iconConfig = activityIcons.find((i) => i.activityType === type);
    const color = iconConfig?.color ?? "#9E9E9E";
    const text = type != null ? getTripPlanTypeLabel(type) : "None";
    return { text, color };
  };

  const getPlanTypeDetails = (planType: any) => {
    if (planType == null) return { text: "None", color: "#9E9E9E" };
    const match = ACTIVITY_PLAN_TYPES.find(
      (p) => p.type === planType || p.key === planType || String(p.type) === String(planType)
    );
    if (match) {
      return { text: match.label, color: match.color };
    }
    const label =
      typeof planType === "number" || (!isNaN(Number(planType)) && typeof planType !== "boolean")
        ? getActivityTypeLabel(Number(planType))
        : String(planType);
    return { text: label, color: "#c10003" };
  };

  const handleOpenAddNote = useCallback(() => {
    setFabOpen(false);
    openNoteModal(
      {
        activityId: id,
        travelId: itineraryActivity?.travelId,
        title: "",
      } as ItineraryNote,
      itineraryActivity ? [itineraryActivity] : []
    );
  }, [id, itineraryActivity, openNoteModal]);

  const handleEditExpense = useCallback(
    (expense: ItineraryExpense) => {
      openExpenseModal(expense, id, itineraryActivity ? [itineraryActivity] : []);
    },
    [id, itineraryActivity, openExpenseModal]
  );

  const handleEditNote = useCallback(
    (note: ItineraryNote) => {
      openNoteModal(note, itineraryActivity ? [itineraryActivity] : []);
    },
    [itineraryActivity, openNoteModal]
  );

  const tabData = [
    {
      id: "details",
      title: "Details",
      content: (
        <DetailsTab
          itineraryActivity={itineraryActivity}
          isMidSnap={isMidSnap}
          isExpanded={isExpanded}
          onScrollAtTopChange={onScrollAtTopChange}
        />
      ),
    },
    {
      id: "expenses",
      isVisible: false,
      title: "Expenses",
      icon: "receipt",
      content: <ExpensesTab activityId={id} onEditExpense={handleEditExpense} />,
    },
    {
      id: "checklist",
      title: "Checklist",
      // icon: "checklist",
      content: <ChecklistTab activityId={id} itineraryActivity={itineraryActivity} />,
    },
    {
      id: "notes",
      isVisible: false,
      title: "Notes",
      icon: "note",
      content: <NotesTab activityId={id} onEditNote={handleEditNote} />,
    },
    {
      id: "files",
      title: "Files",
      // icon: "description",
      content: <FilesTab itineraryActivity={itineraryActivity} onImageViewerToggle={setIsImageViewerOpen} />,
    },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#263F69" />
          <Text className="mt-2 text-gray-600">Loading activity details</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-600 text-sm mb-4 text-center">
            Error: {error?.message || "Failed to load activity."}
          </Text>
          <TouchButton buttonText="Retry" onPress={() => refetch()} />
        </View>
      );
    }

    return (
      <Tabs
        tabs={tabData}
        type="default"
        initialActiveTabId="details"
        expanded={true}
        applyFadeAnimation={false}
      />
    );
  };

  return (
    <Provider>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }} className="flex-1 bg-white">
        {/* Activity header */}
        <View className="px-5 pb-2 bg-white mt-1 w-full">
          <FadeInView key={`title-${id}`} type="right" delay={50} duration={350} className="w-full">
            {itineraryActivity?.type != null && (
              <View className="flex-row items-center ">
                {sectionName && (
                  <View className="flex-row items-center ">
                    <View className="bg-accent mr-0.5 px-2 py-0.5 rounded-xs">
                      <Text className="text-[8px] tracking-wider font-semibold text-white">
                        {sectionName}
                      </Text>
                    </View>
                    <Text className="text-base text-tertiary/50 mx-0.5">
                      /
                    </Text>
                  </View>
                )}
                <View
                  style={{ backgroundColor: getActivityTypeDetails(itineraryActivity.type).color + "20" }}
                  className="items-end rounded-xs px-2 py-0.5 mr-0.5"
                >

                  <Text
                    style={{ color: getActivityTypeDetails(itineraryActivity.type).color }}
                    className="text-[8px] tracking-wider uppercase font-extrabold"
                  >
                    {getActivityTypeDetails(itineraryActivity.type).text}
                  </Text>
                </View>

                {itineraryActivity.type == TripPlanType.activity && itineraryActivity.planType && (
                  <View className="flex-row items-center ml-0.5">
                    <Text className="text-base text-tertiary/50 mr-0.5">
                      /
                    </Text>
                    <View
                      style={{ backgroundColor: getPlanTypeDetails(itineraryActivity.planType).color + "20" }}
                      className="items-end rounded-xs px-2 py-0.5 mr-0.5"
                    >
                      <Text
                        style={{ color: getPlanTypeDetails(itineraryActivity.planType).color }}
                        className="text-[8px] font-semibold"
                      >
                        {getPlanTypeDetails(itineraryActivity.planType).text}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
            <Text className="text-4xl font-semibold mt-1" style={{ paddingBottom: description ? 2 : 0 }}
              numberOfLines={!isExpanded && !isMidSnap ? 1 : undefined}
            >
              {itineraryActivity?.title}
            </Text>

            {description && (
              <View className="w-full mt-1">
                {/* Hidden text element for un-truncated line measurement */}
                <Text
                  style={{ position: "absolute", opacity: 0, zIndex: -1000, left: 0, right: 0 }}
                  className="text-base text-[#999] leading-6"
                  onTextLayout={(e) => {
                    setShowMoreButton(e.nativeEvent.lines.length > 1);
                  }}
                >
                  {description}
                </Text>

                {/* Visible description text with Show More / Show Less button on same line */}
                {showMoreButton && !isDescriptionExpanded ? (
                  <View className="flex-row items-center w-full">
                    <Text
                      className="flex-1 text-base text-[#999] leading-6"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {description}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsDescriptionExpanded(true)}
                      accessibilityRole="button"
                      activeOpacity={0.7}
                      className="ml-1 shrink-0"
                    >
                      <Text className="text-md text-tertiary font-semibold underline">
                        Show more
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text className="text-base text-[#999] leading-6">
                    {description}
                    {showMoreButton && isDescriptionExpanded && (
                      <Text
                        onPress={() => setIsDescriptionExpanded(false)}
                        accessibilityRole="button"
                        className="text-md text-tertiary font-semibold underline"
                      >
                        {" Show less"}
                      </Text>
                    )}
                  </Text>
                )}
              </View>
            )}
          </FadeInView>
        </View>

        {/* Tabs */}
        <View className="flex-1"
          style={{ marginTop: !isMidSnap && !isExpanded ? 10 : 0 }}>
          <FadeInView key={`tabs-${id}`} type="right" delay={180} duration={400} style={{ flex: 1 }}>
            {renderContent()}
          </FadeInView>
        </View>

        {/* TODO: show when expense implemented */}
        <Portal>
          <FAB.Group
            open={fabOpen}
            visible={false}
            icon={fabOpen ? "close" : "plus"}
            actions={[
              {
                icon: "cash",
                label: "Add Expense",
                style: {
                  elevation: 0,
                  borderRadius: 50,
                  padding: 6,
                  backgroundColor: "#263F69",
                  marginRight: -6,
                  marginBottom: 10,
                },
                color: "white",
                onPress: handleOpenAddExpense,
              },
              {
                icon: "fountain-pen-tip",
                label: "Add Note",
                style: {
                  elevation: 0,
                  borderRadius: 50,
                  padding: 6,
                  backgroundColor: "#263F69",
                  marginRight: -6,
                  marginBottom: 10,
                },
                color: "white",
                onPress: handleOpenAddNote,
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
            fabStyle={{
              backgroundColor: fabOpen ? "#82181a" : "#263F69",
              borderRadius: 50,
            }}
            color="white"
          />
        </Portal>
      </Animated.View>
    </Provider>
  );
};

export default ViewItineraryActivity;