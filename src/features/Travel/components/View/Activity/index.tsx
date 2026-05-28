import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TouchButton from "../../../../../components/atoms/TouchButton";
import Tabs from "../../../../../components/Tabs";
import { Typography } from "../../../../../styles/common";
import { useItineraryActivity } from "../../../hooks/useActivity";
import DetailsTab from "./Tabs/DetailsTab";
import ExpensesTab from "./Tabs/ExpensesTab";
import NotesTab from "./Tabs/NotesTab";
import ChecklistTab from "./Tabs/ChecklistTab";
import { FAB, Portal, Provider } from "react-native-paper";
import ExpenseModal from "../../Forms/Expense/Modal";
import NoteModal from "../../Forms/Note/Modal";

import { ItineraryExpense, ItineraryNote } from "../../../types/TravelDto";
import { ActivityType } from "../../../../../types/enums";

interface ViewTripActivityProps {
  id: string;
  onClose: () => void;
}

const ViewItineraryActivity = ({ id, onClose }: ViewTripActivityProps) => {
  const {
    data: itineraryActivity,
    isLoading,
    isError,
    error,
    refetch,
  } = useItineraryActivity(id);

  const [fabOpen, setFabOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Edit Activity modal


  // Expense modal state – null = closed, object = create/edit
  const [editingExpense, setEditingExpense] = useState<ItineraryExpense | null>(null);

  // Note modal state – null = closed, object = create/edit
  const [editingNote, setEditingNote] = useState<ItineraryNote | null>(null);

  // Stable callbacks so tabs don't re-render on unrelated state changes
  const handleOpenAddExpense = useCallback(() => {
    setFabOpen(false);
    setEditingExpense({
      activityId: id,
      travelId: itineraryActivity?.travelId,
      title: "",
      amount: 0,
      dateTime: new Date(),
    } as ItineraryExpense);
  }, [id, itineraryActivity?.travelId]);

  const handleOpenAddNote = useCallback(() => {
    setFabOpen(false);
    setEditingNote({
      activityId: id,
      travelId: itineraryActivity?.travelId,
      title: "",
    } as ItineraryNote);
  }, [id, itineraryActivity?.travelId]);

  const handleEditExpense = useCallback((expense: ItineraryExpense) => {
    setEditingExpense(expense);
  }, []);

  const handleEditNote = useCallback((note: ItineraryNote) => {
    setEditingNote(note);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#263F69" />
          <Text className="mt-2 text-gray-600">Loading activity details...</Text>
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

    return <Tabs tabs={tabData} type="secondary" initialActiveTabId="details" expanded={true} />;
  };

  const tabData = [
    { id: "details", title: "Details", content: <DetailsTab itineraryActivity={itineraryActivity} /> },
    { id: "checklist", title: "Checklist", content: <ChecklistTab activityId={id} /> },
    {
      id: "expenses",
      title: "Expenses",
      content: <ExpensesTab activityId={id} onEditExpense={handleEditExpense} />
,
    },
    {
      id: "notes",
      title: "Notes",
      content: <NotesTab activityId={id} onEditNote={handleEditNote} />,
    },
    { id: "map", title: "Map", content: <></> },
  ];

  return (
    <Provider>
      <View className="flex-1 bg-white">
        {/* Image gallery */}
        {itineraryActivity?.images && itineraryActivity.images.length > 0 && (
          <View className="my-1">
            <FlatList
              data={itineraryActivity.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, idx) => `${item.url}-${idx}`}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                setActiveImageIndex(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.url }}
                  style={{ width: Dimensions.get("window").width, height: 200 }}
                  resizeMode="cover"
                />
              )}
            />
            {itineraryActivity.images.length > 1 && (
              <View className="absolute bottom-2 left-0 right-0 flex-row justify-center gap-1.5">
                {itineraryActivity.images.map((_, idx) => (
                  <View
                    key={idx}
                    className={`w-2 h-2 rounded-full ${idx === activeImageIndex ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Activity header with edit button */}
        <View className="px-4 pt-4 pb-2 bg-white">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text style={Typography.h2}>{itineraryActivity?.title}</Text>
              <Text className="my-1 text-gray-600 leading-5">
                {itineraryActivity?.description}
              </Text>
              {itineraryActivity?.type != null && itineraryActivity.type !== ActivityType.none && (
                <View className="mt-1 self-start bg-blue-50 px-2 py-0.5 rounded-full">
                  <Text className="text-xs font-semibold text-[#263F69] uppercase tracking-wider">
                    {String(ActivityType[itineraryActivity.type]).replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                </View>
              )}
            </View>


          </View>
        </View>

        {/* Tabs */}
        <View className="pt-1 flex-1 bg-gray-100">
          {renderContent()}
        </View>

        {/* FAB Speed-dial */}
        <Portal>
          <FAB.Group
            open={fabOpen}
            visible={true}
            icon={fabOpen ? "close" : "plus"}
            actions={[
              {
                icon: "cash",
                label: "Add Expense",
                style: {
                    elevation: 0,
                    borderRadius: 50,
                    padding: 6,
                    backgroundColor: '#263F69',
                    marginRight: -6,
                    marginBottom: 10
                },
                color: 'white',
                onPress: handleOpenAddExpense,
              },
              {
                icon: "fountain-pen-tip",
                label: "Add Note",
                style: {
                    elevation: 0,
                    borderRadius: 50,
                    padding: 6,
                    backgroundColor: '#263F69',
                    marginRight: -6,
                    marginBottom: 10
                },
                color: 'white',
                onPress: handleOpenAddNote,
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
            fabStyle={{
                backgroundColor: fabOpen ? '#82181a' : '#263F69',
                borderRadius: 50,
            }}
            color="white"
          />
        </Portal>



        {/* Expense Modal (add or edit) */}
        {itineraryActivity && (
          <ExpenseModal
            visible={editingExpense !== null}
            itineraryExpense={editingExpense}
            activityId={id}
            activities={[itineraryActivity]}
            onClose={() => setEditingExpense(null)}
          />
        )}

        {/* Note Modal (add or edit) */}
        {itineraryActivity && (
          <NoteModal
            visible={editingNote !== null}
            itineraryNote={editingNote}
            activities={[itineraryActivity]}
            onClose={() => setEditingNote(null)}
          />
        )}
      </View>
    </Provider>
  );
};

export default ViewItineraryActivity;
