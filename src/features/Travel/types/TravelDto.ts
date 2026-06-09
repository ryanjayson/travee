import { ActivityType, TravelStatus, ExpenseCategory, TripType } from "../../../types/enums";

export interface TravelPlan {
  travel: Travel;
  itinerarySection?: ItinerarySection[];
  itineraryExpense?: ItineraryExpense[];
  tripMembers?: TripMember[];
  memberSplitBills?: MemberSplitBill[];
  tripSetting?: TripSetting | null;
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
  tripSetting?: TripSetting | null;
}

export interface TripSetting {
  id?: string;
  travelId: string;
  currency: string;
  timezone: string;
  itineraryView: "plain" | "compact" | "detailed";
  allowItemReordering: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
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

export interface CafeRestaurantDetailsDto {
  id?: string;
  activityId?: string;
  restaurantName: string;
  address?: string | null;
  cuisine?: string | null;
  priceRange?: string | null;
  reservationLink?: string | null;
  websiteAddress?: string | null;
  contactNumber?: string | null;
}

export interface NatureDetailsDto {
  id?: string;
  activityId?: string;
  spotName: string;
  address?: string | null;
  subType?: string | null; // beach, mountain, lake, river, waterfall, forest, jungle, cave, desert, canyon, volcano
  entryFee?: string | null;
}

export interface ShoppingDetailsDto {
  id?: string;
  activityId?: string;
  venueName: string;
  address?: string | null;
  subType?: string | null; // spa, market, store, atm, bank, pharmacy, gas_station
  websiteAddress?: string | null;
}

export interface EntertainmentDetailsDto {
  id?: string;
  activityId?: string;
  venueName: string;
  address?: string | null;
  subType?: string | null; // park, museum, cinema, stadium, zoo, concert, gym
  websiteAddress?: string | null;
  ticketPrice?: string | null;
  bookingReference?: string | null;
}

export interface TransportationDetailsDto {
  id?: string;
  activityId?: string;
  mode?: string | null; // ride, bike, boat, bus, taxi, train, ferry
  operatorProvider?: string | null;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  bookingReference?: string | null;
  price?: string | null;
}

export interface WalkDetailsDto {
  id?: string;
  activityId?: string;
  routeName?: string | null;
  estimatedDistanceKm?: string | null;
  estimatedDuration?: string | null;
}

export interface SightseeingDetailsDto {
  id?: string;
  activityId?: string;
  attractionName: string;
  address?: string | null;
  entryFee?: string | null;
  websiteAddress?: string | null;
}

export interface PreparationDetailsDto {
  id?: string;
  activityId?: string;
  taskLabel?: string | null;
  deadlineDateTime?: Date | string | null;
  priority?: string | null; // High, Medium, Low
  notes?: string | null;
}

export interface RestDetailsDto {
  id?: string;
  activityId?: string;
  restLocationName?: string | null;
  restLocationType?: string | null; // home, hotel, vehicle, other
}

export interface HikeOrCampDetailsDto {
  id?: string;
  activityId?: string;
  trailOrSiteName: string;
  address?: string | null;
  subType?: string | null; // hike, camp, both
  estimatedDistanceKm?: string | null;
  campsiteName?: string | null;
  permitRequired?: boolean | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  websiteAddress?: string | null;
  reservationLink?: string | null;
  checkinDateTime?: Date | string | null;
  checkoutDateTime?: Date | string | null;
}

export interface MotorcycleRideDetailsDto {
  id?: string;
  activityId?: string;
  routeName?: string | null;
  startingPoint?: string | null;
  endingPoint?: string | null;
  estimatedDistanceKm?: string | null;
  roadType?: string | null;
  bikeModel?: string | null;
  fuelStops?: string | null;
}

export interface MeetupDetailsDto {
  id?: string;
  activityId?: string;
  venueName: string;
  address?: string | null;
  hostOrOrganizer?: string | null;
  numberOfPeople?: string | null;
  meetupType?: string | null; // casual, business, group ride, etc.
  rsvpLink?: string | null;
}

export interface RideRentalDetailsDto {
  id?: string;
  activityId?: string;
  providerName: string;
  address?: string | null;
  vehicleType?: string | null; // RV, yacht, motorbike, car, bike
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  rentalStartDateTime?: Date | string | null;
  rentalEndDateTime?: Date | string | null;
  bookingReference?: string | null;
  price?: string | null;
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
  cafeRestaurantDetails?: CafeRestaurantDetailsDto | null;
  natureDetails?: NatureDetailsDto | null;
  shoppingDetails?: ShoppingDetailsDto | null;
  entertainmentDetails?: EntertainmentDetailsDto | null;
  transportationDetails?: TransportationDetailsDto | null;
  walkDetails?: WalkDetailsDto | null;
  sightseeingDetails?: SightseeingDetailsDto | null;
  preparationDetails?: PreparationDetailsDto | null;
  restDetails?: RestDetailsDto | null;
  hikeOrCampDetails?: HikeOrCampDetailsDto | null;
  motorcycleRideDetails?: MotorcycleRideDetailsDto | null;
  meetupDetails?: MeetupDetailsDto | null;
  rideRentalDetails?: RideRentalDetailsDto | null;
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
