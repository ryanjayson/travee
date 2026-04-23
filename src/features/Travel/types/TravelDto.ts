import { ActivityType, TravelStatus } from "../../../types/enums";

export interface TravelPlan {
  travel: Travel;
  itinerarySection?: ItinerarySection[];
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
  sortOrder: string;
  type?: ActivityType;
  secondaryType?: ActivityType[];
  images?: Images[];
  destinationData?: DestinationDto;
  isOffline?: boolean;
}
export interface Images {
  title: string;
  url: string;
}

export interface CreateTravelData {
  title: string;
  description?: string;
  destination?: string;
  destinationData?: DestinationDto;
  startDate?: Date;
  endDate?: Date;
  budget?: string;
  notes?: string;
  status?: TravelStatus;
  isOffline?: boolean;
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
  startDate?: Date;
  endDate?: Date;
  budget?: string;
  notes?: string;
}


