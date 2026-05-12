import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
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
          <ActivityIndicator size="large" color="#0C4C8A" />
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

    return <Tabs tabs={tabData} initialActiveTabId="details" />;
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
        {/* Hero image */}
        {itineraryActivity?.images && itineraryActivity.images.length > 0 && (
          <View className="my-1">
            <Image
              source={{ uri: itineraryActivity.images[0].url }}
              className="w-full h-[200px]"
              resizeMode="cover"
            />
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
              {itineraryActivity?.primaryType && (
                <View className="mt-1 self-start bg-blue-50 px-2 py-0.5 rounded-full">
                  <Text className="text-xs font-semibold text-[#0C4C8A] uppercase tracking-wider">
                    {itineraryActivity.primaryType}
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
                onPress: handleOpenAddExpense,
              },
              {
                icon: "fountain-pen-tip",
                label: "Add Note",
                onPress: handleOpenAddNote,
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
            fabStyle={{ backgroundColor: "#0C4C8A" }}
            color="#fff"
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
