import * as React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";
import { TravelStatus } from "../../types/enums";

const countriesGeoJSON = require("../../assets/geo/countries.json");

interface Marker {
  latitude: number;
  longitude: number;
  title: string;
  status?: TravelStatus;
  isCity?: boolean;
}

const DEFAULT_COUNTRY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  "Philippines": { latitude: 12.8797, longitude: 121.7740 },
  "United States": { latitude: 37.0902, longitude: -95.7129 },
  "United Kingdom": { latitude: 55.3781, longitude: -3.4360 },
  "Australia": { latitude: -25.2744, longitude: 133.7751 },
  "Canada": { latitude: 56.1304, longitude: -106.3468 },
  "Japan": { latitude: 36.2048, longitude: 138.2529 },
  "South Korea": { latitude: 35.9078, longitude: 127.7669 },
  "Singapore": { latitude: 1.3521, longitude: 103.8198 },
  "Germany": { latitude: 51.1657, longitude: 10.4515 },
  "France": { latitude: 46.2276, longitude: 2.2137 },
  "Italy": { latitude: 41.8719, longitude: 12.5674 },
  "Spain": { latitude: 40.4637, longitude: -3.7492 },
  "Thailand": { latitude: 15.8700, longitude: 100.9925 },
  "Malaysia": { latitude: 4.2105, longitude: 101.9758 },
  "Indonesia": { latitude: -0.7893, longitude: 113.9213 },
  "Vietnam": { latitude: 14.0583, longitude: 108.2772 },
  "China": { latitude: 35.8617, longitude: 104.1954 },
  "India": { latitude: 20.5937, longitude: 78.9629 },
  "Brazil": { latitude: -14.2350, longitude: -51.9253 },
  "Mexico": { latitude: 23.6345, longitude: -102.5528 },
};

interface ExploreCountryMapProps {
  markers: Marker[];
  defaultCountry?: string;
  showMarkers?: boolean;
}

const ExploreCountryMap = ({ markers, defaultCountry = "Philippines", showMarkers = true }: ExploreCountryMapProps) => {
  const coords = DEFAULT_COUNTRY_COORDS[defaultCountry] || { latitude: 12.8797, longitude: 121.7740 };
  // Deduplicate markers to ensure each country only appears once
  const uniqueMarkersMap = new Map<string, Marker>();
  
  if (markers) {
    markers.forEach((m) => {
      const matchTitle = m.title ? m.title.toLowerCase().trim() : "";
      if (!matchTitle) return;

      const feature = countriesGeoJSON.features.find((f: any) => {
        const p = f.properties;
        const nameEn = p.NAME_EN ? p.NAME_EN.toLowerCase() : "";
        const admin = p.ADMIN ? p.ADMIN.toLowerCase() : "";
        const name = p.NAME ? p.NAME.toLowerCase() : "";
        return (
          (nameEn && matchTitle.includes(nameEn)) ||
          (admin && matchTitle.includes(admin)) ||
          (name && matchTitle.includes(name))
        );
      });

      const canonicalName = feature ? (feature.properties.NAME_EN || feature.properties.ADMIN || feature.properties.NAME || m.title) : m.title;
      const canonicalKey = canonicalName.toLowerCase().trim();

      const existing = uniqueMarkersMap.get(canonicalKey);
      if (!existing) {
        uniqueMarkersMap.set(canonicalKey, m);
      } else {
        const getPriority = (status?: number) => {
          if (status === 3) return 3; // Past / Visited
          if (status === 2) return 2; // Ongoing
          if (status === 1) return 1; // Upcoming
          return 0;
        };
        if (getPriority(m.status) > getPriority(existing.status)) {
          uniqueMarkersMap.set(canonicalKey, m);
        }
      }
    });
  }

  const deduplicatedMarkers = Array.from(uniqueMarkersMap.values());

  // Extract country geometry configurations for unique markers
  const countryGeometries: any[] = [];
  deduplicatedMarkers.forEach((m) => {
    const matchTitle = m.title ? m.title.toLowerCase().trim() : "";
    
    const feature = countriesGeoJSON.features.find((f: any) => {
      const p = f.properties;
      const nameEn = p.NAME_EN ? p.NAME_EN.toLowerCase() : "";
      const admin = p.ADMIN ? p.ADMIN.toLowerCase() : "";
      const name = p.NAME ? p.NAME.toLowerCase() : "";
      return (
        matchTitle && (
          (nameEn && matchTitle.includes(nameEn)) ||
          (admin && matchTitle.includes(admin)) ||
          (name && matchTitle.includes(name))
        )
      );
    });
    
    if (feature) {
      countryGeometries.push({
        id: m.title.replace(/\s+/g, "-").toLowerCase(),
        feature,
        title: m.title,
        iso2: feature.properties.ISO_A2 || "",
        status: m.status
      });
    }
  });

  const countryGeometriesStr = JSON.stringify(countryGeometries);

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
        .country-marker-label {
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
        function getFlagEmoji(countryCode) {
          if (!countryCode || countryCode.length !== 2) return '';
          try {
            var codePoints = countryCode
              .toUpperCase()
              .split('')
              .map(function(char) { return 127397 + char.charCodeAt(0); });
            return String.fromCodePoint.apply(null, codePoints);
          } catch (e) {
            return '';
          }
        }

        mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/light-v11', 
          center: [${coords.longitude}, ${coords.latitude}], 
          zoom: 0.7,
          maxBounds: [[-180, -85], [180, 85]],
          attributionControl: false,
          renderWorldCopies: true, 
          projection: 'globe'
        });

        const countryGeometries = ${countryGeometriesStr};
        const renderedMarkers = ${JSON.stringify(deduplicatedMarkers)};

        map.on('load', () => {
          // Hide Mapbox default label layers
          const layers = map.getStyle().layers;
          if (layers) {
            layers.forEach(function(layer) {
              if (layer.type === 'symbol') {
                map.setLayoutProperty(layer.id, 'visibility', 'none');
              }
            });
          }

          // Add Country outline layers dynamically
          countryGeometries.forEach(function(item) {
            var sourceId = 'source-' + item.id;
            if (!map.getSource(sourceId)) {
              map.addSource(sourceId, {
                type: 'geojson',
                data: item.feature
              });
              map.addLayer({
                id: 'layer-fill-' + item.id,
                type: 'fill',
                source: sourceId,
                paint: {
                  'fill-color': item.status === 3 ? '#34699A' : '#78A2CC', // Visited vs To Visit colors
                  'fill-opacity': 0.4
                }
              });
              map.addLayer({
                id: 'layer-outline-' + item.id,
                type: 'line',
                source: sourceId,
                paint: {
                  'line-color': '#FFFFFF', // Clean white border
                  'line-width': 1.5
                }
              });
            }
          });

          // Render pins (flag emoji label pills)
          if (${showMarkers}) {
            renderedMarkers.forEach(m => {
              const wrapper = document.createElement('div');
              wrapper.className = 'marker-wrapper';

              var iso2 = "";
              var titleNormal = m.title ? m.title.toLowerCase().trim() : "";
              for (var i = 0; i < countryGeometries.length; i++) {
                var cTitle = countryGeometries[i].title ? countryGeometries[i].title.toLowerCase().trim() : "";
                if (cTitle === titleNormal) {
                  iso2 = countryGeometries[i].iso2 || "";
                  break;
                }
              }

              var flag = getFlagEmoji(iso2);

              const label = document.createElement('div');
              label.className = 'country-marker-label';
              label.innerHTML = (flag ? '<span style="font-size: 15px; margin-right: 6px; vertical-align: middle;">' + flag + '</span>' : '<span class="material-icons" style="font-size: 16px; margin-right: 5px; vertical-align: middle;">map</span>') + m.title;
              wrapper.appendChild(label);

              new mapboxgl.Marker(wrapper)
                .setLngLat([m.longitude, m.latitude])
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>' + m.title + '</h3>'))
                .addTo(map);
            });
          }
        });
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

export default ExploreCountryMap;
