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

interface ExploreMapProps {
  markers: Marker[];
  viewBy?: "country" | "city";
}

const ExploreMap = ({ markers, viewBy = "country" }: ExploreMapProps) => {
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
        .custom-marker {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          border: 2px solid #FFF;
        }
        .status-completed {
          background: #34699A; /* Dark blue for visited */
        }
        .status-tovisit {
          background: #78A2CC; /* Light blue for upcoming/ongoing */
        }
        .status-default {
          background: #dc3545; /* Red for others */
        }
        .custom-marker ion-icon, .custom-marker .material-icons {
          font-size: 16px;
          color: #FFF;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const VIEW_BY = '${viewBy}';

        function getMarkerClass(status) {
          if (status === 3) return 'status-completed'; // Completed
          if (status === 1 || status === 2) return 'status-tovisit'; // Upcoming or Ongoing
          return 'status-default';
        }

        mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/light-v11', 
          center: [122, 13],
          zoom: 3,
          projection: 'naturalEarth', 
          attributionControl: false,
        });

          map.on('load', () => {
            if (VIEW_BY === 'country') {
              // 1. Add the vector source for country boundaries
              map.addSource('country-boundaries', {
                type: 'vector',
                url: 'mapbox://mapbox.country-boundaries-v1',
              });

              // 2. Add a layer to fill the countries (initially all grey)
              map.addLayer({
                id: 'country-fills',
                type: 'fill',
                source: 'country-boundaries',
                'source-layer': 'country_boundaries',
                paint: {
                  'fill-color': '#E0E0E0', // Default light grey
                  'fill-opacity': 1,
                },
                // Filter to show only primary country polygons (removes many overlaps)
                filter: ['==', ['get', 'disputed'], 'false'],
              }, 'admin-1-boundary-bg'); // Places layer behind labels/borders

              // 3. Add white borders to match the reference image
              map.addLayer({
                id: 'country-borders',
                type: 'line',
                source: 'country-boundaries',
                'source-layer': 'country_boundaries',
                paint: {
                  'line-color': '#FFFFFF',
                  'line-width': 1,
                },
              });
              
              // 4. Fetch visited countries and update layer
              loadVisitedCountries();
            }
          });

        const renderedMarkers = ${JSON.stringify(markers || [])};
        
        async function loadVisitedCountries() {
           if (renderedMarkers.length === 0 || VIEW_BY !== 'country') return;
           const visitedCodes = new Set();
           const tovisitCodes = new Set();
           
           for (const m of renderedMarkers) {
                 try {
                    const res = await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + m.longitude + ',' + m.latitude + '.json?types=country&access_token=' + mapboxgl.accessToken);
                    const data = await res.json();
                    if (data.features && data.features.length > 0) {
                       let code = data.features[0].properties.short_code; 
                       if (code) {
                          if (m.status === 3) {
                             visitedCodes.add(code.toUpperCase());
                          } else if (m.status === 1 || m.status === 2) {
                             tovisitCodes.add(code.toUpperCase());
                          }
                       }
                    }
                 } catch(e) {
                    console.error('Reverse geocoding failed', e);
                 }
           }
           
           const visitedArray = Array.from(visitedCodes);
           // Exclude countries that are already visited from the to-visit list to prioritize visited color
           const tovisitArray = Array.from(tovisitCodes).filter(c => !visitedCodes.has(c));
           
           if (visitedArray.length > 0 || tovisitArray.length > 0) {
              const matchExpr = ['match', ['get', 'iso_3166_1']];
              if (visitedArray.length > 0) matchExpr.push(visitedArray, '#34699A'); // Dark blue for visited
              if (tovisitArray.length > 0) matchExpr.push(tovisitArray, '#78A2CC'); // Lighter blue for to-visit
              matchExpr.push('#E0E0E0'); // Default grey
              
              map.setPaintProperty('country-fills', 'fill-color', matchExpr);
           }
        }

        if (VIEW_BY === 'country') {
          //  if (renderedMarkers.length > 0) {
          //     renderedMarkers.forEach(m => {
          //       const el = document.createElement('div');
          //       el.className = 'custom-marker ' + getMarkerClass(m.status);
          //       el.innerHTML = '<ion-icon name="location-outline"></ion-icon>';

          //      new mapboxgl.Marker(el)
          //        .setLngLat([m.longitude, m.latitude])
          //        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>' + m.title + '</h3>'))
          //        .addTo(map);
          //    });
          //  }
        } else if (VIEW_BY === 'city') {
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
                       const res = await fetch(url, { headers: { 'User-Agent': 'TraveeApp/1.0' } });
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
                           3, '#34699A', // Completed (Dark Blue)
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
    height: 500,
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});

export default ExploreMap;
