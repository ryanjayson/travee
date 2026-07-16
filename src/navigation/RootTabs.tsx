import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { TravelProvider, useTravelContext } from "../context/TravelContext";
import { Text } from "react-native";

import TravelCatalog from "../features/Travel/screens/TravelCatalog";
import { ExploreScreen } from "../screens/MapScreen";
import HomeScreen from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import CreateTravelModal from "../features/Travel/components/CreateOrEdit/Modal";
import ViewTravelModal from "../features/Travel/components/View/Modal";
import ExpenseModal from "../features/Travel/components/Forms/Expense/Modal";
import NoteModal from "../features/Travel/components/Forms/Note/Modal";
import ChecklistModal from "../features/Travel/components/Forms/Checklist/Modal";
import ChecklistGroupModal from "../features/Travel/components/Forms/Checklist/ChecklistGroupModal";
import ActivityModal from "../features/Travel/components/Edit/Itinerary/Activity/Modal";
import MemberModal from "../features/Travel/components/Forms/Member/Modal";
import SectionModal from "../features/Travel/components/Edit/Itinerary/Section/Modal";
import DescriptionModal from "../components/molecules/DescriptionInput/Modal";
import MapboxDestinationSelectorModal from "../features/Travel/components/MapboxDestinationSelector/Modal";
import FlightModal from "../features/Travel/components/Forms/Flight/FlightModal";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';

const { width: WIDTH } = Dimensions.get('window');
// const TAB_WIDTH = WIDTH * 0.7;


export type RootTabsParamList = {
  Home: undefined;
  Trips: undefined;
  Maps: undefined;
  AddFab: undefined;
  // Profile: undefined;
  // Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabsParamList>();

function iconForRoute(routeName: keyof RootTabsParamList, focused: boolean) {
  switch (routeName) {
    case "Home":
      return focused ? "home" : "home-outline";
    case "Trips":
      return focused ? "briefcase" : "briefcase-outline";
    case "Maps":
      return focused ? "compass" : "compass-outline";
    // case "Profile":
    //   return focused ? "person" : "person-outline";
    // case "Settings":
    //   return focused ? "settings" : "settings-outline";
  }
}

const HomeTabScreen = () => {
  return <HomeScreen />;
};

// Tab screens can be used directly or wrapped if needed. We mount TravelCatalog directly.

function RootTabsComponent() { 
  const [visibleCreateTravelModal, setVisibleCreateTravelModal] = React.useState(false);
  const [showTravelViewModal, setShowTravelViewModal] = React.useState(false);
  const [selectedTravelId, setSelectedTravelId] = React.useState("");
  const {
    expenseModal,
    closeExpenseModal,
    noteModal,
    closeNoteModal,
    checklistModal,
    closeChecklistModal,
    checklistGroupModal,
    openChecklistGroupModal,
    closeChecklistGroupModal,
    activityModal,
    closeActivityModal,
    memberModal,
    closeMemberModal,
    descriptionModal,
    closeDescriptionModal,
    destinationModal,
    closeDestinationModal,
    flightModal,
    closeFlightModal,
    sectionModal,
    closeSectionModal,
  } = useTravelContext();
  const insets = useSafeAreaInsets();

  return (
    <>
    <View style={{flex: 1, height: "100%"}}>
   <Tab.Navigator 
        id="RootTabs"
        initialRouteName="Home"
      
        screenOptions={({ route }): BottomTabNavigationOptions => ({
        headerTitleAlign: "left",
        headerShadowVisible: false,
        tabBarShowLabel: true,
        
        tabBarActiveTintColor: '#0EA5E9',
        tabBarInactiveTintColor: '#98A2B3',
        tabBarIconStyle: {
          top: -2,
          padding: 0,
          margin: 0,
        },
        tabBarIcon: ({ color, focused }) => {
          const iconName = iconForRoute(route.name, focused);
          return (
            <View className="flex-1 justify-center items-center top-0">
            <Ionicons
              name={iconName}
              size={28}
              color={focused ? "#0EA5E9" : color}
            />
            <Text className={`text-xs font-bold  ${focused ? 'text-primary' : 'text-gray-400'}`}>{route.name}</Text>
            </View>
          );
        },

      tabBarStyle: {
        position: 'absolute',
        marginLeft: WIDTH - 250 - 140,
        bottom: insets.bottom + 5,
        width: 250,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        borderTopWidth: 0,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      },
        })}
      >
        <Tab.Screen name="Home" component={HomeTabScreen} options={{ headerShown: false }} />  
        <Tab.Screen 
          name="Trips" 
          component={TravelCatalog} 
          options={{
            headerRight: () => (
              <TouchableOpacity 
                onPress={() => setVisibleCreateTravelModal(true)}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="add" size={32} color="#0EA5E9" />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen name="Maps" component={ExploreScreen} options={{ headerShown: false }} />  
      </Tab.Navigator>

      {/* Floating Add Button on the right side */}
      <TouchableOpacity 
        onPress={() => setVisibleCreateTravelModal(true)}
        className="bg-[#0EA5E9]"
        style={{
          position: 'absolute',
          bottom: insets.bottom + 5,
          left: WIDTH - 120,
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: '#0EA5E9',
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={40} color="#ffffff" />
        {/* <Text className="text-xs font-bold text-white">Add a trip</Text> */}
      </TouchableOpacity>

      <CreateTravelModal
        showModal={visibleCreateTravelModal}
        setShowModal={setVisibleCreateTravelModal}
        onCreated={(createdId) => {
          setSelectedTravelId(createdId);
          setShowTravelViewModal(true);
        }}
      />
      <ViewTravelModal
        travelId={selectedTravelId}
        showModal={showTravelViewModal}
        setShowModal={setShowTravelViewModal}
      />
      <ExpenseModal
        visible={expenseModal.visible}
        itineraryExpense={expenseModal.itineraryExpense}
        activityId={expenseModal.activityId}
        activities={expenseModal.activities}
        travelId={expenseModal.travelId}
        onClose={closeExpenseModal}
      />
      <NoteModal
        visible={noteModal.visible}
        itineraryNote={noteModal.itineraryNote}
        activities={noteModal.activities}
        travelId={noteModal.travelId}
        onClose={closeNoteModal}
      />
      <ChecklistModal
        visible={checklistModal.visible}
        checklistItem={checklistModal.checklistItem}
        activities={checklistModal.activities}
        travelId={checklistModal.travelId}
        onClose={closeChecklistModal}
        onOpenNewGroupModal={() => openChecklistGroupModal(checklistModal.travelId)}
      />
      <ChecklistGroupModal
        visible={checklistGroupModal.visible}
        travelId={checklistGroupModal.travelId}
        onClose={closeChecklistGroupModal}
      />
      <ActivityModal
        visible={activityModal.visible}
        itineraryActivity={activityModal.itineraryActivity}
        itinerarySectionId={activityModal.itinerarySectionId}
        travelId={activityModal.travelId}
        onClose={closeActivityModal}
      />
      <MemberModal
        visible={memberModal.visible}
        editingMember={memberModal.editingMember}
        travelId={memberModal.travelId}
        onClose={closeMemberModal}
      />
      <DescriptionModal
        visible={descriptionModal.visible}
        onClose={closeDescriptionModal}
        value={descriptionModal.value}
        onConfirm={descriptionModal.onConfirm}
        label={descriptionModal.label}
        placeholder={descriptionModal.placeholder}
        confirmLabel={descriptionModal.confirmLabel}
        maxLength={descriptionModal.maxLength}
      />
      <MapboxDestinationSelectorModal
        visible={destinationModal.visible}
        initialValue={destinationModal.initialValue}
        onSelect={(place) => {
          if (destinationModal.onSelect) {
            destinationModal.onSelect(place);
          }
          closeDestinationModal();
        }}
        onClose={closeDestinationModal}
      />
      <FlightModal
        visible={flightModal.visible}
        onConfirm={(flightData) => {
          if (flightModal.onConfirm) {
            flightModal.onConfirm(flightData);
          }
          closeFlightModal();
        }}
        onClose={closeFlightModal}
      />
      <SectionModal
        visible={sectionModal.visible}
        itinerarySection={sectionModal.itinerarySection}
        travelId={sectionModal.travelId}
        onClose={closeSectionModal}
        onSaveSuccess={sectionModal.onSaveSuccess}
      />
    </View>      
 
    </>

  );
}

export function RootTabs() {
  return (
    <TravelProvider>
      <RootTabsComponent />
    </TravelProvider>
  );
}
