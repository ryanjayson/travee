import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import TouchButton from "../../../components/atoms/TouchButton";
import EditTravelItinerary, { EditTravelItineraryRef } from "../components/Edit/Itinerary";
import FloatingAddButton from "../components/Edit/Itinerary/FloatingAddButton";
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
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTravelPlan } from "../hooks/useTravel";
import {
  TravelProvider,
  useTravelContext,
} from "../../../context/TravelContext";
import TripDetail from "../components/Forms/TripDetail";
import TripChecklist, { ChecklistItem } from "../components/Forms/TripChecklist";
import TripMembers from "../components/Forms/TripMembers";
import TripSettings from "../components/Forms/TripSettings";

interface TripDetailPageProps {
  tripData: any;
  onBack: () => void;
}

type TabType = "detail" | "itinerary" | "checklist" | "members" | "settings";



// interface EditTravelProps {
//   travelId: number;
// }

const EditTravelPlan = () => {
  const route = useRoute();
  const navigation = useNavigation();
  // @ts-ignore
  const { travelId } = route.params || {};

  // const EditTravelPlan = ({ tripData, onBack }: TripDetailPageProps) => {
  const [travelData, setTravelData] = useState<Travel>(sampleTravel[0]);
  const [activeTab, setActiveTab] = useState<TabType>("itinerary");
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

  const itineraryRef = useRef<EditTravelItineraryRef>(null);

  const handleAddSection = () => itineraryRef.current?.handleAddSection();
  const handleAddActivity = () => itineraryRef.current?.handleAddActivity();

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
      id: "detail",
      title: "Details",
      content: <TripDetail tripData={travelPlan!.travel} />,
    },
    {
      id: "itinerary",
      title: "Itinerary",
      content: (
        <EditTravelItinerary
          ref={itineraryRef}
          travelSections={travelPlan?.itinerarySection ?? null}
          onSave={() => {}}
          onBack={() => {}}
          onRefresh={refreshItinerary}
        />
      ),
    },
    {
      id: "checklist",
      title: "Checklist",
      content: (
        <TripChecklist
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
        <TripMembers
          tripMembers={tripMembers}
          onAddMember={handleOpenAddMemberModal}
        />
      ),
    },
    {
      id: "setting",
      title: "Settings",
      content: (
        <TripSettings />
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
        <TouchButton
          buttonText={isRefetching ? "Retrying..." : "Try Again"}
          onPress={() => refetch()}
          disabled={isRefetching}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pt-[40px]">
      <View className="flex-row justify-between items-center px-5 pt-5 bg-white ">
        {/* <TouchableOpacity onPress={() => onBack()} className="p-[10px]">
          <Text className="text-[#183B7A] text-base">← Back</Text>
        <Text className="text-lg font-bold text-[#183B7A]">{travelPlan?.travel.title}</Text>
        </TouchableOpacity> */}
        {/* <Text className="text-lg font-bold text-[#183B7A]">{selectedTravelPlan?.id}</Text> */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color={"#666"} />
        </TouchableOpacity>
        <Text className="text-2xl tracking-wider font-bold">{travelPlan?.travel.title}</Text>
        <TouchableOpacity onPress={() => handleMenuPress}>
          <Icon name="more-horiz" size={28} color={"#666"} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 bg-gray-100">
        <Tabs 
          tabs={tabData} 
          initialActiveTabId="itinerary" 
          onTabChange={(id) => setActiveTab(id as TabType)} 
        />
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

      {activeTab === "itinerary" && (
        <FloatingAddButton
          onAddSection={handleAddSection}
          onAddActivity={handleAddActivity}
        />
      )}
    </View>
  );
};



export default EditTravelPlan;


