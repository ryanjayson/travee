import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TextInput,
  Button,
} from "react-native";
import { ItineraryActivity } from "../../../types/TravelDto";
import Tabs from "../../../../../components/Tabs";
import CommentSection from "../../CommentSection";
import ActivityLocationMap from "../../ActivityLocationMap";
import { Typography } from "../../../../../styles/common";
import { useItineraryActivity } from "../../../hooks/useActivity";

interface ViewTripActivityProps {
  id: number;
  onClose: () => void;
}

const ViewItineraryActivity = ({ id, onClose }: ViewTripActivityProps) => {
  const {
    data: itineraryActivity,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useItineraryActivity(id); // Pass the required ID

  useEffect(() => {
    console.log("ID", id);
    console.log("SELECTED", itineraryActivity);
  }, [itineraryActivity]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Loading activity details...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>
            Error: {error?.message || "Failed to load activity."}
          </Text>
          <Button title="Retry" onPress={() => refetch()} />
        </View>
      );
    }

    return <Tabs tabs={tabData} initialActiveTabId="details" />;
  };

  const AddComment = () => (
    <View
      style={{
        position: "absolute",
        bottom: 50,
        left: 0,
        right: 0,
        height: 70,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#DDD",
        padding: 10,
      }}
    >
      <TextInput
        style={{
          backgroundColor: "#EEE",
          borderRadius: 30,
          borderWidth: 1,
          padding: 10,
          height: 50,
          borderColor: "#DDD",
        }}
        placeholder="Comment as User name"
        multiline
        numberOfLines={4}
      />
    </View>
  );

  const TabDetails = () => (
    <View
      style={{
        padding: 10,
        backgroundColor: "#FFF",
      }}
    >
      <View style={{ flex: 2 }}></View>
    </View>
  );

  const TabComments = () => (
    <View
      style={{
        padding: 10,
        backgroundColor: "#FFF",
      }}
    >
      <View style={{ flex: 2 }}>
        <CommentSection />
      </View>
      <AddComment />
    </View>
  );

  const TabNotes = () => (
    <View>
      <Text style={styles.contentText}>Tab B features a list of settings.</Text>
    </View>
  );

  const TabMap = () => (
    <View>
      <Text style={styles.contentText}>Tab B features a list of settings.</Text>
      <ActivityLocationMap />
    </View>
  );

  const tabData = [
    { id: "details", title: "Details", content: <TabDetails /> },
    { id: "comments", title: "Comments", content: <TabComments /> },
    { id: "notes", title: "Notes", content: <TabNotes /> },
    { id: "map", title: "Map", content: <TabMap /> },
  ];

  return (
    <View style={{ height: "100%" }}>
      {itineraryActivity && itineraryActivity.images && (
        <View style={{ marginVertical: 4 }}>
          <Image
            src={itineraryActivity.images[0].url}
            style={styles.imageBanner}
          />
        </View>
      )}
      <View style={{ padding: 10, backgroundColor: "#FFF" }}>
        <Text style={Typography.h2}>{itineraryActivity?.title}</Text>
        <Text style={(Typography.body, [{ marginVertical: 10 }])}>
          {itineraryActivity?.description}
        </Text>
        <Text style={(Typography.body, [{ marginVertical: 10 }])}>
          {itineraryActivity?.primaryType}
        </Text>
      </View>
      <View style={{ paddingTop: 6, backgroundColor: "#FFF" }}>
        {renderContent()}
      </View>
    </View>
    //       {/* <ScrollView
    //     style={{
    //       borderColor: "#e0e0e0",
    //     }}
    //   >
    //     <View
    //       style={[
    //         styles.container,

    //         {
    //           flexDirection: "column",
    //         },
    //       ]}
    //     >
    //   // </ScrollView>*/}
    // </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  contentText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  header: {
    fontSize: 26,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 10,
    textAlign: "center",
    color: "#333",
  },
  innerContent: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#eef",
    borderRadius: 5,
  },
  innerContentText: {
    fontSize: 12,
    color: "#336699",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#183B7A",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#183B7A",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "white",
    fontWeight: "bold",
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
  },
  tripCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 1,
  },

  tripCardDetail: {
    padding: 10,
  },
  tripCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tripDestination: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#183B7A",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingBadge: {
    backgroundColor: "#E8F5E8",
  },
  pastBadge: {
    backgroundColor: "#F0F0F0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  upcomingText: {
    color: "#2E7D32",
  },
  pastText: {
    color: "#666",
  },
  tripDates: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#183B7A",
    fontWeight: "500",
  },
  tripBudget: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  budgetText: {
    fontSize: 14,
    color: "#183B7A",
    fontWeight: "500",
  },
  tripNotes: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#333",
  },
  tripActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#183B7A",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#183B7A",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  secondaryButtonText: {
    color: "#183B7A",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#183B7A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },

  imageBanner: {
    width: "auto",
    height: 200,
    resizeMode: "cover",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
});

export default ViewItineraryActivity;
