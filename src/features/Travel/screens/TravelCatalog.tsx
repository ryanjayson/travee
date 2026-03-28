import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Button,
} from "react-native";
// import FloatingAddButton from "../../../components/FloatingAddButton";
import CreateTravelModal from "../components/Create/Modal";
import TravelDetailPage from "./TravelDetail";
import ViewTravelModal from "../components/View/Modal";
import { travelService } from "../../../services/travel/travelApi";
import { Travel, CreateTravelData } from "../types/TravelDto";
import { TravelStatus } from "../../../types/enums";
// import { sampleTravel } from "../../../data/travels";
import { useTravels } from "../hooks/useTravel";
import { useTravelContext } from "../../../context/TravelContext";

interface TravelPageProps {
  onBack?: () => void;
  onAddTravel?: () => void;
}

type TravelTabType = "upcoming" | "past";

//TODO: rename to TravelDashboard and cleanup
const TravelCatalog = ({ onBack, onAddTravel }: TravelPageProps) => {
  const { data: travels, isLoading, isError, error, refetch } = useTravels();
  const [activeTab, setActiveTab] = useState<TravelTabType>("upcoming");
  const [visibleCreateTravelModal, setVisibleCreateTravelModal] =
    useState<boolean>(false);
  const [showTravelViewModal, setShowTravelViewModal] =
    useState<boolean>(false);
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
  const [showTravelDetail, setShowTravelDetail] = useState(false);
  const [upcomingTravels, setUpcomingTravels] = useState<Travel[]>([]);
  const [pastTravels, setPastTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { selectedTravelPlan, selectTravelPlan, clearTravelPlan } =
    useTravelContext();

  const fetchTravels = async (status?: "upcoming" | "past") => {
    try {
      refetch();
      setLoading(true);
      // setError(null);

      // let fetchedTravels: Travel[];
      // fetchedTravels = await travelService.getTravelsByStatus([
      //   TravelStatus.Upcoming,
      //   TravelStatus.Completed,
      // ]);

      // setTravels(fetchedTravels);
      // setTravels(sampleTravel);
    } catch (err) {
      console.error("Failed to fetch travels:", err);
      // setError("Failed to load travels. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
    // await fetchTravels(activeTab);
    setRefreshing(false);
  };

  useEffect(() => {
    if (travels && travels.length > 0) {
      setUpcomingTravels(
        travels?.filter(
          (travel: Travel) => travel.status === TravelStatus.Upcoming,
        ),
      );

      setPastTravels(
        travels?.filter(
          (travel: Travel) => travel.status === TravelStatus.Draft,
        ),
      );
    }
  }, [travels]);

  useEffect(() => {
    fetchTravels(activeTab);
  }, [activeTab]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAddTravel = () => {
    setVisibleCreateTravelModal(true);
  };

  const handleSaveTravel = async (travelData: CreateTravelData) => {
    try {
      // const newTravel = await travelService.createTravel(travelData);
      // setTravels((prevTravels) => [newTravel, ...prevTravels]);
      // setVisibleCreateTravelModal(false);
    } catch (err) {
      console.error("Failed to create travel:", err);
      // You could show an error toast here
    }
  };

  // const handleViewDetails = (travel: Travel) => {
  //   setSelectedTravel(travel);
  //   setShowTravelDetail(true);
  // };

  const handleViewModeTravel = (travel: Travel) => {
    debugger;
    if (travel && travel.id) {
      const tripDetails = {
        id: travel.id,
        title: travel.title,
      };
      selectTravelPlan(tripDetails);
      setSelectedTravel(travel);
      setShowTravelViewModal(true);
    }
  };

  const handleBackFromTravelDetail = () => {
    setShowTravelDetail(false);
    setSelectedTravel(null);
    // Refresh travels when returning from detail page
    fetchTravels(activeTab);
  };

  const renderTravelCard = (travel: Travel) => (
    <View key={travel.id} style={styles.travelCard}>
      <TouchableOpacity onPress={() => handleViewModeTravel(travel)}>
        <View style={styles.container}>
          {/* <Image
            source={require("../../../assets/images/japan.jpg")}
            style={styles.image}
          /> */}
        </View>

        <View style={styles.travelCardDetail}>
          <View style={styles.travelCardHeader}>
            <Text style={styles.travelDestination}>{travel.title}</Text>
            <Text style={styles.travelDestination}>{travel.destination}</Text>
            <View
              style={[
                styles.statusBadge,
                travel.status === TravelStatus.Upcoming
                  ? styles.upcomingBadge
                  : styles.pastBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  travel.status === TravelStatus.Upcoming
                    ? styles.upcomingText
                    : styles.pastText,
                ]}
              >
                {travel.status === TravelStatus.Draft ? "Draft" : "Past"}
              </Text>
            </View>
          </View>
          <View style={styles.travelDates}>
            <Text style={styles.dateLabel}>3 Days | 12-20-2025</Text>
            {/* <Text style={styles.dateText}>
                    {formatDate(travel.startDate)} - {formatDate(travel.endDate)}
                  </Text> */}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#183B7A" />
      <Text style={styles.loadingText}>Loading travels...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      {/* <Text style={styles.errorMessage}>{error}</Text> */}
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => fetchTravels(activeTab)}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    // if (loading) {
    //   return renderLoadingState();
    // }

    // if (error) {
    //   return renderErrorState();
    // }

    if (activeTab === "upcoming") {
      return (
        <ScrollView
          style={styles.tabContent}
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
          {upcomingTravels && upcomingTravels?.length > 0 ? (
            upcomingTravels?.map(renderTravelCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✈️</Text>
              <Text style={styles.emptyTitle}>No Upcoming Travel</Text>
              <Text style={styles.emptySubtitle}>
                Start planning your next adventure!
              </Text>
            </View>
          )}
        </ScrollView>
      );
    } else {
      return (
        <ScrollView
          style={styles.tabContent}
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
          {pastTravels && pastTravels.length > 0 ? (
            pastTravels.map(renderTravelCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📸</Text>
              <Text style={styles.emptyTitle}>No Past Travels</Text>
              <Text style={styles.emptySubtitle}>
                Your travel memories will appear here
              </Text>
            </View>
          )}
        </ScrollView>
      );
    }
  };

  if (showTravelDetail && selectedTravel) {
    return (
      <TravelDetailPage
        travelData={selectedTravel}
        onBack={handleBackFromTravelDetail}
      />
    );
  }

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle={"dark-content"} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Travels {travels?.length}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming ({upcomingTravels?.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.activeTab]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.activeTabText,
            ]}
          >
            Past ({pastTravels?.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/*  
  if (isError) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
        <Button title="Reload" onPress={() => refetch()} />
      </View>
    );
  } */}
      <View style={styles.content}>
        {/* 1. CHECK LOADING STATE (Highest Precedence) */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text>Loading your travel plans...</Text>
          </View>
        ) : // 2. CHECK ERROR STATE (If not loading, check for errors)
        isError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>Error: {error.message}</Text>
            <Button title="Reload" onPress={() => refetch()} />
          </View>
        ) : (
          // 3. SUCCESS STATE (If not loading AND not in error, render content)
          // We assume data is present here, or ListEmptyComponent will handle empty data
          renderTabContent()
        )}
      </View>
      {/* <FloatingAddButton onPress={handleAddTravel} /> */}

      <CreateTravelModal
        showModal={visibleCreateTravelModal}
        setShowModal={setVisibleCreateTravelModal}
      />

      <ViewTravelModal
        travelId={selectedTravelPlan?.id || 0}
        showModal={showTravelViewModal}
        setShowModal={setShowTravelViewModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", margin: 10 },
  screenContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
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
  travelCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 1,
  },

  travelCardDetail: {
    padding: 10,
  },
  travelCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  travelDestination: {
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
  travelDates: {
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
  travelBudget: {
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
  travelNotes: {
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
  travelActions: {
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#183B7A",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#183B7A",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },

  image: {
    width: "auto",
    height: 200,
    resizeMode: "cover",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    // Add resizeMode if needed (e.g., 'contain', 'cover', 'stretch')
  },
});

export default TravelCatalog;
