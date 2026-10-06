import { StyleProp, ViewStyle } from "react-native";

export interface GoogleMapPin {
  id?: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  type?: string | number;
  subType?: string;
  color?: string;
  sortOrder?: string;
  image?: string;
}

export type GoogleMapRouteMode =
  | "DRIVING"
  | "WALKING"
  | "TRANSIT"
  | "BICYCLING"
  | "FLIGHT"
  | "driving"
  | "walking"
  | "transit"
  | "bicycling"
  | "flight";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GoogleMapViewProps {
  pins?: GoogleMapPin[];
  initialCoordinates?: Coordinates;
  centerCoordinates?: {
    latitude: number;
    longitude: number;
    zoom?: number;
    offsetY?: number;
  } | null;
  selectedPinId?: string | null;
  bottomOffset?: number;
  isExpanded?: boolean;
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
  connectByType?: boolean;
  testID?: string;
}
