import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Button,
} from "react-native";
import EditTravelItinerary from "../components/Edit/Itinerary";
// import AddMemberModal from "../components/AddMemberModal";
import { sampleFriends, Friend } from "../../../data/sampleFriends";
// import {
//   activitySectionService,
//   ActivitySection,
//   Activity,
// } from "../../../services/activitySectionService";
// import { activitySectionService } from "../../../_services/travel/activitySectionService";
import {
  Travel,
  ItinerarySection,
  ItineraryActivity,
} from "../../Travel/types/TravelDto";
import { sampleTravel, sampleActivities } from "../../../data/travels";
import Icon from "react-native-vector-icons/MaterialIcons";
import { TabStyle } from "../../../styles/common";
import Tabs from "../../../components/Tabs";
import { useRoute } from "@react-navigation/native";
import { useTravelPlan } from "../hooks/useTravel";
import {
  TravelProvider,
  useTravelContext,
} from "../../../context/TravelContext";

interface TripDetailPageProps {
  tripData: any;
  onBack: () => void;
}

type TabType = "detail" | "itinerary" | "checklist" | "members" | "settings";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

// interface EditTravelProps {
//   travelId: number;
// }

const EditTravelPlan = () => {
  const route = useRoute();
  // @ts-ignore
  const { travelId } = route.params || {};

  // const EditTravelPlan = ({ tripData, onBack }: TripDetailPageProps) => {
  const [travelData, setTravelData] = useState<Travel>(sampleTravel[0]);
  const [activeTab, setActiveTab] = useState<TabType>("detail");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [tripMembers, setTripMembers] = useState<Friend[]>([]);
  const [itineraryData, setItineraryData] = useState<{
    sections: ItinerarySection[] | undefined;
    activities: ItineraryActivity[] | undefined;
  }>({ sections: [], activities: [] });
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const { selectedTravelPlan, selectTravelPlan, clearTravelPlan } =
    useTravelContext();

  const {
    data: travelPlan,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching, // Good for showing a silent background loader
  } = useTravelPlan(travelId); // Pass the required ID

  useEffect(() => {
    const setTravelContext = async () => {
      if (travelPlan && travelPlan?.travel.id) {
        clearTravelPlan();
        const updatedTravelDetails = {
          id: travelPlan.travel.id,
          title: travelPlan.travel.title,
        };
        selectTravelPlan(updatedTravelDetails);
      }
    };

    setTravelContext();
  }, [travelPlan]);

  const handleAddMembers = (selectedFriends: Friend[]) => {
    setTripMembers([...tripMembers, ...selectedFriends]);
  };

  const handleOpenAddMemberModal = () => {
    console.log("Opening AddMemberModal with friends:", sampleFriends);
    setAddMemberModalVisible(true);
  };

  const refreshItinerary = async () => {
    refetch();
    setLoading(true);
    try {
      // const data = await activitySectionService.getItineraryByTripId(
      //   travelData.id
      // );
      // setItineraryData(data);
      // setItineraryData({
      //   sections: travelData?.itinerarySection,
      //   activities: sampleActivities,
      // });
    } catch (error) {
      console.error("Error refreshing itinerary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    // Refresh itinerary data when switching to itinerary tab
    if (tab === "itinerary") {
      refreshItinerary();
    }
  };

  const handleMenuPress = () => setMenuVisible(true);

  // const renderTabContent = () => {
  //   if (loading) {
  //     return (
  //       <View
  //         style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
  //       >
  //         <ActivityIndicator size="large" color="#183B7A" />
  //         <Text style={{ marginTop: 10, color: "#666" }}>
  //           Loading itinerary...
  //         </Text>
  //       </View>
  //     );
  //   }

  //   switch (activeTab) {
  //     case "detail":
  //       return <TripDetailTab tripData={travelData} />;
  //     case "itinerary":
  //       return (
  //         <EditTravelItinerary
  //           travelSections={travelPlan?.itinerarySection ?? null}
  //           onSave={() => {}}
  //           onBack={() => {}}
  //           // initialSections={itineraryData.sections}
  //           // initialActivities={itineraryData.activities}
  //           onRefresh={refreshItinerary}
  //         />
  //       );
  //     case "checklist":
  //       return (
  //         <TripChecklistTab
  //           checklistItems={checklistItems}
  //           setChecklistItems={setChecklistItems}
  //           newItemText={newItemText}
  //           setNewItemText={setNewItemText}
  //         />
  //       );
  //     case "members":
  //       return (
  //         <TripMembersTab
  //           tripMembers={tripMembers}
  //           onAddMember={handleOpenAddMemberModal}
  //         />
  //       );
  //     case "settings":
  //       return <TripSettingsTab />;
  //     default:
  //       return <TripDetailTab tripData={travelData} />;
  //   }
  // };

  const tabData = [
    {
      id: "itinerary",
      title: "Itinerary",
      content: (
        <EditTravelItinerary
          travelSections={travelPlan?.itinerarySection ?? null}
          onSave={() => {}}
          onBack={() => {}}
          onRefresh={refreshItinerary}
        />
      ),
    },
    {
      id: "detail",
      title: "Details",
      content: <TripDetailTab tripData={travelData} />,
    },
    {
      id: "checklist",
      title: "Checklist",
      content: (
        <TripChecklistTab
          checklistItems={checklistItems}
          setChecklistItems={setChecklistItems}
          newItemText={newItemText}
          setNewItemText={setNewItemText}
        />
      ),
    },
    {
      id: "participant",
      title: "Participants",
      content: (
        <TripMembersTab
          tripMembers={tripMembers}
          onAddMember={handleOpenAddMemberModal}
        />
      ),
    },
    {
      id: "setting",
      title: "Settings",
      content: (
        <TripMembersTab
          tripMembers={tripMembers}
          onAddMember={handleOpenAddMemberModal}
        />
      ),
    },
  ];

  if (isLoading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading travel details...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View>
        <Text>Error loading travel data: {error.message}</Text>
        <Button
          title={isRefetching ? "Retrying..." : "Try Again"}
          onPress={() => refetch()}
          disabled={isRefetching}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        <Text style={styles.headerTitle}>{travelPlan?.travel.title}</Text>
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>{selectedTravelPlan?.id}</Text>
        <Text style={styles.headerTitle}>{travelPlan?.travel.title}</Text>
        {/* <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreText}>⋮</Text>
        </TouchableOpacity> */}

        <TouchableOpacity onPress={() => handleMenuPress}>
          <Icon name="more-vert" size={24} color={"#000"} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <Tabs tabs={tabData} initialActiveTabId="itinerary" />
      </View>
      {/* 
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "detail" && TabStyle.activeTabButton,
          ]}
          onPress={() => handleTabPress("detail")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "detail" && TabStyle.activeTabText,
            ]}
          >
            Detail
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "itinerary" && styles.activeTab]}
          onPress={() => handleTabPress("itinerary")}
        >
          <Text
            style={[
              TabStyle.tabText,
              activeTab === "itinerary" && styles.activeTabText,
            ]}
          >
            Itinerary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "checklist" && styles.activeTab]}
          onPress={() => handleTabPress("checklist")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "checklist" && styles.activeTabText,
            ]}
          >
            Checklist
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "members" && styles.activeTab]}
          onPress={() => handleTabPress("members")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "members" && styles.activeTabText,
            ]}
          >
            Members
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "settings" && styles.activeTab]}
          onPress={() => handleTabPress("settings")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "settings" && styles.activeTabText,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View> */}

      {/* <View style={styles.content}>{renderTabContent()}</View> */}
      {/* 
      <AddMemberModal
        visible={addMemberModalVisible}
        onClose={() => setAddMemberModalVisible(false)}
        onAddMembers={handleAddMembers}
        friends={sampleFriends}
      /> */}
    </View>
  );
};

// Trip Checklist Tab Component
const TripChecklistTab = ({
  checklistItems,
  setChecklistItems,
  newItemText,
  setNewItemText,
}: {
  checklistItems: ChecklistItem[];
  setChecklistItems: (items: ChecklistItem[]) => void;
  newItemText: string;
  setNewItemText: (text: string) => void;
}) => {
  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false,
      };
      setChecklistItems([...checklistItems, newItem]);
      setNewItemText("");
    }
  };

  const toggleItem = (id: string) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const deleteItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const totalCount = checklistItems.length;

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.detailSection}>
        <View style={styles.checklistHeader}>
          <Text style={styles.sectionTitle}>Checklist</Text>
          <Text style={styles.checklistProgress}>
            {completedCount}/{totalCount} completed
          </Text>
        </View>

        <View style={styles.addItemContainer}>
          <TextInput
            style={styles.addItemInput}
            placeholder="Add new checklist item..."
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={addItem}
          />
          <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
            <Text style={styles.addItemButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.checklistContainer}>
          {checklistItems.length > 0 ? (
            checklistItems.map((item) => (
              <View key={item.id} style={styles.checklistItem}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    item.completed && styles.checkboxChecked,
                  ]}
                  onPress={() => toggleItem(item.id)}
                >
                  {item.completed && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <Text
                  style={[
                    styles.checklistItemText,
                    item.completed && styles.checklistItemCompleted,
                  ]}
                >
                  {item.text}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteItem(item.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyChecklist}>
              <Text style={styles.emptyText}>No checklist items yet.</Text>
              <Text style={styles.emptySubtext}>
                Add items to keep track of your trip preparations!
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// Trip Detail Tab Component
const TripDetailTab = ({ tripData }: { tripData: any }) => {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Trip Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Destination:</Text>
            <Text style={styles.infoValue}>{tripData.destination}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date:</Text>
            <Text style={styles.infoValue}>{tripData.startDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date:</Text>
            <Text style={styles.infoValue}>{tripData.endDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Budget:</Text>
            <Text style={styles.infoValue}>{tripData.budget}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <View style={styles.notesCard}>
          <Text style={styles.notesText}>
            {tripData.notes || "No notes added yet."}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Trip Members Tab Component
const TripMembersTab = ({
  tripMembers,
  onAddMember,
}: {
  tripMembers: Friend[];
  onAddMember: () => void;
}) => {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Trip Members</Text>
        <View style={styles.membersCard}>
          {tripMembers.length > 0 ? (
            <>
              {tripMembers.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={onAddMember}>
                <Text style={styles.addButtonText}>Add More Members</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No members added yet.</Text>
              <TouchableOpacity style={styles.addButton} onPress={onAddMember}>
                <Text style={styles.addButtonText}>Add Member</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// Trip Settings Tab Component
const TripSettingsTab = () => {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Trip Settings</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Edit Trip</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Share Trip</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Export Itinerary</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, styles.dangerItem]}>
            <Text style={[styles.settingLabel, styles.dangerText]}>
              Delete Trip
            </Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default EditTravelPlan;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: "#183B7A",
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#183B7A",
  },
  moreButton: {
    padding: 10,
  },
  moreText: {
    fontSize: 20,
    color: "#183B7A",
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderColor: "#DDD",
    flex: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomColor: "#183B7A",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#183B7A",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#183B7A",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#183B7A",
    fontWeight: "bold",
  },
  notesCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  membersCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#183B7A",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  settingsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingLabel: {
    fontSize: 16,
    color: "#183B7A",
  },
  settingArrow: {
    fontSize: 18,
    color: "#999",
  },
  dangerItem: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  dangerText: {
    color: "#FF3B30",
  },
  // Checklist styles
  checklistHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  checklistProgress: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  addItemContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 10,
  },
  addItemButton: {
    backgroundColor: "#183B7A",
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  addItemButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  checklistContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#183B7A",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#183B7A",
  },
  checkmark: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  checklistItemText: {
    flex: 1,
    fontSize: 16,
    color: "#183B7A",
  },
  checklistItemCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyChecklist: {
    padding: 40,
    alignItems: "center",
  },
  emptySubtext: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#183B7A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#183B7A",
  },
  memberEmail: {
    fontSize: 14,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
});
