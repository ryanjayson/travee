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

import { ActivityType, getActivityTypeLabel } from "../../../../../types/enums";
import { ItineraryExpense, ItineraryNote } from "../../../types/TravelDto";

interface ViewTripActivityProps {
  id: string;
  onClose?: () => void;
  translateY?: Animated.Value;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const ViewItineraryActivity = ({
  id,
  onClose,
  translateY: _translateYProp,
  onSwipeLeft: _onSwipeLeft,
  onSwipeRight: _onSwipeRight,
  hasNext: _hasNext = false,
  hasPrev: _hasPrev = false,
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
    const text = type != null ? getActivityTypeLabel(type) : "None";
    return { text, color };
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
    { id: "details", title: "Details", content: <DetailsTab itineraryActivity={itineraryActivity} /> },
    {
      id: "expenses",
      isVisible: false,
      title: "Expenses",
      icon: "receipt",
      content: <ExpensesTab activityId={id} onEditExpense={handleEditExpense} />,
    },
    {
      id: "checklist",
      title: "Checklists",
      icon: "checklist",
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
      icon: "description",
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
        {sectionName && (
          <View className="px-5 pt-2">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {sectionName}
            </Text>
          </View>
        )}

        {/* Activity header with edit button */}
        <View className="px-5 pb-2 bg-white mt-2">
          <View className="flex-row items-start justify-between">
            <View className="flex-row">

              <FadeInView key={`title-${id}`} type="right" delay={50} duration={350}>
                {itineraryActivity?.type != null && itineraryActivity.type !== ActivityType.plan && (
                  <View className="flex-row items-center -mt-2 mb-2">
                    <View
                      style={{ backgroundColor: getActivityTypeDetails(itineraryActivity.type).color + "20" }}
                      className="items-end rounded-xs px-2 py-0.5"
                    >
                      <Text
                        style={{ color: getActivityTypeDetails(itineraryActivity.type).color }}
                        className="text-[8px] tracking-wider uppercase font-extrabold"
                      >
                        {getActivityTypeDetails(itineraryActivity.type).text}
                      </Text>
                    </View>
                  </View>
                )}
                <Text className="text-xl font-semibold" style={{ paddingBottom: description ? 6 : 0 }}>
                  {itineraryActivity?.title}
                </Text>
              </FadeInView>

              {description && (
                <FadeInView key={`desc-${id}`} type="right" delay={120} duration={350}>
                  <View>
                    {/* Hidden text element for un-truncated line measurement */}
                    <Text
                      style={{ position: "absolute", opacity: 0, zIndex: -1000 }}
                      className="text-base text-[#999] leading-6"
                      onTextLayout={(e) => {
                        setShowMoreButton(e.nativeEvent.lines.length > 1);
                      }}
                    >
                      {description}
                    </Text>

                    {/* Visible description text with Show More / Show Less button on same line */}
                    {showMoreButton && !isDescriptionExpanded ? (
                      <View className="flex-row items-center">
                        <Text
                          className="flex-1 text-base text-[#999] leading-6"
                          numberOfLines={1}
                        >
                          {description}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setIsDescriptionExpanded(true)}
                          accessibilityRole="button"
                          className="ml-1"
                        >
                          <Text className="text-sm text-secondary font-medium underline">
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
                            className="text-sm text-secondary font-medium underline"
                          >
                            {" Show less"}
                          </Text>
                        )}
                      </Text>
                    )}
                  </View>
                </FadeInView>
              )}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-1">
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