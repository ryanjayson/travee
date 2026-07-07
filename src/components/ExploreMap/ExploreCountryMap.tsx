import React from "react";
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

interface ExploreCountryMapProps {
  markers: Marker[];
}

const ExploreCountryMap = ({ markers }: ExploreCountryMapProps) => {
  // Deduplicate markers to ensure each country only appears once
  const uniqueMarkersMap = new Map<string, Marker>();
  
  if (markers) {
    markers.forEach((m) => {
      const matchTitle = m.title ? m.title.toLowerCase().trim() : "";
      if (!matchTitle) return;

      const feature = countriesGeoJSON.features.find((f: any) => {
        const p = f.properties;
        return (
          (p.NAME_EN && p.NAME_EN.toLowerCase() === matchTitle) ||
          (p.ADMIN  && p.ADMIN.toLowerCase()   === matchTitle) ||
          (p.NAME   && p.NAME.toLowerCase()    === matchTitle)
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
      return (
        matchTitle && (
          (p.NAME_EN && p.NAME_EN.toLowerCase() === matchTitle) ||
          (p.ADMIN  && p.ADMIN.toLowerCase()   === matchTitle) ||
          (p.NAME   && p.NAME.toLowerCase()    === matchTitle)
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
          style: 'mapbox://styles/mapbox/basic-v9', 
          center: [122, 13],
          zoom: 0.7,
          maxBounds: [[-180, -85], [180, 85]],
          attributionControl: false,
          renderWorldCopies: true, 
          projection: 'globe'
        });

        const countryGeometries = ${countryGeometriesStr};
        const renderedMarkers = ${JSON.stringify(deduplicatedMarkers)};

        map.on('load', () => {
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
              }, 'water');
              map.addLayer({
                id: 'layer-outline-' + item.id,
                type: 'line',
                source: sourceId,
                paint: {
                  'line-color': '#FFFFFF', // Clean white border
                  'line-width': 1.5
                }
              }, 'water');
            }
          });

          // Render pins (flag emoji label pills)
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
