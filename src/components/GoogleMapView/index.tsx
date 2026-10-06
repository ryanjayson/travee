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
import { GoogleMapPin, GoogleMapViewProps, Coordinates } from "./types";

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
  bottomOffset = 0,
  isExpanded = false,
  zoom = 13,
  onPinPress,
  onMapPress,
  style,
  apiKey = DEFAULT_GOOGLE_KEY,
  mapType = "roadmap",
  showTraffic = false,
  showZoomControls = false,
  showBusinesses = false,
  customMapStyles,
  showConnectors = false,
  routeMode = "DRIVING",
  connectorColor = "#c10003",
  connectorWidth = 4,
  connectorOpacity = 1,
  connectorDashed = false,
  connectorGeodesic = false,
  connectByType = false,
  testID = "google-map-view",
}: GoogleMapViewProps) => {
  const webViewRef = useRef<WebView>(null);
  const isCenteredRef = useRef(false);

  const normalizedRouteMode = useMemo(() => {
    return (routeMode || "DRIVING").toUpperCase();
  }, [routeMode]);

  const initialCenterRef = useRef<Coordinates | null>(null);
  if (!initialCenterRef.current) {
    if (initialCoordinates) {
      initialCenterRef.current = initialCoordinates;
    } else if (pins && pins.length > 0) {
      initialCenterRef.current = {
        latitude: pins[0].latitude,
        longitude: pins[0].longitude,
      };
    }
  }

  const centerCoord = initialCenterRef.current || DEFAULT_CENTER;

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
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 6px;
      padding: 2px 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: #1F2937;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
      white-space: nowrap;
      pointer-events: none;
      transform: translate(-50%, -50%);
      max-width: 110px;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 16px;
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
    let currentCenterTarget = null;
    let currentBottomOffset = ${typeof bottomOffset === 'number' ? bottomOffset : 0};
    let currentPanAnimation = null;

    function smoothPanTo(targetLatLng, duration) {
      if (!map) return;
      if (currentPanAnimation) {
        cancelAnimationFrame(currentPanAnimation);
        currentPanAnimation = null;
      }

      const startCenter = map.getCenter();
      if (!startCenter) {
        map.setCenter(targetLatLng);
        return;
      }

      const startLat = startCenter.lat();
      const startLng = startCenter.lng();
      const targetLat = typeof targetLatLng.lat === 'function'
        ? targetLatLng.lat()
        : targetLatLng.lat;
      const targetLng = typeof targetLatLng.lng === 'function'
        ? targetLatLng.lng()
        : targetLatLng.lng;

      let deltaLng = targetLng - startLng;
      if (deltaLng > 180) deltaLng -= 360;
      if (deltaLng < -180) deltaLng += 360;
      const deltaLat = targetLat - startLat;

      if (Math.abs(deltaLat) < 0.000001 && Math.abs(deltaLng) < 0.000001) {
        return;
      }

      const animDuration = typeof duration === 'number' ? duration : 600;
      const startTime = performance.now();

      function easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      }

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animDuration, 1);
        const ease = easeInOutCubic(progress);

        const curLat = startLat + deltaLat * ease;
        const curLng = startLng + deltaLng * ease;

        map.setCenter({ lat: curLat, lng: curLng });

        if (progress < 1) {
          currentPanAnimation = requestAnimationFrame(step);
        } else {
          currentPanAnimation = null;
          map.setCenter({ lat: targetLat, lng: targetLng });
        }
      }

      currentPanAnimation = requestAnimationFrame(step);
    }

    function getSubtypeIconPath(subType) {
      if (subType === undefined || subType === null) return null;
      const s = String(subType).toLowerCase().trim();
      if (!s) return null;

      if (s.includes('flight') || s.includes('plane') || s.includes('airport')) {
        return (
          'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2' +
          'l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z'
        );
      }
      if (
        s.includes('hotel') || s.includes('resort') || s.includes('hostel') ||
        s.includes('motel') || s.includes('accommodation') || s.includes('stay') ||
        s.includes('lodging') || s === '9' || s.includes('rest')
      ) {
        return (
          'M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8' +
          'v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z'
        );
      }
      if (
        s.includes('villa') || s.includes('apartment') || s.includes('airbnb') ||
        s.includes('homestay') || s.includes('house') || s.includes('guesthouse') ||
        s.includes('cabin')
      ) {
        return 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z';
      }
      if (s.includes('camp') || s.includes('glamp') || s === '7') {
        return 'M4 19h16l-7-14h-2L4 19zm8-10.3l3.65 7.3H8.35L12 8.7z';
      }
      if (
        s.includes('hike') || s.includes('mountain') || s.includes('volcano') ||
        s.includes('canyon') || s.includes('desert') || s.includes('cave') ||
        s.includes('trek') || s === '8'
      ) {
        return 'M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.8 13.7 7 10 7 10l-6 8h22L14 6z';
      }
      if (
        s.includes('beach') || s.includes('lake') || s.includes('river') ||
        s.includes('waterfall') || s.includes('water')
      ) {
        return (
          'M12 2C6.48 2 2 6.48 2 12c0 .35.03.68.06 1.02L11 13v6c0 .55.45 1 1 1' +
          's1-.45 1-1v-6l8.94.02c.03-.34.06-.67.06-1.02 0-5.52-4.48-10-10-10z'
        );
      }
      if (
        s.includes('forest') || s.includes('jungle') || s.includes('park') ||
        s.includes('nature') || s.includes('terrain') || s === '6'
      ) {
        return 'M12 2L4 14h3v6h10v-6h3L12 2zm0 3.8l4 6.2h-2v4h-4v-4H8l4-6.2z';
      }
      if (
        s.includes('cafe') || s.includes('coffee') || s.includes('breakfast') ||
        s.includes('tea') || s.includes('bakery') || s === '1'
      ) {
        return (
          'M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2' +
          'V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 21h18v-2H2v2z'
        );
      }
      if (s.includes('bar') || s.includes('pub')) {
        return (
          'M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69' +
          'l-1.78 2H7.43z'
        );
      }
      if (
        s.includes('restaurant') || s.includes('food') || s.includes('bistro') ||
        s.includes('dining') || s.includes('cuisine') || s.includes('meal') ||
        s === '2'
      ) {
        return (
          'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03' +
          'C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z'
        );
      }
      if (
        s.includes('mall') || s.includes('market') || s.includes('store') ||
        s.includes('shop') || s.includes('clothes') || s.includes('grocer') ||
        s.includes('supermarket') || s === '5'
      ) {
        return (
          'M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2' +
          'h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2z' +
          'm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z'
        );
      }
      if (
        s.includes('pharmacy') || s.includes('drug') || s.includes('spa') ||
        s.includes('health') || s.includes('beauty')
      ) {
        return 'M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z';
      }
      if (s.includes('atm') || s.includes('bank')) {
        return (
          'M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3z' +
          'm-4.5-9L2 6v2h19V6l-9.5-5z'
        );
      }
      if (
        s.includes('cinema') || s.includes('theater') || s.includes('theatre') ||
        s.includes('movie') || s.includes('entertainment') || s === '4'
      ) {
        return (
          'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2' +
          'L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z'
        );
      }
      if (s.includes('museum')) {
        return (
          'M12 2L2 7v2h20V7L12 2zm8 17H4v2h16v-2zm-9-8h2v6h-2v-6zm-4 0h2v6H7v-6z' +
          'm8 0h2v6h-2v-6z'
        );
      }
      if (
        s.includes('gym') || s.includes('stadium') || s.includes('fitness') ||
        s.includes('sport')
      ) {
        return (
          'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14' +
          ' 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43' +
          'L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22' +
          'l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z'
        );
      }
      if (s.includes('train') || s.includes('subway') || s.includes('metro')) {
        return (
          'M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5' +
          'L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17c-.83 0' +
          '-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0' +
          'c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5' +
          ' 1.5zm1.5-6H6V7h12v4z'
        );
      }
      if (s.includes('bus') || s.includes('transit')) {
        return (
          'M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1' +
          'h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22' +
          'V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67' +
          ' 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5' +
          's.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z'
        );
      }
      if (s.includes('walk') || s.includes('stroll') || s === '12') {
        return (
          'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7' +
          ' 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2' +
          'c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6' +
          ' 8.3V13h2V9.6l1.8-.7z'
        );
      }
      if (s.includes('meetup') || s.includes('people') || s.includes('social') || s === '11') {
        return (
          'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3' +
          ' 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34' +
          ' 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z'
        );
      }
      if (
        s.includes('preparation') || s.includes('pack') || s.includes('build') ||
        s.includes('tool') || s === '13'
      ) {
        return (
          'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6' +
          ' 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4' +
          ' 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z'
        );
      }
      if (
        s.includes('bike') || s.includes('bicycle') || s.includes('motorcycle') ||
        s.includes('scooter') || s === '10' || s.includes('ride')
      ) {
        return (
          'M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0' +
          '-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6' +
          '-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm14-8.5' +
          'c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5' +
          '-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm-8.2-7' +
          'l2.2-3.3 2 2h3.5v-2h-2.5l-1.5-1.5c-.4-.4-1-.6-1.5-.6s-1.1.2-1.5.6' +
          'L9.6 11.2l-2.8-1.4V7H5v4.2l3.8 1.9 2 5.9h2l-2-6z'
        );
      }
      if (s.includes('boat') || s.includes('ferry') || s.includes('ship')) {
        return (
          'M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53' +
          ' 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0' +
          ' 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98' +
          ' 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08' +
          '-.26.06-.54-.06-.78s-.34-.42-.6-.47L19 11V6c0-1.1-.9-2-2-2h-3V1h-4' +
          'v3H7c-1.1 0-2 .9-2 2v5l-2.28.07c-.26.05-.48.23-.6.47s-.14.52-.06' +
          '.78L3.95 19zM7 6h10v5.03l-5-.17-5 .17V6z'
        );
      }
      if (
        s.includes('car') || s.includes('taxi') || s.includes('rental') ||
        s.includes('vehicle') || s.includes('drive')
      ) {
        return (
          'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42' +
          ' 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1' +
          ' 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77' +
          'L6.85 7zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z'
        );
      }
      if (
        s.includes('sight') || s.includes('attraction') || s.includes('tour') ||
        s.includes('photo') || s.includes('camera') || s.includes('monument') ||
        s.includes('landmark') || s === '3'
      ) {
        return (
          'M12 12c1.65 0 3-1.35 3-3s-1.35-3-3-3-3 1.35-3 3 1.35 3 3 3zm0-4' +
          'c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm8-4h-3.17l-1.83-2' +
          'H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0' +
          '-1.1-.9-2-2-2zm0 14H4V6h4.05l1.83-2h4.24l1.83 2H20v12z'
        );
      }

      return (
        'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2' +
        ' 9.24l5.46 4.73L5.82 21z'
      );
    }

    function createSvgPin(color, subType) {
      const pinColor = color || '#c10003';
      const iconPath = getSubtypeIconPath(subType);
      let innerContent = '<circle cx="18" cy="17" r="7" fill="#FFFFFF"/>';

      if (iconPath) {
        innerContent =
          // '<circle cx="18" cy="17" r="8.5" fill="#FFFFFF"/>' +
          '<g transform="translate(18, 17) scale(0.80) translate(-12, -12)">' +
          // '<path fill="' + pinColor + '" d="' + iconPath + '"/>' +
          '<path fill="' + '#FFFFFF' + '" d="' + iconPath + '"/>' +
          '</g>';
      }

      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">' +
        '<path fill="' + pinColor + '" stroke="#FFFFFF" stroke-width="2" ' +
        'd="M18 0C8.059 0 0 8.059 0 18c0 12.375 16.2 27.225 16.875 27.825a1.5 1.5 0 0 0 2.25 0C19.8 45.225 36 30.375 36 18 36 8.059 27.941 0 18 0z"/>' +
        innerContent +
        '</svg>';
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }

    function getCenterWithOffset(lat, lng, offsetY, targetZoom) {
      if (!map || !offsetY) {
        return new google.maps.LatLng(lat, lng);
      }
      const projection = map.getProjection();
      if (!projection) {
        return new google.maps.LatLng(lat, lng);
      }
      const zoom = (typeof targetZoom === 'number' && targetZoom > 0) ? targetZoom : map.getZoom();
      const scale = Math.pow(2, zoom);
      const targetLatLng = new google.maps.LatLng(lat, lng);
      const worldPoint = projection.fromLatLngToPoint(targetLatLng);
      if (!worldPoint) return targetLatLng;
      const newWorldY = worldPoint.y + (offsetY / scale);
      const newCenter = projection.fromPointToLatLng(new google.maps.Point(worldPoint.x, newWorldY));
      return newCenter || targetLatLng;
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

      map.addListener('dragstart', function() {
        if (currentPanAnimation) {
          cancelAnimationFrame(currentPanAnimation);
          currentPanAnimation = null;
        }
      });

      renderPins(currentPins || initialPins);

      if (pendingCenter) {
        window.centerOnLocation(
          pendingCenter.lat,
          pendingCenter.lng,
          pendingCenter.zoom,
          pendingCenter.pinId,
          pendingCenter.offsetY,
          false
        );
        pendingCenter = null;
      }

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }

      if (typeof ResizeObserver !== 'undefined') {
        const mapDiv = document.getElementById('map');
        if (mapDiv) {
          const ro = new ResizeObserver(function() {
            if (map) {
              google.maps.event.trigger(map, 'resize');
              if (currentCenterTarget) {
                const targetZoom = currentCenterTarget.zoom || map.getZoom();
                const centerLatLng = getCenterWithOffset(currentCenterTarget.lat, currentCenterTarget.lng, currentCenterTarget.offsetY, targetZoom);
                map.setCenter(centerLatLng);
              }
            }
          });
          ro.observe(mapDiv);
        }
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

        const iconUrl = createSvgPin(pin.color, pin.subType);

        const markerOptions = {
          position: position,
          map: map,
          title: pin.title || '',
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(32, 40),
            anchor: new google.maps.Point(16, 40),
            labelOrigin: new google.maps.Point(16, -10),
          },
        };

        if (pin.title) {
          markerOptions.label = {
            text: pin.title,
            className: 'custom-pin-label',
            color: '#1F2937',
            fontSize: '11px',
            fontWeight: '600',
          };
        }

        const marker = new google.maps.Marker(markerOptions);

        marker.addListener('click', function() {
          if (typeof window.centerOnLocation === 'function') {
            window.centerOnLocation(
              pin.latitude,
              pin.longitude,
              null,
              pin.id,
              currentBottomOffset / 2
            );
          }
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
                color: currentConnectorColor || '#c10003',
                coords: [],
              };
            }
            typeGroups[typeKey].coords.push({ lat: pin.latitude, lng: pin.longitude });
          });

          let anyGroupConnected = false;
          Object.keys(typeGroups).forEach(function(typeKey) {
            const group = typeGroups[typeKey];
            if (group.coords.length > 1) {
              anyGroupConnected = true;
              const reqId = ++activeRouteRequestId;
              try {
                calculateRoadRoute(group.coords, currentRouteMode, reqId, group.color);
              } catch (err) {
                console.warn('Error calculating route for type ' + typeKey + ':', err);
              }
            }
          });

          if (!anyGroupConnected && pathCoordinates.length > 1) {
            const reqId = ++activeRouteRequestId;
            try {
              calculateRoadRoute(pathCoordinates, currentRouteMode, reqId, currentConnectorColor);
            } catch (err) {
              console.warn('Error initiating road route calculation:', err);
            }
          }
        } else if (pathCoordinates.length > 1) {
          const reqId = ++activeRouteRequestId;
          try {
            calculateRoadRoute(pathCoordinates, currentRouteMode, reqId, currentConnectorColor);
          } catch (err) {
            console.warn('Error initiating road route calculation:', err);
          }
        }
      }

      if (!pendingCenter && !currentCenterTarget) {
        if (pinsList.length > 1) {
          map.fitBounds(bounds, { top: 60, right: 40, bottom: currentBottomOffset + 40, left: 40 });
        } else if (pinsList.length === 1) {
          const centerLatLng = getCenterWithOffset(
            pinsList[0].latitude,
            pinsList[0].longitude,
            currentBottomOffset / 2,
            ${zoom}
          );
          map.setCenter(centerLatLng);
          map.setZoom(${zoom});
        }
      }
    }

    window.updatePins = function(newPins) {
      const incoming = newPins || [];
      if (currentPins && currentPins.length === incoming.length) {
        let isSame = true;
        for (let i = 0; i < incoming.length; i++) {
          if (
            String(incoming[i].id) !== String(currentPins[i].id) ||
            incoming[i].latitude !== currentPins[i].latitude ||
            incoming[i].longitude !== currentPins[i].longitude ||
            incoming[i].title !== currentPins[i].title ||
            incoming[i].subType !== currentPins[i].subType ||
            incoming[i].color !== currentPins[i].color
          ) {
            isSame = false;
            break;
          }
        }
        if (isSame) {
          return;
        }
      }
      currentPins = incoming;
      if (map) {
        renderPins(currentPins);
      }
    };

    window.setZoomLevel = function(newZoom) {
      if (map && typeof newZoom === 'number' && newZoom > 0 && map.getZoom() !== newZoom) {
        map.setZoom(newZoom);
      }
    };

    window.setBottomOffset = function(newOffset) {
      currentBottomOffset = typeof newOffset === 'number' ? newOffset : 0;
      const isExp = arguments[1];
      if (!map || isExp) return;
      if (currentCenterTarget) {
        const offset = (typeof currentCenterTarget.offsetY === 'number' &&
          currentCenterTarget.offsetY !== 0)
          ? currentCenterTarget.offsetY
          : (currentBottomOffset / 2);
        const centerLatLng = getCenterWithOffset(
          currentCenterTarget.lat,
          currentCenterTarget.lng,
          offset,
          map.getZoom()
        );
        map.setCenter(centerLatLng);
      }
    };

    window.centerOnLocation = function(lat, lng, zoomLevel, pinId, offsetY) {
      if (!map) {
        pendingCenter = { lat: lat, lng: lng, zoom: zoomLevel, pinId: pinId, offsetY: offsetY };
        return;
      }
      const animate = arguments[5];
      const effectiveOffset = (typeof offsetY === 'number' && offsetY !== 0)
        ? offsetY
        : (currentBottomOffset / 2);
      currentCenterTarget = {
        lat: lat,
        lng: lng,
        zoom: zoomLevel,
        pinId: pinId,
        offsetY: effectiveOffset,
      };

      const targetZoom = (typeof zoomLevel === 'number' && zoomLevel > 0)
        ? zoomLevel
        : map.getZoom();
      const target = getCenterWithOffset(lat, lng, effectiveOffset, targetZoom);

      if (animate === false) {
        if (typeof zoomLevel === 'number' && zoomLevel > 0 && map.getZoom() !== zoomLevel) {
          map.setZoom(zoomLevel);
        }
        map.setCenter(target);
      } else {
        if (typeof smoothPanTo === 'function') {
          smoothPanTo(target, 600);
        } else {
          map.panTo(target);
        }
      }

      if (!map.getProjection() && effectiveOffset !== 0) {
        google.maps.event.addListenerOnce(map, 'projection_changed', function() {
          const refinedCenter = getCenterWithOffset(lat, lng, effectiveOffset, targetZoom);
          map.setCenter(refinedCenter);
        });
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
      currentCenterTarget = null;
      if (map && currentPins && currentPins.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        currentPins.forEach(function(pin) {
          if (typeof pin.latitude === 'number' && typeof pin.longitude === 'number') {
            bounds.extend({ lat: pin.latitude, lng: pin.longitude });
          }
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { top: 60, right: 40, bottom: currentBottomOffset + 40, left: 40 });
        }
      } else if (map && currentPins && currentPins.length === 1) {
        const pin = currentPins[0];
        const centerLatLng = getCenterWithOffset(pin.latitude, pin.longitude, currentBottomOffset / 2, ${zoom});
        map.panTo(centerLatLng);
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
    mapType,
    showTraffic,
    showZoomControls,
    showBusinesses,
    customMapStyles,
    showConnectors,
    connectByType,
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

  const prevPinsJsonRef = useRef("");
  const isMapReadyRef = useRef<boolean>(false);

  // Update pins in webview dynamically when pins change
  useEffect(() => {
    if (
      webViewRef.current &&
      typeof webViewRef.current.injectJavaScript === "function" &&
      Array.isArray(pins)
    ) {
      const pinsJson = JSON.stringify(pins);
      if (pinsJson !== prevPinsJsonRef.current) {
        prevPinsJsonRef.current = pinsJson;
        const code = `if (window.updatePins) { window.updatePins(${pinsJson}); } true;`;
        webViewRef.current.injectJavaScript(code);
      }
    }
  }, [pins]);

  // Dynamically update map zoom level when zoom prop changes (unless expanded)
  useEffect(() => {
    if (
      !isExpanded &&
      typeof zoom === "number" &&
      zoom > 0 &&
      webViewRef.current &&
      typeof webViewRef.current.injectJavaScript === "function"
    ) {
      const code = `if (window.setZoomLevel) { window.setZoomLevel(${zoom}); } true;`;
      webViewRef.current.injectJavaScript(code);
    }
  }, [zoom, isExpanded]);

  // Update bottom offset when bottomOffset prop changes
  useEffect(() => {
    if (webViewRef.current && typeof webViewRef.current.injectJavaScript === "function") {
      const offset = typeof bottomOffset === "number" ? bottomOffset : 0;
      const code = `if (window.setBottomOffset) { window.setBottomOffset(${offset}, ${Boolean(isExpanded)}); } true;`;
      webViewRef.current.injectJavaScript(code);
    }
  }, [bottomOffset, isExpanded]);

  const prevCenterRef = useRef<{
    lat?: number;
    lng?: number;
    pinId?: string | null;
  }>({});

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
      const pinId = selectedPinId || "";
      const prev = prevCenterRef.current;
      const coordsChanged =
        prev.lat !== centerCoordinates.latitude ||
        prev.lng !== centerCoordinates.longitude ||
        prev.pinId !== pinId;

      if (coordsChanged) {
        prevCenterRef.current = {
          lat: centerCoordinates.latitude,
          lng: centerCoordinates.longitude,
          pinId: pinId,
        };
        isCenteredRef.current = true;
        const targetZoom = isExpanded
          ? null
          : typeof centerCoordinates.zoom === "number" && centerCoordinates.zoom > 0
            ? centerCoordinates.zoom
            : null;
        const offsetY =
          typeof centerCoordinates.offsetY === "number"
            ? centerCoordinates.offsetY
            : bottomOffset
              ? bottomOffset / 2
              : 0;
        const zoomParam = targetZoom !== null ? targetZoom : "null";
        const serializedPinId = JSON.stringify(pinId);
        const { latitude: lat, longitude: lng } = centerCoordinates;
        const code =
          `if (window.centerOnLocation) { ` +
          `window.centerOnLocation(${lat}, ${lng}, ${zoomParam}, ` +
          `${serializedPinId}, ${offsetY}); } true;`;
        webViewRef.current.injectJavaScript(code);
      }
    } else if (!centerCoordinates && !selectedPinId && isCenteredRef.current) {
      isCenteredRef.current = false;
      prevCenterRef.current = {};
      if (
        webViewRef.current &&
        typeof webViewRef.current.injectJavaScript === "function"
      ) {
        const code = `if (window.resetCenter) { window.resetCenter(); } true;`;
        webViewRef.current.injectJavaScript(code);
      }
    }
  }, [centerCoordinates, selectedPinId, bottomOffset, isExpanded]);

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
        const prev = prevCenterRef.current;
        if (prev.pinId !== selectedPinId) {
          prevCenterRef.current = {
            lat: targetPin.latitude,
            lng: targetPin.longitude,
            pinId: selectedPinId,
          };
          isCenteredRef.current = true;
          const targetZoom = isExpanded ? "null" : 15;
          const offsetY = bottomOffset ? bottomOffset / 2 : 0;
          const serializedPinId = JSON.stringify(selectedPinId);
          const code =
            `if (window.centerOnLocation) { ` +
            `window.centerOnLocation(${targetPin.latitude}, ` +
            `${targetPin.longitude}, ${targetZoom}, ${serializedPinId}, ` +
            `${offsetY}); } true;`;
          webViewRef.current.injectJavaScript(code);
        }
      }
    }
  }, [selectedPinId, centerCoordinates, pins, bottomOffset, isExpanded]);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "MAP_READY") {
          isMapReadyRef.current = true;
          if (
            webViewRef.current &&
            typeof webViewRef.current.injectJavaScript === "function" &&
            Array.isArray(pins) &&
            pins.length > 0
          ) {
            const pinsJson = JSON.stringify(pins);
            const code =
              `if (window.updatePins) { window.updatePins(${pinsJson}); } true;`;
            webViewRef.current.injectJavaScript(code);
          }
        } else if (data.type === "PIN_PRESS" && onPinPress) {
          if (
            data.pin &&
            typeof data.pin.latitude === "number" &&
            typeof data.pin.longitude === "number"
          ) {
            prevCenterRef.current = {
              lat: data.pin.latitude,
              lng: data.pin.longitude,
              pinId: String(data.pin.id || ""),
            };
            isCenteredRef.current = true;
          }
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
        onLoadEnd={() => {
          if (
            webViewRef.current &&
            typeof webViewRef.current.injectJavaScript === "function" &&
            Array.isArray(pins) &&
            pins.length > 0
          ) {
            const pinsJson = JSON.stringify(pins);
            const code =
              `if (window.updatePins) { window.updatePins(${pinsJson}); } true;`;
            webViewRef.current.injectJavaScript(code);
          }
        }}
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
