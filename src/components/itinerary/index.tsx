import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
// import AddActivityModal from '../../components/AddActivityModal';
// import SectionModal from '../../components/SectionModal';
// import ActivityCard from '../../components/ActivityCard';
// import FloatingAddButton from '../../components/FloatingAddButton';
// import DraggableActivityItem from '../../components/DraggableActivityItem';
// import DraggableSectionActivityItem from '../../components/DraggableSectionActivityItem';
// import SectionDragHandle from '../../components/SectionDragHandle';

import { Activity, ActivitySection } from "../../dtos/ItineraryDto";

import { activitySectionService } from "../../services/travel/activitySectionService";
import { activityService } from "../../services/activityService";

interface Section {
  id: string;
  title: string;
  description: string;
  activities: Activity[];
  isCollapsed: boolean;
}

interface ActivityItemData {
  id: string;
  title: string;
  description: string;
  location: string;
}

interface TravelItineraryPageProps {
  travelData: any;
  onSave: (itineraryData: any) => void;
  onBack: () => void;
  initialSections?: ActivitySection[];
  initialActivities?: Activity[];
  onRefresh?: () => void;
}

const Itinerary = ({
  travelData,
  onSave,
  onBack,
  initialSections = [],
  initialActivities = [],
  onRefresh,
}: TravelItineraryPageProps) => {
  const [notes, setNotes] = useState("");
  const [activities, setActivities] = useState<Activity[]>(
    initialActivities.map((activity) => ({
      ...activity,
      location: activity.location || "",
    }))
  );
  const [sections, setSections] = useState<Section[]>(
    initialSections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      activities: (section.activities || []).map((activity) => ({
        ...activity,
        location: activity.location || "",
      })),
      isCollapsed: section.isCollapsed || false,
    }))
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [dayActivities, setDayActivities] = useState<ActivityItemData[]>([
    {
      id: "1",
      title: "Visit Eiffel Tower",
      description: "Iconic landmark and observation deck",
      location: "Eiffel Tower, Paris",
    },
    {
      id: "2",
      title: "Louvre Museum",
      description: "World-famous art museum",
      location: "Louvre Museum, Paris",
    },
    {
      id: "3",
      title: "Seine River Cruise",
      description: "Scenic boat tour along the Seine",
      location: "Seine River, Paris",
    },
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [sectionDragState, setSectionDragState] = useState<{
    sectionId: string;
    isDragging: boolean;
    dragIndex: number | null;
  } | null>(null);
  const [sectionOrderDrag, setSectionOrderDrag] = useState<{
    isDragging: boolean;
    dragIndex: number | null;
  } | null>(null);
  const [sectionMenuVisible, setSectionMenuVisible] = useState(false);
  const [currentSectionForMenu, setCurrentSectionForMenu] =
    useState<Section | null>(null);
  const [editSectionModalVisible, setEditSectionModalVisible] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editActivityModalVisible, setEditActivityModalVisible] =
    useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingActivityType, setEditingActivityType] = useState<
    "general" | "section" | null
  >(null);
  const [editingActivitySectionId, setEditingActivitySectionId] = useState<
    string | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recentDrop, setRecentDrop] = useState<{
    index: number;
    anim: Animated.Value;
  } | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Call the parent's refresh function if available
      if (travelData?.id) {
        // Use ActivityService to get activities
        const generalActivities = await activityService.getActivitiesByTravelId(
          travelData.id
        );

        // Update general activities
        setActivities(
          generalActivities.map((activity) => ({
            ...activity,
            location: activity.location || "",
          }))
        );

        // Update sections with their activities
        const updatedSections = await Promise.all(
          sections.map(async (section) => {
            try {
              const sectionActivities =
                await activityService.getActivitiesBySectionId(section.id);
              return {
                ...section,
                activities: sectionActivities.map((activity) => ({
                  ...activity,
                  location: activity.location || "",
                })),
              };
            } catch (error) {
              console.warn(
                `Failed to fetch activities for section ${section.id}:`,
                error
              );
              return section;
            }
          })
        );
        setSections(updatedSections);
      }

      // Call parent's onRefresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error refreshing itinerary:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddActivity = (
    title: string,
    description: string,
    location: string
  ) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      title,
      description,
      location,
    };

    if (currentSectionId) {
      // Add to specific section
      setSections(
        sections.map((section) =>
          section.id === currentSectionId
            ? { ...section, activities: [...section.activities, newActivity] }
            : section
        )
      );
    } else {
      // Add to general activities
      setActivities([...activities, newActivity]);
    }
  };

  const handleEditActivity = (
    title: string,
    description: string,
    location: string
  ) => {
    if (!editingActivity) return;

    const updatedActivity: Activity = {
      ...editingActivity,
      title,
      description,
      location,
    };

    if (editingActivityType === "section" && editingActivitySectionId) {
      // Update activity in section
      setSections(
        sections.map((section) =>
          section.id === editingActivitySectionId
            ? {
                ...section,
                activities: section.activities.map((activity) =>
                  activity.id === editingActivity.id
                    ? updatedActivity
                    : activity
                ),
              }
            : section
        )
      );
    } else {
      // Update general activity
      setActivities(
        activities.map((activity) =>
          activity.id === editingActivity.id ? updatedActivity : activity
        )
      );
    }
  };

  const handleAddSection = (title: string, description: string) => {
    const newSection: Section = {
      id: Date.now().toString(),
      title,
      description,
      activities: [],
      isCollapsed: false,
    };
    setSections([...sections, newSection]);
  };

  const handleEditSection = (title: string, description: string) => {
    if (!editingSection) return;

    const updatedSection: Section = {
      ...editingSection,
      title,
      description,
    };

    setSections(
      sections.map((section) =>
        section.id === editingSection.id ? updatedSection : section
      )
    );
  };

  const toggleSectionCollapse = (sectionId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, isCollapsed: !section.isCollapsed }
          : section
      )
    );
  };

  const handleActivityPress = (activity: Activity) => {
    setEditingActivity(activity);
    setEditingActivityType("general");
    setEditingActivitySectionId(null);
    setEditActivityModalVisible(true);
  };

  const handleSectionActivityPress = (
    activity: Activity,
    sectionId: string
  ) => {
    setEditingActivity(activity);
    setEditingActivityType("section");
    setEditingActivitySectionId(sectionId);
    setEditActivityModalVisible(true);
  };

  const handleActivityDragStart = (index: number) => {
    setIsDragging(true);
    setDragIndex(index);
  };

  const handleActivityDragEnd = (fromIndex: number, toIndex: number) => {
    const newActivities = [...activities];
    const [movedActivity] = newActivities.splice(fromIndex, 1);
    newActivities.splice(toIndex, 0, movedActivity);
    setActivities(newActivities);
    setIsDragging(false);
    setDragIndex(null);
  };

  const handleSectionActivityDragStart = (sectionId: string, index: number) => {
    setSectionDragState({ sectionId, isDragging: true, dragIndex: index });
  };

  const handleSectionActivityDragEnd = (
    sectionId: string,
    fromIndex: number,
    toIndex: number
  ) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const newActivities = [...section.activities];
          const [movedActivity] = newActivities.splice(fromIndex, 1);
          newActivities.splice(toIndex, 0, movedActivity);
          return { ...section, activities: newActivities };
        }
        return section;
      })
    );
    setSectionDragState(null);
  };

  const handleSectionDragStart = (index: number) => {
    setSectionOrderDrag({ isDragging: true, dragIndex: index });
  };

  const handleSectionDragEnd = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const [moved] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, moved);
    setSections(newSections);
    setSectionOrderDrag(null);

    // Trigger drop animation on the target index
    const anim = new Animated.Value(0);
    setRecentDrop({ index: toIndex, anim });
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setRecentDrop(null);
    });
  };

  const handleMenuPress = () => setMenuVisible(true);
  const handleMenuAddActivity = () => {
    setCurrentSectionId(null);
    setModalVisible(true);
    setMenuVisible(false);
  };
  const handleMenuAddSection = () => {
    setSectionModalVisible(true);
    setMenuVisible(false);
  };

  const handleSectionMenuPress = (section: Section) => {
    setCurrentSectionForMenu(section);
    setSectionMenuVisible(true);
  };

  const handleSectionMenuAddActivity = () => {
    if (currentSectionForMenu) {
      setCurrentSectionId(currentSectionForMenu.id);
      setModalVisible(true);
    }
    setSectionMenuVisible(false);
  };

  const handleSectionMenuEditSection = () => {
    if (currentSectionForMenu) {
      setEditingSection(currentSectionForMenu);
      setEditSectionModalVisible(true);
    }
    setSectionMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Itinerary</Text>
        <View style={styles.headerRight}>
          {refreshing && (
            <View style={styles.refreshIndicator}>
              <ActivityIndicator size="small" color="#183B7A" />
            </View>
          )}
          <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#183B7A"]}
            tintColor="#183B7A"
          />
        }
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Activities</Text>
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <TouchableOpacity
                key={activity.id}
                onPress={() => handleActivityPress(activity)}
                activeOpacity={0.7}
              >
                {/* <ActivityCard
                  title={activity.title}
                  description={activity.description}
                  location={activity.location || ""}
                  index={index}
                  onDragStart={handleActivityDragStart}
                  onDragEnd={handleActivityDragEnd}
                  isDragging={isDragging}
                  dragIndex={dragIndex}
                  listLength={activities.length}
                /> */}
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No activities added yet. Tap the + button to add one!
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sections</Text>
          {sections.length > 0 ? (
            sections.map((section, idx) => (
              <Animated.View
                key={section.id}
                style={[
                  styles.sectionCard,
                  sectionOrderDrag?.isDragging &&
                    sectionOrderDrag?.dragIndex === idx && {
                      transform: [{ scale: 1.05 }],
                      opacity: 0.8,
                      zIndex: 1000,
                      elevation: 10,
                    },
                  !(
                    sectionOrderDrag?.isDragging &&
                    sectionOrderDrag?.dragIndex === idx
                  ) &&
                    recentDrop?.index === idx && {
                      transform: [
                        {
                          scale: recentDrop.anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1.05, 1],
                          }),
                        },
                      ],
                      opacity: recentDrop.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1],
                      }),
                    },
                ]}
              >
                <View style={styles.sectionHeader}>
                  {/* <SectionDragHandle
                    index={idx}
                    listLength={sections.length}
                    onDragStart={handleSectionDragStart}
                    onDragEnd={handleSectionDragEnd}
                  /> */}
                  <TouchableOpacity
                    style={styles.sectionToggle}
                    onPress={() => toggleSectionCollapse(section.id)}
                  >
                    <Text style={styles.sectionToggleIcon}>
                      {section.isCollapsed ? "▶" : "▼"}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.sectionDescription}>
                      {section.description} | {section.activities.length}
                    </Text>
                    {section.activities.length > 0 && (
                      <Text style={styles.sectionActivityCount}>
                        {section.activities.length} activity
                        {section.activities.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.sectionMenuButton}
                    onPress={() => handleSectionMenuPress(section)}
                  >
                    <Text style={styles.sectionMenuIcon}>⋮</Text>
                  </TouchableOpacity>
                </View>

                {!section.isCollapsed && section.activities.length > 0 && (
                  <View style={styles.sectionActivities}>
                    {section.activities.map((activity, index) => (
                      <TouchableOpacity
                        key={activity.id}
                        onPress={() =>
                          handleSectionActivityPress(activity, section.id)
                        }
                        activeOpacity={0.7}
                      >
                        {/* <DraggableSectionActivityItem
                          id={activity.id}
                          title={activity.title}
                          description={activity.description}
                          location={activity.location || ""}
                          index={index}
                          onDragStart={(idx: number) =>
                            handleSectionActivityDragStart(section.id, idx)
                          }
                          onDragEnd={(fromIdx: number, toIdx: number) =>
                            handleSectionActivityDragEnd(
                              section.id,
                              fromIdx,
                              toIdx
                            )
                          }
                          isDragging={
                            sectionDragState?.sectionId === section.id &&
                            sectionDragState?.isDragging
                          }
                          dragIndex={
                            sectionDragState?.sectionId === section.id
                              ? sectionDragState.dragIndex
                              : null
                          }
                          listLength={section.activities.length}
                        /> */}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Animated.View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No sections added yet. Use the menu to add one!
            </Text>
          )}
        </View>
      </ScrollView>

      {/* <FloatingAddButton
        onPress={() => {
          setCurrentSectionId(null);
          setModalVisible(true);
        }}
      />

      <AddActivityModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setCurrentSectionId(null);
        }}
        onSave={handleAddActivity}
        travelId={travelData?.id}
        sectionId={currentSectionId || undefined}
      /> */}
      {/* <AddActivityModal
        visible={editActivityModalVisible}
        onClose={() => {
          setEditActivityModalVisible(false);
          setEditingActivity(null);
          setEditingActivityType(null);
          setEditingActivitySectionId(null);
        }}
        onSave={handleEditActivity}
        initialTitle={editingActivity?.title || ""}
        initialDescription={editingActivity?.description || ""}
        initialLocation={editingActivity?.location || ""}
        travelId={travelData?.id}
        sectionId={editingActivitySectionId || undefined}
        activityId={editingActivity?.id}
      />

      <SectionModal
        visible={sectionModalVisible}
        onClose={() => setSectionModalVisible(false)}
        onSave={handleAddSection}
        travelId={travelData?.id}
      />
      <SectionModal
        visible={editSectionModalVisible}
        onClose={() => {
          setEditSectionModalVisible(false);
          setEditingSection(null);
        }}
        onSave={handleEditSection}
        initialTitle={editingSection?.title || ""}
        initialDescription={editingSection?.description || ""}
        travelId={travelData?.id}
      /> */}

      {/* Main Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleMenuAddActivity}
            >
              <Text style={styles.menuItemText}>Add Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleMenuAddSection}
            >
              <Text style={styles.menuItemText}>Add Section</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Section Menu Modal */}
      <Modal
        visible={sectionMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSectionMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => setSectionMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSectionMenuAddActivity}
            >
              <Text style={styles.menuItemText}>Add Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSectionMenuEditSection}
            >
              <Text style={styles.menuItemText}>Edit Section</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FC",
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
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
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
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#183B7A",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  sectionMenuButton: {
    padding: 8,
  },
  sectionMenuIcon: {
    fontSize: 20,
    color: "#183B7A",
    fontWeight: "bold",
  },
  sectionActivities: {
    marginTop: 12,
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
    padding: 8,
  },
  sectionToggleIcon: {
    fontSize: 20,
    color: "#183B7A",
    fontWeight: "bold",
  },
  sectionActivityCount: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
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
  menuItem: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuItemText: {
    fontSize: 18,
    color: "#183B7A",
    fontWeight: "500",
  },
});

export default Itinerary;
