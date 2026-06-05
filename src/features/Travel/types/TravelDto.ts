import { ActivityType, TravelStatus, ExpenseCategory, TripType } from "../../../types/enums";

export interface TravelPlan {
  travel: Travel;
  itinerarySection?: ItinerarySection[];
  itineraryExpense?: ItineraryExpense[];
  tripMembers?: TripMember[];
  memberSplitBills?: MemberSplitBill[];
}

export interface ItineraryExpense {
  id?: string;
  travelId?: string;
  activityId?: string;
  memberId?: string;
  title: string;
  amount: number;
  dateTime: Date;
  currency?: string;
  category?: string;
  expenseCategory?: ExpenseCategory;
  userId?: string;
  notes?: string;
  isOffline?: boolean;
  isIncludeInBill?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ItineraryNote {
  id?: string;
  travelId?: string;
  activityId?: string;
  title: string;
  content?: string;
  images?: string[];
  userId?: string;
  isOffline?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ChecklistGroup {
  id?: string;
  travelId?: string;
  title: string;
  description?: string;
  sortOrder: string;
  userId?: string;
  isOffline?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ChecklistItem {
  id?: string;
  travelId?: string;
  activityId?: string;
  checklistGroupId?: string;
  title: string;
  description?: string;
  sortOrder: string;
  isDone: boolean;
  userId?: string;
  checkedBy?: string;
  checkedAt?: Date | string;
  uncheckBy?: string;
  uncheckAt?: Date | string;
  isOffline?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Travel {
  id?: string;
  title: string;
  description?: string;
  destination?: string;
  destinationData?: DestinationDto;
  startOrDepartureDate?: Date;
  endOrReturnDate?: Date;
  status?: TravelStatus;
  budget?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  itinerarySection?: ItinerarySection[];
  isOffline?: boolean;
  isArchived?: boolean;
  tripMembers?: TripMember[];
  memberSplitBills?: MemberSplitBill[];
  type?: TripType;
}

export interface ItinerarySection {
  id?: string;
  title: string;
  description?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  itineraryActivity?: ItineraryActivity[];
  isDefaultSection?: boolean;
  isCollapsed?: boolean;
  travelId?: string;
  sortOrder: string;
  isOffline?: boolean;
}

export interface FlightDetailsDto {
  id?: string;
  activityId?: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: Date | string;
  arrivalDate?: Date | string | null;
  flightNumber?: string | null;
  airline?: string | null;
  gate?: string | null;
  terminal?: string | null;
  seatNumber?: string | null;
  bookingReference?: string | null;
  price?: number | null;
}

export interface AccomodationDetailsDto {
  id?: string;
  activityId?: string;
  accomodationName: string;
  address?: string | null;
  checkinDateTime: Date | string;
  checkoutDateTime?: Date | string | null;
  websiteAddress?: string | null;
  bookingReference?: string | null;
  bookingStatus?: string | null;
  contactNumber?: string | null;
  emailAddress?: string | null;
  contactName?: string | null;
}

export interface ItineraryActivity {
  //TODO might use ItineraryEvent for both section and event
  //TODO change id to type to UUID
  id?: string;
  sectionId?: string;
  title: string;
  description?: string;
  destination?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  budget?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  commentsCount?: number;
  notesCount?: number;
  expensesCount?: number;
  checklistCount?: number;
  sortOrder: string;
  type?: ActivityType;
  secondaryType?: ActivityType[];
  images?: Images[];
  destinationData?: DestinationDto;
  isOffline?: boolean;
  travelId?: string;
  isDone?: boolean;
  attachments?: Attachment[];
  flightDetails?: FlightDetailsDto | null;
  accomodationDetails?: AccomodationDetailsDto | null;
}
export interface Attachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}
export interface Images {
  title: string;
  url: string;
}

export interface TripMember {
  id?: string;
  travelId: string;
  name: string;
  description?: string;
  email?: string;
  isOffline?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface MemberSplitBill {
  id?: string;
  travelId: string;
  memberId: string;
  owesAmount: number;
  percentageShare: number;
  isPaid: boolean;
  paymentType?: string;
  paidDate?: string | Date | number;
  notes?: string;
  isOffline?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateTravelData {
  title: string;
  description?: string;
  destination?: string;
  destinationData?: DestinationDto;
  startOrDepartureDate?: Date;
  endOrReturnDate?: Date;
  budget?: string;
  notes?: string;
  status?: TravelStatus;
  isOffline?: boolean;
  createSectionsBasedOnDates?: boolean;
  type?: TripType;
}

export interface DestinationDto {
  id: string;
  coordinates: CoordinatesDto;
}

export interface CoordinatesDto {
  longitude: number;
  latitude: number;
}

export interface UpdateTravelData {
  title?: string;
  description?: string;
  destination?: string;
  destinationData?: DestinationDto;
  startOrDepartureDate?: Date;
  endOrReturnDate?: Date;
  budget?: string;
  notes?: string;
  status?: TravelStatus;
  type?: TripType;
}
