import * as React from "react";
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
  type?: number;
}

const DEFAULT_COUNTRY_COORDS: Record<string, { latitude: number; longitude: number; zoom: number }> = {
  "Philippines": { latitude: 12.8797, longitude: 121.7740, zoom: 5.2 },
  "United States": { latitude: 37.0902, longitude: -95.7129, zoom: 3.5 },
  "United Kingdom": { latitude: 55.3781, longitude: -3.4360, zoom: 5.0 },
  "Australia": { latitude: -25.2744, longitude: 133.7751, zoom: 3.5 },
  "Canada": { latitude: 56.1304, longitude: -106.3468, zoom: 3.0 },
  "Japan": { latitude: 36.2048, longitude: 138.2529, zoom: 4.8 },
  "South Korea": { latitude: 35.9078, longitude: 127.7669, zoom: 5.5 },
  "Singapore": { latitude: 1.3521, longitude: 103.8198, zoom: 10.0 },
  "Germany": { latitude: 51.1657, longitude: 10.4515, zoom: 5.2 },
  "France": { latitude: 46.2276, longitude: 2.2137, zoom: 5.2 },
  "Italy": { latitude: 41.8719, longitude: 12.5674, zoom: 5.2 },
  "Spain": { latitude: 40.4637, longitude: -3.7492, zoom: 5.2 },
  "Thailand": { latitude: 15.8700, longitude: 100.9925, zoom: 5.0 },
  "Malaysia": { latitude: 4.2105, longitude: 101.9758, zoom: 5.2 },
  "Indonesia": { latitude: -0.7893, longitude: 113.9213, zoom: 4.2 },
  "Vietnam": { latitude: 14.0583, longitude: 108.2772, zoom: 5.0 },
  "China": { latitude: 35.8617, longitude: 104.1954, zoom: 3.2 },
  "India": { latitude: 20.5937, longitude: 78.9629, zoom: 4.0 },
  "Brazil": { latitude: -14.2350, longitude: -51.9253, zoom: 3.5 },
  "Mexico": { latitude: 23.6345, longitude: -102.5528, zoom: 4.0 },
};

interface ExploreCityMapProps {
  markers: Marker[];
  defaultCountry?: string;
  showMarkers?: boolean;
}

const ExploreCityMap = ({ markers, defaultCountry = "Philippines", showMarkers = true }: ExploreCityMapProps) => {
  const coords = DEFAULT_COUNTRY_COORDS[defaultCountry] || { latitude: 12.8797, longitude: 121.7740, zoom: 5.2 };
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
        .marker-wrapper {
          display: flex; flex-direction: column; align-items: center;
          cursor: pointer;
        }
        .city-marker-label {
          background: #FFFFFF;
          color: #263F69;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 1px solid #263F69;
          pointer-events: none;
          white-space: nowrap;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/light-v11', 
          center: [${coords.longitude}, ${coords.latitude}], 
          zoom: ${coords.zoom}, 
          attributionControl: false,
          renderWorldCopies: true

          
        });

        const renderedMarkers = ${JSON.stringify(markers || [])};

        function getActivityIcon(type) {
          switch(type) {
            case 1: return { name: 'airplane-outline', isIon: true, color: '#2196F3' }; // flight
            case 3: return { name: 'hotel', isIon: false, color: '#a659ee' }; // accomodation
            case 4: return { name: 'restaurant', isIon: false, color: '#e03e3e' }; // cafeRestaurant
            case 5: return { name: 'terrain', isIon: false, color: '#165135' }; // nature
            case 6: return { name: 'shopping-bag', isIon: false, color: '#db2777' }; // shopping
            case 7: return { name: 'local-play', isIon: false, color: '#0891b2' }; // entertainment
            case 9: return { name: 'walk-outline', isIon: true, color: '#8BC34A' }; // walk
            case 10: return { name: 'photo-camera', isIon: false, color: '#f0a505' }; // sightseeing
            case 11: return { name: 'build', isIon: false, color: '#607D8B' }; // preparation
            case 13: return { name: 'hiking', isIon: false, color: '#429862' }; // hikeOrCamp
            default: return { name: 'location-on', isIon: false, color: '#263F69' };
          }
        }

        function renderCityMarkers() {
          if (!${showMarkers}) return;
          renderedMarkers.forEach(m => {
            const wrapper = document.createElement('div');
            wrapper.className = 'marker-wrapper';

            const info = getActivityIcon(m.type);
            var iconHTML = '';
            if (info.isIon) {
              iconHTML = '<ion-icon name="' + info.name + '" style="font-size: 15px; margin-right: 6px; color: ' + info.color + '; vertical-align: middle;"></ion-icon>';
            } else {
              iconHTML = '<span class="material-icons" style="font-size: 15px; margin-right: 6px; color: ' + info.color + '; vertical-align: middle;">' + info.name + '</span>';
            }

            const label = document.createElement('div');
            label.className = 'city-marker-label';
            label.innerHTML = iconHTML + m.title;
            wrapper.appendChild(label);

            new mapboxgl.Marker(wrapper)
              .setLngLat([m.longitude, m.latitude])
              .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>' + m.title + '</h3>'))
              .addTo(map);
          });
        }

        map.on('load', () => {
          loadCityBoundaries();
          renderCityMarkers();
        });

        async function loadCityBoundaries() {
         // Hide Mapbox default label layers
          const layers = map.getStyle().layers;
          if (layers) {
            layers.forEach(function(layer) {
              if (layer.type === 'symbol') {
                map.setLayoutProperty(layer.id, 'visibility', 'none');
              }
            });
          }
            
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
