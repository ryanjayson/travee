import { useNavigation, useRoute } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Text, TouchableOpacity,
  View
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import TouchButton from "../../../components/atoms/TouchButton";
import Tabs from "../../../components/Tabs";
import { Friend } from "../../../data/sampleFriends";
import {
  ItineraryActivity,
  ItinerarySection,
  Travel,
} from "../../Travel/types/TravelDto";
import CreateOrEdit, { CreateOrEditRef } from "../components/CreateOrEdit";
import EditTravelItinerary, { EditTravelItineraryRef } from "../components/Edit/Itinerary";
import FloatingAddButton from "../components/Edit/Itinerary/FloatingAddButton";
import TripChecklist from "../components/Forms/TripChecklist";
import TripMembers from "../components/Forms/TripMembers";
import { useTravelPlan } from "../hooks/useTravel";

type TabType = "detail" | "itinerary" | "checklist" | "members" | "settings";

const EditTravelPlan = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  // @ts-ignore
  const { travelId } = route.params || {};

  const [activeTab, setActiveTab] = useState<TabType>("itinerary");

  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [tripMembers, setTripMembers] = useState<Friend[]>([]);
  const [itineraryData, setItineraryData] = useState<{
    sections: ItinerarySection[] | undefined;
    activities: ItineraryActivity[] | undefined;
  }>({ sections: [], activities: [] });
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  const itineraryRef = useRef<EditTravelItineraryRef>(null);
  const formRef = useRef<CreateOrEditRef>(null);

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




  const refreshItinerary = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["checklistGroups", travelId] }),
        queryClient.invalidateQueries({ queryKey: ["checklistItems", travelId] }),
        queryClient.invalidateQueries({ queryKey: ["tripMembers", travelId] }),
        queryClient.invalidateQueries({ queryKey: ["memberSplitBills", travelId] }),
        queryClient.invalidateQueries({ queryKey: ["itineraryExpenses", travelId] }),
        queryClient.invalidateQueries({ queryKey: ["itineraryNotes", travelId] }),
      ]);
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
      content: (
        <CreateOrEdit 
          ref={formRef}
          tripData={travelPlan!?.travel} 
          mode="edit" 
          onClose={() => {
            setActiveTab("itinerary");
          }} 
          hideSubmitButton={true}
        />
      )
    },
    {
      id: "itinerary",
      title: "Itinerary",
      content: (
        <EditTravelItinerary
          ref={itineraryRef}
          travelSections={travelPlan?.itinerarySection ?? null}
          travelId={travelId}
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
          activities={travelPlan?.itinerarySection?.flatMap(s => s.itineraryActivity || []) || []}
          travelId={travelId}
        />
      ),
    },
    {
      id: "members",
      title: "Members",
      content: (
        <TripMembers
          travelId={travelId}
        />
      ),
    },
    // {
    //   id: "setting",
    //   title: "Settings",
    //   content: (
    //     <TripSettings />
    //   ),
    // },
  ];

  if (isLoading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading trip details...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View>
        <Text>Error loading trip data: {error.message}</Text>
        <TouchButton
          buttonText={isRefetching ? "Retrying..." : "Try Again"}
          onPress={() => refetch()}
          disabled={isRefetching}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pt-5xl">
      <View className="flex-row justify-between items-center px-5 bg-white ">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color={"#666"} />
        </TouchableOpacity>
        <Text className="text-xl text-secondary font-bold">Edit Trip</Text>

        <View className="w-4xl">
        </View>
      </View>

      <View className="flex-1 bg-gray-100">
        <Tabs 
          tabs={tabData} 
          type="secondary"
          initialActiveTabId="itinerary" 
          activeTabId={activeTab}
          onTabChange={(id) => setActiveTab(id as TabType)} 
        />

        {activeTab === "detail" && (
          <View className="mb-8 mt-2 left-[5%] absolute bottom-0 w-[90%]">
            <TouchButton
              buttonText={"Update changes"}
              icon={""}
              onPress={() => {
                formRef.current?.submit();
              }}
              className="h-7xl p-6"  
            />
          </View>
        )}

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
        </TouchableOpacity>ƒ
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


