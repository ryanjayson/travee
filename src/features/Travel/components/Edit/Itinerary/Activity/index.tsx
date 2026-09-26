import { MaterialIcons as Icon, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Formik, useFormikContext } from "formik";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Image,
  Keyboard, Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { TextInput, useTheme } from "react-native-paper";
import * as Yup from "yup";
import SimpleAccordion from "../../../../../../components/Accordion/Simple";
import ActivityIcon, { activityIcons } from "../../../../../../components/ActivityIcon";
import DescriptionInput from "../../../../../../components/molecules/DescriptionInput";
import Tabs from "../../../../../../components/Tabs";
import { useConfirm } from "../../../../../../context/ConfirmContext";
import { useToast } from "../../../../../../context/ToastContext";
import { useTravelContext } from "../../../../../../context/TravelContext";
import { useLexicographicSort } from "../../../../../../hooks/useLexicographicSort";
import { fetchLocalItineraryActivity } from "../../../../../../services/local/travelService";
import { TripPlanType, ActivityType, getTripPlanTypeLabel } from "../../../../../../types/enums";
import { useAuth } from "../../../../../Auth/hooks/AuthContext";
import { useDeleteActivityMutation, useUpdateActivityMutation, useItineraryActivity } from "../../../../hooks/useActivity";
import { useUpdateSectionMutation } from "../../../../hooks/useSection";
import { useTravelPlan } from "../../../../hooks/useTravel";
import { Attachment, DestinationDto, Images, ItineraryActivity } from "../../../../types/TravelDto";
import { MapboxPoi } from "../../../Lookups/PoiLookupModal";
import OsmPoiLookupModal from "../../../Lookups/OsmPoiLookupModal";
import OsmMapPinModal, { PinnedLocation } from "../../../Lookups/OsmMapPinModal";
import { GoogleMapSearchModal, GooglePlaceLocation } from "../../../GoogleMapSearchBox";
import { MapboxPlace } from "../../../MapboxDestinationSelector";
import MapboxDestinationSelectorModal from "../../../MapboxDestinationSelector/Modal";
import AirportLookupModal, { Airport } from "../../../Lookups/AirportLookupModal";
import AccomodationTab from "./Tabs/AccomodationTab";
import FlightTab from "./Tabs/FlightTab";
import RideRentalTab from "./Tabs/RideRentalTab";
import TransportationTab from "./Tabs/TransportationTab";
import PlanTab from "./Tabs/PlanTab";
import ChecklistTab from "./Tabs/ChecklistTab";
import PlanDateModal from "./DateTime/PlanDateModal";
import DestinationDetailsBottomSheet from "./DestinationDetailsBottomSheet";
import { FadeInView } from "../../../../../../components/animations";
import { safeJsonParse } from "../../../../../../utils/safeJsonParse";

interface Place {
  id: string;
  name: string;
  address: string;
  type: string;
}

interface EditActivityProps {
  itineraryActivity: ItineraryActivity | null;
  initialType?: TripPlanType;
  onClose: () => void;
  onOpenSectionModal: (sections: any[], currentId: string | undefined, onSelect: (id?: string) => void) => void;
  onOpenPrimaryTypeModal: (currentType: TripPlanType, onSelect: (type: TripPlanType) => void) => void;
  itinerarySectionId?: string;
  travelId?: string;
  onScroll?: (event: any) => void;
  onChildModalToggle?: (isOpen: boolean) => void;
  onSaveSuccess?: (activity: ItineraryActivity) => void;
  onSwitchToAddMode?: () => void;
  onSubmitRef?: React.MutableRefObject<(() => void) | null>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const TravelSchema = Yup.object().shape({
  title: Yup.string()
    .required("Activity title is required")
    .min(3, "Activity title is too short, make it more descriptive")
    .max(40, "Activity title must be at most 40 characters"),
});

export interface ActivityFormValues {
  travelId?: string;
  sectionId?: string;
  id?: string;
  title: string;
  description: string;
  type?: TripPlanType | number;
  planType?: ActivityType | null;
  sortOrder?: string;
  startDate: string | null;
  startTime: string;
  endDate: string | null;
  endTime: string;
  destination: string;
  destinationData?: DestinationDto;
  customTags?: string[] | null;
  budget?: string;
  website?: string;
  bookingReference?: string;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  priority?: string | null;
  images: Images[];
  attachments: Attachment[];
  flightDetails?: {
    departureAirport: string;
    arrivalAirport: string;
    departureDate: Date | string | null;
    arrivalDate?: Date | string | null;
    flightNumber?: string | null;
    airline?: string | null;
    gate?: string | null;
    terminal?: string | null;
    seatNumber?: string | null;
    bookingReference?: string | null;
    price?: string | number | null;
  } | null;
  accomodationDetails?: {
    accomodationName: string;
    address?: string | null;
    destinationAddressData?: import('../../../../types/TravelDto').DestinationDto | null;
    subType?: string | null;
    checkinDateTime: Date | string | null;
    checkoutDateTime?: Date | string | null;
    websiteAddress?: string | null;
    bookingReference?: string | null;
    bookingStatus?: string | null;
    contactNumber?: string | null;
    emailAddress?: string | null;
    contactName?: string | null;
  } | null;
  transportationDetails?: {
    mode?: string | null;
    operatorProvider?: string | null;
    pickupLocation?: DestinationDto | null;
    dropoffLocation?: DestinationDto | null;
    departureDateTime?: Date | string | null;
    arrivalDateTime?: Date | string | null;
    seatOrVehicleNumber?: string | null;
    bookingReference?: string | null;
    bookingStatus?: string | null;
    websiteAddress?: string | null;
    contactNumber?: string | null;
    notes?: string | null;
  } | null;
  rideRentalDetails?: {
    vehicleType?: string | null;
    vehicleModel?: string | null;
    pickupLocation?: DestinationDto | null;
    dropoffLocation?: DestinationDto | null;
    rentalStartDateTime?: Date | string | null;
    rentalEndDateTime?: Date | string | null;
    bookingReference?: string | null;
    bookingStatus?: string | null;
    websiteAddress?: string | null;
    contactName?: string | null;
    contactNumber?: string | null;
    emailAddress?: string | null;
    notes?: string | null;
  } | null;
}


const NATURE_SUBTYPES = [
  "Beach", "Mountain", "Lake", "River", "Waterfall", "Forest", "Jungle", "Cave", "Desert", "Canyon", "Volcano",
];


const getCuisineFromCategories = (categories: string[]): string | undefined => {
  if (!categories || !Array.isArray(categories)) return undefined;
  const genericTerms = ["restaurant", "cafe", "bar", "pub", "food", "establishment", "eating_room", "bakery", "fast_food", "coffee_shop", "bistro"];
  const cuisine = categories.find(c => !genericTerms.includes(c.toLowerCase()));
  if (cuisine) {
    return cuisine
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return undefined;
};

const matchNatureSubtype = (poi: any): string | null => {
  const categories = [poi.category, ...(poi.poiCategories || []), poi.maki].filter(Boolean) as string[];
  for (const cat of categories) {
    const matched = NATURE_SUBTYPES.find(sub => cat.toLowerCase().includes(sub.toLowerCase()));
    if (matched) return matched;
  }
  return null;
};

const matchShoppingSubtype = (poi: any): string | null => {
  const categories = [poi.category, ...(poi.poiCategories || []), poi.maki].filter(Boolean) as string[];
  for (const cat of categories) {
    const norm = cat.toLowerCase();
    if (norm.includes("mall") || norm.includes("shopping_mall")) return "Mall";
    if (norm.includes("market")) return "Market";
    if (norm.includes("clothing") || norm.includes("clothes")) return "Clothes Store";
    if (norm.includes("supermarket") || norm.includes("grocery")) return "Supermarket";
    if (norm.includes("convenience")) return "Convenience Store";
    if (norm.includes("spa") || norm.includes("beauty")) return "Spa";
    if (norm.includes("atm")) return "ATM";
    if (norm.includes("bank")) return "Bank";
    if (norm.includes("pharmacy") || norm.includes("drugstore")) return "Pharmacy";
    if (norm.includes("gas") || norm.includes("petrol")) return "Gas Station";
  }
  return null;
};

const matchEntertainmentSubtype = (poi: any): string | null => {
  const categories = [poi.category, ...(poi.poiCategories || []), poi.maki].filter(Boolean) as string[];
  for (const cat of categories) {
    const norm = cat.toLowerCase();
    if (norm.includes("theme_park")) return "Theme Park";
    if (norm.includes("cinema") || norm.includes("theater")) return "Cinema";
    if (norm.includes("park")) return "Park";
    if (norm.includes("museum")) return "Museum";
    if (norm.includes("gym") || norm.includes("fitness") || norm.includes("sports_club")) return "Gym";
    if (norm.includes("stadium") || norm.includes("arena")) return "Stadium";
    if (norm.includes("zoo") || norm.includes("aquarium")) return "Zoo";
    if (norm.includes("concert") || norm.includes("music_venue")) return "Concert";
  }
  return null;
};

export const buildDestinationDtoFromGooglePlace = (location: GooglePlaceLocation): DestinationDto => {
  const name = location.name || location.address || "";
  const address = location.address || name;
  let city = "";
  let regionOrState = "";
  let country = "";

  const raw = location.raw;

  if (raw && Array.isArray(raw.addressComponents)) {
    raw.addressComponents.forEach((c: any) => {
      const types = c.types || [];
      if (types.includes("locality") || types.includes("postal_town") || (!city && types.includes("sublocality"))) {
        city = c.longText || c.shortText || city;
      }
      if (types.includes("administrative_area_level_1")) {
        regionOrState = c.longText || c.shortText || regionOrState;
      }
      if (types.includes("country")) {
        country = c.longText || c.shortText || country;
      }
    });
  } else if (raw && Array.isArray(raw.address_components)) {
    raw.address_components.forEach((c: any) => {
      const types = c.types || [];
      if (types.includes("locality") || types.includes("postal_town") || (!city && types.includes("sublocality"))) {
        city = c.long_name || c.short_name || city;
      }
      if (types.includes("administrative_area_level_1")) {
        regionOrState = c.long_name || c.short_name || regionOrState;
      }
      if (types.includes("country")) {
        country = c.long_name || c.short_name || country;
      }
    });
  } else if (raw?.properties) {
    city = raw.properties.city || raw.properties.town || raw.properties.village || "";
    regionOrState = raw.properties.state || "";
    country = raw.properties.country || "";
  } else if (raw && Array.isArray(raw.context)) {
    raw.context.forEach((c: any) => {
      if (c.id?.startsWith("country")) country = c.text || country;
      else if (c.id?.startsWith("region")) regionOrState = c.text || regionOrState;
      else if (c.id?.startsWith("place")) city = c.text || city;
    });
  }

  if (!city && location.secondaryText) {
    const parts = location.secondaryText.split(",").map((p: string) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      city = parts[0];
      if (!country) country = parts[parts.length - 1];
    } else if (parts.length === 1) {
      city = parts[0];
    }
  } else if (!city && location.address) {
    const parts = location.address.split(",").map((p: string) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      city = parts[parts.length - 3] || parts[parts.length - 2];
      if (!country) country = parts[parts.length - 1];
    } else if (parts.length === 2) {
      city = parts[0];
      if (!country) country = parts[1];
    }
  }

  if (!country && location.address) {
    const parts = location.address.split(",").map((p: string) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      country = parts[parts.length - 1];
    }
  }

  return {
    id: location.placeId || "",
    name,
    city: city || name,
    regionOrState: regionOrState || undefined,
    country: country || undefined,
    address: address || undefined,
    placeId: location.placeId || undefined,
    coordinates: {
      latitude: location.coordinates?.latitude || 0,
      longitude: location.coordinates?.longitude || 0,
    },
  };
};

export const buildDestinationDtoFromPinnedLocation = (location: PinnedLocation): DestinationDto => {
  const name = location.name || location.address || "";
  const address = location.address || name;
  let city = "";
  let regionOrState = "";
  let country = "";

  if (location.address) {
    const parts = location.address.split(",").map((p: string) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      city = parts[parts.length - 3] || parts[parts.length - 2];
      regionOrState = parts[parts.length - 2];
      country = parts[parts.length - 1];
    } else if (parts.length === 2) {
      city = parts[0];
      country = parts[1];
    } else if (parts.length === 1) {
      city = parts[0];
    }
  }

  return {
    id: (location as any).id || location.placeId || "",
    name,
    city: city || name,
    regionOrState: regionOrState || undefined,
    country: country || undefined,
    address: address || undefined,
    placeId: location.placeId || undefined,
    coordinates: {
      latitude: location.coordinates?.latitude || 0,
      longitude: location.coordinates?.longitude || 0,
    },
  };
};

const EditActivity = ({
  itinerarySectionId,
  itineraryActivity: propItineraryActivity,
  initialType,
  travelId: propTravelId,
  onClose,
  onScroll,
  onChildModalToggle,
  onOpenSectionModal,
  onOpenPrimaryTypeModal,
  onSaveSuccess,
  onSwitchToAddMode,
  onSubmitRef,
  onSubmittingChange,
  onDirtyChange,
}: EditActivityProps) => {
  const editingActivityId = propItineraryActivity?.id || "";
  const { data: dbFetchedActivity } = useItineraryActivity(editingActivityId);
  const itineraryActivity = dbFetchedActivity || propItineraryActivity;

  const toLocalDateStr = (dInput: any) => {
    if (!dInput) return null;
    const d = new Date(dInput);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toLocalTimeStr = (dInput: any) => {
    if (!dInput) return "";
    const d = new Date(dInput);
    if (isNaN(d.getTime())) return "";
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatFlightDateTime = (dateVal: any) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime()) || d.getTime() <= 0) return "";
    return d.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleFlightSelect = (flightData: any, setFieldValue: any) => {
    const { departureAirport, arrivalAirport, departureDate } = flightData;

    if (departureAirport?.coordinates) {
      departureAirportCoordsRef.current = {
        lat: departureAirport.coordinates.lat,
        lon: departureAirport.coordinates.lon,
      };
    }
    if (arrivalAirport?.coordinates) {
      arrivalAirportCoordsRef.current = {
        lat: arrivalAirport.coordinates.lat,
        lon: arrivalAirport.coordinates.lon,
      };
    }

    // 1. Title: e.g. "Flight to Manila"
    const arrCity = arrivalAirport.type === "city"
      ? arrivalAirport.name
      : arrivalAirport.city_name;
    setFieldValue("title", `Flight to ${arrCity}`);

    // 2. Destination: departure airport (e.g. "Singapore (SIN)")
    const depCity = departureAirport.type === "city"
      ? departureAirport.name
      : departureAirport.city_name;
    setFieldValue("destination", `${depCity} (${departureAirport.code})`);

    // 3. DestinationData: set coordinates and detail fields based on departure airport
    const depCoords = departureAirport?.coordinates
      ? {
        latitude: departureAirport.coordinates.lat,
        longitude: departureAirport.coordinates.lon,
      }
      : null;
    const arrCoords = arrivalAirport?.coordinates
      ? {
        latitude: arrivalAirport.coordinates.lat,
        longitude: arrivalAirport.coordinates.lon,
      }
      : null;

    setFieldValue("destinationData", {
      id: departureAirport.id,
      coordinates: depCoords ? {
        latitude: depCoords.latitude,
        longitude: depCoords.longitude,
      } : undefined,
      departureCoordinates: depCoords,
      arrivalCoordinates: arrCoords,
    });

    const parsedDepartureDate =
      departureDate && departureDate instanceof Date
        ? (!isNaN(departureDate.getTime()) && departureDate.getTime() > 0 ? departureDate : null)
        : departureDate
          ? (() => {
            const d = new Date(departureDate);
            return !isNaN(d.getTime()) && d.getTime() > 0 ? d : null;
          })()
          : null;

    // 4. Start Date & Time
    if (parsedDepartureDate) {
      const year = parsedDepartureDate.getFullYear();
      const month = String(parsedDepartureDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDepartureDate.getDate()).padStart(2, '0');
      setFieldValue("startDate", `${year}-${month}-${day}`);

      const hours = String(parsedDepartureDate.getHours()).padStart(2, '0');
      const minutes = String(parsedDepartureDate.getMinutes()).padStart(2, '0');
      setFieldValue("startTime", `${hours}:${minutes}`);

      setFieldValue("flightDetails.departureDate", parsedDepartureDate);
    } else {
      setFieldValue("flightDetails.departureDate", null);
    }

    // 6. Description: Flight details prefill
    const depName = departureAirport.type === "city" && departureAirport.main_airport_name
      ? departureAirport.main_airport_name
      : departureAirport.name;
    const arrName = arrivalAirport.type === "city" && arrivalAirport.main_airport_name
      ? arrivalAirport.main_airport_name
      : arrivalAirport.name;
    setFieldValue(
      "description",
      `Flight from ${depName} (${departureAirport.code}) to ${arrName} (${arrivalAirport.code})`
    );

    // 7. Flight details nested properties
    setFieldValue("flightDetails.departureAirport", `${depName} (${departureAirport.code})`);
    setFieldValue("flightDetails.arrivalAirport", `${arrName} (${arrivalAirport.code})`);

    // 8. Prefill Arrival Date & Time only if departure date is set and coordinates are available
    if (parsedDepartureDate && departureAirport?.coordinates && arrivalAirport?.coordinates) {
      const lat1 = departureAirport.coordinates.lat;
      const lon1 = departureAirport.coordinates.lon;
      const lat2 = arrivalAirport.coordinates.lat;
      const lon2 = arrivalAirport.coordinates.lon;

      if (lat1 !== undefined && lon1 !== undefined && lat2 !== undefined && lon2 !== undefined) {
        const R = 6371; // km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Average commercial jet speed is ~800 km/h
        // Add 30 minutes (0.5 hours) for taxi, takeoff, and landing
        const durationHours = distance / 800 + 0.5;
        const arrivalDate = new Date(parsedDepartureDate.getTime() + durationHours * 60 * 60 * 1000);
        setFieldValue("flightDetails.arrivalDate", arrivalDate);

        // Prefill warning notice trigger
        setShowArrivalPrefillNotice(true);
        if (prefillNoticeTimerRef.current) {
          clearTimeout(prefillNoticeTimerRef.current);
        }
        prefillNoticeTimerRef.current = setTimeout(() => {
          setShowArrivalPrefillNotice(false);
        }, 6000); // 6 seconds
      }
    } else {
      setFieldValue("flightDetails.arrivalDate", null);
      setShowArrivalPrefillNotice(false);
      if (prefillNoticeTimerRef.current) {
        clearTimeout(prefillNoticeTimerRef.current);
      }
    }
  };

  const [showDestinationModal, setShowDestinationModal] =
    useState<boolean>(false);
  const [showAirportLookupFor, setShowAirportLookupFor] = useState<"departure" | "arrival" | null>(null);
  const [isAllDay, setIsAllDay] = useState<boolean>(true);
  const [showTimePickerFor, setShowTimePickerFor] = useState<"startTime" | "endTime" | null>(null);
  const [showCalendarFor, setShowCalendarFor] = useState<"startDate" | "endDate" | null>(null);
  const handleCloseCalendar = useCallback(() => setShowCalendarFor(null), []);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const [isChecklistFocused, setIsChecklistFocused] = useState<boolean>(false);
  const [showFlightDatePickerFor, setShowFlightDatePickerFor] = useState<"departureDate" | "arrivalDate" | null>(null);
  const [showAccomodationDatePickerFor, setShowAccomodationDatePickerFor] = useState<"checkinDateTime" | "checkoutDateTime" | null>(null);
  const [showTransportationDatePickerFor, setShowTransportationDatePickerFor] = useState<"departureDateTime" | "arrivalDateTime" | null>(null);
  const [showPreparationDeadlinePicker, setShowPreparationDeadlinePicker] = useState<boolean>(false);
  const [showRideRentalDatePickerFor, setShowRideRentalDatePickerFor] = useState<"rentalStartDateTime" | "rentalEndDateTime" | null>(null);
  const [showHikeOrCampDatePickerFor, setShowHikeOrCampDatePickerFor] = useState<"checkinDateTime" | "checkoutDateTime" | null>(null);
  const [showPoiModal, setShowPoiModal] = useState<boolean>(false);
  const [poiModalInitialCategory, setPoiModalInitialCategory] = useState<"accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp">("accommodation");
  const [poiTargetType, setPoiTargetType] = useState<string>("accommodation");
  const [showMapPinModal, setShowMapPinModal] = useState<boolean>(false);
  const [showGoogleSearchModal, setShowGoogleSearchModal] = useState<boolean>(false);
  const [googleSearchTarget, setGoogleSearchTarget] = useState<
    "title" | "operatorProvider" | "providerName" | "pickupLocation" | "dropoffLocation" | "location"
  >("title");

  const handleOpenGoogleSearch = useCallback((target: "title" | "operatorProvider" | "providerName" | "pickupLocation" | "dropoffLocation" | "location" = "title") => {
    setGoogleSearchTarget(target);
    setShowGoogleSearchModal(true);
  }, []);
  const [mapPinTargetField, setMapPinTargetField] = useState<string>("rideRentalDetails.pickupLocation");
  const [mapPinInitialValue, setMapPinInitialValue] = useState<string>("");
  const [mapPinInitialCoordinates, setMapPinInitialCoordinates] = useState<any>(null);
  const [showDestinationSheet, setShowDestinationSheet] = useState<boolean>(false);

  const handleOpenMapPinModal = (targetField: string, initialText?: string, initialCoords?: any) => {
    setMapPinTargetField(targetField);
    setMapPinInitialValue(initialText || "");
    setMapPinInitialCoordinates(initialCoords || null);
    setShowMapPinModal(true);
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const fieldRefs = useRef<{ [key: string]: any }>({});
  const [activeTabId, setActiveTabId] = useState<string>("details");
  const [showArrivalPrefillNotice, setShowArrivalPrefillNotice] = useState<boolean>(false);
  const prefillNoticeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const departureAirportCoordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const arrivalAirportCoordsRef = useRef<{ lat: number; lon: number } | null>(null);

  const triggerArrivalPrefillNotice = useCallback(() => {
    setShowArrivalPrefillNotice(true);
    if (prefillNoticeTimerRef.current) {
      clearTimeout(prefillNoticeTimerRef.current);
    }
    prefillNoticeTimerRef.current = setTimeout(() => {
      setShowArrivalPrefillNotice(false);
    }, 6000);
  }, []);

  const calculateEstimatedArrivalDate = useCallback(
    (
      depDate: Date | string | null,
      coords1?: { lat: number; lon: number } | null,
      coords2?: { lat: number; lon: number } | null,
      currentDestCoords?: { latitude: number; longitude: number }
    ) => {
      if (!depDate) return null;
      const parsedDepDate = depDate instanceof Date ? depDate : new Date(depDate);
      if (isNaN(parsedDepDate.getTime()) || parsedDepDate.getTime() <= 0) return null;

      const lat1 = coords1?.lat ?? departureAirportCoordsRef.current?.lat ?? currentDestCoords?.latitude;
      const lon1 = coords1?.lon ?? departureAirportCoordsRef.current?.lon ?? currentDestCoords?.longitude;
      const lat2 = coords2?.lat ?? arrivalAirportCoordsRef.current?.lat;
      const lon2 = coords2?.lon ?? arrivalAirportCoordsRef.current?.lon;

      if (lat1 !== undefined && lon1 !== undefined && lat2 !== undefined && lon2 !== undefined) {
        const R = 6371; // km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Average commercial jet speed is ~800 km/h
        // Add 30 minutes (0.5 hours) for taxi, takeoff, and landing
        const durationHours = distance / 800 + 0.5;
        return new Date(parsedDepDate.getTime() + durationHours * 60 * 60 * 1000);
      }
      // Fallback when coordinates are not available: add 2 hours
      return new Date(parsedDepDate.getTime() + 2 * 60 * 60 * 1000);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (prefillNoticeTimerRef.current) {
        clearTimeout(prefillNoticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const isAnyChildModalOpen = Boolean(
    showDestinationModal ||
    showCalendarFor !== null ||
    showTimePickerFor !== null ||
    showFlightDatePickerFor !== null ||
    showAccomodationDatePickerFor !== null ||
    showTransportationDatePickerFor !== null ||
    showRideRentalDatePickerFor !== null ||
    showPoiModal ||
    showMapPinModal ||
    showGoogleSearchModal ||
    showAirportLookupFor !== null ||
    showDestinationSheet
  );

  useEffect(() => {
    onChildModalToggle?.(isAnyChildModalOpen);
  }, [isAnyChildModalOpen, onChildModalToggle]);

  const updateMutation = useUpdateActivityMutation();
  const createSectionMutation = useUpdateSectionMutation();
  const { openFlightModal, openDescriptionModal, openSectionModal, closeSectionModal, openChecklistModal, setActiveTripViewTab, refetchTravelPlan } = useTravelContext();
  const { userToken } = useAuth();
  const { mutate: deleteActivityMutation, isPending } =
    useDeleteActivityMutation();
  const { generateSortOrder } = useLexicographicSort();

  useEffect(() => {
    onSubmittingChange?.(isPending || updateMutation.isPending);
  }, [isPending, updateMutation.isPending, onSubmittingChange]);

  const travelId = itineraryActivity?.travelId || propTravelId || "";
  const {
    data: travelPlan,
  } = useTravelPlan(travelId);
  const currentSection = travelPlan?.itinerarySection?.find(s => s.id === itinerarySectionId);
  const { confirm } = useConfirm();
  // Move useTheme to component top level (Rules of Hooks: must not be called inside callbacks)
  const { colors } = useTheme();

  const [createdSections, setCreatedSections] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const pickDocument = async (setFn: (field: string, value: any) => void, currentAttachments: Attachment[]) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments = result.assets.map((asset) => ({
          name: asset.name,
          url: asset.uri,
          size: asset.size,
          type: asset.mimeType,
        }));
        setFn("attachments", [...currentAttachments, ...newAttachments]);
      }
    } catch (err) {
      console.error("Error picking document:", err);
      showToast({ type: "error", message: "Failed to pick documents." });
    }
  };
  const activityId = itineraryActivity?.id;

  const pickImage = async (setFn: (field: string, value: any) => void, currentImages: Images[]) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera roll permission is needed to upload images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newImages = result.assets.map((a) => ({ title: "", url: a.uri }));
      setFn("images", [...currentImages, ...newImages]);
    }
  };

  const handleSaveActivity = async (
    values: ActivityFormValues,
  ) => {
    if (
      travelId
    ) {

      // Build proper Date objects from strings
      let finalStartDate: Date | undefined = undefined;
      if (values.type === TripPlanType.flight) {
        finalStartDate = values.flightDetails?.departureDate
          ? new Date(values.flightDetails.departureDate)
          : undefined;
      } else if (values.type === TripPlanType.stay) {
        finalStartDate = values.startDate
          ? new Date(`${values.startDate}T${values.startTime || "00:00"}:00`)
          : (values.accomodationDetails?.checkinDateTime
            ? new Date(values.accomodationDetails.checkinDateTime)
            : undefined);
      } else if (values.type === TripPlanType.transit) {
        finalStartDate = values.startDate
          ? new Date(`${values.startDate}T${values.startTime || "00:00"}:00`)
          : (values.transportationDetails?.departureDateTime
            ? new Date(values.transportationDetails.departureDateTime)
            : undefined);
      } else if (values.type === TripPlanType.rideRental) {
        finalStartDate = values.startDate
          ? new Date(`${values.startDate}T${values.startTime || "00:00"}:00`)
          : (values.rideRentalDetails?.rentalStartDateTime
            ? new Date(values.rideRentalDetails.rentalStartDateTime)
            : undefined);
      } else if (values.startDate) {
        const timePart = values.startTime && values.startTime.trim() ? values.startTime : "00:00";
        finalStartDate = new Date(`${values.startDate}T${timePart}:00`);
        if (isNaN(finalStartDate.getTime())) finalStartDate = undefined;
      }

      let finalEndDate: Date | undefined = undefined;
      if (values.type === TripPlanType.flight && values.flightDetails?.arrivalDate) {
        finalEndDate = new Date(values.flightDetails.arrivalDate);
      } else if (values.type === TripPlanType.stay) {
        finalEndDate = values.endDate
          ? new Date(`${values.endDate}T${values.endTime || "00:00"}:00`)
          : (values.accomodationDetails?.checkoutDateTime
            ? new Date(values.accomodationDetails.checkoutDateTime)
            : undefined);
      } else if (values.type === TripPlanType.transit) {
        finalEndDate = values.endDate
          ? new Date(`${values.endDate}T${values.endTime || "00:00"}:00`)
          : (values.transportationDetails?.arrivalDateTime
            ? new Date(values.transportationDetails.arrivalDateTime)
            : undefined);
      } else if (values.type === TripPlanType.rideRental) {
        finalEndDate = values.endDate
          ? new Date(`${values.endDate}T${values.endTime || "00:00"}:00`)
          : (values.rideRentalDetails?.rentalEndDateTime
            ? new Date(values.rideRentalDetails.rentalEndDateTime)
            : undefined);
      } else if (values.endDate) {
        const timePart = values.endTime && values.endTime.trim() ? values.endTime : "00:00";
        finalEndDate = new Date(`${values.endDate}T${timePart}:00`);
        if (isNaN(finalEndDate.getTime())) finalEndDate = undefined;
      }

      let finalSortOrder = values.sortOrder || "";

      const oldStartDate = itineraryActivity?.startDate ? new Date(itineraryActivity.startDate).getTime() : null;
      const newStartDate = finalStartDate ? finalStartDate.getTime() : null;
      const dateChanged = oldStartDate !== newStartDate;

      // If creating a new activity, or if the user changed the date/time, generate a new sortOrder
      if (!itineraryActivity?.id || dateChanged) {
        const currentSection = travelPlan?.itinerarySection?.find(s => s.id?.toString() === (values.sectionId || "").toString());
        // Filter out the current activity so it doesn't compare against itself when editing
        const existingActivities = [...(currentSection?.itineraryActivity || [])].filter(a => a.id !== itineraryActivity?.id);

        if (finalStartDate) {
          // Sort ALL activities: timed activities chronologically first, then untimed activities by sortOrder
          const sortedActivities = [...existingActivities].sort((a, b) => {
            if (a.startDate && b.startDate) {
              const timeA = new Date(a.startDate).getTime();
              const timeB = new Date(b.startDate).getTime();
              if (timeA === timeB) {
                return (a.sortOrder || "").localeCompare(b.sortOrder || "");
              }
              return timeA - timeB;
            }
            if (a.startDate) return -1;
            if (b.startDate) return 1;
            return (a.sortOrder || "").localeCompare(b.sortOrder || "");
          });

          // Find where this new activity belongs
          const nextNeighborIndex = sortedActivities.findIndex(a => {
            if (!a.startDate) return true; // untimed activities come after our timed activity
            return new Date(a.startDate).getTime() > finalStartDate!.getTime();
          });

          let prevNeighbor = null;
          let nextNeighbor = null;

          if (nextNeighborIndex !== -1) {
            nextNeighbor = sortedActivities[nextNeighborIndex];
            prevNeighbor = nextNeighborIndex > 0 ? sortedActivities[nextNeighborIndex - 1] : null;
          } else {
            prevNeighbor = sortedActivities.length > 0 ? sortedActivities[sortedActivities.length - 1] : null;
          }

          finalSortOrder = generateSortOrder(prevNeighbor?.sortOrder, nextNeighbor?.sortOrder);
        } else {
          // No start date: append to the very end of the section
          const sortedActivities = [...existingActivities].sort((a, b) => (a.sortOrder || "").localeCompare(b.sortOrder || ""));
          const lastActivity = sortedActivities.length > 0 ? sortedActivities[sortedActivities.length - 1] : null;

          finalSortOrder = generateSortOrder(lastActivity?.sortOrder, null);
        }
      }

      const payload: ItineraryActivity = {
        id: values.id,
        sectionId: values.sectionId || "",
        title: values.title,
        description: values.description,
        sortOrder: finalSortOrder,
        type: values.type as TripPlanType,
        planType: (values.type === TripPlanType.activity || values.type === TripPlanType.activity) ? (values.planType ?? null) : null,
        website: (values.type === TripPlanType.activity || values.type === TripPlanType.activity) ? (values.website || null) : null,
        bookingReference: (values.type === TripPlanType.activity || values.type === TripPlanType.activity) ? (values.bookingReference || null) : null,
        contactName: (values.type === TripPlanType.activity || values.type === TripPlanType.activity) ? (values.contactName || null) : null,
        contactNumber: (values.type === TripPlanType.activity || values.type === TripPlanType.activity) ? (values.contactNumber || null) : null,
        contactEmail: (values.type === TripPlanType.activity || values.type === TripPlanType.activity) ? (values.contactEmail || null) : null,
        priority: (values.type === TripPlanType.activity || values.type === TripPlanType.activity) ? (values.priority || null) : null,
        budget: values.budget || undefined,
        startDate: finalStartDate,
        endDate: finalEndDate,
        destination: values.destination,
        destinationData: values.type === TripPlanType.flight && (departureAirportCoordsRef.current || arrivalAirportCoordsRef.current)
          ? {
            ...(values.destinationData || {}),
            departureCoordinates: departureAirportCoordsRef.current
              ? { latitude: departureAirportCoordsRef.current.lat, longitude: departureAirportCoordsRef.current.lon }
              : (values.destinationData as any)?.departureCoordinates,
            arrivalCoordinates: arrivalAirportCoordsRef.current
              ? { latitude: arrivalAirportCoordsRef.current.lat, longitude: arrivalAirportCoordsRef.current.lon }
              : (values.destinationData as any)?.arrivalCoordinates,
          }
          : (values.type === TripPlanType.transit || values.type === TripPlanType.rideRental)
            ? (() => {
              const isTransit = values.type === TripPlanType.transit;
              const pickLoc = isTransit
                ? (values.transportationDetails?.pickupLocation && typeof values.transportationDetails.pickupLocation === "object"
                  ? values.transportationDetails.pickupLocation
                  : (values.destinationData as any)?.pickupLocation || null)
                : (values.rideRentalDetails?.pickupLocation && typeof values.rideRentalDetails.pickupLocation === "object"
                  ? values.rideRentalDetails.pickupLocation
                  : (values.destinationData as any)?.pickupLocation || null);

              const dropLoc = isTransit
                ? (values.transportationDetails?.dropoffLocation && typeof values.transportationDetails.dropoffLocation === "object"
                  ? values.transportationDetails.dropoffLocation
                  : (values.destinationData as any)?.dropoffLocation || null)
                : (values.rideRentalDetails?.dropoffLocation && typeof values.rideRentalDetails.dropoffLocation === "object"
                  ? values.rideRentalDetails.dropoffLocation
                  : (values.destinationData as any)?.dropoffLocation || null);

              const existingDestData = (values.destinationData || {}) as any;
              const primaryLoc = dropLoc || pickLoc;

              return {
                ...existingDestData,
                id: existingDestData.id || primaryLoc?.id || primaryLoc?.placeId || undefined,
                name: existingDestData.name || primaryLoc?.name || undefined,
                city: existingDestData.city || primaryLoc?.city || undefined,
                country: existingDestData.country || primaryLoc?.country || undefined,
                regionOrState: existingDestData.regionOrState || primaryLoc?.regionOrState || undefined,
                address: existingDestData.address || primaryLoc?.address || undefined,
                placeId: existingDestData.placeId || primaryLoc?.placeId || undefined,
                coordinates: (existingDestData.coordinates?.latitude && existingDestData.coordinates?.latitude !== 0)
                  ? existingDestData.coordinates
                  : (primaryLoc?.coordinates || { latitude: 0, longitude: 0 }),
                pickupCoordinates: pickLoc?.coordinates || existingDestData.pickupCoordinates || null,
                dropoffCoordinates: dropLoc?.coordinates || existingDestData.dropoffCoordinates || null,
                pickupLocation: pickLoc,
                dropoffLocation: dropLoc,
              };
            })()
            : values.destinationData,
        customTags: values.customTags || [],
        images: values.images,
        isOffline: true,
        travelId: values.travelId,
        attachments: values.attachments,
        flightDetails: values.type === TripPlanType.flight && values.flightDetails
          ? {
            departureAirport: values.flightDetails.departureAirport,
            arrivalAirport: values.flightDetails.arrivalAirport,
            departureDate: values.flightDetails.departureDate && new Date(values.flightDetails.departureDate).getTime() > 0
              ? new Date(values.flightDetails.departureDate)
              : null,
            arrivalDate: values.flightDetails.arrivalDate && new Date(values.flightDetails.arrivalDate).getTime() > 0
              ? new Date(values.flightDetails.arrivalDate)
              : null,
            flightNumber: values.flightDetails.flightNumber || null,
            airline: values.flightDetails.airline || null,
            gate: values.flightDetails.gate || null,
            terminal: values.flightDetails.terminal || null,
            seatNumber: values.flightDetails.seatNumber || null,
            bookingReference: values.flightDetails.bookingReference || null,
            price: values.flightDetails.price != null && values.flightDetails.price !== "" ? Number(values.flightDetails.price) : null,
          }
          : null,
        accomodationDetails: values.type === TripPlanType.stay && values.accomodationDetails
          ? {
            accomodationName: values.accomodationDetails.accomodationName || values.title || "",
            address: values.accomodationDetails.address || values.destination || null,
            destinationAddressData: values.accomodationDetails.destinationAddressData ?? (values.destinationData || null),
            subType: values.accomodationDetails.subType || null,
            checkinDateTime: finalStartDate
              ? finalStartDate
              : (values.accomodationDetails.checkinDateTime && new Date(values.accomodationDetails.checkinDateTime).getTime() > 0
                ? new Date(values.accomodationDetails.checkinDateTime)
                : null),
            checkoutDateTime: finalEndDate
              ? finalEndDate
              : (values.accomodationDetails.checkoutDateTime && new Date(values.accomodationDetails.checkoutDateTime).getTime() > 0
                ? new Date(values.accomodationDetails.checkoutDateTime)
                : null),
            websiteAddress: values.accomodationDetails.websiteAddress || null,
            bookingReference: values.accomodationDetails.bookingReference || null,
            bookingStatus: values.accomodationDetails.bookingStatus || null,
            contactNumber: values.accomodationDetails.contactNumber || null,
            emailAddress: values.accomodationDetails.emailAddress || null,
            contactName: values.accomodationDetails.contactName || null,
          }
          : null,

        transportationDetails: values.type === TripPlanType.transit && values.transportationDetails
          ? {
            mode: values.transportationDetails.mode || null,
            operatorProvider: values.transportationDetails.operatorProvider || null,
            pickupLocation: values.transportationDetails.pickupLocation
              ? (typeof values.transportationDetails.pickupLocation === "string"
                ? values.transportationDetails.pickupLocation
                : values.transportationDetails.pickupLocation.name || values.transportationDetails.pickupLocation.address || values.transportationDetails.pickupLocation.city || "")
              : null,
            dropoffLocation: values.transportationDetails.dropoffLocation
              ? (typeof values.transportationDetails.dropoffLocation === "string"
                ? values.transportationDetails.dropoffLocation
                : values.transportationDetails.dropoffLocation.name || values.transportationDetails.dropoffLocation.address || values.transportationDetails.dropoffLocation.city || "")
              : null,
            departureDateTime: finalStartDate
              ? finalStartDate
              : (values.transportationDetails.departureDateTime && new Date(values.transportationDetails.departureDateTime).getTime() > 0
                ? new Date(values.transportationDetails.departureDateTime)
                : null),
            arrivalDateTime: finalEndDate
              ? finalEndDate
              : (values.transportationDetails.arrivalDateTime && new Date(values.transportationDetails.arrivalDateTime).getTime() > 0
                ? new Date(values.transportationDetails.arrivalDateTime)
                : null),
            seatOrVehicleNumber: values.transportationDetails.seatOrVehicleNumber || null,
            bookingReference: values.transportationDetails.bookingReference || null,
            bookingStatus: values.transportationDetails.bookingStatus || null,
            websiteAddress: values.transportationDetails.websiteAddress || null,
            contactNumber: values.transportationDetails.contactNumber || null,
            notes: values.transportationDetails.notes || null,
          }
          : null,
        rideRentalDetails: values.type === TripPlanType.rideRental && values.rideRentalDetails
          ? {
            providerName: values.title || "",
            vehicleType: values.rideRentalDetails.vehicleType || null,
            vehicleModel: values.rideRentalDetails.vehicleModel || null,
            pickupLocation: values.rideRentalDetails.pickupLocation
              ? (typeof values.rideRentalDetails.pickupLocation === "string"
                ? values.rideRentalDetails.pickupLocation
                : values.rideRentalDetails.pickupLocation.name || values.rideRentalDetails.pickupLocation.address || values.rideRentalDetails.pickupLocation.city || "")
              : null,
            dropoffLocation: values.rideRentalDetails.dropoffLocation
              ? (typeof values.rideRentalDetails.dropoffLocation === "string"
                ? values.rideRentalDetails.dropoffLocation
                : values.rideRentalDetails.dropoffLocation.name || values.rideRentalDetails.dropoffLocation.address || values.rideRentalDetails.dropoffLocation.city || "")
              : null,
            rentalStartDateTime: finalStartDate || (values.rideRentalDetails.rentalStartDateTime && new Date(values.rideRentalDetails.rentalStartDateTime).getTime() > 0
              ? new Date(values.rideRentalDetails.rentalStartDateTime)
              : null),
            rentalEndDateTime: finalEndDate || (values.rideRentalDetails.rentalEndDateTime && new Date(values.rideRentalDetails.rentalEndDateTime).getTime() > 0
              ? new Date(values.rideRentalDetails.rentalEndDateTime)
              : null),
            bookingReference: values.rideRentalDetails.bookingReference || null,
            bookingStatus: values.rideRentalDetails.bookingStatus || null,
            websiteAddress: values.rideRentalDetails.websiteAddress || null,
            contactName: values.rideRentalDetails.contactName || null,
            contactNumber: values.rideRentalDetails.contactNumber || null,
            emailAddress: values.rideRentalDetails.emailAddress || null,
            notes: values.rideRentalDetails.notes || null,
          }
          : null,
      };

      const result = await updateMutation.mutateAsync(payload);

      refetchTravelPlan();
      const savedId = result?.data?.id || (result as any)?.id;

      showToast({
        type: "success",
        message: values.id ? "Activity updated successfully!" : "Activity created successfully!",
      });

      if (!values.id && savedId) {
        try {
          let fullActivity: ItineraryActivity | null = (result?.data || (result as any)) as ItineraryActivity;
          const isLocal = isNaN(Number(savedId));
          if (isLocal) {
            const localActivity = await fetchLocalItineraryActivity(savedId);
            if (localActivity) fullActivity = localActivity as ItineraryActivity;
          }
          if (fullActivity && fullActivity.id) {
            onSaveSuccess?.(fullActivity);
          } else {
            onClose();
          }
        } catch (err) {
          console.error("Failed to transition to edit mode:", err);
          onClose();
        }
      } else {
        onClose();
      }
    }
  };

  const handleDeleteActivity = async (activityId: string, sectionId?: string) => {
    const targetSectionId = sectionId || itineraryActivity?.sectionId || itinerarySectionId;
    if (targetSectionId && activityId) {
      const isConfirmed = await confirm({
        title: "Delete Activity",
        message: "Are you sure you want to delete this activity? All associated expenses, notes, and checklist items will also be permanently deleted. This action is irreversible.",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger",
      });

      if (isConfirmed) {
        deleteActivityMutation(
          {
            sectionId: targetSectionId,
            activityId: activityId,
            travelId: travelId,
          },
          {
            onSuccess: () => {
              refetchTravelPlan();
              showToast({ type: "success", message: "Activity deleted successfully" });
              setActiveTripViewTab("itinerary");
              onClose();
            },
            onError: () => {
              onClose();
            },
          }
        );
      }
    }
  };

  const handleAddActivity = (values: any) => {
    onSwitchToAddMode?.();
  };

  const initialValues: ActivityFormValues = {
    travelId: travelId,
    sectionId: itinerarySectionId || (travelPlan?.itinerarySection?.[0]?.id || ""),
    id: itineraryActivity?.id,
    title: itineraryActivity?.title || "",
    description: itineraryActivity?.description || "",
    type: itineraryActivity?.type ?? initialType ?? TripPlanType.activity,
    planType: itineraryActivity?.planType ?? null,
    sortOrder: itineraryActivity?.sortOrder || "",
    startDate: itineraryActivity?.startDate
      ? toLocalDateStr(itineraryActivity.startDate)
      : (itineraryActivity?.accomodationDetails?.checkinDateTime
        ? toLocalDateStr(itineraryActivity.accomodationDetails.checkinDateTime)
        : (itineraryActivity?.transportationDetails?.departureDateTime
          ? toLocalDateStr(itineraryActivity.transportationDetails.departureDateTime)
          : (itineraryActivity?.rideRentalDetails?.rentalStartDateTime
            ? toLocalDateStr(itineraryActivity.rideRentalDetails.rentalStartDateTime)
            : (currentSection?.startDate ? toLocalDateStr(currentSection.startDate) : null)))),
    startTime: itineraryActivity?.startDate && String(itineraryActivity.startDate).includes('T')
      ? toLocalTimeStr(itineraryActivity.startDate)
      : (itineraryActivity?.accomodationDetails?.checkinDateTime && String(itineraryActivity.accomodationDetails.checkinDateTime).includes('T')
        ? toLocalTimeStr(itineraryActivity.accomodationDetails.checkinDateTime)
        : (itineraryActivity?.transportationDetails?.departureDateTime && String(itineraryActivity.transportationDetails.departureDateTime).includes('T')
          ? toLocalTimeStr(itineraryActivity.transportationDetails.departureDateTime)
          : (itineraryActivity?.rideRentalDetails?.rentalStartDateTime && String(itineraryActivity.rideRentalDetails.rentalStartDateTime).includes('T')
            ? toLocalTimeStr(itineraryActivity.rideRentalDetails.rentalStartDateTime)
            : (currentSection?.startDate ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : "")))),
    endDate: itineraryActivity?.endDate
      ? toLocalDateStr(itineraryActivity.endDate)
      : (itineraryActivity?.accomodationDetails?.checkoutDateTime
        ? toLocalDateStr(itineraryActivity.accomodationDetails.checkoutDateTime)
        : (itineraryActivity?.transportationDetails?.arrivalDateTime
          ? toLocalDateStr(itineraryActivity.transportationDetails.arrivalDateTime)
          : (itineraryActivity?.rideRentalDetails?.rentalEndDateTime
            ? toLocalDateStr(itineraryActivity.rideRentalDetails.rentalEndDateTime)
            : null))),
    endTime: itineraryActivity?.endDate && String(itineraryActivity.endDate).includes('T')
      ? toLocalTimeStr(itineraryActivity.endDate)
      : (itineraryActivity?.accomodationDetails?.checkoutDateTime && String(itineraryActivity.accomodationDetails.checkoutDateTime).includes('T')
        ? toLocalTimeStr(itineraryActivity.accomodationDetails.checkoutDateTime)
        : (itineraryActivity?.transportationDetails?.arrivalDateTime && String(itineraryActivity.transportationDetails.arrivalDateTime).includes('T')
          ? toLocalTimeStr(itineraryActivity.transportationDetails.arrivalDateTime)
          : (itineraryActivity?.rideRentalDetails?.rentalEndDateTime && String(itineraryActivity.rideRentalDetails.rentalEndDateTime).includes('T')
            ? toLocalTimeStr(itineraryActivity.rideRentalDetails.rentalEndDateTime)
            : "09:00"))),
    destination: itineraryActivity?.destination || "",
    destinationData: itineraryActivity?.destinationData || undefined,
    customTags: itineraryActivity?.customTags || [],
    budget: itineraryActivity?.budget || "",
    website: itineraryActivity?.website || "",
    bookingReference: itineraryActivity?.bookingReference || "",
    contactName: itineraryActivity?.contactName || "",
    contactNumber: itineraryActivity?.contactNumber || "",
    contactEmail: itineraryActivity?.contactEmail || "",
    priority: itineraryActivity?.priority || null,
    images: itineraryActivity?.images || [],
    attachments: itineraryActivity?.attachments || [],
    flightDetails: {
      departureAirport: itineraryActivity?.flightDetails?.departureAirport || "",
      arrivalAirport: itineraryActivity?.flightDetails?.arrivalAirport || "",
      departureDate: (itineraryActivity?.flightDetails?.departureDate && new Date(itineraryActivity.flightDetails.departureDate).getTime() > 0)
        ? new Date(itineraryActivity.flightDetails.departureDate)
        : null,
      arrivalDate: (itineraryActivity?.flightDetails?.arrivalDate && new Date(itineraryActivity.flightDetails.arrivalDate).getTime() > 0)
        ? new Date(itineraryActivity.flightDetails.arrivalDate)
        : null,
      flightNumber: itineraryActivity?.flightDetails?.flightNumber || "",
      airline: itineraryActivity?.flightDetails?.airline || "",
      gate: itineraryActivity?.flightDetails?.gate || "",
      terminal: itineraryActivity?.flightDetails?.terminal || "",
      seatNumber: itineraryActivity?.flightDetails?.seatNumber || "",
      bookingReference: itineraryActivity?.flightDetails?.bookingReference || "",
      price: itineraryActivity?.flightDetails?.price != null ? String(itineraryActivity.flightDetails.price) : "",
    },
    accomodationDetails: {
      accomodationName: (itineraryActivity?.accomodationDetails?.accomodationName || "").trim() !== ""
        ? itineraryActivity.accomodationDetails.accomodationName
        : (itineraryActivity?.type === TripPlanType.stay ? itineraryActivity?.title || "" : ""),
      address: (itineraryActivity?.accomodationDetails?.address || "").trim() !== ""
        ? itineraryActivity.accomodationDetails.address
        : (itineraryActivity?.type === TripPlanType.stay ? itineraryActivity?.destination || "" : ""),
      destinationAddressData: itineraryActivity?.accomodationDetails?.destinationAddressData ?? null,
      subType: itineraryActivity?.accomodationDetails?.subType || null,
      checkinDateTime: itineraryActivity?.accomodationDetails?.checkinDateTime && new Date(itineraryActivity.accomodationDetails.checkinDateTime).getTime() > 0
        ? new Date(itineraryActivity.accomodationDetails.checkinDateTime)
        : null,
      checkoutDateTime: itineraryActivity?.accomodationDetails?.checkoutDateTime && new Date(itineraryActivity.accomodationDetails.checkoutDateTime).getTime() > 0
        ? new Date(itineraryActivity.accomodationDetails.checkoutDateTime)
        : null,
      websiteAddress: itineraryActivity?.accomodationDetails?.websiteAddress || "",
      bookingReference: itineraryActivity?.accomodationDetails?.bookingReference || "",
      bookingStatus: itineraryActivity?.accomodationDetails?.bookingStatus || "",
      contactNumber: itineraryActivity?.accomodationDetails?.contactNumber || "",
      emailAddress: itineraryActivity?.accomodationDetails?.emailAddress || "",
      contactName: itineraryActivity?.accomodationDetails?.contactName || "",
    },
    transportationDetails: {
      mode: itineraryActivity?.transportationDetails?.mode || null,
      operatorProvider: itineraryActivity?.transportationDetails?.operatorProvider || "",
      pickupLocation: (() => {
        const destPick = (itineraryActivity?.destinationData as any)?.pickupLocation;
        if (destPick && typeof destPick === "object" && destPick.name) {
          return destPick as DestinationDto;
        }
        const transPick = itineraryActivity?.transportationDetails?.pickupLocation;
        if (transPick && typeof transPick === "object") {
          return transPick as DestinationDto;
        }
        if (typeof transPick === "string" && transPick.trim()) {
          try {
            const parsed = JSON.parse(transPick);
            if (parsed && typeof parsed === "object" && parsed.name) return parsed as DestinationDto;
          } catch { }
          return {
            id: "",
            name: transPick,
            city: transPick,
            coordinates: (itineraryActivity?.destinationData as any)?.pickupCoordinates || { latitude: 0, longitude: 0 },
          } as DestinationDto;
        }
        return (destPick as DestinationDto) || null;
      })(),
      dropoffLocation: (() => {
        const destDrop = (itineraryActivity?.destinationData as any)?.dropoffLocation;
        if (destDrop && typeof destDrop === "object" && destDrop.name) {
          return destDrop as DestinationDto;
        }
        const transDrop = itineraryActivity?.transportationDetails?.dropoffLocation;
        if (transDrop && typeof transDrop === "object") {
          return transDrop as DestinationDto;
        }
        if (typeof transDrop === "string" && transDrop.trim()) {
          try {
            const parsed = JSON.parse(transDrop);
            if (parsed && typeof parsed === "object" && parsed.name) return parsed as DestinationDto;
          } catch { }
          return {
            id: "",
            name: transDrop,
            city: transDrop,
            coordinates: (itineraryActivity?.destinationData as any)?.dropoffCoordinates || { latitude: 0, longitude: 0 },
          } as DestinationDto;
        }
        return (destDrop as DestinationDto) || null;
      })(),
      departureDateTime: itineraryActivity?.transportationDetails?.departureDateTime
        ? new Date(itineraryActivity.transportationDetails.departureDateTime)
        : null,
      arrivalDateTime: itineraryActivity?.transportationDetails?.arrivalDateTime
        ? new Date(itineraryActivity.transportationDetails.arrivalDateTime)
        : null,
      seatOrVehicleNumber: itineraryActivity?.transportationDetails?.seatOrVehicleNumber || "",
      bookingReference: itineraryActivity?.transportationDetails?.bookingReference || "",
      bookingStatus: itineraryActivity?.transportationDetails?.bookingStatus || "",
      websiteAddress: itineraryActivity?.transportationDetails?.websiteAddress || "",
      contactNumber: itineraryActivity?.transportationDetails?.contactNumber || "",
      notes: itineraryActivity?.transportationDetails?.notes || "",
    },
    rideRentalDetails: {
      vehicleType: itineraryActivity?.rideRentalDetails?.vehicleType || null,
      vehicleModel: itineraryActivity?.rideRentalDetails?.vehicleModel || "",
      pickupLocation: (() => {
        const destPick = (itineraryActivity?.destinationData as any)?.pickupLocation;
        if (destPick && typeof destPick === "object" && destPick.name) {
          return destPick as DestinationDto;
        }
        const ridePick = itineraryActivity?.rideRentalDetails?.pickupLocation;
        if (ridePick && typeof ridePick === "object") {
          return ridePick as DestinationDto;
        }
        if (typeof ridePick === "string" && ridePick.trim()) {
          try {
            const parsed = JSON.parse(ridePick);
            if (parsed && typeof parsed === "object" && parsed.name) return parsed as DestinationDto;
          } catch { }
          return {
            id: "",
            name: ridePick,
            city: ridePick,
            coordinates: (itineraryActivity?.destinationData as any)?.pickupCoordinates || { latitude: 0, longitude: 0 },
          } as DestinationDto;
        }
        return (destPick as DestinationDto) || null;
      })(),
      dropoffLocation: (() => {
        const destDrop = (itineraryActivity?.destinationData as any)?.dropoffLocation;
        if (destDrop && typeof destDrop === "object" && destDrop.name) {
          return destDrop as DestinationDto;
        }
        const rideDrop = itineraryActivity?.rideRentalDetails?.dropoffLocation;
        if (rideDrop && typeof rideDrop === "object") {
          return rideDrop as DestinationDto;
        }
        if (typeof rideDrop === "string" && rideDrop.trim()) {
          try {
            const parsed = JSON.parse(rideDrop);
            if (parsed && typeof parsed === "object" && parsed.name) return parsed as DestinationDto;
          } catch { }
          return {
            id: "",
            name: rideDrop,
            city: rideDrop,
            coordinates: (itineraryActivity?.destinationData as any)?.dropoffCoordinates || { latitude: 0, longitude: 0 },
          } as DestinationDto;
        }
        return (destDrop as DestinationDto) || null;
      })(),
      rentalStartDateTime: itineraryActivity?.rideRentalDetails?.rentalStartDateTime
        ? new Date(itineraryActivity.rideRentalDetails.rentalStartDateTime)
        : null,
      rentalEndDateTime: itineraryActivity?.rideRentalDetails?.rentalEndDateTime
        ? new Date(itineraryActivity.rideRentalDetails.rentalEndDateTime)
        : null,
      bookingReference: itineraryActivity?.rideRentalDetails?.bookingReference || "",
      bookingStatus: itineraryActivity?.rideRentalDetails?.bookingStatus || "",
      websiteAddress: itineraryActivity?.rideRentalDetails?.websiteAddress || "",
      contactName: itineraryActivity?.rideRentalDetails?.contactName || "",
      contactNumber: itineraryActivity?.rideRentalDetails?.contactNumber || "",
      emailAddress: itineraryActivity?.rideRentalDetails?.emailAddress || "",
      notes: itineraryActivity?.rideRentalDetails?.notes || "",
    },
  };

  const memoizedInitialValues = useMemo<ActivityFormValues>(() => initialValues, [
    itineraryActivity?.id,
    itineraryActivity?.updatedAt,
    itineraryActivity?.type,
    itineraryActivity?.planType,
    itineraryActivity?.budget,
    itineraryActivity?.website,
    itineraryActivity?.bookingReference,
    itineraryActivity?.contactName,
    itineraryActivity?.contactNumber,
    itineraryActivity?.contactEmail,
    itineraryActivity?.priority,
    itineraryActivity?.flightDetails,
    itineraryActivity?.accomodationDetails,
    itineraryActivity?.transportationDetails,
    itineraryActivity?.rideRentalDetails,
    itineraryActivity,
    itinerarySectionId,
    travelId,
    travelPlan?.itinerarySection?.[0]?.id,
    currentSection?.startDate,
    initialType,
  ]);

  return (
    <Formik<ActivityFormValues>
      key={itineraryActivity?.id ? `${itineraryActivity.id}-${itineraryActivity.type}-${itineraryActivity.updatedAt || ''}` : `new-activity-${itineraryActivity?.title || ''}-${itineraryActivity?.destination || ''}-${itineraryActivity?.type || ''}`}
      enableReinitialize={true}
      initialValues={memoizedInitialValues}
      validationSchema={TravelSchema}
      onSubmit={handleSaveActivity}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        values,
        errors,
        touched,
        setValues,
        setFieldValue,
        submitCount,
      }) => {
        if (onSubmitRef) {
          onSubmitRef.current = handleSubmit;
        }
        const sections = travelPlan?.itinerarySection || [];
        const hasSections = sections.length > 0;
        const selectedSection = sections.find((s) => s.id?.toString() === values.sectionId?.toString());
        const selectedSectionName = selectedSection
          ? (selectedSection.isDefaultSection ? "[Ungroup]" : selectedSection.title || "")
          : (values.sectionId ? createdSections[values.sectionId] || "" : "");
        const activityColor = activityIcons.find((icon) => icon.activityType === values.type || icon.name === values.type)?.color || colors.primary || "#263F69";
        const rawDestData =
          values.destinationData ??
          (values as any).destination_data ??
          (values as any).destination_date;
        const destData =
          typeof rawDestData === "string"
            ? safeJsonParse<any>(rawDestData, null)
            : rawDestData;
        const destinationAddress =
          values.destination || destData?.address || (values as any).address || "";
        const placeTitle =
          destData?.name ||
          destData?.placeName ||
          destData?.title ||
          (destData && values.title ? values.title : "");
        const destCoords =
          values.destinationData?.coordinates ||
          destData?.coordinates ||
          (typeof destData?.latitude === "number" && typeof destData?.longitude === "number"
            ? { latitude: destData.latitude, longitude: destData.longitude }
            : undefined);
        const hasLocation = Boolean(placeTitle || destinationAddress || destData);
        const shouldShowDestinationButton =
          hasLocation ||
          values.type === TripPlanType.activity ||
          values.type === TripPlanType.stay ||
          values.type === TripPlanType.rideRental ||
          values.type === TripPlanType.transit;

        const handleAddNewSection = () => {
          openSectionModal(null, travelId, (newSection) => {
            if (newSection?.id) {
              setCreatedSections(prev => ({
                ...prev,
                [newSection.id!]: newSection.title || ""
              }));
              setFieldValue("sectionId", newSection.id);
              if (newSection.startDate) {
                setFieldValue("startDate", toLocalDateStr(newSection.startDate));
                if (!values.startTime) {
                  setFieldValue("startTime", `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`);
                }
              }
            }
            closeSectionModal();
          });
        };

        return (
          <View className="flex-1 bg-gray-100 overflow-hidden">
            <StatusBar barStyle={"dark-content"} />
            <FormikErrorScroller
              scrollViewRef={scrollViewRef}
              fieldRefs={fieldRefs}
              activeTabId={activeTabId}
              setActiveTabId={setActiveTabId}
            />
            <FormikDirtyListener onDirtyChange={onDirtyChange} />

            <ScrollView
              ref={scrollViewRef}
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 100 }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="px-5 py-3">
                {/* Title */}
                <View ref={(el) => { fieldRefs.current["title"] = el; }} className="mt-md mb-8">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-lg text-secondary/80 font-semibold">
                      {values.type === TripPlanType.activity ? "Plan Name" : values.type === TripPlanType.stay ? "Stay or Accomodation Name" : values.type === TripPlanType.transit ? "Transit Name" : values.type === TripPlanType.rideRental ? "Rental Name" : "Activity Name"} <Text className="text-red-500 text-lg">*</Text>
                    </Text>

                    <Text className="text-xs" style={{ color: '#98A2B3' }}>
                      {(values.title || "").length}/40
                    </Text>
                  </View>
                  <View className="relative justify-center">
                    <TextInput
                      mode="outlined"
                      placeholder={values.type === TripPlanType.stay ? "e.g. Grand Hotel" : values.type === TripPlanType.transit ? "e.g. Train to Kyoto" : values.type === TripPlanType.rideRental ? "e.g. Hertz Car Rental" : "e.g. Museum Visit"}
                      value={values.title}
                      onChangeText={(text) => {
                        handleChange("title")(text);
                        if (values.type === TripPlanType.stay && (!values.accomodationDetails?.accomodationName || values.accomodationDetails.accomodationName === values.title)) {
                          setFieldValue("accomodationDetails.accomodationName", text);
                        }
                      }}
                      onBlur={handleBlur("title")}
                      error={(touched.title || submitCount > 0) && Boolean(errors.title)}
                      outlineColor="#E0E0E0"
                      activeOutlineColor="#263F69"
                      theme={{ colors: { onSurfaceVariant: '#98A2B3' } }}
                      outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                      style={{ marginTop: 2, height: 64 }}
                      contentStyle={{
                        backgroundColor: "transparent",
                        paddingRight: (values.type === TripPlanType.activity || values.type === TripPlanType.stay || values.type === TripPlanType.transit || values.type === TripPlanType.rideRental)
                          ? (values.title ? 95 : 55)
                          : 16,
                      }}
                      maxLength={40}
                    />
                    {(values.type === TripPlanType.activity || values.type === TripPlanType.stay || values.type === TripPlanType.transit || values.type === TripPlanType.rideRental) ? (
                      <View className="absolute right-3 flex-row items-center gap-1">
                        {Boolean(values.title) && (
                          <TouchableOpacity
                            onPress={() => {
                              setFieldValue("title", "");
                              if (values.type === TripPlanType.stay && values.accomodationDetails?.accomodationName === values.title) {
                                setFieldValue("accomodationDetails.accomodationName", "");
                              }
                            }}
                            className="p-2"
                            accessibilityRole="button"
                            accessibilityLabel="Clear activity title"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Icon name="close" size={20} color="#98A2B3" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => handleOpenGoogleSearch("title")}
                          className="w-10 h-10 items-center justify-center"
                          accessibilityRole="button"
                          accessibilityLabel="Lookup location on Google map"
                          activeOpacity={0.7}
                        >
                          <Icon name="pin-drop" size={22} color={activityColor} />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                  {(touched.title || submitCount > 0) && errors.title && (
                    <View className="flex flex-row items-center mt-1">
                      <Icon name="info-outline" size={14} color="#fb2c36" />
                      <Text className="text-red-500 text-xs ml-1" >{errors.title}</Text>
                    </View>
                  )}

                  {/* <Text className="text-sm text-tertiary p-sm">
                      You may give your Plan a custom name to help you stay organized.
                    </Text> */}

                  {/* Tertiary Button for Destination Details */}
                  {shouldShowDestinationButton && (placeTitle || destinationAddress) && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={
                        hasLocation
                          ? `View destination details: ${placeTitle || destinationAddress}`
                          : "View destination details"
                      }
                      onPress={() => setShowDestinationSheet(true)}
                      className="flex-row items-center self-start mt-2.5 py-1 px-1 gap-1.5 opacity-60"
                    >
                      <Ionicons name="location-outline" size={17} color={activityColor} />
                      <Text className="text-base font-semibold text-secondary/80">
                        Place Details
                      </Text>
                      <Text
                        className={`text-base  max-w-[200px] ${hasLocation ? "text-secondary/80" : "text-secondary/50"
                          }`}
                        ellipsizeMode="tail"
                        numberOfLines={1}
                      >
                        {placeTitle || destinationAddress || ""}
                      </Text>
                      <Ionicons name="chevron-forward" size={15} color="#98A2B3" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Plan Details */}
                {values.type === TripPlanType.activity && (
                  <PlanTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressLocationMap={() => handleOpenGoogleSearch("location")}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => {
                      setFieldValue("startDate", null);
                      setFieldValue("endDate", null);
                    }}
                    onClearTime={() => setFieldValue("startTime", "")}
                    onPressEndDate={() => setShowCalendarFor("endDate")}
                    onPressEndTime={() => setShowTimePickerFor("endTime")}
                    onClearEndDate={() => {
                      setFieldValue("endDate", null);
                      setFieldValue("endTime", "");
                    }}
                    onClearEndTime={() => setFieldValue("endTime", "")}
                  />
                )}

                {/* Stay Details Accordion */}
                {values.type === TripPlanType.stay && (
                  <AccomodationTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    colors={colors}
                    setShowAccomodationDatePickerFor={setShowAccomodationDatePickerFor}
                    formatAccomodationDateTime={formatFlightDateTime}
                    onOpenPoiModal={(category) => {
                      setPoiTargetType("accommodation");
                      setPoiModalInitialCategory(category);
                      setShowPoiModal(true);
                    }}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressLocationMap={() => setShowGoogleSearchModal(true)}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => {
                      setFieldValue("startDate", null);
                      setFieldValue("endDate", null);
                      setFieldValue("accomodationDetails.checkinDateTime", null);
                      setFieldValue("accomodationDetails.checkoutDateTime", null);
                    }}
                    onClearTime={() => {
                      setFieldValue("startTime", "");
                      if (values.startDate) {
                        setFieldValue("accomodationDetails.checkinDateTime", new Date(`${values.startDate}T00:00:00`));
                      }
                    }}
                    onPressEndDate={() => setShowCalendarFor("endDate")}
                    onPressEndTime={() => setShowTimePickerFor("endTime")}
                    onClearEndDate={() => {
                      setFieldValue("endDate", null);
                      setFieldValue("endTime", "");
                      setFieldValue("accomodationDetails.checkoutDateTime", null);
                    }}
                    onClearEndTime={() => {
                      setFieldValue("endTime", "");
                      if (values.endDate) {
                        setFieldValue("accomodationDetails.checkoutDateTime", new Date(`${values.endDate}T00:00:00`));
                      }
                    }}
                  />
                )}

                {/* Flight Details Accordion */}
                {values.type === TripPlanType.flight && (
                  <FlightTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    openFlightModal={openFlightModal}
                    setShowFlightDatePickerFor={setShowFlightDatePickerFor}
                    formatFlightDateTime={formatFlightDateTime}
                    handleFlightSelect={handleFlightSelect}
                    onOpenAirportLookup={(mode) => setShowAirportLookupFor(mode)}
                    showArrivalPrefillNotice={showArrivalPrefillNotice}
                    tripStartDate={travelPlan?.travel?.startOrDepartureDate}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                  />
                )}

                {/* Transit Details */}
                {values.type === TripPlanType.transit && (
                  <TransportationTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    colors={colors}
                    setShowTransportationDatePickerFor={setShowTransportationDatePickerFor}
                    formatTransportationDateTime={formatFlightDateTime}
                    onOpenMapPinModal={handleOpenMapPinModal}
                    onOpenGoogleSearch={handleOpenGoogleSearch}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => {
                      setFieldValue("startDate", null);
                      setFieldValue("endDate", null);
                      setFieldValue("transportationDetails.departureDateTime", null);
                      setFieldValue("transportationDetails.arrivalDateTime", null);
                    }}
                    onClearTime={() => {
                      setFieldValue("startTime", "");
                      if (values.startDate) {
                        setFieldValue("transportationDetails.departureDateTime", new Date(`${values.startDate}T00:00:00`));
                      }
                    }}
                    onPressEndDate={() => setShowCalendarFor("endDate")}
                    onPressEndTime={() => setShowTimePickerFor("endTime")}
                    onClearEndDate={() => {
                      setFieldValue("endDate", null);
                      setFieldValue("endTime", "");
                      setFieldValue("transportationDetails.arrivalDateTime", null);
                    }}
                    onClearEndTime={() => {
                      setFieldValue("endTime", "");
                      if (values.endDate) {
                        setFieldValue("transportationDetails.arrivalDateTime", new Date(`${values.endDate}T00:00:00`));
                      }
                    }}
                  />
                )}

                {/* Ride Rental Details */}
                {values.type === TripPlanType.rideRental && (
                  <RideRentalTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    colors={colors}
                    onOpenMapPinModal={handleOpenMapPinModal}
                    onOpenGoogleSearch={handleOpenGoogleSearch}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => {
                      setFieldValue("startDate", null);
                      setFieldValue("endDate", null);
                      setFieldValue("rideRentalDetails.rentalStartDateTime", null);
                      setFieldValue("rideRentalDetails.rentalEndDateTime", null);
                    }}
                    onClearTime={() => {
                      setFieldValue("startTime", "");
                      if (values.startDate) {
                        setFieldValue("rideRentalDetails.rentalStartDateTime", new Date(`${values.startDate}T00:00:00`));
                      }
                    }}
                    onPressEndDate={() => setShowCalendarFor("endDate")}
                    onPressEndTime={() => setShowTimePickerFor("endTime")}
                    onClearEndDate={() => {
                      setFieldValue("endDate", null);
                      setFieldValue("endTime", "");
                      setFieldValue("rideRentalDetails.rentalEndDateTime", null);
                    }}
                    onClearEndTime={() => {
                      setFieldValue("endTime", "");
                      if (values.endDate) {
                        setFieldValue("rideRentalDetails.rentalEndDateTime", new Date(`${values.endDate}T00:00:00`));
                      }
                    }}
                  />
                )}

                {/* Activity Details Accordion */}
                <SimpleAccordion key="activity-details-accordion" title="Additional Details" defaultExpanded={false}>
                  {/* Activity Type */}
                  <View ref={(el) => { fieldRefs.current["type"] = el; }} className="mb-6">
                    <Text className="text-lg text-secondary/80 font-semibold mb-3">
                      Activity Type
                    </Text>
                    {(() => {
                      const isTypeDisabled = !!values.id && values.type !== TripPlanType.activity;
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            onOpenPrimaryTypeModal(values.type as TripPlanType, (type) => {
                              setFieldValue("type", type);
                              setActiveTabId("details");
                              scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                            });
                          }}
                          disabled={isTypeDisabled}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: isTypeDisabled }}
                          className={`flex-row items-center justify-between border rounded-2xl h-7xl border-[#E0E0E0] px-4 py-4 gap-3 ${isTypeDisabled ? "bg-gray-100 opacity-60" : "bg-white"
                            }`}
                        >
                          {values.type != null ? (
                            <ActivityIcon type={values.type as number} size={24} showIconOnly={true} />
                          ) : (
                            <Icon name="style" size={24} color={"#B3B3B3"} />
                          )}
                          <Text className="text-base flex-1 text-gray-800 font-medium capitalize">
                            {values.type != null ? getTripPlanTypeLabel(values.type) : "Select Type..."}
                          </Text>
                          <Icon name="keyboard-arrow-down" size={24} color="#999" />
                        </TouchableOpacity>
                      );
                    })()}
                  </View>

                  {/* Itinerary Section */}
                  <View ref={(el) => { fieldRefs.current["sectionId"] = el; }} className="mb-6">
                    <Text className="text-xl text-secondary/80 font-semibold ">
                      Section
                    </Text>

                    <Text className={`text-base text-tertiary mb-2`}>
                      Select the Section to add this activity.
                    </Text>

                    <View className="flex-row items-center gap-2 mt-1">
                      <TouchableOpacity
                        onPress={() => {
                          onOpenSectionModal(sections, values.sectionId, (id) => {
                            setFieldValue("sectionId", id);
                            const section = sections.find(s => s.id === id);
                            if (section && section.startDate) {
                              setFieldValue("startDate", toLocalDateStr(section.startDate));
                              if (!values.startTime) {
                                setFieldValue("startTime", `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`);
                              }
                            }
                          });
                        }}
                        className="border rounded-2xl h-7xl border-[#E0E0E0] bg-white px-4 py-4 flex-1 flex-row items-center gap-3"
                        accessibilityRole="button"
                        accessibilityLabel="Select itinerary section"
                      >
                        <Icon name="folder" size={24} color="#263F69" />
                        <Text className={`text-base flex-1 font-medium ${selectedSectionName ? 'text-gray-800' : 'text-gray-400'}`}>
                          {selectedSectionName || "Select Section"}
                        </Text>
                        <Icon name="keyboard-arrow-down" size={24} color="#999" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleAddNewSection}
                        className="w-6xl h-6xl rounded-xl items-center justify-center animate-fade-in bg-primary/10"
                        accessibilityRole="button"
                        accessibilityLabel="Add new section"
                      >
                        <Icon name="add" size={28} color="#0EA5E9" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Description */}
                  <View ref={(el) => { fieldRefs.current["description"] = el; }} className="">
                    <View className="flex-row gap-2 justify-start items-center px-xs">
                      <Text className="text-xs font-bold tracking-wider uppercase text-secondary/40">
                        Description
                      </Text>
                    </View>
                    <DescriptionInput
                      value={values.description}
                      onChange={(text) => setFieldValue("description", text)}
                      label="Description"
                      placeholder="Activity details"
                      confirmLabel={`${values.description ? `Update` : 'Add'}`}
                      maxLength={500}
                    />
                  </View>

                  {/* Custom Tags */}
                  {/* <View ref={(el) => { fieldRefs.current["customTags"] = el; }} className="mt-5">
                      <Text className="text-xs font-semibold tracking-wider uppercase mb-1">Custom Tags</Text>
                      <CustomTagsInput
                        tags={values.customTags}
                        onChangeTags={(tags) => setFieldValue("customTags", tags)}
                      />
                    </View> */}
                </SimpleAccordion>
              </View>
            </ScrollView>

            <MapboxDestinationSelectorModal
              visible={showDestinationModal}
              onClose={() => setShowDestinationModal(false)}
              onSelect={(place: MapboxPlace) => {
                setValues({
                  ...values,
                  destination: place.name,
                  destinationData: {
                    id: place.id,
                    city: place.city,
                    regionOrState: place.regionOrState,
                    country: place.country,
                    coordinates: {
                      longitude: place.coordinates.longitude,
                      latitude: place.coordinates.latitude,
                    },
                  } as DestinationDto
                });
                setShowDestinationModal(false);
              }}
            />

            <AirportLookupModal
              visible={showAirportLookupFor !== null}
              mode={showAirportLookupFor || "departure"}
              title={showAirportLookupFor === "departure" ? "Select Departure" : "Select Arrival"}
              onClose={() => setShowAirportLookupFor(null)}
              onSelect={(airport: Airport) => {
                const airportDisplayName =
                  airport.type === "city" && airport.main_airport_name
                    ? airport.main_airport_name
                    : airport.name;
                const formatted = `${airportDisplayName} (${airport.code})`;

                if (showAirportLookupFor === "departure") {
                  setFieldValue("flightDetails.departureAirport", formatted);
                  const depCoords = airport.coordinates
                    ? { lat: airport.coordinates.lat, lon: airport.coordinates.lon }
                    : null;
                  if (depCoords) {
                    departureAirportCoordsRef.current = depCoords;
                    setFieldValue("destinationData", {
                      id: airport.id,
                      coordinates: {
                        longitude: depCoords.lon,
                        latitude: depCoords.lat,
                      },
                    });
                  }
                  const depCity = airport.type === "city" ? airport.name : airport.city_name;
                  if (!values.destination) {
                    setFieldValue("destination", `${depCity} (${airport.code})`);
                  }
                  const currentArrival = values.flightDetails?.arrivalAirport;
                  if (currentArrival) {
                    setFieldValue("description", `Flight from ${formatted} to ${currentArrival}`);
                  }
                  if (values.flightDetails?.departureDate) {
                    const estimatedArrival = calculateEstimatedArrivalDate(
                      values.flightDetails.departureDate,
                      depCoords,
                      arrivalAirportCoordsRef.current,
                      values.destinationData?.coordinates
                    );
                    if (estimatedArrival) {
                      setFieldValue("flightDetails.arrivalDate", estimatedArrival);
                      triggerArrivalPrefillNotice();
                    }
                  }
                } else if (showAirportLookupFor === "arrival") {
                  setFieldValue("flightDetails.arrivalAirport", formatted);
                  const arrCoords = airport.coordinates
                    ? { lat: airport.coordinates.lat, lon: airport.coordinates.lon }
                    : null;
                  if (arrCoords) {
                    arrivalAirportCoordsRef.current = arrCoords;
                    setFieldValue("destinationData", {
                      ...(values.destinationData || {}),
                      arrivalCoordinates: {
                        latitude: arrCoords.lat,
                        longitude: arrCoords.lon,
                      },
                    });
                  }
                  const arrCity = airport.type === "city" ? airport.name : airport.city_name;
                  if (!values.title || values.title.toLowerCase() === "flight" || values.title.trim() === "") {
                    setFieldValue("title", `Flight to ${arrCity}`);
                  }
                  const currentDeparture = values.flightDetails?.departureAirport;
                  if (currentDeparture) {
                    setFieldValue("description", `Flight from ${currentDeparture} to ${formatted}`);
                  }
                  if (values.flightDetails?.departureDate) {
                    const estimatedArrival = calculateEstimatedArrivalDate(
                      values.flightDetails.departureDate,
                      departureAirportCoordsRef.current,
                      arrCoords,
                      values.destinationData?.coordinates
                    );
                    if (estimatedArrival) {
                      setFieldValue("flightDetails.arrivalDate", estimatedArrival);
                      triggerArrivalPrefillNotice();
                    }
                  }
                }

                setShowAirportLookupFor(null);
              }}
            />

            <Modal
              visible={showPoiModal}
              animationType="slide"
              transparent={false}
              onRequestClose={() => setShowPoiModal(false)}
            >
              <OsmPoiLookupModal
                visible={showPoiModal}
                onClose={() => setShowPoiModal(false)}
                initialCategory={poiModalInitialCategory}
                proximity={travelPlan?.travel?.destinationData?.coordinates}
                country={travelPlan?.travel?.destinationData?.country || travelPlan?.travel?.destination}
                onSelect={(poi: MapboxPoi) => {
                  // Route field population based on which detail type opened the modal
                  if (poiTargetType === "accommodation") {
                    setFieldValue("accomodationDetails.accomodationName", poi.name);
                    if (poi.address) setFieldValue("accomodationDetails.address", poi.address);
                    if (poi.website) setFieldValue("accomodationDetails.websiteAddress", poi.website);
                    if (poi.phone) setFieldValue("accomodationDetails.contactNumber", poi.phone);
                    setFieldValue("accomodationDetails.destinationAddressData", {
                      id: poi.id,
                      coordinates: {
                        latitude: poi.coordinates.latitude,
                        longitude: poi.coordinates.longitude,
                      },
                    });
                  } else if (poiTargetType === "cafeRestaurant") {
                    setFieldValue("cafeRestaurantDetails.restaurantName", poi.name);
                    if (poi.address) setFieldValue("cafeRestaurantDetails.address", poi.address);
                    if (poi.website) setFieldValue("cafeRestaurantDetails.websiteAddress", poi.website);
                    if (poi.phone) setFieldValue("cafeRestaurantDetails.contactNumber", poi.phone);
                    const cuisine = getCuisineFromCategories(poi.poiCategories || []);
                    if (cuisine) setFieldValue("cafeRestaurantDetails.cuisine", cuisine);
                    setFieldValue("cafeRestaurantDetails.destinationAddressData", {
                      id: poi.id,
                      coordinates: {
                        latitude: poi.coordinates.latitude,
                        longitude: poi.coordinates.longitude,
                      },
                    });
                  } else if (poiTargetType === "nature") {
                    setFieldValue("natureDetails.spotName", poi.name);
                    if (poi.address) setFieldValue("natureDetails.address", poi.address);
                    const subType = matchNatureSubtype(poi);
                    if (subType) setFieldValue("natureDetails.subType", subType);
                    setFieldValue("natureDetails.destinationAddressData", {
                      id: poi.id,
                      coordinates: {
                        latitude: poi.coordinates.latitude,
                        longitude: poi.coordinates.longitude,
                      },
                    });
                  } else if (poiTargetType === "shoppingDetails") {
                    setFieldValue("shoppingDetails.venueName", poi.name);
                    if (poi.address) setFieldValue("shoppingDetails.address", poi.address);
                    if (poi.website) setFieldValue("shoppingDetails.websiteAddress", poi.website);
                    const subType = matchShoppingSubtype(poi);
                    if (subType) setFieldValue("shoppingDetails.subType", subType);
                    setFieldValue("shoppingDetails.destinationAddressData", {
                      id: poi.id,
                      coordinates: {
                        latitude: poi.coordinates.latitude,
                        longitude: poi.coordinates.longitude,
                      },
                    });
                  } else if (poiTargetType === "entertainmentDetails") {
                    setFieldValue("entertainmentDetails.venueName", poi.name);
                    if (poi.address) setFieldValue("entertainmentDetails.address", poi.address);
                    if (poi.website) setFieldValue("entertainmentDetails.websiteAddress", poi.website);
                    const subType = matchEntertainmentSubtype(poi);
                    if (subType) setFieldValue("entertainmentDetails.subType", subType);
                    setFieldValue("entertainmentDetails.destinationAddressData", {
                      id: poi.id,
                      coordinates: {
                        latitude: poi.coordinates.latitude,
                        longitude: poi.coordinates.longitude,
                      },
                    });
                  } else if (poiTargetType === "sightseeing") {
                    setFieldValue("sightseeingDetails.attractionName", poi.name);
                    if (poi.address) setFieldValue("sightseeingDetails.address", poi.address);
                    if (poi.website) setFieldValue("sightseeingDetails.websiteAddress", poi.website);
                    setFieldValue("sightseeingDetails.destinationAddressData", {
                      id: poi.id,
                      coordinates: {
                        latitude: poi.coordinates.latitude,
                        longitude: poi.coordinates.longitude,
                      },
                    });
                  } else if (poiTargetType === "sightseeing_address") {
                    // Address-field search: populate address + coordinates only, leave attraction name intact
                    if (poi.address) setFieldValue("sightseeingDetails.address", poi.address);
                    setFieldValue("sightseeingDetails.destinationAddressData", {
                      id: poi.id,
                      coordinates: {
                        latitude: poi.coordinates.latitude,
                        longitude: poi.coordinates.longitude,
                      },
                    });
                  } else if (poiTargetType === "hikeOrCamp") {
                    setFieldValue("hikeOrCampDetails.trailOrSiteName", poi.name);
                    if (poi.address) setFieldValue("hikeOrCampDetails.address", poi.address);
                    setFieldValue("hikeOrCampDetails.destinationAddressData", {
                      id: poi.id,
                      coordinates: {
                        latitude: poi.coordinates.latitude,
                        longitude: poi.coordinates.longitude,
                      },
                    });
                  } else if (poiTargetType === "meetup") {
                    setFieldValue("meetupDetails.venueName", poi.name);
                    if (poi.address) setFieldValue("meetupDetails.address", poi.address);
                    setFieldValue("meetupDetails.destinationAddressData", {
                      id: poi.id,
                      coordinates: {
                        latitude: poi.coordinates.latitude,
                        longitude: poi.coordinates.longitude,
                      },
                    });
                  } else if (poiTargetType === "rideRental") {
                    setFieldValue("rideRentalDetails.providerName", poi.name);
                    if (poi.address) setFieldValue("rideRentalDetails.address", poi.address);
                    setFieldValue("rideRentalDetails.destinationAddressData", {
                      id: poi.id,
                      coordinates: {
                        latitude: poi.coordinates.latitude,
                        longitude: poi.coordinates.longitude,
                      },
                    });
                  } else if (poiTargetType === "plan" || poiTargetType === "title") {
                    setFieldValue("title", poi.name);
                  }

                  // Auto-populate the activity's main destination and coordinates if they are empty
                  if (!values.destination) {
                    setFieldValue("destination", poi.name);
                  }
                  if (!values.destinationData) {
                    setFieldValue("destinationData", {
                      id: poi.id,
                      coordinates: {
                        longitude: poi.coordinates.longitude,
                        latitude: poi.coordinates.latitude,
                      },
                    } as DestinationDto);
                  }
                  setShowPoiModal(false);
                }}
              />
            </Modal>

            <OsmMapPinModal
              visible={showMapPinModal}
              onClose={() => setShowMapPinModal(false)}
              initialValue={mapPinInitialValue}
              initialCoordinates={mapPinInitialCoordinates}
              destination={travelPlan?.travel?.destination || travelPlan?.travel?.destinationData?.city || travelPlan?.travel?.destinationData?.country || ""}
              destinationCoordinates={travelPlan?.travel?.destinationData?.coordinates}
              country={travelPlan?.travel?.destinationData?.country}
              onSelect={(location: PinnedLocation) => {
                if (mapPinTargetField) {
                  if (
                    mapPinTargetField === "transportationDetails.pickupLocation" ||
                    mapPinTargetField === "rideRentalDetails.pickupLocation"
                  ) {
                    const destLocation = buildDestinationDtoFromPinnedLocation(location);
                    setFieldValue(mapPinTargetField, destLocation);
                    setFieldValue("destinationData", {
                      ...(values.destinationData || {}),
                      id: (values.destinationData as any)?.id || destLocation.id || undefined,
                      name: (values.destinationData as any)?.name || destLocation.name || undefined,
                      city: (values.destinationData as any)?.city || destLocation.city || undefined,
                      country: (values.destinationData as any)?.country || destLocation.country || undefined,
                      regionOrState: (values.destinationData as any)?.regionOrState || destLocation.regionOrState || undefined,
                      address: (values.destinationData as any)?.address || destLocation.address || undefined,
                      coordinates: ((values.destinationData as any)?.coordinates?.latitude && (values.destinationData as any)?.coordinates?.latitude !== 0)
                        ? (values.destinationData as any).coordinates
                        : destLocation.coordinates,
                      pickupCoordinates: destLocation.coordinates,
                      pickupLocation: destLocation,
                    });
                    if (!values.destination && destLocation.address) {
                      setFieldValue("destination", destLocation.address);
                    }
                  } else if (
                    mapPinTargetField === "transportationDetails.dropoffLocation" ||
                    mapPinTargetField === "rideRentalDetails.dropoffLocation"
                  ) {
                    const destLocation = buildDestinationDtoFromPinnedLocation(location);
                    setFieldValue(mapPinTargetField, destLocation);
                    setFieldValue("destinationData", {
                      ...(values.destinationData || {}),
                      id: (values.destinationData as any)?.id || destLocation.id || undefined,
                      name: (values.destinationData as any)?.name || destLocation.name || undefined,
                      city: (values.destinationData as any)?.city || destLocation.city || undefined,
                      country: (values.destinationData as any)?.country || destLocation.country || undefined,
                      regionOrState: (values.destinationData as any)?.regionOrState || destLocation.regionOrState || undefined,
                      address: (values.destinationData as any)?.address || destLocation.address || undefined,
                      coordinates: ((values.destinationData as any)?.coordinates?.latitude && (values.destinationData as any)?.coordinates?.latitude !== 0)
                        ? (values.destinationData as any).coordinates
                        : destLocation.coordinates,
                      dropoffCoordinates: destLocation.coordinates,
                      dropoffLocation: destLocation,
                    });
                    if (!values.destination && destLocation.address) {
                      setFieldValue("destination", destLocation.address);
                    }
                  } else {
                    const placeText = mapPinTargetField === "title"
                      ? (location.name || location.address || "")
                      : (location.address || location.name || "");
                    setFieldValue(mapPinTargetField, placeText);
                    if (mapPinTargetField === "title") {
                      if (!values.destination) {
                        setFieldValue("destination", placeText);
                      }
                      if (location.coordinates) {
                        setFieldValue("destinationData", {
                          id: (location as any).id || location.placeId || undefined,
                          coordinates: {
                            latitude: location.coordinates.latitude,
                            longitude: location.coordinates.longitude,
                          },
                        });
                      }
                    }
                    if (mapPinTargetField === "shoppingDetails.address" && location.coordinates) {
                      setFieldValue("shoppingDetails.destinationAddressData", {
                        id: (location as any).id || location.placeId || undefined,
                        coordinates: {
                          latitude: location.coordinates.latitude,
                          longitude: location.coordinates.longitude,
                        },
                      });
                    }
                    if (mapPinTargetField === "natureDetails.address" && location.coordinates) {
                      setFieldValue("natureDetails.destinationAddressData", {
                        id: (location as any).id || location.placeId || undefined,
                        coordinates: {
                          latitude: location.coordinates.latitude,
                          longitude: location.coordinates.longitude,
                        },
                      });
                    }
                    if (mapPinTargetField === "entertainmentDetails.address" && location.coordinates) {
                      setFieldValue("entertainmentDetails.destinationAddressData", {
                        id: (location as any).id || location.placeId || undefined,
                        coordinates: {
                          latitude: location.coordinates.latitude,
                          longitude: location.coordinates.longitude,
                        },
                      });
                    }
                    if (mapPinTargetField === "hikeOrCampDetails.address" && location.coordinates) {
                      setFieldValue("hikeOrCampDetails.destinationAddressData", {
                        id: (location as any).id || location.placeId || undefined,
                        coordinates: {
                          latitude: location.coordinates.latitude,
                          longitude: location.coordinates.longitude,
                        },
                      });
                    }
                  }
                }
                setShowMapPinModal(false);
              }}
            />

            <DestinationDetailsBottomSheet
              visible={showDestinationSheet}
              onClose={() => setShowDestinationSheet(false)}
              placeTitle={placeTitle}
              destinationAddress={destinationAddress}
              destData={destData}
              coordinates={destCoords}
              activityColor={activityColor}
              onOpenSearch={() => handleOpenGoogleSearch("title")}
            />

            <GoogleMapSearchModal
              visible={showGoogleSearchModal}
              onClose={() => setShowGoogleSearchModal(false)}
              title={
                googleSearchTarget === "operatorProvider"
                  ? "Search Operator / Provider"
                  : googleSearchTarget === "providerName"
                    ? "Search Rental Provider"
                    : googleSearchTarget === "pickupLocation"
                      ? "Search Pickup Location"
                      : googleSearchTarget === "dropoffLocation"
                        ? "Search Drop-off Location"
                        : values.type === TripPlanType.stay
                          ? "Search Your Stay"
                          : values.type === TripPlanType.transit
                            ? "Search Transit Spot"
                            : values.type === TripPlanType.rideRental
                              ? "Search Rental Spot"
                              : "Search Places"
              }
              description={
                googleSearchTarget === "operatorProvider"
                  ? "Search for station, agency, or transit operator"
                  : googleSearchTarget === "providerName"
                    ? "Search for car rental company or agency"
                    : googleSearchTarget === "pickupLocation"
                      ? "Search pickup station, branch, or address"
                      : googleSearchTarget === "dropoffLocation"
                        ? "Search drop-off station, branch, or address"
                        : values.type === TripPlanType.stay
                          ? "Search for hotel, resort, or accommodation"
                          : undefined
              }
              placeholder={
                googleSearchTarget === "operatorProvider"
                  ? "Search operator, provider..."
                  : googleSearchTarget === "providerName"
                    ? "Search rental provider, company..."
                    : googleSearchTarget === "pickupLocation"
                      ? "Search pickup location..."
                      : googleSearchTarget === "dropoffLocation"
                        ? "Search drop-off location..."
                        : values.type === TripPlanType.stay
                          ? "Search stay, hotel, resort..."
                          : undefined
              }
              initialValue={
                googleSearchTarget === "operatorProvider"
                  ? (values.transportationDetails?.operatorProvider || "")
                  : googleSearchTarget === "providerName"
                    ? (values.title || "")
                    : googleSearchTarget === "pickupLocation"
                      ? (values.type === TripPlanType.rideRental
                        ? (values.rideRentalDetails?.pickupLocation?.name || values.rideRentalDetails?.pickupLocation?.city || "")
                        : (values.transportationDetails?.pickupLocation?.name || values.transportationDetails?.pickupLocation?.city || ""))
                      : googleSearchTarget === "dropoffLocation"
                        ? (values.type === TripPlanType.rideRental
                          ? (values.rideRentalDetails?.dropoffLocation?.name || values.rideRentalDetails?.dropoffLocation?.city || "")
                          : (values.transportationDetails?.dropoffLocation?.name || values.transportationDetails?.dropoffLocation?.city || ""))
                        : values.title
              }
              initialCoordinates={values.destinationData?.coordinates}
              destinations={
                travelPlan?.travel?.tripDestinations && travelPlan.travel.tripDestinations.length > 0
                  ? travelPlan.travel.tripDestinations
                  : travelPlan?.travel?.destination
                    ? [{ destination: travelPlan.travel.destination, destinationData: travelPlan.travel.destinationData }]
                    : []
              }
              destination={travelPlan?.travel?.destination || travelPlan?.travel?.destinationData?.city || travelPlan?.travel?.destinationData?.country || ""}
              destinationCoordinates={travelPlan?.travel?.destinationData?.coordinates}
              country={travelPlan?.travel?.destinationData?.country}
              onSelect={(location: GooglePlaceLocation) => {
                const destLocation = buildDestinationDtoFromGooglePlace(location);
                const placeName = destLocation.name || location.address || "";
                const destAddress = location.address || destLocation.address || placeName;

                if (googleSearchTarget === "operatorProvider") {
                  setFieldValue("transportationDetails.operatorProvider", placeName);
                } else if (googleSearchTarget === "providerName") {
                  setFieldValue("title", placeName);
                  setFieldValue("destination", destAddress);
                  setFieldValue("rideRentalDetails.pickupLocation", destLocation);
                  setFieldValue("rideRentalDetails.dropoffLocation", destLocation);
                  setFieldValue("destinationData", destLocation);
                } else if (googleSearchTarget === "pickupLocation") {
                  if (values.type === TripPlanType.rideRental) {
                    setFieldValue("rideRentalDetails.pickupLocation", destLocation);
                  } else {
                    setFieldValue("transportationDetails.pickupLocation", destLocation);
                  }
                  setFieldValue("destinationData", {
                    ...(values.destinationData || {}),
                    id: (values.destinationData as any)?.id || destLocation.id || undefined,
                    name: (values.destinationData as any)?.name || destLocation.name || undefined,
                    city: (values.destinationData as any)?.city || destLocation.city || undefined,
                    country: (values.destinationData as any)?.country || destLocation.country || undefined,
                    regionOrState: (values.destinationData as any)?.regionOrState || destLocation.regionOrState || undefined,
                    address: (values.destinationData as any)?.address || destLocation.address || undefined,
                    placeId: (values.destinationData as any)?.placeId || destLocation.placeId || undefined,
                    coordinates: ((values.destinationData as any)?.coordinates?.latitude && (values.destinationData as any)?.coordinates?.latitude !== 0)
                      ? (values.destinationData as any).coordinates
                      : destLocation.coordinates,
                    pickupCoordinates: destLocation.coordinates,
                    pickupLocation: destLocation,
                  });
                  if (!values.destination && destAddress) {
                    setFieldValue("destination", destAddress);
                  }
                } else if (googleSearchTarget === "dropoffLocation") {
                  if (values.type === TripPlanType.rideRental) {
                    setFieldValue("rideRentalDetails.dropoffLocation", destLocation);
                  } else {
                    setFieldValue("transportationDetails.dropoffLocation", destLocation);
                  }
                  setFieldValue("destinationData", {
                    ...(values.destinationData || {}),
                    id: (values.destinationData as any)?.id || destLocation.id || undefined,
                    name: (values.destinationData as any)?.name || destLocation.name || undefined,
                    city: (values.destinationData as any)?.city || destLocation.city || undefined,
                    country: (values.destinationData as any)?.country || destLocation.country || undefined,
                    regionOrState: (values.destinationData as any)?.regionOrState || destLocation.regionOrState || undefined,
                    address: (values.destinationData as any)?.address || destLocation.address || undefined,
                    placeId: (values.destinationData as any)?.placeId || destLocation.placeId || undefined,
                    coordinates: ((values.destinationData as any)?.coordinates?.latitude && (values.destinationData as any)?.coordinates?.latitude !== 0)
                      ? (values.destinationData as any).coordinates
                      : destLocation.coordinates,
                    dropoffCoordinates: destLocation.coordinates,
                    dropoffLocation: destLocation,
                  });
                  if (!values.destination && destAddress) {
                    setFieldValue("destination", destAddress);
                  }
                } else if (googleSearchTarget === "location") {
                  setFieldValue("destination", destAddress);
                  setFieldValue("destinationData", destLocation);
                } else {
                  setFieldValue("title", placeName);
                  setFieldValue("destination", destAddress);
                  if (values.type === TripPlanType.stay) {
                    setFieldValue("accomodationDetails.accomodationName", placeName);
                    setFieldValue("accomodationDetails.address", destAddress);
                    setFieldValue("accomodationDetails.destinationAddressData", destLocation);
                  }
                  if (values.type === TripPlanType.rideRental) {
                    setFieldValue("rideRentalDetails.pickupLocation", destLocation);
                    setFieldValue("rideRentalDetails.dropoffLocation", destLocation);
                  }
                  if (values.type === TripPlanType.transit) {
                    setFieldValue("transportationDetails.pickupLocation", destLocation);
                  }
                  setFieldValue("destinationData", destLocation);
                }
                setShowGoogleSearchModal(false);
              }}
            />

            <PlanDateModal
              visible={showCalendarFor !== null}
              onClose={handleCloseCalendar}
              initialStartDate={values.startDate}
              initialEndDate={values.endDate}
              tripStartDate={travelPlan?.travel?.startOrDepartureDate}
              onConfirm={(startDate, endDate) => {
                setFieldValue("startDate", startDate);
                setFieldValue("endDate", endDate);
                if (endDate && !values.endTime) {
                  setFieldValue("endTime", values.type === TripPlanType.transit ? "12:00" : values.type === TripPlanType.rideRental ? "17:00" : "18:00");
                }
                if (values.type === TripPlanType.stay) {
                  if (startDate) {
                    setFieldValue("accomodationDetails.checkinDateTime", new Date(`${startDate}T${values.startTime || "15:00"}:00`));
                    if (!values.startTime) {
                      setFieldValue("startTime", "15:00");
                    }
                  } else {
                    setFieldValue("accomodationDetails.checkinDateTime", null);
                  }
                  if (endDate) {
                    setFieldValue("accomodationDetails.checkoutDateTime", new Date(`${endDate}T${values.endTime || "11:00"}:00`));
                    if (!values.endTime) {
                      setFieldValue("endTime", "11:00");
                    }
                  } else {
                    setFieldValue("accomodationDetails.checkoutDateTime", null);
                  }
                }
                if (values.type === TripPlanType.transit) {
                  if (startDate) {
                    setFieldValue("transportationDetails.departureDateTime", new Date(`${startDate}T${values.startTime || "09:00"}:00`));
                    if (!values.startTime) {
                      setFieldValue("startTime", "09:00");
                    }
                  } else {
                    setFieldValue("transportationDetails.departureDateTime", null);
                  }
                  if (endDate) {
                    setFieldValue("transportationDetails.arrivalDateTime", new Date(`${endDate}T${values.endTime || "12:00"}:00`));
                    if (!values.endTime) {
                      setFieldValue("endTime", "12:00");
                    }
                  } else {
                    setFieldValue("transportationDetails.arrivalDateTime", null);
                  }
                }
                if (values.type === TripPlanType.rideRental) {
                  if (startDate) {
                    setFieldValue("rideRentalDetails.rentalStartDateTime", new Date(`${startDate}T${values.startTime || "09:00"}:00`));
                    if (!values.startTime) {
                      setFieldValue("startTime", "09:00");
                    }
                  } else {
                    setFieldValue("rideRentalDetails.rentalStartDateTime", null);
                  }
                  if (endDate) {
                    setFieldValue("rideRentalDetails.rentalEndDateTime", new Date(`${endDate}T${values.endTime || "17:00"}:00`));
                    if (!values.endTime) {
                      setFieldValue("endTime", "17:00");
                    }
                  } else {
                    setFieldValue("rideRentalDetails.rentalEndDateTime", null);
                  }
                }
                setShowCalendarFor(null);
              }}
            />

            <DateTimePickerModal
              isVisible={showTimePickerFor !== null}
              mode="time"
              date={(() => {
                const targetDateStr = showTimePickerFor === "startTime" ? values.startDate : values.endDate;
                const targetTimeStr = showTimePickerFor === "startTime" ? values.startTime : values.endTime;

                const resultDate = new Date();

                if (targetDateStr) {
                  const [year, month, day] = targetDateStr.split('-').map(Number);
                  resultDate.setFullYear(year, month - 1, day);
                }

                if (targetTimeStr && targetTimeStr.includes(':')) {
                  const [hours, minutes] = targetTimeStr.split(':').map(Number);
                  resultDate.setHours(hours, minutes, 0, 0);
                } else {
                  resultDate.setHours(showTimePickerFor === "startTime" ? 9 : 17, 0, 0, 0);
                }

                return resultDate;
              })()}
              onConfirm={(date) => {
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const timeString = `${hours}:${minutes}`;
                if (showTimePickerFor === "startTime") {
                  const updated: any = { ...values, startTime: timeString };
                  if (values.type === TripPlanType.stay && values.startDate) {
                    updated.accomodationDetails = {
                      ...values.accomodationDetails,
                      checkinDateTime: new Date(`${values.startDate}T${timeString}:00`),
                    };
                  }
                  if (values.type === TripPlanType.transit && values.startDate) {
                    updated.transportationDetails = {
                      ...values.transportationDetails,
                      departureDateTime: new Date(`${values.startDate}T${timeString}:00`),
                    };
                  }
                  if (values.type === TripPlanType.rideRental && values.startDate) {
                    updated.rideRentalDetails = {
                      ...values.rideRentalDetails,
                      rentalStartDateTime: new Date(`${values.startDate}T${timeString}:00`),
                    };
                  }
                  setValues(updated);
                } else {
                  const updated: any = { ...values, endTime: timeString };
                  if (values.type === TripPlanType.stay && values.endDate) {
                    updated.accomodationDetails = {
                      ...values.accomodationDetails,
                      checkoutDateTime: new Date(`${values.endDate}T${timeString}:00`),
                    };
                  }
                  if (values.type === TripPlanType.transit && values.endDate) {
                    updated.transportationDetails = {
                      ...values.transportationDetails,
                      arrivalDateTime: new Date(`${values.endDate}T${timeString}:00`),
                    };
                  }
                  if (values.type === TripPlanType.rideRental && values.endDate) {
                    updated.rideRentalDetails = {
                      ...values.rideRentalDetails,
                      rentalEndDateTime: new Date(`${values.endDate}T${timeString}:00`),
                    };
                  }
                  setValues(updated);
                }
                setShowTimePickerFor(null);
              }}
              onCancel={() => setShowTimePickerFor(null)}
            />

            <DateTimePickerModal
              isVisible={showFlightDatePickerFor !== null}
              mode="datetime"
              minimumDate={(() => {
                if (showFlightDatePickerFor === "arrivalDate" && values.flightDetails?.departureDate) {
                  const d = new Date(values.flightDetails.departureDate);
                  if (!isNaN(d.getTime())) return d;
                }
                return undefined;
              })()}
              date={(() => {
                const targetVal = showFlightDatePickerFor && values.flightDetails?.[showFlightDatePickerFor];
                if (targetVal) {
                  const d = new Date(targetVal);
                  if (!isNaN(d.getTime())) return d;
                }
                const fallbackDate = travelPlan?.travel?.startOrDepartureDate || values.startDate || currentSection?.startDate;
                if (fallbackDate) {
                  const d = new Date(fallbackDate);
                  if (!isNaN(d.getTime())) return d;
                }
                return new Date();
              })()}
              onConfirm={(date) => {
                if (showFlightDatePickerFor) {
                  setFieldValue(`flightDetails.${showFlightDatePickerFor}`, date);
                  if (showFlightDatePickerFor === "departureDate") {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    setFieldValue("startDate", `${year}-${month}-${day}`);
                    const hours = String(date.getHours()).padStart(2, "0");
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    setFieldValue("startTime", `${hours}:${minutes}`);

                    const estimatedArrival = calculateEstimatedArrivalDate(
                      date,
                      departureAirportCoordsRef.current,
                      arrivalAirportCoordsRef.current,
                      values.destinationData?.coordinates
                    );
                    if (estimatedArrival) {
                      setFieldValue("flightDetails.arrivalDate", estimatedArrival);
                      triggerArrivalPrefillNotice();
                    }
                  }
                }
                setShowFlightDatePickerFor(null);
              }}
              onCancel={() => setShowFlightDatePickerFor(null)}
            />

            <DateTimePickerModal
              isVisible={showAccomodationDatePickerFor !== null}
              mode="datetime"
              minimumDate={(() => {
                if (showAccomodationDatePickerFor === "checkoutDateTime" && values.accomodationDetails?.checkinDateTime) {
                  const d = new Date(values.accomodationDetails.checkinDateTime);
                  if (!isNaN(d.getTime())) return d;
                }
                return undefined;
              })()}
              date={(() => {
                const targetVal = showAccomodationDatePickerFor && values.accomodationDetails?.[showAccomodationDatePickerFor];
                if (targetVal) {
                  const d = new Date(targetVal);
                  if (!isNaN(d.getTime())) return d;
                }
                if (showAccomodationDatePickerFor === "checkoutDateTime") {
                  const checkinVal = values.accomodationDetails?.checkinDateTime;
                  if (checkinVal) {
                    const d = new Date(checkinVal);
                    if (!isNaN(d.getTime())) return d;
                  }
                }
                const fallbackDate = values.startDate || currentSection?.startDate || travelPlan?.travel?.startOrDepartureDate;
                if (fallbackDate) {
                  const d = new Date(fallbackDate);
                  if (!isNaN(d.getTime())) return d;
                }
                return new Date();
              })()}
              onConfirm={(date) => {
                if (showAccomodationDatePickerFor === "checkinDateTime") {
                  setFieldValue("accomodationDetails.checkinDateTime", date);
                  if (values.accomodationDetails?.checkoutDateTime && new Date(values.accomodationDetails.checkoutDateTime).getTime() < date.getTime()) {
                    setFieldValue("accomodationDetails.checkoutDateTime", date);
                  }
                } else if (showAccomodationDatePickerFor === "checkoutDateTime") {
                  setFieldValue("accomodationDetails.checkoutDateTime", date);
                }
                setShowAccomodationDatePickerFor(null);
              }}
              onCancel={() => setShowAccomodationDatePickerFor(null)}
            />

            {/* Transportation Date Pickers */}
            <DateTimePickerModal
              isVisible={showTransportationDatePickerFor !== null}
              mode="datetime"
              minimumDate={(() => {
                if (showTransportationDatePickerFor === "arrivalDateTime" && values.transportationDetails?.departureDateTime) {
                  const d = new Date(values.transportationDetails.departureDateTime);
                  if (!isNaN(d.getTime())) return d;
                }
                return undefined;
              })()}
              date={(() => {
                const targetVal = showTransportationDatePickerFor && values.transportationDetails?.[showTransportationDatePickerFor];
                if (targetVal) {
                  const d = new Date(targetVal);
                  if (!isNaN(d.getTime())) return d;
                }
                if (showTransportationDatePickerFor === "arrivalDateTime") {
                  const depVal = values.transportationDetails?.departureDateTime;
                  if (depVal) {
                    const d = new Date(depVal);
                    if (!isNaN(d.getTime())) return d;
                  }
                }
                const fallbackDate = travelPlan?.travel?.startOrDepartureDate || values.startDate || currentSection?.startDate;
                if (fallbackDate) {
                  const d = new Date(fallbackDate);
                  if (!isNaN(d.getTime())) return d;
                }
                return new Date();
              })()}
              onConfirm={(date) => {
                if (showTransportationDatePickerFor === "departureDateTime") {
                  setFieldValue("transportationDetails.departureDateTime", date);
                  if (values.transportationDetails?.arrivalDateTime && new Date(values.transportationDetails.arrivalDateTime).getTime() < date.getTime()) {
                    setFieldValue("transportationDetails.arrivalDateTime", date);
                  }
                } else if (showTransportationDatePickerFor === "arrivalDateTime") {
                  setFieldValue("transportationDetails.arrivalDateTime", date);
                }
                setShowTransportationDatePickerFor(null);
              }}
              onCancel={() => setShowTransportationDatePickerFor(null)}
            />


            {/* Ride Rental Date Pickers */}
            <DateTimePickerModal
              isVisible={showRideRentalDatePickerFor !== null}
              mode="datetime"
              minimumDate={(() => {
                if (showRideRentalDatePickerFor === "rentalEndDateTime" && values.rideRentalDetails?.rentalStartDateTime) {
                  const d = new Date(values.rideRentalDetails.rentalStartDateTime);
                  if (!isNaN(d.getTime())) return d;
                }
                return undefined;
              })()}
              date={(() => {
                const targetVal = showRideRentalDatePickerFor && values.rideRentalDetails?.[showRideRentalDatePickerFor];
                if (targetVal) { const d = new Date(targetVal); if (!isNaN(d.getTime())) return d; }
                if (showRideRentalDatePickerFor === "rentalEndDateTime") {
                  const startVal = values.rideRentalDetails?.rentalStartDateTime;
                  if (startVal) { const d = new Date(startVal); if (!isNaN(d.getTime())) return d; }
                }
                const fallbackDate = travelPlan?.travel?.startOrDepartureDate || values.startDate || currentSection?.startDate;
                if (fallbackDate) { const d = new Date(fallbackDate); if (!isNaN(d.getTime())) return d; }
                return new Date();
              })()}
              onConfirm={(date) => {
                if (showRideRentalDatePickerFor === "rentalStartDateTime") {
                  setFieldValue("rideRentalDetails.rentalStartDateTime", date);
                  if (values.rideRentalDetails?.rentalEndDateTime && new Date(values.rideRentalDetails.rentalEndDateTime).getTime() < date.getTime()) {
                    setFieldValue("rideRentalDetails.rentalEndDateTime", date);
                  }
                } else if (showRideRentalDatePickerFor === "rentalEndDateTime") {
                  setFieldValue("rideRentalDetails.rentalEndDateTime", date);
                }
                setShowRideRentalDatePickerFor(null);
              }}
              onCancel={() => setShowRideRentalDatePickerFor(null)}
            />

          </View>
        );
      }}
    </Formik>
  );
};

export default EditActivity;

const FormikDirtyListener = ({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) => {
  const { dirty } = useFormikContext<any>();
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  return null;
};

const FormikErrorScroller = ({
  scrollViewRef,
  fieldRefs,
  activeTabId,
  setActiveTabId,
}: {
  scrollViewRef: React.RefObject<ScrollView>;
  fieldRefs: React.RefObject<{ [key: string]: any }>;
  activeTabId: string;
  setActiveTabId: (tabId: string) => void;
}) => {
  const { errors, submitCount, isValidating } = useFormikContext<any>();

  useEffect(() => {
    if (submitCount > 0 && Object.keys(errors).length > 0 && !isValidating) {
      const getFirstErrorKey = (obj: any, prefix = ""): string => {
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          const path = prefix ? `${prefix}.${key}` : key;
          if (typeof val === "string") {
            return path;
          } else if (typeof val === "object" && val !== null) {
            const subPath = getFirstErrorKey(val, path);
            if (subPath) return subPath;
          }
        }
        return "";
      };

      const firstErrorKey = getFirstErrorKey(errors);
      if (!firstErrorKey) return;

      // Determine target tab
      let targetTab = "details";

      if (activeTabId !== targetTab) {
        setActiveTabId(targetTab);
      }

      const performScroll = () => {
        const ref = fieldRefs.current[firstErrorKey];
        if (ref && scrollViewRef.current) {
          const scrollViewNode = scrollViewRef.current;
          ref.measureLayout(
            scrollViewNode,
            (x: number, y: number) => {
              scrollViewNode.scrollTo({ y: Math.max(0, y - 20), animated: true });
            },
            () => {
              // Fallback measure
              ref.measure((x, y, w, h, px, py) => {
                scrollViewNode.scrollTo({ y: Math.max(0, y - 20), animated: true });
              });
            }
          );
        }
      };

      // Wait a tick for tab content or layout to render
      if (activeTabId !== targetTab) {
        setTimeout(performScroll, 200);
      } else {
        performScroll();
      }
    }
  }, [submitCount, isValidating]);

  return null;
};



