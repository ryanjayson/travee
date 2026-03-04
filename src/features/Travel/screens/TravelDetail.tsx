import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Itinerary from "../../../components/itinerary";
// import { activitySectionService } from "../../../services/activitySectionService";
import { travelService } from "../../../services/travelService";
import { ActivitySection } from "../../../dtos/ItineraryDto";

// import Checklist from "../../../components/Travel/Checklist";
// import Members from "../../../components/Travel/Participant";
// import Settings from "../../../components/Travel/Participant";
import { Travel } from "../../Travel/types/TravelDto";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TravelDetailPageProps {
  travelData: Travel;
  onBack: () => void;
}

type TabType = "detail" | "itinerary" | "checklist" | "members" | "settings";

const TravelDetail = ({ travelData, onBack }: TravelDetailPageProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("detail");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [itineraryData, setItineraryData] = useState<ActivitySection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItinerary = async () => {
      setLoading(true);
      try {
        const data = await travelService.getTravelItinerary(travelData.id!);
        setItineraryData(data);
      } catch (error) {
        console.error("Error fetching itinerary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [travelData.id]);

  const refreshItinerary = async () => {
    setLoading(true);
    try {
      // const data = await activitySectionService.getItineraryByTravelId(travelData.id);
      // setItineraryData(data);
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

  const renderTabContent = () => {
    if (loading) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#183B7A" />
          <Text style={{ marginTop: 10, color: "#666" }}>
            Loading itinerary...
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case "detail":
        return <TravelDetailTab travelData={travelData} />;
      case "itinerary":
        return (
          <Itinerary
            travelData={travelData}
            onSave={() => {}}
            onBack={() => {}}
            initialSections={itineraryData}
            initialActivities={itineraryData}
            onRefresh={refreshItinerary}
          />
        );
      case "checklist":
        return (
          // <Checklist
          //   checklistItems={checklistItems}
          //   setChecklistItems={setChecklistItems}
          //   newItemText={newItemText}
          //   setNewItemText={setNewItemText}
          // />
          <View></View>
        );
      case "members":
        return <View></View>;
      // <Members />;
      case "settings":
        return <View></View>;

      // return <Settings />;
      default:
        return <TravelDetailTab travelData={travelData} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{travelData.destination}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreText}>⋮</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "detail" && styles.activeTab]}
          onPress={() => handleTabPress("detail")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "detail" && styles.activeTabText,
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
              styles.tabText,
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
      </View>

      <View style={styles.content}>{renderTabContent()}</View>
    </View>
  );
};

// // Travel Checklist Tab Component
// const TravelChecklistTab = ({
//   checklistItems,
//   setChecklistItems,
//   newItemText,
//   setNewItemText
// }: {
//   checklistItems: ChecklistItem[];
//   setChecklistItems: (items: ChecklistItem[]) => void;
//   newItemText: string;
//   setNewItemText: (text: string) => void;
// }) => {
//   const addItem = () => {
//     if (newItemText.trim()) {
//       const newItem: ChecklistItem = {
//         id: Date.now().toString(),
//         text: newItemText.trim(),
//         completed: false,
//       };
//       setChecklistItems([...checklistItems, newItem]);
//       setNewItemText('');
//     }
//   };

//   const toggleItem = (id: string) => {
//     setChecklistItems(
//       checklistItems.map(item =>
//         item.id === id ? { ...item, completed: !item.completed } : item
//       )
//     );
//   };

//   const deleteItem = (id: string) => {
//     setChecklistItems(checklistItems.filter(item => item.id !== id));
//   };

//   const completedCount = checklistItems.filter(item => item.completed).length;
//   const totalCount = checklistItems.length;

//   return (
//     <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
//       <View style={styles.detailSection}>
//         <View style={styles.checklistHeader}>
//           <Text style={styles.sectionTitle}>Checklist</Text>
//           <Text style={styles.checklistProgress}>
//             {completedCount}/{totalCount} completed
//           </Text>
//         </View>

//         <View style={styles.addItemContainer}>
//           <TextInput
//             style={styles.addItemInput}
//             placeholder="Add new checklist item..."
//             value={newItemText}
//             onChangeText={setNewItemText}
//             onSubmitEditing={addItem}
//           />
//           <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
//             <Text style={styles.addItemButtonText}>+</Text>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.checklistContainer}>
//           {checklistItems.length > 0 ? (
//             checklistItems.map((item) => (
//               <View key={item.id} style={styles.checklistItem}>
//                 <TouchableOpacity
//                   style={[styles.checkbox, item.completed && styles.checkboxChecked]}
//                   onPress={() => toggleItem(item.id)}
//                 >
//                   {item.completed && <Text style={styles.checkmark}>✓</Text>}
//                 </TouchableOpacity>
//                 <Text style={[
//                   styles.checklistItemText,
//                   item.completed && styles.checklistItemCompleted
//                 ]}>
//                   {item.text}
//                 </Text>
//                 <TouchableOpacity
//                   style={styles.deleteButton}
//                   onPress={() => deleteItem(item.id)}
//                 >
//                   <Text style={styles.deleteButtonText}>×</Text>
//                 </TouchableOpacity>
//               </View>
//             ))
//           ) : (
//             <View style={styles.emptyChecklist}>
//               <Text style={styles.emptyText}>No checklist items yet.</Text>
//               <Text style={styles.emptySubtext}>Add items to keep track of your travel preparations!</Text>
//             </View>
//           )}
//         </View>
//       </View>
//     </ScrollView>
//   );
// };

// Travel Detail Tab Component
const TravelDetailTab = ({ travelData }: { travelData: Travel }) => {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Travel Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Destination:</Text>
            <Text style={styles.infoValue}>{travelData.destination}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date:</Text>
            {/* <Text style={styles.infoValue}>{travelData.startDate}</Text> */}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date:</Text>
            {/* <Text style={styles.infoValue}>{travelData.endDate}</Text> */}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Budget:</Text>
            <Text style={styles.infoValue}>{travelData.budget}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <View style={styles.notesCard}>
          <Text style={styles.notesText}>
            {travelData.notes || "No notes added yet."}
          </Text>
        </View>
      </View>
    </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
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
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
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

export default TravelDetail;
