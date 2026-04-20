import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  StatusBar,
} from "react-native";
import { WebView } from "react-native-webview";
import Icon from "react-native-vector-icons/MaterialIcons";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";

interface MapViewerProps {
  visible: boolean;
  onClose: () => void;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  title: string;
  zoom?: number;
  markers?: Array<{
    latitude: number;
    longitude: number;
    title: string;
  }>;
}

const MapViewer = ({
  visible,
  onClose,
  coordinates,
  title,
  zoom,
  markers,
}: MapViewerProps) => {
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow: hidden; }
        #map { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [${(markers?.[0] || coordinates)?.longitude || 0}, ${(markers?.[0] || coordinates)?.latitude || 0}],
          zoom: ${zoom || 6},
          attributionControl: false,
        });

        const renderedMarkers = ${JSON.stringify(markers || [])};
        if (renderedMarkers.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          renderedMarkers.forEach(m => {
            new mapboxgl.Marker({ color: '#0C4C8A' })
              .setLngLat([m.longitude, m.latitude])
              .addTo(map);
            bounds.extend([m.longitude, m.latitude]);
          });
          
          if (renderedMarkers.length > 1) {
            map.fitBounds(bounds, { padding: 50, linear: true });
          } else {
            map.setCenter([renderedMarkers[0].longitude, renderedMarkers[0].latitude]);
            map.setZoom(${zoom || 14});
          }
        } else if (${!!coordinates}) {
          new mapboxgl.Marker({ color: '#0C4C8A' })
            .setLngLat([${coordinates?.longitude}, ${coordinates?.latitude}])
            .addTo(map);
          map.setCenter([${coordinates?.longitude}, ${coordinates?.latitude}]);
          map.setZoom(${zoom || 14});
        }
      </script>
    </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#183B7A" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <WebView
            source={{ html: mapHTML }}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            style={{ flex: 1 }}
          />
        </View>

        {/* Footer info/controls if needed */}
        <View style={styles.footer}>
          <View style={styles.locationInfo}>
            <Icon name="location-on" size={20} color="#0C4C8A" />
            <Text style={styles.coordinateText}>
              {markers && markers.length > 0 
                ? `${markers.length} Locations pinned`
                : coordinates 
                  ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
                  : ""
              }
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 15,
  },
  titleContainer: {
    flex: 1,
    marginRight: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#183B7A",
  },
  mapContainer: {
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  coordinateText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
});

export default MapViewer;
