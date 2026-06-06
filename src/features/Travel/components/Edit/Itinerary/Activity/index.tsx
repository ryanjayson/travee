import { MAPBOX_ACCESS_TOKEN } from "@env";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Formik, useFormikContext } from "formik";
import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  LayoutAnimation,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { TextInput, useTheme } from "react-native-paper";
import { CalendarList } from "react-native-calendars";
import * as Yup from "yup";
import ActivityIcon, { activityIcons } from "../../../../../../components/ActivityIcon";
import TouchButton from "../../../../../../components/atoms/TouchButton";
import Tabs from "../../../../../../components/Tabs";
import SimpleAccordion from "../../../../../../components/Accordion/Simple";
import FlightTab from "./Tabs/FlightTab";
import AccomodationTab from "./Tabs/AccomodationTab";
import { useTravelContext } from "../../../../../../context/TravelContext";
import { useLexicographicSort } from "../../../../../../hooks/useLexicographicSort";
import { ActivityType, getActivityTypeLabel } from "../../../../../../types/enums";
import { useAuth } from "../../../../../Auth/hooks/AuthContext";
import { useDeleteActivityMutation, useUpdateActivityMutation } from "../../../../hooks/useActivity";
import { useChecklistItems, useDeleteChecklistItemMutation, useSaveChecklistItemMutation, useToggleChecklistItemMutation } from "../../../../hooks/useChecklist";
import { useTravelPlan } from "../../../../hooks/useTravel";
import { DestinationDto, Images, ItineraryActivity, Attachment } from "../../../../types/TravelDto";
import ActivityTypeLookupModal from "../../../Lookups/ActivityTypeLookupModal";
import SectionLookupModal from "../../../Lookups/SectionLookupModal";
import MapboxDestinationSelector, { MapboxPlace } from "../../../MapboxDestinationSelector";
import PoiLookupModal, { MapboxPoi } from "../../../Lookups/PoiLookupModal";
import { useConfirm } from "../../../../../../context/ConfirmContext";
import { useToast } from "../../../../../../context/ToastContext";
import DescriptionInput from "../../../../../../components/molecules/DescriptionInput";

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
  onScroll?: (event: any) => void;
  onChildModalToggle?: (isOpen: boolean) => void;
}

const TravelSchema = Yup.object().shape({
  title: Yup.string().required("Activity title is required").min(2, "Activity title is too short, make it more descriptive"),
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
    checkinDateTime: Date | string | null;
    checkoutDateTime?: Date | string | null;
    websiteAddress?: string | null;
    bookingReference?: string | null;
    bookingStatus?: string | null;
    contactNumber?: string | null;
    emailAddress?: string | null;
    contactName?: string | null;
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
            openFlightModal((flightData: any) => {
              handleFlightSelect(flightData, setFieldValue);
            });
          }
        });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [itineraryActivity?.id]);

  return null;
};

const EditActivity = ({
  itinerarySectionId,
  itineraryActivity,
  onClose,
  onScroll,
  onChildModalToggle,
  onOpenSectionModal,
  onOpenPrimaryTypeModal,
}: EditActivityProps) => {
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
    if (!dateVal) return "Not Set";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Not Set";
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
    
    // 4. Start Date: YYYY-MM-DD
    const year = departureDate.getFullYear();
    const month = String(departureDate.getMonth() + 1).padStart(2, '0');
    const day = String(departureDate.getDate()).padStart(2, '0');
    setFieldValue("startDate", `${year}-${month}-${day}`);
    
    // 5. Start Time: HH:MM
    const hours = String(departureDate.getHours()).padStart(2, '0');
    const minutes = String(departureDate.getMinutes()).padStart(2, '0');
    setFieldValue("startTime", `${hours}:${minutes}`);
    
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
    setFieldValue("flightDetails.departureDate", departureDate);
  };

  const [showDestinationModal, setShowDestinationModal] =
    useState<boolean>(false);
  const [isAllDay, setIsAllDay] = useState<boolean>(true);
  const [showTimePickerFor, setShowTimePickerFor] = useState<"startTime" | "endTime" | null>(null);
  const [showCalendarFor, setShowCalendarFor] = useState<"startDate" | "endDate" | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const [isChecklistFocused, setIsChecklistFocused] = useState<boolean>(false);
  const [showFlightDatePickerFor, setShowFlightDatePickerFor] = useState<"departureDate" | "arrivalDate" | null>(null);
  const [showAccomodationDatePickerFor, setShowAccomodationDatePickerFor] = useState<"checkinDateTime" | "checkoutDateTime" | null>(null);
  const [showPoiModal, setShowPoiModal] = useState<boolean>(false);
  const [poiModalInitialCategory, setPoiModalInitialCategory] = useState<"accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp">("accommodation");
  const scrollViewRef = useRef<ScrollView>(null);
  const fieldRefs = useRef<{ [key: string]: any }>({});
  const [activeTabId, setActiveTabId] = useState<string>(
    itineraryActivity?.type === ActivityType.flight ? "flight" : "details"
  );

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

  const isAnyChildModalOpen = showDestinationModal || (showCalendarFor !== null) || showPoiModal;

  useEffect(() => {
    onChildModalToggle?.(isAnyChildModalOpen);
  }, [isAnyChildModalOpen, onChildModalToggle]);



  const updateMutation = useUpdateActivityMutation();
  const { selectedTravelPlan, openFlightModal } = useTravelContext();
  const { userToken } = useAuth();
  const { mutate: deleteActivityMutation, isPending } =
    useDeleteActivityMutation();
  const { generateSortOrder } = useLexicographicSort();
  const {
    data: travelPlan,
  } = useTravelPlan(selectedTravelPlan?.id || "");
  const currentSection = travelPlan?.itinerarySection?.find(s => s.id === itinerarySectionId);
  const { confirm } = useConfirm();

  // Checklist state
  const [newCheckTitle, setNewCheckTitle] = useState("");
  const [newCheckDescription, setNewCheckDescription] = useState("");
  const [showCheckDescription, setShowCheckDescription] = useState(false);
  const { showToast } = useToast();

  const pickDocument = async (setFn: (field: string, value: any) => void, currentAttachments: Attachment[]) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
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
  const travelId = selectedTravelPlan?.id || "";
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
      selectedTravelPlan &&
      selectedTravelPlan?.id
    ) {

      // Build proper Date objects from strings
      let finalStartDate: Date | undefined = undefined;
      if (values.type === ActivityType.flight && values.flightDetails?.departureDate) {
        finalStartDate = new Date(values.flightDetails.departureDate);
      } else if (values.type === ActivityType.accomodation && values.accomodationDetails?.checkinDateTime) {
        finalStartDate = new Date(values.accomodationDetails.checkinDateTime);
      } else if (values.startDate) {
        finalStartDate = new Date(`${values.startDate}T${values.startTime}:00`);
      }

      let finalEndDate: Date | undefined = undefined;
      if (values.type === ActivityType.flight && values.flightDetails?.arrivalDate) {
        finalEndDate = new Date(values.flightDetails.arrivalDate);
      } else if (values.type === ActivityType.accomodation && values.accomodationDetails?.checkoutDateTime) {
        finalEndDate = new Date(values.accomodationDetails.checkoutDateTime);
      } else if (values.endDate) {
        finalEndDate = new Date(`${values.endDate}T${values.endTime}:00`);
      }

      let finalSortOrder = values.sortOrder || "";

      const oldStartDate = itineraryActivity?.startDate ? new Date(itineraryActivity.startDate).getTime() : null;
      const newStartDate = finalStartDate ? finalStartDate.getTime() : null;
      const dateChanged = oldStartDate !== newStartDate;

      // If creating a new activity, or if the user changed the date/time, generate a new sortOrder
      if (!itineraryActivity?.id || dateChanged) {
        const currentSection = travelPlan?.itinerarySection?.find(s => s.id === (values.sectionId || ""));
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
                : new Date(),
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
              checkinDateTime: values.accomodationDetails.checkinDateTime
                ? new Date(values.accomodationDetails.checkinDateTime)
                : new Date(),
              checkoutDateTime: values.accomodationDetails.checkoutDateTime
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
      };

      await updateMutation.mutateAsync(payload);
      showToast({
        type: "success",
        message: values.id ? "Activity updated successfully!" : "Activity created successfully!",
      });
      onClose();
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (itinerarySectionId && activityId) {
      const isConfirmed = await confirm({
        title: "Delete Activity",
        message: "Are you sure you want to delete this activity? All associated expenses, notes, and checklist items will also be permanently deleted. This action is irreversible.",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger",
      });

      if (isConfirmed) {
        deleteActivityMutation({
          sectionId: itinerarySectionId,
          activityId: activityId,
        });
        onClose();
      }
    }
  };

  return (
    <Formik<ActivityFormValues>
      enableReinitialize={true}
      initialValues={{
        travelId: selectedTravelPlan?.id,
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
          departureDate: itineraryActivity?.flightDetails?.departureDate
            ? new Date(itineraryActivity.flightDetails.departureDate)
            : (itineraryActivity?.type === ActivityType.flight && itineraryActivity?.startDate
                ? new Date(itineraryActivity.startDate)
                : null),
          arrivalDate: itineraryActivity?.flightDetails?.arrivalDate
            ? new Date(itineraryActivity.flightDetails.arrivalDate)
            : (itineraryActivity?.type === ActivityType.flight && itineraryActivity?.endDate
                ? new Date(itineraryActivity.endDate)
                : null),
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
          checkinDateTime: itineraryActivity?.accomodationDetails?.checkinDateTime
            ? new Date(itineraryActivity.accomodationDetails.checkinDateTime)
            : (itineraryActivity?.type === ActivityType.accomodation && itineraryActivity?.startDate
                ? new Date(itineraryActivity.startDate)
                : null),
          checkoutDateTime: itineraryActivity?.accomodationDetails?.checkoutDateTime
            ? new Date(itineraryActivity.accomodationDetails.checkoutDateTime)
            : (itineraryActivity?.type === ActivityType.accomodation && itineraryActivity?.endDate
                ? new Date(itineraryActivity.endDate)
                : null),
          websiteAddress: itineraryActivity?.accomodationDetails?.websiteAddress || "",
          bookingReference: itineraryActivity?.accomodationDetails?.bookingReference || "",
          bookingStatus: itineraryActivity?.accomodationDetails?.bookingStatus || "",
          contactNumber: itineraryActivity?.accomodationDetails?.contactNumber || "",
          emailAddress: itineraryActivity?.accomodationDetails?.emailAddress || "",
          contactName: itineraryActivity?.accomodationDetails?.contactName || "",
        },
      }}
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
      }) => {
        const { colors } = useTheme();
        const sections = travelPlan?.itinerarySection || [];
        const hasSections = sections.length > 0;
        const selectedSection = sections.find((s) => s.id === values.sectionId);
        const selectedSectionName = selectedSection?.isDefaultSection ? "(Ungrouped)" :  selectedSection?.title || "";

        const tabData = [];

        if (values.type === ActivityType.flight) {
          tabData.push({
            id: "flight",
            title: "Flight",
            content: (
              <FlightTab
                values={values}
                handleChange={handleChange}
                handleBlur={handleBlur}
                setFieldValue={setFieldValue}
                colors={colors}
                openFlightModal={openFlightModal}
                setShowFlightDatePickerFor={setShowFlightDatePickerFor}
                formatFlightDateTime={formatFlightDateTime}
                handleFlightSelect={handleFlightSelect}
                fieldRefs={fieldRefs}
              />
            ),
          });
        }


        tabData.push(
          {
            id: "details",
            title: "Details",
            content: (
              <View className="flex-1 pt-2 px-5">
                {/* Title */}
                <View ref={(el) => { fieldRefs.current["title"] = el; }} className="mb-5">
                  <Text className="text-xs font-semibold tracking-wider uppercase">Title</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="e.g. Museum Visit"
                    value={values.title}
                    onChangeText={handleChange("title")}
                    onBlur={handleBlur("title")}
                    error={touched.title && Boolean(errors.title)}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#263F69"
                    theme={{ colors: { onSurfaceVariant: '#888' } }}
                    outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                    style={{ marginTop: 6, height: 64 }}
                    contentStyle={{ backgroundColor: "transparent" }}
                  />
                  {touched.title && errors.title && (
                    <Text className="text-red-500 text-xs mt-1 ml-1">{errors.title}</Text>
                  )}
                </View>


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
                      onOpenPoiModal={(category: "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp") => {
                        setPoiModalInitialCategory(category);
                        setShowPoiModal(true);
                      }}
                      noPadding={true}
                      fieldRefs={fieldRefs}
                    />
                )}


                {/* Activity Details Accordion */}
                <SimpleAccordion key="activity-details-accordion" title="Activity Details" defaultExpanded={true}>


                  {/* Date & Time */}
                  {values.type !== ActivityType.flight && values.type !== ActivityType.accomodation && (
                    <View ref={(el) => { fieldRefs.current["startDate"] = el; }} className="mb-5">
                      <Text className="text-xs font-semibold tracking-wider uppercase">Date & Time</Text>
                      <View className="flex-row items-center gap-4 mt-2">
                        <View className="border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center h-[64px]">
                          <TouchableOpacity 
                            onPress={() => setShowCalendarFor("startDate")}
                            className="flex-1 flex-row items-center p-5 gap-2"
                            accessibilityRole="button"
                          >
                            <Icon name="calendar-today" size={24} color="#999" />
                            <Text className={`text-md font-medium ${values.startDate ? "text-gray-800" : "text-gray-500"}`}>
                              {values.startDate ? String(values.startDate) : "Date"}
                            </Text>
                          </TouchableOpacity>
                          {values.startDate && (
                            <TouchableOpacity 
                              onPress={() => setValues({...values, startDate: null, startTime: ""} as any)}
                              className="pr-4 py-3"
                              accessibilityRole="button"
                            >
                              <Icon name="close" size={22} color="#999" />
                            </TouchableOpacity>
                          )}
                        </View>
                        <View className="border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center h-[64px]">
                          <TouchableOpacity 
                            onPress={() => setShowTimePickerFor("startTime")}
                            className="flex-1 flex-row items-center p-5 gap-2"
                            accessibilityRole="button"
                          >
                            <Icon name="access-time" size={24} color="#888" />
                            <Text className={`text-md font-medium ${values.startDate ? "text-gray-800" : "text-gray-500"}`}>
                              {values.startTime ? String(values.startTime) : "Time"}
                            </Text>
                          </TouchableOpacity>
                          {values.startTime !== "" && (
                            <TouchableOpacity 
                              onPress={() => setValues({...values, startTime: ""} as any)}
                              className="pr-4 py-3"
                              accessibilityRole="button"
                            >
                              <Icon name="close" size={22} color="#999" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Location */}
                  <View ref={(el) => { fieldRefs.current["destination"] = el; }} className="mb-5">
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
                  </View>

                  
                  {/* Activity Type */}
                  <View ref={(el) => { fieldRefs.current["type"] = el; }} className="mb-5">
                    <Text className="text-xs font-semibold tracking-wider uppercase mb-1">Activity Type</Text>
                    {(() => {
                      const isTypeDisabled = !!values.id && values.type !== ActivityType.none;
                      return (
                        <TouchableOpacity 
                          onPress={() => {
                            onOpenPrimaryTypeModal(values.type as ActivityType, (type) => {
                              setFieldValue("type", type);
                              if (type === ActivityType.flight) {
                                setActiveTabId("flight");
                                openFlightModal((flightData: any) => {
                                  handleFlightSelect(flightData, setFieldValue);
                                });
                              } else {
                                setActiveTabId("details");
                              }
                            });
                          }}
                          disabled={isTypeDisabled}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: isTypeDisabled }}
                          className={`border rounded-2xl h-7xl border-[#E0E0E0] px-4 py-4 mt-1 flex-row items-center gap-3 ${
                            isTypeDisabled ? "bg-gray-100 opacity-60" : "bg-white"
                          }`}
                        >
                          {values.type != null ? (
                            <ActivityIcon type={values.type as number} size={24} showIconOnly={true} />
                          ) : (
                            <Icon name="style" size={24} color={"#B3B3B3"} />
                          )}
                          <Text className="text-base text-gray-800 capitalize font-medium">
                            {values.type != null ? getActivityTypeLabel(values.type) : "Select Type..."}
                          </Text>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>


                  {/* Itinerary Section */}
                  <View ref={(el) => { fieldRefs.current["sectionId"] = el; }} className="mb-5">
                    <Text className="text-xs font-semibold tracking-wider uppercase mb-1">Section</Text>
                    <Text className={`text-base text-gray-400 opacity-80`}>
                      Select the itinerary section where you want to add this activity.
                    </Text>
                    <TouchableOpacity 
                      onPress={() => {
                        if (hasSections) {
                          onOpenSectionModal(sections, values.sectionId, (id) => {
                            setFieldValue("sectionId", id);
                          });
                        }
                      }}
                      disabled={!hasSections}
                      className={`border rounded-2xl h-7xl border-[#E0E0E0] bg-white px-4 py-4 mt-1 flex-row items-center gap-3 ${!hasSections ? 'opacity-50 bg-gray-100' : ''}`}
                      accessibilityRole="button"
                      accessibilityLabel="Select itinerary section"
                    >
                      <Icon name="folder" size={24} color={hasSections ? "#263F69" : "#B3B3B3"} />
                      <Text className={`text-base flex-1 font-medium ${selectedSectionName ? 'text-gray-800' : 'text-gray-400'}`}>
                        {selectedSectionName || (hasSections ? "Select Section..." : "No Sections Available")}
                      </Text>
                      {hasSections && <Icon name="keyboard-arrow-down" size={24} color="#666" />}
                    </TouchableOpacity>
                  </View>
           
                  {/* Description */}
                  <View ref={(el) => { fieldRefs.current["description"] = el; }} className="mb-5">
                    <Text className="text-xs font-semibold tracking-wider uppercase">Description</Text>
                    <DescriptionInput
                      value={values.description}
                      onChange={(text) => setFieldValue("description", text)}
                      label="Description"
                      placeholder="Activity details..."
                      confirmLabel="Add"
                    />
                  </View>
                </SimpleAccordion>

                {/* Delete Activity */}
                {itineraryActivity?.id && (
                  <View className="mt-2 pt-4  rounded-md h-7xl border-0 bg-gray-200">
                    <TouchableOpacity 
                      className="flex-row items-center gap-2.5 justify-center py-2"
                      onPress={() => handleDeleteActivity(itineraryActivity?.id || "")}
                      disabled={isPending}
                      accessibilityRole="button"
                    >
                      <Icon name="delete-outline" size={24} color={"#c93030"} />
                      <Text className="text-base capitalize font-medium text-[#c93030]">
                        Delete Activity
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
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
                  className="border-2 border-dashed border-[#ddd] h-[140px] rounded-[16px] bg-white px-4 py-4 flex-row items-center justify-center gap-3 mb-4"
                  accessibilityRole="button"
                  accessibilityLabel="Upload files"
                >
                  <Icon name="attach-file" size={28} color="#263F69" />
                  <Text className="text-base text-[#263F69] font-medium">Attach Files</Text>
                </TouchableOpacity>

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
                <View className="flex-row items-center gap-2 mb-3">
                  <Text className="text-xs font-semibold tracking-wider uppercase flex-1">Checklist Items</Text>
                  {activityId && (
                    <Text className="text-xs text-gray-500 font-medium">
                      {activityChecklistItems.filter(i => i.isDone).length}/{activityChecklistItems.length} Done
                    </Text>
                  )}
                </View>

                {activityId ? (
                  <View className="bg-white border border-[#ddd] rounded-2xl p-4 mb-4">
                    <TextInput
                      mode="outlined"
                      placeholder="e.g. Bring passport..."
                      onChangeText={setNewCheckTitle}
                      onSubmitEditing={handleAddChecklistItem}
                      value={newCheckTitle}
                      returnKeyType="done"
                      outlineColor="#E0E0E0"
                      activeOutlineColor="#263F69"
                      theme={{ colors: { onSurfaceVariant: '#888' } }}
                      outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                      style={{ height: 64 }}
                      contentStyle={{ backgroundColor: "transparent" }}
                      onFocus={() => setIsChecklistFocused(true)}
                      onBlur={() => setIsChecklistFocused(false)}
                    />

                    {showCheckDescription ? (
                      <TextInput
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        value={newCheckDescription}
                        placeholder="Optional description..."
                        onChangeText={setNewCheckDescription}
                        onSubmitEditing={handleAddChecklistItem}
                        returnKeyType="done"
                        outlineColor="#E0E0E0"
                        activeOutlineColor="#263F69"
                        theme={{ colors: { onSurfaceVariant: '#888' } }}
                        outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                        style={{ marginTop: 6, marginBottom: 12, height: 105 }}
                        textAlignVertical="top"
                        contentStyle={{ backgroundColor: "transparent" }}
                        onFocus={() => setIsChecklistFocused(true)}
                        onBlur={() => setIsChecklistFocused(false)}
                      />
                    ) : (
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => setShowCheckDescription(true)}
                        className="mb-4 mt-3"
                      >
                        <Text className="text-xs text-[#263F69] font-medium">+ Add description</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={handleAddChecklistItem}
                      disabled={!newCheckTitle.trim() || saveChecklistItem.isPending}
                      style={{ backgroundColor: "#FFF", opacity: newCheckTitle.trim() ? 1 : 0.6 }}
                      className="flex-row items-center border border-primary justify-center gap-2 py-3 rounded-[16px]"
                    >
                      {saveChecklistItem.isPending ? (
                        <ActivityIndicator size="small" color="#263F69" />
                      ) : (
                        <>
                          <Icon name="add" size={18} color="#263F69" />
                          <Text className="text-sm font-semibold text-primary">Add Item</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="bg-gray-50 border border-dashed border-gray-200 rounded-[16px] p-5 items-center mb-4">
                    <Text className="text-xs text-gray-400 text-center">
                      Save the activity first to enable checklist items.
                    </Text>
                  </View>
                )}

                {/* Existing items */}
                {activityChecklistItems.length > 0 && (
                  <View className="bg-white rounded-[16px] border border-gray-100 overflow-hidden">
                    {activityChecklistItems.map((item) => (
                      <View
                        key={item.id}
                        className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-50"
                      >
                        <TouchableOpacity
                          accessibilityRole="checkbox"
                          onPress={() => handleToggleChecklistItem(item)}
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center shrink-0 ${
                            item.isDone ? "bg-[#263F69] border-[#263F69]" : "border-[#263F69]"
                          }`}
                        >
                          {item.isDone && <Icon name="check" size={14} color="#FFF" />}
                        </TouchableOpacity>
                        <View className="flex-1">
                          <Text className={`text-base ${item.isDone ? "line-through text-gray-400" : "text-gray-800 font-medium"}`}>
                            {item.title}
                          </Text>
                          {item.description ? (
                            <Text className="text-xs text-gray-400 mt-0.5">{item.description}</Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Remove checklist item"
                          onPress={() => handleDeleteChecklistItem(item)}
                          className="p-1 opacity-40"
                        >
                          <Icon name="delete-outline" size={18} color="#c93030" />
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

            <View className="flex-1">
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
                   buttonText={itineraryActivity?.id ? "Update Activity" : "Add Activity"}
                   onPress={() => handleSubmit()}
                   disabled={isPending}
                   className="h-7xl p-6"
                 />
               </View>
            )}

            <Modal
              visible={showDestinationModal}
              animationType="slide"
              transparent
              onRequestClose={() => setShowDestinationModal(false)}
            >
              <MapboxDestinationSelector
                onClose={() => setShowDestinationModal(false)}
                onSelect={(place: MapboxPlace) => {
                  setValues({
                    ...values,
                    destination: place.fullName,
                    destinationData: {
                      id: place.id,
                      coordinates: {
                        longitude: place.coordinates.longitude,
                        latitude: place.coordinates.latitude,
                      },
                    } as DestinationDto
                  });
                  setShowDestinationModal(false);
                }}
              />
            </Modal>

            <Modal
              visible={showPoiModal}
              animationType="slide"
              transparent
              onRequestClose={() => setShowPoiModal(false)}
            >
              <PoiLookupModal
                visible={showPoiModal}
                onClose={() => setShowPoiModal(false)}
                initialCategory={poiModalInitialCategory}
                proximity={travelPlan?.travel?.destinationData?.coordinates}
                onSelect={(poi: MapboxPoi) => {
                  setFieldValue("accomodationDetails.accomodationName", poi.name);
                  if (poi.address) {
                    setFieldValue("accomodationDetails.address", poi.address);
                  }
                  if (poi.website) {
                    setFieldValue("accomodationDetails.websiteAddress", poi.website);
                  }
                  if (poi.phone) {
                    setFieldValue("accomodationDetails.contactNumber", poi.phone);
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

            <Modal 
              visible={showCalendarFor !== null} 
              transparent={false} 
              animationType="slide"
              onRequestClose={() => setShowCalendarFor(null)}
            >
              <View className="flex-1 bg-white pt-12">
                <View className="flex-row justify-between items-center p-5 border-b border-gray-200 bg-white">
                  <TouchableOpacity 
                    onPress={() => setShowCalendarFor(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Close date selector"
                  >
                    <Icon name="close" size={28} color="#333" />
                  </TouchableOpacity>
                  <Text className="text-xl font-bold">Select Date</Text>
                  <View className="w-10" />
                </View>

                <View className="flex-1">
                  <CalendarList
                    current={(showCalendarFor === "startDate" ? values.startDate : values.endDate) || undefined}
                    pastScrollRange={12}
                    futureScrollRange={24}
                    scrollEnabled={true}
                    horizontal={false}
                    showsVerticalScrollIndicator={true}
                    hideArrows={true}
                    onDayPress={(day: any) => {
                      if (showCalendarFor === "startDate") {
                        setValues({ ...values, startDate: day.dateString });
                      } else {
                        setValues({ ...values, endDate: day.dateString });
                      }
                      setShowCalendarFor(null);
                    }}
                    markedDates={{
                      [(showCalendarFor === "startDate" ? values.startDate : values.endDate) || ""]: {
                        selected: true,
                        selectedColor: '#263F69',
                      }
                    }}
                    theme={{
                      todayTextColor: '#263F69',
                      todayBackgroundColor: '#E3F2FD',
                      textDayFontWeight: 'bold',
                      selectedDayBackgroundColor: '#263F69',
                      selectedDayTextColor: '#ffffff',
                    }}
                  />
                </View>
              </View>
            </Modal>



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
              date={(() => {
                const targetVal = showFlightDatePickerFor && values.flightDetails?.[showFlightDatePickerFor];
                if (targetVal) {
                  const d = new Date(targetVal);
                  return isNaN(d.getTime()) ? new Date() : d;
                }
                return new Date();
              })()}
              onConfirm={(date) => {
                if (showFlightDatePickerFor) {
                  setFieldValue(`flightDetails.${showFlightDatePickerFor}`, date);
                }
                setShowFlightDatePickerFor(null);
              }}
              onCancel={() => setShowFlightDatePickerFor(null)}
            />

            <DateTimePickerModal
              isVisible={showAccomodationDatePickerFor !== null}
              mode="datetime"
              date={(() => {
                const targetVal = showAccomodationDatePickerFor && values.accomodationDetails?.[showAccomodationDatePickerFor];
                if (targetVal) {
                  const d = new Date(targetVal);
                  return isNaN(d.getTime()) ? new Date() : d;
                }
                return new Date();
              })()}
              onConfirm={(date) => {
                if (showAccomodationDatePickerFor) {
                  setFieldValue(`accomodationDetails.${showAccomodationDatePickerFor}`, date);
                }
                setShowAccomodationDatePickerFor(null);
              }}
              onCancel={() => setShowAccomodationDatePickerFor(null)}
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
      if (firstErrorKey.startsWith("flightDetails.")) {
        targetTab = "flight";
      }

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


