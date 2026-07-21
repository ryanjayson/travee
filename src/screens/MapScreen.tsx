import * as React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { Checkbox, useTheme } from "react-native-paper";
import { useTravels } from "../features/Travel/hooks/useTravel";
import { useAllActivitiesWithDestination } from "../features/Travel/hooks/useActivity";
import { TravelStatus } from "../types/enums";
import ExploreCountryMap from "../components/ExploreMap/ExploreCountryMap";
import ExploreCityMap from "../components/ExploreMap/ExploreCityMap";
import { useUserProfile } from "../hooks/useUserProfile";

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { data: travels, isLoading: isTravelsLoading } = useTravels();
  const { data: activities, isLoading: isActivitiesLoading } = useAllActivitiesWithDestination();
  const { data: profile } = useUserProfile();
  
  const { colors } = useTheme();
  const [viewBy, setViewBy] = React.useState<"country" | "city">("country");
  const [filter, setFilter] = React.useState<"all" | "visited" | "tovisit">("all");
  const [showMarkers, setShowMarkers] = React.useState(true);

  React.useEffect(() => {
    if (route.params?.viewBy) {
      setViewBy(route.params.viewBy);
    }
  }, [route.params?.viewBy]);

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
          if (filter === "visited") return m.status === TravelStatus.Past;
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
          status: a.isDone ? TravelStatus.Past : TravelStatus.Upcoming,
          isCity: true,
          type: a.type,
        }))
        .filter((m) => {
          if (filter === "all") return true;
          if (filter === "visited") return m.status === TravelStatus.Past;
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
            <Text className="text-lg text-gray-500 font-medium">Loading map data...</Text>
          </View>
        ) : viewBy === "country" ? (
          <ExploreCountryMap markers={markers} showMarkers={showMarkers} defaultCountry={profile?.defaultCountry || undefined} />
        ) : (
          <ExploreCityMap markers={markers} showMarkers={showMarkers} defaultCountry={profile?.defaultCountry || undefined} />
        )}
      </View>

      {/* Overlay UI Controls */}
      <View 
        className="absolute w-full px-4" 
        style={{ top: insets.top + 30 }}
      >
        <View className="gap-y-3 bg-white/80 p-3 rounded-3xl shadow-xl border border-gray-200">
          {/* View By Toggle */}
          <View className="flex-row bg-white/90 rounded-2xl p-1 border border-gray-100">
            {["country", "city"].map((v) => (
              <TouchableOpacity 
                key={v}
                className={`flex-1 py-3 items-center rounded-xl ${viewBy === v ? "bg-primary" : ""}`}
                onPress={() => setViewBy(v as any)}
              >
                <Text className={`text-lg ${viewBy === v ? "text-white" : "text-primary"}`}>
                  {v === "country" ? "International" : "Country"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Filter Toggle */}
          <View className="flex-row bg-white/90 rounded-2xl mt-1 p-1 border border-gray-100">
            {["all", "visited", "tovisit"].map((f) => (
              <TouchableOpacity 
                key={f}
                className={`flex-1 py-1 items-center rounded-xl ${filter === f ? "bg-gray-100" : ""}`}
                onPress={() => setFilter(f as any)}
                accessibilityRole="button"
              >
                <Text className={`font-bold capitalize ${filter === f ? "text-primary" : "text-gray-500"}`}>
                  {f === "tovisit" ? "To Visit" : f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Legend & Marker Checkbox */}
          <View className="flex-row items-center justify-between px-1">
            <View className="flex-row gap-x-4">
              <View className="flex-row items-center gap-x-2 bg-white/80 px-3 py-1.5">
                <View className="w-4 h-4 rounded-full bg-[#34699A]" />
                <Text className="text-sm text-gray-700">Visited</Text>
              </View>
              <View className="flex-row items-center gap-x-2 bg-white/80 px-3 py-1.5">
                <View className="w-4 h-4 rounded-full bg-[#78A2CC]" />
                <Text className="text-sm text-gray-700">To Visit</Text>
              </View>
            </View>

            {/* Checkbox for show Marker */}
            <TouchableOpacity 
              className="flex-row items-center pr-1 py-1"
              onPress={() => setShowMarkers(!showMarkers)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Toggle show markers"
            >
              <Checkbox.Android
                status={showMarkers ? 'checked' : 'unchecked'}
                onPress={() => setShowMarkers(!showMarkers)}
                color={colors.primary}
              />
              <Text className="text-gray-600 font-semibold text-sm ml-0.5">
                Show Marker
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
