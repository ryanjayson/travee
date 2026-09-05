// TravelContext.js
import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  FC,
  ReactNode,
  useContext,
} from "react";
import {
  TravelPlanDetail,
  TravelContextType,
  ExpenseModalState,
  NoteModalState,
  ChecklistModalState,
  ChecklistGroupModalState,
  ActivityModalState,
  ActivityTypeModalState,
  MemberModalState,
  DescriptionModalState,
  DestinationModalState,
  FlightModalState,
  SectionModalState,
} from "../types/context/travel";
import { MapboxPlace } from "../features/Travel/components/MapboxDestinationSelector";
import {
  ItineraryExpense,
  ItineraryActivity,
  ItineraryNote,
  ChecklistItem,
  TripMember,
  ItinerarySection,
} from "../features/Travel/types/TravelDto";
import { ActivityType } from "../types/enums";

const initialContextValue: TravelContextType = {
  expenseModal: {
    visible: false,
    itineraryExpense: null,
  },
  openExpenseModal: () => {},
  closeExpenseModal: () => {},

  noteModal: {
    visible: false,
    itineraryNote: null,
  },
  openNoteModal: () => {},
  closeNoteModal: () => {},

  checklistModal: {
    visible: false,
    checklistItem: null,
    travelId: "",
  },
  openChecklistModal: () => {},
  closeChecklistModal: () => {},

  checklistGroupModal: {
    visible: false,
    travelId: "",
  },
  openChecklistGroupModal: () => {},
  closeChecklistGroupModal: () => {},

  activityModal: {
    visible: false,
    itineraryActivity: null,
  },
  openActivityModal: () => {},
  closeActivityModal: () => {},

  activityTypeModal: {
    visible: false,
  },
  openActivityTypeModal: () => {},
  closeActivityTypeModal: () => {},

  memberModal: {
    visible: false,
    editingMember: null,
    travelId: "",
  },
  openMemberModal: () => {},
  closeMemberModal: () => {},

  descriptionModal: {
    visible: false,
    value: "",
    onConfirm: () => {},
  },
  openDescriptionModal: () => {},
  closeDescriptionModal: () => {},

  destinationModal: {
    visible: false,
    initialValue: "",
    onSelect: () => {},
  },
  openDestinationModal: () => {},
  closeDestinationModal: () => {},

  flightModal: {
    visible: false,
  },
  openFlightModal: () => {},
  closeFlightModal: () => {},

  sectionModal: {
    visible: false,
    itinerarySection: null,
  },
  openSectionModal: () => {},
  closeSectionModal: () => {},

  activeTripViewTab: "details",
  setActiveTripViewTab: () => {},

  refetchTravelPlan: () => {},
  setRefetchTravelPlan: () => {},
};

// Create the typed Context
export const TravelContext =
  createContext<TravelContextType>(initialContextValue);

// Define the props for the Provider (it only takes children)
interface TravelProviderProps {
  children: ReactNode; // A standard type for children in React
}

// Create the Provider component using the FC (Function Component) type
export const TravelProvider: FC<TravelProviderProps> = ({ children }) => {
  const [expenseModal, setExpenseModal] = useState<ExpenseModalState>({
    visible: false,
    itineraryExpense: null,
  });

  const [noteModal, setNoteModal] = useState<NoteModalState>({
    visible: false,
    itineraryNote: null,
  });

  const [checklistModal, setChecklistModal] = useState<ChecklistModalState>({
    visible: false,
    checklistItem: null,
    travelId: "",
  });

  const [checklistGroupModal, setChecklistGroupModal] = useState<ChecklistGroupModalState>({
    visible: false,
    travelId: "",
  });

  const [activityModal, setActivityModal] = useState<ActivityModalState>({
    visible: false,
    itineraryActivity: null,
  });

  const [activityTypeModal, setActivityTypeModal] = useState<ActivityTypeModalState>({
    visible: false,
  });

  const [memberModal, setMemberModal] = useState<MemberModalState>({
    visible: false,
    editingMember: null,
    travelId: "",
  });

  const [descriptionModal, setDescriptionModal] = useState<DescriptionModalState>({
    visible: false,
    value: "",
    onConfirm: () => {},
  });

  const [destinationModal, setDestinationModal] = useState<DestinationModalState>({
    visible: false,
    initialValue: "",
    onSelect: () => {},
  });

  const [flightModal, setFlightModal] = useState<FlightModalState>({
    visible: false,
  });

  const [sectionModal, setSectionModal] = useState<SectionModalState>({
    visible: false,
    itinerarySection: null,
  });

  const openExpenseModal = useCallback(
    (
      itineraryExpense: ItineraryExpense | null = null,
      activityId?: string,
      activities?: ItineraryActivity[],
      travelId?: string
    ) => {
      setExpenseModal({
        visible: true,
        itineraryExpense,
        activityId,
        activities,
        travelId,
      });
    },
    []
  );

  const closeExpenseModal = useCallback(() => {
    setExpenseModal((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const openNoteModal = useCallback(
    (
      itineraryNote: ItineraryNote | null = null,
      activities?: ItineraryActivity[],
      travelId?: string
    ) => {
      setNoteModal({
        visible: true,
        itineraryNote,
        activities,
        travelId,
      });
    },
    []
  );

  const closeNoteModal = useCallback(() => {
    setNoteModal((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const openChecklistModal = useCallback(
    (
      checklistItem: ChecklistItem | null = null,
      activities?: ItineraryActivity[],
      travelId: string = ""
    ) => {
      setChecklistModal({
        visible: true,
        checklistItem,
        activities,
        travelId,
      });
    },
    []
  );

  const closeChecklistModal = useCallback(() => {
    setChecklistModal((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const openChecklistGroupModal = useCallback((travelId: string) => {
    setChecklistGroupModal({
      visible: true,
      travelId,
    });
  }, []);

  const closeChecklistGroupModal = useCallback(() => {
    setChecklistGroupModal((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const openActivityTypeModal = useCallback(
    (itinerarySectionId?: string, travelId?: string) => {
      setActivityTypeModal({
        visible: true,
        itinerarySectionId,
        travelId,
      });
    },
    []
  );

  const closeActivityTypeModal = useCallback(() => {
    setActivityTypeModal((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const openActivityModal = useCallback(
    (
      itineraryActivity: ItineraryActivity | null = null,
      itinerarySectionId?: string,
      travelId?: string,
      initialType?: ActivityType
    ) => {
      if (itineraryActivity?.id || initialType !== undefined) {
        setActivityModal({
          visible: true,
          itineraryActivity,
          itinerarySectionId,
          travelId,
          initialType: initialType ?? itineraryActivity?.type,
        });
      } else {
        setActivityTypeModal({
          visible: true,
          itinerarySectionId,
          travelId,
        });
      }
    },
    []
  );

  const closeActivityModal = useCallback(() => {
    setActivityModal((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const openMemberModal = useCallback(
    (
      editingMember: TripMember | null = null,
      travelId: string = ""
    ) => {
      setMemberModal({
        visible: true,
        editingMember,
        travelId,
      });
    },
    []
  );

  const closeMemberModal = useCallback(() => {
    setMemberModal((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const openDescriptionModal = useCallback(
    (
      value: string,
      onConfirm: (text: string) => void,
      options?: {
        label?: string;
        placeholder?: string;
        confirmLabel?: string;
        maxLength?: number;
      }
    ) => {
      setDescriptionModal({
        visible: true,
        value,
        onConfirm,
        ...options,
      });
    },
    []
  );

  const closeDescriptionModal = useCallback(() => {
    setDescriptionModal((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const openDestinationModal = useCallback(
    (
      initialValue: string = "",
      onSelect?: (place: MapboxPlace, isAddMore?: boolean) => void
    ) => {
      setDestinationModal({
        visible: true,
        initialValue,
        onSelect,
      });
    },
    []
  );

  const closeDestinationModal = useCallback(() => {
    setDestinationModal((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const openFlightModal = useCallback(
    (
      onConfirm: (flightData: {
        departureAirport: any;
        arrivalAirport: any;
        departureDate: Date | null;
      }) => void,
      defaultDate?: Date | string | null
    ) => {
      setFlightModal({
        visible: true,
        onConfirm,
        defaultDate,
      });
    },
    []
  );

  const closeFlightModal = useCallback(() => {
    setFlightModal((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const openSectionModal = useCallback(
    (
      itinerarySection: ItinerarySection | null,
      travelId?: string,
      onSaveSuccess?: (section: ItinerarySection) => void
    ) => {
      setSectionModal({
        visible: true,
        itinerarySection,
        travelId,
        onSaveSuccess,
      });
    },
    []
  );

  const closeSectionModal = useCallback(() => {
    setSectionModal((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const [activeTripViewTab, setActiveTripViewTab] = useState<string>("details");

  const [refetchTravelPlanFn, setRefetchTravelPlanFn] = useState<(() => void) | null>(null);

  const refetchTravelPlan = useCallback(() => {
    refetchTravelPlanFn?.();
  }, [refetchTravelPlanFn]);

  const setRefetchTravelPlan = useCallback((fn: (() => void) | null) => {
    setRefetchTravelPlanFn(() => fn);
  }, []);

  // Use useMemo and apply the context type to the value
  const contextValue = useMemo<TravelContextType>(
    () => ({
      expenseModal,
      openExpenseModal,
      closeExpenseModal,
      noteModal,
      openNoteModal,
      closeNoteModal,
      checklistModal,
      openChecklistModal,
      closeChecklistModal,
      checklistGroupModal,
      openChecklistGroupModal,
      closeChecklistGroupModal,
      activityModal,
      openActivityModal,
      closeActivityModal,
      activityTypeModal,
      openActivityTypeModal,
      closeActivityTypeModal,
      memberModal,
      openMemberModal,
      closeMemberModal,
      descriptionModal,
      openDescriptionModal,
      closeDescriptionModal,
      destinationModal,
      openDestinationModal,
      closeDestinationModal,
      flightModal,
      openFlightModal,
      closeFlightModal,
      sectionModal,
      openSectionModal,
      closeSectionModal,
      activeTripViewTab,
      setActiveTripViewTab,
      refetchTravelPlan,
      setRefetchTravelPlan,
    }),
    [
      expenseModal,
      openExpenseModal,
      closeExpenseModal,
      noteModal,
      openNoteModal,
      closeNoteModal,
      checklistModal,
      openChecklistModal,
      closeChecklistModal,
      checklistGroupModal,
      openChecklistGroupModal,
      closeChecklistGroupModal,
      activityModal,
      openActivityModal,
      closeActivityModal,
      activityTypeModal,
      openActivityTypeModal,
      closeActivityTypeModal,
      memberModal,
      openMemberModal,
      closeMemberModal,
      descriptionModal,
      openDescriptionModal,
      closeDescriptionModal,
      destinationModal,
      openDestinationModal,
      closeDestinationModal,
      flightModal,
      openFlightModal,
      closeFlightModal,
      sectionModal,
      openSectionModal,
      closeSectionModal,
      activeTripViewTab,
      setActiveTripViewTab,
      refetchTravelPlan,
      setRefetchTravelPlan,
    ]
  );



  return (
    <TravelContext.Provider value={contextValue}>
      {children}
    </TravelContext.Provider>
  );
};

export const useTravelContext = (): TravelContextType => {
  const context = useContext(TravelContext);

  if (context === initialContextValue) {
    // Check if the context value is the initial/default placeholder
    throw new Error("useTravel must be used within a TravelProvider");
  }

  return context;
};
