import React from "react";
import { View, Text } from "react-native";
import LocationMap from "../../../../components/Map";

const ActivityLocationMap = () => {
  // Coordinates for the Eiffel Tower in Paris
  const eiffelTowerLat = 48.8584;
  const eiffelTowerLon = 2.2945;

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 20, padding: 10 }}>
        Map View of Our Destination:
      </Text>

      <LocationMap
        latitude={eiffelTowerLat}
        longitude={eiffelTowerLon}
        title="Eiffel Tower"
      />

      {/* Ensure other content doesn't overlay the map if its container is smaller than flex:1 */}
    </View>
  );
};

export default ActivityLocationMap;
