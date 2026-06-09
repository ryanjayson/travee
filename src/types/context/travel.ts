import {
  ItineraryExpense,
  ItineraryActivity,
  ItineraryNote,
  ChecklistItem,
  TripMember,
  TripSetting,
} from "../../features/Travel/types/TravelDto";
import { MapboxPlace } from "../../features/Travel/components/MapboxDestinationSelector";

export interface TravelPlanDetail {
  id: string;
  title: string;
  description?: string;
  destination?: string;
  startOrDepartureDate?: Date | string;
  endOrReturnDate?: Date | string;
  status?: any;
  budget?: string;
  notes?: string;
  isOffline?: boolean;
  isArchived?: boolean;
  type?: number;
  tripSetting?: TripSetting | null;
}

export interface ExpenseModalState {
  visible: boolean;
  itineraryExpense: ItineraryExpense | null;
  activityId?: string;
  activities?: ItineraryActivity[];
}

export interface NoteModalState {
  visible: boolean;
  itineraryNote: ItineraryNote | null;
  activities?: ItineraryActivity[];
}

export interface ChecklistModalState {
  visible: boolean;
  checklistItem: ChecklistItem | null;
  activities?: ItineraryActivity[];
  travelId: string;
}

export interface ChecklistGroupModalState {
  visible: boolean;
  travelId: string;
}

export interface ActivityModalState {
  visible: boolean;
  itineraryActivity: ItineraryActivity | null;
  itinerarySectionId?: string;
}

export interface MemberModalState {
  visible: boolean;
  editingMember: TripMember | null;
  travelId: string;
}

export interface DescriptionModalState {
  visible: boolean;
  value: string;
  onConfirm: (text: string) => void;
  label?: string;
  placeholder?: string;
  confirmLabel?: string;
  maxLength?: number;
}

export interface DestinationModalState {
  visible: boolean;
  initialValue?: string;
  onSelect?: (place: MapboxPlace) => void;
}

export interface FlightModalState {
  visible: boolean;
  onConfirm?: (flightData: {
    departureAirport: any;
    arrivalAirport: any;
    departureDate: Date;
  }) => void;
}

export interface TravelContextType {
  selectedTravelPlan: TravelPlanDetail | null;
  selectTravelPlan: (travelData: TravelPlanDetail) => void;
  clearTravelPlan: () => void;
  expenseModal: ExpenseModalState;
  openExpenseModal: (
    itineraryExpense?: ItineraryExpense | null,
    activityId?: string,
    activities?: ItineraryActivity[]
  ) => void;
  closeExpenseModal: () => void;

  noteModal: NoteModalState;
  openNoteModal: (
    itineraryNote?: ItineraryNote | null,
    activities?: ItineraryActivity[]
  ) => void;
  closeNoteModal: () => void;

  checklistModal: ChecklistModalState;
  openChecklistModal: (
    checklistItem?: ChecklistItem | null,
    activities?: ItineraryActivity[],
    travelId?: string
  ) => void;
  closeChecklistModal: () => void;

  checklistGroupModal: ChecklistGroupModalState;
  openChecklistGroupModal: (travelId: string) => void;
  closeChecklistGroupModal: () => void;

  activityModal: ActivityModalState;
  openActivityModal: (
    itineraryActivity?: ItineraryActivity | null,
    itinerarySectionId?: string
  ) => void;
  closeActivityModal: () => void;

  memberModal: MemberModalState;
  openMemberModal: (
    editingMember?: TripMember | null,
    travelId?: string
  ) => void;
  closeMemberModal: () => void;

  descriptionModal: DescriptionModalState;
  openDescriptionModal: (
    value: string,
    onConfirm: (text: string) => void,
    options?: {
      label?: string;
      placeholder?: string;
      confirmLabel?: string;
      maxLength?: number;
    }
  ) => void;
  closeDescriptionModal: () => void;

  destinationModal: DestinationModalState;
  openDestinationModal: (
    initialValue?: string,
    onSelect?: (place: MapboxPlace) => void
  ) => void;
  closeDestinationModal: () => void;

  flightModal: FlightModalState;
  openFlightModal: (
    onConfirm: (flightData: {
      departureAirport: any;
      arrivalAirport: any;
      departureDate: Date;
    }) => void
  ) => void;
  closeFlightModal: () => void;
}


