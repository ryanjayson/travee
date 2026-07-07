import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";
import { TravelStatus } from "../../types/enums";

interface Marker {
  latitude: number;
  longitude: number;
  title: string;
  status?: TravelStatus;
  isCity?: boolean;
}

interface ExploreCityMapProps {
  markers: Marker[];
}

const ExploreCityMap = ({ markers }: ExploreCityMapProps) => {
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css" rel="stylesheet">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow: hidden; margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/light-v11', 
          center: [121.7740, 12.8797], // Centered on the Philippines
          zoom: 5.2, // Zoomed in to fit the Philippines
          attributionControl: false,
          renderWorldCopies: true
        });

        const renderedMarkers = ${JSON.stringify(markers || [])};

        map.on('load', () => {
          loadCityBoundaries();
        });

        async function loadCityBoundaries() {
          if (renderedMarkers.length === 0) return;
          const features = [];

          for (const m of renderedMarkers) {
            try {
              // Using Nominatim (OpenStreetMap) to get the exact geometric boundary polygon
              // zoom=8 generally returns the county/city/region boundary
              const url = 'https://nominatim.openstreetmap.org/reverse?format=geojson&lat=' + m.latitude + '&lon=' + m.longitude + '&zoom=8&polygon_geojson=1';
              const res = await fetch(url, { headers: { 'User-Agent': 'TravelledApp/1.0' } });
              const data = await res.json();
              
              if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                // Ensure we only use actual Polygon or MultiPolygon geometries to act as boundaries
                if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                  feature.properties = { ...feature.properties, title: m.title, status: m.status };
                  features.push(feature);
                }
              }
              
              // Respect Nominatim's strict 1 request/second rate limit
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch(e) {
              console.error('Reverse geocoding failed', e);
            }
          }

          map.addSource('cities-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: features }
          });

          map.addLayer({
            id: 'city-fills',
            type: 'fill',
            source: 'cities-source',
            paint: {
              'fill-color': [
                'match',
                ['get', 'status'],
                3, '#34699A', // Past (Dark Blue)
                1, '#78A2CC', // Upcoming (Light Blue)
                2, '#78A2CC', // Ongoing (Light Blue)
                '#dc3545'
              ],
              'fill-opacity': 0.6
            }
          }, 'water');

          map.addLayer({
            id: 'city-borders',
            type: 'line',
            source: 'cities-source',
            paint: {
              'line-color': '#FFFFFF',
              'line-width': 1.5
            }
          }, 'water');

          // Interactivity
          map.on('click', 'city-fills', (e) => {
            const title = e.features[0].properties.title;
            new mapboxgl.Popup({ offset: 0 })
              .setLngLat(e.lngLat)
              .setHTML('<h3>' + title + '</h3>')
              .addTo(map);
          });

          map.on('mouseenter', 'city-fills', () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', 'city-fills', () => { map.getCanvas().style.cursor = ''; });
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: mapHTML }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});

export default ExploreCityMap;
