import {
  ItineraryExpense,
  ItineraryActivity,
  ItineraryNote,
  ChecklistItem,
  TripMember,
} from "../../features/Travel/types/TravelDto";

export interface TravelPlanDetail {
  id: string;
  title: string;
  // startOrDepartureDate: Date | string | undefined;
  // endOrReturnDate: Date | string | undefined;
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
}


