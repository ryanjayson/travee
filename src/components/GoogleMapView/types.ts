import { StyleProp, ViewStyle } from "react-native";

export interface GoogleMapPin {
  id?: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  type?: string | number;
  color?: string;
  sortOrder?: string;
  image?: string;
}

export type GoogleMapRouteMode =
  | "DRIVING"
  | "WALKING"
  | "TRANSIT"
  | "BICYCLING"
  | "driving"
  | "walking"
  | "transit"
  | "bicycling";

export interface GoogleMapViewProps {
  pins?: GoogleMapPin[];
  initialCoordinates?: {
    latitude: number;
    longitude: number;
  };
  centerCoordinates?: {
    latitude: number;
    longitude: number;
    zoom?: number;
    offsetY?: number;
  } | null;
  selectedPinId?: string | null;
  zoom?: number;
  onPinPress?: (pin: GoogleMapPin) => void;
  onMapPress?: () => void;
  style?: StyleProp<ViewStyle>;
  apiKey?: string;
  mapType?: "roadmap" | "satellite" | "hybrid" | "terrain";
  showTraffic?: boolean;
  showZoomControls?: boolean;
  showBusinesses?: boolean;
  customMapStyles?: any[];
  showConnectors?: boolean;
  routeMode?: GoogleMapRouteMode;
  connectorColor?: string;
  connectorWidth?: number;
  connectorOpacity?: number;
  connectorDashed?: boolean;
  connectorGeodesic?: boolean;
  testID?: string;
}
