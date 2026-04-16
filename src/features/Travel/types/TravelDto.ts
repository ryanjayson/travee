import { NumberLiteralType } from "typescript";
import { ActivityType, TravelStatus } from "../../../types/enums";

export interface TravelPlan {
  travel: Travel;
  itinerarySection?: ItinerarySection[];
}

export interface Travel {
  id?: number;
  title: string;
  description?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  status?: TravelStatus;
  budget?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  itinerarySection?: ItinerarySection[];
}

export interface ItinerarySection {
  id?: number;
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
  travelId?: number;
  sortOrder: string;
}

export interface ItineraryActivity {
  //TODO might use ItineraryEvent for both section and event
  //TODO change id to type to UUID
  id?: number;
  sectionId?: number;
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
  type?: ActivityType | number;
  secondaryType?: ActivityType[];
  images?: Images[];
}
export interface Images {
  title: string;
  url: string;
}

export interface CreateTravelData {
  title: string;
  description?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: string;
  notes?: string;
  status?: TravelStatus;
}

export interface UpdateTravelData {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  notes?: string;
}

export interface UpdateTravelData {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  notes?: string;
}
