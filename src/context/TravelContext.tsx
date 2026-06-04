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
  MemberModalState,
  DescriptionModalState,
  DestinationModalState,
} from "../types/context/travel";
import { MapboxPlace } from "../features/Travel/components/MapboxDestinationSelector";
import {
  ItineraryExpense,
  ItineraryActivity,
  ItineraryNote,
  ChecklistItem,
  TripMember,
} from "../features/Travel/types/TravelDto";

const initialContextValue: TravelContextType = {
  selectedTravelPlan: null,
  selectTravelPlan: (travelData: TravelPlanDetail) => {},
  clearTravelPlan: () => {}, // placeholder function
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
  // Ensure useState is typed correctly
  const [selectedTravelPlan, setSelectedTravelPlan] =
    useState<TravelPlanDetail | null>(null);

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

  // Use useCallback and apply types to the function arguments
  const selectTravelPlan = useCallback((travelData: TravelPlanDetail) => {
    setSelectedTravelPlan(travelData);
  }, []);

  const clearTravelPlan = useCallback(() => {
    setSelectedTravelPlan(null);
  }, []);

  const openExpenseModal = useCallback(
    (
      itineraryExpense: ItineraryExpense | null = null,
      activityId?: string,
      activities?: ItineraryActivity[]
    ) => {
      setExpenseModal({
        visible: true,
        itineraryExpense,
        activityId,
        activities,
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
      activities?: ItineraryActivity[]
    ) => {
      setNoteModal({
        visible: true,
        itineraryNote,
        activities,
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

  const openActivityModal = useCallback(
    (
      itineraryActivity: ItineraryActivity | null = null,
      itinerarySectionId?: string
    ) => {
      setActivityModal({
        visible: true,
        itineraryActivity,
        itinerarySectionId,
      });
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
      onSelect?: (place: MapboxPlace) => void
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

  // Use useMemo and apply the context type to the value
  const contextValue = useMemo<TravelContextType>(
    () => ({
      selectedTravelPlan,
      selectTravelPlan,
      clearTravelPlan,
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
      memberModal,
      openMemberModal,
      closeMemberModal,
      descriptionModal,
      openDescriptionModal,
      closeDescriptionModal,
      destinationModal,
      openDestinationModal,
      closeDestinationModal,
    }),
    [
      selectedTravelPlan,
      selectTravelPlan,
      clearTravelPlan,
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
      memberModal,
      openMemberModal,
      closeMemberModal,
      descriptionModal,
      openDescriptionModal,
      closeDescriptionModal,
      destinationModal,
      openDestinationModal,
      closeDestinationModal,
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
