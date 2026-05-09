import * as React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTravels } from "../features/Travel/hooks/useTravel";
import { useAllActivitiesWithDestination } from "../features/Travel/hooks/useActivity";
import { TravelStatus } from "../types/enums";
import ExploreMap from "../components/ExploreMap";

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-red">
      {/* Map Backdrop */}
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <Text variant="bodyLarge">Loading map data...</Text>
          </View>
        ) : (
          <ExploreMap markers={markers} viewBy={viewBy} />
        )}
      </View>

      {/* Overlay UI Controls */}
      <View 
        className="absolute w-full px-4" 
        style={{ top: 10}}
      >
        <View className="gap-y-3 bg-white p-3 rounded-lg">
          {/* Filter Toggle */}
          <View className="flex-row bg-white/90 rounded-2xl p-1 border border-gray-100">
            {["all", "visited", "tovisit"].map((f) => (
              <TouchableOpacity 
                key={f}
                className={`flex-1 py-2.5 items-center rounded-xl ${filter === f ? "bg-gray-100" : ""}`}
                onPress={() => setFilter(f as any)}
              >
                <Text className={`font-bold capitalize ${filter === f ? "text-primary" : "text-gray-500"}`}>
                  {f === "tovisit" ? "To Visit" : f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* View By Toggle */}
          <View className="flex-row bg-white/90 rounded-2xl mt-1 p-1  border border-gray-100">
            {["country", "city"].map((v) => (
              <TouchableOpacity 
                key={v}
                className={`flex-1 py-2.5 items-center rounded-xl ${viewBy === v ? "bg-gray-100" : ""}`}
                onPress={() => setViewBy(v as any)}
              >
                <Text className={`font-bold capitalize ${viewBy === v ? "text-primary" : "text-gray-500"}`}>
                  By {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Legend */}
          <View className="flex-row gap-x-4 px-1">
            <View className="flex-row items-center gap-x-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
              <View className="w-2.5 h-2.5 rounded-full bg-[#34699A]" />
              <Text className="text-[10px] font-bold text-gray-700">Visited</Text>
            </View>
            <View className="flex-row items-center gap-x-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
              <View className="w-2.5 h-2.5 rounded-full bg-[#78A2CC]" />
              <Text className="text-[10px] font-bold text-gray-700">To Visit</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
