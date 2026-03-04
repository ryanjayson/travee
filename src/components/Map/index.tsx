import React, { FC } from "react";
import { StyleSheet, View } from "react-native";
// Import the MapView component
// import MapView, { Marker, Region } from "react-native-maps";

// --- Type Definition ---
interface MapProps {
  latitude: number;
  longitude: number;
  title?: string;
}

const MapComponent: FC<MapProps> = ({
  latitude,
  longitude,
  title = "Current Location",
}) => {
  // Define the initial region (center point and visible area)
  // const initialRegion: Region = {
  //   latitude: latitude,
  //   longitude: longitude,
  //   // These define the zoom level (smaller number = more zoom)
  //   latitudeDelta: 0.0922,
  //   longitudeDelta: 0.0421,
  // };

  return (
    <View style={styles.container}>
      {/* <MapView
        style={styles.map}
        initialRegion={initialRegion}
        // Use custom styling like 'satellite' or 'hybrid' if needed
        // mapType="standard"
        // showsUserLocation={true} // Optionally show the user's current location
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={title}
          description="A marked point of interest."
        />
      </MapView> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    height: 400, // Define a fixed height for the map container
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapComponent;
