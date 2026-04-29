import * as React from "react";
import { ScrollView, View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text } from "react-native-paper";
import { useTravels } from "../features/Travel/hooks/useTravel";
import { useAllActivitiesWithDestination } from "../features/Travel/hooks/useActivity";
import { TravelStatus } from "../types/enums";
import ExploreMap from "../components/ExploreMap";

export function ExploreScreen() {
  const { data: travels, isLoading: isTravelsLoading } = useTravels();
  const { data: activities, isLoading: isActivitiesLoading } = useAllActivitiesWithDestination();
  
  const [viewBy, setViewBy] = React.useState<"country" | "city">("country");
  const [filter, setFilter] = React.useState<"all" | "visited" | "tovisit">("all");

  const markers = React.useMemo(() => {
    if (viewBy === "country") {
      if (!travels) return [];
      return travels
        .filter((t) => t.destinationData?.coordinates)
        .map((t) => ({
          latitude: t.destinationData!.coordinates.latitude,
          longitude: t.destinationData!.coordinates.longitude,
          title: t.destination || t.title,
          status: t.status,
        }))
        .filter((m) => {
          if (filter === "all") return true;
          if (filter === "visited") return m.status === TravelStatus.Completed;
          if (filter === "tovisit") return m.status === TravelStatus.Upcoming || m.status === TravelStatus.Ongoing;
          return true;
        });
    } else {
      if (!activities) return [];
      return activities
        .filter((a) => a.destinationData?.coordinates)
        .map((a) => ({
          latitude: a.destinationData!.coordinates.latitude,
          longitude: a.destinationData!.coordinates.longitude,
          title: a.destination || a.title,
          status: a.isDone ? TravelStatus.Completed : TravelStatus.Upcoming,
          isCity: true,
        }))
        .filter((m) => {
          if (filter === "all") return true;
          if (filter === "visited") return m.status === TravelStatus.Completed;
          if (filter === "tovisit") return m.status === TravelStatus.Upcoming || m.status === TravelStatus.Ongoing;
          return true;
        });
    }
  }, [travels, activities, viewBy, filter]);

  const isLoading = viewBy === "country" ? isTravelsLoading : isActivitiesLoading;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={{ padding: 16, gap: 16 }}>
        <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>Your Travel Map</Text>

        {/* Filter Toggle - Always visible at the top */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, filter === "all" && styles.activeBtn]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.toggleText, filter === "all" && styles.activeText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, filter === "visited" && styles.activeBtn]}
            onPress={() => setFilter("visited")}
          >
            <Text style={[styles.toggleText, filter === "visited" && styles.activeText]}>Visited</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, filter === "tovisit" && styles.activeBtn]}
            onPress={() => setFilter("tovisit")}
          >
            <Text style={[styles.toggleText, filter === "tovisit" && styles.activeText]}>To Visit</Text>
          </TouchableOpacity>
        </View>

        {/* View By Toggle - Below filter */}
        <View style={styles.viewByContainer}>
          <TouchableOpacity 
            style={[styles.viewByBtn, viewBy === "country" && styles.viewByActiveBtn]}
            onPress={() => setViewBy("country")}
          >
            <Text style={[styles.viewByText, viewBy === "country" && styles.viewByActiveText]}>By Country</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewByBtn, viewBy === "city" && styles.viewByActiveBtn]}
            onPress={() => setViewBy("city")}
          >
            <Text style={[styles.viewByText, viewBy === "city" && styles.viewByActiveText]}>By City</Text>
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#34699A" }]} />
            <Text variant="bodySmall">Visited (Completed)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#78A2CC" }]} />
            <Text variant="bodySmall">To Visit (Upcoming/Ongoing)</Text>
          </View>
        </View>

        {/* Map */}
        <Card>
          {isLoading ? (
            <Card.Content style={{ height: 350, justifyContent: 'center', alignItems: 'center' }}>
              <Text>Loading map data...</Text>
            </Card.Content>
          ) : (
            <ExploreMap markers={markers} viewBy={viewBy} />
          )}
        </Card>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  viewByContainer: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    padding: 4,
    marginBottom: -8,
  },
  viewByBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  viewByActiveBtn: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewByText: {
    fontWeight: "600",
    color: "#555",
  },
  viewByActiveText: {
    color: "#000",
    fontWeight: "bold",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeBtn: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontWeight: "500",
    color: "#666",
  },
  activeText: {
    color: "#000",
    fontWeight: "bold",
  },
  legendContainer: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
