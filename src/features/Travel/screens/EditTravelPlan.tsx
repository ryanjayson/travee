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
    <View className="flex-1 bg-white pt-[40px]">
      <View className="flex-row justify-between items-center px-5 py-5 bg-white ">
        {/* <TouchableOpacity onPress={() => onBack()} className="p-[10px]">
          <Text className="text-[#183B7A] text-base">← Back</Text>
        <Text className="text-lg font-bold text-[#183B7A]">{travelPlan?.travel.title}</Text>
        </TouchableOpacity> */}
        {/* <Text className="text-lg font-bold text-[#183B7A]">{selectedTravelPlan?.id}</Text> */}
        <Text className="text-lg font-bold text-[#183B7A]">{travelPlan?.travel.title}</Text>
        {/* <TouchableOpacity className="p-[10px]">
          <Text className="text-[20px] text-[#183B7A]">⋮</Text>
        </TouchableOpacity> */}

        <TouchableOpacity onPress={() => handleMenuPress}>
          <Icon name="more-vert" size={24} color={"#000"} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 border-b border-[#DDD] bg-gray-100">
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
    <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-[#183B7A] mb-3">Checklist</Text>
          <Text className="text-sm text-[#666] font-medium">
            {completedCount}/{totalCount} completed
          </Text>
        </View>

        <View className="flex-row mb-4">
          <TextInput
            className="flex-1 bg-white rounded-lg px-[15px] py-3 text-base border border-[#E0E0E0] mr-2.5"
            placeholder="Add new checklist item..."
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={addItem}
          />
          <TouchableOpacity className="bg-[#183B7A] rounded-lg w-11 h-11 justify-center items-center" onPress={addItem}>
            <Text className="text-white text-xl font-bold">+</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-xl shadow-sm shadow-black/10 elevation-3">
          {checklistItems.length > 0 ? (
            checklistItems.map((item) => (
              <View key={item.id} className="flex-row items-center py-3 px-4 border-b border-[#F0F0F0]">
                <TouchableOpacity
                  className={`w-5 h-5 rounded border-2 border-[#183B7A] mr-3 justify-center items-center ${item.completed ? 'bg-[#183B7A]' : ''}`}
                  onPress={() => toggleItem(item.id)}
                >
                  {item.completed && <Text className="text-white text-xs font-bold">✓</Text>}
                </TouchableOpacity>
                <Text
                  className={`flex-1 text-base text-[#183B7A] ${item.completed ? 'line-through text-[#999]' : ''}`}
                >
                  {item.text}
                </Text>
                <TouchableOpacity
                  className="p-2"
                  onPress={() => deleteItem(item.id)}
                >
                  <Text className="text-[#FF3B30] text-lg font-bold">×</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View className="p-10 items-center">
              <Text className="text-[#888] italic text-center mb-4">No checklist items yet.</Text>
              <Text className="text-[#999] text-sm text-center mt-2">
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
    <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        <Text className="text-lg font-bold text-[#183B7A] mb-3">Trip Information</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/10 elevation-3">
          <View className="flex-row justify-between py-2 border-b border-[#F0F0F0]">
            <Text className="text-sm text-[#666] font-medium">Destination:</Text>
            <Text className="text-sm text-[#183B7A] font-bold">{tripData.destination}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-[#F0F0F0]">
            <Text className="text-sm text-[#666] font-medium">Start Date:</Text>
            <Text className="text-sm text-[#183B7A] font-bold">{tripData.startDate}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-[#F0F0F0]">
            <Text className="text-sm text-[#666] font-medium">End Date:</Text>
            <Text className="text-sm text-[#183B7A] font-bold">{tripData.endDate}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-[#F0F0F0]">
            <Text className="text-sm text-[#666] font-medium">Budget:</Text>
            <Text className="text-sm text-[#183B7A] font-bold">{tripData.budget}</Text>
          </View>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-bold text-[#183B7A] mb-3">Notes</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/10 elevation-3">
          <Text className="text-sm text-[#666] leading-5">
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
    <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        <Text className="text-lg font-bold text-[#183B7A] mb-3">Trip Members</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/10 elevation-3 items-center">
          {tripMembers.length > 0 ? (
            <>
              {tripMembers.map((member) => (
                <View key={member.id} className="flex-row items-center py-3 px-4 border-b border-[#F0F0F0] w-full">
                  <View className="w-10 h-10 rounded-full bg-[#183B7A] justify-center items-center mr-3">
                    <Text className="text-white text-lg font-bold">
                      {member.name.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-[#183B7A]">{member.name}</Text>
                    <Text className="text-sm text-[#666]">{member.email}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity className="bg-[#183B7A] rounded-lg px-5 py-2.5 mt-4" onPress={onAddMember}>
                <Text className="text-white text-sm font-bold">Add More Members</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View className="items-center py-5 w-full">
              <Text className="text-[#888] italic text-center mb-4">No members added yet.</Text>
              <TouchableOpacity className="bg-[#183B7A] rounded-lg px-5 py-2.5" onPress={onAddMember}>
                <Text className="text-white text-sm font-bold">Add Member</Text>
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
    <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        <Text className="text-lg font-bold text-[#183B7A] mb-3">Trip Settings</Text>
        <View className="bg-white rounded-xl shadow-sm shadow-black/10 elevation-3">
          <TouchableOpacity className="flex-row justify-between items-center py-4 px-4 border-b border-[#F0F0F0]">
            <Text className="text-base text-[#183B7A]">Edit Trip</Text>
            <Text className="text-lg text-[#999]">›</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-4 px-4 border-b border-[#F0F0F0]">
            <Text className="text-base text-[#183B7A]">Share Trip</Text>
            <Text className="text-lg text-[#999]">›</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-4 px-4 border-b border-[#F0F0F0]">
            <Text className="text-base text-[#183B7A]">Export Itinerary</Text>
            <Text className="text-lg text-[#999]">›</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-4 px-4 border-t border-[#F0F0F0]">
            <Text className="text-base text-[#FF3B30]">
              Delete Trip
            </Text>
            <Text className="text-lg text-[#999]">›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default EditTravelPlan;


