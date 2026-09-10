import { StyleProp, ViewStyle, TextStyle } from "react-native";

export interface GooglePlaceLocation {
  placeId: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  types?: string[];
  secondaryText?: string;
  raw?: any;
}

export interface GoogleMapSearchBoxProps {
  /** Callback fired when a spot or location is selected */
  onSelect: (location: GooglePlaceLocation) => void;
  /** Callback fired when the bottom sheet is closed */
  onClose?: () => void;
  /** Callback for entering details manually without search */
  onManualEntry?: () => void;
  /** Title shown in bottom sheet header */
  title?: string;
  /** Description or subtitle shown in header */
  description?: string;
  /** Description text alias */
  descriptionText?: string;
  /** Subtitle or destination name */
  destination?: string;
  /** List of trip destinations for multi-destination support */
  destinations?: any[];
  /** Placeholder text for search input */
  placeholder?: string;
  /** Initial text value in the search box */
  initialValue?: string;
  /** Callback when the search box is cleared */
  onClear?: () => void;
  /** Custom Google Maps API Key */
  apiKey?: string;
  /** Optional country restriction or bias (e.g. "US", "JP") */
  country?: string;
  /** Optional proximity coordinates for biasing search results */
  proximity?: {
    latitude: number;
    longitude: number;
  };
  /** Google Place types filter (e.g. "establishment", "geocode") */
  types?: string;
  /** Max height of the expanded results card inside the bottom sheet */
  maxResultsHeight?: number;
  /** Extra spacing from the bottom edge */
  bottomOffset?: number;
  /** Position mode: "bottomsheet" (default), "absolute", or "relative" */
  mode?: "bottomsheet" | "absolute" | "relative";
  /** Whether to show a semi-transparent backdrop when results are open */
  showBackdrop?: boolean;
  /** Auto-focus the search input on mount */
  autoFocus?: boolean;
  /** Disable search input */
  disabled?: boolean;
  /** Automatically collapse results upon selection (default true) */
  hideOnSelect?: boolean;
  /** Custom style for the outer container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Custom style for the search input bar */
  searchBarContainerStyle?: StyleProp<ViewStyle>;
  /** Custom style for the text input */
  inputStyle?: StyleProp<TextStyle>;
  /** Custom test ID */
  testID?: string;
  /** Optional PanResponder handlers for the drag handle */
  panResponder?: any;
}

export interface SearchPredictionItem {
  id: string;
  placeId: string;
  name: string;
  secondaryText?: string;
  fullAddress: string;
  types?: string[];
  source: "google_new" | "google" | "mapbox" | "osm";
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface GoogleMapSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: GooglePlaceLocation) => void;
  onManualEntry?: () => void;
  title?: string;
  description?: string;
  descriptionText?: string;
  placeholder?: string;
  initialValue?: string;
  initialCoordinates?: {
    latitude: number;
    longitude: number;
  };
  destination?: string;
  destinations?: any[];
  destinationCoordinates?: {
    latitude: number;
    longitude: number;
  };
  country?: string;
}
