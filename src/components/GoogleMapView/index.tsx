import * as React from "react";
import { useMemo, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
// @ts-ignore
import { GOOGLE_MAPS_API_KEY as ENV_GOOGLE_KEY } from "@env";
import { GoogleMapPin, GoogleMapViewProps } from "./types";

export * from "./types";

const DEFAULT_GOOGLE_KEY =
  ENV_GOOGLE_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  "AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao";

const DEFAULT_CENTER = {
  latitude: 35.6762,
  longitude: 139.6503,
};

export const GoogleMapView = ({
  pins = [],
  initialCoordinates,
  centerCoordinates,
  selectedPinId,
  zoom = 13,
  onPinPress,
  onMapPress,
  style,
  apiKey = DEFAULT_GOOGLE_KEY,
  mapType = "roadmap",
  showTraffic = false,
  showZoomControls = true,
  showBusinesses = false,
  customMapStyles,
  showConnectors = false,
  routeMode = "DRIVING",
  connectorColor = "#0EA5E9",
  connectorWidth = 3,
  connectorOpacity = 0.8,
  connectorDashed = false,
  connectorGeodesic = true,
  connectByType = false,
  testID = "google-map-view",
}: GoogleMapViewProps) => {
  const webViewRef = useRef<WebView>(null);
  const isCenteredRef = useRef(false);

  const normalizedRouteMode = useMemo(() => {
    return (routeMode || "DRIVING").toUpperCase();
  }, [routeMode]);

  const centerCoord = useMemo(() => {
    if (initialCoordinates) {
      return initialCoordinates;
    }
    if (pins.length > 0) {
      return {
        latitude: pins[0].latitude,
        longitude: pins[0].longitude,
      };
    }
    return DEFAULT_CENTER;
  }, [initialCoordinates, pins]);

  const htmlContent = useMemo(() => {
    const pinsJson = JSON.stringify(pins);
    const mapStyles = [
      ...(!showBusinesses
        ? [
          {
            featureType: "poi",
            stylers: [{ visibility: "off" }],
          },
        ]
        : []),
      ...(customMapStyles || []),
    ];
    const mapStylesJson = JSON.stringify(mapStyles);
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { box-sizing: border-box; }
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background-color: #e5e3df;
    }
    .custom-pin-label {
      background: #FFFFFF;
      border: 1px solid rgba(0,0,0,0.15);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: #1F2937;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      white-space: nowrap;
    }
  </style>
  <script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry" async defer></script>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let markers = [];
    let connectorPolyline = null;
    let connectorPolylines = [];
    let initialPins = ${pinsJson};
    let currentPins = initialPins;
    let currentRouteMode = '${normalizedRouteMode}';
    let currentConnectorColor = '${connectorColor}';
    let activeRouteRequestId = 0;
    let pendingCenter = null;

    function createSvgPin(color) {
      const pinColor = color || '#263F69';
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">' +
        '<path fill="' + pinColor + '" stroke="#FFFFFF" stroke-width="2" ' +
        'd="M18 0C8.059 0 0 8.059 0 18c0 12.375 16.2 27.225 16.875 27.825a1.5 1.5 0 0 0 2.25 0C19.8 45.225 36 30.375 36 18 36 8.059 27.941 0 18 0z"/>' +
        '<circle cx="18" cy="17" r="7" fill="#FFFFFF"/>' +
        '</svg>';
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }

    function initMap() {
      const center = { lat: ${centerCoord.latitude}, lng: ${centerCoord.longitude} };
      map = new google.maps.Map(document.getElementById('map'), {
        center: center,
        zoom: ${zoom},
        mapTypeId: '${mapType}',
        disableDefaultUI: false,
        zoomControl: ${showZoomControls},
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        clickableIcons: false,
        styles: ${mapStylesJson},
      });

      if (${showTraffic}) {
        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
      }

      map.addListener('click', function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_PRESS' }));
        }
      });

      renderPins(initialPins);

      if (pendingCenter) {
        window.centerOnLocation(pendingCenter.lat, pendingCenter.lng, pendingCenter.zoom, pendingCenter.pinId, pendingCenter.offsetY);
        pendingCenter = null;
      }
    }

    function drawPolylinePath(coords, color) {
      if (!coords || coords.length < 2) return;
      if (!${Boolean(connectByType)} && connectorPolyline) {
        connectorPolyline.setMap(null);
        connectorPolyline = null;
      }
      const isDashed = ${Boolean(connectorDashed)};
      const lineSymbol = isDashed ? {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 3,
      } : null;

      const pathLatLngs = coords.map(function(pt) {
        if (pt instanceof google.maps.LatLng) return pt;
        return new google.maps.LatLng(pt.lat, pt.lng);
      });

      const polyOptions = {
        path: pathLatLngs,
        geodesic: ${Boolean(connectorGeodesic)},
        strokeColor: currentConnectorColor,
        strokeOpacity: isDashed ? 0 : ${connectorOpacity},
        strokeWeight: ${connectorWidth},
        icons: isDashed ? [{
          icon: lineSymbol,
          offset: '0',
          repeat: '16px',
        }] : undefined,
        map: map,
      };
      if (color) {
        polyOptions.strokeColor = color;
      }

      const poly = new google.maps.Polyline(polyOptions);
      connectorPolyline = poly;
      connectorPolylines.push(poly);
    }

    function removeConnectorPolyline() {
      if (connectorPolyline) {
        connectorPolyline.setMap(null);
        connectorPolyline = null;
      }
      if (connectorPolylines && connectorPolylines.length > 0) {
        connectorPolylines.forEach(function(p) {
          try { p.setMap(null); } catch (e) {}
        });
        connectorPolylines = [];
      }
    }

    function decodePolyline(encoded) {
      if (!encoded) return [];
      const points = [];
      let index = 0, len = encoded.length;
      let lat = 0, lng = 0;
      while (index < len) {
        let b, shift = 0, result = 0;
        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
      }
      return points;
    }

    function extractRoutePath(route) {
      const roadPath = [];
      if (route.legs && route.legs.length > 0) {
        for (let l = 0; l < route.legs.length; l++) {
          const leg = route.legs[l];
          if (leg.steps && leg.steps.length > 0) {
            for (let s = 0; s < leg.steps.length; s++) {
              const step = leg.steps[s];
              const stepPath = step.path || step.lat_lngs;
              if (stepPath && stepPath.length > 0) {
                for (let p = 0; p < stepPath.length; p++) {
                  roadPath.push(stepPath[p]);
                }
              }
            }
          }
        }
      }
      if (roadPath.length === 0 && route.overview_path && route.overview_path.length > 0) {
        for (let i = 0; i < route.overview_path.length; i++) {
          roadPath.push(route.overview_path[i]);
        }
      }
      return roadPath;
    }

    function fetchSegmentRoute(directionsService, origin, destination, waypoints, mode) {
      return new Promise(function(resolve) {
        const req = {
          origin: origin,
          destination: destination,
          travelMode: mode,
        };
        if (waypoints && waypoints.length > 0) {
          req.waypoints = waypoints;
          req.optimizeWaypoints = false;
        }

        directionsService.route(req, function(response, status) {
          if (status === google.maps.DirectionsStatus.OK && response && response.routes && response.routes.length > 0) {
            const path = extractRoutePath(response.routes[0]);
            if (path.length > 0) {
              resolve(path);
              return;
            }
          }

          // Fallback for TRANSIT when transit routes are unavailable for a segment
          if (mode === google.maps.TravelMode.TRANSIT) {
            directionsService.route({
              origin: origin,
              destination: destination,
              travelMode: google.maps.TravelMode.WALKING,
            }, function(walkResp, walkStatus) {
              if (walkStatus === google.maps.DirectionsStatus.OK && walkResp && walkResp.routes && walkResp.routes.length > 0) {
                const walkPath = extractRoutePath(walkResp.routes[0]);
                if (walkPath.length > 0) {
                  resolve(walkPath);
                  return;
                }
              }
              resolve([origin, destination]);
            });
            return;
          }

          const fallback = [origin];
          if (waypoints) {
            for (let w = 0; w < waypoints.length; w++) {
              fallback.push(waypoints[w].location);
            }
          }
          fallback.push(destination);
          resolve(fallback);
        });
      });
    }

    function fetchGoogleRoutesApi(coords, mode) {
      return new Promise(function(resolve) {
        if (!coords || coords.length < 2) return resolve(null);
        const gMode = mode === 'WALKING' ? 'WALK'
          : mode === 'BICYCLING' ? 'BICYCLE'
          : mode === 'TRANSIT' ? 'TRANSIT'
          : 'DRIVE';

        if (gMode === 'TRANSIT') {
          const segPromises = [];
          for (let i = 0; i < coords.length - 1; i++) {
            segPromises.push(
              fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Goog-Api-Key': '${apiKey}',
                  'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
                },
                body: JSON.stringify({
                  origin: { location: { latLng: { latitude: coords[i].lat, longitude: coords[i].lng } } },
                  destination: { location: { latLng: { latitude: coords[i + 1].lat, longitude: coords[i + 1].lng } } },
                  travelMode: 'TRANSIT',
                }),
              }).then(function(res) { return res.json(); }).then(function(data) {
                if (data.routes && data.routes.length > 0 && data.routes[0].polyline && data.routes[0].polyline.encodedPolyline) {
                  return decodePolyline(data.routes[0].polyline.encodedPolyline);
                }
                return null;
              }).catch(function() { return null; })
            );
          }
          Promise.all(segPromises).then(function(results) {
            const merged = [];
            for (let s = 0; s < results.length; s++) {
              const seg = results[s];
              if (seg && seg.length > 0) {
                for (let p = 0; p < seg.length; p++) {
                  if (merged.length === 0 || p > 0) merged.push(seg[p]);
                }
              }
            }
            resolve(merged.length > 0 ? merged : null);
          }).catch(function() { resolve(null); });
          return;
        }

        const chunkSize = 26;
        const chunkPromises = [];
        for (let i = 0; i < coords.length - 1; i += chunkSize) {
          const end = Math.min(i + chunkSize + 1, coords.length);
          const chunkCoords = coords.slice(i, end);
          const orig = chunkCoords[0];
          const dest = chunkCoords[chunkCoords.length - 1];
          const intermediates = chunkCoords.slice(1, -1).map(function(pt) {
            return { location: { latLng: { latitude: pt.lat, longitude: pt.lng } } };
          });
          const reqBody = {
            origin: { location: { latLng: { latitude: orig.lat, longitude: orig.lng } } },
            destination: { location: { latLng: { latitude: dest.lat, longitude: dest.lng } } },
            travelMode: gMode,
          };
          if (intermediates.length > 0) {
            reqBody.intermediates = intermediates;
          }
          chunkPromises.push(
            fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': '${apiKey}',
                'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
              },
              body: JSON.stringify(reqBody),
            }).then(function(res) {
              console.log('[GoogleMapView] Routes API HTTP status:', res.status);
              return res.json();
            }).then(function(data) {
              if (data.routes && data.routes.length > 0 && data.routes[0].polyline && data.routes[0].polyline.encodedPolyline) {
                console.log('[GoogleMapView] Routes API got encoded polyline, len:', data.routes[0].polyline.encodedPolyline.length);
                return decodePolyline(data.routes[0].polyline.encodedPolyline);
              }
              console.warn('[GoogleMapView] Routes API no route or error:', JSON.stringify(data));
              return null;
            }).catch(function(err) {
              console.warn('[GoogleMapView] Routes API fetch error:', err);
              return null;
            })
          );
          if (end === coords.length) break;
        }

        Promise.all(chunkPromises).then(function(results) {
          const merged = [];
          for (let c = 0; c < results.length; c++) {
            const pts = results[c];
            if (!pts || pts.length === 0) return resolve(null);
            for (let p = 0; p < pts.length; p++) {
              if (merged.length === 0 || p > 0) merged.push(pts[p]);
            }
          }
          resolve(merged.length > 0 ? merged : null);
        }).catch(function() { resolve(null); });
      });
    }

    function fetchOsrmRoute(coords, mode) {
      return new Promise(function(resolve) {
        if (!coords || coords.length < 2) return resolve(null);
        const profile = mode === 'WALKING' ? 'walking'
          : mode === 'BICYCLING' ? 'cycling'
          : 'driving';

        const coordString = coords.map(function(c) {
          return c.lng + ',' + c.lat;
        }).join(';');

        const url = 'https://router.project-osrm.org/route/v1/' + profile + '/' + coordString + '?overview=full&geometries=geojson';
        console.log('[GoogleMapView] Trying OSRM fallback with profile:', profile);
        fetch(url).then(function(res) {
          return res.json();
        }).then(function(data) {
          console.log('[GoogleMapView] OSRM response code:', data.code);
          if (data.code === 'Ok' && data.routes && data.routes.length > 0 && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
            const osrmPts = data.routes[0].geometry.coordinates.map(function(pt) {
              return { lat: pt[1], lng: pt[0] };
            });
            console.log('[GoogleMapView] OSRM route points count:', osrmPts.length);
            resolve(osrmPts.length > 0 ? osrmPts : null);
          } else {
            resolve(null);
          }
        }).catch(function(err) {
          console.warn('[GoogleMapView] OSRM fetch error:', err);
          resolve(null);
        });
      });
    }

    function calculateRoadRoute(coords, modeKey, reqId, color) {
      const targetMode = (modeKey || currentRouteMode || '${normalizedRouteMode}').toUpperCase();
      console.log('[GoogleMapView] calculateRoadRoute start for ' + coords.length + ' points, mode: ' + targetMode);

      if (targetMode === 'FLIGHT' || targetMode === 'AIR' || targetMode === 'GEODESIC') {
        drawPolylinePath(coords, color);
        return;
      }

      // Priority 1: Google Routes API (Official Routes API v2 via API Key)
      fetchGoogleRoutesApi(coords, targetMode).then(function(googlePath) {
        if (reqId !== activeRouteRequestId) return;
        if (googlePath && googlePath.length > 0) {
          console.log('[GoogleMapView] Applying road path from Google Routes API! Points:', googlePath.length);
          drawPolylinePath(googlePath, color);
          return;
        }
        console.log('[GoogleMapView] Google Routes API returned no path, proceeding to OSRM...');
        tryOsrmFallback();
      }).catch(function(err) {
        console.warn('[GoogleMapView] Google Routes API catch:', err);
        tryOsrmFallback();
      });

      function tryOsrmFallback() {
        fetchOsrmRoute(coords, targetMode).then(function(osrmPath) {
          if (reqId !== activeRouteRequestId) return;
          if (osrmPath && osrmPath.length > 0) {
            drawPolylinePath(osrmPath, color);
            return;
          }
          tryLegacyDirections();
        }).catch(function() {
          tryLegacyDirections();
        });
      }

      function tryLegacyDirections() {
        if (!window.google || !google.maps || !google.maps.DirectionsService) return;
        const directionsService = new google.maps.DirectionsService();
        const resolvedTravelMode = google.maps.TravelMode['${normalizedRouteMode}'] && targetMode === '${normalizedRouteMode}'
          ? google.maps.TravelMode['${normalizedRouteMode}']
          : (google.maps.TravelMode[targetMode] || google.maps.TravelMode.DRIVING);

        if (resolvedTravelMode === google.maps.TravelMode.TRANSIT) {
          const segmentPromises = [];
          for (let i = 0; i < coords.length - 1; i++) {
            segmentPromises.push(
              fetchSegmentRoute(directionsService, coords[i], coords[i + 1], null, google.maps.TravelMode.TRANSIT)
            );
          }
          Promise.all(segmentPromises).then(function(results) {
            if (reqId !== activeRouteRequestId) return;
            const fullPath = [];
            for (let s = 0; s < results.length; s++) {
              const seg = results[s];
              for (let p = 0; p < seg.length; p++) {
                if (fullPath.length === 0 || p > 0) fullPath.push(seg[p]);
              }
            }
            if (fullPath.length > 0) {
              drawPolylinePath(fullPath, color);
            } else {
              drawPolylinePath(coords, color);
            }
          }).catch(function() {
            drawPolylinePath(coords, color);
          });
          return;
        }

        if (coords.length <= 27) {
          const origin = coords[0];
          const destination = coords[coords.length - 1];
          const waypoints = coords.slice(1, -1).map(function(pt) {
            return { location: pt, stopover: true };
          });
          directionsService.route({
            origin: origin,
            destination: destination,
            waypoints: waypoints,
            travelMode: google.maps.TravelMode['${normalizedRouteMode}'] && targetMode === '${normalizedRouteMode}'
              ? google.maps.TravelMode['${normalizedRouteMode}']
              : (google.maps.TravelMode[targetMode] || google.maps.TravelMode.DRIVING),
            optimizeWaypoints: false,
          }, function(response, status) {
            if (reqId !== activeRouteRequestId) return;
            if (status === google.maps.DirectionsStatus.OK && response && response.routes && response.routes.length > 0) {
              const roadPath = extractRoutePath(response.routes[0]);
              if (roadPath.length > 0) drawPolylinePath(roadPath, color);
            } else {
              drawPolylinePath(coords, color);
            }
          });
        }
      }
    }

    function renderPins(pinsList) {
      markers.forEach(function(m) { m.setMap(null); });
      markers = [];
      removeConnectorPolyline();

      if (!pinsList || pinsList.length === 0) return;

      const bounds = new google.maps.LatLngBounds();
      const pathCoordinates = [];

      pinsList.forEach(function(pin) {
        if (typeof pin.latitude !== 'number' || typeof pin.longitude !== 'number') return;
        const position = { lat: pin.latitude, lng: pin.longitude };
        bounds.extend(position);
        pathCoordinates.push(position);

        const iconUrl = createSvgPin(pin.color);

        const marker = new google.maps.Marker({
          position: position,
          map: map,
          title: pin.title || '',
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(32, 40),
            anchor: new google.maps.Point(16, 40),
          },
        });

        marker.addListener('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PIN_PRESS',
              pin: pin,
            }));
          }
        });

        marker._pinId = String(pin.id || '');
        markers.push(marker);
      });

      if (${Boolean(showConnectors)}) {
        if (${Boolean(connectByType)}) {
          const typeGroups = {};
          pinsList.forEach(function(pin) {
            if (pin.type === undefined || pin.type === null || pin.type === '') return;
            if (typeof pin.latitude !== 'number' || typeof pin.longitude !== 'number') return;
            const typeKey = String(pin.type);
            if (!typeGroups[typeKey]) {
              typeGroups[typeKey] = {
                color: pin.color || currentConnectorColor,
                coords: [],
              };
            }
            typeGroups[typeKey].coords.push({ lat: pin.latitude, lng: pin.longitude });
          });

          Object.keys(typeGroups).forEach(function(typeKey) {
            const group = typeGroups[typeKey];
            if (group.coords.length > 1) {
              const reqId = ++activeRouteRequestId;
              try {
                calculateRoadRoute(group.coords, currentRouteMode, reqId, group.color);
              } catch (err) {
                console.warn('Error calculating route for type ' + typeKey + ':', err);
              }
            }
          });
        } else if (pathCoordinates.length > 1) {
          const reqId = ++activeRouteRequestId;
          try {
            calculateRoadRoute(pathCoordinates, currentRouteMode, reqId, currentConnectorColor);
          } catch (err) {
            console.warn('Error initiating road route calculation:', err);
          }
        }
      }

      if (!pendingCenter) {
        if (pinsList.length > 1) {
          map.fitBounds(bounds, { top: 60, right: 40, bottom: 80, left: 40 });
        } else if (pinsList.length === 1) {
          map.setCenter({ lat: pinsList[0].latitude, lng: pinsList[0].longitude });
          map.setZoom(${zoom});
        }
      }
    }

    window.updatePins = function(newPins) {
      currentPins = newPins || [];
      if (map) {
        renderPins(currentPins);
      }
    };

    window.centerOnLocation = function(lat, lng, zoomLevel, pinId, offsetY) {
      if (!map) {
        pendingCenter = { lat: lat, lng: lng, zoom: zoomLevel, pinId: pinId, offsetY: offsetY };
        return;
      }
      const target = new google.maps.LatLng(lat, lng);
      map.panTo(target);
      if (typeof zoomLevel === 'number' && zoomLevel > 0) {
        map.setZoom(zoomLevel);
      }
      if (typeof offsetY === 'number' && offsetY !== 0) {
        let offsetApplied = false;
        const applyOffset = function() {
          if (offsetApplied) return;
          offsetApplied = true;
          try {
            map.panBy(0, offsetY);
          } catch (e) {}
        };
        google.maps.event.addListenerOnce(map, 'idle', applyOffset);
        setTimeout(applyOffset, 400);
      }

      // Briefly bounce the matching marker to clearly highlight the selected activity pin
      if (markers && markers.length > 0) {
        let matched = null;
        if (pinId) {
          matched = markers.find(function(m) {
            return m._pinId && m._pinId === String(pinId);
          });
        }
        if (!matched) {
          matched = markers.find(function(m) {
            const pos = m.getPosition();
            return pos && Math.abs(pos.lat() - lat) < 0.0001 && Math.abs(pos.lng() - lng) < 0.0001;
          });
        }
        if (matched && typeof google.maps.Animation !== 'undefined') {
          matched.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function() {
            try { matched.setAnimation(null); } catch (e) {}
          }, 1400);
        }
      }
    };

    window.resetCenter = function() {
      pendingCenter = null;
      if (map && currentPins && currentPins.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        currentPins.forEach(function(pin) {
          if (typeof pin.latitude === 'number' && typeof pin.longitude === 'number') {
            bounds.extend({ lat: pin.latitude, lng: pin.longitude });
          }
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { top: 60, right: 40, bottom: 80, left: 40 });
        }
      }
    };

    window.updateRouteMode = function(newMode) {
      const normalized = (newMode || 'DRIVING').toString().toUpperCase();
      if (currentRouteMode !== normalized) {
        currentRouteMode = normalized;
        if (map && currentPins && currentPins.length > 1 && ${Boolean(showConnectors)}) {
          const pathCoordinates = [];
          currentPins.forEach(function(pin) {
            if (typeof pin.latitude === 'number' && typeof pin.longitude === 'number') {
              pathCoordinates.push({ lat: pin.latitude, lng: pin.longitude });
            }
          });
          if (pathCoordinates.length > 1) {
            const reqId = ++activeRouteRequestId;
            try {
              calculateRoadRoute(pathCoordinates, currentRouteMode, reqId);
            } catch (err) {
              console.warn('Error calculating road route for new mode:', err);
            }
          }
        }
      }
    };

    window.updateConnectorColor = function(newColor) {
      if (newColor && currentConnectorColor !== newColor) {
        currentConnectorColor = newColor;
        if (connectorPolyline) {
          connectorPolyline.setOptions({ strokeColor: currentConnectorColor });
        }
      }
    };

    window.onload = function() {
      if (window.google && window.google.maps) {
        initMap();
      } else {
        const checkInterval = setInterval(function() {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            initMap();
          }
        }, 100);
      }
    };
  </script>
</body>
</html>
`;
  }, [
    apiKey,
    centerCoord.latitude,
    centerCoord.longitude,
    zoom,
    mapType,
    showTraffic,
    showZoomControls,
    showBusinesses,
    customMapStyles,
    showConnectors,
    connectByType,
    normalizedRouteMode,
    connectorColor,
    connectorWidth,
    connectorOpacity,
    connectorDashed,
    connectorGeodesic,
  ]);

  // Dynamically update route mode without needing full webview reload
  useEffect(() => {
    if (
      webViewRef.current &&
      typeof webViewRef.current.injectJavaScript === "function"
    ) {
      const code = `if (window.updateRouteMode) { window.updateRouteMode(${JSON.stringify(normalizedRouteMode)}); } true;`;
      webViewRef.current.injectJavaScript(code);
    }
  }, [normalizedRouteMode]);

  // Dynamically update connector color without needing full webview reload
  useEffect(() => {
    if (
      webViewRef.current &&
      typeof webViewRef.current.injectJavaScript === "function" &&
      connectorColor
    ) {
      const code = `if (window.updateConnectorColor) { window.updateConnectorColor(${JSON.stringify(connectorColor)}); } true;`;
      webViewRef.current.injectJavaScript(code);
    }
  }, [connectorColor]);

  // Update pins in webview dynamically when pins change
  useEffect(() => {
    if (
      webViewRef.current &&
      typeof webViewRef.current.injectJavaScript === "function" &&
      Array.isArray(pins)
    ) {
      const code = `if (window.updatePins) { window.updatePins(${JSON.stringify(pins)}); } true;`;
      webViewRef.current.injectJavaScript(code);
    }
  }, [pins]);

  // Center on coordinates when centerCoordinates prop changes
  useEffect(() => {
    if (
      centerCoordinates &&
      typeof centerCoordinates.latitude === "number" &&
      typeof centerCoordinates.longitude === "number" &&
      (centerCoordinates.latitude !== 0 || centerCoordinates.longitude !== 0) &&
      webViewRef.current &&
      typeof webViewRef.current.injectJavaScript === "function"
    ) {
      isCenteredRef.current = true;
      const targetZoom = centerCoordinates.zoom || 15;
      const pinId = selectedPinId || "";
      const offsetY = typeof centerCoordinates.offsetY === "number" ? centerCoordinates.offsetY : 0;
      const code = `if (window.centerOnLocation) { window.centerOnLocation(${centerCoordinates.latitude}, ${centerCoordinates.longitude}, ${targetZoom}, ${JSON.stringify(pinId)}, ${offsetY}); } true;`;
      webViewRef.current.injectJavaScript(code);
    } else if (!centerCoordinates && !selectedPinId && isCenteredRef.current) {
      isCenteredRef.current = false;
      if (
        webViewRef.current &&
        typeof webViewRef.current.injectJavaScript === "function"
      ) {
        const code = `if (window.resetCenter) { window.resetCenter(); } true;`;
        webViewRef.current.injectJavaScript(code);
      }
    }
  }, [centerCoordinates, selectedPinId]);

  // Center on pin when selectedPinId prop changes without explicit centerCoordinates
  useEffect(() => {
    if (
      selectedPinId &&
      !centerCoordinates &&
      pins &&
      pins.length > 0 &&
      webViewRef.current &&
      typeof webViewRef.current.injectJavaScript === "function"
    ) {
      const targetPin = pins.find((p) => String(p.id) === String(selectedPinId));
      if (
        targetPin &&
        typeof targetPin.latitude === "number" &&
        typeof targetPin.longitude === "number" &&
        (targetPin.latitude !== 0 || targetPin.longitude !== 0)
      ) {
        isCenteredRef.current = true;
        const code = `if (window.centerOnLocation) { window.centerOnLocation(${targetPin.latitude}, ${targetPin.longitude}, 15, ${JSON.stringify(selectedPinId)}, 0); } true;`;
        webViewRef.current.injectJavaScript(code);
      }
    }
  }, [selectedPinId, centerCoordinates, pins]);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "PIN_PRESS" && onPinPress) {
          onPinPress(data.pin);
        } else if (data.type === "MAP_PRESS" && onMapPress) {
          onMapPress();
        }
      } catch (err) {
        console.warn("[GoogleMapView] Error parsing message from WebView", err);
      }
    },
    [onPinPress, onMapPress]
  );

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityValue={{
        text: centerCoordinates
          ? `${centerCoordinates.latitude},${centerCoordinates.longitude}`
          : "none",
      }}
    >
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#263F69" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "#e5e3df",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
});

export default GoogleMapView;
