import { MaterialIcons as Icon } from "@expo/vector-icons";
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
import { CalendarList } from "react-native-calendars";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { TextInput, useTheme } from "react-native-paper";
import * as Yup from "yup";
import SimpleAccordion from "../../../../../../components/Accordion/Simple";
import ActivityIcon from "../../../../../../components/ActivityIcon";
import TouchButton from "../../../../../../components/atoms/TouchButton";
import DescriptionInput from "../../../../../../components/molecules/DescriptionInput";
import Tabs from "../../../../../../components/Tabs";
import { useConfirm } from "../../../../../../context/ConfirmContext";
import { useToast } from "../../../../../../context/ToastContext";
import { useTravelContext } from "../../../../../../context/TravelContext";
import { useLexicographicSort } from "../../../../../../hooks/useLexicographicSort";
import { fetchLocalItineraryActivity } from "../../../../../../services/local/travelService";
import { ActivityType, getActivityTypeLabel } from "../../../../../../types/enums";
import { useAuth } from "../../../../../Auth/hooks/AuthContext";
import { useDeleteActivityMutation, useUpdateActivityMutation, useItineraryActivity } from "../../../../hooks/useActivity";
import { useChecklistItems, useDeleteChecklistItemMutation, useSaveChecklistItemMutation, useToggleChecklistItemMutation } from "../../../../hooks/useChecklist";
import { useUpdateSectionMutation } from "../../../../hooks/useSection";
import { useTravelPlan } from "../../../../hooks/useTravel";
import { Attachment, DestinationDto, Images, ItineraryActivity } from "../../../../types/TravelDto";
import { MapboxPoi } from "../../../Lookups/PoiLookupModal";
import OsmPoiLookupModal from "../../../Lookups/OsmPoiLookupModal";
import OsmMapPinModal, { PinnedLocation } from "../../../Lookups/OsmMapPinModal";
import { MapboxPlace } from "../../../MapboxDestinationSelector";
import MapboxDestinationSelectorModal from "../../../MapboxDestinationSelector/Modal";
import DateTime from "./DateTime";
import AccomodationTab from "./Tabs/AccomodationTab";
import CafeRestaurantTab from "./Tabs/CafeRestaurantTab";
import EntertainmentTab from "./Tabs/EntertainmentTab";
import FlightTab from "./Tabs/FlightTab";
import HikeOrCampTab from "./Tabs/HikeOrCampTab";
import NatureTab from "./Tabs/NatureTab";
import PreparationTab from "./Tabs/PreparationTab";
import RideRentalTab from "./Tabs/RideRentalTab";
import ShoppingTab from "./Tabs/ShoppingTab";
import SightseeingTab from "./Tabs/SightseeingTab";
import TransportationTab from "./Tabs/TransportationTab";
import WalkTab from "./Tabs/WalkTab";

interface Place {
  id: string;
  name: string;
  address: string;
  type: string;
}

interface EditActivityProps {
  itineraryActivity: ItineraryActivity | null;
  onClose: () => void;
  onOpenSectionModal: (sections: any[], currentId: string | undefined, onSelect: (id?: string) => void) => void;
  onOpenPrimaryTypeModal: (currentType: ActivityType, onSelect: (type: ActivityType) => void) => void;
  itinerarySectionId?: string;
  travelId?: string;
  onScroll?: (event: any) => void;
  onChildModalToggle?: (isOpen: boolean) => void;
  onSaveSuccess?: (activity: ItineraryActivity) => void;
  onSwitchToAddMode?: () => void;
}

const TravelSchema = Yup.object().shape({
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
  type?: ActivityType | number;
  sortOrder?: string;
  startDate: string | null;
  startTime: string;
  endDate: string | null;
  endTime: string;
  destination: string;
  destinationData?: DestinationDto;
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
  cafeRestaurantDetails?: {
    restaurantName: string;
    address?: string | null;
    destinationAddressData?: import('../../../../types/TravelDto').DestinationDto | null;
    cuisine?: string | null;
    priceRange?: string | null;
    reservationLink?: string | null;
    websiteAddress?: string | null;
    contactNumber?: string | null;
  } | null;
  natureDetails?: {
    spotName: string;
    address?: string | null;
    destinationAddressData?: import('../../../../types/TravelDto').DestinationDto | null;
    subType?: string | null;
    entryFee?: string | null;
    websiteAddress?: string | null;
    contactName?: string | null;
    contactNumber?: string | null;
    emailAddress?: string | null;
  } | null;
  shoppingDetails?: {
    venueName: string;
    address?: string | null;
    destinationAddressData?: import('../../../../types/TravelDto').DestinationDto | null;
    subType?: string | null;
    websiteAddress?: string | null;
    bookingReferenceOrLink?: string | null;
    promoCodeOrLink?: string | null;
    contactNumber?: string | null;
    emailAddress?: string | null;
  } | null;
  entertainmentDetails?: {
    venueName: string;
    address?: string | null;
    destinationAddressData?: import('../../../../types/TravelDto').DestinationDto | null;
    subType?: string | null;
    websiteAddress?: string | null;
    ticketPrice?: string | null;
    bookingReference?: string | null;
    contactName?: string | null;
    contactNumber?: string | null;
    emailAddress?: string | null;
  } | null;
  transportationDetails?: {
    mode?: string | null;
    operatorProvider?: string | null;
    pickupLocation?: string | null;
    dropoffLocation?: string | null;
    departureDateTime?: Date | string | null;
    arrivalDateTime?: Date | string | null;
    seatOrVehicleNumber?: string | null;
    bookingReference?: string | null;
    bookingStatus?: string | null;
    price?: string | null;
    websiteAddress?: string | null;
    contactNumber?: string | null;
    notes?: string | null;
  } | null;
  walkDetails?: {
    routeName?: string | null;
    estimatedDistanceKm?: string | null;
    estimatedDuration?: string | null;
  } | null;
  sightseeingDetails?: {
    attractionName: string;
    address?: string | null;
    destinationAddressData?: import('../../../../types/TravelDto').DestinationDto | null;
    entryFee?: string | null;
    websiteAddress?: string | null;
    bookingReference?: string | null;
    contactNumber?: string | null;
    emailAddress?: string | null;
  } | null;
  preparationDetails?: {
    taskLabel?: string | null;
    deadlineDateTime?: Date | string | null;
    priority?: string | null;
    notes?: string | null;
  } | null;
  restDetails?: {
    restLocationName?: string | null;
    restLocationType?: string | null;
  } | null;
  hikeOrCampDetails?: {
    trailOrSiteName: string;
    address?: string | null;
    destinationAddressData?: import('../../../../types/TravelDto').DestinationDto | null;
    subType?: string | null;
    estimatedDistanceKm?: string | null;
    campsiteName?: string | null;
    permitRequired?: boolean | null;
    contactPerson?: string | null;
    contactNumber?: string | null;
    emailAddress?: string | null;
    websiteAddress?: string | null;
    reservationLink?: string | null;
    checkinDateTime?: Date | string | null;
    checkoutDateTime?: Date | string | null;
  } | null;
  motorcycleRideDetails?: {
    routeName?: string | null;
    startingPoint?: string | null;
    endingPoint?: string | null;
    estimatedDistanceKm?: string | null;
    roadType?: string | null;
    bikeModel?: string | null;
    fuelStops?: string | null;
  } | null;
  meetupDetails?: {
    venueName: string;
    address?: string | null;
    destinationAddressData?: import('../../../../types/TravelDto').DestinationDto | null;
    hostOrOrganizer?: string | null;
    numberOfPeople?: string | null;
    meetupType?: string | null;
    rsvpLink?: string | null;
  } | null;
  rideRentalDetails?: {
    providerName?: string | null;
    address?: string | null;
    destinationAddressData?: import('../../../../types/TravelDto').DestinationDto | null;
    vehicleType?: string | null;
    vehicleModel?: string | null;
    pickupLocation?: string | null;
    dropoffLocation?: string | null;
    rentalStartDateTime?: Date | string | null;
    rentalEndDateTime?: Date | string | null;
    bookingReference?: string | null;
    bookingStatus?: string | null;
    price?: string | null;
    websiteAddress?: string | null;
    contactName?: string | null;
    contactNumber?: string | null;
    emailAddress?: string | null;
    notes?: string | null;
  } | null;
}

const FormInitHandler = ({
  values,
  setFieldValue,
  itineraryActivity,
  onOpenPrimaryTypeModal,
  openFlightModal,
  handleFlightSelect,
}: {
  values: any;
  setFieldValue: any;
  itineraryActivity: any;
  onOpenPrimaryTypeModal: any;
  openFlightModal: any;
  handleFlightSelect: any;
}) => {
  useEffect(() => {
    if (!itineraryActivity?.id && values.type === ActivityType.none) {
      const timer = setTimeout(() => {
        onOpenPrimaryTypeModal(values.type, (type: any) => {
          setFieldValue("type", type);
          if (type === ActivityType.flight) {
            const defaultFlightDate = values.flightDetails?.departureDate || values.startDate;
            openFlightModal(
              (flightData: any) => {
                handleFlightSelect(flightData, setFieldValue);
              },
              defaultFlightDate
            );
          }
        });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [itineraryActivity?.id, values.type]);

  return null;
};

const NATURE_SUBTYPES = [
  "Beach", "Mountain", "Lake", "River", "Waterfall", "Forest", "Jungle", "Cave", "Desert", "Canyon", "Volcano",
];

const SHOPPING_SUBTYPES = [
  "Mall", "Market", "Clothes Store", "Supermarket", "Convenience Store", "Spa", "ATM", "Bank", "Pharmacy", "Gas Station",
];

const ENTERTAINMENT_SUBTYPES = [
  "Park", "Museum", "Gym", "Cinema", "Stadium", "Zoo", "Concert", "Theme Park",
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


const EditActivity = ({
  itinerarySectionId,
  itineraryActivity: propItineraryActivity,
  travelId: propTravelId,
  onClose,
  onScroll,
  onChildModalToggle,
  onOpenSectionModal,
  onOpenPrimaryTypeModal,
  onSaveSuccess,
  onSwitchToAddMode,
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
    setFieldValue("destinationData", {
      id: departureAirport.id,
      coordinates: {
        longitude: departureAirport.coordinates.lon,
        latitude: departureAirport.coordinates.lat,
      },
    });

    // 4. Start Date & Time
    if (departureDate && departureDate instanceof Date && !isNaN(departureDate.getTime())) {
      const year = departureDate.getFullYear();
      const month = String(departureDate.getMonth() + 1).padStart(2, '0');
      const day = String(departureDate.getDate()).padStart(2, '0');
      setFieldValue("startDate", `${year}-${month}-${day}`);

      const hours = String(departureDate.getHours()).padStart(2, '0');
      const minutes = String(departureDate.getMinutes()).padStart(2, '0');
      setFieldValue("startTime", `${hours}:${minutes}`);

      setFieldValue("flightDetails.departureDate", departureDate);
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

    // 8. Prefill Arrival Date & Time if coordinates are available to calculate flight duration
    if (departureAirport?.coordinates && arrivalAirport?.coordinates) {
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
        const arrivalDate = new Date(new Date(departureDate).getTime() + durationHours * 60 * 60 * 1000);
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
    }
  };

  const [showDestinationModal, setShowDestinationModal] =
    useState<boolean>(false);
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
  const [mapPinTargetField, setMapPinTargetField] = useState<string>("rideRentalDetails.pickupLocation");
  const [mapPinInitialValue, setMapPinInitialValue] = useState<string>("");

  const handleOpenMapPinModal = (targetField: string, initialText?: string) => {
    setMapPinTargetField(targetField);
    setMapPinInitialValue(initialText || "");
    setShowMapPinModal(true);
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const fieldRefs = useRef<{ [key: string]: any }>({});
  const [activeTabId, setActiveTabId] = useState<string>("details");
  const [showArrivalPrefillNotice, setShowArrivalPrefillNotice] = useState<boolean>(false);
  const prefillNoticeTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    showPreparationDeadlinePicker ||
    showRideRentalDatePickerFor !== null ||
    showHikeOrCampDatePickerFor !== null ||
    showPoiModal ||
    showMapPinModal
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

  const travelId = itineraryActivity?.travelId || propTravelId || "";
  const {
    data: travelPlan,
  } = useTravelPlan(travelId);
  const currentSection = travelPlan?.itinerarySection?.find(s => s.id === itinerarySectionId);
  const { confirm } = useConfirm();
  // Move useTheme to component top level (Rules of Hooks: must not be called inside callbacks)
  const { colors } = useTheme();

  // Checklist state
  const [newCheckTitle, setNewCheckTitle] = useState("");
  const [newCheckDescription, setNewCheckDescription] = useState("");
  const [showCheckDescription, setShowCheckDescription] = useState(false);
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
  const saveChecklistItem = useSaveChecklistItemMutation();
  const deleteChecklistItem = useDeleteChecklistItemMutation();
  const toggleChecklistItem = useToggleChecklistItemMutation();
  const activityId = itineraryActivity?.id;
  const { data: checklistItems = [], refetch: refetchChecklist } = useChecklistItems(travelId);
  const activityChecklistItems = checklistItems.filter(
    (i) => activityId && i.activityId === activityId
  );

  const handleAddChecklistItem = async () => {
    if (!newCheckTitle.trim() || !activityId || !travelId) return;
    await saveChecklistItem.mutateAsync({
      travelId,
      activityId,
      title: newCheckTitle.trim(),
      description: newCheckDescription.trim() || undefined,
      sortOrder: String(Date.now()),
      isDone: false,
      userId: userToken || "user",
      isOffline: true,
    });
    setNewCheckTitle("");
    setNewCheckDescription("");
    setShowCheckDescription(false);
    await refetchChecklist();
  };

  const handleToggleChecklistItem = async (item: any) => {
    await toggleChecklistItem.mutateAsync({
      id: item.id,
      isDone: !item.isDone,
      userId: userToken || "user",
      travelId,
    });
    await refetchChecklist();
  };

  const handleDeleteChecklistItem = async (item: any) => {
    const isConfirmed = await confirm({
      title: "Remove Item",
      message: `Remove "${item.title}"?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      type: "danger",
    });

    if (isConfirmed) {
      await deleteChecklistItem.mutateAsync({ id: item.id, travelId });
      await refetchChecklist();
    }
  };

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
      if (values.type === ActivityType.flight) {
        finalStartDate = values.flightDetails?.departureDate
          ? new Date(values.flightDetails.departureDate)
          : undefined;
      } else if (values.type === ActivityType.accomodation) {
        finalStartDate = values.accomodationDetails?.checkinDateTime
          ? new Date(values.accomodationDetails.checkinDateTime)
          : undefined;
      } else if (values.type === ActivityType.hikeOrCamp && values.hikeOrCampDetails?.checkinDateTime) {
        finalStartDate = new Date(values.hikeOrCampDetails.checkinDateTime);
      } else if (values.startDate) {
        finalStartDate = new Date(`${values.startDate}T${values.startTime}:00`);
      }

      let finalEndDate: Date | undefined = undefined;
      if (values.type === ActivityType.flight && values.flightDetails?.arrivalDate) {
        finalEndDate = new Date(values.flightDetails.arrivalDate);
      } else if (values.type === ActivityType.accomodation) {
        finalEndDate = values.accomodationDetails?.checkoutDateTime
          ? new Date(values.accomodationDetails.checkoutDateTime)
          : undefined;
      } else if (values.type === ActivityType.hikeOrCamp && values.hikeOrCampDetails?.checkoutDateTime) {
        finalEndDate = new Date(values.hikeOrCampDetails.checkoutDateTime);
      } else if (values.endDate) {
        finalEndDate = new Date(`${values.endDate}T${values.endTime}:00`);
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
        type: values.type as ActivityType,
        startDate: finalStartDate,
        endDate: finalEndDate,
        destination: values.destination,
        destinationData: values.destinationData,
        images: values.images,
        isOffline: true,
        travelId: values.travelId,
        attachments: values.attachments,
        flightDetails: values.type === ActivityType.flight && values.flightDetails
          ? {
            departureAirport: values.flightDetails.departureAirport,
            arrivalAirport: values.flightDetails.arrivalAirport,
            departureDate: values.flightDetails.departureDate
              ? new Date(values.flightDetails.departureDate)
              : null,
            arrivalDate: values.flightDetails.arrivalDate
              ? new Date(values.flightDetails.arrivalDate)
              : null,
            flightNumber: values.flightDetails.flightNumber || null,
            airline: values.flightDetails.airline || null,
            gate: values.flightDetails.gate || null,
            terminal: values.flightDetails.terminal || null,
            seatNumber: values.flightDetails.seatNumber || null,
            bookingReference: values.flightDetails.bookingReference || null,
            price: values.flightDetails.price ? Number(values.flightDetails.price) : null,
          }
          : null,
        accomodationDetails: values.type === ActivityType.accomodation && values.accomodationDetails
          ? {
            accomodationName: values.accomodationDetails.accomodationName,
            address: values.accomodationDetails.address || null,
            destinationAddressData: values.accomodationDetails.destinationAddressData ?? null,
            subType: values.accomodationDetails.subType || null,
            checkinDateTime: values.accomodationDetails.checkinDateTime && new Date(values.accomodationDetails.checkinDateTime).getTime() > 0
              ? new Date(values.accomodationDetails.checkinDateTime)
              : null,
            checkoutDateTime: values.accomodationDetails.checkoutDateTime && new Date(values.accomodationDetails.checkoutDateTime).getTime() > 0
              ? new Date(values.accomodationDetails.checkoutDateTime)
              : null,
            websiteAddress: values.accomodationDetails.websiteAddress || null,
            bookingReference: values.accomodationDetails.bookingReference || null,
            bookingStatus: values.accomodationDetails.bookingStatus || null,
            contactNumber: values.accomodationDetails.contactNumber || null,
            emailAddress: values.accomodationDetails.emailAddress || null,
            contactName: values.accomodationDetails.contactName || null,
          }
          : null,
        cafeRestaurantDetails: values.type === ActivityType.cafeRestaurant && values.cafeRestaurantDetails
          ? {
            restaurantName: values.cafeRestaurantDetails.restaurantName,
            address: values.cafeRestaurantDetails.address || null,
            destinationAddressData: values.cafeRestaurantDetails.destinationAddressData ?? null,
            cuisine: values.cafeRestaurantDetails.cuisine || null,
            priceRange: values.cafeRestaurantDetails.priceRange || null,
            reservationLink: values.cafeRestaurantDetails.reservationLink || null,
            websiteAddress: values.cafeRestaurantDetails.websiteAddress || null,
            contactNumber: values.cafeRestaurantDetails.contactNumber || null,
          }
          : null,
        natureDetails: values.type === ActivityType.nature && values.natureDetails
          ? {
            spotName: values.natureDetails.spotName,
            address: values.natureDetails.address || null,
            destinationAddressData: values.natureDetails.destinationAddressData ?? null,
            subType: values.natureDetails.subType || null,
            entryFee: values.natureDetails.entryFee || null,
            websiteAddress: values.natureDetails.websiteAddress || null,
            contactName: values.natureDetails.contactName || null,
            contactNumber: values.natureDetails.contactNumber || null,
            emailAddress: values.natureDetails.emailAddress || null,
          }
          : null,
        shoppingDetails: values.type === ActivityType.shopppingAndService && values.shoppingDetails
          ? {
            venueName: values.shoppingDetails.venueName,
            address: values.shoppingDetails.address || null,
            destinationAddressData: values.shoppingDetails.destinationAddressData ?? null,
            subType: values.shoppingDetails.subType || null,
            websiteAddress: values.shoppingDetails.websiteAddress || null,
            bookingReferenceOrLink: values.shoppingDetails.bookingReferenceOrLink || null,
            promoCodeOrLink: values.shoppingDetails.promoCodeOrLink || null,
            contactNumber: values.shoppingDetails.contactNumber || null,
            emailAddress: values.shoppingDetails.emailAddress || null,
          }
          : null,
        entertainmentDetails: values.type === ActivityType.entertainmentAndRecreation && values.entertainmentDetails
          ? {
            venueName: values.entertainmentDetails.venueName,
            address: values.entertainmentDetails.address || null,
            destinationAddressData: values.entertainmentDetails.destinationAddressData ?? null,
            subType: values.entertainmentDetails.subType || null,
            websiteAddress: values.entertainmentDetails.websiteAddress || null,
            ticketPrice: values.entertainmentDetails.ticketPrice || null,
            bookingReference: values.entertainmentDetails.bookingReference || null,
            contactName: values.entertainmentDetails.contactName || null,
            contactNumber: values.entertainmentDetails.contactNumber || null,
            emailAddress: values.entertainmentDetails.emailAddress || null,
          }
          : null,
        transportationDetails: values.type === ActivityType.transportation && values.transportationDetails
          ? {
            mode: values.transportationDetails.mode || null,
            operatorProvider: values.transportationDetails.operatorProvider || null,
            pickupLocation: values.transportationDetails.pickupLocation || null,
            dropoffLocation: values.transportationDetails.dropoffLocation || null,
            departureDateTime: values.transportationDetails.departureDateTime
              ? new Date(values.transportationDetails.departureDateTime)
              : null,
            arrivalDateTime: values.transportationDetails.arrivalDateTime
              ? new Date(values.transportationDetails.arrivalDateTime)
              : null,
            seatOrVehicleNumber: values.transportationDetails.seatOrVehicleNumber || null,
            bookingReference: values.transportationDetails.bookingReference || null,
            bookingStatus: values.transportationDetails.bookingStatus || null,
            price: values.transportationDetails.price || null,
            websiteAddress: values.transportationDetails.websiteAddress || null,
            contactNumber: values.transportationDetails.contactNumber || null,
            notes: values.transportationDetails.notes || null,
          }
          : null,
        // walkDetails: values.type === ActivityType.walk && values.walkDetails
        //   ? {
        //     routeName: values.walkDetails.routeName || null,
        //     estimatedDistanceKm: values.walkDetails.estimatedDistanceKm || null,
        //     estimatedDuration: values.walkDetails.estimatedDuration || null,
        //   }
        //   : null,
        sightseeingDetails: values.type === ActivityType.sightseeing && values.sightseeingDetails
          ? {
            attractionName: values.sightseeingDetails.attractionName,
            address: values.sightseeingDetails.address || null,
            destinationAddressData: values.sightseeingDetails.destinationAddressData ?? null,
            entryFee: values.sightseeingDetails.entryFee || null,
            websiteAddress: values.sightseeingDetails.websiteAddress || null,
            bookingReference: values.sightseeingDetails.bookingReference || null,
            contactNumber: values.sightseeingDetails.contactNumber || null,
            emailAddress: values.sightseeingDetails.emailAddress || null,
          }
          : null,
        preparationDetails: values.type === ActivityType.preparation && values.preparationDetails
          ? {
            taskLabel: values.preparationDetails.taskLabel || null,
            deadlineDateTime: values.preparationDetails.deadlineDateTime
              ? new Date(values.preparationDetails.deadlineDateTime)
              : null,
            priority: values.preparationDetails.priority || null,
            notes: values.preparationDetails.notes || null,
          }
          : null,
        // restDetails: values.type === ActivityType.rest && values.restDetails
        //   ? {
        //       restLocationName: values.restDetails.restLocationName || null,
        //       restLocationType: values.restDetails.restLocationType || null,
        //     }
        //   : null,
        hikeOrCampDetails: values.type === ActivityType.hikeOrCamp && values.hikeOrCampDetails
          ? {
            trailOrSiteName: values.hikeOrCampDetails.trailOrSiteName,
            address: values.hikeOrCampDetails.address || null,
            destinationAddressData: values.hikeOrCampDetails.destinationAddressData ?? null,
            subType: values.hikeOrCampDetails.subType || null,
            estimatedDistanceKm: values.hikeOrCampDetails.estimatedDistanceKm || null,
            campsiteName: values.hikeOrCampDetails.campsiteName || null,
            permitRequired: values.hikeOrCampDetails.permitRequired ?? null,
            contactPerson: values.hikeOrCampDetails.contactPerson || null,
            contactNumber: values.hikeOrCampDetails.contactNumber || null,
            emailAddress: values.hikeOrCampDetails.emailAddress || null,
            websiteAddress: values.hikeOrCampDetails.websiteAddress || null,
            reservationLink: values.hikeOrCampDetails.reservationLink || null,
            checkinDateTime: values.hikeOrCampDetails.checkinDateTime
              ? new Date(values.hikeOrCampDetails.checkinDateTime)
              : null,
            checkoutDateTime: values.hikeOrCampDetails.checkoutDateTime
              ? new Date(values.hikeOrCampDetails.checkoutDateTime)
              : null,
          }
          : null,
        // motorcycleRideDetails: values.type === ActivityType.motorcycleRide && values.motorcycleRideDetails
        //   ? {
        //       routeName: values.motorcycleRideDetails.routeName || null,
        //       startingPoint: values.motorcycleRideDetails.startingPoint || null,
        //       endingPoint: values.motorcycleRideDetails.endingPoint || null,
        //       estimatedDistanceKm: values.motorcycleRideDetails.estimatedDistanceKm || null,
        //       roadType: values.motorcycleRideDetails.roadType || null,
        //       bikeModel: values.motorcycleRideDetails.bikeModel || null,
        //       fuelStops: values.motorcycleRideDetails.fuelStops || null,
        //     }
        //   : null,
        // meetupDetails: values.type === ActivityType.meetup && values.meetupDetails
        //   ? {
        //       venueName: values.meetupDetails.venueName,
        //       address: values.meetupDetails.address || null,
        //       hostOrOrganizer: values.meetupDetails.hostOrOrganizer || null,
        //       numberOfPeople: values.meetupDetails.numberOfPeople || null,
        //       meetupType: values.meetupDetails.meetupType || null,
        //       rsvpLink: values.meetupDetails.rsvpLink || null,
        //     }
        //   : null,
        rideRentalDetails: values.type === ActivityType.rideRental && values.rideRentalDetails
          ? {
            providerName: values.rideRentalDetails.providerName,
            address: values.rideRentalDetails.address || null,
            destinationAddressData: values.rideRentalDetails.destinationAddressData ?? null,
            vehicleType: values.rideRentalDetails.vehicleType || null,
            vehicleModel: values.rideRentalDetails.vehicleModel || null,
            pickupLocation: values.rideRentalDetails.pickupLocation || null,
            dropoffLocation: values.rideRentalDetails.dropoffLocation || null,
            rentalStartDateTime: values.rideRentalDetails.rentalStartDateTime
              ? new Date(values.rideRentalDetails.rentalStartDateTime)
              : null,
            rentalEndDateTime: values.rideRentalDetails.rentalEndDateTime
              ? new Date(values.rideRentalDetails.rentalEndDateTime)
              : null,
            bookingReference: values.rideRentalDetails.bookingReference || null,
            bookingStatus: values.rideRentalDetails.bookingStatus || null,
            price: values.rideRentalDetails.price || null,
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
    type: itineraryActivity?.type ?? ActivityType.none,
    sortOrder: itineraryActivity?.sortOrder || "",
    startDate: itineraryActivity?.startDate ? toLocalDateStr(itineraryActivity.startDate) : (currentSection?.startDate ? toLocalDateStr(currentSection.startDate) : null),
    startTime: itineraryActivity?.startDate && String(itineraryActivity.startDate).includes('T') ? toLocalTimeStr(itineraryActivity.startDate) : (currentSection?.startDate ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : ""),
    endDate: itineraryActivity?.endDate ? toLocalDateStr(itineraryActivity.endDate) : null,
    endTime: itineraryActivity?.endDate && String(itineraryActivity.endDate).includes('T') ? toLocalTimeStr(itineraryActivity.endDate) : "09:00",
    destination: itineraryActivity?.destination || "",
    destinationData: itineraryActivity?.destinationData || undefined,
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
        : (itineraryActivity?.type === ActivityType.accomodation ? itineraryActivity?.title || "" : ""),
      address: (itineraryActivity?.accomodationDetails?.address || "").trim() !== ""
        ? itineraryActivity.accomodationDetails.address
        : (itineraryActivity?.type === ActivityType.accomodation ? itineraryActivity?.destination || "" : ""),
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
    cafeRestaurantDetails: {
      restaurantName: itineraryActivity?.cafeRestaurantDetails?.restaurantName || "",
      address: itineraryActivity?.cafeRestaurantDetails?.address || "",
      destinationAddressData: itineraryActivity?.cafeRestaurantDetails?.destinationAddressData ?? null,
      cuisine: itineraryActivity?.cafeRestaurantDetails?.cuisine || "",
      priceRange: itineraryActivity?.cafeRestaurantDetails?.priceRange || "",
      reservationLink: itineraryActivity?.cafeRestaurantDetails?.reservationLink || "",
      websiteAddress: itineraryActivity?.cafeRestaurantDetails?.websiteAddress || "",
      contactNumber: itineraryActivity?.cafeRestaurantDetails?.contactNumber || "",
    },
    natureDetails: {
      spotName: itineraryActivity?.natureDetails?.spotName || "",
      address: itineraryActivity?.natureDetails?.address || "",
      destinationAddressData: itineraryActivity?.natureDetails?.destinationAddressData ?? null,
      subType: itineraryActivity?.natureDetails?.subType || null,
      entryFee: itineraryActivity?.natureDetails?.entryFee || "",
      websiteAddress: itineraryActivity?.natureDetails?.websiteAddress || "",
      contactName: itineraryActivity?.natureDetails?.contactName || "",
      contactNumber: itineraryActivity?.natureDetails?.contactNumber || "",
      emailAddress: itineraryActivity?.natureDetails?.emailAddress || "",
    },
    shoppingDetails: {
      venueName: itineraryActivity?.shoppingDetails?.venueName || "",
      address: itineraryActivity?.shoppingDetails?.address || "",
      destinationAddressData: itineraryActivity?.shoppingDetails?.destinationAddressData ?? null,
      subType: itineraryActivity?.shoppingDetails?.subType || null,
      websiteAddress: itineraryActivity?.shoppingDetails?.websiteAddress || "",
      bookingReferenceOrLink: itineraryActivity?.shoppingDetails?.bookingReferenceOrLink || "",
      promoCodeOrLink: itineraryActivity?.shoppingDetails?.promoCodeOrLink || "",
      contactNumber: itineraryActivity?.shoppingDetails?.contactNumber || "",
      emailAddress: itineraryActivity?.shoppingDetails?.emailAddress || "",
    },
    entertainmentDetails: {
      venueName: itineraryActivity?.entertainmentDetails?.venueName || "",
      address: itineraryActivity?.entertainmentDetails?.address || "",
      destinationAddressData: itineraryActivity?.entertainmentDetails?.destinationAddressData ?? null,
      subType: itineraryActivity?.entertainmentDetails?.subType || null,
      websiteAddress: itineraryActivity?.entertainmentDetails?.websiteAddress || "",
      ticketPrice: itineraryActivity?.entertainmentDetails?.ticketPrice || "",
      bookingReference: itineraryActivity?.entertainmentDetails?.bookingReference || "",
      contactName: itineraryActivity?.entertainmentDetails?.contactName || "",
      contactNumber: itineraryActivity?.entertainmentDetails?.contactNumber || "",
      emailAddress: itineraryActivity?.entertainmentDetails?.emailAddress || "",
    },
    transportationDetails: {
      mode: itineraryActivity?.transportationDetails?.mode || null,
      operatorProvider: itineraryActivity?.transportationDetails?.operatorProvider || "",
      pickupLocation: itineraryActivity?.transportationDetails?.pickupLocation || "",
      dropoffLocation: itineraryActivity?.transportationDetails?.dropoffLocation || "",
      departureDateTime: itineraryActivity?.transportationDetails?.departureDateTime
        ? new Date(itineraryActivity.transportationDetails.departureDateTime)
        : null,
      arrivalDateTime: itineraryActivity?.transportationDetails?.arrivalDateTime
        ? new Date(itineraryActivity.transportationDetails.arrivalDateTime)
        : null,
      seatOrVehicleNumber: itineraryActivity?.transportationDetails?.seatOrVehicleNumber || "",
      bookingReference: itineraryActivity?.transportationDetails?.bookingReference || "",
      bookingStatus: itineraryActivity?.transportationDetails?.bookingStatus || "",
      price: itineraryActivity?.transportationDetails?.price || "",
      websiteAddress: itineraryActivity?.transportationDetails?.websiteAddress || "",
      contactNumber: itineraryActivity?.transportationDetails?.contactNumber || "",
      notes: itineraryActivity?.transportationDetails?.notes || "",
    },
    walkDetails: {
      routeName: itineraryActivity?.walkDetails?.routeName || "",
      estimatedDistanceKm: itineraryActivity?.walkDetails?.estimatedDistanceKm || "",
      estimatedDuration: itineraryActivity?.walkDetails?.estimatedDuration || "",
    },
    sightseeingDetails: {
      attractionName: itineraryActivity?.sightseeingDetails?.attractionName || "",
      address: itineraryActivity?.sightseeingDetails?.address || "",
      destinationAddressData: itineraryActivity?.sightseeingDetails?.destinationAddressData ?? null,
      entryFee: itineraryActivity?.sightseeingDetails?.entryFee || "",
      websiteAddress: itineraryActivity?.sightseeingDetails?.websiteAddress || "",
      bookingReference: itineraryActivity?.sightseeingDetails?.bookingReference || "",
      contactNumber: itineraryActivity?.sightseeingDetails?.contactNumber || "",
      emailAddress: itineraryActivity?.sightseeingDetails?.emailAddress || "",
    },
    preparationDetails: {
      taskLabel: itineraryActivity?.preparationDetails?.taskLabel || "",
      deadlineDateTime: itineraryActivity?.preparationDetails?.deadlineDateTime
        ? new Date(itineraryActivity.preparationDetails.deadlineDateTime)
        : null,
      priority: itineraryActivity?.preparationDetails?.priority || null,
      notes: itineraryActivity?.preparationDetails?.notes || "",
    },
    restDetails: {
      restLocationName: itineraryActivity?.restDetails?.restLocationName || "",
      restLocationType: itineraryActivity?.restDetails?.restLocationType || null,
    },
    hikeOrCampDetails: {
      trailOrSiteName: itineraryActivity?.hikeOrCampDetails?.trailOrSiteName || "",
      address: itineraryActivity?.hikeOrCampDetails?.address || "",
      destinationAddressData: itineraryActivity?.hikeOrCampDetails?.destinationAddressData ?? null,
      subType: itineraryActivity?.hikeOrCampDetails?.subType || null,
      estimatedDistanceKm: itineraryActivity?.hikeOrCampDetails?.estimatedDistanceKm || "",
      campsiteName: itineraryActivity?.hikeOrCampDetails?.campsiteName || "",
      permitRequired: itineraryActivity?.hikeOrCampDetails?.permitRequired ?? false,
      contactPerson: itineraryActivity?.hikeOrCampDetails?.contactPerson || "",
      contactNumber: itineraryActivity?.hikeOrCampDetails?.contactNumber || "",
      emailAddress: itineraryActivity?.hikeOrCampDetails?.emailAddress || "",
      websiteAddress: itineraryActivity?.hikeOrCampDetails?.websiteAddress || "",
      reservationLink: itineraryActivity?.hikeOrCampDetails?.reservationLink || "",
      checkinDateTime: itineraryActivity?.hikeOrCampDetails?.checkinDateTime
        ? new Date(itineraryActivity.hikeOrCampDetails.checkinDateTime)
        : null,
      checkoutDateTime: itineraryActivity?.hikeOrCampDetails?.checkoutDateTime
        ? new Date(itineraryActivity.hikeOrCampDetails.checkoutDateTime)
        : null,
    },
    motorcycleRideDetails: {
      routeName: itineraryActivity?.motorcycleRideDetails?.routeName || "",
      startingPoint: itineraryActivity?.motorcycleRideDetails?.startingPoint || "",
      endingPoint: itineraryActivity?.motorcycleRideDetails?.endingPoint || "",
      estimatedDistanceKm: itineraryActivity?.motorcycleRideDetails?.estimatedDistanceKm || "",
      roadType: itineraryActivity?.motorcycleRideDetails?.roadType || "",
      bikeModel: itineraryActivity?.motorcycleRideDetails?.bikeModel || "",
      fuelStops: itineraryActivity?.motorcycleRideDetails?.fuelStops || "",
    },
    meetupDetails: {
      venueName: itineraryActivity?.meetupDetails?.venueName || "",
      address: itineraryActivity?.meetupDetails?.address || "",
      destinationAddressData: itineraryActivity?.meetupDetails?.destinationAddressData ?? null,
      hostOrOrganizer: itineraryActivity?.meetupDetails?.hostOrOrganizer || "",
      numberOfPeople: itineraryActivity?.meetupDetails?.numberOfPeople || "",
      meetupType: itineraryActivity?.meetupDetails?.meetupType || null,
      rsvpLink: itineraryActivity?.meetupDetails?.rsvpLink || "",
    },
    rideRentalDetails: {
      providerName: itineraryActivity?.rideRentalDetails?.providerName || "",
      address: itineraryActivity?.rideRentalDetails?.address || "",
      destinationAddressData: itineraryActivity?.rideRentalDetails?.destinationAddressData ?? null,
      vehicleType: itineraryActivity?.rideRentalDetails?.vehicleType || null,
      vehicleModel: itineraryActivity?.rideRentalDetails?.vehicleModel || "",
      pickupLocation: itineraryActivity?.rideRentalDetails?.pickupLocation || "",
      dropoffLocation: itineraryActivity?.rideRentalDetails?.dropoffLocation || "",
      rentalStartDateTime: itineraryActivity?.rideRentalDetails?.rentalStartDateTime
        ? new Date(itineraryActivity.rideRentalDetails.rentalStartDateTime)
        : null,
      rentalEndDateTime: itineraryActivity?.rideRentalDetails?.rentalEndDateTime
        ? new Date(itineraryActivity.rideRentalDetails.rentalEndDateTime)
        : null,
      bookingReference: itineraryActivity?.rideRentalDetails?.bookingReference || "",
      bookingStatus: itineraryActivity?.rideRentalDetails?.bookingStatus || "",
      price: itineraryActivity?.rideRentalDetails?.price || "",
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
    itineraryActivity,
    itinerarySectionId,
    travelId,
    travelPlan?.itinerarySection?.[0]?.id,
    currentSection?.startDate,
  ]);

  return (
    <Formik<ActivityFormValues>
      key={itineraryActivity?.id ? `${itineraryActivity.id}-${itineraryActivity.type}-${itineraryActivity.updatedAt || ''}` : "new-activity"}
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
        const sections = travelPlan?.itinerarySection || [];
        const hasSections = sections.length > 0;
        const selectedSection = sections.find((s) => s.id?.toString() === values.sectionId?.toString());
        const selectedSectionName = selectedSection
          ? (selectedSection.isDefaultSection ? "[Ungroup]" : selectedSection.title || "")
          : (values.sectionId ? createdSections[values.sectionId] || "" : "");

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

        const tabData = [];

        tabData.push(
          {
            id: "details",
            title: "Details",
            content: (
              <View className="flex-1 px-5 mt-2">
                {/* Title */}
                <View ref={(el) => { fieldRefs.current["title"] = el; }} className="mb-5">
                  <Text className="text-xs font-semibold tracking-wider uppercase">Title <Text className="text-red-500 text-lg">*</Text></Text>
                  <View className="relative justify-center">
                    <TextInput
                      mode="outlined"
                      placeholder="e.g. Museum Visit"
                      value={values.title}
                      onChangeText={handleChange("title")}
                      onBlur={handleBlur("title")}
                      error={(touched.title || submitCount > 0) && Boolean(errors.title)}
                      outlineColor="#E0E0E0"
                      activeOutlineColor="#263F69"
                      theme={{ colors: { onSurfaceVariant: '#98A2B3' } }}
                      outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                      style={{ marginTop: 6, height: 64 }}
                      contentStyle={{ backgroundColor: "transparent", paddingRight: 60 }}
                      maxLength={40}
                    />
                    <Text
                      className="absolute right-4 bottom-3 text-xs"
                      style={{ color: '#98A2B3' }}
                    >
                      {(values.title || "").length}/40
                    </Text>
                  </View>
                  {(touched.title || submitCount > 0) && errors.title && (
                    <View className="flex flex-row items-center mt-1">
                      <Icon name="info-outline" size={14} color="#fb2c36" />
                      <Text className="text-red-500 text-xs ml-1" >{errors.title}</Text>
                    </View>
                  )}
                </View>

                {values.type === ActivityType.none && (
                  <DateTime
                    startDate={values.startDate}
                    startTime={values.startTime}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => setFieldValue("startDate", null)}
                    onClearTime={() => setFieldValue("startTime", "")}
                  />
                )}


                {/* Accomodation Details Accordion */}
                {values.type === ActivityType.accomodation && (
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
                  />
                )}

                {/* Flight Details Accordion */}
                {values.type === ActivityType.flight && (
                  <FlightTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    openFlightModal={openFlightModal}
                    setShowFlightDatePickerFor={setShowFlightDatePickerFor}
                    formatFlightDateTime={formatFlightDateTime}
                    handleFlightSelect={handleFlightSelect}
                    showArrivalPrefillNotice={showArrivalPrefillNotice}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                  />
                )}

                {/* Cafe / Restaurant Details */}
                {values.type === ActivityType.cafeRestaurant && (
                  <CafeRestaurantTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    onOpenPoiModal={(category) => {
                      setPoiTargetType("cafeRestaurant");
                      setPoiModalInitialCategory(category);
                      setShowPoiModal(true);
                    }}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => setValues({ ...values, startDate: null, startTime: "" })}
                    onClearTime={() => setValues({ ...values, startTime: "" })}
                  />
                )}

                {/* Nature Details */}
                {values.type === ActivityType.nature && (
                  <NatureTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    onOpenPoiModal={(category) => {
                      setPoiTargetType("nature");
                      setPoiModalInitialCategory(category);
                      setShowPoiModal(true);
                    }}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => setValues({ ...values, startDate: null, startTime: "" })}
                    onClearTime={() => setValues({ ...values, startTime: "" })}
                  />
                )}

                {/* Shopping & Service Details */}
                {values.type === ActivityType.shopppingAndService && (
                  <ShoppingTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    onOpenPoiModal={(category) => {
                      setPoiTargetType("shoppingDetails");
                      setPoiModalInitialCategory(category);
                      setShowPoiModal(true);
                    }}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => setValues({ ...values, startDate: null, startTime: "" })}
                    onClearTime={() => setValues({ ...values, startTime: "" })}
                  />
                )}

                {/* Entertainment & Recreation Details */}
                {values.type === ActivityType.entertainmentAndRecreation && (
                  <EntertainmentTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    onOpenPoiModal={(category) => {
                      setPoiTargetType("entertainmentDetails");
                      setPoiModalInitialCategory(category);
                      setShowPoiModal(true);
                    }}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => setValues({ ...values, startDate: null, startTime: "" })}
                    onClearTime={() => setValues({ ...values, startTime: "" })}
                  />
                )}

                {/* Transportation Details */}
                {values.type === ActivityType.transportation && (
                  <TransportationTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    colors={colors}
                    setShowTransportationDatePickerFor={setShowTransportationDatePickerFor}
                    formatTransportationDateTime={formatFlightDateTime}
                    onOpenMapPinModal={handleOpenMapPinModal}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                  />
                )}

                {/* Walk Details */}
                {/* {values.type === ActivityType.walk && (
                  <WalkTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => setValues({ ...values, startDate: null, startTime: "" })}
                    onClearTime={() => setValues({ ...values, startTime: "" })}
                  />
                )} */}

                {/* Sightseeing Details */}
                {values.type === ActivityType.sightseeing && (
                  <SightseeingTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    onOpenPoiModal={(category, targetField) => {
                      setPoiTargetType(targetField === "address" ? "sightseeing_address" : "sightseeing");
                      setPoiModalInitialCategory(category);
                      setShowPoiModal(true);
                    }}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => setValues({ ...values, startDate: null, startTime: "" })}
                    onClearTime={() => setValues({ ...values, startTime: "" })}
                  />
                )}

                {/* Preparation Details */}
                {values.type === ActivityType.preparation && (
                  <PreparationTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    formatDateTime={formatFlightDateTime}
                    onOpenDatePicker={() => setShowPreparationDeadlinePicker(true)}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                  />
                )}

                {/* Rest Details */}
                {/* {values.type === ActivityType.rest && (
                  <RestTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => setValues({ ...values, startDate: null, startTime: "" })}
                    onClearTime={() => setValues({ ...values, startTime: "" })}
                  />
                )} */}

                {/* Hike or Camp Details */}
                {values.type === ActivityType.hikeOrCamp && (
                  <HikeOrCampTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    onOpenPoiModal={(category) => {
                      setPoiTargetType("hikeOrCamp");
                      setPoiModalInitialCategory(category);
                      setShowPoiModal(true);
                    }}
                    formatDateTime={formatFlightDateTime}
                    onOpenCheckinPicker={() => setShowHikeOrCampDatePickerFor("checkinDateTime")}
                    onOpenCheckoutPicker={() => setShowHikeOrCampDatePickerFor("checkoutDateTime")}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                  />
                )}

                {/* Motorcycle Ride Details */}
                {/* {values.type === ActivityType.motorcycleRide && (
                  <MotorcycleRideTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => setValues({ ...values, startDate: null, startTime: "" })}
                    onClearTime={() => setValues({ ...values, startTime: "" })}
                  />
                )} */}

                {/* Meetup Details */}
                {/* {values.type === ActivityType.meetup && (
                  <MeetupTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    onOpenPoiModal={(category) => {
                      setPoiTargetType("meetup");
                      setPoiModalInitialCategory(category);
                      setShowPoiModal(true);
                    }}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                    onPressDate={() => setShowCalendarFor("startDate")}
                    onPressTime={() => setShowTimePickerFor("startTime")}
                    onClearDate={() => setValues({ ...values, startDate: null, startTime: "" })}
                    onClearTime={() => setValues({ ...values, startTime: "" })}
                  />
                )} */}

                {/* Ride Rental Details */}
                {values.type === ActivityType.rideRental && (
                  <RideRentalTab
                    values={values}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    colors={colors}
                    onOpenPoiModal={(category) => {
                      setPoiTargetType("rideRental");
                      setPoiModalInitialCategory(category);
                      setShowPoiModal(true);
                    }}
                    onOpenMapPinModal={handleOpenMapPinModal}
                    formatDateTime={formatFlightDateTime}
                    onOpenRentalStartPicker={() => setShowRideRentalDatePickerFor("rentalStartDateTime")}
                    onOpenRentalEndPicker={() => setShowRideRentalDatePickerFor("rentalEndDateTime")}
                    noPadding={true}
                    fieldRefs={fieldRefs}
                  />
                )}

                {/* Activity Details Accordion */}
                <SimpleAccordion key="activity-details-accordion" title="Other Details" defaultExpanded={true}>


                  {/* Date & Time fields removed from main form and injected into specific tabs */}

                  {/* Location */}
                  {/* <View ref={(el) => { fieldRefs.current["destination"] = el; }} className="mb-5">
                    <Text className="text-xs font-semibold tracking-wider uppercase mb-1">Location</Text>
                    {values.destinationData ? (() => {
                      const { longitude, latitude } = values.destinationData.coordinates;
                      const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+263F69(${longitude},${latitude})/${longitude},${latitude},12,0/600x300?access_token=${MAPBOX_ACCESS_TOKEN}`;
                      return (
                        <TouchableOpacity 
                          activeOpacity={0.8} 
                          onPress={() => setShowDestinationModal(true)}
                          className="mt-1"
                          accessibilityRole="button"
                        >
                          <View className="rounded-2xl overflow-hidden border border-gray-100">
                            <Image source={{ uri: mapUrl }} style={{ width: '100%', height: 120, borderRadius: 16 }} resizeMode="cover" />
                            <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-full flex-row items-center">
                              <Icon name="location-on" size={12} color="#FFF" />
                              <Text className="text-white text-[10px] ml-1">{values.destination}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })() : (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowDestinationModal(true)}
                        accessibilityRole="button"
                      >
                        <View pointerEvents="none">
                          <TextInput
                            mode="outlined"
                            placeholder="Search city or country..."
                            value=""
                            editable={false}
                            outlineColor="#E0E0E0"
                            activeOutlineColor="#263F69"
                            left={<TextInput.Icon icon="map-marker" color="#999" />}
                            theme={{ colors: { onSurfaceVariant: '#888' } }}
                            outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                            style={{ marginTop: 6, height: 64 }}
                            contentStyle={{ backgroundColor: "transparent" }}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View> */}


                  {/* Activity Type */}
                  <View ref={(el) => { fieldRefs.current["type"] = el; }} className="mb-5 ">
                    <Text className="text-xs font-semibold tracking-wider uppercase mb-1">Activity Type</Text>
                    {(() => {
                      const isTypeDisabled = !!values.id && values.type !== ActivityType.none;
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            onOpenPrimaryTypeModal(values.type as ActivityType, (type) => {
                              setFieldValue("type", type);
                              setActiveTabId("details");
                              if (type === ActivityType.flight) {
                                const defaultFlightDate = values.flightDetails?.departureDate || values.startDate || currentSection?.startDate || travelPlan?.travel?.startOrDepartureDate;
                                openFlightModal(
                                  (flightData: any) => {
                                    handleFlightSelect(flightData, setFieldValue);
                                  },
                                  defaultFlightDate
                                );
                              }
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
                            {values.type != null ? getActivityTypeLabel(values.type) : "Select Type..."}
                          </Text>
                          <Icon name="keyboard-arrow-down" size={24} color="#999" />

                        </TouchableOpacity>
                      );
                    })()}
                  </View>


                  {/* Itinerary Section */}
                  <View ref={(el) => { fieldRefs.current["sectionId"] = el; }} className="mb-5">
                    <Text className="text-md font-semibold tracking-wider uppercase mb-1">Section</Text>
                    <Text className={`text-md text-gray-500`}>
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
                        className="w-6xl h-7xl rounded-full items-center justify-center animate-fade-in"
                        accessibilityRole="button"
                        accessibilityLabel="Add new section"
                      >
                        <Icon name="add" size={28} color="#263F69" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Description */}
                  <View ref={(el) => { fieldRefs.current["description"] = el; }} className="">
                    <Text className="text-xs font-semibold tracking-wider uppercase">Description</Text>
                    <DescriptionInput
                      value={values.description}
                      onChange={(text) => setFieldValue("description", text)}
                      label="Description"
                      placeholder="Activity details"
                      confirmLabel="Add"
                      maxLength={500}
                    />
                  </View>
                </SimpleAccordion>

              </View>
            ),
          },
          {
            id: "images",
            title: "Images",
            disabled: !itineraryActivity?.id,
            content: (
              <View className="flex-1 pb-6 pt-2 px-5">
                <Text className="text-xs font-semibold tracking-wider uppercase mb-2 ">Upload Images</Text>
                <TouchableOpacity
                  onPress={() => pickImage(setFieldValue, values.images)}
                  className="border-2 border-dashed border-[#ddd] h-[140px] rounded-[16px] bg-white px-4 py-4 flex-row items-center justify-center gap-3 mb-4"
                  accessibilityRole="button"
                  accessibilityLabel="Upload images"
                >
                  <Icon name="add-photo-alternate" size={28} color="#263F69" />
                  <Text className="text-base text-[#263F69] font-medium">Add Photos</Text>
                </TouchableOpacity>

                {values.images.length > 0 && (
                  <View className="flex-row flex-wrap gap-3">
                    {values.images.map((item, index) => (
                      <View key={`${item.url}-${index}`} className="relative">
                        <Image
                          source={{ uri: item.url }}
                          style={{ width: 100, height: 100, borderRadius: 12 }}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
                          accessibilityRole="button"
                          accessibilityLabel="Remove image"
                          onPress={() => {
                            const updated = values.images.filter((_, i) => i !== index);
                            setFieldValue("images", updated);
                          }}
                        >
                          <Icon name="close" size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ),
          },
          {
            id: "attachments",
            title: "Attachments",
            disabled: !itineraryActivity?.id,
            content: (
              <View className="flex-1 pb-6 pt-2 px-5">
                <Text className="text-xs font-semibold tracking-wider uppercase mb-2">File Attachments</Text>
                <TouchableOpacity
                  onPress={() => pickDocument(setFieldValue, values.attachments || [])}
                  className="border-2 border-dashed border-[#ddd] h-[140px] rounded-[16px] bg-white px-4 py-4 flex-row items-center justify-center gap-3 mb-2"
                  accessibilityRole="button"
                  accessibilityLabel="Upload files"
                >
                  <Icon name="attach-file" size={28} color="#263F69" />
                  <Text className="text-base text-[#263F69] font-medium">Attach Files</Text>
                </TouchableOpacity>
                <Text className="text-xs text-gray-500 mb-4">
                  Supported formats: PDF, Word, Excel, PowerPoint
                </Text>

                {(values.attachments || []).length > 0 && (
                  <View className="gap-2">
                    {(values.attachments || []).map((file, index) => {
                      const displaySize = file.size
                        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                        : "Unknown size";
                      return (
                        <View key={`${file.url}-${index}`} className="flex-row items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <Icon name="insert-drive-file" size={24} color="#263F69" className="mr-3" />
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                              {file.name}
                            </Text>
                            <Text className="text-xs text-gray-400 mt-0.5">
                              {displaySize}
                            </Text>
                          </View>
                          <TouchableOpacity
                            className="p-1"
                            accessibilityRole="button"
                            accessibilityLabel="Remove attachment"
                            onPress={() => {
                              const updated = (values.attachments || []).filter((_, i) => i !== index);
                              setFieldValue("attachments", updated);
                            }}
                          >
                            <Icon name="close" size={20} color="#888" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ),
          },
          {
            id: "checklist",
            title: "Checklist",
            disabled: !itineraryActivity?.id,
            content: (
              <View className="flex-1 pb-6 pt-2 px-5">

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Add To-Do item"
                  onPress={() => {
                    if (itineraryActivity) {
                      openChecklistModal(null, [itineraryActivity], travelId);
                    }
                  }}
                  className="flex-row items-center gap-1 mb-2 p-2 "
                >
                  <Icon name="add" size={24} color="#263F69" />
                  <Text className="text-lg font-medium text-accent underline">Add To-Do item</Text>
                </TouchableOpacity>
                {/* 
                             <Button
                              mode="text"
                              icon="plus"
                              onPress={handleAddAttachmentPress}
                              disabled={updateMutation.isPending}
                              textColor="#263F69"
                              style={[styles.addAttachmentButtonEmpty, { }]}
                              labelStyle={styles.addAttachmentButtonLabel}
                              accessibilityRole="button"
                              accessibilityLabel="Add attachment"
                            >
            {updateMutation.isPending ? "Adding..." : "Add Attachment"}
          </Button> */}
                {/* Existing items */}
                {activityChecklistItems.length > 0 && (
                  <View className="bg-white rounded-[16px] border border-gray-100 overflow-hidden">
                    {activityChecklistItems.map((item) => (
                      <View
                        key={item.id}
                        className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-50"
                      >
                        <TouchableOpacity
                          accessibilityRole="checkbox"
                          onPress={() => handleToggleChecklistItem(item)}
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center shrink-0 ${item.isDone ? "bg-[#263F69] border-[#263F69]" : "border-[#263F69]"
                            }`}
                        >
                          {item.isDone && <Icon name="check" size={14} color="#FFF" />}
                        </TouchableOpacity>
                        <View className="flex-1">
                          <Text className={`text-lg ${item.isDone ? "line-through text-gray-400" : "text-gray-800 font-medium"}`}>
                            {item.title}
                          </Text>
                          {item.description ? (
                            <Text className="text-base text-gray-400 mt-0.5">{item.description}</Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Edit checklist item"
                          onPress={() => {
                            if (itineraryActivity) {
                              openChecklistModal(
                                item,
                                [itineraryActivity],
                                travelId
                              );
                            }
                          }}
                          className="p-1 mr-1"
                        >
                          <Icon name="edit" size={20} color="#263F69" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Remove checklist item"
                          onPress={() => handleDeleteChecklistItem(item)}
                          className="p-1"
                        >
                          <Icon name="delete-outline" size={20} color="#c93030" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ),
          },
        );

        return (
          <View className="flex-1 bg-gray-100 overflow-hidden">
            <StatusBar barStyle={"dark-content"} />
            <FormikErrorScroller
              scrollViewRef={scrollViewRef}
              fieldRefs={fieldRefs}
              activeTabId={activeTabId}
              setActiveTabId={setActiveTabId}
            />
            <FormInitHandler
              values={values}
              setFieldValue={setFieldValue}
              itineraryActivity={itineraryActivity}
              onOpenPrimaryTypeModal={onOpenPrimaryTypeModal}
              openFlightModal={openFlightModal}
              handleFlightSelect={handleFlightSelect}
            />

            <View className="flex-1 py-3 ">
              <Tabs
                tabs={tabData}
                activeTabId={activeTabId}
                onTabChange={setActiveTabId}
                type="default"
                onScroll={onScroll}
                scrollViewRef={scrollViewRef}
              />
            </View>

            {!(isKeyboardVisible && isChecklistFocused) && (
              <View className="mb-8 mx-4 bg-transparent">
                <TouchButton
                  buttonText={itineraryActivity?.id ? "Update Activity" : "Create Activity"}
                  onPress={() => handleSubmit()}
                  disabled={isPending || updateMutation.isPending}
                  className="h-7xl p-6"
                />
              </View>
            )}

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
              destination={travelPlan?.travel?.destination || travelPlan?.travel?.destinationData?.city || travelPlan?.travel?.destinationData?.country || ""}
              destinationCoordinates={travelPlan?.travel?.destinationData?.coordinates}
              country={travelPlan?.travel?.destinationData?.country}
              onSelect={(location: PinnedLocation) => {
                if (mapPinTargetField) {
                  setFieldValue(mapPinTargetField, location.address || location.name || "");
                }
                setShowMapPinModal(false);
              }}
            />

            <ActivityCalendarModal
              visible={showCalendarFor !== null}
              showCalendarFor={showCalendarFor}
              startDate={values.startDate}
              endDate={values.endDate}
              onClose={handleCloseCalendar}
              setFieldValue={setFieldValue}
              tripStartDate={travelPlan?.travel?.startOrDepartureDate}
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
                  setValues({ ...values, startTime: timeString } as any);
                } else {
                  setValues({ ...values, endTime: timeString } as any);
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
                    if (values.flightDetails?.arrivalDate && new Date(values.flightDetails.arrivalDate).getTime() < date.getTime()) {
                      setFieldValue("flightDetails.arrivalDate", date);
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

            {/* Preparation Deadline Picker */}
            <DateTimePickerModal
              isVisible={showPreparationDeadlinePicker}
              mode="datetime"
              date={(() => {
                const v = values.preparationDetails?.deadlineDateTime;
                if (v) { const d = new Date(v); return isNaN(d.getTime()) ? new Date() : d; }
                const fallbackDate = values.startDate || currentSection?.startDate || travelPlan?.travel?.startOrDepartureDate;
                if (fallbackDate) { const d = new Date(fallbackDate); if (!isNaN(d.getTime())) return d; }
                return new Date();
              })()}
              onConfirm={(date) => {
                setFieldValue("preparationDetails.deadlineDateTime", date);
                setShowPreparationDeadlinePicker(false);
              }}
              onCancel={() => setShowPreparationDeadlinePicker(false)}
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

            {/* Hike Or Camp Date Pickers */}
            <DateTimePickerModal
              isVisible={showHikeOrCampDatePickerFor !== null}
              mode="datetime"
              minimumDate={(() => {
                if (showHikeOrCampDatePickerFor === "checkoutDateTime" && values.hikeOrCampDetails?.checkinDateTime) {
                  const d = new Date(values.hikeOrCampDetails.checkinDateTime);
                  if (!isNaN(d.getTime())) return d;
                }
                return undefined;
              })()}
              date={(() => {
                const targetVal = showHikeOrCampDatePickerFor && values.hikeOrCampDetails?.[showHikeOrCampDatePickerFor];
                if (targetVal) { const d = new Date(targetVal); if (!isNaN(d.getTime())) return d; }
                if (showHikeOrCampDatePickerFor === "checkoutDateTime") {
                  const checkinVal = values.hikeOrCampDetails?.checkinDateTime;
                  if (checkinVal) { const d = new Date(checkinVal); if (!isNaN(d.getTime())) return d; }
                }
                const fallbackDate = values.startDate || currentSection?.startDate || travelPlan?.travel?.startOrDepartureDate;
                if (fallbackDate) { const d = new Date(fallbackDate); if (!isNaN(d.getTime())) return d; }
                return new Date();
              })()}
              onConfirm={(date) => {
                if (showHikeOrCampDatePickerFor === "checkinDateTime") {
                  setFieldValue("hikeOrCampDetails.checkinDateTime", date);
                  if (values.hikeOrCampDetails?.checkoutDateTime && new Date(values.hikeOrCampDetails.checkoutDateTime).getTime() < date.getTime()) {
                    setFieldValue("hikeOrCampDetails.checkoutDateTime", date);
                  }
                } else if (showHikeOrCampDatePickerFor === "checkoutDateTime") {
                  setFieldValue("hikeOrCampDetails.checkoutDateTime", date);
                }
                setShowHikeOrCampDatePickerFor(null);
              }}
              onCancel={() => setShowHikeOrCampDatePickerFor(null)}
            />
          </View>
        );
      }}
    </Formik>
  );
};

export default EditActivity;

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

interface ActivityCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  showCalendarFor: "startDate" | "endDate" | null;
  startDate: string | null;
  endDate: string | null;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  tripStartDate?: Date | string | null;
}

const ACTIVITY_CALENDAR_THEME = {
  todayTextColor: "#263F69",
  todayBackgroundColor: "#E3F2FD",
  selectedDayBackgroundColor: "#263F69",
  selectedDayTextColor: "#ffffff",
  textDayFontWeight: "600",
  textMonthFontWeight: "800",
  textMonthFontSize: 18,
};

const formatDateToYYYYMMDD = (dateVal: any) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const ActivityCalendarModal: React.FC<ActivityCalendarModalProps> = React.memo(({
  visible,
  onClose,
  showCalendarFor,
  startDate,
  endDate,
  setFieldValue,
  tripStartDate,
}) => {
  const { colors } = useTheme();

  const initialDate = useMemo(() => {
    const selectedDate = (showCalendarFor === "startDate" ? startDate : endDate);
    if (selectedDate) return selectedDate;

    const formattedTripStart = formatDateToYYYYMMDD(tripStartDate);
    if (formattedTripStart) return formattedTripStart;

    return formatDateToYYYYMMDD(new Date())!;
  }, [showCalendarFor, startDate, endDate, tripStartDate]);

  const markedDates = useMemo(() => {
    return {
      [initialDate]: {
        selected: true,
        selectedColor: "#263F69",
      },
    };
  }, [initialDate]);

  const handleDayPress = useCallback(
    (day: any) => {
      if (showCalendarFor) {
        setFieldValue(showCalendarFor, day.dateString);
      }
      onClose();
    },
    [showCalendarFor, setFieldValue, onClose]
  );

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white pt-12">
        <View className="flex-row justify-between items-center p-5 border-b border-gray-200 bg-white">
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close date selector"
          >
            <Icon name="close" size={28} color={colors.onSurface} />
          </TouchableOpacity>
          <Text className="text-xl font-bold">Select Date</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1">
          <CalendarList
            current={initialDate}
            pastScrollRange={12}
            futureScrollRange={24}
            scrollEnabled={true}
            horizontal={false}
            showsVerticalScrollIndicator={true}
            hideArrows={true}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={ACTIVITY_CALENDAR_THEME}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={5}
            initialNumToRender={4}
          />
        </View>
      </View>
    </Modal>
  );
});


